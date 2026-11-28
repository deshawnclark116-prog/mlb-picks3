"""Independent prospective research forecasts, no production deployment.

Freeze actual pretip observations and full conditional threshold distributions.
No incumbent projections, current final box scores or actual starters enter
the model. ESPN team roster membership is not game-day availability evidence.
"""
import argparse, concurrent.futures, datetime as dt, hashlib, json, math, os, time, urllib.request
from pathlib import Path
import numpy as np
from nba_world.data import read,teams,date,stamp,MARKETS,KEYS
from nba_world.distribution import RoleState,own_target,RANGES
from nba_world.action_lab import datasets,Arm,inputs
from nba_world.actions import ActionHistory
BASE="https://site.api.espn.com/apis/site/v2/sports/basketball/nba/"
UTC=dt.timezone.utc
MINIMUM_TARGETS=(6,3,2,1)
def now():return dt.datetime.now(UTC)
def get(endpoint):
    url=BASE+endpoint;err=None
    for _ in range(3):
        try:
            req=urllib.request.Request(url,headers={"Accept":"application/json","User-Agent":"NBAWorldResearch/1.0"})
            with urllib.request.urlopen(req,timeout=25) as response:raw=response.read()
            return json.loads(raw),{"url":url,"sha256":hashlib.sha256(raw).hexdigest(),"observed_at":now().isoformat()}
        except Exception as e:err=e;time.sleep(1)
    raise RuntimeError(f"source fetch {endpoint}: {err}")
def parse_schedule(body,observed):
    out=[]
    for ev in body.get("events",[]):
        comp=(ev.get("competitions") or [{}])[0]
        status=comp.get("status",{}).get("type",{})
        if status.get("state")!="pre" or status.get("completed"):continue
        tip=stamp(comp.get("date") or ev["date"])
        if tip<=observed or tip>observed+dt.timedelta(hours=30):continue
        sides={c.get("homeAway"):{"id":str(c["team"]["id"]),"name":c["team"].get("displayName")} for c in comp.get("competitors",[])}
        if set(sides)!={"home","away"}:continue
        if sides["home"]["id"]==sides["away"]["id"]:continue
        if not all(t["id"].isdigit() and 1<=int(t["id"])<=30 for t in sides.values()):continue
        out.append({"game_id":str(ev["id"]),"date":tip.isoformat(),**sides,"players":[]})
    return out
def parse_roster(body,tid):
    parent=body.get("team") or {}
    if str(parent.get("id") or tid)!=tid:raise ValueError("team identity mismatch")
    groups=body.get("athletes")
    if not isinstance(groups,list):raise ValueError("missing athletes")
    rows=[a for group in groups for a in (group.get("items") if isinstance(group.get("items"),list) else [group])]
    out={}
    for row in rows:
        a=row.get("athlete") or row
        pid=str(a.get("id") or "");name=a.get("fullName") or a.get("displayName")
        if not pid.isdigit() or not name or pid in out:raise ValueError("ambiguous roster athlete")
        out[pid]={"name":name,"reported_position":(a.get("position") or {}).get("abbreviation")}
    if not 8<=len(out)<=35:raise ValueError("roster size")
    return out
def roster(t):
    b,r=get("teams/"+t+"/roster");return t,parse_roster(b,t),r
def source_schedule():
    n=now();games={};receipts=[];errors={}
    # The source accepts single-day date queries. Query ET today and tomorrow;
    # a failed day remains explicit rather than treated as an empty slate.
    from zoneinfo import ZoneInfo
    start=n.astimezone(ZoneInfo("America/New_York")).date()
    for d in (start,start+dt.timedelta(days=1)):
        try:
            body,receipt=get("scoreboard?dates="+d.strftime("%Y%m%d")+"&limit=100")
            receipts.append(receipt)
            for g in parse_schedule(body,stamp(receipt["observed_at"])):games[g["game_id"]]=g
        except Exception as e:errors[d.isoformat()]=str(e)
    if not receipts:raise RuntimeError("no schedule source succeeded "+str(errors))
    return sorted(games.values(),key=lambda g:g["date"]),{"observations":receipts,"failures":errors}
def train_locked(games):
    # Predeclared box-only challenger from action ablation. No November
    # labels train model parameters, even as historical features advance.
    rows,_,_,_=datasets(games,{})
    tr=[r for r in rows if r["date"]<"2026-03-01"];ca=[r for r in rows if r["date"]>="2026-03-01"]
    if len(tr)<5000 or len(ca)<1000:raise ValueError("training coverage")
    return Arm(tr,ca,False),len(tr),len(ca)
def forecast(arm,games,schedule,rosters,receipts,schedule_receipt):
    out=[];skipped={};a=ActionHistory({})
    from nba_world.injury import capture,annotate
    try:injury=capture()
    except Exception as e:injury={"error":str(e),"observations":[],"quarantined":[]}
    for g in schedule:
        gid=g["game_id"];tip=stamp(g["date"]);ts=teams(g)
        if any(t not in rosters for t in ts):skipped[gid]="ROSTER_SOURCE_MISSING";continue
        observed=now()
        if observed>=tip-dt.timedelta(minutes=5):skipped[gid]="TOO_CLOSE_OR_STARTED";continue
        # Use exactly the same conservative cutoff as historical test.
        cutoff=observed.date()-dt.timedelta(days=1);h=RoleState()
        for old in games:
            if date(old)>=cutoff:break
            h.add(old)
        rr={t:list(rosters[t]) for t in ts}
        if set(rr[ts[0]])&set(rr[ts[1]]):skipped[gid]="DUPLICATE_CROSS_TEAM";continue
        x=inputs(g,h,a,rr);ids=list(x)
        rows=[{"f":x[p][0]} for p in ids]
        pa,mn,mu=arm.predict(rows);owner={p:t for t in ts for p in rr[t]}
        survival=arm.survivals(rows) if hasattr(arm,"survivals") else None
        forecast_rows=[]
        for i,pid in enumerate(ids):
            t=owner[pid]
            for j,m in enumerate(MARKETS):
                v=float(mu[i,j]);target=own_target(v)
                cond=survival[j][i].tolist() if survival is not None else [arm.p(j,v,k) for k in RANGES[j]]
                if any(cond[k]>cond[k-1]+1e-10 for k in range(1,len(cond))):raise ValueError("nonmonotone CDF")
                chance=float(cond[target-1]*pa[i]) if 0<target<=len(cond) else None
                forecast_rows.append({"player_id":pid,"name":rosters[t][pid]["name"],"team_id":t,"market":m,
                    "projection":v,"conditional_minutes":float(mn[i]),"p_active":float(pa[i]),
                    "own_target":target,"own_target_probability":chance,"conditional_reach_1_to_K":cond,
                    "candidate":bool(chance is not None and target>=MINIMUM_TARGETS[j] and pa[i]>=.75 and len(h.players.get(pid,[]))>=5)})
        # A fresh scoreboard observation must still say PRE, and actual
        # freeze time must precede tipoff with margin.
        from zoneinfo import ZoneInfo
        day=tip.astimezone(ZoneInfo("America/New_York")).date()
        try:
            body,receipt=get("scoreboard?dates="+day.strftime("%Y%m%d")+"&limit=100")
            latest=parse_schedule(body,stamp(receipt["observed_at"]))
        except Exception as e:
            skipped[gid]="FINAL_PRETIP_SOURCE_FAILED: "+str(e);continue
        match=next((z for z in latest if z["game_id"]==gid),None);frozen=now()
        if match is None or stamp(match["date"])!=tip or frozen>=tip-dt.timedelta(minutes=5):
            skipped[gid]="FINAL_PRETIP_RECHECK_FAILED";continue
        if any(stamp(receipts[t]["observed_at"])>=tip for t in ts):raise ValueError("late roster source")
        eligible=sorted([r for r in forecast_rows if r["candidate"]],key=lambda r:(-r["own_target_probability"],r["player_id"],r["market"]))
        for j,r in enumerate(eligible,1):r["rank"]=j
        out.append({"game_id":gid,"tipoff_utc":tip.isoformat(),"forecast_at_utc":frozen.isoformat(),
                    "home":g["home"],"away":g["away"],"history_cutoff_exclusive":cutoff.isoformat(),
                    "roster_receipts":{t:receipts[t] for t in ts},"schedule_recheck":receipt,
                    "starter_certification":"UNVERIFIED","rows":forecast_rows})
    for g in out:annotate(g,injury)
    return out,skipped
def main():
    p=argparse.ArgumentParser();p.add_argument("--games",action="append",required=True);p.add_argument("--out",required=True);args=p.parse_args()
    games=read(args.games);arm,tr,ca=train_locked(games)
    from nba_world.refresh import refresh
    games,history_audit=refresh(games,now().date()-dt.timedelta(days=1))
    schedule,sr=source_schedule();ts=sorted({t for g in schedule for t in teams(g)})
    rosters={};receipts={};errors={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(roster,t):t for t in ts}
        for f in concurrent.futures.as_completed(futures):
            try:
                t,r,s=f.result();rosters[t]=r;receipts[t]=s
            except Exception as e:errors[futures[f]]=str(e)
    forecasts,skipped=forecast(arm,games,schedule,rosters,receipts,sr)
    result={"schema":"NBA_WORLD_PROSPECTIVE_FIRST_V1","production_changed":False,"research_only":True,
       "created_at":now().isoformat(),"git_commit":os.getenv("GITHUB_SHA"),"run_id":os.getenv("GITHUB_RUN_ID"),
       "train_rows":tr,"calibration_rows":ca,"schedule_receipt":sr,"roster_errors":errors,"recent_history_refresh":history_audit,
       "source_hashes":{p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in args.games},
       "games":forecasts,"skipped":skipped,
       "limitations":["roster membership only; no verified current starters or injuries","history cutoff is conservative; recent completed-game refresh errors explicitly recorded",
          "own targets are not sportsbook lines or comparable to different incumbent targets","not an official pick or wager"]}
    path=Path(args.out);path.write_text(json.dumps(result,indent=2,allow_nan=False))
    print("PROSPECTIVE_RECEIPT",json.dumps({"games":len(forecasts),"rows":sum(len(g["rows"]) for g in forecasts),
          "candidate_rows":sum(r["candidate"] for g in forecasts for r in g["rows"]),"skipped":skipped,"roster_errors":errors,
          "injury_abstained_rows":sum(r["candidate"] and not r["injury_gated_candidate"] for g in forecasts for r in g["rows"]),
          "injury_errors":{g["game_id"]:g["injury_source_error"] for g in forecasts if g["injury_source_error"]},
          "history_refresh":{k:v for k,v in history_audit.items() if k!="receipts"},"schedule_errors":sr["failures"],
          "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),"game_ids":[g["game_id"] for g in forecasts]}),flush=True)
if __name__=="__main__":main()
