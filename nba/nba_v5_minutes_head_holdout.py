"""Strict frozen-coefficient, next-game MINUTES holdout for the V5 role challenger.

Both arms see the same prior games and score the same actual playing players.
Actual future minutes are used ONLY as labels. This is NOT a full-game or
prospective pretip-inactive/confirmed-roster simulation validation.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import datetime as dt
import json
from pathlib import Path

import numpy as np

from nba import nba_v4_backtest as v4
from nba.nba_v5_minutes_head import MIN_HISTORY, MinutesHead
from nba.nba_v5_role_trial_score import _score_group


def validate(games, cutoff, through):
    if isinstance(cutoff, str):
        cutoff = dt.date.fromisoformat(cutoff)
    if isinstance(through, str):
        through = dt.date.fromisoformat(through)
    if through <= cutoff:
        raise ValueError("NBA_MINUTES_HEAD_NO_FUTURE_HOLDOUT")
    head = MinutesHead.fit_completed(games, cutoff)
    by_day = defaultdict(list)
    for g in games:
        by_day[v4.day_of(g)].append(g)
    histories = defaultdict(list)
    values = []
    signed = []
    game_ids = set()
    for day in sorted(by_day):
        if cutoff <= day < through:
            for game in by_day[day]:
                for p in game["players"]:
                    history = histories[str(p["id"])]
                    if len(history) < MIN_HISTORY or float(p.get("min") or 0.0) <= 0.0:
                        continue
                    baseline = float(v4.ewma([float(r["min"]) for r in history]))
                    candidate = head.predict_minutes(history, day)
                    actual = float(p["min"])
                    values.append((str(game["game_id"]), abs(actual - baseline),
                                   abs(actual - candidate)))
                    signed.append((baseline - actual, candidate - actual))
                    game_ids.add(str(game["game_id"]))
        # Data for the completed date become available AFTER all games that day.
        for game in by_day[day]:
            for p in game["players"]:
                if float(p.get("min") or 0) > 0:
                    line = dict(p)
                    line["date"] = day
                    histories[str(p["id"])].append(line)
    if not values:
        raise ValueError("NBA_MINUTES_HEAD_HOLDOUT_HAS_NO_PLAYERS")
    result = _score_group(values)
    result["baseline_within_5_minutes_rate"] = round(
        float(np.mean([v[1] <= 5. for v in values])), 5)
    result["candidate_within_5_minutes_rate"] = round(
        float(np.mean([v[2] <= 5. for v in values])), 5)
    result["baseline_signed_minutes_error"] = round(
        float(np.mean([v[0] for v in signed])), 5)
    result["candidate_signed_minutes_error"] = round(
        float(np.mean([v[1] for v in signed])), 5)
    return {
        "schema": "NBA_V5_SUPERVISED_MINUTES_HEAD_FROZEN_OUT_OF_SAMPLE_V1",
        "train_before_exclusive": str(cutoff),
        "test_until_exclusive": str(through),
        "train_games": head.training_games,
        "train_player_examples": head.training_examples,
        "test_games": len(game_ids),
        "test_player_games": len(values),
        "all_player_inputs_prior_date_only": True,
        "frozen_training_coefficients": True,
        "scoring_conditions_on_player_appearing": True,
        "retrospective_roster_not_live_pregame_verified": True,
        "full_game_proven": False,
        "do_not_auto_promote": True,
        "minutes_metrics": result,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", action="append", required=True)
    ap.add_argument("--train-before", default="2026-11-09")
    ap.add_argument("--test-through", default="2026-11-18")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    report = validate(v4.load(a.games), a.train_before, a.test_through)
    Path(a.out).write_text(json.dumps(report, indent=2) + "\n")
    print("NBA_SUPERVISED_MINUTES_HEAD_HOLDOUT", json.dumps(report, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
