import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 readWideCatalog,sourceUrls,parseWideCompetition,isRegulationLeague,wideMatchKey
} from '../src/soccer/wideSource';
import {computeWideResearch} from '../src/soccer/wideResearch';

const codes=['ENG_2_championship','USA_1_mls','UEFA_1_champions-league',
 'GER_2_2-bundesliga','ARG_1_liga-profesional','AUS_1_a-league'];
const catalog=(n=6)=>({season:'2627',generated_utc:'2026-11-20T12:00:00Z',
 leagues:codes.slice(0,n).map((code)=>({
  league:code,folder:'data/'+code,results:60,fixtures:2,latest:'2026-10-30',errors:[]
 }))});
const csv=()=>{
 const lines=['gw,date,time,home,away,ft_home,ft_away,source'];
 for(let i=0;i<60;i++){
  const d=new Date(Date.UTC(2026,8,1+i)).toISOString().slice(0,10);
  const h=i%8,a=(i+1)%8;
  lines.push('1,'+d+',12:00,Club '+h+',Club '+a+',1,0,espn');
 }
 return lines.join('\n');
};
const fixtures='gw,date,time,home,away\n1,2026-11-23,12:00,Club 0,Club 1\n'+
 '2,2026-11-24,15:00,Club 2,Club 3';
const mockFetch=(tamper?:string)=>{
 const calls:string[]=[];
 const fn=async (url:RequestInfo|URL)=>{
  const u=String(url);calls.push(u);
  if(u.includes('build_summary.json'))
   return {ok:true,text:async()=>JSON.stringify(catalog())} as Response;
  if(tamper&&u.includes(tamper))return {ok:false,status:502,text:async()=>''} as Response;
  return {ok:true,text:async()=>u.includes('results_2627.csv')?csv():fixtures} as Response;
 };
 return {fn:fn as typeof fetch,calls};
};
test('source catalog dynamically enumerates six diverse competitions, no five-league fixed limit',()=>{
 const x=readWideCatalog(catalog());
 assert.equal(x.leagues.length,6);
 assert(x.leagues.some(l=>l.id==='USA_1_mls'));
 assert(x.leagues.some(l=>l.id==='UEFA_1_champions-league'));
 assert(sourceUrls(x.leagues[1]).results.endsWith('results_2627.csv'));
 assert.throws(()=>readWideCatalog({...catalog(),leagues:[
   ...catalog().leagues,catalog().leagues[0]]}),/DUPLICATED/);
});
test('explicit full-time source preserves 0 goals, never infers from fixture time',()=>{
 const l=readWideCatalog(catalog()).leagues[0];
 const v=parseWideCompetition(l,csv(),fixtures);
 assert.equal(v.results.length,60);assert.equal(v.fixtures.length,2);
 assert.equal(v.results[0].awayGoals,0);
 assert.equal(v.fixtures[0].kickoffUtc,null);
 assert.equal(v.fixtures[0].home,'Club 0');
 assert.notEqual(wideMatchKey(v.results[0]),wideMatchKey(v.fixtures[0]));
 const bad=csv().replace(',1,0,espn',',,0,espn');
 assert.throws(()=>parseWideCompetition(l,bad,fixtures),/INVALID_FINAL/);
 assert.throws(()=>parseWideCompetition(l,csv()+'\n'+csv().split('\n')[1],fixtures),/DUPLICATE_RESULT/);
});
test('knockout and youth 90-minute result not presumed valid, MLS and second tier supported',()=>{
 const l=readWideCatalog(catalog()).leagues;
 assert.equal(isRegulationLeague(l[0]),true);
 assert.equal(isRegulationLeague(l[1]),true);
 assert.equal(isRegulationLeague(l[2]),false);
 assert.equal(isRegulationLeague({...l[0],id:'ENG_CUP_fa-cup'}),false);
});
test('full dynamic original source computes real prior-only numerical models and retains unmodeled cups',async()=>{
 const fetch=mockFetch();
 const {board}=await computeWideResearch(new Date('2026-11-20T20:00:00Z'),fetch.fn);
 assert.equal(fetch.calls.length,1+6*2);
 assert.equal(board.competition_count,6);
 assert.equal(board.source_receipts.length,6);
 assert.equal(board.fixture_count,12);
 assert.equal(board.forecast_count,10);
 assert.equal(board.competitions.find(x=>x.id==='UEFA_1_champions-league')?.status,
   'NON_REGULATION_SCORE');
 assert(board.forecasts.every(f=>f.date>'2026-11-20'&&
   f.status==='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'));
 assert.equal(board.guardrails.official_bets,0);
 assert.equal(board.guardrails.calibrated,false);
});
test('tampering a SAME-DAY result never changes the next-day forecast training cutoff',async()=>{
 const original=mockFetch();
 const a=(await computeWideResearch(new Date('2026-11-20T20:00:00Z'),original.fn))
  .board.forecasts;
 const alt=mockFetch();
 const modified=async (url:RequestInfo|URL,init?:RequestInit)=>{
  const r=await alt.fn(url,init);
  if(String(url).includes('results_2627.csv'))
   return {ok:true,text:async()=>(await r.text())+
     '\n2,2026-11-20,12:00,Club 0,Club 1,30,0,espn'} as Response;
  return r;
 };
 const b=(await computeWideResearch(new Date('2026-11-20T20:00:00Z'),
   modified as typeof fetch)).board.forecasts;
 assert.deepEqual(a,b);
});
test('source failure is disclosed, not erased from all-competition denominator',async()=>{
 const {fn}=mockFetch('ARG_1_liga-profesional');
 const {board}=await computeWideResearch(new Date('2026-11-20T20:00:00Z'),fn);
 assert.equal(board.competition_count,6);
 assert.equal(board.source_receipts.length,5);
 assert.equal(board.competitions.find(x=>x.id==='ARG_1_liga-profesional')?.status,
  'SOURCE_UNAVAILABLE');
 assert.equal(board.guardrails.official_bets,0);
});
