"""Regressions for V5's frozen simulation-only projection arm.

The production blend remains the champion; the new shadow must keep its
own rounded player targets/CDF and must not mutate a champion input row.
"""
from __future__ import annotations
import copy
import math
import unittest
from pathlib import Path

from nba.nba_v5_forecast import (
    MIN_PRODUCTION_SIMS, SIMULATION_ONLY_VERSION,
    finalize_unblended_research_rows,
)


def make_row(name, pid, mean, cdf, p_active=0.95, market="three_pointers_made"):
    return {
        "game_id": "test-game",
        "team_id": "test-team", "player_id": pid, "player": name,
        "market": market, "mean": mean,
        "p_active": p_active, "reported_status": "ACTIVE",
        "model_version": "nba-v5-blend-possession-simulation-20261106",
        "mean_basis": "CONDITIONAL_ON_PLAYING",
        "cdf_lattice": {"step": 1, "cdf": list(cdf)},
        # Regression: preexisting old rank or stale mixture must be purged.
        "frontend_rank": 99, "whole_projection": 99,
        "blend": {"v5_simulation_mean": -100, "v4_model_mean": 100},
    }


class UnblendedV5ResearchTests(unittest.TestCase):
    def test_same_rounded_targets_without_v4_and_original_unchanged(self):
        champion = [
            make_row("Player A", "1", 1.59, [.15, .89, 1.0]),
            make_row("Player B", "2", 1.60, [.25, .80, 1.0]),
        ]
        unchanged = copy.deepcopy(champion)
        research = finalize_unblended_research_rows(copy.deepcopy(champion))
        self.assertEqual(champion, unchanged)
        mapping = {r["player"]: r for r in research}
        self.assertEqual(mapping["Player A"]["whole_projection"], 1)
        self.assertEqual(mapping["Player B"]["whole_projection"], 2)
        self.assertEqual(mapping["Player A"]["frontend_rank"], 1)
        self.assertEqual(mapping["Player B"]["frontend_rank"], 2)
        self.assertEqual(mapping["Player A"]["model_version"], SIMULATION_ONLY_VERSION)
        self.assertEqual(mapping["Player B"]["model_version"], SIMULATION_ONLY_VERSION)
        for row in research:
            self.assertNotIn("blend", row)
        a = mapping["Player A"]["reach_probabilities"]
        b = mapping["Player B"]["reach_probabilities"]
        self.assertAlmostEqual(a["probability_including_dnp"], 0.85*0.95, places=4)
        self.assertAlmostEqual(b["probability_including_dnp"], 0.20*0.95, places=4)

    def test_inactive_cannot_be_featured(self):
        r = make_row("Excluded Player", "3", 1.90, [.05,.30,1], p_active=0.0)
        r["reported_status"] = "OUT"
        research = finalize_unblended_research_rows([r])
        self.assertNotIn("frontend_rank", research[0])
        self.assertNotIn("blend", research[0])

    def test_production_sim_floor_and_workflow_hook(self):
        self.assertGreaterEqual(MIN_PRODUCTION_SIMS, 10_000)
        wf = Path(".github/workflows/nba_v3_latest_refresh.yml").read_text()
        self.assertIn("--sims 10000", wf)
        self.assertIn("--simulation-only-out docs/nba_v5_independent_latest/latest.json", wf)
        self.assertIn("--simulation-only-archive docs/nba_v5_independent_archive", wf)
        # The existing published champion is NOT changed by this addition.
        self.assertIn("--out docs/nba_v5_latest/latest.json", wf)
        self.assertIn("--v4 docs/nba_v4_latest/latest.json", wf)


if __name__ == "__main__":
    unittest.main()
