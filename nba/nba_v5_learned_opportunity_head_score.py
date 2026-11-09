"""Paired, forecast-only evaluation of an independent V5 statistical head.

The comparison NEVER mixes V4 into either arm. The fixed target is taken
from the original V5 prediction, and the game is the bootstrap unit.
Retrospective actual rosters are a limitation, not a production promotion.
"""
from __future__ import annotations

from collections import defaultdict

from nba.nba_v5_rank import whole, MEANINGFUL_MIN
from nba.nba_v5_role_trial_score import _score_group

STATS = ("points", "rebounds", "assists", "three_pointers_made",
         "steals", "blocks", "turnovers")


def evaluate_native(incumbent, candidate):
    first = {(r["game"], r["player"]): r for r in incumbent}
    other = {(r["game"], r["player"]): r for r in candidate}
    if first.keys() != other.keys():
        raise ValueError("LEARNED_HEAD_NOT_SAME_GAME_PLAYER_COHORT")
    samples = defaultdict(list)
    for k, base in first.items():
        changed = other[k]
        if base["min_actual"] != changed["min_actual"]:
            raise ValueError("LEARNED_HEAD_ACTUAL_OUTCOME_MISMATCH")
        gid = base["game"]
        for stat in STATS:
            orig = base[stat]
            new = changed[stat]
            if float(orig["actual"]) != float(new["actual"]):
                raise ValueError("LEARNED_HEAD_ACTUAL_STAT_MISMATCH")
            truth = float(orig["actual"])
            samples[f"{stat}|native_v5_mean_mae"].append(
                (gid, abs(float(orig["mean"]) - truth),
                 abs(float(new["mean"]) - truth)))
            threshold = whole(float(orig["mean"]))
            if threshold < MEANINGFUL_MIN[stat]:
                continue
            old_p = orig["samples_ge"].get(threshold)
            new_p = new["samples_ge"].get(threshold)
            if old_p is None or new_p is None:
                continue
            actual_hit = float(truth >= threshold)
            samples[f"{stat}|native_fixed_projection_brier"].append(
                (gid, (old_p - actual_hit) ** 2,
                 (new_p - actual_hit) ** 2))
    metrics = {key: _score_group(values) for key, values in samples.items()}
    core = ("points", "rebounds", "assists", "three_pointers_made")
    mean_wins = all(metrics[f"{stat}|native_v5_mean_mae"]["mean_reduction_positive_is_better"] > 0
                    for stat in core)
    probability_no_regression = all(
        metrics.get(f"{stat}|native_fixed_projection_brier", {})
        .get("mean_reduction_positive_is_better", float("-inf")) >= 0
        for stat in core)
    return {
        "experiment": "NBA_V5_INDEPENDENT_SUPERVISED_NEXT_GAME_STAT_HEAD_V1",
        "baseline": "V5_Native_Unblended_Original_Simulation",
        "candidate": "Past-only supervised empirical rates feeding V5 connected-game simulation",
        "not_using_v3_or_v4_forecasts": True,
        "no_forecast_target_selection_from_actual_outcomes": True,
        "fixed_event": "Original V5 rounded threshold in both probability arms",
        "metrics": metrics,
        "all_four_core_mean_mae_improved": mean_wins,
        "all_four_core_fixed_event_brier_nonregression": probability_no_regression,
        "evaluation_limit": "Historical game rosters known retrospectively; pretip availability and frozen live model remain separate",
        "promotion_allowed": False,
        "requires": "Prospective roster-aligned holdout and nonregression on core four markets before promotion",
    }
