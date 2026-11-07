"""Fail-closed real pretip NBA starter-source contract, never guessed lineups."""
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

from nba.nba_v5_live_confirmed_lineups import capture
from nba.nba_v5_pregame_certified import load
from nba.nba_v5_refresh_decision import decide

NOW=dt.datetime(2026,11,6,23,35,tzinfo=dt.timezone.utc)
TIP="2026-11-07T00:00:00+00:00"
NAMES=["Alpha One","Bravo Two","Charlie Three","Delta Four","Echo Five"]


def v3():
    rows=[]
    for team,letters in (("30",NAMES),("2",["Foxtrot Six","Golf Seven",
                    "Hotel Eight","India Nine","Juliet Ten"])):
        rows.extend({"team_id":team,"player_id":str(i+1+(0 if team=="30" else 10)),
                     "player":name,"reported_status":"AVAILABLE"}
                    for i,name in enumerate(letters))
    return {"games":[{"game_id":"4011111","home_id":"30","away_id":"2",
                      "home":"Charlotte Hornets","away":"Boston Celtics",
                      "tipoff_utc":TIP,"rows":rows}]}


def feed():
    return {"scoreboard":{"games":[{
        "gameId":"0022600321","gameStatus":1,"gameTimeUTC":TIP,
        "homeTeam":{"teamTricode":"CHA"},"awayTeam":{"teamTricode":"BOS"}}]}}


def box():
    home=[{"name":name,"starter":True} for name in NAMES]
    away=[{"name":name,"starter":True} for name in
          ["Foxtrot Six","Golf Seven","Hotel Eight","India Nine","Juliet Ten"]]
    return {"game":{"gameId":"0022600321","gameStatus":1,
            "homeTeam":{"teamTricode":"CHA","players":home},
            "awayTeam":{"teamTricode":"BOS","players":away}}}


class PregameFeedTests(unittest.TestCase):
    def test_explicit_five_each_side_is_accepted_by_existing_strict_validator(self):
        doc,audit=capture(v3(),feed(),{"0022600321":box()},NOW)
        self.assertEqual(audit["confirmed_teams"],2)
        self.assertEqual(len(doc["games"]),1)
        self.assertEqual(doc["games"][0]["teams"][0]["starters"],["1","2","3","4","5"])
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/"source.json"
            path.write_text(json.dumps(doc))
            rows,proof=load(path,NOW+dt.timedelta(seconds=1),v3()["games"])
        self.assertEqual(proof["confirmed_teams"],2)
        self.assertEqual(rows[("4011111","30")]["lineup_state"],"CONFIRMED")

    def test_missing_one_starter_never_certifies_partial_team(self):
        payload=box()
        payload["game"]["homeTeam"]["players"][0]["starter"]=False
        doc,audit=capture(v3(),feed(),{"0022600321":payload},NOW)
        self.assertEqual(audit["confirmed_teams"],1)
        self.assertEqual(doc["games"][0]["teams"][0]["lineup_state"],"NOT_POSTED")
        self.assertEqual(doc["games"][0]["teams"][0]["starters"],[])

    def test_available_injury_status_is_not_starting_lineup(self):
        doc,audit=capture(v3(),feed(),{},NOW)
        self.assertEqual(audit["confirmed_teams"],0)
        self.assertTrue(all(t["lineup_state"]=="NOT_POSTED" for t in doc["games"][0]["teams"]))

    def test_after_tip_game_status_never_backfills_as_pretip(self):
        nba=feed();nba["scoreboard"]["games"][0]["gameStatus"]=2
        doc,audit=capture(v3(),nba,{"0022600321":box()},NOW)
        self.assertEqual(audit["confirmed_teams"],0)
        box2=box();box2["game"]["gameStatus"]=2
        doc,audit=capture(v3(),feed(),{"0022600321":box2},NOW)
        self.assertEqual(audit["confirmed_teams"],0)

    def test_wrong_team_player_does_not_get_silent_name_fuzzy_match(self):
        nba=box()
        nba["game"]["homeTeam"]["players"][2]["name"]="An Unknown Rookie"
        doc,audit=capture(v3(),feed(),{"0022600321":nba},NOW)
        self.assertEqual(audit["confirmed_teams"],1)
        self.assertEqual(doc["games"][0]["teams"][0]["lineup_state"],"NOT_POSTED")

    def test_not_same_tipoff_does_not_join_by_game_name_only(self):
        nba=feed()
        nba["scoreboard"]["games"][0]["gameTimeUTC"]="2026-11-07T02:00:00+00:00"
        doc,audit=capture(v3(),nba,{"0022600321":box()},NOW)
        self.assertEqual(audit["confirmed_teams"],0)

    def test_after_tip_cannot_retroactively_certify(self):
        doc,audit=capture(v3(),feed(),{"0022600321":box()},
                          dt.datetime(2026,11,7,0,1,tzinfo=dt.timezone.utc))
        self.assertEqual(doc["games"],[])
        self.assertEqual(audit["confirmed_teams"],0)

    def test_refresh_on_same_injuries_inside_lineup_announcement_window(self):
        fixture={"games":[{"game_id":"4011111","home_id":"30","away_id":"2",
                           "home":"Charlotte Hornets","away":"Boston Celtics",
                           "tipoff_utc":TIP}]}
        first=decide(fixture,{}, {},{},NOW)
        same={"hash":first["hash"],"official_signature":first["official_signature"],
              "generated_at_utc":NOW.isoformat()}
        again=decide(fixture,{}, {},same,NOW)
        self.assertTrue(again["run"])
        self.assertIn("near_tip_lineup_recheck",again["reasons"])


if __name__=="__main__":
    unittest.main()
