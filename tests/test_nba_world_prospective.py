import unittest,datetime as dt
from nba_world.prospective import parse_schedule,parse_roster
class ProspectiveTests(unittest.TestCase):
    def test_pretip_schedule_only(self):
        now=dt.datetime(2026,11,28,17,tzinfo=dt.timezone.utc)
        def event(id,state):
            return {"id":id,"date":"2026-11-28T23:00:00Z","competitions":[{"status":{"type":{"state":state}},
                "competitors":[{"homeAway":"home","team":{"id":"1"}},{"homeAway":"away","team":{"id":"2"}}]}]}
        self.assertEqual([g["game_id"] for g in parse_schedule({"events":[event("a","pre"),event("b","in")]},now)],["a"])
    def test_roster_not_availability(self):
        r=parse_roster({"athletes":[{"id":str(i),"fullName":"Player "+str(i)} for i in range(10)]},"1")
        self.assertEqual(len(r),10)
        self.assertNotIn("confirmed_starter",r["1"])
    def test_duplicate_rejected(self):
        with self.assertRaises(ValueError):
            parse_roster({"athletes":[{"id":"1","fullName":"P"}]*10},"1")

    def test_precise_minutes(self):
        from nba_world.refresh import parse_minutes,pair
        self.assertAlmostEqual(parse_minutes("0:30"),.5)
        self.assertEqual(pair("3-7"),(3,7))
        with self.assertRaises(ValueError):pair("8-7")
        with self.assertRaises(ValueError):parse_minutes("1:60")
