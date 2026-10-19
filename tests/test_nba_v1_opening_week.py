"""Synthetic NBA source tests; no synthetic projections are published as real."""
import datetime as dt
import unittest
from nba.nba_v1_opening_week import preview,replay_previous_season

def history(n=840):
    rows=[]
    for i in range(n):
        h=i%30+1
        a=(i+((i//30)%29)+1)%30+1
        if h==a:a=(a%30)+1
        day=(dt.date(2025,10,21)+dt.timedelta(days=i//8)).isoformat()
        rows.append({
            "game_id":str(i+1),"home_id":str(h),"away_id":str(a),
            "home":str(h),"away":str(a),"day_utc":day,
            "start_utc":day+"T23:00:00+00:00","completed":True,
            "home_points":116+i%11,"away_points":104+i%8})
    return rows

class NBAOpening(unittest.TestCase):
    def test_preview_is_not_bet_and_requires_unverified_roster_label(self):
        games=history()
        f={"game_id":"open1","home_id":"1","away_id":"2",
            "home":"A","away":"B","completed":False,
            "start_utc":"2026-10-20T23:00:00+00:00"}
        results,unknown=preview(games,[f],dt.datetime(2026,10,19,tzinfo=dt.timezone.utc))
        self.assertEqual(unknown,[])
        self.assertEqual(len(results),1)
        x=results[0]
        self.assertEqual(x["wager_recommendation"],False)
        self.assertEqual(x["betting_line_available"],False)
        self.assertEqual(x["role_availability_verified"],False)
        self.assertAlmostEqual(x["home_win_probability"]+x["away_win_probability"],1.0,places=4)
        self.assertGreater(x["projected_game_total_mean"],100)
    def test_no_past_tipped_off_game_or_missing_team_is_invented(self):
        games=history()
        f={"game_id":"open1","home_id":"1","away_id":"2",
            "home":"A","away":"B","completed":False,
            "start_utc":"2026-10-20T23:00:00+00:00"}
        a,excluded=preview(games,[f],dt.datetime(2026,10,21,tzinfo=dt.timezone.utc))
        self.assertEqual(a,[])
        f["home_id"]="99999"
        a,excluded=preview(games,[f],dt.datetime(2026,10,19,tzinfo=dt.timezone.utc))
        self.assertEqual(a,[])
        self.assertEqual(excluded,["open1"])
    def test_insufficient_prior_season_refuses_to_predict(self):
        with self.assertRaisesRegex(ValueError,"INSUFFICIENT"):
            replay_previous_season(history(100))
if __name__=="__main__":
    unittest.main()
