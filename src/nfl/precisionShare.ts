/** NBA V5-style image card: use the SAME ranked P(reaching rounded
 * MODEL MEAN) events as the NFL tiles. Not P(within 10 yards), not the
 * median event, not a bookmaker line, not an all-scenarios DNP rate.
 */
import type {ExistingNflGame,ExistingYardProjection} from './existing';
import {hasNflNbaMeanProjectionEvidence} from './ownProjectionRank';

export type NflPrecisionPosterRow={
 rank:number;player:string;team:string;market:string;
 projectedYards:number;meanYards:number;
 reach:number;simulations:number;
};
export type NflPrecisionPoster={
 game:Pick<ExistingNflGame,'away'|'home'|'teams'|'kickoff_utc'>;
 week:number;forecastAtUtc:string;picks:NflPrecisionPosterRow[];
 model:'WEEKLY_PLAYER_BOOTSTRAP';
 probabilityForwardCalibrated:false;
 bettingLineIncluded:false;
 roleStatus:'RECENT_ROLE_OBSERVED_NOT_ACTIVE_VERIFIED';
};
const valid=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1;
export function nflPrecisionPosterData(game:ExistingNflGame,ranked:readonly ExistingYardProjection[],week:number,forecastAtUtc:string):NflPrecisionPoster{
 const at=Date.parse(forecastAtUtc),kickoff=Date.parse(game.kickoff_utc);
 if(!Number.isFinite(at)||!Number.isFinite(kickoff)||at>=kickoff||
    !Number.isInteger(week)||week<1||week>22)
    throw Error('NFL_POSTER_REQUIRES_ORIGINAL_PREGAME_FORECAST');
 const seen=new Set<string>();
 const picks:NflPrecisionPosterRow[]=[];
 for(const p of ranked){
  if(!hasNflNbaMeanProjectionEvidence(p)||!valid(p.nba_style_reach_probability)||
     p.kickoff_utc!==game.kickoff_utc||
     !game.teams.includes(p.team)||!game.teams.includes(p.opponent))continue;
  const key=[p.player_id,p.team,p.market].join('|');
  if(seen.has(key))throw Error('NFL_POSTER_DUPLICATE_OUTCOME');
  seen.add(key);
  picks.push({
   rank:picks.length+1,player:p.player,team:p.team,market:p.market,
   projectedYards:p.nba_style_whole_mean_projection!,meanYards:p.projected_mean,
   reach:p.nba_style_reach_probability!,simulations:p.projection_simulation_n!
  });
  if(picks.length===10)break;
 }
 for(let i=1;i<picks.length;i++)
  if(picks[i].reach>picks[i-1].reach+1e-12)
   throw Error('NFL_POSTER_REQUIRES_NBA_MEAN_REACH_RANKED_INPUT');
 return {game,week,forecastAtUtc,picks,
  model:'WEEKLY_PLAYER_BOOTSTRAP',
  probabilityForwardCalibrated:false,bettingLineIncluded:false,
  roleStatus:'RECENT_ROLE_OBSERVED_NOT_ACTIVE_VERIFIED'};
}
export function nflPrecisionPosterFilename(data:NflPrecisionPoster):string{
 const clean=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'team';
 return 'prop-edge-nfl-w'+String(data.week).padStart(2,'0')+'-'+
  clean(data.game.away||data.game.teams[0])+'-'+clean(data.game.home||data.game.teams[1])+
  '-top10-'+data.game.kickoff_utc.slice(0,10)+'.png';
}
