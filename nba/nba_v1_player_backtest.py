#!/usr/bin/env python3
"""NBA first-player model evaluation, same-game matched recent-average baseline.

All player candidates are formed from PREVIOUS games only. We DO NOT filter
or rank using future active participants. Missing played-stat rows are
explicitly excluded, NOT treated as a player scoring zero. Consequently MAE
among people who actually played is conditional accuracy only; prospective
availability and bets remain unvalidated.
"""
from __future__ import annotations
import argparse, collections, concurrent.futures, datetime as dt, hashlib, json, statistics
from pathlib import Path
from nba.nba_v1_player_model import fetch_summary, parse_final_boxscore, project_player, STAT_NAMES

SCHEMA="NBA_V1_FIRST_PREGAME_PLAYER_STAT_WALKBACK_V1"

def load_games(rows,cache:Path,workers:int=5):
    cache.mkdir(parents=True,exist_ok=True)
    result={};failures={}
    def get(g):
        cid=g["game_id"];file=cache/(cid+".json")
        try:
            if file.exists():payload=json.loads(file.read_text())
            else:
                payload=fetch_summary(cid)
                file.write_text(json.dumps(payload,separators=(",",":"))+"\n")
            players,meta=parse_final_boxscore(payload,cid,(g["home_id"],g["away_id"]))
            return cid,players,meta,None
        except Exception as e:return cid,None,None,str(e)
    with concurrent.futures.ThreadPoolExecutor(max_workers=min(5,max(1,workers))) as pool:
        for cid,players,meta,error in pool.map(get,rows):
            if error:failures[cid]=error
            else:result[cid]=players
    return result,failures

def score(rows,boxscores,validation_from,holdout_from):
    if not validation_from<holdout_from:raise ValueError("invalid validation/holdout split")
    ordered=sorted(rows,key=lambda x:(x["day_utc"],x["start_utc"],x["game_id"]))
    team_games=collections.Counter()
    histories=collections.defaultdict(list)
    last_seen={}
    first_seen={}
    results=[]
    quarantined=collections.Counter()
    perday=collections.defaultdict(list)
    for game in ordered:
        if not game["completed"] or game["game_id"] not in boxscores:
            quarantined["NO_VALID_REAL_BOXSCORE"]+=1
            continue
        perday[game["day_utc"]].append(game)
    for dd,todays in sorted(perday.items()):
        # Generate ALL game-day projections from game state at the start of day.
        day_projections=[]
        for g in todays:
            for team_id in (g["home_id"],g["away_id"]):
                for (team,player_id),hist in list(histories.items()):
                    if team!=team_id:continue
                    team_counter=team_games[team]
                    first=first_seen[(team,player_id)]
                    elapsed=team_counter-first+1
                    p,why=project_player(hist,elapsed,last_seen[(team,player_id)],team_counter)
                    if why:
                        quarantined[why]+=1
                        continue
                    day_projections.append({
                        "game_id":g["game_id"],"game_day":dd,"team_id":team_id,
                        "player_id":player_id,"player":hist[-1]["player"],
                        "prior_player_games":len(hist),
                        "minutes_pred":p["conditional_minutes_mean"],
                        "prior_p_play_model":p["model_p_play_not_roster_verified"],
                        "stat_mean":p["conditional_stat_means"],
                        "baseline_recent_five":{
                            m:round(statistics.mean(x[m] for x in hist[-5:]),4)
                            for m in STAT_NAMES},
                        "split":"seed" if dd<validation_from else
                                "validation" if dd<holdout_from else "holdout",
                        "game_day_active_status_unknown":True
                    })
        # Grade only where the independent actual FINAL player is present.
        actual={(g["game_id"],r["team_id"],r["player_id"]):r
                for g in todays for r in boxscores[g["game_id"]]}
        for forecast in day_projections:
            k=(forecast["game_id"],forecast["team_id"],forecast["player_id"])
            played=actual.get(k)
            if played is None:
                quarantined["FORECAST_PLAYER_NOT_IN_FINAL_ACTIVE_BOXSCORE"]+=1
                continue
            results.append({**forecast,"actual_minutes":played["minutes"],
                            "actual":{m:played[m] for m in STAT_NAMES},
                            "minutes_error":round(forecast["minutes_pred"]-played["minutes"],3)})
        # AFTER the entire slate has been forecast and graded, ingest its boxscores.
        for g in todays:
            for team_id in (g["home_id"],g["away_id"]):
                before=team_games[team_id]
                for r in boxscores[g["game_id"]]:
                    if r["team_id"]!=team_id:continue
                    key=(team_id,r["player_id"])
                    if key not in first_seen:first_seen[key]=before
                    histories[key].append({**r,"game_day":dd})
                    last_seen[key]=before
                team_games[team_id]+=1
    return {"results":results,"quarantined":dict(quarantined),
            "stats":summary(results),"research_only":True,
            "note":"Conditioned on actual later participation for accuracy grading ONLY. Pregame active probability and the NBA starting lineups are NOT externally verified."}

def summary(rows):
    res={}
    for split in ("validation","holdout"):
        items=[x for x in rows if x["split"]==split]
        metrics={}
        for market in ("minutes",)+tuple(STAT_NAMES):
            if not items:metrics[market]={"n":0};continue
            actual=lambda r:r["actual_minutes"] if market=="minutes" else r["actual"][market]
            pred=lambda r:r["minutes_pred"] if market=="minutes" else r["stat_mean"][market]
            if market=="minutes":
                # No "last five minutes" version is retained in each result.
                metrics[market]={"n":len(items),
                    "mae_model":round(statistics.mean(abs(pred(x)-actual(x)) for x in items),3)}
                continue
            baseline=lambda r:r["baseline_recent_five"][market]
            m=statistics.mean(abs(pred(x)-actual(x)) for x in items)
            b=statistics.mean(abs(baseline(x)-actual(x)) for x in items)
            metrics[market]={"n":len(items),"mae_model":round(m,3),
                "mae_last_five":round(b,3),
                "improvement_positive_better":round(b-m,3)}
        res[split]={"played_player_forecasts":len(items),"by_market":metrics}
    return res

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--team-report",type=Path,default=Path("docs/nba_v1_forward_walkback.json"))
    p.add_argument("--cache",type=Path,default=Path(".cache/nba-boxscores"))
    p.add_argument("--out",type=Path,default=Path("docs/nba_v1_player_stat_walkback.json"))
    p.add_argument("--first-n-games",type=int,default=350)
    p.add_argument("--validation-from",default="2025-11-15")
    p.add_argument("--holdout-from",default="2025-11-29")
    a=p.parse_args()
    history=json.loads(a.team_report.read_text())
    if history.get("schema")!="NBA_V1_LEAKSAFE_ESPN_TEAM_HOLDOUT_V1":
        raise ValueError("must use verified real team-game source")
    eligible=sorted((x for x in history["rows"] if x["completed"]),
                    key=lambda x:(x["day_utc"],x["start_utc"],x["game_id"]))
    batch=eligible[:a.first_n_games]
    boxscores,failed=load_games(batch,a.cache)
    if len(boxscores)<.95*len(batch):
        raise ValueError(f"BOX_SCORE_SOURCE_COVERAGE_TOO_LOW {len(boxscores)}/{len(batch)} {list(failed.items())[:4]}")
    scored=score(batch,boxscores,a.validation_from,a.holdout_from)
    scored.update({"schema":SCHEMA,"frozen_real_team_source_sha256":history["source"]["source_content_sha256"],
           "boxscore_attempted":len(batch),"boxscore_verified":len(boxscores),
           "boxscore_missing_errors":failed,
           "player_result_source":"ESPN completed NBA boxscores only",
           "selected_predictions_before_current_day_actuals":True,
           "does_not_confirm_pregame_injuries_or_starting_fives":True,
           "official_bets":0,"betting_lines":0,
           "promotion_gate":"Must beat last-5 on later validation and holdout on same actual played cohort; collect pregame availability and odds separately; reject if it fails."})
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(scored,indent=2,allow_nan=False)+"\n")
    print("NBA_V1_PLAYER_REAL_BOX_TRUTH",json.dumps({
        "attempted":len(batch),"verified":len(boxscores),
        "validation":scored["stats"]["validation"],"holdout":scored["stats"]["holdout"],
        "quarantined":scored["quarantined"]},sort_keys=True))
if __name__=="__main__":main()
