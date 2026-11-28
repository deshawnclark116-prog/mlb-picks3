"""Independent action-level basketball history and paired predictive ablation.

Reads compact raw events only. Does not import any old rotation, player-profile
or simulation code. Completed-game event outcomes become features only after
the same conservative historical cutoff used by the box-only competitor.
"""
import collections,gzip,json,math
import numpy as np
from nba_world.data import teams,played,val
STYLES=("layup","dunk","pullup","stepback","floater","hook","jump","fadeaway")
# 2PA,3PA,FTA, assisted FGA makes, unassisted makes, assists, OR, DR, TO,
# fouls, attempts in each shot style, Q4 attempts, Q4 assists
E=20
# Eight six-minute court-exposure windows and opening/closing flags
S=10
def load_events(paths):
    out={}
    for path in paths:
        with (gzip.open(path,"rt") if str(path).endswith(".gz") else open(path)) as f:
            for line in f:
                if line.strip():
                    g=json.loads(line);out[str(g["game_id"])]=g
    return out

def elapsed(period,clock):
    return (int(period)-1)*720+720-float(clock)

def extract(g,pb):
    ts=teams(g);box={p:q for t in ts for p,q in played(g,t).items()}
    owners={p:str(q["team"]) for p,q in box.items()}
    result={"events":{},"stints":{},"reason":"NO_TRACE","event_coverage":0.}
    if {str(pb.get("home")),str(pb.get("away"))}!=set(ts):return result
    v=collections.defaultdict(lambda:np.zeros(E))
    for event in pb.get("events",[]):
        if len(event)<7:continue
        period,clock,kind,tid,a,b,pts=event[:7];a=str(a or "");b=str(b or "")
        if a not in owners:continue
        x=v[a]
        if kind in ("S2","S3"):
            x[0 if kind=="S2" else 1]+=1
            if int(pts)>0:
                if b and b!=a and owners.get(b)==owners[a]:x[3]+=1;v[b][5]+=1
                else:x[4]+=1
            if len(event)>9 and event[9] in STYLES:x[10+STYLES.index(event[9])]+=1
            if period==4:x[18]+=1
            if period==4 and int(pts)>0 and b and b!=a and owners.get(b)==owners[a]:v[b][19]+=1
        elif kind=="FT":x[2]+=1
        elif kind=="OR":x[6]+=1
        elif kind=="DR":x[7]+=1
        elif kind=="TO":x[8]+=1
        elif kind=="PF":x[9]+=1
    # Player-level reconciliation prevents missing/incorrect PBP counts from
    # becoming zero-valued skills. Only validated opportunities are retained.
    for pid,p in box.items():
        x=v[pid]
        truth=np.array([val(p,"fga")-val(p,"tpa"),val(p,"tpa"),val(p,"fta"),
                        val(p,"ast"),val(p,"oreb"),val(p,"dreb")])
        obs=x[[0,1,2,5,6,7]]
        if np.max(np.abs(truth-obs))<=1:
            result["events"][pid]=np.r_[val(p,"min"),x]
    result["event_coverage"]=len(result["events"])/max(1,len(box))
    # Stints require regulation, complete starter identities and every
    # substitution to preserve exactly five players per team.
    if any(abs(sum(val(p,"min") for p in played(g,t).values())-240)>2 for t in ts):
        result["reason"]="NONREGULATION_OR_ROUNDED_MINUTES";return result
    on={t:set(map(str,pb.get("starters",{}).get(t,[]))) for t in ts}
    if any(len(on[t])!=5 or any(owners.get(p)!=t for p in on[t]) for t in ts):
        result["reason"]="STARTER_IDENTITY";return result
    start={p for t in ts for p in on[t]};ex=collections.defaultdict(lambda:np.zeros(S))
    prev=0.;nsub=0
    def accrue(now):
        nonlocal prev
        for k in range(8):
            sec=max(0.,min(now,(k+1)*360)-max(prev,k*360))
            if sec:
                for t in ts:
                    for p in on[t]:ex[p][k]+=sec/60
        prev=now
    for event in pb.get("events",[]):
        if len(event)<7:continue
        period,clock,kind,tid,a,b,pts=event[:7];tid=str(tid);a=str(a or "");b=str(b or "")
        if int(period)<1:continue
        if int(period)>4:break
        now=elapsed(period,clock)
        if now<prev-1e-6 or not 0<=now<=2880:
            result["reason"]="CLOCK_ORDER";return result
        accrue(now)
        if kind=="SUB":
            if tid not in on or owners.get(a)!=tid or owners.get(b)!=tid or b not in on[tid] or a in on[tid]:
                result["reason"]="SUBSTITUTION_IDENTITY";return result
            on[tid].remove(b);on[tid].add(a);nsub+=1
        if kind in ("S2","S3","FT","OR","DR","TO") and a in owners and a not in on[owners[a]]:
            result["reason"]="OFF_COURT_ACTION";return result
    if nsub<2:
        result["reason"]="INSUFFICIENT_SUBSTITUTIONS";return result
    accrue(2880.)
    if any(abs(sum(ex[p][:8])-val(q,"min"))>1.5 for p,q in box.items()):
        result["reason"]="INDIVIDUAL_MINUTES";return result
    if any(abs(sum(sum(ex[p][:8]) for p in box if owners[p]==t)-240)>1e-6 for t in ts):
        result["reason"]="TEAM_MINUTES";return result
    finish={p for t in ts for p in on[t]}
    for pid in box:
        ex[pid][8]=float(pid in start);ex[pid][9]=float(pid in finish)
        result["stints"][pid]=ex[pid]
    result["reason"]="VERIFIED"
    return result

class ActionHistory:
    def __init__(self,events):
        self.events=events;self.by=collections.defaultdict(list);self.stints=collections.defaultdict(list)
        self.audit=collections.Counter();self.team=collections.defaultdict(list)
    def add(self,g):
        pb=self.events.get(str(g["game_id"]))
        if pb is None:self.audit["missing_pbp"]+=1;return
        r=extract(g,pb);self.audit["trace_"+r["reason"]]+=1
        self.audit["player_events_verified"]+=len(r["events"]);self.audit["player_stints_verified"]+=len(r["stints"])
        for pid,x in r["events"].items():self.by[pid].append(x)
        for pid,x in r["stints"].items():self.stints[pid].append(x)
        ts=teams(g)
        for t in ts:
            ps=played(g,t);p=[r["events"][pid] for pid in ps if pid in r["events"]]
            if len(p)>=.85*len(ps) and p:
                self.team[t].append(np.sum(p,axis=0))
    def features(self,pid,tid,opp):
        out=[]
        for n in (5,20):
            h=self.by[pid][-n:];s=self.stints[pid][-n:]
            out.extend([len(h),len(s)])
            if h:
                a=np.asarray(h);out.extend((a[:,1:].sum(axis=0)/max(1.,a[:,0].sum())*36).tolist())
                out.extend(np.mean(a[:,1:],axis=0).tolist())
            else:out.extend([np.nan]*(2*E))
            out.extend(np.mean(s,axis=0).tolist() if s else [np.nan]*S)
        for t in (tid,opp):
            h=self.team[t][-15:];out.append(len(h))
            out.extend(np.mean(h,axis=0)[1:].tolist() if h else [np.nan]*E)
        return np.asarray(out,np.float32)
