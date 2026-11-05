/** NBA V3 "latest run": a re-simulation made closer to tip-off (with the current injury list), shown INSTEAD of the original
 *  four-day-old forecast when it is newer, valid and trustworthy. The original first-seen forecast is never deleted: it stays in
 *  docs/nba_v3_phase1_corrected_shadow (the graded record) and is reported as `first_seen_forecast_at_utc` on the merged game.
 *  Fail-open: anything missing, stale, malformed or failing the same validation as the original leaves the original forecast. */
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {validateShadowHeader,validateShadowGame} from './nbaV3Shadow.ts';

// Read from the app's own checkout (like the original V3 files): this repo is private, so a web fetch of a raw file would 404.
export const LATEST_FILE=path.resolve(process.cwd(),'docs','nba_v3_latest','latest.json');
export const LATEST_MAX_AGE_MS=10*3600_000;
const MIN_PREGAME_MS=15*60_000;

export function mergeLatestRun(result:any,doc:any,now=Date.now()){
 const none=(reason:string)=>({...result,latest_run:{applied:0,reason}});
 if(!doc||typeof doc!=='object')return none('NO_LATEST_FILE');
 try{validateShadowHeader(doc);}catch{return none('LATEST_HEADER_REJECTED');}
 const made=Date.parse(doc.generated_at_utc);
 if(!Number.isFinite(made)||now-made>LATEST_MAX_AGE_MS||made-now>600_000)return none('LATEST_STALE_OR_FUTURE');
 const byId=new Map<string,any>((result.games??[]).map((g:any)=>[String(g.game_id),g]));
 const seen=new Set<string>(),replacements=new Map<string,any>();
 for(const g of doc.games as any[]){
  const orig=byId.get(String(g.game_id));
  if(!orig)continue;                                           // only refresh games the app already shows
  try{validateShadowGame(g,seen);}catch{continue;}            // identical checks to the original forecasts
  const at=Date.parse(g.forecast_at_utc),tip=Date.parse(g.tipoff_utc);
  if(g.tipoff_utc!==orig.tipoff_utc)continue;                  // same game, same tip-off
  if(!(at>Date.parse(orig.forecast_at_utc)))continue;          // must be newer than the original
  if(at>tip-MIN_PREGAME_MS||at>now+600_000)continue;           // never a post-tip or future-dated forecast
  replacements.set(String(g.game_id),{...g,forecast_kind:'LATEST_RUN',first_seen_forecast_at_utc:orig.forecast_at_utc,
    first_seen_forecast_preserved_in_archive:true});
 }
 const games=(result.games??[]).map((g:any)=>replacements.get(String(g.game_id))??g);
 return {...result,games,latest_run:{applied:replacements.size,generated_at_utc:doc.generated_at_utc,reason:replacements.size?'OK':'NO_NEWER_VALID_GAMES'}};
}

export function overlayLatestRun(result:any,file=LATEST_FILE,now=Date.now()){
 try{
  if(!existsSync(file))return {...result,latest_run:{applied:0,reason:'NO_LATEST_FILE'}};
  return mergeLatestRun(result,JSON.parse(readFileSync(file,'utf8')),now);
 }catch{return {...result,latest_run:{applied:0,reason:'LATEST_FILE_UNREADABLE'}};}
}
