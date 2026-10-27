#!/usr/bin/env python3
"""Score REAL, immutable V3 pretip distribution forecasts against later ESPN finals.

No backfilled predictions. The comparison is to exact archived V2 originals
on the *same player/game*; unknown finals remain UNVERIFIED, and an ESPN final
box with a missing source-rostered player counts as DNP for unconditional
milestone events. Never infer a sportsbook bet/ROI from this evidence.
"""
from __future__ import annotations
import argparse
import collections
import datetime as dt
import json
import math
from pathlib import Path

from nba.nba_v1_team_model import get_scoreboard,extract_events,datetime_utc,UTC
from nba.nba_v1_player_backtest import load_games
from nba.nba_v3_shadow_publish import already_seen,PUBLISH_SCHEMA
from nba.nba_v3_phase1_engine import SCHEMA as SOURCE_SCHEMA,MARKETS
from nba.nba_v2_probability_research import hit_probability,MILESTONES
from nba.nba_v2_rotation_research import VERSION as V2_VERSION

SCHEMA="NBA_V3_GENUINE_2026_27_ORIGINAL_PLAYER_PROBABILITY_FORWARD_GRADE_V1"
TARGETS={
    "points":(6,10,15,20,25,30,35,40),
    "rebounds":(3,5,6,8,10,12),
    "assists":(2,4,5,7,9),
    "three_pointers_made":(1,2,3,4,5)
}
# Exposed separately, never an automatic champion/betting promotion.
REQUIRE_MIN_GAMES=75
REQUIRE_VERIFIED_THRESHOLD_EVENTS=1000
REQUIRE_HIGH_CONF_EVENTS=100
MIN_BRIER_GAIN=.003
MAX_ECE=.07
MAX_HIGH_CONF_GAP=.08

def frozen_shadow(directory:Path):
    games={}
    for path in sorted(directory.glob("*.json")):
        doc=json.loads(path.read_text())
        if doc.get("schema")!=PUBLISH_SCHEMA or doc.get("model_promoted") is not False:
            raise ValueError("NBA_V3_UNVERIFIED_SHADOW_ARCHIVE")
        for g in doc["games"]:
            gid=str(g["game_id"]);tip=datetime_utc(g["tipoff_utc"])
            asof=datetime_utc(g["forecast_at_utc"])
            if gid in games or not asof<tip-dt.timedelta(minutes=15) or (
                g.get("schema")!=SOURCE_SCHEMA or g.get("official_bets")!=0 or
                len(g.get("rows",[]))!=g.get("rows_count")):
                raise ValueError("NBA_V3_DUPLICATE_LATE_OR_BAD_ORIGINAL_CDF")
            ids=set()
            for row in g["rows"]:
                key=(str(row["team_id"]),str(row["player_id"]),row["market"])
                if (key in ids or row["market"] not in MARKETS or
                    row["game_id"]!=gid or row.get("calibrated_for_2026_27") is not False or
                    row.get("not_an_official_bet") is not True):
                    raise ValueError("NBA_V3_UNRELIABLE_ORIGINAL_MARKET")
                ids.add(key)
                cdf=row["cdf_lattice"]["cdf"]
                if (row["cdf_lattice"]["step"]!=1 or not cdf or
                    any(not isinstance(v,(int,float)) or math.isnan(v) or
                        not 0<=v<=1 for v in cdf) or
                    any(a>b+1e-10 for a,b in zip(cdf,cdf[1:])) or
                    abs(cdf[-1]-1)>1e-6):
                    raise ValueError("NBA_V3_CORRUPT_ORIGINAL_MODEL_CDF")
            games[gid]=g
    return games

def original_v2(docs:Path):
    bygame={}
    paths=[docs/"nba_v2_opening_player_firstseen.json",
         *sorted((docs/"nba_rolling_predictions").glob("*.json"))]
    for path in paths:
        if not path.is_file():continue
        d=json.loads(path.read_text())
        if not isinstance(d.get("forecasts"),list):continue
        for g in d["forecasts"]:
            gid=str(g["game_id"])
            if gid in bygame:raise ValueError("NBA_V2_ARCHIVE_DUPLICATE_ORIGINAL_GAME")
            if datetime_utc(d["generated_at_utc"])>=datetime_utc(g["tipoff_utc"]):
                raise ValueError("NBA_V2_ARCHIVE_AFTER_TIP")
            bygame[gid]={**g,"_v2_original_at_utc":d["generated_at_utc"]}
    return bygame

def get_final_boxes(games,cache:Path,now=None,scoreboard=get_scoreboard,
                    box_loader=load_games):
    """Refuse postgame truth unless ESPN final scoreboard AND full ESPN box agree."""
    now=now or dt.datetime.now(UTC)
    days=set()
    for g in games.values():
        kickoff=datetime_utc(g["tipoff_utc"])
        if kickoff+dt.timedelta(hours=2)>now:continue
        days.add(kickoff.date())
        days.add((kickoff-dt.timedelta(days=1)).date())
    final={}
    for day in sorted(days):
        source,body=scoreboard(day)
        if source!=day.isoformat():raise ValueError("NBA_V3_POSTGAME_WRONG_SOURCE_DATE")
        for event in extract_events(body):
            gid=event["game_id"]
            if gid not in games:continue
            original=games[gid]
            if (event["home_id"]!=original["home_id"] or
                event["away_id"]!=original["away_id"] or
                datetime_utc(event["start_utc"])!=datetime_utc(original["tipoff_utc"])):
                raise ValueError("NBA_V3_GAME_ID_TEAM_TIPOFF_CONTRADICTION")
            if event["completed"]:final[gid]=event
    parsed,errors=box_loader(list(final.values()),cache,workers=5) if final else ({},{})
    return parsed,errors

def _summary(values):
    if not values:return {"verified_n":0,"brier":None,"ece":None,"high_n":0,
                          "high_gap":None,"observed_frequency":None}
    n=len(values)
    brier=sum((p-y)**2 for p,y in values)/n
    ece=0
    for i in range(10):
        bin_=[(p,y) for p,y in values if min(9,int(p*10))==i]
        if bin_:
            ece+=len(bin_)/n*abs(sum(p for p,y in bin_)/len(bin_)-
                                sum(y for p,y in bin_)/len(bin_))
    high=[(p,y) for p,y in values if p>=.65]
    return {"verified_n":n,"brier":round(brier,6),"ece":round(ece,6),
       "high_n":len(high),
       "high_gap":round(abs(sum(p for p,y in high)/len(high)-
                        sum(y for p,y in high)/len(high)),6) if high else None,
       "observed_frequency":round(sum(y for p,y in values)/n,6)}

def grade(games,boxes,originals,v2_probability_doc,now=None):
    now=now or dt.datetime.now(UTC)
    result=[];pge=collections.defaultdict(list);v2event=collections.defaultdict(list)
    mae=collections.defaultdict(list);minutes=collections.defaultdict(list)
    joint_brier=collections.defaultdict(list)
    verified_games=set()
    comparable_horizon_games=set()
    for gid,g in sorted(games.items()):
        players={}
        if gid in boxes:
            verified_games.add(gid)
            for p in boxes[gid]:
                k=(p["team_id"],p["player_id"])
                if k in players:raise ValueError("NBA_V3_POSTGAME_DUPLICATE_PLAYER")
                players[k]=p
        old=originals.get(gid)
        # A model refreshed days closer to tipoff has an information
        # advantage. Only SAME-HORIZON (<6h apart) original V2 forecasts
        # can decide V3 challenger promotion, even on matched game/players.
        matched_horizon=(old is not None and
          old.get("_v2_original_at_utc") is not None and
          abs((datetime_utc(old["_v2_original_at_utc"])-
               datetime_utc(g["forecast_at_utc"])).total_seconds())<=6*3600)
        orig={(p["team_id"],p["player_id"]):p for p in old["players"]} if matched_horizon else {}
        if matched_horizon:comparable_horizon_games.add(gid)
        for r in g["rows"]:
            market=r["market"];team=str(r["team_id"]);pid=str(r["player_id"])
            actual=players.get((team,pid))
            final=gid in verified_games
            played=actual is not None if final else None
            y_actual=(float(actual[market]) if actual else 0.) if final else None
            oldp=orig.get((team,pid))
            v2mean=(oldp or {}).get("predictions",{}).get(market)
            v2play=(oldp or {}).get("p_play_unverified")
            if final and played:
                mae[market].append((gid,abs(float(r["mean"])-y_actual),
                                    abs(float(v2mean)-y_actual)
                                       if v2mean is not None else None))
                if market=="points":
                    v2_minutes=(oldp or {}).get("conditional_minutes_mean")
                    minutes[market].append((gid,
                         abs(float(r["conditional_minutes_mean"])-actual["minutes"]),
                         abs(float(v2_minutes)-actual["minutes"])
                            if v2_minutes is not None else None))
            # Evaluate ALL pre-registered thresholds, not the model-selected
            # winning one. Include actual DNP zero unconditionally.
            cdf=r["cdf_lattice"]["cdf"]
            for threshold in TARGETS[market]:
                p_v3=max(0.,min(1.,1-float(cdf[threshold-1])))
                outcome=int(y_actual>=threshold) if final else None
                p_v2=None
                if (v2mean is not None and v2play is not None and
                    market in MILESTONES and threshold in MILESTONES[market] and
                    v2_probability_doc["markets"][market]["heldout_probability_gate_passed"]):
                    p_v2=hit_probability(v2_probability_doc["fit"],market,
                                    v2mean,v2play,threshold)
                if final:
                    pge[market].append((p_v3,outcome))
                    if p_v2 is not None:
                        v2event[market].append((p_v2,outcome))
                        joint_brier[market].append((p_v3,p_v2,outcome))
                result.append({
                    "game_id":gid,"team_id":team,"player_id":pid,
                    "market":market,"threshold":threshold,
                    "forecast_probability":round(p_v3,6),
                    "original_v2_probability":round(p_v2,6) if p_v2 is not None else None,
                    "actual_stat":y_actual,
                    "result":("UNVERIFIED" if not final else
                              "HIT" if outcome else "MISS"),
                    "brier":round((p_v3-outcome)**2,6) if final else None})
    metrics={}
    for market in MARKETS:
        m=mae[market];paired=[x for x in m if x[2] is not None]
        mm=minutes[market] if market=="points" else []
        d=_summary(pge[market]);baseline=_summary(v2event[market])
        comparable=joint_brier[market]
        matched_v3_brier=(sum((x[0]-x[2])**2 for x in comparable)/len(comparable)
                          if comparable else None)
        matched_v2_brier=(sum((x[1]-x[2])**2 for x in comparable)/len(comparable)
                          if comparable else None)
        # Source-only calibration gate. We require enough games and a
        # genuine outperforming comparison, but NEVER automatically
        # promote the challenger based on a historical burned holdout.
        chance=(len(verified_games)>=REQUIRE_MIN_GAMES and
              d["verified_n"]>=REQUIRE_VERIFIED_THRESHOLD_EVENTS and
              d["high_n"]>=REQUIRE_HIGH_CONF_EVENTS and
              d["ece"] is not None and d["ece"]<=MAX_ECE and
              d["high_gap"] is not None and d["high_gap"]<=MAX_HIGH_CONF_GAP and
              matched_v2_brier is not None and
              matched_v3_brier<=matched_v2_brier-MIN_BRIER_GAIN and
              len(paired)>=200 and
              sum(x[1] for x in paired)<=sum(x[2] for x in paired))
        metrics[market]={
          "prospective_v3_all_thresholds":d,
          "v2_comparator_on_eligible_matching_thresholds":baseline,
          "played_player_conditional_stat_mae_v3":
             round(sum(x[1] for x in m)/len(m),6) if m else None,
          "played_player_paired_mae_v3":
             round(sum(x[1] for x in paired)/len(paired),6) if paired else None,
          "played_player_paired_mae_original_v2":
             round(sum(x[2] for x in paired)/len(paired),6) if paired else None,
          "paired_players":len(paired),
          "same_exact_threshold_comparison_n":len(comparable),
          "paired_milestone_brier_v3":round(matched_v3_brier,6)
             if matched_v3_brier is not None else None,
          "paired_milestone_brier_original_v2":round(matched_v2_brier,6)
             if matched_v2_brier is not None else None,
          "minutes_mae_v3":round(sum(x[1] for x in mm)/len(mm),6)
             if mm else None,
          "minutes_mae_v2":round(sum(x[2] for x in mm if x[2] is not None)/
                                len([x for x in mm if x[2] is not None]),6)
             if any(x[2] is not None for x in mm) else None,
          "candidate_meets_predeclared_shadow_gates":bool(chance),
          "automatically_promoted":False,
        }
    return {"schema":SCHEMA,"graded_at_utc":now.isoformat(),
      "original_v3_games_frozen":len(games),
      "official_final_game_boxes_verified":len(verified_games),
      "same_within_6h_original_v2_horizon_games":len(comparable_horizon_games),
      "not_within_6h_v2_comparison_is_quarantined":True,
      "original_v3_thresholds_accounted":len(result),
      "verified_thresholds":sum(x["brier"] is not None for x in result),
      "unverified_thresholds":sum(x["brier"] is None for x in result),
      "markets":metrics,"rows":result,
      "source":"REAL_FIRSTSEEN_V3_ARCHIVE_VS_LATER_ESPN_COMPLETED_GAME_PLAYER_BOXES",
      "original_V2_numerical_comparison":"MATCHED_SAME_PLAYER_GAME_AND_WITHIN_6H_FORECAST_ORIGIN_ONLY",
      "prospective_2026_27_calibrated":False,
      "betting_model_promoted":False,"official_bets":0,
      "note":"Only future original V3 pre-tip captures scored. All threshold outcomes including DNP. Historic retrofits forbidden. Minimum sample and Brier/ECE/MAE gates explicit; external lineup, value/price verification still required."}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--shadow",type=Path,
        default=Path("docs/nba_v3_phase1_corrected_shadow"))
    ap.add_argument("--docs",type=Path,default=Path("docs"))
    ap.add_argument("--cache",type=Path,default=Path(".cache/nba-v3-grade"))
    ap.add_argument("--out",type=Path,required=True)
    ap.add_argument("--probability",type=Path,
        default=Path("docs/nba_v2_probability_distribution_v1.json"))
    args=ap.parse_args()
    shadow=frozen_shadow(args.shadow)
    v2=original_v2(args.docs)
    probs=json.loads(args.probability.read_text())
    boxes,errors=get_final_boxes(shadow,args.cache)
    report=grade(shadow,boxes,v2,probs)
    report["source_final_boxscore_errors"]=errors
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(report,indent=2,sort_keys=True,allow_nan=False)+"\n")
    print("NBA_V3_GENUINE_FIRSTSEEN_V2_MATCHED_FORWARD_SCORE",
          json.dumps({"original_games":report["original_v3_games_frozen"],
             "graded_games":report["official_final_game_boxes_verified"],
             "verified":report["verified_thresholds"],"unverified":report["unverified_thresholds"],
             "gate":{m:v["candidate_meets_predeclared_shadow_gates"]
                 for m,v in report["markets"].items()},
             "official_bets":0}),flush=True)

if __name__=="__main__":main()
