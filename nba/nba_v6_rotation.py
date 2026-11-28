"""Historical coaching/lineup exposures. No target-game PBP enters features."""
from collections import defaultdict, Counter
import gzip, json, math
import numpy as np
from nba.nba_v5_lineup_pairs import replay_game

def load_pbp(paths):
    data={}
    for path in paths:
        with (gzip.open(path,"rt") if str(path).endswith(".gz") else open(path)) as f:
            for line in f:
                if line.strip():
                    g=json.loads(line); data[str(g["game_id"])]=g
    return data

def stints(pb):
    teams=(str(pb["home"]),str(pb["away"]))
    on={t:set(map(str,pb["starters"][t])) for t in teams}
    vec=defaultdict(lambda:np.zeros(8)); last=0.
    def accrue(now):
        nonlocal last
        for k in range(8):
            elapsed=max(0.,min(now,(k+1)*360.)-max(last,k*360.))/60.
            if elapsed:
                for t in teams:
                    for p in on[t]: vec[(t,p)][k]+=elapsed
        last=now
    for e in pb["events"]:
        period,clock,kind,tid,a,b=e[:6]
        if period<1:continue
        if period>4:break
        now=(period-1)*720+720-float(clock)
        accrue(now)
        if kind=="SUB":
            t=str(tid); on[t].remove(str(b)); on[t].add(str(a))
    accrue(2880.)
    return vec

class RotationHistory:
    def __init__(self,pbp):
        self.pbp=pbp or {}; self.team=defaultdict(list); self.audit=Counter()
    def ingest(self,g):
        gid=str(g["game_id"]); pb=self.pbp.get(gid)
        if pb is None:self.audit["missing_pbp"]+=1; return
        teams=(str(g["home"]["id"]),str(g["away"]["id"]))
        if (str(pb["home"]),str(pb["away"]))!=teams:
            self.audit["team_mismatch"]+=1;return
        box={(str(p["team"]),str(p["id"])):float(p["min"]) for p in g["players"] if float(p["min"])>0}
        # Exclude overtime from the regulation-only trace reconciliation.
        if any(abs(sum(v for (tt,_),v in box.items() if tt==t)-240)>1.5 for t in teams):
            self.audit["nonregulation_or_box_minutes"]+=1;return
        result=replay_game(pb)
        if not result["valid"]:
            self.audit["trace_"+result["reason"]]+=1;return
        trace={k:v[0] for k,v in result["player"].items()}
        if any(abs(trace.get(k,0)-box.get(k,0))>1.5 for k in set(trace)|set(box)):
            self.audit["individual_minutes_mismatch"]+=1;return
        vectors=stints(pb)
        if any(abs(sum(vectors[k])-trace[k])>.01 for k in trace):
            self.audit["stint_minutes_mismatch"]+=1;return
        for t in teams:
            players={p:v for (tt,p),v in result["player"].items() if tt==t and v[0]>0}
            pair={(p,q):v for (tt,p,q),v in result["pair"].items() if tt==t}
            self.team[t].append((players,pair,{p:vectors[t,p] for p in players}))
        self.audit["verified_games"]+=1
    def features(self,pid,team,roster):
        past=self.team[team][-35:]; current=set(roster)
        x=[len(past)]
        for n in (5,20,35):
            games=past[-n:]; played=[(p,q,v) for p,q,v in games if pid in p]
            x.extend([len(played),len(played)/max(1,len(games))])
            if not played:
                x.extend([np.nan]*20);continue
            # Role profile and closest historical teammate compositions.
            role=np.mean([v[pid] for p,q,v in played],axis=0)
            x.extend(role.tolist())
            weights=[]; obs=[]; absent=[]; together=[]
            for p,q,v in played:
                observed=set(p); overlap=len(observed & current)/max(1,len(observed|current))
                w=math.exp(4*(overlap-1))
                weights.append(w); obs.append(p[pid])
                absent.append(sum(p[j][0] for j in observed-current))
                together.append(sum(q.get((pid,j),[0])[0] for j in current if j!=pid))
            obs=np.asarray(obs); w=np.asarray(weights); w/=w.sum()
            x.extend(np.average(obs,axis=0,weights=w).tolist())
            x.extend([float(np.std(obs[:,0])),float(np.mean(absent)),float(np.dot(w,absent)),
                      float(np.mean(together)),float(np.dot(w,together)),float(1/(w@w)),float(role[-1])])
        return x
