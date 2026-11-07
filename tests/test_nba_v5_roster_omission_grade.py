"""The postgame scorer finds absent players without changing pretip probability."""
import unittest
from nba.nba_v5_roster_omission_grade import grade_omissions, exclusion_cause


class OmissionGradeTests(unittest.TestCase):
    def test_reports_every_missing_played_starter_and_minute(self):
        box={"game_id":"12","players":[
            {"id":"a","name":"Starter A","team":"1","side":"home","min":34,"start":True},
            {"id":"b","name":"Starter B","team":"1","side":"home","min":31,"start":True},
            {"id":"c","name":"Bench C","team":"2","side":"away","min":12,"start":False},
            {"id":"d","name":"DNP","team":"2","side":"away","min":0,"start":False}]}
        grade={"game_id":"12","away":"Away","home":"Home","forecast_at_utc":"2026-11-01T20:00:00Z",
               "rows":[{"player_id":"a","market":"points"},{"player_id":"a","market":"rebounds"}]}
        result=grade_omissions(box,grade)
        self.assertEqual(result["played_players_missing_from_v5"],2)
        self.assertEqual(result["played_minutes_missing_from_v5"],43)
        self.assertEqual(result["omitted_played_starters"],1)
        self.assertEqual(result["missing_minutes_by_side"],{"home":31.0,"away":12.0})
        self.assertEqual([p["player"] for p in result["missing_players"]],["Bench C","Starter B"])
        self.assertTrue(result["report_is_postgame_diagnostic_only"])

    def test_omission_reasons_from_frozen_forecast_only(self):
        snapshot={"games":[{"game_id":"12","rows":[
            {"player_id":"a","market":"points","reported_status":"OUT",
             "p_active":0.0,"model_version":"nba-v3-stale"},
            {"player_id":"b","market":"points","reported_status":"QUESTIONABLE",
             "p_active":0.1,"model_version":"nba-v3-stale"},
            {"player_id":"c","market":"points","reported_status":"AVAILABLE",
             "p_active":0.92,"model_version":"nba-v3-stale"},
            {"player_id":"d","market":"points","reported_status":"AVAILABLE",
             "p_active":0.99,"model_version":"nba-v5-simulation",
             "mean_basis":"CONDITIONAL_ON_PLAYING"}
        ]}]}
        self.assertEqual(exclusion_cause(snapshot,"not-in-roster")["cause"],
                         "ABSENT_FROM_FROZEN_V5_INPUT")
        self.assertEqual(exclusion_cause(snapshot,"a")["cause"],
                         "PRESENT_BUT_EXCLUDED_AS_OUT")
        self.assertEqual(exclusion_cause(snapshot,"b")["cause"],
                         "PRESENT_BUT_LOW_ACTIVE_PROBABILITY")
        self.assertEqual(exclusion_cause(snapshot,"c")["cause"],
                         "PRESENT_BUT_NOT_SIMULATED_OTHER_REASON")
        self.assertEqual(exclusion_cause(snapshot,"d")["cause"],
                         "SIMULATED_BUT_NOT_IN_GRADED_OUTPUT")

    def test_game_mismatch_does_not_join_wrong_box(self):
        with self.assertRaisesRegex(ValueError,"game_id mismatch"):
            grade_omissions({"game_id":"A"},{"game_id":"B"})

    def test_requires_real_played_player_box(self):
        with self.assertRaisesRegex(ValueError,"no played-player"):
            grade_omissions({"game_id":"A","players":[]},
                            {"game_id":"A","away":"A","home":"B","rows":[]})

if __name__=="__main__":
    unittest.main()
