import {normalizePlayer} from './bettable';
import type {ExistingNflGame} from './existing';
import {verifiedNflSelections,type LiveMarketResponse,type MarketSelection} from './verifiedMarkets';

export type NflRoleEvidenceRow={
 player:string;team:string;opponent:string;market:string;kickoff_utc:string;
 published_model_median:number;published_model_source?:string;
 roster_status:string;observed_stat_rows:number;recent_opportunities_per_observed_game:number|null;
 recent_team_share:number|null;role_evidence_complete_for_showcase:boolean;
 has_verified_starting_role:false;has_calibrated_book_bet_probability:false;
 warnings:string[];
};
export interface NflRoleSnapshot{
 schema:string;status:string;forecast_generated_at_utc:string;captured_at_utc:string;
 season:number;week:number;
 is_betting_probability_calibrated:boolean;starter_status_verified:boolean;
 player_market_evidence:NflRoleEvidenceRow[];
}
export interface RoleCheckedSelection extends MarketSelection{
 role:NflRoleEvidenceRow;
}
const t=(v:unknown):number=>typeof v==='string'?Date.parse(v):NaN;

/** Source-verified RECENT role evidence for a featured projection, NOT a bet.
 * Fail closed when old, mismatched to the exact frozen forecast or when
 * the participant's history/roster cannot be verified. No magic six-filler.
 */
export function roleSupportedNflProjections(
 game:ExistingNflGame,live:LiveMarketResponse|null,role:NflRoleSnapshot|null,
 publishedGeneratedAt:string,now=Date.now(),limit=6
):RoleCheckedSelection[]{
 if(!Number.isInteger(limit)||limit<1||limit>24)throw new Error('invalid limit');
 if(role?.schema!=='nfl-role-evidence-coverage-v1'||
    role.status!=='PREGAME_RESEARCH_ROLE_SNAPSHOT'||
    role.is_betting_probability_calibrated!==false||
    role.starter_status_verified!==false||
    !Array.isArray(role.player_market_evidence)||
    !Number.isFinite(t(role.captured_at_utc))||
    now-t(role.captured_at_utc)<0||now-t(role.captured_at_utc)>8*3600_000||
    t(role.forecast_generated_at_utc)!==t(publishedGeneratedAt)||
    t(role.captured_at_utc)<t(role.forecast_generated_at_utc)||
    t(role.captured_at_utc)>=t(game.kickoff_utc)||
    t(game.kickoff_utc)<=now)return [];
 const eligible=new Map<string,NflRoleEvidenceRow[]>();
 for(const r of role.player_market_evidence){
   if(!r||r.role_evidence_complete_for_showcase!==true||
      r.roster_status!=='ROSTER_LISTED_NOT_STARTER_VERIFIED'||
      r.has_verified_starting_role!==false||
      r.has_calibrated_book_bet_probability!==false||
      r.observed_stat_rows!==3||
      !Array.isArray(r.warnings)||r.warnings.length!==0||
      !Number.isFinite(r.recent_opportunities_per_observed_game)||
      !Number.isFinite(r.recent_team_share)||
      r.recent_team_share!<0||r.recent_team_share!>1||
      r.kickoff_utc==null||t(r.kickoff_utc)!==t(game.kickoff_utc))continue;
   const min=r.market==='rushing_yards'?5:r.market==='receiving_yards'?3:Infinity;
   if(r.recent_opportunities_per_observed_game!<min)continue;
   const key=[normalizePlayer(r.player),r.team,r.market].join('|');
   eligible.set(key,[...(eligible.get(key)||[]),r]);
 }
 const matched=verifiedNflSelections(game,live,now,24);
 const qualified:RoleCheckedSelection[]=[];
 for(const candidate of matched){
   const p=candidate.projection;
   const key=[normalizePlayer(p.player),p.team,p.market].join('|');
   const possible=eligible.get(key);
   if(possible?.length!==1)continue;
   const r=possible[0];
   if(r.opponent!==p.opponent||Math.abs(r.published_model_median-p.projected_median)>.01||
      r.published_model_source!==p.model_source)continue;
   qualified.push({...candidate,role:r});
 }
 // Rank by verified share of actual team usage, not simulation tail tightness.
 // Different stat categories are NOT calibrated against one another.
 return qualified.sort((a,b)=>
   b.role.recent_team_share!-a.role.recent_team_share! ||
   b.role.recent_opportunities_per_observed_game!-a.role.recent_opportunities_per_observed_game!||
   (b.projection.games_played||0)-(a.projection.games_played||0)||
   a.projection.player.localeCompare(b.projection.player)).slice(0,limit);
}
