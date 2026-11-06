"""Real PBP shot-miss origin must map to actual named rebound, not guesses."""
import unittest
import numpy as np
from nba.nba_v5_rebound_zones import ReboundZoneState
from nba.nba_v5_sim import League, TeamInput, build_profile, simulate_game, SEG


def pbp(rows=10):
    events=[]
    for i in range(rows):
        t=600-i*2
        if i%2==0:
            # Opponent team label is deliberately wrong; the player is on
            # home court and rebounder is the defending visitor.
            events.extend([[1,t,"S2","2","a","",0,25,2,"jump"],
                           [1,t-1,"DR","1","v","",0,None,None,None]])
        else:
            events.extend([[1,t,"S3","1","a","",0,40,25,"jump"],
                           [1,t-1,"DR","1","w","",0,None,None,None]])
    return {"home":"1","away":"2",
        "starters":{"1":["a","b","c","d","e"],"2":["v","w","x","y","z"]},
        "events":events}


class ReboundZonesTests(unittest.TestCase):
    def test_free_missed_shot_coordinates_are_connected_to_correct_rebounder(self):
        r=ReboundZoneState()
        self.assertEqual(r.add_valid_game(pbp(60)),60)
        self.assertEqual(r.count[("2","v","dreb",0)],30)
        self.assertEqual(r.count[("2","w","dreb",4)],30)
        self.assertEqual(r.team_total[("2","dreb")],60)
        self.assertEqual(r.audit()["linked_named_rebounds"],60)
        self.assertEqual(r.audit()["covered_teams"],1)

    def test_unpaired_and_delayed_rebounds_are_excluded(self):
        p=pbp(4)
        # Preserve monotone regulation clocks while testing an 11-second delay.
        for k,left in enumerate((600,589,588,587,586,585,584,583)):
            p["events"][k][1]=left
        p["events"][3][4]=""   # unnamed team rebound
        r=ReboundZoneState()
        self.assertEqual(r.add_valid_game(p),2)
        self.assertEqual(r.audit()["linked_named_rebounds"],2)

    def test_missing_coordinates_cannot_invent_zone(self):
        p=pbp(4)
        p["events"][0][7]=None
        p["events"][0][8]=None
        r=ReboundZoneState()
        self.assertEqual(r.add_valid_game(p),3)

    def test_bounded_location_effects_need_real_player_and_team_events(self):
        r=ReboundZoneState()
        r.add_valid_game(pbp(80))
        effect,audit=r.for_roster("2",["v","w","x"])
        self.assertGreater(effect["dreb"][0,0],0)
        self.assertGreater(effect["dreb"][1,4],0)
        self.assertTrue(np.all(np.abs(effect["dreb"])<=.23+1e-12))
        self.assertEqual(effect["dreb"][2,0],0)
        self.assertGreater(audit["covered_player_zone_sides"],0)

    def test_rebound_zone_feature_off_preserves_current_game_and_on_changes_rebounder(self):
        def roster():
            L=League()
            L.per_min={"fga":.4,"fgm":.18,"tpa":.14,"tpm":.05,
                "fta":.13,"ftm":.1,"ast":.1,"oreb":.03,"dreb":.11,
                "stl":.03,"blk":.02,"tov":.07,"pf":.08,"pts":.45}
            ln={"min":30,"fga":12,"fgm":5,"tpa":4,"tpm":2,"fta":4,
               "ftm":3,"ast":3,"oreb":1,"dreb":4,"stl":1,"blk":.5,
               "tov":2,"pf":2,"pts":15,"start":True}
            n=10
            profiles=[build_profile([ln]*12,L) for _ in range(n)]
            pres=np.tile(np.array([.75 if i<5 else .3 for i in range(n)])[:,None],(1,SEG))
            t=TeamInput(ids=[f"p{i}" for i in range(n)],prof=profiles,presence=pres,
                         p_play=np.ones(n),starter=np.array([i<5 for i in range(n)]),defence={})
            t.zf=np.tile(np.array([.25,.25,.10,.15,.25]),(n,1))
            t.zp=np.tile(np.array([.7,.5,.4,.35,.36]),(n,1))
            t.zn=np.full((n,5),50.0)
            return t,L
        h,L=roster()
        a,_=roster()
        n=len(h.ids)
        effects=np.zeros((n,5))
        effects[0,:]=.23
        effects[1,:]=-.23
        h.rebound_zone_log_effect={"oreb":effects,"dreb":effects}
        a.rebound_zone_log_effect={"oreb":effects,"dreb":effects}
        tables={"blow":np.ones((4,2)),"foul":np.ones((6,2))}
        base=simulate_game(h,a,L,tables,S=400,pace=98,seed=21)
        off=simulate_game(h,a,L,tables,S=400,pace=98,seed=21,features={"rebound_zones":False})
        on=simulate_game(h,a,L,tables,S=400,pace=98,seed=21,features={"rebound_zones":True})
        np.testing.assert_array_equal(base["home"]["reb"],off["home"]["reb"])
        self.assertFalse(np.array_equal(base["home"]["reb"],on["home"]["reb"]))
        for side,i in (("home",0),("away",1)):
            np.testing.assert_array_equal(base[side]["pts"],on[side]["pts"])
            np.testing.assert_allclose(on[side]["pts"].sum(axis=1),on["score"][:,i])
            self.assertTrue(np.all(on[side]["ast"].sum(axis=1)<=on[side]["fgm"].sum(axis=1)))


if __name__=="__main__":
    unittest.main()
