"""Tracking opportunity model alters only relative opportunities when explicitly activated."""
import unittest
import copy

from nba.nba_v5_tracking_opportunities import audit_and_apply, MAX_LOG_DELTA


class TinyTeam:
    def __init__(self):
        self.team_id="2"
        self.ids=[str(x) for x in range(8)]
        self.prof=[{"rate":{"ast":.12,"fga":.4,"fta":.13,"oreb":.04,"dreb":.15},
                    "min_avg":20.0} for _ in range(8)]


def source(n=8):
    return {("2",str(i)):{"sample_games":60,"features":{
        "potential_assists_per_game":2.0+i,
        "touches_per_game":20.0+3*i,
        "drives_per_game":1.0+i,
        "rebound_chances_per_game":4.0+i}} for i in range(n)}


class OpportunityTests(unittest.TestCase):
    def test_default_diagnostics_do_not_mutate_champion(self):
        t=TinyTeam()
        original=copy.deepcopy(t.prof)
        out,diagnostic=audit_and_apply(t,source(),activate=False)
        self.assertIs(out,t)
        self.assertEqual(t.prof,original)
        self.assertEqual(diagnostic["available_players"],8)
        self.assertEqual(diagnostic["model_effect"],"SOURCE_SHADOW_ONLY")

    def test_candidate_is_bounded_and_does_not_mutate_original(self):
        t=TinyTeam()
        before=copy.deepcopy(t.prof)
        candidate,audit=audit_and_apply(t,source(),activate=True)
        self.assertIsNot(candidate,t)
        self.assertEqual(t.prof,before)
        self.assertGreater(audit["adjusted_players"],0)
        self.assertEqual(audit["eligible_stats"]["ast"],8)
        for p,b in zip(candidate.prof,before):
            for k in ("ast","fga","fta","oreb","dreb"):
                self.assertTrue(.884 < p["rate"][k]/b["rate"][k] <= 1.131)
        self.assertEqual(candidate.prof[0]["rate"]["fga"] >= 0,True)

    def test_insufficient_source_coverage_keeps_rates(self):
        t=TinyTeam()
        before=copy.deepcopy(t.prof)
        out,audit=audit_and_apply(t,source(n=4),activate=True)
        self.assertEqual(out.prof,before)
        self.assertEqual(audit["adjusted_players"],0)

    def test_limited_stats_do_not_fabricate_others(self):
        t=TinyTeam()
        s=source()
        for r in s.values():
            r["features"]={"potential_assists_per_game":r["features"]["potential_assists_per_game"]}
        out,audit=audit_and_apply(t,s,activate=True)
        self.assertGreater(audit["adjustments_per_stat"]["ast"],0)
        for p,b in zip(out.prof,t.prof):
            for stat in ("fga","fta","oreb","dreb"):
                self.assertEqual(p["rate"][stat],b["rate"][stat])

    def test_low_sample_coverage_is_not_usable(self):
        t=TinyTeam()
        s=source()
        for r in s.values():
            r["sample_games"]=10
        out,audit=audit_and_apply(t,s,activate=True)
        self.assertEqual(audit["adjusted_players"],0)
        self.assertEqual(out.prof,t.prof)


if __name__=="__main__":
    unittest.main()
