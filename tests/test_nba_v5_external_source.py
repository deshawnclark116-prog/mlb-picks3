"""NBA V5 authorized-data contracts: never invent unavailable tracking features."""
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

from nba.nba_v5_external_source import validate_source,read_source

NOW="2026-11-06T15:00:00+00:00"
ROSTER={("2","101"),("2","102"),("30","301")}


def source(schema="NBA_PLAYER_TRACKING_AGGREGATES_V1"):
    features=({"touches_per_game":58.3,"drives_per_game":10.1,
               "potential_assists_per_game":7.5,
               "contested_rebounds_per_game":2.2,
               "closest_defender_distance_ft":4.5}
              if "TRACKING" in schema else
              {"isolation_possessions_per_game":2.1,
               "pr_ballhandler_possessions_per_game":6.5,
               "handoff_possessions_per_game":1.0,
               "pr_ballhandler_points_per_possession":0.92})
    return {"provider":"contracted_authorized_source",
            "dataset_schema":schema,
            "source_documentation_url":"https://provider.example/data",
            "license_or_authorization_reference":"internal_export_receipt_20261105",
            "observation_end_utc":"2026-11-05T23:00:00+00:00",
            "published_at_utc":"2026-11-06T10:00:00+00:00",
            "captured_at_utc":"2026-11-06T12:00:00+00:00",
            "player_rows":[{"team_id":"2","player_id":"101","sample_games":12,
                            "features":features},
                           {"team_id":"30","player_id":"301","sample_games":5,
                            "features":features}]}


class SourceContracts(unittest.TestCase):
    def test_only_exact_known_roster_mapping_and_preforecast_observations(self):
        doc=source()
        doc["player_rows"].append(
            {"team_id":"15","player_id":"102","sample_games":7,
             "features":{"touches_per_game":20.0}})
        result,audit=validate_source(doc,NOW,ROSTER)
        self.assertEqual(len(result),2)
        self.assertEqual(audit["unknown_current_roster_mappings"],1)
        self.assertIn(("2","101"),result)
        self.assertNotIn(("15","102"),result)
        self.assertFalse(audit["model_feature_promotion_allowed"])
        self.assertTrue(audit["raw_features_not_redistributed"])
        self.assertEqual(audit["field_coverage_counts"]["touches_per_game"],2)

    def test_future_revisions_and_authorization_gaps_fail_closed(self):
        for key,value in [
            ("observation_end_utc","2026-11-07T01:00:00+00:00"),
            ("published_at_utc","2026-11-07T01:00:00+00:00"),
            ("captured_at_utc","2026-11-07T01:00:00+00:00"),
            ("captured_at_utc","2026-11-06T12:00:00"),
            ("license_or_authorization_reference",""),
            ("source_documentation_url","http://unsafe.example"),
        ]:
            doc=source();doc[key]=value
            with self.subTest(key=key,value=value):
                with self.assertRaises(ValueError):
                    validate_source(doc,NOW,ROSTER)

    def test_conflicting_duplicates_never_silently_merge(self):
        doc=source()
        doc["player_rows"].append(dict(doc["player_rows"][0]))
        with self.assertRaisesRegex(ValueError,"DUPLICATE"):
            validate_source(doc,NOW,ROSTER)

    def test_unknown_fields_and_invalid_numeric_values_are_not_hallucinated(self):
        doc=source()
        doc["player_rows"][0]["features"]={"who_guards_whom_made_up":55}
        accepted,diag=validate_source(doc,NOW,ROSTER)
        self.assertEqual(len(accepted),1)
        self.assertEqual(diag["invalid_player_records"],1)
        doc=source()
        doc["player_rows"][0]["features"]={"shot_clock_seconds_mean":25}
        accepted,diag=validate_source(doc,NOW,ROSTER)
        self.assertEqual(len(accepted),1)
        self.assertEqual(diag["invalid_player_records"],1)

    def test_playtype_schema_valid_and_distinct_from_tracking(self):
        doc=source("NBA_PLAYER_PLAY_TYPES_V1")
        res,quality=validate_source(doc,NOW,ROSTER)
        self.assertEqual(len(res),2)
        self.assertEqual(quality["dataset_schema"],"NBA_PLAYER_PLAY_TYPES_V1")
        self.assertNotIn("touches_per_game",res[("2","101")]["features"])

    def test_jsonl_not_assumed_and_raw_file_not_published(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"source.json"
            path.write_text(json.dumps(source()))
            res,meta=read_source(path,dt.datetime.fromisoformat(NOW),ROSTER)
            self.assertEqual(len(meta["local_snapshot_sha256"]),64)
            self.assertEqual(len(res),2)
            self.assertNotIn("player_rows",meta)
            self.assertNotIn("features",meta)


if __name__=="__main__":
    unittest.main()
