"""NBA V5 near-tipoff refresh trigger from ESPN + official NBA statuses."""
import datetime as dt
import unittest

from nba.nba_v5_refresh_decision import decide

NOW=dt.datetime(2026,11,6,14,0,tzinfo=dt.timezone.utc)


def fixture():
    return {"games":[{"game_id":"55","home":"Charlotte Hornets","away":"Boston Celtics",
              "home_id":"30","away_id":"2","tipoff_utc":"2026-11-06T22:00:00+00:00"},
                     {"game_id":"past","home":"Miami Heat","away":"Detroit Pistons",
                      "home_id":"14","away_id":"8","tipoff_utc":"2026-11-06T13:00:00+00:00"}]}


def official(status="OUT",url="r1.pdf"):
    return {"schema":"NBA_OFFICIAL_INJURY_REPORT_SNAPSHOT_V1",
        "source_kind":"NBA_OFFICIAL_PDF_PREGAME_STATUS",
        "captured_at_utc":"2026-11-06T13:58:00+00:00",
        "published_at_utc":"2026-11-06T13:45:00+00:00",
        "report_url":url,"game_active_roster_certified":False,
        "reports":[{"matchup":"BOS@CHA","team_abbr":"BOS",
                    "normalized_player":"payton pritchard","status":status},
                   {"matchup":"DET@MIA","team_abbr":"DET",
                    "normalized_player":"other","status":"QUESTIONABLE"}]}


def espn(status="QUESTIONABLE"):
    return {"injuries":[{"team_id":"2","player_id":"100","source_reported_status":status},
                        {"team_id":"14","player_id":"888","source_reported_status":"OUT"}]}


class RefreshDecisionTests(unittest.TestCase):
    def evaluate(self,official_source=None,espn_source=None,state=None,now=NOW):
        return decide(fixture(),espn_source if espn_source is not None else espn(),
                      official_source if official_source is not None else official(),
                      state or {},now)

    def test_official_status_change_retriggers_before_normal_three_hour_delay(self):
        first=self.evaluate()
        state={"hash":first["hash"],"official_signature":first["official_signature"],
               "generated_at_utc":NOW.isoformat()}
        same=self.evaluate(state=state)
        self.assertFalse(same["run"])
        self.assertEqual(first["games"],1)
        changed=self.evaluate(official_source=official("AVAILABLE"),state=state)
        self.assertTrue(changed["run"])
        self.assertIn("source_changed",changed["reasons"])

    def test_source_pdf_timestamp_change_alone_is_not_basketball_change(self):
        first=self.evaluate()
        state={"hash":first["hash"],"official_signature":first["official_signature"],
               "generated_at_utc":NOW.isoformat()}
        res=self.evaluate(official_source=official(url="new_post_time.pdf"),state=state)
        self.assertFalse(res["run"])

    def test_official_outage_never_infers_that_the_player_was_cleared(self):
        first=self.evaluate()
        state={"hash":first["hash"],"official_signature":first["official_signature"],
               "generated_at_utc":NOW.isoformat()}
        unavailable=self.evaluate(official_source={},state=state)
        self.assertFalse(unavailable["run"])
        self.assertFalse(unavailable["official_source_observed"])
        self.assertEqual(unavailable["official_signature"],state["official_signature"])

    def test_non_out_espn_status_change_now_retriggers(self):
        first=self.evaluate()
        state={"hash":first["hash"],"official_signature":first["official_signature"],
               "generated_at_utc":NOW.isoformat()}
        changed=self.evaluate(espn_source=espn(status="PROBABLE"),state=state)
        self.assertTrue(changed["run"])

    def test_irrelevant_past_game_status_not_in_digest(self):
        first=self.evaluate()
        state={"hash":first["hash"],"official_signature":first["official_signature"],
               "generated_at_utc":NOW.isoformat()}
        e=espn()
        e["injuries"][1]["source_reported_status"]="QUESTIONABLE"
        res=self.evaluate(espn_source=e,state=state)
        self.assertFalse(res["run"])

    def test_new_source_is_not_permission_to_run_after_tipoff(self):
        no_future={"games":[{**fixture()["games"][0],
            "tipoff_utc":"2026-11-06T13:59:00+00:00"}]}
        r=decide(no_future,espn(),official(),{},NOW)
        self.assertFalse(r["run"])
        self.assertEqual(r["games"],0)

    def test_age_force_and_no_future_handling(self):
        first=self.evaluate()
        old={"hash":first["hash"],"official_signature":first["official_signature"],
             "generated_at_utc":"2026-11-06T10:00:00+00:00"}
        self.assertTrue(self.evaluate(state=old)["run"])
        recent={"hash":first["hash"],"official_signature":first["official_signature"],
                "generated_at_utc":NOW.isoformat()}
        r=decide(fixture(),espn(),official(),recent,NOW,force=True)
        self.assertTrue(r["run"])
        self.assertIn("manual_force",r["reasons"])


if __name__=="__main__":
    unittest.main()
