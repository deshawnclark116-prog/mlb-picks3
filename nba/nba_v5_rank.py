"""How the app ranks and features NBA projections (kept free of heavy imports so grading can use it too)."""
from __future__ import annotations
import math

MARKET_ORDER = ("points", "rebounds", "assists", "three_pointers_made", "steals", "blocks", "turnovers")
MEANINGFUL_MIN = {"points": 6, "rebounds": 3, "assists": 2, "three_pointers_made": 1, "steals": 1, "blocks": 1, "turnovers": 2}


def whole(x: float) -> int:
    b = math.floor(x)
    return b + (1 if x - b >= 0.6 - 1e-10 else 0)


def reach_prob(lat, k):
    c = lat
    return 1.0 if k <= 0 else (0.0 if k - 1 >= len(c) else 1.0 - c[k - 1])


def rank_for_screen(rows):
    """Same rule as the app: players who are likely to play, projection large enough to matter, ranked by the chance
    of reaching the rounded projection. V5 uses all-scenarios chance to match its frontend;
    earlier versions retain conditional ranking. Conditional accuracy is logged separately."""
    picks = []
    for r in rows:
        # Match the main frontend. Turnovers remain in the full model
        # dataset but are not featured as wager-facing player picks.
        if (r.get("market") == "turnovers" or
            r.get("mean_basis") != "CONDITIONAL_ON_PLAYING" or
            r["reported_status"] == "OUT" or not r["p_active"] >= 0.75):
            continue
        w = whole(r["mean"])
        if w < MEANINGFUL_MIN[r["market"]]:
            continue
        conditional = reach_prob(r["cdf_lattice"]["cdf"], w)
        # V5 frontend ranks by the probability of reaching its OWN projected
        # number including DNP, not the easier P(hit | plays).
        rank_p = conditional * r["p_active"] if str(r.get("model_version", "")).startswith("nba-v5-") else conditional
        picks.append((rank_p, r["p_active"], r["player"], r["market"], w, r, conditional))
    picks.sort(key=lambda x: (-x[0], -x[1], x[2], x[3]))
    # One rule, end-to-end: first four and expanded picks are both
    # ordered by the exact estimated chance of reaching the player's
    # OWN projected whole number, including DNP for V5. No stat quotas.
    for i, (p_, pa_, nm, mk, w, r, conditional) in enumerate(picks, 1):
        r["frontend_rank"] = i
        r["whole_projection"] = w
        r["reach_probability"] = round(conditional, 4)
        r["frontend_ranking_probability"] = round(p_, 4)
        r["rank_by_chance_only"] = i
