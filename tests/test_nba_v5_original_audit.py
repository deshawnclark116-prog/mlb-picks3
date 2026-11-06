"""Contract tests: frozen threshold and CDF, DNP as miss, no cherry-pick."""
from __future__ import annotations

import gzip
import json
import tempfile
import unittest
from pathlib import Path

from nba.nba_v5_original_audit import original_probability, audit_game, build


def original_row(pid, mk="points", mean=5.6, p=.65, frontend_rank=None):
    return {"player":"Test Player", "player_id":str(pid), "market":mk,
            "mean_basis":"CONDITIONAL_ON_PLAYING", "mean":mean,
            "p_active":p, "cdf_lattice":{"cdf":[.05,.10,.18,.25,.35,.45,.55,.65,.75]},
            "minutes_mean":24,"p10":1,"p90":10, "frontend_rank":frontend_rank}


def graded_row(r, played=True, actual=7):
    return {"player_id":r["player_id"],"market":r["market"],
            "projection":r["mean"],"p_active":r["p_active"],
            "frontend_rank":r.get("frontend_rank"),"played":played,
            "actual":actual if played else None,"minutes_actual":25 if played else None}


def docs(rows, statuses, gid="123"):
    return ({"game_id":gid,"forecast_at_utc":"2026-11-06T20:00:00Z",
             "rows":rows},
            {"game_id":gid,"kind":"first","forecast_at_utc":"2026-11-06T20:00:00Z",
             "rows":statuses})


class OriginalAuditTests(unittest.TestCase):
    def test_fixed_champion_threshold_06_rounding(self):
        r=original_row("1")
        p,why=original_probability(r)
        self.assertIsNone(why)
        self.assertEqual(p["whole_projection"],6)
        self.assertAlmostEqual(p["probability_if_playing"],.55)
        self.assertAlmostEqual(p["probability_including_dnp"],.3575)

    def test_preserves_all_rows_and_dnp_without_display_rank(self):
        a=original_row("1")
        b=original_row("2",p=.15,frontend_rank=1)
        original,grade=docs([a,b],[graded_row(a),graded_row(b,False)])
        g=audit_game(original,grade,"sha")
        self.assertEqual(g["original_row_count"],2)
        self.assertEqual(g["rows"][0]["hit_including_dnp"],1)
        self.assertEqual(g["rows"][1]["hit_including_dnp"],0)
        self.assertAlmostEqual(g["rows"][1]["probability_including_dnp"],.0825)
        self.assertIsNone(g["rows"][0]["frontend_rank"])

    def test_never_recompute_threshold_from_real_score(self):
        r=original_row("1",mean=5.59)
        self.assertEqual(original_probability(r)[0]["whole_projection"],5)
        actual=100
        original,grade=docs([r],[graded_row(r,True,actual)])
        g=audit_game(original,grade,"sha")
        self.assertEqual(g["rows"][0]["whole_projection"],5)

    def test_corrupt_cdf_fails_closed(self):
        r=original_row("1");r["cdf_lattice"]["cdf"]=[.5,.4]
        p,why=original_probability(r)
        self.assertIsNone(p)
        self.assertEqual(why,"NONMONOTONE_FROZEN_DISTRIBUTION")

    def test_missing_frozen_distribution_never_uses_outcome(self):
        r=original_row("1");r.pop("cdf_lattice")
        original,grade=docs([r],[graded_row(r)])
        g=audit_game(original,grade,"sha")
        self.assertEqual(g["ungradable_row_count"],1)
        self.assertIsNone(g["rows"][0]["hit_including_dnp"])

    def test_grade_tampering_is_detected(self):
        r=original_row("1")
        z=graded_row(r);z["projection"]=42
        original,grade=docs([r],[z])
        with self.assertRaisesRegex(ValueError,"projection changed"):
            audit_game(original,grade,"sha")

    def test_ungraded_games_are_pending_not_fabricated(self):
        a=original_row("1")
        original,grade=docs([a],[graded_row(a)])
        with tempfile.TemporaryDirectory() as tmp:
            ap,gp=Path(tmp)/"archive",Path(tmp)/"grades"
            ap.mkdir();gp.mkdir()
            data=json.dumps({"games":[original]}).encode()
            (ap/"123.json.gz").write_bytes(gzip.compress(data))
            r=build(ap,gp)
            self.assertEqual(r["summary"]["pending_or_not_final_games"],["123"])
            self.assertEqual(r["summary"]["graded_games"],0)
            (gp/"123.json").write_text(json.dumps(grade))
            r=build(ap,gp)
            self.assertEqual(r["summary"]["graded_games"],1)
            self.assertEqual(r["summary"]["gradable_rows"],1)
            self.assertEqual(r["summary"]["groups"]["all_original_rows"]["n"],1)

    def test_grade_missing_player_row_is_error(self):
        r=original_row("1")
        original,grade=docs([r],[])
        with self.assertRaisesRegex(ValueError,"Missing final grade"):
            audit_game(original,grade,"sha")

if __name__=="__main__": unittest.main()
