import unittest,datetime as dt
from nba_world.lineups import five,match
class Lineups(unittest.TestCase):
    def test_bench_confirmed_does_not_count(self):
        roster={str(i):{"name":"Player "+str(i)} for i in range(6)}
        p=[{"playerName":"Player "+str(i),"position":pos,"lineupStatus":"Confirmed","rosterStatus":"Active"}
           for i,pos in enumerate(["PG","SG","SF","PF","C","Bench"])]
        ids,reason=five({"players":p},roster)
        self.assertEqual(len(ids),5);self.assertEqual(reason,"CONFIRMED_FIVE")
        p[0]["lineupStatus"]="Expected"
        self.assertFalse(five({"players":p},roster)[0])
    def test_late_source_rejected(self):
        g={"date":"2026-11-28T23:00:00Z"}
        at=dt.datetime(2026,11,28,23,tzinfo=dt.timezone.utc)
        self.assertEqual(match(g,{}, {},{"observed_at":at.isoformat()},at)[1],"STALE_OR_LATE")
