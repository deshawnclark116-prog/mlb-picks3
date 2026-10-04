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

// The complete published 286-row NYJ/CHI universe, with downstream lines only.
import { bettableGames, bettablePicks, normalizePlayer, exactAltMarket, lineFreshness } from '../src/nfl/bettable.ts';
import { BettableCard, NflPhase1Board } from '../src/components/NflTodayScreen.tsx';
const nyjSource=JSON.parse(readFileSync(new URL('./fixtures/nfl-nyj-chi-bettable.json',import.meta.url),'utf8'));
const nyj=()=>parsePhase1(structuredClone(nyjSource),new Date(Date.parse(nyjSource.status.last_shadow_run_utc)+60000));
test('286 model outcomes produce 16 eligible markets and only 10 default BETTABLE picks',()=>{
  const v=nyj(),picks=bettablePicks(v,'T90');assert.equal(v.rows.T90.length,286);assert.equal(picks.length,16);assert.equal(bettableGames(v,'T90')[0].picks.length,10);
  assert.equal(groupGames(v,'T90')[0].rows.length,286);
  const html=renderToStaticMarkup(React.createElement(NflPhase1Board,{view:v,loading:false,error:null,retrievedAt:null,refresh:async()=>{}}));
  assert.match(html,/10 BETTABLE PICKS/);assert(!html.includes('286 player outcomes'));
});
test('real line join requires game, horizon, normalized player and exact outcome',()=>{
  assert.equal(normalizePlayer('  D’Andre   Swift '),'dandre swift');const v=nyj();v.artifact.lines=[{...nyjSource.lines[0],player:' BRAELON   ALLEN '}];
  assert.equal(bettablePicks(v,'T90').length,1);
  for(const patch of [{game_id:'wrong'},{horizon:'T24'},{player:'unknown'},{outcome:'tackles'}]){v.artifact.lines=[{...nyjSource.lines[0],...patch}];assert.equal(bettablePicks(v,'T90').length,0);}
});
test('low-active backup UNDER cannot rank, including real Tyson Bagent and Isaiah Davis',()=>{
  const v=nyj(),picks=bettablePicks(v,'T90');assert(!picks.some(p=>['tyson bagent','isaiah davis'].includes(p.row.player)));
  const r=v.rows.T90.find(r=>r.player==='braelon allen'&&r.outcome==='rec_yds')!;
  v.artifact.lines=[{...nyjSource.lines[0],p_over:.001,p_under:.999}];r.p_active=.7499;assert.equal(bettablePicks(v,'T90').length,0);
  r.p_active=.75;assert.equal(bettablePicks(v,'T90')[0].side,'UNDER');r.p_active=null;assert.equal(bettablePicks(v,'T90').length,0);
  assert(v.rows.T90.some(r=>r.player==='tyson bagent'));
});
test('invalid lines/probabilities/book and ambiguous identities do not become picks',()=>{
  const v=nyj();
  for(const patch of [{line:NaN},{line:Infinity},{p_over:null},{p_under:1.1},{p_over:-.1},{p_under:NaN},{p_over:.8,p_under:.8},{book:''}]){
    v.artifact.lines=[{...nyjSource.lines[0],...patch}];assert.equal(bettablePicks(v,'T90').length,0);
  }
  v.artifact.lines=[nyjSource.lines[0]];const r=v.rows.T90.find(r=>r.player==='braelon allen'&&r.outcome==='rec_yds')!;
  v.rows.T90.push({...r,id:'ambiguous'});assert.equal(bettablePicks(v,'T90').length,0);
});
test('each side and selected odds come directly from probabilities; tie selects UNDER',()=>{
  const v=nyj();
  for(const [over,under,side,odds] of [[.6,.4,'OVER',-109],[.4,.6,'UNDER',-115],[.5,.5,'UNDER',-115]] as const){
    v.artifact.lines=[{...nyjSource.lines[0],p_over:over,p_under:under}];const p=bettablePicks(v,'T90')[0];assert.equal(p.side,side);assert.equal(p.odds,odds);assert.equal(p.probability,Math.max(over,under));
  }
});
test('ranking descends by probability deterministically, no extra probability gate or padding',()=>{
  const v=nyj(),p=bettablePicks(v,'T90');assert.equal(p[0].row.player,'geno smith');assert.equal(p[0].probability,.705);
  assert(p.every((x,i)=>!i||p[i-1].probability>=x.probability));assert.deepEqual(bettablePicks(v,'T90'),p);
  v.artifact.lines=nyjSource.lines.slice(0,4);assert.equal(bettableGames(v,'T90')[0].picks.length,4);
  v.artifact.lines=[{...nyjSource.lines[0],p_over:.499,p_under:.501}];assert.equal(bettableGames(v,'T90')[0].picks.length,1);
});
test('BETTABLE filters preserve search/outcome and exclude model-only defense markets',()=>{
  const v=nyj();assert.equal(bettableGames(v,'T90','garrett')[0].picks.length,1);
  assert(bettableGames(v,'T90','','rush_yds')[0].picks.every(p=>p.row.outcome==='rush_yds'));
  assert.equal(bettableGames(v,'T90','','tackles').length,0);assert(v.rows.T90.some(r=>r.outcome==='tackles'));
});
test('T24 and T90 line matching never crosses horizons even with both forecast sets',()=>{
  const v=nyj();v.rows.T24=v.rows.T90.map(r=>({...r,id:'T24-'+r.id}));
  assert.equal(bettablePicks(v,'T24').length,0);v.artifact.lines=[{...nyjSource.lines[0],horizon:'T24'}];
  assert.equal(bettablePicks(v,'T90').length,0);assert.equal(bettablePicks(v,'T24').length,1);
});
test('60-minute line freshness boundary, missing timestamp and visible stale warning without hiding picks',()=>{
  const v=nyj();v.artifact.lines_meta={generated_at_utc:new Date(now-3600000).toISOString()};assert.equal(lineFreshness(v,now).stale,false);
  assert.equal(lineFreshness(v,now+1).stale,true);v.artifact.lines_meta={};assert.equal(lineFreshness(v,now).unknown,true);
  v.artifact.lines_meta=nyjSource.lines_meta;
  const html=renderToStaticMarkup(React.createElement(NflPhase1Board,{view:v,loading:false,error:null,retrievedAt:null,refresh:async()=>{}}));
  assert.match(html,/LINE MAY HAVE MOVED — verify before placing/);assert.match(html,/Sportsbook lines updated:/);assert.match(html,/10 BETTABLE PICKS/);
});
test('unconfirmed 65% milestone is MODEL ALT TARGET; exact horizon/player/outcome/line alone confirms alt',()=>{
  const v=nyj(),p=bettablePicks(v,'T90')[0],alt=v.artifact.alt_65![p.row.id]!;assert(alt);
  const render=()=>renderToStaticMarkup(React.createElement(BettableCard,{pick:p,view:v,horizon:'T90',cutoff:v.games[0].horizons.T90!.cutoff}));
  assert.match(render(),/MODEL ALT TARGET/);assert(!render().includes('BETTABLE ALT'));
  assert.equal(exactAltMarket(v,p.row,'T90',alt.milestone),false);
  const exact={...p.market,line:alt.milestone,horizon:'T24'};v.artifact.lines=[exact];assert.equal(exactAltMarket(v,p.row,'T90',alt.milestone),false);
  v.artifact.lines=[{...exact,horizon:'T90'}];assert.match(render(),/BETTABLE ALT/);
});
test('cards display book odds, probability, median, mean, active probability, cutoff, horizon; no confidence bucket',()=>{
  const v=nyj(),p=bettablePicks(v,'T90').find(p=>p.row.player==='garrett wilson')!;
  const html=renderToStaticMarkup(React.createElement(BettableCard,{pick:p,view:v,horizon:'T90',cutoff:v.games[0].horizons.T90!.cutoff}));
  for(const text of ['UNDER','76.5','draftkings','-114','58.7%','Projection (median)','66 yds','Expected average (mean)','99.5%','T90','Information cutoff'])assert(html.includes(text));
  assert(!/HIGH|MEDIUM/.test(html));
});
test('downstream joins leave all forecasts and alt calculations unchanged; other sports and source pipeline byte-identical',()=>{
  const v=nyj(),before=JSON.stringify(v.rows),artifact=JSON.stringify(v.artifact.forecasts),alts=JSON.stringify(v.artifact.alt_65);
  bettablePicks(v,'T90');bettableGames(v,'T90');assert.equal(JSON.stringify(v.rows),before);assert.equal(JSON.stringify(v.artifact.forecasts),artifact);assert.equal(JSON.stringify(v.artifact.alt_65),alts);
  const base=execFileSync('git',['merge-base','HEAD','origin/main'],{encoding:'utf8'}).trim();
  for(const file of ['src/App.tsx','src/nfl/phase1.ts','src/nfl/usePhase1.ts','server/nflPhase1.ts','server.ts'])assert.equal(readFileSync(file,'utf8'),execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'}));
});
