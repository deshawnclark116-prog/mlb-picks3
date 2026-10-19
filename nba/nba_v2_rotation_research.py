#!/usr/bin/env python3
"""Frozen NBA V2 rotation/usage CHALLENGER, never the serving champion.

Only previously completed ESPN player boxscores may supply features. Player
appearance uncertainty is computed on previous TEAM games (not a count of the
last twelve player appearances). No current-game roster or playing time is
inferred from the eventual final boxscore.

Separate source-timestamped out/active scenarios can modify expected minutes,
but this experiment does not use them for retroactive first-seen betting claims.
"""
from __future__ import annotations
import collections
import datetime as dt
import math
import statistics
from nba.nba_v1_player_model import STAT_NAMES, project_player

VERSION="nba-v2-rotation-and-exposure-frozen-challenger-20261019"
RATE_PRIORS={"points":.39,"rebounds":.145,"assists":.09,"three_pointers_made":.028}
MARKETS=tuple(STAT_NAMES)
MAX_PLAYER_MINUTES=42.0
TEAM_REGULATION_MINUTES=240.0

def _mean(rows,key):
    return sum(float(r[key]) for r in rows)/len(rows)

def _clip(x,lo,hi):
    return min(hi,max(lo,x))

def _validate_history(history,current_team_index):
    if not history:return
    indices=[r.get("team_game_index") for r in history]
    if any(not isinstance(i,int) or i<0 or i>=current_team_index for i in indices):
        raise ValueError("NBA_V2_FUTURE_OR_MISSING_TEAM_INDEX")
    if indices!=sorted(indices) or len(set(indices))!=len(indices):
        raise ValueError("NBA_V2_DUPLICATE_OR_OUT_OF_ORDER_PLAYER_APPEARANCE")
    for r in history:
        if not (0<float(r["minutes"])<=65):
            raise ValueError("NBA_V2_BAD_PRIOR_MINUTES")

def team_forecasts(team_id, histories, team_games, first_seen, last_seen):
    """Return paired cohort with explicit unallocated team minutes if coverage low.

    Never force players with unknown recent histories into imaginary starting
    rotations, and never increase the remaining modeled players just to sum 240.
    """
    idx=team_games[team_id]
    candidates=[]
    for (team,pid),hist in histories.items():
        if team!=team_id:continue
        _validate_history(hist,idx)
        elapsed=idx-first_seen[(team,pid)]+1
        old,reason=project_player(hist,elapsed,last_seen[(team,pid)],idx)
        if reason:continue
        r5=hist[-5:]
        r12=hist[-12:]
        season=hist[-30:]
        # Prior team game indices, not games where a player happened to appear.
        eligible_team_games=min(10,elapsed,idx)
        seen=sum(x["team_game_index"]>=idx-eligible_team_games for x in hist)
        if seen>eligible_team_games:raise ValueError("NBA_V2_IMPOSSIBLE_TEAM_GAME_COVERAGE")
        # Strong regular-role prior but actual absences modify the posterior.
        p_play=_clip((seen+9)/(eligible_team_games+10),.05,.985)
        minutes=_clip(.63*_mean(r5,"minutes")+.27*_mean(r12,"minutes")+
                      .10*_mean(season,"minutes"),3.0,MAX_PLAYER_MINUTES)
        starts_recent=sum(1 for x in r5 if x.get("started") is True)/len(r5)
        starts_long=sum(1 for x in season if x.get("started") is True)/len(season)
        # Start assignment is only a historical tendency, not a confirmed lineup.
        minutes=_clip(minutes+2.0*(starts_recent-starts_long),3,MAX_PLAYER_MINUTES)
        sd=statistics.pstdev(x["minutes"] for x in r12) if len(r12)>1 else 6
        # Exposure-weighted count rates: avoid equal weight to 2-minute and
        # 35-minute outings and regularize small samples independently.
        expected_stats={}
        for market in MARKETS:
            exposure=sum(float(r["minutes"]) for r in r12)
            exposure5=sum(float(r["minutes"]) for r in r5)
            rate12=sum(float(r[market]) for r in r12)/exposure
            rate5=sum(float(r[market]) for r in r5)/exposure5
            blended_rate=.70*rate12+.30*rate5
            exposure_prior=120.0
            rate=(blended_rate*exposure+RATE_PRIORS[market]*exposure_prior)/(exposure+exposure_prior)
            expected_stats[market]=minutes*rate
        candidates.append({
            "team_id":str(team_id),"player_id":str(pid),"player":hist[-1]["player"],
            "conditional_minutes_mean":round(minutes,4),
            "p_play_unverified":round(p_play,5),
            "expected_minutes":round(minutes*p_play,4),
            "historical_start_frequency":round(starts_recent,4),
            "minutes_sd_observed":round(sd,3),
            "conditional_stat_means":{m:round(v,4) for m,v in expected_stats.items()},
            "research_only":True,"starter_certified":False,
            "injury_certified":False,"source":"PRIOR_COMPLETE_ESPN_GAMES_ONLY",
        })
    # Team-simulation conservation only on MODELED expected playing time.
    # Unknown bench or newly transferred players remain a visible reserve.
    total=sum(p["expected_minutes"] for p in candidates)
    if total>TEAM_REGULATION_MINUTES:
        scale=TEAM_REGULATION_MINUTES/total
        for player in candidates:
            player["conditional_minutes_mean"]=round(player["conditional_minutes_mean"]*scale,4)
            player["expected_minutes"]=round(
                player["conditional_minutes_mean"]*player["p_play_unverified"],4)
            player["conditional_stat_means"]={m:round(v*scale,4)
                for m,v in player["conditional_stat_means"].items()}
    allocated=sum(p["expected_minutes"] for p in candidates)
    return {"team_id":str(team_id),"model_version":VERSION,
        "players":candidates,
        "allocated_expected_minutes":round(allocated,3),
        "unmodeled_reserve_minutes":round(max(0,TEAM_REGULATION_MINUTES-allocated),3),
        "regulation_minutes_reference":TEAM_REGULATION_MINUTES,
        "no_verified_game_day_rotations":True,"research_only":True}

def _utc(s):
    x=dt.datetime.fromisoformat(str(s).replace("Z","+00:00"))
    if x.tzinfo is None:raise ValueError("NBA_V2_NAIVE_STATUS_TIME")
    return x.astimezone(dt.timezone.utc)

def conditional_absence_scenario(team_projection, evidence, asof_utc, tipoff_utc):
    """Condition on genuine independent pregame reports, not final DNP labels.

    Evidence shape: team_id, player_id, status=OUT/ACTIVE, published_at_utc,
    source_url, independently_verified=true. A status reported after forecast
    as-of is forbidden. No provider requests or fictional status assumptions.
    """
    now,tip=_utc(asof_utc),_utc(tipoff_utc)
    if not now<tip:raise ValueError("NBA_V2_SCENARIO_NOT_PREGAME")
    copy={"team_id":team_projection["team_id"],"model_version":VERSION,
        "players":[{**r,"conditional_stat_means":dict(r["conditional_stat_means"])}
                   for r in team_projection["players"]], "research_only":True,
        "scenario_not_original_frozen_forecast":True,
        "status_evidence_count":len(evidence),
        "never_official_bet":True}
    by_id={x["player_id"]:x for x in copy["players"]}
    seen=set()
    initial_expected=sum(x["expected_minutes"] for x in copy["players"])
    lost=0.0
    for e in evidence:
        if (not isinstance(e,dict) or e.get("team_id")!=team_projection["team_id"] or
                e.get("player_id") not in by_id or e.get("status") not in ("OUT","ACTIVE") or
                e.get("independently_verified") is not True or
                not str(e.get("source_url","")).startswith("https://")):
            raise ValueError("NBA_V2_UNVERIFIED_STATUS_EVIDENCE")
        pid=e["player_id"]
        if pid in seen:raise ValueError("NBA_V2_DUPLICATE_STATUS_EVIDENCE")
        seen.add(pid)
        observed=_utc(e["published_at_utc"])
        if observed>now or observed>=tip:raise ValueError("NBA_V2_POST_CUTOFF_STATUS_LEAKAGE")
        player=by_id[pid]
        if e["status"]=="OUT":
            lost+=player["expected_minutes"]
            player["p_play_unverified"]=0.0
            player["expected_minutes"]=0.0
            player["conditional_minutes_mean"]=0.0
            player["conditional_stat_means"]={m:0.0 for m in MARKETS}
        else:
            # P(active)=1 is a conditional research scenario, not a promise
            # about actual minutes, and can itself be uncertain after reporting.
            player["p_play_unverified"]=1.0
            player["expected_minutes"]=player["conditional_minutes_mean"]
    available=[x for x in copy["players"] if x["p_play_unverified"]>0]
    # Only 65% of potentially vacated expected playing minutes redistributed.
    # The rest is reserved for omitted, newly activated or unknown players.
    space=max(0,TEAM_REGULATION_MINUTES-sum(x["expected_minutes"] for x in available))
    redistribute=min(.65*lost,space)
    weighted=sum(x["expected_minutes"] for x in available)
    if weighted>0:
        for player in available:
            share=redistribute*(player["expected_minutes"]/weighted)
            original_cond=player["conditional_minutes_mean"]
            delta=min(share/max(player["p_play_unverified"],.01),
                      max(0,MAX_PLAYER_MINUTES-original_cond))
            scale=(original_cond+delta)/original_cond if original_cond>0 else 1
            player["conditional_minutes_mean"]=round(original_cond+delta,4)
            player["expected_minutes"]=round(player["conditional_minutes_mean"]*player["p_play_unverified"],4)
            player["conditional_stat_means"]={m:round(v*scale,4)
                for m,v in player["conditional_stat_means"].items()}
    total=sum(x["expected_minutes"] for x in copy["players"])
    copy["allocated_expected_minutes"]=round(total,3)
    copy["unmodeled_reserve_minutes"]=round(max(0,TEAM_REGULATION_MINUTES-total),3)
    copy["expected_minutes_before_evidence"]=round(initial_expected,3)
    return copy

def day_frozen_forecasts(games,boxscores):
    """All games on a UTC date are generated BEFORE any same-day boxscore."""
    perday=collections.defaultdict(list)
    for g in sorted(games,key=lambda x:(x["day_utc"],x["start_utc"],x["game_id"])):
        if g["completed"] and g["game_id"] in boxscores:
            perday[g["day_utc"]].append(g)
    team_games=collections.Counter()
    histories=collections.defaultdict(list)
    first_seen={}
    last_seen={}
    all_rows=[]
    for day,todays in sorted(perday.items()):
        for g in todays:
            for tid in (g["home_id"],g["away_id"]):
                projections=team_forecasts(tid,histories,team_games,first_seen,last_seen)
                for x in projections["players"]:
                    all_rows.append({**x,"game_id":g["game_id"],"game_day":day,
                        "source_cutoff":"START_OF_UTC_GAME_DATE",
                        "team_unmodeled_reserve_minutes":projections["unmodeled_reserve_minutes"]})
        # History advances only AFTER all predictions for this calendar day.
        for g in todays:
            for tid in (g["home_id"],g["away_id"]):
                prev=team_games[tid]
                for row in boxscores[g["game_id"]]:
                    if row["team_id"]!=tid:continue
                    key=(tid,row["player_id"])
                    if key not in first_seen:first_seen[key]=prev
                    histories[key].append({**row,"team_game_index":prev})
                    last_seen[key]=prev
                team_games[tid]+=1
    return all_rows
