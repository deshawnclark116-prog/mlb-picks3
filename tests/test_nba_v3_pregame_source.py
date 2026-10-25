"""Test real source receipts, no historical game contamination and V3 shadow."""
import copy
import unittest
import datetime as dt
from collections import Counter
from nba.nba_v3_shadow_publish import historically_observed_pace,already_seen
from nba.nba_v3_phase1_engine import role_pool,simulate_matchup
from tests.test_nba_v3_phase1 import inputs,ASOF,TIP

class TestNbaV3HistoricalPace(unittest.TestCase):
    def test_verified_fga_fta_oreb_turnovers_drive_real_pace_only(self):
        groups=[]
        boxes={}
        for index in range(9):
            gid=f'{index+1}'
            groups.append({"game_id":gid,"home_id":"1","away_id":"2"})
            boxes[gid]=[
                {"team_id":"1","field_goal_attempts":17,
                 "free_throw_attempts":4,"offensive_rebounds":2,"turnovers":3}
                 for _ in range(6)]+[
                {"team_id":"2","field_goal_attempts":16,
                 "free_throw_attempts":4,"offensive_rebounds":2,"turnovers":3}
                 for _ in range(6)]
        result=historically_observed_pace(groups,boxes,("1","2"))
        self.assertEqual(result["1"]["prior_games"],8)
        self.assertGreater(result["1"]["prior_possessions_mean"],100)
        a=simulate_matchup("history",inputs(),asof_utc=ASOF,tipoff_utc=TIP,
             draws=1500,pace_context=result)
        self.assertGreater(a["historical_verified_pace_multiplier"],1.0)
        # Removing one required field from every prior game removes support,
        # and the model MUST NOT invent the lost pace data.
        changed=copy.deepcopy(boxes)
        for rows in changed.values():
            for player in rows:del player["turnovers"]
        missing=historically_observed_pace(groups,changed,("1","2"))
        self.assertEqual(missing["1"]["prior_games"],0)
        b=simulate_matchup("history",inputs(),asof_utc=ASOF,tipoff_utc=TIP,
             draws=1500,pace_context=missing)
        self.assertEqual(b["historical_verified_pace_multiplier"],1.0)
        with self.assertRaisesRegex(ValueError,"OPPONENT_PACE_IDENTITY"):
            simulate_matchup("history",inputs(),asof_utc=ASOF,tipoff_utc=TIP,
               draws=1500,pace_context={"1":result["1"]})

    def test_source_pace_never_adds_missing_or_out_of_range_stats(self):
        game=[{"game_id":"1","home_id":"1","away_id":"2"}]
        boxes={"1":[{"team_id":"1","field_goal_attempts":1000,
                "free_throw_attempts":4,"offensive_rebounds":0,"turnovers":3}
              for _ in range(7)]}
        result=historically_observed_pace(game,boxes,("1","2"))
        self.assertEqual(result["1"]["prior_games"],0)
        self.assertIsNone(result["1"]["prior_possessions_mean"])

if __name__=="__main__":unittest.main()
