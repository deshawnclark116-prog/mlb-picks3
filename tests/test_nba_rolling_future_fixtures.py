import datetime as dt
import unittest
from nba.nba_rolling_future_fixtures import capture,SCHEMA
UTC=dt.timezone.utc
NOW=dt.datetime(2026,10,20,16,0,tzinfo=UTC)

def event(gid, when, status=False, season=2):
    def competitor(side,tid,name):
        return {"homeAway":side,"team":{"id":tid,"displayName":name},
                "score":"101" if side=="home" else "100"}
    return {"id":gid,"date":when,"season":{"type":season},
            "competitions":[{"competitors":[competitor("home","2","Boston Celtics"),
                                            competitor("away","8","Detroit Pistons")],
                             "status":{"type":{"completed":status}}}]}

def fetch(d):
    if d==NOW.date():
        return d.isoformat(),{"events":[
            event("future1","2026-10-20T23:30:00Z"),
            event("already1","2026-10-20T14:00:00Z"),
            event("final1","2026-10-20T12:00:00Z",True),
            event("preseason1","2026-10-20T23:30:00Z",False,1)]}
    return d.isoformat(),{"events":[event("future2","2026-10-21T23:30:00Z")]}

class TestRollingNbaFixtures(unittest.TestCase):
    def test_future_only_strict_original_identity(self):
        a=capture(NOW,2,fetch)
        self.assertEqual(a["schema"],SCHEMA)
        self.assertEqual(a["future_games"],2)
        self.assertEqual([x["game_id"] for x in a["games"]],["future1","future2"])
        self.assertEqual(a["official_bets"],0)
        self.assertTrue(a["no_post_tip_reconstruction"])
        self.assertTrue(all(x["model_prediction"] is None for x in a["games"]))
        self.assertEqual(len(a["scoreboard_source_receipts"]),2)
        self.assertEqual(len(a["scoreboard_source_receipts"][0]["sha256"]),64)

    def test_fails_closed_wrong_day_or_conflicting_identity(self):
        def wrong(d):return "2026-10-19",{"events":[]}
        with self.assertRaisesRegex(ValueError,"WRONG_SCOREBOARD_DATE"):
            capture(NOW,1,wrong)
        def conflict(d):
            a=event("future1","2026-10-20T23:30:00Z")
            b=event("future1","2026-10-20T23:45:00Z")
            return d.isoformat(),{"events":[a,b]}
        with self.assertRaisesRegex(ValueError,"SAME_GAME_CONFLICT"):
            capture(NOW,1,conflict)

    def test_rejects_future_leak_and_invalid_range(self):
        with self.assertRaisesRegex(ValueError,"NAIVE"):
            capture(NOW.replace(tzinfo=None),1,fetch)
        with self.assertRaisesRegex(ValueError,"UNSAFE_DATE_RANGE"):
            capture(NOW,30,fetch)
        with self.assertRaisesRegex(ValueError,"OUTSIDE"):
            capture(dt.datetime(2027,4,15,tzinfo=UTC),1,fetch)

if __name__=="__main__":unittest.main()
