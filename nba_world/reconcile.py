"""Read-only adjudication of verified final-score corrections."""
import json
from pathlib import Path
def load():
    p=Path(__file__).resolve().parents[1]/"docs/nba_world/verified_grade_corrections.json"
    d=json.loads(p.read_text())
    return {(str(r["game"]),str(r["player"]),r["market"]):r for r in d["raw_source_audit"]["conflicts"] if r["decision"]=="GRADE_CONFIRMED"}
def reconcile(ledger,gid,pid,market,box,grade,box_played,grade_played):
    if box_played==grade_played and (not box_played or box==grade):return True,box,False
    r=ledger.get((str(gid),str(pid),market))
    if (r and box_played==grade_played==True and r["box"]==box and r["grade"]==grade and r["fresh_actual"]==grade):
        return True,float(grade),True
    return False,box,False
