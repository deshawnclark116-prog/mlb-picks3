"""Independent, timestamped ESPN injury observations for research.

Source labels are not official game-specific availability or certified starters.
No inference of health from report absence. Fresh OUT observations can trigger
a separate abstention policy; no invented probability multipliers.
"""
import datetime as dt,re
from nba_world.data import stamp
from nba_world.prospective import get,now
STATUS={"OUT":"OUT","DOUBTFUL":"DOUBTFUL","QUESTIONABLE":"QUESTIONABLE","PROBABLE":"PROBABLE",
        "DAY-TO-DAY":"DAY_TO_DAY","DAY TO DAY":"DAY_TO_DAY","DTD":"DAY_TO_DAY"}
def identity(athlete):
    pid=str(athlete.get("id") or "")
    if pid.isdigit():return pid
    found=set()
    for l in athlete.get("links") or []:
        u=str(l.get("href") or "")
        for pattern in (r"/id/(\d+)(?:/|$)",r"~a:(\d+)(?:[/?&]|$)"):
            m=re.search(pattern,u)
            if m:found.add(m.group(1))
    return next(iter(found)) if len(found)==1 else None
def parse(body,receipt):
    capture=stamp(receipt["observed_at"]);groups=body.get("injuries")
    if not isinstance(groups,list):raise ValueError("missing injury collection")
    result={};bad=[];duplicates=set()
    for i,g in enumerate(groups):
        if not isinstance(g,dict):bad.append({"group":i,"reason":"bad group"});continue
        parent=str(g.get("id") or (g.get("team") or {}).get("id") or "")
        items=g.get("injuries")
        if not isinstance(items,list):items=[g];parent=""
        for j,x in enumerate(items):
            if not isinstance(x,dict):bad.append({"group":i,"entry":j,"reason":"bad entry"});continue
            t=str((x.get("team") or {}).get("id") or parent)
            p=identity(x.get("athlete") or {})
            if not t.isdigit() or not 1<=int(t)<=30 or not p:
                bad.append({"group":i,"entry":j,"reason":"unverified identity"});continue
            raw=str(x.get("status") or "").strip().upper();status=STATUS.get(raw,"UNKNOWN")
            d=x.get("date");age=None
            if d:
                try:
                    event=stamp(d);age=(capture-event).total_seconds()/3600
                    if age<0:raise ValueError("future")
                except Exception:
                    bad.append({"group":i,"entry":j,"reason":"bad/future report date"});continue
            key=(t,p)
            if key in result:
                duplicates.add(key);continue
            result[key]={"team_id":t,"player_id":p,"status":status,"original_status":raw,
                         "entry_date":d,"entry_age_hours":age,
                         "game_specific_certified":False,"official_active_certified":False}
    for t,p in duplicates:
        result.pop((t,p),None);bad.append({"team":t,"player":p,"reason":"duplicate status quarantined"})
    return {"receipt":receipt,"observations":list(result.values()),"quarantined":bad,
            "absence_means_active":False,"source":"ESPN_REPORTED_NOT_OFFICIAL_GAME_STATUS"}
def capture():
    body,r=get("injuries")
    return parse(body,r)
def gate(observation,freeze,tip):
    """Conservative eligibility only. Never alter a learned forecast value.

    Source entry freshness is separate from fetch freshness. OUT may refer to
    an earlier game; only recent dated entries trigger the research policy.
    """
    if not observation:return "UNREPORTED"
    r=observation["row"];captured=stamp(observation["captured"])
    if captured>freeze or freeze>=tip or (freeze-captured)>dt.timedelta(hours=1):return "SOURCE_STALE"
    age=r.get("entry_age_hours")
    if age is None or age<0 or age>36:return "ENTRY_STALE_OR_UNDATED"
    if r["status"] in ("OUT","DOUBTFUL"):return "ABSTAIN_REPORTED_"+r["status"]
    return "REPORTED_"+r["status"]
def annotate(game,snapshot):
    f=stamp(game["forecast_at_utc"]);tip=stamp(game["tipoff_utc"])
    by={(x["team_id"],x["player_id"]):x for x in snapshot.get("observations",[])}
    captured=snapshot.get("receipt",{}).get("observed_at")
    for r in game["rows"]:
        row=by.get((r["team_id"],r["player_id"]))
        decision=gate({"row":row,"captured":captured} if row and captured else None,f,tip)
        r["injury_research_gate"]=decision
        r["injury_report_observation"]=row
        r["injury_gated_candidate"]=bool(r["candidate"] and not decision.startswith("ABSTAIN_"))
    eligible=sorted([r for r in game["rows"] if r["injury_gated_candidate"]],
                    key=lambda r:(-r["own_target_probability"],r["player_id"],r["market"]))
    for j,r in enumerate(eligible,1):r["injury_gated_rank"]=j
    game["injury_source_receipt"]=snapshot.get("receipt")
    game["injury_source_error"]=snapshot.get("error")
    return game
