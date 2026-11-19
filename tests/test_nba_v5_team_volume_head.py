"""Independent chronological NBA team opportunity and opponent-defense contracts."""
import copy
import datetime as dt
import unittest

import numpy as np

from nba.nba_v5_team_volume_head import (
    TeamVolumeHead, STATS, MAX_PLAYER_NORMALIZATION,
    completed_game_team_records, team_correction_factors)
from nba.nba_v5_empirical_stat_engine import simulate_empirical_game
from nba.nba_v5_backtest import date_bounded_game_ids
from tests.test_nba_v5_empirical_stat_engine import DAY, inputs


def fake_games(days=30):
    games=[]
    for i in range(days):
        date=dt.date(2026,1,1)+dt.timedelta(days=i)
        for k in range(12):
            home=str(10+k);away=str(50+k)
            players=[]
            for side,team in (("home",home),("away",away)):
                for j in range(2):
                    fga=15.+j+(i%5)+k%3
                    players.append({
                        "id":str(team)+"_"+str(j), "side":side, "team":team,
                        "min":32., "start":j==0,
                        "fga":fga,"tpa":fga*.35,"fta":fga*.20,
                        "ast":3.+j+i%3,"reb":5.+j+k%2,
                        "pts":fga*1.1,"oreb":1.,"tov":2.,
                        "tpm":fga*.13
                    })
            games.append({"game_id":str(i*12+k),
                          "date":str(date),"home":{"id":home},
                          "away":{"id":away},"players":players})
    return games


def scout():
    example={"own":{"fga":80.,"tpa":30.,"fta":20.,"ast":24.,"reb":48.},
             "opp":{"fga":85.,"tpa":32.,"fta":18.,"ast":26.,"reb":47.},
             "poss":100.,"opp_poss":100.}
    own=[dict(example,date=DAY-dt.timedelta(days=i)) for i in range(10,0,-1)]
    opp=[dict(example,date=DAY-dt.timedelta(days=i)) for i in range(10,0,-1)]
    return ((own,opp),(opp,own))


class PretipTeamVolumeContracts(unittest.TestCase):
    def test_learn_only_pre_cutoff_games_and_no_target_day_poisoning(self):
        games=fake_games()
        cutoff=dt.date(2026,1,27)
        head=TeamVolumeHead.fit_completed(games,cutoff)
        self.assertEqual(set(head.coefficients),set(STATS))
        self.assertGreater(head.examples["fga"],450)
        poisoned=copy.deepcopy(games)
        for g in poisoned:
            if g["date"]>=str(cutoff):
                for p in g["players"]:
                    for key in ("fga","tpa","fta","ast","reb"):
                        p[key]=1e7
        again=TeamVolumeHead.fit_completed(poisoned,cutoff)
        for key in STATS:
            np.testing.assert_allclose(head.coefficients[key],again.coefficients[key])

    def test_head_distinguishes_offense_and_opponent_with_prior_date_only(self):
        games=fake_games()
        h=TeamVolumeHead.fit_completed(games,dt.date(2026,1,27))
        hist={}
        for g in games:
            if g["date"]>=str(dt.date(2026,1,27)):continue
            for team,row in completed_game_team_records(g):
                hist.setdefault(team,[]).append(row)
        a=h.expected_team_counts(hist["10"],hist["50"],100.)
        self.assertEqual(set(a),set(STATS))
        self.assertTrue(all(np.isfinite(v) and v>0 for v in a.values()))

    def test_incomplete_roster_cannot_absorb_unknown_player_shots(self):
        sample={key:np.ones((30,2))*20. for key in ("fga","fta","ast","reb")}
        factor=team_correction_factors({"fga":1000,"fta":1000,"ast":1000,"reb":1000},
             sample,mean_roster_minutes=120.)
        self.assertEqual(factor["fga"],1.)
        self.assertAlmostEqual(factor["pts"],1.,places=12)
        enough=team_correction_factors({"fga":1000,"fta":1000,"ast":1000,"reb":1000},
             sample,mean_roster_minutes=240.)
        self.assertLessEqual(enough["fga"],1.+MAX_PLAYER_NORMALIZATION)

    def test_life_model_off_by_default_same_seed_and_future_context_discarded(self):
        home,away,hist=inputs()
        class FixedHead:
            training_cutoff=DAY
            def expected_team_counts(self, own,opponent,pace):
                self_last=max(x["date"] for x in own)
                if self_last>=DAY:raise ValueError("FUTURE_CONTEXT")
                return {"fga":135.,"tpa":36.,"fta":40.,"ast":39.,"reb":85.}
        base=simulate_empirical_game(home,away,hist,DAY,worlds=300,seed=7)
        self.assertTrue((simulate_empirical_game(home,away,hist,DAY,worlds=300,seed=7)
                         ["home"]["pts"]==base["home"]["pts"]).all())
        candidate=simulate_empirical_game(home,away,hist,DAY,worlds=300,seed=7,
                    team_volume_head=FixedHead(),team_volume_context=scout())
        self.assertEqual(candidate["world_kind"],"RESEARCH_TEAM_OPPORTUNITY_AND_OPPONENT_DEFENSE")
        np.testing.assert_array_equal(base["home"]["min"],candidate["home"]["min"])
        self.assertTrue((candidate["home"]["min"].sum(axis=1)<=240.+1e-8).all())
        poisoned=copy.deepcopy(scout())
        poisoned[0][0].append(dict(poisoned[0][0][-1],date=DAY,
                                  own={"fga":1e8,"tpa":1e8}))
        replay=simulate_empirical_game(home,away,hist,DAY,worlds=300,seed=7,
                    team_volume_head=FixedHead(),team_volume_context=poisoned)
        np.testing.assert_array_equal(candidate["home"]["fga"],replay["home"]["fga"])
        self.assertTrue(np.all(candidate["home"]["pts"]>=3*candidate["home"]["tpm"]))

    def test_future_fit_rejected_and_test_window_locked(self):
        home,away,hist=inputs()
        class FutureHead:
            training_cutoff=DAY+dt.timedelta(days=1)
        with self.assertRaisesRegex(ValueError,"TRAINED_AFTER_TARGET"):
            simulate_empirical_game(home,away,hist,DAY,worlds=10,seed=3,
               team_volume_head=FutureHead(),team_volume_context=scout())
        games=[{"game_id":"1","date":"2026-03-01"},
               {"game_id":"2","date":"2026-03-21"},
               {"game_id":"3","date":"2026-11-01"}]
        by={x["game_id"]:[x] for x in games}
        self.assertEqual(date_bounded_game_ids(by,games,dt.date(2026,3,22)),
                         ["1","2"])


if __name__=="__main__":
    unittest.main()
