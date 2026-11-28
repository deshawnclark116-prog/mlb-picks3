"""Independent completed-box refresh; never retrieve target game outcomes.

Only past dates strictly before the predeclared conservative cutoff are
eligible. Source failures are recorded; incomplete boxes never silently
replace a valid historical record.
"""
import concurrent.futures,datetime as dt,math
from nba_world.data import date,stamp
from nba_world.prospective import get

def parse_minutes(s):
    parts=str(s).split(":")
    if len(parts)==2:
        a,b=map(float,parts)
        if a<0 or not 0<=b<60:raise ValueError("bad minutes")
        return a+b/60
    if len(parts)!=1:raise ValueError("bad minutes")
    n=float(parts[0])
    if not math.isfinite(n) or n<0:raise ValueError("bad minutes")
    return n
def stat(s):
    x=float(s)
    if not math.isfinite(x) or x<0 or x!=int(x):raise ValueError("bad stat")
    return int(x)
def pair(s):
    a,b=map(stat,str(s).split("-"))
    if a>b:raise ValueError("makes exceed attempts")
    return a,b
def complete_box(event,body):
    comp=(body.get("header",{}).get("competitions") or [{}])[0]
    status=comp.get("status",{}).get("type",{})
    if status.get("name")!="STATUS_FINAL" or not status.get("completed"):raise ValueError("summary not final")
    if str(comp.get("id"))!=str(event["id"]):raise ValueError("game identity")
    sc=(event.get("competitions") or [{}])[0]
    sides={x["homeAway"]:{"id":str(x["team"]["id"]),"score":stat(x["score"])} for x in sc.get("competitors",[])}
    if set(sides)!={"home","away"} or len({t["id"] for t in sides.values()})!=2:raise ValueError("team identities")
    if sides["home"]["score"]==sides["away"]["score"]:raise ValueError("tied final")
    gid=str(event["id"]);g={"game_id":gid,"date":stamp(event["date"]).isoformat(),**sides,"players":[]}
    ids={v["id"]:k for k,v in sides.items()};seen=set()
    mapping={"pts":"PTS","reb":"REB","ast":"AST","oreb":"OREB","dreb":"DREB","tov":"TO","stl":"STL","blk":"BLK","pf":"PF"}
    required={"MIN","FG","3PT","FT",*mapping.values()}
    for t in body.get("boxscore",{}).get("players",[]):
        tid=str(t.get("team",{}).get("id"))
        if tid not in ids:raise ValueError("unmatched box team")
        for group in t.get("statistics",[]):
            labels=[str(x).upper() for x in group.get("labels",[])]
            if not required<=set(labels):continue
            for a in group.get("athletes",[]):
                if a.get("didNotPlay"):continue
                vals=a.get("stats",[])
                if len(vals)!=len(labels):continue
                s=dict(zip(labels,vals));mn=parse_minutes(s["MIN"])
                if mn<=0:continue
                pid=str(a.get("athlete",{}).get("id") or "")
                if not pid.isdigit() or pid in seen:raise ValueError("duplicate or invalid player")
                seen.add(pid)
                p={"id":pid,"team":tid,"side":ids[tid],"min":mn,"start":bool(a.get("starter"))}
                for k,v in mapping.items():p[k]=stat(s[v])
                p["fgm"],p["fga"]=pair(s["FG"]);p["tpm"],p["tpa"]=pair(s["3PT"]);p["ftm"],p["fta"]=pair(s["FT"])
                if p["pts"]!=2*p["fgm"]+p["tpm"]+p["ftm"] or p["reb"]!=p["oreb"]+p["dreb"]:raise ValueError("stat identities")
                g["players"].append(p)
    for side,t in sides.items():
        rows=[p for p in g["players"] if p["team"]==t["id"]];mn=sum(p["min"] for p in rows)
        if len(rows)<5 or sum(p["pts"] for p in rows)!=t["score"]:raise ValueError("score reconciliation")
        if min(abs(mn-240-25*k) for k in range(6))>9:raise ValueError("team minute reconciliation")
    return g

def refresh(games,cutoff,days=5):
    by={str(g["game_id"]):g for g in games};receipts=[];errors={};events={}
    # Calendar days in US Eastern differ from the UTC cutoff; validate every
    # individual event timestamp and leave a full buffer, even across midnight.
    for i in range(days,0,-1):
        d=cutoff-dt.timedelta(days=i)
        try:
            b,r=get("scoreboard?dates="+d.strftime("%Y%m%d")+"&limit=100")
            receipts.append(r)
            for e in b.get("events",[]):
                gid=str(e["id"])
                if stamp(e["date"]).date()>=cutoff:continue
                if str(e.get("season",{}).get("type"))!="2":continue
                if e.get("status",{}).get("type",{}).get("name")!="STATUS_FINAL":continue
                events[gid]=e
        except Exception as exc:errors[d.isoformat()]=str(exc)
    def fetch(e):
        b,r=get("summary?event="+str(e["id"]));return complete_box(e,b),r
    added=0;replaced=0
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        jobs={pool.submit(fetch,e):gid for gid,e in events.items()}
        for job in concurrent.futures.as_completed(jobs):
            gid=jobs[job]
            try:
                g,r=job.result();receipts.append(r)
                if gid in by:replaced+=1
                else:added+=1
                by[gid]=g
            except Exception as exc:errors[gid]=str(exc)
    audit={"cutoff_exclusive":cutoff.isoformat(),"days_requested":days,"final_events":len(events),
           "new_games":added,"revalidated_existing_games":replaced,"failures":errors,"receipts":receipts}
    return sorted(by.values(),key=lambda g:(date(g),str(g["game_id"]))),audit
