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

import { systemGames, todaysBest, bestExecution, executableGames, lineFreshness, targetText } from '../src/nfl/bettable.ts';
import { SystemPickCard } from '../src/components/NflTodayScreen.tsx';
const nyjSource=JSON.parse(readFileSync(new URL('./fixtures/nfl-nyj-chi-bettable.json',import.meta.url),'utf8'));
const nyj=()=>parsePhase1(structuredClone(nyjSource),new Date(Date.parse(nyjSource.status.last_shadow_run_utc)+60000));
const picks=(v=nyj())=>systemGames(v,'T90')[0].picks;
function sample(outcome='rec_yds',milestone=50){
  const v=nyj(),r=v.rows.T90.find(r=>r.outcome===outcome && (r.p_active||0)>=.75)!;
  const pick={row:r,target:{milestone,probability:.65,method:'empirical_cdf_lattice' as const}};
  const line={game_id:r.game_id,horizon:'T90',player:r.player,outcome,book:'DraftKings',line:milestone-.5,over_price:-110};
  v.artifact.lines=[line];return {v,pick,line};
}
test('SYSTEM PICKS require no lines; deleting every sportsbook field leaves targets identical',()=>{
  const v=nyj(),before=picks(v),best=todaysBest(v,'T90');delete v.artifact.lines;delete v.artifact.lines_meta;
  assert.deepEqual(picks(v),before);assert.deepEqual(todaysBest(v,'T90'),best);
});
test('all system picks use existing >=65% targets and offensive outcomes',()=>{
  const v=nyj();for(const p of picks(v)){assert.deepEqual(p.target,v.artifact.alt_65![p.row.id]);assert(p.target.probability>=.65);assert(!['tackles','sacks','def_int'].includes(p.row.outcome));}
});
test('availability guard excludes lower-activity and missing availability, preserving MODEL BOARD',()=>{
  const v=nyj(),p=picks(v)[0];p.row.p_active=.7499;assert(!picks(v).some(x=>x.row.id===p.row.id));p.row.p_active=null;assert(!picks(v).some(x=>x.row.id===p.row.id));p.row.p_active=.75;assert(picks(v).some(x=>x.row.id===p.row.id));assert.equal(v.rows.T90.length,286);
});
test('null targets cannot become picks; sportsbook fields cannot create or change targets',()=>{
  const v=nyj();v.artifact.alt_65=Object.fromEntries(v.rows.T90.map(r=>[r.id,null]));assert.equal(picks(v).length,0);v.artifact.lines=[{book:'book',line:1,p_over:1}];assert.equal(picks(v).length,0);
});
test('max ten per game; fewer than ten remain fewer, without weakening thresholds',()=>{
  const v=nyj();assert.equal(picks(v).length,10);const keep=picks(v).slice(0,4).map(p=>p.row.id);v.artifact.alt_65=Object.fromEntries(v.rows.T90.map(r=>[r.id,keep.includes(r.id)?v.artifact.alt_65![r.id]:null]));assert.equal(picks(v).length,4);
});
test('ranking uses hit probability then active probability then player/outcome, deterministically',()=>{
  const v=nyj();const r=picks(v)[0].row;v.rows.T90=[{...r,id:'b',player:'B player',p_active:.9},{...r,id:'a',player:'A player',p_active:.9},{...r,id:'c',player:'C player',p_active:.99}];v.artifact.alt_65=Object.fromEntries(['a','b','c'].map(id=>[id,{milestone:10,probability:.7,method:'quantile_grid_99_conservative'}]));assert.deepEqual(picks(v).map(p=>p.row.id),['c','a','b']);assert.deepEqual(picks(v),picks(v));
});
test("TODAY'S BEST returns at most five with the same deterministic ranking",()=>{
  const v=nyj();assert(todaysBest(v,'T90').length<=5);assert.deepEqual(todaysBest(v,'T90'),picks(v).slice(0,5));assert.deepEqual(todaysBest(v,'T90'),todaysBest(v,'T90'));
});
test('BETTABLE NOW is an intersection of capped SYSTEM PICKS, not a market scanner',()=>{
  const v=nyj(),system=new Set(picks(v).map(p=>p.row.id));for(const p of executableGames(v,'T90')[0].picks)assert(system.has(p.row.id));
  const backup=v.rows.T90.find(r=>r.player==='tyson bagent'&&r.outcome==='rush_yds')!;v.artifact.lines=[{game_id:backup.game_id,horizon:'T90',player:backup.player,outcome:backup.outcome,book:'Book',line:1.5,over_price:200}];assert.equal(executableGames(v,'T90')[0].picks.length,0);
});
for(const [outcome,milestone] of [['rec_yds',50],['rush_yds',40],['rec',2],['pass_td',1]] as const)test(`${milestone}+ ${outcome} matches OVER ${milestone-.5}`,()=>{
  const {v,pick}=sample(outcome,milestone);assert.equal(bestExecution(v,'T90',pick)?.line,milestone-.5);
});
test('OVER 50.5 and conventional OVER 50 do not equal 50+',()=>{
  const {v,pick,line}=sample();for(const n of [50,50.5,49]){v.artifact.lines=[{...line,line:n}];assert.equal(bestExecution(v,'T90',pick),null);}
});
test('explicit milestone requires affirmative at-least settlement; unclear markets fail closed',()=>{
  const {v,pick,line}=sample();v.artifact.lines=[{...line,line:50,market_type:'milestone',settlement:'at_least',price:-120}];assert.equal(bestExecution(v,'T90',pick)?.kind,'milestone');
  v.artifact.lines=[{...line,line:50,market_type:'milestone'}];assert.equal(bestExecution(v,'T90',pick),null);
  v.artifact.lines=[{...line,side:'UNDER'}];assert.equal(bestExecution(v,'T90',pick),null);
});
test('best confirmed odds use only matching options in the artifact',()=>{
  const {v,pick,line}=sample();v.artifact.lines=[{...line,book:'A',over_price:-120},{...line,book:'B',over_price:-105},{...line,line:50.5,over_price:500}];assert.equal(bestExecution(v,'T90',pick)?.book,'B');(v.artifact.lines as any[]).push({...line,book:'C',over_price:110});assert.equal(bestExecution(v,'T90',pick)?.book,'C');
});
test('missing/malformed book data does not break system picks or invent an available market',()=>{
  const v=nyj(),before=picks(v);for(const lines of [null,{},[],[{line:NaN,book:'bad'}]]){v.artifact.lines=lines;assert.deepEqual(picks(v),before);assert.equal(executableGames(v,'T90')[0].picks.length,0);}
});
test('stale >60-minute lines warn without altering model targets; boundary is exact',()=>{
  const v=nyj(),before=picks(v);v.artifact.lines_meta={generated_at_utc:new Date(now-3600000).toISOString()};assert.equal(lineFreshness(v,now).stale,false);assert.equal(lineFreshness(v,now+1).stale,true);assert.deepEqual(picks(v),before);
});
test('wrong game, horizon, player, outcome, invalid price and ambiguous identities cannot confirm markets',()=>{
  const {v,pick,line}=sample();for(const patch of [{game_id:'wrong'},{horizon:'T24'},{player:'wrong'},{outcome:'tackles'},{over_price:NaN},{book:''}]){v.artifact.lines=[{...line,...patch}];assert.equal(bestExecution(v,'T90',pick),null);}
  v.artifact.lines=[line];v.rows.T90.push({...pick.row,id:'ambiguous'});assert.equal(bestExecution(v,'T90',pick),null);
});
test('T24 targets and executions never mix with T90',()=>{
  const v=nyj();assert.equal(systemGames(v,'T24')[0]?.picks.length||0,0);v.rows.T24=v.rows.T90.map(r=>({...r,id:'T24-'+r.id}));v.artifact.alt_65={...v.artifact.alt_65,...Object.fromEntries(v.rows.T90.map(r=>['T24-'+r.id,v.artifact.alt_65![r.id]]))};v.games[0].horizons.T24={...v.games[0].horizons.T90!};assert(systemGames(v,'T24')[0].picks.every(p=>p.row.id.startsWith('T24-')));assert.equal(executableGames(v,'T24')[0].picks.length,0);
});
test('defensive outcomes never leak even with high probability targets and sportsbook lines',()=>{
  const v=nyj();for(const r of v.rows.T90.filter(r=>['tackles','sacks','def_int'].includes(r.outcome)))v.artifact.alt_65![r.id]={milestone:1,probability:.99,method:'empirical_cdf_lattice'};assert(picks(v).every(p=>!['tackles','sacks','def_int'].includes(p.row.outcome)));
});
test('system cards lead with target/likelihood; technical details start collapsed',()=>{
  const v=nyj(),pick=picks(v)[0],html=renderToStaticMarkup(React.createElement(SystemPickCard,{pick,view:v,horizon:'T90'}));assert(html.includes(targetText(pick)));assert.match(html,/MODEL HIT PROBABILITY/);assert.match(html,/<details[^>]*data-testid="system-details"/);assert(!/<details[^>]*open/.test(html));for(const field of ['Median','Mean','P10–P90','P(active)','Expected opportunities','Information cutoff'])assert(html.includes(field));
});
test('MODEL BOARD preserves 286 rows; decoding/calculation/transport/other sports remain byte-identical',()=>{
  const v=nyj();assert.equal(groupGames(v,'T90')[0].rows.length,286);const before=JSON.stringify(v);systemGames(v,'T90');executableGames(v,'T90');assert.equal(JSON.stringify(v),before);
  const base=execFileSync('git',['merge-base','HEAD','origin/main'],{encoding:'utf8'}).trim();for(const file of ['src/App.tsx','src/nfl/phase1.ts','src/nfl/usePhase1.ts','server/nflPhase1.ts','server.ts'])assert.equal(readFileSync(file,'utf8'),execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'}));
});
