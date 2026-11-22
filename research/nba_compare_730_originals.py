#!/usr/bin/env python3
"""Read-only comparison of ORIGINAL as-of NBA model predictions for POR@NYK.
Do not commit outcomes to production artifacts or replace missing predictions.
"""
import collections
import datetime as dt
import gzip
import glob
import json
import math
import os
import urllib.request

GID = "401910024"
TIP = dt.datetime.fromisoformat("2026-11-22T00:30:00+00:00")
CUTOFF = TIP - dt.timedelta(minutes=15)
FIELDS = ("points", "rebounds", "assists", "three_pointers_made")
MARKETS = FIELDS + ("steals", "blocks")
FLOORS = {"points":6, "rebounds":3, "assists":2,"three_pointers_made":1, "steals":1,"blocks":1}
OWNER = {"points":"V5","rebounds":"V3","assists":"V4","three_pointers_made":"V3"}

def read_json(path):
    with (gzip.open(path,"rt") if path.endswith(".gz") else open(path,encoding="utf-8")) as f:
        return json.load(f)

def parse_time(s):
    try:return dt.datetime.fromisoformat(s.replace("Z","+00:00"))
    except Exception:return None

def find_game(document):
    arr=document.get("games",document.get("forecasts",[]))
    found=[g for g in arr if str(g.get("game_id"))==GID]
    return found[0] if found else None

def asof(g):
    return parse_time(g.get("forecast_at_utc") or g.get("predicted_at_utc"))

def safe_game(tag,document):
    g=find_game(document)
    if not g:
        print("SOURCE_MISSING_GAME",tag,document.get("generated_at_utc"))
        return None
    at=asof(g)
    if not at or not at<=CUTOFF or parse_time(g["tipoff_utc"])!=TIP:
        print("SOURCE_INVALID_ASOF",tag,at)
        return None
    print("SOURCE",tag,"generated",document.get("generated_at_utc"),
          "forecast",str(at),"rows",len(g.get("rows",g.get("players",[]))))
    return g

def get_box():
    url="https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event="+GID
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (NBA read-only comparison)"})
    with urllib.request.urlopen(req,timeout=20) as resp:
        summ=json.loads(resp.read())
    comp=summ.get("header",{}).get("competitions",[{}])[0]
    st=comp.get("status",{})
    print("GAME_STATUS="+json.dumps(st,separators=(",",":")))
    result={}
    for team in summ.get("boxscore",{}).get("players",[]):
        for sec in team.get("statistics",[]):
            labels=sec.get("names",[]) or sec.get("labels",[])
            for r in sec.get("athletes",[]):
                a=r.get("athlete") or {}
                ident=str(a.get("id",""))
                d=dict(zip(labels,r.get("stats",[])))
                raw={}
                for m,label in [("points","PTS"),("rebounds","REB"),
                                ("assists","AST"),("three_pointers_made","3PT"),
                                ("steals","STL"),("blocks","BLK")]:
                    try:raw[m]=int(str(d[label]).split("-")[0])
                    except (KeyError,TypeError,ValueError):pass
                record={"id":ident,"name":a.get("displayName") or a.get("fullName"),
                        "stats":raw,"did_not_play":r.get("didNotPlay",False)}
                if ident:result[ident]=record
                if record["name"]:result[record["name"].lower()]=record
    print("BOX_PLAYER_RECORDS",len(result)//2)
    return result,bool(st.get("type",{}).get("completed"))

def match(box,pid,name):
    return box.get(str(pid)) or box.get(str(name).lower())

def whole(v):
    return math.floor(v)+(1 if v%1>=.6 else 0)

def original_predictions(d):
    rows=[]
    for p in d.get("players",[]):
        if p.get("espn_source_reported_injury_status")=="OUT":continue
        for m,mean in (p.get("predictions") or {}).items():
            if m in FIELDS and isinstance(mean,(int,float)) and math.isfinite(mean):
                rows.append({"player":p["player"],"player_id":str(p["player_id"]),
                     "market":m,"mean":mean, "p_active":p.get("p_play_unverified")})
    return rows

def ranked(g,version):
    output=[]
    for r in g["rows"]:
        market=r.get("market")
        if market not in MARKETS or r.get("reported_status")=="OUT":continue
        mean=r.get("mean")
        pa=r.get("p_active")
        if not isinstance(mean,(int,float)) or not math.isfinite(mean) or mean<0 or not isinstance(pa,(int,float)) or pa<.75:continue
        k=whole(mean)
        if k<FLOORS[market]:continue
        cdf=(r.get("cdf_lattice") or {}).get("cdf")
        if not cdf or not len(cdf)>=1:continue
        chance=1-(cdf[k-1] if k-1<len(cdf) else 1)
        basis="conditional_on_playing"
        rp=r.get("reach_probabilities") or {}
        if rp.get("whole_projection")==k and isinstance(rp.get("probability_including_dnp"),(int,float)):
            chance=rp["probability_including_dnp"]
            basis="including_dnp"
        if not math.isfinite(chance) or chance<0 or chance>1:continue
        output.append({"player":r["player"],"player_id":str(r["player_id"]),
           "market":market,"mean":round(mean,3),"threshold":k,"prob":round(chance,4),
           "p_active":round(pa,3),"prob_basis":basis})
    output.sort(key=lambda r:(-r["prob"],-r["p_active"],r["player"],r["market"]))
    print("RANKED_COUNT",version,len(output))
    return output

def score(r,box):
    b=match(box,r["player_id"],r["player"])
    raw=(b or {}).get("stats",{})
    if r["market"] not in raw:
        return {**r,"actual":None,"hit":None,"reason":"NO_OFFICIAL_BOX_STAT"}
    actual=raw[r["market"]]
    return {**r,"actual":actual,"hit":actual>=r["threshold"]}

def print_top(tag,rows,box):
    graded=[score(row,box) for row in rows[:10]]
    for n in [4,10]:
        g=graded[:n]
        yes=sum(x["hit"] is True for x in g)
        scorable=sum(x["hit"] is not None for x in g)
        print("TOP_RESULT",tag,n,"hits",yes,"graded",scorable,"selected",len(g))
    print("TOP10_JSON",tag,json.dumps(graded,separators=(",",":")))

def mean_error(rows,box):
    d={}
    for r in rows:
        b=match(box,r["player_id"],r["player"])
        if not b or r["market"] not in b["stats"]:continue
        key=(r["player_id"],r["market"])
        if key in d:raise RuntimeError("duplicate player market "+repr(key))
        d[key]=(float(r["mean"]),float(b["stats"][r["market"]]))
    return d

def errs(d):
    if not d:return None
    err=[abs(mean-actual) for mean,actual in d.values()]
    return [len(err),round(sum(err)/len(err),4)]

def main():
    with open("/tmp/pretip_v3.json") as f: v3=safe_game("V3",json.load(f))
    with open("/tmp/pretip_v4.json") as f: v4=safe_game("V4",json.load(f))
    v5=safe_game("V5",read_json("/tmp/pretip_v5.json.gz"))
    ind=safe_game("INDEPENDENT",read_json("/tmp/pretip_independent.json"))
    # V2 original forecasts are immutable. Never infer a missing V2 prediction.
    # Scan only historic files already committed at extraction time and reject
    # any target game row captured after the original 15-minute pre-tip cutoff.
    v2_matches=[]
    for file in glob.glob("docs/nba_rolling_predictions/*.json"):
        try:doc=read_json(file)
        except Exception:continue
        g=find_game(doc)
        if not g:continue
        t=asof(g)
        if t and t<=CUTOFF and parse_time(g["tipoff_utc"])==TIP:
            v2_matches.append((t,file,g))
    v2_matches.sort(key=lambda x:x[0])
    v2=(v2_matches[-1][2] if v2_matches else None)
    print("V2_PRETIP_MATCHES",len(v2_matches),
          "latest",v2_matches[-1][1] if v2_matches else "NONE")
    if v2:print("SOURCE V2 forecast",str(asof(v2)),"players",len(v2["players"]))
    box,final=get_box()
    print("IS_FINAL",final)
    if not box:raise RuntimeError("No box score returned; no grading")
    full={}
    for tag,g in [("V3",v3),("V4",v4),("V5",v5)]:
        if not g:continue
        selections=ranked(g,tag)
        print_top(tag,selections,box)
        full[tag]=g["rows"]
    if v3 and v4 and v5:
        specialist=[]
        for market,owner in OWNER.items():
            g={"V3":v3,"V4":v4,"V5":v5}[owner]
            specialist.extend([row for row in ranked(g,owner+"_"+market) if row["market"]==market])
        specialist.sort(key=lambda r:(-r["prob"],-r["p_active"],r["player"],r["market"]))
        print_top("SPECIALIST",specialist,box)
    records={}
    for tag,g in [("V2",v2),("INDEPENDENT",ind)]:
        if g:
            rows=original_predictions(g)
            records[tag]=rows
            print("SOURCE_NUMERIC",tag,len(rows),"examples",json.dumps(rows[:3]))
    for tag,rows in full.items():
        records[tag]=[{"player":r["player"],"player_id":str(r["player_id"]),
                  "market":r["market"],"mean":r["mean"]} for r in rows if r["market"] in FIELDS
                  and r.get("reported_status")!="OUT" and isinstance(r.get("mean"),(int,float))]
    maps={tag:mean_error(rows,box) for tag,rows in records.items()}
    for tag,m in maps.items():
        print("NUMERIC_MAE_ALL",tag,errs(m))
        for market in FIELDS:
            print("NUMERIC_MAE_MARKET",tag,market,errs({k:v for k,v in m.items() if k[1]==market}))
    # Compare versions only on player/market keys everyone actually covered.
    if maps:
        common=set.intersection(*(set(m) for m in maps.values()))
        print("ALL_VERSIONS_COMMON_ROWS",len(common))
        for tag,m in maps.items():
            print("MATCHED_MAE",tag,errs({k:m[k] for k in common}))
    print("END")
if __name__=="__main__":main()
