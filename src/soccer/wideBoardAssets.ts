/// <reference types="vite/client" />
/** Source-proven wide competition board, statically available even with API offline.
 * New snapshots never rewrite previously committed original forecasts.
 */
import latest from '../../docs/soccer_wide/board.json';
import type {Forecast} from './model';
import type {WideBoard} from './wideResearch';
const WIDE_RESEARCH_SCHEMA='soccer-worldwide-fixtures-and-original-model-research-v1';
import {wideMatchKey} from './wideSource';
const frozen=import.meta.glob('../../docs/soccer_wide/originals/*.json',{
 eager:true,import:'default'
}) as Record<string,unknown>;
type Original={schema:string;id:string;captured_at_utc:string;
 source_results_sha256:string;source_fixtures_sha256:string;
 forecast:Forecast};
const iso=(s:string)=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(s).toISOString()===s;
export const WIDE_TO_CORE:Record<string,string>={
 'ENG_1_premier-league':'EPL','ESP_1_la-liga':'LaLiga',
 'ITA_1_serie-a':'SerieA','GER_1_bundesliga':'Bundesliga',
 'FRA_1_ligue-1':'Ligue1'
};
export function wideSoccerBoard(atUtc:string){
 const x=latest as WideBoard;
 if(!iso(atUtc)||x.schema!==WIDE_RESEARCH_SCHEMA||
    x.source!=='OPEN_MATCHDAY_2627'||x.guardrails.official_bets!==0||
    x.guardrails.calibrated!==false||
    x.guardrails.verified_live_book_lines!==0||
    !Array.isArray(x.competitions)||!Array.isArray(x.fixtures)||
    !Array.isArray(x.forecasts)||x.competition_count!==x.competitions.length||
    x.fixture_count!==x.fixtures.length||
    x.forecast_count!==x.forecasts.length)
   throw Error('SOCCER_WIDE_SOURCE_BOARD_INVALID');
 // Never show a formerly valid source snapshot forever after it went stale.
 const age=Date.parse(atUtc)-Date.parse(x.generated_at_utc);
 if(age<0||age>96*3600000)return {...x,forecasts:[],fixtures:[]};
 return x;
}
export function wideSoccerOriginals(atUtc:string):Forecast[]{
 const out:Forecast[]=[];
 const seen=new Set<string>();
 for(const [path,raw] of Object.entries(frozen)){
   const x=raw as Original;
   const f=x?.forecast;
   if(!x||x.schema!=='soccer-wide-original-v1'||!f||
      !/^[a-f0-9]{32}$/.test(x.id)||!path.endsWith('/'+x.id+'.json')||
      !iso(x.captured_at_utc)||!x.source_results_sha256||
      !x.source_fixtures_sha256||f.date<=x.captured_at_utc.slice(0,10)||
      f.status!=='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET')
     throw Error('SOCCER_WIDE_ORIGINAL_ARCHIVE_INVALID');
   const key=wideMatchKey(f);
   if(seen.has(key))throw Error('SOCCER_WIDE_DUPLICATE_ARCHIVED_FIXTURE');
   seen.add(key);
   if(x.captured_at_utc<=atUtc&&f.date>=atUtc.slice(0,10))
     out.push(f);
 }
 return out;
}
export function wideLeagueNames(){
 const doc=latest as WideBoard;
 return Object.fromEntries(doc.competitions.map(x=>[x.id,x.name]));
}
