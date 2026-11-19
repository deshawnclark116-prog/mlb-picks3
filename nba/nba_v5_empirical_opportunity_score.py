"""Matched NBA empirical game opportunity-rate challenger grading.

The target of every scored event is frozen from the incumbent projection.
Both arms use identical player-game cohorts, actual outcomes and game RNG.
Only the selection ORDER may change, not what constitutes a successful event.
Historical rosters are known retrospectively: NEVER call this a live pick test.
"""
from __future__ import annotations
from collections import defaultdict

from nba.nba_v5_learned_opportunity_head_score import evaluate_native
from nba.nba_v5_rank import MEANINGFUL_MIN, whole
from nba.nba_v5_role_trial_score import _score_group

MARKETS = ("points", "rebounds", "assists", "three_pointers_made",
           "steals", "blocks")
CORE = MARKETS[:4]


def frozen_event_top_cards(incumbent, candidate, markets=MARKETS):
    first = {(str(x["game"]), str(x["player"])): x for x in incumbent}
    second = {(str(x["game"]), str(x["player"])): x for x in candidate}
    if first.keys() != second.keys():
        raise ValueError("NBA_EMPIRICAL_OPPORTUNITY_COHORT_MISMATCH")
    events = defaultdict(list)
    for (game, player), orig in first.items():
        new = second[(game, player)]
        for market in markets:
            base, alt = orig[market], new[market]
            if float(base["actual"]) != float(alt["actual"]):
                raise ValueError("NBA_EMPIRICAL_OPPORTUNITY_ACTUAL_MISMATCH")
            target = whole(float(base["mean"]))
            if target < MEANINGFUL_MIN[market]:
                continue
            bp = base["samples_ge"].get(target)
            ap = alt["samples_ge"].get(target)
            if bp is None or ap is None:
                continue
            hit = int(float(base["actual"]) >= target)
            events[game].append((player, market, target, float(bp), float(ap), hit))
    result = {}
    for size in (4, 10):
        paired = []
        overlaps = []
        market_count = defaultdict(lambda: {"incumbent": 0, "candidate": 0})
        for game, rows in sorted(events.items()):
            if len(rows) < size:
                continue
            old = sorted(rows, key=lambda r: (-r[3], r[0], r[1]))[:size]
            new = sorted(rows, key=lambda r: (-r[4], r[0], r[1]))[:size]
            overlaps.append(len({r[:3] for r in old} & {r[:3] for r in new})/size)
            for index in range(size):
                paired.append((game, 1-old[index][5], 1-new[index][5]))
                market_count[old[index][1]]["incumbent"] += 1
                market_count[new[index][1]]["candidate"] += 1
        metric = _score_group(paired)
        metric["incumbent_hit_rate"] = round(1-metric["incumbent_error"], 5) if paired else None
        metric["candidate_hit_rate"] = round(1-metric["candidate_error"], 5) if paired else None
        metric["average_event_overlap"] = (round(sum(overlaps)/len(overlaps), 5) if overlaps else None)
        metric["market_selection_count"] = dict(market_count)
        result["top"+str(size)] = metric
    return result


def evaluate_opportunity(incumbent, candidate):
    paired = evaluate_native(incumbent, candidate)
    paired.update({
        "experiment": "NBA_EMPIRICAL_GAME_FROZEN_SUPERVISED_OPPORTUNITY_RATE_V1",
        "baseline": "Actual live empirical player-game bootstrap, unchanged minutes/pace",
        "candidate": "Same seed and game bootstrap, predicted past-only rates for FGA/3PA/FTA, AST, rebounds and defense",
        "same_live_empirical_kernel_both_arms": True,
        "not_using_v3_or_v4_predictions": True,
        "frozen_target_top_cards": {
            "all_markets": frozen_event_top_cards(incumbent, candidate),
            "core_four_markets": frozen_event_top_cards(incumbent, candidate, CORE),
        },
        "rosters_known_retroactively": True,
        "opt_in_research_only": True,
        "model_promotion_allowed": False,
        "requires_prospective_pretip_lineups_and_future_frozen_games": True,
    })
    return paired
