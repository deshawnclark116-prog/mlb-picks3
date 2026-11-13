/** NBA-style share data for actual, OVER-only NFL research model events.
 * Yardage comes from same-draw 60% Wilson grid; TD/sack probabilities
 * come from their own distinct model sources. Never imply calibration. */
import type {ExistingNflGame} from './existing';
import {rankNflShowcase,type NflShowcasePick} from './weeklyShowcase';
export type NflPrecisionPosterRow={
 rank:number;player:string;team:string;market:string;
 targetYards?:number;meanYards?:number;wilsonLower95?:number;
 reach:number;simulations?:number;
};
export type NflPrecisionPoster={
 game:Pick<ExistingNflGame,'away'|'home'|'teams'|'kickoff_utc'>;
 week:number;forecastAtUtc:string;picks:NflPrecisionPosterRow[];
 model:'WEEKLY_PLAYER_MODELS';
 probabilityForwardCalibrated:false;
 bettingLineIncluded:false;
 roleStatus:'NOT_ACTIVE_VERIFIED';
};
export function nflPrecisionPosterData(game:ExistingNflGame,ranked:readonly NflShowcasePick[],week:number,forecastAtUtc:string):NflPrecisionPoster{
 const at=Date.parse(forecastAtUtc),kickoff=Date.parse(game.kickoff_utc);
 if(!Number.isFinite(at)||!Number.isFinite(kickoff)||at>=kickoff||
    !Number.isInteger(week)||week<1||week>22)
    throw Error('NFL_POSTER_REQUIRES_ORIGINAL_PREGAME_FORECAST');
 // No caller can replace the actual modeled event with a high, fabricated
 // percentage. Cross-check the identical source forecast and modeled target.
 const eligible=rankNflShowcase(game,'','ALL',200);
 const seen=new Set<string>();
 const picks:NflPrecisionPosterRow[]=[];
 for(const p of ranked){
  const key=[p.player_id,p.player,p.team,p.market].join('|');
  if(seen.has(key))throw Error('NFL_POSTER_DUPLICATE_OUTCOME');
  const authentic=eligible.find(x=>x.player_id===p.player_id&&x.player===p.player&&
   x.team===p.team&&x.market===p.market&&x.kickoff_utc===p.kickoff_utc&&
   x.probability===p.probability&&x.targetYards===p.targetYards&&
   x.meanYards===p.meanYards);
  if(!authentic||p.kickoff_utc!==game.kickoff_utc||
     !game.teams.includes(p.team)||!game.teams.includes(p.opponent))continue;
  seen.add(key);
  picks.push({rank:picks.length+1,player:p.player,team:p.team,
   market:p.market,reach:p.probability,
   targetYards:p.targetYards,meanYards:p.meanYards,
   wilsonLower95:p.wilsonLower95,simulations:p.simulationN});
  if(picks.length===10)break;
 }
 for(let i=1;i<picks.length;i++){
  if(picks[i].reach>picks[i-1].reach+1e-12)
   throw Error('NFL_POSTER_REQUIRES_RANKED_INPUT');
 }
 return {game,week,forecastAtUtc,picks,model:'WEEKLY_PLAYER_MODELS',
  probabilityForwardCalibrated:false,bettingLineIncluded:false,
  roleStatus:'NOT_ACTIVE_VERIFIED'};
}
export function nflPrecisionPosterFilename(data:NflPrecisionPoster):string{
 const clean=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'team';
 return 'prop-edge-nfl-w'+String(data.week).padStart(2,'0')+'-'+
  clean(data.game.away||data.game.teams[0])+'-'+clean(data.game.home||data.game.teams[1])+
  '-top10-'+data.game.kickoff_utc.slice(0,10)+'.png';
}
