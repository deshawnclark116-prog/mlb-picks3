"""The confidence percentage refers to closeness to OWN model projection."""
import copy
import datetime as dt
import unittest
from unittest.mock import patch
import numpy as np

from nba.nba_independent_projection_confidence import (
    SCHEMA, WINDOWS, PREDICTED_MEAN_BINS,
    confidence_from_calibration, mean_bin
)
from nba.nba_independent_live_shadow import generate_shadow
from test_nba_independent_live_shadow import games, roster


def calibration():
    return {
        "schema": SCHEMA,
        "model_head": "nba-independent-direct-prior-date-head-v1",
        "trained_through": "2025-12-31",
        "validation_from": "2026-01-01",
        "validation_through": "2026-02-14",
        "fixed_error_window": WINDOWS,
        "prediction_bin_boundaries": {
            market:list(edges) for market,edges in PREDICTED_MEAN_BINS.items()
        },
        "conditional_on_actually_playing":True,
        "not_an_over_under_probability":True,
        "prospectively_calibrated_2026_27":False,
        "eligible_for_official_bets":False,
        "markets": {market:{
            "validation_player_games":800,
            "confidence_by_projected_mean_bin":{
                str(i):{"n":200,"within_window_count":80+i*20,
                    "conditional_accuracy_estimate":.4+i*.10}
                for i in range(4)
            }
        } for market in WINDOWS}
    }


class ProjectionPercentIsAccuracyNotTarget(unittest.TestCase):
    def test_probability_is_of_closeness_to_own_projection(self):
        doc=calibration()
        a=confidence_from_calibration(doc,"points",24.1)
        b=confidence_from_calibration(doc,"points",9.9)
        self.assertEqual(a["probability_within_window_if_plays"],.6)
        self.assertEqual(a["window_plus_or_minus"],5.0)
        self.assertEqual(a["historical_validation_n_in_bin"],200)
        self.assertTrue(a["not_over_under_probability"])
        self.assertFalse(a["current_season_calibration_verified"])
        self.assertEqual(b["probability_within_window_if_plays"],.4)
        self.assertEqual(mean_bin("assists",7.5),3)

    def test_refuses_fake_betting_certification_or_changed_error_window(self):
        source=calibration()
        changed=copy.deepcopy(source)
        changed["prospectively_calibrated_2026_27"]=True
        with self.assertRaisesRegex(ValueError,"INVALID_ACCURACY_CALIBRATION"):
            confidence_from_calibration(changed,"points",24.1)
        changed=copy.deepcopy(source)
        changed["fixed_error_window"]["points"]=100
        with self.assertRaisesRegex(ValueError,"INVALID_ACCURACY_CALIBRATION"):
            confidence_from_calibration(changed,"points",24.1)
        changed=copy.deepcopy(source)
        changed["markets"]["points"]["confidence_by_projected_mean_bin"]["2"]["n"]=2
        with self.assertRaisesRegex(ValueError,"UNSUPPORTED_ACCURACY_PERCENT"):
            confidence_from_calibration(changed,"points",24.1)

    def test_genuine_direct_head_predictions_receive_matching_probability_not_v5(self):
        class Dummy:
            def __init__(self,value):
                self.value=value
            def predict(self,X):
                return np.array([self.value]*len(X))
        by_market={"points":24.1,"rebounds":6.1,"assists":5.1,
                   "three_pointers_made":1.8}
        source=roster()
        now=dt.datetime(2026,11,20,23,0,tzinfo=dt.timezone.utc)
        models={m:Dummy(by_market[m]) for m in WINDOWS}
        counts={m:{"training_player_games":1000} for m in WINDOWS}
        with patch("nba.nba_independent_live_shadow.train_direct_models",
                   return_value=(models,counts)):
            doc=generate_shadow(source,games(),now,
                history_sha="a"*64,v3_sha="b"*64,
                confidence_calibration=calibration())
        self.assertEqual(doc["rows_forecast"],48)
        self.assertEqual(doc["projection_accuracy_confidence_source"],SCHEMA)
        self.assertTrue(doc["projection_accuracy_not_a_bookmaker_hit_probability"])
        self.assertFalse(doc["projection_accuracy_forward_2026_27_calibrated"])
        for p in doc["games"][0]["players"]:
            for m,number in p["predictions"].items():
                self.assertEqual(number,by_market[m])
                c=p["projection_accuracy_confidence"][m]
                self.assertIsNotNone(c["probability_within_window_if_plays"])
                self.assertEqual(c["metric"],
                    "PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION")
                self.assertTrue(c["not_over_under_probability"])


if __name__=="__main__":
    unittest.main()
