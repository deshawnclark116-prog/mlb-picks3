import unittest
import numpy as np
from nba.nba_v6_foundation import State, prob, bootstrap, opportunities

class FoundationTests(unittest.TestCase):
    def test_roster_and_feature_uses_only_ingested_games(self):
        s=State()
        g={"date":"2025-10-01T23:00:00Z","home":{"id":"1"},"away":{"id":"2"},
           "players":[{"id":"a","team":"1","min":30,"pts":20,"start":True},
                      {"id":"b","team":"2","min":25,"pts":10,"start":True}]}
        s.ingest(g)
        self.assertEqual(s.roster("1"),["a"])
        x,p,raw,m=s.features("a","1","2",True,"2025-10-03",["a"])
        self.assertTrue(np.isfinite(x).all())
        self.assertEqual(raw[0],20)
        self.assertEqual(m,30)
        self.assertTrue(all(0<=v<=1 for v in p))
    def test_probability_monotone(self):
        r=np.array([-2.,-1.,0.,1.,2.])
        self.assertGreaterEqual(prob(r,5,3),prob(r,5,7))
        self.assertGreater(prob(r,5,100),0)
        self.assertLess(prob(r,5,0),1)
    def test_shot_opportunities(self):
        self.assertEqual(opportunities({"fga":12,"tpa":5,"fta":3,"reb":6,"ast":4}),[7,5,3,6,4])
    def test_game_cluster_bootstrap(self):
        self.assertEqual(bootstrap([("a",1.),("b",1.)]),[1.,1.])
if __name__=="__main__":unittest.main()
