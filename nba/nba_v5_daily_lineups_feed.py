"""NBA.com daily-lineups JSON -> strict pretip V5 confirmed starting fives.

Source is the JSON underlying the publicly visible NBA Today lineups page.
The NBA feed marks many BENCH players as lineupStatus="Confirmed";
that status alone never identifies a starter. Require exactly one each of
PG, SG, SF, PF, C with "Confirmed" and "Active", before scheduled tipoff.

No sportsbook data, projected-to-confirmed promotions or post-tip lookahead.
A public HTTPS response does not independently establish NBA data-use rights.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

from nba.nba_v5_hoopr_tracking import ESPN_ABBR
from nba.nba_v5_live_confirmed_lineups import norm, roster_by_name, utc
from nba.nba_v5_pregame_certified import SCHEMA

PROVIDER = "NBA_OFFICIAL_DAILY_LINEUPS"
URL_TEMPLATE = "https://stats.nba.com/js/data/leaders/00_daily_lineups_{date}.json"
POSITIONS = frozenset(("PG", "SG", "SF", "PF", "C"))
ET = ZoneInfo("America/New_York")
MAX_BYTES = 2_000_000

BROWSER_HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/131.0.0.0 Safari/537.36"),
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.nba.com/players/todays-lineups",
}


def feed_url(date):
    if not re.fullmatch(r"20\d{6}", str(date)):
        raise ValueError("NBA_LINEUP_DATE_INVALID")
    return URL_TEMPLATE.format(date=date)


def fetch_json(date, timeout=15):
    url = feed_url(date)
    req = urllib.request.Request(url, headers=BROWSER_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        if response.geturl() != url:
            raise ValueError("NBA_LINEUP_UNEXPECTED_REDIRECT")
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("NBA_LINEUP_OVERSIZED_RESPONSE")
    doc = json.loads(raw)
    if not isinstance(doc, dict) or not isinstance(doc.get("games"), list):
        raise ValueError("NBA_LINEUP_UNKNOWN_SCHEMA")
    if len(doc["games"]) > 30:
        raise ValueError("NBA_LINEUP_TOO_MANY_GAMES")
    return doc


def _starters(game, daily_team, team_id):
    if not isinstance(daily_team, dict):
        return [], "MISSING_NBA_TEAM"
    roster = daily_team.get("players")
    if not isinstance(roster, list) or len(roster) > 30:
        return [], "MISSING_NBA_ROSTER"
    # Critical: Confirmed applies to both starters and bench in this feed.
    marked = [p for p in roster if isinstance(p, dict)
              and str(p.get("position", "")).upper() in POSITIONS]
    if (len(marked) != 5 or
        {str(p.get("position", "")).upper() for p in marked} != POSITIONS):
        return [], "FIVE_DISTINCT_STARTING_POSITIONS_NOT_POSTED"
    if any(str(p.get("lineupStatus", "")).lower() != "confirmed" or
           str(p.get("rosterStatus", "")).lower() != "active" for p in marked):
        return [], "POSITIONAL_STARTERS_NOT_CONFIRMED"
    names = roster_by_name(game, team_id)
    selected = []
    for player in marked:
        display = (player.get("playerName") or
                   " ".join((str(player.get("firstName") or ""),
                             str(player.get("lastName") or ""))).strip())
        player_id = names.get(norm(display))
        if not player_id or player_id in selected:
            return [], "NBA_STARTER_UNMATCHED_OR_AMBIGUOUS_ESPN_ROSTER"
        selected.append(player_id)
    return selected, "MATCHED_FIVE_CONFIRMED_POSITIONAL_STARTERS"


def capture(v3, feeds_by_date, now):
    """Convert independently fetched official daily snapshots into V5 evidence.

    The observation time is the actual fetch time; source player timestamps are
    not asserted to be NBA publication time (timezone not independently proved).
    """
    now = utc(now.isoformat()) if isinstance(now, dt.datetime) else utc(now)
    games = []
    counts = {}
    feed_dates = set()
    for game in v3.get("games", []):
        tip = utc(game["tipoff_utc"])
        if not 0 < (tip - now).total_seconds() <= 9 * 3600:
            continue
        date = tip.astimezone(ET).strftime("%Y%m%d")
        feed_dates.add(date)
        data = feeds_by_date.get(date) or {}
        candidates = []
        for item in data.get("games", []):
            if not isinstance(item, dict) or str(item.get("gameStatus")) != "1":
                continue
            if ((item.get("homeTeam") or {}).get("teamAbbreviation") ==
                    ESPN_ABBR.get(str(game["home_id"])) and
                (item.get("awayTeam") or {}).get("teamAbbreviation") ==
                    ESPN_ABBR.get(str(game["away_id"]))):
                candidates.append(item)
        matched = candidates[0] if len(candidates) == 1 else None
        teams = []
        for side, team_id in (("home", str(game["home_id"])),
                              ("away", str(game["away_id"]))):
            picked, reason = (_starters(game, matched.get(side + "Team"), team_id)
                              if matched else ([], "PREGAME_MATCHUP_NOT_UNIQUE_OR_POSTED"))
            counts[reason] = counts.get(reason, 0) + 1
            teams.append({"team_id": team_id,
                          "lineup_state": "CONFIRMED" if len(picked) == 5 else "NOT_POSTED",
                          "starters": picked if len(picked) == 5 else [],
                          "inactive": [], "minute_limits": []})
        games.append({"game_id": str(game["game_id"]),
                      "tipoff_utc": tip.isoformat(), "teams": teams})
    first_date = sorted(feed_dates)[0] if feed_dates else now.astimezone(ET).strftime("%Y%m%d")
    observed = now.isoformat()
    doc = {"schema": SCHEMA, "provider": PROVIDER,
           "source_url": feed_url(first_date),
           "published_at_utc": observed, "captured_at_utc": observed,
           "source_timestamp_basis": "FIRST_OBSERVED_PRETIP; NBA_PLAYER_TIMESTAMP_TZ_NOT_ASSUMED",
           "games": games}
    audit = {"provider": PROVIDER, "source_url": doc["source_url"],
             "observed_at_utc": observed, "dates_requested": sorted(feed_dates),
             "games_checked": len(games),
             "confirmed_teams": sum(t["lineup_state"] == "CONFIRMED"
                                    for g in games for t in g["teams"]),
             "not_posted_teams": sum(t["lineup_state"] == "NOT_POSTED"
                                     for g in games for t in g["teams"]),
             "reasons": counts, "feed_timestamp_timezone_not_assumed": True,
             "post_tip_inferences": 0}
    return doc, audit


def collect(v3, now=None, fetch=fetch_json):
    now = now or dt.datetime.now(dt.timezone.utc)
    requested = {utc(g["tipoff_utc"]).astimezone(ET).strftime("%Y%m%d")
                 for g in v3.get("games", [])
                 if 0 < (utc(g["tipoff_utc"]) - now).total_seconds() <= 9 * 3600}
    feeds, errors = {}, {}
    for date in sorted(requested):
        try:
            feeds[date] = fetch(date)
        except Exception as exc:
            errors[date] = type(exc).__name__
    # Use the clock from AFTER the network observations, never the stale prior.
    observed = dt.datetime.now(dt.timezone.utc) if fetch is fetch_json else now
    doc, audit = capture(v3, feeds, observed)
    audit["http_dates_ok"] = sorted(feeds)
    audit["http_errors_by_date"] = errors
    return doc, audit


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--v3", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--audit", required=True)
    a = p.parse_args()
    v3 = json.loads(Path(a.v3).read_text())
    doc, audit = collect(v3)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(doc, sort_keys=True, separators=(",", ":")))
    Path(a.audit).write_text(json.dumps(audit, sort_keys=True, indent=2))
    print("NBA_V5_DAILY_LINEUPS", json.dumps(audit, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
