#!/usr/bin/env python3
"""NBA V2 milestone-probability distribution research: NO bookmaker required.

Uses the historical, leak-safe 2025-26 V2 rotation model UNCHANGED.
Fit an empirical, heteroscedastic *conditional-on-play* residual distribution
and an appearance reliability table ONLY on 2025-12-08..2026-01-09.
Evaluate frozen distribution on entirely LATER 2026-01-10..02-01 games,
including nonparticipation=0. No holdout fitting, feature repair or tune loop.

Every fixed integer milestone is graded, not just winners selected in hindsight.
Per-market promotion is governed by prespecified heldout sample/Brier/ECE gates.
2026-27 actual game-day injury/starter status is NOT certified by a historical
test. Full 2026-27 forward-origin probabilities remain a separate release gate.

This stores source-proven model distributions (empirical residual CDFs);
Monte Carlo resampling would merely approximate these exact probabilities.
"""
from __future__ import annotations
import argparse
import collections
import hashlib
import json
import math
import statistics
from pathlib import Path
from nba.nba_v1_player_backtest import load_games
from nba.nba_v2_rotation_backtest import (
    VALIDATION_FROM,HOLDOUT_FROM,FIRST_ORIGINAL_GAMES
)
from nba.nba_v2_rotation_research import day_frozen_forecasts,VERSION,MARKETS

SCHEMA="NBA_V2_VALIDATION_FIT_FORWARD_HOLDOUT_PROBABILITY_DISTRIBUTIONS_V1"
MILESTONES={
    "points":(15,20,25,30,35),
    "rebounds":(6,8,10,12,14),
    "assists":(5,7,9,11,13),
    "three_pointers_made":(2,3,4,5,6),
}
SCALE_FLOOR={"points":8.0,"rebounds":3.0,
             "assists":2.0,"three_pointers_made":1.0}
PROB_CUTOFF=.65
MIN_TRAIN_PLAYED=500
MIN_HOLDOUT_PLAYERS=1200
MIN_HOLDOUT_TARGETS=4500
MIN_HIGH_P_BIN=80
MAX_ECE=.09
MIN_BRIER_LIFT=.003
MIN_HIGH_P_RELIABILITY=.11

def scaled_residual(market,mean,actual):
    floor=SCALE_FLOOR[market]
    return (float(actual)-float(mean))/math.sqrt(max(float(mean),floor))

def residual_hit_probability(residuals,market,pred,threshold):
    """Exact finite empirical CDF at first integer value that clears target."""
    if not residuals:return None
    barrier=(int(threshold)-float(pred))/math.sqrt(max(float(pred),SCALE_FLOOR[market]))
    # Counting is deterministic; labels and thresholds must not come from
    # the sportsbook or a postgame selection.
    import bisect
    return (len(residuals)-bisect.bisect_left(residuals,barrier))/len(residuals)

def parse_rows(games,boxscores):
    """All nominated V2 players, not just the ones who eventually played."""
    ids={};out=[]
    for g in games:
        gid=str(g["game_id"])
        if gid in ids or not g["completed"] or gid not in boxscores:
            raise ValueError("NBA_PROBABILITY_DUPLICATE_OR_UNVERIFIED_GAME")
        ids[gid]=g
    original=sorted(ids.values(),key=lambda g:(g["day_utc"],g["start_utc"],g["game_id"]))
    if len(original)<550:raise ValueError("NBA_PROBABILITY_HISTORICAL_GAME_COVERAGE")
    nominations=day_frozen_forecasts(original,boxscores)
    actuals={}
    for g in original:
        for p in boxscores[str(g["game_id"])]:
            k=(str(g["game_id"]),str(p["team_id"]),str(p["player_id"]))
            if k in actuals:raise ValueError("NBA_PROBABILITY_DUPLICATE_ACTUAL_PLAYER")
            actuals[k]=p
    seen=set()
    for p in nominations:
        day=p["game_day"]
        if day<VALIDATION_FROM:continue
        k=(str(p["game_id"]),str(p["team_id"]),str(p["player_id"]))
        if k in seen:raise ValueError("NBA_PROBABILITY_DUPLICATE_FIRST_SEEN_PLAYER")
        seen.add(k)
        actual=actuals.get(k)
        vals=p["conditional_stat_means"]
        if (not 0<=p["p_play_unverified"]<=1 or
            set(vals)!=set(MARKETS) or
            any(not math.isfinite(vals[m]) or vals[m]<0 for m in MARKETS)):
            raise ValueError("NBA_PROBABILITY_BAD_OR_FUTURE_V2_FEATURES")
        out.append({
            "game_id":k[0],"team_id":k[1],"player_id":k[2],
            "game_day":day,"p_play":float(p["p_play_unverified"]),
            "means":{m:float(vals[m]) for m in MARKETS},
            "played":actual is not None,
            "actual":{m:float(actual[m]) for m in MARKETS}
                      if actual else None,
        })
    return sorted(out,key=lambda p:(p["game_day"],p["game_id"],p["player_id"]))

def fit(rows):
    train=[r for r in rows if VALIDATION_FROM<=r["game_day"]<HOLDOUT_FROM]
    if len(train)<MIN_TRAIN_PLAYED:raise ValueError("NBA_NOT_ENOUGH_EARLIER_VALIDATION")
    residuals={m:[] for m in MARKETS}
    # Pool players at comparable predicted-exposure scales, not last game's
    # observations. All future actuals are excluded from this object.
    reliability=collections.defaultdict(list)
    base_rates={m:{str(k):[] for k in MILESTONES[m]} for m in MARKETS}
    for r in train:
        band=min(9,int(r["p_play"]*10))
        reliability[band].append(1.0 if r["played"] else 0.0)
        for m in MARKETS:
            for k in MILESTONES[m]:
                base_rates[m][str(k)].append(
                    1.0 if r["played"] and r["actual"][m]>=k else 0.0)
            if r["played"]:
                residuals[m].append(round(
                    scaled_residual(m,r["means"][m],r["actual"][m]),8))
    if min(map(len,residuals.values()))<MIN_TRAIN_PLAYED:
        raise ValueError("NBA_CONDITIONAL_RESIDUALS_TOO_SPARSE")
    for m in MARKETS:residuals[m].sort()
    # Prior centered on each bucket's mean historical P(play), with 35
    # pseudo-observations; this avoids extreme 0/1 rates in tiny buckets.
    play_bins={}
    for band in range(10):
        rr=[r for r in train if min(9,int(r["p_play"]*10))==band]
        play_bins[str(band)]={
            "n":len(rr),
            "observed_played":sum(r["played"] for r in rr),
            "mean_original_p":round(statistics.mean(r["p_play"] for r in rr),7)
                 if rr else round((band+.5)/10,7)}
    return {
        "trained_between_utc_dates":[VALIDATION_FROM,HOLDOUT_FROM],
        "training_n_preselected_players":len(train),
        "training_n_played_players":sum(r["played"] for r in train),
        "training_games":len({r["game_id"] for r in train}),
        "play_reliability_bins":play_bins,
        "conditional_scaled_residuals":residuals,
        "training_target_baselines":{m:{k:round(statistics.mean(v),7)
            for k,v in base_rates[m].items()} for m in MARKETS},
        "source_cutoff_last_day":"2026-01-09",
    }

def adjusted_play_probability(fitted,raw):
    band=str(min(9,int(raw*10)))
    b=fitted["play_reliability_bins"][band]
    n=b["n"]
    # Smoothing toward *individual* model p; source is a coarsened
    # reliability correction rather than conditioning on final DNP.
    return (b["observed_played"]+35*raw)/(n+35)

def hit_probability(fitted,market,pred,p_play,threshold):
    if market not in MILESTONES or threshold not in MILESTONES[market]:
        raise ValueError("NBA_UNTRAINED_OR_NON_INTEGER_MILESTONE")
    if not math.isfinite(pred) or pred<0 or not 0<=p_play<=1:
        raise ValueError("NBA_INVALID_PREGAME_NUMERICAL_INPUT")
    conditional=residual_hit_probability(
        fitted["conditional_scaled_residuals"][market],market,pred,threshold)
    if conditional is None:raise ValueError("NBA_NO_INDEPENDENT_CONDITIONAL_DISTRIBUTION")
    return adjusted_play_probability(fitted,p_play)*conditional

def metrics(rows,market,fitted):
    held=[r for r in rows if r["game_day"]>=HOLDOUT_FROM]
    if not held:raise ValueError("NBA_EMPTY_LATER_PERIOD")
    all_observations=[]
    for r in held:
        for threshold in MILESTONES[market]:
            q=hit_probability(fitted,market,r["means"][market],r["p_play"],threshold)
            y=float(bool(r["played"] and r["actual"][market]>=threshold))
            b=fitted["training_target_baselines"][market][str(threshold)]
            all_observations.append((q,y,b,r["game_id"]))
    n=len(all_observations)
    brier=statistics.mean((q-y)**2 for q,y,b,g in all_observations)
    base=statistics.mean((b-y)**2 for q,y,b,g in all_observations)
    high=[(q,y) for q,y,b,g in all_observations if q>=PROB_CUTOFF]
    bins=[]
    ece=0
    for k in range(10):
        z=[(q,y) for q,y,b,g in all_observations if
           min(9,int(q*10))==k]
        if not z:continue
        meanq=statistics.mean(q for q,y in z)
        hit=statistics.mean(y for q,y in z)
        ece+=len(z)/n*abs(meanq-hit)
        bins.append({"bin":k,"n":len(z),"forecast":round(meanq,5),
             "actual":round(hit,5)})
    high_gap=(abs(statistics.mean(q for q,y in high)-
                  statistics.mean(y for q,y in high)) if high else None)
    return {"n_original_player_outcomes":len(held),
        "n_market_threshold_observations":n,
        "n_independent_games":len({r["game_id"] for r in held}),
        "n_played":sum(r["played"] for r in held),
        "brier_distribution":round(brier,6),
        "brier_training_climatology":round(base,6),
        "brier_improvement":round(base-brier,6),
        "ece_tenths":round(ece,6),
        "n_ge65_probability":len(high),
        "p_ge65_mean_forecast":round(statistics.mean(q for q,y in high),5)
            if high else None,
        "p_ge65_realized_frequency":round(statistics.mean(y for q,y in high),5)
            if high else None,
        "p_ge65_absolute_reliability_gap":round(high_gap,6)
            if high_gap is not None else None,
        "reliability_bins":bins}

def fit_and_audit(rows):
    for r in rows:
        if (r["game_day"]>=VALIDATION_FROM and
            (not r["played"] and r["actual"] is not None or
             r["played"] and r["actual"] is None)):
            raise ValueError("NBA_PROBABILITY_ACTUAL_PLAY_CONTRADICTION")
    fitdoc=fit(rows)
    hold=[r for r in rows if r["game_day"]>=HOLDOUT_FROM]
    trainingids={(r["game_id"],r["team_id"],r["player_id"]) for r in rows
          if VALIDATION_FROM<=r["game_day"]<HOLDOUT_FROM}
    holdids={(r["game_id"],r["team_id"],r["player_id"]) for r in hold}
    if not holdids or trainingids.intersection(holdids):
        raise ValueError("NBA_NO_DISJOINT_FORWARD_HOLDOUT")
    evidence={}
    for m in MARKETS:
        audit=metrics(rows,m,fitdoc)
        promoted=bool(
            audit["n_original_player_outcomes"]>=MIN_HOLDOUT_PLAYERS and
            audit["n_market_threshold_observations"]>=MIN_HOLDOUT_TARGETS and
            audit["n_ge65_probability"]>=MIN_HIGH_P_BIN and
            audit["brier_improvement"]>=MIN_BRIER_LIFT and
            audit["ece_tenths"]<=MAX_ECE and
            audit["p_ge65_absolute_reliability_gap"] is not None and
            audit["p_ge65_absolute_reliability_gap"]<=MIN_HIGH_P_RELIABILITY)
        evidence[m]={**audit,"heldout_probability_gate_passed":promoted,
            "release_status":"HISTORICAL_HOLDOUT_VALIDATED_2026_27_UNPROVEN"
                if promoted else "HISTORICAL_PROBABILITY_GATE_FAILED"}
    return {
        "schema":SCHEMA,"numerical_model_version":VERSION,
        "outcome_distribution":"validation_empirical_scale_adjusted_residual_cdf_and_play_reliability_v1",
        "fit":fitdoc,
        "heldout_start_date":HOLDOUT_FROM,
        "heldout_last_date":"2026-02-01",
        "training_and_holdout_are_disjoint_games":True,
        "training_source_is_prior_2025_26_season":True,
        "no_bookmaker_data_needed":True,
        "official_bets":0,
        "heldout_release_gates":{
            "minimum_holdout_player_outcomes":MIN_HOLDOUT_PLAYERS,
            "minimum_holdout_market_target_observations":MIN_HOLDOUT_TARGETS,
            "minimum_65plus_predictions":MIN_HIGH_P_BIN,
            "max_ece":MAX_ECE,
            "minimum_brier_improvement_over_prior_climatology":MIN_BRIER_LIFT,
            "max_65plus_reliability_gap":MIN_HIGH_P_RELIABILITY},
        "markets":evidence,
        "some_historical_market_passed":any(v["heldout_probability_gate_passed"]
                  for v in evidence.values()),
        "calibrated_for_forward_2026_27":False,
        "cannot_certify_game_day_injuries_or_bets":True,
        "note":"Old 2025-26 distribution fit on validation ONLY, market-by-market honest 2026 holdout. Historical validated p>=65 is a provisional model estimate; 2026-27 active-roster and calibration monitoring required before claiming actual betting advantage."
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--team-report",type=Path,
       default=Path("docs/nba_v1_forward_walkback.json"))
    ap.add_argument("--cache",type=Path,default=Path(".cache/nba-v2-boxscores"))
    ap.add_argument("--out",type=Path,
       default=Path("docs/nba_v2_probability_distribution_v1.json"))
    args=ap.parse_args()
    if args.out.exists():raise ValueError("NBA_PROBABILITY_FIRST_PUBLICATION_EXISTS")
    team=json.loads(args.team_report.read_text())
    if team.get("schema")!="NBA_V1_LEAKSAFE_ESPN_TEAM_HOLDOUT_V1":
        raise ValueError("NBA_BAD_HISTORICAL_TEAM_REPORT")
    records=sorted((r for r in team["rows"] if r["completed"]),
        key=lambda g:(g["day_utc"],g["start_utc"],g["game_id"]))[:730]
    if len(records)<700 or records[-1]["day_utc"]<"2026-01-20":
        raise ValueError("NBA_NOT_ENOUGH_REAL_PREGAME_TEAM_GAMES")
    if records[FIRST_ORIGINAL_GAMES-1]["day_utc"]>"2025-12-07":
        raise ValueError("NBA_ORIGINAL_V2_HOLDOUT_BOUNDARY_INVALID")
    boxes,errors=load_games(records,args.cache,workers=5)
    if len(boxes)/len(records)<.97:
        raise ValueError(f"NBA_SOURCE_PLAYER_BOXES_BELOW_97_PCT {len(boxes)}/{len(records)}")
    good=[g for g in records if g["game_id"] in boxes]
    rows=parse_rows(good,boxes)
    result=fit_and_audit(rows)
    result["source_team_sha256"]=team["source"]["source_content_sha256"]
    result["source_boxscore_coverage"]=round(len(good)/len(records),6)
    result["source_boxscore_games"]=len(good)
    result["source_player_firstseen_rows"]=len(rows)
    result["source_boxscore_errors"]=errors
    result["artifact_sha256"]=hashlib.sha256(json.dumps(
        result,sort_keys=True,separators=(",",":"),allow_nan=False).encode()).hexdigest()
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,indent=2,sort_keys=True,allow_nan=False)+"\n")
    print("NBA_V2_REAL_VALIDATION_FIT_LATER_HOLDOUT_PROBABILITIES",
        json.dumps({m:{k:v[k] for k in ("n_market_threshold_observations",
           "brier_distribution","brier_improvement","ece_tenths",
           "n_ge65_probability","p_ge65_absolute_reliability_gap",
           "heldout_probability_gate_passed")}
           for m,v in result["markets"].items()},sort_keys=True),flush=True)

if __name__=="__main__":main()
