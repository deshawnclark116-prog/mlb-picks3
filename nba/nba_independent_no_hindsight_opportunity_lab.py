#!/usr/bin/env python3
"""Independent NBA next-game numerical model competition, no leaked lineup.

Each feature uses ONLY games completed on EARLIER EASTERN GAME DATES.
Training 2025 calendar year, architecture validation 2026 Jan-Feb 14;
refit with both, then report Feb-Apr + Oct-Nov 2026 as consulted
DIAGNOSTIC periods, not a pristine prospectively frozen holdout.

Three approaches: actual recent-5 number (baseline), direct boosted
expected count, or boosted minutes * shrunk prior per-minute rate.
The model is conditioned on the player's team and ACTUAL PARTICIPATION
because the history file contains only players in the final box. That
cannot establish live pregame P(active), roster inclusion or betting
performance, and it is NOT a replacement for the frozen V4/V5 champions.
"""
from __future__ import annotations
import argparse
import collections
import datetime as dt
import json
import math
import random
from pathlib import Path
from statistics import mean

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from nba.nba_v4_backtest import load as read_game_files

SCHEMA="NBA_INDEPENDENT_PREGAME_NO_HINDSIGHT_OPPORTUNITY_ARCHITECTURES_A"
STATS={"points":"pts","rebounds":"reb","assists":"ast","three_pointers_made":"tpm"}
LEAGUE_PER_MIN={"pts":.49,"reb":.18,"ast":.115,"tpm":.046}
FEATURES=("min5","min10","min3","minsd5","last_min","start5",
          "played_prior","days_since_played","stat5","stat10",
          "stat_rate8","team_poss5","opp_allowed5","team_games",
          "opponent_games","home","day_of_season","prior_fga_per_min",
          "prior_tpa_per_min","prior_fta_per_min")
PARAMS=dict(max_iter=95,max_leaf_nodes=14,min_samples_leaf=45,
            learning_rate=.045,l2_regularization=15,random_state=20261120)
MARKETS=tuple(STATS)
SEED=20261120


def average(rows,key,default=0.0):
    return mean(float(x[key]) for x in rows) if rows else float(default)


def make_features(hist,team_prior,opp_prior,current_date,side,stat):
    """Pure as-of function; NO access to today's teammates, starter or stats."""
    if len(hist)<5 or len(team_prior)<3 or len(opp_prior)<3:
        return None
    h=hist[-12:]
    m5=h[-5:]
    recent_minutes=[float(x["min"]) for x in m5]
    mins=sum(float(x["min"]) for x in h[-8:])
    prior_total=sum(float(x[stat]) for x in h[-8:])
    # Fixed shrinkage basis; estimated entirely before the target fixture.
    rate=(prior_total+48*LEAGUE_PER_MIN[stat])/(mins+48)
    last_dt=dt.date.fromisoformat(str(h[-1]["date"])[:10])
    if last_dt>=current_date:
        raise ValueError("HINDSIGHT_SAME_DAY_GAME_IN_HISTORY")
    f=(average(m5,"min"),average(h[-10:],"min"),average(h[-3:],"min"),
       float(np.std(recent_minutes)),float(h[-1]["min"]),
       average(m5,"start"),min(len(hist),80),
       min(40,(current_date-last_dt).days),
       average(m5,stat),average(h[-10:],stat),rate,
       average(team_prior[-5:],"poss",100),
       average(opp_prior[-5:],"pts_allowed" if stat=="pts"
               else stat+"_allowed",100),
       min(len(team_prior),82),min(len(opp_prior),82),
       float(side=="home"),min(260,(current_date-dt.date(current_date.year,10,1)).days)
           if current_date.month>=10 else 105+current_date.timetuple().tm_yday,
       sum(x["fga"] for x in h[-8:])/max(1.,mins),
       sum(x["tpa"] for x in h[-8:])/max(1.,mins),
       sum(x["fta"] for x in h[-8:])/max(1.,mins))
    if len(f)!=len(FEATURES) or any(not math.isfinite(x) for x in f):
        raise ValueError("INVALID_NBA_PRETIP_FEATURES")
    return {"features":f,"prior_rate":rate,
            "baseline":average(m5,stat),
            "minutes_baseline":average(m5,"min"),
            "prior_playing_minutes":average(h[-10:],"min"),
            "history_games":len(hist)}


def dataset(games):
    """Every day's previews are built *before* updating ANY game on that day."""
    by_day=collections.defaultdict(list)
    seen=set()
    for g in games:
        key=str(g["game_id"])
        if key in seen:raise ValueError("DUPLICATE_SOURCE_GAME")
        seen.add(key)
        date=dt.date.fromisoformat(str(g["date"])[:10])
        by_day[date].append(g)
    player=collections.defaultdict(list)
    teams=collections.defaultdict(list)
    out=[]
    for day in sorted(by_day):
        todays=by_day[day]
        for g in todays:
            for p in g["players"]:
                if float(p["min"])<=0 or not p.get("id") or p["team"] not in (
                       str(g["home"]["id"]),str(g["away"]["id"])):
                    continue
                side=p["side"]
                if side not in ("home","away"):raise ValueError("MISMATCH_SIDE")
                own=str(g[side]["id"])
                opp=str(g["away" if side=="home" else "home"]["id"])
                if p["team"]!=own:raise ValueError("MISMATCH_PRETIP_TEAM")
                for market,stat in STATS.items():
                    prior=make_features(player[str(p["id"])],teams[own],
                         teams[opp],day,side,stat)
                    if not prior:continue
                    out.append({"date":day.isoformat(),"game":str(g["game_id"]),
                        "player":str(p["id"]),"team":own,"market":market,
                        "actual":float(p[stat]),"actual_min":float(p["min"]),
                        **prior})
        # Update AFTER all forecasts for calendar date are created.
        for g in todays:
            for side in ("home","away"):
                own=str(g[side]["id"])
                other="away" if side=="home" else "home"
                ps=[p for p in g["players"] if p["side"]==side]
                opp=[p for p in g["players"] if p["side"]==other]
                fga=sum(float(p["fga"]) for p in ps)
                fta=sum(float(p["fta"]) for p in ps)
                ore=sum(float(p["oreb"]) for p in ps)
                tov=sum(float(p["tov"]) for p in ps)
                games_record={"poss":max(60.,fga+.44*fta-ore+tov)}
                for stat in STATS.values():
                    games_record[stat+"_allowed"]=sum(float(p[stat]) for p in opp)
                games_record["pts_allowed"]=sum(float(p["pts"]) for p in opp)
                teams[own].append(games_record)
            for p in g["players"]:
                d={k:p[k] for k in ("min","start","pts","reb","ast","tpm",
                                    "fga","tpa","fta")}
                d["date"]=day.isoformat()
                player[str(p["id"])].append(d)
    return out


def fit(train,valid,market):
    a=[x for x in train if x["market"]==market]
    b=[x for x in valid if x["market"]==market]
    if len(a)<500 or len(b)<100:
        raise ValueError("INSUFFICIENT_CHRONOLOGY_"+market)
    xx=np.asarray([r["features"] for r in a])
    tt=np.asarray([r["features"] for r in b])
    expected=np.asarray([r["actual"] for r in a])
    mins=np.asarray([r["actual_min"] for r in a])
    direct=HistGradientBoostingRegressor(**PARAMS,loss="poisson").fit(xx,expected)
    minutes=HistGradientBoostingRegressor(**PARAMS).fit(xx,mins)
    result={}
    for r,direct_y,min_y in zip(b,direct.predict(tt),minutes.predict(tt)):
        key=(r["game"],r["player"],r["market"])
        if key in result:raise ValueError("DUPLICATE_PLAYER_GAME_STAT")
        result[key]={"baseline":max(0.,r["baseline"]),
                     "direct":max(0.,float(direct_y)),
                     "minute_factorized":max(0.,min(48.,float(min_y)))*r["prior_rate"],
                     "minutes_learned":min(48.,max(0.,float(min_y))),
                     "minutes_baseline":r["minutes_baseline"]}
    return result


def result_stats(rows,pred,arm):
    e=[];signed=[];within=[]
    for r in rows:
        k=(r["game"],r["player"],r["market"])
        if k not in pred:raise ValueError("UNPAIRED_NBA_PLAYER_STAT")
        v=float(pred[k][arm])
        signed.append(v-r["actual"])
        e.append(abs(v-r["actual"]))
        within.append(abs(v-r["actual"])<=2 if r["market"]!="points"
                      else abs(v-r["actual"])<=5)
    return {"n":len(e),"mae":round(mean(e),4) if e else None,
        "signed_bias":round(mean(signed),4) if signed else None,
        "within_2_or_5":round(mean(within),4) if within else None}


def game_cluster_gain_ci(rows,pred,challenger,baseline="baseline",
                         seed=SEED,iters=700):
    """Pure uncertainty report; no fitted model or prediction changes."""
    groups=collections.defaultdict(list)
    for r in rows:
        key=(r["game"],r["player"],r["market"])
        p=pred[key]
        gain=abs(float(p[baseline])-r["actual"])-abs(
             float(p[challenger])-r["actual"])
        groups[r["game"]].append(gain)
    if len(groups)<12:return None
    rng=random.Random(seed)
    g=list(groups.values())
    vals=[]
    for _ in range(iters):
        draw=[g[rng.randrange(len(g))] for _ in g]
        vals.append(mean(x for group in draw for x in group))
    vals.sort()
    return [round(vals[int(.025*(iters-1))],4),
            round(vals[int(.975*(iters-1))],4)]


def run(files):
    games=read_game_files(files)
    rows=dataset(games)
    cuts={"train_end":"2025-12-31","validate_end":"2026-02-14",
          "historical_test_end":"2026-04-14"}
    train=[r for r in rows if r["date"]<=cuts["train_end"]]
    valid=[r for r in rows if cuts["train_end"]<r["date"]<=cuts["validate_end"]]
    historic=[r for r in rows if cuts["validate_end"]<r["date"]<=cuts["historical_test_end"]]
    new_season=[r for r in rows if r["date"]>="2026-10-20"]
    if not all((train,valid,historic,new_season)):
        raise ValueError("NBA_MISSING_CHRONOLOGICAL_TRAIN_VALIDATION_OR_EVAL_WINDOW")
    result={"schema":SCHEMA,"production_changed":False,"official_bets":0,
        "conditional_on_actual_played_player":True,
        "future_lineup_not_a_model_input":True,
        "historical_consulted_testing_not_prospective":True,
        "eligible_to_promote":False,"player_participation_unknown":True,
        "no_original_v4_same_row_proof":True,"cuts":cuts,
        "counts":{"train":len(train),"validation":len(valid),
                  "consulted_spring":len(historic),"consulted_new_season":len(new_season)},
        "markets":{}}
    arms=("baseline","direct","minute_factorized")
    for market in MARKETS:
        candidates=fit(train,valid,market)
        vrows=[r for r in valid if r["market"]==market]
        scores={a:result_stats(vrows,candidates,a) for a in arms}
        winner=min(arms,key=lambda a:(scores[a]["mae"],arms.index(a)))
        combined=train+valid
        hpred=fit(combined,historic,market)
        npred=fit(combined,new_season,market)
        hrows=[r for r in historic if r["market"]==market]
        nrows=[r for r in new_season if r["market"]==market]
        result["markets"][market]={
            "chosen_exclusively_from_validation":winner,
            "validation":scores,
            "consulted_spring":{a:result_stats(hrows,hpred,a) for a in arms},
            "consulted_2026_27_season":{a:result_stats(nrows,npred,a) for a in arms},
            "game_cluster_mae_gain95_over_recent5": {
                "validation":{a:game_cluster_gain_ci(vrows,candidates,a)
                    for a in ("direct","minute_factorized")},
                "consulted_spring":{a:game_cluster_gain_ci(hrows,hpred,a)
                    for a in ("direct","minute_factorized")},
                "consulted_2026_27":{a:game_cluster_gain_ci(nrows,npred,a)
                    for a in ("direct","minute_factorized")}
            },
            "spring_predeclared_prior_15min_players":{a:result_stats(
                [r for r in hrows if r["prior_playing_minutes"]>=15],hpred,a)
                for a in arms},
            "forecasts_not_frozen_pretip":True}
    return result


if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--games",action="append",required=True)
    ap.add_argument("--out",required=True)
    a=ap.parse_args()
    r=run(a.games)
    dest=Path(a.out);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(r,indent=2)+"\n")
    print("NBA_INDEPENDENT_FUTURE_EXPOSURE_ARCHITECTURES_REAL_NUMERIC",
          json.dumps({"counts":r["counts"],"markets":r["markets"],
                      "production_changed":False,"promoted":False}))
