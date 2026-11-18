"""Leak-safe fixed-concept NBA minutes challenger regression contracts."""
import datetime as dt
import unittest
from unittest import mock

from nba import nba_v4_backtest as v4

import numpy as np

from nba.nba_v5_minutes_head import (MIN_HISTORY, MinutesHead,
                                     minute_features)
from nba.nba_v5_minutes_head_holdout import validate
from nba.nba_v5_minutes_head_score import fixed_target_top_card
from nba.nba_v5_sim import TeamInput
from nba.nba_v5_empirical_stat_engine import simulate_empirical_game
from tests.test_nba_v5_empirical_stat_engine import inputs as empirical_inputs, DAY as empirical_day


def history(n=8, minute=24, last_date=dt.date(2026, 1, 20)):
    return [{"date": last_date - dt.timedelta(days=n - i),
             "min": float(minute + (i % 3 - 1)),
             "start": i >= n - 5} for i in range(n)]


def synthetic_games(days=45, players=24):
    begin = dt.date(2026, 1, 1)
    games = []
    for i in range(days):
        date = begin + dt.timedelta(days=i)
        rows = []
        for j in range(players):
            rows.append({"id": str(j), "min": float(10 + j % 24 + (i // 7) % 3),
                         "start": bool(j % 3 == 0)})
        games.append({"date": date.isoformat(), "game_id": str(200000 + i),
                      "players": rows})
    return games


class MinutesHeadSafety(unittest.TestCase):
    def test_same_day_and_future_training_rows_rejected(self):
        h = history()
        day = h[-1]["date"]
        with self.assertRaisesRegex(ValueError, "FUTURE_OR_SAME_DAY"):
            minute_features(h, day)
        with self.assertRaisesRegex(ValueError, "FUTURE_OR_SAME_DAY"):
            minute_features(h, day - dt.timedelta(days=2))

    def test_training_cutoff_strictly_filters_future_labels(self):
        games = synthetic_games()
        cutoff = "2026-02-06"
        first = MinutesHead.fit_completed(games, cutoff)
        more = games + synthetic_games(10, 24)
        # Insert later observations with enormous impossible minutes. Even if
        # same IDs occur, nothing on/after the cutoff enters fit_completed.
        for g in more[-10:]:
            g["date"] = "2026-04-01"
            for p in g["players"]:
                p["min"] = 1000.0
        second = MinutesHead.fit_completed(more, cutoff)
        self.assertEqual(first.training_examples, second.training_examples)
        np.testing.assert_array_equal(first.coefficients, second.coefficients)

    def test_short_history_is_not_inferred(self):
        coefs = np.array([4.0] + [0.0] * 9)
        head = MinutesHead(coefs, dt.date(2026, 1, 1), 900, 30)
        team = TeamInput(ids=["one"], prof=[{}],
                         presence=np.full((1, 24), 0.5),
                         p_play=np.array([1.0]), starter=np.array([False]),
                         defence={})
        candidate, audit = head.apply_team(
            team, {"one": history(n=MIN_HISTORY - 1)},
            dt.date(2026, 1, 21))
        self.assertEqual(audit, {})
        np.testing.assert_array_equal(candidate.presence, team.presence)

    def test_adjustment_is_relative_bounded_and_does_not_mutate_champion(self):
        head = MinutesHead(np.array([4.0] + [0.0] * 9),
                           dt.date(2026, 1, 1), 900, 30)
        team = TeamInput(ids=["one"], prof=[{}],
                         presence=np.full((1, 24), 0.5),
                         p_play=np.array([1.0]), starter=np.array([False]),
                         defence={})
        old = team.presence.copy()
        dates = history(n=8, minute=24)
        # The target day's would-be result must be excluded even if mixed into
        # an external history provider.
        dates.append({"date": dt.date(2026, 1, 21),
                      "min": 49.0, "start": True})
        candidate, audit = head.apply_team(
            team, {"one": dates}, dt.date(2026, 1, 21))
        np.testing.assert_array_equal(old, team.presence)
        self.assertLessEqual(audit["one"]["rotation_multiplier"], 1.25)
        self.assertGreater(audit["one"]["rotation_multiplier"], 1.0)
        self.assertEqual(audit["one"]["past_games"], 8)
        self.assertTrue(np.all(candidate.presence <= 1.0))

    def test_date_split_scores_only_holdout_and_cannot_auto_promote(self):
        games = synthetic_games(days=46, players=24)
        result = validate(games, "2026-02-06", "2026-02-15")
        self.assertTrue(result["all_player_inputs_prior_date_only"])
        self.assertFalse(result["full_game_proven"])
        self.assertTrue(result["do_not_auto_promote"])
        self.assertGreater(result["test_player_games"], 0)
        self.assertGreater(result["minutes_metrics"]["n"], 0)


class WalkForwardDateBoundary(unittest.TestCase):
    def test_midmonth_cutoff_includes_only_eligible_dates(self):
        cutoff = dt.date(2026, 11, 9)
        rows = [{"date": dt.date(2026, 10, 15), "game": "old",
                 "player": str(j)} for j in range(2501)]
        rows += [
            {"date": dt.date(2026, 11, 3), "game": "early_nov", "player": "1"},
            {"date": dt.date(2026, 11, 10), "game": "test_nov", "player": "2"},
            {"date": dt.date(2026, 11, 17), "game": "test_nov2", "player": "3"},
            {"date": dt.date(2026, 12, 1), "game": "test_dec", "player": "4"},
        ]
        fake_models = {"stats": {key: {"alpha": 0.15} for key in v4.STATS}}
        def fake_predictions(models, test):
            return (np.ones(len(test)),
                    {key: np.ones(len(test)) for key in v4.STATS})
        with mock.patch.object(v4, "fit_models", return_value=fake_models):
            with mock.patch.object(v4, "predict_models", side_effect=fake_predictions):
                result = v4.walk_forward(rows, cutoff, [], [])
        self.assertEqual(set(result), {
            ("test_nov", "2"), ("test_nov2", "3"), ("test_dec", "4")})


class FixedCardRankingContract(unittest.TestCase):
    def test_rank_changes_use_original_prediction_targets(self):
        base, challenger = [], []
        for j in range(12):
            truth = 13 if j >= 6 else 9
            items = {
                "rebounds": {"mean": 0, "actual": 0, "samples_ge": {}},
                "assists": {"mean": 0, "actual": 0, "samples_ge": {}},
                "three_pointers_made": {"mean": 0, "actual": 0, "samples_ge": {}},
                "steals": {"mean": 0, "actual": 0, "samples_ge": {}},
                "blocks": {"mean": 0, "actual": 0, "samples_ge": {}},
            }
            original = {"game": "synthetic_game", "player": str(j)}
            original.update(items)
            alternate = dict(original)
            original["points"] = {
                "mean": 12.0, "actual": truth,
                "samples_ge": {12: 0.95 - 0.05 * j},
            }
            alternate["points"] = {
                "mean": 99.0, "actual": truth,
                "samples_ge": {12: 0.40 + 0.045 * j},
            }
            base.append(original)
            challenger.append(alternate)
        result = fixed_target_top_card(base, challenger)
        top4 = result["top_card_metrics"]["top4"]
        self.assertTrue(result["all_thresholds_from_original_champion"])
        self.assertEqual(top4["eligible_games"], 1)
        self.assertEqual(top4["incumbent_hit_rate"], 0.0)
        self.assertEqual(top4["candidate_hit_rate"], 1.0)
        self.assertEqual(top4["average_event_overlap"], 0.0)


class LiveChampionEmpiricalMinutesContract(unittest.TestCase):
    def test_opt_in_changes_real_empirical_game_without_changing_default(self):
        home, away, histories = empirical_inputs()
        baseline = simulate_empirical_game(home, away, histories, empirical_day,
                                           worlds=240, seed=31)
        default = simulate_empirical_game(home, away, histories, empirical_day,
                                          worlds=240, seed=31, minutes_head=None)
        np.testing.assert_array_equal(baseline["home"]["min"], default["home"]["min"])
        np.testing.assert_array_equal(baseline["away"]["pts"], default["away"]["pts"])

        class LowMinutes:
            def predict_minutes(self, history, forecast_day):
                self_check = forecast_day == empirical_day
                assert self_check
                return 3.0

        adjusted = simulate_empirical_game(home, away, histories, empirical_day,
                                           worlds=240, seed=31, minutes_head=LowMinutes())
        self.assertLess(float(adjusted["home"]["min"].mean()),
                        float(baseline["home"]["min"].mean()))
        self.assertLess(float(adjusted["away"]["pts"].mean()),
                        float(baseline["away"]["pts"].mean()))
        self.assertTrue(np.all(adjusted["home"]["min"].sum(axis=1) <= 240.00001))

    def test_future_results_still_ignored_in_live_empirical_trial(self):
        import copy
        home, away, prior = empirical_inputs()
        class LowMinutes:
            def predict_minutes(self, history, forecast_day):
                return 3.0
        good = simulate_empirical_game(home, away, prior, empirical_day,
                                      worlds=100, seed=9, minutes_head=LowMinutes())
        poison = copy.deepcopy(prior)
        for hist in poison.values():
            hist.append({**hist[-1], "date": empirical_day, "min": 44.0,
                         "pts": 99.0, "reb": 30.0})
        bad = simulate_empirical_game(home, away, poison, empirical_day,
                                     worlds=100, seed=9, minutes_head=LowMinutes())
        np.testing.assert_array_equal(good["home"]["pts"], bad["home"]["pts"])
        np.testing.assert_array_equal(good["away"]["min"], bad["away"]["min"])


if __name__ == "__main__":
    unittest.main()
