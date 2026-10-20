"""NBA original 2026 game-day player generation: adversarial source/time/roster tests."""
import datetime as dt
import json
import math
import tempfile
import unittest
from pathlib import Path

from nba import nba_v2_firstseen_player_opening as M
from nba.nba_2026_roster_source import NBA_IDS
from nba.nba_v2_rotation_research import VERSION

NOW=dt.datetime(2026,10,20,14,0,tzinfo=dt.timezone.utc)
TIP="2026-10-20T23:00:00+00:00"

def fixtures():
    rows=[]
    for i in range(14):
        home=NBA_IDS[(i*2+1)%30]
        away=NBA_IDS[(i*2)%30]
        rows.append({"game_id":str(600000000+i),"tipoff_utc":TIP,
            "home_id":home,"away_id":away,"home":"Home "+home,"away":"Away "+away})
    return {
        "schema":"NBA_V1_2026_OPENING_ROSTER_BLIND_RESEARCH_V1",
        "generated_at_utc":"2026-10-19T03:14:00+00:00",
        "forecasts":rows,"official_wagers":0,"research_only":True
    }

def rosters():
    allteams={}
    receipts={}
    for team in NBA_IDS:
        players=[{"player_id":str(int(team)*100+i),"player":f"Player {team}/{i}",
                  "team_id":team,"active_for_game_certified":False,
                  "starter_certified":False,"injury_report_certified":False}
                 for i in range(8)]
        allteams[team]=players
        receipts[team]={"url":f"https://example.test/{team}",
            "sha256":"a"*64,"retrieved_at_utc":"2026-10-20T13:00:00+00:00",
            "players":8}
    return allteams,receipts

def historical():
    games=[];boxes={}
    for i in range(16):
        for j in range(15):
            home=str(2*j+1)
            away=str(2*j+2)
            gid=str(800000000+i*15+j)
            start=f"2026-03-{i+1:02d}T23:00:00+00:00"
            games.append({"game_id":gid,"start_utc":start,"day_utc":start[:10],
                "home_id":home,"away_id":away,"completed":True})
            box=[]
            for tid in (home,away):
                for k in range(2):
                    pid=str(int(tid)*100+k)
                    box.append({"team_id":tid,"player_id":pid,
                        "player":f"Player {tid}/{k}","minutes":23+k*6,
                        "started":k==0,"points":12+k*8,"rebounds":4+k*3,
                        "assists":3+k,"three_pointers_made":1+k})
            boxes[gid]=box
    return games,boxes

class NBAFirstSeen(unittest.TestCase):
    def valid(self,fixture=None,now=NOW,rosters_data=None,receipts_data=None,games=None,boxes=None):
        if fixture is None:fixture=fixtures()
        if rosters_data is None or receipts_data is None:
            rosters_data,receipts_data=rosters()
        if games is None or boxes is None:
            games,boxes=historical()
        return M.build_forecasts(fixture,rosters_data,receipts_data,
            games,boxes,now,history_receipt={"source_content_sha256":"f"*64})

    def test_all_four_markets_really_generated_from_prior_played_minutes(self):
        result=self.valid()
        self.assertEqual(result["schema"],M.SCHEMA)
        self.assertEqual(result["games_forecast"],14)
        self.assertEqual(result["official_bets"],0)
        self.assertGreater(result["number_of_player_stat_predictions"],50)
        self.assertEqual(result["verified_previous_season_full_boxscores"],240)
        self.assertEqual(len(result["source_roster_receipts"]),30)
        rows=[r for game in result["forecasts"] for r in game["players"]]
        self.assertEqual(result["number_of_player_stat_predictions"],len(rows)*4)
        self.assertTrue(all(set(r["predictions"])==set(M.MARKETS) for r in rows))
        self.assertTrue(all(0<r["p_play_unverified"]<=1 for r in rows))
        self.assertTrue(all(0<r["conditional_minutes_mean"]<=42 for r in rows))
        self.assertTrue(all(r["official_pick"] is False and
             r["game_day_active_certified"] is False for r in rows))
        self.assertTrue(all(r["stat_market_lines"] is None for r in rows))
        self.assertTrue(all(r["predictions"]["points"]>0 for r in rows))
        self.assertTrue(all(len(r["forecast_id"])==64 for r in rows))
        self.assertEqual(result["games_skipped_after_tip"],[])

    def test_histories_exclude_any_player_not_on_current_source_roster(self):
        team,receipt=rosters()
        # A historically productive player on one team has moved in current
        # roster snapshot. Cannot keep publishing their former team forecast.
        team["1"]=[p for p in team["1"] if p["player_id"]!="100"]
        # Keep roster team size in valid bounds.
        team["1"].append({"team_id":"1","player_id":"99999","player":"New rookie"})
        result=self.valid(rosters_data=team,receipts_data=receipt)
        for f in result["forecasts"]:
            for r in f["players"]:
                if r["team_id"]=="1":
                    self.assertNotEqual(r["player_id"],"100")
        matching=[f for f in result["forecasts"] if f["away_id"]=="1"]
        self.assertTrue(any(x["player_id"]=="99999" for g in matching
            for x in g["roster_players_without_model_forecast"]))

    def test_skip_expired_fixture_without_retroactive_outcome_projections(self):
        f=fixtures()
        f["forecasts"][0]["tipoff_utc"]="2026-10-20T12:00:00Z"
        d=self.valid(fixture=f)
        self.assertEqual(d["games_forecast"],13)
        self.assertEqual(len(d["games_skipped_after_tip"]),1)
        self.assertFalse(any(g["game_id"]==f["forecasts"][0]["game_id"] for g in d["forecasts"]))

    def test_no_all_past_fixtures_fabricated(self):
        with self.assertRaisesRegex(ValueError,"NO_PREGAME"):
            self.valid(now=dt.datetime(2026,10,21,1,tzinfo=dt.timezone.utc))

    def test_future_historical_outcome_is_forbidden(self):
        games,boxes=historical()
        games[0]["start_utc"]="2026-10-21T16:00:00Z"
        with self.assertRaisesRegex(ValueError,"HISTORICAL_GAME_NOT_STRICTLY_BEFORE_ASOF"):
            self.valid(games=games,boxes=boxes)

    def test_live_roster_capture_cannot_be_after_forecast(self):
        roster,receipts=rosters()
        receipts["1"]["retrieved_at_utc"]="2026-10-21T00:00:00Z"
        with self.assertRaisesRegex(ValueError,"SOURCE_CAPTURE_AFTER_ASOF"):
            self.valid(rosters_data=roster,receipts_data=receipts)

    def test_missing_historical_boxes_fail_closed_not_zero_player_games(self):
        game,box=historical()
        for k in list(box)[:18]:del box[k]
        with self.assertRaisesRegex(ValueError,"BOXSCORE_COVERAGE_FAIL"):
            self.valid(games=game,boxes=box)

    def test_incomplete_or_forced_official_slate_rejected(self):
        f=fixtures();f["official_wagers"]=1
        with self.assertRaisesRegex(ValueError,"FORGED_OFFICIAL"):
            self.valid(fixture=f)
        f=fixtures();f["forecasts"].pop()
        with self.assertRaisesRegex(ValueError,"FIXTURE_COUNT"):
            self.valid(fixture=f)

    def test_stored_original_never_overwritten_even_by_research_generator(self):
        # Main script must refuse to mutate a previously frozen file before
        # any source calls. The file safeguard is part of CLI main logic.
        import inspect
        source=inspect.getsource(M.main)
        self.assertIn('if a.out.exists():',source)
        self.assertIn('NBA_FIRST_SEEN_FORECAST_ALREADY_EXISTS_NEVER_OVERWRITE',source)

    def test_actual_old_stat_source_not_used_to_certify_current_injuries(self):
        d=self.valid()
        self.assertTrue(d["game_roster_active_injury_starter_status_unknown"])
        self.assertTrue(d["source_previous_season_transfer_contamination_risk"])
        self.assertTrue(d["conditional_historical_role_not_calibrated_for_2026_27_yet"])
        self.assertTrue(d["no_sportsbook_pricing_or_Kelly"])
        self.assertEqual(d["model_version"],VERSION)

    def test_replay_history_indices_are_pregame_and_unique(self):
        games,boxes=historical()
        selected,history_count=M.select_history(games,18)
        self.assertEqual(len(selected),240)
        self.assertTrue(all(history_count[x]==16 for x in NBA_IDS))
        hist,idx,first,last,raw=M.compile_histories(selected,boxes)
        self.assertEqual(idx["1"],16)
        self.assertEqual(len(hist[("1","100")]),16)
        self.assertEqual([x["team_game_index"] for x in hist[("1","100")]],list(range(16)))
        self.assertLess(max(x["team_game_index"] for x in hist[("1","100")]),idx["1"])

if __name__=="__main__":
    unittest.main()
