#!/usr/bin/env python3
"""NBA V1: leak-safe game-level baseline / challenger.

This is an *unpromoted* research model, not a sportsbook-pick generator.
Results come only from completed ESPN regular-season NBA events, using
exact game/team IDs. A whole calendar day's forecasts are frozen before
any game on that date updates team state. There is no injury, player-role,
lineup, or archived-book price certification yet.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import hashlib
import json
import math
import statistics
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

SCHEMA="NBA_V1_LEAKSAFE_ESPN_TEAM_HOLDOUT_V1"
MODEL="nba_elo_recent_offense_defense_v1_frozen"
URL="https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
UTC=dt.timezone.utc
MIN_PRIOR_GAMES=5
HOME_ELO=55.0
ELO_K=20.0

def day(s: str)->dt.date:
    return dt.date.fromisoformat(s)

def datetime_utc(s: str)->dt.datetime:
    d=dt.datetime.fromisoformat(str(s).replace("Z","+00:00"))
    if d.tzinfo is None:raise ValueError("naive kickoff rejected")
    return d.astimezone(UTC)

def finite(v:object)->float:
    if isinstance(v,bool):raise ValueError("bool is not numeric")
    x=float(v)
    if not math.isfinite(x):raise ValueError("non-finite numeric source")
    return x

def extract_events(blob:object)->list[dict]:
    if not isinstance(blob,dict) or not isinstance(blob.get("events"),list):
        raise ValueError("ESPN response missing events collection")
    out=[]
    for e in blob["events"]:
        if not isinstance(e,dict):continue
        season=e.get("season") or {}
        # Strictly regular season: preseason/playoffs are not the same population.
        if str(season.get("type",""))!="2":continue
        competition=(e.get("competitions") or [None])[0]
        if not isinstance(competition,dict):continue
        contestants=competition.get("competitors") or []
        if len(contestants)!=2:continue
        home=next((c for c in contestants if c.get("homeAway")=="home"),None)
        away=next((c for c in contestants if c.get("homeAway")=="away"),None)
        if not home or not away:continue
        game_id=str(e.get("id") or "")
        if not game_id:continue
        when=datetime_utc(e.get("date") or competition.get("date"))
        home_team=home.get("team") or {};away_team=away.get("team") or {}
        hid=str(home_team.get("id") or "");aid=str(away_team.get("id") or "")
        if not hid or not aid or hid==aid:continue
        status=competition.get("status") or e.get("status") or {}
        completed=bool((status.get("type") or {}).get("completed"))
        # Only completed finals with authentic scores are training labels.
        hpts=apts=None
        if completed:
            try:
                hpts=finite(home["score"]);apts=finite(away["score"])
                if hpts<0 or apts<0 or int(hpts)!=hpts or int(apts)!=apts:
                    raise ValueError("invalid integer basketball score")
            except (KeyError,TypeError,ValueError):
                continue
            if hpts==apts:raise ValueError("NBA final tie must not be silently graded")
        out.append({
            "game_id":game_id,"start_utc":when.isoformat(),
            "day_utc":when.date().isoformat(),
            "home_id":hid,"away_id":aid,
            "home":str(home_team.get("displayName") or home_team.get("name") or hid),
            "away":str(away_team.get("displayName") or away_team.get("name") or aid),
            "completed":completed,
            "home_points":int(hpts) if completed else None,
            "away_points":int(apts) if completed else None
        })
    return out

def date_range(first:dt.date,last:dt.date):
    if last<first or (last-first).days>250:raise ValueError("invalid/reckless date window")
    x=first
    while x<=last:
        yield x
        x+=dt.timedelta(days=1)

def get_scoreboard(d:dt.date)->tuple[str,dict]:
    params=urllib.parse.urlencode({"dates":d.strftime("%Y%m%d"),"limit":100})
    req=urllib.request.Request(URL+"?"+params,headers={
        "User-Agent":"PropEdgeNBAHistoricalResearch/1.0",
        "Accept":"application/json"})
    last_error=None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=22) as response:
                blob=json.load(response)
            if not isinstance(blob,dict) or not isinstance(blob.get("events"),list):
                raise ValueError("bad ESPN scoreboard JSON")
            return d.isoformat(),blob
        except Exception as e:
            last_error=e
            if attempt<2:
                import time
                time.sleep(attempt+1)
    raise RuntimeError(f"ESPN scoreboard unavailable for {d}: {last_error}")

def ingest(first:dt.date,last:dt.date,cache:Path,workers:int=4)->tuple[list[dict],dict]:
    """Cache immutable provider-day JSON before reading; abort on missing dates.
    Never backfill today's labels from guesses, stale scores or preseason.
    """
    cache.mkdir(parents=True,exist_ok=True)
    blobs={};to_fetch=[]
    for d in date_range(first,last):
        path=cache/(d.strftime("%Y%m%d")+".json")
        if path.exists():
            z=json.loads(path.read_text())
            if isinstance(z,dict) and isinstance(z.get("events"),list):
                blobs[d.isoformat()]=z
                continue
        to_fetch.append(d)
    if to_fetch:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max(1,min(workers,5))) as pool:
            for date_str,data in pool.map(get_scoreboard,to_fetch):
                blobs[date_str]=data
                (cache/(date_str.replace("-","")+".json")).write_text(
                    json.dumps(data,separators=(",",":"),ensure_ascii=False)+"\n")
    records={}; conflicts=[]
    for d in date_range(first,last):
        for item in extract_events(blobs[d.isoformat()]):
            key=item["game_id"]
            if key in records and records[key]!=item:conflicts.append(key)
            records[key]=item
    if conflicts:raise ValueError("conflicting immutable ESPN event identities: "+str(conflicts[:3]))
    completed=sorted((g for g in records.values() if g["completed"]),key=lambda x:(x["day_utc"],x["start_utc"],x["game_id"]))
    source_sha=hashlib.sha256(json.dumps(completed,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    return completed,{"provider":"ESPN NBA scoreboard event IDs","first_day":str(first),"last_day":str(last),
                      "dates_queried":(last-first).days+1,"completed_unique_games":len(completed),
                      "source_content_sha256":source_sha,"url_format":URL+"?dates=YYYYMMDD",
                      "regular_season_only":True}

def elo_probability(home_rating:float,away_rating:float)->float:
    power=max(-5,min(5,(home_rating-away_rating+HOME_ELO)/400))
    return 1/(1+10**(-power))

class Team:
    def __init__(self):
        self.elo=1500.0
        self.pf:list[float]=[]
        self.pa:list[float]=[]
        self.last_date:dt.date|None=None
    @property
    def n(self)->int:return len(self.pf)
    def shrink_average(self,ls:list[float],base:float)->float:
        # First five games have deliberately strong prior anchoring.
        window=ls[-12:]
        decay=[0.90**(len(window)-i-1) for i in range(len(window))]
        wt=sum(decay)
        return (base*8+sum(a*b for a,b in zip(window,decay)))/(8+wt)

def model_predict(h:Team,a:Team,avg_points:float,baseline_p:float)->dict:
    h_for=h.shrink_average(h.pf,avg_points)
    a_for=a.shrink_average(a.pf,avg_points)
    h_allowed=a.shrink_average(a.pa,avg_points)
    a_allowed=h.shrink_average(h.pa,avg_points)
    # Separate team attack and opposing defense; no magic player substitutions.
    raw_home=avg_points + .58*(h_for-avg_points)+.42*(h_allowed-avg_points)+1.7
    raw_away=avg_points + .58*(a_for-avg_points)+.42*(a_allowed-avg_points)-1.7
    # Elo supplies independent opponent-dependent win chance.
    elo=elo_probability(h.elo,a.elo)
    coverage=min(1.0,min(h.n,a.n)/15)
    p=baseline_p*(1-coverage)+elo*coverage
    return {"home_win_prob":round(p,6),"home_points":round(raw_home,2),
            "away_points":round(raw_away,2),
            "total_points":round(raw_home+raw_away,2),
            "home_elo":round(h.elo,1),"away_elo":round(a.elo,1),
            "prior_games_home":h.n,"prior_games_away":a.n,
            "coverage_fraction":round(coverage,3)}

def verify_games(games:list[dict]):
    ids=set();out=[]
    for g in games:
        if not g.get("completed"):continue
        if g["game_id"] in ids:raise ValueError("duplicate historical game ID")
        ids.add(g["game_id"])
        h,a=finite(g["home_points"]),finite(g["away_points"])
        if h==a or h<0 or a<0 or not g.get("start_utc"):raise ValueError("invalid final")
        d=datetime_utc(g["start_utc"])
        if d.date().isoformat()!=g["day_utc"]:raise ValueError("event UTC date mismatch")
        if g["home_id"]==g["away_id"]:raise ValueError("home team plays itself")
        out.append(g)
    return sorted(out,key=lambda x:(x["day_utc"],x["start_utc"],x["game_id"]))

def walk_forward(games:list[dict],validation_start:str,holdout_start:str)->dict:
    if day(holdout_start)<=day(validation_start):
        raise ValueError("holdout must be after validation")
    games=verify_games(games)
    team:dict[str,Team]=defaultdict(Team)
    result=[]
    previous_h=0;previous_a=0;prior_tot=0;completed_before=0
    by_date=defaultdict(list)
    for g in games:by_date[g["day_utc"]].append(g)
    for dd,group in sorted(by_date.items()):
        # NO same-day outcomes may influence the same day's pregame predictions.
        games_before=completed_before
        league_points=(previous_h+previous_a)/(2*completed_before) if completed_before else 113.0
        home_wins_prior=(prior_tot+24)/(completed_before+48)
        todays=[]
        for g in group:
            h=team[g["home_id"]];a=team[g["away_id"]]
            pred=model_predict(h,a,league_points,home_wins_prior)
            eligible=h.n>=MIN_PRIOR_GAMES and a.n>=MIN_PRIOR_GAMES and completed_before>=50
            split="seed" if dd<validation_start else "validation" if dd<holdout_start else "holdout"
            o={**g,**pred,"eligible":eligible,"split":split,
               "pregame_league_points":round(league_points,3),
               "pregame_baseline_home_win_prob":round(home_wins_prior,6),
               "pregame_baseline_total":round(league_points*2,2),
               "history_games_before_day":games_before,
               "winner_is_home":int(g["home_points"]>g["away_points"])}
            todays.append(o)
        # Score and update AFTER all current-date forecasts are immutable.
        for g in group:
            h=team[g["home_id"]];a=team[g["away_id"]]
            hp,ap=g["home_points"],g["away_points"]
            pre=elo_probability(h.elo,a.elo)
            actual=1.0 if hp>ap else 0.0
            margin=abs(hp-ap)
            mover=ELO_K*min(1.7,1+math.log1p(margin)/5)*(actual-pre)
            h.elo+=mover;a.elo-=mover
            h.pf.append(hp);h.pa.append(ap)
            a.pf.append(ap);a.pa.append(hp)
            h.last_date=a.last_date=day(dd)
            previous_h+=hp;previous_a+=ap
            prior_tot+=actual;completed_before+=1
        result.extend(todays)
    return {"rows":result,"metrics":evaluate(result),"unique_games":len(games),
            "validation_from":validation_start,"holdout_from":holdout_start,
            "configuration":{"model":MODEL,"min_prior_games_each_team":MIN_PRIOR_GAMES,
                "same_day_results_cannot_enter_inputs":True,"uses_actual_finals_only":True,
                "no_injury_or_lineup_information":True}}

def evaluate(all_rows:list[dict])->dict:
    report={}
    for subset in ("seed","validation","holdout"):
        x=[r for r in all_rows if r["eligible"] and r["split"]==subset]
        if not x:
            report[subset]={"n":0,"result":"INSUFFICIENT_HISTORICAL_COVERAGE"}
            continue
        model_brier=statistics.mean((r["home_win_prob"]-r["winner_is_home"])**2 for r in x)
        baseline_brier=statistics.mean((r["pregame_baseline_home_win_prob"]-r["winner_is_home"])**2 for r in x)
        model_mae=statistics.mean(abs(r["total_points"]-(r["home_points"]+r["away_points"])) for r in x)
        baseline_mae=statistics.mean(abs(r["pregame_baseline_total"]-(r["home_points"]+r["away_points"])) for r in x)
        report[subset]={
            "n":len(x),"brier_model":round(model_brier,5),
            "brier_simple_pregame_home_rate":round(baseline_brier,5),
            "brier_gain_vs_baseline_positive_better":round(baseline_brier-model_brier,5),
            "total_points_mae_model":round(model_mae,3),
            "total_points_mae_baseline":round(baseline_mae,3),
            "calibration_gap_abs":round(abs(statistics.mean(r["home_win_prob"] for r in x)-
                                             statistics.mean(r["winner_is_home"] for r in x)),4),
            "home_win_pct_actual":round(100*statistics.mean(r["winner_is_home"] for r in x),1)}
    return report

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--from-date",default="2025-10-21")
    p.add_argument("--to-date",default="2026-01-31")
    p.add_argument("--validation-start",default="2025-12-01")
    p.add_argument("--holdout-start",default="2026-01-01")
    p.add_argument("--cache-dir",type=Path,default=Path(".cache/nba-espn-scoreboards"))
    p.add_argument("--json-in",type=Path)
    p.add_argument("--out",type=Path,default=Path("docs/nba_v1_forward_walkback.json"))
    a=p.parse_args()
    if a.json_in:
        x=json.loads(a.json_in.read_text())
        games=x["games"]
        provenance={"source":"provided ESPN-derived fixture","loaded_games":len(games)}
    else:
        games,provenance=ingest(day(a.from_date),day(a.to_date),a.cache_dir)
    result=walk_forward(games,a.validation_start,a.holdout_start)
    result.update({"schema":SCHEMA,"source":provenance,
          "generated_at_utc":dt.datetime.now(UTC).isoformat(),
          "research_only":True,"official_bets":0,"market_lines_verified":False,
          "player_prop_predictions":0,
          "promotion_criteria":"Do not promote on green CI. Holdout Brier and total MAE must beat identically dated simple baseline, supported by multiple seasons and roster/availability integration.",
          "important":"Unverified injuries, roster movement, starters and minutes make current-season betting picks unsafe. No prices or ROI."})
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(result,indent=2,allow_nan=False)+"\n")
    print("NBA_RESEARCH_REAL_HOLDOUT",json.dumps({"games":result["unique_games"],
         "source":provenance,"metrics":result["metrics"],
         "eligible_holdout_games":result["metrics"]["holdout"]["n"]},
         sort_keys=True))
if __name__=="__main__":main()
