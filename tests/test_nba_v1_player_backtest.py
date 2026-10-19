"""Synthetic ONLY: NBA player walk-forward must not see today's actual lineup."""
import copy
import datetime as dt
import unittest
from nba.nba_v1_player_backtest import score,summary

def data(days=27):
    start=dt.date(2025,11,1)
    games=[];boxes={}
    for d in range(days):
        day=(start+dt.timedelta(days=d)).isoformat()
        gid=f"game-{d}"
        games.append({"game_id":gid,"day_utc":day,
            "start_utc":day+"T23:00:00+00:00","completed":True,
            "home_id":"1","away_id":"2"})
        records=[]
        for t in ("1","2"):
            for i in range(7):
                records.append({"event_id":gid,"team_id":t,"player_id":f"{t}.{i}",
                    "player":f"synthetic-{t}-{i}","minutes":20.+i,
                    "points":10+i+d%4,"rebounds":i+2,
                    "assists":i%5,"three_pointers_made":i%3})
        boxes[gid]=records
    return games,boxes

class WalkforwardPlayerTests(unittest.TestCase):
    def test_actual_game_day_not_used_in_player_projection(self):
        games,boxes=data()
        a=score(games,boxes,"2025-11-13","2025-11-18")
        changed=copy.deepcopy(boxes)
        changed["game-14"][0]["points"]+=70
        b=score(games,changed,"2025-11-13","2025-11-18")
        current_a=[r for r in a["results"] if r["game_id"]=="game-14"]
        current_b=[r for r in b["results"] if r["game_id"]=="game-14"]
        self.assertEqual(len(current_a),len(current_b))
        self.assertGreater(len(current_a),0)
        self.assertEqual([r["stat_mean"] for r in current_a],
                         [r["stat_mean"] for r in current_b])
        self.assertNotEqual(current_a[0]["actual"]["points"],
                            current_b[0]["actual"]["points"])
    def test_absent_player_excluded_and_doesnt_count_as_zero(self):
        games,boxes=data()
        boxes["game-14"]=boxes["game-14"][1:]
        a=score(games,boxes,"2025-11-13","2025-11-18")
        self.assertGreater(a["quarantined"].get(
            "FORECAST_PLAYER_NOT_IN_FINAL_ACTIVE_BOXSCORE",0),0)
        self.assertNotIn(("game-14","1","1.0"),
            {(r["game_id"],r["team_id"],r["player_id"]) for r in a["results"]})
    def test_true_holdout_metrics_and_zero_betting_claim(self):
        games,boxes=data()
        report=score(games,boxes,"2025-11-13","2025-11-18")
        self.assertGreater(report["stats"]["validation"]["played_player_forecasts"],20)
        self.assertGreater(report["stats"]["holdout"]["played_player_forecasts"],20)
        for k in ("points","rebounds","assists","three_pointers_made"):
            stats=report["stats"]["holdout"]["by_market"][k]
            self.assertGreater(stats["n"],20)
            self.assertGreaterEqual(stats["mae_model"],0)
            self.assertGreaterEqual(stats["mae_last_five"],0)
        self.assertTrue(report["research_only"])

if __name__=="__main__":
    unittest.main()
