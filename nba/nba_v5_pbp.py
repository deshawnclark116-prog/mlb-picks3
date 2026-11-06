#!/usr/bin/env python3
"""NBA V5 play-by-play dataset: every event of every completed game, in compact form.

Per game one JSON line:
  {game_id, date, home, away, starters:{team:[ids]}, events:[[period, clock_s_left, kind, team, a, b, pts, x, y], ...]}
kinds (a, b = player ids; team = acting team):
  S2 / S3  shot attempt          a=shooter  b=assister if made else ''   pts=points scored (0 if missed)  x,y court spot, style
  BLK      shot blocked          a=blocker  b=shooter                    (also emitted as the S2/S3 miss)
  FT       free throw            a=shooter                               pts = 1 if made
  OR / DR  rebound               a=player ('' for a team rebound)
  TO       turnover              a=player  b=stealer or ''
  PF       foul                  a=fouler   b=subtype (P personal, S shooting, O offensive, L loose ball, T take)
  SUB      substitution          a=player entering  b=player leaving
  TMO      timeout
Used only to learn how teams actually rotate, shoot, rebound, foul and turn the ball over, in time order
(see nba_v5_sim.py). Resumable. Stdlib only.

Usage: python -m nba.nba_v5_pbp --games games.jsonl[.gz] --out pbp.jsonl [--workers 8]
"""
from __future__ import annotations
import argparse
import concurrent.futures
import gzip
import json
import re
import urllib.request
import time
from pathlib import Path

ESPN = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event="
UA = {"User-Agent": "PropEdgeNBAV5Research/1.0", "Accept": "application/json"}
BAD = -200000000          # ESPN's "no coordinate" marker


def get(url: str, tries: int = 4):
    err = None
    for a in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception as e:
            err = e
            time.sleep(1.2 * (a + 1))
    raise RuntimeError(f"fetch failed {url}: {str(err)[:100]}")


def clock_left(c) -> float:
    s = str((c or {}).get("displayValue") or "0:00")
    try:
        if ":" in s:
            m, sec = s.split(":")
            return int(m) * 60 + float(sec)
        return float(s)
    except ValueError:
        return 0.0


def ids(p):
    return [str(((x or {}).get("athlete") or {}).get("id") or "") for x in (p.get("participants") or [])]


def shot_style(type_text: str) -> str:
    """One word for how the shot was taken (from ESPN's play type)."""
    t = (type_text or "").lower()
    for key, name in (("dunk", "dunk"), ("tip", "tip"), ("putback", "putback"), ("alley", "alley"), ("hook", "hook"),
                      ("layup", "layup"), ("finger roll", "layup"), ("step back", "stepback"), ("pullup", "pullup"),
                      ("fade", "fadeaway"), ("turnaround", "turnaround"), ("floating", "floater"), ("driving", "driving"),
                      ("running", "running"), ("jump", "jump")):
        if key in t:
            return name
    return "other"


def parse_plays(plays):
    out = []
    for p in plays or []:
        t = ((p.get("type") or {}).get("text") or "")
        tl = t.lower()
        text = p.get("text") or ""
        per = int((p.get("period") or {}).get("number") or 0)
        cl = clock_left(p.get("clock"))
        team = str((p.get("team") or {}).get("id") or "")
        pa = ids(p)
        pts = int(p.get("scoreValue") or 0)
        c = p.get("coordinate") or {}
        x, y = c.get("x"), c.get("y")
        if x is None or y is None or abs(x) > 1000 or abs(y) > 1000 or x == BAD:
            x = y = None
        base = [per, cl]
        style = shot_style(t)
        if tl == "substitution" and len(pa) >= 2:
            out.append(base + ["SUB", team, pa[0], pa[1], 0, None, None, None])
        elif tl.endswith("timeout"):
            out.append(base + ["TMO", team, "", "", 0, None, None, None])
        elif tl.startswith("free throw"):
            out.append(base + ["FT", team, pa[0] if pa else "", "", 1 if pts > 0 else 0, None, None, None])
        elif p.get("shootingPlay") and int(p.get("pointsAttempted") or 0) in (2, 3):
            n = int(p.get("pointsAttempted"))
            if " blocks " in text and len(pa) >= 2:
                out.append(base + ["BLK", team, pa[0], pa[1], 0, x, y, style])
                out.append(base + ["S%d" % n, team, pa[1], "", 0, x, y, style])
            else:
                made = pts > 0
                out.append(base + ["S%d" % n, team, pa[0] if pa else "", pa[1] if made and len(pa) > 1 else "", pts, x, y, style])
        elif "rebound" in tl:
            out.append(base + ["OR" if "offensive" in tl else "DR", team, pa[0] if pa else "", "", 0, None, None, None])
        elif "turnover" in tl or tl in ("traveling", "palming turnover") or "turnover" in text.lower():
            if "foul" in tl and "turnover" in tl:
                continue                                      # the foul itself is logged as its own event
            out.append(base + ["TO", team, pa[0] if pa else "", pa[1] if len(pa) > 1 else "", 0, None, None, None])
        elif tl.endswith("foul") or "foul" in tl:
            sub = "S" if "shooting" in tl else "O" if "offensive" in tl else "L" if "loose" in tl else "T" if "take" in tl else "P"
            if "turnover" in tl:
                continue
            out.append(base + ["PF", team, pa[0] if pa else "", sub, 0, None, None, None])
    return out


def parse_game(game_stub: dict, summary: dict):
    starters = {}
    for t in (summary.get("boxscore") or {}).get("players") or []:
        tid = str((t.get("team") or {}).get("id") or "")
        for grp in t.get("statistics") or []:
            for a in grp.get("athletes") or []:
                if a.get("starter"):
                    starters.setdefault(tid, []).append(str((a.get("athlete") or {}).get("id")))
            break
    plays = parse_plays(summary.get("plays"))
    if len(plays) < 150:
        return None
    return {"game_id": game_stub["game_id"], "date": game_stub["date"], "home": game_stub["home"]["id"],
            "away": game_stub["away"]["id"], "starters": starters, "events": plays}


def read_games(path):
    text = gzip.open(path, "rt").read() if str(path).endswith(".gz") else Path(path).read_text()
    for line in text.splitlines():
        if line.strip():
            yield json.loads(line)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", action="append", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--workers", type=int, default=8)
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
    todo = [g for p in a.games for g in read_games(p) if g["game_id"] not in have]
    print("to fetch", len(todo), "stored", len(have), flush=True)

    def work(g):
        try:
            return parse_game(g, get(ESPN + g["game_id"]))
        except Exception as e:
            print("skip", g["game_id"], str(e)[:80], flush=True)
            return None

    n = 0
    with out.open("a") as fh, concurrent.futures.ThreadPoolExecutor(max_workers=a.workers) as pool:
        for rec in pool.map(work, todo):
            if rec:
                fh.write(json.dumps(rec, separators=(",", ":")) + "\n")
                fh.flush()
            n += 1
            if n % 100 == 0:
                print("fetched", n, flush=True)
    print("done", n, flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
