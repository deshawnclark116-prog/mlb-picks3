"""Official NBA live-boxscore starting-five observation for pretip NBA V5.

No projection, injury designation, or player availability is ever promoted
to CONFIRMED. We accept exactly five explicit starter=True flags per team in
a *not-started* NBA boxscore, uniquely matched to the ESPN fixture and to
five current ESPN player identities. Any ambiguity => NOT_POSTED.

The public NBA CDN can lag the scorers' official 30-minute submission. An
unavailable feed must NOT imply that the starting lineup was confirmed.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import re
import unicodedata
import urllib.request
from pathlib import Path

from nba.nba_v5_hoopr_tracking import ESPN_ABBR
from nba.nba_v5_pregame_certified import SCHEMA

SCOREBOARD = "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json"
BOX_URL = "https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{game_id}.json"
PROVIDER = "NBA_OFFICIAL_LIVE_BOXSCORE"


def utc(v):
    x=dt.datetime.fromisoformat(str(v).replace("Z","+00:00"))
    if x.tzinfo is None:
        raise ValueError("NBA_STARTERS_NAIVE_TIME")
    return x.astimezone(dt.timezone.utc)


def norm(s):
    s=unicodedata.normalize("NFKD",str(s or ""))
    s="".join(c for c in s if not unicodedata.combining(c))
    return " ".join(re.sub(r"[^a-z0-9]+"," ",s.casefold()).split())


def fetch_json(url,timeout=14):
    if not url.startswith("https://cdn.nba.com/static/json/liveData/"):
        raise ValueError("NBA_STARTERS_INVALID_NBA_SOURCE_URL")
    with urllib.request.urlopen(urllib.request.Request(
            url,headers={"User-Agent":"Mozilla/5.0 (compatible; NBA-V5-Pregame/1.0)",
                         "Accept":"application/json"}),timeout=timeout) as r:
        raw=r.read(2_000_001)
    if len(raw)>2_000_000:
        raise ValueError("NBA_STARTERS_SOURCE_TOO_LARGE")
    return json.loads(raw)


def roster_by_name(game,team_id):
    roster={}
    collisions=set()
    for row in game.get("rows",[]):
        if str(row.get("team_id"))!=str(team_id):
            continue
        name=norm(row.get("player"))
        pid=str(row.get("player_id") or "")
        if not name or not pid.isdigit():
            continue
        if name in roster and roster[name]!=pid:
            collisions.add(name)
        roster[name]=pid
    for name in collisions:
        roster.pop(name,None)
    return roster


def starters_from_box(box,side,abbr,game_id,game,team_id):
    root=box.get("game") or {}
    if (str(root.get("gameId"))!=str(game_id)
        or root.get("gameStatus")!=1):
        return [],"BOX_NOT_PREGAME"
    team=root.get(side+"Team")
    if not isinstance(team,dict) or team.get("teamTricode")!=abbr:
        return [],"BOX_TEAM_MISMATCH"
    roster=roster_by_name(game,team_id)
    raw=team.get("players")
    if not isinstance(raw,list):
        return [],"NO_BOX_PLAYER_ROSTER"
    selected=[p for p in raw if isinstance(p,dict) and p.get("starter") is True]
    if len(selected)!=5:
        return [],"FIVE_STARTERS_NOT_PUBLISHED"
    out=[]
    for p in selected:
        name=norm(p.get("name") or
                  ((str(p.get("firstName") or "")+" "+str(p.get("familyName") or "")).strip()))
        pid=roster.get(name)
        if not pid or pid in out:
            return [],"STARTER_MISSING_OR_AMBIGUOUS_IN_ESPN_ROSTER"
        out.append(pid)
    return out,"MATCHED_FIVE_OFFICIAL_NBA_STARTERS"


def capture(v3,scoreboard,boxes,now):
    """Pure, forward-only source converter. `boxes` keyed by NBA gameId."""
    now=utc(now) if not isinstance(now,dt.datetime) else utc(now.isoformat())
    feed=(scoreboard.get("scoreboard") or {}).get("games")
    if not isinstance(feed,list):
        raise ValueError("NBA_STARTERS_SCOREBOARD_MISSING_GAMES")
    out=[]
    status_counts={}
    for game in v3.get("games",[]):
        tip=utc(game["tipoff_utc"])
        if not now<tip:
            continue
        home_id,away_id=str(game["home_id"]),str(game["away_id"])
        home_abbr,away_abbr=ESPN_ABBR.get(home_id),ESPN_ABBR.get(away_id)
        if not home_abbr or not away_abbr:
            raise ValueError("NBA_STARTERS_INVALID_ESPN_TEAM")
        candidates=[]
        for item in feed:
            if not isinstance(item,dict) or item.get("gameStatus")!=1:
                continue
            if ((item.get("homeTeam") or {}).get("teamTricode")!=home_abbr
                or (item.get("awayTeam") or {}).get("teamTricode")!=away_abbr):
                continue
            try:
                actual_tip=utc(item.get("gameTimeUTC"))
            except (TypeError,ValueError):
                continue
            if abs((actual_tip-tip).total_seconds())>15*60:
                continue
            gid=str(item.get("gameId") or "")
            if re.fullmatch(r"\d{10}",gid):
                candidates.append(gid)
        gid=candidates[0] if len(candidates)==1 else ""
        box=boxes.get(gid,{}) if gid else {}
        teams=[]
        for side,abbr,tid in (("home",home_abbr,home_id),("away",away_abbr,away_id)):
            selected,reason=(starters_from_box(box,side,abbr,gid,game,tid)
                             if box else ([],"BOX_NOT_AVAILABLE" if gid else "MATCHUP_NOT_UNIQUE_OR_POSTED"))
            confirmed=len(selected)==5
            state="CONFIRMED" if confirmed else "NOT_POSTED"
            teams.append({"team_id":tid,"lineup_state":state,
                          "starters":selected if confirmed else [],
                          "inactive":[],"minute_limits":[]})
            status_counts[reason]=status_counts.get(reason,0)+1
        out.append({"game_id":str(game["game_id"]),"tipoff_utc":tip.isoformat(),
                    "teams":teams})
    observed=now.isoformat()
    return {"schema":SCHEMA,"provider":PROVIDER,"source_url":SCOREBOARD,
            "published_at_utc":observed,"captured_at_utc":observed,
            "source_timestamp_basis":"FIRST_OBSERVED_NOT_ORIGINAL_PUBLICATION",
            "games":out}, {"source":PROVIDER,"first_observed_at_utc":observed,
                           "games":len(out),
                           "confirmed_teams":sum(t["lineup_state"]=="CONFIRMED"
                                                for g in out for t in g["teams"]),
                           "not_posted_teams":sum(t["lineup_state"]!="CONFIRMED"
                                                  for g in out for t in g["teams"]),
                           "reasons":status_counts,
                           "source_publication_time_not_claimed":True}


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--v3",required=True)
    p.add_argument("--out",required=True)
    p.add_argument("--audit",required=True)
    a=p.parse_args()
    v3=json.loads(Path(a.v3).read_text())
    now=dt.datetime.now(dt.timezone.utc)
    try:
        feed=fetch_json(SCOREBOARD)
        games=(feed.get("scoreboard") or {}).get("games") or []
        boxes={}
        # Never fetch a game that has already started. Match by fixture and
        # time, *not* by an unverified ESPN<->NBA game-id equivalence.
        for item in games:
            if not isinstance(item,dict) or item.get("gameStatus")!=1:
                continue
            gid=str(item.get("gameId") or "")
            if not re.fullmatch(r"\d{10}",gid):
                continue
            if not any(str(g.get("home_id")) in ESPN_ABBR
                       and str(g.get("away_id")) in ESPN_ABBR
                       and (item.get("homeTeam") or {}).get("teamTricode")==ESPN_ABBR[str(g["home_id"])]
                       and (item.get("awayTeam") or {}).get("teamTricode")==ESPN_ABBR[str(g["away_id"])]
                       and (abs((utc(item["gameTimeUTC"])-utc(g["tipoff_utc"])).total_seconds())<=15*60)
                       and now<utc(g["tipoff_utc"])
                       for g in v3.get("games",[])):
                continue
            try:
                boxes[gid]=fetch_json(BOX_URL.format(game_id=gid))
            except Exception as exc:
                print("NBA_PREGAME_BOX_UNAVAILABLE",gid,type(exc).__name__,flush=True)
        doc,audit=capture(v3,feed,boxes,now)
        audit["live_scoreboard_fetch"]="OK"
    except Exception as exc:
        # A provider outage is never a confirmation. Preserve the precise
        # degraded result for the user-facing audit; V5 stays on projections.
        fallback={"scoreboard":{"games":[]}}
        doc,audit=capture(v3,fallback,{},now)
        audit["live_scoreboard_fetch"]="UNAVAILABLE"
        audit["source_error_type"]=type(exc).__name__
    Path(a.out).write_text(json.dumps(doc,sort_keys=True,separators=(",",":")))
    Path(a.audit).write_text(json.dumps(audit,sort_keys=True,indent=2))
    print("NBA_V5_PREGAME_STARTERS",json.dumps(audit),flush=True)


if __name__=="__main__":
    main()
