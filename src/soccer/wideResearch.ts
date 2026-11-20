/** Read-only dynamically discovered football competitions and season-only
 * quantitative research. All catalog rows are counted, including skipped
 * competitions and events for which the model lacks useful history.
 */
import {createHash} from 'node:crypto';
import {forecastMatch,type Forecast,type Match} from './model';
import {readWideCatalog,sourceUrls,parseWideCompetition,
 isRegulationLeague,wideMatchKey,WIDE_SOURCE_ROOT,WIDE_SEASON,
 type WideFixture,type WideCatalog,type WideLeague} from './wideSource';

export const WIDE_RESEARCH_SCHEMA='soccer-worldwide-fixtures-and-original-model-research-v1' as const;
export type WideLeagueStatus={id:string;name:string;folder:string;
 status:'FORECAST_ELIGIBLE'|'INSUFFICIENT_HISTORY'|'NON_REGULATION_SCORE'|'SOURCE_UNAVAILABLE';
 reason:string;pastResults:number;futureFixtures:number;forecastCount:number;};
export type WideSourceReceipt={competition:string;resultsUrl:string;fixturesUrl:string;
 resultsSha256:string;fixturesSha256:string;};
export type WideBoard={
 schema:typeof WIDE_RESEARCH_SCHEMA;asof_calendar_day_utc:string;
 generated_at_utc:string;catalog_generated_at_utc:string;
 source:'OPEN_MATCHDAY_2627';season:string;competition_count:number;
 competitions:WideLeagueStatus[];forecasts:Forecast[];fixtures:WideFixture[];
 forecast_count:number;fixture_count:number;source_receipts:WideSourceReceipt[];
 guardrails:{official_bets:0;calibrated:false;verified_live_book_lines:0;
 available_competition_discovery:true;date_only_no_verified_kickoff:true;
 current_season_only:true;unverified_regulation_cups_suppressed:true;
 original_five_model_untouched:true};
};
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const date=(x:string)=>new Date(x).toISOString().slice(0,10);
const dayShift=(ymd:string,n:number)=>new Date(Date.parse(ymd+'T00:00:00Z')+
 n*86400000).toISOString().slice(0,10);
const priors=(ms:Match[],team:string)=>ms.filter(
 m=>m.home===team||m.away===team).length;
const supported=(l:WideLeague,history:Match[],fixture:WideFixture)=>{
 // This deliberately blocks synthetic team-injury and lineup assumptions,
 // very-low-information cup opponents, and sparse same-season history.
 if(!isRegulationLeague(l)||history.length<45)return false;
 return priors(history,fixture.home)>=4&&priors(history,fixture.away)>=4;
};
function safeResultDate(ms:Match[],asof:string){
 // A future-dated FINAL can indicate a broken provider, never train on it.
 if(ms.some(m=>m.date>asof))throw Error('SOCCER_WIDE_FUTURE_FINAL_SOURCE');
 return ms.filter(m=>m.date<asof);
}
async function fetchRaw(fetcher:typeof fetch,url:string){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const r=await fetcher(url,{signal:controller.signal,
   headers:{Accept:url.endsWith('.json')?'application/json':'text/csv'}});
  if(!r.ok)throw Error('HTTP_'+r.status);
  const s=await r.text();
  if(s.length>1500000||s.length<15)throw Error('INVALID_SOURCE_BYTES');
  return s;
 }finally{clearTimeout(timeout);}
}
export async function computeWideResearch(now:Date=new Date(),
 fetcher:typeof fetch=fetch,catalogUrl=WIDE_SOURCE_ROOT+'build_summary.json'
):Promise<{board:WideBoard;verifiedFinals:Match[]}>{
 if(!Number.isFinite(now.getTime()))throw Error('SOCCER_WIDE_BAD_CLOCK');
 const current=date(now.toISOString());
 const summaryRaw=await fetchRaw(fetcher,catalogUrl);
 const catalog:WideCatalog=readWideCatalog(JSON.parse(summaryRaw));
 const lag=now.getTime()-Date.parse(catalog.generated_at_utc);
 if(lag< -60*60000||lag>96*3600000)
   throw Error('SOCCER_WIDE_CATALOG_OUT_OF_DATE');
 const leagues=catalog.leagues,board:WideBoard={
  schema:WIDE_RESEARCH_SCHEMA,asof_calendar_day_utc:current,
  generated_at_utc:now.toISOString(),
  catalog_generated_at_utc:catalog.generated_at_utc,
  source:'OPEN_MATCHDAY_2627',season:WIDE_SEASON,
  competition_count:leagues.length,competitions:[],forecasts:[],
  fixtures:[],forecast_count:0,fixture_count:0,source_receipts:[],
  guardrails:{official_bets:0,calibrated:false,verified_live_book_lines:0,
   available_competition_discovery:true,date_only_no_verified_kickoff:true,
   current_season_only:true,unverified_regulation_cups_suppressed:true,
   original_five_model_untouched:true}
 };
 const verifiedFinals:Match[]=[];
 // Bound source fanout so this never creates 150 simultaneous outbound calls.
 for(let offset=0;offset<leagues.length;offset+=6){
  const chunk=leagues.slice(offset,offset+6);
  const rows=await Promise.all(chunk.map(async l=>{
   const entry:WideLeagueStatus={id:l.id,name:l.name,folder:l.folder,
    status:'SOURCE_UNAVAILABLE',reason:'NOT_FETCHED',pastResults:0,
    futureFixtures:0,forecastCount:0};
   if(l.errors.length){
    entry.reason='UPSTREAM_REPORTED_ERRORS';return {entry,receipt:null,
       finals:[] as Match[],fixtures:[] as WideFixture[],
       forecasts:[] as Forecast[]};
   }
   try{
    const urls=sourceUrls(l);
    const [resultRaw,fixtureRaw]=await Promise.all([
     fetchRaw(fetcher,urls.results),fetchRaw(fetcher,urls.fixtures)]);
    const parsed=parseWideCompetition(l,resultRaw,fixtureRaw);
    // The live catalog can update between summary and payload fetch.
    // A smaller payload than the published count is treated as unverified.
    if(parsed.results.length<l.results||parsed.fixtures.length<l.fixtures)
      throw Error('CATALOG_MISMATCH_FEWER_SOURCE_ROWS');
    const history=safeResultDate(parsed.results,current);
    const max=dayShift(current,21);
    const future=parsed.fixtures.filter(f=>f.date>current&&f.date<=max);
    const receipt={competition:l.id,resultsUrl:urls.results,
      fixturesUrl:urls.fixtures,resultsSha256:hash(resultRaw),
      fixturesSha256:hash(fixtureRaw)};
    entry.pastResults=history.length;entry.futureFixtures=future.length;
    const regulation=isRegulationLeague(l);
    const forecasts:Forecast[]=[];
    if(regulation){
     for(const f of future){
      if(!supported(l,history,f))continue;
      const result=forecastMatch(history,
        {...f,homeGoals:null,awayGoals:null},current);
      if(result.league!==l.id||result.date!==f.date||
         !Number.isFinite(result.expectedHomeGoals)||
         !Number.isFinite(result.expectedAwayGoals))
        throw Error('SOCCER_WIDE_INVALID_PREDICTION');
      forecasts.push(result);
     }
    }
    entry.forecastCount=forecasts.length;
    entry.status=!regulation?'NON_REGULATION_SCORE':
      forecasts.length>0?'FORECAST_ELIGIBLE':'INSUFFICIENT_HISTORY';
    entry.reason=!regulation?'CUP_OR_UEFA_REGULATION_SCORE_UNVERIFIED':
      forecasts.length?'HISTORY_SUFFICIENT_CURRENT_SEASON':
      'MINIMUM_45_LEAGUE_RESULTS_AND_FOUR_PER_TEAM';
    return {entry,receipt,finals:history,fixtures:future,forecasts};
   }catch(e){
    entry.reason='SOURCE_FAILURE_'+String(e instanceof Error?e.message:e).slice(0,90);
    return {entry,receipt:null,finals:[] as Match[],
      fixtures:[] as WideFixture[],forecasts:[] as Forecast[]};
   }
  }));
  for(const x of rows){
   board.competitions.push(x.entry);
   if(x.receipt)board.source_receipts.push(x.receipt);
   board.fixtures.push(...x.fixtures);
   board.forecasts.push(...x.forecasts);
   verifiedFinals.push(...x.finals);
  }
 }
 if(board.competitions.length!==leagues.length)
  throw Error('SOCCER_WIDE_DISCOVERY_DROPPED_COMPETITION');
 // No silent denominator changes or duplicate forecasts by source fixture.
 const keyed=new Set<string>();
 for(const x of board.forecasts){
  const k=wideMatchKey(x);
  if(keyed.has(k))throw Error('SOCCER_WIDE_DUPLICATE_MODEL_FORECAST');
  keyed.add(k);
 }
 board.forecast_count=board.forecasts.length;
 board.fixture_count=board.fixtures.length;
 // Fail this snapshot closed if almost everything is unavailable; the old
 // five-league board remains intact and unchanged.
 if(board.source_receipts.length<Math.max(5,Math.floor(leagues.length*.60)))
  throw Error('SOCCER_WIDE_BROKEN_MAJORITY_OF_SOURCES');
 board.forecasts.sort((a,b)=>a.date.localeCompare(b.date)||a.league.localeCompare(b.league)||
   a.home.localeCompare(b.home));
 board.fixtures.sort((a,b)=>a.date.localeCompare(b.date)||a.league.localeCompare(b.league)||
   a.home.localeCompare(b.home));
 return {board,verifiedFinals};
}
