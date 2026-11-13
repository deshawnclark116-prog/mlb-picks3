"""The immutable NBA grader must retain source/opportunity facts for future audits."""
import unittest
from unittest.mock import patch
from nba.nba_v5_postmortem import grade_doc,summarize


class GradingPrecisionTest(unittest.TestCase):
    def test_future_grade_preserves_confirmed_role_and_attempts_without_changing_forecast(self):
        r={"player":"Test Shooter","player_id":"p1","market":"three_pointers_made",
           "mean_basis":"CONDITIONAL_ON_PLAYING","reported_status":"AVAILABLE",
           "p_active":.90,"p_start":.95,"mean":1.1,"p10":0.,"p90":3.,
           "minutes_mean":27.,"fga_mean":9.,"fta_mean":1.,
           "three_attempts_mean":3.5,"starter_evidence":"CONFIRMED_STARTER",
           "model_version":"nba-v5-shadow-empirical-game",
           "cdf_lattice":{"step":1,"cdf":[.25,.75,.95,1.0]},
           "reach_probabilities":{"whole_projection":1,
               "probability_if_playing":.75,"probability_including_dnp":.675},
           "role_change":{"status":"NO_STRONG_CHANGE"},
           "archetype":{"role_class":"PERIMETER_SPACER"}}
        d={"games":[{"game_id":"1","away":"Team A","home":"Team B",
           "forecast_at_utc":"2026-11-11T23:00:00Z","rows":[r]}]}
        final={"players":{"p1":{"min":28,"starter":True,"PTS":10,"REB":2,"AST":2,
              "3PM":1,"STL":0,"BLK":0,"TO":0,"PF":2,"FGA":9,"FGM":4,
              "FTA":1,"3PA":4}},"margin":3,"overtime":False}
        with patch("nba.nba_v5_postmortem.get",return_value={}),patch(
            "nba.nba_v5_postmortem.parse_final",return_value=final):
            docs=grade_doc(d,{},"last")
        self.assertEqual(len(docs),1)
        x=docs[0]["rows"][0]
        self.assertEqual(x["starter_evidence"],"CONFIRMED_STARTER")
        self.assertEqual(x["three_attempts_actual"],4)
        self.assertEqual(x["three_attempts_forecast"],3.5)
        self.assertEqual(x["fga_actual"],9)
        self.assertEqual(x["model_version"],"nba-v5-shadow-empirical-game")
        self.assertEqual(x["reach_probabilities"]["probability_including_dnp"],.675)
        self.assertEqual(x["reach_probability"],.75)
        summary=summarize(docs)
        self.assertAlmostEqual(summary["stated_chance_vs_actual"]["frontend_top4"]["mean_stated"],.75)
        self.assertAlmostEqual(summary["stated_unconditional_chance_vs_actual"]["frontend_top4"]["mean_stated"],.675)
        self.assertIn("CONDITIONAL_ON_PLAYING",summary["note"])


if __name__=="__main__":
    unittest.main()
