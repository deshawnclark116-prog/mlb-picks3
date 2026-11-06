"""NBA Stats released tracking is real observed data, never inferred ESPN events."""
import datetime as dt
import unittest
import pandas as pd

from nba.nba_v5_hoopr_tracking import (
    ESPN_ABBR, completed_start_year, canonical_name, roster_map,
    normalize_tables
)
from nba.nba_v5_external_source import validate_source


class FreeRealTrackingTests(unittest.TestCase):
    def setUp(self):
        self.v3={"games":[{"rows":[
            {"player_id":"123","team_id":"2","player":"José Player"},
            {"player_id":"456","team_id":"1","player":"AJ Candidate"}]}]}
        self.roster,_=roster_map(self.v3)
        self.asof="2026-11-06T19:00:00Z"

    def test_uses_last_completed_season_only(self):
        self.assertEqual(completed_start_year(self.asof),2025)
        self.assertEqual(completed_start_year("2026-03-05T10:00:00Z"),2024)
        self.assertEqual(completed_start_year("2026-06-30T23:59:59Z"),2024)
        self.assertEqual(completed_start_year("2026-07-01T00:00:00Z"),2025)

    def test_all_30_teams_have_distinct_identity(self):
        self.assertEqual(len(ESPN_ABBR),30)
        self.assertEqual(len(set(ESPN_ABBR.values())),30)

    def test_name_and_current_team_mapping_are_exact(self):
        self.assertEqual(self.roster[("jose player","BOS")],("2","123"))
        self.assertNotIn(("jose player","ATL"),self.roster)
        # No fuzzy automatic trade mapping.
        s={"games":[{"rows":[
            {"player_id":"123","team_id":"2","player":"José Player"},
            {"player_id":"999","team_id":"2","player":"Jose Player"}]}]}
        mapping,ambiguous=roster_map(s)
        self.assertIn(("jose player","BOS"),ambiguous)
        self.assertNotIn(("jose player","BOS"),mapping)

    def test_true_nba_tracking_rows_reach_source_validator(self):
        tables={
            "player_tracking_drives":pd.DataFrame([
                {"player_name":"Jose Player","team_abbreviation":"BOS","gp":70,
                 "per_mode":"Totals","drives":700},
                {"player_name":"Jose Player","team_abbreviation":"ATL","gp":70,
                 "per_mode":"Totals","drives":900}]),
            "player_tracking_passing":pd.DataFrame([
                {"player_name":"José Player","team_abbreviation":"BOS","gp":70,
                 "per_mode":"Totals","passes_made":2100,"potential_ast":420}]),
            "player_tracking_possessions":pd.DataFrame([
                {"player_name":"José Player","team_abbreviation":"BOS","gp":70,
                 "per_mode":"Totals","touches":3500,"time_of_poss":350}]),
            "player_tracking_rebounding":pd.DataFrame([
                {"player_name":"José Player","team_abbreviation":"BOS","gp":70,
                 "per_mode":"Totals","reb_chances":700,"reb_contest":350}]),
        }
        doc,audit=normalize_tables(tables,self.roster,self.asof,2025)
        self.assertEqual(len(doc["player_rows"]),1)
        row=doc["player_rows"][0]
        self.assertEqual(row["team_id"],"2")
        self.assertEqual(row["player_id"],"123")
        self.assertAlmostEqual(row["features"]["drives_per_game"],10.0)
        self.assertAlmostEqual(row["features"]["potential_assists_per_game"],6.0)
        self.assertAlmostEqual(row["features"]["time_of_possession_seconds_per_game"],300.0)
        self.assertAlmostEqual(row["features"]["contested_rebounds_per_game"],5.0)
        self.assertEqual(audit["matched_current_players"],1)
        accepted,quality=validate_source(doc,self.asof,{("2","123"),("1","456")})
        self.assertEqual(len(accepted),1)
        self.assertEqual(quality["unknown_current_roster_mappings"],0)
        self.assertEqual(quality["model_feature_promotion_allowed"],False)

    def test_wrong_season_is_rejected(self):
        df=pd.DataFrame([{"player_name":"José Player","team_abbreviation":"BOS",
                          "gp":30,"per_mode":"PerGame","drives":5}])
        with self.assertRaisesRegex(ValueError,"SEASON_NOT_COMPLETE"):
            normalize_tables({"player_tracking_drives":df},self.roster,
                             "2026-02-01T00:00:00Z",2025)

    def test_source_with_missing_columns_fails_closed(self):
        df=pd.DataFrame([{"player_id":123,"gp":70,"drives":500}])
        with self.assertRaisesRegex(ValueError,"MISSING_PLAYER_JOIN_FIELDS"):
            normalize_tables({"player_tracking_drives":df},self.roster,self.asof,2025)

    def test_duplicates_are_rejected_not_chosen_by_outcome(self):
        row={"player_name":"José Player","team_abbreviation":"BOS",
             "gp":70,"per_mode":"Totals","drives":350}
        with self.assertRaisesRegex(ValueError,"AMBIGUOUS_PLAYER_TEAM"):
            normalize_tables({"player_tracking_drives":pd.DataFrame([row,row])},
                             self.roster,self.asof,2025)

    def test_never_fabricate_potential_assists_without_column(self):
        df=pd.DataFrame([{"player_name":"José Player","team_abbreviation":"BOS",
                          "gp":70,"per_mode":"PerGame","passes_made":30}])
        doc,_=normalize_tables({"player_tracking_passing":df},self.roster,self.asof,2025)
        features=doc["player_rows"][0]["features"]
        self.assertEqual(features["passes_made_per_game"],30)
        self.assertNotIn("potential_assists_per_game",features)


if __name__=="__main__":
    unittest.main()
