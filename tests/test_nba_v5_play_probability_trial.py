"""Research P(play) trial: immutable target pool and past-only game joins."""
import datetime as dt
import gzip
import json
import tempfile
import unittest
from pathlib import Path

from nba.nba_v5_play_probability_trial import compare,estimate_unlisted


class CandidatePlayProbabilityTests(unittest.TestCase):
    def test_recent_real_appearances_increase_uncertain_bench_probability(self):
        day=dt.date(2026,11,6)
        hist=[(day-dt.timedelta(days=6-i),str(i),{"100":30.0}) for i in range(6)]
        p,why=estimate_unlisted(.65,hist,"100",day)
        self.assertGreater(p,.96)
        self.assertEqual(why,"RECENCY_SHRUNK_SAME_TEAM_PRIOR_APPEARANCES")

    def test_trade_or_no_current_team_history_keeps_original(self):
        day=dt.date(2026,11,6)
        hist=[(day-dt.timedelta(days=6-i),str(i),{"other":30.0}) for i in range(6)]
        p,why=estimate_unlisted(.72,hist,"100",day)
        self.assertEqual(p,.72)
        self.assertEqual(why,"NO_CURRENT_TEAM_PRIOR_APPEARANCE")

    def test_did_not_play_in_latest_games_reduces_play_chance(self):
        day=dt.date(2026,11,6)
        hist=[(day-dt.timedelta(days=6-i),str(i),
               {"100":30.0} if i<2 else {"other":30.0}) for i in range(6)]
        p,why=estimate_unlisted(.84,hist,"100",day)
        self.assertLess(p,.84)

    def test_same_day_final_cannot_enter_unlisted_estimator(self):
        day=dt.date(2026,11,6)
        hist=[(day-dt.timedelta(days=3-i),str(i),{"100":30.0}) for i in range(3)]
        hist.append((day,"future-final",{"other":40.0}))
        p,_=estimate_unlisted(.6,hist,"100",day)
        earlier,_=estimate_unlisted(.6,hist[:-1],"100",day)
        self.assertEqual(p,earlier)

    def test_full_archive_evaluates_dnp_and_preserves_questionable(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            archives=root/"archive"
            grades=root/"grades"
            archives.mkdir()
            grades.mkdir()
            rows=[
                {"player_id":"100","team_id":"1","market":"points",
                 "p_active":.60,"reported_status":"UNKNOWN_NOT_ACTIVE_CERTIFIED"},
                {"player_id":"200","team_id":"2","market":"points",
                 "p_active":.55,"reported_status":"QUESTIONABLE"},
            ]
            day="2026-11-06T22:00:00+00:00"
            g={"game_id":"123","home_id":"1","away_id":"2",
               "tipoff_utc":"2026-11-07T00:00:00+00:00",
               "forecast_at_utc":day,"rows":rows}
            with gzip.open(archives/"123.json.gz","wt") as f:
                json.dump({"games":[g]},f)
            (grades/"123.json").write_text(json.dumps({
                "kind":"last","game_id":"123","forecast_at_utc":day,
                "rows":[{"player_id":"100","market":"points","played":True},
                        {"player_id":"200","market":"points","played":False}]
            }))
            historical=root/"past.jsonl"
            games=[]
            for idx,dt_ in enumerate(("2026-11-02","2026-11-03","2026-11-04")):
                games.append({"game_id":str(idx),"date":dt_+"T23:00:00+00:00",
                              "home":{"id":"1"},"away":{"id":"2"},
                              "players":[{"id":"100","side":"home","team":"1","min":32},
                                         {"id":"200","side":"away","team":"2","min":32}]})
            historical.write_text("".join(json.dumps(x)+"\n" for x in games))
            score=compare(archives,grades,[historical])
            self.assertEqual(score["original_frozen_players_scored_all_including_DNP"],2)
            self.assertEqual(score["unlisted_status_challenger"]["played"],1)
            self.assertGreater(score["unlisted_status_challenger"]["candidate_mean_P_play"],.6)
            self.assertEqual(score["other_statuses_unchanged"]["incumbent_mean_P_play"],.55)
            self.assertEqual(score["other_statuses_unchanged"]["candidate_mean_P_play"],.55)
            self.assertFalse(score["candidate_promotion_allowed"])


if __name__=="__main__":
    unittest.main()
