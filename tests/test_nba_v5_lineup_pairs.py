"""NBA V5 historical lineup-effect safety checks.

Fixtures deliberately cover quarter boundaries, a bench player entering and
leaving, malformed substitutions, miscredited shooters, and future isolation.
No invented player tracking information is used.
"""
import unittest
import numpy as np

from nba.nba_v5_lineup_pairs import LineupPairState, replay_game


def pbp_fixture():
    home, away = "1", "2"
    starters = {home: ["p0","p1","p2","p3","p4"],
                away: ["x0","x1","x2","x3","x4"]}
    events = []
    for t in range(20, 2880, 20):
        period = min(4, int(t // 720)+1)
        left = 720 - (t % 720)
        if t == 600:
            events.append([period,left,"SUB",home,"p5","p1",0])
        if t == 1800:
            events.append([period,left,"SUB",home,"p1","p5",0])
        # Full-game player p0 is more likely to shoot when p1 is on court.
        mate_on = t < 600 or t >= 1800
        shooter = "p0" if mate_on or t % 60 == 0 else "p2"
        events.append([period,left,"S2",home,shooter,"",0])
        events.append([period,left,"S3",away,"x0","",0])
    return {"game_id":"synthetic","date":"2026-01-07","home":home,"away":away,
            "starters":starters,"events":events}


class PbpValidationTests(unittest.TestCase):
    def test_traces_reconstruct_exact_team_minutes_and_mate_overlap(self):
        g = pbp_fixture()
        r = replay_game(g)
        self.assertTrue(r["valid"], r["reason"])
        self.assertAlmostEqual(sum(v[0] for (tid,p),v in r["player"].items() if tid=="1"),240)
        self.assertAlmostEqual(sum(v[0] for (tid,p),v in r["player"].items() if tid=="2"),240)
        self.assertAlmostEqual(r["player"][("1","p0")][0],48)
        self.assertAlmostEqual(r["pair"][("1","p0","p1")][0],28)
        self.assertAlmostEqual(r["pair"][("1","p0","p5")][0],20)
        self.assertGreater(r["pair"][("1","p0","p1")][1] / 28,
                           r["pair"][("1","p0","p5")][1] / 20)

    def test_misassigned_event_team_is_repaired_only_by_verified_on_court_player(self):
        g = pbp_fixture()
        g["events"][0][3] = "2"  # ESPN mislabeled the home shooter as away
        got = replay_game(g)
        self.assertTrue(got["valid"], got["reason"])
        self.assertEqual(got["team_label_corrections"], 1)
        state = LineupPairState()
        self.assertTrue(state.add_game(g))
        self.assertEqual(state.corrected_events, 1)

    def test_invalid_substitution_excludes_all_opportunity_evidence(self):
        g = pbp_fixture()
        g["events"].insert(1,[1,690,"SUB","1","p9","NOT_ON","0"])
        state = LineupPairState()
        self.assertFalse(state.add_game(g))
        self.assertFalse(state.players)
        self.assertFalse(state.pairs)
        self.assertIn("INVALID_SUBSTITUTION", state.rejected_games)

    def test_future_and_off_court_shots_are_rejected(self):
        g = pbp_fixture()
        g["events"][30][4] = "never_rostered"
        self.assertEqual(replay_game(g)["reason"],"PLAYER_NOT_ON_COURT")
        g = pbp_fixture()
        g["events"].append([2,700,"S2","1","p0","",0])  # moves time backward after Q4
        self.assertEqual(replay_game(g)["reason"],"NONMONOTONIC_CLOCK")

    def test_effects_need_adequate_on_and_off_sample_and_preserve_team_keys(self):
        g = pbp_fixture()
        state = LineupPairState()
        state.add_game(g)
        early,_,audit = state.for_roster("1",["p0","p1","p2","p5"])
        self.assertEqual(audit["pair_rows_with_adequate_on_off_exposure"],0)
        self.assertTrue(all(not arr.any() for arr in early.values()))
        for _ in range(7):
            self.assertTrue(state.add_game(g))
        eff, baseline, diag = state.for_roster("1",["p0","p1","p2","p5"])
        self.assertGreater(eff["fga"][0,1],0)
        self.assertLess(eff["fga"][0,3],0)
        self.assertGreater(diag["pair_rows_with_adequate_on_off_exposure"],0)
        self.assertAlmostEqual(eff["fga"][0,0],0)
        self.assertLessEqual(np.abs(eff["fga"]).max(),.13*.6+1e-6)
        self.assertTrue(np.isfinite(baseline["fga"]).all())
        different,_,_ = state.for_roster("another_team",["p0","p1","p2","p5"])
        self.assertEqual(float(different["fga"].sum()),0)


if __name__ == "__main__":
    unittest.main()
