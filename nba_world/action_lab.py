"""Paired independent model with/without verified basketball action features."""
import argparse,collections,datetime as dt,json
from pathlib import Path
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor,HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from nba_world.data import read,archives,teams,date,stamp,MARKETS,KEYS
from nba_world.distribution import RoleState,rows_for,logit
from nba_world.actions import load_events,ActionHistory
from nba_world.reconcile import load,reconcile
from nba_world.evaluate import boot,mean

def inputs(g,h,a,rosters):
    rows=rows_for(g,h,rosters);ts=teams(g);owner={p:t for t,ps in rosters.items() for p in ps}
    return {pid:(np.r_[f,a.features(pid,owner[pid],ts[1-ts.index(owner[pid])])],len(f),active,y,mn) for pid,(f,active,y,mn) in rows.items()}
def datasets(games,events,ar=None):
    h=RoleState();a=ActionHistory(events);i=0;out=[];conf=[];corrected=0;ledger=load()
    if ar is None:
        iterable=[(g,None,None) for g in games if "2025-11-15"<=date(g).isoformat()<"2026-04-15"]
    else:iterable=ar
    for g,orig,gr in iterable:
        d=date(g);gid=str(g["game_id"])
        cutoff=(stamp(orig["forecast_at_utc"]).date() if orig else d)-dt.timedelta(days=1)
        while i<len(games) and date(games[i])<cutoff:
            h.add(games[i]);a.add(games[i]);i+=1
        roster={t:[] for t in teams(g)}
        if orig:
            for r in orig["rows"]:
                t=str(r.get("team_id"));pid=str(r["player_id"])
                if t in roster and r.get("reported_status")!="OUT" and pid not in roster[t]:roster[t].append(pid)
        else:roster={t:h.roster(t) for t in teams(g)}
        r=inputs(g,h,a,roster)
        if not gr:
            for pid,(f,k,active,y,mn) in r.items():
                out.append({"f":f,"k":k,"active":active,"y":y,"minutes":mn,"date":d.isoformat()})
            continue
        for row in gr["rows"]:
            pid=str(row["player_id"]);m=row["market"]
            if m not in MARKETS or pid not in r:continue
            f,k,active,y,mn=r[pid];j=MARKETS.index(m)
            ok,actual,changed=reconcile(ledger,gid,pid,m,float(y[j]),row.get("actual"),active,bool(row["played"]))
            corrected+=int(changed)
            if not ok:conf.append([gid,pid,m,float(y[j]),row.get("actual")]);continue
            out.append({"f":f,"k":k,"active":active,"y":actual,"minutes":mn,"game":gid,"pid":pid,"market":m,
                       "base":float(row["projection"]),"base_active":float(row["p_active"]),
                       "base_minutes":row.get("minutes_forecast"),"rank":row.get("frontend_rank"),
                       "target":row.get("whole_projection"),"cp":row.get("reach_probability")})
    return out,dict(a.audit),conf,corrected
def estimator(cl=False):
    cls=HistGradientBoostingClassifier if cl else HistGradientBoostingRegressor
    return cls(max_iter=150,max_leaf_nodes=15,min_samples_leaf=35,l2_regularization=5,learning_rate=.07,random_state=903)
class Arm:
    def __init__(self,rows,cal,use_actions):
        self.k=None if use_actions else rows[0]["k"]
        x=self.x(rows);a=np.asarray([r["active"] for r in rows]);y=np.stack([r["y"] for r in rows])
        cx=self.x(cal);ca=np.asarray([r["active"] for r in cal]);cy=np.stack([r["y"] for r in cal])
        self.av=estimator(True).fit(x,a);self.ac=LogisticRegression(C=.5,max_iter=300).fit(logit(self.av.predict_proba(cx)[:,1])[:,None],ca)
        self.minutes=estimator().fit(x[a],np.array([r["minutes"] for r in rows])[a])
        self.stat=[estimator().fit(x[a],y[a,j]) for j in range(4)]
        self.res=[]
        for j,m in enumerate(self.stat):
            mu=m.predict(cx[ca]).clip(min=0)
            # Empirical residual CDF, fit only on separate March-April.
            self.res.append(np.sort((cy[ca,j]-mu)/np.sqrt(1+mu)))
    def x(self,rows):return np.stack([r["f"][:self.k] for r in rows])
    def predict(self,rows):
        x=self.x(rows);pa=self.ac.predict_proba(logit(self.av.predict_proba(x)[:,1])[:,None])[:,1]
        mn=self.minutes.predict(x);y=np.stack([m.predict(x) for m in self.stat],axis=1).clip(min=0)
        return pa,mn,y
    def p(self,j,mu,k):
        r=self.res[j];z=(k-.5-mu)/math.sqrt(1+mu)
        return float((len(r)-np.searchsorted(r,z,side="left")+1)/(len(r)+2))
import math
def evaluate(rows,arms):
    for name,arm in arms.items():
        pa,mn,y=arm.predict(rows)
        for i,r in enumerate(rows):
            j=MARKETS.index(r["market"]);mu=float(y[i,j]);r[name]=mu
            r[name+"_minutes"]=float(mn[i]);r[name+"_active"]=float(pa[i])
            if r["target"] and r["cp"] is not None:
                k=int(r["target"]);r["hit"]=int(r["active"] and r["y"]>=k)
                r["base_p"]=float(r["cp"])*r["base_active"]
                r[name+"_p"]=arm.p(j,mu,k)*float(pa[i])
    report={}
    for m in MARKETS:
        rr=[r for r in rows if r["market"]==m];pl=[r for r in rr if r["active"]];ft=[r for r in rr if "hit" in r]
        report[m]={"played":len(pl),"featured":len(ft),
           "mae":{k:mean([abs(r[k]-r["y"]) for r in pl]) for k in ("base","box","actions")},
           "brier":{k:mean([(r[k]-r["hit"])**2 for r in ft]) for k in ("base_p","box_p","actions_p")},
           "action_mae_gain_ci":boot([(r["game"],abs(r["box"]-r["y"])-abs(r["actions"]-r["y"])) for r in pl]),
           "action_brier_gain_ci":boot([(r["game"],(r["box_p"]-r["hit"])**2-(r["actions_p"]-r["hit"])**2) for r in ft])}
    by=collections.defaultdict(list)
    for r in rows:
        if r["rank"] is not None and "hit" in r:by[r["game"]].append(r)
    top={}
    for n in (4,10):
        top[n]={}
        for k in ("rank","box_p","actions_p"):
            sel=[r for rr in by.values() for r in sorted(rr,key=lambda r:r[k] if k=="rank" else -r[k])[:n]]
            top[n][k]={"n":len(sel),"hits":sum(r["hit"] for r in sel),"rate":mean([r["hit"] for r in sel])}
    pts=[r for r in rows if r["market"]=="points"];mp=[r for r in pts if r["active"] and r["base_minutes"] is not None]
    return {"markets":report,"top":top,"minutes_mae":{k:mean([abs(r[k]-r["minutes"]) for r in mp]) for k in ("base_minutes","box_minutes","actions_minutes")},
            "availability_brier":{k:mean([(r[k]-int(r["active"]))**2 for r in pts]) for k in ("base_active","box_active","actions_active")}}
def main():
    p=argparse.ArgumentParser();p.add_argument("--games",action="append",required=True);p.add_argument("--pbp",action="append",required=True)
    p.add_argument("--archive",required=True);p.add_argument("--grades",required=True);p.add_argument("--out",required=True);args=p.parse_args()
    games=read(args.games);events=load_events(args.pbp)
    rows,audit,_,_=datasets(games,events);tr=[r for r in rows if r["date"]<"2026-03-01"];ca=[r for r in rows if r["date"]>="2026-03-01"]
    if len(tr)<5000 or len(ca)<1000:raise ValueError("insufficient examples")
    print("ACTION_TRAIN",len(tr),"CAL",len(ca),"SOURCE",json.dumps(audit),flush=True)
    arms={name:Arm(tr,ca,flag) for name,flag in (("box",False),("actions",True))}
    ar,skips=archives(games,args.archive,args.grades,"2026-11-01")
    test,ta,conf,corr=datasets(games,events,ar)
    result={"schema":"NBA_WORLD_ACTION_ABLATION_V1","production_changed":False,"promotion_allowed":False,
      "train_rows":len(tr),"cal_rows":len(ca),"test_games":len(ar),"test_rows":len(test),
      "historical_action_source_audit":audit,"evaluation_history_source_audit":ta,"source_conflicts":conf,"verified_corrections":corr,
      "metrics":evaluate(test,arms),"skips":skips,
      "limitations":["historical compact PBP is not optical tracking","stints fail closed on incomplete events","same November exploratory cohort","conditional residual distribution is approximate","not a possession simulator or a claim of defensive matchup causality"]}
    Path(args.out).write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True)
if __name__=="__main__":main()
