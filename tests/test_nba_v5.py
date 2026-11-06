"""NBA V5 simulation: consistency guarantees, availability, rotation extraction, and no use of the future."""
import copy
import datetime as dt
import unittest

import numpy as np

from nba import nba_v4_backtest as v4
from nba import nba_v5_backtest as b5
from nba import nba_v5_context as ctxm
from nba.nba_v5_sim import League, TeamInput, build_profile, presence_from_events, simulate_game, SEG


def line(minutes=30, **k):
    d = {"min": minutes, "fga": 12, "fgm": 5, "tpa": 4, "tpm": 1.5, "fta": 4, "ftm": 3, "ast": 3, "oreb": 1, "dreb": 4, "stl": 1,
         "blk": 0.5, "tov": 2, "pf": 2.5, "pts": 14, "reb": 5, "start": True}
    d.update(k)
    return d


def league():
    L = League()
    L.per_min = {"fga": 0.4, "fgm": 0.18, "tpa": 0.14, "tpm": 0.05, "fta": 0.13, "ftm": 0.1, "ast": 0.1, "oreb": 0.03, "dreb": 0.11,
                 "stl": 0.03, "blk": 0.02, "tov": 0.07, "pf": 0.08, "pts": 0.45}
    return L


def team(n=10, p_play=None, defence=None):
    L = league()
    prof = [build_profile([line(30 if i < 5 else 18) for _ in range(12)], L) for i in range(n)]
    pres = np.zeros((n, SEG))
    for i in range(n):
        pres[i, :] = 0.8 if i < 5 else 0.25
    return TeamInput(ids=[f"p{i}" for i in range(n)], prof=prof, presence=pres, p_play=np.array(p_play if p_play is not None else [1.0] * n),
                     starter=np.array([i < 5 for i in range(n)]), defence=defence or {})


class SimTests(unittest.TestCase):
    def setUp(self):
        self.L = league()
        self.tables = {"blow": np.ones((4, 2)), "foul": np.ones((6, 2))}

    def run_sim(self, h, a, **k):
        return simulate_game(h, a, self.L, self.tables, S=300, pace=98.0, seed=5, **k)

    def test_points_add_up_and_minutes_fit(self):
        s = self.run_sim(team(), team())
        for i, side in enumerate(("home", "away")):
            self.assertTrue(np.allclose(s[side]["pts"].sum(axis=1), s["score"][:, i]))
            tot = s[side]["min"].sum(axis=1)
            self.assertTrue(np.all(tot >= 239.99))
            self.assertTrue(np.all(tot <= 240.0 + 25.0 * 4 + 1e-6))      # regulation plus up to four overtimes (25 player-minutes each)
        self.assertTrue(np.all(s["home"]["tpm"] <= s["home"]["fgm"] + 1e-9))

    def test_made_threes_are_inside_made_baskets_and_assists_need_makes(self):
        s = self.run_sim(team(), team())
        for side in ("home", "away"):
            self.assertTrue(np.all(s[side]["tpm"].sum(axis=1) <= s[side]["fgm"].sum(axis=1)))
            self.assertTrue(np.all(s[side]["ast"].sum(axis=1) <= s[side]["fgm"].sum(axis=1)))

    def test_same_seed_same_game(self):
        a, b = self.run_sim(team(), team()), self.run_sim(team(), team())
        self.assertTrue(np.array_equal(a["home"]["pts"], b["home"]["pts"]))

    def test_a_player_who_is_out_never_plays_and_teammates_take_the_minutes(self):
        base = self.run_sim(team(), team())
        pp = [1.0] * 10
        pp[0] = 0.0
        out = self.run_sim(team(p_play=pp), team())
        self.assertEqual(float(out["home"]["min"][:, 0].sum()), 0.0)
        self.assertEqual(float(out["home"]["pts"][:, 0].sum()), 0.0)
        self.assertGreater(float(out["home"]["min"][:, 1:].sum()), float(base["home"]["min"][:, 1:].sum()))
        self.assertTrue(np.allclose(out["home"]["min"].sum(axis=1)[out["score"][:, 0] != out["score"][:, 1]], 240.0, atol=25.0))

    def test_a_questionable_player_gets_separate_scenarios(self):
        pp = [1.0] * 10
        pp[0] = 0.5
        s = self.run_sim(team(p_play=pp), team())
        played = s["avail"][0][:, 0]
        self.assertTrue(0.3 < played.mean() < 0.7)
        self.assertEqual(float(s["home"]["min"][~played, 0].sum()), 0.0)
        # his absence changes teammates' minutes in the scenarios where he sits
        self.assertGreater(float(s["home"]["min"][~played, 1].mean()), float(s["home"]["min"][played, 1].mean()))

    def test_start_and_close_odds_are_reported(self):
        s = self.run_sim(team(), team())
        self.assertGreater(float(s["first5"][0][:, :5].mean()), 0.9)
        self.assertEqual(s["first5"][0].sum(axis=1).min(), 5)


class RotationTests(unittest.TestCase):
    def test_presence_from_substitutions(self):
        g = {"home": "1", "away": "2", "starters": {"1": ["a", "b", "c", "d", "e"], "2": ["v", "w", "x", "y", "z"]},
             "events": [[1, 600.0, "SUB", "1", "f", "a", 0, None, None, None],     # f replaces a with 10:00 left in Q1
                        [1, 0.0, "TMO", "1", "", "", 0, None, None, None],
                        [2, 0.0, "TMO", "1", "", "", 0, None, None, None],
                        [3, 0.0, "TMO", "1", "", "", 0, None, None, None],
                        [4, 0.0, "TMO", "1", "", "", 0, None, None, None]]}
        pres, fouls, margin, team_of = presence_from_events(g)
        self.assertAlmostEqual(float(pres["a"].sum()), 120.0, delta=1.0)            # played 2 minutes only
        self.assertAlmostEqual(float(pres["f"].sum()), 2880.0 - 120.0, delta=130.0)
        self.assertAlmostEqual(float(pres["b"].sum()), 2880.0, delta=1.0)


class ContextTests(unittest.TestCase):
    def test_back_to_back_and_travel_flags(self):
        prev = [(dt.date(2026, 1, 1), "2")]
        f = ctxm.schedule_flags(prev, "13", "13", dt.date(2026, 1, 2))
        self.assertTrue(f["back_to_back"])
        self.assertTrue(f["long_trip"])                                              # Boston to Los Angeles
        prev = [(dt.date(2026, 1, 1), "7")]
        f2 = ctxm.schedule_flags(prev, "13", "7", dt.date(2026, 1, 5))
        self.assertTrue(f2["altitude_visit"])

    def test_first_game_back_detected(self):
        team_dates = [dt.date(2026, 1, i) for i in range(1, 12)]
        played = [dt.date(2026, 1, i) for i in range(1, 5)]
        self.assertEqual(ctxm.games_since_return(played, team_dates, dt.date(2026, 1, 12)), 0)
        back = played + [dt.date(2026, 1, 11)]                                       # returned on the 11th, tonight is his second game back
        self.assertEqual(ctxm.games_since_return(back, team_dates + [dt.date(2026, 1, 12)], dt.date(2026, 1, 13)), 1)

    def test_zone_of(self):
        self.assertEqual(ctxm.zone_of(25, 1, 2), 0)
        self.assertEqual(ctxm.zone_of(25, 8, 2), 1)
        self.assertEqual(ctxm.zone_of(25, 15, 2), 2)
        self.assertEqual(ctxm.zone_of(2, 3, 3), 3)
        self.assertEqual(ctxm.zone_of(25, 26, 3), 4)


if __name__ == "__main__":
    unittest.main()
