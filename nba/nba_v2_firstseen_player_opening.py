#!/usr/bin/env python3
"""First-seen 2026-27 NBA V2 PLAYER predictions; genuine historical source only.

Reuses the frozen and paired-tested V2 rotation challenger unchanged. Current
ESPN roster IDs establish membership, NEVER actual game participation, official
injury availability, starters, minutes limits, bookmaker lines or wagers.
Historical NBA 2025-26 stats are strictly completed BEFORE these future games.

This script creates an ORIGINAL forward research record, not a retrospective
model reconstruction. Never run to backfill past games or overwrite an original
first-seen artifact. The grader consumes the stored result independently.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import hashlib
import json
from pathlib import Path

from nba.nba_v1_team_model import ingest, UTC, datetime_utc
from nba.nba_v1_player_backtest import load_games
from nba.nba_v2_rotation_research import team_forecasts, VERSION, MARKETS
from nba.nba_2026_roster_source import (
    NBA_IDS, fetch_roster, extract_roster, verify_season_snapshot,
)

SCHEMA="NBA_2026_27_V2_FIRST_SEEN_PLAYER_RESEARCH_V1"
PREVIOUS_HISTORY_START=dt.date(2026,3,1)
PREVIOUS_HISTORY_END=dt.date(2026,4,12)
SEASON_YEAR=2026
HISTORY_GAMES_PER_TEAM=18
MIN_VALID_BOXSCORE_COVERAGE=.95

def select_history(games, per_team=HISTORY_GAMES_PER_TEAM):
    """Select last N genuinely completed previous-season games per team."""
    if not 5<=per_team<=35:raise ValueError("NBA_PREVIOUS_GAME_WINDOW_OUT_OF_BOUNDS")
    teams=collections.defaultdict(list)
    for g in sorted(games,key=lambda x:(x["start_utc"],x["game_id"])):
        if not g.get("completed") or datetime_utc(g["start_utc"]).year>=SEASON_YEAR+1:
            continue
        if g["start_utc"]>"2026-05-01":
            continue
        for t in (g["home_id"],g["away_id"]):
            if t not in NBA_IDS:raise ValueError("NBA_NON_FRANCHISE_HISTORICAL_GAME")
            teams[t].append(g)
    if set(teams)!=set(NBA_IDS):
        raise ValueError("NBA_PREVIOUS_TEAM_HISTORY_NOT_ALL_30")
    selected={}
    for tid,seq in teams.items():
        if len(seq)<12:raise ValueError(f"NBA_NOT_ENOUGH_PREVIOUS_GAMES_{tid}")
        for g in seq[-per_team:]:
            if g["game_id"] in selected and selected[g["game_id"]]!=g:
                raise ValueError("NBA_HISTORICAL_GAME_CONFLICT")
            selected[g["game_id"]]=g
    result=sorted(selected.values(),key=lambda g:(g["start_utc"],g["game_id"]))
    return result,{t:len(seq[-per_team:]) for t,seq in teams.items()}

def live_rosters(fetcher=fetch_roster,now=None):
    """Independent roster membership with per-team source SHA/time receipts."""
    now=now or dt.datetime.now(UTC)
    if now.tzinfo is None:raise ValueError("NBA_NAIVE_CURRENT_ROSTER_CAPTURE")
    rosters={};receipts={}
    # This intentionally fails CLOSED; no unavailable roster implies an active
    # player and no 29/30 partial result is quietly published as complete.
    import concurrent.futures
    def get(t):
        url,raw=fetcher(t)
        result=extract_roster(json.loads(raw),t)
        return t,result,{"url":url,
            "sha256":hashlib.sha256(raw).hexdigest(),
            "retrieved_at_utc":dt.datetime.now(UTC).isoformat(),
            "players":len(result)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for tid,players,receipt in pool.map(get,NBA_IDS):
            rosters[tid]=players;receipts[tid]=receipt
    if len(rosters)!=30:raise ValueError("NBA_INCOMPLETE_LIVE_ROSTERS")
    return rosters,receipts

def compile_histories(previous,boxes):
    """Prior season team-game index, never current game's own statistics."""
    hist=collections.defaultdict(list)
    games=collections.Counter()
    first_seen={}
    last_seen={}
    all_prior_ids=set()
    for g in previous:
        if g["game_id"] not in boxes: # source unavailable; team-game counts still advance
            for tid in (g["home_id"],g["away_id"]):games[tid]+=1
            continue
        seen=set()
        for p in boxes[g["game_id"]]:
            tid,pid=p["team_id"],p["player_id"]
            if tid not in (g["home_id"],g["away_id"]):
                raise ValueError("NBA_PLAYER_ON_WRONG_HISTORICAL_TEAM")
            key=(tid,pid)
            if key in seen:raise ValueError("NBA_DUPLICATE_PRIOR_GAME_PLAYER")
            seen.add(key)
            idx=games[tid]
            if key not in first_seen:first_seen[key]=idx
            hist[key].append({**p,"team_game_index":idx})
            last_seen[key]=idx
            all_prior_ids.add(pid)
        for tid in (g["home_id"],g["away_id"]):games[tid]+=1
    return hist,games,first_seen,last_seen,all_prior_ids

def player_forecast(frozen_team, roster_ids, game, generation_time,roster_time):
    """Membership-gated original forecast with immutable numeric model outputs."""
    accepted=[];missing=[]
    for player in frozen_team["players"]:
        if player["player_id"] not in roster_ids:
            continue
        if player["research_only"] is not True or player["starter_certified"] is not False:
            raise ValueError("NBA_V2_PLAYER_BETTING_BOUNDARY_CONFLICT")
        raw=dict(player)
        raw.update({
            "game_id":game["game_id"],
            "tipoff_utc":game["tipoff_utc"],
            "forecast_generated_at_utc":generation_time,
            "current_roster_retrieved_at_utc":roster_time,
            "offseason_transfer_or_rookie_history_unknown":False,
            "official_injury_certified":False,
            "game_day_active_certified":False,
            "starting_lineup_certified":False,
            "stat_market_lines":None,
            "model_target_probabilities":None,
            "official_pick":False,
            "first_seen_research":True,
            "predictions":raw.pop("conditional_stat_means"),
        })
        raw["forecast_id"]=hashlib.sha256(
            (str(game["game_id"])+"|"+str(player["team_id"])+"|"+
            str(player["player_id"])+"|"+VERSION+"|"+generation_time).encode()
        ).hexdigest()
        accepted.append(raw)
    missing=[r for r in roster_ids if r not in {x["player_id"] for x in accepted}]
    return sorted(accepted,key=lambda p:(-p["conditional_minutes_mean"],p["player_id"])),missing

def build_forecasts(fixtures,rosters,receipts,previous,boxes,asof,
                    history_receipt=None,failed=None):
    """No futures accepted after tip; exact saved fixture identity."""
    if asof.tzinfo is None:raise ValueError("NBA_FIRST_SEEN_NAIVE_ASOF")
    if fixtures.get("schema")!="NBA_V1_2026_OPENING_ROSTER_BLIND_RESEARCH_V1":
        raise ValueError("NBA_UNKNOWN_ORIGINAL_OPENING_SCHEDULE")
    if fixtures.get("official_wagers")!=0 or fixtures.get("research_only") is not True:
        raise ValueError("NBA_FORGED_OFFICIAL_OPENING_PREVIEW")
    if not isinstance(fixtures.get("forecasts"),list) or len(fixtures["forecasts"])!=14:
        raise ValueError("NBA_ORIGINAL_FROZEN_FIXTURE_COUNT_MISMATCH")
    fixture_created=datetime_utc(fixtures["generated_at_utc"])
    if fixture_created>asof:raise ValueError("NBA_ORIGINAL_FIXTURE_FROM_FUTURE")
    verify_season_snapshot(rosters,fixtures)
    if set(receipts)!=set(NBA_IDS):
        raise ValueError("NBA_NOT_ALL_ROSTER_RECEIPTS")
    if any(datetime_utc(z["retrieved_at_utc"])>asof for z in receipts.values()):
        raise ValueError("NBA_SOURCE_CAPTURE_AFTER_ASOF")
    if not previous or not boxes:
        raise ValueError("NBA_MISSING_REAL_PRIOR_STATS")
    if len(boxes)/len(previous)<MIN_VALID_BOXSCORE_COVERAGE:
        raise ValueError(f"NBA_COMPLETED_BOXSCORE_COVERAGE_FAIL_{len(boxes)}_{len(previous)}")
    latest=max(datetime_utc(g["start_utc"]) for g in previous)
    if latest>=asof:raise ValueError("NBA_HISTORICAL_GAME_NOT_STRICTLY_BEFORE_ASOF")
    hist,games,first,last,prior_ids=compile_histories(previous,boxes)
    original=[]
    total_new=0;unmodeled=[]
    for f in sorted(fixtures["forecasts"],key=lambda x:x["tipoff_utc"]):
        kickoff=datetime_utc(f["tipoff_utc"])
        if kickoff<=asof:
            unmodeled.append({"game_id":f["game_id"],"tipoff_utc":f["tipoff_utc"],
                "reason":"PREGAME_WINDOW_ALREADY_PASSED_NO_RETROACTIVE_PREDICTIONS"})
            continue
        if kickoff<=fixture_created:
            raise ValueError("NBA_ORIGINAL_FIXTURE_GENERATED_AFTER_TIP")
        team_rows=[];no_hist=[]
        for tid in (f["away_id"],f["home_id"]):
            current_ids={x["player_id"] for x in rosters[tid]}
            team_hist={k:v for k,v in hist.items() if k[0]==tid and k[1] in current_ids}
            team_forecast=team_forecasts(tid,team_hist,games,first,last)
            ps,missing=player_forecast(team_forecast,current_ids,f,asof.isoformat(),
                receipts[tid]["retrieved_at_utc"])
            team_rows.extend(ps)
            no_hist.extend({"team_id":tid,"player_id":pid,
                    "reason":"CURRENT_ESPN_ROSTER_MEMBER_BUT_NO_QUALIFIED_PRIOR_SAME_TEAM_ROTATION"}
                    for pid in sorted(missing))
        if len({r["forecast_id"] for r in team_rows})!=len(team_rows):
            raise ValueError("NBA_FIRST_SEEN_FORECAST_ID_COLLISION")
        original.append({
            "game_id":f["game_id"],"home":f["home"],"away":f["away"],
            "home_id":f["home_id"],"away_id":f["away_id"],
            "tipoff_utc":f["tipoff_utc"],"players":team_rows,
            "player_predictions_count":len(team_rows)*len(MARKETS),
            "roster_players_without_model_forecast":no_hist,
            "roster_membership_certified_by_espn":True,
            "game_day_active_and_injury_certified":False,
            "no_wagers":True})
        total_new+=len(team_rows)*len(MARKETS)
    # Fail closed if the whole live capture failed, rather than reporting
    # a seemingly valid player model with zero real player predictions.
    if not original or total_new<=0:
        raise ValueError("NBA_NO_PREGAME_PLAYER_RESEARCH_ELIGIBLE")
    source_games=[{"game_id":g["game_id"],"tipoff":g["start_utc"]}
                  for g in previous]
    return {
        "schema":SCHEMA,"generated_at_utc":asof.isoformat(),
        "model_version":VERSION,"prior_season_source":"2025-26 ESPN FINAL player boxes",
        "current_season":"2026-27","previous_season_games_replayed":len(previous),
        "verified_previous_season_full_boxscores":len(boxes),
        "previous_season_boxscores_missing":failed or {},
        "historical_source":history_receipt or {},
        "history_game_identity_sha256":hashlib.sha256(
            json.dumps(source_games,sort_keys=True).encode()).hexdigest(),
        "source_roster_count":sum(map(len,rosters.values())),
        "source_roster_receipts":receipts,
        "fixture_research_generated_at_utc":fixtures["generated_at_utc"],
        "source_previous_season_transfer_contamination_risk":True,
        "game_roster_active_injury_starter_status_unknown":True,
        "conditional_historical_role_not_calibrated_for_2026_27_yet":True,
        "complete_team_rotation_and_roster_coverage_not_guaranteed":True,
        "games_forecast":len(original),"games_skipped_after_tip":unmodeled,
        "number_of_player_stat_predictions":total_new,
        "forecasts":original,
        "research_only":True,"official_bets":0,
        "no_sportsbook_pricing_or_Kelly":True,
        "warning":"Frozen actual previous-season NBA played-player history (recent spring sample); "
                  "ESPN current-season team membership is not a pregame dressed or injury report. "
                  "2026-27 role changes, transfers, rookies and minutes restrictions unknown. "
                  "All PTS/REB/AST/3PM figures are conditional on player participation and "
                  "not official bookmaker player props. No estimated profit."
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--fixtures",type=Path,default=Path("docs/nba_v1_opening_week_research.json"))
    p.add_argument("--cache",type=Path,default=Path(".cache/nba-opening-player-source"))
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--per-team-games",type=int,default=HISTORY_GAMES_PER_TEAM)
    a=p.parse_args()
    if a.out.exists():
        raise ValueError("NBA_FIRST_SEEN_FORECAST_ALREADY_EXISTS_NEVER_OVERWRITE")
    fixtures=json.loads(a.fixtures.read_text())
    history,history_receipt=ingest(PREVIOUS_HISTORY_START,PREVIOUS_HISTORY_END,
                                   a.cache/"scoreboards")
    selected,counts=select_history(history,a.per_team_games)
    boxes,failed=load_games(selected,a.cache/"game-summaries",workers=5)
    rosters,receipts=live_rosters()
    now=dt.datetime.now(UTC)
    result=build_forecasts(fixtures,rosters,receipts,selected,boxes,now,
       history_receipt={**history_receipt,"selected_prior_games":len(selected),
           "by_team_historical_game_counts":counts},
       failed=failed)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(result,indent=2,sort_keys=True,allow_nan=False)+"\n")
    print("NBA_V2_REAL_FORWARD_FIRST_SEEN_PREGAME",json.dumps({
       "games":result["games_forecast"],
       "stats":result["number_of_player_stat_predictions"],
       "previous_game_boxes":result["verified_previous_season_full_boxscores"],
       "roster_players":result["source_roster_count"],
       "source_games":result["previous_season_games_replayed"],
       "game_skipped_after_tip":len(result["games_skipped_after_tip"]),
       "official_bets":result["official_bets"]
    },sort_keys=True))

if __name__=="__main__":main()
