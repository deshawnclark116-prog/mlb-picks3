"""Prospective-only roster completeness evidence; no future result leakage."""
import datetime as dt
import unittest
from types import SimpleNamespace

from nba.nba_v5_roster_integrity import audit_team, past_team_rotation


def state():
    rosters = {
        "23": [
            (dt.date(2026, 11, 2), {"a", "b", "c", "d", "e", "f"}),
            (dt.date(2026, 11, 4), {"a", "b", "c", "d", "e", "f"}),
            (dt.date(2026, 11, 6), {"a", "b", "c", "d", "e", "f"}),
        ]
    }
    hist = {}
    for p in ("a", "b", "c", "d", "e", "f"):
        hist[p] = [{"date":day, "min":40.0} for day in
                   (dt.date(2026,11,2),dt.date(2026,11,4),
                    dt.date(2026,11,6))]
    hist["a"].append({"date":dt.date(2026,11,7),"min":1.0})
    return SimpleNamespace(v4=SimpleNamespace(team_rosters=rosters),
                           hist=hist)


def game():
    return {"players":[{"id":pid,"team":"23"} for pid in ("a","b","c","d","e","f")]}


class RosterIntegrityTests(unittest.TestCase):
    def test_full_coverage_all_prior_minutes_represented(self):
        rp=state()
        team=SimpleNamespace(team_id="23",ids=("a","b","c","d","e","f"))
        out=audit_team(rp,team,game(),dt.date(2026,11,7))
        self.assertEqual(out["past_games_observed"],3)
        self.assertEqual(out["past_minutes_total"],720.0)
        self.assertEqual(out["represented_fraction"],1)
        self.assertEqual(out["warning"],"NORMAL_RECENT_ROSTER_COVERAGE")

    def test_omission_both_upstream_and_model_are_separated(self):
        rp=state()
        g={"players":[{"id":pid,"team":"23"} for pid in ("a","b","c","d","e")]}
        team=SimpleNamespace(team_id="23",ids=("a","b","c","d"))
        out=audit_team(rp,team,g,dt.date(2026,11,7))
        self.assertEqual(out["represented_fraction"],4/6)
        self.assertEqual(out["missing_from_fixture_prior_minutes"],120.0)
        self.assertEqual(out["missing_from_model_prior_minutes"],120.0)
        self.assertEqual(out["warning"],"MATERIAL_PRIOR_ROTATION_UNREPRESENTED")
        self.assertEqual(out["missing_from_fixture"][0]["player_id"],"f")
        self.assertEqual(out["missing_from_model"][0]["player_id"],"e")

    def test_no_future_game_or_same_day_lookahead(self):
        rp=state()
        raw,n=past_team_rotation(rp,"23",dt.date(2026,11,6))
        self.assertEqual(n,2)
        self.assertEqual(raw["a"],80.0)
        self.assertEqual(sum(raw.values()),480.0)
        self.assertEqual(past_team_rotation(rp,"23",dt.date(2026,11,2)),({},0))

    def test_no_data_warning_does_not_block_predictions(self):
        rp=state()
        rp.v4.team_rosters={}
        team=SimpleNamespace(team_id="23",ids=("a",))
        out=audit_team(rp,team,game(),dt.date(2026,11,7))
        self.assertEqual(out["represented_fraction"],None)
        self.assertEqual(out["warning"],"INSUFFICIENT_PAST_ROTATION_DATA")
        self.assertIn("NO_HARD_GATE",out["status"])

    def test_past_players_who_changed_teams_are_not_added(self):
        rp=state()
        # A later game for a different team in the player history cannot
        # contaminate a 2026-11-06 pregame assessment.
        rp.hist["a"].append({"date":dt.date(2026,11,8),"min":48.0})
        raw,_=past_team_rotation(rp,"23",dt.date(2026,11,6))
        self.assertEqual(raw["a"],80.0)

if __name__=="__main__":
    unittest.main()
