#!/usr/bin/env python3
"""Current-season NBA roster SOURCE audit, not player availability certification.

ESPN roster membership can document current team association and IDs. It CANNOT
prove dressed status, minutes restrictions, starting five or official NBA injury
designation. Never reuse retrospective game boxscores to certify availability.
All observations carry actual retrieval timestamps and content SHA receipts.
"""
from __future__ import annotations
import argparse, concurrent.futures, datetime as dt, hashlib, json, math
import urllib.request
from pathlib import Path

BASE="https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/"
SCHEMA="NBA_2026_CURRENT_ESPN_ROSTER_SOURCE_ONLY_V1"
SOURCE_POLICY="ESPN_TEAM_ROSTER_NOT_OFFICIAL_PREGAME_AVAILABILITY"
NBA_IDS=tuple(str(i) for i in range(1,31))

def extract_roster(body,expected_team):
    if not isinstance(body,dict):raise ValueError("NBA_ROSTER_SOURCE_NOT_OBJECT")
    parent=body.get("team") or {}
    if parent and str(parent.get("id") or "") not in ("",str(expected_team)):
        raise ValueError("NBA_ROSTER_TEAM_ID_CONFLICT")
    grouped=body.get("athletes")
    if not isinstance(grouped,list):
        raise ValueError("NBA_ROSTER_ATHLETES_MISSING")
    rows=[]
    for section in grouped:
        if not isinstance(section,dict):raise ValueError("NBA_ROSTER_GROUP_NOT_OBJECT")
        items=section.get("items")
        if items is not None:
            if not isinstance(items,list):raise ValueError("NBA_ROSTER_GROUP_ITEMS_INVALID")
            rows.extend(items)
        else: rows.append(section)
    players=[]
    seen=set()
    for item in rows:
        if not isinstance(item,dict):raise ValueError("NBA_ROSTER_PLAYER_NOT_OBJECT")
        athlete=item.get("athlete") if isinstance(item.get("athlete"),dict) else item
        pid=str(athlete.get("id") or "")
        name=athlete.get("fullName") or athlete.get("displayName")
        if not pid.isdigit() or not isinstance(name,str) or not name.strip():
            raise ValueError("NBA_ROSTER_PLAYER_IDENTITY_MISSING")
        if pid in seen:raise ValueError("NBA_ROSTER_DUPLICATED_PLAYER_ID")
        seen.add(pid)
        pos=athlete.get("position") or {}
        position=(pos.get("abbreviation") if isinstance(pos,dict) else
                 str(pos) if pos else "")
        players.append({"player_id":pid,"player":name.strip(),
          "position_reported":position or None,
          "team_id":str(expected_team),
          "roster_member_in_ESPN_response":True,
          "active_for_game_certified":False,"starter_certified":False,
          "injury_report_certified":False,
          "source_kind":SOURCE_POLICY})
    if not 8<=len(players)<=35:
        raise ValueError(f"NBA_ROSTER_OUT_OF_BOUNDS_TEAM_{expected_team}_{len(players)}")
    return sorted(players,key=lambda r:int(r["player_id"]))

def verify_season_snapshot(rosters,fixture):
    if set(rosters)!=set(NBA_IDS):raise ValueError("NBA_ROSTER_NOT_ALL_THIRTY_TEAMS")
    duplicates={}
    for team,players in rosters.items():
        if not 8<=len(players)<=35:raise ValueError("NBA_BAD_TEAM_ROSTER_SIZE")
        for player in players:
            pid=player["player_id"]
            if pid in duplicates:
                raise ValueError(f"NBA_PLAYER_ON_MULTIPLE_ESPN_TEAM_ROSTERS_{pid}")
            duplicates[pid]=team
    if (fixture.get("schema")!="NBA_V1_2026_OPENING_ROSTER_BLIND_RESEARCH_V1" or
        fixture.get("research_only") is not True or
        fixture.get("official_wagers")!=0):
        raise ValueError("NBA_UNTRUSTED_OPENING_FIXTURE")
    games=fixture.get("forecasts")
    if not isinstance(games,list) or len(games)!=14:raise ValueError("NBA_OPENING_FIXTURE_COUNT_CHANGED")
    covered=[]
    for game in games:
        home,away=str(game.get("home_id")),str(game.get("away_id"))
        if home not in rosters or away not in rosters or home==away:
            raise ValueError("NBA_OPENING_EVENT_UNKNOWN_CLUB")
        covered.append({"game_id":str(game["game_id"]),"home_id":home,
            "away_id":away,"home_roster_count":len(rosters[home]),
            "away_roster_count":len(rosters[away]),
            "game_day_active_players_certified":0,
            "game_day_starting_fives_certified":0})
    return covered

def fetch_roster(team_id):
    if str(team_id) not in NBA_IDS:raise ValueError("NON_NBA_TEAM_ID")
    url=BASE+str(team_id)+"/roster"
    req=urllib.request.Request(url,headers={
        "Accept":"application/json","User-Agent":"PropEdgeNBARosterSourceAudit/1.0"})
    with urllib.request.urlopen(req,timeout=20) as response:
        raw=response.read()
    if not 100<=len(raw)<=1_500_000:raise ValueError("NBA_ROSTER_RESPONSE_SIZE_INVALID")
    return url,raw

def snapshot(fixture,fetcher=fetch_roster,now=None):
    start=now or dt.datetime.now(dt.timezone.utc)
    if start.tzinfo is None:raise ValueError("NBA_ROSTER_NAIVE_TIMESTAMP")
    if start>dt.datetime(2026,10,21,23,59,tzinfo=dt.timezone.utc):
        raise ValueError("NBA_OPENING_SNAPSHOT_CUTOFF_EXPIRED")
    rosters={};receipts={};failures={}
    def read(team):
        try:
            url,raw=fetcher(team)
            document=json.loads(raw)
            parsed=extract_roster(document,team)
            return team,parsed,{
                "url":url,"source_sha256":hashlib.sha256(raw).hexdigest(),
                "retrieved_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
                "players":len(parsed)},None
        except Exception as e:return team,None,None,str(e)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for team,parsed,receipt,error in pool.map(read,NBA_IDS):
            if error:failures[team]=error
            else:rosters[team]=parsed;receipts[team]=receipt
    if failures:raise ValueError("NBA_ROSTER_SOURCE_INCOMPLETE "+str(failures))
    games=verify_season_snapshot(rosters,fixture)
    total=sum(len(x) for x in rosters.values())
    return {
      "schema":SCHEMA,"snapshot_started_at_utc":start.astimezone(dt.timezone.utc).isoformat(),
      "historical_roster_or_lineup_backfill":False,
      "source_policy":SOURCE_POLICY,
      "season":"2026-27","teams_source_covered":30,
      "distinct_roster_athletes":total,
      "rosters":rosters,"receipts":receipts,
      "opening_game_ids_with_team_roster_membership":games,
      "source_only_no_pregame_active_certification":True,
      "verified_official_NBA_injury_designations":0,
      "verified_current_starting_fives":0,
      "current_season_minute_limits_verified":0,
      "actual_game_day_participation_unconfirmed":True,
      "player_stat_forecasts_published":0,
      "official_bets":0,
      "notes":"ESPN roster page membership is not an official active/inactive list or reliable expected-minute forecast. No props and no wagering from roster membership alone."
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--fixtures",type=Path,default=Path("docs/nba_v1_opening_week_research.json"))
    parser.add_argument("--out",type=Path,default=Path("docs/nba_2026_roster_source_snapshot.json"))
    a=parser.parse_args()
    source=json.loads(a.fixtures.read_text())
    result=snapshot(source)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(result,indent=2,allow_nan=False)+"\n")
    print("NBA_CURRENT_ROSTER_SOURCE_AUDIT",json.dumps({
      "teams":result["teams_source_covered"],
      "players":result["distinct_roster_athletes"],
      "opening_games":len(result["opening_game_ids_with_team_roster_membership"]),
      "status":result["source_policy"],
      "official_bets":result["official_bets"]
    }))
if __name__=="__main__":main()
