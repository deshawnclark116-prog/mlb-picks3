"""Frozen forward challenger must grade ALL original V5 rows, including DNP."""
import gzip
import json
import tempfile
import unittest
from pathlib import Path

from nba.nba_v5_forward_compare import compare


def forecast(gid="100",late=False,challenger=False):
    cdf=[.04]*10+[.30 if not challenger else .50]+[.62]*8
    if challenger: cdf=[.04]*10+[.50]+[.80]*8
    row={"player_id":"p1","market":"points",
         "model_version":"nba-v5-test","mean_basis":"CONDITIONAL_ON_PLAYING",
         "mean":13.2 if challenger else 10.6,
         "p_active":.8,"cdf_lattice":{"step":1,"cdf":cdf}}
    assist={"player_id":"p2","market":"assists",
            "model_version":"nba-v5-test","mean_basis":"CONDITIONAL_ON_PLAYING",
            "mean":2.4,"p_active":.95,
            "cdf_lattice":{"step":1,"cdf":[.1,.2,.4,.65,.9,1]}}
    return {"games":[{"game_id":gid,"tipoff_utc":"2026-11-06T23:00:00+00:00",
            "forecast_at_utc":"2026-11-06T22:55:00+00:00" if late else
                            ("2026-11-06T20:05:00+00:00" if challenger else "2026-11-06T20:00:00+00:00"),
            "rows":[row,assist],"simulation_pieces_on":{"lineup_pairs":bool(challenger)}}]}


def grade(gid="100",played=True):
    return {"game_id":gid,"rows":[
       {"player_id":"p1","market":"points","played":played,"actual":12 if played else None},
       {"player_id":"p2","market":"assists","played":True,"actual":4}]}


class FrozenForwardTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        root=Path(self.tmp.name)
        self.ch=root/"champ";self.ca=root/"candidate";self.grade=root/"grades"
        for p in (self.ch/"first",self.ca/"first",self.grade/"first"):
            p.mkdir(parents=True)
    def tearDown(self):
        self.tmp.cleanup()
    def save(self,base,doc,gid="100"):
        with gzip.open(base/"first"/f"{gid}.json.gz","wt") as f:
            json.dump(doc,f)
    def runcheck(self,c0=None,c1=None,gr=None):
        self.save(self.ch,c0 or forecast())
        self.save(self.ca,c1 or forecast(challenger=True))
        (self.grade/"first"/"100.json").write_text(json.dumps(gr or grade()))
        return compare(self.ch,self.ca,self.grade)

    def test_challenger_stays_scored_at_champion_whole_number(self):
        report=self.runcheck()
        self.assertEqual(report["graded_paired_games"],1)
        self.assertEqual(report["joined_original_player_stat_events"],2)
        self.assertFalse(report["model_promotion_allowed"])
        pts=[x for x in report["per_original_projection"] if x["market"]=="points"][0]
        # 10.6 rounds to 11 in the user's model contract; trial mean
        # 13.2 must NOT create a different graded event.
        self.assertEqual(pts["original_whole_projection"],11)
        self.assertAlmostEqual(pts["champion_prob_including_dnp"],.8*(1-.30))
        self.assertAlmostEqual(pts["challenger_prob_including_dnp"],.8*(1-.50))
        self.assertEqual(pts["hit"],1)
        self.assertIn("assists|mae",report["metrics"])

    def test_dnp_is_a_miss_of_positive_projection_not_removed(self):
        report=self.runcheck(gr=grade(played=False))
        pts=[x for x in report["per_original_projection"] if x["market"]=="points"][0]
        self.assertEqual(pts["hit"],0)
        self.assertFalse(pts["played"])
        self.assertIn("points|unconditional_brier",report["metrics"])
        self.assertNotIn("points|mae",report["metrics"])

    def test_last_minute_candidate_is_not_retroactively_called_pregame(self):
        r=self.runcheck(c1=forecast(late=True,challenger=True))
        self.assertEqual(r["joined_original_player_stat_events"],0)
        self.assertIn("100",r["excluded_games"])

    def test_missing_final_result_never_counts_as_a_win_or_grade(self):
        self.save(self.ch,forecast())
        self.save(self.ca,forecast(challenger=True))
        r=compare(self.ch,self.ca,self.grade)
        self.assertEqual(r["graded_paired_games"],0)
        self.assertEqual(r["joined_original_player_stat_events"],0)


if __name__=="__main__":
    unittest.main()
