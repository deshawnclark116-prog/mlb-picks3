"""NBA V5: leak-safe player archetype and non-causal variance decomposition."""
import datetime as dt
import unittest

import numpy as np

from nba.nba_v5_archetypes import player_archetype
from nba.nba_v5_uncertainty import forecast_uncertainty,minute_variance_components
from nba.nba_v5_postmortem import summarize


def player_history(style, count=16):
    rows=[]
    for i in range(count):
        fga,tpa,ast,reb,fta,tov=style
        rows.append({"date":dt.date(2026,3,1)+dt.timedelta(days=i),
                    "min":36.0, "fga":fga, "tpa":tpa,"ast":ast,"reb":reb,
                    "fta":fta,"tov":tov})
    return rows


class OpportunityArchetypeContracts(unittest.TestCase):
    def test_player_roles_are_built_only_from_prior_games(self):
        d="2026-03-20"
        cases=[
          ((19,5,7,4,6,3),"HIGH_USAGE_CREATOR"),
          ((20,5,2,4,6,3),"VOLUME_SCORER"),
          ((9,2,9,4,3,3),"PRIMARY_FACILITATOR"),
          ((10,2,1,12,3,2),"INTERIOR_REBOUNDER"),
          ((10,7,2,3,1,1),"PERIMETER_SPACER"),
          ((11,1,2,4,7,2),"RIM_PRESSURE_SCORER"),
          ((8,3,4,8,3,1),"CONNECTOR_REBOUNDER"),
          ((8,3,2,4,2,1),"BALANCED_OR_LOW_USAGE")
        ]
        for style,expected in cases:
            h=player_history(style)
            a=player_archetype(h,d)
            self.assertEqual(a["role_class"],expected)
            h+=player_history((0,0,0,0,0,0),count=1)
            h[-1]["date"]=dt.date(2026,3,20)
            self.assertEqual(a,player_archetype(h,d))
            self.assertEqual(a["model_effect"],"SHADOW_ONLY")
            self.assertTrue(a["not_tracked_play_type"])

    def test_scarce_history_is_not_a_fabricated_archetype(self):
        a=player_archetype(player_history((18,10,9,2,3,4),count=3),"2026-03-20")
        self.assertEqual(a["role_class"],"INSUFFICIENT_HISTORY")
        self.assertEqual(a["role_confidence"],"LOW")


class VarianceDecompositionContracts(unittest.TestCase):
    def test_minutes_and_availability_exactly_conserve_stat_variance(self):
        x=np.tile([10.0]*25+[20.0]*25,10)
        m=np.tile([20.0]*25+[35.0]*25,10)
        a=minute_variance_components(x,m)
        self.assertAlmostEqual(a["active_conditional_variance"],25)
        self.assertAlmostEqual(a["minutes_between_bin_variance"],25)
        self.assertAlmostEqual(a["minutes_within_bin_variance"],0)
        d=forecast_uncertainty(x,m,.75)
        v=d["unconditional_zero_if_DNP_mixture"]
        self.assertAlmostEqual(v["expected_stat"],11.25)
        self.assertAlmostEqual(v["variance_availability"],.75*.25*225)
        self.assertAlmostEqual(v["variance_conditional_playing"],.75*25)
        self.assertAlmostEqual(v["variance_total"],v["variance_availability"]+v["variance_conditional_playing"])
        self.assertAlmostEqual(v["variance_conditional_playing"],v["variance_minutes_bin_between"]+v["variance_minutes_bin_within"])
        self.assertEqual(d["diagnostic_scope"],"V5_SIM_ONLY_DESCRIPTIVE_NOT_CALIBRATION")
        self.assertEqual(v["scope"],"V5_SIM_UNCONDITIONAL_MOMENTS_NO_CAUSAL_DECOMPOSITION")

    def test_constant_minutes_only_leave_within_minute_variance(self):
        x=np.tile([0.0,1.0,2.0,3.0],40)
        m=np.full(len(x),30)
        d=minute_variance_components(x,m)
        self.assertEqual(d["minutes_between_bin_variance"],0)
        self.assertAlmostEqual(d["minutes_within_bin_variance"],np.var(x))
        self.assertFalse(d["diagnostic_valid"])

    def test_no_variation_and_bad_sample_fail_safely(self):
        d=minute_variance_components(np.ones(60),np.arange(60))
        self.assertAlmostEqual(d["active_conditional_variance"],0)
        with self.assertRaises(ValueError):
            minute_variance_components([1,2],[1])
        with self.assertRaises(ValueError):
            minute_variance_components([1,float("nan")],[1,2])


class FullForecastCohortTests(unittest.TestCase):
    def test_nonfeatured_dnp_still_in_unconditional_role_and_minutes_cohorts(self):
        a={"player_id":"p1","player":"X","market":"points",
           "played":False,"actual":None,"causes":[],
           "p_active":.65,"minutes_forecast":33,"archetype":{"role_class":"HIGH_USAGE_CREATOR"},
           "role_change":{"status":"NO_STRONG_CHANGE"},
           "reach_probabilities":{"whole_projection":20,"probability_including_dnp":.45}}
        b={"player_id":"p2","player":"Y","market":"points",
           "played":True,"actual":12,"projection":10,"p10":6,"p90":15,
           "whole_projection":10,"reach_probability":.75,
           "minutes_forecast":18,"causes":[],
           "p_active":.98,"archetype":{"role_class":"PERIMETER_SPACER"},
           "role_change":{"status":"INSUFFICIENT_HISTORY"},
           "reach_probabilities":{"whole_projection":10,"probability_including_dnp":.735}}
        records=[{"game_id":"gid","source_checks":[],"rows":[a,b]}]
        s=summarize(records)
        by=s["stated_unconditional_chance_vs_actual"]
        self.assertEqual(by["all_original_projections"]["n"],2)
        self.assertEqual(by["archetype_HIGH_USAGE_CREATOR"]["n"],1)
        self.assertEqual(by["archetype_PERIMETER_SPACER"]["n"],1)
        self.assertEqual(by["opportunity_minutes_28_PLUS"]["n"],1)
        self.assertEqual(by["participation_band_MEDIUM"]["actual_reach_rate"],0)
        self.assertEqual(s["mean_abs_error_by_archetype"]["points|PERIMETER_SPACER"]["n"],1)
        self.assertEqual(s["mean_abs_error"]["points"],2)


if __name__=="__main__":
    unittest.main()
