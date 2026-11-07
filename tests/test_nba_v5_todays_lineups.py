"""NBA Today lineup capture bridge: positive and fail-closed cases."""
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

from nba.nba_v5_todays_lineups import convert, PAGE
from nba.nba_v5_pregame_certified import load

NOW = dt.datetime(2026, 11, 6, 23, 35, tzinfo=dt.timezone.utc)
TIP = "2026-11-07T00:00:00+00:00"
NAMES = ["Alpha One", "Bravo Two", "Charlie Three", "Delta Four", "Echo Five"]
AWAY = ["Foxtrot Six", "Golf Seven", "Hotel Eight", "India Nine", "Juliet Ten"]


def slate():
    rows = []
    for team, names in (("30", NAMES), ("2", AWAY)):
        rows.extend({"team_id": team, "player_id": str(len(rows) + 1), "player": name}
                    for name in names)
    return {"games": [{
        "game_id": "4011111", "home_id": "30", "away_id": "2",
        "home": "Charlotte Hornets", "away": "Boston Celtics",
        "tipoff_utc": TIP, "rows": rows
    }]}


def snapshot():
    return {
        "source_page": PAGE,
        "obtained_with_permission": True,
        "captured_at_utc": NOW.isoformat(),
        "games": [{
            "game_id": "4011111", "away_team": "BOS", "home_team": "CHA",
            "tipoff_utc": TIP, "game_status": "PREGAME",
            "teams": [
                {"team_abbr": "CHA", "lineup_status": "CONFIRMED",
                 "players": [{"name": name, "starter": True} for name in NAMES]},
                {"team_abbr": "BOS", "lineup_status": "CONFIRMED",
                 "players": [{"name": name, "starter": True} for name in AWAY]}
            ],
        }]
    }


class TodayLineupsBridgeTests(unittest.TestCase):
    def test_exact_five_pretip_confirmations_pass_strict_v5_loader(self):
        doc, audit = convert(slate(), snapshot(), NOW)
        self.assertEqual(audit["confirmed_teams"], 2)
        self.assertFalse(audit["source_authenticity_verified"])
        self.assertEqual(doc["games"][0]["teams"][0]["starters"], ["1", "2", "3", "4", "5"])
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "starter_evidence.json"
            p.write_text(json.dumps(doc))
            found, receipt = load(p, NOW + dt.timedelta(seconds=1), slate()["games"])
        self.assertEqual(receipt["confirmed_teams"], 2)
        self.assertEqual(found[("4011111", "30")]["lineup_state"], "CONFIRMED")

    def test_green_active_players_are_not_certified(self):
        raw = snapshot()
        for row in raw["games"][0]["teams"][0]["players"]:
            row.pop("starter")
            row["active"] = True
        doc, audit = convert(slate(), raw, NOW)
        self.assertEqual(audit["confirmed_teams"], 1)
        self.assertEqual(doc["games"][0]["teams"][0]["lineup_state"], "NOT_POSTED")

    def test_projected_five_is_never_promoted(self):
        raw = snapshot()
        raw["games"][0]["teams"][0]["lineup_status"] = "PROJECTED"
        doc, audit = convert(slate(), raw, NOW)
        self.assertEqual(audit["confirmed_teams"], 1)
        self.assertEqual(doc["games"][0]["teams"][0]["starters"], [])

    def test_six_starters_or_unknown_name_does_not_confirm(self):
        raw = snapshot()
        raw["games"][0]["teams"][0]["players"].append({"name": "Unknown", "starter": True})
        self.assertEqual(convert(slate(), raw, NOW)[1]["confirmed_teams"], 1)
        raw = snapshot()
        raw["games"][0]["teams"][0]["players"][0]["name"] = "Unknown"
        self.assertEqual(convert(slate(), raw, NOW)[1]["confirmed_teams"], 1)

    def test_wrong_matchup_or_after_tip_rejects(self):
        raw = snapshot()
        raw["games"][0]["home_team"] = "LAL"
        self.assertEqual(convert(slate(), raw, NOW)[1]["confirmed_teams"], 0)
        after = dt.datetime(2026, 11, 7, 0, 1, tzinfo=dt.timezone.utc)
        self.assertEqual(convert(slate(), snapshot(), after)[0]["games"], [])

    def test_no_permission_and_stale_capture_raise(self):
        raw = snapshot()
        raw["obtained_with_permission"] = False
        with self.assertRaisesRegex(ValueError, "PERMISSION"):
            convert(slate(), raw, NOW)
        raw = snapshot()
        raw["captured_at_utc"] = "2026-11-06T20:00:00+00:00"
        with self.assertRaisesRegex(ValueError, "STALE"):
            convert(slate(), raw, NOW)


if __name__ == "__main__":
    unittest.main()
