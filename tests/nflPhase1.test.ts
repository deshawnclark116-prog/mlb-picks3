import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { execFileSync } from 'node:child_process';
import { parsePhase1, decodeRows, groupGames, deriveAlt65, PHASE1_URL } from '../src/nfl/phase1.ts';
import { loadPhase1, verifyBatch, phase1Handler } from '../server/nflPhase1.ts';
import { OutcomeCard } from '../src/components/NflTodayScreen.tsx';
const original = JSON.parse(readFileSync(new URL('./fixtures/nfl-phase1-oct4.json', import.meta.url), 'utf8'));
const records = JSON.parse(readFileSync(new URL('./fixtures/nfl-phase1-distributions.json', import.meta.url), 'utf8'));
const now = Date.parse('2026-10-04T16:00:00Z');
const fixture = () => structuredClone(original);
const parse = (x = fixture()) => parsePhase1(x, new Date(now));
function batch(rs = records) {
  const body = [JSON.stringify({game_id:original.games[0].game_id,horizon:'T90'}),...rs.map((r:any)=>JSON.stringify(r))].join('\n')+'\n';
  return body+JSON.stringify({_footer:true,n:rs.length,sha256:createHash('sha256').update(body).digest('hex')})+'\n';
}
test('Phase 1 Oct 4 T90 games only; no legacy schema or Sept 27 games', () => {
  const v=parse(); assert.equal(v.defaultHorizon,'T90'); assert.equal(groupGames(v,'T90')[0].kickoff_utc,'2026-10-04T17:00:00.000000Z');
  assert.equal(groupGames(v,'T24').length,0); assert.throws(()=>parse({picks:[{date:'2026-09-27'}]}),/legacy/);
  const x=fixture(); x.games[0].kickoff_utc='2026-09-27T17:00:00Z'; x.games[0].horizons.T90.cutoff='2026-09-27T15:30:00Z'; assert.throws(()=>parse(x),/Stale/);
});
test('row_fields determine decoding even when completely reordered',()=>{
  const x=fixture(), fields=[...x.row_fields].reverse(), rows=x.forecasts.T90.map((r:any[])=>[...r].reverse());
  assert.deepEqual(decodeRows(fields,rows),decodeRows(x.row_fields,x.forecasts.T90));
  assert.throws(()=>decodeRows([...fields,fields[0]],rows),/unique/);
  assert.throws(()=>decodeRows(fields,[rows[0].slice(1)]),/length/);
  assert.throws(()=>decodeRows(fields.filter(f=>f!=='median'),[]),/required/);
});
test('T24 and T90 never mix',()=>{
  const x=fixture(); x.forecasts.T24=structuredClone(x.forecasts.T90);
  const id=x.row_fields.indexOf('id'); x.forecasts.T24.forEach((r:any[])=>r[id]='T24-'+r[id]);
  x.games[0].horizons.T24={...x.games[0].horizons.T90,cutoff:'2026-10-03T17:00:00Z'}; x.status.counts.T24.valid_games=1;
  const v=parse(x); assert(groupGames(v,'T24')[0].rows.every(r=>r.id.startsWith('T24-')));
  assert(groupGames(v,'T90')[0].rows.every(r=>!r.id.startsWith('T24-')));
});
test('malformed, stale, mismatched published sets fail visibly',()=>{
  const stale=fixture(); stale.status.last_shadow_run_utc='2026-09-27T15:00:00Z'; assert.throws(()=>parse(stale),/Stale/);
  const mismatched=fixture(); mismatched.status.week=3; assert.throws(()=>parse(mismatched),/season\/week/);
  const counts=fixture(); counts.games[0].horizons.T90.n_records++; assert.throws(()=>parse(counts),/count mismatch/);
  const wrong=fixture(); wrong.forecasts.T90[0][wrong.row_fields.indexOf('game_id')]='absent'; assert.throws(()=>parse(wrong),/metadata/);
});
test('missing public player labels are retained by stable forecast ID',()=>{
  const x=fixture(); x.forecasts.T90[0][x.row_fields.indexOf('player')]=''; x.forecasts.T90[0][x.row_fields.indexOf('pos')]='';
  assert.equal(parse(x).rows.T90.length,3);
});
test('median projection, mean expected average and correct intervals remain visible',()=>{
  const v=parse(); const r=v.rows.T90.find(r=>r.outcome==='rush_yds')!;
  const html=renderToStaticMarkup(React.createElement(OutcomeCard,{row:r,view:v}));
  assert.match(html,/MODEL PROJECTION · MEDIAN/); assert.match(html,/11 yds/); assert.match(html,/Expected average \(mean\)/); assert.match(html,/16.8 yds/);
  assert.match(html,/Middle 50% \(P25–P75\)/); assert.match(html,/2–25 yds/); assert.match(html,/0–41 yds/); assert.match(html,/No 65%\+ alt/);
});
test('yards: highest standard milestone >=65%; next fails; passing grid',()=>{
  const grid=Array.from({length:99},(_,i)=>i+1);
  assert.deepEqual(deriveAlt65({outcome:'rush_yds',quantile_grid_99:grid}),{milestone:30,probability:.7,method:'quantile_grid_99_conservative'});
  assert.equal((99-grid.findIndex(x=>x>=40))/100,.6);
  const pass=deriveAlt65({outcome:'pass_yds',quantile_grid_99:grid.map(x=>x*10)})!;
  assert.equal(pass.milestone,350); assert.equal(pass.probability,.65); assert((99-grid.findIndex(x=>x*10>=375))/100<.65);
});
test('discrete counts use 1-F(k-1), including equality and highest milestone',()=>{
  const cdf=[.1,.2,.35,.6,.8,1]; const alt=deriveAlt65({outcome:'rec',cdf_lattice:{step:1,cdf}})!;
  assert.equal(alt.milestone,3); assert.equal(alt.probability,.65); assert(1-cdf[3]<.65);
  assert.equal(deriveAlt65({outcome:'rec',cdf_lattice:{step:1,cdf:[.5,1]}}),null);
});
test('deterministic distribution calculation never depends on mean, median or sportsbook inputs',()=>{
  for(const r of records){ const expected=deriveAlt65(r); for(let i=0;i<10;i++) assert.deepEqual(deriveAlt65({...r,mean:1e9,median:-1,odds:-110,line:500}),expected); }
  assert.equal(deriveAlt65({outcome:'rush_yds',mean:74,median:74} as any),null);
  assert.equal(deriveAlt65({outcome:'rec',cdf_lattice:{step:1,cdf:[.1,.05,1]}}),null);
  assert.equal(deriveAlt65({outcome:'rec',cdf_lattice:{step:1,cdf:[.1,.2]}}),null);
  assert.equal(deriveAlt65({outcome:'unknown',cdf_lattice:{step:1,cdf:[.1,1]}}),null);
});
test('batch footer hash, identity, horizon, cutoff and time-travel are verified',()=>{
  assert.equal(verifyBatch(batch(),original.games[0],'T90').size,3);
  assert.throws(()=>verifyBatch(batch().replace('tremaine','tampered'),original.games[0],'T90'),/hash/);
  assert.throws(()=>verifyBatch(batch(),original.games[0],'T24'),/horizon|count/);
  const rs=structuredClone(records); rs[0].cutoff='wrong'; assert.throws(()=>verifyBatch(batch(rs),original.games[0],'T90'),/identity/);
  rs[0]=structuredClone(records[0]); rs[0].input_snapshots.time_travel=true; assert.throws(()=>verifyBatch(batch(rs),original.games[0],'T90'),/identity/);
});
test('proxy refreshes main without Render, enriches only matching verified alt map',async()=>{
  let source=fixture(); const calls:any[]=[]; const mock=async(url:any,options:any)=>{calls.push({url,options});return new Response(url.startsWith(PHASE1_URL)?JSON.stringify(source):batch());};
  const cache=new Map(); const result=await loadPhase1(mock as any,now,cache); const {alt_65,...unchanged}=result;
  assert.deepEqual(unchanged,original); assert.equal(Object.keys(alt_65!).length,3);
  for(const r of records)assert.deepEqual(alt_65![r.id],deriveAlt65(r));
  source.lines=[{line:1e99,over_price:1e99,under_price:-1e99}];
  const changedOdds=await loadPhase1(mock as any,now+1,cache); assert.deepEqual(changedOdds.alt_65,result.alt_65); assert.equal(calls.filter(c=>c.url.startsWith(PHASE1_URL)).length,2);
  assert(calls.every(c=>c.url.startsWith('https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/')&&c.url.includes('?t=')&&c.options.cache==='no-store'));
});
test('upstream errors and mismatched distribution fail; no silent fallback',async()=>{
  await assert.rejects(loadPhase1((async()=>new Response('',{status:404})) as any,now,new Map()),/HTTP 404/);
  const moments=structuredClone(records);moments[0].mean+=1;
  await assert.rejects(loadPhase1((async(url:string)=>new Response(url.startsWith(PHASE1_URL)?JSON.stringify(original):batch(moments))) as any,now,new Map()),/mismatched distribution moments/);
  const rs=structuredClone(records);rs[0].player_name='wrong';
  await assert.rejects(loadPhase1((async(url:string)=>new Response(url.startsWith(PHASE1_URL)?JSON.stringify(original):batch(rs))) as any,now,new Map()),/does not match/);
  let code=200,body:any;const headers:any={};const res={setHeader:(k:string,v:string)=>headers[k]=v,status:(c:number)=>{code=c;return res},json:(x:any)=>body=x};
  await phase1Handler((async()=>new Response('{}')) as any,()=>now)({} as any,res as any);
  assert.equal(code,502);assert.match(body.error,/unavailable or invalid/);assert.match(headers['Cache-Control'],/no-store/);
});
test('legacy route and other sport components are byte-identical to base',()=>{
  const base=execFileSync('git',['merge-base','HEAD','origin/main'],{encoding:'utf8'}).trim();
  const old=(p:string)=>execFileSync('git',['show',`${base}:${p}`],{encoding:'utf8'});
  for(const p of ['src/components/TodayScreen.tsx','src/components/CfbTodayScreen.tsx','src/components/NhlTodayScreen.tsx','src/components/TennisTodayScreen.tsx','src/types.ts','src/utils.ts']) assert.equal(readFileSync(p,'utf8'),old(p));
  const route=(s:string)=>s.slice(s.indexOf('app.get("/api/nfl-predictions"'),s.indexOf('app.get("/api/cfb-predictions"'));
  assert.equal(route(readFileSync('server.ts','utf8')),route(old('server.ts')));
  assert(!readFileSync('src/App.tsx','utf8').includes('/api/nfl-predictions'));
});
