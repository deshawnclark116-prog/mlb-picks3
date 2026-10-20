"""Adversarial grading on the ACTUAL saved 14 NBA team/225 player first-seen forecasts."""
import copy,datetime as dt,json,unittest
from pathlib import Path
from nba import nba_v2_original_opening_grade as G

TEAM=json.loads(Path("docs/nba_v1_opening_week_research.json").read_text())
PLAYER=json.loads(Path("docs/nba_v2_opening_player_firstseen.json").read_text())
NOW=dt.datetime(2026,10,21,12,tzinfo=dt.timezone.utc)

def synthetic_final():
    row=PLAYER["forecasts"][0]
    team=next(x for x in TEAM["forecasts"] if x["game_id"]==row["game_id"])
    g={"game_id":row["game_id"],"home_id":row["home_id"],"away_id":row["away_id"],
        "start_utc":row["tipoff_utc"],"completed":True,
        "home_points":122,"away_points":113}
    selected=[]
    for tid in (row["home_id"],row["away_id"]):
        selected.extend(p for p in row["players"] if p["team_id"]==tid)
    first=[]
    for tid in (row["home_id"],row["away_id"]):
        first.extend([p for p in selected if p["team_id"]==tid][:5])
    assert len(first)==10, "Original source requires 5 verified team players each"
    boxes=[{"player_id":p["player_id"],"team_id":p["team_id"],"player":p["player"],
            "minutes":25.0,"points":20,"rebounds":7,"assists":4,
            "three_pointers_made":2} for p in first]
    proof={"boxscore_by_game":{row["game_id"]:{
        "actual_source":"ESPN_FINAL_TWO_TEAM_PLAYER_BOX",
        "played_players":10,"source_sha256":"a"*64,
        "retrieved_at_utc":"2026-10-21T12:00:00Z"}},
        "boxscore_errors":{}}
    return {g["game_id"]:g},{g["game_id"]:boxes},proof

class NBAOriginalFullGrading(unittest.TestCase):
    def test_real_firstseen_file_has_all_14_team_225_player_originals(self):
        games=G.valid_originals(TEAM,PLAYER)
        self.assertEqual(len(games),14)
        self.assertEqual(PLAYER["number_of_player_stat_predictions"],900)
        self.assertEqual(sum(len(g["players"]) for g in PLAYER["forecasts"]),225)

    def test_every_original_stat_and_played_probability_accounted(self):
        schedule,boxes,truth=synthetic_final()
        d=G.grade_originals(TEAM,PLAYER,schedule,boxes,truth,NOW)
        self.assertEqual(d["team_originals"],14)
        self.assertEqual(d["team_originals_graded"],1)
        self.assertEqual(d["original_player_predictions"],225)
        self.assertEqual(d["original_player_stat_forecasts"],900)
        self.assertEqual(d["player_originals_accounted"],225)
        self.assertEqual(d["player_status_verified"],len(PLAYER["forecasts"][0]["players"]))
        self.assertEqual(d["player_status_unverified"],225-len(PLAYER["forecasts"][0]["players"]))
        for market in G.STATS:
            self.assertEqual(d["player_conditional_stat_mae"][market]["n"],10)
        final_rows=[r for r in d["player_forecast_rows"] if r["game_id"]==PLAYER["forecasts"][0]["game_id"]]
        self.assertEqual(len(final_rows),22)
        self.assertEqual(sum(r["status"]=="VERIFIED_PLAYED" for r in final_rows),10)
        self.assertEqual(sum(r["status"]=="VERIFIED_DID_NOT_PLAY" for r in final_rows),12)
        for r in final_rows:
            self.assertIsNotNone(r["playing_probability_brier"])
            if r["status"]=="VERIFIED_DID_NOT_PLAY":
                self.assertEqual(r["actual_minutes"],0)
                self.assertIsNone(r["stats"]["points"]["actual_if_played"])
                self.assertIsNone(r["stats"]["points"]["abs_error"])
                self.assertEqual(r["stats"]["points"]["status"],
                    "NOT_PLAYED_CONDITIONAL_PREDICTION_NOT_APPLICABLE")
        self.assertEqual(d["official_bets"],0)
        self.assertIsNone(d["bookmaker_win_loss_record"])

    def test_no_final_event_keeps_originals_unresolved_not_silent_zero(self):
        d=G.grade_originals(TEAM,PLAYER,{}, {},{},NOW)
        self.assertEqual(d["team_originals_graded"],0)
        self.assertEqual(d["player_status_verified"],0)
        self.assertEqual(d["player_status_unverified"],225)
        self.assertTrue(all(r["status"]=="NO_FINAL_OR_UNVERIFIED_PLAYER_BOX"
            for r in d["player_forecast_rows"]))
        self.assertTrue(all(r["stats"]["points"]["actual_if_played"] is None
            for r in d["player_forecast_rows"]))

    def test_complete_game_without_complete_player_box_cannot_grade_playing(self):
        schedule,boxes,truth=synthetic_final()
        boxes={}
        d=G.grade_originals(TEAM,PLAYER,schedule,boxes,truth,NOW)
        self.assertEqual(d["team_originals_graded"],1)
        self.assertEqual(d["player_status_verified"],0)
        self.assertTrue(all(r["stats"]["points"]["actual_if_played"] is None
            for r in d["player_forecast_rows"]))

    def test_incomplete_final_box_never_marks_absent_players_dnp(self):
        schedule,boxes,truth=synthetic_final()
        gid=PLAYER["forecasts"][0]["game_id"]
        boxes[gid]=boxes[gid][:4]
        truth["boxscore_by_game"][gid]["played_players"]=4
        with self.assertRaisesRegex(ValueError,"COMPLETE_TWO_TEAM"):
            G.grade_originals(TEAM,PLAYER,schedule,boxes,truth,NOW)

    def test_original_firstseen_timestamp_must_be_prior_to_tipoff(self):
        forged=copy.deepcopy(PLAYER)
        forged["generated_at_utc"]=forged["forecasts"][0]["tipoff_utc"]
        with self.assertRaisesRegex(ValueError,"POST_TIP"):
            G.valid_originals(TEAM,forged)
        bad=copy.deepcopy(PLAYER)
        bad["forecasts"][0]["players"][0]["official_pick"]=True
        with self.assertRaisesRegex(ValueError,"UNTRUSTWORTHY"):
            G.valid_originals(TEAM,bad)

    def test_final_truth_must_match_same_game_and_teams(self):
        schedule,boxes,truth=synthetic_final()
        gid=PLAYER["forecasts"][0]["game_id"]
        schedule[gid]["away_id"]="99"
        with self.assertRaisesRegex(ValueError,"SCHEDULE_TEAM_CONFLICT"):
            G.grade_originals(TEAM,PLAYER,schedule,boxes,truth,NOW)

    def test_reject_final_record_that_would_be_future_hindsight(self):
        schedule,boxes,truth=synthetic_final()
        too_early=dt.datetime(2026,10,20,13,tzinfo=dt.timezone.utc)
        with self.assertRaisesRegex(ValueError,"FUTURE_FINAL"):
            G.grade_originals(TEAM,PLAYER,schedule,boxes,truth,too_early)

    def test_actual_stat_errors_independent_from_original_model_prediction(self):
        schedule,boxes,truth=synthetic_final()
        gid=PLAYER["forecasts"][0]["game_id"]
        original=PLAYER["forecasts"][0]["players"][0]
        played=next(p for p in boxes[gid] if p["player_id"]==original["player_id"])
        scored=G.grade_originals(TEAM,PLAYER,schedule,boxes,truth,NOW)
        scored_row=next(r for r in scored["player_forecast_rows"]
              if r["forecast_id"]==original["forecast_id"])
        self.assertEqual(scored_row["stats"]["points"]["pred_if_played"],original["predictions"]["points"])
        self.assertEqual(scored_row["stats"]["points"]["actual_if_played"],played["points"])
        self.assertAlmostEqual(scored_row["stats"]["points"]["abs_error"],
            abs(original["predictions"]["points"]-played["points"]),4)
        self.assertTrue(scored["originals_immutable_and_all_accounted"])

if __name__=="__main__":
    unittest.main()
