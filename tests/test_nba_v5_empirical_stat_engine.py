"""Separate empirical player-game forecast must be causal, reproducible and numeric."""
import copy
import datetime as dt
from types import SimpleNamespace
import unittest

import numpy as np

from nba.nba_v5_empirical_stat_engine import simulate_empirical_game


DAY = dt.date(2026, 11, 9)


def inputs():
    histories = {}
    home_ids = [str(i + 100) for i in range(10)]
    away_ids = [str(i + 200) for i in range(10)]
    for i, pid in enumerate(home_ids + away_ids):
        rows = []
        for t in range(15):
            minute = float(17 + i % 6 + t % 4)
            rows.append({
                "date": DAY - dt.timedelta(days=20 - t),
                "min": minute, "start": (i % 10) < 5,
                "pts": float(9 + (i + t) % 12),
                "tpm": float((i + t) % 4),
                "reb": float(2 + (i + t) % 8),
                "ast": float((i + t) % 6),
                "stl": float((i + t) % 3),
                "blk": float((i + t) % 2),
                "tov": float((i + t) % 4),
                "fga": float(10 + (i + t) % 6),
                "fgm": float(5 + (i + t) % 4),
                "fta": float((i + t) % 5),
                "ftm": float((i + t) % 4),
            })
        histories[pid] = rows
    home = SimpleNamespace(ids=home_ids, p_play=np.ones(10),
                           starter=np.array([i < 5 for i in range(10)]))
    away = SimpleNamespace(ids=away_ids, p_play=np.ones(10),
                           starter=np.array([i < 5 for i in range(10)]))
    return home, away, histories


class IndependentGameForecastContracts(unittest.TestCase):
    def test_game_stats_follow_real_previous_games_and_cap_team_minutes(self):
        home, away, h = inputs()
        out = simulate_empirical_game(home, away, h, DAY, worlds=320, seed=19,
                                      expected_pace=99, historic_league_pace=99)
        for side in ("home", "away"):
            m = out[side]["min"]
            self.assertEqual(m.shape, (320, 10))
            self.assertTrue((m.sum(axis=1) <= 240 + 1e-8).all())
            self.assertTrue((out[side]["pts"] >= 3 * out[side]["tpm"]).all())
            self.assertTrue((out[side]["fga"] >= out[side]["fgm"]).all())
            self.assertGreater(out[side]["pts"].mean(), 1.)
        self.assertEqual(out["independent_of_v3_v4_forecasts"], True)

    def test_identical_seed_is_reproducible_and_future_boxes_cannot_leak(self):
        home, away, h = inputs()
        a = simulate_empirical_game(home, away, h, DAY, worlds=150, seed=3)
        b = simulate_empirical_game(home, away, h, DAY, worlds=150, seed=3)
        np.testing.assert_array_equal(a["home"]["pts"], b["home"]["pts"])
        poison = copy.deepcopy(h)
        for rows in poison.values():
            rows.append({**rows[-1], "date": DAY, "pts": 10000., "reb": 1000.})
        c = simulate_empirical_game(home, away, poison, DAY, worlds=150, seed=3)
        np.testing.assert_array_equal(a["home"]["pts"], c["home"]["pts"])
        np.testing.assert_array_equal(a["away"]["reb"], c["away"]["reb"])

    def test_missing_known_player_does_not_increase_others_without_evidence(self):
        home, away, h = inputs()
        full = simulate_empirical_game(home, away, h, DAY, worlds=180, seed=21)
        incomplete = copy.deepcopy(home)
        incomplete.ids = home.ids[:8]
        incomplete.starter = home.starter[:8]
        incomplete.p_play = home.p_play[:8]
        reduced = simulate_empirical_game(incomplete, away, h, DAY, worlds=180, seed=21)
        self.assertTrue(np.all(reduced["home"]["min"].sum(axis=1) <= 240.))
        self.assertEqual(reduced["home"]["min"].shape[1], 8)
        # The alternative does not force the 8 modeled players to occupy
        # 240 minutes when two more genuine rotation players were omitted.
        self.assertLess(float(reduced["home"]["min"].mean(axis=1).mean()), 30.)


if __name__ == "__main__":
    unittest.main()
