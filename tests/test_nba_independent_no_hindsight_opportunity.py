"""Verify NBA independent role architecture uses no future boxscore data."""
import copy
import datetime as dt
import unittest
from nba.nba_independent_no_hindsight_opportunity_lab import (
    FEATURES,make_features,dataset,result_stats,game_cluster_gain_ci)

def fixture():
    games=[]
    for day in range(1,10):
        ps=[]
        for side,team in (("home","1"),("away","2")):
            for i in (0,1):
                ps.append({"id":team+str(i),"team":team,"side":side,
                   "min":30.0 if i==0 else 18.0,"start":i==0,
                   "pts":20 if i==0 else 8,"reb":5,"ast":3,"tpm":2,
                   "fga":14,"tpa":5,"fta":3,"oreb":1,"tov":2})
        games.append({"game_id":str(100+day),
           "date":f"2025-11-{day:02d}T00:00:00Z",
           "home":{"id":"1","score":90},"away":{"id":"2","score":85},
           "players":ps})
    return games


class ResearchIntegrity(unittest.TestCase):
    def test_future_boxscores_cannot_affect_same_day_features(self):
        orig=fixture()
        changed=copy.deepcopy(orig)
        changed[-1]["players"][0]["min"]=48
        changed[-1]["players"][0]["pts"]=100
        changed[-1]["players"].append({
            **changed[-1]["players"][1],
            "id":"99","min":10,"pts":50
        })
        a=dataset(orig)
        b=dataset(changed)
        def row(rows):
            return next(x for x in rows if x["date"]=="2025-11-09"
                       and x["player"]=="10" and x["market"]=="points")
        self.assertEqual(row(a)["features"],row(b)["features"])
        self.assertEqual(row(a)["prior_rate"],row(b)["prior_rate"])
        self.assertNotEqual(row(a)["actual"],row(b)["actual"])
        self.assertEqual(len(row(a)["features"]),len(FEATURES))

    def test_same_day_history_cannot_be_used(self):
        h=[{"date":"2025-11-09","min":20,"pts":5,"reb":3,"ast":2,
            "tpm":1,"fga":8,"tpa":3,"fta":2,"start":False}]*5
        team=[{"poss":100,"pts_allowed":99}]*3
        with self.assertRaisesRegex(ValueError,"SAME_DAY"):
            make_features(h,team,team,dt.date(2025,11,9),"home","pts")

    def test_missing_history_never_invented(self):
        h=[{"date":"2025-11-01","min":20,"pts":5,"reb":3,"ast":2,
            "tpm":1,"fga":8,"tpa":3,"fta":2,"start":False}]*4
        team=[{"poss":100,"pts_allowed":99}]*3
        self.assertIsNone(make_features(h,team,team,dt.date(2025,11,9),"home","pts"))

    def test_numeric_scoring_stays_same_player_same_stat(self):
        rows=[{"game":"x","player":"a","market":"points","actual":10},
              {"game":"x","player":"b","market":"points","actual":20}]
        vals={("x","a","points"):{"baseline":9},
              ("x","b","points"):{"baseline":25}}
        m=result_stats(rows,vals,"baseline")
        self.assertEqual(m["mae"],3)
        self.assertEqual(m["within_2_or_5"],1)
        with self.assertRaisesRegex(ValueError,"UNPAIRED"):
            result_stats(rows,{}, "baseline")

    def test_game_cluster_paired_ci_same_rows_no_selective_omission(self):
        rows=[]
        predictions={}
        for i in range(20):
            for j in range(4):
                k=(str(i),str(j),"points")
                rows.append({"game":str(i),"player":str(j),"market":"points",
                             "actual":20})
                predictions[k]={"baseline":25,"direct":23,
                                "minute_factorized":21}
        self.assertEqual(game_cluster_gain_ci(
            rows,predictions,"direct",iters=100),[2.0,2.0])
        self.assertEqual(game_cluster_gain_ci(
            rows,predictions,"minute_factorized",iters=100),[4.0,4.0])

if __name__=="__main__":
    unittest.main()
