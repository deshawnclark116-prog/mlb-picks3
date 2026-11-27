"""NBA full architecture tournament, independently constructed prior-date candidates.

Candidate = appeared on team in previous 10 observed team games, with known
historical team identity. Missing in a complete final box = no observed play,
not verified injured/inactive. Rookies/trades/cold starts are coverage misses.
Historical dates previously examined, not a fresh forward holdout.
"""
import argparse,datetime as dt,json,math
from collections import defaultdict,deque
from pathlib import Path
from zoneinfo import ZoneInfo
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor,HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression,Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from nba.nba_v4_backtest import load
ET=ZoneInfo("America/New_York")
STATS={"points":"pts","rebounds":"reb","assists":"ast","three_pointers_made":"tpm"}
COUNTS=["min","pts","reb","ast","tpm","fga","tpa","fta","fgm","ftm"]
FLOORS={"points":6,"rebounds":3,"assists":2,"three_pointers_made":1}
PARAM=dict(max_iter=100,max_leaf_nodes=15,min_samples_leaf=60,l2_regularization=12,learning_rate=.06,random_state=2711)
def ts(v):return dt.datetime.fromisoformat(v.replace("Z","+00:00"))
def day(g):
 t=ts(g["date"])
 if t.tzinfo is None:raise ValueError("missing timezone")
 return t.astimezone(ET).date().isoformat()
def av(a):return float(np.mean(a)) if len(a) else 0.
def complete(g):
 if g.get("season_type") not in (2,"2",None):return False
 ids=[str(p["id"]) for p in g["players"]]
 if len(set(ids))!=len(ids):return False
 for side in ("home","away"):
  ps=[p for p in g["players"] if p["side"]==side]
  if not ps or any(str(p["team"])!=str(g[side]["id"]) for p in ps):return False
  if any(not isinstance(p.get(k),(int,float)) or not math.isfinite(p[k]) or p[k]<0 for p in ps for k in COUNTS):return False
  mins=sum(p["min"] for p in ps)
  if min(abs(mins-(240+25*ot)) for ot in range(5))>8:return False
  if sum(p["pts"] for p in ps)!=g[side]["score"]:return False
 return True
def build(games):
 dates=defaultdict(list);invalid=0
 for g in games:
  if complete(g):dates[day(g)].append(g)
  else:invalid+=1
 prior=defaultdict(lambda:deque(maxlen=30));last_team={};hist=defaultdict(lambda:deque(maxlen=30))
 out=[];coverage=defaultdict(lambda:[0,0]);tips={}
 for d,gs in sorted(dates.items()):
  now=dt.date.fromisoformat(d)
  for g in gs:
   gid=str(g["game_id"]);tips[gid]=g["date"]
   for side,other in (("home","away"),("away","home")):
    tid,opp=str(g[side]["id"]),str(g[other]["id"])
    own=list(prior[tid]);enemy=list(prior[opp])
    if len(own)<3 or len(enemy)<3:continue
    candidate=set().union(*(set(v["players"]) for v in own[-10:]))
    candidate={p for p in candidate if last_team.get(p)==tid and len(hist[(tid,p)])>=3}
    actual={str(p["id"]):p for p in g["players"] if p["side"]==side and p["min"]>0}
    cov=coverage[d[:7]];cov[0]+=len(actual);cov[1]+=len(candidate&actual.keys())
    def teamvec(r):
     return [av([v[k] for v in r[-n:]]) for n in (3,10,25) for k in ("poss","pts","allowed","margin","reb_allowed","ast_allowed","tpm_allowed")]
    for pid in sorted(candidate):
     h=list(hist[(tid,pid)])
     played=[v for v in h if v["min"]>0]
     if len(played)<3:continue
     last=own[-10:];seq=[v["players"].get(pid,{}).get("min",0.) for v in last]
     recent=played[-5:];mins=sum(v["min"] for v in played[-10:])
     days=(now-dt.date.fromisoformat(played[-1]["day"])).days
     rest=(now-dt.date.fromisoformat(own[-1]["day"])).days
     f=[float(side=="home"),min(rest,10),min(days,90),len(played),len(seq),av([m>0 for m in seq]),
        av(seq[-3:]),av(seq[-5:]),av(seq),float(np.std(seq)),seq[-1],
        av([v["start"] for v in recent]),float(np.std([v["min"] for v in recent])),
        av([v["min"] for v in played[-3:]])-av([v["min"] for v in played[-10:]])]
     for k in COUNTS:
      f.extend([av([v[k] for v in played[-n:]]) for n in (3,5,10,30)])
      f.extend([sum(v[k] for v in played[-10:])/max(1.,mins),float(np.std([v[k] for v in recent]))])
     # Role concentration and missed recent teammate opportunities use only prior team boxes.
     teammate={}
     for v in own[-5:]:
      for p,z in v["players"].items():teammate[p]=teammate.get(p,0.)+z["min"]/min(5,len(own))
     f.extend([sum(v for p,v in teammate.items() if p!=pid and p not in own[-1]["players"]),
               len(own[-1]["players"]),sum(v>=20 for v in teammate.values()),*teamvec(own),*teamvec(enemy)])
     r=actual.get(pid)
     out.append(dict(date=d,gid=gid,pid=pid,team=tid,x=f,played=int(r is not None),
        y={k:float(r[k]) if r is not None else 0. for k in COUNTS},
        baseline={k:av([v[k] for v in recent]) for k in COUNTS},
        baseline_active=av([m>0 for m in seq]),
        rate={k:sum(v[k] for v in played[-10:])/max(1.,mins) for k in COUNTS},
        prior_minutes=av([v["min"] for v in recent])))
  # All fixtures on the date were evaluated before ANY state update.
  for g in gs:
   for side,other in (("home","away"),("away","home")):
    tid=str(g[side]["id"]);ps=[p for p in g["players"] if p["side"]==side and p["min"]>0]
    opp=[p for p in g["players"] if p["side"]==other and p["min"]>0]
    own={str(p["id"]):p for p in ps}
    prior[tid].append(dict(day=d,players=own,poss=sum(p["fga"]+.44*p["fta"]-p["oreb"]+p["tov"] for p in ps),
         pts=g[side]["score"],allowed=g[other]["score"],margin=g[side]["score"]-g[other]["score"],
         reb_allowed=sum(p["reb"] for p in opp),ast_allowed=sum(p["ast"] for p in opp),tpm_allowed=sum(p["tpm"] for p in opp)))
    for pid,p in own.items():
     last_team[pid]=tid;hist[(tid,pid)].append(dict(p,day=d))
 return out,dict(coverage),tips,invalid
def metric(y,p):
 return {"n":len(y),"mae":float(np.mean(abs(y-p))),"bias":float(np.mean(p-y)),"rmse":float(np.sqrt(np.mean((p-y)**2)))}
def brier(y,p):
 p=np.clip(p,1e-6,1-1e-6)
 return {"n":len(y),"brier":float(np.mean((p-y)**2)),"logloss":float(-np.mean(y*np.log(p)+(1-y)*np.log1p(-p))),"mean_probability":float(p.mean()),"actual_rate":float(y.mean())}
def ci(rows,y,p,q,prob=False):
 if not rows:return None
 groups=defaultdict(list)
 for r,a,b,c in zip(rows,y,p,q):groups[r["gid"]].append((b-a)**2-(c-a)**2 if prob else abs(b-a)-abs(c-a))
 sums=np.array([sum(v) for v in groups.values()]);n=np.array([len(v) for v in groups.values()])
 rng=np.random.default_rng(2711);idx=rng.integers(0,len(n),(800,len(n)));v=sums[idx].sum(axis=1)/n[idx].sum(axis=1)
 return list(map(float,np.quantile(v,[.025,.975])))
def original_grades(root,tips):
 out={}
 for f in Path(root).glob("*.json"):
  g=json.loads(f.read_text());gid=str(g["game_id"])
  if gid not in tips or ts(g["forecast_at_utc"])>=ts(tips[gid]):continue
  for r in g["rows"]:
   if r["market"] in STATS and r.get("played") is True and isinstance(r.get("actual"),(int,float)):
    out[(gid,str(r["player_id"]),r["market"])]=r
 return out
def fit_predict(train,test):
 x=np.array([r["x"] for r in train]);xt=np.array([r["x"] for r in test])
 a=np.array([r["played"] for r in train]);idx=a==1
 active=HistGradientBoostingClassifier(**PARAM).fit(x,a).predict_proba(xt)[:,1]
 def reg(k,loss="squared_error"):
  y=np.array([r["y"][k] for r in train])[idx]
  return np.maximum(0,HistGradientBoostingRegressor(loss=loss,**PARAM).fit(x[idx],y).predict(xt))
 minutes=np.clip(reg("min"),0,53)
 opportunity={k:reg(k,"poisson") for k in ("fga","tpa","fta")}
 pred={}
 for market,k in STATS.items():
  baseline=np.array([r["baseline"][k] for r in test]);rate=np.array([r["rate"][k] for r in test])
  direct=reg(k,"poisson");median=reg(k,"absolute_error")
  factor=minutes*rate
  if k in ("pts","tpm"):
   # Separate volume and historical shrunk conversion. 2PA from total FGA minus 3PA.
   def efficiency(r):
    v=r["baseline"];three=v["tpm"];two=max(0,v["fgm"]-three)
    return ((two+4.8)/(max(0,v["fga"]-v["tpa"])+9), (three+2.1)/(v["tpa"]+6),(v["ftm"]+3.8)/(v["fta"]+5))
   eff=np.array([efficiency(r) for r in test])
   three=np.minimum(opportunity["tpa"],opportunity["fga"])
   opp=three*eff[:,1] if k=="tpm" else 2*(opportunity["fga"]-three)*eff[:,0]+3*three*eff[:,1]+opportunity["fta"]*eff[:,2]
  else:opp=factor
  pred[market]={"last5":baseline,"direct":direct,"median":median,"minutes_rate":factor,"opportunity":opp,"fixed_blend":.5*direct+.5*opp}
 return active,minutes,opportunity,pred
def evaluate(rows,a,mins,op,pred,archive):
 active=np.array([r["played"] for r in rows]);played=active==1
 base=np.array([r["baseline_active"] for r in rows]);out={"candidates":len(rows),"played":int(played.sum()),"active":{"prior_appearance":brier(active,base),"learned":brier(active,a),"gain_ci95":ci(rows,active,base,a,True)}}
 rr=[r for r in rows if r["played"]]
 y=np.array([r["y"]["min"] for r in rr]);mb=np.array([r["baseline"]["min"] for r in rr])
 out["minutes"]={"last5":metric(y,mb),"learned":metric(y,mins[played]),"gain_ci95":ci(rr,y,mb,mins[played])}
 out["opportunity"]={}
 for k,v in op.items():
  yy=np.array([r["y"][k] for r in rr]);b=np.array([r["baseline"][k] for r in rr]);out["opportunity"][k]={"last5":metric(yy,b),"learned":metric(yy,v[played])}
 out["markets"]={}
 for market,k in STATS.items():
  yy=np.array([r["y"][k] for r in rows]);y=yy[played];arms=pred[market];z={}
  indices=[];original=[]
  for i,r in enumerate(rows):
   old=archive.get((r["gid"],r["pid"],market))
   if r["played"] and old and abs(old["actual"]-r["y"][k])<1e-6:
    indices.append(i);original.append(old["projection"])
  for name,p in arms.items():
   entry={"conditional":metric(y,p[played]),"unconditional":metric(yy,a*p),
      "conditional_gain_ci95_vs_last5":ci(rr,y,arms["last5"][played],p[played])}
   if indices:
    idx=np.array(indices);o=np.array(original);matched=[rows[i] for i in idx]
    entry["same_original_v5_players"]={"v5":metric(yy[idx],o),"candidate":metric(yy[idx],p[idx]),"gain_ci95":ci(matched,yy[idx],o,p[idx])}
   z[name]=entry
  out["markets"][market]=z
 return out
def whole(x):
 return np.floor(np.maximum(0,x)+.4+1e-10).astype(int)
def calibrated_distributions(rows,pred):
 """Freeze validation residuals conditional on playing and mean scale.
    Residuals are stored in units sqrt(mean+1) to respect count variance."""
 out={}
 played=np.array([r["played"]==1 for r in rows])
 for market,k in STATS.items():
  y=np.array([r["y"][k] for r in rows])
  out[market]={}
  for name,p in pred[market].items():
   scale=np.sqrt(p+1)
   err=(y-p)/scale
   # Fixed bins, no data-driven rescue optimization on test seasons.
   cuts=[0,2,5,10,20,1000] if market=="points" else [0,1,2,4,7,1000]
   pool=np.sort(err[played])
   out[market][name]=(cuts,pool,[np.sort(err[played&(p>=lo)&(p<hi)]) for lo,hi in zip(cuts,cuts[1:])])
 return out
def reach(p,target,a,cal):
 cuts,pool,bins=cal
 result=[]
 for m,t,pa in zip(p,target,a):
  if t<=0:result.append(1.);continue
  j=min(len(bins)-1,max(0,int(np.searchsorted(cuts,m,side="right")-1)))
  z=(t-.5-m)/math.sqrt(m+1)
  def survival(arr):
   return (len(arr)-np.searchsorted(arr,z,side="left")+.5)/(len(arr)+1)
  local=bins[j];n=len(local)
  prob=(n*survival(local)+100*survival(pool))/(n+100)
  result.append(float(pa)*prob)
 return np.asarray(result)
def probability_tournament(rows,a,pred,cal,archive):
 """Fixed pregame target comparison; own-target cards shown separately.
    No winner gets credit merely for lowering the event threshold."""
 out={}
 fixed_cards=defaultdict(list);own_cards=defaultdict(list)
 for market,k in STATS.items():
  y=np.array([r["y"][k] for r in rows])
  fixed=whole(pred[market]["last5"])
  eligible=fixed>=FLOORS[market]
  z={}
  for name,p in pred[market].items():
   pr=reach(p,fixed,a,cal[market][name]);own=whole(p);op=reach(p,own,a,cal[market][name])
   target=y>=fixed;own_hit=y>=own
   e={"fixed_last5_target":brier(target[eligible].astype(float),pr[eligible])}
   for i,r in enumerate(rows):
    key=(r["gid"],name)
    if eligible[i]:fixed_cards[key].append((float(pr[i]),int(target[i]),market,r["pid"],int(fixed[i])))
    if own[i]>=FLOORS[market]:own_cards[key].append((float(op[i]),int(own_hit[i]),market,r["pid"],int(own[i])))
   # Same ORIGINAL V5 target on same played-player records; conditional only.
   ids=[];oldp=[];t=[]
   for i,r in enumerate(rows):
    old=archive.get((r["gid"],r["pid"],market))
    if not r["played"] or not old or old["actual"]!=r["y"][k]:continue
    q=old.get("reach_probabilities") or {}
    prob=q.get("probability_if_playing");target0=q.get("whole_projection")
    if not isinstance(prob,(int,float)) or not isinstance(target0,int) or target0<FLOORS[market]:continue
    ids.append(i);oldp.append(prob);t.append(target0)
   if ids:
    idx=np.asarray(ids);targets=np.asarray(t);actual=(y[idx]>=targets).astype(float)
    newp=reach(p[idx],targets,np.ones(len(idx)),cal[market][name]);orig=np.asarray(oldp)
    e["same_original_v5_target_if_played"]={"original":brier(actual,orig),"new":brier(actual,newp),"gain_ci95":ci([rows[i] for i in idx],actual,orig,newp,True)}
   z[name]=e
  out[market]=z
 def summarize(cards):
  by=defaultdict(list)
  for (gid,name),r in cards.items():
   r=sorted(r,key=lambda t:(-t[0],t[2],t[3]))
   for n in (4,10):by[(name,n)].extend(r[:n])
  return {name+"_"+str(n):{**brier(np.array([r[1] for r in q]),np.array([r[0] for r in q])),
    "mean_target_by_market":{m:av([r[4] for r in q if r[2]==m]) for m in STATS},
    "market_counts":{m:sum(r[2]==m for r in q) for m in STATS}} for (name,n),q in by.items()}
 return {"markets":out,"fixed_common_target_cards":summarize(fixed_cards),"own_target_cards_not_equal_difficulty":summarize(own_cards)}

def run(files,grades):
 games=load(files);rows,cov,tips,bad=build(games);archive=original_grades(grades,tips)
 tr=[r for r in rows if r["date"]<"2026-01-01"];va=[r for r in rows if "2026-01-01"<=r["date"]<"2026-02-15"]
 spring=[r for r in rows if "2026-02-15"<=r["date"]<"2026-04-15"];fall=[r for r in rows if r["date"]>="2026-10-20"]
 assert min(map(len,(tr,va,spring,fall)))>100
 result={"schema":"NBA_FULL_ARCHITECTURE_TOURNAMENT_V1","production_changed":False,"promotion_allowed":False,"historical_already_examined":True,
    "complete_box_rejected":bad,"candidate_player_coverage_by_month":cov,"original_v5_rows":len(archive),"cohorts":{}}
 cal=None
 for name,train,test in [("validation",tr,va),("spring",tr+va,spring),("fall",tr+va,fall)]:
  assert max(r["date"] for r in train)<min(r["date"] for r in test)
  a,mins,op,pred=fit_predict(train,test)
  v=evaluate(test,a,mins,op,pred,archive)
  if name=="validation":cal=calibrated_distributions(test,pred)
  else:v["probability_tournament"]=probability_tournament(test,a,pred,cal,archive)
  result["cohorts"][name]=v
  print("NBA_FULL_STRESS",name,json.dumps(v,sort_keys=True),flush=True)
 result["validation_selected_numeric_heads"]={m:min(v,key=lambda k:v[k]["conditional"]["mae"]) for m,v in result["cohorts"]["validation"]["markets"].items()}
 return result
def main():
 p=argparse.ArgumentParser();p.add_argument("--games",action="append",required=True);p.add_argument("--grades",required=True);p.add_argument("--out",required=True);a=p.parse_args()
 Path(a.out).write_text(json.dumps(run(a.games,a.grades),indent=2)+"\n")
if __name__=="__main__":main()
