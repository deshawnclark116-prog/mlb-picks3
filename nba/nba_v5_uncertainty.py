"""NBA V5 forecast uncertainty diagnostics; observational, not causal.

Separates (a) simulation Monte Carlo sampling precision, (b) minutes-associated
variation, and (c) participation vs conditional-on-participation probability.
This does not falsely label the remaining variance as solely shooting luck:
lineups, roles, opponent tactics and model uncertainty also remain in it.
"""
from __future__ import annotations

import math
import numpy as np


def minute_variance_fraction(outcomes, minutes) -> float:
    """ANOVA fraction explained by four coarse, occupied minutes bins.

    This is an association within simulated games, not a causal attribution.
    Four groups limit the positive finite-sample bias of arbitrary fine bins.
    """
    y, m = np.asarray(outcomes, float), np.asarray(minutes, float)
    if len(y) < 30 or len(y) != len(m):
        return 0.0
    variance = float(np.var(y))
    if variance <= 1e-12:
        return 0.0
    cut = np.unique(np.quantile(m, [0.25, 0.50, 0.75]))
    bins = np.searchsorted(cut, m, side="right")
    means = [float(y[bins == j].mean()) if (bins == j).any() else float(y.mean())
             for j in range(len(cut) + 1)]
    between = float(np.mean((np.array(means)[bins] - y.mean()) ** 2))
    return float(np.clip(between / variance, 0.0, 1.0))


def minute_variance_components(outcomes, minutes) -> dict:
    """Exact ANOVA on simulated *active-game* minutes bins, not causal effects.

    The four occupied quantile bins are also used by the legacy R² measure.
    Variance of conditional means plus expected within-bin variance equals
    the total simulated variance, including with unequal bins.
    """
    y,m=np.asarray(outcomes,float),np.asarray(minutes,float)
    if len(y)==0 or len(y)!=len(m) or not np.isfinite(y).all() or not np.isfinite(m).all():
        raise ValueError("Uncertainty decomposition requires finite aligned events")
    var=float(np.var(y))
    if len(y)<30 or var<=1e-12:
        return {"active_conditional_variance":round(var,6),
                "minutes_between_bin_variance":0.0,
                "minutes_within_bin_variance":round(var,6),
                "bin_counts":[int(len(y))],"diagnostic_valid":False}
    cuts=np.unique(np.quantile(m,[.25,.50,.75]))
    labels=np.searchsorted(cuts,m,side="right")
    mean=float(np.mean(y))
    between,within,counts=0.0,0.0,[]
    for k in range(int(labels.max())+1):
        select=y[labels==k]
        if not len(select):
            continue
        w=len(select)/len(y)
        between+=w*(float(np.mean(select))-mean)**2
        within+=w*float(np.var(select))
        counts.append(int(len(select)))
    if abs((between+within)-var)>1e-8*max(1.0,var):
        raise AssertionError("ANOVA variance conservation failed")
    return {"active_conditional_variance":round(var,6),
            "minutes_between_bin_variance":round(between,6),
            "minutes_within_bin_variance":round(within,6),
            "bin_counts":counts,"diagnostic_valid":len(counts)>=2}


def forecast_uncertainty(outcomes, minutes, p_active: float) -> dict:
    """Partial variance diagnostics and simulation precision for one player/stat.

    Monte Carlo precision does NOT measure model calibration or uncertainty in
    availability estimates. For a later V4/V5 mixture, this diagnostic refers
    to the underlying V5 game simulations, not the mixture distribution.
    """
    x = np.asarray(outcomes, float)
    m = np.asarray(minutes, float)
    if len(x) == 0 or len(x) != len(m):
        raise ValueError("Nonempty aligned outcomes and minutes required")
    sd = float(np.std(x))
    n = len(x)
    components=minute_variance_components(x,m)
    share=minute_variance_fraction(x,m)
    p=float(np.clip(p_active,0,1))
    mu=float(x.mean())
    availability_var=p*(1-p)*mu*mu
    active_var=p*float(np.var(x))
    unconditional_var=availability_var+active_var
    minutes_between=p*components["minutes_between_bin_variance"]
    minutes_within=p*components["minutes_within_bin_variance"]
    return {
        "version": "nba-v5-uncertainty-audit-v2",
        "unconditional_zero_if_DNP_mixture": {
            "expected_stat": round(p*mu,4),
            "variance_total": round(unconditional_var,5),
            "variance_availability": round(availability_var,5),
            "variance_conditional_playing": round(active_var,5),
            "variance_minutes_bin_between": round(minutes_between,5),
            "variance_minutes_bin_within": round(minutes_within,5),
            "scope": "V5_SIM_UNCONDITIONAL_MOMENTS_NO_CAUSAL_DECOMPOSITION",
            "unresolved_inside_within": ["usage","shot_quality","opponent_tactics",
                                          "parameter_uncertainty","lineup","luck"]
        },
        "conditional_minutes_anova": components,
        "simulated_games_player_active": int(n),
        "simulation_sd": round(sd, 3),
        "simulation_mean_mc_se": round(sd / math.sqrt(n), 3),
        "minutes_association_r2": round(share, 4),
        "non_minutes_association_fraction": round(1.0 - share, 4),
        "minutes_p10": round(float(np.quantile(m, .1)), 2),
        "minutes_p90": round(float(np.quantile(m, .9)), 2),
        "p_active_input": round(float(np.clip(p_active, 0, 1)), 4),
        "diagnostic_scope": "V5_SIM_ONLY_DESCRIPTIVE_NOT_CALIBRATION",
    }


def reach_with_dnp(prob_if_active: float, p_active: float, threshold: int) -> dict:
    """For positive counting thresholds, DNP is a non-hit (not a push)."""
    if not 0 <= prob_if_active <= 1 or not 0 <= p_active <= 1:
        raise ValueError("Probabilities must be in [0,1]")
    if threshold < 1:
        raise ValueError("Threshold must be a positive whole number")
    return {
        "whole_projection": int(threshold),
        "probability_if_playing": round(float(prob_if_active), 4),
        "probability_including_dnp": round(float(p_active * prob_if_active), 4),
        "p_active": round(float(p_active), 4),
        "method": "P_PLAY_TIMES_CONDITIONAL_REACH",
        "forward_calibrated": False,
    }
