"""Pregame NBA official injury source validation. No network required in unit tests."""
import datetime as dt
import unittest

from nba.nba_v5_official_injuries import (
    ET, PAGE, norm, report_links, _group_rows, parse_page_rows, for_forecasts,
)


def row(y, *, matchup="", team="", name="", status="", reason=""):
    words=[]
    for x,value in ((25,matchup),(32,team),(54,name),(71,status),(81,reason)):
        # x is percentage of PDF page width
        for i, token in enumerate(value.split()):
            words.append({"top":float(y),"x0":float(x*10 + i*35),"text":token})
    return words


class OfficialInjuriesTests(unittest.TestCase):
    def test_published_report_selection_respects_as_of_and_host(self):
        now=dt.datetime(2026,11,6,14,1,tzinfo=dt.timezone.utc)
        h='<a href="https://evil.test/referee/injury/Injury-Report_2026-11-06_08_59AM.pdf">bad</a>'
        for t in ("08_45AM","09_15AM","08_30AM","08_55AM"):
            h+=f'<a href="https://ak-static.cms.nba.com/referee/injury/Injury-Report_2026-11-06_{t}.pdf">report</a>'
        links=report_links(h,now)
        self.assertEqual(len(links),3)
        self.assertTrue(links[0][1].endswith("08_55AM.pdf"))
        self.assertTrue(all(x[0]<=now for x in links))

    def test_name_normalization_comma_accents_and_suffix(self):
        self.assertEqual(norm("Dončić, Luka"),norm("Luka Doncic"))
        self.assertEqual(norm("Cenac Jr., Christopher"),norm("Christopher Cenac Jr."))
        self.assertEqual(norm("Steinbach, Hannes"),norm("Hannes Steinbach"))

    def test_pdf_column_rows_carry_team_across_page(self):
        # Mock words with physically separated column coordinates, not strings
        # joined from the PDF. Player row can omit repeated matchup/team.
        state={"matchup":None,"team":None,"malformed":0}
        words=[]
        words+=row(100,matchup="BOS@CHA",team="Boston Celtics",name="Pritchard, Payton",
                   status="Questionable",reason="Right Eye Abrasion")
        words+=row(120,name="Carter, Devin",status="Out",reason="G League Two Way")
        words+=row(141,team="Charlotte Hornets",name="Diabate, Moussa",
                   status="Questionable")
        entries=parse_page_rows(_group_rows(words),1000,state)
        self.assertEqual([r["status"] for r in entries],["QUESTIONABLE","OUT","QUESTIONABLE"])
        self.assertEqual([r["team_abbr"] for r in entries],["BOS","BOS","CHA"])
        nextpage=parse_page_rows(_group_rows(row(28,name="Knueppel, Kon",status="Out")),1000,state)
        self.assertEqual(nextpage[0]["team_abbr"],"CHA")

    def test_exact_matchup_team_and_player_prevents_cross_team_leak(self):
        captured="2026-11-06T13:05:00+00:00"
        snapshot={
            "schema":"NBA_OFFICIAL_INJURY_REPORT_SNAPSHOT_V1",
            "captured_at_utc":captured,"published_at_utc":"2026-11-06T13:00:00+00:00",
            "report_url":"https://ak-static.cms.nba.com/referee/injury/Injury-Report_2026-11-06_08_00AM.pdf",
            "absence_from_report_does_not_mean_healthy":True,"game_active_roster_certified":False,
            "reports":[
                {"matchup":"BOS@CHA","team_abbr":"BOS","player":"Pritchard, Payton",
                 "normalized_player":norm("Pritchard, Payton"),"status":"QUESTIONABLE","reason":"Eye"},
                {"matchup":"BOS@CHA","team_abbr":"CHA","player":"Pritchard, Payton",
                 "normalized_player":norm("Pritchard, Payton"),"status":"OUT","reason":"Wrong team"},
                {"matchup":"BOS@CHA","team_abbr":"BOS","player":"Cenac Jr., Christopher",
                 "normalized_player":norm("Cenac Jr., Christopher"),"status":"OUT","reason":"G League"},
            ]}
        game={"game_id":"42","away":"Boston Celtics","home":"Charlotte Hornets",
              "away_id":"2","home_id":"30",
              "rows":[
                {"team_id":"2","player":"Payton Pritchard","player_id":"100"},
                {"team_id":"2","player":"Christopher Cenac Jr.","player_id":"101"},
                {"team_id":"30","player":"Brandon Miller","player_id":"102"},
              ]}
        matches=for_forecasts(snapshot,{"games":[game]},dt.datetime(2026,11,6,13,10,tzinfo=dt.timezone.utc))
        self.assertEqual(len(matches["42"]),2)
        self.assertEqual({r["player_id"]:r["status"] for r in matches["42"]},{"100":"QUESTIONABLE","101":"OUT"})
        self.assertTrue(all(r["team_id"]=="2" for r in matches["42"]))

    def test_future_capture_rejected(self):
        now=dt.datetime(2026,11,6,13,0,tzinfo=dt.timezone.utc)
        with self.assertRaises(ValueError):
            for_forecasts({"schema":"NBA_OFFICIAL_INJURY_REPORT_SNAPSHOT_V1",
               "captured_at_utc":"2026-11-06T14:00:00+00:00",
               "published_at_utc":"2026-11-06T13:00:00+00:00",
               "game_active_roster_certified":False,
               "absence_from_report_does_not_mean_healthy":True}, {"games":[]},now)



    def test_source_precedence_official_out_and_future_time(self):
        from nba.nba_v5_forecast import choose_availability_reports
        now=dt.datetime(2026,11,6,14,0,tzinfo=dt.timezone.utc)
        espn={"player_id":"100","source":"game_feed","status":"QUESTIONABLE",
              "published_at":"2026-11-06T13:58:00+00:00"}
        official={"player_id":"100","source":"official_nba_injury_report","status":"OUT",
                  "published_at":"2026-11-06T13:45:00+00:00"}
        r=choose_availability_reports([espn,official],now)
        self.assertTrue(r["100"]["fresh_official"])
        self.assertEqual(r["100"]["status"],"OUT")
        old=dict(official,published_at="2026-11-06T08:00:00+00:00")
        self.assertEqual(choose_availability_reports([old,espn],now)["100"]["status"],"QUESTIONABLE")
        future=dict(official,published_at="2026-11-06T16:00:00+00:00")
        self.assertEqual(choose_availability_reports([future],now),{})

    def test_official_receipts_log_source_and_espen_disagreements(self):
        from unittest.mock import patch
        import tempfile
        from pathlib import Path
        from nba import nba_v5_info as info
        now=dt.datetime(2026,11,6,14,10,tzinfo=dt.timezone.utc)
        g={"game_id":"42","home_id":"30","away_id":"2",
           "tipoff_utc":"2026-11-06T23:00:00+00:00",
           "rows":[{"player":"Payton Pritchard","player_id":"100","team_id":"2",
                    "reported_status":"QUESTIONABLE"}]}
        espn={"status":"QUESTIONABLE","name":"Payton Pritchard","published":"2026-11-06T13:59:00+00:00"}
        off={"player_id":"100","team_id":"2","player":"Pritchard, Payton",
             "status":"OUT","published_at_utc":"2026-11-06T14:00:00+00:00",
             "source":"official_nba_injury_report","report_url":"https://ak-static.cms.nba.com/referee/injury/demo.pdf",
             "reason":"Injury/Illness"}
        with tempfile.TemporaryDirectory() as root:
            ledger=Path(root)/"ledger.jsonl"
            with patch.object(info,"league_feed",return_value=({("2","100"):espn},now.isoformat())), \
                 patch.object(info,"game_feed",return_value={("2","100"):espn}):
                snap,events=info.build_receipts({"games":[g]}, {"100"},ledger,now=now,
                     official_matches={"42":[off]})
            rows=snap["42"]["reports"]
            self.assertEqual(len([r for r in rows if r["source"]=="official_nba_injury_report"]),1)
            self.assertEqual(snap["42"]["official_matched_player_count"],1)
            self.assertTrue(snap["42"]["checks"]["official_conflict"])
            self.assertIn("official_nba_injury_report",[e["source"] for e in events])


    def test_fresh_available_only_restores_known_player_on_saved_roster(self):
        from nba.nba_v5_forecast import pseudo_game
        g={"home_id":"30","away_id":"2",
           "rows":[{"player_id":"100","team_id":"2","player":"Payton Pritchard",
                    "reported_status":"OUT","p_active":0.02},
                   {"player_id":"101","team_id":"2","player":"Other Player",
                    "reported_status":"QUESTIONABLE","p_active":0.5}]}
        self.assertEqual([p["id"] for p in pseudo_game(g)["players"]],["101"])
        restored=pseudo_game(g,officially_available={"100","999"})["players"]
        self.assertEqual({p["id"] for p in restored},{"100","101"})
        self.assertEqual(next(p for p in restored if p["id"]=="100")["side"],"away")


if __name__=="__main__":
    unittest.main()
