import unittest
import numpy as np
from nba_world.actions import extract,ActionHistory,E,S
class ActionTests(unittest.TestCase):
    def game(self):
        ps=[]
        for team,side in (("1","away"),("2","home")):
            for i in range(5):
                ps.append({"id":team+str(i),"team":team,"side":side,"min":48,
                           "fga":0,"tpa":0,"fta":0,"ast":0,"oreb":0,"dreb":0})
        return {"game_id":"1","away":{"id":"1"},"home":{"id":"2"},"players":ps}
    def test_missing_trace_does_not_create_minutes(self):
        g=self.game();r=extract(g,{"home":"2","away":"1","events":[]})
        self.assertFalse(r["stints"]);self.assertEqual(r["reason"],"STARTER_IDENTITY")
    def test_independent_action_reconciliation(self):
        g=self.game();g["players"][0]["fga"]=1;g["players"][1]["ast"]=1
        pb={"home":"2","away":"1","events":[[1,700,"S2","1","10","11",2,None,None,"layup"]]}
        r=extract(g,pb)
        self.assertEqual(r["events"]["10"][1],1)
        self.assertEqual(r["events"]["11"][6],1)
    def test_feature_dimensions(self):
        a=ActionHistory({});v=a.features("x","1","2")
        self.assertEqual(len(v),2*(2+2*E+S)+2*(1+E))
        self.assertTrue(np.isnan(v).any())
