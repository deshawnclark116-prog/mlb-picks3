"""NBA pretip daily roster bridge: no hindsight, no expected->confirmed, no invented IDs."""
import datetime as dt
import unittest
from collections import Counter

from nba.nba_v3_daily_roster import SCHEMA,collect,supplement
from nba.nba_v3_phase1_engine import role_pool

ASOF=dt.datetime(2026,11,7,2,35,tzinfo=dt.timezone.utc)
TIP="2026-11-07T03:00:00+00:00"
HOME=("Domantas Sabonis","Zach LaVine","Darius Acuff Jr.","Emanuel Sharp","Starter Five")
AWAY=("Victor Wembanyama","Devin Vassell","De'Aaron Fox","Harrison Barnes","Dylan Harper")
POS=("PG","SG","SF","PF","C")


def fixture():
    return {"game_id":"401909295","home_id":"23","away_id":"24",
            "tipoff_utc":TIP,"home":"Sacramento Kings","away":"San Antonio Spurs"}


def history():
    values={}
    for tid,names,offset in (("23",HOME,100),("24",AWAY,200)):
        for i,name in enumerate(names):
            pid=str(offset+i)
            values[(tid,pid)]=[{"player":name} for _ in range(8)]
    return values


def rosters():
    return {"23":[{"player_id":"102"},{"player_id":"103"},{"player_id":"104"}],
            "24":[{"player_id":str(200+i)} for i in range(5)]}


def nba_team(abbr,names,confirmed=True):
    return {"teamAbbreviation":abbr,"players":[
        {"playerName":name,"position":POS[i],
         "lineupStatus":"Confirmed" if confirmed else "Expected",
         "rosterStatus":"Active"} for i,name in enumerate(names)
    ]+[{"playerName":"Unknown NBA Player","position":"",
        "lineupStatus":"Confirmed","rosterStatus":"Active"}]}


def raw(status=1,confirmed=True):
    return {"games":[{"gameId":"0022600295","gameStatus":status,
                      "homeTeam":nba_team("SAC",HOME,confirmed),
                      "awayTeam":nba_team("SAS",AWAY,confirmed)}]}


def source(data=None,observed=None):
    return {"schema":SCHEMA,"captured_at_utc":(observed or ASOF).isoformat(),
            "feeds_by_date":{"20261106":raw() if data is None else data}}


class BridgeTests(unittest.TestCase):
    def test_current_nba_roster_recovers_historically_known_espn_starters(self):
        original=rosters()
        names=history()
        new,states,audit=supplement(fixture(),original,names,source(),ASOF)
        self.assertEqual(new["23"],{"100","101","102","103","104"})
        self.assertEqual({p["player_id"] for p in audit["added_by_team"]["23"]},
                         {"100","101"})
        self.assertEqual(len(states["23"]),5)
        self.assertEqual(audit["capture_status"],"PREGAME_TEAM_LIST_OBSERVED")
        self.assertEqual(original["23"],rosters()["23"])
        self.assertEqual(audit["unmatched_name_count"],2)  # bench names, one per team
        self.assertTrue(all(s["status"]=="ACTIVE" and
                            s["independently_verified"] for s in states["23"]))

    def test_expected_roster_membership_only_not_active_certification(self):
        new,states,audit=supplement(fixture(),rosters(),history(),
                                   source(raw(1,confirmed=False)),ASOF)
        self.assertIn("100",new["23"])
        self.assertEqual(states["23"],[])
        self.assertEqual(audit["confirmed_starters_by_team"]["23"],[])

    def test_live_final_and_wrong_matchup_never_corroborate(self):
        for body in (raw(status=2),raw(status=3)):
            new,states,audit=supplement(fixture(),rosters(),history(),
                                        source(body),ASOF)
            self.assertNotIn("100",new["23"])
            self.assertFalse(states["23"])
        mismatch=raw()
        mismatch["games"][0]["homeTeam"]["teamAbbreviation"]="LAL"
        new,states,_=supplement(fixture(),rosters(),history(),
                                source(mismatch),ASOF)
        self.assertNotIn("100",new["23"])
        self.assertEqual(states["23"],[])

    def test_future_or_stale_snapshot_and_after_tip_not_accepted(self):
        for observed,asof in (
            (ASOF+dt.timedelta(minutes=1),ASOF),
            (ASOF-dt.timedelta(minutes=31),ASOF),
            (ASOF,ASOF+dt.timedelta(minutes=30))):
            new,st,audit=supplement(fixture(),rosters(),history(),
                                     source(observed=observed),asof)
            self.assertNotIn("100",new["23"])
            self.assertFalse(st["23"])

    def test_ambiguous_names_and_no_prior_history_not_invented(self):
        h=history()
        h[("6","999")]=[{"player":"Domantas Sabonis"} for _ in range(6)]
        new,states,audit=supplement(fixture(),rosters(),h,source(),ASOF)
        self.assertNotIn("100",new["23"])
        self.assertGreater(audit["ambiguous_name_count"],0)
        self.assertEqual(states["23"],[])
        h=history()
        h[("23","100")]=[{"player":"Domantas Sabonis"} for _ in range(4)]
        new,states,_=supplement(fixture(),rosters(),h,source(),ASOF)
        self.assertNotIn("100",new["23"])
        self.assertFalse(states["23"])

    def test_current_esPN_other_team_conflict_requires_current_team_history(self):
        roster=rosters()
        roster["6"]=[{"player_id":"100"}]
        h=history()
        # Real prior five-plus games for the NBA-reported club override
        # contradictory ESPN team membership, not an unobserved transfer.
        new,_,audit=supplement(fixture(),roster,h,source(),ASOF)
        self.assertIn("100",new["23"])
        h[("23","100")]=[]
        new,_,audit=supplement(fixture(),roster,h,source(),ASOF)
        self.assertNotIn("100",new["23"])
        self.assertGreater(audit["conflicting_team_count"],0)

    def test_collect_only_upcoming_date_and_uses_injected_source(self):
        times=[]
        def fake(date):
            times.append(date)
            return raw()
        snapshot=collect({"games":[fixture()]},fake,now=ASOF)
        self.assertEqual(times,["20261106"])
        self.assertEqual(snapshot["schema"],SCHEMA)
        self.assertEqual(snapshot["source_errors"],{})

    def test_long_absent_player_only_returns_with_verified_active(self):
        hist=[]
        for ix in range(8):
            hist.append({
                "player":"Established Veteran","team_id":"23","player_id":"100",
                "team_game_index":ix,"minutes":34.0,"started":True,
                "points":18,"rebounds":7,"assists":4,"three_pointers_made":2
            })
        h={("23","100"):hist}
        gamecounts=Counter({"23":23})
        kwargs=dict(asof_utc=ASOF.isoformat(),tipoff_utc=TIP)
        absent=role_pool("23",h,gamecounts,{("23","100"):0},{("23","100"):7},
                         {"100"},**kwargs)
        self.assertEqual(absent,[])
        status=[{"team_id":"23","player_id":"100","status":"ACTIVE",
                 "independently_verified":True,
                 "source_url":"https://stats.nba.com/js/data/leaders/00_daily_lineups_20261106.json",
                 "published_at_utc":ASOF.isoformat()}]
        valid=role_pool("23",h,gamecounts,{("23","100"):0},{("23","100"):7},
                        {"100"},statuses=status,**kwargs)
        self.assertEqual(len(valid),1)
        self.assertGreater(valid[0]["p_play"],0.9)


if __name__=="__main__":
    unittest.main()
