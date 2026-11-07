"""NBA daily-lineups public JSON: real shape and strict as-of starter tests."""
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

from nba.nba_v5_daily_lineups_feed import capture, collect, feed_url
from nba.nba_v5_pregame_certified import load

NOW = dt.datetime(2026, 11, 6, 23, 35, tzinfo=dt.timezone.utc)
TIP = "2026-11-07T00:00:00+00:00"
POS = ("PG", "SG", "SF", "PF", "C")
HOME = ("Alpha One", "Bravo Two", "Charlie Three", "Delta Four", "Echo Five")
AWAY = ("Foxtrot Six", "Golf Seven", "Hotel Eight", "India Nine", "Juliet Ten")


def slate():
    rows = []
    for tid, names in (("30", HOME), ("2", AWAY)):
        rows.extend({"team_id": tid, "player_id": str(len(rows)+1), "player": name}
                    for name in names)
    return {"games": [{"game_id": "4011111", "home_id": "30", "away_id": "2",
                       "tipoff_utc": TIP, "rows": rows}]}


def raw_team(abbr, names):
    return {"teamId": 0, "teamAbbreviation": abbr,
            "players": [{"personId": str(i), "playerName": name, "position": POS[i],
                         "lineupStatus": "Confirmed", "rosterStatus": "Active",
                         "timestamp": "2026-11-06T18:30:00"}
                        for i, name in enumerate(names)] +
                       [{"personId": "999", "playerName": "Bench Player",
                         "position": "", "lineupStatus": "Confirmed",
                         "rosterStatus": "Active", "timestamp": "2026-11-06T18:30:00"}]}


def raw():
    return {"games": [{"gameId": "0022600321", "gameStatus": 1,
                       "gameStatusText": "Scheduled",
                       "homeTeam": raw_team("CHA", HOME),
                       "awayTeam": raw_team("BOS", AWAY)}]}


def evidence(input_feed=None, now=NOW):
    return capture(slate(), {"20261106": raw() if input_feed is None else input_feed}, now)


class DailyFeedTests(unittest.TestCase):
    def test_confirmed_only_five_positions_even_if_bench_also_confirmed(self):
        doc, audit = evidence()
        self.assertEqual(audit["confirmed_teams"], 2)
        self.assertEqual(doc["games"][0]["teams"][0]["starters"], ["1", "2", "3", "4", "5"])
        with tempfile.TemporaryDirectory() as d:
            p = Path(d, "lineups.json")
            p.write_text(json.dumps(doc))
            rows, proof = load(p, NOW + dt.timedelta(seconds=1), slate()["games"])
        self.assertEqual(proof["confirmed_teams"], 2)
        self.assertEqual(rows[("4011111", "30")]["source_provider"],
                         "NBA_OFFICIAL_DAILY_LINEUPS")

    def test_all_expected_is_not_confirmed(self):
        data = raw()
        for player in data["games"][0]["homeTeam"]["players"]:
            player["lineupStatus"] = "Expected"
        doc, audit = evidence(data)
        self.assertEqual(audit["confirmed_teams"], 1)
        self.assertEqual(doc["games"][0]["teams"][0]["starters"], [])

    def test_fifth_position_missing_or_duplicate_fails(self):
        data = raw()
        data["games"][0]["homeTeam"]["players"][4]["position"] = ""
        self.assertEqual(evidence(data)[1]["confirmed_teams"], 1)
        data = raw()
        data["games"][0]["homeTeam"]["players"][4]["position"] = "PG"
        self.assertEqual(evidence(data)[1]["confirmed_teams"], 1)

    def test_out_starter_and_missing_identity_fail_closed(self):
        data = raw()
        data["games"][0]["homeTeam"]["players"][2]["rosterStatus"] = "Inactive"
        self.assertEqual(evidence(data)[1]["confirmed_teams"], 1)
        data = raw()
        data["games"][0]["homeTeam"]["players"][2]["playerName"] = "Not In ESPN"
        self.assertEqual(evidence(data)[1]["confirmed_teams"], 1)

    def test_live_or_final_game_never_becomes_pretip_confirmation(self):
        data = raw()
        data["games"][0]["gameStatus"] = 2
        self.assertEqual(evidence(data)[1]["confirmed_teams"], 0)
        data["games"][0]["gameStatus"] = 3
        self.assertEqual(evidence(data)[1]["confirmed_teams"], 0)

    def test_wrong_teams_or_duplicate_matchup_fail_closed(self):
        data = raw()
        data["games"][0]["homeTeam"]["teamAbbreviation"] = "LAL"
        self.assertEqual(evidence(data)[1]["confirmed_teams"], 0)
        data = raw()
        data["games"].append(dict(data["games"][0]))
        self.assertEqual(evidence(data)[1]["confirmed_teams"], 0)

    def test_future_or_after_tip_is_not_backfilled(self):
        data = raw()
        after = dt.datetime(2026, 11, 7, 0, 1, tzinfo=dt.timezone.utc)
        self.assertEqual(evidence(data, after)[0]["games"], [])

    def test_feed_failure_never_creates_confirmed(self):
        def failing(_date):
            raise OSError("offline")
        doc, audit = collect(slate(), NOW, failing)
        self.assertEqual(audit["confirmed_teams"], 0)
        self.assertEqual(audit["http_errors_by_date"], {"20261106": "OSError"})
        self.assertEqual(doc["games"][0]["teams"][0]["lineup_state"], "NOT_POSTED")

    def test_date_strict(self):
        self.assertIn("20261106", feed_url("20261106"))
        with self.assertRaises(ValueError):
            feed_url("../bad")


if __name__ == "__main__":
    unittest.main()
