"""As-of NBA daily lineups -> independently verified V3 current-roster bridge.

ESPN's current team roster sometimes omits players who demonstrably have
ESPN player identities and historical games. The NBA's dated, not-started
team/player list can corroborate CURRENT TEAM MEMBERSHIP before V3 builds
its pool. Membership NEVER implies game-day ACTIVE/starting status.
Only an explicit, five-position CONFIRMED starting five can establish
starter availability. No data from started/completed NBA games is accepted.

The original ESPN roster receipts are not mutated. All additions are
per-game and have separate source/audit provenance.
"""
from __future__ import annotations

import datetime as dt
import re
import unicodedata
from collections import defaultdict
from zoneinfo import ZoneInfo

from nba.nba_v5_daily_lineups_feed import fetch_json, feed_url
from nba.nba_v5_hoopr_tracking import ESPN_ABBR

SCHEMA="NBA_V3_OFFICIAL_PREGAME_ROSTER_BRIDGE_V1"
ET=ZoneInfo("America/New_York")
STARTER_POSITIONS=frozenset(("PG","SG","SF","PF","C"))
MAX_AGE_SECONDS=30*60
MAX_WINDOW_SECONDS=9*3600


def aware(value):
    val=dt.datetime.fromisoformat(str(value).replace("Z","+00:00"))
    if val.tzinfo is None:
        raise ValueError("NBA_V3_ROSTER_BRIDGE_NAIVE_CLOCK")
    return val.astimezone(dt.timezone.utc)


def norm(value):
    s=unicodedata.normalize("NFKD",str(value or ""))
    s="".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+"," ",s.casefold()).strip()


def collect(fixtures,fetcher=fetch_json,now=None):
    """Fetch one NBA date feed only for genuinely upcoming fixtures.

    Fail open for network failures; the secondary NBA source never invents
    player identities or permits backfilling after tipoff.
    """
    clock=now or dt.datetime.now(dt.timezone.utc)
    if clock.tzinfo is None:
        raise ValueError("NBA_V3_ROSTER_BRIDGE_NAIVE_CLOCK")
    dates=set()
    for g in fixtures.get("games",[]):
        tip=aware(g["tipoff_utc"])
        if 0 < (tip-clock).total_seconds() <= MAX_WINDOW_SECONDS:
            dates.add(tip.astimezone(ET).strftime("%Y%m%d"))
    feeds={}
    errors={}
    for date in sorted(dates):
        try:
            x=fetcher(date)
            if not isinstance(x,dict) or not isinstance(x.get("games"),list):
                raise ValueError("NBA_V3_DAILY_ROSTER_UNKNOWN_SCHEMA")
            feeds[date]=x
        except Exception as exc:
            errors[date]=type(exc).__name__
    # The evidence timestamp is the ACTUAL time AFTER fetching, not the
    # requested time before the network call.
    observed=dt.datetime.now(dt.timezone.utc) if fetcher is fetch_json else clock
    return {"schema":SCHEMA,"captured_at_utc":observed.isoformat(),
            "dates_requested":sorted(dates),"feeds_by_date":feeds,
            "source_errors":errors,
            "source_urls":[feed_url(d) for d in sorted(feeds)]}


def _id_index(histories):
    """Strict name -> unique ESPN player ID from completed PRIOR boxes."""
    found=defaultdict(set)
    for (tid,pid),rows in histories.items():
        if rows:
            name=norm(rows[-1].get("player"))
            if name:
                found[name].add(str(pid))
    return found


def supplement(game,rosters,histories,snapshot,asof):
    """Return per-game roster IDs, independently confirmed starters, audit.

    Does not change rosters/receipts or mark EXPECTED as confirmed.
    """
    tid_home=str(game["home_id"])
    tid_away=str(game["away_id"])
    teams=(tid_home,tid_away)
    result={tid:{str(row["player_id"]) for row in rosters[tid]} for tid in teams}
    audit={"source":"NBA_OFFICIAL_DAILY_PREGAME_TEAM_LIST",
           "model_effect":"CURRENT_ROSTER_MEMBERSHIP_ONLY_UNLESS_EXPLICIT_CONFIRMED_FIVE",
           "game_id":str(game["game_id"]),"capture_status":"NOT_CONNECTED",
           "added_by_team":{tid:[] for tid in teams},
           "confirmed_starters_by_team":{tid:[] for tid in teams},
           "ambiguous_name_count":0,"unmatched_name_count":0,
           "conflicting_team_count":0,
           "verified_new_team_prior_game_count":0,
           "source_player_count":0,"source_timestamp_utc":None}
    if not snapshot:
        return result,{tid:[] for tid in teams},audit
    if snapshot.get("schema")!=SCHEMA:
        raise ValueError("NBA_V3_ROSTER_BRIDGE_SCHEMA_MISMATCH")
    clock=aware(asof)
    observed=aware(snapshot["captured_at_utc"])
    tip=aware(game["tipoff_utc"])
    if observed>clock or (clock-observed).total_seconds()>MAX_AGE_SECONDS or clock>=tip:
        audit["capture_status"]="STALE_FUTURE_OR_AFTER_TIP"
        return result,{tid:[] for tid in teams},audit
    date=tip.astimezone(ET).strftime("%Y%m%d")
    feeds=snapshot.get("feeds_by_date") or {}
    feed=feeds.get(date)
    if not isinstance(feed,dict):
        audit["capture_status"]="DATE_FEED_UNAVAILABLE"
        return result,{tid:[] for tid in teams},audit
    candidates=[x for x in feed.get("games",[])
                if isinstance(x,dict) and str(x.get("gameStatus"))=="1"
                and str((x.get("homeTeam") or {}).get("teamAbbreviation"))==ESPN_ABBR.get(tid_home)
                and str((x.get("awayTeam") or {}).get("teamAbbreviation"))==ESPN_ABBR.get(tid_away)]
    if len(candidates)!=1:
        audit["capture_status"]="PREGAME_MATCHUP_NOT_UNIQUE_OR_NOT_POSTED"
        return result,{tid:[] for tid in teams},audit
    nba_game=candidates[0]
    names=_id_index(histories)
    occupied={str(p["player_id"]):str(tid) for tid,rows in rosters.items()
              for p in rows}
    out_status={tid:[] for tid in teams}
    for tid,side in ((tid_home,"homeTeam"),(tid_away,"awayTeam")):
        team=(nba_game.get(side) or {})
        players=team.get("players")
        if not isinstance(players,list) or len(players)>30:
            audit["capture_status"]="NBA_TEAM_PLAYERS_INVALID"
            return {t:{str(p["player_id"]) for p in rosters[t]} for t in teams},out_status,audit
        positional=[p for p in players if isinstance(p,dict) and
                    str(p.get("position","")).upper() in STARTER_POSITIONS]
        complete_five=(len(positional)==5 and
                       {str(p.get("position","")).upper() for p in positional}==STARTER_POSITIONS and
                       all(str(p.get("lineupStatus","")).lower()=="confirmed" and
                           str(p.get("rosterStatus","")).lower()=="active" for p in positional))
        resolved={}
        audit["source_player_count"]+=len(players)
        for p in players:
            if not isinstance(p,dict) or str(p.get("rosterStatus","")).lower()!="active":
                continue
            label=norm(p.get("playerName") or
                       (str(p.get("firstName") or "")+" "+str(p.get("lastName") or "")))
            match=names.get(label,set())
            if len(match)==0:
                audit["unmatched_name_count"]+=1
                continue
            if len(match)!=1:
                audit["ambiguous_name_count"]+=1
                continue
            pid=next(iter(match))
            other_team=occupied.get(pid)
            new_team_prior_games=len(histories.get((tid,pid),[]))
            if other_team and other_team!=tid and new_team_prior_games<1:
                # The official *dated* NBA team list is newer evidence of
                # membership than ESPN's stale old-team roster, but a bare
                # listing alone cannot disambiguate a contradictory transfer.
                # One real completed game already played FOR the new club
                # independently proves the transfer even when fewer than
                # five games have accrued there. The source histories are
                # compiled strictly before the current forecast timestamp.
                audit["conflicting_team_count"]+=1
                continue
            if other_team and other_team!=tid and new_team_prior_games>=1:
                audit["verified_new_team_prior_game_count"]+=1
            # Model V3 needs >=5 real prior boxes. Rookies with fewer
            # observations stay research-only; don't synthesize outcomes.
            if max((len(h) for (ht,hpid),h in histories.items()
                    if str(hpid)==pid),default=0)<5:
                continue
            resolved[id(p)]=pid
            if pid not in result[tid]:
                result[tid].add(pid)
                audit["added_by_team"][tid].append({
                    "player_id":pid,"player_name":p.get("playerName"),
                    "source_url":feed_url(date),
                    "current_roster_verified_only":True,
                    "active_for_game_not_inferred":True,
                    "new_team_prior_games":new_team_prior_games,
                    "old_team_espn_roster_conflict_resolved_by_prior_play":
                        bool(other_team and other_team!=tid)})
        if complete_five:
            mapped=[resolved.get(id(p)) for p in positional]
            if all(mapped) and len(set(mapped))==5:
                audit["confirmed_starters_by_team"][tid]=mapped
                for pid in mapped:
                    out_status[tid].append({
                        "team_id":tid,"player_id":pid,"status":"ACTIVE",
                        "independently_verified":True,
                        "source_url":feed_url(date),
                        "published_at_utc":observed.isoformat()})
    audit["capture_status"]="PREGAME_TEAM_LIST_OBSERVED"
    audit["source_timestamp_utc"]=observed.isoformat()
    return result,out_status,audit
