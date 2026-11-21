"""Provisional NBA milestone probabilities for the independent direct learned head.

NOT a validated betting probability model. There is currently no source of
verified game-day sportsbook main lines in this independent system. Display
these as research estimates for the FIXED predeclared stat milestones only.

Distribution = negative-binomial when dispersion exceeds mean, otherwise
Poisson. Variance is a robust shrinkage of a player's 12 most recent
PREVIOUS-EASTERN-DATE played-game statistics toward a conservative,
market-specific league prior. Formula is chosen before looking at today's
outcome; no simulated fantasy certainty or V5 CDF is borrowed.

Crucially, this is P(stat >= k | player participated), not a bookmaker
bet-hit probability. A DNP void is not an under win. All event probabilities
must be graded on future firstseen forecasts before promotion.
"""
from __future__ import annotations

import math
import numpy as np
from scipy.stats import nbinom, poisson

VERSION = "independent-shrunk-variance-nb-milestones-research-v1"
MILESTONES = {
    "points": (15, 20, 25, 30, 35),
    "rebounds": (6, 8, 10, 12, 14),
    "assists": (5, 7, 9, 11, 13),
    "three_pointers_made": (2, 3, 4, 5, 6),
}
# Conservative variance priors from basketball count scale, NOT fitted
# calibration constants and NOT represented as empirically proven.
PRIOR_VARIANCE = {
    "points": 68.0,
    "rebounds": 12.0,
    "assists": 9.0,
    "three_pointers_made": 2.6,
}
STATS = {
    "points": "pts",
    "rebounds": "reb",
    "assists": "ast",
    "three_pointers_made": "tpm",
}
MIN_HISTORY = 5
MAX_MEAN = {"points": 85., "rebounds": 35., "assists": 30.,
            "three_pointers_made": 18.}
PRIOR_PSEUDO_GAMES = 12.
MIN_VAR_MULTIPLIER = 1.15


def dispersion_from_history(market, mean, history):
    if market not in STATS:
        raise ValueError("NBA_INDEPENDENT_UNKNOWN_STAT")
    if not math.isfinite(mean) or not 0 <= mean <= MAX_MEAN[market]:
        raise ValueError("NBA_INDEPENDENT_INVALID_MEAN")
    prior = max(PRIOR_VARIANCE[market], MIN_VAR_MULTIPLIER * mean)
    last = history[-12:]
    if len(last) < MIN_HISTORY:
        return None
    obs = np.asarray([float(row[STATS[market]]) for row in last], dtype=float)
    if not np.isfinite(obs).all() or (obs < 0).any():
        raise ValueError("NBA_INDEPENDENT_NONFINITE_HISTORY_STAT")
    sample_var = float(np.var(obs, ddof=1)) if len(obs) > 1 else prior
    # When model expected value differs from historical usage, uncertainty
    # should not shrink just because past games were tightly clustered.
    usage_change = (mean - float(np.mean(obs))) ** 2
    var = ((len(obs) - 1) * sample_var +
           PRIOR_PSEUDO_GAMES * prior) / (len(obs)-1 + PRIOR_PSEUDO_GAMES)
    var += 0.15 * usage_change
    return max(1e-6, float(var), MIN_VAR_MULTIPLIER * mean)


def over_integer_event_probability(market, mean, variance, milestone):
    """P(X>=milestone | plays), fixed probability on integer stat count."""
    if (market not in STATS or not isinstance(milestone, int) or
        milestone < 1 or not math.isfinite(variance) or variance <= 0 or
        not math.isfinite(mean) or mean < 0):
        raise ValueError("NBA_INDEPENDENT_INVALID_EVENT_DISTRIBUTION")
    if mean == 0:
        return 0.
    if variance <= mean * (1 + 1e-8):
        value = float(poisson.sf(milestone - 1, mean))
    else:
        r = mean * mean / (variance-mean)
        p = r / (r+mean)
        value = float(nbinom.sf(milestone-1, r, p))
    if not 0 <= value <= 1 or not math.isfinite(value):
        raise ValueError("NBA_INDEPENDENT_PROBABILITY_NOT_FINITE")
    return value


def research_milestones(market, mean, history):
    var = dispersion_from_history(market, mean, history)
    if var is None:
        return None
    data = []
    last = None
    for milestone in MILESTONES[market]:
        value = over_integer_event_probability(market, mean, var, milestone)
        if last is not None and value > last + 1e-12:
            raise ValueError("NBA_INDEPENDENT_MILESTONE_NONMONOTONE")
        last = value
        data.append({
            "market": market, "milestone": milestone,
            "model_estimated_p_at_least": round(value, 4),
            "threshold_label": f"{milestone}+",
            # This happens to be equivalent to Over (k - 0.5), but it
            # IS NOT VERIFIED to be a line offered by a sportsbook.
            "equivalent_half_point_threshold": milestone - .5,
            "sportsbook_main_line": None,
            "sportsbook_odds": None,
            "conditional_on_playing": True,
            "forward_calibrated": False,
            "eligible_as_official_bet": False,
            "uncertainty_model": VERSION,
            "historical_games_for_dispersion": len(history[-12:]),
        })
    return {"variance": round(var, 4), "milestones": data}


def select_research_target(milestones, minimum=0.6):
    """Choose hardest predeclared threshold clearing minimum research estimate.

    This rule is predeclared; cannot select the easiest target to inflate
    a top percentage leaderboard or silently treat a source threshold as
    a sportsbook offering.
    """
    qualifies = [x for x in milestones
                 if x["model_estimated_p_at_least"] >= minimum]
    return qualifies[-1] if qualifies else None


def rank_research_targets(players, minimum=0.6):
    options = []
    for p in players:
        for market, targets in p.get("research_event_probabilities", {}).items():
            target = select_research_target(targets, minimum)
            if target is None:
                continue
            options.append({
                "player": p["player"],
                "player_id": p["player_id"], "team_id": p["team_id"],
                "market": market, "milestone": target["milestone"],
                "model_estimated_p_at_least": target["model_estimated_p_at_least"],
                "sportsbook_main_line": None, "sportsbook_odds": None,
                "conditional_on_playing": True, "forward_calibrated": False,
                "eligible_as_official_bet": False,
                "uncertainty_model": VERSION
            })
    return sorted(options, key=lambda x: (
        -x["model_estimated_p_at_least"], -x["milestone"],
        x["player_id"], x["market"]))
