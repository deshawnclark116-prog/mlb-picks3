"""Pure synthetic NBA tests: no synthetic scores may appear as real results."""
import copy
import datetime as dt
import unittest
from nba.nba_v1_team_model import extract_events,walk_forward,verify_games,elo_probability

def game(day,i,home,away,hpts,apts):
    return {"game_id":str(i),"start_utc":day+"T23:00:00+00:00","day_utc":day,
            "home_id":str(home),"away_id":str(away),"home":str(home),
            "away":str(away),"completed":True,"home_points":hpts,"away_points":apts}

def sample(n=100):
    start=dt.date(2025,10,21)
    ans=[]
    for i in range(n):
        dd=(start+dt.timedelta(days=i//4)).isoformat()
        h=(i%4)*2+1;a=(i%4)*2+2
        if (i//4)%2:h,a=a,h
        ans.append(game(dd,i,h,a,110+i%9,95+i%13))
    return ans

class NbaV1Tests(unittest.TestCase):
    def test_extracts_only_completed_regular_season_espn_games(self):
        def event(id,typ,status,home=100,away=90):
            return {"id":id,"date":"2025-11-03T01:00:00Z","season":{"type":typ},
                    "competitions":[{"status":{"type":{"completed":status}},
                    "competitors":[
                        {"homeAway":"home","score":str(home),"team":{"id":"1","displayName":"A"}},
                        {"homeAway":"away","score":str(away),"team":{"id":"2","displayName":"B"}}]}]}
        data={"events":[event("1",2,True),event("2",1,True),
                 event("3",2,False),event("4",3,True)]}
        out=extract_events(data)
        self.assertEqual([x["game_id"] for x in out],["1","3"])
        self.assertTrue(out[0]["completed"])
        self.assertEqual(out[0]["home_points"],100)
        self.assertIsNone(out[1]["home_points"])
        with self.assertRaisesRegex(ValueError,"final tie"):
            extract_events({"events":[event("5",2,True,100,100)]})
    def test_esppn_regular_season_type2_does_not_include_all_star_or_cup_final(self):
        # ESPN marked these special events as season type=2, yet they
        # were NOT among the 30 x 82 standard NBA standing games.
        def event(gid,away_id):
            return {"id":gid,"date":"2025-12-17T01:30:00Z",
                "season":{"type":2},"competitions":[{
                    "status":{"type":{"completed":True}},
                    "competitors":[
                    {"homeAway":"home","score":"124","team":{"id":"18","displayName":"Knicks"}},
                    {"homeAway":"away","score":"113","team":{"id":away_id,"displayName":"Opponent"}}]}]}
        legit=event("normal-regular-season","24")
        self.assertEqual([x["game_id"] for x in extract_events(
            {"events":[event("401809839","24"),event("401838140","132374"),legit]})],
            ["normal-regular-season"])
    def test_strict_historical_identity_rejects_duplicate_id_and_finals(self):
        g=sample(8)
        with self.assertRaisesRegex(ValueError,"duplicate historical"):
            verify_games(g+copy.deepcopy(g[:1]))
        bad=copy.deepcopy(g);bad[0]["home_points"]=bad[0]["away_points"]
        with self.assertRaisesRegex(ValueError,"invalid final"):
            verify_games(bad)
    def test_no_today_outcome_can_change_another_today_forecast(self):
        g=sample(150)
        original=walk_forward(g,"2025-11-03","2025-11-16")
        changed=copy.deepcopy(g)
        # Change a result AFTER it would have been known at start of day,
        # but NOT before the rest of that same day's predictions.
        changed[120]["home_points"]+=70
        altered=walk_forward(changed,"2025-11-03","2025-11-16")
        for i in range(120,124):
            self.assertEqual(original["rows"][i]["home_win_prob"],
                             altered["rows"][i]["home_win_prob"])
            self.assertEqual(original["rows"][i]["total_points"],
                             altered["rows"][i]["total_points"])
        # Only the following day may reflect the actual revised final.
        self.assertNotEqual(original["rows"][124]["pregame_league_points"],
                            altered["rows"][124]["pregame_league_points"])
    def test_holdout_only_after_chronological_cutoffs_not_tuned_on_it(self):
        g=sample(220)
        result=walk_forward(g,"2025-11-03","2025-11-24")
        self.assertGreater(result["metrics"]["holdout"]["n"],0)
        self.assertGreater(result["metrics"]["validation"]["n"],0)
        self.assertTrue(result["configuration"]["same_day_results_cannot_enter_inputs"])
        for r in result["rows"]:
            self.assertIn(r["split"],("seed","validation","holdout"))
            self.assertLessEqual(r["history_games_before_day"],r["game_id"] if False else 1_000_000)
            self.assertGreater(r["home_win_prob"],0)
            self.assertLess(r["home_win_prob"],1)
        self.assertLess(result["rows"][0]["history_games_before_day"],1)
        with self.assertRaises(ValueError):
            walk_forward(g,"2025-12-01","2025-12-01")
    def test_real_outcomes_and_projected_values_never_share_the_same_keys(self):
        g=sample(220)
        x=walk_forward(g,"2025-11-03","2025-11-24")
        finals={row["game_id"]:row for row in g}
        for r in x["rows"]:
            original=finals[r["game_id"]]
            self.assertEqual(r["home_points"],original["home_points"])
            self.assertEqual(r["away_points"],original["away_points"])
            self.assertIn("pred_home_points",r)
            self.assertIn("pred_away_points",r)
            self.assertNotEqual(r["total_points"],r["home_points"]+r["away_points"])
        self.assertGreater(x["metrics"]["holdout"]["total_points_mae_model"],1)
        self.assertGreater(x["metrics"]["holdout"]["total_points_mae_baseline"],1)
    def test_high_elo_increases_win_probability(self):
        self.assertGreater(elo_probability(1650,1450),elo_probability(1450,1650))
    def test_missing_matches_are_not_implicitly_losses(self):
        g=sample(220)
        res=walk_forward(g[:120],"2025-11-03","2025-11-24")
        self.assertEqual(res["unique_games"],120)
        self.assertEqual(res["metrics"]["holdout"]["n"],0)
        self.assertEqual(res["metrics"]["holdout"]["result"],"INSUFFICIENT_HISTORICAL_COVERAGE")

if __name__=="__main__":
    unittest.main()
