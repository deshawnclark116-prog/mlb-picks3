"""NBA V5 low-history player/rotation priors: no fabricated debut forecasts."""
import datetime as dt
import unittest

import numpy as np

from nba.nba_v5_cold_start import LowHistoryRotations,evaluate_cold_start
from nba.nba_v5_sim import SEG
from nba.nba_v5_forecast import pseudo_game
from nba.nba_v5_role_trial_score import MARKETS


class LowHistoryRotationContracts(unittest.TestCase):
    def test_learn_starting_and_bench_patterns_from_completed_games_only(self):
        st=LowHistoryRotations()
        p=np.array([110.]*4+[95.]*8+[20.]*12)
        game={"players":[{"id":"p1","start":True,"min":29},
                         {"id":"p2","start":False,"min":18}]}
        for i in range(60):
            st.add_finished_game(game,{"p1":p,"p2":p[::-1]})
        vec,audit=st.prior(True,30)
        self.assertFalse(audit["fallback_uniform"])
        self.assertEqual(audit["group_player_game_samples"],60)
        self.assertEqual(vec.shape,(SEG,))
        self.assertAlmostEqual(float(vec.sum()*2),30,delta=.1)
        self.assertGreater(vec[0],vec[-1])
        ben,info=st.prior(False,18)
        self.assertAlmostEqual(float(ben.sum()*2),18,delta=.1)
        self.assertGreater(ben[-1],ben[0])
        self.assertFalse(info["fallback_uniform"])
        self.assertTrue(audit["shadow_only"])

    def test_few_priors_do_not_invent_rotation_precision(self):
        st=LowHistoryRotations()
        result,evidence=st.prior(False,20)
        np.testing.assert_allclose(result,np.full(SEG,20/48))
        self.assertTrue(evidence["fallback_uniform"])
        self.assertEqual(evidence["group_player_game_samples"],0)
        with self.assertRaises(ValueError):
            st.prior(True,48)
        with self.assertRaises(ValueError):
            st.prior(True,-1)

    def test_pregame_source_can_add_prior_minutes_but_not_unknown_player(self):
        source={"home_id":"2","away_id":"30","rows":[
            {"player_id":"101","team_id":"2","player":"Rookie X",
             "reported_status":"QUESTIONABLE","p_active":.8,
             "conditional_minutes_mean":14.5},
            {"player_id":"102","team_id":"2","player":"Out Y",
             "reported_status":"OUT","p_active":.0,
             "conditional_minutes_mean":12},
        ]}
        game=pseudo_game(source)
        self.assertEqual(len(game["players"]),1)
        self.assertEqual(game["players"][0]["id"],"101")
        self.assertAlmostEqual(game["players"][0]["prior_minutes_estimate"],14.5)


def record(pid,pt,actual):
    a={"game":"g","player":pid,"min_actual":20,"min_sim":19}
    for stat in MARKETS:
        a[stat]={"mean":float(pt),"actual":float(actual),
                 "samples_ge":{k:float(.9 if k<=pt else .2) for k in range(60)},
                 "base":float(pt)}
    return a


class CoverageAndScoringContracts(unittest.TestCase):
    def test_new_rookie_rows_are_reported_separately_not_cherrypicked(self):
        champion=[record("veteran",11,12)]
        challenger=[record("veteran",12,12),record("rookie",3,2)]
        report=evaluate_cold_start(champion,challenger,{})
        self.assertEqual(report["original_modeled_player_game_count"],1)
        self.assertEqual(report["candidate_modeled_player_game_count"],2)
        self.assertEqual(report["genuinely_new_player_game_count"],1)
        self.assertEqual(report["added_player_grade"]["points"]["n"],1)
        self.assertEqual(report["metrics"]["points|standalone_v5|mae"]["n"],1)
        self.assertFalse(report["model_promotion_allowed"])
        with self.assertRaises(ValueError):
            evaluate_cold_start(champion,challenger[1:],{})


if __name__=="__main__":
    unittest.main()
