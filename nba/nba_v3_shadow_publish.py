#!/usr/bin/env python3
"""NBA V3 first-seen rolling SHADOW forecast publisher (NOT a promoted champion).

Runs independently of NBA V2, never edits its historical/numerical artifacts.
Consumes only independently captured ESPN forward fixtures, current roster,
independently reported injuries and real prior completed ESPN player boxes.
Each game is snapshotted once before the first tipoff. All four model outcome
distributions are saved even when no player meets the 65% display criterion.

Only *future* graded V3-original snapshots can validate V3 probability
calibration. Reconstructing from 2025–26 previous holdout is research, never
proof of genuine current-season prospective calibration.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
from collections import defaultdict
from pathlib import Path
from nba.nba_v1_team_model import UTC,datetime_utc
from nba.nba_2026_roster_source import NBA_IDS
from nba.nba_v2_firstseen_player_opening import live_rosters,compile_histories
from nba.nba_v2_rolling_predictions import (
    validate_fixture_source,select_recent_games,collect,
    _source_rosters,MIN_PREGAME_GAP
)
from nba.nba_live_injury_source import validate as verify_injuries
from nba.nba_v3_daily_roster import collect as collect_official_daily_rosters, supplement as supplement_daily_roster
from nba.nba_v3_phase1_engine import (
    VERSION,SCHEMA,role_pool,simulate_matchup,source_hash,TEAM_MINUTES
)

ROOT="docs/nba_v3_phase1_corrected_shadow"
PUBLISH_SCHEMA="NBA_V3_2026_27_FIRSTSEEN_FULL_DISTRIBUTION_SHADOW_V1"

def already_seen(folder:Path):
    seen=set()
    for filepath in sorted(folder.glob("*.json")):
        doc=json.loads(filepath.read_text())
        if doc.get("schema")!=PUBLISH_SCHEMA or doc.get("official_bets")!=0:
            raise ValueError("NBA_V3_UNTRUSTED_OR_REWRITTEN_HISTORICAL_SHADOW")
        for game in doc["games"]:
            gid=game["game_id"]
            if gid in seen:raise ValueError("NBA_V3_MULTIPLE_FIRSTSEEN_VERSIONS")
            seen.add(gid)
    return seen

def historically_observed_pace(games,boxes,team_ids):
    """Real possession inputs only: FGA + .44 FTA - OREB + TO per team-game.

    All source games MUST be earlier than simulation as-of (caller validates).
    Missing optional ESPN fields mean NO pace adjustment.
    """
    byteam=defaultdict(list)
    for game in games:
        if game["game_id"] not in boxes:continue
        for tid in (game["home_id"],game["away_id"]):
            if tid not in team_ids:continue
            group=[p for p in boxes[game["game_id"]] if p["team_id"]==tid]
            if len(group)<5 or any(any(field not in p for field in
                 ("field_goal_attempts","free_throw_attempts",
                  "offensive_rebounds","turnovers")) for p in group):
                continue
            attempts=sum(p["field_goal_attempts"] for p in group)
            fta=sum(p["free_throw_attempts"] for p in group)
            off=sum(p["offensive_rebounds"] for p in group)
            tov=sum(p["turnovers"] for p in group)
            possessions=attempts+.44*fta-off+tov
            if not 75<=possessions<=135:continue
            byteam[tid].append(possessions)
    return {tid:{
        "prior_games":len(byteam[tid][-8:]),
        "prior_possessions_mean":round(
           sum(byteam[tid][-8:])/len(byteam[tid][-8:]),5)
           if byteam[tid] else None,
        "verified_source":"PREGAME_PRIOR_ESPN_FGA_FTA_OREB_TO"
           if len(byteam[tid])>=6 else "INSUFFICIENT_ATOMIC_OPPORTUNITY_FIELDS"}
           for tid in team_ids}

def build(fixtures,rosters,receipts,games,boxes,asof,seen,
          injury_snapshot=None,draws=8000,daily_roster_snapshot=None):
    validate_fixture_source(fixtures,asof)
    _source_rosters(rosters,receipts,asof)
    if injury_snapshot:verify_injuries(injury_snapshot,asof)
    if games:
        if len(boxes)/len(games)<.95:
            raise ValueError("NBA_V3_SOURCE_BOX_COMPLETENESS_BELOW_95_PCT")
    else:raise ValueError("NBA_V3_NO_HISTORICAL_OPPORTUNITY_GAMES")
    if any(not g["completed"] or datetime_utc(g["start_utc"])>=asof
           for g in games):
        raise ValueError("NBA_V3_FUTURE_POSTTIP_BOXSCORE_LEAKAGE")
    histories,team_games,first,last,_=compile_histories(games,boxes)
    injury_by_team=defaultdict(list)
    for entry in (injury_snapshot or {}).get("injuries",[]):
        if entry["source_reported_status"]!="OUT":continue
        injury_by_team[entry["team_id"]].append({
          "team_id":entry["team_id"],"player_id":entry["player_id"],
          "status":"OUT","independently_verified":True,
          "source_url":injury_snapshot["source_url"],
          "published_at_utc":injury_snapshot["captured_at_utc"]})
    projected=[];skipped=[]
    for g in sorted(fixtures["games"],key=lambda x:(x["tipoff_utc"],x["game_id"])):
        gid=g["game_id"];tip=datetime_utc(g["tipoff_utc"])
        if gid in seen:
            skipped.append({"game_id":gid,"reason":"FIRSTSEEN_V3_ARCHIVE_EXISTS"});continue
        if tip-asof<MIN_PREGAME_GAP:
            skipped.append({"game_id":gid,"reason":"NBA_V3_STRICT_15M_ORIGINAL_CUTOFF"});continue
        # This NBA daily feed was ACTUALLY observed before tipoff. It
        # corroborates current team membership when ESPN's roster omits a
        # historically verified player. Expected is not confirmed ACTIVE.
        supplemental, nba_active, roster_audit = supplement_daily_roster(
            g,rosters,histories,daily_roster_snapshot,asof)
        teams={}
        for tid in (g["away_id"],g["home_id"]):
            roster=supplemental[str(tid)]
            # Include proven old-team played histories for CURRENT roster
            # members; the V3 role model conservatively chooses exactly one
            # source team and does not create fictitious new-team appearances.
            subset={k:v for k,v in histories.items() if k[1] in roster}
            statuses=[x for x in injury_by_team[tid] if x["player_id"] in roster]
            for officially_confirmed in nba_active[str(tid)]:
                # A genuine five-starter NBA confirmation is newer and more
                # specific than a stale ESPN OUT report for the same person.
                statuses=[x for x in statuses if x["player_id"] != officially_confirmed["player_id"]]
                statuses.append(officially_confirmed)
            teams[tid]=role_pool(tid,subset,team_games,first,last,roster,
                asof_utc=asof.isoformat(),tipoff_utc=g["tipoff_utc"],
                statuses=statuses)
        pace=historically_observed_pace(games,boxes,(g["away_id"],g["home_id"]))
        mc=simulate_matchup(gid,teams,
                asof_utc=asof.isoformat(),tipoff_utc=g["tipoff_utc"],
                draws=draws,pace_context=pace)
        if not mc["rows"]:
            skipped.append({"game_id":gid,"reason":"NO_PLAYER_WITH_SOURCE_VERIFIED_PAST_GAME_HISTORY"});continue
        projected.append({
            "game_id":gid,"away_id":g["away_id"],"home_id":g["home_id"],
            "away":g["away"],"home":g["home"],"tipoff_utc":g["tipoff_utc"],
            "forecast_at_utc":asof.isoformat(),
            "source_opportunity_history_ends_before_forecast":True,
            "roster_receipt_sha256":{
                t:receipts[t]["sha256"] for t in (g["home_id"],g["away_id"])},
            "nba_daily_roster_bridge_audit":roster_audit,
            "source_opportunity_pace":pace,
            "injury_source_is_not_active_roster_certification":True,
            **mc
        })
    result={
        "schema":PUBLISH_SCHEMA,"generated_at_utc":asof.isoformat(),
        "model_version":VERSION,"current_season":"2026-27",
        "model_promoted":False,"live_nba_system_board_changed":False,
        "research_only":True,"no_sportsbook_lines_needed":True,
        "official_bets":0,"games_forecast":len(projected),
        "stat_distributions_saved":sum(g["rows_count"] for g in projected),
        "games":projected,"skipped":skipped,
        "upstream_fixtures_source_sha256":source_hash(fixtures),
        "prior_game_id_sha256":source_hash([
            {"id":x["game_id"],"start":x["start_utc"]} for x in games]),
        "historical_source_games":len(games),
        "historical_source_boxes":len(boxes),
        "roster_sources_verified_all_30":True,
        "injury_source_sha256":(injury_snapshot or {}).get("source_sha256"),
        "injury_source_nonofficial":True,
        "requires_new_prospective_honest_probability_validation":True,
        "no_lookahead_or_retrospective_backfill":True,
        "note":"NBA V3 firstseen shadow. Player and team opportunity full-game Monte Carlo, original source hash receipt, independent historical data only. No bookmaker required; probabilities not validated for 2026-27, not live betting picks."
    }
    return result


def narrow_to_pregame_window(fixtures, asof, hours):
    """Only refresh matches in the announced pregame horizon.

    Fixture retrieval covers two calendar days to catch schedule changes;
    it is not permission to rerun expensive V3/V4/V5 projections for all
    48 hours when just one team is approaching tipoff. The pure filter is
    intentionally separate from lineup/roster evidence collection. When
    hours is None, legacy first-seen full-slate behavior is preserved.
    """
    if hours is None:
        return fixtures
    if not 0 < float(hours) <= 48:
        raise ValueError("NBA_V3_INVALID_PREGAME_WINDOW_HOURS")
    if asof.tzinfo is None:
        raise ValueError("NBA_V3_NAIVE_PREGAME_WINDOW_CLOCK")
    horizon=dt.timedelta(hours=float(hours))
    selected=[]
    for game in fixtures.get("games", []):
        delta=datetime_utc(game["tipoff_utc"])-asof
        if MIN_PREGAME_GAP <= delta <= horizon:
            selected.append(game)
    # Maintain the source schema's exact game-count invariant. Preserve an
    # explicit receipt of the independently validated original slate so a
    # derived near-tip slice cannot masquerade as the full ESPN response.
    return {**fixtures, "games":selected, "future_games":len(selected),
            "original_fixture_source_sha256":source_hash(fixtures),
            "original_fixture_future_games":len(fixtures.get("games", [])),
            "forecast_window_hours":float(hours)}



def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--fixture",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    parser.add_argument("--history-cache",type=Path,default=Path(".cache/nba-v3-phase1"))
    parser.add_argument("--archive-root",type=Path,default=Path(ROOT))
    parser.add_argument("--injury-snapshot",type=Path)
    parser.add_argument("--draws",type=int,default=8000)
    parser.add_argument("--window-hours",type=float,default=None,help="Optional strict near-tip horizon to avoid re-simulating the entire two-day fixture slate")
    parser.add_argument("--no-daily-roster-bridge",action="store_true",help="Disable optional independently observed NBA pretip roster corroboration")
    args=parser.parse_args()
    if args.out.exists():raise ValueError("NBA_V3_PRETIP_SHADOW_FILE_ALREADY_EXISTS")
    asof=dt.datetime.now(UTC)
    fixture=json.loads(args.fixture.read_text())
    validate_fixture_source(fixture,asof)
    fixture=narrow_to_pregame_window(fixture,asof,args.window_hours)
    if not fixture["games"]:
        print("NBA_V3_NO_FIXTURES_INSIDE_PREGAME_WINDOW",flush=True)
        return
    seen=already_seen(args.archive_root)
    upcoming=[x for x in fixture["games"] if
      x["game_id"] not in seen and
      datetime_utc(x["tipoff_utc"])-asof>=MIN_PREGAME_GAP]
    if not upcoming:
        print("NBA_V3_NO_NEW_GAME_NEEDS_FROZEN_SHADOW",flush=True)
        return
    games,boxes,meta,missing=collect(asof.date(),args.history_cache,
        asof_utc=asof)
    rosters,receipts=live_rosters()
    # Fetch before the V3 player pool is assembled, not after V3 has
    # already filtered out players missing from ESPN's roster.
    daily_roster_snapshot=(None if args.no_daily_roster_bridge else
                           collect_official_daily_rosters(fixture))
    newer=dt.datetime.now(UTC)
    injuries=(json.loads(args.injury_snapshot.read_text())
              if args.injury_snapshot and args.injury_snapshot.is_file() else None)
    doc=build(fixture,rosters,receipts,games,boxes,newer,seen,
              injury_snapshot=injuries,draws=args.draws,
              daily_roster_snapshot=daily_roster_snapshot)
    if doc["games_forecast"]:
        args.out.parent.mkdir(parents=True,exist_ok=True)
        args.out.write_text(json.dumps(doc,indent=2,sort_keys=True,allow_nan=False)+"\n")
    print("NBA_V3_PHASE1_FIRSTSEEN_PREGAME_SHADOW",json.dumps({
        "games":doc["games_forecast"],"player_market_distributions":
        doc["stat_distributions_saved"],"model_promoted":False,
        "asof_utc":doc["generated_at_utc"],"official_bets":0}),flush=True)

if __name__=="__main__":main()
