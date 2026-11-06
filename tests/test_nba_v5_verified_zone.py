"""NBA V5 defender team identity must come from verified on-court shooter."""
import copy
import unittest

from nba.nba_v5_verified_zone import verified_shot_teams,verified_defence_zone_tallies
from nba.nba_v5_context import game_zone_tallies


def game():
    home,away="1","2"
    ev=[]
    for t in range(20,2880,20):
        per=min(4,t//720+1)
        left=720-t%720
        if t==600:ev.append([per,left,"SUB",home,"p5","p1",0])
        if t==1800:ev.append([per,left,"SUB",home,"p1","p5",0])
        # One of the two shooting teams is systematically mislabeled by
        # ESPN; the named player remains an independent court identifier.
        ev.append([per,left,"S2",away,"p0","",2,25,3])
        ev.append([per,left,"S2",away,"x0","",0,25,3])
    return {"home":home,"away":away,
            "starters":{home:["p0","p1","p2","p3","p4"],
                        away:["x0","x1","x2","x3","x4"]},
            "events":ev}


class VerifiedZoneSourceTests(unittest.TestCase):
    def test_defender_identification_follows_actual_court_not_buggy_team_id(self):
        pb=game()
        original=copy.deepcopy(pb)
        fixed,audit=verified_shot_teams(pb)
        self.assertTrue(audit["verified"],audit["reason"])
        self.assertGreater(audit["shot_event_team_corrections"],100)
        self.assertEqual(pb,original)
        self.assertNotEqual(fixed["events"],original["events"])
        shooter,raw=game_zone_tallies(pb)
        corrected,diag=verified_defence_zone_tallies(pb)
        self.assertEqual(diag["shot_event_team_corrections"],audit["shot_event_team_corrections"])
        self.assertAlmostEqual(float(raw["1"][0].sum()),0)
        self.assertGreater(float(corrected["1"][0].sum()),0)
        self.assertGreater(float(corrected["2"][0].sum()),0)
        repaired_shooter,_=game_zone_tallies(fixed)
        self.assertEqual(set(shooter),set(repaired_shooter))
        for pid in shooter:
            self.assertTrue((shooter[pid]==repaired_shooter[pid]).all())

    def test_invalid_rotation_preserves_original_source_and_does_not_infer(self):
        pb=game()
        pb["events"].insert(1,[1,690,"SUB","1","p9","NOT_ON",0])
        fixed,audit=verified_shot_teams(pb)
        self.assertFalse(audit["verified"])
        self.assertIs(fixed,pb)
        self.assertEqual(audit["shot_event_team_corrections"],0)

    def test_overtime_events_untouched_by_regulation_only_verifier(self):
        pb=game()
        pb["events"].append([5,250,"SUB","1","brandnew","unknown",0])
        pb["events"].append([5,245,"S2","1","brandnew","",2,25,3])
        fixed,audit=verified_shot_teams(pb)
        self.assertTrue(audit["verified"])
        self.assertEqual(fixed["events"][-2:],pb["events"][-2:])


if __name__=="__main__":
    unittest.main()
