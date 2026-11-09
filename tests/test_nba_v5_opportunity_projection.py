"""V5 projection-math regression: recency-aware opportunities, stable skill."""
import unittest
from nba.nba_v5_sim import League, build_profile

KEYS = ("fga", "tpa", "fta", "ast", "oreb", "dreb", "stl", "blk", "tov", "pf")

def history(recent_jump=False):
    rows = []
    for i in range(24):
        fga = 22.0 if recent_jump and i >= 20 else 8.0
        rows.append({
            "min": 30.0, "fga": fga, "fgm": fga * .45,
            "tpa": fga * .4, "tpm": fga * .4 * .35,
            "fta": 3.0, "ftm": 2.4,
            "ast": 6.0 if recent_jump and i >= 20 else 2.0,
            "oreb": 1.0, "dreb": 4.0, "stl": 1.0,
            "blk": .5, "tov": 2.0, "pf": 2.0,
        })
    return rows

def league():
    L = League()
    L.per_min = {k: .12 for k in KEYS}
    L.p2 = .45
    L.p3 = .35
    L.pft = .80
    L.sh3 = .4
    return L

class OpportunityMathTests(unittest.TestCase):
    def test_recent_role_change_moves_attempts_and_assists_without_future_data(self):
        L = league()
        stable = build_profile(history(), L)
        changed = build_profile(history(True), L)
        self.assertGreater(changed["rate"]["fga"], stable["rate"]["fga"])
        self.assertGreater(changed["rate"]["ast"], stable["rate"]["ast"])
        self.assertGreater(changed["rate"]["tpa"], stable["rate"]["tpa"])
        self.assertLessEqual(changed["rate"]["tpa"], changed["rate"]["fga"])
        # Same shooting accuracy despite changed volume: skill != opportunity.
        self.assertAlmostEqual(changed["p2"], stable["p2"], places=6)
        self.assertAlmostEqual(changed["p3"], stable["p3"], places=6)

    def test_short_history_uses_stable_shrunk_rates(self):
        L = league()
        h = history(True)[:2]
        p = build_profile(h, L, prior_min=60)
        expected = (sum(x["fga"] for x in h) + 60 * L.per_min["fga"]) / (60 + 60)
        self.assertAlmostEqual(p["rate"]["fga"], expected)
        self.assertGreaterEqual(p["rate"]["fga"], p["rate"]["tpa"])

    def test_only_prior_games_change_projection(self):
        L = league()
        before = build_profile(history(), L)
        # Append new observations: older forecast must not change.
        data = history()
        old = build_profile(data[:], L)
        data.append({**data[-1], "fga": 35.0, "ast": 14.0})
        new = build_profile(data, L)
        self.assertEqual(before["rate"], old["rate"])
        self.assertGreater(new["rate"]["fga"], old["rate"]["fga"])

if __name__ == "__main__":
    unittest.main()
