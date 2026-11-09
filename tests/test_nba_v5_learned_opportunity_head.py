"""A new supervised statistical projection head: past-only training and simulation physics."""
import copy
import datetime as dt
from types import SimpleNamespace
import unittest

import numpy as np

from nba.nba_v5_learned_opportunity_head import OpportunityHead, STATS
from nba.nba_v5_learned_opportunity_head_score import evaluate_native


def source_games():
    games = []
    for day in range(22):
        date = dt.date(2026, 1, 1) + dt.timedelta(days=day)
        players = []
        for i in range(48):
            mod = i % 6
            minutes = 14. + (i % 24)
            row = {"id": str(1000 + i), "min": minutes,
                   "start": i % 3 == 0}
            for key, factor in (
                ("fga", .28), ("tpa", .1), ("fta", .07),
                ("ast", .085), ("oreb", .03), ("dreb", .11),
                ("tov", .05), ("stl", .025), ("blk", .017)):
                row[key] = max(0., factor * minutes * (0.3 + mod / 4.)
                                + 0.1 * ((day + i) % 3))
            players.append(row)
        games.append({"game_id": str(day), "date": str(date), "players": players})
    return games


def fake_row(stat, mean, actual):
    p = {k: float(.67 if k <= round(mean) else .18) for k in range(100)}
    return {"mean": float(mean), "actual": float(actual), "samples_ge": p}


class LearnedHeadContracts(unittest.TestCase):
    def test_fit_only_prior_completed_games_and_future_does_not_change_coefficients(self):
        games = source_games()
        cutoff = "2026-01-19"
        head = OpportunityHead.fit_completed(games, cutoff)
        self.assertEqual(set(head.coefficients), set(STATS))
        self.assertGreater(head.training_examples["fga"], 400)
        poisoned = copy.deepcopy(games)
        for g in poisoned:
            if g["date"] >= cutoff:
                for p in g["players"]:
                    for stat in STATS:
                        p[stat] = 1e8
        head_again = OpportunityHead.fit_completed(poisoned, cutoff)
        for stat in STATS:
            np.testing.assert_allclose(head.coefficients[stat], head_again.coefficients[stat])

    def test_learned_skill_changes_possession_rates_without_mutating_incumbent(self):
        league = {key: .2 for key in STATS}
        model = OpportunityHead(league, {k: np.array([1., 0., 0., 0., 0., 0., 0., 0.])
                                         for k in STATS}, {k: 1000 for k in STATS},
                                 dt.date(2026, 1, 20))
        original_rates = {k: .11 for k in STATS}
        player = {"date": dt.date(2026, 1, 15), "min": 22., "start": True}
        player.update({k: 2. for k in STATS})
        input_team = SimpleNamespace(ids=["1000"],
                                     prof=[{"rate": original_rates.copy(), "sh3": .20}],
                                     zf=np.array([[.40, .30, .10, .10, .10]]))
        next_team, audit = model.apply_team(input_team,
                                            {"1000": [player] * 8},
                                            dt.date(2026, 1, 20))
        self.assertEqual(input_team.prof[0]["rate"], original_rates)
        self.assertAlmostEqual(float(input_team.zf[0, 3:].sum()), .20)
        self.assertGreater(next_team.prof[0]["rate"]["fga"], .11)
        self.assertAlmostEqual(next_team.prof[0]["sh3"],
                               float(next_team.zf[0, 3:].sum()), places=7)
        self.assertIn("1000", audit)
        self.assertNotEqual(input_team.prof[0]["rate"], next_team.prof[0]["rate"])

    def test_scoring_is_v5_only_at_the_same_original_threshold(self):
        incumbent, challenger = [], []
        for i in range(4):
            a = {"game": str(i), "player": "p", "min_actual": 28.}
            b = {"game": str(i), "player": "p", "min_actual": 28.}
            for key in ("points", "rebounds", "assists", "three_pointers_made",
                        "steals", "blocks", "turnovers"):
                a[key] = fake_row(key, 10, 12)
                b[key] = fake_row(key, 11.2, 12)
            incumbent.append(a)
            challenger.append(b)
        report = evaluate_native(incumbent, challenger)
        self.assertTrue(report["not_using_v3_or_v4_forecasts"])
        self.assertTrue(report["all_four_core_mean_mae_improved"])
        self.assertFalse(report["promotion_allowed"])
        self.assertGreater(report["metrics"]["points|native_v5_mean_mae"]
                           ["mean_reduction_positive_is_better"], 0)


if __name__ == "__main__":
    unittest.main()
