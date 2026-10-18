"""Fail-closed numeric NHL POINT COUNT shadow; never convert point odds into mean."""
import sqlite3, tempfile, unittest
from pathlib import Path
from datetime import datetime, timezone
from scripts.nhl_points_numeric_research import (
    projection, forward_grade, future_board, rows_from_db, WEIGHTS, SCHEMA
)


def played(player, season, date, count, team="MIN", game=0):
    return dict(player_id=player, game_id=game, team=team, opponent="CBJ",
                season=season, game_date=date, points=count,
                goals=count, assists=0, toi_seconds=1100.0)


class TestNhlNumeric(unittest.TestCase):
    def test_independent_mean_is_not_the_points_over_half_classifier(self):
        history=[played(1,2025,f"2025-01-{i:02}",1,game=i) for i in range(1,22)]
        history += [played(1,2026,f"2026-10-{i:02}",v,game=30+i)
                    for i,v in enumerate((0,2,1,1),1)]
        result=projection(history,2026)
        self.assertEqual(result["current_season_games"],4)
        self.assertEqual(result["prior_season_games"],21)
        expected=WEIGHTS["season"]*1 + WEIGHTS["recent5"]*1+WEIGHTS["prior_season"]*1
        self.assertAlmostEqual(result["projected_mean_points"],expected)
        self.assertEqual(result["historical_last3_mean"],round(4/3,4))

    def test_missing_current_sample_never_claims_mean_from_classifier(self):
        self.assertIsNone(projection([],2026))
        self.assertIsNone(projection([played(1,2026,"2026-10-14",2)],2026))

    def test_real_pregame_board_strictly_source_timestamp_bound(self):
        hist=[played(1,2026,"2026-10-10",1,game=1),
              played(1,2026,"2026-10-12",0,game=2),
              played(1,2026,"2026-10-14",2,game=3),
              played(1,2026,"2026-10-19",6,game=4)]
        up={"generated_at_utc":"2026-10-18T12:00:00Z",
            "picks":[{"market":"points","player_id":1,"player":"Player One",
            "team":"MIN","opponent":"CBJ","game_date":"2026-10-18",
            "season":2026,"kickoff_utc":"2026-10-18T22:00:00Z","model_prob":.744},
            {"market":"points_early_season","player_id":1,"player":"Player One",
            "team":"MIN","opponent":"CBJ","game_date":"2026-10-18",
            "season":2026,"kickoff_utc":"2026-10-18T22:00:00Z","model_prob":.60}]}
        now=datetime(2026,10,18,17,tzinfo=timezone.utc)
        rows=future_board(hist,up,now,published_at="2026-10-18T17:00:00Z")
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]["independently_estimated_stat"]["projected_mean_points"],1)
        self.assertFalse(rows[0]["confirmed_dressed"])
        self.assertFalse(rows[0]["verified_bookmaker_line"])
        self.assertEqual(rows[0]["source_board_generated_at_utc"],up["generated_at_utc"])
        self.assertEqual(rows[0]["status"],"NEW_PREGAME_RESEARCH_ONLY")
        post=datetime(2026,10,18,23,tzinfo=timezone.utc)
        self.assertEqual(future_board(hist,up,post,published_at="2026-10-18T23:00:00Z"),[])
        bad=dict(up,generated_at_utc="2026-10-19T00:00:00Z")
        self.assertEqual(future_board(hist,bad,now,published_at="2026-10-18T17:00:00Z"),[])

    def test_retrospective_forward_uses_only_prior_game_dates(self):
        hist=[played(1,2026,f"2026-10-{i:02}",v,game=i)
              for i,v in enumerate((0,0,0,0,10),1)]
        report=forward_grade(hist,2026,2026)
        self.assertEqual(report["overall"]["n"],2)
        self.assertEqual(report["examples"][0]["numerical_prediction"],0)
        self.assertEqual(report["examples"][0]["actual_points"],0)
        self.assertEqual(report["examples"][1]["actual_points"],10)
        self.assertFalse(report["research_display_gate_passed"])

    def test_invalid_stat_row_fails_not_clips(self):
        with tempfile.TemporaryDirectory() as root:
            db=Path(root)/"games.sqlite"
            con=sqlite3.connect(db)
            con.execute("""CREATE TABLE skater_games(
                player_id INTEGER,game_id INTEGER,team TEXT,opponent TEXT,season INTEGER,
                game_date TEXT,points INTEGER,goals INTEGER,assists INTEGER,toi_seconds REAL)""")
            con.execute("INSERT INTO skater_games VALUES (1,1,'MIN','CBJ',2026,'2026-10-11',2,1,0,1000.0)")
            con.commit();con.close()
            with self.assertRaisesRegex(ValueError,"BAD_OFFICIAL"):
                rows_from_db(db)


if __name__=="__main__": unittest.main()
