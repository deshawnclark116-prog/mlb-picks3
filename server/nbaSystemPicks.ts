/** NBA NFL-style SYSTEM PICKS board, not a 900-player-stat research dump.
 * The primary board is a small ranked decision list. The full original
 * forecast record is retained separately for historical accountability.
 * Never manufacture a price/line, official pick, 65% probability or ROI.
 */
import type {Request,Response} from 'express';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import originalOpening from '../docs/nba_v2_opening_player_firstseen.json';
import {parseNbaPlayerResearch} from '../src/nba/playerResearch.ts';
import {combineRollingNbaOriginals} from '../src/nba/rollingResearch.ts';
import {buildNbaSystemBoard,type InputGame,type InputPlayer} from '../src/nba/decisionBoard.ts';

const ROOT=path.resolve(process.cwd(),'docs','nba_rolling_predictions');
const now=()=>new Date();

export function readVerifiedNbaSystemBoard(current=now()){
  const opening=parseNbaPlayerResearch(originalOpening);
  const files=existsSync(ROOT)?readdirSync(ROOT)
    .filter(filename=>/^20\d\d-\d\d-\d\dT\d{6}Z\.json$/.test(filename))
    .map(filename=>({
      filename,original:JSON.parse(readFileSync(path.join(ROOT,filename),'utf8'))
    })):[];
  const rolled=combineRollingNbaOriginals(files,
      opening.forecasts.map(g=>g.game_id),current);
  const source:InputGame[]=[
    ...opening.forecasts.map(g=>({
      ...g,source:'FROZEN_OPENING_V2' as const,
      original_at_utc:opening.generated_at_utc,
      players:g.players as InputPlayer[]
    })),
    ...rolled.forecasts.map(g=>({
      ...g,source:'ROLLING_ORIGINAL_V2' as const,
      original_at_utc:g.first_seen_at_utc,
      players:g.players as InputPlayer[]
    })),
  ];
  const board=buildNbaSystemBoard(source);
  // Limit mobile board to games close to today's action. The independent
  // grader retains ALL original game/player/stat predictions regardless.
  const left=current.getTime()-24*3600*1000;
  const right=current.getTime()+4*24*3600*1000;
  const games=board.games.filter(g=>{
    const t=Date.parse(g.tipoff_utc);
    return t>=left&&t<right;
  });
  return {
    ...board,original_game_count:source.length,
    games,
    displayed_system_picks:games.reduce((n,g)=>n+g.picks.length,0),
    games_with_picks:games.filter(g=>g.picks.length).length,
    displayed_game_count:games.length,
    priced_market_status:'NO_VERIFIED_NBA_BOOKMAKER_PROP_LINE_FEED',
    official_bets:0 as const
  };
}

export function nbaSystemPicksHandler(){
  return (_req:Request,res:Response)=>{
    res.setHeader('Cache-Control','no-store, max-age=0');
    try {
      return res.json(readVerifiedNbaSystemBoard());
    }catch(error){
      console.error('[NBA V2 picks] original prediction source failed',error);
      return res.status(503).json({
        error:'NBA_SYSTEM_BOARD_ORIGINAL_SOURCE_INVALID',
        details:'Unable to verify all saved original NBA forecasts and role/injury gates. No invented alternative picks were generated.'
      });
    }
  };
}
