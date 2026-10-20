#!/usr/bin/env python3
"""Immutable daily NBA V2 2026-27 PLAYER forecasts for all not-yet-covered games.

Reuses the same V2 team_forecasts from the untouched Jan-Feb holdout (#36).
Sources: real, completed March-April 2025-26 ESPN player boxes as an early
season anchor, all available completed 2026-27 games before today, current
independently captured 30 ESPN rosters, and the daily ESPN forward fixture
source from nba_rolling_future_fixtures.py (#41).

Never regenerate a game's prediction once an ORIGINAL is archived. Each
complete game is scored later by the independent postgame grader. This
model is not injury/active/starter-certified. Never display its own numeric
projection as a bookmaker Over/Under, "win", or official wagering edge.
"""
from __future__ import annotations
import argparse
import collections
import datetime as dt
import hashlib
import json
import math
from pathlib import Path

from nba.nba_v1_team_model import UTC, datetime_utc, ingest
from nba.nba_v1_player_backtest import load_games
from nba.nba_2026_roster_source import NBA_IDS, verify_season_snapshot
from nba.nba_v2_firstseen_player_opening import (
    PREVIOUS_HISTORY_START, PREVIOUS_HISTORY_END, live_rosters,
    compile_histories, player_forecast, HISTORY_GAMES_PER_TEAM,
)
from nba.nba_v2_rotation_research import team_forecasts, MARKETS, VERSION
from nba.nba_rolling_future_fixtures import SCHEMA as FIXTURE_SCHEMA

SCHEMA="NBA_V2_2026_27_IMMUTABLE_ROLLING_PLAYER_PREDICTIONS_V1"
SEASON_START=dt.date(2026,10,20)
SEASON_END=dt.date(2027,4,11)
MIN_PREVIOUS_SOURCE_COVERAGE=.95
MIN_CURRENT_SOURCE_COVERAGE=.90
MIN_PREGAME_GAP=dt.timedelta(minutes=15)

def _source_sha(x):
    return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(",",":"),
                              ensure_ascii=False,allow_nan=False).encode()).hexdigest()

def validate_fixture_source(doc,asof):
    if doc.get("schema")!=FIXTURE_SCHEMA or doc.get("season")!="2026-27" or (
        doc.get("no_post_tip_reconstruction") is not True or
        doc.get("official_bets")!=0):
        raise ValueError("NBA_UNTRUSTED_ROLLING_GAME_SOURCE")
    source_at=datetime_utc(doc["source_captured_at_utc"])
    if source_at>asof or asof-source_at>dt.timedelta(hours=6):
        raise ValueError("NBA_STALE_OR_AFTER_FORECAST_GAME_SOURCE")
    if len(doc.get("scoreboard_source_receipts",[]))<1:
        raise ValueError("NBA_MISSING_SOURCE_RECEIPTS")
    seen=set()
    for rec in doc["scoreboard_source_receipts"]:
        if (not isinstance(rec.get("sha256"),str) or
            len(rec["sha256"])!=64 or
            datetime_utc(rec["retrieved_at_utc"])!=source_at):
            raise ValueError("NBA_INVALID_FIXTURE_SHA_OR_TIMESTAMP")
    for game in doc.get("games",[]):
        gid=str(game["game_id"])
        tip=datetime_utc(game["tipoff_utc"])
        if (gid in seen or not gid.isdigit() or
            game.get("verified_before_tip") is not True or
            game.get("research_only") is not True or
            game.get("model_prediction") is not None or
            game.get("original_forecast_id") is not None or
            tip<=source_at or
            str(game["home_id"]) not in NBA_IDS or
            str(game["away_id"]) not in NBA_IDS or
            game["home_id"]==game["away_id"]):
            raise ValueError("NBA_BAD_OR_FABRICATED_FUTURE_GAME")
        seen.add(gid)
    if len(seen)!=doc.get("future_games"):
        raise ValueError("NBA_FORWARD_FIXTURE_COUNT_MISMATCH")

def existing_games(root,opening):
    """Never reuse any original game ID, across opening and all saved dates."""
    seen=set()
    if opening.get("schema")!="NBA_2026_27_V2_FIRST_SEEN_PLAYER_RESEARCH_V1" or (
        opening.get("official_bets")!=0):
        raise ValueError("NBA_ORIGINAL_OPENING_RECORD_INVALID")
    for g in opening["forecasts"]:
        if g["game_id"] in seen:raise ValueError("NBA_OPENING_DUPLICATE_FIRST_SEEN_GAME")
        seen.add(g["game_id"])
    sources={}
    folder=Path(root)/"nba_rolling_predictions"
    for path in sorted(folder.glob("*.json")):
        if not path.stem.startswith("20"):continue
        data=json.loads(path.read_text())
        if data.get("schema")!=SCHEMA or data.get("official_bets")!=0:
            raise ValueError("NBA_OLDER_ORIGINAL_ROLLING_FILE_INVALID")
        if data["games_forecast"]!=len(data["forecasts"]):
            raise ValueError("NBA_OLDER_ORIGINAL_GAME_COUNT_MISMATCH")
        for g in data["forecasts"]:
            gid=str(g["game_id"])
            if gid in seen:raise ValueError("NBA_MULTIPLE_ORIGINAL_FORECASTS_FOR_GAME_"+gid)
            seen.add(gid)
            sources[gid]=path.name
    return seen,sources

def select_recent_games(old,current,asof,per_team=HISTORY_GAMES_PER_TEAM):
    """Chronological previous and current-season complete games; NO same-day leaks."""
    if not 12<=per_team<=35:raise ValueError("NBA_HISTORY_WINDOW_OUTSIDE_TESTED_RANGE")
    all_games={};team_history=collections.defaultdict(list)
    for g in sorted([*old,*current],key=lambda x:(x["start_utc"],x["game_id"])):
        start=datetime_utc(g["start_utc"])
        if not g.get("completed") or start>=asof:
            raise ValueError("NBA_FUTURE_OR_NONFINAL_GAME_USED_AS_PLAYER_HISTORY")
        if g["game_id"] in all_games:
            raise ValueError("NBA_REPEAT_HISTORICAL_EVENT")
        all_games[g["game_id"]]=g
        for t in (g["home_id"],g["away_id"]):
            if t not in NBA_IDS:raise ValueError("NBA_BAD_HISTORICAL_TEAM")
            team_history[t].append(g)
    if set(team_history)!=set(NBA_IDS) or any(len(seq)<12 for seq in team_history.values()):
        raise ValueError("NBA_30_TEAM_HISTORICAL_SOURCE_GAP")
    selected={}
    for tid,seq in team_history.items():
        for g in seq[-per_team:]:selected[g["game_id"]]=g
    return sorted(selected.values(),key=lambda g:(g["start_utc"],g["game_id"])),{
        tid:{"prior_games":len(team_history[tid]),
             "current_season_games":sum(
                 dt.date.fromisoformat(g["day_utc"])>=SEASON_START for g in team_history[tid]),
             "selected":min(per_team,len(team_history[tid]))}
        for tid in sorted(team_history)}

def _source_rosters(rosters,receipts,asof):
    """Roster membership verified, never mistaken for injury clearance."""
    if set(rosters)!=set(NBA_IDS) or set(receipts)!=set(NBA_IDS):
        raise ValueError("NBA_NOT_ALL_30_CURRENT_TEAM_ROSTERS")
    all_ids={}
    for tid,rows in rosters.items():
        if not 8<=len(rows)<=35:raise ValueError("NBA_ROSTER_SOURCE_SIZE")
        receipt=receipts[tid]
        timestamp=datetime_utc(receipt["retrieved_at_utc"])
        if timestamp>asof:raise ValueError("NBA_FUTURE_ROSTER_LOOKAHEAD")
        if (not isinstance(receipt.get("sha256"),str) or
            len(receipt["sha256"])!=64 or
            receipt.get("players")!=len(rows)):
            raise ValueError("NBA_ROSTER_SOURCE_RECEIPT_MISSING")
        for r in rows:
            pid=str(r["player_id"])
            if pid in all_ids:raise ValueError("NBA_DUPLICATE_PLAYER_ON_MULTIPLE_TEAMS")
            all_ids[pid]=tid

def forecast_roll(fixtures,opening,existing,rosters,receipts,
                  historical_games,boxes,asof,history_meta=None,source_errors=None):
    """Pure forward-only planner; exact player model unchanged."""
    if asof.tzinfo is None:raise ValueError("NBA_NAIVE_MODEL_CLOCK")
    asof=asof.astimezone(UTC)
    validate_fixture_source(fixtures,asof)
    _source_rosters(rosters,receipts,asof)
    if len(boxes)/len(historical_games)<MIN_PREVIOUS_SOURCE_COVERAGE:
        raise ValueError("NBA_HISTORY_BOXSCORE_COMPLETENESS_GATE")
    if not historical_games:raise ValueError("NBA_NO_ACTUAL_HISTORICAL_SOURCE")
    for g in historical_games:
        if not g["completed"] or datetime_utc(g["start_utc"])>=asof:
            raise ValueError("NBA_HISTORICAL_FUTURE_GAME_LEAKAGE")
    hist,team_games,first,last,all_ids=compile_histories(historical_games,boxes)
    forecast_games=[];skipped=[];ids=set()
    for g in sorted(fixtures["games"],key=lambda z:(z["tipoff_utc"],z["game_id"])):
        gid=g["game_id"];tip=datetime_utc(g["tipoff_utc"])
        if gid in existing:
            skipped.append({"game_id":gid,"reason":"ORIGINAL_FIRST_SEEN_FORECAST_ALREADY_EXISTS"})
            continue
        if tip-asof<MIN_PREGAME_GAP:
            skipped.append({"game_id":gid,"reason":"STRICT_PREGAME_15_MINUTE_WINDOW_MISSED"})
            continue
        modeled=[];unmodeled=[];roles={}
        for tid in (g["away_id"],g["home_id"]):
            roster_ids={x["player_id"] for x in rosters[tid]}
            team_hist={key:h for key,h in hist.items()
                       if key[0]==tid and key[1] in roster_ids}
            team_projection=team_forecasts(tid,team_hist,team_games,first,last)
            predicted,missing=player_forecast(
                team_projection,roster_ids,g,asof.isoformat(),
                receipts[tid]["retrieved_at_utc"])
            for row in predicted:
                if row["forecast_id"] in ids:raise ValueError("NBA_DUPLICATE_NEW_PROJECTION")
                ids.add(row["forecast_id"])
                if row["game_id"]!=gid or row["tipoff_utc"]!=g["tipoff_utc"]:
                    raise ValueError("NBA_MODEL_WRONG_GAMEDAY")
                if (row["official_pick"] is not False or
                    row["stat_market_lines"] is not None or
                    set(row["predictions"])!=set(MARKETS)):
                    raise ValueError("NBA_MODEL_INVENTED_PROPS")
            modeled.extend(predicted)
            unmodeled.extend({"team_id":tid,"player_id":pid,
                "reason":"CURRENT_ROSTER_MEMBER_WITH_INSUFFICIENT_VERIFIED_PRIOR_SAME_TEAM_GAMES"}
                for pid in sorted(missing))
            roles[tid]={
                "expected_modeled_minutes":team_projection["allocated_expected_minutes"],
                "unmodeled_rotation_minutes":team_projection["unmodeled_reserve_minutes"],
                "original_roster_count":len(roster_ids),
                "modeled_roster_count":len(predicted)}
        if not modeled:
            skipped.append({"game_id":gid,"reason":"NO_PLAYERS_MEET_FROZEN_V2_PRIOR_HISTORY_GATE"})
            continue
        forecast_games.append({
            "game_id":gid,"tipoff_utc":g["tipoff_utc"],
            "away":g["away"],"home":g["home"],
            "away_id":g["away_id"],"home_id":g["home_id"],
            "players":sorted(modeled,key=lambda p:(p["team_id"],-p["expected_minutes"],p["player_id"])),
            "player_predictions_count":len(modeled)*len(MARKETS),
            "roster_players_without_model_forecast":unmodeled,
            "team_role_coverage":roles,
            "game_day_active_and_injury_certified":False,
            "roster_membership_certified_by_espn":True,
            "no_wagers":True,
            "predicted_at_utc":asof.isoformat()})
    historical_ids=[{"game_id":x["game_id"],"tipoff_utc":x["start_utc"]}
                    for x in historical_games]
    return {
        "schema":SCHEMA,"generated_at_utc":asof.isoformat(),
        "model_version":VERSION,"research_only":True,
        "current_season":"2026-27","official_bets":0,
        "no_sportsbook_pricing_or_Kelly":True,
        "game_roster_active_injury_starter_status_unknown":True,
        "game_day_active_injury_status_source":"NOT_VERIFIED_NO_DEFAULT_ACTIVE_ASSUMPTION",
        "current_season_history_update_active":True,
        "current_season_prior_completed_game_count":sum(
            dt.date.fromisoformat(x["day_utc"])>=SEASON_START for x in historical_games),
        "previous_season_prior_completed_game_count":sum(
            dt.date.fromisoformat(x["day_utc"])<SEASON_START for x in historical_games),
        "verified_prior_game_boxscores":len(boxes),
        "history_game_identity_sha256":_source_sha(historical_ids),
        "history_source_coverage":round(len(boxes)/len(historical_games),6),
        "history_receipts":history_meta or {},
        "missing_actual_history_boxes":source_errors or {},
        "source_roster_count":sum(map(len,rosters.values())),
        "source_roster_receipts":receipts,
        "forward_fixture_receipts":fixtures["scoreboard_source_receipts"],
        "fixture_source_sha256":_source_sha(fixtures),
        "fixture_source_captured_at_utc":fixtures["source_captured_at_utc"],
        "games_forecast":len(forecast_games),
        "number_of_player_stat_predictions":sum(
            g["player_predictions_count"] for g in forecast_games),
        "forecasts":forecast_games,
        "skipped_original_or_late":skipped,
        "original_opening_games_reserved":len(opening["forecasts"]),
        "status":"IMMUTABLE_GENUINE_FORWARD_V2_RESEARCH" if forecast_games else
                 "NO_NEW_PREGAME_GAME_ELIGIBLE",
        "warning":"Research only: updated from real completed 2026-27 team player games "
                  "and current ESPN roster membership, but game-day injury designation, "
                  "dressed status and starting lineup remain unverified. "
                  "Player statistics are conditional on playing, not official bookmaker bets."
    }

def collect(asof_day,cache_root:Path,per_team=HISTORY_GAMES_PER_TEAM,
            ingest_fn=ingest,box_fn=load_games):
    """Cache replay data: 2025 spring anchor and only 2026 days STRICTLY prior."""
    spring,old_receipt=ingest_fn(PREVIOUS_HISTORY_START,PREVIOUS_HISTORY_END,
                                 cache_root/"prior_scoreboards")
    current=[];current_receipt={}
    last=asof_day-dt.timedelta(days=1)
    if last>=SEASON_START:
        current,current_receipt=ingest_fn(SEASON_START,last,
                                          cache_root/"current_scoreboards")
    for r in current:
        if dt.date.fromisoformat(r["day_utc"])>=asof_day:
            raise ValueError("NBA_CURRENT_DAY_HISTORY_SOURCE_FORBIDDEN")
    selected,counts=select_recent_games(spring,current,
                    dt.datetime.combine(asof_day,dt.time.min,tzinfo=UTC),per_team)
    boxes,missing=box_fn(selected,cache_root/"verified_boxes",workers=5)
    oldids={g["game_id"] for g in spring}
    before=[g for g in selected if g["game_id"] in oldids]
    later=[g for g in selected if g["game_id"] not in oldids]
    goodold=sum(g["game_id"] in boxes for g in before)
    goodnew=sum(g["game_id"] in boxes for g in later)
    if before and goodold/len(before)<MIN_PREVIOUS_SOURCE_COVERAGE:
        raise ValueError("NBA_SPRING_PLAYER_BOXSCORE_COVERAGE_GATE")
    if later and goodnew/len(later)<MIN_CURRENT_SOURCE_COVERAGE:
        raise ValueError("NBA_CURRENT_PLAYER_BOXSCORE_COVERAGE_GATE")
    return selected,boxes,{"prior_scoreboard":old_receipt,
          "current_scoreboard":current_receipt,"team_games":counts,
          "prior_boxes_verified":goodold,"prior_boxes_requested":len(before),
          "current_boxes_verified":goodnew,"current_boxes_requested":len(later)},missing

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--fixture",required=True,type=Path)
    parser.add_argument("--opening",type=Path,
       default=Path("docs/nba_v2_opening_player_firstseen.json"))
    parser.add_argument("--archive-root",type=Path,default=Path("docs"))
    parser.add_argument("--cache",type=Path,default=Path(".cache/nba-v2-rolling"))
    parser.add_argument("--out",required=True,type=Path)
    parser.add_argument("--per-team-games",type=int,default=HISTORY_GAMES_PER_TEAM)
    args=parser.parse_args()
    if args.out.exists():raise ValueError("NBA_FIRST_SEEN_OUTPUT_ALREADY_EXISTS")
    opening=json.loads(args.opening.read_text())
    fixture=json.loads(args.fixture.read_text())
    before=dt.datetime.now(UTC)
    validate_fixture_source(fixture,before)
    existing,_=existing_games(args.archive_root,opening)
    upcoming=[g for g in fixture["games"]
         if g["game_id"] not in existing and
         datetime_utc(g["tipoff_utc"])-before>=MIN_PREGAME_GAP]
    # No expensive 30-roster and 200+ boxscore calls if no NEW future fixture.
    if upcoming:
        games,boxes,meta,failed=collect(before.date(),args.cache,
                                       per_team=args.per_team_games)
        rosters,receipts=live_rosters()
        asof=dt.datetime.now(UTC)
        doc=forecast_roll(fixture,opening,existing,rosters,receipts,
                games,boxes,asof,history_meta=meta,source_errors=failed)
    else:
        # Explicit source-only status; NEVER treat it as a V2 prediction.
        asof=before
        doc={"schema":SCHEMA,"generated_at_utc":asof.isoformat(),
             "model_version":VERSION,"current_season":"2026-27",
             "status":"NO_NEW_PREGAME_GAME_ELIGIBLE",
             "games_forecast":0,"number_of_player_stat_predictions":0,
             "forecasts":[],"research_only":True,"official_bets":0,
             "source_game_count":fixture["future_games"],
             "fixture_source_sha256":_source_sha(fixture),
             "skipped_original_or_late":[
                 {"game_id":g["game_id"],"reason":"ALREADY_ORIGINAL_OR_NO_PREGAME_WINDOW"}
                 for g in fixture["games"]],
             "no_sportsbook_pricing_or_Kelly":True}
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(doc,indent=2,sort_keys=True,
                                   allow_nan=False)+"\n")
    print("NBA_2026_ROLLING_FIRST_SEEN_V2",json.dumps({
       "status":doc["status"],"games":doc["games_forecast"],
       "new_stat_predictions":doc["number_of_player_stat_predictions"],
       "asof":doc["generated_at_utc"],"official_bets":doc["official_bets"]},
       sort_keys=True),flush=True)

if __name__=="__main__":main()
