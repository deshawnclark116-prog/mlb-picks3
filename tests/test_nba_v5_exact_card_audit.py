"""Fail-closed no-leakage checks for authentic NBA V5 card replay."""
import unittest
from nba.nba_v5_exact_card_audit import (
    whole, select, paired_metrics, calibration_offset, score_calibrator)


def row(name, market="points", p=.75, starter="CONFIRMED_STARTER",
        active=.95, mean=12.0, status="AVAILABLE", target=12):
    # CDF slot [target-1] determines genuine P(reach | plays).
    cdf=[0.] * (target-1) + [1.-p]
    return {
        "player":name,"player_id":name,"market":market,"mean":mean,
        "p_active":active,"reported_status":status,
        "starter_evidence":starter,
        "cdf_lattice":{"step":1,"cdf":cdf},
        "reach_probabilities":{"whole_projection":target,
            "probability_if_playing":p,"probability_including_dnp":p*active}
    }


def graded(name, target=12, actual=15, played=True, market="points"):
    return {"player_id":name,"market":market,"actual":actual,
            "played":played,"causes":[]}


class AuthenticCardTests(unittest.TestCase):
    def test_rounding_matches_ui(self):
        self.assertEqual(whole(10.59),10)
        self.assertEqual(whole(10.6),11)

    def test_no_bench_high_probability_on_confirmed_starter_card(self):
        g={"rows":[row("bench",p=.98,starter="CONFIRMED_NONSTARTER"),
                   row("starter",p=.75,starter="CONFIRMED_STARTER")]}
        res=select(g,[graded("bench"),graded("starter")])
        self.assertEqual([x["player"] for x in res],["starter"])
        self.assertAlmostEqual(res[0]["p"],.7125)
        self.assertEqual(select(g,[graded("bench"),graded("starter")],require_confirmed=False)[0]["player"],"bench")

    def test_count_dnp_as_missed_positive_projection(self):
        g={"rows":[row("DNP",p=.9)]}
        res=select(g,[graded("DNP",played=False,actual=None)])
        self.assertEqual(res[0]["y"],0)
        self.assertEqual(paired_metrics(res)["hit_rate"],0)

    def test_target_is_model_original_not_lower_bet_line(self):
        g={"rows":[row("one",p=.66,mean=11.9,target=12)]}
        got=select(g,[graded("one",actual=11)])
        self.assertEqual(got[0]["target"],12)
        self.assertEqual(got[0]["y"],0)

    def test_missing_graded_result_fails_closed(self):
        with self.assertRaises(ValueError):
            select({"rows":[row("missing")]},[])

    def test_no_training_from_same_day_or_future_games(self):
        # The predeclared candidate needs >=60 previous graded examples.
        self.assertEqual(calibration_offset([], "points"),0)
        same_day=[{"game_id":"a","day":"2026-11-03","eligible":[
            {"player_id":str(i),"player":str(i),"market":"points","p":.9,
             "p_active":1.0,"y":0} for i in range(4)]}]
        r=score_calibrator(same_day)
        self.assertIn(r["status"],("NO_HOLDOUT_TOP4","RESEARCH_ONLY_DO_NOT_PROMOTE","INSUFFICIENT_SEPARATE_PREGAME_DATES"))
        if "promotion_allowed" in r:
            self.assertIs(r["promotion_allowed"],False)

    def test_market_floor_and_out_player_rejected(self):
        g={"rows":[row("out",status="OUT"),row("below",mean=2.5,target=12)]}
        self.assertEqual(select(g,[graded("out"),graded("below")]),[])


if __name__=="__main__":
    unittest.main()
