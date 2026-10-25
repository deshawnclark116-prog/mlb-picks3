"""Prospective NBA V3 vs exact archived V2 2026-27 original outcome grading."""
import copy
import json
import tempfile
import unittest
from datetime import datetime,timezone
from pathlib import Path
from nba.nba_v3_phase1_engine import simulate_matchup
from nba.nba_v3_shadow_publish import PUBLISH_SCHEMA
from nba.nba_v3_firstseen_forward_grade import (
    grade,frozen_shadow,SCHEMA,TARGETS
)
from tests.test_nba_v3_phase1 import inputs,ASOF,TIP
NOW=datetime(2026,10,27,12,tzinfo=timezone.utc)
class Grade(unittest.TestCase):
    def fixture(self):
        model=simulate_matchup("991",inputs(),asof_utc=ASOF,
            tipoff_utc=TIP,draws=1000)
        g={**model,"home_id":"1","away_id":"2",
            "forecast_at_utc":ASOF,"tipoff_utc":TIP}
        doc={"schema":PUBLISH_SCHEMA,"generated_at_utc":ASOF,
             "model_version":model["model_version"],
             "model_promoted":False,"official_bets":0,"games":[g]}
        fake={}
        for row in model["rows"]:
            k=(row["team_id"],row["player_id"])
            if k not in fake:fake[k]={"team_id":k[0],"player_id":k[1],
                "conditional_minutes_mean":row["conditional_minutes_mean"],
                "p_play_unverified":row["p_active"],"predictions":{}}
            fake[k]["predictions"][row["market"]]=row["mean"]
        return g,doc,{"991":{"game_id":"991","players":list(fake.values())}}

    def test_same_game_two_team_all_four_stats_grades_prospectively_only(self):
        g,doc,old=self.fixture()
        with tempfile.TemporaryDirectory() as directory:
            Path(directory,"first.json").write_text(json.dumps(doc))
            restored=frozen_shadow(Path(directory))
        self.assertEqual(len(restored),1)
        ids={(r["team_id"],r["player_id"]) for r in g["rows"]}
        players=[{"team_id":t,"player_id":pid,"minutes":24.,
                 "points":13,"rebounds":5,"assists":3,
                 "three_pointers_made":1} for t,pid in sorted(ids)][:12]
        probs=json.load(open("docs/nba_v2_probability_distribution_v1.json"))
        result=grade(restored,{"991":players},old,probs,NOW)
        self.assertEqual(result["schema"],SCHEMA)
        self.assertEqual(result["official_final_game_boxes_verified"],1)
        self.assertEqual(result["official_bets"],0)
        self.assertFalse(result["betting_model_promoted"])
        self.assertEqual(result["verified_thresholds"],
                         result["original_v3_thresholds_accounted"])
        self.assertEqual(result["unverified_thresholds"],0)
        self.assertTrue(any(r["actual_stat"]==0 for r in result["rows"]))
        self.assertTrue(any(r["result"]=="HIT" for r in result["rows"]))
        self.assertTrue(any(r["result"]=="MISS" for r in result["rows"]))
        for name in ("points","rebounds","assists","three_pointers_made"):
            self.assertIn(name,result["markets"])
            self.assertFalse(result["markets"][name]["automatically_promoted"])
            self.assertLess(result["markets"][name]["prospective_v3_all_thresholds"]["brier"],1)
        points=result["markets"]["points"]
        self.assertGreater(points["same_exact_threshold_comparison_n"],0)
        self.assertIsNotNone(points["paired_milestone_brier_v3"])
        self.assertIsNotNone(points["paired_milestone_brier_original_v2"])

    def test_no_postgame_results_cannot_be_fabricated_from_mean(self):
        g,doc,old=self.fixture()
        probs=json.load(open("docs/nba_v2_probability_distribution_v1.json"))
        result=grade({"991":g},{},old,probs,NOW)
        self.assertEqual(result["verified_thresholds"],0)
        self.assertEqual(result["unverified_thresholds"],len(result["rows"]))
        self.assertTrue(all(r["result"]=="UNVERIFIED"
                            and r["actual_stat"] is None for r in result["rows"]))
        self.assertTrue(all(m["candidate_meets_predeclared_shadow_gates"] is False
                            for m in result["markets"].values()))
    def test_duplicate_saved_game_and_aftertip_identity_fail_closed(self):
        g,doc,old=self.fixture()
        with tempfile.TemporaryDirectory() as directory:
            folder=Path(directory)
            (folder/"one.json").write_text(json.dumps(doc))
            (folder/"two.json").write_text(json.dumps(doc))
            with self.assertRaisesRegex(ValueError,"DUPLICATE"):
                frozen_shadow(folder)
            (folder/"two.json").unlink()
            altered=copy.deepcopy(doc)
            altered["games"][0]["forecast_at_utc"]=TIP
            (folder/"one.json").write_text(json.dumps(altered))
            with self.assertRaisesRegex(ValueError,"LATE"):
                frozen_shadow(folder)

if __name__=="__main__":unittest.main()
