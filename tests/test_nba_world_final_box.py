import unittest
from nba_world.prospective_grade import final
class FinalBoxTests(unittest.TestCase):
    def test_pending_not_graded(self):
        self.assertIsNone(final({"header":{"competitions":[{"status":{"type":{"name":"STATUS_IN_PROGRESS","completed":False}}}]}}))
    def test_final_must_reconcile(self):
        b={"header":{"competitions":[{"status":{"type":{"name":"STATUS_FINAL","completed":True}},
           "competitors":[{"team":{"id":"1"},"score":"100"},{"team":{"id":"2"},"score":"99"}]}]},"boxscore":{"players":[]}}
        with self.assertRaises(ValueError):final(b)
