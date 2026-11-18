"""Paired independent V5 whole-game minutes-head scorer.

NO V3/V4 blending and NO re-selection of the target after the challenger is
seen. Minutes MAE and every core player-stat error use identical players and
actual outcomes, with the completed GAME as the confidence-interval unit.
"""
from __future__ import annotations

from nba.nba_v5_learned_opportunity_head_score import evaluate_native
from nba.nba_v5_role_trial_score import _score_group


def evaluate_minutes(incumbent, challenger):
    result = evaluate_native(incumbent, challenger)
    former = {(str(row["game"]), str(row["player"])): row for row in incumbent}
    latter = {(str(row["game"]), str(row["player"])): row for row in challenger}
    if former.keys() != latter.keys():
        raise ValueError("NBA_MINUTES_TRIAL_UNPAIRED_PLAYER_COHORT")
    minute_errors = []
    changed = 0
    for key, before in former.items():
        after = latter[key]
        truth = float(before["min_actual"])
        if truth != float(after["min_actual"]):
            raise ValueError("NBA_MINUTES_TRIAL_OUTCOME_MISMATCH")
        minute_errors.append((key[0], abs(float(before["min_sim"]) - truth),
                              abs(float(after["min_sim"]) - truth)))
        if after.get("minutes_head_audit"):
            changed += 1
    result.update({
        "experiment": "NBA_V5_FROZEN_SUPERVISED_NEXT_GAME_MINUTES_HEAD_V1",
        "candidate": "Past-only supervised residual minutes role weights in original V5 possession simulation",
        "minutes_simulation_mae": _score_group(minute_errors),
        "players_with_minutes_head_evidence": changed,
        "grade_requires_identical_original_v5_targets": True,
        "model_promotion_allowed": False,
        "prospective_pretip_availability_certified": False,
        "evaluation_limit": "Actual historical playing rosters known retrospectively; independent future pregame validation still required",
    })
    return result
