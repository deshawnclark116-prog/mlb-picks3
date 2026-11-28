"""Acquire published historical player boxes independently of legacy model code."""
import argparse,collections,datetime as dt,gzip,hashlib,json,math,urllib.request
from pathlib import Path
import pyarrow.parquet as pq
URL="https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_player_boxscores/player_box_{year}.parquet"
STAT={"min":"minutes","fgm":"field_goals_made","fga":"field_goals_attempted",
 "tpm":"three_point_field_goals_made","tpa":"three_point_field_goals_attempted",
 "ftm":"free_throws_made","fta":"free_throws_attempted","oreb":"offensive_rebounds",
 "dreb":"defensive_rebounds","reb":"rebounds","ast":"assists","stl":"steals","blk":"blocks",
 "tov":"turnovers","pf":"fouls","pts":"points"}
BASE=("game_id","season","season_type","game_date_time","athlete_id","athlete_display_name","team_id",
      "team_abbreviation","home_away","team_score","starter","did_not_play")
def convert(rows,year):
    by=collections.defaultdict(list);rejected=collections.Counter()
    for r in rows:
        if r["season"]!=year or r["season_type"]!=2:continue
        by[str(r["game_id"])].append(r)
    good=[]
    for gid,rr in by.items():
        try:
            dates={r["game_date_time"] for r in rr if r["game_date_time"] is not None}
            if len(dates)!=1:raise ValueError("date")
            tip=next(iter(dates))
            if tip.tzinfo is None:raise ValueError("timezone")
            game={"game_id":gid,"date":tip.astimezone(dt.timezone.utc).isoformat(),"season_type":2,"players":[]}
            seen=set()
            for r in rr:
                if r["did_not_play"] or r["minutes"] is None or float(r["minutes"])<=0:continue
                if r["athlete_id"] is None or r["team_id"] is None:raise ValueError("identity")
                pid=str(r["athlete_id"]);tid=str(r["team_id"]);side=str(r["home_away"]).lower()
                if pid in seen or side not in ("home","away") or not 1<=int(tid)<=30:raise ValueError("identity_or_side")
                seen.add(pid)
                team={"id":tid,"abbr":r["team_abbreviation"],"score":int(r["team_score"])}
                if side in game and game[side]!=team:raise ValueError("team_inconsistent")
                game[side]=team
                p={"id":pid,"team":tid,"side":side,"name":r["athlete_display_name"],"start":bool(r["starter"])}
                for dst,src in STAT.items():
                    v=r[src]
                    if v is None or not math.isfinite(float(v)) or float(v)<0:raise ValueError("missing_or_negative_stat")
                    p[dst]=float(v) if dst=="min" else int(v)
                if not (p["fgm"]<=p["fga"] and p["tpm"]<=p["tpa"]<=p["fga"] and p["tpm"]<=p["fgm"] and p["ftm"]<=p["fta"]):
                    raise ValueError("shot_identity")
                if p["pts"]!=2*p["fgm"]+p["tpm"]+p["ftm"] or p["reb"]!=p["oreb"]+p["dreb"]:
                    raise ValueError("stat_identity")
                game["players"].append(p)
            if not {"home","away"}<=game.keys() or game["home"]["id"]==game["away"]["id"]:raise ValueError("teams")
            if game["home"]["score"]==game["away"]["score"]:raise ValueError("not_final")
            mins=[]
            for side in ("home","away"):
                ps=[p for p in game["players"] if p["side"]==side]
                if len(ps)<5 or sum(p["pts"] for p in ps)!=game[side]["score"]:raise ValueError("score_reconciliation")
                mn=sum(p["min"] for p in ps);mins.append(mn)
                # Some providers record rounded minutes. Allow a small
                # error but require regulation/OT team-minute structure.
                if min(abs(mn-(240+25*o)) for o in range(8))>9:raise ValueError("team_minutes")
            if abs(mins[0]-mins[1])>9:raise ValueError("team_minutes_crosscheck")
            good.append(game)
        except (ValueError,TypeError,KeyError) as exc:rejected[str(exc)]+=1
    return sorted(good,key=lambda g:(g["date"],g["game_id"])),dict(rejected),len(by)
def acquire(year,root):
    url=URL.format(year=year);p=root/f"player_box_{year}.parquet"
    req=urllib.request.Request(url,headers={"User-Agent":"NBAWorldHistoricalResearch/1.0"})
    with urllib.request.urlopen(req,timeout=120) as r, p.open("wb") as f:
        while True:
            b=r.read(1024*1024)
            if not b:break
            f.write(b)
    schema=set(pq.read_schema(p).names);cols=list(BASE)+list(STAT.values())
    missing=set(cols)-schema
    if missing:raise ValueError("source schema missing "+str(sorted(missing)))
    rows=pq.read_table(p,columns=cols).to_pylist()
    games,rejected,candidates=convert(rows,year)
    if len(games)<1150 or len(games)<.94*candidates:raise ValueError(f"coverage gate {year}: {len(games)}/{candidates} {rejected}")
    out=root/f"world_games_{year}.jsonl.gz"
    with gzip.open(out,"wt") as f:
        for g in games:f.write(json.dumps(g,separators=(",",":"))+"\n")
    result={"year":year,"url":url,"raw_sha256":hashlib.sha256(p.read_bytes()).hexdigest(),
         "converted_sha256":hashlib.sha256(out.read_bytes()).hexdigest(),"raw_rows":len(rows),
         "candidate_games":candidates,"accepted_games":len(games),"rejected":rejected,"players":len({p["id"] for g in games for p in g["players"]})}
    print("HISTORICAL_SOURCE",json.dumps(result,sort_keys=True),flush=True)
    return result
def main():
    a=argparse.ArgumentParser();a.add_argument("--years",nargs="+",type=int,required=True);a.add_argument("--out",required=True);args=a.parse_args()
    if any(y>=2026 or y<2016 for y in args.years):raise ValueError("only declared older completed seasons")
    root=Path(args.out);root.mkdir(parents=True,exist_ok=True)
    report=[acquire(y,root) for y in args.years]
    (root/"manifest.json").write_text(json.dumps(report,indent=2))
if __name__=="__main__":main()
