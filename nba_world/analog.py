"""Clean-room situation retrieval: conditional empirical distributions from prior games.

No old forecasts are inputs except frozen candidate identities/status at test time.
No neural world assumptions. Historical game situations are retrieved with
predeclared distance metrics; model selection and calibration precede November.
"""
import argparse,collections,datetime as dt,hashlib,json,math
from pathlib import Path
import numpy as np
from sklearn.linear_model import LogisticRegression
from nba_world.data import read,archives,teams,date,stamp,played,val,MARKETS,KEYS,History
from nba_world.evaluate import boot,mean
from nba_world.reconcile import load,reconcile

ARMS=("recent10","decay","role","role_opponent")
GRID=((5,10,15,20,25,30,35,40),(2,4,6,8,10,12),(1,2,4,6,8,10),(1,2,3,4,5,6))
SCALE=np.array([6.,2.5,2.,1.3])
def stats(p):return np.array([val(p,k) for k in KEYS])
def sigmoid(x):return 1/(1+np.exp(-np.clip(x,-25,25)))
def logit(p):
    p=np.clip(p,.005,.995);return np.log(p/(1-p))
def weighted(v,w):return np.sum(v*w[:,None],axis=0)
def prob(v,w,k):return float((w[v>=k].sum()+.035)/(w.sum()+.07))
class Retrieval(History):
    def __init__(self):
        super().__init__();self.snapshots={};self.context={}
    def add(self,g):
        # Save each past game's *pre-existing* opponent tendencies; the
        # actual participants are an observed historical situation, not a
        # target-game feature.
        ts=teams(g)
        for t in ts:
            opp=next(x for x in ts if x!=t)
            self.context[(str(g["game_id"]),t)]=self.opp(opp)
        super().add(g)
    def opp(self,t):
        a=[r[2] for r in self.teams[t][-15:]]
        return np.mean(a,axis=0)[6:12] if a else np.ones(6)
    def availability_features(self,pid,t,d):
        hist=self.teams[t][-20:];h=self.players.get(pid,[])
        a=[]
        for n in (3,6,12,20):
            recent=hist[-n:]
            mins=[val(ps[pid],"min") if pid in ps else 0 for _,ps,_ in recent]
            a.extend([sum(x>0 for x in mins)/max(1,len(mins)),sum(mins)/max(1,len(mins))/48])
        last=next((i for i,(_,ps,_) in enumerate(reversed(hist)) if pid in ps),20)
        days=min(120,max(0,(d-date(h[-1][0])).days)) if h else 120
        a.extend([last/20,days/30,min(30,len(h))/30,float(bool(h) and str(h[-1][1]["team"])==t)])
        return np.asarray(a,float)
    def context_for(self,t,roster,d,available=None):
        known=set(roster);past=self.teams[t][-12:];c={}
        for _,ps,_ in past:
            for pid,p in ps.items():
                c[pid]=c.get(pid,0)+val(p,"min")
        denom=max(1,len(past))
        # Long-minute teammates dominate role comparisons. The current
        # roster gives identity, not certainty of active status.
        top=sorted(c,key=lambda p:(-c[p],p))[:10]
        out={}
        for pid in top:
            f=self.availability_features(pid,t,d)
            play=(.10+.90*(.65*f[0]+.35*f[4])) if pid in known else 0.
            if available and pid in available:play=available[pid]
            out[pid]=(c[pid]/denom/30,play)
        return out
    def query(self,pid,t,opp,d,home,roster,team_context):
        h=self.players.get(pid,[])[-55:]
        f=self.availability_features(pid,t,d)
        if not h:return None,f
        arr=[];mn=[];decay=[];role=[];opponent=[];op=self.opp(opp)
        for idx,(g,p) in enumerate(h):
            prior_team=str(p["team"]);same=prior_team==t
            days=max(1,(d-date(g)).days);ago=len(h)-1-idx
            age=math.exp(-ago/14)*math.exp(-days/300)
            observed=played(g,prior_team)
            # Historical lineup compatibility: high-minute teammates who
            # should be available vs those who actually appeared in analog.
            dist=sum(w*abs(float(q in observed)-pa) for q,(w,pa) in team_context.items() if q!=pid)
            dist/=max(1,sum(w for q,(w,pa) in team_context.items() if q!=pid))
            if not same:dist+=.9
            # Compare opposing defenses using their previous boxes, not
            # the realized target-game defense.
            oldop=self.context.get((str(g["game_id"]),prior_team),np.ones(6))
            od=float(np.mean(np.abs(oldop-op)))*8
            restdiff=0.
            olddate=date(g)
            # Home/away as a weak match only; teammate composition dominates.
            hd=.15*float((p.get("side")=="home")!=home)
            arr.append(stats(p));mn.append(val(p,"min"));decay.append(age)
            role.append(age*math.exp(-4*dist-hd))
            opponent.append(age*math.exp(-4*dist-od-hd))
        v=np.asarray(arr);mins=np.asarray(mn)
        rec=np.zeros(len(h));rec[-10:]=1.
        out={}
        for arm,w in zip(ARMS,(rec,decay,role,opponent)):
            w=np.asarray(w,float);w/=max(w.sum(),1e-12)
            # Small-sample shrinkage toward the player's historical sample,
            # not a generic league average or artificially lower target.
            w=.85*w+.15/len(w)
            out[arm]=(v,w,mins)
        return out,f

def collect(games,from_date,end_date,archive=None):
    h=Retrieval();i=0;rows=[];skips=collections.Counter();conflicts=[];ledger=load();corrected=0
    if archive is None:
        iterable=[(g,None,None) for g in games if from_date<=date(g).isoformat()<end_date]
    else:iterable=archive
    for g,a,gr in iterable:
        d=date(g);gid=str(g["game_id"])
        cutoff=(stamp(a["forecast_at_utc"]).date() if a else d)-dt.timedelta(days=1)
        while i<len(games) and date(games[i])<cutoff:h.add(games[i]);i+=1
        ts=teams(g)
        if a:
            rosters={t:[] for t in ts};statuses={}
            for r in a["rows"]:
                t=str(r.get("team_id"));pid=str(r["player_id"])
                if t in rosters and r.get("reported_status")!="OUT" and pid not in rosters[t]:
                    rosters[t].append(pid);statuses[pid]=r.get("reported_status")
        else:
            rosters={t:h.roster(t) for t in ts};statuses={}
        by={}
        for j,t in enumerate(ts):
            opp=ts[1-j];actual=played(g,t)
            ctx=h.context_for(t,rosters[t],d)
            for pid in rosters[t]:
                dist,f=h.query(pid,t,opp,d,j==1,rosters[t],ctx)
                p=actual.get(pid);active=p is not None
                by[pid]={"dist":dist,"f":f,"played":active,"actual":stats(p) if active else np.zeros(4),
                         "minutes":val(p,"min") if active else 0,"game":gid,"player":pid}
        if gr is None:
            rows.extend(by.values());continue
        for r in gr["rows"]:
            m=r["market"];pid=str(r["player_id"])
            if m not in MARKETS:continue
            x=by.get(pid)
            if x is None:skips["outside_roster"]+=1;continue
            j=MARKETS.index(m);actual=float(x["actual"][j])
            ok,actual,changed=reconcile(ledger,gid,pid,m,actual,r.get("actual"),x["played"],bool(r["played"]))
            corrected+=int(changed)
            if not ok:
                conflicts.append({"game":gid,"player":pid,"market":m,"box":actual,"grade":r.get("actual")});continue
            if x["dist"] is None:skips["no_player_history"]+=1
            rows.append({**x,"market":m,"j":j,"y":actual,"base":float(r["projection"]),
                         "base_active":float(r["p_active"]),"base_minutes":r.get("minutes_forecast"),
                         "rank":r.get("frontend_rank"),"target":r.get("whole_projection"),"cp":r.get("reach_probability")})
    return rows,dict(skips),conflicts,corrected

def fit(train,cal):
    xa=np.stack([r["f"] for r in train]);ya=np.asarray([r["played"] for r in train])
    av=LogisticRegression(C=.3,max_iter=300).fit(xa,ya)
    scores={}
    for j,m in enumerate(MARKETS):
        scores[m]={}
        subset=[r for r in train if r["played"] and r["dist"] is not None]
        for arm in ARMS:
            errors=[];bs=[]
            for r in subset:
                v,w,_=r["dist"][arm]
                mu=weighted(v,w)[j]
                errors.append(abs(mu-r["actual"][j])/SCALE[j])
                bs.append(np.mean([(prob(v[:,j],w,k)-int(r["actual"][j]>=k))**2 for k in GRID[j]]))
            scores[m][arm]={"mae_scaled":mean(errors),"grid_brier":mean(bs),"objective":mean(errors)+2*mean(bs)}
    chosen={m:min(ARMS,key=lambda a:scores[m][a]["objective"]) for m in MARKETS}
    # Monotonic per-market logistic calibration on a distinct later period.
    # Train only on actually played cases for conditional probability.
    calibrators={}
    for j,m in enumerate(MARKETS):
        xs=[];ys=[]
        for r in cal:
            if not r["played"] or r["dist"] is None:continue
            v,w,_=r["dist"][chosen[m]]
            for k in GRID[j]:
                xs.append([float(logit(prob(v[:,j],w,k)))])
                ys.append(int(r["actual"][j]>=k))
        model=LogisticRegression(C=.5,max_iter=300).fit(xs,ys)
        calibrators[m]=model if model.coef_[0,0]>0 else None
    # Availability is independently calibrated using the later period.
    raw=av.predict_proba(np.stack([r["f"] for r in cal]))[:,1]
    ac=LogisticRegression(C=.5,max_iter=300).fit(logit(raw)[:,None],[r["played"] for r in cal])
    return av,ac,chosen,calibrators,scores

def score(rows,fitted):
    av,ac,chosen,cal,scores=fitted
    if not rows:return [],{}
    p=ac.predict_proba(logit(av.predict_proba(np.stack([r["f"] for r in rows]))[:,1])[:,None])[:,1]
    out=[]
    for x,pa in zip(rows,p):
        m=x["market"];j=x["j"];dist=x["dist"]
        r={k:v for k,v in x.items() if k not in ("dist","f","actual","j")}
        r["pa"]=float(pa)
        # Explicit abstention, reported separately, no fake rookie estimates.
        if dist is None:continue
        r["means"]={a:float(weighted(v,w)[j]) for a,(v,w,_) in dist.items()}
        a=chosen[m];v,w,mins=dist[a];r["prediction"]=r["means"][a]
        r["minute_pred"]=float(np.dot(w,mins))
        if x["target"] and x["cp"] is not None and int(x["target"])>0:
            k=int(x["target"]);r["hit"]=int(x["played"] and x["y"]>=k)
            raw=prob(v[:,j],w,k)
            q=float(cal[m].predict_proba([[float(logit(raw))]])[0,1]) if cal[m] else raw
            r.update(p=float(q*pa),p_common=float(q*x["base_active"]),base_p=float(x["cp"]*x["base_active"]),
                     p_raw=float(raw*pa))
        out.append(r)
    report={}
    for m in MARKETS:
        rr=[r for r in out if r["market"]==m];pl=[r for r in rr if r["played"]];ft=[r for r in rr if "hit" in r]
        if not pl:continue
        report[m]={"played":len(pl),"features":len(ft),"selected":chosen[m],
            "mae_base":mean([abs(r["base"]-r["y"]) for r in pl]),
            "mae_selected":mean([abs(r["prediction"]-r["y"]) for r in pl]),
            "mae_all_arms":{a:mean([abs(r["means"][a]-r["y"]) for r in pl]) for a in ARMS},
            "mae_gain_ci":boot([(r["game"],abs(r["base"]-r["y"])-abs(r["prediction"]-r["y"])) for r in pl]),
            "brier":{a:mean([(r[a]-r["hit"])**2 for r in ft]) for a in ("base_p","p","p_common","p_raw")},
            "brier_gain_ci":boot([(r["game"],(r["base_p"]-r["hit"])**2-(r["p"]-r["hit"])**2) for r in ft])}
    by=collections.defaultdict(list)
    for r in out:
        if r["rank"] is not None and "hit" in r:by[r["game"]].append(r)
    top={}
    for n in (4,10):
        top[n]={}
        for a in ("rank","p","p_common"):
            sel=[r for rr in by.values() for r in sorted(rr,key=lambda r:r[a] if a=="rank" else -r[a])[:n]]
            top[n][a]={"n":len(sel),"hits":sum(r["hit"] for r in sel),"rate":mean([r["hit"] for r in sel])}
    pts=[r for r in out if r["market"]=="points"];mp=[r for r in pts if r["played"] and r["base_minutes"] is not None]
    role={"availability_brier":{a:mean([(r[a]-int(r["played"]))**2 for r in pts]) for a in ("pa","base_active")},
          "minutes_mae":{a:mean([abs(r[a]-r["minutes"]) for r in mp]) for a in ("minute_pred","base_minutes")}}
    return out,{"markets":report,"top":top,"role":role}
def main():
    p=argparse.ArgumentParser();p.add_argument("--games",action="append",required=True)
    p.add_argument("--archive",required=True);p.add_argument("--grades",required=True);p.add_argument("--out",required=True)
    args=p.parse_args()
    games=read(args.games)
    tr,_,_,_=collect(games,"2025-12-01","2026-03-01");ca,_,_,_=collect(games,"2026-03-01","2026-04-15")
    if len(tr)<5000 or len(ca)<1000:raise ValueError("insufficient chronological examples")
    print("ANALOG_TRAIN",len(tr),"CALIBRATION",len(ca),flush=True)
    fitted=fit(tr,ca);ar,skipped=archives(games,args.archive,args.grades,"2026-11-01")
    rows,missing,conflicts,corrected=collect(games,"","",archive=ar)
    graded,metrics=score(rows,fitted)
    result={"schema":"NBA_WORLD_ANALOG_V1","production_changed":False,"promotion_allowed":False,
       "train_rows":len(tr),"calibration_rows":len(ca),"archive_games":len(ar),"evaluated":len(graded),
       "selected_by_prior_training_only":fitted[2],"historical_selection_scores":fitted[4],
       "metrics":metrics,"excluded":missing,"skipped":skipped,"source_conflicts":conflicts,"verified_outcome_corrections_applied":corrected,
       "source_hashes":{x:hashlib.sha256(Path(x).read_bytes()).hexdigest() for x in args.games},
       "limitations":["historical roster candidates approximate and archive candidate identities/status used at test",
        "no target-game availability or box outcome in retrieved features",
        "raw past player stat outcomes are reused as empirical samples, not causal teammate effects",
        "no-history cases abstain; paired top board may differ from complete baseline",
        "prior November results have been inspected; forward test still mandatory"]}
    Path(args.out).write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True)
if __name__=="__main__":main()
