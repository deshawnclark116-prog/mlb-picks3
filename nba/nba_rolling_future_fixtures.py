#!/usr/bin/env python3
"""Live 2026-27 NBA forward schedule: source evidence, NOT post-tip predictions.

One small pregame, SHA256-receipted fixture source per UTC capture. Does not
rebuild or overwrite October 20 original NBA V1/V2 predictions. Subsequent
V2 rolling forecast runner must consume only the strictly before-tip fixtures.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
from zoneinfo import ZoneInfo
from nba.nba_v1_team_model import UTC, datetime_utc, extract_events, get_scoreboard

SCHEMA="NBA_2026_27_ROLLING_FUTURE_ESPN_FIXTURES_V1"
SEASON_START=dt.date(2026,10,20)
SEASON_END=dt.date(2027,4,11)

def capture(now:dt.datetime, days:int=3, fetch=get_scoreboard):
    if now.tzinfo is None:raise ValueError("NBA_SOURCE_NAIVE_CAPTURE_TIME")
    now=now.astimezone(UTC)
    if not 1<=days<=7:raise ValueError("NBA_SOURCE_UNSAFE_DATE_RANGE")
    # Game days are US Eastern days (ESPN's scoreboard dates). Using the UTC date dropped each evening's remaining games
    # after 8 PM Eastern. The capture time and every receipt stay real UTC; only which scoreboard days are fetched changes.
    today=now.astimezone(ZoneInfo("America/New_York")).date()
    if not SEASON_START<=today<=SEASON_END:
        raise ValueError("NBA_SOURCE_OUTSIDE_2026_27_REGULAR_SEASON")
    events={};receipts=[]
    for n in range(days):
        d=today+dt.timedelta(days=n)
        if d>SEASON_END:break
        date,blob=fetch(d)
        if date!=d.isoformat():raise ValueError("NBA_SOURCE_WRONG_SCOREBOARD_DATE")
        raw=json.dumps(blob,sort_keys=True,separators=(",",":"),allow_nan=False)
        receipts.append({"date_utc":date,
            "retrieved_at_utc":now.isoformat(),
            "sha256":hashlib.sha256(raw.encode()).hexdigest(),
            "regular_season_games_seen":len(extract_events(blob))})
        for game in extract_events(blob):
            if game["completed"] or datetime_utc(game["start_utc"])<=now:
                continue
            gid=game["game_id"]
            if gid in events and events[gid]!=game:
                raise ValueError("NBA_SOURCE_SAME_GAME_CONFLICT")
            events[gid]=game
    upcoming=sorted(events.values(),key=lambda x:(x["start_utc"],x["game_id"]))
    return {"schema":SCHEMA,"source_captured_at_utc":now.isoformat(),
            "season":"2026-27","season_start":SEASON_START.isoformat(),
            "future_games":len(upcoming),
            "games":[{"game_id":g["game_id"],"tipoff_utc":g["start_utc"],
                "home":g["home"],"away":g["away"],
                "home_id":g["home_id"],"away_id":g["away_id"],
                "verified_before_tip":True,"original_forecast_id":None,
                "model_prediction":None,"research_only":True}
                for g in upcoming],
            "scoreboard_source_receipts":receipts,
            "no_post_tip_reconstruction":True,"official_bets":0,
            "note":"Verified upcoming fixtures only. No V2 prediction is implied; "
                   "do not use this file to rewrite frozen original forecasts."}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--days",type=int,default=3)
    ap.add_argument("--out",required=True,type=Path)
    args=ap.parse_args()
    if args.out.exists():
        raise ValueError("NBA_SOURCE_FIRST_CAPTURE_EXISTS_REFUSE_OVERWRITE")
    result=capture(dt.datetime.now(UTC),args.days)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n")
    print("NBA_FORWARD_SCHEDULE_CAPTURED",result["future_games"],
          "games",len(result["scoreboard_source_receipts"]),"days")

if __name__=="__main__":main()
