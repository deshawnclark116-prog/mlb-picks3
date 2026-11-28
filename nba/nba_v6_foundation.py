"""NBA V6 research-only pregame challenger. No odds, no live model changes.
Fit on older box data, use separate chronological residual calibration, score
immutable archived forecast targets on the exact same player/game events.
"""
import argparse, collections, datetime as dt, gzip, hashlib, json, math
from pathlib import Path
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor, HistGradientBoostingClassifier

CORE={"points":"pts","rebounds":"reb","assists":"ast","three_pointers_made":"tpm"}
OPPS=("twoa","tpa","fta","reb","ast")
STATS=("pts","reb","ast","tpm","min","fga","tpa","fta","fgm","ftm")
ARMS=("direct","opportunity","simple")
def stamp(s): return dt.datetime.fromisoformat(str(s).replace("Z","+00:00"))
def day(g): return str(g["date"])[:10]
def read_games(paths):
    d={}
    for p in paths:
        with (gzip.open(p,"rt") if str(p).endswith(".gz") else open(p)) as f:
            for l in f:
                if l.strip():
                    g=json.loads(l); d[str(g["game_id"])]=g
    return sorted(d.values(),key=lambda g:(day(g),str(g["game_id"])))
def mean(x,default=0.):
    return float(np.mean(x)) if len(x) else default
def safe(p,k): return float(p.get(k,0) or 0)
def active(p): return p is not None and safe(p,"min")>0
def opportunities(p):
    return [max(0,safe(p,"fga")-safe(p,"tpa")),safe(p,"tpa"),safe(p,"fta"),safe(p,"reb"),safe(p,"ast")]
class State:
    def __init__(self):
        self.ph=collections.defaultdict(list)
        self.th=collections.defaultdict(list)
    def roster(self,team):
        return sorted({str(p["id"]) for _,ps in self.th[team][-4:] for p in ps})
    def ingest(self,g):
        for side in ("home","away"):
            team=str(g[side]["id"])
            ps=[p for p in g["players"] if str(p["team"])==team and active(p)]
            self.th[team].append((g,ps))
            for p in ps: self.ph[str(p["id"])].append((g,p))
    def features(self,pid,team,opp,home,d,roster):
        h=self.ph[pid]; team_games=self.th[team]; opp_games=self.th[opp]
        hist=[p for _,p in h]; recent=[p for _,p in h if str(p["team"])==team]
        hs=recent if len(recent)>=3 else hist
        recent5=hs[-5:]; recent20=hs[-20:]
        lastdate=day(h[-1][0]) if h else None
        days=(dt.date.fromisoformat(d)-dt.date.fromisoformat(lastdate)).days if lastdate else 60
        x=[len(h),len(recent),min(days,180),float(home),
           len(roster),mean([safe(p,"min") for p in recent5],12),
           mean([safe(p,"min") for p in recent20],12),
           mean([float(bool(p.get("start"))) for p in recent5]),
           mean([float(bool(p.get("start"))) for p in recent20]),
           float(bool(recent))]
        for n in (3,10,30):
            ps=hs[-n:]; mins=sum(safe(p,"min") for p in ps)
            x += [mean([safe(p,k) for p in ps]) for k in STATS]
            x += [sum(safe(p,k) for p in ps)/max(mins,1)*36 for k in STATS if k!="min"]
            x += [float(np.std([safe(p,"min") for p in ps])) if ps else 0.]
        # Team activity in last games, no target-game participation or starters.
        for n in (1,4,12):
            past=team_games[-n:]
            x += [mean([float(any(str(p["id"])==pid for p in ps)) for _,ps in past]),
                  mean([sum(safe(p,"min") for p in ps if str(p["id"]) not in roster) for _,ps in past]),
                  mean([sum(safe(p,"fga") for p in ps) for _,ps in past],88),
                  mean([sum(safe(p,"tov") for p in ps) for _,ps in past],14)]
        for n in (5,20):
            past=opp_games[-n:]
            x += [mean([sum(safe(p,k) for p in g["players"] if str(p["team"])!=opp) for g,_ in past],0) for k in ("pts","reb","ast","tpm","fga","fta")]
        peers=[]
        for other in roster:
            if other!=pid:
                pp=[p for _,p in self.ph[other][-5:]]
                peers.append((mean([safe(p,"min") for p in pp]),mean([safe(p,"fga") for p in pp]),mean([safe(p,"ast") for p in pp])))
        for j in range(3):
            vals=sorted((p[j] for p in peers),reverse=True)
            x += [sum(vals[:5]),sum(vals),sum(v>10 for v in vals)]
        # Beta shrinkage using only historical shot attempts.
        ps=hs[-60:]
        twoa=sum(max(0,safe(p,"fga")-safe(p,"tpa")) for p in ps)
        twom=sum(max(0,safe(p,"fgm")-safe(p,"tpm")) for p in ps)
        ta=sum(safe(p,"tpa") for p in ps); tm=sum(safe(p,"tpm") for p in ps)
        fa=sum(safe(p,"fta") for p in ps); fm=sum(safe(p,"ftm") for p in ps)
        pct=[(twom+30*.53)/(twoa+30),(tm+40*.35)/(ta+40),(fm+20*.77)/(fa+20)]
        raw=[mean([safe(p,k) for p in hs[-10:]],0.) for k in CORE.values()]
        mins=mean([safe(p,"min") for p in recent5],12.)
        return np.asarray(x+pct,dtype=float),pct,raw,mins

def examples(games,train_end,cal_end):
    state=State(); train=[]; cal=[]
    # Batch by calendar date, preventing same-day lookahead.
    for d,gg in __import__("itertools").groupby(games,key=day):
        group=list(gg)
        if d>=cal_end: break
        for g in group:
            for side in ("home","away"):
                team=str(g[side]["id"]); opp=str(g["away" if side=="home" else "home"]["id"])
                roster=state.roster(team)
                if len(state.th[team])<5: continue
                actual={str(p["id"]):p for p in g["players"] if str(p["team"])==team and active(p)}
                for pid in roster:
                    feat,pct,raw,mins=state.features(pid,team,opp,side=="home",d,roster)
                    p=actual.get(pid); played=active(p)
                    target=[safe(p,k) for k in CORE.values()] if played else [0.]*4
                    row=(feat,pct,raw,mins,played,safe(p,"min") if played else 0.,target,opportunities(p) if played else [0.]*5)
                    (train if d<train_end else cal).append(row)
        for g in group: state.ingest(g)
    return train,cal
def reg(X,y):
    return HistGradientBoostingRegressor(max_iter=180,max_leaf_nodes=15,min_samples_leaf=35,l2_regularization=3,learning_rate=.06,random_state=61).fit(X,y)
class Model:
    def fit(self,rows):
        a=[r for r in rows if r[4]]; X=np.stack([r[0] for r in a]); allx=np.stack([r[0] for r in rows])
        self.av=HistGradientBoostingClassifier(max_iter=140,max_leaf_nodes=15,min_samples_leaf=40,l2_regularization=3,random_state=61).fit(allx,[r[4] for r in rows])
        self.minutes=reg(X,[min(r[5],48) for r in a])
        self.direct=[reg(X,[r[6][j] for r in a]) for j in range(4)]
        self.rates=[reg(X,[r[7][j]/max(r[5],1)*36 for r in a]) for j in range(5)]
        return self
    def predict(self,feats):
        X=np.stack([f[0] for f in feats]); p=np.clip(self.av.predict_proba(X)[:,1],.01,.99)
        mins=np.clip(self.minutes.predict(X),1,48)
        direct=np.maximum(0,np.stack([m.predict(X) for m in self.direct],axis=1))
        rates=np.maximum(0,np.stack([m.predict(X) for m in self.rates],axis=1))
        pct=np.stack([f[1] for f in feats]); op=rates*mins[:,None]/36
        # Opportunities and shrinkage shooting efficiency, not raw points alone.
        opp=np.stack([op[:,0]*pct[:,0]*2+op[:,1]*pct[:,1]*3+op[:,2]*pct[:,2],op[:,3],op[:,4],op[:,1]*pct[:,1]],axis=1)
        simple=np.stack([f[2] for f in feats])
        return p,mins,{"direct":direct,"opportunity":opp,"simple":simple}
def residuals(model,rows):
    a=[r for r in rows if r[4]]
    _,_,pred=model.predict([r[:4] for r in a]); y=np.asarray([r[6] for r in a])
    return {arm:[np.sort((y[:,j]-v[:,j])/np.sqrt(1+v[:,j])) for j in range(4)] for arm,v in pred.items()}
def prob(res,mu,target):
    z=(target-.5-mu)/math.sqrt(1+mu)
    return float((len(res)-np.searchsorted(res,z,side="left")+1)/(len(res)+2))
def collect_archives(root,grades,games,test_from):
    byid={str(g["game_id"]):g for g in games}; out=[]; skipped=collections.Counter()
    for p in sorted(Path(grades).glob("*.json")):
        g=json.loads(p.read_text()); gid=str(g.get("game_id")); actual=byid.get(gid)
        if actual is None: skipped["missing_box_game"]+=1; continue
        if day(actual)<test_from: continue
        path=Path(root)/(gid+".json.gz")
        if not path.exists(): skipped["missing_archive"]+=1; continue
        with gzip.open(path,"rt") as f: ar=json.load(f)["games"]
        if len(ar)!=1 or str(ar[0]["game_id"])!=gid: raise ValueError("archive game mismatch")
        a=ar[0]
        if stamp(a["forecast_at_utc"])!=stamp(g["forecast_at_utc"]) or stamp(a["forecast_at_utc"])>=stamp(a["tipoff_utc"]):
            raise ValueError("invalid frozen forecast timestamp")
        out.append((actual,a,g))
    return sorted(out,key=lambda t:(stamp(t[1]["forecast_at_utc"]),str(t[0]["game_id"]))),dict(skipped)
def bootstrap(rows,seed=61):
    by=collections.defaultdict(list)
    for gid,d in rows: by[gid].append(d)
    vals=list(by.values()); rng=np.random.default_rng(seed)
    if not vals:return [None,None]
    sums=np.array([sum(v) for v in vals]); sizes=np.array([len(v) for v in vals])
    idx=rng.integers(0,len(vals),(1000,len(vals)))
    return np.quantile(sums[idx].sum(axis=1)/sizes[idx].sum(axis=1),[.025,.975]).tolist()
def evaluate(model,res,games,archives):
    state=State(); i=0; records=[]; misses=collections.Counter()
    for actual,ar,grade in archives:
        d=day(actual); gid=str(actual["game_id"])
        cutoff=stamp(ar["forecast_at_utc"]).astimezone(dt.timezone.utc).date().isoformat()
        # A prior-date game might still be running after midnight UTC. Use a
        # conservative extra calendar-day buffer for historical box outcomes.
        cutoff=(dt.date.fromisoformat(cutoff)-dt.timedelta(days=1)).isoformat()
        while i<len(games) and day(games[i])<cutoff: state.ingest(games[i]); i+=1
        original={(str(r["player_id"]),r["market"]):r for r in ar["rows"]}
        if len(original)!=len(ar["rows"]): raise ValueError("duplicate original")
        lookup={str(p["id"]):p for p in actual["players"]}
        pred={}
        for side in ("home","away"):
            team=str(actual[side]["id"]); opp=str(actual["away" if side=="home" else "home"]["id"])
            roster=sorted({pid for (pid,_),r in original.items() if str(r.get("team_id"))==team and r.get("reported_status")!="OUT"})
            if not roster: continue
            f=[state.features(pid,team,opp,side=="home",d,roster) for pid in roster]
            pa,mins,means=model.predict(f)
            for j,pid in enumerate(roster): pred[pid]=(pa[j],mins[j],{k:v[j] for k,v in means.items()})
        seen=set()
        for r in grade["rows"]:
            m=r["market"]; pid=str(r["player_id"]); key=(pid,m)
            if m not in CORE: continue
            if key in seen: raise ValueError("duplicate grade")
            seen.add(key); o=original.get(key)
            if not o or pid not in pred: misses["not_matched_or_out"]+=1; continue
            if not r.get("whole_projection") or r.get("reach_probability") is None: misses["no_frozen_target"]+=1;continue
            k=int(r["whole_projection"])
            if k<=0: continue
            cp=float(r["reach_probability"]); ap=float(r["p_active"])
            if not (0<=cp<=1 and 0<=ap<=1): raise ValueError("bad probability")
            p=lookup.get(pid); played=active(p)
            if played!=bool(r["played"]): raise ValueError("box/grade availability mismatch")
            j=list(CORE).index(m); y=safe(p,CORE[m]) if played else 0.
            if played and y!=float(r["actual"]): raise ValueError("box/grade actual mismatch")
            av,mins,mu=pred[pid]; hit=int(played and y>=k)
            q={arm:prob(res[arm][j],float(v[j]),k) for arm,v in mu.items()}
            records.append(dict(game=gid,player=pid,market=m,played=played,y=y,hit=hit,target=k,
                base_mean=float(r["projection"]),base_p=cp*ap,base_cond=cp,base_active=ap,
                candidate_active=float(av),minutes=mins,actual_minutes=safe(p,"min") if played else 0,
                baseline_minutes=r.get("minutes_forecast"),rank=r.get("frontend_rank"),
                means={arm:float(v[j]) for arm,v in mu.items()},
                probs={arm:q[arm]*ap for arm in ARMS},own_probs={arm:q[arm]*av for arm in ARMS}))
    return records,dict(misses)
def compare_independent(records, archives, root):
    # Independent shadow uses different milestone targets. Compare numerical
    # forecasts only, on identical actuals, with its own archived timestamp.
    by={}
    for actual,ar,_ in archives:
        gid=str(actual["game_id"]); path=Path(root)/(gid+".json")
        if not path.is_file(): continue
        d=json.loads(path.read_text())
        for g in d.get("games",[]):
            if str(g.get("game_id"))!=gid: continue
            t=stamp(g["forecast_at_utc"])
            if t>=stamp(ar["tipoff_utc"]): continue
            for p in g.get("players",[]):
                for m,y in p.get("predictions",{}).items():
                    if m in CORE and isinstance(y,(int,float)) and math.isfinite(y):
                        by[(gid,str(p["player_id"]),m)]=float(y)
    result={}
    for m in CORE:
        rows=[r for r in records if r["played"] and r["market"]==m and (r["game"],r["player"],m) in by]
        if not rows: continue
        baseline=lambda r: abs(by[(r["game"],r["player"],m)]-r["y"])
        result[m]={"n":len(rows),"games":len({r["game"] for r in rows}),
                   "independent_mae":mean([baseline(r) for r in rows]),
                   "v5_mae":mean([abs(r["base_mean"]-r["y"]) for r in rows]),
                   "challengers":{arm:{"mae":mean([abs(r["means"][arm]-r["y"]) for r in rows]),
                      "reduction_ci":bootstrap([(r["game"],baseline(r)-abs(r["means"][arm]-r["y"])) for r in rows])} for arm in ARMS}}
    return result

def summarize(records):
    result={}
    for m in CORE:
        rs=[r for r in records if r["market"]==m]; pl=[r for r in rs if r["played"]]
        if not rs or not pl: continue
        result[m]={"n":len(rs),"n_played":len(pl),"games":len({r["game"] for r in rs}),
                   "base_mae":mean([abs(r["base_mean"]-r["y"]) for r in pl]),
                   "base_brier":mean([(r["base_p"]-r["hit"])**2 for r in rs]),"arms":{}}
        for arm in ARMS:
            md=[(r["game"],abs(r["base_mean"]-r["y"])-abs(r["means"][arm]-r["y"])) for r in pl]
            bd=[(r["game"],(r["base_p"]-r["hit"])**2-(r["probs"][arm]-r["hit"])**2) for r in rs]
            result[m]["arms"][arm]={"mae":mean([abs(r["means"][arm]-r["y"]) for r in pl]),
                "brier_common_availability":mean([(r["probs"][arm]-r["hit"])**2 for r in rs]),
                "brier_independent_availability":mean([(r["own_probs"][arm]-r["hit"])**2 for r in rs]),
                "mae_reduction_ci":bootstrap(md),"brier_reduction_ci":bootstrap(bd)}
    ranked=[r for r in records if r["rank"] is not None]
    by=collections.defaultdict(list)
    for r in ranked: by[r["game"]].append(r)
    top={}
    for k in (4,10):
        top[str(k)]={}
        for arm in ("baseline",*ARMS):
            picked=[r for rows in by.values() for r in sorted(rows,key=lambda r:(r["rank"] if arm=="baseline" else -r["probs"][arm],r["player"],r["market"]))[:k]]
            top[str(k)][arm]={"n":len(picked),"hits":sum(r["hit"] for r in picked),"hit_rate":mean([r["hit"] for r in picked])}
    return result,top
def main():
    a=argparse.ArgumentParser(); a.add_argument("--games",action="append",required=True); a.add_argument("--archive",required=True); a.add_argument("--grades",required=True); a.add_argument("--out",required=True)
    a.add_argument("--independent-archive",default="docs/nba_independent_live/first")
    a.add_argument("--train-end",default="2026-02-01"); a.add_argument("--cal-end",default="2026-04-15"); a.add_argument("--test-from",default="2026-11-01")
    args=a.parse_args()
    if not args.train_end<args.cal_end<=args.test_from: raise ValueError("overlapping splits")
    games=read_games(args.games); train,cal=examples(games,args.train_end,args.cal_end)
    if len(train)<5000 or len(cal)<1000: raise ValueError("insufficient training/calibration")
    model=Model().fit(train); res=residuals(model,cal)
    archive,skipped=collect_archives(args.archive,args.grades,games,args.test_from)
    records,missing=evaluate(model,res,games,archive)
    if not records: raise ValueError("no matched frozen events")
    metrics,top=summarize(records)
    report={"schema":"NBA_V6_RESEARCH_FOUNDATION_V1","production_changed":False,"promotion_allowed":False,
        "training_rows":len(train),"calibration_rows":len(cal),"split":[args.train_end,args.cal_end,args.test_from],
        "data_sha256":{p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in args.games},
        "archive_games":len(archive),"scored_events":len(records),"skipped_games":skipped,"excluded_rows":missing,
        "metrics":metrics,"top4_top10_same_eligible_set":top,
        "independent_frozen_numerical_comparison":compare_independent(records,archive,args.independent_archive),
        "limitations":["historical last-four-game roster approximation in training; archive roster at evaluation",
          "no verified target-game starter or current tracking inputs in this first challenger",
          "historical November archive already researched, not a fresh prospective test",
          "independent availability uncalibrated; common incumbent availability is primary comparison",
          "conditional stat residual model pooled within market; no joint simulation yet",
          "independent benchmark may be a different pretip timestamp; numerical comparison only"]}
    Path(args.out).write_text(json.dumps(report,indent=2)); print(json.dumps(report,indent=2),flush=True)
if __name__=="__main__":main()
