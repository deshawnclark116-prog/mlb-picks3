import unittest
import numpy as np
from nba_world.analog import Retrieval,prob,weighted,ARMS
from datetime import date
class AnalogTests(unittest.TestCase):
    def test_prob_monotonic(self):
        v=np.array([1,3,5]);w=np.array([.2,.3,.5])
        self.assertGreater(prob(v,w,3),prob(v,w,5))
    def test_weights(self):
        h=Retrieval()
        for i in range(1,7):
            g={"game_id":str(i),"date":f"2025-11-0{i}T23:00:00Z","away":{"id":"1"},"home":{"id":"2"},
                "players":[{"id":"a","team":"1","side":"away","min":30,"pts":20+i},{"id":"b","team":"2","side":"home","min":25,"pts":12}]}
            h.add(g)
        ctx=h.context_for("1",["a"],date(2025,11,10))
        dist,f=h.query("a","1","2",date(2025,11,10),False,["a"],ctx)
        for arm in ARMS:
            v,w,m=dist[arm];self.assertAlmostEqual(w.sum(),1)
            self.assertGreaterEqual(weighted(v,w)[0],21)
            self.assertLessEqual(weighted(v,w)[0],26)
        self.assertTrue(np.isfinite(f).all())
    def test_no_history_abstains(self):
        h=Retrieval()
        self.assertIsNone(h.query("a","1","2",date(2025,11,10),False,["a"],{})[0])
if __name__=="__main__":unittest.main()
