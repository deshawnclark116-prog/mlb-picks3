#!/usr/bin/env python3
"""Source-contracted NBA player box scores and a role-aware RESEARCH baseline.

Inputs must be ESPN completed-game box score statistics, not future player
participation. A player is eligible to be projected only if their own prior
game observations meet a minimum. The source does NOT certify tomorrow's
active roster or the actual minutes restriction. No sports wagers.
"""
from __future__ import annotations
import datetime as dt
import json, math, statistics, urllib.request
from collections import defaultdict

SUMMARY="https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event="
STAT_NAMES={"points":"PTS","rebounds":"REB","assists":"AST","three_pointers_made":"3PT"}
MIN_HISTORY=5

def parse_minutes(raw):
    t=str(raw).strip()
    if ":" in t:
        a,b=t.split(":",1)
        val=int(a)+int(b)/60
        if not (0<=int(b)<60):raise ValueError("impossible minutes seconds")
    else:val=float(t)
    if not math.isfinite(val) or not 0<=val<=65:
        raise ValueError("not physical basketball minutes")
    return round(val,3)

def number(s):
    if isinstance(s,bool) or s is None:raise ValueError("missing statistic")
    v=float(s)
    if not math.isfinite(v) or v<0 or v!=int(v):
        raise ValueError("invalid nonnegative integer stat")
    return int(v)

def parse_made(s):
    s=str(s).strip()
    if "-" not in s:return number(s)
    made,attempted=s.split("-",1)
    m,a=number(made),number(attempted)
    if m>a:raise ValueError("made cannot exceed attempts")
    return m

def parse_final_boxscore(payload,event_id,expected_team_ids):
    if not isinstance(payload,dict):raise ValueError("not JSON object")
    players=(payload.get("boxscore") or {}).get("players")
    if not isinstance(players,list) or len(players)!=2:
        raise ValueError("must have two authentic boxscore teams")
    teams=set();seen=set();out=[];audit={"missing_dnp":0,"source":"ESPN NBA full-game summary"}
    for t in players:
        club=t.get("team") or {}
        team=str(club.get("id") or "")
        if not team or team in teams:raise ValueError("invalid duplicated boxscore team")
        teams.add(team)
        categories=t.get("statistics") or []
        # ESPN sometimes publishes alternative statistic groups; select the
        # one containing *all* requested data rather than positional guesses.
        matching=[g for g in categories if set(("MIN","PTS","REB","AST","3PT")).issubset(
            {str(v).upper() for v in (g.get("labels") or g.get("names") or [])})]
        if len(matching)!=1:raise ValueError("ambiguous/missing detailed player stats")
        group=matching[0]
        labels=[str(v).upper() for v in (group.get("labels") or group.get("names"))]
        if len(labels)!=len(set(labels)):raise ValueError("duplicate stat labels")
        for row in group.get("athletes") or []:
            # ESPN can list DNP placeholders lacking full identity. A row
            # without any recorded statistics is NOT an actual participant,
            # so record its exclusion before enforcing played-player identity.
            # A played row without an ID/name must always fail closed.
            values=row.get("stats")
            if not isinstance(values,list) or len(values)==0:
                audit["missing_dnp"]+=1
                continue
            athlete=row.get("athlete") or {}
            player_id=str(athlete.get("id") or "")
            full_name=athlete.get("displayName") or athlete.get("fullName")
            if not player_id or not full_name:
                raise ValueError("player identity missing for played-stat row")
            key=(team,player_id)
            if key in seen:raise ValueError("player duplicated in boxscore")
            seen.add(key)
            if len(values)!=len(labels):raise ValueError("misaligned ESPN player stats")
            stat=dict(zip(labels,values))
            minutes=parse_minutes(stat["MIN"])
            if minutes==0:
                audit["missing_dnp"]+=1
                continue
            v={k:parse_made(stat[label]) if k=="three_pointers_made" else number(stat[label])
               for k,label in STAT_NAMES.items()}
            if v["points"] < 3*v["three_pointers_made"]:
                raise ValueError("3-pointers exceed recorded scoring")
            # Optional genuine shot-attempt and possession components.
            # Absent ESPN labels MUST stay absent, not be silently fabricated.
            # Existing V1/V2 five-core-stat contracts are unchanged.
            extra={}
            for label,fields in (
                ("FG",("field_goals_made","field_goal_attempts")),
                ("3PT",("three_pointers_made","three_point_attempts")),
                ("FT",("free_throws_made","free_throw_attempts")),
            ):
                raw=stat.get(label)
                if raw is None or "-" not in str(raw):continue
                made,attempted=str(raw).split("-",1)
                made,attempted=number(made),number(attempted)
                if made>attempted:raise ValueError("NBA_BAD_SOURCE_SHOT_ATTEMPTS")
                if fields[0]=="three_pointers_made":
                    if made!=v["three_pointers_made"]:
                        raise ValueError("NBA_CONTRADICTORY_THREE_MADE_SOURCE")
                    extra[fields[1]]=attempted
                else:
                    extra[fields[0]]=made
                    extra[fields[1]]=attempted
            for label,output in (
                ("OREB","offensive_rebounds"),
                ("TO","turnovers"),
            ):
                if label in stat:extra[output]=number(stat[label])
            if (extra.get("field_goal_attempts",0)<extra.get("field_goals_made",0) or
                extra.get("three_point_attempts",0)<v["three_pointers_made"] or
                "field_goal_attempts" in extra and
                "three_point_attempts" in extra and
                extra["field_goal_attempts"]<extra["three_point_attempts"]):
                raise ValueError("NBA_INVALID_FGA_OR_3PA_SOURCE")
            out.append({"event_id":str(event_id),"team_id":team,"player_id":player_id,
                "player":full_name,"minutes":minutes,"started":row.get("starter") is True,
                **v,**extra})
    if teams!=set(map(str,expected_team_ids)):
        raise ValueError("box score participants not scoreboard game teams")
    if len(out)<10:raise ValueError("insufficient NBA completed box score participants")
    audit.update({"played_players":len(out),"team_ids":sorted(teams),"game_id":str(event_id),
                  "roster_status":"POSTGAME_STATISTICS_ONLY_UNSAFE_FOR_PREGAME_LINEUPS"})
    return out,audit

def fetch_summary(event_id):
    if not str(event_id).isdigit():raise ValueError("invalid ESPN numeric event ID")
    req=urllib.request.Request(SUMMARY+str(event_id),headers={
        "Accept":"application/json","User-Agent":"PropEdgeNBAIndependentBoxscore/1.0"})
    with urllib.request.urlopen(req,timeout=25) as response:
        return json.load(response)

def median(x,default=0):
    return float(statistics.median(x)) if x else default

def mean_shrunk(x,prior,weight):
    return (sum(x)+prior*weight)/(len(x)+weight)

def project_player(history,team_games_since_first,last_team_game_index,asof_game_index):
    """Pregame baseline. History must be strictly prior to proposed game."""
    if not history or len(history)<MIN_HISTORY:
        return None,"INSUFFICIENT_REAL_PLAYER_GAME_HISTORY"
    if asof_game_index-last_team_game_index>5:
        return None,"PLAYER_NOT_RECENTLY_OBSERVED_ON_TEAM"
    if len(history)>team_games_since_first:
        raise ValueError("future or duplicate player activity")
    recent=history[-12:]
    # Minutes first: regular roles versus rotations/shrinking workloads.
    played_minutes=[float(r["minutes"]) for r in recent]
    expected_conditional_minutes=mean_shrunk(played_minutes,23.0,4.0)
    recent_team_games=min(12,team_games_since_first)
    # Availability from past deployment only, NOT the current game's actual
    # dressed list. Treat as model-derived and uncertain.
    p_play=(len(recent)+1.0)/(recent_team_games+2.0)
    p_play=min(0.97,p_play)
    cond={}
    for k in STAT_NAMES:
        per_min=[r[k]/r["minutes"] for r in recent if r["minutes"]>0]
        # Pre-game shrinkage anchors unstable 3PM and assists rates.
        base={"points":.39,"rebounds":.145,"assists":.09,
              "three_pointers_made":.028}[k]
        rate=mean_shrunk(per_min,base,5.0)
        cond[k]=round(expected_conditional_minutes*rate,3)
    return {"played_history_n":len(history),"last_12_observed":len(recent),
            "model_p_play_not_roster_verified":round(p_play,4),
            "conditional_minutes_mean":round(expected_conditional_minutes,2),
            "minutes_median_last_12":round(median(played_minutes),2),
            "conditional_stat_means":cond,
            "unconditional_stat_means_including_inactivity":{
                k:round(v*p_play,3) for k,v in cond.items()},
            "source":"prior_espn_completed_game_minutes_and_box_scores_only",
            "game_day_starter_certified":False,
            "injury_and_minutes_limit_certified":False,
            "research_only":True},None
