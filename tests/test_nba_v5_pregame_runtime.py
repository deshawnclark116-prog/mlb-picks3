"""Core V5 still runs >=10,000 worlds, with optional analysis off hot path."""
import unittest
from unittest.mock import patch

from nba.nba_v5_forecast import optional_dependency_sensitivity, MIN_PRODUCTION_SIMS


class FastPregameRuntimeTests(unittest.TestCase):
    def test_main_simulation_floor_is_10000(self):
        self.assertGreaterEqual(MIN_PRODUCTION_SIMS,10000)

    def test_default_skips_six_extra_what_if_simulations(self):
        with patch("nba.nba_v5_forecast.team_sensitivity") as rerun:
            result=optional_dependency_sensitivity(False,None,None,None,None,
                                                    None,{},10000,None,55)
        self.assertEqual(result,{})
        rerun.assert_not_called()

    def test_explicit_research_reruns_are_still_supported(self):
        with patch("nba.nba_v5_forecast.team_sensitivity") as rerun:
            rerun.side_effect=[{("1","points"):[{"if_out":"2"}]},
                               {("3","assists"):[{"if_out":"4"}]}]
            result=optional_dependency_sensitivity(True,"H","A","L","T",
                                                    "C",{},10000,100,55)
        self.assertEqual(rerun.call_count,2)
        self.assertEqual({call.args[9] for call in rerun.call_args_list},
                         {"home","away"})
        self.assertEqual(len(result),2)


if __name__=="__main__":
    unittest.main()
