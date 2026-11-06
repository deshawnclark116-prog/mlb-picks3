"""Paired NBA V5 role trial scoring.

Keep the exact ORIGINAL champion projection threshold fixed when comparing
Brier scores. Otherwise selecting a different threshold based on either
candidate can manufacture a misleading gain. All confidence intervals
resample games as clusters, rather than treating teammate events as IID.
"""
from __future__ import annotations

import collections
import numpy as np
from nba import nba_v4_backtest as v4
from nba.nba_v5_rank import whole, MEANINGFUL_MIN

MARKETS = {
    "points": "pts", "rebounds": "reb", "assists": "ast",
    "three_pointers_made": "tpm", "steals": "stl",
    "blocks": "blk", "turnovers": "tov",
}
BLENDED = {"points", "rebounds", "assists", "three_pointers_made"}


def _score_group(vals: list[tuple], n_boot=800, seed=23):
    """Paired error reductions, game-cluster bootstrap CI (trial improvement >0)."""
    if not vals:
        return {"n": 0}
    a = np.asarray([v[1] for v in vals], float)
    b = np.asarray([v[2] for v in vals], float)
    game = np.asarray([v[0] for v in vals])
    games = np.unique(game)
    by_game = [np.flatnonzero(game == gid) for gid in games]
    rng = np.random.default_rng(seed)
    boots = np.zeros(n_boot)
    for n in range(n_boot):
        idx = np.concatenate([by_game[i] for i in rng.integers(len(games), size=len(games))])
        boots[n] = float(np.mean(a[idx]-b[idx]))
    lo, hi = np.quantile(boots, [0.025, 0.975])
    return {
        "n": len(vals), "games": len(games),
        "incumbent_error": round(float(a.mean()), 6),
        "candidate_error": round(float(b.mean()), 6),
        "mean_reduction_positive_is_better": round(float(np.mean(a - b)), 6),
        "cluster_bootstrap_95pct_interval": [round(float(lo), 6), round(float(hi), 6)],
        "fraction_rows_improved": round(float(np.mean(b < a)), 4),
    }


def evaluate(original: list[dict], adapted: list[dict], v4_preds: dict) -> dict:
    from scipy.stats import nbinom
    # Reuse validated V4 survival helper rather than inferring odds.
    del nbinom
    champions = {(r["game"], r["player"]): r for r in original}
    trials = {(r["game"], r["player"]): r for r in adapted}
    if champions.keys() != trials.keys():
        raise ValueError("Paired arms must grade identical games and players")
    scores = collections.defaultdict(list)
    flags = collections.Counter()
    for key, c in champions.items():
        t = trials[key]
        if (c["min_actual"], c["game"]) != (t["min_actual"], t["game"]):
            raise ValueError("Arms differ in actual outcomes")
        for f in t.get("role_trial_flags", []):
            flags[f] += 1
        gid = c["game"]
        scores["minutes|simulation|mae"].append((gid, abs(c["min_sim"]-c["min_actual"]), abs(t["min_sim"]-c["min_actual"])))
        prediction = v4_preds.get(key)
        for name in MARKETS:
            cc, tt = c[name], t[name]
            actual = cc["actual"]
            if actual != tt["actual"]:
                raise ValueError("Arms differ in official player outcomes")
            v4_pair = prediction.get(name) if prediction is not None else None
            if name in BLENDED and v4_pair is not None:
                mu4, alpha = v4_pair
                old_mean = 0.5*(cc["mean"]+mu4)
                new_mean = 0.5*(tt["mean"]+mu4)
                style = "champion_v4_v5_blend"
            else:
                old_mean, new_mean = cc["mean"], tt["mean"]
                style = "standalone_v5"
            scores[f"{name}|{style}|mae"].append((gid, abs(old_mean-actual), abs(new_mean-actual)))
            threshold = whole(old_mean)
            if threshold < MEANINGFUL_MIN[name]:
                continue
            old_p = cc["samples_ge"].get(threshold)
            new_p = tt["samples_ge"].get(threshold)
            if old_p is None or new_p is None:
                continue
            if name in BLENDED and v4_pair is not None:
                p4 = float(v4.nb_survival(np.array([mu4]), alpha, threshold)[0])
                old_p, new_p = 0.5*(old_p+p4), 0.5*(new_p+p4)
            hit = 1.0 if actual >= threshold else 0.0
            scores[f"{name}|{style}|brier_fixed_champion_target"].append((
                gid, (old_p-hit)**2, (new_p-hit)**2))
    return {
        "experiment": "NBA_V5_PAIR_ROLE_CHANGE_V1",
        "model_promotion_allowed": False,
        "champion": "unchanged V5 simulation + preexisting equal-weight V4/V5 blend",
        "candidate": "fixed 35pct bounded adjustment of detector-flagged pregame opportunities",
        "observational_limitation": (
            "Replay test conditions both arms on the historical game roster; "
            "not a prospective availability or live injury-timing evaluation."),
        "fixed_event": "Compare both model probabilities at the champion's own rounded projection",
        "confidence_intervals": "800 bootstrap replications resampling entire games",
        "player_metric_adaptations": dict(flags),
        "metrics": {k: _score_group(v) for k, v in sorted(scores.items())},
    }
