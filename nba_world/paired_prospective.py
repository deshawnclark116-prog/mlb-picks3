"""Prospective paired comparison at identical archived incumbent targets.

First archive only; no later archive can be chosen by its results. Forecasts
after the independent freeze are separately labeled and excluded from the
strict timing cohort. Unmatched players and unsupported targets are counted.
"""
import argparse,collections,gzip,hashlib,json
from pathlib import Path
from nba_world.data import stamp,MARKETS
from nba_world.prospective import get
from nba_world.prospective_grade import final
from nba_world.evaluate import mean,boot
def compare(frozen,root,fetch=get):
    rows=[];missing=collections.Counter();receipts={};timing=[];pending=[]
    for game in frozen["games"]:
        gid=str(game["game_id"]);tip=stamp(game["tipoff_utc"]);frozen_at=stamp(game["forecast_at_utc"])
        if frozen_at>=tip:raise ValueError("late independent forecast")
        b,receipt=fetch("summary?event="+gid)
        header=(b.get("header",{}).get("competitions") or [{}])[0]
        if str(header.get("id"))!=gid:raise ValueError("wrong final identity")
        box=final(b)
        if box is None:pending.append(gid);continue
        receipts[gid]=receipt
        p=Path(root)/(gid+".json.gz")
        if not p.is_file():missing["completed_without_first_incumbent_archive"]+=1;continue
        with gzip.open(p,"rt") as f:a=json.load(f)["games"]
        if len(a)!=1 or str(a[0]["game_id"])!=gid:raise ValueError("archive identity")
        a=a[0];old_at=stamp(a["forecast_at_utc"])
        if old_at>=tip:missing["late_incumbent_archive"]+=1;continue
        if stamp(a["tipoff_utc"])!=tip:missing["tipoff_mismatch"]+=1;continue
        matched_time=abs((frozen_at-old_at).total_seconds())<=1800
        timing.append({"game":gid,"challenger_utc":game["forecast_at_utc"],"incumbent_utc":a["forecast_at_utc"],
                       "difference_minutes":(frozen_at-old_at).total_seconds()/60,"within_30_minutes":matched_time})
        current={(r["player_id"],r["market"]):r for r in game["rows"]}
        for r in a["rows"]:
            m=r["market"];pid=str(r["player_id"])
            if m not in MARKETS:continue
            target=r.get("whole_projection");cp=r.get("reach_probability")
            if not target or cp is None or int(target)<=0:continue
            k=int(target);x=current.get((pid,m))
            if x is None:missing["incumbent_event_missing_challenger_player"]+=1;continue
            if str(r["team_id"])!=x["team_id"]:missing["team_mismatch"]+=1;continue
            if k>len(x["conditional_reach_1_to_K"]):missing["outside_challenger_threshold_support"]+=1;continue
            p=box.get(pid)
            if p and p["team"]!=x["team_id"]:raise ValueError("final player team mismatch")
            y=p[m] if p else 0;hit=int(p is not None and y>=k)
            old_p=float(cp)*float(r["p_active"]);new_p=float(x["conditional_reach_1_to_K"][k-1])*x["p_active"]
            rows.append({"game":gid,"player":pid,"market":m,"target":k,"hit":hit,"played":p is not None,"y":y,
                "old":float(r["projection"]),"new":x["projection"],"old_p":old_p,"new_p":new_p,
                "common_p":float(x["conditional_reach_1_to_K"][k-1])*float(r["p_active"]),
                "rank":r.get("frontend_rank"),"matched_time":matched_time})
    return rows,dict(missing),pending,receipts,timing
def metrics(rows):
    out={}
    for m in MARKETS:
        rr=[r for r in rows if r["market"]==m];pl=[r for r in rr if r["played"]]
        out[m]={"n":len(rr),"played":len(pl),"mae":{k:mean([abs(r[k]-r["y"]) for r in pl]) for k in ("old","new")},
             "brier":{k:mean([(r[k]-r["hit"])**2 for r in rr]) for k in ("old_p","new_p","common_p")},
             "brier_gain_ci":boot([(r["game"],(r["old_p"]-r["hit"])**2-(r["new_p"]-r["hit"])**2) for r in rr])}
    top={};by=collections.defaultdict(list)
    for r in rows:
        if r["rank"] is not None:by[r["game"]].append(r)
    for n in (4,10):
        top[n]={}
        for k in ("rank","old_p","new_p","common_p"):
            rr=[r for rs in by.values() for r in sorted(rs,key=lambda r:r[k] if k=="rank" else -r[k])[:n]]
            top[n][k]={"n":len(rr),"hits":sum(r["hit"] for r in rr),"rate":mean([r["hit"] for r in rr])}
    return {"market":out,"top":top,"games":len({r["game"] for r in rows}),"rows":len(rows)}
def main():
    a=argparse.ArgumentParser();a.add_argument("--forecast",required=True);a.add_argument("--archive",required=True);a.add_argument("--expected-sha");a.add_argument("--out",required=True);args=a.parse_args()
    raw=Path(args.forecast).read_bytes();sha=hashlib.sha256(raw).hexdigest()
    if args.expected_sha and sha!=args.expected_sha:raise ValueError("frozen forecast hash mismatch")
    d=json.loads(raw)
    if d.get("schema")!="NBA_WORLD_PROSPECTIVE_FIRST_V1":raise ValueError("forecast schema")
    rows,missing,pending,receipts,timing=compare(d,args.archive)
    out={"schema":"NBA_WORLD_PROSPECTIVE_PAIRED_V1","forecast_sha256":sha,"model":d.get("model","BOX_ONLY_V1"),
      "all_pretip":metrics(rows),"strict_30_minute_cohort":metrics([r for r in rows if r["matched_time"]]),
      "missing":missing,"pending":pending,"timing":timing,"final_source_receipts":receipts,
      "warning":"first archived V5 forecast is not guaranteed to equal current market-specific production; 30-minute window not identical information"}
    Path(args.out).write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2),flush=True)
if __name__=="__main__":main()
