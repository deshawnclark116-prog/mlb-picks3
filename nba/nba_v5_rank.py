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
    of reaching the rounded projection (highest first), ties by chance of playing, then name."""
    picks = []
    for r in rows:
        if r.get("mean_basis") != "CONDITIONAL_ON_PLAYING" or r["reported_status"] == "OUT" or not r["p_active"] >= 0.75:
            continue
        w = whole(r["mean"])
        if w < MEANINGFUL_MIN[r["market"]]:
            continue
        picks.append((reach_prob(r["cdf_lattice"]["cdf"], w), r["p_active"], r["player"], r["market"], w, r))
    picks.sort(key=lambda x: (-x[0], -x[1], x[2], x[3]))
    pure_rank = {id(t[5]): i for i, t in enumerate(picks, 1)}
    # featured order: best pick of each stat first, then the second best of each stat, and so on (the app's featured tiles)
    seen = {}
    keyed = []
    for p_, pa_, nm, mk, w, r in picks:
        n = seen.get(mk, 0)
        seen[mk] = n + 1
        keyed.append((n, -p_, -pa_, nm, MARKET_ORDER.index(mk), w, p_, r))
    keyed.sort(key=lambda x: x[:5])
    for i, (n, np_, npa, nm, mi, w, p_, r) in enumerate(keyed, 1):
        r["frontend_rank"] = i
        r["whole_projection"] = w
        r["reach_probability"] = round(p_, 4)
        r["rank_by_chance_only"] = pure_rank[id(r)]


