/** Read immutable NBA Phase1 V3 pregame full-distribution research.
 * NOT a model betting endpoint; do not retroactively rewrite original games.
 */
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import type {Request,Response} from 'express';
import {overlayNba} from './lineupOverlay.ts';
import {overlayNewestRuns} from './nbaV3Latest.ts';
export const NBA_V3_READONLY_SCHEMA='NBA_V3_FULL_GAME_DISTRIBUTION_READ_ONLY_V1';
const ROOT=path.resolve(process.cwd(),'docs','nba_v3_phase1_corrected_shadow');
const VERSION='nba-v3-phase1-opportunity-role-mc-shotratefix-20261026';
const sha=(s:unknown)=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
type ShadowRow={
 game_id:string;team_id:string;player_id:string;player:string;
 model_version:string;
 market:'points'|'rebounds'|'assists'|'three_pointers_made'|'steals'|'blocks'|'turnovers';
 mean:number;median:number;p10:number;p25:number;p75:number;p90:number;
 p_active:number;role_share:number;exp_opp:number;sd:number;
 model_target:{milestone:number;probability:number;method:string}|null;
 cdf_lattice:{step:1;cdf:number[]};
 unc_reasons:string[];calibrated_for_2026_27:false;
 research_only:true;not_an_official_bet:true;reported_status:string;
};
type ShadowGame={
 game_id:string;tipoff_utc:string;forecast_at_utc:string;
 home:string;away:string;rows_count:number;rows:ShadowRow[];
 seed_source_sha256:string;
 source_opportunity_pace:Record<string,unknown>;
 team_opportunity_diagnostics:Record<string,unknown>;
};
const finite=(x:unknown)=>typeof x==='number'&&Number.isFinite(x);
/** V3, or the V4 / V5 shadow (same file format, same checks). */
const okVersion=(v:unknown)=>v===VERSION||(typeof v==='string'&&/^nba-v[45]-[a-z0-9-]+$/.test(v));
export function validateShadowHeader(d:any){
  if(d.schema!=='NBA_V3_2026_27_FIRSTSEEN_FULL_DISTRIBUTION_SHADOW_V1'||
     !okVersion(d.model_version)||
     !sha(d.upstream_fixtures_source_sha256)||
     !sha(d.prior_game_id_sha256)||
     d.roster_sources_verified_all_30!==true||
     !Number.isInteger(d.historical_source_boxes)||
     d.historical_source_boxes<100||
     d.model_promoted!==false||d.live_nba_system_board_changed!==false||
     d.official_bets!==0||d.research_only!==true||
     d.no_lookahead_or_retrospective_backfill!==true||
     d.games_forecast!==d.games.length)
      throw Error('NBA_V3_SHADOW_UNTRUSTED_PUBLICATION');
}
export function validateShadowGame(g:ShadowGame,seen:Set<string>){
    const tip=Date.parse(g.tipoff_utc);
    if(seen.has(g.game_id)||
       !sha(g.seed_source_sha256)||
       !finite(tip)||!finite(Date.parse(g.forecast_at_utc))||
       Date.parse(g.forecast_at_utc)>tip-15*60000||
       g.rows_count!==g.rows.length)
      throw Error('NBA_V3_DUPLICATE_OR_AFTER_TIP_FORECAST');
    seen.add(g.game_id);
    const ids=new Set<string>();
    for(const r of g.rows){
      const key=r.team_id+'|'+r.player_id+'|'+r.market;
      if(ids.has(key)||r.game_id!==g.game_id||
         !okVersion(r.model_version)||
         !['points','rebounds','assists','three_pointers_made','steals','blocks','turnovers'].includes(r.market)||
         r.calibrated_for_2026_27!==false||r.research_only!==true||
         r.not_an_official_bet!==true||
         !finite(r.mean)||!finite(r.median)||!finite(r.p_active)||
         r.p_active<0||r.p_active>1||
         r.cdf_lattice?.step!==1||!Array.isArray(r.cdf_lattice.cdf)||
         r.cdf_lattice.cdf.some((v,i)=>
            !finite(v)||v<0||v>1||(i>0&&v<r.cdf_lattice.cdf[i-1])))
        throw Error('NBA_V3_UNSUPPORTED_SIMULATED_MODEL_CDF');
      if(r.model_target){
         const t=r.model_target.milestone;
         const expected=t>0&&t<=r.cdf_lattice.cdf.length?
             1-r.cdf_lattice.cdf[t-1]:NaN;
         if(!Number.isInteger(t)||!finite(expected)||
            r.model_target.probability<.65||
            Math.abs(expected-r.model_target.probability)>.00001)
            throw Error('NBA_V3_FAKE_TARGET_PROBABILITY');
      }
      ids.add(key);
    }
}
export function loadNbaV3Shadow(now=new Date(),root=ROOT){
 if(!Number.isFinite(now.getTime()))throw Error('NBA_V3_INVALID_REQUEST_CLOCK');
 const docs=existsSync(root)?readdirSync(root).filter(x=>/^20\d\d-\d\d-\d\dT\d{6}Z\.json$/.test(x)).sort():[];
 const seen=new Set<string>(),out:ShadowGame[]=[];
 let verified=0;
 for(const name of docs){
  const d=JSON.parse(readFileSync(path.join(root,name),'utf8'));
  validateShadowHeader(d);
  for(const g of d.games as ShadowGame[]){
    validateShadowGame(g,seen);verified++;
    const tip=Date.parse(g.tipoff_utc);
    // Keep scheduled and currently underway games, not long-finished rows.
    if(tip>now.getTime()-4*3600000 && tip<now.getTime()+8*86400000)
      out.push(g);
  }
 }
 out.sort((a,b)=>a.tipoff_utc.localeCompare(b.tipoff_utc));
 return {
   schema:NBA_V3_READONLY_SCHEMA,
   status:!docs.length?'NO_FIRSTSEEN_V3_SHADOW_YET':
          !out.length?'NO_ACTIVE_UPCOMING_V3_PRETIP_SHADOWS':'AVAILABLE_RESEARCH_ONLY',
   firstseen_source_files:docs.length,
   original_games_audited:verified,
   games:out,upcoming_games:out.length,
   research_only:true,official_bets:0,
   prospective_model_probability_calibration_verified:false,
   v2_original_predictions_remain_champion:true,
   sportsbook_lines_required:false,
   disclosure:'Full simulated NBA basketball outcomes, NOT yet independently forward-calibrated; model milestones are RESEARCH ONLY, not bookmaker bets. Never backfill original pregame forecasts.'
 };
}
export function nbaV3ShadowHandler(){
 return async (_req:Request,res:Response)=>{
  try {
   const result=loadNbaV3Shadow();
   res.setHeader('Cache-Control','no-store, max-age=0');
   // Late lineup overlay: fail-open, keeps the early forecast beside the adjusted one.
   res.json(await overlayNba(overlayNewestRuns(result)));
  }catch(err){
   res.setHeader('Cache-Control','no-store, max-age=0');
   res.status(503).json({error:'NBA_V3_FIRSTSEEN_DISTRIBUTION_SOURCE_NOT_VERIFIED',
     detail:String(err),research_only:true,official_bets:0});
  }
 };
}
