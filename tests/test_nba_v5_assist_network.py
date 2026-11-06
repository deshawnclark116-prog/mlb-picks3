"""Strict named-assist and possession simulator experiments."""
import unittest
from types import SimpleNamespace

import numpy as np

from nba.nba_v5_assist_network import AssistNetworkState
from nba.nba_v5_sim import League, TeamInput, SEG, build_profile, simulate_game


def make_pbp(num=30):
    starters={"1":["a","b","c","d","e"],
              "2":["v","w","x","y","z"]}
    plays=[]
    for k in range(num):
        who="a" if k%2==0 else "c"
        scorer="b" if k%2==0 else "d"
        # Wrong ESPN team labels are ignored; actual on-court player IDs win.
        plays.append([1,600-k,"S2","2",scorer,who,2,25,2,"jump"])
    return {"home":"1","away":"2","starters":starters,"events":plays}


def input_team(n=10):
    L=League()
    L.per_min={"fga":.4,"fgm":.18,"tpa":.14,"tpm":.05,"fta":.13,"ftm":.1,
               "ast":.1,"oreb":.03,"dreb":.11,"stl":.03,"blk":.02,"tov":.07,
               "pf":.08,"pts":.45}
    line={"min":30,"fga":12,"fgm":5,"tpa":4,"tpm":2,"fta":4,"ftm":3,
          "ast":3,"oreb":1,"dreb":4,"stl":1,"blk":.5,"tov":2,"pf":2,"pts":15,"start":True}
    profiles=[build_profile([line]*12,L) for _ in range(n)]
    presence=np.tile(np.array([.8 if i<5 else .25 for i in range(n)])[:,None],(1,SEG))
    team=TeamInput(ids=[f"p{i}" for i in range(n)],prof=profiles,presence=presence,
                 p_play=np.ones(n),starter=np.array([i<5 for i in range(n)]),defence={})
    return team,L


class NamedAssistTests(unittest.TestCase):
    def test_verified_passer_receiver_not_corrupted_by_espn_event_team(self):
        state=AssistNetworkState()
        self.assertEqual(state.add_valid_game(make_pbp()),30)
        self.assertEqual(state.team_pairs[("1","a","b")],15)
        self.assertEqual(state.team_pairs[("1","c","d")],15)
        self.assertEqual(state.team_counts["2"],0)
        self.assertEqual(state.audit()["named_assisted_makes"],30)

    def test_missing_assister_not_fabricated(self):
        p=make_pbp(2)
        p["events"][0][5]=""
        state=AssistNetworkState()
        self.assertEqual(state.add_valid_game(p),1)
        self.assertEqual(state.audit()["named_makes"],2)

    def test_off_court_assister_fails_atomically(self):
        p=make_pbp(3)
        p["events"][-1][5]="z"
        state=AssistNetworkState()
        with self.assertRaises(ValueError):
            state.add_valid_game(p)
        self.assertFalse(state.team_pairs)
        self.assertEqual(state.audit()["named_makes"],0)

    def test_only_proven_court_overlap_can_create_pair_effect(self):
        state=AssistNetworkState()
        for _ in range(12):
            state.add_valid_game(make_pbp())
        players={("1",i):[300.0,0,0,0,0] for i in ("a","b","c","d","e")}
        pairs={("1",p,q):[180.0,0,0,0,0] for p in ("a","b","c","d","e")
              for q in ("a","b","c","d","e") if p!=q}
        l=SimpleNamespace(players=players,pairs=pairs)
        weights,audit=state.for_roster("1",["a","b","c","d","e"],l)
        self.assertGreater(audit["eligible_directed_assist_pairs"],0)
        self.assertGreater(weights[0,1],0)
        self.assertEqual(weights[0,0],0)
        self.assertTrue(np.all(np.abs(weights)<=.26+1e-12))
        wrong=np.copy(weights)
        l.pairs.clear()
        zero,au=state.for_roster("1",["a","b","c","d","e"],l)
        np.testing.assert_allclose(zero,0)
        self.assertEqual(au["eligible_directed_assist_pairs"],0)
        self.assertTrue(np.any(wrong>0))

    def test_feature_off_keeps_existing_champion_exact_and_on_preserves_scores(self):
        h,L=input_team()
        a,_=input_team()
        n=len(h.ids)
        bias=np.zeros((n,n))
        bias[0,:]=.25
        bias[1,:]=-.25
        h.assist_receiver_log_effect=bias
        tables={"blow":np.ones((4,2)),"foul":np.ones((6,2))}
        base=simulate_game(h,a,L,tables,S=320,pace=98.0,seed=23)
        off=simulate_game(h,a,L,tables,S=320,pace=98.0,seed=23,features={"assist_network":False})
        on=simulate_game(h,a,L,tables,S=320,pace=98.0,seed=23,features={"assist_network":True})
        for side,k in (("home",0),("away",1)):
            np.testing.assert_array_equal(base[side]["ast"],off[side]["ast"])
            np.testing.assert_array_equal(base[side]["pts"],on[side]["pts"])
            np.testing.assert_allclose(on[side]["pts"].sum(axis=1),on["score"][:,k])
            self.assertTrue(np.all(on[side]["ast"].sum(axis=1)<=on[side]["fgm"].sum(axis=1)))
        self.assertFalse(np.array_equal(base["home"]["ast"],on["home"]["ast"]))


if __name__=="__main__":
    unittest.main()
