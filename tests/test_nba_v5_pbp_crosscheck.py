import unittest
from nba.nba_v5_pbp_crosscheck import inspect

def game():
    return {"game_id":"1","home":"2","away":"30","events":[
      [1,500,"S2","2","10","",2,None,None],
      [1,480,"S3","30","11","",3,None,None],
      [1,470,"FT","2","10","",1,None,None],
      [1,450,"TO","30","11","",0,None,None]]}

def ref():
    return {"game_id":"1","source":"pbpstats","source_observed_at_utc":"2026-11-05T23:00:00Z",
            "home_team_id":"2","away_team_id":"30","home_points":3,"away_points":3,
            "home_possessions":1,"away_possessions":2}

class CrosscheckTests(unittest.TestCase):
    def test_matches_without_inventing_possessions(self):
        r=inspect([game()],[ref()])
        self.assertEqual(r["matched"],1)
        self.assertEqual(r["results"][0]["reference_possessions"]["home"],1)
    def test_detects_score_disagreement(self):
        x=ref();x["home_points"]=4
        self.assertEqual(inspect([game()],[x])["mismatched"],1)
    def test_rejects_bad_team_mapping(self):
        x=ref();x["away_team_id"]="4"
        self.assertEqual(inspect([game()],[x])["results"][0]["status"],"TEAM_ID_MISMATCH")
    def test_no_reference_is_not_success(self):
        self.assertEqual(inspect([game()],[])["missing"],1)
    def test_requires_provenance(self):
        x=ref();x.pop("source_observed_at_utc")
        with self.assertRaises(ValueError):inspect([game()],[x])
    def test_duplicate_game_is_rejected(self):
        with self.assertRaises(ValueError):inspect([game(),game()],[ref()])

if __name__=="__main__": unittest.main()
