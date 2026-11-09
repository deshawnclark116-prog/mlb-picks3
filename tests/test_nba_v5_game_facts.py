"""V5 must consume independently observed pregame game/roster facts,
never V3/V4 projected minutes, means or player probabilities."""
import datetime as dt
import unittest
from unittest.mock import patch

from nba.nba_v5_source_game_facts import SCHEMA, MARKETS, build, validate


class V5GameFactsTests(unittest.TestCase):
    def setUp(self):
        self.asof = dt.datetime(2026,11,9,16,0,tzinfo=dt.timezone.utc)
        self.now = self.asof + dt.timedelta(minutes=10)
        self.fixtures = {"games":[{
            "game_id":"123456789", "home_id":"1","away_id":"2",
            "home":"Home","away":"Away",
            "tipoff_utc":(self.asof+dt.timedelta(hours=1)).isoformat(),
        }]}
        self.rosters = {
            t:[{"player_id":str(i+(0 if t=="1" else 100)),
                "player":f"Player {i} {t}"} for i in range(10,17)]
            for t in ("1","2")}
        self.receipts = {
            t:{"sha256":"abcdef"+t,"url":"https://example.org/roster/"+t,
               "retrieved_at_utc":self.asof.isoformat()}
            for t in ("1","2")}
        self.supplemental = {
            t:{r["player_id"] for r in self.rosters[t]}
            for t in ("1","2")
        }

    def document(self):
        with patch("nba.nba_v5_source_game_facts.compile_histories",
                   return_value=({}, {}, {}, {}, {})):
            with patch("nba.nba_v5_source_game_facts.supplement_daily_roster",
                       return_value=(self.supplemental,{"1":[],"2":[]},{"capture_status":"NOT_CONNECTED"})):
                return build(self.fixtures,self.rosters,self.receipts,
                             [],{},self.asof,injury_snapshot={
                                 "captured_at_utc":self.asof.isoformat(),
                                 "injuries":[{
                                     "source_reported_status":"OUT","team_id":"2",
                                     "player_id":self.rosters["2"][0]["player_id"]
                                 }]})

    def test_neutral_player_roster_outputs_all_markets_without_old_predictions(self):
        doc = self.document()
        self.assertEqual(doc["schema"],SCHEMA)
        self.assertTrue(validate(doc,self.now))
        self.assertEqual(len(doc["games"]),1)
        rows=doc["games"][0]["rows"]
        self.assertEqual(len(rows),14*len(MARKETS))
        for r in rows:
            self.assertEqual(r["game_id"],"123456789")
            self.assertNotIn("mean",r)
            self.assertNotIn("cdf_lattice",r)
            self.assertNotIn("conditional_minutes_mean",r)
            self.assertTrue(r["source_roster_gate_not_forecast_probability"])
        out=[r for r in rows if r["reported_status"]=="OUT"]
        self.assertEqual(len(out),len(MARKETS))
        self.assertTrue(all(r["p_active"]==0 for r in out))
        self.assertTrue(all(r["p_active"]==1 for r in rows if r not in out))

    def test_reject_prior_version_projection_contamination(self):
        doc=self.document()
        doc["games"][0]["rows"][0]["mean"]=12.5
        with self.assertRaisesRegex(ValueError,"PREVIOUS_MODEL"):
            validate(doc,self.now)
        del doc["games"][0]["rows"][0]["mean"]
        doc["games"][0]["rows"][0]["cdf_lattice"]={"cdf":[0.1,1]}
        with self.assertRaisesRegex(ValueError,"PREVIOUS_MODEL"):
            validate(doc,self.now)

    def test_reject_future_and_stale_facts(self):
        doc=self.document()
        with self.assertRaisesRegex(ValueError,"STALE_OR_FUTURE"):
            validate(doc,self.asof-dt.timedelta(minutes=1))
        with self.assertRaisesRegex(ValueError,"STALE_OR_FUTURE"):
            validate(doc,self.asof+dt.timedelta(hours=5))

    def test_neutral_builder_requires_pregame_eligible_fixture(self):
        self.fixtures["games"][0]["tipoff_utc"]=(self.asof+dt.timedelta(minutes=12)).isoformat()
        self.assertEqual(self.document()["games"],[])

    def test_pipeline_reads_facts_for_native_v5_but_original_v3_only_for_v4(self):
        from pathlib import Path
        wf=Path(".github/workflows/nba_v3_latest_refresh.yml").read_text()
        self.assertIn('--v5-facts-out "$RUNNER_TEMP/v5_game_facts.json"',wf)
        self.assertIn('--game-facts "$RUNNER_TEMP/v5_game_facts.json"',wf)
        self.assertIn('docs/nba_v5_latest/game_source_facts.json',wf)
        v5run=wf.split("PYTHONPATH=. python -u -m nba.nba_v5_forecast")[1].split("\n",7)[0]
        self.assertNotIn("--v3",v5run)
        self.assertNotIn("--v4",v5run)


if __name__=="__main__":
    unittest.main()
