"""NBA V5: no future-dependent game-flow shape and consistent possession math."""
import unittest
import numpy as np

from nba.nba_v5_game_flow import GameFlowState, game_cadence
from nba.nba_v5_sim import League, TeamInput, build_profile, SEG, simulate_game


def pbp(rush_last=False):
    ev=[]
    # Count both teams together. Team stamps are deliberately unstable as
    # they are in the real ESPN saved PBP feed.
    for seg in range(24):
        period=seg//6+1
        inside=seg%6
        attempts=13 if rush_last and inside==5 else 7 if rush_last else 9
        for i in range(attempts):
            left=720-inside*120-(i+.5)*110/attempts
            ev.append([period,left,"S2","1" if i%2 else "2","p1","",2 if i%2 else 0])
            if i%4==0:
                ev.append([period,left,"TO","1","p2","",0])
    ev.sort(key=lambda x: (x[0],-x[1]))
    return {"home":"1","away":"2","events":ev}


def team():
    L=League()
    L.per_min={"fga":.4,"tpa":.12,"fta":.13,"ast":.1,"oreb":.03,
               "dreb":.11,"stl":.03,"blk":.02,"tov":.07,"pf":.08}
    h={"min":30,"fga":12,"fgm":5,"tpa":4,"tpm":1,
       "fta":4,"ftm":3,"ast":3,"oreb":1,"dreb":4,
       "stl":1,"blk":.5,"tov":2,"pf":2,"pts":14,"start":True}
    prof=[build_profile([h]*12,L) for _ in range(10)]
    presence=np.tile([.8]*5+[.25]*5,(SEG,1)).T
    t=TeamInput(ids=[f"p{i}" for i in range(10)],prof=prof,presence=presence,
                p_play=np.ones(10),starter=np.array([i<5 for i in range(10)]),defence={})
    return L,t


class FlowTests(unittest.TestCase):
    def test_game_tallies_have_no_dependence_on_mislabeled_team(self):
        g=pbp(True)
        o=game_cadence(g)
        self.assertIsNotNone(o)
        self.assertEqual(o.shape,(24,))
        self.assertAlmostEqual(float(o.sum()),1)
        self.assertGreater(o[5],o[4])
        g2=pbp(True)
        for e in g2["events"]:
            e[3]="1000000"  # erroneous ESPN event team label
        np.testing.assert_array_equal(o,game_cadence(g2))

    def test_prior_shrink_and_normalize_and_cold_start(self):
        st=GameFlowState()
        np.testing.assert_allclose(st.pattern(),np.ones(24))
        for _ in range(60):
            self.assertTrue(st.add_game(pbp(True)))
        v=st.pattern()
        self.assertAlmostEqual(float(v.mean()),1,places=8)
        self.assertTrue(np.all(v>=.8))
        self.assertTrue(np.all(v<=1.2))
        self.assertGreater(v[23],v[21])
        self.assertEqual(st.audit()["games_with_valid_possession_proxies"],60)

    def test_invalid_empty_event_stream_is_not_training_data(self):
        st=GameFlowState()
        self.assertFalse(st.add_game({"events":[]}))
        self.assertEqual(st.games,0)
        self.assertEqual(st.rejected,1)
        self.assertIsNone(game_cadence({"events":[]}))
        np.testing.assert_allclose(st.pattern(),np.ones(24))

    def test_off_flag_is_byte_identical_to_current_v5_and_on_preserves_math(self):
        L,t=team()
        tables={"blow":np.ones((4,2)),"foul":np.ones((6,2))}
        uneven=np.array([1.2]*6+[.8]*6+[.9]*6+[1.1]*6)
        self.assertAlmostEqual(float(uneven.mean()),1)
        tables["possession_shape"]=uneven
        old=simulate_game(t,t,L,tables,S=350,pace=98.0,seed=31)
        disabled=simulate_game(t,t,L,tables,S=350,pace=98.0,seed=31,features={"game_flow":False})
        on=simulate_game(t,t,L,tables,S=350,pace=98.0,seed=31,features={"game_flow":True})
        np.testing.assert_array_equal(old["score"],disabled["score"])
        self.assertFalse(np.array_equal(old["score"],on["score"]))
        for side,k in (("home",0),("away",1)):
            np.testing.assert_allclose(on[side]["pts"].sum(axis=1),on["score"][:,k])
            self.assertTrue(np.all(on[side]["tpm"]<=on[side]["fgm"]))
        with self.assertRaises(ValueError):
            simulate_game(t,t,L,{**tables,"possession_shape":np.array([1.0]*23)},
                          S=30,pace=98.0,seed=31,features={"game_flow":True})


if __name__=="__main__":
    unittest.main()
