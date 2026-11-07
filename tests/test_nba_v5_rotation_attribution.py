"""No hindsight or selection in NBA V5 frozen rotation attribution."""
import gzip
import json
import tempfile
import unittest
from pathlib import Path

from nba.nba_v5_rotation_attribution import build, bucket

FORECAST="2026-11-06T22:00:00+00:00"
TIP="2026-11-06T23:00:00+00:00"


def fields(pid,team,mean=10.0,minutes=32.0):
    return {
        "player_id":pid,"team_id":team,"market":"points","mean":mean,
        "minutes_mean":minutes,"p_active":0.82,
        "blend":{"weights":[0.5,0.5],"v4_model_mean":8.0,"v5_simulation_mean":12.0},
    }


def fixture(tmp):
    root=Path(tmp)
    archives=root/"archive"
    grades=root/"grades"
    archives.mkdir()
    grades.mkdir()
    records=[fields("100","1"),fields("200","2")]
    game={
        "game_id":"123","forecast_at_utc":FORECAST,"tipoff_utc":TIP,
        "home_id":"1","away_id":"2","home":"Home","away":"Away",
        "roster_integrity_audit":{
            "home":{"represented_fraction":0.60,"warning":"MATERIAL_PRIOR_ROTATION_UNREPRESENTED",
                    "missing_from_fixture_prior_minutes":90.0,
                    "missing_from_model_prior_minutes":12.0},
            "away":{"represented_fraction":0.95,"warning":"NORMAL_RECENT_ROSTER_COVERAGE",
                    "missing_from_fixture_prior_minutes":0.0,
                    "missing_from_model_prior_minutes":0.0},
        },
        "rows":records,
    }
    with gzip.open(archives/"123.json.gz","wt") as f:
        json.dump({"games":[game]},f)
    grade={"kind":"last","game_id":"123","forecast_at_utc":FORECAST,"rows":[
        {"player_id":"100","market":"points","played":True,
         "projection":10.0,"actual":4.0,"minutes_forecast":32.0,"minutes_actual":18.0},
        {"player_id":"200","market":"points","played":False,
         "projection":10.0,"actual":None,"minutes_forecast":32.0,"minutes_actual":None}
    ]}
    (grades/"123.json").write_text(json.dumps(grade))
    return archives,grades


class RotationAttributionTests(unittest.TestCase):
    def test_buckets_are_exante_and_bounded(self):
        self.assertEqual(bucket(.60),"LOW_UNDER_75PCT")
        self.assertEqual(bucket(.75),"PARTIAL_75_TO_90PCT")
        self.assertEqual(bucket(.90),"HIGH_AT_LEAST_90PCT")
        self.assertEqual(bucket(None),"UNOBSERVED_PRIOR_COVERAGE")
        for x in (-.1,1.2):
            with self.assertRaisesRegex(ValueError,"INVALID_PRETIP"):
                bucket(x)

    def test_no_player_excluded_because_of_missing_minutes_or_dnp(self):
        with tempfile.TemporaryDirectory() as tmp:
            archives,grades=fixture(tmp)
            result=build(archives,grades)
            self.assertEqual(result["games"],1)
            self.assertEqual(result["events"],2)
            self.assertEqual(result["overall"]["DNP_players"],1)
            lower=result["by_frozen_pretip_roster_coverage"]["LOW_UNDER_75PCT"]
            higher=result["by_frozen_pretip_roster_coverage"]["HIGH_AT_LEAST_90PCT"]
            self.assertEqual(lower["played_players"],1)
            self.assertEqual(lower["minute_signed_bias"],14.0)
            self.assertEqual(lower["markets"]["points"]["MAE"],
                {"v4_only":4.0,"v5_only":8.0,"blend":6.0})
            self.assertEqual(higher["DNP_players"],1)
            self.assertIsNone(higher["minute_MAE"])
            self.assertFalse(result["promoted"])

    def test_omitted_minutes_are_after_game_context_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            archives,grades=fixture(tmp)
            p=Path(tmp)/"missing.json"
            p.write_text(json.dumps({
                "schema":"NBA_V5_POSTGAME_ROSTER_OMISSION_AUDIT_V1",
                "games":[{"game_id":"123","missing_minutes_by_side":{"home":35.0,"away":0.0}}]}))
            result=build(archives,grades,p)
            home=result["per_game_team_audit"][0]["teams"]["home"]
            self.assertEqual(home["postgame_missing_actual_player_minutes"],35.0)
            self.assertEqual(home["prior_rotation_coverage"],0.60)

    def test_mismatched_original_forecast_time_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            archives,grades=fixture(tmp)
            path=grades/"123.json"
            doc=json.loads(path.read_text())
            doc["forecast_at_utc"]="2026-11-06T22:01:00+00:00"
            path.write_text(json.dumps(doc))
            with self.assertRaisesRegex(ValueError,"CLOCK_CHANGED"):
                build(archives,grades)


if __name__=="__main__":
    unittest.main()
