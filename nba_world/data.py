"""Clean-room raw box-score ingestion and as-of example generation.

No legacy NBA model, profile, rotation, probability, or feature code is imported.
Historical eligible rosters are approximated from prior participation; an
anonymous reserve absorbs players outside that roster, never an invented name.
"""
import collections, datetime as dt, gzip, itertools, json
from pathlib import Path
import numpy as np

MARKETS=("points","rebounds","assists","three_pointers_made")
KEYS=("pts","reb","ast","tpm")
# outcome: active, minutes, 2PA, 3PA, FTA, 2PM, 3PM, FTM, ORB, DRB, AST
OUT=11
N=24
L=12
F=17
C=13
def stamp(s):return dt.datetime.fromisoformat(str(s).replace("Z","+00:00")).astimezone(dt.timezone.utc)
def date(g):return stamp(g["date"]).date()
def val(p,k):return max(0.,float(p.get(k,0) or 0))
def outcome(p):
    mn=val(p,"min")
    return np.array([float(mn>0),mn,max(0,val(p,"fga")-val(p,"tpa")),val(p,"tpa"),val(p,"fta"),
        max(0,val(p,"fgm")-val(p,"tpm")),val(p,"tpm"),val(p,"ftm"),val(p,"oreb"),val(p,"dreb"),val(p,"ast")],np.float32)
def read(paths):
    games={}
    for p in paths:
        with (gzip.open(p,"rt") if str(p).endswith(".gz") else open(p)) as fh:
            for line in fh:
                if line.strip():
                    g=json.loads(line);games[str(g["game_id"])]=g
    return sorted(games.values(),key=lambda g:(date(g),str(g["game_id"])))
def teams(g):return tuple(str(g[s]["id"]) for s in ("away","home"))
def played(g,t):return {str(p["id"]):p for p in g["players"] if str(p["team"])==t and val(p,"min")>0}
def summary(g,t):
    p=list(played(g,t).values())
    opp=next(x for x in teams(g) if x!=t)
    q=list(played(g,opp).values())
    s=lambda rows,k:sum(val(r,k) for r in rows)
    return np.array([s(p,"fga")/90,s(p,"tpa")/40,s(p,"fta")/25,s(p,"pts")/115,s(p,"reb")/45,s(p,"ast")/27,
          s(q,"fga")/90,s(q,"tpa")/40,s(q,"fta")/25,s(q,"pts")/115,s(q,"reb")/45,s(q,"ast")/27,
          (s(p,"fga")+.44*s(p,"fta")-s(p,"oreb")+s(p,"tov"))/100],np.float32)
class History:
    def __init__(self):
        self.players=collections.defaultdict(list);self.teams=collections.defaultdict(list)
    def add(self,g):
        for t in teams(g):
            rows=played(g,t);self.teams[t].append((g,rows,summary(g,t)))
            for pid,p in rows.items():self.players[pid].append((g,p))
    def roster(self,t):
        h=self.teams[t][-8:];rank={}
        for i,(_,p,_) in enumerate(reversed(h)):
            for pid,row in p.items():
                if pid not in rank:rank[pid]=(i,-val(row,"min"),pid)
        return sorted(rank,key=rank.get)[:N-1]
    def sequence(self,pid,t,d):
        h=self.players.get(pid,[])[-L:];seq=np.zeros((L,F),np.float32)
        for i,(g,p) in enumerate(h,L-len(h)):
            o=outcome(p)
            seq[i]=[1,o[1]/48,o[2]/20,o[3]/12,o[4]/10,o[5]/12,o[6]/7,o[7]/8,
                o[8]/6,o[9]/12,o[10]/12,val(p,"tov")/6,val(p,"pf")/6,
                float(bool(p.get("start"))),float(str(p["team"])==t),
                min(90,(d-date(g)).days)/30, float(str(p["side"])=="home")]
        th=self.teams[t][-12:]
        seen=sum(pid in ps for _,ps,_ in th)
        tm=[val(ps[pid],"min") for _,ps,_ in th if pid in ps]
        last=next((i for i,(_,ps,_) in enumerate(reversed(th)) if pid in ps),12)
        extra=[len(h)/L,seen/12, np.mean(tm)/48 if tm else 0,last/12,
               float(bool(h)),float(bool(h) and str(h[-1][1]["team"])==t),0.]
        recent=[outcome(p) for _,p in h[-10:]]
        if recent:
            a=np.mean(recent,axis=0);simple=[2*a[5]+3*a[6]+a[7],a[8]+a[9],a[10],a[6]]
        else:simple=[0.]*4
        return seq,np.asarray(extra,np.float32),simple
    def make(self,g,rosters=None,cutoff=None,with_outcomes=True):
        d=date(g);ts=teams(g)
        seq=np.zeros((2,N,L,F),np.float32);extra=np.zeros((2,N,7),np.float32)
        mask=np.zeros((2,N),bool);ctx=np.zeros((2,C+3),np.float32);y=np.zeros((2,N,OUT),np.float32)
        ids=[];simple=np.zeros((2,N,4),np.float32)
        for j,t in enumerate(ts):
            named=list(dict.fromkeys(rosters[t] if rosters is not None else self.roster(t)))
            if len(named)>N-1:raise ValueError("roster exceeds explicit capacity")
            ids.append(named+[None]*(N-1-len(named))+["__RESERVE__"])
            rows=played(g,t) if with_outcomes else {}
            history=self.teams[t]
            if history:
                ctx[j,:C]=np.mean([a for _,_,a in history[-12:]],axis=0)
                ctx[j,C]=min(10,(d-date(history[-1][0])).days)/10
            ctx[j,C+1]=j;ctx[j,C+2]=len(named)/23
            for i,pid in enumerate(named):
                seq[j,i],extra[j,i],simple[j,i]=self.sequence(pid,t,d);mask[j,i]=True
                if pid in rows:y[j,i]=outcome(rows[pid])
            # Anonymous roster residual: actual training target, never a named pick.
            reserve=[outcome(p) for pid,p in rows.items() if pid not in named]
            if reserve:
                y[j,-1]=np.sum(reserve,axis=0);y[j,-1,0]=1
            extra[j,-1,-1]=1;mask[j,-1]=True
        return dict(seq=seq,extra=extra,mask=mask,ctx=ctx,y=y,ids=ids,simple=simple)
def make_training(games,train_end,valid_end):
    h=History();i=0;train=[];valid=[]
    for d,gg in itertools.groupby(games,key=date):
        ds=d.isoformat()
        if ds>=valid_end:break
        # A full UTC-day buffer prevents late previous-night games leaking.
        limit=d-dt.timedelta(days=1)
        while i<len(games) and date(games[i])<limit:h.add(games[i]);i+=1
        for g in gg:
            if min(len(h.teams[t]) for t in teams(g))<5:continue
            (train if ds<train_end else valid).append(h.make(g))
    return train,valid
def archives(games,archive,grades,test_from):
    by={str(g["game_id"]):g for g in games};out=[];skipped=collections.Counter()
    for p in sorted(Path(grades).glob("*.json")):
        gr=json.loads(p.read_text());gid=str(gr["game_id"]);g=by.get(gid)
        if g is None:skipped["box_unavailable"]+=1;continue
        if date(g).isoformat()<test_from:continue
        fp=Path(archive)/(gid+".json.gz")
        if not fp.exists():skipped["archive_unavailable"]+=1;continue
        with gzip.open(fp,"rt") as fh:ar=json.load(fh)["games"]
        if len(ar)!=1 or str(ar[0]["game_id"])!=gid:raise ValueError("archive identity")
        a=ar[0]
        if stamp(a["forecast_at_utc"])!=stamp(gr["forecast_at_utc"]) or stamp(a["forecast_at_utc"])>=stamp(a["tipoff_utc"]):
            raise ValueError("archive not frozen pretip")
        out.append((g,a,gr))
    return sorted(out,key=lambda r:stamp(r[1]["forecast_at_utc"])),dict(skipped)
