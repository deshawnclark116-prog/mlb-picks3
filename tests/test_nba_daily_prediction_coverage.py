"""Fail closed when daily NBA generator did not publish original predictions."""
import copy
import datetime as dt
import unittest
from nba.nba_daily_prediction_coverage import SCHEMA,audit
from tests.test_nba_v2_rolling_predictions import fixture,NOW

def candidate(f):
    g=f["games"][0]
    return {
        "schema":"NBA_V2_2026_27_IMMUTABLE_ROLLING_PLAYER_PREDICTIONS_V1",
        "generated_at_utc":NOW.isoformat(),"research_only":True,
        "official_bets":0,"games_forecast":1,
        "number_of_player_stat_predictions":4,
        "forecasts":[{
            "game_id":g["game_id"],"tipoff_utc":g["tipoff_utc"],
            "no_wagers":True,"player_predictions_count":4,
            "players":[{"player_id":"1001","player":"Sample source player"}]
        }]
    }

class DailyNBAHeartbeat(unittest.TestCase):
    def test_valid_saved_forward_predictions_are_all_accounted(self):
        f=fixture();c=candidate(f)
        report=audit(f,c,set(),NOW+dt.timedelta(minutes=1))
        self.assertEqual(report["schema"],SCHEMA)
        self.assertEqual(report["new_original_forward_games"],1)
        self.assertEqual(report["new_original_player_stat_predictions"],4)
        self.assertTrue(report["all_future_eligible_games_covered"])
        self.assertEqual(report["eligible_future_games_without_original"],[])
        self.assertEqual(report["status"],"ALL_KNOWN_GAMES_ORIGINAL_FORECAST_ACCOUNTED")

    def test_original_existing_game_qualifies_even_when_no_new_model_generated(self):
        f=fixture();c=candidate(f)
        c["games_forecast"]=0;c["number_of_player_stat_predictions"]=0
        c["forecasts"]=[]
        report=audit(f,c,{f["games"][0]["game_id"]},NOW+dt.timedelta(minutes=1))
        self.assertTrue(report["all_future_eligible_games_covered"])
        self.assertEqual(report["previously_saved_forward_games"],1)
        self.assertEqual(report["new_original_forward_games"],0)

    def test_no_daily_saved_prediction_cannot_masquerade_as_successful_cron(self):
        f=fixture();c=candidate(f)
        c["games_forecast"]=0;c["number_of_player_stat_predictions"]=0
        c["forecasts"]=[]
        report=audit(f,c,set(),NOW+dt.timedelta(minutes=1))
        self.assertEqual(report["status"],"FUTURE_ORIGINAL_COVERAGE_FAILURE")
        self.assertFalse(report["all_future_eligible_games_covered"])
        self.assertEqual(report["eligible_future_games_without_original"][0]["game_id"],
                         "401909999")

    def test_cross_midnight_eastern_game_can_be_todays_slate_even_when_utc_is_tomorrow(self):
        # Oct24 9 PM ET is Oct25 01Z; it belongs to the Oct24 betting board.
        captured=dt.datetime(2026,10,24,23,15,tzinfo=dt.timezone.utc)
        f=fixture()
        f["source_captured_at_utc"]=(captured-dt.timedelta(minutes=2)).isoformat()
        f["scoreboard_source_receipts"][0]["retrieved_at_utc"]=f["source_captured_at_utc"]
        g=f["games"][0]
        g["game_id"]="401909860";g["tipoff_utc"]="2026-10-25T01:00:00+00:00"
        c=candidate(f);c["generated_at_utc"]=captured.isoformat()
        event={"game_id":g["game_id"],"start_utc":g["tipoff_utc"],
               "home":g["home"],"away":g["away"]}
        report=audit(f,c,set(),captured+dt.timedelta(seconds=10),[event])
        self.assertEqual(report["eastern_game_date"],"2026-10-24")
        self.assertEqual(report["today_independent_schedule_games"],1)
        self.assertEqual(report["today_games_with_original"],1)

    def test_genuinely_missed_pretip_window_is_reported_not_backfilled(self):
        captured=dt.datetime(2026,10,24,23,15,tzinfo=dt.timezone.utc)
        f=fixture()
        f["source_captured_at_utc"]=(captured-dt.timedelta(minutes=2)).isoformat()
        f["scoreboard_source_receipts"][0]["retrieved_at_utc"]=f["source_captured_at_utc"]
        f["games"][0]["tipoff_utc"]=(captured+dt.timedelta(minutes=14)).isoformat()
        c=candidate(f)
        c["generated_at_utc"]=captured.isoformat()
        c["forecasts"]=[];c["games_forecast"]=0
        c["number_of_player_stat_predictions"]=0
        actual={"game_id":f["games"][0]["game_id"],
                "start_utc":f["games"][0]["tipoff_utc"],
                "home":f["games"][0]["home"],"away":f["games"][0]["away"]}
        report=audit(f,c,set(),captured+dt.timedelta(minutes=1),[actual])
        self.assertTrue(report["all_future_eligible_games_covered"])
        self.assertEqual(len(report["future_games_past_safety_window"]),1)
        self.assertEqual(len(report["today_games_without_original"]),1)
        self.assertEqual(report["status"],"FUTURE_COVERED_BUT_SOME_TODAY_GAMES_MISSED")

    def test_falsified_after_tip_model_original_is_rejected(self):
        f=fixture();c=candidate(f)
        c["forecasts"][0]["tipoff_utc"]=(NOW-dt.timedelta(hours=1)).isoformat()
        with self.assertRaisesRegex(ValueError,"NBA_COVERAGE_NEW_FORECAST_TOO_LATE"):
            audit(f,c,set(),NOW+dt.timedelta(seconds=15))

    def test_old_original_cannot_be_overwritten_by_new_recreated_forecast(self):
        f=fixture();c=candidate(f)
        with self.assertRaisesRegex(ValueError,"NBA_COVERAGE_REPLACED_AN_OLDER"):
            audit(f,c,{f["games"][0]["game_id"]},NOW+dt.timedelta(seconds=15))

if __name__=="__main__":unittest.main()
