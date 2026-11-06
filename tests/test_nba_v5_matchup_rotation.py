"""Opponent prior style must never leak target game data into rotation."""
import datetime as dt
import unittest
import numpy as np

from nba.nba_v5_matchup_rotation import (
    OpponentRotationState,opponent_three_share,SEGMENTS,HIGH_THREES_SHARE
)
from nba.nba_v5_sim import League, TeamInput,build_profile,simulate_game,SEG


class MatchupRotationTests(unittest.TestCase):
    def test_opponent_3pt_style_is_strictly_earlier_and_requires_history(self):
        start=dt.date(2026,10,1)
        rows=[]
        for i in range(15):
            rows.append({"date":start+dt.timedelta(days=i),
                         "own":{"fga":82.0,"tpa":20.0 if i<8 else 55.0}})
        self.assertIsNone(opponent_three_share(rows,start+dt.timedelta(days=7)))
        p=opponent_three_share(rows,start+dt.timedelta(days=8))
        self.assertAlmostEqual(p,20/82)
        self.assertLess(p,HIGH_THREES_SHARE)
        after=opponent_three_share(rows,start+dt.timedelta(days=15))
        self.assertGreater(after,p)

    def test_player_minutes_adjusted_only_for_matching_historical_styles(self):
        state=OpponentRotationState()
        hi=np.full(SEGMENTS,.9)
        lo=np.full(SEGMENTS,.2)
        for j in range(24):
            r=.50 if j<12 else .28
            vector=hi if j<12 else lo
            state.records[("1","p0")].append((r,vector.copy()))
        base=np.full((2,SEGMENTS),.56)
        h,a=state.for_roster("1",["p0","unknown"],.50,base)
        self.assertEqual(a["supported_players"],1)
        self.assertGreater(h[0,0],base[0,0])
        self.assertLessEqual(h[0,0]/base[0,0],1.14+1e-6)
        self.assertEqual(h[1,0],base[1,0])
        l,_=state.for_roster("1",["p0","unknown"],.28,base)
        self.assertLess(l[0,0],base[0,0])
        missing,_=state.for_roster("1",["unknown"],.50,base[:1])
        self.assertIsNone(missing)

    def test_completed_matchup_add_only_uses_proven_player_and_prior_opponent(self):
        state=OpponentRotationState()
        pb={"a":np.ones(SEGMENTS)*120,"b":np.ones(SEGMENTS)*60}
        g={"home":{"id":"1"},"away":{"id":"2"},
           "players":[{"id":"a","team":"1"},{"id":"b","team":"2"},
                      {"id":"c","team":"2"}]}
        state.add_finished_game(g,pb,{"1":.45,"2":.32})
        self.assertEqual(len(state.records[("1","a")]),1)
        self.assertEqual(state.records[("1","a")][0][0],.32)
        self.assertEqual(state.records[("2","b")][0][0],.45)
        self.assertNotIn(("2","c"),state.records)

    def test_switch_off_is_bitwise_old_champion_and_on_preserves_team_math(self):
        def roster():
            L=League()
            L.per_min={"fga":.4,"fgm":.18,"tpa":.14,"tpm":.05,"fta":.13,
                "ftm":.1,"ast":.1,"oreb":.03,"dreb":.11,"stl":.03,"blk":.02,
                "tov":.07,"pf":.08,"pts":.45}
            line={"min":30,"fga":12,"fgm":5,"tpa":4,"tpm":2,"fta":4,
                "ftm":3,"ast":3,"oreb":1,"dreb":4,"stl":1,"blk":.5,
                "tov":2,"pf":2,"pts":15,"start":True}
            n=10
            pr=[build_profile([line]*12,L) for _ in range(n)]
            pres=np.tile(np.array([.75 if i<5 else .3 for i in range(n)])[:,None],(1,SEG))
            t=TeamInput(ids=[f"p{i}" for i in range(n)],prof=pr,presence=pres,
                 p_play=np.ones(n),starter=np.array([i<5 for i in range(n)]),defence={})
            return t,L
        h,L=roster()
        a,_=roster()
        adjusted=h.presence.copy()
        adjusted[0,:]=.10
        adjusted[5,:]=.90
        h.matchup_presence=adjusted
        tables={"blow":np.ones((4,2)),"foul":np.ones((6,2))}
        base=simulate_game(h,a,L,tables,S=320,pace=98.0,seed=20)
        off=simulate_game(h,a,L,tables,S=320,pace=98.0,seed=20,features={"matchup_rotation":False})
        on=simulate_game(h,a,L,tables,S=320,pace=98.0,seed=20,features={"matchup_rotation":True})
        np.testing.assert_array_equal(base["home"]["min"],off["home"]["min"])
        self.assertFalse(np.array_equal(base["home"]["min"],on["home"]["min"]))
        for side,i in (("home",0),("away",1)):
            np.testing.assert_allclose(on[side]["pts"].sum(axis=1),on["score"][:,i])
            self.assertTrue(np.all(on[side]["tpm"]<=on[side]["fgm"]))


if __name__=="__main__":
    unittest.main()
