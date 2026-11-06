#!/usr/bin/env python3
"""What did we know, and when? Information receipts for NBA V5 forecasts.

Two independent ESPN injury feeds (the league-wide list and each game's own injury list) are fetched, timestamped,
cross-checked and recorded. Every distinct report (game, player, status, published time) is appended ONCE to an
append-only ledger with the time WE first saw it, so a forecast can later be shown to use only what had been
published. Checks: stale reports, feeds that disagree, a player in one feed but not the other, duplicate or unknown
player identities, rosters with no history. Source reliability (how often a reported status matched who actually
played) is accumulated after games by nba_v5_postmortem.py.

Usage: python -m nba.nba_v5_info --v3 latest.json --history g.jsonl[.gz] --ledger docs/nba_v5_info/ledger.jsonl --out receipt.json
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import time
import urllib.request
from pathlib import Path

ESPN = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/"
UA = {"User-Agent": "PropEdgeNBAV5Info/1.0", "Accept": "application/json"}
STALE_HOURS = 36
RANK = {"OUT": 3, "DOUBTFUL": 2, "QUESTIONABLE": 1, "PROBABLE": 0, "AVAILABLE": 0, "UNKNOWN": 1}


def get(url, tries=3):
    err = None
    for a in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                return json.load(r)
        except Exception as e:
            err = e
            time.sleep(1.5 * (a + 1))
    raise RuntimeError(f"fetch failed {url}: {str(err)[:80]}")


def norm_status(s):
    t = (s or "").strip().upper().replace("-", " ")
    if t in ("OUT", "INJURED RESERVE", "SUSPENSION", "NOT WITH TEAM"):
        return "OUT"
    if t == "DOUBTFUL":
        return "DOUBTFUL"
    if t in ("QUESTIONABLE", "DAY TO DAY", "GAME TIME DECISION"):
        return "QUESTIONABLE"
    if t in ("PROBABLE", "AVAILABLE", "ACTIVE"):
        return "PROBABLE"
    return "UNKNOWN"


def league_feed():
    d = get(ESPN + "injuries")
    out = {}
    for t in d.get("injuries", []):
        for i in t.get("injuries", []):
            a = i.get("athlete") or {}
            pid = str(i.get("id") or a.get("id") or "")
            link = ""
            for l in a.get("links", []) or []:
                if "/id/" in l.get("href", ""):
                    link = l["href"].split("/id/")[1].split("/")[0]
                    break
            pid = link or pid
            out[(str(t.get("id")), pid)] = {"status": norm_status(i.get("status")), "raw": i.get("status"), "published": i.get("date"),
                                             "name": a.get("displayName")}
    return out, d.get("timestamp")


def game_feed(event_id):
    s = get(ESPN + "summary?event=" + str(event_id))
    out = {}
    for t in s.get("injuries", []) or []:
        tid = str((t.get("team") or {}).get("id"))
        for i in t.get("injuries", []) or []:
            a = i.get("athlete") or {}
            out[(tid, str(a.get("id")))] = {"status": norm_status(i.get("status")), "raw": i.get("status"), "published": i.get("date"),
                                             "name": a.get("displayName")}
    return out


def parse_time(s):
    try:
        return dt.datetime.fromisoformat(str(s).replace("Z", "+00:00")).astimezone(dt.timezone.utc)
    except Exception:
        return None


def known_players(history_paths):
    import gzip
    ids = set()
    for p in history_paths:
        text = gzip.open(p, "rt").read() if str(p).endswith(".gz") else Path(p).read_text()
        for line in text.splitlines():
            if line.strip():
                for pl in json.loads(line)["players"]:
                    ids.add(pl["id"])
    return ids


def build_receipts(v3, known, ledger_path: Path, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    league, league_ts = league_feed()
    seen_keys = set()
    if ledger_path.exists():
        for line in ledger_path.read_text().splitlines():
            try:
                seen_keys.add(json.loads(line)["key"])
            except Exception:
                pass
    new_events = []
    receipts = {}
    for g in v3["games"]:
        tip = parse_time(g["tipoff_utc"])
        if tip is None or tip <= now:
            continue
        try:
            gf = game_feed(g["game_id"])
        except Exception as e:
            gf, err = {}, str(e)
        else:
            err = None
        teams = {g["home_id"], g["away_id"]}
        lg = {k: v for k, v in league.items() if k[0] in teams}
        keys = set(lg) | set(gf)
        checks = {"stale": [], "conflict": [], "only_in_one_feed": [], "duplicate_identity": [], "unknown_player": [], "feed_error": err}
        entries = []
        for k in sorted(keys):
            a, b = lg.get(k), gf.get(k)
            if a and b and a["status"] != b["status"]:
                checks["conflict"].append({"player": (a or b)["name"], "league_feed": a["status"], "game_feed": b["status"]})
            if not (a and b):
                checks["only_in_one_feed"].append({"player": (a or b)["name"], "in": "league_feed" if a else "game_feed"})
            for src, rec in (("league_feed", a), ("game_feed", b)):
                if not rec:
                    continue
                pub = parse_time(rec["published"])
                age = (now - pub).total_seconds() / 3600 if pub else None
                if age is not None and age > STALE_HOURS * 1 and (tip - now).total_seconds() < 24 * 3600:
                    checks["stale"].append({"player": rec["name"], "status": rec["status"], "age_hours": round(age, 1)})
                key = hashlib.sha256(f"{g['game_id']}|{k[1]}|{src}|{rec['status']}|{rec['published']}".encode()).hexdigest()[:24]
                entries.append({"player_id": k[1], "team_id": k[0], "player": rec["name"], "source": src, "status": rec["status"],
                                "published_at": rec["published"], "first_seen_by_us": None, "key": key})
                if key not in seen_keys:
                    seen_keys.add(key)
                    new_events.append({"key": key, "game_id": g["game_id"], "player_id": k[1], "source": src, "status": rec["status"],
                                       "published_at": rec["published"], "first_seen_by_us": now.isoformat()})
        names = {}
        for r in g["rows"]:
            names.setdefault(r["player"], set()).add(r["player_id"])
            if r["player_id"] not in known and r["reported_status"] != "OUT":
                checks["unknown_player"].append({"player": r["player"], "player_id": r["player_id"]})
        checks["duplicate_identity"] = [{"player": n, "ids": sorted(ids)} for n, ids in names.items() if len(ids) > 1]
        checks["unknown_player"] = list({x["player_id"]: x for x in checks["unknown_player"]}.values())
        receipts[g["game_id"]] = {"retrieved_at": now.isoformat(), "league_feed_built_at": league_ts,
                                  "sources": ["espn_league_injuries", "espn_game_summary_injuries"], "reports": entries,
                                  "checks": {k: v for k, v in checks.items()},
                                  "clean": not (checks["conflict"] or checks["duplicate_identity"] or checks["feed_error"])}
    return receipts, new_events


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--v3", required=True)
    ap.add_argument("--history", action="append", required=True)
    ap.add_argument("--ledger", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    v3 = json.loads(Path(a.v3).read_text())
    receipts, events = build_receipts(v3, known_players(a.history), Path(a.ledger))
    Path(a.out).write_text(json.dumps(receipts, separators=(",", ":")))
    if events:
        Path(a.ledger).parent.mkdir(parents=True, exist_ok=True)
        with open(a.ledger, "a") as fh:
            for e in events:
                fh.write(json.dumps(e, separators=(",", ":")) + "\n")
    print("games", len(receipts), "new reports logged", len(events), "unclean", sum(1 for r in receipts.values() if not r["clean"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
