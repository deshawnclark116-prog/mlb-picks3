"""Leak-safe V2 NBA role challenge, exact-match game and identity guards."""
import copy
import unittest
from collections import Counter
from nba.nba_v2_rotation_research import (
    team_forecasts, conditional_absence_scenario, day_frozen_forecasts)
from nba.nba_v2_rotation_backtest import paired_summary
from tests.test_nba_v1_player_backtest import data

def history(player_id,team="1",first=0,last=9,minutes=None):
    out=[]
    for index in range(first,last+1):
        minute=minutes[index-first] if minutes else 20+index
        out.append({"player_id":player_id,"team_id":team,
            "player":"Synthetic Player "+player_id,"team_game_index":index,
            "minutes":minute,"started":index>=6,
            "points":int(minute*.55),"rebounds":int(minute*.15),
            "assists":int(minute*.1),"three_pointers_made":int(minute*.04)})
    return out

def sample():
    key=("1","hero")
    hist={key:history("hero",minutes=[16,17,18,18,19,26,30,33,34,35])}
    for i in range(1,9):
        pid="teammate"+str(i)
        hist[("1",pid)]=history(pid,minutes=[22]*10)
    first={k:0 for k in hist}
    last={k:9 for k in hist}
    return team_forecasts("1",hist,Counter({"1":10}),first,last)

class NbaRotationGuardrails(unittest.TestCase):
    def test_dnp_tracked_against_TEAM_games_not_player_observations(self):
        full=sample()
        full_hero=next(p for p in full["players"] if p["player_id"]=="hero")
        hist={("1","hero"):history("hero")}
        hist[("1","hero")]=hist[("1","hero")][:-3]
        truncated=team_forecasts("1",hist,Counter({"1":10}),
                                 {("1","hero"):0},{("1","hero"):6})
        self.assertTrue(len(truncated["players"])==1)
        missing=truncated["players"][0]
        self.assertLess(missing["p_play_unverified"],full_hero["p_play_unverified"])
        self.assertTrue(missing["research_only"])
        self.assertFalse(missing["starter_certified"])

    def test_role_momentum_and_team_budget_remain_source_projections(self):
        result=sample()
        player=next(x for x in result["players"] if x["player_id"]=="hero")
        self.assertGreater(player["conditional_minutes_mean"],20)
        self.assertIn("points",player["conditional_stat_means"])
        self.assertLessEqual(result["allocated_expected_minutes"],240.01)
        self.assertGreaterEqual(result["unmodeled_reserve_minutes"],0)
        self.assertTrue(result["no_verified_game_day_rotations"])
        self.assertTrue(all(x["conditional_minutes_mean"]<=42 for x in result["players"]))

    def test_false_current_game_stat_mutation_cannot_modify_pregame_forecast(self):
        games,boxes=data(22)
        a=day_frozen_forecasts(games,boxes)
        tampered=copy.deepcopy(boxes)
        tampered["game-14"][0]["points"]+=120
        b=day_frozen_forecasts(games,tampered)
        same=lambda rows: sorted((x for x in rows if x["game_id"]=="game-14"),
                                 key=lambda r:(r["team_id"],r["player_id"]))
        self.assertEqual(same(a),same(b))
        self.assertNotEqual(a,b)  # future dates DO learn from the newly ingested actual

    def test_late_injury_report_or_bare_unverified_evidence_is_rejected(self):
        base=sample()
        good={"team_id":"1","player_id":"hero","status":"OUT",
              "independently_verified":True,
              "source_url":"https://nba.com/team/official-report",
              "published_at_utc":"2026-10-20T15:00:00Z"}
        asof="2026-10-20T16:00:00Z";tip="2026-10-20T23:00:00Z"
        original=copy.deepcopy(base)
        conditional=conditional_absence_scenario(base,[good],asof,tip)
        p=next(x for x in conditional["players"] if x["player_id"]=="hero")
        self.assertEqual(p["expected_minutes"],0)
        self.assertEqual(p["conditional_stat_means"]["points"],0)
        self.assertLessEqual(conditional["allocated_expected_minutes"],240.01)
        self.assertEqual(base,original)
        self.assertTrue(conditional["scenario_not_original_frozen_forecast"])
        for change in ({"published_at_utc":"2026-10-21T01:00:00Z"},
                       {"independently_verified":False},
                       {"player_id":"not-a-team-player"},
                       {"team_id":"2"},
                       {"source_url":"untrusted"}):
            e={**good,**change}
            with self.assertRaises(ValueError):
                conditional_absence_scenario(base,[e],asof,tip)
        with self.assertRaises(ValueError):
            conditional_absence_scenario(base,[good,good],asof,tip)

    def test_duplicate_future_or_out_of_order_source_stats_are_blocked(self):
        hist={("1","hero"):history("hero")}
        first={("1","hero"):0}; last={("1","hero"):9}
        hist[("1","hero")][-1]["team_game_index"]=10
        with self.assertRaisesRegex(ValueError,"FUTURE"):
            team_forecasts("1",hist,Counter({"1":10}),first,last)
        hist[("1","hero")][-1]["team_game_index"]=8
        with self.assertRaisesRegex(ValueError,"DUPLICATE"):
            team_forecasts("1",hist,Counter({"1":10}),first,last)

    def test_paired_mae_reports_gate_uncertainty_rather_than_fabricated_wins(self):
        rows=[{"game_id":str(i),"actual":{"points":10},
               "stat_mean":{"points":12},
               "v2_conditional_stat_means":{"points":11},
               "baseline_recent_five":{"points":13}} for i in range(12)]
        report=paired_summary(rows,"points")
        self.assertEqual(report["n"],12)
        self.assertEqual(report["gain_vs_v1"],1)
        self.assertEqual(report["gain_vs_last5"],2)
        self.assertGreater(report["gain_ci95_vs_v1"][0],0)

if __name__=="__main__":unittest.main()
