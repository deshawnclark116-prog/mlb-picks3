/** NFL OVER-only public research shortlist. Source facts stay in the original
 * weekly parser and numerical simulation grid; never use sportsbook prices. */
import type {ExistingNflGame,ExistingYardMarket} from './existing';
import {selectNflMeaningfulTarget} from './ownProjectionRank';

export type NflShowcaseMarket=ExistingYardMarket|'anytime_touchdowns'|'sacks';
export type NflShowcasePick={
 player:string;player_id:string;team:string;opponent:string;kickoff_utc:string;
 market:NflShowcaseMarket;probability:number;model_source:string;
 targetYards?:number;meanYards?:number;medianYards?:number;
 wilsonLower95?:number;simulationN?:number;
};
export const NFL_ANYTIME_TD_MIN=.30;
export const NFL_SACK_OVER_MIN=.60;
export function rankNflShowcase(game:ExistingNflGame,search='',family='ALL',limit=10):NflShowcasePick[]{
 if(!Number.isInteger(limit)||limit<1||limit>200)throw Error('invalid NFL showcase size');
 const searchTerm=search.trim().toLowerCase();
 const match=(p:{player:string;team:string;opponent:string;market:string})=>
  (!searchTerm||(p.player+' '+p.team+' '+p.opponent).toLowerCase().includes(searchTerm))&&
  (family==='ALL'||(family==='RUSH'&&p.market==='rushing_yards')||
   (family==='REC'&&p.market==='receiving_yards')||
   (family==='TD'&&p.market==='anytime_touchdowns'));
 const out:NflShowcasePick[]=[];
 for(const p of game.projections){
  if(!match(p))continue;
  const t=selectNflMeaningfulTarget(p);
  if(!t)continue;
  out.push({player:p.player,player_id:p.player_id,team:p.team,
   opponent:p.opponent,kickoff_utc:p.kickoff_utc,market:p.market,
   probability:t.probability,model_source:p.model_source,
   targetYards:t.yards,meanYards:p.projected_mean,
   medianYards:p.projected_median,wilsonLower95:t.wilson_lower_95,
   simulationN:p.projection_simulation_n!});
 }
 for(const p of game.events||[]){
  if(!match(p))continue;
  if(p.market==='anytime_touchdowns'&&p.probability<NFL_ANYTIME_TD_MIN)continue;
  if(p.market==='sacks'&&p.probability<NFL_SACK_OVER_MIN)continue;
  out.push({player:p.player,player_id:p.player_id,team:p.team,
   opponent:p.opponent,kickoff_utc:p.kickoff_utc,market:p.market,
   probability:p.probability,model_source:p.model_source});
 }
 return out.sort((a,b)=>b.probability-a.probability||
   a.player.localeCompare(b.player)||a.market.localeCompare(b.market)).slice(0,limit);
}
