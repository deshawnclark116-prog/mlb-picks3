"""Tests for the NBA V5 shadow role detector and honest hit probabilities."""
import datetime as dt
import unittest

import numpy as np

from nba.nba_v5_role_change import detect_role_change
from nba.nba_v5_uncertainty import (
    forecast_uncertainty, minute_variance_fraction, reach_with_dnp,
)


def hist(days=28, *, recent_minutes=20, recent_fga=8, recent_tpa=2,
         recent_ast=2, baseline_minutes=20, baseline_fga=8,
         baseline_tpa=2, baseline_ast=2):
    start = dt.date(2026, 7, 1)
    lines = []
    for i in range(days):
        latest = i >= days - 8
        lines.append({
            "date": start + dt.timedelta(days=i), "min": recent_minutes if latest else baseline_minutes,
            "fga": recent_fga if latest else baseline_fga,
            "tpa": recent_tpa if latest else baseline_tpa,
            "ast": recent_ast if latest else baseline_ast,
            "reb": 4, "tov": 2,
        })
    return lines


class RoleChangeTests(unittest.TestCase):
    def test_stable_opportunity_does_not_create_breakout(self):
        x = detect_role_change(hist(), "2026-08-01")
        self.assertEqual(x["status"], "NO_STRONG_CHANGE")
        self.assertEqual(x["candidate_metrics"], [])
        self.assertTrue(x["shadow_only"])
        self.assertFalse(x["calibrated"])

    def test_clear_minutes_and_opportunity_shift_is_flagged(self):
        x = detect_role_change(hist(recent_minutes=36, recent_fga=20,
                                    recent_tpa=9, recent_ast=7), "2026-08-01")
        self.assertEqual(x["status"], "ROLE_CHANGE_CANDIDATE")
        self.assertTrue(x["signals"]["minutes"]["candidate"])
        self.assertTrue(x["signals"]["fga_per36"]["candidate"])
        self.assertGreater(x["signals"]["fga_per36"]["recent_shrunk"],
                           x["signals"]["fga_per36"]["baseline"])

    def test_more_minutes_at_same_per_minute_rate_is_not_fga_role_change(self):
        x = detect_role_change(hist(recent_minutes=36, recent_fga=18,
                                    baseline_minutes=20, baseline_fga=10), "2026-08-01")
        self.assertFalse(x["signals"]["fga_per36"]["candidate"])
        self.assertTrue(x["signals"]["minutes"]["candidate"])

    def test_same_day_and_future_boxes_are_excluded(self):
        h = hist()
        a = detect_role_change(h, "2026-08-01")
        h += [
            {"date": "2026-08-01", "min": 40, "fga": 500, "tpa": 300, "ast": 400},
            {"date": "2026-08-02", "min": 40, "fga": 500, "tpa": 300, "ast": 400},
        ]
        self.assertEqual(a, detect_role_change(h, "2026-08-01"))

    def test_sparse_history_is_not_overinterpreted(self):
        x = detect_role_change(hist(12), "2026-08-01")
        self.assertEqual(x["status"], "INSUFFICIENT_HISTORY")


class ProbabilityTests(unittest.TestCase):
    def test_conditional_and_all_scenarios_differ(self):
        p = reach_with_dnp(0.6, 0.8, 18)
        self.assertAlmostEqual(p["probability_if_playing"], 0.6)
        self.assertAlmostEqual(p["probability_including_dnp"], 0.48)
        self.assertFalse(p["forward_calibrated"])

    def test_invalid_probability_and_nonpositive_threshold_rejected(self):
        with self.assertRaises(ValueError):
            reach_with_dnp(1.1, .8, 10)
        with self.assertRaises(ValueError):
            reach_with_dnp(.6, .8, 0)

    def test_minutes_explain_part_of_simulated_variation(self):
        y = np.array([10., 10., 10., 10., 10., 10., 20., 20., 20., 20., 20., 20.] * 5)
        m = np.array([20.] * 6 + [35.] * 6) .repeat(5) if False else np.tile([20.] * 6 + [35.] * 6, 5)
        self.assertGreater(minute_variance_fraction(y, m), .8)
        d = forecast_uncertainty(y, m, .9)
        self.assertEqual(d["simulated_games_player_active"], 60)
        self.assertGreater(d["minutes_association_r2"], .8)
        self.assertEqual(d["diagnostic_scope"], "V5_SIM_ONLY_DESCRIPTIVE_NOT_CALIBRATION")

    def test_constant_minutes_explain_nothing(self):
        y = np.arange(80, dtype=float)
        self.assertEqual(minute_variance_fraction(y, np.full(80, 30.0)), 0.0)


if __name__ == "__main__":
    unittest.main()
