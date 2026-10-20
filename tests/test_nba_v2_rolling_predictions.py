"""Prospective NBA V2 daily predictions: 30-team rotation priors and strict cutoff."""
import datetime as dt
import copy
import json
import tempfile
import unittest
from pathlib import Path
from nba import nba_v2_rolling_predictions as R

UTC=dt.timezone.utc
NOW=dt.datetime(2026,10,20,16,40,tzinfo=UTC)
CAPTURE=dt.datetime(2026,10,20,16,38,tzinfo=UTC)
KICK=dt.datetime(2026,10,22,23,0,tzinfo=UTC).isoformat()
def fixture():
    return {"schema":R.FIXTURE_SCHEMA,"source_captured_at_utc":CAPTURE.isoformat(),
        "season":"2026-27","future_games":1,"no_post_tip_reconstruction":True,
        "official_bets":0,"scoreboard_source_receipts":[{
            "sha256":"a"*64,"retrieved_at_utc":CAPTURE.isoformat(),
            "date_utc":"2026-10-20","regular_season_games_seen":1}],
        "games":[{"game_id":"401909999","tipoff_utc":KICK,
            "home_id":"1","away_id":"2",
            "home":"Atlanta Hawks","away":"Boston Celtics",
            "verified_before_tip":True,"research_only":True,
            "model_prediction":None,"original_forecast_id":None}]}

def verified_history():
    """30 NBA teams, each 15 complete previously played games and one eligible player."""
    games=[];boxes={}
    for k in range(15):
        date=dt.datetime(2026,3,12+k,19,0,tzinfo=UTC)
        for i in range(1,30,2):
            gid=f"4000{k:02d}{i:02d}"
            g={"game_id":gid,"start_utc":date.isoformat(),
               "day_utc":date.date().isoformat(),"completed":True,
               "home_id":str(i),"away_id":str(i+1)}
            games.append(g)
            boxes[gid]=[]
            for t in (i,i+1):
                boxes[gid].append({"event_id":gid,"team_id":str(t),
                    "player_id":str(1000+t),"player":f"Real {t}",
                    "started":True,"minutes":30.0,"points":17,
                    "rebounds":6,"assists":3,
                    "three_pointers_made":2})
    return games,boxes

def source_rosters():
    rosters={};receipts={}
    for t in range(1,31):
        tid=str(t)
        rosters[tid]=[{"player_id":str(1000+t),"player":f"Real {t}"}]+[
            {"player_id":str(700000+t*100+j),"player":f"Unknown {j}"}
            for j in range(7)]
        receipts[tid]={"sha256":"f"*64,"retrieved_at_utc":(NOW-dt.timedelta(seconds=4)).isoformat(),
            "players":len(rosters[tid]),
            "url":f"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{tid}/roster"}
    return rosters,receipts

class Rolling(unittest.TestCase):
    def test_real_prior_game_only_and_original_ids_persisted(self):
        history,boxes=verified_history()
        rs,receipts=source_rosters()
        doc=R.forecast_roll(fixture(),{"forecasts":[]},set(),rs,receipts,
                            history,boxes,NOW)
        self.assertEqual(doc["schema"],R.SCHEMA)
        self.assertEqual(doc["games_forecast"],1)
        self.assertEqual(doc["number_of_player_stat_predictions"],8)
        self.assertEqual(len(doc["forecasts"][0]["players"]),2)
        self.assertEqual(len(doc["forecasts"][0]["roster_players_without_model_forecast"]),14)
        self.assertEqual(doc["official_bets"],0)
        self.assertEqual(doc["model_version"],R.VERSION)
        self.assertTrue(doc["game_roster_active_injury_starter_status_unknown"])
        self.assertTrue(doc["current_season_history_update_active"])
        for p in doc["forecasts"][0]["players"]:
            self.assertTrue(p["first_seen_research"])
            self.assertFalse(p["official_pick"])
            self.assertFalse(p["game_day_active_certified"])
            self.assertIsNone(p["stat_market_lines"])
            self.assertEqual(set(p["predictions"]),set(R.MARKETS))
            self.assertGreater(p["predictions"]["points"],0)
            self.assertGreater(p["conditional_minutes_mean"],0)
            self.assertLess(R.datetime_utc(p["forecast_generated_at_utc"]),R.datetime_utc(KICK))

    def test_existing_games_and_after_tip_never_regenerated(self):
        games,boxes=verified_history();rosters,receipts=source_rosters()
        d=R.forecast_roll(fixture(),{"forecasts":[]},{"401909999"},
                          rosters,receipts,games,boxes,NOW)
        self.assertEqual(d["games_forecast"],0)
        self.assertEqual(d["skipped_original_or_late"][0]["reason"],
                         "ORIGINAL_FIRST_SEEN_FORECAST_ALREADY_EXISTS")
        newer=fixture()
        newer["games"][0]["tipoff_utc"]=(NOW+dt.timedelta(minutes=5)).isoformat()
        later=R.forecast_roll(newer,{"forecasts":[]},set(),
                         rosters,receipts,games,boxes,NOW)
        self.assertEqual(later["games_forecast"],0)
        self.assertEqual(later["skipped_original_or_late"][0]["reason"],
                         "STRICT_PREGAME_15_MINUTE_WINDOW_MISSED")

    def test_after_asof_history_cannot_boost_minutes(self):
        games,boxes=verified_history();rosters,receipts=source_rosters()
        games[0]["start_utc"]=(NOW+dt.timedelta(hours=1)).isoformat()
        with self.assertRaisesRegex(ValueError,"HISTORICAL_FUTURE"):
            R.forecast_roll(fixture(),{"forecasts":[]},set(),
                            rosters,receipts,games,boxes,NOW)

    def test_stale_or_posttip_fixture_source_is_rejected(self):
        old=fixture()
        old["source_captured_at_utc"]=(NOW-dt.timedelta(hours=7)).isoformat()
        with self.assertRaisesRegex(ValueError,"STALE"):
            R.validate_fixture_source(old,NOW)
        old=fixture();old["games"][0]["tipoff_utc"]=(CAPTURE-dt.timedelta(minutes=1)).isoformat()
        with self.assertRaisesRegex(ValueError,"BAD_OR_FABRICATED"):
            R.validate_fixture_source(old,NOW)
        old=fixture();old["games"][0]["model_prediction"]=27
        with self.assertRaisesRegex(ValueError,"BAD_OR_FABRICATED"):
            R.validate_fixture_source(old,NOW)
        old=fixture();old["official_bets"]=1
        with self.assertRaisesRegex(ValueError,"UNTRUSTED"):
            R.validate_fixture_source(old,NOW)

    def test_same_roster_player_on_two_teams_is_quarantined(self):
        games,boxes=verified_history()
        rosters,receipts=source_rosters()
        rosters["2"][0]["player_id"]=rosters["1"][0]["player_id"]
        with self.assertRaisesRegex(ValueError,"MULTIPLE_TEAMS"):
            R.forecast_roll(fixture(),{"forecasts":[]},set(),rosters,
                             receipts,games,boxes,NOW)

    def test_recent_complete_2026_games_take_precedence_over_spring(self):
        games,boxes=verified_history()
        # Include nine October games for club 1: 2026 season role change
        for k in range(9):
            date=dt.datetime(2026,10,10+k,19,tzinfo=UTC)
            gid=str(401904000+k)
            g={"game_id":gid,"start_utc":date.isoformat(),
               "day_utc":date.date().isoformat(),"completed":True,
               "home_id":"1","away_id":"2"}
            games.append(g)
            boxes[gid]=[
              {"event_id":gid,"team_id":t,"player_id":str(1000+int(t)),
               "player":f"Real {t}","minutes":35.0,"started":True,
               "points":28,"rebounds":8,"assists":7,"three_pointers_made":3}
              for t in ("1","2")]
        selected,counts=R.select_recent_games(
            games[:225],games[225:],NOW,per_team=18)
        self.assertEqual(counts["1"]["current_season_games"],9)
        self.assertEqual(counts["2"]["current_season_games"],9)
        self.assertGreaterEqual(sum(x["game_id"].startswith("401904") for x in selected),9)
        rosters,receipts=source_rosters()
        relevant={x["game_id"]:boxes[x["game_id"]] for x in selected}
        d=R.forecast_roll(fixture(),{"forecasts":[]},set(),
                            rosters,receipts,selected,relevant,NOW)
        real1=next(x for x in d["forecasts"][0]["players"] if x["team_id"]=="1")
        self.assertGreater(real1["predictions"]["points"],20)
        self.assertEqual(d["current_season_prior_completed_game_count"],9)

    def test_persisted_originals_block_duplicate_forecast_game(self):
        opening=json.loads(Path("docs/nba_v2_opening_player_firstseen.json").read_text())
        with tempfile.TemporaryDirectory() as td:
            seen,_=R.existing_games(Path(td),opening)
            self.assertEqual(len(seen),14)
            self.assertIn(opening["forecasts"][0]["game_id"],seen)
            root=Path(td)/"nba_rolling_predictions";root.mkdir()
            file=root/"2026-10-20.json"
            first=fixture()["games"][0]
            file.write_text(json.dumps({"schema":R.SCHEMA,"official_bets":0,
                "games_forecast":1,"forecasts":[{"game_id":first["game_id"]}]}))
            updated,_=R.existing_games(Path(td),opening)
            self.assertIn(first["game_id"],updated)
            file2=root/"2026-10-21.json"
            file2.write_text(file.read_text())
            with self.assertRaisesRegex(ValueError,"MULTIPLE_ORIGINAL"):
                R.existing_games(Path(td),opening)

if __name__=="__main__":unittest.main()
