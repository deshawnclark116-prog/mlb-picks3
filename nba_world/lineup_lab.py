"""Learn conditional roles from historical starting five; no legacy models.

Training uses observed starting fives as a conditional state, not as a
claim that the lineup was known before historical games. Evaluation reports
oracle lineup diagnostic separately; only frozen confirmed pretip evidence
qualifies for deployable evaluation. The oracle arm must never be promoted.
"""
import argparse,collections,datetime as dt,json
from pathlib import Path
import numpy as np
from nba_world.data import read,archives,teams,date,stamp,played,val,MARKETS,KEYS
from nba_world.distribution import RoleState,rows_for
from nba_world.action_lab import Arm,evaluate
from nba_world.reconcile import load,reconcile
def five_from_box(g):
    return {t:{p for p,r in played(g,t).items() if r.get("start")} for t in teams(g)}
def lineup_features(h,pid,t,opp,starts):
    out=[]
    for team in (t,opp):
        known=starts.get(team,set());valid=len(known)==5
        out.extend([float(valid),float(pid in known) if valid else np.nan])
        # Historical resource allocation by known starters, and their
        # difference from historical usual starters, never current stats.
        for stat in ("min","fga","tpa","ast","reb"):
            v=[];usual=[]
            for q in known:
                prev=h.players.get(q,[])[-12:]
                v.append(np.mean([val(p,stat) for _,p in prev]) if prev else 0.)
            for _,ps,_ in h.teams[team][-12:]:
                usual.append(sum(val(p,stat) for p in ps.values() if p.get("start")))
            out.extend([sum(v) if valid else np.nan,sum(v)-np.mean(usual) if valid and usual else np.nan])
        if valid:
            history=h.teams[team][-20:]
            out.append(float(np.mean([len(known&{p for p,r in ps.items() if r.get("start")}) for _,ps,_ in history])) if history else np.nan)
        else:out.append(np.nan)
    return np.array(out,np.float32)
def build(games,ar=None,oracle=False):
    h=RoleState();i=0;out=[];coverage=collections.Counter();ledger=load();conf=[];corr=0
    it=ar if ar is not None else [(g,None,None) for g in games if "2025-11-15"<=date(g).isoformat()<"2026-04-15"]
    for g,a,gr in it:
        d=date(g);gid=str(g["game_id"])
        cutoff=(stamp(a["forecast_at_utc"]).date() if a else d)-dt.timedelta(days=1)
        while i<len(games) and date(games[i])<cutoff:h.add(games[i]);i+=1
        ts=teams(g)
        if a:
            roster={t:[] for t in ts};known={t:set() for t in ts}
            for r in a["rows"]:
                t=str(r.get("team_id"));p=str(r["player_id"])
                if t not in roster:continue
                if r.get("reported_status")!="OUT" and p not in roster[t]:roster[t].append(p)
                # Only explicit confirmed source status qualifies, never
                # inferred p_start or actual starters.
                if r.get("starter_evidence") in ("CONFIRMED","CONFIRMED_STARTER") and r.get("p_start")==1:
                    known[t].add(p)
            starts=five_from_box(g) if oracle else known
            starts={t:s for t,s in starts.items() if len(s)==5 and s<=set(roster[t])}
        else:
            roster={t:h.roster(t) for t in ts};starts=five_from_box(g)
            # Learn conditional relationships in actual lineup situations.
            # Mask entire team state deterministically on 25% of games to
            # expose the model to missing lineup evidence.
            starts={t:s for t,s in starts.items() if len(s)==5 and s<=set(roster[t]) and int(gid[-3:])%4!=0}
        coverage["games"]+=1;coverage["known_teams"]+=len(starts)
        owner={p:t for t,ps in roster.items() for p in ps}
        features=rows_for(g,h,roster);r={}
        for pid,(f,active,y,mn) in features.items():
            t=owner[pid];extra=lineup_features(h,pid,t,ts[1-ts.index(t)],starts)
            r[pid]={"f":np.r_[f,extra],"k":len(f),"active":active,"y":y,"minutes":mn,
                    "date":d.isoformat(),"known":t in starts}
        if not gr:out.extend(r.values());continue
        for row in gr["rows"]:
            pid=str(row["player_id"]);m=row["market"]
            if m not in MARKETS or pid not in r:continue
            x=r[pid];j=MARKETS.index(m);y=float(x["y"][j])
            ok,y,c=reconcile(ledger,gid,pid,m,y,row.get("actual"),x["active"],bool(row["played"]))
            corr+=int(c)
            if not ok:conf.append([gid,pid,m]);continue
            out.append({**x,"y":y,"game":gid,"pid":pid,"market":m,"base":float(row["projection"]),
               "base_active":float(row["p_active"]),"base_minutes":row.get("minutes_forecast"),
               "rank":row.get("frontend_rank"),"target":row.get("whole_projection"),"cp":row.get("reach_probability")})
    return out,dict(coverage),conf,corr
def main():
    p=argparse.ArgumentParser();p.add_argument("--games",action="append",required=True)
    p.add_argument("--archive",required=True);p.add_argument("--grades",required=True);p.add_argument("--out",required=True);a=p.parse_args()
    games=read(a.games);rows,c,_,_=build(games)
    tr=[r for r in rows if r["date"]<"2026-03-01"];ca=[r for r in rows if r["date"]>="2026-03-01"]
    if len(tr)<5000 or len(ca)<1000:raise ValueError("insufficient history")
    arms={n:Arm(tr,ca,flag) for n,flag in (("box",False),("actions",True))}
    ar,skip=archives(games,a.archive,a.grades,"2026-11-01")
    live,lc,conf,corr=build(games,ar,False);oracle,oc,_,_=build(games,ar,True)
    # action_lab.evaluate labels augmented head actions; here that head
    # contains ONLY lineup conditional state. Explicit metadata prevents
    # conflation with the prior play-by-play experiment.
    metrics={"strict_archived_pretip":evaluate(live,arms),"oracle_actual_lineups_DIAGNOSTIC_ONLY":evaluate(oracle,arms)}
    result={"schema":"NBA_WORLD_LINEUP_CONDITIONAL_V1","promotion_allowed":False,"production_changed":False,
        "training_rows":len(tr),"calibration_rows":len(ca),"training_coverage":c,"archived_pretip_coverage":lc,
        "oracle_coverage":oc,"verified_corrections":corr,"conflicts":conf,"metrics":metrics,"skips":skip,
        "head_labels":{"box":"unconditioned","actions":"lineup-conditioned"},
        "limitations":["actual historical starter labels are conditional training state, not certified pretip",
            "oracle diagnostic cannot be deployed or used as evidence of pregame accuracy",
            "archive confirmation requires explicit source status and exact starter probability; may have zero coverage",
            "no injuries or post-tip results are supplied as predictive inputs in strict cohort"]}
    Path(a.out).write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True)
if __name__=="__main__":main()
