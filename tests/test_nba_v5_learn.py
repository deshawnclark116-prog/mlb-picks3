"""NBA V5 learned pieces: availability table, joint scenarios, per-team rotation, defenders, timing, timeouts."""
import datetime as dt
import unittest

import numpy as np

from nba import nba_v5_availability as av
from nba import nba_v5_learn as lm
from nba.nba_v5_sim import RotationTables, SEG


class AvailabilityTests(unittest.TestCase):
    def test_priors_then_learning(self):
        t = av.PlayTable()
        self.assertAlmostEqual(t.p_play("Questionable"), 0.55)
        learned = av.PlayTable({"QUESTIONABLE": {"played": 5, "did_not_play": 95}})
        self.assertLess(learned.p_play("Questionable"), 0.15)                 # results overrule the starting value
        self.assertGreater(av.PlayTable({"QUESTIONABLE": {"played": 90, "did_not_play": 10}}).p_play("Questionable"), 0.8)

    def test_body_part_refines_only_with_evidence(self):
        base = {"QUESTIONABLE": {"played": 50, "did_not_play": 50}}
        few = av.PlayTable(base, {"QUESTIONABLE|Knee": {"played": 0, "did_not_play": 2}})
        many = av.PlayTable(base, {"QUESTIONABLE|Knee": {"played": 2, "did_not_play": 60}})
        self.assertGreater(few.p_play("Questionable", "Knee"), 0.4)           # two games barely move it
        self.assertLess(many.p_play("Questionable", "Knee"), 0.25)

    def test_unknown_status_is_treated_as_unlisted(self):
        self.assertEqual(av.norm_status("brand new wording"), "UNLISTED")
        self.assertEqual(av.norm_status("Day-To-Day"), "QUESTIONABLE")


class JointTests(unittest.TestCase):
    def rosters(self, n=60):
        """Players 0 and 1 always sit together; player 2 sits on his own; players 3-5 always play."""
        rng = np.random.default_rng(1)
        out = []
        for g in range(n):
            m = {f"p{i}": 25.0 for i in range(6)}
            if rng.random() < 0.3:
                m.pop("p0")
                m.pop("p1")
            if rng.random() < 0.2:
                m.pop("p2")
            out.append((dt.date(2026, 1, 1) + dt.timedelta(days=2 * g), m))
        return out

    def test_correlation_finds_players_who_sit_together(self):
        ids, A = av.absence_matrix(self.rosters(), dt.date(2027, 1, 1))
        R = av.correlation_from_absences(A)
        i0, i1, i2 = ids.index("p0"), ids.index("p1"), ids.index("p2")
        self.assertGreater(R[i0, i1], 0.8)
        self.assertLess(abs(R[i0, i2]), 0.4)
        self.assertTrue(np.all(np.linalg.eigvalsh(R) > 0))

    def test_copula_keeps_each_players_chance_and_adds_togetherness(self):
        ids, A = av.absence_matrix(self.rosters(), dt.date(2027, 1, 1))
        R = av.correlation_from_absences(A)
        p = np.array([0.7 if i in ("p0", "p1") else 0.9 for i in ids])
        rng = np.random.default_rng(2)
        s = av.copula_availability(rng, p, R, 20000)
        self.assertAlmostEqual(float(s[:, ids.index("p0")].mean()), 0.7, delta=0.02)
        both_out = float((~s[:, ids.index("p0")] & ~s[:, ids.index("p1")]).mean())
        self.assertGreater(both_out, 0.3 * 0.3 * 1.8)                          # far more often than independent (0.09)

    def test_too_little_history_gives_no_matrix(self):
        ids, A = av.absence_matrix(self.rosters(10), dt.date(2027, 1, 1))
        self.assertIsNone(A)


class RotationTests(unittest.TestCase):
    def test_team_table_is_pulled_toward_the_league_when_data_is_thin(self):
        t = RotationTables()
        t.blow_sum[:] = np.array([[1, 1], [0.8, 0.8], [0.6, 0.6], [0.4, 0.4]]) * 100
        t.blow_n[:] = 100
        # one team with a handful of observations showing no blowout response at all
        t.t_blow_sum["9"] = np.ones((4, 2)) * 5
        t.t_blow_n["9"] = np.ones((4, 2)) * 5
        lg, tm = t.blow_mult(), t.blow_mult_team("9")
        self.assertLess(abs(tm[3, 1] - lg[3, 1]), 0.4)                         # not fully believed
        t.t_blow_sum["9"] = np.ones((4, 2)) * 5000
        t.t_blow_n["9"] = np.ones((4, 2)) * 5000
        self.assertGreater(t.blow_mult_team("9")[3, 1], lg[3, 1] + 0.3)        # with lots of evidence the team's own habit wins
        self.assertTrue(np.array_equal(t.blow_mult_team("unknown"), lg))


def game():
    ev = []
    def add(per, left, kind, team, a="", b="", pts=0, x=None, y=None):
        ev.append([per, float(left), kind, team, a, b, pts, x, y, None])
    # home (1) starters h1-h5, away (2) starters a1-a5
    add(1, 700, "S2", "1", "h1", "", 2, 25, 1)                 # make at the rim, 20 s in: a normal-timing shot for the home side
    add(1, 690, "DR", "2", "a1")                               # away rebound starts a live possession...
    add(1, 685, "S3", "2", "a2", "", 0, 25, 26)               # ...and a quick miss (5 s)
    add(1, 640, "TMO", "1")
    add(1, 600, "SUB", "1", "h6", "h5")
    for per in (2, 3, 4):
        add(per, 0, "TMO", "2")
    return {"home": "1", "away": "2", "starters": {"1": ["h1", "h2", "h3", "h4", "h5"], "2": ["a1", "a2", "a3", "a4", "a5"]}, "events": ev}


class LearnTests(unittest.TestCase):
    def test_game_learning_reads_defenders_timing_stints_and_timeouts(self):
        L = lm.game_learning(game())
        self.assertAlmostEqual(float(L["def_zone"]["a1"][0][0]), 1.0)          # a1 was on the floor when the home side shot at the rim
        self.assertAlmostEqual(float(L["def_zone"]["a1"][1][0]), 1.0)
        self.assertGreater(float(L["timing"][1][0][0]), 0.0)                   # the quick away shot came after a live (rebound) start
        self.assertTrue(any(s == 0 for s, t, r in L["timeouts"]))
        self.assertAlmostEqual(sum(L["stints"]["h5"]), 2880.0 / 60.0 * 0 + (L["stints"]["h5"][0]), places=6)
        self.assertAlmostEqual(L["stints"]["h5"][0], (2880.0 - 2880.0 + (720 - 600) + 0) / 60.0, delta=0.1)   # left with 10:00 left in Q1

    def test_defender_effect_needs_evidence_and_is_relative_to_his_team(self):
        s = lm.LearnState()
        s.def_player["d"] = np.array([[50.0, 100, 100, 100, 100], [15, 40, 40, 40, 40]])
        s.def_team["T"] = np.array([[400.0, 400, 400, 400, 400], [260, 180, 180, 180, 180]])
        f, p = s.defender_effects("d", "T")
        self.assertLess(f[0], 1.0)                                              # opponents shoot less often at the rim against him
        f2, p2 = s.defender_effects("nobody", "T")
        self.assertTrue(np.array_equal(f2, np.ones(5)))


if __name__ == "__main__":
    unittest.main()
