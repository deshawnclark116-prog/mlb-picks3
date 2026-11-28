import unittest
import numpy as np
from datetime import date
from nba_world.distribution import RoleState,own_target,expand,distribution,classifier
class DistributionTests(unittest.TestCase):
    def test_empty_state_features(self):
        h=RoleState();f=h.features("x","1","2",date(2025,11,1),["x"],{})
        self.assertTrue(np.isfinite(f).all())
    def test_targets(self):
        self.assertEqual(own_target(12.59),12)
        self.assertEqual(own_target(12.6),13)
    def test_threshold_monotonic(self):
        x=np.arange(120,dtype=float).reshape(-1,1)/30
        y=np.arange(120)%8
        xx,yy=expand(x,y,3)
        c=classifier(monotonic_cst=[0,-1]).fit(xx,yy)
        p=distribution(c,x[:10],3)
        self.assertTrue(np.all(np.diff(p,axis=1)<=1e-6))
