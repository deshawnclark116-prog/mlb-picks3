"""Independent science and operational guardrails for NBA Phase1 V3 (NFL architecture)."""
import copy
import math
import unittest
from collections import Counter
from datetime import datetime,timezone
from nba.nba_v3_phase1_engine import (
    VERSION,SCHEMA,MARKETS,role_pool,simulate_matchup,TEAM_MINUTES
)

ASOF="2026-10-25T14:00:00Z"
TIP="2026-10-25T23:00:00Z"

def players(team):
    histories={};first={};last={};roster=set()
    for j in range(9):
        pid=str(1000+j+(10000 if team=="2" else 0))
        roster.add(pid)
        hist=[]
        for ix in range(12):
            minutes=max(7,36-j*2+ix*.1)
            v={"player":f"Real-source synthetic {pid}",
               "team_id":team,"player_id":pid,
               "team_game_index":ix,"minutes":minutes,
               "started":j<5,
               "points":round(minutes*(.52-j*.017)),
               "rebounds":round(minutes*(.19-j*.008)),
               "assists":round(minutes*(.14-j*.008)),
               "three_pointers_made":round(minutes*.05)}
            hist.append(v)
        k=(team,pid);histories[k]=hist;first[k]=0;last[k]=11
    return histories,first,last,roster

def inputs(profile=False,drop=None):
    allhist={};first={};last={};rosters={}
    for team in ("1","2"):
        hist,f,l,ids=players(team)
        if profile:
            for row in hist.values():
                for record in row:
                    record.update({
                        "field_goals_made":7,"field_goal_attempts":16,
                        "three_point_attempts":5,
                        "free_throws_made":3,"free_throw_attempts":4
                    })
        allhist.update(hist);first.update(f);last.update(l)
        rosters[team]=ids
    result={}
    for team in ("1","2"):
        statuses=[]
        if drop and team=="1":
            statuses=[{"team_id":"1","player_id":drop,"status":"OUT",
               "independently_verified":True,
               "source_url":"https://site.api.espn.com/known",
               "published_at_utc":"2026-10-25T13:10:00Z"}]
        result[team]=role_pool(team,allhist,Counter({"1":12,"2":12}),
                   first,last,rosters[team],asof_utc=ASOF,
                   tipoff_utc=TIP,statuses=statuses)
    return result

class NbaV3(unittest.TestCase):
    def test_two_teams_full_game_four_stats_cdf_quantiles_and_no_book(self):
        roles=inputs()
        a=simulate_matchup("991",roles,asof_utc=ASOF,tipoff_utc=TIP,draws=1800)
        b=simulate_matchup("991",roles,asof_utc=ASOF,tipoff_utc=TIP,draws=1800)
        self.assertEqual(a,b,"Original firstseen as-of model seed must be deterministic")
        self.assertEqual(a["schema"],SCHEMA)
        self.assertFalse(a["sportsbook_line_used"])
        self.assertEqual(a["official_bets"],0)
        self.assertEqual(a["rows_count"],18*4)
        self.assertTrue(all(t["team_240_minute_conservation"]
                            for t in a["team_opportunity_diagnostics"].values()))
        for r in a["rows"]:
            self.assertFalse(r["calibrated_for_2026_27"])
            self.assertFalse(r["not_an_official_bet"] is False)
            self.assertEqual(r["cdf_lattice"]["step"],1)
            cdf=r["cdf_lattice"]["cdf"]
            self.assertAlmostEqual(cdf[-1],1,6)
            self.assertTrue(all(0<=x<=y<=1 for x,y in zip(cdf,cdf[1:])))
            self.assertTrue(r["p10"]<=r["median"]<=r["p90"])
            self.assertTrue(r["p_active"]<=1)
            self.assertTrue(r["role_share"]<=42/240)
            if r["model_target"]:
                m=r["model_target"]["milestone"]
                self.assertGreaterEqual(r["model_target"]["probability"],.65)
                self.assertAlmostEqual(
                    r["model_target"]["probability"],1-cdf[m-1],5)
                self.assertNotEqual(r["market"],"sportsbook_line")
        self.assertTrue(a["rows"][0]["unc_reasons"])
        self.assertTrue(any("ATTEMPT_PROFILE_UNAVAILABLE_DEGRADED_FALLBACK"
                            in z for x in a["rows"] for z in x["unc_reasons"]))

    def test_real_fg_and_3pt_attempt_profile_joint_points_threes(self):
        roles=inputs(profile=True)
        self.assertTrue(all(p["shot_profile"] for group in roles.values() for p in group))
        out=simulate_matchup("991",roles,asof_utc=ASOF,tipoff_utc=TIP,draws=1500)
        self.assertEqual(out["rows_count"],18*4)
        self.assertTrue(all(r["profile_coverage_n"]>=4 for r in out["rows"]))
        self.assertFalse(any("ATTEMPT_PROFILE_UNAVAILABLE_DEGRADED_FALLBACK"
             in r["unc_reasons"] for r in out["rows"]))
        self.assertTrue(any(r["mean"]>1 for r in out["rows"] if r["market"]=="points"))

    def test_authentic_reported_out_zero_probability_with_no_false_active_default(self):
        baseline=inputs()
        player=baseline["1"][0]["player_id"]
        scenario=inputs(drop=player)
        before=baseline["1"][0]
        after=next(x for x in scenario["1"] if x["player_id"]==player)
        self.assertGreater(before["p_play"],0)
        self.assertEqual(after["p_play"],0)
        out=simulate_matchup("991",scenario,asof_utc=ASOF,tipoff_utc=TIP,draws=1000)
        for r in out["rows"]:
            if r["player_id"]==player:
                self.assertEqual(r["mean"],0)
                self.assertEqual(r["p_active"],0)
                self.assertEqual(r["model_target"],None)
        self.assertNotEqual(baseline,scenario)
        self.assertEqual(baseline["1"][0]["reported_status"],
                         "UNKNOWN_NOT_ACTIVE_CERTIFIED")
        self.assertFalse(after["game_day_active_certified"])

    def test_future_or_fabricated_roster_role_evidence_fails_closed(self):
        cases=[
            [{"team_id":"1","player_id":"1000","status":"OUT",
              "published_at_utc":"2026-10-25T22:00:00Z",
              "independently_verified":True,
              "source_url":"https://official.test/out"}],
            [{"team_id":"1","player_id":"1000","status":"OUT",
              "published_at_utc":"2026-10-25T13:00:00Z",
              "independently_verified":False,
              "source_url":"https://official.test/out"}],
            [{"team_id":"1","player_id":"1000","status":"ACTIVE",
              "published_at_utc":"2026-10-25T13:00:00Z",
              "independently_verified":True,
              "source_url":"file:///fake"}],
        ]
        h,first,last,roster=players("1")
        for scenario in cases:
            with self.assertRaisesRegex(ValueError,"UNVERIFIED"):
                role_pool("1",h,Counter({"1":12}),first,last,roster,
                    asof_utc=ASOF,tipoff_utc=TIP,statuses=scenario)
        changed=copy.deepcopy(h)
        changed[("1","1000")][-1]["team_game_index"]=12
        with self.assertRaisesRegex(ValueError,"FUTURE"):
            role_pool("1",changed,Counter({"1":12}),first,last,roster,
                  asof_utc=ASOF,tipoff_utc=TIP)
        with self.assertRaisesRegex(ValueError,"AFTER_TIP"):
            simulate_matchup("991",inputs(),asof_utc=TIP,tipoff_utc=ASOF,draws=1000)

    def test_excluding_player_from_real_roster_does_not_grant_minutes_to_absent(self):
        h,first,last,roster=players("1")
        roster.remove("1000")
        result=role_pool("1",h,Counter({"1":12}),first,last,roster,
             asof_utc=ASOF,tipoff_utc=TIP)
        self.assertNotIn("1000",[p["player_id"] for p in result])
        self.assertEqual(len(result),8)

if __name__=="__main__":
    unittest.main()
