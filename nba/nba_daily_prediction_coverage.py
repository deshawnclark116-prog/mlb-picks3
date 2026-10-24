#!/usr/bin/env python3
"""NBA original pre-tip coverage audit, independent of whether the grader ran.

A successful postgame grade only proves yesterday's stats were processed, NOT
that new forecasts exist today. The source scoreboards and immutable saved
game IDs are reconciled before any new model write is accepted.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
from pathlib import Path
from zoneinfo import ZoneInfo
from nba.nba_v1_team_model import UTC,datetime_utc,extract_events,get_scoreboard
from nba.nba_v2_rolling_predictions import (
  SCHEMA as MODEL_SCHEMA, MIN_PREGAME_GAP, existing_games,
  validate_fixture_source,
)

SCHEMA="NBA_REALTIME_DAILY_FIRSTSEEN_FORECAST_COVERAGE_V1"

def audit(fixtures:dict,candidate:dict,archived_ids:set[str],
          at:dt.datetime,all_today_games:list[dict]|None=None)->dict:
    if at.tzinfo is None:raise ValueError("NBA_COVERAGE_CLOCK_NAIVE")
    at=at.astimezone(UTC)
    validate_fixture_source(fixtures,at)
    created=datetime_utc(candidate["generated_at_utc"])
    if (candidate.get("schema")!=MODEL_SCHEMA or
        candidate.get("research_only") is not True or
        candidate.get("official_bets")!=0 or
        not created<=at or at-created>dt.timedelta(minutes=10) or
        candidate.get("games_forecast")!=len(candidate.get("forecasts",[]))):
        raise ValueError("NBA_COVERAGE_NOT_ACTUAL_THIS_RUN_PREGAME_MODEL_OUTPUT")
    arrivals={}
    original_ids=set(archived_ids)
    for g in candidate["forecasts"]:
        gid=g["game_id"]
        if gid in arrivals or gid in original_ids:
            raise ValueError("NBA_COVERAGE_REPLACED_AN_OLDER_ORIGINAL_FORECAST")
        if (datetime_utc(g["tipoff_utc"])-created<MIN_PREGAME_GAP or
            g.get("player_predictions_count")!=4*len(g.get("players",[])) or
            g.get("no_wagers") is not True):
            raise ValueError("NBA_COVERAGE_NEW_FORECAST_TOO_LATE_OR_INCOMPLETE")
        arrivals[gid]=g
    all_fixture_ids={g["game_id"] for g in fixtures["games"]}
    if not set(arrivals).issubset(all_fixture_ids):
        raise ValueError("NBA_COVERAGE_NEW_PREDICTION_NOT_ON_INDEPENDENT_SCHEDULE")

    covered_old=[];covered_new=[];past_safe_window=[];eligible_missing=[]
    for g in fixtures["games"]:
        gid=g["game_id"]
        tip=datetime_utc(g["tipoff_utc"])
        if gid in original_ids:
            covered_old.append(gid)
        elif gid in arrivals:
            covered_new.append(gid)
        elif tip-created<MIN_PREGAME_GAP:
            past_safe_window.append({"game_id":gid,"tipoff_utc":g["tipoff_utc"],
                "reason":"PRETIP_15_MINUTE_SAFETY_WINDOW_MISSED_NO_RETROACTIVE_FORECAST"})
        else:
            eligible_missing.append({"game_id":gid,"tipoff_utc":g["tipoff_utc"],
                "reason":"ELIGIBLE_GAME_NOT_SAVED_OR_MODELED"})
    if len(covered_old)+len(covered_new)+len(past_safe_window)+len(eligible_missing)!=len(fixtures["games"]):
        raise AssertionError("NBA_GAME_COVERAGE_LOSS")

    eastern=ZoneInfo("America/New_York")
    etday=at.astimezone(eastern).date()
    today_missing=[]
    today_total=0
    if all_today_games is not None:
        seen=set()
        for g in all_today_games:
            gid=g["game_id"]
            tip=datetime_utc(g["start_utc"])
            if tip.astimezone(eastern).date()!=etday:continue
            if gid in seen:raise ValueError("NBA_TODAY_SCHEDULE_DUPLICATE_GAME")
            seen.add(gid);today_total+=1
            if gid not in original_ids and gid not in arrivals:
                today_missing.append({
                  "game_id":gid,"home":g["home"],"away":g["away"],
                  "tipoff_utc":g["start_utc"],
                  "game_started_at_audit":tip<=at,
                  "reason":("ALREADY_STARTED_CANNOT_BACKFILL_TRUE_PREGAME" if tip<=at
                            else "NO_SAVED_PREDICTION_YET_NOT_OFFICIAL")})
    today_covered=today_total-len(today_missing)
    status=("FUTURE_ORIGINAL_COVERAGE_FAILURE" if eligible_missing else
            "FUTURE_COVERED_BUT_SOME_TODAY_GAMES_MISSED" if today_missing else
            "ALL_KNOWN_GAMES_ORIGINAL_FORECAST_ACCOUNTED")
    return {
      "schema":SCHEMA,"checked_at_utc":at.isoformat(),
      "source_captured_at_utc":fixtures["source_captured_at_utc"],
      "prediction_generated_at_utc":candidate["generated_at_utc"],
      "eastern_game_date":etday.isoformat(),
      "status":status,"research_only":True,"official_bets":0,
      "source_forward_games":len(fixtures["games"]),
      "previously_saved_forward_games":len(covered_old),
      "new_original_forward_games":len(covered_new),
      "new_original_player_stat_predictions":
        candidate.get("number_of_player_stat_predictions",0),
      "future_games_past_safety_window":past_safe_window,
      "eligible_future_games_without_original":eligible_missing,
      "today_independent_schedule_games":today_total if all_today_games is not None else None,
      "today_games_with_original":today_covered if all_today_games is not None else None,
      "today_games_without_original":today_missing if all_today_games is not None else [],
      "all_future_eligible_games_covered":not eligible_missing,
      "had_unrecoverable_started_games":any(
        x["game_started_at_audit"] for x in today_missing),
      "disclosure":"Never reconstruct a historical original after tipoff; "
           "a daily grading success cannot substitute for an original pregame forecast."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--fixture",type=Path,required=True)
    p.add_argument("--candidate",type=Path,required=True)
    p.add_argument("--opening",type=Path,required=True)
    p.add_argument("--archive-root",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    now=dt.datetime.now(UTC)
    opening=json.loads(a.opening.read_text())
    original,_=existing_games(a.archive_root,opening)
    source=json.loads(a.fixture.read_text())
    candidate=json.loads(a.candidate.read_text())
    local_day=now.astimezone(ZoneInfo("America/New_York")).date()
    # Independent source snapshot for ALL of today's scheduled games, including
    # already-started ones. Never invent their forecasts after puck/tip-off.
    supplied,raw=get_scoreboard(local_day)
    if supplied!=local_day.isoformat():
        raise ValueError("NBA_TODAY_SOURCE_WRONG_EASTERN_DATE")
    today=extract_events(raw)
    report=audit(source,candidate,original,now,today)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(report,indent=2,sort_keys=True)+"\n")
    print("NBA_DAILY_FORECAST_FRESHNESS",json.dumps({
      k:report[k] for k in (
        "eastern_game_date","status","source_forward_games",
        "previously_saved_forward_games","new_original_forward_games",
        "new_original_player_stat_predictions",
        "today_independent_schedule_games","today_games_with_original",
        "today_games_without_original","eligible_future_games_without_original")
      },sort_keys=True),flush=True)
    if not report["all_future_eligible_games_covered"]:
        raise SystemExit("NBA_ELIGIBLE_FUTURE_GAMES_MISSING_ORIGINAL_FORECAST")

if __name__=="__main__":main()
