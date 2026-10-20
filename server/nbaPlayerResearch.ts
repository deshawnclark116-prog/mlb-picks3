import type {Request,Response} from 'express';
import frozenOriginal from '../docs/nba_v2_opening_player_firstseen.json';
import {parseNbaPlayerResearch} from '../src/nba/playerResearch.ts';

/** Picks3 native Express API, separate from the older Render mlb-picks2 API.
 *  Reads ONLY the original saved before-tipoff source file. No odds-provider
 *  requests, no live/post-tip player rebuilding, no implicit betting lines.
 */
export function nbaPlayerResearchHandler(){
  return (_req:Request,res:Response)=>{
    res.setHeader('Cache-Control','public, max-age=90');
    try {
      return res.json(parseNbaPlayerResearch(frozenOriginal));
    } catch(error){
      console.error('[NBA V2 first-seen player research] failed closed:',error);
      return res.status(503).json({
        error:'NBA_ORIGINAL_PLAYER_RESEARCH_UNAVAILABLE',
        details:'Original pretipoff NBA V2 research file failed source/roster/identity integrity; no replacement forecasts may be reconstructed.'
      });
    }
  };
}
