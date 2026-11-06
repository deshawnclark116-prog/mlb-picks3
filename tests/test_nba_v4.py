"""NBA V4: rounding, distribution shape, and the promise that no prediction uses the future."""
import copy
import datetime as dt
import unittest

import numpy as np

from nba import nba_v4_backtest as bt
from nba.nba_v4_forecast import nb_cdf_lattice


def player(pid, team, side, minutes, pts, start=True):
    return {"id": pid, "name": pid, "team": team, "side": side, "start": start, "min": minutes, "pts": pts, "reb": 4, "ast": 3,
            "oreb": 1, "dreb": 3, "fgm": 5, "fga": 11, "tpm": 1, "tpa": 3, "ftm": 2, "fta": 3, "tov": 1, "stl": 1, "blk": 0, "pf": 2}


def game(n, day, home_pts=100, away_pts=98, absent=None, p1_pts=20):
    ps = []
    for i in range(8):
        ps.append(player(f"h{i}", "1", "home", 30 - i, p1_pts if i == 0 else 9, i < 5))
        ps.append(player(f"a{i}", "2", "away", 30 - i, 9, i < 5))
    if absent:
        ps = [p for p in ps if p["id"] != absent]
    return {"game_id": str(n), "date": f"2026-01-{day:02d}T00:00Z", "season_type": 2,
            "home": {"id": "1", "abbr": "H", "score": home_pts}, "away": {"id": "2", "abbr": "A", "score": away_pts},
            "officials": [], "venue": "x", "players": ps}


class V4Tests(unittest.TestCase):
    def test_rounding_rule(self):
        self.assertEqual(bt.whole(20.5), 20)
        self.assertEqual(bt.whole(20.6), 21)
        self.assertEqual(bt.whole(3.0), 3)

    def test_cdf_lattice_is_a_proper_distribution(self):
        for mu, alpha in ((0.8, 0.0), (4.0, 0.3), (22.0, 0.15)):
            c = nb_cdf_lattice(mu, alpha, 40)
            self.assertTrue(all(b >= a for a, b in zip(c, c[1:])))
            self.assertEqual(c[-1], 1.0)
            self.assertGreaterEqual(c[0], 0.0)

    def test_reach_probability_matches_the_published_lattice_convention(self):
        # cdf[i] = P(X <= i) = P(X < i+1), so P(X >= k) = 1 - cdf[k-1]
        c = nb_cdf_lattice(5.0, 0.2, 40)
        from scipy.stats import nbinom
        r = 1 / 0.2
        self.assertAlmostEqual(1 - c[4], float(nbinom.sf(4, r, r / (r + 5.0))), places=5)

    def test_no_prediction_uses_a_later_day(self):
        games = [game(i, 1 + i // 2) for i in range(1, 24)]
        rows_a = bt.build_rows(games)
        changed = copy.deepcopy(games)
        for g in changed[12:]:                                 # rewrite the later games completely
            for p in g["players"]:
                p["min"], p["pts"] = 5.0, 40
        rows_b = bt.build_rows(changed)
        cutoff = dt.date.fromisoformat(changed[12]["date"][:10])
        early_a = [r for r in rows_a if r["date"] < cutoff]
        early_b = [r for r in rows_b if r["date"] < cutoff]
        self.assertGreater(len(early_a), 0)
        self.assertEqual([(r["game"], r["player"], r["f"]) for r in early_a], [(r["game"], r["player"], r["f"]) for r in early_b])

    def test_same_day_games_do_not_feed_each_other(self):
        a = [game(i, 1 + i // 2) for i in range(1, 12)] + [game(100, 20), game(101, 20)]
        b = copy.deepcopy(a)
        for p in b[-1]["players"]:
            p["min"], p["pts"] = 1.0, 0
        ra = [r["f"] for r in bt.build_rows(a) if r["game"] == "100"]
        rb = [r["f"] for r in bt.build_rows(b) if r["game"] == "100"]
        self.assertEqual(ra, rb)

    def test_teammates_out_counts_regulars_who_are_missing(self):
        games = [game(i, 1 + i // 2) for i in range(1, 14)]
        games.append(game(99, 25, absent="h1"))                 # a regular (about 29 min) is out in the last game
        rows = bt.build_rows(games)
        last = [r for r in rows if r["game"] == "99" and r["team"] == "1"]
        self.assertTrue(last)
        self.assertGreater(last[0]["f"]["vacated"], 25.0)
        earlier = [r for r in rows if r["game"] == "13" and r["team"] == "1"]
        self.assertEqual(earlier[0]["f"]["vacated"], 0.0)


if __name__ == "__main__":
    unittest.main()
