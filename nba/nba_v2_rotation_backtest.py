#!/usr/bin/env python3
"""Out-of-original-experiment NBA player V2 paired historical challenge.

Original V1 experiment ended after game 350 (2025-12-07). Fit nothing to its
results; evaluate the predeclared fixed V2 formula on additional games, with
validation 2025-12-08–2026-01-09 and later held-out 2026-01-10–2026-02-01.
This is historical pregame reconstruction, NEVER first-seen live performance.
"""
from __future__ import annotations
import argparse, collections, hashlib, json, random, statistics
from pathlib import Path
from nba.nba_v1_player_backtest import load_games, score
from nba.nba_v2_rotation_research import VERSION,day_frozen_forecasts,MARKETS

SCHEMA="NBA_V2_PREGAME_ROLE_RESEARCH_COMPARATIVE_HOLDOUT_V1"
VALIDATION_FROM="2025-12-08"
HOLDOUT_FROM="2026-01-10"
FIRST_ORIGINAL_GAMES=350
FIXED_SEED=20261019

def _mae(rows,field):
    return sum(abs(x[field]-x["actual"]) for x in rows)/len(rows) if rows else None

def confidence_interval_by_game(items,market,comparator,n=400):
    """Game-block bootstrap, not artificially treating teammates as iid."""
    bygame=collections.defaultdict(list)
    for r in items:bygame[r["game_id"]].append(r)
    games=sorted(bygame)
    if len(games)<8:return [None,None]
    randomizer=random.Random(FIXED_SEED+sum(ord(c) for c in market+comparator))
    delta=[]
    for _ in range(n):
        observed=[r for g in randomizer.choices(games,k=len(games)) for r in bygame[g]]
        improvement=sum(abs(r[comparator]-r["actual"])-
                        abs(r["v2"]-r["actual"]) for r in observed)/len(observed)
        delta.append(improvement)
    delta.sort()
    return [round(delta[int(.025*n)],4),round(delta[int(.975*n)-1],4)]

def paired_summary(items,market):
    r=[dict(game_id=x["game_id"],actual=x["actual"][market],
        v1=x["stat_mean"][market],v2=x["v2_conditional_stat_means"][market],
        recent5=x["baseline_recent_five"][market]) for x in items]
    if not r:return {"n":0}
    mean=lambda method:round(_mae(r,method),4)
    ci_v1=confidence_interval_by_game(r,market,"v1")
    ci5=confidence_interval_by_game(r,market,"recent5")
    return {
      "n":len(r),"mae_v1":mean("v1"),"mae_v2":mean("v2"),
      "mae_last5":mean("recent5"),
      "gain_vs_v1":round(mean("v1")-mean("v2"),4),
      "gain_vs_last5":round(mean("recent5")-mean("v2"),4),
      "gain_ci95_vs_v1":ci_v1,"gain_ci95_vs_last5":ci5,
    }

def evaluate(games,boxes,validation_from=VALIDATION_FROM,holdout_from=HOLDOUT_FROM):
    ordered=sorted((g for g in games if g["completed"] and g["game_id"] in boxes),
                    key=lambda g:(g["day_utc"],g["start_utc"],g["game_id"]))
    if len(ordered)<550:raise ValueError("NBA_V2_INSUFFICIENT_NEW_UNTOUCHED_GAMES")
    if ordered[FIRST_ORIGINAL_GAMES-1]["day_utc"]>"2025-12-07":
        raise ValueError("NBA_V2_ORIGINAL_HOLDOUT_BOUNDARY_CHANGED")
    old=score(ordered,boxes,validation_from,holdout_from)
    v2=day_frozen_forecasts(ordered,boxes)
    keys=lambda r:(str(r["game_id"]),str(r["team_id"]),str(r["player_id"]))
    v2_by_key={keys(r):r for r in v2}
    if len(v2_by_key)!=len(v2):raise ValueError("NBA_V2_DUPLICATE_FROZEN_CANDIDATES")
    paired=[]
    for row in old["results"]:
        if row["game_day"]<validation_from:continue
        candidate=v2_by_key.get(keys(row))
        if candidate is None:raise ValueError("NBA_V2_FAILED_PAIRED_COHORT_OR_PLAYER_ID")
        if candidate["game_day"]!=row["game_day"]:
            raise ValueError("NBA_V2_FORECAST_DAY_IDENTITY_MISMATCH")
        paired.append({**row,
            "v2_minutes_pred":candidate["conditional_minutes_mean"],
            "v2_p_play":candidate["p_play_unverified"],
            "v2_conditional_stat_means":candidate["conditional_stat_means"],
            "v2_unmodeled_team_minutes":candidate["team_unmodeled_reserve_minutes"]})
    if not paired:raise ValueError("NBA_V2_ZERO_MATCHED_FORECASTS")
    lookup={(str(g["game_id"]),str(r["team_id"]),str(r["player_id"]))
            for g in ordered for r in boxes[g["game_id"]]}
    # Brier of play/no-play for every PRESELECTED player. This metric is not
    # conditioned on who later played; DNP is a legitimate zero-appearance.
    play_brier={}
    for split,eligible in (("validation",lambda d:validation_from<=d<holdout_from),
                           ("holdout",lambda d:d>=holdout_from)):
        matches=[r for r in v2 if eligible(r["game_day"])]
        base_by_key={keys(r):r for r in old["results"] if eligible(r["game_day"])}
        oldprob={keys(r):r["prior_p_play_model"] for r in old["results"]
                 if eligible(r["game_day"])}
        # V1 probabilities for DNP are not in original grader. Compare only
        # V2 play Brier, and record the omission rather than inventing V1.
        if not matches:continue
        play_brier[split]={
          "n_preselected":len(matches),
          "n_played":sum(keys(r) in lookup for r in matches),
          "brier_v2":round(sum((r["p_play_unverified"]-(1 if keys(r) in lookup else 0))**2
                    for r in matches)/len(matches),5),
          "v1_comparable_play_brier":None,
          "v1_cannot_be_recovered_for_originally_excluded_dnps":True,
          "mean_unmodeled_team_minutes":round(statistics.mean(
              r["team_unmodeled_reserve_minutes"] for r in matches),3)
        }
    result={}
    for split in ("validation","holdout"):
        subset=[r for r in paired if r["split"]==split]
        metrics={m:paired_summary(subset,m) for m in MARKETS}
        if subset:
            metrics["minutes"]={
              "n":len(subset),
              "mae_v1":round(statistics.mean(abs(r["minutes_pred"]-r["actual_minutes"]) for r in subset),4),
              "mae_v2":round(statistics.mean(abs(r["v2_minutes_pred"]-r["actual_minutes"]) for r in subset),4),
            }
        result[split]={"n_same_played_players":len(subset),"by_market":metrics,
                       "playing":play_brier.get(split)}
    h=result["holdout"]["by_market"]
    # Research promotion predeclared, conservative: both PTS and AST must win
    # vs V1 and last-five with positive game-block CI and > 0.03-0.05 MAE.
    def qualifies(m,needed):
        z=h[m]
        return (z.get("n",0)>=400 and z["gain_vs_v1"]>=needed and
                z["gain_vs_last5"]>=needed and
                z["gain_ci95_vs_v1"][0] is not None and
                z["gain_ci95_vs_last5"][0] is not None and
                z["gain_ci95_vs_v1"][0]>0 and z["gain_ci95_vs_last5"][0]>0)
    gate={
      "min_played_samples":400,"points_min_gain_each":.05,
      "assists_min_gain_each":.03,
      "game_block_bootstrap_lower_ci_must_be_positive":True,
      "points_passed":qualifies("points",.05),
      "assists_passed":qualifies("assists",.03),
      "minutes_not_worse_than_v1_by_over_quarter_minute":
         bool(h.get("minutes") and h["minutes"]["mae_v2"]<=h["minutes"]["mae_v1"]+.25),
    }
    gate["passed"]=all((gate["points_passed"],gate["assists_passed"],
                        gate["minutes_not_worse_than_v1_by_over_quarter_minute"]))
    return {
      "schema":SCHEMA,"model_version":VERSION,
      "first_350_games_reserved_from_previous_experiment":True,
      "old_experiment_end":"2025-12-07","validation_from":validation_from,
      "untouched_holdout_from":holdout_from,
      "first_seen_live_predictions":False,
      "actual_current_season_rosters_verified":False,
      "historical_reconstructed_pregame_features_only":True,
      "independently_verified_book_odds":0,"official_bets":0,
      "evaluated_games":len(ordered),
      "paired_played_forecasts":len(paired),
      "v1_excluded_dnp_and_other_counts":old["quarantined"],
      "stats":result,"promotion_gate":gate,
      "decision":"RESEARCH_CHALLENGER_ONLY_PASSED_NUMERIC_GATE_NOT_LIVE"
                 if gate["passed"] else "RESEARCH_CHALLENGER_FROZEN_NO_PROMOTION",
      "notes":"Paired same-game played-player MAE is conditional; playing Brier separately grades all preselected candidates. No verified game-day rosters or market quotes."
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--team-report",type=Path,default=Path("docs/nba_v1_forward_walkback.json"))
    ap.add_argument("--cache",type=Path,default=Path(".cache/nba-v2-boxscores"))
    ap.add_argument("--out",type=Path,default=Path("docs/nba_v2_rotation_challenge.json"))
    ap.add_argument("--first-n-games",type=int,default=730)
    args=ap.parse_args()
    doc=json.loads(args.team_report.read_text())
    if doc.get("schema")!="NBA_V1_LEAKSAFE_ESPN_TEAM_HOLDOUT_V1":
        raise ValueError("NBA_V2_TEAM_SOURCE_INTEGRITY_REJECTED")
    games=sorted((g for g in doc["rows"] if g["completed"]),
                 key=lambda g:(g["day_utc"],g["start_utc"],g["game_id"]))[:args.first_n_games]
    if len(games)<550:raise ValueError("NBA_V2_NOT_ENOUGH_FROZEN_TEAM_GAMES")
    if games[-1]["day_utc"]<"2026-01-20":
        raise ValueError("NBA_V2_NO_NEW_HOLDOUT_INTERVAL")
    boxes,failed=load_games(games,args.cache,workers=5)
    # A minority of ESPN final-game player rows contain recorded stats
    # WITHOUT a trustworthy player identity. Never assign them a guessed ID.
    # Quarantine their WHOLE game from BOTH V1/V2 paired scoring. Original
    # V1 required >=95%; this challenger requires >=97%, documenting every
    # exclusion. This source-coverage adjustment followed source QA, NOT
    # observation of any model performance or holdout MAE.
    min_integrity_coverage=.97
    if len(boxes)<min_integrity_coverage*len(games):
        raise ValueError(f"NBA_V2_BOXSCORE_COVERAGE_FAIL {len(boxes)}/{len(games)} errors={list(failed.items())[:5]}")
    report=evaluate(games,boxes)
    report.update({"source_team_sha256":doc["source"]["source_content_sha256"],
       "boxscore_attempted":len(games),"boxscore_verified":len(boxes),
       "boxscore_missing_reasons":failed,
       "minimum_accepted_source_coverage":min_integrity_coverage,
       "missing_identity_is_quarantined_not_synthetic":True,
       "source_coverage_fraction":round(len(boxes)/len(games),5),
       "training_and_model_parameters_frozen_before_holdout_read":True})
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(report,indent=2,allow_nan=False)+"\n")
    print("NBA_V2_UNTOUCHED_ROLE_HOLDOUT",json.dumps({
        "games":len(games),"verified":len(boxes),
        "validation":report["stats"]["validation"],"holdout":report["stats"]["holdout"],
        "gate":report["promotion_gate"],"decision":report["decision"]},sort_keys=True))
if __name__=="__main__":main()
