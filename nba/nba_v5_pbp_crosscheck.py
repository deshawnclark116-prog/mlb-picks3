"""Independent NBA V5 PBP possession/lineup cross-check from authorized exports.

Accepts normalized game aggregates derived from pbpstats (open-source).
Never pretends an ESPN event is optical tracking or a Synergy play type.
A discrepancy is a QA flag, never an automatic correction to historical
model inputs. No external network requests or NBA.com bulk downloads.
"""
from __future__ import annotations
import argparse
import gzip
import json
from pathlib import Path

def read_lines(path):
    op=gzip.open if str(path).endswith(".gz") else open
    with op(path,"rt",encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                yield json.loads(line)

def inspect(es, independent, *, poss_tolerance=7.0, score_tolerance=0):
    expected={str(x["game_id"]):x for x in independent}
    seen=set()
    result=[]
    for g in es:
        gid=str(g["game_id"])
        if gid in seen: raise ValueError("duplicate ESPN game "+gid)
        seen.add(gid)
        ref=expected.get(gid)
        if ref is None:
            result.append({"game_id":gid,"status":"NO_INDEPENDENT_REFERENCE"})
            continue
        if ref.get("source")!="pbpstats" or not ref.get("source_observed_at_utc"):
            raise ValueError("independent provenance required "+gid)
        if str(ref.get("home_team_id"))!=str(g["home"]) or str(ref.get("away_team_id"))!=str(g["away"]):
            result.append({"game_id":gid,"status":"TEAM_ID_MISMATCH"})
            continue
        # An ESPN box/PBP possession proxy is not a verified possession count.
        # We deliberately report both and never silently assert equivalence.
        events=g.get("events",[])
        own={"home":0,"away":0}
        score={"home":0,"away":0}
        for ev in events:
            if len(ev)<7 or ev[2] not in ("S2","S3","FT"):continue
            side="home" if str(ev[3])==str(g["home"]) else "away" if str(ev[3])==str(g["away"]) else None
            if side is not None:
                score[side]+=int(ev[6])
        for side in ("home","away"):
            v=ref.get(side+"_points")
            if v is not None and (not isinstance(v,int) or v<0):
                raise ValueError("bad reference score")
        score_diff={side:score[side]-int(ref[side+"_points"]) for side in ("home","away") if ref.get(side+"_points") is not None}
        result.append({"game_id":gid,
            "status":"SCORE_MISMATCH" if any(abs(x)>score_tolerance for x in score_diff.values()) else "SCORE_MATCH",
            "espn_score":score,"reference_score":{side:ref.get(side+"_points") for side in ("home","away")},
            "score_delta":score_diff,
            "reference_possessions":{side:ref.get(side+"_possessions") for side in ("home","away")},
            "note":"PBP possession counts and event-score agreement are separate; no auto-repair"})
    return {"schema":"NBA_V5_PBP_INDEPENDENT_QA_V1","games":len(seen),
            "reference_games":len(expected),"matched":sum(x["status"]=="SCORE_MATCH" for x in result),
            "mismatched":sum(x["status"] in ("SCORE_MISMATCH","TEAM_ID_MISMATCH") for x in result),
            "missing":sum(x["status"]=="NO_INDEPENDENT_REFERENCE" for x in result),
            "results":result}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--espn",required=True,action="append")
    p.add_argument("--independent",required=True)
    p.add_argument("--out",required=True)
    a=p.parse_args()
    es=(row for path in a.espn for row in read_lines(path))
    report=inspect(es,read_lines(a.independent))
    Path(a.out).write_text(json.dumps(report,indent=2)+"\n")
    print("NBA_V5_INDEPENDENT_PBP_QA",json.dumps({k:v for k,v in report.items() if k!="results"}))
if __name__=="__main__":
    main()
