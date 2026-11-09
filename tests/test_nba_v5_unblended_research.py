"""Acceptance tests: V5 publishes its own simulation, never V4 forecasts.

The rank and target definitions are the model's original 0.6-up rule.
Historical accuracy must be scored separately; no claimed accuracy lift here.
"""
from __future__ import annotations

import copy
import inspect
from pathlib import Path
import unittest

from nba import nba_v5_forecast
from nba.nba_v5_rank import rank_for_screen, whole
from nba.nba_v5_uncertainty import reach_with_dnp

def native_row(name, pid, mean, cdf, p_active=.95, market="three_pointers_made"):
    return {
        "player_id": str(pid), "player": name, "market": market, "mean": mean,
        "p_active": p_active, "reported_status": "AVAILABLE",
        "model_version": nba_v5_forecast.VERSION,
        "mean_basis": "CONDITIONAL_ON_PLAYING",
        "cdf_lattice": {"step": 1, "cdf": list(cdf)},
    }

class NativeV5Acceptance(unittest.TestCase):
    def test_core_stat_rounding_and_native_cdf(self):
        rows = [
            native_row("Native A", "1", 1.59, [.15, .89, 1]),
            native_row("Native B", "2", 1.60, [.25, .80, 1]),
        ]
        original = copy.deepcopy(rows)
        rank_for_screen(rows)
        a, b = rows
        self.assertEqual(whole(a["mean"]), 1)
        self.assertEqual(whole(b["mean"]), 2)
        self.assertEqual(a["whole_projection"], 1)
        self.assertEqual(b["whole_projection"], 2)
        self.assertEqual(a["frontend_rank"], 1)
        self.assertEqual(b["frontend_rank"], 2)
        self.assertEqual(a["reach_probability"], .85)
        self.assertEqual(b["reach_probability"], .20)
        self.assertNotIn("blend", a)
        self.assertNotIn("blend", b)
        dnp = reach_with_dnp(.85,.95,1)
        self.assertAlmostEqual(dnp["probability_including_dnp"], .8075, places=4)
        self.assertEqual(original[0]["mean"], rows[0]["mean"])
        self.assertEqual(original[1]["cdf_lattice"], rows[1]["cdf_lattice"])

    def test_no_out_or_low_probability_player_featured(self):
        out = native_row("Out", "3", 1.9, [.05,.30,1], p_active=0.0)
        out["reported_status"] = "OUT"
        rank_for_screen([out])
        self.assertNotIn("frontend_rank",out)

    def test_live_forecast_code_rejects_prior_version_forecast_input(self):
        src = inspect.getsource(nba_v5_forecast.main)
        self.assertNotIn("blend_rows(", src)
        self.assertNotIn("v4rows",src)
        self.assertNotIn("a.v4",src)
        self.assertNotIn("simulation_only_out",src)
        self.assertIn("rank_for_screen(new_rows)",src)
        self.assertIn("uses_v4_forecast_predictions",src)
        self.assertIn("uses_v3_derived_roster_availability",src)
        self.assertGreaterEqual(nba_v5_forecast.MIN_PRODUCTION_SIMS,10000)
        self.assertIn("nba-v5-native-",nba_v5_forecast.VERSION)

    def test_original_10000_sim_production_workflow_does_not_supply_v4(self):
        wf = Path(".github/workflows/nba_v3_latest_refresh.yml").read_text()
        self.assertIn("--sims 10000", wf)
        self.assertIn("--out docs/nba_v5_latest/latest.json", wf)
        self.assertNotIn("--v4 docs/nba_v4_latest/latest.json", wf)
        self.assertNotIn("--simulation-only-out",wf)
        self.assertNotIn("--simulation-only-archive",wf)
        self.assertIn("--archive docs/nba_v5_archive",wf)
        # V4 remains generated independently for future same-slate benchmarks.
        self.assertIn("python -u -m nba.nba_v4_forecast",wf)

if __name__=="__main__":
    unittest.main()
