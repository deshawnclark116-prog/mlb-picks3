#!/usr/bin/env python3
"""2026-27 NBA opening-week team previews: UNCERTIFIED offseason research.

Only previous 2025-26 completed regular-season games feed team form.
ESPN upcoming fixture identity is read independently. Season-to-season
roster/coaching injuries/transfers are NOT available, so forecasts are
shrunk and NEVER promoted to true sportsbook picks.
"""
from __future__ import annotations
import argparse,datetime as dt,hashlib,json,math
from collections import defaultdict
from pathlib import Path
from nba.nba_v1_team_model import (Team,ingest,get_scoreboard,extract_events,verify_games,
    elo_probability,model_predict,ELO_K,UTC,datetime_utc)

SCHEMA="NBA_V1_2026_OPENING_ROSTER_BLIND_RESEARCH_V1"

def replay_previous_season(games):
    """Update team state with FINAL ESPN data, no current-season/preseason."""
    hist=verify_games(games)
    teams=defaultdict(Team)
    num=0;total=0.0;home_wins=0
    for g in hist:
        h=teams[g["home_id"]];a=teams[g["away_id"]]
        hp,ap=g["home_points"],g["away_points"]
        original=elo_probability(h.elo,a.elo)
        win=float(hp>ap)
        move=ELO_K*min(1.7,1+math.log1p(abs(hp-ap))/5)*(win-original)
        h.elo+=move;a.elo-=move
        h.pf.append(hp);h.pa.append(ap)
        a.pf.append(ap);a.pa.append(hp)
        h.last_date=a.last_date=dt.date.fromisoformat(g["day_utc"])
        home_wins+=win
        total+=hp+ap
        num+=1
    if num<700 or len(teams)<25:
        raise ValueError("INSUFFICIENT_PREVIOUS_SEASON_TEAM_COVERAGE")
    return teams,total/(num*2), (home_wins+24)/(num+48)

def preview(games,fixtures,asof):
    if asof.tzinfo is None:raise ValueError("no naive preview timestamps")
    asof=asof.astimezone(UTC)
    teams,league_mean,base_p=replay_previous_season(games)
    forecasts=[];unknown=[]
    for f in fixtures:
        kickoff=datetime_utc(f["start_utc"])
        if f["completed"] or kickoff<=asof:continue
        if f["home_id"] not in teams or f["away_id"] not in teams:
            unknown.append(f["game_id"]);continue
        h,a=teams[f["home_id"]],teams[f["away_id"]]
        if min(h.n,a.n)<40:
            unknown.append(f["game_id"]);continue
        raw=model_predict(h,a,league_mean,base_p)
        # Never pretend a prior-season roster-specific prediction was made
        # using confirmed opening-night injuries, trades, or starters.
        p=0.5+(raw["home_win_prob"]-0.5)*0.55
        hp=league_mean+(raw["pred_home_points"]-league_mean)*0.65
        ap=league_mean+(raw["pred_away_points"]-league_mean)*0.65
        forecasts.append({
            "game_id":f["game_id"],"tipoff_utc":f["start_utc"],
            "home":f["home"],"away":f["away"],
            "home_id":f["home_id"],"away_id":f["away_id"],
            "home_win_probability":round(p,4),
            "away_win_probability":round(1-p,4),
            "projected_home_score_mean":round(hp,1),
            "projected_away_score_mean":round(ap,1),
            "projected_game_total_mean":round(hp+ap,1),
            "raw_previous_season_home_win_prob":raw["home_win_prob"],
            "prior_season_team_games":{f["home"]:h.n,f["away"]:a.n},
            "role_availability_verified":False,
            "betting_line_available":False,
            "wager_recommendation":False,
            "source":"2025-26 completed NBA regular-season ESPN team form + ESPN future fixture",
            "offseason_scenario":"UNVERIFIED_ROSTER_AND_MINUTES_RESEARCH_ONLY"})
    return forecasts,unknown

def main():
    arg=argparse.ArgumentParser()
    arg.add_argument("--out",type=Path,default=Path("docs/nba_v1_opening_week_research.json"))
    arg.add_argument("--cache",type=Path,default=Path(".cache/nba-opening-scoreboard"))
    arg.add_argument("--history-from",default="2025-10-21")
    arg.add_argument("--history-to",default="2026-04-12")
    arg.add_argument("--opening-dates",default="2026-10-20,2026-10-21")
    a=arg.parse_args()
    now=dt.datetime.now(UTC)
    old,provenance=ingest(dt.date.fromisoformat(a.history_from),
                          dt.date.fromisoformat(a.history_to),a.cache)
    # ESPN season-type 2 is not identical to 82 standings games by contract.
    # Expose any excess before certifying as standard 82-game NBA research.
    from collections import Counter
    counts=Counter(x for g in old for x in (g["home_id"],g["away_id"]))
    extra={team:n for team,n in sorted(counts.items()) if n>82}
    print("NBA_ESPN_NONFRANCHISE_GAMES",json.dumps([g for g in old if int(g["home_id"])>30 or int(g["away_id"])>30]),flush=True)
    print("NBA_ESPN_DEC_2025_NYK_SAS",json.dumps([g for g in old if {g["home_id"],g["away_id"]}=={"18","24"} and g["day_utc"][:7]=="2025-12"]),flush=True)
    if extra:
        print("NBA_ESPN_TYPE2_EXCESS_TEAM_GAMES",extra,flush=True)
        for team in extra:
            affected=[g for g in old if team in (g["home_id"],g["away_id"])]
            print("NBA_ESPN_EXTRA_TEAM_GAMES",team,json.dumps(affected[-9:]),flush=True)
    future=[];snapshot_dates=[]
    for ymd in a.opening_dates.split(","):
        d=dt.date.fromisoformat(ymd)
        date_str,blob=get_scoreboard(d)
        snapshot_dates.append(date_str)
        future.extend(extract_events(blob))
    distinct={}
    for f in future:
        if f["game_id"] in distinct and distinct[f["game_id"]]!=f:
            raise ValueError("NBA_FUTURE_GAME_ID_CONFLICT")
        distinct[f["game_id"]]=f
    forecasts,unscored=preview(old,list(distinct.values()),now)
    result={"schema":SCHEMA,"generated_at_utc":now.isoformat(),
      "historical_source_sha256":provenance["source_content_sha256"],
      "historical_completed_regular_games":len(old),
      "historical_date_span":{"from":a.history_from,"to":a.history_to},
      "opening_fixture_dates_requested":snapshot_dates,
      "upcoming_fixture_ids_from_live_espn":sorted(distinct),
      "projected_games":len(forecasts),"forecasts":sorted(forecasts,key=lambda f:f["tipoff_utc"]),
      "unknown_team_matchups_excluded":unscored,
      "research_only":True,"official_wagers":0,"player_markets_official":0,
      "role_and_lineup_verification":"MISSING_DO_NOT_BET",
      "no_real_money_staking_or_roi":True,
      "warning":"Previous season team form regressed toward 50%. Current rosters, injuries, player minutes and confirmed starting lineups NOT included. No sportsbook prices; predictions have not been tested on the new season."}
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(result,indent=2,allow_nan=False)+"\n")
    print("NBA_V1_OPENING_MATCHUPS_UNPROMOTED",json.dumps(result,sort_keys=True))
if __name__=="__main__":main()
