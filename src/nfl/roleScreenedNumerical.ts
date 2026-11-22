/** NFL primary numerical display from REAL source role evidence, not an
 * alphabetized roster or unsourced HIGH/MEDIUM hit-confidence guesses.
 *
 * The original frozen V2 numerical forecasts remain unchanged. This is a
 * pregame quality-of-EVIDENCE filter for presentation, NOT a correction to
 * any forecast or a probability/risk ranking. It never claims a bet edge.
 *
 * We show only real current-roster 3-game opportunity evidence with a
 * threshold large enough to be meaningful. Repeated forward numerical
 * forecast misses and DECLINING opportunities stay on the research board.
 * Selection order within each separate market is DESCENDING MODEL YARDS,
 * explicitly NOT rank by likelihood of hitting that yardage.
 */
import type {ExistingNflGame,ExistingYardProjection} from './existing';
import {requiresVerifiedStarterResimulation} from './weeklyShowcase';
import type {NflRoleSnapshot,NflRoleEvidenceRow} from './roleSupportedNfl';
import {normalizePlayer} from './bettable';

export interface NflNumericGradeWarning{
  player_id:string;player:string;team:string;market:string;
  observed_prior_games:number;overprojected_by_10_count:number;
  last_completed_week:number;
  last3_median_errors:number[];
}
export interface NflNumericGradeReport{
  schema:string;graded_at_utc:string;first_seen_count:number;
  graded_count:number;recent_repeated_overprojections:NflNumericGradeWarning[];
}
export type NflRoleScreenedNumerical={
  projection:ExistingYardProjection;
  role:NflRoleEvidenceRow;
  /** These are NOT published/model-derived hit probabilities. */
  ranking_basis:'MODELED_YARDS_WITHIN_MARKET_NOT_HIT_PROBABILITY';
};
export type NflRoleScreenResult={
  leaders:NflRoleScreenedNumerical[];
  reason:'ROLE_EVIDENCE_OK'|'ROLE_EVIDENCE_MISSING_OR_MISMATCHED';
  excluded:{
    not_enough_recent_role_proof:number;
    low_projected_impact:number;
    declining_opportunities:number;
    repeated_forward_misses:number;
    starter_context_unverified:number;
  };
};

const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const when=(t:unknown)=>typeof t==='string'?Date.parse(t):NaN;
const same=(a:string,b:string)=>normalizePlayer(a)===normalizePlayer(b);
const identifier=(p:Pick<NflRoleEvidenceRow,'player'|'team'|'market'|'opponent'>)=>
  [normalizePlayer(p.player),p.team,p.market,p.opponent].join('|');
const OPPORTUNITY_MIN:Record<string,number>={receiving_yards:3,rushing_yards:5};
const MEANINGFUL_MEDIAN_MIN:Record<string,number>={receiving_yards:25,rushing_yards:30};

const empty=():NflRoleScreenResult['excluded']=>({
 not_enough_recent_role_proof:0,low_projected_impact:0,
 declining_opportunities:0,repeated_forward_misses:0,
 starter_context_unverified:0
});

export function roleScreenedNflNumerical(
 game:ExistingNflGame,forecastCreatedAt:string,role:NflRoleSnapshot|null,
 grade:NflNumericGradeReport|null,now=Date.now(),maximum=4
):NflRoleScreenResult{
 if(!Number.isInteger(maximum)||maximum<1||maximum>20)
   throw Error('invalid NFL role-screened preview size');
 const excluded=empty();
 const failed=(reason:NflRoleScreenResult['reason']):NflRoleScreenResult=>({
   leaders:[],reason,excluded
 });
 // Sidecar is valid ONLY if it was captured alongside this EXACT frozen
 // pregame forecast, before kickoff, by the pregame role process. Never
 // match a later projection to older players, trades or role observations.
 const roleIsVerified=role?.schema==='nfl-role-evidence-coverage-v1'&&
   role.status==='PREGAME_RESEARCH_ROLE_SNAPSHOT'&&
   role.is_betting_probability_calibrated===false&&
   role.starter_status_verified===false&&
   Array.isArray(role.player_market_evidence)&&
   finite(when(role.forecast_generated_at_utc))&&
   when(role.forecast_generated_at_utc)===when(forecastCreatedAt)&&
   finite(when(role.captured_at_utc))&&
   when(role.captured_at_utc)>=when(forecastCreatedAt)&&
   when(role.captured_at_utc)<when(game.kickoff_utc)&&
   now-when(role.captured_at_utc)>=0&&
   now-when(role.captured_at_utc)<=8*3600_000&&
   role.season>0&&role.week>0;
 if(!roleIsVerified)return failed('ROLE_EVIDENCE_MISSING_OR_MISMATCHED');

 // This independent grading source is OPTIONAL for other raw projections,
 // but absence MUST NOT let a known, declining player pass into the
 // spotlight (the role evidence is authoritative for that).
 const gradeValid=grade?.schema==='NFL_NUMERICAL_FIRST_SEEN_FORWARD_GRADE_V1'&&
   Array.isArray(grade.recent_repeated_overprojections)&&
   finite(when(grade.graded_at_utc))&&
   when(grade.graded_at_utc)>=when(forecastCreatedAt)&&
   when(grade.graded_at_utc)<when(game.kickoff_utc);
 const flagged=new Set<string>();
 if(gradeValid){
   for(const row of grade!.recent_repeated_overprojections){
     if(row&&typeof row.player==='string'&&
       row.overprojected_by_10_count>=2&&row.observed_prior_games>=3&&
       row.last_completed_week<role!.week)
       flagged.add([normalizePlayer(row.player),row.team,row.market].join('|'));
   }
 }
 const matched=new Map<string,NflRoleEvidenceRow[]>();
 for(const r of role!.player_market_evidence){
   if(!r||!['receiving_yards','rushing_yards'].includes(r.market)||
      when(r.kickoff_utc)!==when(game.kickoff_utc)||
      r.player==null||r.opponent==null||r.team==null)continue;
   const key=identifier(r);
   const group=matched.get(key)||[];
   group.push(r);
   matched.set(key,group);
 }
 const eligible:NflRoleScreenedNumerical[]=[];
 for(const p of game.projections){
   if(requiresVerifiedStarterResimulation(p)){
      excluded.starter_context_unverified++;continue;
   }
   const floor=MEANINGFUL_MEDIAN_MIN[p.market];
   if(floor==null||!finite(p.projected_median)||
      p.projected_median<floor){
     excluded.low_projected_impact++;continue;
   }
   const records=matched.get(identifier(p));
   const r=records?.length===1?records[0]:null;
   const sound=Boolean(r&&
     r.roster_status==='ROSTER_LISTED_NOT_STARTER_VERIFIED'&&
     r.role_evidence_complete_for_showcase===true&&
     r.has_verified_starting_role===false&&
     r.has_calibrated_book_bet_probability===false&&
     r.observed_stat_rows===3&&
     finite(r.recent_opportunities_per_observed_game)&&
     r.recent_opportunities_per_observed_game>=OPPORTUNITY_MIN[p.market]&&
     finite(r.recent_team_share)&&
     r.recent_team_share>=0&&r.recent_team_share<=1&&
     Array.isArray(r.warnings)&&r.warnings.length===0&&
     r.published_model_source===p.model_source&&
     Math.abs(r.published_model_median-p.projected_median)<0.01);
   if(!sound){
     excluded.not_enough_recent_role_proof++;continue;
   }
   if((r as NflRoleEvidenceRow&{role_status?:string}).role_status==='RECENT_OPPORTUNITIES_DECLINING'){
      excluded.declining_opportunities++;continue;
   }
   if(flagged.has([normalizePlayer(p.player),p.team,p.market].join('|'))){
      excluded.repeated_forward_misses++;continue;
   }
   eligible.push({projection:p,role:r!,ranking_basis:'MODELED_YARDS_WITHIN_MARKET_NOT_HIT_PROBABILITY'});
 }
 // Do not compare receiving probabilities to rushing probabilities (none
 // exist). Show 2 largest in EACH market, then fill remaining open slots
 // ONLY from OTHER verified strong centers, never tiny backup projections.
 const receiving=eligible.filter(x=>x.projection.market==='receiving_yards')
   .sort((a,b)=>b.projection.projected_median-a.projection.projected_median||
     a.projection.player.localeCompare(b.projection.player));
 const rushing=eligible.filter(x=>x.projection.market==='rushing_yards')
   .sort((a,b)=>b.projection.projected_median-a.projection.projected_median||
     a.projection.player.localeCompare(b.projection.player));
 const half=Math.floor(maximum/2);
 const selected=[...receiving.slice(0,Math.ceil(maximum/2)),
   ...rushing.slice(0,half)];
 if(selected.length<maximum){
   const remaining=[...receiving.slice(Math.ceil(maximum/2)),
     ...rushing.slice(half)];
   // Only fill remaining slots from independently role-qualified forecasts.
   remaining.sort((a,b)=>b.projection.projected_median-a.projection.projected_median||
     a.projection.player.localeCompare(b.projection.player));
   selected.push(...remaining.slice(0,maximum-selected.length));
 }
 return {leaders:selected,reason:'ROLE_EVIDENCE_OK',excluded};
}
