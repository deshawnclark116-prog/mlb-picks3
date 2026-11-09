"""Fast leak-safe validation of the NEW learned next-game rate head.

This evaluates the actual rate mathematics, not merely the simulator's
formatting. Player's next-game attempts/ast/reb/TO are withheld, and both
heads receive IDENTICAL real prior history. Actual played minutes are used
ONLY as an after-the-game exposure to isolate rate errors; these results
are not proof of production full-game predictive improvement.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import datetime as dt
import json
from pathlib import Path

from nba import nba_v4_backtest as v4
from nba.nba_v5_sim import build_profile, league_from, STATS_BOX
from nba.nba_v5_learned_opportunity_head import OpportunityHead, STATS
from nba.nba_v5_role_trial_score import _score_group


def validate(games, cutoff, through=None):
    if isinstance(cutoff, str):
        cutoff = dt.date.fromisoformat(cutoff)
    if isinstance(through, str):
        through = dt.date.fromisoformat(through)
    if through is not None and through <= cutoff:
        raise ValueError("NO_FUTURE_HOLDOUT_WINDOW")
    head = OpportunityHead.fit_completed(games, cutoff)
    before = [g for g in games if v4.day_of(g) < cutoff]
    source_lines = [p for g in before for p in g["players"] if p["min"] > 0]
    league = league_from(source_lines, [])
    history = defaultdict(list)
    by_day = defaultdict(list)
    for g in sorted(games, key=lambda r: (v4.day_of(r), str(r["game_id"]))):
        by_day[v4.day_of(g)].append(g)
    errors = defaultdict(list)
    signed = defaultdict(list)
    game_ids = set()
    predictions = 0
    for day in sorted(by_day):
        if day >= cutoff and (through is None or day < through):
            for g in by_day[day]:
                for p in g["players"]:
                    prior = history[str(p["id"])]
                    if len(prior) < 5 or float(p["min"]) < 5:
                        continue
                    base = build_profile(prior, league)
                    minutes = float(p["min"])  # outcome exposure, scoring ONLY
                    for key in STATS:
                        forecast_before = max(0., base["rate"][key]) * minutes
                        forecast_after = head.predict_rate(
                            prior, key, base["rate"][key]) * minutes
                        actual = float(p[key])
                        errors[key].append((str(g["game_id"]),
                                            abs(forecast_before - actual),
                                            abs(forecast_after - actual)))
                        signed[key].append((forecast_before - actual,
                                            forecast_after - actual))
                    game_ids.add(str(g["game_id"]))
                    predictions += 1
        # Add observations only AFTER every game on the calendar date is
        # scored. Absolutely no target-game performance enters input features.
        for g in by_day[day]:
            for p in g["players"]:
                if float(p.get("min") or 0.) > 0:
                    history[str(p["id"])].append(p)
    if predictions == 0:
        raise ValueError("NO_SCORED_HOLDOUT_PLAYERS")
    metrics = {}
    for key in STATS:
        grp = _score_group(errors[key])
        b = signed[key]
        grp["baseline_signed_count_error"] = round(sum(x[0] for x in b) / len(b), 5)
        grp["candidate_signed_count_error"] = round(sum(x[1] for x in b) / len(b), 5)
        metrics[key] = grp
    return {
        "schema": "NBA_V5_NEW_PLAYER_STAT_HEAD_OUT_OF_SAMPLE_RATE_HOLDOUT_V1",
        "training_end_exclusive": str(cutoff),
        "evaluation_start_inclusive": str(cutoff),
        "evaluation_end_exclusive": str(through) if through else None,
        "actual_future_game_data_leakage": False,
        "same_player_game_and_minutes_exposure": True,
        "minutes_for_scoring_are_known_after_game": True,
        "full_game_prediction_quality_proven": False,
        "player_games_scored": predictions,
        "games_scored": len(game_ids),
        "training_examples": head.training_examples,
        "head": "Past-only supervised rate head learned from NEXT game outcomes",
        "baseline": "Native V5 fixed half-life empirical rate prior",
        "metrics": metrics,
        "prediction_model_promoted": False,
    }


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--games", action="append", required=True)
    a.add_argument("--train-before", default="2026-10-27")
    a.add_argument("--test-through", default="2026-11-09")
    a.add_argument("--out", required=True)
    args = a.parse_args()
    report = validate(v4.load(args.games), args.train_before, args.test_through)
    Path(args.out).write_text(json.dumps(report, indent=2))
    print("OOS_LEARNED_STAT_HEAD_RATE_TEST", json.dumps(report, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
