"""Independent distribution learner, with chronological role-state features.

No legacy predictions are used as inputs. Learned threshold survival functions
are monotone by construction in the threshold dimension. A separate numerical
head is tested, and both are scored on frozen original targets without changing
them. Historical roster identities are reconstructed strictly from prior games.
"""
import argparse,collections,datetime as dt,hashlib,json,math
from pathlib import Path
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier,HistGradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from nba_world.data import read,archives,teams,date,stamp,played,val,MARKETS,KEYS,History
from nba_world.reconcile import load,reconcile
from nba_world.evaluate import boot,mean
RANGES=(range(1,51),range(1,23),range(1,19),range(1,13))
SCALES=np.array([15.,6.,5.,3.])
FIELDS=("min","pts","reb","ast","tpm","fga","tpa","fta","oreb","dreb","tov","pf","fgm")
def logit(p):p=np.clip(p,.0001,.9999);return np.log(p/(1-p))
def own_target(x):return int(math.floor(x)+(x-math.floor(x)>=.6-1e-9))
def vector(p):return np.array([val(p,k) for k in FIELDS],float)
def safeavg(a,n):return np.mean(a,axis=0) if len(a) else np.zeros(n)
def avg(a):return float(np.mean(a)) if len(a) else 0.
class RoleState(History):
    def __init__(self):
        super().__init__();self.pre={}
    def add(self,g):
        # Historical opponent tendencies are recorded BEFORE the past game.
        for t in teams(g):
            opp=next(x for x in teams(g) if x!=t)
            self.pre[(str(g["game_id"]),t)]=self.team_profile(opp)
        super().add(g)
    def team_profile(self,t):
        h=self.teams[t][-15:]
        return safeavg([r[2] for r in h],13)
    def role_context(self,t,roster):
        h=self.teams[t][-15:];known=set(roster);s=collections.Counter()
        for _,ps,_ in h:
            for pid,p in ps.items():s[pid]+=val(p,"min")
        pool=sorted(s,key=lambda p:(-s[p],p))[:12]
        return {p:(s[p]/max(1,len(h)),float(p in known)) for p in pool}
    def features(self,pid,t,opp,d,roster,ctx):
        h=self.players.get(pid,[]);same=[(g,p) for g,p in h if str(p["team"])==t]
        current=same if len(same)>=3 else h
        th=self.teams[t];out=[len(h),len(same),len(roster),float(bool(h) and str(h[-1][1]["team"])==t)]
        if h:out += [min(180,max(0,(d-date(h[-1][0])).days))]
        else:out += [180.]
        for n in (3,8,20,60):
            hs=current[-n:];v=np.array([vector(p) for _,p in hs]) if hs else np.empty((0,len(FIELDS)))
            mu=safeavg(v,len(FIELDS));mins=v[:,0].sum() if len(v) else 0.
            out+=mu.tolist()
            out+=(v[:,1:].sum(axis=0)/max(mins,1.)*36 if len(v) else np.zeros(len(FIELDS)-1)).tolist()
            out+=(np.std(v[:,:5],axis=0) if len(v) else np.zeros(5)).tolist()
            out += [avg([bool(p.get("start")) for _,p in hs])]
        for n in (3,10,25):
            hist=th[-n:];m=[val(ps[pid],"min") if pid in ps else 0. for _,ps,_ in hist]
            out += [avg(m),avg([x>0 for x in m]),avg([x>=25 for x in m])]
        out += self.team_profile(t).tolist()+self.team_profile(opp).tolist()
        # Quantify how much historical usage/playing time is unavailable
        # and how much competition remains at each stat opportunity.
        others=[(q,w,a) for q,(w,a) in ctx.items() if q!=pid]
        for k in ("min","fga","tpa","ast","reb"):
            present=0.;absent=0.
            for q,w,a in others:
                pp=[p for _,p in self.players.get(q,[])[-12:]]
                u=avg([val(p,k) for p in pp])
                present+=u*a;absent+=u*(1-a)
            out += [present,absent]
        # Same-player outcomes in historically comparable teammate contexts.
        hist=current[-45:];weights=[];values=[]
        for g,p in hist:
            actual=played(g,str(p["team"]))
            dist=sum(w*abs(a-float(q in actual)) for q,w,a in others)/max(1.,sum(w for _,w,_ in others))
            age=max(0,(d-date(g)).days)
            w=math.exp(-age/100-3*dist)
            weights.append(w);values.append(vector(p))
        if weights:
            w=np.array(weights);w/=w.sum()
            out+=np.average(values,axis=0,weights=w).tolist()+[float(1/(w@w))]
        else:out += [0.]*(len(FIELDS)+1)
        # Genuine prior schedule and opponent context.
        out += [min(30,(d-date(th[-1][0])).days) if th else 30.]
        return np.asarray(out,np.float32)
def rows_for(g,h,rosters):
    d=date(g);ts=teams(g);rows={}
    for j,t in enumerate(ts):
        ctx=h.role_context(t,rosters[t]);actual=played(g,t)
        for pid in rosters[t]:
            f=h.features(pid,t,ts[1-j],d,rosters[t],ctx)
            f=np.append(f,float(j==1)).astype(np.float32)
            p=actual.get(pid);y=np.array([val(p,k) for k in KEYS]) if p else np.zeros(4)
            rows[pid]=(f,p is not None,y,val(p,"min") if p else 0.)
    return rows
def build(games,begin,end):
    h=RoleState();i=0;result=[]
    for g in games:
        d=date(g)
        if d.isoformat()>=end:break
        cutoff=d-dt.timedelta(days=1)
        while i<len(games) and date(games[i])<cutoff:h.add(games[i]);i+=1
        if d.isoformat()<begin or min(len(h.teams[t]) for t in teams(g))<5:continue
        for pid,(f,a,y,mn) in rows_for(g,h,{t:h.roster(t) for t in teams(g)}).items():
            result.append((f,a,y,mn,d.toordinal()))
    return result
def classifier(**kw):
    return HistGradientBoostingClassifier(max_iter=150,max_leaf_nodes=23,min_samples_leaf=50,
        learning_rate=.07,l2_regularization=5,random_state=733,**kw)
def regressor():
    return HistGradientBoostingRegressor(max_iter=180,max_leaf_nodes=23,min_samples_leaf=50,
        learning_rate=.07,l2_regularization=5,random_state=733)
def expand(x,y,j):
    # All thresholds over the full relevant support. Every outcome at k is
    # graded, including high thresholds; no target is chosen after the fact.
    ks=np.array(list(RANGES[j]),np.float32)
    xx=np.repeat(x,len(ks),axis=0)
    xx=np.column_stack((xx,np.tile(ks,len(x))/SCALES[j]))
    yy=(y[:,None]>=ks[None,:]).ravel()
    return xx,yy
def distribution(model,x,j):
    ks=np.array(list(RANGES[j]),np.float32)
    xx=np.column_stack((np.repeat(x,len(ks),axis=0),np.tile(ks,len(x))/SCALES[j]))
    p=model.predict_proba(xx)[:,1].reshape(len(x),len(ks))
    # Check monotonicity independent of numerical library behavior.
    if np.any(np.diff(p,axis=1)>1e-6):raise ValueError("survival ordering violated")
    return p
def fit(train,cal):
    x=np.stack([r[0] for r in train]);a=np.array([r[1] for r in train]);y=np.stack([r[2] for r in train])
    dates=np.array([r[4] for r in train]);weights=np.exp(-(dates.max()-dates)/730)
    cx=np.stack([r[0] for r in cal]);ca=np.array([r[1] for r in cal]);cy=np.stack([r[2] for r in cal])
    av=classifier().fit(x,a,sample_weight=weights)
    ac=LogisticRegression(C=.5,max_iter=300).fit(logit(av.predict_proba(cx)[:,1])[:,None],ca)
    minutes=regressor().fit(x[a],np.array([r[3] for r in train])[a],sample_weight=weights[a])
    # Fit separate market-specific full distributions and conditional means.
    models=[];reg=[];calibrators=[];diagnostics=[]
    for j,m in enumerate(MARKETS):
        print("DISTRIBUTION_FIT",m,"played",int(a.sum()),flush=True)
        # Use every second threshold in fitting for bounded compute while
        # the monotone threshold model can interpolate all integer targets.
        ks=np.array(list(RANGES[j]),np.float32)
        step=2 if j==0 else 1;ks=ks[::step]
        xx=np.column_stack((np.repeat(x[a],len(ks),axis=0),np.tile(ks,int(a.sum()))/SCALES[j]))
        yy=(y[a,j,None]>=ks[None,:]).ravel()
        model=classifier(monotonic_cst=[0]*x.shape[1]+[-1]).fit(xx,yy,sample_weight=np.repeat(weights[a],len(ks)))
        direct=regressor().fit(x[a],y[a,j],sample_weight=weights[a])
        p=distribution(model,cx[ca],j)
        obs=(cy[ca,j,None]>=np.array(list(RANGES[j]))[None,:])
        lc=LogisticRegression(C=.5,max_iter=300).fit(logit(p.ravel())[:,None],obs.ravel())
        if lc.coef_[0,0]<=0:raise ValueError("nonmonotone probability calibration")
        pc=lc.predict_proba(logit(p.ravel())[:,None])[:,1].reshape(p.shape)
        diagnostics.append({"market":m,"cal_grid_brier_raw":float(np.mean((p-obs)**2)),
                            "cal_grid_brier_calibrated":float(np.mean((pc-obs)**2)),
                            "cal_direct_mae":float(np.mean(abs(direct.predict(cx[ca])-cy[ca,j]))),
                            "cal_survival_mean_mae":float(np.mean(abs(pc.sum(axis=1)-cy[ca,j])))})
        models.append(model);reg.append(direct);calibrators.append(lc)
    return av,ac,minutes,models,reg,calibrators,diagnostics
def score(games,ar,fitted):
    av,ac,mins,models,reg,cal,diag=fitted
    h=RoleState();i=0;out=[];ledger=load();conf=[];corrected=0;excluded=collections.Counter()
    for g,orig,gr in ar:
        gid=str(g["game_id"]);cutoff=stamp(orig["forecast_at_utc"]).date()-dt.timedelta(days=1)
        while i<len(games) and date(games[i])<cutoff:h.add(games[i]);i+=1
        rosters={t:[] for t in teams(g)}
        for r in orig["rows"]:
            t=str(r.get("team_id"));pid=str(r["player_id"])
            if t in rosters and r.get("reported_status")!="OUT" and pid not in rosters[t]:rosters[t].append(pid)
        rows=rows_for(g,h,rosters);ids=list(rows)
        if not ids:continue
        x=np.stack([rows[p][0] for p in ids])
        pa=ac.predict_proba(logit(av.predict_proba(x)[:,1])[:,None])[:,1]
        pm=mins.predict(x)
        means=np.stack([r.predict(x) for r in reg],axis=1).clip(min=0)
        probs=[]
        for j in range(4):
            p=distribution(models[j],x,j)
            probs.append(cal[j].predict_proba(logit(p.ravel())[:,None])[:,1].reshape(p.shape))
        idx={p:n for n,p in enumerate(ids)}
        for r in gr["rows"]:
            m=r["market"];pid=str(r["player_id"])
            if m not in MARKETS:continue
            if pid not in idx:excluded["outside_roster"]+=1;continue
            n=idx[pid];j=MARKETS.index(m);_,active,y,mn=rows[pid];actual=float(y[j])
            ok,actual,changed=reconcile(ledger,gid,pid,m,actual,r.get("actual"),active,bool(r["played"]))
            corrected+=int(changed)
            if not ok:conf.append([gid,pid,m,actual,r.get("actual")]);continue
            dist=probs[j][n];mu=float(means[n,j]);sm=float(dist.sum())
            # Direct forecast and its own target are both immutable in this
            # report. Do not compare hit rates at different targets as wins.
            own=own_target(mu)
            ownq=float(dist[own-1]*pa[n]) if 0<own<=len(dist) else None
            rec=dict(game=gid,player=pid,market=m,played=active,y=actual,
               base=float(r["projection"]),direct=mu,survival_mean=sm,
               base_active=float(r["p_active"]),active=float(pa[n]),minutes=float(pm[n]),actual_minutes=mn,
               base_minutes=r.get("minutes_forecast"),rank=r.get("frontend_rank"),
               own_target=own,own_p=ownq,own_hit=int(active and actual>=own) if ownq is not None else None)
            k=r.get("whole_projection");cp=r.get("reach_probability")
            if k and cp is not None and 0<int(k)<=len(dist):
                q=float(dist[int(k)-1]);rec.update(target=int(k),hit=int(active and actual>=int(k)),
                     base_p=float(cp)*rec["base_active"],p=q*float(pa[n]),p_common=q*rec["base_active"])
            elif k and cp is not None:excluded["target_outside_support"]+=1
            out.append(rec)
    return out,conf,corrected,dict(excluded)
def summarize(rows):
    out={}
    for m in MARKETS:
        rr=[r for r in rows if r["market"]==m];pl=[r for r in rr if r["played"]];ft=[r for r in rr if "hit" in r]
        out[m]={"played_n":len(pl),"fixed_target_n":len(ft),
          "mae":{k:mean([abs(r[k]-r["y"]) for r in pl]) for k in ("base","direct","survival_mean")},
          "direct_gain_ci":boot([(r["game"],abs(r["base"]-r["y"])-abs(r["direct"]-r["y"])) for r in pl]),
          "brier":{k:mean([(r[k]-r["hit"])**2 for r in ft]) for k in ("base_p","p","p_common")},
          "brier_gain_ci":boot([(r["game"],(r["base_p"]-r["hit"])**2-(r["p"]-r["hit"])**2) for r in ft]),
          "own_targets_descriptive_only":{"n":sum(r["own_p"] is not None for r in rr),
             "average_target":mean([r["own_target"] for r in rr if r["own_p"] is not None]),
             "hit_rate":mean([r["own_hit"] for r in rr if r["own_p"] is not None])}}
    by=collections.defaultdict(list)
    for r in rows:
        if r.get("rank") is not None and "hit" in r:by[r["game"]].append(r)
    top={}
    for n in (4,10):
        top[n]={}
        for k in ("rank","p","p_common"):
            sel=[r for rr in by.values() for r in sorted(rr,key=lambda r:r[k] if k=="rank" else -r[k])[:n]]
            top[n][k]={"n":len(sel),"hits":sum(r["hit"] for r in sel),"rate":mean([r["hit"] for r in sel])}
    pts=[r for r in rows if r["market"]=="points"];mp=[r for r in pts if r["played"] and r["base_minutes"] is not None]
    return {"markets":out,"top":top,"role":{"minutes_mae":{k:mean([abs(r[k]-r["actual_minutes"]) for r in mp]) for k in ("base_minutes","minutes")},
       "availability_brier":{k:mean([(r[k]-int(r["played"]))**2 for r in pts]) for k in ("base_active","active")}}}
def main():
    p=argparse.ArgumentParser();p.add_argument("--games",action="append",required=True)
    p.add_argument("--archive",required=True);p.add_argument("--grades",required=True);p.add_argument("--out",required=True);args=p.parse_args()
    games=read(args.games)
    tr=build(games,"2022-11-01","2026-02-01");ca=build(games,"2026-02-01","2026-04-15")
    print("DISTRIBUTION_TRAIN",len(tr),"CAL",len(ca),flush=True)
    if len(tr)<50000 or len(ca)<1000:raise ValueError("expanded history required")
    fitted=fit(tr,ca);ar,skip=archives(games,args.archive,args.grades,"2026-11-01")
    rows,conf,corr,excluded=score(games,ar,fitted)
    report={"schema":"NBA_WORLD_DISTRIBUTION_V1","production_changed":False,"promotion_allowed":False,
       "train_rows":len(tr),"cal_rows":len(ca),"games":len(ar),"rows":len(rows),
       "metrics":summarize(rows),"calibration_diagnostics":fitted[-1],"source_conflicts":conf,
       "verified_corrections":corr,"excluded":excluded,"skipped":skip,
       "source_hashes":{x:hashlib.sha256(Path(x).read_bytes()).hexdigest() for x in args.games},
       "limitations":["retrospective November cohort already inspected","prior-game rosters approximate",
       "current tracking and verified starters absent","finite threshold support and survival mean truncation",
       "own-target results descriptive, not a same-event comparison","no promotion without prospective validation"]}
    Path(args.out).write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
if __name__=="__main__":main()
