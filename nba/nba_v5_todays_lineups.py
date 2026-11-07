"""Permissioned NBA Today's Lineups snapshot -> V5 pretip evidence.

This is deliberately NOT a web scraper. NBA.com page access is not a
redistribution/API license. A user/authorized provider must supply a dated,
structured capture with explicit starter and confirmed flags. The converter
never infers confirmed starters from green/active styling, projections, or
an injury designation.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path

from nba.nba_v5_hoopr_tracking import ESPN_ABBR
from nba.nba_v5_live_confirmed_lineups import norm, roster_by_name, utc
from nba.nba_v5_pregame_certified import SCHEMA

PAGE = "https://www.nba.com/players/todays-lineups"
PROVIDER = "NBA_TODAYS_LINEUPS_AUTHORIZED_SNAPSHOT"
MAX_SOURCE_BYTES = 2_000_000


def convert(v3, capture, now):
    """Pure as-of converter; no network calls or guessed confirmations."""
    now = utc(now.isoformat()) if isinstance(now, dt.datetime) else utc(now)
    if capture.get("source_page", "").split("?")[0] != PAGE:
        raise ValueError("NBA_TODAY_LINEUPS_WRONG_SOURCE")
    if capture.get("obtained_with_permission") is not True:
        raise ValueError("NBA_TODAY_LINEUPS_PERMISSION_NOT_ASSERTED")
    observed = utc(capture["captured_at_utc"])
    if observed > now or (now - observed).total_seconds() > 90 * 60:
        raise ValueError("NBA_TODAY_LINEUPS_STALE_OR_FUTURE")
    raw_games = capture.get("games")
    if not isinstance(raw_games, list):
        raise ValueError("NBA_TODAY_LINEUPS_MISSING_GAMES")
    lookup = {}
    for item in raw_games:
        gid = str(item.get("game_id", ""))
        if gid in lookup:
            raise ValueError("NBA_TODAY_LINEUPS_DUPLICATE_GAME")
        lookup[gid] = item
    games = []
    reasons = {}
    for g in v3.get("games", []):
        tip = utc(g["tipoff_utc"])
        if not 0 < (tip - now).total_seconds() <= 9 * 3600:
            continue
        gid = str(g["game_id"])
        item = lookup.get(gid)
        team_rows = []
        valid_game = (
            isinstance(item, dict)
            and item.get("game_status") in ("SCHEDULED", "PREGAME", "NOT_STARTED")
            and str(item.get("away_team", "")).upper() == ESPN_ABBR.get(str(g["away_id"]))
            and str(item.get("home_team", "")).upper() == ESPN_ABBR.get(str(g["home_id"]))
            and item.get("tipoff_utc") is not None
            and utc(item["tipoff_utc"]) == tip
            and isinstance(item.get("teams"), list)
        )
        for team_id in (str(g["home_id"]), str(g["away_id"])):
            abbr = ESPN_ABBR.get(team_id)
            result = []
            reason = "GAME_MISSING_OR_MISMATCH"
            if valid_game:
                matches = [row for row in item["teams"]
                           if isinstance(row, dict) and row.get("team_abbr") == abbr]
                if len(matches) != 1:
                    reason = "TEAM_MISSING_OR_DUPLICATE"
                else:
                    row = matches[0]
                    if row.get("lineup_status") != "CONFIRMED":
                        reason = "NOT_CONFIRMED"  # green active != announced starting five
                    elif not isinstance(row.get("players"), list):
                        reason = "MISSING_PLAYERS"
                    else:
                        marked = [p for p in row["players"]
                                  if isinstance(p, dict) and p.get("starter") is True]
                        if len(marked) != 5:
                            reason = "EXACTLY_FIVE_STARTER_FLAGS_REQUIRED"
                        else:
                            names = roster_by_name(g, team_id)
                            ids = [names.get(norm(p.get("name", ""))) for p in marked]
                            if all(ids) and len(set(ids)) == 5:
                                result = ids
                                reason = "MATCHED_EXPLICIT_FIVE"
                            else:
                                reason = "AMBIGUOUS_OR_MISSING_ESPN_ID"
            reasons[reason] = reasons.get(reason, 0) + 1
            team_rows.append({"team_id": team_id,
                              "lineup_state": "CONFIRMED" if result else "NOT_POSTED",
                              "starters": result, "inactive": [], "minute_limits": []})
        games.append({"game_id": gid, "tipoff_utc": tip.isoformat(), "teams": team_rows})
    document = {
        "schema": SCHEMA, "provider": PROVIDER, "source_url": PAGE,
        # The source is a first-observed capture; never claim an earlier posting.
        "published_at_utc": observed.isoformat(),
        "captured_at_utc": observed.isoformat(),
        "source_timestamp_basis": "FIRST_OBSERVED_NOT_ORIGINAL_PUBLICATION",
        "games": games,
    }
    audit = {
        "provider": PROVIDER, "source_url": PAGE,
        "captured_at_utc": observed.isoformat(),
        "games_checked": len(games),
        "confirmed_teams": sum(t["lineup_state"] == "CONFIRMED"
                               for g in games for t in g["teams"]),
        "not_posted_teams": sum(t["lineup_state"] != "CONFIRMED"
                                for g in games for t in g["teams"]),
        "reasons": reasons,
        "source_authenticity_verified": False,
        "capture_permission_asserted": True,
        "network_scraping_performed": False,
    }
    return document, audit


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--v3", required=True)
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--audit", required=True)
    args = parser.parse_args()
    raw = Path(args.snapshot).read_bytes()
    if len(raw) > MAX_SOURCE_BYTES:
        raise ValueError("NBA_TODAY_LINEUPS_SOURCE_TOO_LARGE")
    document, audit = convert(json.loads(Path(args.v3).read_text()),
                              json.loads(raw), dt.datetime.now(dt.timezone.utc))
    Path(args.out).write_text(json.dumps(document, sort_keys=True, separators=(",", ":")))
    Path(args.audit).write_text(json.dumps(audit, sort_keys=True, indent=2))
    print("NBA_V5_TODAY_LINEUPS", json.dumps(audit), flush=True)


if __name__ == "__main__":
    main()
