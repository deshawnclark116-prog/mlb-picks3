#!/usr/bin/env python3
"""NBA V4 research dataset: compact player-game lines from completed ESPN games.

One JSON line per completed game: teams, tip time, score, officials, and every
player who recorded stats (minutes, starter flag, shot attempts/makes, rebounds,
assists, turnovers, steals, blocks, fouls). Built only from finished games, so
a walk-forward test that reads games in time order never sees the future.

Usage: python -m nba.nba_v4_dataset --start 2025-10-21 --end 2026-04-13 --out FILE
Resumable: games already in FILE are skipped. Stdlib only.
"""
from __future__ import annotations
import argparse
import concurrent.futures
import datetime as dt
import json
import time
import urllib.request
from pathlib import Path

ESPN = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/"
UA = {"User-Agent": "PropEdgeNBAV4Research/1.0", "Accept": "application/json"}
FRANCHISES = frozenset(str(i) for i in range(1, 31))
NON_STANDARD = frozenset({"401809839"})          # NBA Cup final: exhibition game, not part of the season


def get(url: str, tries: int = 4):
    err = None
    for a in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                return json.load(r)
        except Exception as e:
            err = e
            time.sleep(1.2 * (a + 1))
    raise RuntimeError(f"fetch failed {url}: {str(err)[:100]}")


def minutes(v) -> float:
    s = str(v or "0")
    if ":" in s:
        m, sec = s.split(":")[:2]
        return int(m) + int(sec) / 60.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def made_att(v) -> tuple[int, int]:
    try:
        a, b = str(v).split("-")
        return int(a), int(b)
    except Exception:
        return 0, 0


def num(v) -> int:
    try:
        return int(float(v))
    except Exception:
        return 0


def parse_game(event: dict, summary: dict) -> dict | None:
    comp = (event.get("competitions") or [None])[0] or {}
    status = (event.get("status") or {}).get("type") or {}
    if status.get("name") != "STATUS_FINAL":
        return None
    sides = {c.get("homeAway"): c for c in comp.get("competitors", [])}
    if set(sides) != {"home", "away"}:
        return None
    teams = {}
    for side in ("home", "away"):
        c = sides[side]
        tid = str((c.get("team") or {}).get("id") or "")
        if tid not in FRANCHISES:
            return None
        teams[side] = {"id": tid, "abbr": (c.get("team") or {}).get("abbreviation"), "score": num(c.get("score"))}
    players = []
    box = (summary.get("boxscore") or {}).get("players") or []
    if len(box) != 2:
        return None
    for t in box:
        tid = str((t.get("team") or {}).get("id") or "")
        side = "home" if tid == teams["home"]["id"] else "away"
        for grp in t.get("statistics") or []:
            labels = [str(x).upper() for x in (grp.get("labels") or grp.get("names") or [])]
            if "MIN" not in labels or "PTS" not in labels:
                continue
            for a in grp.get("athletes") or []:
                vals = a.get("stats")
                if not vals or len(vals) != len(labels):
                    continue
                st = dict(zip(labels, vals))
                mn = minutes(st.get("MIN"))
                if mn <= 0:
                    continue
                fg = made_att(st.get("FG"))
                tp = made_att(st.get("3PT"))
                ft = made_att(st.get("FT"))
                ath = a.get("athlete") or {}
                players.append({
                    "id": str(ath.get("id")), "name": ath.get("displayName"), "team": tid, "side": side,
                    "start": bool(a.get("starter")), "min": round(mn, 2),
                    "pts": num(st.get("PTS")), "reb": num(st.get("REB")), "ast": num(st.get("AST")),
                    "oreb": num(st.get("OREB")), "dreb": num(st.get("DREB")),
                    "fgm": fg[0], "fga": fg[1], "tpm": tp[0], "tpa": tp[1], "ftm": ft[0], "fta": ft[1],
                    "tov": num(st.get("TO")), "stl": num(st.get("STL")), "blk": num(st.get("BLK")),
                    "pf": num(st.get("PF")),
                })
        break_ok = True
    if not players:
        return None
    officials = [str((o.get("displayName") or o.get("fullName") or "")) for o in
                 ((summary.get("gameInfo") or {}).get("officials") or [])]
    ven = ((summary.get("gameInfo") or {}).get("venue") or {})
    return {"game_id": str(event["id"]), "date": event["date"], "season_type": (event.get("season") or {}).get("type"),
            "home": teams["home"], "away": teams["away"], "officials": [o for o in officials if o],
            "venue": ven.get("fullName"), "players": players}


def day_events(d: dt.date) -> list[dict]:
    blob = get(ESPN + "scoreboard?dates=%s&limit=100" % d.strftime("%Y%m%d"))
    return [e for e in blob.get("events", []) if str(e.get("id")) not in NON_STANDARD]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", required=True)
    ap.add_argument("--end", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--regular-season-only", action="store_true", default=True)
    a = ap.parse_args()
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    have = set()
    if out.exists():
        for line in out.read_text().splitlines():
            try:
                have.add(json.loads(line)["game_id"])
            except Exception:
                pass
    d, end = dt.date.fromisoformat(a.start), dt.date.fromisoformat(a.end)
    days = []
    while d <= end:
        days.append(d)
        d += dt.timedelta(days=1)
    todo = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=a.workers) as pool:
        for evs in pool.map(lambda x: _safe(day_events, x), days):
            for e in evs or []:
                if str(e["id"]) in have:
                    continue
                if a.regular_season_only and str((e.get("season") or {}).get("type")) != "2":
                    continue
                if (e.get("status") or {}).get("type", {}).get("name") != "STATUS_FINAL":
                    continue
                todo.append(e)
    print("games to fetch:", len(todo), "already stored:", len(have), flush=True)
    done = 0
    with out.open("a") as fh, concurrent.futures.ThreadPoolExecutor(max_workers=a.workers) as pool:
        for rec in pool.map(lambda e: _safe(lambda x: parse_game(x, get(ESPN + "summary?event=" + str(x["id"]))), e), todo):
            if rec:
                fh.write(json.dumps(rec, separators=(",", ":")) + "\n")
                fh.flush()
            done += 1
            if done % 100 == 0:
                print("fetched", done, "of", len(todo), flush=True)
    print("done", done, flush=True)
    return 0


def _safe(fn, x):
    try:
        return fn(x)
    except Exception as e:
        print("skip:", str(e)[:100], flush=True)
        return None


if __name__ == "__main__":
    raise SystemExit(main())
