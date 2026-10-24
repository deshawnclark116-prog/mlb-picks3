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
import {loadLiveNbaInjuries,liveStatusMap,requireFreshLiveAvailability,
  type LiveAvailability} from './nbaLiveAvailability.ts';

const ROOT=path.resolve(process.cwd(),'docs','nba_rolling_predictions');
const now=()=>new Date();

export function readVerifiedNbaSystemBoard(current=now(),
  availability?:LiveAvailability){
  if(availability)requireFreshLiveAvailability(availability,current);
  const injuryById=availability?liveStatusMap(availability):null;
  let freshlyBlockedCount=0;
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
  // The immutable numerical forecasts remain unchanged in Git. Only the
  // SERVING DECISION uses today's source with exact ESPN team+player IDs.
  // Apply BEFORE choosing the best two picks so healthy eligible players
  // are not hidden by an unavailable player ranking above them.
  const adjusted=source.map(g=>({...g,players:g.players.map(p=>{
    const live=injuryById?.get(p.team_id+'|'+p.player_id);
    const blocked=live!=null&&
      !['AVAILABLE','PROBABLE'].includes(live);
    if(blocked)freshlyBlockedCount++;
    return {...p,
      espn_source_reported_injury_status:blocked?live:
        // Preserve older reported OUT/DOUBTFUL risk if the latest ESPN feed
        // simply stopped listing the player; absent != proven healthy.
        p.espn_source_reported_injury_status
    } as InputPlayer;
  })}));
  const board=buildNbaSystemBoard(adjusted);
  // Limit mobile board to games close to today's action. The independent
  // grader retains ALL original game/player/stat predictions regardless.
  const left=current.getTime()-24*3600*1000;
  const right=current.getTime()+4*24*3600*1000;
  const games=board.games.filter(g=>{
    const t=Date.parse(g.tipoff_utc);
    return t>=Math.max(left,current.getTime())&&t<right;
  });
  return {
    ...board,original_game_count:source.length,
    games,
    displayed_system_picks:games.reduce((n,g)=>n+g.picks.length,0),
    games_with_picks:games.filter(g=>g.picks.length).length,
    displayed_game_count:games.length,
    priced_market_status:'NO_VERIFIED_NBA_BOOKMAKER_PROP_LINE_FEED',
    official_bets:0 as const,
    live_injury_check:availability?'LIVE_ESPN_SOURCE_VERIFIED':'NOT_CHECKED_RESEARCH_ONLY',
    live_injury_source_at_utc:availability?.captured_at_utc??null,
    live_injury_source_sha256:availability?.sha256??null,
    live_injury_blocked_player_forecasts:freshlyBlockedCount,
    current_active_roster_certified:false as const
  };
}

export function nbaSystemPicksHandler(fetcher:typeof fetch=fetch,clock=now){
  return async (_req:Request,res:Response)=>{
    res.setHeader('Cache-Control','no-store, max-age=0');
    try {
      const current=clock();
      const injuries=await loadLiveNbaInjuries(fetcher,current);
      return res.json(readVerifiedNbaSystemBoard(current,injuries));
    }catch(error){
      console.error('[NBA V2 picks] LIVE availability gate failed CLOSED:',error);
      return res.status(503).json({
        error:'NBA_LIVE_INJURY_VERIFICATION_UNAVAILABLE',
        status:'SYSTEM_PICKS_PAUSED_UNTIL_FRESH_INJURY_SOURCE',
        official_bets:0,
        details:'Current NBA availability source is missing, stale, incomplete or invalid. Original research forecasts remain archived; no current SYSTEM PICKS may be served unchecked.'
      });
    }
  };
}
