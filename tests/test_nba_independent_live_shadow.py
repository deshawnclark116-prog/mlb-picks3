"""Live head integrity: no same-day outcomes, old teams, fake starters or stale ESPN roster."""
import copy
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from nba.nba_independent_live_shadow import (
    EASTERN, SCHEMA, VERSION, completed_histories,
    eastern_day, generate_shadow, selected_live_games, enrich_pretip_player_identities,
    to_previous_eastern_completed_games,
    write_and_freeze
)
from nba.nba_independent_no_hindsight_opportunity_lab import make_features, dataset


def games(count=170, final_day="2026-11-19"):
    # 17 calendar dates × 10 actual completed synthetic matches; ESPN
    # source schema, unique IDs and positive played-player stats.
    out=[]
    for i in range(count):
        day=dt.date(2026, 10, 31)+dt.timedelta(days=i//10)
        players=[]
        for side,team in (("home","1"),("away","2")):
            for p in range(6):
                pid=str(int(team)*100+p)
                players.append({
                    "id":pid,"name":"Test "+pid,"team":team,"side":side,
                    "min":28.0 if p<3 else 12.0,"start":p<5,
                    "pts":12+p,"reb":5+p,"ast":2+p,"tpm":2,
                    "fga":12,"tpa":5,"fta":3,"oreb":1,"tov":2
                })
        out.append({
            "date":day.isoformat()+"T23:00:00+00:00",
            "game_id":str(5000+i),"season_type":2,
            "home":{"id":"1","score":110},
            "away":{"id":"2","score":101},"players":players
        })
    return out


def roster(now="2026-11-20T22:30:00+00:00",
           tip="2026-11-21T00:30:00+00:00"):
    rows=[]
    for player in ("100","101","102","103","104","105","200","201","202","203","204","205"):
        team="1" if player.startswith("1") else "2"
        for market in ("points","rebounds","assists","three_pointers_made"):
            rows.append({
                "player":"Test "+player,"player_id":player,"team_id":team,
                "market":market,"mean":9000,"p_active":.91,
                "reported_status":"UNKNOWN_NOT_ACTIVE_CERTIFIED"
            })
    return {
        "generated_at_utc":now,
        "games":[{
            "game_id":"401920001","tipoff_utc":tip,
            "home":"Test Home","away":"Test Away","home_id":"1","away_id":"2",
            "rows":rows, "forecast_at_utc":now
        }]
    }


class PredictNoFinalLeakage(unittest.TestCase):
    def test_future_and_same_eastern_day_history_never_enters_model(self):
        source=games()
        # 00:15Z means prior evening Eastern, not next calendar day.
        source.append({**source[-1], "game_id":"99001",
                       "date":"2026-11-21T00:15:00+00:00",
                       "players":copy.deepcopy(source[-1]["players"])})
        source[-1]["players"][0]["pts"]=9999
        prior=to_previous_eastern_completed_games(source,dt.date(2026,11,20))
        self.assertEqual(len(prior),170)
        self.assertLessEqual(max(g["date"] for g in prior),"2026-11-19")
        self.assertTrue(all(p["pts"]<100 for g in prior for p in g["players"]))

    def test_historical_feature_matches_lab_exact(self):
        completed=to_previous_eastern_completed_games(games(),dt.date(2026,11,20))
        ph,th=completed_histories(completed)
        for market,stat in (("points","pts"),("rebounds","reb"),
                            ("assists","ast"),("three_pointers_made","tpm")):
            fe=make_features(ph["100"],th["1"],th["2"],
                dt.date(2026,11,20),"home",stat)
            self.assertIsNotNone(fe)
            self.assertEqual(len(fe["features"]),20)
            self.assertEqual(fe["history_games"],170)
        # The training rows are fully previous-day snapshots,
        # unlike actual target-day fixtures from a postgame archive.
        self.assertTrue(len(dataset(completed))>0)

    def test_game_preflight_rejects_stale_source_and_started_game(self):
        now=dt.datetime(2026,11,20,23,0,tzinfo=dt.timezone.utc)
        self.assertEqual(len(selected_live_games(roster(),now)),1)
        old=roster(now="2026-11-19T12:00:00+00:00")
        with self.assertRaisesRegex(ValueError,"FRESH_SOURCE_ROSTER"):
            selected_live_games(old,now)
        expired=roster(tip="2026-11-20T22:50:00+00:00")
        self.assertEqual(selected_live_games(expired,now),[])

    def test_real_model_input_from_pretip_roster_not_target_boxscore(self):
        class Dummy:
            def predict(self, X):
                return np.asarray([10.2 for _ in X])
        now=dt.datetime(2026,11,20,23,0,tzinfo=dt.timezone.utc)
        data=games()
        latest=roster()
        with patch("nba.nba_independent_live_shadow.train_direct_models",
                   return_value=({m:Dummy() for m in (
                    "points","rebounds","assists","three_pointers_made")},
                    {m:{"training_player_games":4000} for m in (
                    "points","rebounds","assists","three_pointers_made")})):
            a=generate_shadow(latest,data,now,history_sha="a"*64,v3_sha="b"*64)
            altered=copy.deepcopy(data)
            # Change strictly excluded target-date final boxes:
            altered.append({**data[0],"game_id":"next-game","date":"2026-11-21T00:00:00Z",
                            "players":[{**p,"pts":9876} for p in data[0]["players"]]})
            b=generate_shadow(latest,altered,now,history_sha="a"*64,v3_sha="b"*64)
        self.assertEqual(a["schema"],SCHEMA)
        self.assertEqual(a["model_version"],VERSION)
        self.assertEqual(a["official_bets"],0)
        self.assertFalse(a["prospective_calibration_verified"])
        self.assertEqual(a["games"][0]["players"],b["games"][0]["players"])
        self.assertEqual(a["rows_forecast"],48)
        self.assertEqual(a["games_forecast"],1)
        self.assertEqual(a["games"][0]["players"][0]["predictions"]["points"],10.2)
        self.assertFalse(a["games"][0]["players"][0]["active_or_starter_certified"])
        self.assertEqual(a["trained_through_eastern_date"],"2026-11-16")

    def test_unproven_current_team_role_cannot_get_prediction(self):
        class Dummy:
            def predict(self,X):return np.ones(len(X))
        now=dt.datetime(2026,11,20,23,0,tzinfo=dt.timezone.utc)
        latest=roster()
        # Player has 1 current-team played game; rest were another team.
        source=games()
        for g in source[:-1]:
            for p in g["players"]:
                if p["id"]=="100":p["team"]="20"
        with patch("nba.nba_independent_live_shadow.train_direct_models",
                   return_value=({m:Dummy() for m in (
                    "points","rebounds","assists","three_pointers_made")},
                    {m:{"training_player_games":4000} for m in (
                    "points","rebounds","assists","three_pointers_made")})):
            d=generate_shadow(latest,source,now,history_sha="a"*64,v3_sha="b"*64)
        self.assertNotIn("100",{p["player_id"] for p in d["games"][0]["players"]})


    def test_later_pretip_roster_recovers_missing_confirmed_starter_without_using_v5_means(self):
        now=dt.datetime(2026,11,20,23,0,tzinfo=dt.timezone.utc)
        early=roster()
        newer=copy.deepcopy(early)
        newer['generated_at_utc']='2026-11-20T22:32:00Z'
        newer['model_version']='nba-v5-native-possession-simulation'
        for market in ("points","rebounds","assists","three_pointers_made"):
            newer['games'][0]['rows'].append({
                "player":"Devin Booker","player_id":"106","team_id":"1",
                "market":market,"p_active":0.93,
                "reported_status":"UNKNOWN_NOT_ACTIVE_CERTIFIED",
                "mean":9999999
            })
        combined=enrich_pretip_player_identities(early,newer,now)
        added=[r for r in combined['games'][0]['rows']
               if r['player_id']=='106']
        self.assertEqual(len(added),4)
        self.assertTrue(all('mean' not in r for r in added))
        self.assertEqual(combined['games'][0]['source_roster_enrichment'],
                         'V5_PUBLISHED_PRETIP_IDENTITIES_ONLY_NO_MEANS')
        self.assertEqual(len(early['games'][0]['rows']),48)
        self.assertEqual(len(selected_live_games(combined,now)),1)
        bad=copy.deepcopy(newer)
        bad['games'][0]['tipoff_utc']='2026-11-21T01:00:00Z'
        with self.assertRaisesRegex(ValueError,'ROSTER_MATCH_CONFLICT'):
            enrich_pretip_player_identities(early,bad,now)
        bad=copy.deepcopy(newer)
        bad['generated_at_utc']='2026-11-19T12:00:00Z'
        with self.assertRaisesRegex(ValueError,'STALE_OR_OUT_OF_ORDER'):
            enrich_pretip_player_identities(early,bad,now)

    def test_original_archive_is_immutable(self):
        latest={
            "schema":SCHEMA,"generated_at_utc":"2026-11-20T23:00:00Z",
            "games":[{"game_id":"401920001","rows_count":1,"players":[{
                "player":"A","predictions":{"points":14.2}}]}]
        }
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            self.assertEqual(write_and_freeze(latest,root/"latest.json",root/"archive"),1)
            latest["games"][0]["players"][0]["predictions"]["points"]=99
            self.assertEqual(write_and_freeze(latest,root/"latest.json",root/"archive"),0)
            first=json.loads((root/"archive/first/401920001.json").read_text())
            self.assertEqual(first["games"][0]["players"][0]["predictions"]["points"],14.2)


if __name__=="__main__":
    unittest.main()
