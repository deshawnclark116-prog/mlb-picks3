import unittest
import numpy as np
from nba_world.model import World,minute_budget,allocation,simulate
from nba_world.data import History,N
class TestWorld(unittest.TestCase):
    def test_exact_minutes(self):
        w=np.ones((2,N));mask=np.ones((2,N),bool)
        w[0,0]=1e6;mask[1,:-1]=False
        m=minute_budget(w,np.array([240.,265.]),mask)
        np.testing.assert_allclose(m.sum(axis=1),[240,265])
        self.assertLessEqual(m[0,0],48.00001)
        self.assertEqual(m[1,-1],265)
    def test_count_conservation(self):
        rng=np.random.default_rng(1);n=np.array([5,16])
        w=np.ones((2,N));w[:,0]=0
        a=allocation(n,w,rng)
        np.testing.assert_equal(a.sum(axis=1),n)
        np.testing.assert_equal(a[:,0],0)
    def test_world(self):
        g={"date":"2025-11-03T23:00:00Z","away":{"id":"1"},"home":{"id":"2"},"players":[]}
        h=History()
        a=h.make(g,{"1":[str(i) for i in range(10)],"2":[str(i+100) for i in range(10)]},with_outcomes=False)
        model=World().eval();world=simulate(model,a,100,3)
        for t in world:
            self.assertTrue(np.all(t["made"]<=t["attempts"]))
            self.assertTrue(np.all(t["stats"]>=0))
            np.testing.assert_equal(t["stats"][:,:,0],2*t["made"][:,:,0]+3*t["made"][:,:,1]+t["made"][:,:,2])
            self.assertTrue(np.all(t["stats"][:,:,2].sum(axis=1)<=t["made"][:,:,:2].sum(axis=(1,2))))
            self.assertTrue(np.all(np.isin(np.round(t["minutes"].sum(axis=1)),[240,265])))
    def test_target_game_player_stats_not_input(self):
        h=History()
        g={"date":"2025-11-03T23:00:00Z","away":{"id":"1"},"home":{"id":"2"},"players":[]}
        a=h.make(g,{"1":["a"],"2":["b"]},with_outcomes=False)
        g["players"]=[{"id":"a","team":"1","min":40,"pts":50}]
        b=h.make(g,{"1":["a"],"2":["b"]},with_outcomes=False)
        for k in ("seq","extra","ctx","mask","y"):np.testing.assert_equal(a[k],b[k])
if __name__=="__main__":unittest.main()
