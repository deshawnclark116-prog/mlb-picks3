"""Frozen original V5 P(play) versus untouched past-only candidate contract."""
import datetime as dt
import unittest

from nba.nba_v5_forecast import prospective_recency_pplay
from nba.nba_v5_recency_pplay import estimate_unlisted

DAY=dt.date(2026,11,7)
HISTORY=[(DAY-dt.timedelta(days=6-i),str(i),{"100":31.0})
         for i in range(6)]


class ProspectiveParticipationTests(unittest.TestCase):
    def test_challenger_is_saved_but_production_play_chance_is_unchanged(self):
        displayed, receipt=prospective_recency_pplay(
            .65,None,"UNKNOWN_NOT_ACTIVE_CERTIFIED",HISTORY,"100",DAY)
        self.assertEqual(displayed,.65)
        self.assertGreater(receipt["challenger_P_play"],.96)
        self.assertEqual(receipt["original_P_play"],.65)
        self.assertFalse(receipt["promoted"])
        self.assertEqual(receipt["schema"],"NBA_V5_ORIGINAL_PRETIP_PPLAY_SHADOW_V1")

    def test_explicit_feature_flag_changes_only_participation_input(self):
        predicted,receipt=prospective_recency_pplay(
            .65,None,"UNKNOWN_NOT_ACTIVE_CERTIFIED",HISTORY,"100",DAY,
            enable=True)
        expected,_=estimate_unlisted(.65,HISTORY,"100",DAY)
        self.assertAlmostEqual(predicted,expected)
        self.assertTrue(receipt["promoted"])

    def test_reported_questionable_and_out_players_never_promoted(self):
        for report,status in (({"status":"QUESTIONABLE"},"QUESTIONABLE"),
                              (None,"QUESTIONABLE"),({"status":"OUT"},"OUT"),
                              ({"status":"PROBABLE"},"UNKNOWN_NOT_ACTIVE_CERTIFIED")):
            p,proof=prospective_recency_pplay(
                .20,report,status,HISTORY,"100",DAY,enable=True)
            self.assertEqual(p,.20)
            self.assertEqual(proof["challenger_P_play"],.20)
            self.assertEqual(proof["change_reason"],
                             "KEEP_OFFICIAL_OR_REPORTED_STATUS_UNCHANGED")

    def test_source_requires_prior_current_team_appearance(self):
        p,receipt=prospective_recency_pplay(
            .75,None,"UNKNOWN_NOT_ACTIVE_CERTIFIED",
            [(day,gid,{"other":32}) for day,gid,_ in HISTORY],
            "100",DAY,enable=True)
        self.assertEqual(p,.75)
        self.assertEqual(receipt["change_reason"],
                         "NO_CURRENT_TEAM_PRIOR_APPEARANCE")

    def test_no_target_date_result_can_change_frozen_candidate(self):
        before,receipt=prospective_recency_pplay(
            .7,None,"UNKNOWN_NOT_ACTIVE_CERTIFIED",HISTORY,"100",DAY,enable=True)
        future=HISTORY+[(DAY,"future",{"100":48}),
                        (DAY+dt.timedelta(days=1),"later",{})]
        after,proof=prospective_recency_pplay(
            .7,None,"UNKNOWN_NOT_ACTIVE_CERTIFIED",future,"100",DAY,enable=True)
        self.assertEqual(before,after)
        self.assertEqual(receipt["challenger_P_play"],proof["challenger_P_play"])


if __name__=="__main__":
    unittest.main()
