"""Regression contracts for paired NBA V5 role research and archive grading health."""
import datetime as dt
import gzip
import json
import tempfile
import unittest
from pathlib import Path

import numpy as np

from nba.nba_v5_sim import TeamInput, SEG, League, build_profile
from nba.nba_v5_role_trial import adapt_team
from nba.nba_v5_role_trial_score import evaluate
from nba.nba_v5_grade_health import health


def line(d, minute=22, fga=8, tpa=2, assists=2):
    return {"date":d, "min":minute, "fga":fga, "tpa":tpa,"ast":assists,
            "reb":4, "tov":2, "fgm":4, "tpm":1,"fta":3, "ftm":2,
            "oreb":1,"dreb":3,"stl":1,"blk":0,"pf":2,"pts":11,"start":True}


def toy():
    L=League()
    L.per_min={"fga":.38,"tpa":.11,"fta":.12,"ast":.12,"oreb":.03,
               "dreb":.10,"stl":.02,"blk":.02,"tov":.08,"pf":.08}
    days=[dt.date(2026,7,1)+dt.timedelta(days=i) for i in range(28)]
    records=[line(day,minute=(36 if j>=20 else 20),fga=(24 if j>=20 else 8),
                  tpa=(10 if j>=20 else 2),assists=(9 if j>=20 else 2))
             for j,day in enumerate(days)]
    prof=[build_profile(records,L)]
    prof[0]["rate"]["tpa"]=min(prof[0]["rate"]["tpa"],prof[0]["rate"]["fga"])
    zf=np.array([[.45,.22,.12,.08,.13]])
    ti=TeamInput(ids=["p1"],prof=prof,presence=np.full((1,SEG),.60),
                 p_play=np.array([1.0]),starter=np.array([True]),defence={},zf=zf)
    return ti,records


class RoleTrialTests(unittest.TestCase):
    def test_past_only_without_mutation_or_invalid_shot_rates(self):
        ti,h=toy()
        original=ti.prof[0]["rate"].copy()
        original_zf=ti.zf.copy()
        original_presence=ti.presence.copy()
        adaptive,flags=adapt_team(ti,{"p1":h},dt.date(2026,8,1))
        self.assertTrue(flags)
        self.assertGreater(adaptive.prof[0]["rate"]["fga"],original["fga"])
        self.assertGreater(adaptive.prof[0]["rate"]["ast"],original["ast"])
        self.assertTrue(np.isclose(adaptive.zf.sum(axis=1),1).all())
        self.assertGreaterEqual(adaptive.prof[0]["rate"]["fga"],adaptive.prof[0]["rate"]["tpa"])
        self.assertEqual(ti.prof[0]["rate"],original)
        np.testing.assert_array_equal(ti.presence,original_presence)
        np.testing.assert_array_equal(ti.zf,original_zf)
        # A massive *future* box score must never change a pregame feature.
        h.append(line(dt.date(2026,8,1),minute=48,fga=800,tpa=500,assists=500))
        future, future_flags=adapt_team(ti,{"p1":h},dt.date(2026,8,1))
        self.assertEqual(flags,future_flags)
        self.assertEqual(adaptive.prof,future.prof)
        np.testing.assert_array_equal(adaptive.presence,future.presence)
        np.testing.assert_array_equal(adaptive.zf,future.zf)

    def test_unflagged_player_is_unmodified(self):
        ti,h=toy()
        stable=[line(x["date"],minute=22) for x in h]
        got,flags=adapt_team(ti,{"p1":stable},dt.date(2026,8,1))
        self.assertEqual(flags,[])
        self.assertEqual(got.prof,ti.prof)

    def test_paired_scoring_requires_identical_player_games(self):
        with self.assertRaises(ValueError):
            evaluate([{"game":"1","player":"1"}],[],{})


class ArchiveHealthTests(unittest.TestCase):
    def test_distinguishes_future_from_past_and_preserves_first_seen(self):
        with tempfile.TemporaryDirectory() as root:
            archive=Path(root)/"archive"
            grades=Path(root)/"grades"
            (archive/"first").mkdir(parents=True)
            (archive/"last").mkdir()
            (grades/"first").mkdir(parents=True)
            (grades/"last").mkdir()
            for kind,game,tip in [
                ("first","A","2026-11-02T01:00:00+00:00"),
                ("first","B","2026-11-12T01:00:00+00:00"),
                ("last","A","2026-11-02T01:00:00+00:00")
            ]:
                doc={"games":[{"game_id":game,"tipoff_utc":tip,
                    "forecast_at_utc":"2026-11-01T01:00:00+00:00"}]}
                with gzip.open(archive/kind/(game+".json.gz"),"wt") as f:
                    json.dump(doc,f)
            (grades/"first"/"A.json").write_text("{}")
            a=health(archive,grades,dt.datetime(2026,11,5,tzinfo=dt.timezone.utc))
            self.assertEqual(a["archive_grade_health"]["first"]["archived_games"],2)
            self.assertEqual(a["archive_grade_health"]["first"]["past_tip_pending_grade"],0)
            self.assertEqual(a["archive_grade_health"]["first"]["future_tipoff"],1)
            self.assertEqual(a["archive_grade_health"]["last"]["past_tip_pending_grade"],1)
            self.assertTrue(a["no_lookahead_preserved"])


if __name__=="__main__":
    unittest.main()
