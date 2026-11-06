"""Historical NBA tracking-informed opportunity allocation in V5.

This uses *real completed-season* touches, drives, potential assists and
rebound chances from the authorized source, but does NOT claim to observe
an individual game’s play call or defensive assignment. Only relative
player opportunity selection changes, not shot accuracy, possession count,
injury status or aggregate team pace. Experimental and OFF by default.

Frozen tracking observations must pass nba_v5_external_source validation
before this component is called. No sportsbook information is used.
"""
from __future__ import annotations

import copy
import math
import numpy as np

# A real tracked opportunity is not the same as an actual stat; allow each
# to change only the rate/relative allocation it can inform.
MARKET_TRACKING = {
    "ast": "potential_assists_per_game",
    "fga": "touches_per_game",
    "fta": "drives_per_game",
    "dreb": "rebound_chances_per_game",
    "oreb": "rebound_chances_per_game",
}
MIN_ROSTER_COVERAGE=5
MIN_SOURCE_GAMES=15
MAX_LOG_DELTA=math.log(1.13)


def audit_and_apply(team, profiles, *, activate=False):
    """Check source coverage and optionally return team with bounded role effects.

    A team adjustment requires >=5 real matched players for EACH individual
    opportunity statistic. Ineligible players retain the champion rate; a
    missing source statistic never becomes a synthesized value.
    Observed tracking belongs to the prior completed season, not live current
    game possessions. Strictly no current-game adjustment from future data.
    """
    n=len(team.ids)
    if n!=len(team.prof):
        raise ValueError("NBA_V5_TRACKING_BAD_TEAM_PROFILE")
    keybase=str(team.team_id)
    matched=[]
    for pid in team.ids:
        rec=profiles.get((keybase,str(pid)))
        if rec is not None and rec.get("sample_games",0)>=MIN_SOURCE_GAMES:
            matched.append(str(pid))
    report={"version":"nba-v5-free-tracking-opportunities-v1",
            "available_players":len(matched),"total_players":n,
            "eligible_stats":{},"adjusted_players":0,
            "adjustments_per_stat":{},
            "model_effect":"RESEARCH_ON" if activate else "SOURCE_SHADOW_ONLY"}
    if not activate:
        # In shadow mode do not mutate and do not return raw per-player data.
        for stat,source in MARKET_TRACKING.items():
            report["eligible_stats"][stat]=sum(
                1 for pid in team.ids
                if (rec:=profiles.get((keybase,str(pid)))) is not None
                and rec.get("sample_games",0)>=MIN_SOURCE_GAMES
                and rec.get("features",{}).get(source) is not None)
        return team,report
    out=copy.copy(team)
    out.prof=copy.deepcopy(team.prof)
    changed=set()
    for stat,source in MARKET_TRACKING.items():
        indices=[]
        actual=[]
        expected=[]
        weight=[]
        for j,pid in enumerate(team.ids):
            rec=profiles.get((keybase,str(pid)))
            if not rec or rec.get("sample_games",0)<MIN_SOURCE_GAMES:
                continue
            try:
                observation=float(rec["features"][source])
                rate=float(team.prof[j]["rate"][stat])
                minutes=float(team.prof[j]["min_avg"])
                sample=float(rec["sample_games"])
            except (ValueError,TypeError,KeyError):
                continue
            if (not all(map(math.isfinite,(observation,rate,minutes,sample)))
                or observation<=0 or rate<=0 or minutes<=0):
                continue
            indices.append(j)
            actual.append(observation)
            expected.append(rate*minutes)
            weight.append(min(0.35,sample/(sample+150.0)))
        report["eligible_stats"][stat]=len(indices)
        if len(indices)<MIN_ROSTER_COVERAGE:
            continue
        actual=np.asarray(actual,float)
        expected=np.asarray(expected,float)
        strength=np.asarray(weight,float)
        # Same-subset, same-team shares; never extrapolate to unmatched
        # teammates or confuse game-level opportunity totals with raw rates.
        p=actual/actual.sum()
        q=expected/expected.sum()
        log_delta=np.log(np.maximum(p,1e-9)/np.maximum(q,1e-9))*strength
        # Center to preserve aggregate expected team opportunity share
        # before clipping (the simulator normalizes shares on each lineup).
        log_delta-=float(np.average(log_delta,weights=expected))
        log_delta=np.clip(log_delta,-MAX_LOG_DELTA,MAX_LOG_DELTA)
        adjustments=0
        for ix,delta in zip(indices,log_delta):
            if abs(float(delta))<1e-9:
                continue
            out.prof[ix]["rate"][stat]=float(team.prof[ix]["rate"][stat]*math.exp(float(delta)))
            changed.add(str(team.ids[ix]))
            adjustments+=1
        report["adjustments_per_stat"][stat]=adjustments
    report["adjusted_players"]=len(changed)
    report["max_relative_change_allowed"]=0.13
    report["model_effect"]="CANDIDATE_RATE_ADJUSTMENT_NOT_FORWARD_PROMOTED"
    return out,report
