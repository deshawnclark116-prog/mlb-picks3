"""Readiness gate is honest about invalid or stale V5 player forecasts."""
import datetime as dt
import unittest

from nba.nba_v5_readiness import check

NOW = dt.datetime(2026,11,6,18,0,tzinfo=dt.timezone.utc)

def sample():
    rows=[]
    for i in ("7","8"):
        for stat in ("points","rebounds","assists","three_pointers_made","steals","blocks","turnovers"):
            rows.append({"player_id":i,"player":"Example","market":stat,
                         "mean_basis":"CONDITIONAL_ON_PLAYING","mean":5.6,
                         "p_active":.9,"reported_status":"ACTIVE",
                         "cdf_lattice":{"cdf":[.1,.2,.3,.4,.5,.6,.7]},
                         "reach_probabilities":{"whole_projection":6,
                                                "probability_including_dnp":.36}})
    return {"model_version":"nba-v5-test",
            "generated_at_utc":"2026-11-06T17:50:00Z",
            "games":[{"game_id":"100","model_version":"nba-v5-test",
                      "tipoff_utc":"2026-11-06T20:00:00Z",
                      "forecast_at_utc":"2026-11-06T17:50:00Z",
                      "rows":rows}]}

class ReadinessTests(unittest.TestCase):
    def test_valid_current_forecast(self):
        r=check(sample(),NOW)
        self.assertTrue(r["all_games_ready"])
        self.assertEqual(r["games"][0]["player_stat_rows"],14)
        self.assertFalse(r["data_quality_caveats"]["optical_tracking_ingested_and_validated"])
    def test_stale_forecast_not_ready(self):
        d=sample();d["generated_at_utc"]="2026-11-06T12:00:00Z"
        self.assertIn("STALE_FORECAST",check(d,NOW)["errors"])
    def test_tipped_game_rejected(self):
        d=sample();d["games"][0]["tipoff_utc"]="2026-11-06T17:00:00Z"
        self.assertIn("GAME_ALREADY_STARTED",check(d,NOW)["games"][0]["errors"])
    def test_out_player_not_accepted(self):
        d=sample();d["games"][0]["rows"][0]["reported_status"]="OUT"
        self.assertIn("OUT_PLAYER_HAS_ACTIVE_FORECAST",check(d,NOW)["games"][0]["errors"])
    def test_nonlinear_cdf_rejected(self):
        d=sample();d["games"][0]["rows"][0]["cdf_lattice"]["cdf"]=[.4,.2]
        self.assertIn("INVALID_FORECAST_DISTRIBUTION",check(d,NOW)["games"][0]["errors"])
    def test_inconsistent_probability_rejected(self):
        d=sample();d["games"][0]["rows"][0]["reach_probabilities"]["probability_including_dnp"]=.72
        self.assertIn("REACH_PROBABILITY_INCONSISTENT",check(d,NOW)["games"][0]["errors"])
    def test_duplicate_market_rejected(self):
        d=sample();d["games"][0]["rows"].append(dict(d["games"][0]["rows"][0]))
        self.assertIn("DUPLICATED_PLAYER_STAT",check(d,NOW)["games"][0]["errors"])
    def test_empty_slate_not_ready(self):
        d=sample();d["games"]=[]
        self.assertFalse(check(d,NOW)["all_games_ready"])
    def test_missing_rows_not_ready(self):
        d=sample();d["games"][0]["rows"]=[]
        self.assertIn("NO_PLAYER_STAT_ROWS",check(d,NOW)["games"][0]["errors"])
if __name__=="__main__": unittest.main()
