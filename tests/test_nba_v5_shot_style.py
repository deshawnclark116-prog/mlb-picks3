"""NBA V5 source-observed shot execution styles and simulator invariants."""
import unittest
import numpy as np

from nba.nba_v5_shot_style import ShotStyleState, family, MAX_STYLE_MULT
from nba.nba_v5_sim import League, TeamInput, SEG, build_profile, simulate_game


def league():
    L=League()
    L.per_min={"fga":.4,"fgm":.18,"tpa":.14,"tpm":.05,"fta":.13,
               "ftm":.1,"ast":.1,"oreb":.03,"dreb":.11,"stl":.03,
               "blk":.02,"tov":.07,"pf":.08,"pts":.45}
    return L


def team(n=10):
    h={"min":30,"fga":12,"fgm":5,"tpa":4,"tpm":2,"fta":4,"ftm":3,
       "ast":3,"oreb":1,"dreb":4,"stl":1,"blk":.5,"tov":2,"pf":2,"pts":15,"start":True}
    prof=[build_profile([h]*12,league()) for _ in range(n)]
    pres=np.tile([.8 if i<5 else .25 for i in range(n)],(SEG,1)).T
    return TeamInput(ids=[f"p{i}" for i in range(n)],prof=prof,presence=pres,
          p_play=np.ones(n),starter=np.array([i<5 for i in range(n)]),defence={})


def pbp(n=200):
    ev=[]
    for i in range(n):
        style="dunk" if i%2==0 else "jump"
        made=(i%10 != 0) if i%2==0 else (i%10==1)
        ev.append([1,600-(i%40), "S2", "1", "p0", "", 2 if made else 0,
                   25,2,style])
    return {"events":ev,"home":"1","away":"2"}


class ShotStyleTests(unittest.TestCase):
    def test_family_is_shot_style_not_possession_play_type(self):
        self.assertEqual(family("dunk"),0)
        self.assertEqual(family("stepback"),1)
        self.assertEqual(family("floater"),2)
        self.assertEqual(family("running"),3)
        self.assertEqual(family("jump"),4)
        self.assertEqual(family("unknown"),4)

    def test_shot_exposure_produces_bounded_mean_neutral_zone_effects(self):
        state=ShotStyleState()
        state.add_game(pbp())
        self.assertEqual(state.audit()["raw_shot_events"],200)
        self.assertEqual(state.audit()["shot_events_with_coordinates"],200)
        prob,mult,diag=state.profile("p0",league())
        self.assertTrue(diag["valid"])
        self.assertEqual(diag["shots"],200)
        self.assertAlmostEqual(prob[0].sum(),1.0)
        self.assertGreater(mult[0,0],mult[0,4])
        self.assertTrue(np.all(mult<=MAX_STYLE_MULT+1e-9))
        self.assertTrue(np.all(mult>=1/MAX_STYLE_MULT-1e-9))
        np.testing.assert_allclose(np.sum(prob*mult,axis=1),np.ones(5),atol=1e-8)

    def test_unobserved_player_has_neutral_effect_and_no_made_up_style(self):
        state=ShotStyleState()
        state.add_game(pbp(15))
        p,m,d=state.profile("p0",league())
        self.assertFalse(d["valid"])
        self.assertTrue(np.all(m==1.0))

    def test_style_sampling_changes_distribution_but_not_game_math(self):
        h,a=team(),team()
        n=len(h.ids)
        # Same zone average, different shot-execution outcomes.
        probs=np.zeros((n,5,5))
        probs[:,:,0]=0.5
        probs[:,:,4]=0.5
        effects=np.ones((n,5,5))
        effects[:,:,0]=1.15
        effects[:,:,4]=0.85
        h.style_probs=probs
        h.style_mult=effects
        h.zf=np.tile(np.array([.30,.20,.10,.15,.25]),(n,1))
        h.zp=np.tile(np.array([.68,.52,.43,.36,.36]),(n,1))
        h.zn=np.full((n,5),40.0)
        L=league()
        tables={"blow":np.ones((4,2)),"foul":np.ones((6,2))}
        original=simulate_game(h,a,L,tables,S=300,pace=98.0,seed=7)
        off=simulate_game(h,a,L,tables,S=300,pace=98.0,seed=7,features={"shot_style":False})
        on=simulate_game(h,a,L,tables,S=300,pace=98.0,seed=7,features={"shot_style":True})
        np.testing.assert_array_equal(original["home"]["pts"],off["home"]["pts"])
        self.assertFalse(np.array_equal(original["home"]["pts"],on["home"]["pts"]))
        for side,k in (("home",0),("away",1)):
            np.testing.assert_allclose(on[side]["pts"].sum(axis=1),on["score"][:,k])
            self.assertTrue(np.all(on[side]["tpm"]<=on[side]["fgm"]))


if __name__=="__main__":
    unittest.main()
