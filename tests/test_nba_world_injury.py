import unittest,datetime as dt
from nba_world.injury import parse,gate
class InjuryTests(unittest.TestCase):
    def test_missing_report_not_healthy(self):
        self.assertEqual(gate(None,None,None),"UNREPORTED")
    def test_recent_report_and_no_future(self):
        at=dt.datetime(2026,11,28,17,tzinfo=dt.timezone.utc)
        r={"observed_at":at.isoformat()}
        b={"injuries":[{"id":"1","injuries":[{"athlete":{"id":"123"},"status":"Out","date":"2026-11-28T12:00:00Z"}]}]}
        o=parse(b,r)["observations"][0]
        self.assertEqual(gate({"row":o,"captured":at.isoformat()},at+dt.timedelta(minutes=5),at+dt.timedelta(hours=2)),"ABSTAIN_REPORTED_OUT")
        self.assertEqual(gate({"row":o,"captured":at.isoformat()},at-dt.timedelta(minutes=1),at+dt.timedelta(hours=2)),"SOURCE_STALE")
    def test_duplicates_quarantined(self):
        b={"injuries":[{"id":"1","injuries":[{"athlete":{"id":"123"},"status":"Out"},{"athlete":{"id":"123"},"status":"Probable"}]}]}
        self.assertEqual(parse(b,{"observed_at":"2026-11-28T17:00:00Z"})["observations"],[])
