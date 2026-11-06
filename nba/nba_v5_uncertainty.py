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
    share = minute_variance_fraction(x, m)
    return {
        "version": "nba-v5-uncertainty-audit-v1",
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
