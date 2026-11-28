"""Grade a preserved prospective artifact against final outcomes only."""
import argparse,collections,hashlib,json
from pathlib import Path
from nba_world.prospective import get
from nba_world.data import stamp,MARKETS
from nba_world.evaluate import mean
LABEL={"points":"PTS","rebounds":"REB","assists":"AST","three_pointers_made":"3PT"}
def final(body):
    comp=(body.get("header",{}).get("competitions") or [{}])[0]
    status=comp.get("status",{}).get("type",{})
    if not status.get("completed") or status.get("name")!="STATUS_FINAL":return None
    out={}
    for team in body.get("boxscore",{}).get("players",[]):
        t=str(team.get("team",{}).get("id"))
        for g in team.get("statistics",[]):
            labels=[str(x).upper() for x in g.get("labels",[])]
            if not set(["MIN","PTS","REB","AST","3PT"])<=set(labels):continue
            for a in g.get("athletes",[]):
                if a.get("didNotPlay"):continue
                vals=a.get("stats",[])
                if len(vals)!=len(labels):continue
                s=dict(zip(labels,vals))
                parts=str(s["MIN"]).split(":")
                try:mn=float(parts[0])+(float(parts[1])/60 if len(parts)>1 else 0)
                except ValueError:continue
                if mn<=0:continue
                pid=str(a.get("athlete",{}).get("id") or "")
                if not pid:raise ValueError("missing identity")
                if pid in out:raise ValueError("duplicate identity")
                out[pid]={"team":t,"minutes":mn,**{m:int(str(s[k]).split("-")[0]) for m,k in LABEL.items()}}
    if len(out)<10:raise ValueError("incomplete final box")
    return out
def main():
    p=argparse.ArgumentParser();p.add_argument("--forecast",required=True);p.add_argument("--out",required=True);a=p.parse_args()
    raw=Path(a.forecast).read_bytes();d=json.loads(raw)
    if d.get("schema")!="NBA_WORLD_PROSPECTIVE_FIRST_V1":raise ValueError("unexpected schema")
    rows=[];pending=[];receipts={}
    for g in d["games"]:
        gid=g["game_id"];tip=stamp(g["tipoff_utc"])
        if stamp(g["forecast_at_utc"])>=tip:raise ValueError("late prediction")
        b,r=get("summary?event="+gid);box=final(b)
        if box is None:pending.append(gid);continue
        receipts[gid]=r
        for p in g["rows"]:
            pid=p["player_id"];m=p["market"];v=box.get(pid)
            if v and v["team"]!=p["team_id"]:raise ValueError("final team mismatch")
            y=v[m] if v else 0;played=v is not None;k=p["own_target"];q=p["own_target_probability"]
            rows.append({"game":gid,"player":pid,"market":m,"played":played,"actual":y,
                         "projection":p["projection"],"p_active":p["p_active"],"target":k,"p":q,
                         "hit":int(played and y>=k) if k>0 else None,"rank":p.get("rank")})
    metrics={}
    for m in MARKETS:
        r=[x for x in rows if x["market"]==m];pl=[x for x in r if x["played"]];ft=[x for x in r if x["p"] is not None]
        metrics[m]={"n":len(r),"played":len(pl),"mae":mean([abs(x["projection"]-x["actual"]) for x in pl]),
                    "own_target_brier":mean([(x["p"]-x["hit"])**2 for x in ft]),
                    "availability_brier":mean([(x["p_active"]-int(x["played"]))**2 for x in r])}
    top={}
    for k in (4,10):
        sel=[x for x in rows if x["rank"] is not None and x["rank"]<=k]
        top[k]={"n":len(sel),"hits":sum(x["hit"] for x in sel),"rate":mean([x["hit"] for x in sel]),
                "mean_target":mean([x["target"] for x in sel])}
    out={"schema":"NBA_WORLD_PROSPECTIVE_GRADE_V1","forecast_sha256":hashlib.sha256(raw).hexdigest(),"pending":pending,
         "receipts":receipts,"metrics":metrics,"top_own_target":top,"rows":rows,
         "comparison_warning":"own targets must not be compared to different target hit rates"}
    Path(a.out).write_text(json.dumps(out,indent=2));print(json.dumps({"metrics":metrics,"top":top,"pending":pending}),flush=True)
if __name__=="__main__":main()
