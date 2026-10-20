import type {Request,Response} from 'express';
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import originalOpening from '../docs/nba_v2_opening_player_firstseen.json';
import {combineRollingNbaOriginals} from '../src/nba/rollingResearch.ts';

const DIR=path.resolve(process.cwd(),'docs','nba_rolling_predictions');
const GRADE=path.resolve(process.cwd(),'docs','nba_v2_rolling_grade_status.json');

/** Live source is the immutable main-branch archive, NOT a Render/picks2 proxy.
 * Read at request time so GitHub-published original pretip records can appear
 * without an unsafe sports odds refresh or a fresh statistical simulation.
 */
export function nbaRollingResearchHandler(){
  return (_req:Request,res:Response)=>{
    res.setHeader('Cache-Control','no-store, max-age=0');
    try {
      const names=existsSync(DIR)?readdirSync(DIR)
        .filter(name=>/^20\d\d-\d\d-\d\dT\d{6}Z\.json$/.test(name)):[];
      const sources=names.map(filename=>({
        filename,original:JSON.parse(readFileSync(path.join(DIR,filename),'utf8'))
      }));
      const openingIds=originalOpening.forecasts.map(g=>g.game_id);
      return res.json(combineRollingNbaOriginals(sources,openingIds,new Date()));
    }catch(err){
      console.error('[NBA V2 original rolling research] fail closed:',err);
      return res.status(503).json({error:'NBA_ROLLING_SOURCE_CONTRACT_FAILED',
        details:'Archived NBA first-seen source identity or prior-only model proof failed validation; no recreated picks are shown.'});
    }
  };
}

/** Source-only game-summary grading; never conflate a numeric projection and a bet. */
export function nbaRollingGradeHandler(){
  return (_req:Request,res:Response)=>{
    res.setHeader('Cache-Control','no-store, max-age=0');
    if(!existsSync(GRADE))return res.json({
      schema:'NBA_V2_ROLLING_GRADE_SOURCE_STATUS_V1',
      status:'NO_POSTGAME_GRADE_PUBLISHED_YET',
      original_rolling_games:0,original_player_forecasts:0,
      note:'Original predictions may exist; this is NOT evidence that an ungraded game won.'
    });
    try {
      const d=JSON.parse(readFileSync(GRADE,'utf8')) as Record<string,any>;
      if(d.schema!=='NBA_V2_ALL_IMMUTABLE_ROLLING_PLAYER_STATS_ACTUAL_GRADES_V1'||
         d.official_bets!==0||d.originals_immutable!==true||
         d.original_player_forecasts*4!==d.all_original_four_market_stat_forecasts_accounted||
         d.verified_played_stat_outcomes+
            d.verified_DNP_conditional_stats_not_applicable+
            d.unverified_conditional_stats!==d.all_original_four_market_stat_forecasts_accounted){
        throw new Error('NBA grade row accounting invalid');
      }
      return res.json(d);
    }catch(err){
      console.error('[NBA original V2 grade] verification failed:',err);
      return res.status(503).json({error:'NBA_ROLLING_GRADE_NOT_TRUSTWORTHY'});
    }
  };
}
