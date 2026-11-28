#!/usr/bin/env node
// Research only. Exact chronological, source-box nonlinear count/rate trial.
// Run from repository root: node nba/research_opportunity_replay.mjs
// Does not modify forecasts, grades, or production configuration.
import {readFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
const ids=[296,297,298,299,300,308,309,310,311,312,321,322,323,324,325].map(i=>401909000+i);
const read=p=>readFileSync(p,"utf8").trim().split("\n").map(JSON.parse);
const old=gunzipSync(readFileSync("nba/data/nba_v4_games_2025_26.jsonl.gz")).toString("utf8").trim().split("\n").map(JSON.parse);
const recent=read("nba/data/nba_v4_games_2026_27.jsonl");
const games=[...old,...recent].sort((a,b)=>a.date.localeCompare(b.date));
if(new Set(games.map(g=>String(g.game_id))).size!==games.length)throw Error("duplicate raw game");
const arch=new Map(ids.map(id=>{let g=JSON.parse(readFileSync("docs/nba_v5_grades/first/"+id+".json","utf8"));if(String(g.game_id)!==String(id)||g.kind!=="first")throw Error("wrong archive");return [String(id),g]}));
const keys=["fga","pts","reb","ast","tpm","tpa","fta"];
const avg=(a,f)=>a.length?a.reduce((s,x)=>s+f(x),0)/a.length:0;
function rates(h,n){
 let a=h.slice(-n),w=a.map((x,i)=>Math.pow(.88,a.length-i-1)),mn=a.reduce((s,x,i)=>s+w[i]*x.min,0),sum=w.reduce((s,x)=>s+x,0);
 return {min:mn/sum,start:a.reduce((s,x,i)=>s+w[i]*Number(x.start),0)/sum,...Object.fromEntries(keys.map(k=>[k,a.reduce((s,x,i)=>s+w[i]*x[k],0)/Math.max(mn,1)]))};
}
let ph=new Map(),th=new Map(),train=[],test=[],paired=[],pointer=0;
function add(g){
 for(let side of ["home","away"]){
  let t=String(g[side].id),p=g.players.filter(x=>x.side===side&&x.min>0),opp=g.players.filter(x=>x.side!==side&&x.min>0),arr=th.get(t)||[];
  arr.push({date:g.date,ids:new Set(p.map(x=>String(x.id))),fga:p.reduce((s,x)=>s+x.fga,0),oppFga:opp.reduce((s,x)=>s+x.fga,0),poss:p.reduce((s,x)=>s+x.fga+.44*x.fta+x.tov-x.oreb,0)});th.set(t,arr);
 }
 for(let p of g.players){if(p.min<=0)continue;let id=String(p.id),h=ph.get(id)||[];h.push({...p,team:String(p.team),date:g.date});ph.set(id,h)}
}
function feat(pid,team,opp,asof,home){
 let h=ph.get(pid)||[],t=th.get(team)||[],ot=th.get(opp)||[];
 if(h.length<5||t.length<5||ot.length<5||h.at(-1).team!==team)return null;
 let a=rates(h,5),l=rates(h,25),r=rates(h,1),last=t.at(-1),rt=t.slice(-5),ro=ot.slice(-10),lost=0,minsLost=0,competition=0;
 for(let mate of new Set(rt.flatMap(g=>[...g.ids]))){
  if(mate===pid)continue;let hh=ph.get(mate)||[];if(hh.length<5||hh.at(-1).team!==team)continue;let q=rates(hh,10);
  if(!last.ids.has(mate)){lost+=q.fga*q.min;minsLost+=q.min}else if(q.fga>a.fga)competition+=q.fga*q.min;
 }
 let rest=Math.min(14,(asof-Date.parse(h.at(-1).date))/86400000);
 let x=[a.min,l.min,r.min,a.start,l.start,r.start,avg(rt,g=>Number(g.ids.has(pid))),Number(last.ids.has(pid)),rest,Number(home),avg(rt,g=>g.fga),avg(ro,g=>g.oppFga),avg(rt,g=>g.poss),avg(ro,g=>g.poss),lost,minsLost,competition,...keys.flatMap(k=>[a[k],l[k],a[k]-l[k],r[k]])];
 if(!x.every(Number.isFinite))throw Error("invalid feature");
 return {x,base:{min:a.min,...Object.fromEntries(keys.map(k=>[k,a[k]]))}};
}
const HOUR=3600000;
const jobs=games.map(g=>({g,at:Date.parse(g.date)-6*HOUR,kind:Date.parse(g.date)<Date.parse("2026-10-01")?"train":"test"}));
for(let [id,ag] of arch){
 let g=games.find(x=>String(x.game_id)===id);
 if(!g)throw Error("missing paired raw game");
 let at=Date.parse(ag.forecast_at_utc);
 if(!Number.isFinite(at)||at>=Date.parse(g.date))throw Error("non-pregame archive");
 jobs.push({g,at,kind:"paired",ag});
}
jobs.sort((a,b)=>a.at-b.at);
for(let {g,at,kind,ag} of jobs){
 // Conservative six-hour completion lag; ordinary jobs simulate a forecast
 // six hours before tip, paired jobs use the actual original forecast time.
 let cutoff=at-6*HOUR;
 while(pointer<games.length&&Date.parse(games[pointer].date)<cutoff)add(games[pointer++]);
 let lookup=new Map(g.players.filter(p=>p.min>0).map(p=>[String(p.id),p]));
 for(let side of ["home","away"]){
  let team=String(g[side].id),opp=String(g[side==="home"?"away":"home"].id),h=th.get(team)||[],cand=new Set(h.slice(-5).flatMap(t=>[...t.ids]));
  for(let pid of cand){
   let f=feat(pid,team,opp,at,side==="home");if(!f)continue;
   // Actual box appears only after feature construction and defines labels.
   // This is a conditional-on-playing numerical experiment, not P(play).
   let p=lookup.get(pid);if(!p||String(p.team)!==team)continue;
   let row={...f,p,id:g.game_id};
   if(kind==="train")train.push(row);else if(kind==="test")test.push(row);
   else{
    let rr=ag.rows.filter(r=>String(r.player_id)===pid&&r.played===true),pt=rr.find(r=>r.market==="points");
    if(pt&&Number.isFinite(pt.minutes_forecast)&&Number.isFinite(pt.fga_forecast))paired.push({...row,rr,pt});
   }
  }
 }
}
const N=train.length,D=train[0].x.length,B=12;
const cuts=Array.from({length:D},(_,j)=>{let a=train.map(r=>r.x[j]).sort((a,b)=>a-b);return [...new Set(Array.from({length:B-1},(_,k)=>a[Math.floor((k+1)*a.length/B)]))]});
function bins(r){return r.x.map((v,j)=>{let c=cuts[j],b=0;while(b<c.length&&v>c[b])b++;return b})}
const bx=train.map(bins);
function boost(k,mode){
 const wt=train.map(r=>mode==="rate"?Math.min(40,r.p.min)/24:1);
 const base=r=>mode==="rate"?r.base[k]:k==="min"?r.base.min:r.base[k]*r.base.min;
 const y=train.map(r=>mode==="rate"?r.p[k]/r.p.min:r.p[k]),res=y.map((v,i)=>v-base(train[i])),trees=[],lr=.12;
 function best(indices){
  let ans=null;
  for(let j=0;j<D;j++){
   let w=new Float64Array(B),s=new Float64Array(B),cnt=new Uint32Array(B),W=0,S=0;
   for(let i of indices){let b=bx[i][j],v=wt[i];w[b]+=v;s[b]+=v*res[i];cnt[b]++;W+=v;S+=v*res[i]}
   let lw=0,ls=0,ln=0;
   for(let t=0;t<cuts[j].length;t++){
    lw+=w[t];ls+=s[t];ln+=cnt[t];let rw=W-lw,rs=S-ls;
    if(ln<180||indices.length-ln<180||lw<=0||rw<=0)continue;
    let gain=ls*ls/lw+rs*rs/rw-S*S/W;
    if(!ans||gain>ans.gain)ans={j,t,gain,L:ls/lw,R:rs/rw};
   }
  }
  return ans;
 }
 let idx=Array.from({length:N},(_,i)=>i);
 for(let z=0;z<45;z++){
  let root=best(idx);if(!root||root.gain<1e-10)break;
  let left=[],right=[];for(let i of idx)(bx[i][root.j]<=root.t?left:right).push(i);
  let l=best(left),r=best(right);trees.push({root,l,r});
  for(let i of idx){let a=bx[i][root.j]<=root.t,b=a?l:r;let v=b?(bx[i][b.j]<=b.t?b.L:b.R):(a?root.L:root.R);res[i]-=lr*v}
 }
 return r=>{let x=bins(r),p=base(r);for(let {root,l,r} of trees){let a=x[root.j]<=root.t,b=a?l:r;p+=lr*(b?(x[b.j]<=b.t?b.L:b.R):(a?root.L:root.R))}return Math.max(0,p)};
}
let predict={min:boost("min","count")};
for(let k of ["fga","pts","reb","ast","tpm"])predict[k]={rate:boost(k,"rate"),count:boost(k,"count")};
const mk={pts:"points",reb:"rebounds",ast:"assists",tpm:"three_pointers_made"},full={},match={};
for(let k of ["min","fga","pts","reb","ast","tpm"]){
 let s={recent:0,rawCount:0,rawRate:0};
 for(let r of test){
  let y=r.p[k],base=k==="min"?r.base.min:r.base[k]*r.base.min,a=k==="min"?predict.min(r):predict[k].count(r),b=k==="min"?a:predict[k].rate(r)*predict.min(r);
  s.recent+=Math.abs(base-y);s.rawCount+=Math.abs(a-y);s.rawRate+=Math.abs(b-y);
 }
 full[k]={n:test.length,...Object.fromEntries(Object.entries(s).map(([k,v])=>[k,+(v/test.length).toFixed(4)]))};
 let ss={v5:0,rawCount:0,rawRate:0,rateWithV5Minutes:0,halfCount:0},nn=0;
 for(let r of paired){
  let v=k==="min"?r.pt.minutes_forecast:k==="fga"?r.pt.fga_forecast:r.rr.find(q=>q.market===mk[k])?.projection,y=k==="min"?r.pt.minutes_actual:k==="fga"?r.pt.fga_actual:r.rr.find(q=>q.market===mk[k])?.actual;
  if(!Number.isFinite(v)||!Number.isFinite(y))continue;
  let a=k==="min"?predict.min(r):predict[k].count(r),b=k==="min"?a:predict[k].rate(r)*predict.min(r),c=k==="min"?a:predict[k].rate(r)*r.pt.minutes_forecast;
  nn++;ss.v5+=Math.abs(v-y);ss.rawCount+=Math.abs(a-y);ss.rawRate+=Math.abs(b-y);ss.rateWithV5Minutes+=Math.abs(c-y);ss.halfCount+=Math.abs((a+v)/2-y);
 }
 match[k]={n:nn,...Object.fromEntries(Object.entries(ss).map(([k,v])=>[k,+(v/nn).toFixed(4)]))};
}
console.log(JSON.stringify({trainGames:old.length,raw2026Games:recent.length,train:N,test:test.length,paired:paired.length,pairedGames:new Set(paired.map(r=>r.id)).size,full,match},null,2));
