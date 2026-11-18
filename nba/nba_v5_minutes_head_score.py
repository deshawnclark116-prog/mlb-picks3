"""Paired independent V5 whole-game minutes-head scorer.

NO V3/V4 blending and NO re-selection of the target after the challenger is
seen. Minutes MAE and every core player-stat error use identical players and
actual outcomes, with the completed GAME as the confidence-interval unit.
"""
from __future__ import annotations

from collections import defaultdict

from nba.nba_v5_learned_opportunity_head_score import evaluate_native
from nba.nba_v5_rank import whole, MEANINGFUL_MIN
from nba.nba_v5_role_trial_score import _score_group


def fixed_target_top_card(incumbent, challenger):
    """Do BETTER ranked picks hit, without making targets easier to reach?

    All candidates are eligible under the ORIGINAL V5 projection threshold.
    Each head independently ranks the SAME frozen events by its predicted
    probability; actual hits are compared game by game. This tests selection,
    not just numerical prediction error or self-adjusted event definitions.
    """
    first = {(str(r["game"]), str(r["player"])): r for r in incumbent}
    other = {(str(r["game"]), str(r["player"])): r for r in challenger}
    if first.keys() != other.keys():
        raise ValueError("NBA_MINUTES_TOPCARD_DIFFERENT_PLAYER_COHORT")
    eligible = defaultdict(list)
    for key, base in first.items():
        alt = other[key]
        for market in ("points", "rebounds", "assists", "three_pointers_made",
                       "steals", "blocks"):
            original = base[market]
            modified = alt[market]
            if original["actual"] != modified["actual"]:
                raise ValueError("NBA_MINUTES_TOPCARD_OUTCOME_MISMATCH")
            threshold = whole(float(original["mean"]))
            if threshold < MEANINGFUL_MIN[market]:
                continue
            bp = original["samples_ge"].get(threshold)
            cp = modified["samples_ge"].get(threshold)
            if bp is None or cp is None:
                continue
            hit = int(float(original["actual"]) >= threshold)
            eligible[key[0]].append((key[1], market, threshold, float(bp),
                                     float(cp), hit))
    by_size = {}
    for k in (4, 10):
        scored = []
        selected_overlap = []
        games_used = 0
        for game_id in sorted(eligible):
            rows = eligible[game_id]
            if len(rows) < k:
                continue
            # Stable, explicit tie-breaking to avoid arbitrary winner changes.
            old = sorted(rows, key=lambda r: (-r[3], r[0], r[1]))[:k]
            new = sorted(rows, key=lambda r: (-r[4], r[0], r[1]))[:k]
            games_used += 1
            selected_overlap.append(len({r[:3] for r in old} &
                                        {r[:3] for r in new}) / k)
            for i in range(k):
                scored.append((game_id, 1 - old[i][5], 1 - new[i][5]))
        met = _score_group(scored)
        met["eligible_games"] = games_used
        met["average_event_overlap"] = (round(sum(selected_overlap) / len(selected_overlap), 4)
                                        if selected_overlap else None)
        met["incumbent_hit_rate"] = (round(1.0 - met["incumbent_error"], 5)
                                     if scored else None)
        met["candidate_hit_rate"] = (round(1.0 - met["candidate_error"], 5)
                                     if scored else None)
        by_size["top" + str(k)] = met
    return {
        "schema": "NBA_V5_FROZEN_INCUMBENT_EVENT_TOP_PICK_SELECTION_V1",
        "all_thresholds_from_original_champion": True,
        "no_target_lowering_or_cherry_picked_after_scores": True,
        "player_rosters_retrospectively_known": True,
        "top_card_metrics": by_size,
    }


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
        "fixed_target_top_card": fixed_target_top_card(incumbent, challenger),
        "players_with_minutes_head_evidence": changed,
        "grade_requires_identical_original_v5_targets": True,
        "model_promotion_allowed": False,
        "prospective_pretip_availability_certified": False,
        "evaluation_limit": "Actual historical playing rosters known retrospectively; independent future pregame validation still required",
    })
    return result
