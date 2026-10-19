import copy
import unittest
from nba.nba_v1_player_model import (parse_final_boxscore,project_player,
                                     parse_minutes,parse_made)

def summary():
    participants=[]
    for team in ("1","2"):
        rows=[]
        for i in range(6):
            athlete={"id":str(int(team)*1000+i),"displayName":f"Team {team} Player {i}"}
            row={"athlete":athlete,"starter":i<5,"stats":
                 ["32","18","7","4","2-6"]}
            if i==5:row["stats"]=[]
            rows.append(row)
        participants.append({"team":{"id":team},
          "statistics":[{"labels":["MIN","PTS","REB","AST","3PT"],"athletes":rows}]})
    return {"boxscore":{"players":participants}}

class BoxscoreIntegrity(unittest.TestCase):
    def test_independent_player_stat_identity_and_minutes(self):
        players,audit=parse_final_boxscore(summary(),"401","1 2".split())
        self.assertEqual(len(players),10)
        self.assertEqual(audit["missing_dnp"],2)
        self.assertEqual(players[0]["points"],18)
        self.assertEqual(players[0]["three_pointers_made"],2)
        self.assertEqual(players[0]["minutes"],32)
        self.assertFalse(audit["roster_status"].startswith("VERIFIED_PREGAME"))
    def test_box_score_wrong_game_team_identity_refused(self):
        with self.assertRaisesRegex(ValueError,"participants"):
            parse_final_boxscore(summary(),"401",["1","3"])
        dup=summary()
        dup["boxscore"]["players"][1]["team"]["id"]="1"
        with self.assertRaisesRegex(ValueError,"duplicated"):
            parse_final_boxscore(dup,"401",["1","2"])
    def test_missing_or_ambiguous_stat_source_rejected_no_zero_assumption(self):
        p=summary()
        p["boxscore"]["players"][0]["statistics"][0]["labels"]=["MIN","PTS","REB"]
        with self.assertRaisesRegex(ValueError,"ambiguous/missing"):
            parse_final_boxscore(p,"401",["1","2"])
        p=summary()
        p["boxscore"]["players"][0]["statistics"][0]["athletes"][0]["stats"]=["20","3"]
        with self.assertRaisesRegex(ValueError,"misaligned"):
            parse_final_boxscore(p,"401",["1","2"])
    def test_minutes_and_three_point_made_stat_validation(self):
        self.assertEqual(parse_minutes("32:30"),32.5)
        self.assertEqual(parse_made("4-7"),4)
        with self.assertRaises(ValueError):parse_minutes("1:61")
        with self.assertRaises(ValueError):parse_made("6-4")
        p=summary()
        p["boxscore"]["players"][0]["statistics"][0]["athletes"][0]["stats"]=[
            "32","5","7","4","3-6"]
        with self.assertRaisesRegex(ValueError,"3-pointers exceed"):
            parse_final_boxscore(p,"401",["1","2"])
    def test_minutes_are_the_first_stage_not_naive_last_game_points(self):
        h=[{"minutes":35.0,"points":20,"rebounds":9,
            "assists":6,"three_pointers_made":3} for _ in range(8)]
        p,err=project_player(h,9,9,10)
        self.assertIsNone(err)
        self.assertGreater(p["conditional_minutes_mean"],23)
        self.assertLess(p["conditional_minutes_mean"],35)
        self.assertTrue(p["research_only"])
        self.assertFalse(p["game_day_starter_certified"])
        self.assertIn("points",p["conditional_stat_means"])
    def test_never_fake_pregame_active_or_rookie_history(self):
        h=[{"minutes":34.0,"points":22,"rebounds":8,
            "assists":4,"three_pointers_made":2} for _ in range(6)]
        self.assertEqual(project_player(h[:3],8,8,9)[1],
                         "INSUFFICIENT_REAL_PLAYER_GAME_HISTORY")
        self.assertEqual(project_player(h,11,11,19)[1],
                         "PLAYER_NOT_RECENTLY_OBSERVED_ON_TEAM")
        p,err=project_player(h,11,11,12)
        self.assertIsNone(err)
        self.assertLess(p["model_p_play_not_roster_verified"],1.0)
        self.assertFalse(p["injury_and_minutes_limit_certified"])
if __name__=="__main__":
    unittest.main()
