#!/usr/bin/env python3
"""NBA V3 Phase-1 challenger: source-as-of roles -> opportunities -> full-game draws.

NFL Phase1 *architecture*, not NFL coefficients. All game outcomes are drawn
from pregame team rotation, conditional minutes, the recorded player
shot/assist/rebound opportunity rates and common team possessions uncertainty.

- Historical played box scores ONLY; current ESPN roster limits candidates.
- Independent timestamped OUT information may remove a player; absence of an
  injury entry never implies ACTIVE or a certified NBA starting lineup.
- Per-simulation team allocation never exceeds 240 regulation minutes.
- Full integer count CDF for PTS/REB/AST/3PM, with DNP=0 unconditionally.
- Never use sportsbook lines to generate numerical projections/probabilities.
- Not a champion: V2 originals stay immutable. Model/source promotion MUST be
  earned on new untouched, genuine first-seen 2026-27 forward outcomes.
"""
from __future__ import annotations
import hashlib
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
import numpy as np

VERSION="nba-v3-phase1-opportunity-role-mc-challenger-20261025"
SCHEMA="NBA_V3_FIRSTSEEN_PHASE1_PREGAME_OUTCOME_DISTRIBUTION_RESEARCH_V1"
MARKETS=("points","rebounds","assists","three_pointers_made")
RATE_PRIORS={"points":.45,"rebounds":.165,"assists":.105,"three_pointers_made":.050}
CDF_MAX={"points":90,"rebounds":45,"assists":35,"three_pointers_made":17}
MIN_HISTORY=5
TEAM_MINUTES=240.
MAX_MINUTES=42.
# Predeclared exploratory lattice; more granular than V2's restrictive 15+
# points, 6+ rebounds, 5+ assists and 2+ threes. No '65% = value bet' claim.
MEANINGFUL_MIN={"points":6,"rebounds":3,"assists":2,"three_pointers_made":1}
DRAWS=8000

def utc(value):
    when=datetime.fromisoformat(str(value).replace("Z","+00:00"))
    if when.tzinfo is None:raise ValueError("NBA_V3_NAIVE_CLOCK")
    return when.astimezone(timezone.utc)

def source_hash(obj):
    return hashlib.sha256(json.dumps(obj,sort_keys=True,separators=(",",":"),
                                     allow_nan=False).encode()).hexdigest()

def _mean(rows,key,n=8):
    values=[float(r[key]) for r in rows[-n:]]
    return sum(values)/len(values) if values else 0.

def _clip(v,lo,hi):return max(lo,min(hi,v))

def role_pool(team_id,histories,team_games,first_seen,last_seen,roster_ids,
              *,asof_utc,tipoff_utc,statuses=()):
    """Source-prior rotation and per-minute opportunity, no postgame roster."""
    at=utc(asof_utc);tip=utc(tipoff_utc)
    if at>=tip:raise ValueError("NBA_V3_NOT_BEFORE_TIP")
    if not roster_ids:raise ValueError("NBA_V3_MISSING_INDEPENDENT_ROSTER")
    roster=set(map(str,roster_ids))
    evidence={}
    for s in statuses:
        pid=str(s["player_id"])
        if (pid in evidence or s["team_id"]!=str(team_id) or pid not in roster or
            s["status"] not in ("OUT","ACTIVE") or
            s.get("independently_verified") is not True or
            not str(s.get("source_url","")).startswith("https://") or
            utc(s["published_at_utc"])>at):
            raise ValueError("NBA_V3_UNVERIFIED_OR_DUPLICATE_INJURY")
        evidence[pid]=s["status"]
    members=[]
    idx=int(team_games[team_id])
    for (tid,pid),hist in histories.items():
        if tid!=team_id or str(pid) not in roster or len(hist)<MIN_HISTORY:
            continue
        indices=[r.get("team_game_index") for r in hist]
        if (len(indices)!=len(set(indices)) or indices!=sorted(indices) or
            any(not isinstance(x,int) or x>=idx or x<0 for x in indices) or
            last_seen[(tid,pid)]!=indices[-1] or
            first_seen[(tid,pid)]!=indices[0]):
            raise ValueError("NBA_V3_FUTURE_TEAM_GAME_HISTORY")
        # Preserve known bench players; don't fabricate games for a transfer.
        if idx-1-indices[-1]>7:continue
        appearances=sum(x>=idx-8 for x in indices)
        observed_span=min(8,idx-int(first_seen[(tid,pid)]))
        observed_span=max(1,observed_span)
        if appearances>observed_span:raise ValueError("NBA_V3_ROLE_APPEARANCE_CONTRADICTION")
        # Beta-Binomial shrinkage; this is P(appears), NOT an official NBA
        # game-day active designation. Historical calibration still needed.
        p_play=_clip((appearances+2.)/(observed_span+3.),.05,.99)
        recent=hist[-12:]
        m3=_mean(recent,"minutes",3);m8=_mean(recent,"minutes",8)
        m12=_mean(recent,"minutes",12)
        minutes=_clip(.52*m3+.33*m8+.15*m12,3.,MAX_MINUTES)
        starting=sum(bool(r.get("started")) for r in recent[-5:])/min(len(recent),5)
        starterlong=sum(bool(r.get("started")) for r in recent)/len(recent)
        minutes=_clip(minutes+2.0*(starting-starterlong),3.,MAX_MINUTES)
        mm=np.asarray([float(r["minutes"]) for r in recent],dtype=float)
        if np.any(mm<=0) or np.any(mm>65):raise ValueError("NBA_V3_BAD_HISTORICAL_MINUTES")
        minute_sd=float(_clip(np.std(mm,ddof=1) if len(mm)>1 else 6.,2.5,12.))
        absence=evidence.get(str(pid))
        if absence=="OUT":p_play=0.
        elif absence=="ACTIVE":p_play=max(p_play,.97)
        # Past actual player shots are opportunities, not current lineup
        # guarantees. When absent, use demonstrated 4-stat box score only.
        exposure=sum(float(r["minutes"]) for r in recent)
        rates={}
        for market in MARKETS:
            count=sum(float(r[market]) for r in recent)
            rates[market]=(count+RATE_PRIORS[market]*120)/(exposure+120)
        complete=[r for r in recent if all(k in r for k in
                  ("field_goal_attempts","field_goals_made",
                   "three_point_attempts","three_pointers_made",
                   "free_throw_attempts","free_throws_made"))]
        if len(complete)>=4:
            total_minutes=sum(float(r["minutes"]) for r in complete)
            def rate(k,default=0):return sum(float(r[k]) for r in complete)/total_minutes
            # Hard source physical invariants; do not infer bogus attempts.
            for r in complete:
                if (r["field_goal_attempts"]<r["field_goals_made"] or
                    r["three_point_attempts"]<r["three_pointers_made"] or
                    r["field_goal_attempts"]<r["three_point_attempts"] or
                    r["free_throw_attempts"]<r["free_throws_made"] or
                    r["field_goals_made"]<r["three_pointers_made"]):
                    raise ValueError("NBA_V3_INVALID_SHOT_PROFILE")
            fga=rate("field_goal_attempts")
            fgm=rate("field_goals_made")
            pa3=rate("three_point_attempts")
            made3=rate("three_pointers_made")
            fta=rate("free_throw_attempts")
            ftm=rate("free_throws_made")
            profile={
                "two_pa_per_minute":max(0,fga-pa3),
                "three_pa_per_minute":pa3,
                "fta_per_minute":fta,
                "two_pct":_clip((fgm-made3+.45*12)/(max(.01,fga-pa3)*total_minutes+12),.08,.75),
                "three_pct":_clip((made3+.35*12)/(max(.01,pa3)*total_minutes+12),.08,.65),
                "ft_pct":_clip((ftm+.75*12)/(max(.01,fta)*total_minutes+12),.35,.97)
            }
        else:profile=None
        members.append({
            "team_id":str(tid),"player_id":str(pid),"player":hist[-1]["player"],
            "p_play":round(p_play,5),"minutes_if_playing":round(minutes,4),
            "minutes_sd":round(minute_sd,4),"prior_games":len(hist),
            "historical_starter_share":round(starting,4),
            "rates_per_minute":rates,"shot_profile":profile,
            "profile_games":len(complete),
            "reported_status":absence or "UNKNOWN_NOT_ACTIVE_CERTIFIED",
            "role_evidence":"PRIOR_REAL_COMPLETED_TEAM_GAMES",
            "game_day_starter_certified":False,
            "game_day_active_certified":False,
        })
    # Individual pregame roles are modeled in competition, not independent
    # 42-minute entitlements. Unknown roster slots retain unmodeled reserve.
    members.sort(key=lambda x:(-x["minutes_if_playing"]*x["p_play"],x["player_id"]))
    return members

def simulate_matchup(game_id,teams,*,asof_utc,tipoff_utc,
                     draws=DRAWS,pace_context=None):
    if not 100<=draws<=100000:raise ValueError("NBA_V3_UNTESTED_SIM_N")
    at,tip=utc(asof_utc),utc(tipoff_utc)
    if at>=tip:raise ValueError("NBA_V3_AFTER_TIP_SIMULATION")
    if len(teams)!=2 or set(teams)=={""}:raise ValueError("NBA_V3_BAD_MATCHUP_TEAMS")
    identity="|".join([VERSION,str(game_id),at.isoformat(),tip.isoformat()])
    seed=int.from_bytes(hashlib.sha256(identity.encode()).digest()[:8],"big")
    rng=np.random.default_rng(seed)
    outputs=[];quality={}
    # Common environment: one game pace draw, shared by teammates and
    # opponents. Data-based pace multiplier only when prior possessions are
    # independently available, never synthesized from boxscore points.
    environment=np.clip(rng.lognormal(-.5*.07**2,.07,draws),.78,1.25)
    for team_id,members in sorted(teams.items()):
        if not members:continue
        expected=np.asarray([m["minutes_if_playing"] for m in members])
        pplay=np.asarray([m["p_play"] for m in members])
        sd=np.asarray([m["minutes_sd"] for m in members])
        active=rng.random((draws,len(members)))<pplay
        raw_minutes=np.clip(rng.normal(expected,sd,(draws,len(members))),0,MAX_MINUTES)*active
        total=raw_minutes.sum(axis=1)
        # Every draw conserves physical 240 team minutes, and unmodeled
        # bench minutes remain unused when players have missing history.
        scalar=np.minimum(1.,TEAM_MINUTES/np.maximum(total,1.))
        minutes=raw_minutes*scalar[:,None]
        if float(np.max(minutes.sum(axis=1)))>TEAM_MINUTES+1e-6:
            raise ValueError("NBA_V3_MINUTE_SIMULATION_CONSERVATION")
        quality[team_id]={
            "roster_players_modeled":len(members),
            "prior_model_expected_minutes":round(float(np.sum(expected*pplay)),2),
            "simulated_team_expected_minutes":round(float(minutes.sum(axis=1).mean()),2),
            "unmodeled_rotation_reserve":round(max(0,TEAM_MINUTES-float(minutes.sum(axis=1).mean())),2),
            "team_240_minute_conservation":True,
            "verified_game_day_active_players":0,
            "verified_starting_lineup_players":0
        }
        for j,m in enumerate(members):
            sim={}
            exposure=minutes[:,j]*environment
            three_rate=m["rates_per_minute"]["three_pointers_made"]
            profile=m["shot_profile"]
            if profile:
                pa3=rng.poisson(rng.gamma(10.,
                    np.maximum(0,exposure*profile["three_pa_per_minute"])/10.))
                threes=rng.binomial(pa3,profile["three_pct"])
                pa2=rng.poisson(rng.gamma(10.,
                    np.maximum(0,exposure*profile["two_pa_per_minute"])/10.))
                twos=rng.binomial(pa2,profile["two_pct"])
                fta=rng.poisson(np.maximum(0,exposure*profile["fta_per_minute"]))
                madeft=rng.binomial(fta,profile["ft_pct"])
                points=3*threes+2*twos+madeft
                sim["three_pointers_made"]=threes
                sim["points"]=points
            else:
                # Data-degraded fallback records exactly what is missing.
                lam3=np.maximum(0,exposure*three_rate)
                threes=rng.negative_binomial(7.,7./(7.+lam3))
                residual_per_minute=max(0,
                    m["rates_per_minute"]["points"]-3*three_rate)
                rest=exposure*residual_per_minute
                points=3*threes+rng.negative_binomial(12.,12./(12.+rest))
                sim["points"]=points
                sim["three_pointers_made"]=threes
            for market,disp in (("rebounds",11.),("assists",9.)):
                lam=np.maximum(0,exposure*m["rates_per_minute"][market])
                sim[market]=rng.negative_binomial(disp,disp/(disp+lam))
            for market in MARKETS:
                vals=np.asarray(sim[market],dtype=np.int64)
                if np.any(vals<0):raise ValueError("NBA_V3_NEGATIVE_STAT_DRAW")
                top=CDF_MAX[market]
                histogram=np.bincount(np.minimum(vals,top),minlength=top+1)
                cdf=np.cumsum(histogram)/draws
                if not np.all(np.diff(cdf)>=-1e-12) or abs(float(cdf[-1])-1)>1e-10:
                    raise ValueError("NBA_V3_NONMONOTONE_SIMULATION_CDF")
                mean=float(np.mean(vals))
                q=np.quantile(vals,[.1,.25,.5,.75,.9])
                above=[(threshold,round(float(1-cdf[threshold-1]),6))
                  for threshold in range(MEANINGFUL_MIN[market],min(top,50)+1)]
                valid_targets=[(threshold,prob) for threshold,prob in above
                    if prob>=.65]
                # A high p alone doesn't certify calibration; only a
                # milestone event candidate, never a priced wager.
                selected=valid_targets[-1] if valid_targets else None
                outputs.append({
                    "game_id":str(game_id),"team_id":str(team_id),
                    "player_id":m["player_id"],"player":m["player"],
                    "market":market,"model_version":VERSION,
                    "mean":round(mean,4),"median":float(q[2]),
                    "sd":round(float(np.std(vals)),4),
                    "p10":float(q[0]),"p25":float(q[1]),"p75":float(q[3]),"p90":float(q[4]),
                    "p_active":round(float(np.mean(minutes[:,j]>0)),6),
                    "exp_opp":round(float(np.mean(exposure)),4),
                    "role_share":round(float(np.mean(minutes[:,j]))/TEAM_MINUTES,6),
                    "unc":round(float(np.std(vals)),4),
                    "unc_reasons":[
                        "GAME_DAY_ACTIVE_NOT_CERTIFIED",
                        "STARTING_LINEUP_NOT_CERTIFIED",
                        *([] if profile else ["ATTEMPT_PROFILE_UNAVAILABLE_DEGRADED_FALLBACK"]),
                        *([] if quality[team_id]["unmodeled_rotation_reserve"]<15 else
                            ["UNMODELED_TEAM_ROTATION_MINUTES"])
                    ],
                    "cdf_lattice":{"step":1,"cdf":[round(float(x),6) for x in cdf]},
                    "model_target":({"milestone":selected[0],"probability":selected[1],
                                    "method":"pregame_full_game_mc_cdf"}
                                   if selected else None),
                    "conditional_minutes_mean":m["minutes_if_playing"],
                    "prior_history_n":m["prior_games"],
                    "profile_coverage_n":m["profile_games"],
                    "reported_status":m["reported_status"],
                    "calibrated_for_2026_27":False,"research_only":True,
                    "not_an_official_bet":True,
                })
    return {"schema":SCHEMA,"model_version":VERSION,"game_id":str(game_id),
        "asof_utc":at.isoformat(),"tipoff_utc":tip.isoformat(),
        "model_simulations":draws,"seed_source_sha256":hashlib.sha256(identity.encode()).hexdigest(),
        "games_modeled":1,"team_opportunity_diagnostics":quality,
        "rows":outputs,"rows_count":len(outputs),
        "outcome_probability_source":"MONTE_CARLO_FROM_PAST_REAL_ROLES_AND_OPPORTUNITIES",
        "sportsbook_line_used":False,"no_game_day_starter_certification":True,
        "official_bets":0,"historically_calibrated_for_current_season":False,
        "research_only":True}
