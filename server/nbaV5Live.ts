/** Serve the actual newest NBA V5 simulator forecast as the NBA frontend source.
 *
 * No V3/V4 overlay and no V2 fallback. Files are produced pretip by the V5
 * forecasting pipeline. This does not claim forward calibration or present
 * unvalidated bookmaker lines. An absent/old/malformed V5 forecast is an
 * explicit unavailable status, not substituted picks.
 */
import type {Request,Response} from 'express';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {validateShadowHeader,validateShadowGame} from './nbaV3Shadow.ts';

export const V5_CURRENT_FILE=path.resolve(process.cwd(),'docs','nba_v5_latest','latest.json');
export const NBA_V5_LIVE_SCHEMA='NBA_V5_DIRECT_SYSTEM_FORECAST_V1' as const;
export const V5_FRESHNESS_MS=16*3600000;
const HORIZON_MS=7*86400000;

const invalid=(reason:string,generated_at_utc:string|null=null)=>({
  schema:NBA_V5_LIVE_SCHEMA,status:reason,games:[],
  games_forecast:0,generated_at_utc,model_version:null,
  source_model:'NBA_V5_ONLY',sportsbook_lines_required:false,
  forward_calibrated:false,official_bets:0
});
const isV5=(s:unknown):s is string=>
  typeof s==='string'&&/^nba-v5-[a-z0-9-]+$/.test(s);
const isTime=(value:unknown):value is string=>
  typeof value==='string'&&Number.isFinite(Date.parse(value));
const finite=(x:unknown):x is number=>
  typeof x==='number'&&Number.isFinite(x);

/** Validate the complete source before discarding stale/finished games.
 * One corrupt game must be reported, never silently ignored as a pick.
 */
export function readDirectV5Forecast(now=Date.now(),file=V5_CURRENT_FILE){
  if(!Number.isFinite(now))throw Error('NBA_V5_INVALID_CLOCK');
  if(!existsSync(file))return invalid('NBA_V5_SOURCE_NOT_PUBLISHED');
  let doc:any;
  try {doc=JSON.parse(readFileSync(file,'utf8'));}
  catch{return invalid('NBA_V5_SOURCE_UNREADABLE');}
  try{
    validateShadowHeader(doc);
    if(!isV5(doc.model_version)||!isTime(doc.generated_at_utc))
      throw Error('NBA_V5_INVALID_OR_WRONG_MODEL');
    const created=Date.parse(doc.generated_at_utc);
    if(created>now+5*60000 || created<now-V5_FRESHNESS_MS)
      return invalid('NBA_V5_SOURCE_STALE',doc.generated_at_utc);
    const seen=new Set<string>();
    for(const g of doc.games){
      validateShadowGame(g,seen);
      if(!isV5(g.model_version)||!String(g.forecast_kind||'').startsWith('V5'))
        throw Error('NBA_V5_GAME_WRONG_MODEL');
      if(g.rows.some((r:any)=>!isV5(r.model_version)))
        throw Error('NBA_V5_ROW_WRONG_MODEL');
    }
    // Games enter the board from the actual V5 result, never from a V3
    // first-seen list. The original graded source remains immutable.
    const upcoming=doc.games.filter((g:any)=>{
      const tip=Date.parse(g.tipoff_utc);
      return tip>now-4*3600000&&tip<now+HORIZON_MS;
    }).sort((a:any,b:any)=>a.tipoff_utc.localeCompare(b.tipoff_utc));
    return {
      schema:NBA_V5_LIVE_SCHEMA,status:upcoming.length?'NBA_V5_AVAILABLE':'NBA_V5_NO_CURRENT_GAMES',
      generated_at_utc:doc.generated_at_utc,model_version:doc.model_version,
      games_forecast:upcoming.length,games:upcoming,
      source_model:'NBA_V5_ONLY',sportsbook_lines_required:false,
      forward_calibrated:false,official_bets:0,
      feature_switches:upcoming.length?upcoming[0].simulation_pieces_on:null,
      source_quality:doc.authorized_source_quality??[],
      source_disclosure:'Direct pretip NBA V5 game simulations; V4 mixture for selected player markets. Percentages are model-estimated, not established forward-calibrated hit rates.'
    };
  }catch(e){
    return {...invalid('NBA_V5_SOURCE_REJECTED',doc?.generated_at_utc??null),
            validation_error:e instanceof Error?e.message:String(e)};
  }
}

export function nbaV5LiveHandler(clock=Date.now,file=V5_CURRENT_FILE){
  return (_req:Request,res:Response)=>{
    const result=readDirectV5Forecast(clock(),file);
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('X-NBA-Model-Source','NBA_V5_DIRECT');
    res.status(result.status==='NBA_V5_SOURCE_REJECTED'?503:200).json(result);
  };
}
