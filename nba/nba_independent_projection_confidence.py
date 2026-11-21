"""Historical probability of being CLOSE to the model's OWN prediction.

P(abs(actual-stat_prediction) <= tolerance | player participates).
No bookmaker line, no target over/under, and NOT a forward-calibrated
betting win percentage. In particular, a mean of 24.1 points has no
probability of exactly equalling 24.1 (an impossible discrete outcome).
Use predeclared market-specific accuracy windows and a chronological
validation set from Jan 1 to Feb 14 2026. Fit the independent head
only on player-games through Dec 31 2025. The original 2026-27
played-player diagnostics are never used to set these percentages.
"""
from __future__ import annotations
import collections
import json
import math
from pathlib import Path

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from nba.nba_independent_no_hindsight_opportunity_lab import STATS, PARAMS, dataset

SCHEMA = "NBA_INDEPENDENT_PREDICTION_ACCURACY_VALIDATION_2026_V1"
WINDOWS = {
    "points": 5.0, "rebounds": 2.0,
    "assists": 2.0, "three_pointers_made": 1.0,
}
PREDICTED_MEAN_BINS = {
    "points": (10.0, 20.0, 30.0),
    "rebounds": (3.0, 6.0, 10.0),
    "assists": (2.0, 4.0, 7.0),
    "three_pointers_made": (1.0, 2.0, 3.0),
}
TRAIN_LAST = "2025-12-31"
VALID_FIRST = "2026-01-01"
VALID_LAST = "2026-02-14"
SHRINKAGE_N = 100.0
MIN_TRAIN = 800
MIN_VALID = 800


def mean_bin(market: str, prediction: float) -> int:
    if market not in WINDOWS or not math.isfinite(prediction) or prediction < 0:
        raise ValueError("NBA_INDEPENDENT_INVALID_PREDICTED_MEAN")
    return sum(prediction >= edge for edge in PREDICTED_MEAN_BINS[market])


def build_accuracy_calibration(games: list[dict]) -> dict:
    """Same as-of features as the head; fit preceding period only."""
    limited = [g for g in games if str(g["date"])[:10] <= VALID_LAST]
    rows = dataset(limited)
    train = [r for r in rows if r["date"] <= TRAIN_LAST]
    valid = [r for r in rows if VALID_FIRST <= r["date"] <= VALID_LAST]
    result = {
        "schema": SCHEMA, "trained_through": TRAIN_LAST,
        "validation_from": VALID_FIRST, "validation_through": VALID_LAST,
        "fixed_error_window": WINDOWS,
        "prediction_bin_boundaries": {k: list(v) for k,v in PREDICTED_MEAN_BINS.items()},
        "conditional_on_actually_playing": True,
        "not_an_over_under_probability": True, "not_a_bookmaker_line": True,
        "prospectively_calibrated_2026_27": False,
        "eligible_for_official_bets": False,
        "model_head": "nba-independent-direct-prior-date-head-v1",
        "markets": {},
    }
    for market in WINDOWS:
        a = [r for r in train if r["market"] == market]
        b = [r for r in valid if r["market"] == market]
        if len(a) < MIN_TRAIN or len(b) < MIN_VALID:
            raise ValueError("NBA_INDEPENDENT_INSUFFICIENT_VALIDATION_" + market)
        model = HistGradientBoostingRegressor(**PARAMS, loss="poisson")
        model.fit(np.asarray([r["features"] for r in a], dtype=float),
                  np.asarray([r["actual"] for r in a], dtype=float))
        prediction = model.predict(np.asarray([r["features"] for r in b], dtype=float))
        hist = collections.defaultdict(lambda: [0, 0])
        overall_success = 0
        for r, raw in zip(b, prediction):
            expected, actual = float(raw), float(r["actual"])
            if not math.isfinite(expected) or not math.isfinite(actual):
                raise ValueError("NBA_INDEPENDENT_BAD_VALIDATION_OUTCOME")
            k = mean_bin(market, expected)
            hit = int(abs(actual - expected) <= WINDOWS[market])
            hist[k][0] += hit
            hist[k][1] += 1
            overall_success += hit
        overall_n = len(b)
        global_rate = overall_success / overall_n
        cells = {}
        for i in range(4):
            success, n = hist[i]
            if n < 50:
                raise ValueError("NBA_INDEPENDENT_SPARSE_CONFIDENCE_BIN_" + market + "_" + str(i))
            rate = (success + SHRINKAGE_N * global_rate)/(n + SHRINKAGE_N)
            cells[str(i)] = {
                "n": n, "within_window_count": success,
                "conditional_accuracy_estimate": round(rate, 6),
            }
        result["markets"][market] = {
            "validation_player_games": overall_n,
            "validation_within_window": overall_success,
            "played_player_overall_accuracy_rate": round(global_rate, 6),
            "confidence_by_projected_mean_bin": cells,
        }
    return result


def confidence_from_calibration(doc: dict, market: str, projected_mean: float) -> dict:
    """Refuse unsupported percentage rather than replace with guess or V5."""
    if doc.get("schema") != SCHEMA or doc.get("model_head") != \
       "nba-independent-direct-prior-date-head-v1" or \
       doc.get("prospectively_calibrated_2026_27") is not False or \
       doc.get("eligible_for_official_bets") is not False or \
       doc.get("conditional_on_actually_playing") is not True or \
       doc.get("not_an_over_under_probability") is not True or \
       doc.get("trained_through") != TRAIN_LAST or \
       doc.get("validation_from") != VALID_FIRST or \
       doc.get("validation_through") != VALID_LAST or \
       doc.get("fixed_error_window") != WINDOWS or \
       doc.get("prediction_bin_boundaries") != \
       {k: list(v) for k, v in PREDICTED_MEAN_BINS.items()}:
        raise ValueError("NBA_INDEPENDENT_INVALID_ACCURACY_CALIBRATION")
    k = str(mean_bin(market, projected_mean))
    row = doc["markets"][market]
    cell = row["confidence_by_projected_mean_bin"][k]
    n, p = cell["n"], cell["conditional_accuracy_estimate"]
    if not isinstance(n, int) or n < 50 or \
       not isinstance(p, (float, int)) or not 0 <= p <= 1 or \
       row["validation_player_games"] < MIN_VALID:
        raise ValueError("NBA_INDEPENDENT_UNSUPPORTED_ACCURACY_PERCENT")
    return {
        "probability_within_window_if_plays": round(p, 4),
        "window_plus_or_minus": WINDOWS[market],
        "historical_validation_n_in_bin": n,
        "metric": "PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION",
        "calibration_source": SCHEMA,
        "not_over_under_probability": True,
        "current_season_calibration_verified": False,
    }


def read_or_build_calibration(path: str, games: list[dict], save=False) -> dict:
    file = Path(path)
    if file.is_file():
        doc = json.loads(file.read_text())
        for market in WINDOWS:
            confidence_from_calibration(doc, market, 15.0)
        return doc
    doc = build_accuracy_calibration(games)
    if save:
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(json.dumps(doc, indent=2) + "\n")
    return doc
