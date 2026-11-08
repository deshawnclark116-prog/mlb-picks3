/** NBA V3 "latest run": a re-simulation made closer to tip-off (with the current injury list), shown INSTEAD of the original
 *  four-day-old forecast when it is newer, valid and trustworthy. The original first-seen forecast is never deleted: it stays in
 *  docs/nba_v3_phase1_corrected_shadow (the graded record) and is reported as `first_seen_forecast_at_utc` on the merged game.
 *  Fail-open: anything missing, stale, malformed or failing the same validation as the original leaves the original forecast. */
import {existsSync,readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {validateShadowHeader,validateShadowGame} from './nbaV3Shadow.ts';

// Read from the app's own checkout (like the original V3 files): this repo is private, so a web fetch of a raw file would 404.
export const LATEST_FILE=path.resolve(process.cwd(),'docs','nba_v3_latest','latest.json');
export const V4_LATEST_FILE=path.resolve(process.cwd(),'docs','nba_v4_latest','latest.json');
export const V5_LATEST_FILE=path.resolve(process.cwd(),'docs','nba_v5_latest','latest.json');
export const V5_SWITCH_FILE=path.resolve(process.cwd(),'docs','nba_v5_latest','screen.json');
export const V5_LAST_ARCHIVE_DIR=path.resolve(process.cwd(),'docs','nba_v5_archive','last');
export function v5OnScreen(file=V5_SWITCH_FILE){
 try{return existsSync(file)&&JSON.parse(readFileSync(file,'utf8'))?.show===true;}catch{return false;}
}
export const LATEST_MAX_AGE_MS=10*3600_000;
const MIN_PREGAME_MS=15*60_000;

export function mergeLatestRun(result:any,doc:any,now=Date.now(),kind='LATEST_RUN'){
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
  replacements.set(String(g.game_id),{...g,forecast_kind:kind,first_seen_forecast_at_utc:orig.first_seen_forecast_at_utc??orig.forecast_at_utc,
    first_seen_forecast_preserved_in_archive:true});
 }
 const games=(result.games??[]).map((g:any)=>replacements.get(String(g.game_id))??g);
 return {...result,games,latest_run:{applied:replacements.size,generated_at_utc:doc.generated_at_utc,reason:replacements.size?'OK':'NO_NEWER_VALID_GAMES'}};
}

export function overlayLatestRun(result:any,file=LATEST_FILE,now=Date.now(),kind='LATEST_RUN'){
 try{
  if(!existsSync(file))return {...result,latest_run:{applied:0,reason:'NO_LATEST_FILE'}};
  return mergeLatestRun(result,JSON.parse(readFileSync(file,'utf8')),now,kind);
 }catch{return {...result,latest_run:{applied:0,reason:'LATEST_FILE_UNREADABLE'}};}
}

/** After a scheduled game leaves the replaceable V5 latest.json, preserve its
 * actual last pretip V5 forecast on the API board. This is a source-validated
 * replay of the saved pregame bytes, NOT a fresh projection or grade.
 *
 * The underlying V5 forecast writer freezes last/<game>.json.gz only when at
 * least 15 minutes remain before tip. We check that independently, enforce
 * same-game identity and an as-of clock, and keep an already newer V5 latest.
 * Missing/corrupt archives fail open to the existing V3/V4 board.
 */
export function overlaySavedNbaV5Pretip(result:any,root=V5_LAST_ARCHIVE_DIR,now=Date.now()){
 const originalLatest=result.latest_run;
 if(!Number.isFinite(now)||!existsSync(root))
  return {...result,v5_saved_pretip_run:{applied:0,reason:'NO_SAVED_V5_LAST_ARCHIVE'}};
 let current=result;
 const used:string[]=[];
 const rejected:string[]=[];
 for(const orig of result.games??[]){
  const tip=Date.parse(orig.tipoff_utc);
  if(!Number.isFinite(tip)||tip<=now-4*3600_000||tip>now+4*3600_000)
   continue;
  const id=String(orig.game_id);
  // Only numeric NBA game IDs may select a file. Never treat a game name as
  // an arbitrary pathname.
  if(!/^\d{1,12}$/.test(id))continue;
  const archive=path.join(root,id+'.json.gz');
  if(!existsSync(archive))continue;
  try{
   const compressed=readFileSync(archive);
   if(compressed.length>750_000)throw Error('NBA_V5_ARCHIVE_OVERSIZED');
   const raw=gunzipSync(compressed,{maxOutputLength:8_000_000}).toString('utf8');
   const doc=JSON.parse(raw);
   if(!/^nba-v5-[a-z0-9-]+$/.test(doc?.model_version??'')||
      !Array.isArray(doc?.games)||doc.games.length!==1||
      String(doc.games[0].game_id)!==id)
    throw Error('NBA_V5_ARCHIVE_WRONG_GAME_OR_MODEL');
   const g=doc.games[0];
   const made=Date.parse(doc.generated_at_utc);
   const at=Date.parse(g.forecast_at_utc);
   if(!Number.isFinite(made)||!Number.isFinite(at)||
      made>now||at>now||made>tip-MIN_PREGAME_MS||
      at>tip-MIN_PREGAME_MS||g.tipoff_utc!==orig.tipoff_utc)
    throw Error('NBA_V5_ARCHIVE_NOT_AUTHENTIC_ASOF_PRETIP');
   // The same header, game and player CDF validators used for live latest
   // MUST accept this saved source; don't loosen them to rescue a game.
   const next=mergeLatestRun(current,doc,now,'V5_LATEST');
   if(next.latest_run.applied>0){
    current=next;
    used.push(id);
   }
  }catch{
   rejected.push(id);
  }
 }
 return {...current,latest_run:originalLatest,v5_saved_pretip_run:{
  applied:used.length,game_ids:used,
  rejected_game_ids:rejected,
  reason:used.length?'AUTHENTIC_ARCHIVED_LAST_PRETIP':'NO_NEWER_VALID_PRETIP_ARCHIVES'
 }};
}

/** V3 latest run first, then V4, then the V5 simulation on top for any game where it is newer and passes the same checks. */
export function overlayNewestRuns(result:any,now=Date.now()){
 const v3=overlayLatestRun(result,LATEST_FILE,now,'LATEST_RUN');
 const v4=overlayLatestRun(v3,V4_LATEST_FILE,now,'V4_LATEST');
 // V5 is published as a shadow; it reaches the screen only when docs/nba_v5_latest/screen.json says {"show":true}.
 const enabled=v5OnScreen();
 const v5=enabled?overlayLatestRun(v4,V5_LATEST_FILE,now,'V5_LATEST'):{...v4,latest_run:{applied:0,reason:'V5_NOT_ON_SCREEN'}};
 const saved=enabled?overlaySavedNbaV5Pretip(v5,V5_LAST_ARCHIVE_DIR,now):v5;
 return {...saved,latest_run:v3.latest_run,v4_latest_run:v4.latest_run,
  v5_latest_run:v5.latest_run,
  v5_saved_pretip_run:enabled?saved.v5_saved_pretip_run:{applied:0,reason:'V5_NOT_ON_SCREEN'}};
}
