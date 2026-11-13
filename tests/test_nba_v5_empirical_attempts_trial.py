"""Freeze the 3PA -> made-three challenger contract before running holdout."""
import datetime as dt
from types import SimpleNamespace
import unittest
import numpy as np
from nba.nba_v5_empirical_stat_engine import simulate_empirical_game


def team(name):
    return SimpleNamespace(ids=[name],starter=np.array([True]),
       p_play=np.array([1.0]),avail_corr=None,
       return_mult=None,start_mult=1.0,minutes_cap=None)


def history(name):
    return {name:[{"date":dt.date(2026,1,d),"min":30.0,
        "pts":15,"reb":5,"ast":3,"tpm":1,"tpa":1,
        "stl":1,"blk":0,"tov":1,"fga":8,"fgm":5,"fta":3,"ftm":2,
        "start":True}
       for d in range(1,23)]}


def go(h, **k):
    return simulate_empirical_game(team("home"),team("away"),
      {**history("home"),**history("away"),**h},
      dt.date(2026,2,1),worlds=2000,seed=477,**k)


class ThreeAttemptTrialTest(unittest.TestCase):
    def test_default_model_preserves_old_sampling(self):
        a=go({})
        b=go({},three_attempts_model=False)
        for side in ("home","away"):
            for market in ("min","pts","reb","ast","tpm","stl","blk","fga"):
                np.testing.assert_array_equal(a[side][market],b[side][market])

    def test_three_attempts_are_modeled_before_makes(self):
        a=go({})
        b=go({},three_attempts_model=True)
        self.assertGreater(a["home"]["tpm"].mean(),.9)
        self.assertLess(b["home"]["tpm"].mean(),.6)
        self.assertGreater(b["home"]["tpm"].mean(),.2)
        self.assertTrue(np.all(b["home"]["tpm"]<=b["home"]["fgm"]))
        self.assertTrue(np.all(b["home"]["fgm"]<=b["home"]["fga"]))
        self.assertTrue(np.all(b["home"]["pts"]>=3*b["home"]["tpm"]))
        self.assertEqual(b["world_kind"],"RESEARCH_THREE_ATTEMPTS_SHRUNK_ACCURACY")

    def test_is_deterministic_and_never_uses_target_date_box(self):
        a=go({},three_attempts_model=True)
        b=go({},three_attempts_model=True)
        np.testing.assert_array_equal(a["away"]["tpm"],b["away"]["tpm"])
        future={"home":history("home")["home"]+[{
            **history("home")["home"][-1],"date":dt.date(2026,2,1),
            "tpm":10,"tpa":10}]}
        c=go(future,three_attempts_model=True)
        np.testing.assert_array_equal(a["home"]["tpm"],c["home"]["tpm"])

    def test_requires_actual_historical_attempts(self):
        h=history("home")
        h["home"]=[{k:v for k,v in x.items() if k!="tpa"} for x in h["home"]]
        with self.assertRaisesRegex(ValueError,"REAL_3PA"):
            go(h,three_attempts_model=True)


if __name__=="__main__":
    unittest.main()
