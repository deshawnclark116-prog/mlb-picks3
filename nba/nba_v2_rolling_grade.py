#!/usr/bin/env python3
"""Grade EVERY saved ORIGINAL rolling NBA V2 player forecast from real final games.

The 14 opening fixtures are graded by the frozen October 20 original grader.
This grader handles only new append-only future games, never regenerating
old V2 projections after tipoff. Every first-seen player and each of its
four conditional stats is accounted as VERIFIED, DID_NOT_PLAY, or UNVERIFIED.

There are no sportsbook lines, invented +/-0.5 outcomes or bettor ROI.
"""
from __future__ import annotations
import argparse
import collections
import datetime as dt
import hashlib
import json
import math
import statistics
from pathlib import Path
from zoneinfo import ZoneInfo
from nba.nba_v1_team_model import extract_events,get_scoreboard,datetime_utc,UTC
from nba.nba_v1_player_model import parse_final_boxscore,fetch_summary
from nba.nba_v2_rolling_predictions import SCHEMA as SOURCE_SCHEMA
from nba.nba_v2_rotation_research import VERSION,MARKETS

SCHEMA="NBA_V2_ALL_IMMUTABLE_ROLLING_PLAYER_STATS_ACTUAL_GRADES_V1"
STATS=tuple(MARKETS)

def _sha(data):
    return hashlib.sha256(json.dumps(data,sort_keys=True,
                        separators=(",",":"),allow_nan=False).encode()).hexdigest()

def load_original_forecasts(root:Path):
    """Validate original player/team/source relationships BEFORE looking at outcomes."""
    games={};files={}
    for file in sorted(Path(root).glob("*.json")):
        if not file.stem.startswith("20"):continue
        doc=json.loads(file.read_text())
        if (doc.get("schema")!=SOURCE_SCHEMA or doc.get("model_version")!=VERSION or
            doc.get("research_only") is not True or doc.get("official_bets")!=0 or
            doc.get("no_sportsbook_pricing_or_Kelly") is not True or
            doc.get("game_roster_active_injury_starter_status_unknown") is not True):
            raise ValueError("NBA_ORIGINAL_ROLLING_SOURCE_CONTRACT_VIOLATION "+file.name)
        if not isinstance(doc.get("forecasts"),list) or len(doc["forecasts"])!=doc.get("games_forecast"):
            raise ValueError("NBA_ARCHIVED_ROLLING_GAME_COUNT_WRONG")
        if doc.get("number_of_player_stat_predictions")!=sum(
            len(g["players"])*4 for g in doc["forecasts"]):
            raise ValueError("NBA_ARCHIVED_ORIGINAL_STAT_COUNT_WRONG")
        saved=datetime_utc(doc["generated_at_utc"])
        if doc.get("source_roster_count",0)<200 or not doc.get("fixture_source_sha256"):
            raise ValueError("NBA_ROLLING_ORIGINAL_LACKS_PRIOR_SOURCE_PROOF")
        ids=set()
        for g in doc["forecasts"]:
            gid=str(g["game_id"])
            tip=datetime_utc(g["tipoff_utc"])
            if (gid in games or tip<=saved or
                g["away_id"]==g["home_id"] or
                g.get("no_wagers") is not True or
                g.get("game_day_active_and_injury_certified") is not False or
                g.get("player_predictions_count")!=4*len(g["players"])):
                raise ValueError("NBA_DUPLICATE_OR_POSTTIP_OR_FALSE_ORIGINAL_GAME")
            players=set()
            for p in g["players"]:
                identity=(p["team_id"],p["player_id"])
                if (identity in players or p["forecast_id"] in ids or
                    p.get("game_id")!=gid or p.get("tipoff_utc")!=g["tipoff_utc"] or
                    datetime_utc(p["forecast_generated_at_utc"])!=saved or
                    p.get("team_id") not in (g["away_id"],g["home_id"]) or
                    p.get("research_only") is not True or
                    p.get("official_pick") is not False or
                    p.get("stat_market_lines") is not None or
                    p.get("game_day_active_certified") is not False or
                    p.get("starter_certified") is not False or
                    set(p["predictions"])!=set(STATS) or
                    not 0<=p["p_play_unverified"]<=1 or
                    any(not isinstance(v,(int,float)) or not math.isfinite(v) or v<0
                        for v in p["predictions"].values())):
                    raise ValueError("NBA_INVALID_FIRST_SEEN_PLAYER_SOURCE")
                players.add(identity)
                ids.add(p["forecast_id"])
            games[gid]={**g,"first_seen_at_utc":doc["generated_at_utc"],
                "model_version":doc["model_version"],
                "fixture_source_sha256":doc["fixture_source_sha256"]}
            files[gid]=file.name
    return games,files

def capture_verified_actuals(originals,now,fetch_board=get_scoreboard,
                            fetch_box=fetch_summary):
    """Only ESPN completed scores and complete independent two-team final boxes."""
    date_games=collections.defaultdict(set)
    for gid,g in originals.items():
        tip=datetime_utc(g["tipoff_utc"])
        # ESPN dates are Eastern game dates; UTC-day can differ for night games.
        date_games[tip.astimezone(ZoneInfo("America/New_York")).date()].add(gid)
        date_games[tip.date()].add(gid)
    final={};boxes={};source={"scoreboards":{},"boxes":{},"errors":{}}
    for day,gids in sorted(date_games.items()):
        label=day.isoformat()
        try:
            observed_date,raw=fetch_board(day)
            if observed_date!=label:
                raise ValueError("NBA_ESPN_SCOREBOARD_WRONG_REQUESTED_DATE")
            source["scoreboards"][label]={
                "sha256":_sha(raw),"retrieved_at_utc":now.isoformat()}
            for ev in extract_events(raw):
                gid=ev["game_id"]
                if gid not in originals:continue
                orig=originals[gid]
                if (ev["home_id"]!=orig["home_id"] or
                    ev["away_id"]!=orig["away_id"]):
                    raise ValueError("NBA_ORIGINAL_GAME_TEAM_ID_CHANGED_IN_FINAL_SOURCE")
                if ev["completed"] and datetime_utc(ev["start_utc"])>now:
                    raise ValueError("NBA_FUTURE_COMPLETED_GAME_FABRICATED")
                if gid in final and final[gid]!=ev:
                    raise ValueError("NBA_CONFLICTING_FINAL_GAME_SOURCES")
                final[gid]=ev
        except (OSError,ValueError,KeyError,TypeError,RuntimeError) as exc:
            source["errors"]["DATE_"+label]={"reason":type(exc).__name__,
                                              "detail":str(exc)[:180]}
    for gid,g in sorted(final.items()):
        if not g["completed"]:continue
        try:
            raw=fetch_box(gid)
            players,audit=parse_final_boxscore(raw,gid,(g["home_id"],g["away_id"]))
            if (len(players)<10 or {p["team_id"] for p in players}!={g["home_id"],g["away_id"]}):
                raise ValueError("NBA_FINAL_PLAYER_BOX_NOT_BOTH_TEAMS")
            boxes[gid]=players
            source["boxes"][gid]={"sha256":_sha(raw),
                "retrieved_at_utc":now.isoformat(),
                "actual_source":"ESPN_FINAL_BOTH_TEAM_PLAYER_STATS",
                "played_players":len(players),"dnp_reported":audit["missing_dnp"]}
        except (OSError,ValueError,KeyError,TypeError,RuntimeError) as exc:
            source["errors"][gid]={"reason":type(exc).__name__,
                                     "detail":str(exc)[:180]}
    return final,boxes,source

def _metric(nums):
    return {"n":len(nums),"mae":round(statistics.mean(nums),4) if nums else None}

def grade_originals(originals,finals,boxes,receipt,now):
    if now.tzinfo is None:raise ValueError("NBA_POSTGAME_GRADE_CLOCK_NAIVE")
    if len(set(originals))!=len(originals):raise ValueError("NBA_DUPLICATE_ARCHIVED_GAME_ID")
    rows=[];games=[]
    for gid,g in sorted(originals.items(),key=lambda kv:kv[1]["tipoff_utc"]):
        final=finals.get(gid)
        if final and (final["away_id"]!=g["away_id"] or
                      final["home_id"]!=g["home_id"]):
            raise ValueError("NBA_MISMATCH_FINAL_GAME_TEAMS")
        verified=bool(final and final["completed"] and final.get("home_points") is not None
                     and final.get("away_points") is not None)
        if verified and datetime_utc(final["start_utc"])>now:
            raise ValueError("NBA_FUTURE_LEAKED_FINAL_RESULT")
        raw_box=boxes.get(gid)
        if raw_box is not None and not verified:
            raise ValueError("NBA_PLAYER_BOX_EXISTS_FOR_NONFINAL_GAME")
        if raw_box is not None:
            m=(receipt.get("boxes") or {}).get(gid,{})
            if (m.get("actual_source")!="ESPN_FINAL_BOTH_TEAM_PLAYER_STATS" or
                m.get("played_players")!=len(raw_box) or len(raw_box)<10 or
                {x["team_id"] for x in raw_box}!={g["home_id"],g["away_id"]}):
                raise ValueError("NBA_UNVERIFIED_2_TEAM_BOX_SOURCE")
        byid={}
        for actual in raw_box or []:
            k=(actual["team_id"],actual["player_id"])
            if k in byid:raise ValueError("NBA_ACTUAL_PLAYER_DUPLICATE")
            byid[k]=actual
        actual_ready=verified and raw_box is not None
        counts=collections.Counter()
        for p in g["players"]:
            actual=byid.get((p["team_id"],p["player_id"])) if actual_ready else None
            played=actual is not None if actual_ready else None
            srow={}
            for market in STATS:
                before=float(p["predictions"][market])
                observed=float(actual[market]) if actual else None
                srow[market]={
                    "original_prediction_if_played":before,
                    "verified_actual_if_played":observed,
                    "abs_error":round(abs(before-observed),4) if observed is not None else None,
                    "status":("VERIFIED_PLAYED_STAT" if observed is not None else
                              "ORIGINAL_PLAYER_DID_NOT_PLAY_CONDITIONAL_STAT_NOT_APPLICABLE"
                              if actual_ready else "WAITING_FOR_VERIFIED_FINAL_BOX")}
                if observed is not None:counts[market+"_VERIFIED"]+=1
            status=("VERIFIED_PLAYED" if actual is not None else
                    "VERIFIED_DID_NOT_PLAY" if actual_ready else
                    "WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX")
            counts[status]+=1
            brier=(round((p["p_play_unverified"]-float(played))**2,6)
                    if played is not None else None)
            rows.append({
                "forecast_id":p["forecast_id"],"game_id":gid,
                "player_id":p["player_id"],"team_id":p["team_id"],
                "player":p["player"],"tipoff_original_utc":g["tipoff_utc"],
                "saved_original_utc":g["first_seen_at_utc"],
                "original_model_version":g["model_version"],
                "original_play_probability":p["p_play_unverified"],
                "observed_played":played,"playing_brier":brier,
                "original_conditional_minutes":p["conditional_minutes_mean"],
                "original_unconditional_minutes":p["expected_minutes"],
                "actual_minutes":actual["minutes"] if actual else
                                  0 if actual_ready else None,
                "minutes_error_if_played":round(abs(p["conditional_minutes_mean"]-
                                                  actual["minutes"]),4) if actual else None,
                "minutes_error_unconditional":round(abs(p["expected_minutes"]-
                    (actual["minutes"] if actual else 0)),4) if actual_ready else None,
                "stats":srow,"status":status})
        games.append({
            "game_id":gid,"away":g["away"],"home":g["home"],
            "tipoff_original_utc":g["tipoff_utc"],
            "final_complete":verified,
            "final_away_points":final.get("away_points") if verified else None,
            "final_home_points":final.get("home_points") if verified else None,
            "box_verified":actual_ready,
            "original_player_forecasts":len(g["players"]),
            "stat_forecasts_accounted":len(g["players"])*len(STATS),
            "player_status_counts":dict(counts),
            "source_error":(receipt.get("errors") or {}).get(gid),
            "original_unmodeled_roster_players":len(
                g["roster_players_without_model_forecast"])})
    if sum(g["original_player_forecasts"] for g in games)!=len(rows):
        raise AssertionError("NBA_ORIGINAL_PLAYER_GRADING_COVERAGE_MISMATCH")
    all_stats=len(rows)*len(STATS)
    verified_stats=sum(r["stats"][s]["status"]=="VERIFIED_PLAYED_STAT"
                       for r in rows for s in STATS)
    no_play_stats=sum(r["stats"][s]["status"]==
           "ORIGINAL_PLAYER_DID_NOT_PLAY_CONDITIONAL_STAT_NOT_APPLICABLE"
                       for r in rows for s in STATS)
    unknown_stats=all_stats-verified_stats-no_play_stats
    if verified_stats+no_play_stats+unknown_stats!=all_stats:
        raise AssertionError("NBA_ORIGINAL_STAT_ROW_LOSS")
    return {
        "schema":SCHEMA,"graded_at_utc":now.astimezone(UTC).isoformat(),
        "original_rolling_games":len(originals),
        "original_player_forecasts":len(rows),
        "all_original_four_market_stat_forecasts_accounted":all_stats,
        "verified_played_stat_outcomes":verified_stats,
        "verified_DNP_conditional_stats_not_applicable":no_play_stats,
        "unverified_conditional_stats":unknown_stats,
        "player_status_verified":sum(r["observed_played"] is not None for r in rows),
        "player_status_unverified":sum(r["observed_played"] is None for r in rows),
        "play_probability_brier":_metric([r["playing_brier"] for r in rows
                                      if r["playing_brier"] is not None]),
        "conditional_stat_mae":{s:_metric([
            r["stats"][s]["abs_error"] for r in rows
            if r["stats"][s]["abs_error"] is not None])
            for s in STATS},
        "expected_minutes_mae":_metric([
            r["minutes_error_unconditional"] for r in rows
            if r["minutes_error_unconditional"] is not None]),
        "official_bets":0,"bookmaker_win_loss_record":None,
        "originals_immutable":True,"played_vs_DNP_never_fabricated":True,
        "status":("NO_GENUINE_ROLLING_FIRST_SEEN_PREDICTIONS" if not originals else
            "ALL_ORIGINALS_ACCOUNTED_PARTIAL_ACTUAL_VERIFICATION"
                if unknown_stats else "ALL_ORIGINALS_ACCOUNTED_FULLY_VERIFIED"),
        "truth_receipts":receipt,"games":games,"player_rows":rows,
        "note":"Every original conditional PTS/REB/AST/3PM receives a real played stat if appeared; DNP is not a fake 0-point betting loss; unknown complete box remains unverified. Never a sportsbook wager."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--archive-root",default=Path("docs/nba_rolling_predictions"),type=Path)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    originals,files=load_original_forecasts(a.archive_root)
    now=dt.datetime.now(UTC)
    finals,boxes,receipt=capture_verified_actuals(originals,now)
    d=grade_originals(originals,finals,boxes,receipt,now)
    d["original_source_files"]=files
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(d,indent=2,sort_keys=True,allow_nan=False)+"\n")
    print("NBA_EVERY_ORIGINAL_ROLLING_MODEL_PREDICTION_GRADED",json.dumps({
        k:d[k] for k in ("original_rolling_games","original_player_forecasts",
           "all_original_four_market_stat_forecasts_accounted",
           "verified_played_stat_outcomes","verified_DNP_conditional_stats_not_applicable",
           "unverified_conditional_stats","player_status_verified",
           "player_status_unverified","official_bets","status")},sort_keys=True),flush=True)

if __name__=="__main__":main()
