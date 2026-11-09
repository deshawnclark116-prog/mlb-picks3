/** Repair stale NBA V5 local checkouts in long-running preview/API processes.
 *
 * The real released files live in PUBLIC GitHub repository mlb-picks3. The
 * frontend API historically read only process.cwd()/docs, so a successful
 * source publication never updated an already-running AI Studio/Node preview.
 * This module checks the small source-timed readiness receipt every 60s and
 * fetches the large full V5 JSON ONLY when the published generation changes.
 * Missing from the replaceable latest is NOT missing from the as-of last
 * pretip archive. For those games only, recover source-verified compressed
 * archive snapshots. These are pre-existing forecast numbers, not retrofits.
 *
 * No credentials, private sources, sports betting lines, or lookahead.
 * On fetch, schema, timestamp, or identity error, preserve the existing
 * validated local V3/V4/V5 board rather than showing a speculative forecast.
 */
import {gunzipSync} from 'node:zlib';
import {mergeLatestRun} from './nbaV3Latest.ts';
import {validateShadowHeader} from './nbaV3Shadow.ts';

export const V5_PUBLIC_RELEASE_ROOT=
 'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks3/main';
const READINESS_PATH='/docs/nba_v5_latest/readiness.json';
const LATEST_PATH='/docs/nba_v5_latest/latest.json';
// Current multi-game V5 empirical releases exceed 5 MB. Keep a strict
// bounded download, sized for complete 8+ game distributions rather than
// rejecting valid new model generations and silently serving local V3/V4.
const MAX_LATEST_BYTES=12_000_000;
const MAX_ARCHIVE_BYTES=750_000;
const MAX_DECOMPRESSED_BYTES=8_000_000;
const MIN_PREGAME_MS=15*60_000;
const CHECK_EVERY_MS=60_000;
const MAX_ARCHIVE_GAMES=8;

export type GithubSourceGetter=(url:string,options:RequestInit)=>Promise<Response>;
type RecentArchive={checkedAt:number;doc:any|null};
const validDate=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
async function bounded(response:Response,limit:number):Promise<Buffer>{
 if(!response.ok)throw Error('NBA_V5_RELEASE_HTTP_'+response.status);
 const length=response.headers.get('content-length');
 if(length!==null&&Number(length)>limit)throw Error('NBA_V5_RELEASE_TOO_LARGE');
 const raw=Buffer.from(await response.arrayBuffer());
 if(!raw.length||raw.byteLength>limit)throw Error('NBA_V5_RELEASE_UNEXPECTED_BYTES');
 return raw;
}
async function fetchPublic(path:string,limit:number,get:GithubSourceGetter,at:number){
 const url=V5_PUBLIC_RELEASE_ROOT+path+'?v='+Math.floor(at/60_000);
 const response=await get(url,{
  signal:AbortSignal.timeout(9000),cache:'no-store',
  headers:{Accept:'application/json, */*'}
 });
 return bounded(response,limit);
}
function verifyArchive(doc:any,id:string,tip:string,now:number){
 if(!doc||!/^nba-v5-[a-z0-9-]+$/.test(doc.model_version)||
    !Array.isArray(doc.games)||doc.games.length!==1||
    String(doc.games[0]?.game_id)!==id||
    doc.games[0].tipoff_utc!==tip)
  throw Error('NBA_V5_PUBLIC_ARCHIVE_WRONG_GAME_OR_MODEL');
 validateShadowHeader(doc);
 const made=Date.parse(doc.generated_at_utc);
 const at=Date.parse(doc.games[0].forecast_at_utc);
 const kickoff=Date.parse(tip);
 if(!Number.isFinite(made)||!Number.isFinite(at)||
    made>now||at>now||made>kickoff-MIN_PREGAME_MS||
    at>kickoff-MIN_PREGAME_MS)
  throw Error('NBA_V5_PUBLIC_ARCHIVE_AFTER_TIP_OR_FUTURE');
 return doc;
}

/** Creates an independent TTL cache, injectable for deterministic CI tests.
 * Every runtime uses one shared default instance to deduplicate all UI polls.
 */
export function createPublishedV5Sync(get:GithubSourceGetter=fetch){
 let checkedAt=0;
 let readyGeneration:string|null=null;
 let latestDocument:any|null=null;
 let lastError:string|null=null;
 let refresh:Promise<void>|null=null;
 const archives=new Map<string,RecentArchive>();

 async function loadLatest(now:number){
  if(checkedAt&&now>=checkedAt&&now-checkedAt<CHECK_EVERY_MS)return;
  if(refresh)return refresh;
  refresh=(async()=>{
   checkedAt=now;
   try{
    const ready=JSON.parse((await fetchPublic(READINESS_PATH,60_000,get,now)).toString('utf8'));
    const generation=ready?.document_generated_at_utc;
    if(!validDate(generation)||ready?.schema!=='NBA_V5_FORECAST_READINESS_V1'||
       Date.parse(generation)>now+60_000||
       now-Date.parse(generation)>10*3600_000)
     throw Error('NBA_V5_PUBLIC_READINESS_UNTRUSTED_OR_STALE');
    if(readyGeneration===generation&&latestDocument){
     lastError=null;return;
    }
    const doc=JSON.parse((await fetchPublic(LATEST_PATH,MAX_LATEST_BYTES,get,now)).toString('utf8'));
    validateShadowHeader(doc);
    if(doc.model_version?.startsWith('nba-v5-')!==true||
       doc.generated_at_utc!==generation)
     throw Error('NBA_V5_LATEST_NOT_MATCHING_PUBLISHED_READINESS');
    // Only commit to the cache after the source and readiness agree.
    latestDocument=doc;
    readyGeneration=generation;
    lastError=null;
   }catch(e){
    lastError=e instanceof Error?e.message:'NBA_V5_REMOTE_SOURCE_UNAVAILABLE';
   }
  })();
  try{await refresh;}finally{refresh=null;}
 }

 async function loadArchive(id:string,tip:string,now:number){
  if(!/^\d{1,12}$/.test(id))return null;
  const cached=archives.get(id);
  if(cached&&now>=cached.checkedAt&&now-cached.checkedAt<CHECK_EVERY_MS)
   return cached.doc;
  let doc:any|null=null;
  try{
   const bytes=await fetchPublic(
    '/docs/nba_v5_archive/last/'+id+'.json.gz',MAX_ARCHIVE_BYTES,get,now);
   const json=gunzipSync(bytes,{maxOutputLength:MAX_DECOMPRESSED_BYTES}).toString('utf8');
   doc=verifyArchive(JSON.parse(json),id,tip,now);
  }catch{
   doc=null;
  }
  archives.set(id,{checkedAt:now,doc});
  return doc;
 }

 return async function overlayPublishedV5(result:any,now=Date.now()){
  if(!Number.isFinite(now))throw Error('NBA_V5_PUBLIC_INVALID_ASOF');
  const originalLatest=result.latest_run;
  await loadLatest(now);
  let current=result;
  let liveLatestApplied=0;
  let archiveApplied=0;
  const archiveIds:string[]=[];
  const liveGameIds=new Set<string>();
  if(latestDocument){
   for(const g of latestDocument.games??[])liveGameIds.add(String(g.game_id));
   const merged=mergeLatestRun(current,latestDocument,now,'V5_LATEST');
   liveLatestApplied=merged.latest_run?.applied??0;
   current=merged;
  }
  // As soon as a finished/tipping game falls off the replaceable latest
  // file, retain only its ORIGINAL saved pretip forecast. Source archives
  // cannot change any other game's original or a newer current V5.
  const relevant=(result.games??[]).filter((g:any)=>{
   const tip=Date.parse(g.tipoff_utc);
   return Number.isFinite(tip)&&tip>now-4*3600_000&&tip<now+4*3600_000&&
    !liveGameIds.has(String(g.game_id));
  }).slice(0,MAX_ARCHIVE_GAMES);
  const receipts=await Promise.all(relevant.map(async(g:any)=>({
   id:String(g.game_id),doc:await loadArchive(String(g.game_id),g.tipoff_utc,now)
  })));
  for(const {id,doc} of receipts){
   if(!doc)continue;
   const merged=mergeLatestRun(current,doc,now,'V5_LATEST');
   if((merged.latest_run?.applied??0)>0){
    archiveApplied++;
    archiveIds.push(id);
    current=merged;
   }
  }
  return {
   ...current,latest_run:originalLatest,
   v5_published_sync:{
    provider:'PUBLIC_GITHUB_V5_ASOF_RELEASE',
    checked_at_utc:new Date(checkedAt).toISOString(),
    latest_generation_at_utc:readyGeneration,
    latest_applied:liveLatestApplied,
    archived_game_ids_applied:archiveIds,
    archived_applied:archiveApplied,
    source_state:lastError?'SOURCE_UNAVAILABLE_LOCAL_FALLBACK':'SOURCE_VERIFIED',
    source_error:lastError,
    no_backfill_no_sportsbook_reprojection:true
   }
  };
 };
}
export const overlayPublishedV5=createPublishedV5Sync();
