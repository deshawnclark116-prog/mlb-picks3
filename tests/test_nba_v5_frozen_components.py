"""Original archived game vs three model component numerical errors."""
import gzip
import json
import tempfile
import unittest
from pathlib import Path

from nba.nba_v5_frozen_components import compare, _paired

FORECAST = "2026-11-06T23:00:00+00:00"
TIP = "2026-11-07T00:00:00+00:00"


def pair(pid, market, mean, v4, v5):
    return {
        "player_id": pid,
        "player": "Example " + pid,
        "market": market,
        "mean": mean,
        "mean_basis": "CONDITIONAL_ON_PLAYING",
        "blend": {"v4_model_mean": v4, "v5_simulation_mean": v5,
                  "weights": [0.5, 0.5]},
    }


class FrozenCompareTests(unittest.TestCase):
    @staticmethod
    def put(root, gid, originals, graded, grade_forecast=FORECAST):
        archive = root / "archive"
        grades = root / "grades"
        archive.mkdir(exist_ok=True)
        grades.mkdir(exist_ok=True)
        game = {"game_id":gid,"forecast_at_utc":FORECAST,"tipoff_utc":TIP,
                "rows":originals}
        with gzip.open(archive / (gid+".json.gz"), "wt") as f:
            json.dump({"games":[game]},f)
        rows = []
        for base, actual, played in graded:
            rows.append({"player_id":base["player_id"],"player":base["player"],
                         "market":base["market"],"projection":base["mean"],
                         "played":played,"actual":actual,
                         "minutes_forecast":28,"minutes_actual":25 if played else None})
        (grades / (gid+".json")).write_text(json.dumps({
            "game_id":gid,"forecast_at_utc":grade_forecast,
            "kind":"last","rows":rows}))
        return archive, grades

    def test_paired_three_way_mae_same_original_numerical_event(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            p1=pair("1","points",14,16,12)
            p2=pair("2","assists",3,4,2)
            archive,grades=self.put(root,"100",[p1,p2],
                                    [(p1,10,True),(p2,2,True)])
            p3=pair("3","points",10,8,12)
            self.put(root,"101",[p3],[(p3,10,True)])
            report=compare(archive,grades)
            self.assertEqual(report["games_evaluated"],2)
            self.assertEqual(report["projections_evaluated"],3)
            points=report["by_market"]["points"]
            self.assertEqual(points["mae"],{"blend":2,"v4_only":4,"v5_only":2})
            self.assertEqual(report["by_market"]["assists"]["mae"],
                             {"blend":1,"v4_only":2,"v5_only":0})
            self.assertFalse(report["promoted"])
            self.assertEqual(points["games"],2)

    def test_dnp_and_unblended_rows_not_assigned_false_numerical_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            good=pair("1","points",10,8,12)
            dnp=pair("2","points",10,8,12)
            archive,grades=self.put(root,"100",[good,dnp],
                                    [(good,8,True),(dnp,None,False)])
            self.assertEqual(compare(archive,grades)["projections_evaluated"],1)

    def test_unmatched_postgame_forecast_time_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            p=pair("1","points",10,8,12)
            archive,grades=self.put(root,"100",[p],[(p,12,True)],
                    grade_forecast="2026-11-06T23:15:00+00:00")
            with self.assertRaisesRegex(ValueError,"TIMESTAMP_MISMATCH"):
                compare(archive,grades)

    def test_changed_original_mean_cannot_be_passed_as_graded(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            p=pair("1","points",10,8,12)
            archive,grades=self.put(root,"100",[p],[(p,12,True)])
            grade_file=grades/"100.json"
            changed=json.loads(grade_file.read_text())
            changed["rows"][0]["projection"]=9
            grade_file.write_text(json.dumps(changed))
            with self.assertRaisesRegex(ValueError,"MEAN_NOT_ORIGINAL"):
                _paired(archive,grades)


if __name__ == "__main__":
    unittest.main()
