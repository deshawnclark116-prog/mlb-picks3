"""Injury observations are evidence, not official NBA game-dressed decisions."""
import copy
import datetime as dt
import json
import unittest
from nba import nba_live_injury_source as I
from nba import nba_v2_rolling_predictions as R
from tests.test_nba_v2_rolling_predictions import (
    NOW,fixture,verified_history,source_rosters
)

def feed(*entries):
    return json.dumps({"injuries":list(entries)}).encode()

def entry(team='1',pid='1001',status='Out',date=None):
    return {"team":{"id":team},"athlete":{"id":pid,"displayName":"Real One"},
            "status":status,"date":date or (NOW-dt.timedelta(hours=4)).isoformat(),
            "injury":{"type":"Knee"},"shortComment":"Knee (ESPN-reported)"}

class SourceOnlyNBAInjuries(unittest.TestCase):
    def test_proven_espn_out_annotation_does_not_fake_official_lineup_or_bet(self):
        d=I.snapshot(NOW,fetcher=lambda:feed(entry(),entry('2','1002','Questionable')))
        self.assertEqual(d["schema"],I.SCHEMA)
        self.assertEqual(d["verified_team_player_entries"],2)
        self.assertEqual(d["source_status"],"ESPN_REPORTED_NOT_OFFICIAL_NBA_INJURY_CERTIFICATION")
        self.assertFalse(d["roster_active_status_certified"])
        self.assertTrue(d["absence_from_report_does_not_mean_active"])
        self.assertEqual(d["injuries"][0]["source_reported_status"],"OUT")
        I.validate(d,NOW)
        games,boxes=verified_history()
        rosters,receipts=source_rosters()
        f=fixture()
        f["games"][0]["tipoff_utc"]=(NOW+dt.timedelta(hours=4)).isoformat()
        doc=R.forecast_roll(f,{"forecasts":[]},set(),
            rosters,receipts,games,boxes,NOW,injury_snapshot=d)
        rows=doc["forecasts"][0]["players"]
        out=next(x for x in rows if x["player_id"]=="1001")
        q=next(x for x in rows if x["player_id"]=="1002")
        self.assertEqual(out["espn_source_reported_injury_status"],"OUT")
        self.assertEqual(out["reported_out_in_24h_conditional_scenario_p_play"],0.0)
        self.assertGreater(out["p_play_unverified"],0)
        self.assertIsNone(q["reported_out_in_24h_conditional_scenario_p_play"])
        self.assertFalse(out["game_day_active_certified"])
        self.assertFalse(out["official_pick"])
        self.assertEqual(doc["official_bets"],0)
        self.assertEqual(doc["reported_injury_source_sha256"],d["source_sha256"])

    def test_two_days_later_espn_out_does_not_assert_player_absence_for_future_game(self):
        d=I.snapshot(NOW,fetcher=lambda:feed(entry()))
        games,boxes=verified_history();rosters,receipts=source_rosters()
        doc=R.forecast_roll(fixture(),{"forecasts":[]},set(),
              rosters,receipts,games,boxes,NOW,injury_snapshot=d)
        out=next(x for x in doc["forecasts"][0]["players"]
                 if x["player_id"]=="1001")
        self.assertEqual(out["espn_source_reported_injury_status"],"OUT")
        self.assertIsNone(out["reported_out_in_24h_conditional_scenario_p_play"])
        self.assertGreater(out["p_play_unverified"],0)

    def test_unlisted_players_and_unavailable_feed_are_not_presumed_healthy(self):
        d=I.snapshot(NOW,fetcher=lambda:feed())
        self.assertEqual(d["verified_team_player_entries"],0)
        I.validate(d,NOW)
        games,boxes=verified_history();rosters,receipts=source_rosters()
        doc=R.forecast_roll(fixture(),{"forecasts":[]},set(),
            rosters,receipts,games,boxes,NOW,injury_snapshot=d)
        self.assertTrue(all(p["espn_source_reported_injury_status"]==
             "NOT_LISTED_NOT_PROOF_OF_ACTIVE"
             for p in doc["forecasts"][0]["players"]))
        missing=R.forecast_roll(fixture(),{"forecasts":[]},set(),
            rosters,receipts,games,boxes,NOW)
        self.assertTrue(all(p["espn_source_reported_injury_status"]==
             "ESPN_INJURY_FEED_UNAVAILABLE"
             for p in missing["forecasts"][0]["players"]))

    def test_bad_identity_duplicate_and_future_report_never_used(self):
        with self.assertRaisesRegex(ValueError,"DUPLICATE"):
            I.snapshot(NOW,fetcher=lambda:feed(entry(),entry()))
        d=I.snapshot(NOW,fetcher=lambda:feed(entry(date=(NOW+dt.timedelta(days=2)).isoformat())))
        self.assertEqual(len(d["injuries"]),0)
        self.assertEqual(d["quarantined_entries"][0]["reason"],
                         "FUTURE_INJURY_SOURCE_ENTRY")
        d=I.snapshot(NOW,fetcher=lambda:feed(entry()))
        future=copy.deepcopy(d);future["captured_at_utc"]=(NOW+dt.timedelta(seconds=1)).isoformat()
        with self.assertRaisesRegex(ValueError,"FUTURE_OR_TOO_OLD"):
            I.validate(future,NOW)
        with self.assertRaisesRegex(ValueError,"FORGED"):
            I.validate({**d,"roster_active_status_certified":True},NOW)
        future=copy.deepcopy(d)
        future["injuries"][0]["source_entry_date_utc"]=(NOW+dt.timedelta(seconds=1)).isoformat()
        with self.assertRaisesRegex(ValueError,"POST_CAPTURE"):
            I.validate(future,NOW)

if __name__=="__main__":unittest.main()
