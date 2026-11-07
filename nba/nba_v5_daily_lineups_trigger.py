"""Deduplicate pretip NBA lineup change triggers; never dispatch after tip."""
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path

from nba.nba_v5_live_confirmed_lineups import utc

PROVIDER = "NBA_OFFICIAL_DAILY_LINEUPS"


def detect(evidence, previous, now, min_lead_seconds=300, max_lead_seconds=5400):
    now = utc(now.isoformat()) if isinstance(now, dt.datetime) else utc(now)
    if evidence.get("provider") != PROVIDER:
        raise ValueError("NBA_LINEUP_TRIGGER_UNTRUSTED_PROVIDER")
    captured = utc(evidence.get("captured_at_utc"))
    if not captured <= now or (now - captured).total_seconds() > 600:
        raise ValueError("NBA_LINEUP_TRIGGER_STALE_SOURCE")
    old = previous.get("seen", {}) if isinstance(previous, dict) else {}
    if not isinstance(old, dict):
        old = {}
    updated = dict(old)
    found = []
    for game in evidence.get("games", []):
        tip = utc(game.get("tipoff_utc"))
        lead = (tip-now).total_seconds()
        if not min_lead_seconds < lead <= max_lead_seconds:
            continue
        for team in game.get("teams", []):
            if team.get("lineup_state") != "CONFIRMED":
                continue
            ids = team.get("starters")
            if not isinstance(ids, list) or len(ids) != 5 or len({str(x) for x in ids}) != 5:
                continue
            key = str(game["game_id"]) + ":" + str(team["team_id"])
            current = sorted(str(x) for x in ids)
            if old.get(key) != current:
                found.append(key)
                updated[key] = current
    return {"changed": bool(found), "changed_teams": sorted(found),
            "state": {"schema": "NBA_V5_DAILY_LINEUP_TRIGGER_V1",
                      "updated_at_utc": now.isoformat(),
                      "seen": updated}}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--evidence", required=True)
    p.add_argument("--state", required=True)
    p.add_argument("--out-state", required=True)
    p.add_argument("--summary", required=True)
    a = p.parse_args()
    try:
        previous = json.loads(Path(a.state).read_text())
    except (OSError, ValueError):
        previous = {}
    try:
        evidence = json.loads(Path(a.evidence).read_text())
        result = detect(evidence, previous, dt.datetime.now(dt.timezone.utc))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        result = {"changed": False, "changed_teams": [],
                  "error": type(exc).__name__, "state": previous}
    Path(a.summary).write_text(json.dumps(
        {k:v for k,v in result.items() if k!="state"}, sort_keys=True, indent=2))
    if result["changed"]:
        Path(a.out_state).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out_state).write_text(json.dumps(result["state"], sort_keys=True, indent=2))
    print("NBA_V5_LINEUP_CHANGE_TRIGGER",json.dumps(
        {k:v for k,v in result.items() if k!="state"},sort_keys=True),flush=True)


if __name__ == "__main__":
    main()
