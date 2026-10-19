import test from 'node:test';
import assert from 'node:assert/strict';
import {computeSoccerResearch} from '../server/soccerResearch';
import {LEAGUES} from '../src/soccer/model';

function fakeDataset(season:string) {
 const startYear=Number(season.slice(0,4));
 const matches=[];
 const names=Array.from({length:20},(_,i)=>'Club '+i);
 for(let round=0;round<18;round++)for(let pair=0;pair<10;pair++){
   const home=names[(pair*2+round)%20],away=names[(pair*2+round+1)%20];
   const date=new Date(Date.UTC(startYear,8,1+round*4)).toISOString().slice(0,10);
   matches.push({date,team1:home,team2:away,score:{ft:[(pair+round)%4,(pair*2+round)%3]}});
 }
 return {name:'Source test',matches};
}
test('mock multi-league independent research does not invent bets and carries baseline scores',async()=>{
 const seen:string[]=[];
 const fetcher=async (url:RequestInfo|URL)=>{
   const str=String(url);seen.push(str);
   const season=str.match(/20\d\d-\d\d/)?.[0]||'2025-26';
   return {ok:true,text:async()=>JSON.stringify(fakeDataset(season))} as Response;
 };
 const report=await computeSoccerResearch(new Date('2026-10-18T19:00:00Z'),fetcher as typeof fetch);
 assert.equal(seen.length,20);
 assert.equal(report.schema,'soccer-v1-five-league-raw-results-research-v1');
 assert.equal(report.league_count,5);
 assert(report.historical_audit.overall.n>=500);
 assert.equal(report.guardrails.official_bets,0);
 assert.equal(report.guardrails.verified_live_book_lines,0);
 assert.equal(report.guardrails.historical_backtest_was_not_original_frozen_firstseen,true);
 assert(report.original_source_receipts.every(r=>r.sha256.length===64));
 assert(report.forecasts.every(f=>f.status==='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'));
});
test('missing source must fail closed, not publish four leagues with favorable performance',async()=>{
 const fetcher=async (url:RequestInfo|URL)=>{
   if(String(url).includes('/fr.1.json'))return {ok:false,status:404,text:async()=>''} as Response;
   return {ok:true,text:async()=>JSON.stringify(fakeDataset('2025-26'))} as Response;
 };
 await assert.rejects(computeSoccerResearch(new Date('2026-10-18T19:00:00Z'),fetcher as typeof fetch),/SOCCER_SOURCE_HTTP_404/);
});
