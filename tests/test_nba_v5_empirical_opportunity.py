"""Causal and forecast-target contracts for the shadow empirical opportunity head."""
from __future__ import annotations
import copy
import datetime as dt
import unittest

import numpy as np

from nba.nba_v5_empirical_stat_engine import simulate_empirical_game
from nba.nba_v5_empirical_opportunity import opportunity_factors
from nba.nba_v5_empirical_opportunity_score import frozen_event_top_cards
from tests.test_nba_v5_empirical_stat_engine import DAY, inputs


class FakePastOnlyHead:
    training_cutoff = DAY
    def predict_rate(self, history, key, baseline):
        if any(h["date"] >= DAY for h in history):
            raise ValueError("FUTURE_GAME_WAS_PASSED_TO_HEAD")
        mult = {"fga": 1.25, "tpa": 1.2, "ast": 1.2,
                "dreb": 1.2, "oreb": 1.1, "fta": 1.10}.get(key, 1.0)
        return baseline * mult


def all_history_fields(history):
    for h in history.values():
        for row in h:
            row["tpa"] = max(1, row["tpm"] + 2.)
            row["oreb"] = max(0., row["reb"] // 4)
            row["dreb"] = row["reb"] - row["oreb"]


class EmpiricalOpportunityResearchContracts(unittest.TestCase):
    def test_option_is_off_by_default_and_only_changes_expected_opportunities(self):
        home, away, history = inputs()
        all_history_fields(history)
        baseline = simulate_empirical_game(home, away, history, DAY, worlds=650, seed=19)
        repeat = simulate_empirical_game(home, away, history, DAY, worlds=650, seed=19,
                                         opportunity_head=None)
        alt = simulate_empirical_game(home, away, history, DAY, worlds=650, seed=19,
                                      opportunity_head=FakePastOnlyHead())
        for side in ("home", "away"):
            np.testing.assert_array_equal(baseline[side]["pts"], repeat[side]["pts"])
            np.testing.assert_array_equal(baseline[side]["min"], alt[side]["min"])
            self.assertGreater(alt[side]["fga"].mean(), baseline[side]["fga"].mean())
            self.assertGreater(alt[side]["ast"].mean(), baseline[side]["ast"].mean())
            self.assertTrue(np.all(alt[side]["min"].sum(axis=1) <= 240. + 1e-8))
            self.assertTrue(np.all(alt[side]["pts"] >= 3*alt[side]["tpm"]))
            self.assertTrue(np.all(alt[side]["fga"] >= alt[side]["fgm"]))
        self.assertEqual(alt["world_kind"],
                         "RESEARCH_SUPERVISED_OPPORTUNITY_RATES_WITH_SHARED_PACE")

    def test_same_day_data_is_excluded_from_rate_input(self):
        h, a, history = inputs()
        all_history_fields(history)
        original = simulate_empirical_game(h, a, history, DAY, worlds=210, seed=3,
                                            opportunity_head=FakePastOnlyHead())
        poisoned = copy.deepcopy(history)
        for rows in poisoned.values():
            rows.append({**rows[-1], "date": DAY, "fga": 30000.,
                         "ast": 10000., "pts": 50000.})
        modified = simulate_empirical_game(h, a, poisoned, DAY, worlds=210, seed=3,
                                            opportunity_head=FakePastOnlyHead())
        np.testing.assert_array_equal(original["home"]["fga"], modified["home"]["fga"])
        np.testing.assert_array_equal(original["away"]["ast"], modified["away"]["ast"])

    def test_future_trained_model_rejected_and_changes_are_bounded(self):
        h, a, history = inputs()
        all_history_fields(history)
        class FutureHead(FakePastOnlyHead):
            training_cutoff = DAY + dt.timedelta(days=1)
        with self.assertRaisesRegex(ValueError, "TRAINED_AFTER_TARGET"):
            simulate_empirical_game(h, a, history, DAY, worlds=30, seed=1,
                                    opportunity_head=FutureHead())
        factors = opportunity_factors(FakePastOnlyHead(), history["100"], True)
        for key in ("fga", "tpa", "ast", "pts", "reb", "tpm"):
            self.assertGreaterEqual(factors[key], .75)
            self.assertLessEqual(factors[key], 1.25)

    def test_topcard_uses_only_original_fixed_target_not_easier_candidate_mean(self):
        base, alt = [], []
        for player in range(12):
            a = {"game": "g1", "player": str(player)}
            b = {"game": "g1", "player": str(player)}
            for stat in ("points","rebounds","assists","three_pointers_made",
                         "steals","blocks"):
                a[stat] = {"mean": 8., "actual": 7.,
                           "samples_ge": {k: .5 for k in range(30)}}
                b[stat] = {"mean": 2., "actual": 7.,
                           "samples_ge": {k: .9 for k in range(30)}}
            base.append(a); alt.append(b)
        result = frozen_event_top_cards(base, alt, ("points",))
        self.assertEqual(result["top4"]["incumbent_hit_rate"], 0.)
        self.assertEqual(result["top4"]["candidate_hit_rate"], 0.)
        self.assertEqual(result["top10"]["candidate_hit_rate"], 0.)
        alt[0]["points"]["actual"] = 8.
        with self.assertRaisesRegex(ValueError, "ACTUAL_MISMATCH"):
            frozen_event_top_cards(base, alt, ("points",))


if __name__ == "__main__":
    unittest.main()
