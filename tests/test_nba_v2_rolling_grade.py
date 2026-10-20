"""All-forecast NBA V2 live grade: exact pretip row vs actual, no DNP zero bets."""
import copy
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from nba import nba_v2_rolling_grade as G
from nba import nba_v2_rolling_predictions as P
from tests.test_nba_v2_rolling_predictions import (
    NOW,fixture,verified_history,source_rosters
)

def original():
    games,boxes=verified_history()
    roster,receipt=source_rosters()
    d=P.forecast_roll(fixture(),{"forecasts":[]},set(),
                      roster,receipt,games,boxes,NOW)
    assert d["games_forecast"]==1
    return d

def final(actuals=True):
    d=original();game=d["forecasts"][0]
    fixture={"game_id":game["game_id"],"home_id":game["home_id"],
         "away_id":game["away_id"],"start_utc":game["tipoff_utc"],
         "completed":True,"home_points":116,"away_points":102}
    box=[]
    # The originally forecast player for home team appears, away team missing
    # while other real played athletes prove the whole game box is complete.
    home=next(x for x in game["players"] if x["team_id"]==game["home_id"])
    for t in (game["home_id"],game["away_id"]):
        for j in range(5):
            box.append({"team_id":t,"player_id":home["player_id"] if
                t==game["home_id"] and j==0 else str(8000+int(t)*100+j),
                "player":"Real player",
                "minutes":24.0,"points":22,"rebounds":7,"assists":6,
                "three_pointers_made":2})
    receipt={"boxes":{game["game_id"]:{
        "actual_source":"ESPN_FINAL_BOTH_TEAM_PLAYER_STATS",
        "played_players":len(box),"sha256":"a"*64}},"errors":{}}
    return d,{game["game_id"]:fixture},\
           {game["game_id"]:box} if actuals else {},receipt

class CompleteRollingGrade(unittest.TestCase):
    def test_every_original_four_market_stat_is_verified_or_dnp(self):
        doc,finals,boxes,proof=final()
        inputs={g["game_id"]:{**g,
            "first_seen_at_utc":doc["generated_at_utc"],
            "model_version":doc["model_version"]} for g in doc["forecasts"]}
        now=dt.datetime(2026,10,23,tzinfo=dt.timezone.utc)
        result=G.grade_originals(inputs,finals,boxes,proof,now)
        self.assertEqual(result["original_rolling_games"],1)
        self.assertEqual(result["original_player_forecasts"],2)
        self.assertEqual(result["all_original_four_market_stat_forecasts_accounted"],8)
        self.assertEqual(result["verified_played_stat_outcomes"],4)
        self.assertEqual(result["verified_DNP_conditional_stats_not_applicable"],4)
        self.assertEqual(result["unverified_conditional_stats"],0)
        self.assertEqual(result["player_status_verified"],2)
        self.assertEqual(result["official_bets"],0)
        self.assertEqual(result["conditional_stat_mae"]["points"]["n"],1)
        self.assertTrue(result["played_vs_DNP_never_fabricated"])
        for player in result["player_rows"]:
            self.assertIsNotNone(player["playing_brier"])
            if player["status"]=="VERIFIED_DID_NOT_PLAY":
                self.assertIsNone(player["stats"]["points"]["verified_actual_if_played"])
                self.assertIsNone(player["stats"]["points"]["abs_error"])
                self.assertEqual(player["actual_minutes"],0)

    def test_not_final_or_no_verified_box_keeps_every_original_unresolved(self):
        doc,finals,boxes,proof=final(False)
        inputs={g["game_id"]:{**g,"first_seen_at_utc":doc["generated_at_utc"],
                     "model_version":doc["model_version"]} for g in doc["forecasts"]}
        d=G.grade_originals(inputs,finals,{},proof,
                 dt.datetime(2026,10,23,tzinfo=dt.timezone.utc))
        self.assertEqual(d["player_status_verified"],0)
        self.assertEqual(d["unverified_conditional_stats"],8)
        self.assertTrue(all(p["actual_minutes"] is None for p in d["player_rows"]))
        d=G.grade_originals(inputs,{}, {},{},
                 dt.datetime(2026,10,21,tzinfo=dt.timezone.utc))
        self.assertEqual(d["verified_played_stat_outcomes"],0)
        self.assertEqual(d["player_status_unverified"],2)

    def test_invalid_truth_and_posttip_original_are_quarantined(self):
        doc,finals,boxes,proof=final()
        g=doc["forecasts"][0]
        inputs={g["game_id"]:{**g,"first_seen_at_utc":doc["generated_at_utc"],
                    "model_version":doc["model_version"]}}
        proof["boxes"][g["game_id"]]["played_players"]=3
        with self.assertRaisesRegex(ValueError,"UNVERIFIED_2_TEAM"):
            G.grade_originals(inputs,finals,boxes,proof,
                              dt.datetime(2026,10,23,tzinfo=dt.timezone.utc))
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/"2026-10-20T164000Z.json"
            path.write_text(json.dumps(doc))
            read,_=G.load_original_forecasts(Path(temp))
            self.assertEqual(len(read),1)
            bad=copy.deepcopy(doc)
            bad["generated_at_utc"]=g["tipoff_utc"]
            path.write_text(json.dumps(bad))
            with self.assertRaisesRegex(ValueError,"POSTTIP"):
                G.load_original_forecasts(Path(temp))

    def test_duplicate_archived_game_raises_and_zero_matches_are_honest(self):
        with tempfile.TemporaryDirectory() as temp:
            doc=original()
            root=Path(temp)
            first=root/"2026-10-20T164000Z.json"
            first.write_text(json.dumps(doc))
            (root/"2026-10-20T174000Z.json").write_text(json.dumps(doc))
            with self.assertRaisesRegex(ValueError,"DUPLICATE"):
                G.load_original_forecasts(root)
        d=G.grade_originals({}, {}, {}, {},
                       dt.datetime(2026,10,23,tzinfo=dt.timezone.utc))
        self.assertEqual(d["original_player_forecasts"],0)
        self.assertEqual(d["status"],"NO_GENUINE_ROLLING_FIRST_SEEN_PREDICTIONS")

if __name__=="__main__":unittest.main()
