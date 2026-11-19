"""Research-only learned opportunity correction for empirical NBA game outcomes.

The existing empirical head samples a player's previous full-game box at a
past-only, recency/start-weighted rate. This candidate keeps that same box
as the shared source of stat volatility but uses a supervised, date-frozen
next-game rate model to update the expected FGA/3PA/FTA, AST, REB and
defensive-event opportunities before generating simulated totals.

The feature model never sees V3/V4 player-stat forecasts or target-game
outcomes. Changes are clipped to 25% per opportunity, selected BEFORE
holdout testing, and this function cannot alter production by itself.
"""
from __future__ import annotations

import numpy as np

RATE_KEYS = ("fga", "tpa", "fta", "ast", "oreb", "dreb", "tov", "stl", "blk")
MAX_RATE_CHANGE = 0.25


def opportunity_factors(head, dated_history, expects_start):
    """Predict rate ratios relative to the actual empirical bootstrap sampler.

    Sampling weights exactly follow its last-24-games exponential and
    historical-starter mixture. Expected sampled rate is the weighted mean
    of box totals / box minutes, not an unweighted season average.
    """
    if len(dated_history) < 5:
        return {k: 1.0 for k in (*RATE_KEYS, "pts", "tpm", "reb", "fgm", "ftm")}
    pool = dated_history[-24:]
    n = len(pool)
    weights = np.array([0.5 ** ((n - 1 - i) / 9.) for i in range(n)], float)
    weights *= np.where(
        np.asarray([bool(x["start"]) for x in pool]) == bool(expects_start),
        1.4, 0.7)
    weights /= weights.sum()
    minutes = np.asarray([max(float(p["min"]), 1.) for p in pool], float)
    out = {}
    baselines = {}
    for key in RATE_KEYS:
        observed = np.asarray([float(p[key]) for p in pool], float)
        old_rate = float(np.sum(weights * observed / minutes))
        baselines[key] = old_rate
        if old_rate <= 1e-6:
            out[key] = 1.0
            continue
        learned = float(head.predict_rate(dated_history, key, old_rate))
        if not np.isfinite(learned):
            raise ValueError("NBA_EMPIRICAL_NONFINITE_OPPORTUNITY_RATE")
        out[key] = float(np.clip(learned / old_rate,
                                 1.0 - MAX_RATE_CHANGE,
                                 1.0 + MAX_RATE_CHANGE))
    out["tpm"] = out["tpa"]
    out["fgm"] = out["fga"]
    out["ftm"] = out["fta"]
    # Opportunity only: do not 'learn' shooting luck from the outcome.
    out["pts"] = 0.70 * out["fga"] + 0.20 * out["fta"] + 0.10 * out["tpa"]
    # Sample one coherent rebound total rather than summing independently
    # rounded ORB and DRB, which would inject extra untested variance.
    orb = baselines["oreb"]
    drb = baselines["dreb"]
    out["reb"] = ((orb * out["oreb"] + drb * out["dreb"]) / (orb + drb)
                  if orb + drb > 1e-6 else 1.0)
    return out
