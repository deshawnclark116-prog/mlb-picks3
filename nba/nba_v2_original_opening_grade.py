#!/usr/bin/env python3
"""Independent postgame grading of EVERY immutable original NBA 2026 player stat.

Sources:
 - saved Oct19 first-seen team forecast, already generated BEFORE tipoff
 - saved Oct20 first-seen V2 player forecast, already generated BEFORE tipoff
 - fresh independently COMPLETED ESPN scoreboard, exact game/team/event IDs
 - independently completed ESPN full two-team player boxes, including DNP

Never grade a model-generated target threshold as a sportsbook wager. Every
original team/player/stat prediction receives either verified actual/error
or a visible explanation. Playing probability is graded for all originally
modeled players with a VERIFIED full completed two-team boxscore, even when
the player did not appear. Conditional STAT errors are only graded if PLAYED.
"""
from __future__ import annotations
import argparse, collections, datetime as dt, hashlib,json,math,statistics
from pathlib import Path
from nba.nba_v1_team_model import extract_events,get_scoreboard,datetime_utc,UTC
from nba.nba_v1_player_model import fetch_summary,parse_final_boxscore,STAT_NAMES
from nba.nba_v2_firstseen_player_opening import SCHEMA as PLAYER_SCHEMA

SCHEMA="NBA_2026_ORIGINAL_TEAM_AND_V2_PLAYER_COMPLETE_GAME_GRADES_V1"
TEAM_SCHEMA="NBA_V1_2026_OPENING_ROSTER_BLIND_RESEARCH_V1"
STATS=("points","rebounds","assists","three_pointers_made")

def valid_originals(team,player):
    if team.get("schema")!=TEAM_SCHEMA or team.get("official_wagers")!=0:
        raise ValueError("NBA_ORIGINAL_TEAM_SOURCE_NOT_AUTHENTIC")
    if player.get("schema")!=PLAYER_SCHEMA or player.get("official_bets")!=0:
        raise ValueError("NBA_ORIGINAL_PLAYER_SOURCE_NOT_AUTHENTIC")
    if not team.get("research_only") or not player.get("research_only"):
        raise ValueError("NBA_ORIGINAL_RESEARCH_BOUNDARY_NOT_INTACT")
    original_teams={r["game_id"]:r for r in team["forecasts"]}
    if len(original_teams)!=len(team["forecasts"]) or len(original_teams)!=14:
        raise ValueError("NBA_ORIGINAL_TEAM_GAME_IDS_INCOMPLETE")
    ids=set();n=0
    for g in player["forecasts"]:
        fg=original_teams.get(g["game_id"])
        if fg is None or g["home_id"]!=fg["home_id"] or g["away_id"]!=fg["away_id"]:
            raise ValueError("NBA_ORIGINAL_PLAYER_GAME_NOT_IN_FROZEN_TEAM_RESEARCH")
        t=datetime_utc(g["tipoff_utc"])
        if (datetime_utc(player["generated_at_utc"])>=t or
            datetime_utc(team["generated_at_utc"])>=t):
            raise ValueError("NBA_POST_TIP_FIRST_SEEN_RESEARCH_FORBIDDEN")
        if len(g["players"])*4!=g["player_predictions_count"]:
            raise ValueError("NBA_SAVED_PLAYER_MARKET_COUNT_MISMATCH")
        for p in g["players"]:
            if (p["game_id"]!=g["game_id"] or p["tipoff_utc"]!=g["tipoff_utc"] or
                p["team_id"] not in (g["home_id"],g["away_id"]) or
                p["forecast_generated_at_utc"]!=player["generated_at_utc"] or
                p["official_pick"] is not False or p["stat_market_lines"] is not None or
                set(p["predictions"])!=set(STATS) or p["forecast_id"] in ids):
                raise ValueError("NBA_UNTRUSTWORTHY_OR_DUPLICATE_ORIGINAL_PLAYER_FORECAST")
            ids.add(p["forecast_id"]);n+=4
    if n!=player["number_of_player_stat_predictions"]:
        raise ValueError("NBA_SAVED_ORIGINAL_STATS_MISSING")
    return original_teams

def capture_final_games(team,fetch_board=get_scoreboard,fetch_box=fetch_summary):
    """Independent source collection: only final, exact ESPN game/team ID."""
    rows={}
    receipts={}
    expected={f["game_id"]:f for f in team["forecasts"]}
    for datestr in ("2026-10-20","2026-10-21"):
        day=dt.date.fromisoformat(datestr)
        date,raw=fetch_board(day)
        if str(date)!=datestr:raise ValueError("NBA_SCOREBOARD_REQUESTED_DAY_CONFLICT")
        receipts[date]={"source_sha256":hashlib.sha256(
            json.dumps(raw,sort_keys=True).encode()).hexdigest(),
            "retrieved_at_utc":dt.datetime.now(UTC).isoformat(),
            "source":"ESPN NBA official scoreboard"}
        for game in extract_events(raw):
            gid=game["game_id"]
            original=expected.get(gid)
            if original is None:continue
            if game["home_id"]!=original["home_id"] or game["away_id"]!=original["away_id"]:
                raise ValueError("NBA_OFFICIAL_FINAL_MATCHES_WRONG_ORIGINAL_TEAM_IDS")
            if gid in rows and rows[gid]!=game:
                raise ValueError("NBA_DUPLICATE_FINAL_GAME_ID_WITH_CONFLICT")
            rows[gid]=game
    boxes={};box_receipts={};errors={}
    for gid,g in sorted(rows.items()):
        if not g["completed"]:continue
        try:
            payload=fetch_box(gid)
            observed,audit=parse_final_boxscore(payload,gid,(g["home_id"],g["away_id"]))
            boxes[gid]=observed
            box_receipts[gid]={
                "actual_source":"ESPN_FINAL_TWO_TEAM_PLAYER_BOX",
                "source_sha256":hashlib.sha256(
                    json.dumps(payload,sort_keys=True).encode()).hexdigest(),
                "retrieved_at_utc":dt.datetime.now(UTC).isoformat(),
                "played_players":len(observed),"dnp_rows_without_played_stats":audit["missing_dnp"]}
        except (KeyError,TypeError,ValueError,RuntimeError,OSError) as exc:
            errors[gid]={"reason":type(exc).__name__,"detail":str(exc)[:200],
                         "status":"FINAL_GAME_PLAYER_ACTUAL_NOT_VERIFIABLE"}
    return rows,boxes,{"scoreboard_by_date":receipts,
       "boxscore_by_game":box_receipts,"boxscore_errors":errors}

def summary(vals):
    return {"n":len(vals),"mae":round(statistics.mean(vals),4) if vals else None}

def grade_originals(team,players,scoreboard,boxes,truth,asof):
    if asof.tzinfo is None:raise ValueError("NBA_NAIVE_GRADE_TIME")
    orig=valid_originals(team,players)
    original_players={g["game_id"]:g for g in players["forecasts"]}
    source_errors=(truth or {}).get("boxscore_errors") or {}
    original_count=0
    per_game=[];p_rows=[];team_rows=[]
    for gid,forecast in sorted(orig.items(),key=lambda it:it[1]["tipoff_utc"]):
        game=scoreboard.get(gid)
        pg=original_players.get(gid)
        if game and (
           game["home_id"]!=forecast["home_id"] or game["away_id"]!=forecast["away_id"]):
            raise ValueError("NBA_ACTUAL_SCHEDULE_TEAM_CONFLICT")
        if game and game["completed"] and datetime_utc(game["start_utc"])>asof:
            raise ValueError("NBA_FUTURE_FINAL_DATA_LEAKAGE")
        final=bool(game and game["completed"] and game.get("home_points") is not None
                   and game.get("away_points") is not None)
        result={"game_id":gid,"tipoff_original_utc":forecast["tipoff_utc"],
             "generated_original_team_utc":team["generated_at_utc"],
             "generated_original_player_utc":players["generated_at_utc"],
             "home":forecast["home"],"away":forecast["away"],
             "source_final":final,"team_status":"VERIFIED_FINAL" if final else
                           "NO_FINAL_GAME_RESULT_YET",
             "original_team_home_p":forecast["home_win_probability"],
             "original_team_home_points":forecast["projected_home_score_mean"],
             "original_team_away_points":forecast["projected_away_score_mean"],
             "original_team_total":forecast["projected_game_total_mean"],
             "actual_home_points":None,"actual_away_points":None,
             "actual_total":None,"winner_brier":None,
             "home_points_abs_error":None,"away_points_abs_error":None,
             "total_points_abs_error":None}
        if final:
            hp,ap=game["home_points"],game["away_points"]
            result.update({
                "actual_home_points":hp,"actual_away_points":ap,"actual_total":hp+ap,
                "winner_brier":round((forecast["home_win_probability"]-(1 if hp>ap else 0))**2,6),
                "home_points_abs_error":round(abs(forecast["projected_home_score_mean"]-hp),4),
                "away_points_abs_error":round(abs(forecast["projected_away_score_mean"]-ap),4),
                "total_points_abs_error":round(abs(forecast["projected_game_total_mean"]-hp-ap),4)
            })
        team_rows.append(result)
        scheduled=pg["players"] if pg else []
        played_index={}
        if gid in boxes and final:
            for p in boxes[gid]:
                key=(p["team_id"],p["player_id"])
                if key in played_index:
                    raise ValueError("NBA_DUPLICATE_PLAYED_ATHLETE_IN_ESPN_FINAL")
                played_index[key]=p
        player_source_ready=final and gid in boxes
        games={"game_id":gid,"team_original":result,
              "original_saved_player_forecasts":len(scheduled),
              "original_saved_stat_forecasts":len(scheduled)*4,
              "stat_outcomes_verified":0,
              "player_play_status_verified":0,
              "conditional_stat_unverified":0,
              "source_status":"FINAL_COMPLETE_BOTH_TEAMS" if player_source_ready else
                        ("FINAL_BOX_SOURCE_UNVERIFIED" if final else "AWAITING_FINAL"),
              "player_source_error":source_errors.get(gid),
              "original_player_unmodeled_roster_members":len(pg["roster_players_without_model_forecast"]) if pg else None}
        for p in scheduled:
            original_count+=1
            row={"forecast_id":p["forecast_id"],"game_id":gid,
                 "team_id":p["team_id"],"player_id":p["player_id"],"player":p["player"],
                 "first_seen_at_utc":players["generated_at_utc"],
                 "model_version":players["model_version"],
                 "original_p_play_estimate":p["p_play_unverified"],
                 "original_minutes_conditional_mean":p["conditional_minutes_mean"],
                 "original_minutes_unconditional_mean":p["expected_minutes"],
                 "original_stats_if_played":p["predictions"],
                 "played_observed":None,"playing_probability_brier":None,
                 "actual_minutes":None,
                 "minutes_unconditional_abs_error":None,
                 "minutes_if_played_abs_error":None,
                 "stats":{},"status":None}
            if not player_source_ready:
                row["status"]="NO_FINAL_OR_UNVERIFIED_PLAYER_BOX"
                for stat in STATS:
                    row["stats"][stat]={
                        "pred_if_played":p["predictions"][stat],"actual_if_played":None,
                        "abs_error":None,"status":"UNVERIFIED_PLAYER_ACTUAL"}
                    games["conditional_stat_unverified"]+=1
                p_rows.append(row)
                continue
            observed=played_index.get((p["team_id"],p["player_id"]))
            played=observed is not None
            row["played_observed"]=played
            row["playing_probability_brier"]=round((p["p_play_unverified"]-
                                                    (1 if played else 0))**2,6)
            row["actual_minutes"]=observed["minutes"] if played else 0
            row["minutes_unconditional_abs_error"]=round(abs(
                p["expected_minutes"]-row["actual_minutes"]),4)
            games["player_play_status_verified"]+=1
            if played:
                row["status"]="VERIFIED_PLAYED"
                row["minutes_if_played_abs_error"]=round(abs(
                    p["conditional_minutes_mean"]-observed["minutes"]),4)
                for stat in STATS:
                    v=observed[stat]
                    row["stats"][stat]={
                        "pred_if_played":p["predictions"][stat],
                        "actual_if_played":v,
                        "abs_error":round(abs(p["predictions"][stat]-v),4),
                        "status":"VERIFIED_PLAYED_STAT"}
                    games["stat_outcomes_verified"]+=1
            else:
                # Absence from a completed, independently authenticated 2-team
                # played-stat box means DID NOT PLAY. Conditional PTS etc
                # still have NO actual_if_played; do not invent 0 stat losses.
                row["status"]="VERIFIED_DID_NOT_PLAY"
                for stat in STATS:
                    row["stats"][stat]={
                        "pred_if_played":p["predictions"][stat],
                        "actual_if_played":None,"abs_error":None,
                        "status":"NOT_PLAYED_CONDITIONAL_PREDICTION_NOT_APPLICABLE"}
                    games["conditional_stat_unverified"]+=1
            p_rows.append(row)
        per_game.append(games)
    expected=sum(len(g["players"]) for g in players["forecasts"])
    if original_count!=expected or len(p_rows)!=expected:
        raise ValueError("NBA_SILENTLY_DROPPED_ORIGINAL_PLAYER_PREDICTIONS")
    conditional={}
    for market in STATS:
        errors=[r["stats"][market]["abs_error"] for r in p_rows
                if r["stats"][market]["abs_error"] is not None]
        conditional[market]=summary(errors)
    pb=[r["playing_probability_brier"] for r in p_rows
        if r["playing_probability_brier"] is not None]
    team_brier=[g["winner_brier"] for g in team_rows if g["winner_brier"] is not None]
    return {
        "schema":SCHEMA,"graded_at_utc":asof.astimezone(UTC).isoformat(),
        "original_player_predictions":expected,
        "original_player_stat_forecasts":expected*4,
        "player_originals_accounted":len(p_rows),
        "player_status_verified":len(pb),
        "player_status_unverified":len(p_rows)-len(pb),
        "player_play_probability_brier":round(statistics.mean(pb),6) if pb else None,
        "player_conditional_stat_mae":conditional,
        "team_originals":len(team_rows),
        "team_originals_graded":len(team_brier),
        "team_win_brier":round(statistics.mean(team_brier),6) if team_brier else None,
        "team_total_points_mae":summary([g["total_points_abs_error"] for g in team_rows
            if g["total_points_abs_error"] is not None]),
        "official_bets":0,
        "bookmaker_win_loss_record":None,
        "not_played_conditional_stats_not_scored_as_zero":True,
        "originals_immutable_and_all_accounted":True,
        "source_grade_inputs":truth,
        "games":per_game,"team_forecast_rows":team_rows,
        "player_forecast_rows":p_rows,
        "note":"Every original team game probability, score and total is compared with the real final when available; each saved player PTS/REB/AST/3PM is compared with actual only if played. P(play) graded for all verified final player boxes. Missing results remain unresolved and no model targets are treated as bookmaker bets."
    }

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--team",type=Path,default=Path("docs/nba_v1_opening_week_research.json"))
    a.add_argument("--players",type=Path,default=Path("docs/nba_v2_opening_player_firstseen.json"))
    a.add_argument("--out",type=Path,default=Path("docs/nba_v2_original_opening_player_grade.json"))
    args=a.parse_args()
    if not args.players.is_file():
        raise ValueError("NBA_ORIGINAL_FORWARD_PLAYER_SNAPSHOT_NOT_YET_CAPTURED")
    team=json.loads(args.team.read_text())
    players=json.loads(args.players.read_text())
    valid_originals(team,players)
    finals,boxes,meta=capture_final_games(team)
    result=grade_originals(team,players,finals,boxes,meta,dt.datetime.now(UTC))
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,sort_keys=True,indent=2,allow_nan=False)+"\n")
    print("NBA_ORIGINAL_ALL_GAME_GRADES",json.dumps({k:result[k] for k in (
        "original_player_predictions","original_player_stat_forecasts",
        "player_status_verified","player_status_unverified","team_originals",
        "team_originals_graded","team_win_brier","team_total_points_mae",
        "player_conditional_stat_mae","official_bets")},sort_keys=True),flush=True)

if __name__=="__main__":main()
