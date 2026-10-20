"""NBA roster source QA. Roster membership NEVER certifies game-day starter/active."""
import copy, datetime as dt, json, unittest
from pathlib import Path
from nba.nba_2026_roster_source import (
    extract_roster,snapshot,verify_season_snapshot,SCHEMA,NBA_IDS)

FIXTURE=json.loads(Path("docs/nba_v1_opening_week_research.json").read_text())
NOW=dt.datetime(2026,10,19,19,0,tzinfo=dt.timezone.utc)

def rows(team):
    return [{"id":str(int(team)*1000+i),"displayName":"Synthetic Athlete "+team+"/"+str(i),
             "position":{"abbreviation":"G"},"status":{"type":"active"}}
            for i in range(12)]

def blob(team,grouped=False):
    athletes=rows(team)
    if grouped:athletes=[{"position":"Guards","items":athletes}]
    return {"team":{"id":team},"athletes":athletes}

def fake(team):
    return "https://site.api.espn.com/fake/"+team,json.dumps(blob(team)).encode()

class RosterTruthTests(unittest.TestCase):
    def test_all_thirty_rosters_are_separate_from_game_day_rosters(self):
        item=snapshot(FIXTURE,fetcher=fake,now=NOW)
        self.assertEqual(item["schema"],SCHEMA)
        self.assertEqual(item["teams_source_covered"],30)
        self.assertEqual(item["distinct_roster_athletes"],360)
        self.assertEqual(len(item["opening_game_ids_with_team_roster_membership"]),14)
        self.assertEqual(item["official_bets"],0)
        self.assertEqual(item["verified_current_starting_fives"],0)
        self.assertEqual(item["verified_official_NBA_injury_designations"],0)
        self.assertTrue(all(p["active_for_game_certified"] is False
                    for team in item["rosters"].values() for p in team))
        self.assertTrue(all(len(r["source_sha256"])==64
                    for r in item["receipts"].values()))
    def test_nested_espn_position_sections_and_duplicate_ids(self):
        p=extract_roster(blob("1",grouped=True),"1")
        self.assertEqual(len(p),12)
        bad=blob("1")
        bad["athletes"][1]["id"]=bad["athletes"][0]["id"]
        with self.assertRaisesRegex(ValueError,"DUPLICATED"):
            extract_roster(bad,"1")
        with self.assertRaisesRegex(ValueError,"TEAM_ID_CONFLICT"):
            extract_roster(blob("2"),"1")
    def test_no_fabricated_identity_or_minute_status(self):
        b=blob("1")
        b["athletes"][0].pop("id")
        with self.assertRaisesRegex(ValueError,"IDENTITY"):
            extract_roster(b,"1")
        b=blob("1")
        b["athletes"][0].pop("displayName")
        with self.assertRaisesRegex(ValueError,"IDENTITY"):
            extract_roster(b,"1")
    def test_one_failed_team_disables_entire_slate_not_29_team_guess(self):
        def missing(team):
            if team=="22":raise ValueError("TEST_NETWORK_FAILURE")
            return fake(team)
        with self.assertRaisesRegex(ValueError,"SOURCE_INCOMPLETE"):
            snapshot(FIXTURE,fetcher=missing,now=NOW)
    def test_reject_wrong_fixture_status_or_future_timestamp(self):
        modified=copy.deepcopy(FIXTURE);modified["official_wagers"]=1
        with self.assertRaisesRegex(ValueError,"UNTRUSTED"):
            snapshot(modified,fetcher=fake,now=NOW)
        with self.assertRaisesRegex(ValueError,"CUTOFF_EXPIRED"):
            snapshot(FIXTURE,fetcher=fake,now=dt.datetime(2026,10,22,tzinfo=dt.timezone.utc))
        with self.assertRaisesRegex(ValueError,"NAIVE"):
            snapshot(FIXTURE,fetcher=fake,now=dt.datetime(2026,10,19,12))
    def test_player_cannot_exist_on_multiple_current_teams(self):
        rosters={team:extract_roster(blob(team),team) for team in NBA_IDS}
        rosters["2"][0]["player_id"]=rosters["1"][0]["player_id"]
        with self.assertRaisesRegex(ValueError,"MULTIPLE"):
            verify_season_snapshot(rosters,FIXTURE)
if __name__=="__main__":unittest.main()
