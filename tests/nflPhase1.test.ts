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

import { systemCandidates, compareSystem, systemGames, todaysBest, bestExecution, executableGames, lineFreshness, targetText } from '../src/nfl/bettable.ts';
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
test('BETTABLE NOW is an intersection of uncapped SYSTEM eligibility, not a market scanner',()=>{
  const v=nyj(),system=new Set(systemCandidates(v,'T90').map(p=>p.row.id));for(const p of executableGames(v,'T90')[0].picks)assert(system.has(p.row.id));
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

test('uncapped system eligibility retains all 26 NYJ/CHI targets; default top ten is unchanged',()=>{
  const v=nyj(),candidates=systemCandidates(v,'T90');assert.equal(candidates.length,26);
  const expected=[['dandre swift','rec',1],['jeremy ruckert','rec',1],['kenyon sadiq','rec',2],['rome odunze','rec',2],['isaiah williams','rec_yds',10],['kalif raymond','rec_yds',10],['cole kmet','rec',1],['garrett wilson','rec',4],['dandre swift','rush_yds',40],['luther burden','rec',3]];
  assert.deepEqual(picks(v).map(p=>[p.row.player,p.row.outcome,p.target.milestone]),expected);
  assert.deepEqual(picks(v),[...candidates].sort(compareSystem).slice(0,10));
  const before=[...candidates].sort(compareSystem);delete v.artifact.lines;delete v.artifact.lines_meta;
  assert.deepEqual(systemCandidates(v,'T90').sort(compareSystem),before);
});
test('RUSH filters uncapped eligibility before display cap, exposing Swift/Geno/Allen/Monangai',()=>{
  const rush=systemGames(nyj(),'T90','','RUSH')[0].picks;
  assert.deepEqual(rush.map(p=>[p.row.player,p.target.milestone,p.target.probability]),[['dandre swift',40,.75],['geno smith',10,.74],['braelon allen',40,.67],['kyle monangai',20,.66]]);
  assert.equal(rush.length,4);
});
test('Geno Smith search exposes all three eligible targets outside default top ten',()=>{
  const v=nyj();assert(!picks(v).some(p=>p.row.player==='geno smith'));
  const result=systemGames(v,'T90','Geno Smith')[0].picks;
  assert.deepEqual(result.map(p=>[p.row.outcome,p.target.milestone,p.target.probability]),[['rush_yds',10,.74],['pass_yds',175,.71],['pass_td',1,.67916]]);
  assert.equal(systemGames(v,'T90','Geno Smith','RUSH')[0].picks.length,1);
});
for(const [family,outcomes] of [['PASS',['pass_yds','pass_td','int']],['REC',['rec_yds','rec','rec_td']],['TD',['pass_td','rush_td','rec_td','atd']]] as const)test(`${family} filters the uncapped pool before ranking/capping`,()=>{
  const v=nyj(),expected=systemCandidates(v,'T90').filter(p=>(outcomes as readonly string[]).includes(p.row.outcome)).sort(compareSystem).slice(0,10);
  assert(expected.length>0);assert.deepEqual(systemGames(v,'T90','',family)[0].picks,expected);
  const more=systemCandidates(v,'T90').filter(p=>(outcomes as readonly string[]).includes(p.row.outcome) && !picks(v).some(top=>top.row.id===p.row.id));assert(more.length>0);
});
test("TODAY'S BEST filters uncapped eligibility first, finding rushing and searched-player targets",()=>{
  const v=nyj();assert.deepEqual(todaysBest(v,'T90','','RUSH'),systemGames(v,'T90','','RUSH')[0].picks);
  assert.deepEqual(todaysBest(v,'T90','Geno Smith'),systemGames(v,'T90','Geno Smith')[0].picks);
  assert.equal(todaysBest(v,'T90','Geno Smith','PASS').length,2);
  assert.deepEqual(todaysBest(v,'T90'),picks(v).slice(0,5));
});
test('BETTABLE NOW can match a target outside the default cap; books still cannot create targets',()=>{
  const v=nyj(),before=systemCandidates(v,'T90').sort(compareSystem);
  const geno=before.find(p=>p.row.player==='geno smith'&&p.row.outcome==='rush_yds')!;
  assert(before.findIndex(p=>p.row.id===geno.row.id)>=10);
  v.artifact.lines=[{game_id:geno.row.game_id,horizon:'T90',player:'Geno Smith',outcome:'rush_yds',book:'Test book',line:9.5,over_price:-110}];
  assert.equal(executableGames(v,'T90')[0].picks[0].row.id,geno.row.id);
  assert.equal(executableGames(v,'T90','Geno Smith','RUSH')[0].picks.length,1);
  assert.equal(executableGames(v,'T90','','REC')[0].picks.length,0);
  assert.deepEqual(systemCandidates(v,'T90').sort(compareSystem),before);
  v.artifact.alt_65![geno.row.id]=null;assert.equal(executableGames(v,'T90')[0].picks.length,0);
});
test('execution gets its own cap AFTER market matching; searches can find later eligible matches',()=>{
  const v=nyj(),all=systemCandidates(v,'T90').sort(compareSystem);
  v.artifact.lines=all.map(p=>({game_id:p.row.game_id,horizon:'T90',player:p.row.player,outcome:p.row.outcome,book:'Test book',line:p.target.milestone-.5,over_price:-110}));
  assert.equal(executableGames(v,'T90')[0].picks.length,10);
  assert.deepEqual(executableGames(v,'T90')[0].picks.map(p=>p.row.id),picks(v).map(p=>p.row.id));
  assert.equal(executableGames(v,'T90','Geno Smith')[0].picks.length,3);
  delete v.artifact.lines;assert.equal(systemCandidates(v,'T90').length,26);assert.equal(executableGames(v,'T90')[0].picks.length,0);
});

import {gameShareData,shareFilename,shortModelVersion} from '../src/nfl/shareCard.ts';
import {teamBrand} from '../src/nfl/teamBrand.ts';
import {shareBlob,EXPORT_WIDTH,EXPORT_HEIGHT} from '../src/lib/exportImage.ts';
import NflGameShareCard from '../src/components/NflGameShareCard.tsx';
const shareData=(v=nyj(),mode:'system'|'bettable'='system')=>gameShareData(v,'2026_04_NYJ_CHI','T90',mode,now);
test('SYSTEM poster derives from 26 uncapped candidates, ranked with compareSystem, capped to SIX only in core',()=>{
 const v=nyj(),data=shareData(v),all=systemCandidates(v,'T90').sort(compareSystem);
 assert.equal(data.qualifyingCount,26);assert.equal(data.core.length,6);assert.deepEqual(data.core,all.slice(0,6));assert.equal(data.topProbability,all[0].target.probability);
});
test('deleting all sportsbook data leaves SYSTEM poster data AND rendered markup byte-identical',()=>{
 const v=nyj(),before=shareData(v),html=renderToStaticMarkup(React.createElement(NflGameShareCard,{data:before}));delete v.artifact.lines;delete v.artifact.lines_meta;
 assert.deepEqual(shareData(v),before);assert.equal(renderToStaticMarkup(React.createElement(NflGameShareCard,{data:shareData(v)})),html);
});
test('canonical export ignores screen filters and search, which cannot be passed as export eligibility',()=>{
 const v=nyj(),before=shareData(v);systemGames(v,'T90','Geno Smith','RUSH');todaysBest(v,'T90','','PASS');assert.deepEqual(shareData(v),before);assert.equal(before.core[0].row.player,'dandre swift');
});
test('fewer than six targets stay fewer; unavailable families have no fabricated leaders',()=>{
 const v=nyj(),keep=picks(v).slice(0,3).map(p=>p.row.id);v.artifact.alt_65=Object.fromEntries(v.rows.T90.map(r=>[r.id,keep.includes(r.id)?v.artifact.alt_65![r.id]:null]));
 const data=shareData(v);assert.equal(data.qualifyingCount,3);assert.equal(data.core.length,3);assert.deepEqual(data.leaders.map(l=>l.family),['REC']);
});
test('MODEL LEADERS uses best available PASS/RUSH/REC/TD from uncapped eligibility',()=>{
 const v=nyj(),data=shareData(v);for(const {family,pick} of data.leaders)assert.deepEqual(pick,systemGames(v,'T90','',family)[0].picks[0]);assert.deepEqual(data.leaders.map(l=>l.family),['PASS','RUSH','REC','TD']);
});
test('BETTABLE poster is a subset of model candidates and cannot be populated by books alone',()=>{
 const v=nyj(),all=systemCandidates(v,'T90'),geno=all.find(p=>p.row.player==='geno smith'&&p.row.outcome==='rush_yds')!;
 v.artifact.lines=[{game_id:geno.row.game_id,horizon:'T90',player:geno.row.player,outcome:geno.row.outcome,book:'Book',line:9.5,over_price:-110}];
 const data=shareData(v,'bettable');assert.equal(data.core.length,1);assert(all.some(p=>p.row.id===data.core[0].row.id));assert.equal(data.core[0].execution!.line,9.5);
 v.artifact.alt_65![geno.row.id]=null;assert.equal(shareData(v,'bettable').core.length,0);
});
test('stale line warning affects BETTABLE only, whose empty-state poster is honest',()=>{
 const v=nyj();v.artifact.lines_meta={generated_at_utc:'2026-09-27T00:00:00Z'};
 const system=shareData(v),bet=shareData(v,'bettable');assert.equal(system.lines,null);assert.equal(bet.lines!.stale,true);
 const render=(data:any)=>renderToStaticMarkup(React.createElement(NflGameShareCard,{data}));assert(!render(system).includes('LINES MAY HAVE MOVED'));assert.match(render(bet),/LINES MAY HAVE MOVED/);assert.match(render(bet),/NO VERIFIED EXECUTION MATCHES/);
});
test('missing draws never invents simulation count; fixed export size and local asset layout',()=>{
 const v=nyj();delete v.games[0].horizons.T90!.n_draws;const data=shareData(v);assert.equal(data.draws,null);
 const html=renderToStaticMarkup(React.createElement(NflGameShareCard,{data}));assert(!html.includes('DRAWS'));assert(html.includes('/nfl/teams/'));assert(!html.includes('src="http'));assert(!html.includes('https://'));assert.match(html,/width:1080px;height:1350px/);assert.equal(EXPORT_WIDTH,1080);assert.equal(EXPORT_HEIGHT,1350);
});
test('filename is deterministic, sanitized and model hashes do not clutter the poster',()=>{
 const data=shareData();assert.equal(shareFilename(data),'prop-edge-nyj-chi-t90-system-premium-w04.png');assert.equal(shareFilename({...data,mode:'bettable'}),'prop-edge-nyj-chi-t90-bettable-premium-w04.png');
 const unsafe=shareFilename({...data,game:{...data.game,away:'../NYJ /',home:'CHI?!'}});assert(!unsafe.includes('/'));assert.match(unsafe,/prop-edge-nyj-chi-/);assert.equal(shortModelVersion('p1c-f3b1fa3608f90253'),'p1c');
});
test('unknown team branding uses a safe neutral fallback; all NFL teams have local accents',()=>{
 assert.deepEqual(teamBrand('xyz'),{abbreviation:'XYZ',name:'XYZ',primary:'#66717E',secondary:'#AAB0B7',text:'#F0F4F5',logo:null,artwork:null});assert.equal(teamBrand('nyj').primary,'#125740');assert.notEqual(teamBrand('CHI').primary,teamBrand('NYJ').primary);
});
test('poster creation leaves interactive SYSTEM behavior, 286 outcomes and protected files unchanged',()=>{
 const v=nyj(),before=JSON.stringify(v),top=picks(v);shareData(v);shareData(v,'bettable');assert.equal(JSON.stringify(v),before);assert.deepEqual(picks(v),top);assert.equal(v.rows.T90.length,286);
 const base=execFileSync('git',['merge-base','HEAD','origin/main'],{encoding:'utf8'}).trim();for(const file of ['src/nfl/bettable.ts','src/nfl/phase1.ts','src/nfl/usePhase1.ts','server/nflPhase1.ts','src/App.tsx'])assert.equal(readFileSync(file,'utf8'),execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'}));
});
test('native file sharing tests supported, unsupported, not-allowed and cancellation separately',async()=>{
 const blob=new Blob(['png'],{type:'image/png'}),name='test.png';let received:any;
 assert.equal(await shareBlob(blob,name,{canShare:(data:any)=>data.files[0].type==='image/png',share:async(data:any)=>{received=data;}} as any),'shared');assert.equal(received.files[0].name,name);assert.equal(received.files[0].size,3);
 assert.equal(await shareBlob(blob,name,{} as any),'unsupported');assert.equal(await shareBlob(blob,name,{canShare:()=>false,share:async()=>{throw Error('must not call');}} as any),'unsupported');
 for(const [error,result] of [['NotAllowedError','unsupported'],['NotSupportedError','unsupported'],['AbortError','cancelled']])assert.equal(await shareBlob(blob,name,{canShare:()=>true,share:async()=>{throw new DOMException('test',error);}} as any),result);
 await assert.rejects(shareBlob(blob,name,{canShare:()=>true,share:async()=>{throw Error('unexpected failure');}} as any),/unexpected failure/);
});

test('poster claims separate model-only SYSTEM targets from BETTABLE execution data and leaders',()=>{
 const render=(mode:'system'|'bettable')=>renderToStaticMarkup(React.createElement(NflGameShareCard,{data:shareData(nyj(),mode)}));
 const system=render('system'),bet=render('bettable');
 assert.match(system,/MODEL-DERIVED 65%\+ TARGETS · NO SPORTSBOOK INPUTS/);
 assert(!bet.includes('NO SPORTSBOOK INPUTS'));
 assert.match(bet,/MODEL TARGETS ARE SPORTSBOOK-INDEPENDENT · SPORTSBOOK DATA USED ONLY FOR EXECUTION/);
 assert.match(bet,/NO VERIFIED EXECUTION MATCHES/);assert.match(bet,/SYSTEM LEADERS · MODEL ONLY/);
 assert(!bet.includes('>MODEL LEADERS<'));assert.match(system,/>MODEL LEADERS</);
});
test('shareBlob enters native share immediately, before yielding to any asynchronous work',async()=>{
 let called=false;
 const completion=shareBlob(new Blob(['prepared'],{type:'image/png'}),'prepared.png',{canShare:()=>true,share:()=>{called=true;return Promise.resolve();}} as any);
 assert.equal(called,true);assert.equal(await completion,'shared');
});

import {posterPresentation,localAsset,featuredPlayers,featuredFromCandidates,createAssetLoader} from '../src/nfl/posterAssets.ts';
import {POSTER_THEMES} from '../src/nfl/posterTheme.ts';
test('premium/clean presentation assembly is deterministic and cannot alter picks, ranks or model data',()=>{
 const data=shareData(),before=JSON.stringify(data);
 for(const theme of ['premium','clean'] as const){assert.deepEqual(posterPresentation(data,theme),posterPresentation(data,theme));assert.equal(JSON.stringify(data),before);}
 assert(posterPresentation(data).background);assert.equal(posterPresentation(data,'clean').background,null);
 assert.equal(posterPresentation(data).players.length,4);assert.equal(POSTER_THEMES.premium.label,'PREMIUM');
});
test('local branding covers all 32 clubs and aliases; no remote logo dependency',()=>{
 const teams='ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAR LAC LV MIA MIN NE NO NYG NYJ PHI PIT SEA SF TB TEN WSH'.split(' ');
 for(const team of teams){const brand=teamBrand(team);assert(brand.logo);assert(readFileSync(`public${brand.logo}`).length>100);assert(brand.name!==team);}
 assert.equal(teamBrand('LA').logo,teamBrand('LAR').logo);assert.equal(teamBrand('WAS').logo,teamBrand('WSH').logo);
});
test('featured identities derive from uncapped eligible SYSTEM candidates; two unique players per team',()=>{
 const v=nyj(),all=systemCandidates(v,'T90'),before=JSON.stringify(all),selected=featuredPlayers(v,'2026_04_NYJ_CHI','T90');
 assert.deepEqual(selected,featuredFromCandidates(all,['NYJ','CHI']));assert.equal(selected.length,4);
 for(const team of ['NYJ','CHI']){const heroes=selected.filter(p=>p.team===team);assert.equal(heroes.length,2);assert.equal(new Set(heroes.map(p=>p.key)).size,2);for(const h of heroes)assert(all.some(p=>p.row.team===team&&p.row.player===h.name));}
 const duplicate=[...all,...all];assert.deepEqual(featuredFromCandidates(duplicate,['NYJ','CHI']),selected);assert.equal(JSON.stringify(all),before);
 delete v.artifact.lines;delete v.artifact.lines_meta;assert.deepEqual(featuredPlayers(v,'2026_04_NYJ_CHI','T90'),selected);
});
test('generic heroes populate premium without claiming likeness; verified local cutouts take priority',()=>{
 const v=nyj(),data=shareData(v),featured=featuredPlayers(v,data.game.game_id,'T90'),before=JSON.stringify(data);
 const fallback=posterPresentation(data,'premium',{},featured);assert.equal(fallback.players.length,4);assert(fallback.players.every(p=>p.kind==='generic'&&!p.src));
 const html=renderToStaticMarkup(React.createElement(NflGameShareCard,{data,visual:fallback}));assert.equal((html.match(/data-testid="generic-football-hero"/g)||[]).length,4);assert(html.includes('not a player likeness'));assert.equal(JSON.stringify(data),before);
 const config={players:{[featured[0].key]:{src:`/nfl/players/${featured[0].key}.webp`,source:'User licensed asset',permission:'Documented commercial redistribution permission',verified:true}}};
 const visual=posterPresentation(data,'premium',config,featured);assert.equal(visual.players[0].kind,'cutout');assert(visual.players[0].src!.endsWith('.webp'));
 config.players[featured[0].key].verified=false;assert.equal(posterPresentation(data,'premium',config,featured).players[0].kind,'generic');
 assert.equal(posterPresentation(data,'clean',config,featured).players.length,0);
});
test('unsafe remote assets cannot enter poster; missing known-team art uses intentional local scene',()=>{
 const data=shareData(),visual=posterPresentation(data,'premium',{games:{[data.game.game_id]:{background:'https://bad.example/art.jpg'}}});
 assert.equal(visual.background,null);assert(visual.atmosphere);assert(visual.away.logo&&visual.home.logo);
 for(const path of ['//example.com/a.png','/nfl/../a.png','/nfl/a.png?url=https://bad.example','data:image/png;base64,abc'])assert.equal(localAsset(path),null);
});
test('both poster themes remain sportsbook-independent and canonical under active screen filters',()=>{
 const v=nyj(),before=shareData(v);systemGames(v,'T90','Geno Smith','RUSH');delete v.artifact.lines;delete v.artifact.lines_meta;
 for(const theme of ['premium','clean'] as const){const render=(data:any)=>renderToStaticMarkup(React.createElement(NflGameShareCard,{data,theme}));assert.equal(render(shareData(v)),render(before));}
 assert.equal(v.rows.T90.length,286);assert.deepEqual(shareData(v).core,before.core);
});

import {playerKey} from '../src/nfl/playerAssets.ts';
import {cityAtmosphere} from '../src/nfl/cityAtmosphere.ts';
test('player keys normalize deterministically, independent of team/outcome',()=>{
 assert.equal(playerKey("D’Andre Swift"),'dandre-swift');assert.equal(playerKey("D'Andre Swift"),'dandre-swift');assert.equal(playerKey('  José SMITH Jr. '),'jose-smith-jr');assert.equal(playerKey('../Geno Smith?!'),'geno-smith');
});
test('every known team gets original city/stadium atmosphere; unknown uses abstract fallback',()=>{
 for(const team of 'ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAR LAC LV MIA MIN NE NO NYG NYJ PHI PIT SEA SF TB TEN WSH LA WAS'.split(' '))assert(cityAtmosphere(team)?.label.includes('stadium lights'));
 assert.equal(cityAtmosphere('XYZ'),null);assert.equal(cityAtmosphere('NE')?.motif,'coast');assert.equal(cityAtmosphere('DEN')?.motif,'mountains');
});
test('theme-specific filenames are deterministic and cannot collide',()=>{
 const data=shareData();assert.equal(shareFilename(data,'clean'),'prop-edge-nyj-chi-t90-system-clean-w04.png');assert.notEqual(shareFilename(data,'premium'),shareFilename(data,'clean'));assert.equal(shareFilename({...data,mode:'bettable'},'premium'),'prop-edge-nyj-chi-t90-bettable-premium-w04.png');
});
test('failed asset loads are evicted, pending loads shared and successes cached',async()=>{
 let calls=0;const load=createAssetLoader(async()=>++calls>1);
 assert.equal(await load('/local'),false);assert.equal(calls,1);assert.equal(await load('/local'),true);assert.equal(calls,2);assert.equal(await load('/local'),true);assert.equal(calls,2);
 let resolve!:(ok:boolean)=>void;const pending=createAssetLoader(()=>new Promise<boolean>(done=>{resolve=done;}));const a=pending('/a'),b=pending('/a');assert.equal(a,b);await Promise.resolve();resolve(true);assert.equal(await a,true);
 const rejected=createAssetLoader(async()=>{throw Error('transient');});assert.equal(await rejected('/a'),false);assert.equal(await rejected('/a'),false);
});
