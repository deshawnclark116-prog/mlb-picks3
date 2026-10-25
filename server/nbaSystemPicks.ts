/** NBA NFL-style SYSTEM PICKS board, not a 900-player-stat research dump.
 * The primary board is a small ranked decision list. The full original
 * forecast record is retained separately for historical accountability.
 * Never manufacture a price/line, official pick, 65% probability or ROI.
 */
import type {Request,Response} from 'express';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import originalOpening from '../docs/nba_v2_opening_player_firstseen.json';
import certifiedAbsences from '../docs/nba_verified_game_absences.json';
import {parseNbaPlayerResearch} from '../src/nba/playerResearch.ts';
import {combineRollingNbaOriginals} from '../src/nba/rollingResearch.ts';
import {buildNbaSystemBoard,type InputGame,type InputPlayer} from '../src/nba/decisionBoard.ts';
import {parseNbaProbabilityArtifact,type NbaProbabilityArtifact} from '../src/nba/probabilityEngine.ts';
import {loadLiveNbaInjuries,liveStatusMap,requireFreshLiveAvailability,
  type LiveAvailability} from './nbaLiveAvailability.ts';

const ROOT=path.resolve(process.cwd(),'docs','nba_rolling_predictions');
const PROB_ARTIFACT=path.resolve(process.cwd(),'docs','nba_v2_probability_distribution_v1.json');
const V2_TEAM_HIST=path.resolve(process.cwd(),'docs','nba_v1_forward_walkback.json');
/** No on-request calibration from already completed games: only an immutable
 * archived fit/holdout report may authorize numerical NBA P(hit).
 */
export function loadNbaHistoricalProbabilityEvidence():NbaProbabilityArtifact|null{
  if(!existsSync(PROB_ARTIFACT))return null;
  const earlier=JSON.parse(readFileSync(V2_TEAM_HIST,'utf8'));
  if(earlier.schema!=='NBA_V1_LEAKSAFE_ESPN_TEAM_HOLDOUT_V1'||
     typeof earlier.source?.source_content_sha256!=='string')
    throw Error('NBA_PROBABILITY_OLD_TEAM_SOURCE_CHANGED');
  const raw=JSON.parse(readFileSync(PROB_ARTIFACT,'utf8'));
  return parseNbaProbabilityArtifact(raw,earlier.source.source_content_sha256);
}
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
    // Breaking team-confirmed injury changes are independently recorded with
    // exact ESPN game, team and athlete IDs. They supersede slower ESPN
    // league injury propagation but NEVER apply beyond this event/expiry.
    const explicit=certifiedAbsences.entries.find(x=>
      x.game_id===g.game_id&&x.team_id===p.team_id&&
      x.player_id===p.player_id&&x.status==='OUT'&&
      Date.parse(x.source_published_at_utc)<=current.getTime()&&
      current.getTime()<Date.parse(x.valid_until_utc));
    const blocked=!!explicit||(live!=null&&
      !['AVAILABLE','PROBABLE'].includes(live));
    if(blocked)freshlyBlockedCount++;
    return {...p,
      espn_source_reported_injury_status:explicit?'OUT':blocked?live:
        // Preserve older reported OUT/DOUBTFUL risk if the latest ESPN feed
        // simply stopped listing the player; absent != proven healthy.
        p.espn_source_reported_injury_status
    } as InputPlayer;
  })}));
  const probabilityEvidence=loadNbaHistoricalProbabilityEvidence();
  const board=buildNbaSystemBoard(adjusted,probabilityEvidence);
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
    model_probability_source_status:probabilityEvidence?
      'HISTORICAL_FIT_AND_INDEPENDENT_FORWARD_HOLDOUT_NOT_LIVE_CALIBRATED':
      'NO_PROBABILITY_RESEARCH_ARTIFACT_AVAILABLE',
    model_probabilities_require_no_bookmaker:true as const,
    model_probability_heldout_validation_start:'2026-01-10',
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
        details:'Current NBA live availability or source-verified probability evidence is missing, stale, incomplete or invalid. Original research forecasts remain archived; no invalid SYSTEM PICKS may be served.'
      });
    }
  };
}
