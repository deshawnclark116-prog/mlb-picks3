import unittest
from nba_world.reconcile import load,reconcile
class TestCorrection(unittest.TestCase):
    def test_known_source(self):
        d=load()
        self.assertEqual(len(d),28)
        self.assertEqual(reconcile(d,"401909314","2596112","rebounds",1,2,True,True),(True,2.,True))
        self.assertEqual(reconcile(d,"401909314","2596112","rebounds",0,2,True,True),(False,0,False))
    def test_no_fabrication(self):
        self.assertEqual(reconcile({},"g","p","points",4,4,True,True),(True,4,False))
        self.assertEqual(reconcile({},"g","p","points",4,5,True,True),(False,4,False))
