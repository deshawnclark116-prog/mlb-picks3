"""Control experiment: compare old ranking against old own probabilities.

All fixed targets and outcomes are read from frozen pretip archives and
verified grades. New independent box-only probabilities are recomputed with
the already frozen architecture. Compare exactly the same available events.
"""
import argparse,collections,json,math
from pathlib import Path
import numpy as np
from nba_world.data import read,archives,MARKETS
from nba_world.action_lab import datasets,Arm
from nba_world.evaluate import mean,boot
def rank_policies(rows):
    by=collections.defaultdict(list)
    for r in rows:
        if r.get("rank") is not None and r.get("target") and r.get("cp") is not None:by[r["game"]].append(r)
    result={}
    for n in (4,10):
        policies={
            "old_frontend_rank":lambda r:r["rank"],
            "old_conditional_probability":lambda r:-r["cp"],
            "old_unconditional_probability":lambda r:-r["base_p"],
            "independent_common_availability":lambda r:-r["common_p"],
            "independent_probability":lambda r:-r["new_p"],
        }
        selected={}
        for name,key in policies.items():
            selected[name]={gid:sorted(rr,key=lambda r:(key(r),r["pid"],r["market"]))[:n] for gid,rr in by.items()}
        base=selected["old_unconditional_probability"]
        report={}
        for name,per in selected.items():
            allrows=[r for rr in per.values() for r in rr]
            delta=[]
            for gid,rr in per.items():
                old=base[gid]
                if len(old)!=len(rr):raise ValueError("selection count changed")
                delta.extend((gid,x["hit"]-y["hit"]) for x,y in zip(rr,old))
            report[name]={"n":len(allrows),"hits":sum(r["hit"] for r in allrows),"rate":mean([r["hit"] for r in allrows]),
                "mean_probability":mean([r["new_p"] if name.startswith("independent") else r["base_p"] for r in allrows]),
                "market_counts":dict(collections.Counter(r["market"] for r in allrows)),
                "gain_vs_old_probability_rank_ci":boot(delta)}
        result[n]=report
    return result
def main():
    p=argparse.ArgumentParser();p.add_argument("--games",action="append",required=True);p.add_argument("--archive",required=True);p.add_argument("--grades",required=True);p.add_argument("--out",required=True);args=p.parse_args()
    games=read(args.games);rows,_,_,_=datasets(games,{})
    tr=[r for r in rows if r["date"]<"2026-03-01"];ca=[r for r in rows if r["date"]>="2026-03-01"]
    arm=Arm(tr,ca,False)
    ar,skipped=archives(games,args.archive,args.grades,"2026-11-01")
    test,_,conf,corr=datasets(games,{},ar)
    if not test:raise ValueError("no comparison rows")
    pa,mn,y=arm.predict(test);ft=[]
    for i,r in enumerate(test):
        if not r["target"] or r["cp"] is None or int(r["target"])<=0:continue
        j=MARKETS.index(r["market"]);mu=float(y[i,j]);k=int(r["target"]);q=arm.p(j,mu,k)
        r["hit"]=int(r["active"] and r["y"]>=k)
        r["base_p"]=float(r["cp"])*r["base_active"]
        r["common_p"]=q*r["base_active"];r["new_p"]=q*float(pa[i]);ft.append(r)
    pbs={}
    for m in MARKETS:
        rr=[r for r in ft if r["market"]==m]
        pbs[m]={"n":len(rr),"brier":{k:mean([(r[k]-r["hit"])**2 for r in rr]) for k in ("base_p","common_p","new_p")},
          "new_probability_gain_ci":boot([(r["game"],(r["base_p"]-r["hit"])**2-(r["new_p"]-r["hit"])**2) for r in rr])}
    out={"schema":"NBA_WORLD_RANK_CONTROL_V1","games":len(ar),"rows":len(test),"fixed_target_rows":len(ft),
         "corrections":corr,"conflicts":conf,"skipped":skipped,"rank_control":rank_policies(ft),"markets":pbs,
         "limits":["retrospective November only","old V5 archive is not certified current market-specific production stack",
                   "rank policies use identical target events, not own-target accuracy","no promotion"]}
    Path(args.out).write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2),flush=True)
if __name__=="__main__":main()
