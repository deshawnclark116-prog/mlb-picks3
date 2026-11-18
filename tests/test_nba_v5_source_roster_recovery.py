"""Pregame source roster recovery must not depend on V3 forecast rows or hindsight."""
import datetime as dt
import unittest

from nba.nba_v5_forecast import pseudo_game
from nba import nba_v5_backtest as b5
from nba.nba_v5_sim import League, STATS_BOX


TIP = "2026-11-10T00:00:00+00:00"
BEFORE = "2026-11-09T20:00:00+00:00"


def source_case():
    return {
        "home_id": "1", "away_id": "2", "tipoff_utc": TIP,
        "rows": [
            {"player_id": "101", "team_id": "1", "player": "Veteran",
             "reported_status": "UNKNOWN_NOT_ACTIVE_CERTIFIED",
             "p_active": .91, "conditional_minutes_mean": 34.0},
            {"player_id": "102", "team_id": "1", "player": "Injured",
             "reported_status": "OUT", "p_active": 0.0},
        ],
        "source_roster_snapshot_asof_utc": BEFORE,
        "source_roster": {
            "1": [
                {"player_id": "101", "player": "Veteran",
                 "prior_box_games": 12, "membership_source": "ESPN_CURRENT_ROSTER"},
                {"player_id": "102", "player": "Injured",
                 "prior_box_games": 7, "membership_source": "ESPN_CURRENT_ROSTER"},
                {"player_id": "103", "player": "Recovered Rookie",
                 "prior_box_games": 2, "membership_source": "ESPN_CURRENT_ROSTER"},
                {"player_id": "104", "player": "Debut Player",
                 "prior_box_games": 0, "membership_source": "ESPN_CURRENT_ROSTER"},
            ],
            "2": [],
        },
    }


class SourceRosterRecoveryContracts(unittest.TestCase):
    def test_recovered_prior_box_player_not_cut_by_v3_projection_filter(self):
        game = pseudo_game(source_case())
        by_id = {p["id"]: p for p in game["players"]}
        self.assertEqual(set(by_id), {"101", "103"})
        self.assertTrue(by_id["103"]["source_roster_recovered"])
        self.assertEqual(by_id["103"]["prior_box_games_at_source"], 2)
        self.assertNotIn("prior_minutes_estimate", by_id["101"])
        self.assertIsNone(by_id["103"]["p_active"])

    def test_no_zero_history_fabrication_or_stale_out_reentry(self):
        game = pseudo_game(source_case())
        self.assertNotIn("104", {p["id"] for p in game["players"]})
        self.assertNotIn("102", {p["id"] for p in game["players"]})

    def test_official_active_can_override_older_out_without_new_roster_member(self):
        game = pseudo_game(source_case(), officially_available={"102"})
        self.assertIn("102", {p["id"] for p in game["players"]})
        self.assertEqual(len({(p["id"], p["team"]) for p in game["players"]}),
                         len(game["players"]))

    def test_source_snapshot_at_tip_is_rejected(self):
        fixture = source_case()
        fixture["source_roster_snapshot_asof_utc"] = TIP
        with self.assertRaisesRegex(ValueError, "AFTER_TIP"):
            pseudo_game(fixture)

    def test_source_membership_does_not_create_an_untested_statistical_profile(self):
        fixture = source_case()
        fixture["source_roster"]["1"].append({
            "player_id": "109", "player": "Unknown", "prior_box_games": 10,
            "membership_source": "UNVERIFIED_PREDICTED_LINEUP"})
        self.assertNotIn("109", {p["id"] for p in pseudo_game(fixture)["players"]})

    def test_source_only_player_with_real_history_is_admitted_by_team_builder(self):
        rp = b5.Replay()
        league = League()
        league.per_min = {key: 0.1 for key in STATS_BOX if key != "min"}
        before = dt.date(2026, 11, 9)
        for i in range(7):
            pid = str(100 + i)
            rp.hist[pid].append({
                "date": before, "min": 18.0, "fga": 6.0, "fgm": 3.0,
                "tpa": 2.0, "tpm": 1.0, "fta": 2.0, "ftm": 1.5,
                "ast": 2.0, "oreb": 1.0, "dreb": 3.0, "stl": 0.5,
                "blk": 0.3, "tov": 1.0, "pf": 1.0, "pts": 8.5,
                "start": False,
            })
        g = {"home": {"id": "1"}, "away": {"id": "2"},
             "players": [{"id": str(100 + i), "team": "1", "side": "home"}
                         for i in range(7)]}
        target = dt.date(2026, 11, 10)
        self.assertIsNone(b5.team_input(rp, g, "home", target, league, {},
                                        None, cold_start=False))
        team = b5.team_input(rp, g, "home", target, league, {}, None,
                             cold_start=False, verified_roster_recovery=True)
        self.assertEqual(len(team.ids), 7)
        self.assertTrue(all(team.low_history_evidence[pid]["no_invented_nba_box_games"]
                            for pid in team.ids))


    def test_foreign_player_is_never_assigned_to_away_team(self):
        fixture = source_case()
        fixture["rows"].append({
            "player_id": "999", "team_id": "3", "player": "Other Game",
            "reported_status": "UNKNOWN_NOT_ACTIVE_CERTIFIED", "p_active": 0.9,
        })
        with self.assertRaisesRegex(ValueError, "NBA_V5_FOREIGN_TEAM_IN_GAME"):
            pseudo_game(fixture)

    def test_foreign_out_row_also_fails_input_integrity(self):
        fixture = source_case()
        fixture["rows"].append({
            "player_id": "999", "team_id": "3", "player": "Other Game",
            "reported_status": "OUT", "p_active": 0.0,
        })
        with self.assertRaisesRegex(ValueError, "NBA_V5_FOREIGN_TEAM_IN_GAME"):
            pseudo_game(fixture)

    def test_conflicting_player_membership_cannot_join_both_sides(self):
        fixture = source_case()
        fixture["rows"].append({
            "player_id": "101", "team_id": "2", "player": "Veteran",
            "reported_status": "UNKNOWN_NOT_ACTIVE_CERTIFIED", "p_active": 0.9,
        })
        with self.assertRaisesRegex(ValueError, "NBA_V5_PLAYER_ON_BOTH_TEAMS"):
            pseudo_game(fixture)

    def test_source_roster_cannot_resurrect_player_on_opponent(self):
        fixture = source_case()
        fixture["source_roster"]["2"].append({
            "player_id": "101", "player": "Veteran",
            "prior_box_games": 12, "membership_source": "ESPN_CURRENT_ROSTER",
        })
        with self.assertRaisesRegex(ValueError, "NBA_V5_SOURCE_PLAYER_ON_BOTH_TEAMS"):
            pseudo_game(fixture)

    def test_mixed_numeric_and_string_team_ids_resolve_correctly(self):
        fixture = source_case()
        fixture["home_id"] = 1
        fixture["away_id"] = 2
        fixture["rows"].append({
            "player_id": 201, "team_id": 2, "player": "Valid Away",
            "reported_status": "UNKNOWN_NOT_ACTIVE_CERTIFIED", "p_active": 0.95,
        })
        players = {p["id"]: p for p in pseudo_game(fixture)["players"]}
        self.assertEqual(players["101"]["side"], "home")
        self.assertEqual(players["201"]["side"], "away")
        self.assertEqual(players["201"]["team"], "2")


if __name__ == "__main__":
    unittest.main()
