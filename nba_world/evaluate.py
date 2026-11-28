"""Research only: score frozen original thresholds, not newly lowered targets."""
import argparse, collections, datetime as dt, hashlib, json
from pathlib import Path
import numpy as np
import torch
from nba_world.data import read,make_training,archives,History,teams,date,stamp,MARKETS,KEYS,val
from nba_world.model import train,simulate
from nba_world.reconcile import load,reconcile
def mean(x):return float(np.mean(x)) if len(x) else None
def boot(rows,seed=71):
    d=collections.defaultdict(list)
    for g,x in rows:d[g].append(x)
    if not d:return [None,None]
    sums=np.array([sum(v) for v in d.values()]);sizes=np.array([len(v) for v in d.values()])
    rng=np.random.default_rng(seed);i=rng.integers(0,len(sums),(1000,len(sums)))
    return np.quantile(sums[i].sum(axis=1)/sizes[i].sum(axis=1),[.025,.975]).tolist()
def grade(model,games,ar,sims,independent_root):
    h=History();i=0;records=[];conflicts=[];excluded=collections.Counter();coverage=[];ledger=load();corrected=0
    for g,a,gr in ar:
        cutoff=stamp(a["forecast_at_utc"]).date()-dt.timedelta(days=1)
        while i<len(games) and date(games[i])<cutoff:h.add(games[i]);i+=1
        gid=str(g["game_id"]);ts=teams(g);rosters={t:[] for t in ts}
        for r in a["rows"]:
            t=str(r.get("team_id"));pid=str(r["player_id"])
            if t in rosters and r.get("reported_status")!="OUT" and pid not in rosters[t]:rosters[t].append(pid)
        if any(len(v)>23 or not v for v in rosters.values()):
            excluded["roster_capacity_or_missing_game"]+=1;continue
        # Target-game box outcomes are not included in this input.
        ex=h.make(g,rosters,with_outcomes=False)
        sim=simulate(model,ex,sims=sims,seed=int(gid)%2147483647)
        lookup={str(p["id"]):p for p in g["players"] if val(p,"min")>0}
        ids={pid:(t,j) for t,ps in enumerate(ex["ids"]) for j,pid in enumerate(ps) if pid and pid!="__RESERVE__"}
        coverage.append((len(set(lookup)&set(ids)),len(lookup)))
        independent={}
        fp=Path(independent_root)/(gid+".json")
        if fp.is_file():
            for ig in json.loads(fp.read_text()).get("games",[]):
                if str(ig["game_id"])==gid and stamp(ig["forecast_at_utc"])<stamp(a["tipoff_utc"]):
                    independent.update({str(p["player_id"]):p.get("predictions",{}) for p in ig.get("players",[])})
        original={(str(r["player_id"]),r["market"]):r for r in a["rows"]}
        for r in gr["rows"]:
            m=r["market"];pid=str(r["player_id"])
            if m not in MARKETS:continue
            if pid not in ids:excluded["outside_pretip_roster"]+=1;continue
            if (pid,m) not in original:raise ValueError("grade missing forecast")
            k=MARKETS.index(m);t,j=ids[pid];p=lookup.get(pid);played=p is not None
            actual=val(p,KEYS[k]) if played else 0
            ok,actual,changed=reconcile(ledger,gid,pid,m,actual,r.get("actual"),played,bool(r["played"]))
            corrected+=int(changed)
            if not ok:
                conflicts.append({"game":gid,"player":pid,"market":m,"box":actual if played else None,"grade":r.get("actual")});continue
            world=sim[t]["stats"][:,j,k];active=sim[t]["active"][:,j]
            pa=float(active.mean());sample=world[active]
            mu=mean(sample);mu=mu if mu is not None else 0.
            target=r.get("whole_projection");cp=r.get("reach_probability")
            row=dict(game=gid,player=pid,market=m,played=played,actual=actual,
                projection=mu,base=float(r["projection"]),simple=float(ex["simple"][t,j,k]),
                independent=independent.get(pid,{}).get(m),active=pa,base_active=float(r["p_active"]),
                minutes=mean(sim[t]["minutes"][:,j][active]),actual_minutes=val(p,"min") if played else 0,
                base_minutes=r.get("minutes_forecast"),rank=r.get("frontend_rank"))
            if target and cp is not None and int(target)>0:
                target=int(target);hit=int(played and actual>=target)
                row.update(target=target,hit=hit,p=float(np.mean(active&(world>=target))),
                   p_common=float(np.mean(sample>=target))*row["base_active"] if len(sample) else 0.,
                   base_p=float(cp)*row["base_active"])
            records.append(row)
    return records,conflicts,dict(excluded),coverage,corrected
def report(rows):
    out={}
    for m in MARKETS:
        rr=[r for r in rows if r["market"]==m];played=[r for r in rr if r["played"]]
        featured=[r for r in rr if "target" in r]
        if not played:continue
        err=lambda r,k:abs(r[k]-r["actual"])
        out[m]={"n":len(played),"all_played_mae":{k:mean([err(r,k) for r in played]) for k in ("base","simple","projection")},
             "mae_reduction_ci":boot([(r["game"],err(r,"base")-err(r,"projection")) for r in played]),
             "same_original_target_n":len(featured),"brier":{k:mean([(r[k]-r["hit"])**2 for r in featured]) for k in ("base_p","p_common","p")},
             "brier_reduction_ci":boot([(r["game"],(r["base_p"]-r["hit"])**2-(r["p"]-r["hit"])**2) for r in featured])}
        ir=[r for r in played if r["independent"] is not None]
        if ir:out[m]["independent_paired"]={"n":len(ir),"mae":{k:mean([err(r,k) for r in ir]) for k in ("base","independent","projection")}}
    by=collections.defaultdict(list)
    for r in rows:
        if r.get("rank") is not None and "target" in r:by[r["game"]].append(r)
    top={}
    for n in (4,10):
        top[n]={}
        for key in ("rank","p_common","p"):
            selected=[r for rr in by.values() for r in sorted(rr,key=lambda r:r[key] if key=="rank" else -r[key])[:n]]
            top[n][key]={"n":len(selected),"hits":sum(r["hit"] for r in selected),"rate":mean([r["hit"] for r in selected])}
    pts=[r for r in rows if r["market"]=="points"]
    mp=[r for r in pts if r["played"] and r["minutes"] is not None and r["base_minutes"] is not None]
    return out,top,{"minutes_n":len(mp),"minutes_mae":{k:mean([abs(r[k]-r["actual_minutes"]) for r in mp]) for k in ("minutes","base_minutes")},
         "availability_n":len(pts),"availability_brier":{k:mean([(r[k]-int(r["played"]))**2 for r in pts]) for k in ("active","base_active")}}
def main():
    p=argparse.ArgumentParser();p.add_argument("--games",action="append",required=True)
    p.add_argument("--archive",required=True);p.add_argument("--grades",required=True);p.add_argument("--out",required=True)
    p.add_argument("--independent",default="docs/nba_independent_live/first")
    p.add_argument("--train-end",default="2026-02-01");p.add_argument("--valid-end",default="2026-04-15")
    p.add_argument("--test-from",default="2026-11-01");p.add_argument("--epochs",type=int,default=16);p.add_argument("--sims",type=int,default=3000)
    args=p.parse_args()
    if not args.train_end<args.valid_end<=args.test_from:raise ValueError("split overlap")
    games=read(args.games);tr,va=make_training(games,args.train_end,args.valid_end)
    if len(tr)<200 or len(va)<100:raise ValueError("insufficient games")
    print("WORLD_TRAIN_GAMES",len(tr),"VALID_GAMES",len(va),flush=True)
    model,trace=train(tr,va,args.epochs)
    ar,skipped=archives(games,args.archive,args.grades,args.test_from)
    rows,conflicts,excluded,coverage,corrected=grade(model,games,ar,args.sims,args.independent)
    if not rows:raise ValueError("no scored rows")
    metrics,top,role=report(rows)
    result={"schema":"NBA_WORLD_CLEANROOM_V1","production_changed":False,"promotion_allowed":False,
       "train_games":len(tr),"validation_games":len(va),"archive_games":len(ar),"scored_rows":len(rows),
       "source_hashes":{x:hashlib.sha256(Path(x).read_bytes()).hexdigest() for x in args.games},
       "validation_trace":trace,"split":[args.train_end,args.valid_end,args.test_from],
       "metrics":metrics,"top_same_original_target":top,"minutes_and_availability":role,
       "actual_player_roster_coverage":sum(x for x,y in coverage)/max(1,sum(y for x,y in coverage)),
       "skipped":skipped,"excluded":excluded,"source_conflicts":conflicts,"verified_outcome_corrections_applied":corrected,
       "limitations":["historical rosters approximated from earlier appearances; test roster identities supplied by pretip archives",
          "November outcomes were previously researched; not fresh prospective holdout",
          "current injury/starter certification and player tracking not yet present",
          "simulation variance priors not calibrated; terminal FT rebound opportunity approximated",
          "only fixed incumbent thresholds used for probability and top-card comparison",
          "historical source corrections require reconciliation before promotion"]}
    Path(args.out).write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True)
    torch.save(model.state_dict(),str(Path(args.out).with_suffix(".pt")))
if __name__=="__main__":main()
