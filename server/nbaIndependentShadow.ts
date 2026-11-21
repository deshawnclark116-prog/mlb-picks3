/** Never substitute V5, V4 or V2 numbers for the independent model.
 * Read the actual source-published independent pretip JSON, even when the
 * Render/AI Studio server is on a stale checkout. No prediction is computed
 * here, and all original numeric values were fitted in Python pregame.
 */
import {readFileSync} from 'node:fs';
import path from 'node:path';
import type {Request,Response} from 'express';

export const INDEPENDENT_SCHEMA='NBA_INDEPENDENT_DIRECT_LIVE_PRETIP_SHADOW_V1';
export const INDEPENDENT_VERSION='nba-independent-direct-prior-date-head-v1';
export const INDEPENDENT_PUBLIC_URL=
 'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks3/main/docs/nba_independent_live/latest.json';
const MAX_BYTES=2_000_000;
const MAX_AGE_MS=24*3600_000;
const POLL_MS=90_000;
const MARKETS=['points','rebounds','assists','three_pointers_made'] as const;
export type IndependentSourceGetter=(url:string, init:RequestInit)=>Promise<Response>;
const isSha=(s:unknown)=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
function date(s:unknown):number{
 if(typeof s!=='string')throw Error('NBA_INDEPENDENT_MISSING_SOURCE_TIME');
 const d=Date.parse(s);
 if(!Number.isFinite(d))throw Error('NBA_INDEPENDENT_UNTIMED');
 return d;
}
export function validateIndependentLive(doc:unknown, now:number){
 const x=doc as Record<string,any>;
 if(!x||x.schema!==INDEPENDENT_SCHEMA||x.model_version!==INDEPENDENT_VERSION||
   x.research_only!==true||x.official_bets!==0||
   x.prospective_calibration_verified!==false||
   x.no_sportsbook_probability!==true||
   x.projections_conditional_on_playing!==true||
   x.individual_starter_certified!==false||
   x.model_is_not_the_v5_serving_champion!==true||
   x.model_2025_validation_arm!=='direct'||!isSha(x.source_v3_sha256)||
   !isSha(x.source_game_history_sha256)||!Array.isArray(x.games))
    throw Error('NBA_INDEPENDENT_RESEARCH_INTEGRITY_FAILED');
 const created=date(x.generated_at_utc),source=date(x.source_v3_generated_at_utc);
 if(created>now+60_000||source>created+60_000||created-source>MAX_AGE_MS||
    now-created>MAX_AGE_MS)
   throw Error('NBA_INDEPENDENT_STALE_OR_FUTURE_SOURCE');
 if(x.games.length!==x.games_forecast)
   throw Error('NBA_INDEPENDENT_GAME_COUNT_MISMATCH');
 const ids=new Set<string>();
 let rows=0,players=0;
 for(const g of x.games){
   if(typeof g.game_id!=='string'||! /^\d{1,12}$/.test(g.game_id)||
      ids.has(g.game_id)||typeof g.home!=='string'||
      typeof g.away!=='string'||!Array.isArray(g.players)||
      g.forecast_at_utc!==x.generated_at_utc)
      throw Error('NBA_INDEPENDENT_INVALID_PREGAME_GAME');
   ids.add(g.game_id);
   const tip=date(g.tipoff_utc);
   if(tip<=created+60_000)throw Error('NBA_INDEPENDENT_FORECAST_AFTER_TIP');
   if(g.players.length!==g.players_forecast)
     throw Error('NBA_INDEPENDENT_PLAYERS_COUNT_INVALID');
   const seen=new Set<string>();
   for(const p of g.players){
     const k=String(p.team_id)+'|'+String(p.player_id);
     if(seen.has(k)||!p.player||!p.player_id||!p.team_id||
        !Number.isFinite(p.source_active_probability_unverified)||
        p.source_active_probability_unverified<.75||
        p.source_active_probability_unverified>1||
        p.active_or_starter_certified!==false)
       throw Error('NBA_INDEPENDENT_UNSAFE_PLAYER_SELECTION');
     seen.add(k);
     players++;
     for(const m of MARKETS){
       const v=p.predictions?.[m];
       if(v===undefined)continue;
       if(!Number.isFinite(v)||v<0||v>250)
          throw Error('NBA_INDEPENDENT_INVALID_NUMERIC_FORECAST');
       rows++;
     }
   }
   if(g.rows_count!==g.players.reduce((n:number,p:any)=>
     n+MARKETS.filter(m=>p.predictions?.[m]!==undefined).length,0))
       throw Error('NBA_INDEPENDENT_PROJECTIONS_COUNT_INVALID');
 }
 if(x.rows_forecast!==rows||x.players_forecast!==players)
   throw Error('NBA_INDEPENDENT_GLOBAL_COUNTS_INVALID');
 return x;
}
async function bounded(resp:Response){
 if(!resp.ok)throw Error('NBA_INDEPENDENT_REMOTE_HTTP_'+resp.status);
 const size=Number(resp.headers.get('content-length')||0);
 if(size>MAX_BYTES)throw Error('NBA_INDEPENDENT_EXCESSIVE_SOURCE_SIZE');
 const raw=await resp.text();
 if(!raw||raw.length>MAX_BYTES)throw Error('NBA_INDEPENDENT_INCOMPLETE_SOURCE');
 return JSON.parse(raw) as unknown;
}
export function createIndependentLiveLoader(get:IndependentSourceGetter=fetch){
 let lastAt=0,cached:any|null=null,lastError:string|null=null;
 let active:Promise<void>|null=null;
 async function update(now:number){
   if(lastAt&&now-lastAt<POLL_MS)return;
   if(active)return active;
   active=(async()=>{
     lastAt=now;
     try{
       const url=INDEPENDENT_PUBLIC_URL+'?nocache='+Math.floor(now/POLL_MS);
       const resp=await get(url,{signal:AbortSignal.timeout(10000),
         cache:'no-store',headers:{Accept:'application/json'}});
       cached=validateIndependentLive(await bounded(resp),now);
       lastError=null;
     }catch(e){
       lastError=e instanceof Error?e.message:String(e);
       // Stale local binaries must never outrank a newer source or
       // manufacture a forecast after the game. Only accept a VALID
       // self-identifying local original model with no future timestamps.
       if(cached)return;
       try{
         const file=path.resolve(process.cwd(),'docs','nba_independent_live','latest.json');
         cached=validateIndependentLive(JSON.parse(readFileSync(file,'utf8')),now);
       }catch{cached=null;}
     }
   })();
   try{await active;}finally{active=null;}
 }
 return async(now=Date.now())=>{
   if(!Number.isFinite(now))throw Error('NBA_INDEPENDENT_INVALID_NOW');
   await update(now);
   if(!cached)return {
     schema:INDEPENDENT_SCHEMA,status:'SOURCE_NOT_YET_PUBLISHED',
     research_only:true,official_bets:0,model_version:INDEPENDENT_VERSION,
     games:[],games_forecast:0,source_state:'SOURCE_UNAVAILABLE',
     source_error:lastError
   };
   try{validateIndependentLive(cached,now);}
   catch{return {
     schema:INDEPENDENT_SCHEMA,status:'STALE_SOURCE_REJECTED',
     research_only:true,official_bets:0,model_version:INDEPENDENT_VERSION,
     games:[],games_forecast:0,source_state:'SOURCE_UNAVAILABLE',
     source_error:lastError||'NBA_INDEPENDENT_CACHED_SOURCE_STALE'
   };}
   return {...cached,source_state:lastError?'VALIDATED_LOCAL_OR_RECENT_SOURCE':'VERIFIED_PUBLISHED_SOURCE',
     source_error:lastError,
     games:cached.games.filter((g:any)=>{
       const tip=Date.parse(g.tipoff_utc);
       // Current game-day previews remain visible briefly after tip, but
       // no new after-tip forecast may be created, changed, or backfilled.
       return tip>now-3*3600_000;
     })};
 };
}
export const loadIndependentLive=createIndependentLiveLoader();
export function nbaIndependentShadowHandler(){
 return async(_req:Request,res:Response)=>{
   try{res.setHeader('Cache-Control','no-store');res.json(await loadIndependentLive());}
   catch(e){res.status(503).json({
     schema:INDEPENDENT_SCHEMA,research_only:true,official_bets:0,
     error:e instanceof Error?e.message:'NBA_INDEPENDENT_FETCH_FAILED',
     games:[]});}
 };
}
