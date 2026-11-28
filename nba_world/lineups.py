"""Independent NBA daily lineup source, research observations only.

The source can mark bench players Confirmed; only five distinct starting
positions that are active and confirmed qualify. Never infer starters from
a completed game. The public response is not a data-use license.
"""
import datetime as dt,hashlib,json,unicodedata,urllib.request
from zoneinfo import ZoneInfo
from nba_world.data import stamp
URL="https://stats.nba.com/js/data/leaders/00_daily_lineups_{}.json"
POS={"PG","SG","SF","PF","C"}
ALIASES={"GS":"GSW","NY":"NYK","NO":"NOP","SA":"SAS","UTAH":"UTA","WSH":"WAS","BKN":"BKN","BRK":"BKN","PHO":"PHX"}
ET=ZoneInfo("America/New_York")
def norm(s):
    s=unicodedata.normalize("NFKD",str(s)).casefold()
    return "".join(c for c in s if c.isalnum())
def abbr(s):return ALIASES.get(str(s).upper(),str(s).upper())
def fetch(day):
    url=URL.format(day)
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Accept":"application/json","Referer":"https://www.nba.com/players/todays-lineups"})
    with urllib.request.urlopen(req,timeout=15) as r:
        if r.geturl()!=url:raise ValueError("unexpected redirect")
        raw=r.read(2000001)
    if len(raw)>2000000:raise ValueError("oversized feed")
    body=json.loads(raw)
    if not isinstance(body.get("games"),list) or len(body["games"])>30:raise ValueError("lineup schema")
    return body,{"url":url,"observed_at":dt.datetime.now(dt.timezone.utc).isoformat(),"sha256":hashlib.sha256(raw).hexdigest()}
def five(team,roster):
    p=team.get("players")
    if not isinstance(p,list):return [],"ROSTER_MISSING"
    marked=[x for x in p if str(x.get("position","")).upper() in POS]
    if len(marked)!=5 or {str(x["position"]).upper() for x in marked}!=POS:return [],"FIVE_POSITIONS_NOT_POSTED"
    names={}
    for pid,row in roster.items():names.setdefault(norm(row["name"]),[]).append(pid)
    ids=[]
    for x in marked:
        if str(x.get("lineupStatus","")).lower()!="confirmed" or str(x.get("rosterStatus","")).lower()!="active":return [],"POSITIONS_NOT_CONFIRMED"
        name=x.get("playerName") or " ".join((str(x.get("firstName") or ""),str(x.get("lastName") or "")))
        matches=names.get(norm(name),[])
        if len(matches)!=1 or matches[0] in ids:return [],"AMBIGUOUS_PLAYER_ID"
        ids.append(matches[0])
    return ids,"CONFIRMED_FIVE"
def match(game,rosters,body,receipt,asof):
    tip=stamp(game["date"]);observed=stamp(receipt["observed_at"])
    if observed>asof or asof>=tip or (asof-observed)>dt.timedelta(minutes=90):
        return {},"STALE_OR_LATE"
    if tip.astimezone(ET).strftime("%Y%m%d") not in receipt["url"]:return {},"DATE_MISMATCH"
    candidates=[g for g in body["games"] if str(g.get("gameStatus"))=="1" and all(
        abbr(g.get(side+"Team",{}).get("teamAbbreviation"))==abbr(game[side].get("abbr")) for side in ("home","away"))]
    if len(candidates)!=1:return {},"MATCH_NOT_UNIQUE"
    result={}
    for side in ("home","away"):
        t=game[side]["id"];ids,reason=five(candidates[0][side+"Team"],rosters[t])
        result[t]={"starters":ids,"reason":reason}
    return result,"MATCHED"
def collect(schedule,rosters,fetcher=fetch):
    n=dt.datetime.now(dt.timezone.utc);cache={};errors={};out={}
    for game in schedule:
        if not all(game[s]["id"] in rosters for s in ("home","away")):continue
        tip=stamp(game["date"])
        if not 0<(tip-n).total_seconds()<=6*3600:continue
        day=tip.astimezone(ET).strftime("%Y%m%d")
        if day not in cache and day not in errors:
            try:cache[day]=fetcher(day)
            except Exception as e:errors[day]=str(e)
        if day in errors:continue
        body,r=cache[day];teams,reason=match(game,rosters,body,r,dt.datetime.now(dt.timezone.utc))
        out[game["game_id"]]={"teams":teams,"reason":reason,"receipt":r}
    return out,errors
