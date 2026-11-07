"""Dispatch only once per confirmed five; allow late starter changes pretip."""
import datetime as dt
import unittest

from nba.nba_v5_daily_lineups_trigger import detect

NOW=dt.datetime(2026,11,6,23,35,tzinfo=dt.timezone.utc)
TIP="2026-11-07T00:00:00+00:00"


def evidence(starters=None, tip=TIP):
    return {"provider":"NBA_OFFICIAL_DAILY_LINEUPS",
            "captured_at_utc":NOW.isoformat(),
            "games":[{"game_id":"4011111", "tipoff_utc":tip,
                      "teams":[{"team_id":"30","lineup_state":"CONFIRMED",
                                "starters":starters or ["1","2","3","4","5"]},
                               {"team_id":"2","lineup_state":"NOT_POSTED",
                                "starters":[]}]}]}


class TriggerTests(unittest.TestCase):
    def test_new_confirmed_five_triggers_once_only(self):
        first=detect(evidence(),{},NOW)
        self.assertTrue(first["changed"])
        self.assertEqual(first["changed_teams"],["4011111:30"])
        again=detect(evidence(),first["state"],NOW)
        self.assertFalse(again["changed"])
        self.assertEqual(again["changed_teams"],[])

    def test_late_lineup_change_retriggers(self):
        state=detect(evidence(),{},NOW)["state"]
        updated=detect(evidence(["1","2","3","4","6"]),state,NOW)
        self.assertEqual(updated["changed_teams"],["4011111:30"])

    def test_order_of_same_five_does_not_trigger(self):
        state=detect(evidence(),{},NOW)["state"]
        res=detect(evidence(["5","4","3","2","1"]),state,NOW)
        self.assertFalse(res["changed"])

    def test_projected_or_incomplete_five_ignored(self):
        a=evidence()
        a["games"][0]["teams"][0]["lineup_state"]="NOT_POSTED"
        self.assertFalse(detect(a,{},NOW)["changed"])
        a=evidence(["1","2","3","4","4"])
        self.assertFalse(detect(a,{},NOW)["changed"])

    def test_never_run_after_tip_or_inside_last_five_minutes(self):
        after=NOW+dt.timedelta(minutes=26)
        src=evidence()
        src["captured_at_utc"]=after.isoformat()
        self.assertFalse(detect(src,{},after)["changed"])
        near=NOW+dt.timedelta(minutes=21)
        src["captured_at_utc"]=near.isoformat()
        self.assertFalse(detect(src,{},near)["changed"])

    def test_stale_or_future_capture_is_invalid(self):
        with self.assertRaises(ValueError):
            detect(evidence(),{},NOW+dt.timedelta(minutes=20))
        future=NOW-dt.timedelta(minutes=1)
        with self.assertRaises(ValueError):
            detect(evidence(),{},future)


if __name__ == "__main__":
    unittest.main()
