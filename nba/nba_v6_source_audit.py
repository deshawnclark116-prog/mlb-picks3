"""Read-only audit of historical box/grade differences, against fresh ESPN finals."""
import argparse, collections, concurrent.futures, datetime as dt, hashlib, json
from pathlib import Path
from nba.nba_v6_foundation import read_games, CORE
from nba.nba_v5_postmortem import ESPN, get, parse_final, STAT_KEY
from nba.nba_v4_dataset import minutes

def fresh(gid):
    raw=get(ESPN+gid)
    if not raw:return {"status":"SOURCE_UNAVAILABLE"}
    final=parse_final(raw)
    if not final:return {"status":"NOT_FINAL"}
    # Parse seconds rather than the original grader's whole-minute conversion.
    precise={}
    for t in raw.get("boxscore",{}).get("players",[]):
        for grp in t.get("statistics",[]):
            labels=[str(x).upper() for x in grp.get("labels",[])]
            if "MIN" not in labels:continue
            for a in grp.get("athletes",[]):
                vals=a.get("stats")
                if not vals or len(vals)!=len(labels):continue
                pid=str(a.get("athlete",{}).get("id",""))
                if pid:precise[pid]=minutes(dict(zip(labels,vals))["MIN"])
    return {"status":"VERIFIED_FINAL","players":final["players"],"minutes":precise,
            "sha256":hashlib.sha256(json.dumps(raw,sort_keys=True,separators=(",",":")).encode()).hexdigest(),
            "captured":dt.datetime.now(dt.timezone.utc).isoformat(),"url":ESPN+gid}
def main():
    a=argparse.ArgumentParser()
    a.add_argument("--games",action="append",required=True);a.add_argument("--grades",required=True);a.add_argument("--out",required=True)
    args=a.parse_args()
    boxes={str(g["game_id"]):g for g in read_games(args.games)}
    conflicts=[];total=0;minutes_conflicts=[]
    for path in sorted(Path(args.grades).glob("*.json")):
        g=json.loads(path.read_text());gid=str(g["game_id"])
        if gid not in boxes:continue
        b={str(p["id"]):p for p in boxes[gid]["players"]}
        for r in g["rows"]:
            m=r["market"];pid=str(r["player_id"])
            if m not in CORE:continue
            p=b.get(pid); bp=bool(p and float(p["min"])>0); gp=bool(r["played"])
            total+=1
            if bp!=gp or (bp and float(p[CORE[m]])!=float(r["actual"])):
                conflicts.append({"game":gid,"player":pid,"market":m,"box_played":bp,"grade_played":gp,
                    "box":p[CORE[m]] if bp else None,"grade":r["actual"] if gp else None})
            if bp and gp and m=="points" and r.get("minutes_actual") is not None and abs(float(p["min"])-float(r["minutes_actual"]))>.05:
                minutes_conflicts.append({"game":gid,"player":pid,"box_minutes":p["min"],"grade_minutes":r["minutes_actual"]})
    ids=sorted({r["game"] for r in conflicts})
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        source=dict(zip(ids,pool.map(fresh,ids)))
    decisions=collections.Counter()
    for r in conflicts:
        s=source[r["game"]];p=s.get("players",{}).get(r["player"])
        if s["status"]!="VERIFIED_FINAL":choice="UNRESOLVED"
        else:
            y=p[STAT_KEY[r["market"]]] if p else None
            r["fresh_actual"]=y
            choice="BOX_CONFIRMED" if y==r["box"] else "GRADE_CONFIRMED" if y==r["grade"] else "BOTH_STALE"
        r["decision"]=choice;decisions[choice]+=1
    report={"schema":"NBA_V6_SOURCE_RECONCILIATION_V1","production_changed":False,"original_archives_unchanged":True,
        "n_checked":total,"n_conflicts":len(conflicts),"decisions":dict(decisions),
        "conflicts":conflicts,"n_minutes_differences":len(minutes_conflicts),"minutes_examples":minutes_conflicts[:25],
        "fresh_sources":{gid:{k:v for k,v in s.items() if k not in ("players","minutes")} for gid,s in source.items()}}
    Path(args.out).write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
if __name__=="__main__":main()
