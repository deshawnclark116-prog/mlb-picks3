"""Source-only NBA V5 pregame games assembled from already-observed NBA data.

This is NOT V3/V4/any previous model's predicted player probabilities, means,
minutes, stat CDFs or recommended targets. It captures the same ESPN current
team-roster membership and source-dated injury / NBA confirmed five that the
daily ingest already reads. V5 estimates the *player probabilities and stats*.

The pipeline may share one data-collection step with V3. V5 does NOT read any
V3 forecast result in order to predict.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json

from nba.nba_v2_firstseen_player_opening import compile_histories
from nba.nba_v3_daily_roster import supplement as supplement_daily_roster

UTC = dt.timezone.utc
SCHEMA = "NBA_V5_SOURCE_ONLY_PREGAME_GAME_FACTS_V1"
MARKETS = ("points", "rebounds", "assists", "three_pointers_made", "steals", "blocks", "turnovers")
MIN_PREGAME_GAP = dt.timedelta(minutes=15)


def utc(value):
    parsed = value if isinstance(value, dt.datetime) else dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("NBA_V5_GAME_FACTS_REQUIRE_TIMEZONE")
    return parsed.astimezone(UTC)


def _player_names(rosters, histories):
    names = {}
    for tid, players in rosters.items():
        for p in players:
            pid = str(p["player_id"])
            names[(str(tid), pid)] = p["player"]
    # New verified transfers can be recognized by an official daily NBA
    # team list even if the ESPN team roster has not caught up. The name
    # comes from actual past played boxes, never a hypothetical lineup.
    for (tid, pid), lines in histories.items():
        if not lines:
            continue
        key = str(tid), str(pid)
        names.setdefault(key, lines[-1].get("player") or lines[-1].get("name") or "")
        names.setdefault(("*", str(pid)), lines[-1].get("player") or lines[-1].get("name") or "")
    return names


def build(fixtures, rosters, receipts, games, boxes, asof,
          injury_snapshot=None, daily_roster_snapshot=None):
    observed = utc(asof)
    if not isinstance(fixtures, dict) or not isinstance(fixtures.get("games"), list):
        raise ValueError("NBA_V5_FACTS_INVALID_FIXTURE_SOURCE")
    if not all(isinstance(x, dict) for x in fixtures["games"]):
        raise ValueError("NBA_V5_FACTS_INVALID_FIXTURE_GAME")
    if not isinstance(rosters, dict) or not isinstance(receipts, dict):
        raise ValueError("NBA_V5_FACTS_INVALID_SOURCE_ROSTERS")
    if any(utc(g["start_utc"]) >= observed or g.get("completed") is not True for g in games):
        raise ValueError("NBA_V5_FACTS_FUTURE_HISTORICAL_BOX_LEAKAGE")

    histories, _, _, _, _ = compile_histories(games, boxes)
    names = _player_names(rosters, histories)
    injury_snapshot = injury_snapshot or {}
    if injury_snapshot.get("injuries") and utc(injury_snapshot["captured_at_utc"]) > observed:
        raise ValueError("NBA_V5_FACTS_FUTURE_INJURY_SOURCE")

    original_injuries = {}
    for item in injury_snapshot.get("injuries", []):
        if item.get("source_reported_status") != "OUT":
            continue
        key = (str(item["team_id"]), str(item["player_id"]))
        original_injuries[key] = "OUT"

    facts = []
    for fixture in sorted(fixtures["games"], key=lambda x:(x["tipoff_utc"],str(x["game_id"]))):
        tip = utc(fixture["tipoff_utc"])
        if tip - observed < MIN_PREGAME_GAP:
            continue
        gid = str(fixture["game_id"])
        away, home = str(fixture["away_id"]), str(fixture["home_id"])
        if away == home or away not in rosters or home not in rosters:
            raise ValueError("NBA_V5_FACTS_INVALID_TEAMS")
        supplemented, confirmed, audit = supplement_daily_roster(
            fixture, rosters, histories, daily_roster_snapshot, observed)
        rows=[]
        across=set()
        for team in (away, home):
            roster = sorted(set(map(str,supplemented[team])),key=lambda x:int(x))
            if len(roster) < 7:
                raise ValueError(f"NBA_V5_FACTS_INCOMPLETE_TEAM_ROSTER_{gid}_{team}")
            official_active = {str(item["player_id"]) for item in confirmed[team]
                               if item.get("status") == "ACTIVE"}
            for pid in roster:
                if pid in across:
                    raise ValueError("NBA_V5_FACTS_PLAYER_ASSIGNED_TO_BOTH_TEAMS")
                across.add(pid)
                name = names.get((team,pid)) or names.get(("*",pid))
                if not isinstance(name,str) or not name.strip():
                    raise ValueError(f"NBA_V5_FACTS_UNNAMED_VERIFIED_PLAYER_{team}_{pid}")
                reported = ("AVAILABLE" if pid in official_active else
                            "OUT" if original_injuries.get((team,pid))=="OUT" else
                            "UNKNOWN_NOT_ACTIVE_CERTIFIED")
                # This is a *roster gate*, never a probabilistic forecast.
                # The NBA V5 own play model learns P(playing) independently.
                for market in MARKETS:
                    rows.append({
                        "game_id":gid,"team_id":team,"player_id":pid,
                        "player":name,"market":market,"reported_status":reported,
                        "p_active":0.0 if reported=="OUT" else 1.0,
                        "source_roster_gate_not_forecast_probability":True,
                        "independently_verified_starter":pid in official_active,
                        "game_stats_derived_from_v3_model":False,
                    })
        facts.append({
            "game_id":gid,"home_id":home,"away_id":away,
            "home":fixture["home"],"away":fixture["away"],
            "tipoff_utc":tip.isoformat(),
            "forecast_at_utc":observed.isoformat(),
            "rows":rows,"rows_count":len(rows),
            "officials":fixture.get("officials") or [],
            "source_roster_receipts":{
                t: {"sha256": receipts[t]["sha256"],
                    "retrieved_at_utc":receipts[t]["retrieved_at_utc"],
                    "url":receipts[t]["url"]}
                for t in (away,home)},
            "source_daily_roster_audit":audit,
            "current_roster_membership_is_not_active_certification":True,
            "no_previous_model_forecast_input":True,
        })
    return {
        "schema":SCHEMA,"generated_at_utc":observed.isoformat(),
        "model_version":"NBA_NEUTRAL_SOURCE_FACTS_NOT_A_MODEL",
        "games":facts,"games_forecast":len(facts),
        "source_rosters_verified_all_30":len(rosters)==30,
        "no_v3_v4_projection_means":True,
        "no_prior_model_CDF_or_minutes":True,
        "no_sportsbook_inputs":True,
        "note":"Independent timestamped game and roster facts, not a statistical forecast. "
               "An ESPN team roster is not game-day ACTIVE certification.",
    }


def validate(doc, now):
    if doc.get("schema") != SCHEMA or not doc.get("no_v3_v4_projection_means"):
        raise ValueError("NBA_V5_UNTRUSTED_NEUTRAL_GAME_FACTS")
    at = utc(doc["generated_at_utc"])
    if at > utc(now) or (utc(now)-at) > dt.timedelta(hours=4):
        raise ValueError("NBA_V5_STALE_OR_FUTURE_GAME_FACTS")
    for g in doc["games"]:
        tip = utc(g["tipoff_utc"])
        if at >= tip - MIN_PREGAME_GAP:
            raise ValueError("NBA_V5_NOT_TRULY_PRETIP_GAME_FACTS")
        teams={str(g["home_id"]),str(g["away_id"])}
        if len(teams)!=2:
            raise ValueError("NBA_V5_DUPLICATE_TEAM")
        players={}
        for r in g["rows"]:
            if r.get("market") not in MARKETS:
                raise ValueError("NBA_V5_GAME_FACTS_UNKNOWN_MARKET")
            if r.get("mean") is not None or r.get("cdf_lattice") is not None or r.get("conditional_minutes_mean") is not None:
                raise ValueError("NBA_V5_GAME_FACTS_CONTAINS_PREVIOUS_MODEL_PREDICTIONS")
            if str(r["team_id"]) not in teams or str(r["game_id"])!=str(g["game_id"]):
                raise ValueError("NBA_V5_GAME_FACTS_WRONG_TEAM_OR_GAME")
            if r["p_active"] not in (0.0, 1.0):
                raise ValueError("NBA_V5_GAME_FACTS_HAS_PROBABILISTIC_PRIOR")
            pid=str(r["player_id"]); team=str(r["team_id"])
            if pid in players and players[pid]!=team:
                raise ValueError("NBA_V5_GAME_FACTS_PLAYER_ON_BOTH_SIDES")
            players[pid]=team
        if not players:
            raise ValueError("NBA_V5_GAME_FACTS_MISSING_ROSTER")
    return True
