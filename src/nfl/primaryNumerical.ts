/** NFL GAME-DAY TOP FOUR: rank by the source model's OWN probability
 * of reaching its OWN rounded projected mean: P(YDS >= round(model mean)).
 *
 * Do not substitute an easier 25+/30+ event, an arbitrary +/-10 tolerance,
 * a sportsbook line, a TD probability, or a historical stability grade.
 * Those are DIFFERENT events and must never be represented as the chance
 * of reaching the original model's point projection.
 *
 * V2 publishes a DIFFERENT model-specific empirical distribution,
 * using only its completed 2026 pregame prediction errors, marked with
 * its own source and true sample size. Treat it as observational and
 * uncalibrated, never a certified wager or reused simulation.
 */
import type {ExistingNflGame,ExistingYardProjection} from './existing';
import type {NflShowcasePick} from './weeklyShowcase';
import {requiresVerifiedStarterResimulation} from './weeklyShowcase';
import {hasNflNbaMeanProjectionEvidence} from './ownProjectionRank';
import {wholeStatProjection} from '../lib/wholeStatProjection';

export const V2_EXACT_MEAN_SOURCE='V2_CONTEXT_2026_PREGAME_OUT_OF_SAMPLE_EMPIRICAL_ERRORS_V1';
export const V2_LEARNED_SOURCE='V2_CONTEXT_2026_ASOF_LEARNED_EXACT_MEAN_PHEAD_V1';

/** This source CDF belongs to the exact published XGBoost V2 mean.
 * Do NOT confuse its real residual sample size with 10k Monte Carlo
 * draws, claim forward calibration, or borrow any stale bootstrap percent.
 */
export const hasNflV2OwnMeanProbability=(p:ExistingYardProjection):boolean=>
  p.model_source==='v2_context'&&
  (p.projection_probability_source===V2_EXACT_MEAN_SOURCE ||
    p.projection_probability_source===V2_LEARNED_SOURCE)&&
  p.v2_probability_model_version===p.projection_probability_source&&
  p.v2_probability_calibration==='NOT_FORWARD_CERTIFIED'&&
  p.v2_probability_active_verified===false&&
  p.v2_probability_residual_sample_n!=null&&
  Number.isSafeInteger(p.v2_probability_residual_sample_n)&&
  ((p.projection_probability_source===V2_EXACT_MEAN_SOURCE&&
    p.v2_probability_residual_sample_n>=60&&
    p.v2_probability_residual_sample_n<=160)||
   (p.projection_probability_source===V2_LEARNED_SOURCE&&
    p.v2_probability_residual_sample_n>=170))&&
  p.v2_probability_total_prior_n!=null&&
  p.v2_probability_total_prior_n>=p.v2_probability_residual_sample_n&&
  p.v2_probability_reference_mean!=null&&
  Math.abs(p.v2_probability_reference_mean-p.projected_mean)<.001&&
  p.projection_simulation_n==null&&
  p.nba_style_probability_event==='P_YARDS_AT_LEAST_ROUNDED_PUBLISHED_MEAN'&&
  p.nba_style_whole_mean_projection!=null&&
  p.nba_style_whole_mean_projection===wholeStatProjection(p.projected_mean)&&
  p.nba_style_reach_probability!=null&&
  Number.isFinite(p.nba_style_reach_probability)&&
  p.nba_style_reach_probability>=0&&
  p.nba_style_reach_probability<=1;

const coherent=(p:ExistingYardProjection):boolean =>
  ((p.model_source==='blended_sim'||p.model_source==='prior_season_sim')&&
    hasNflNbaMeanProjectionEvidence(p)||hasNflV2OwnMeanProbability(p))&&
  p.projected_mean >= (p.market==='receiving_yards'?25:30)&&
  !requiresVerifiedStarterResimulation(p);

/** Exactly the source model probability (one defined mathematical event),
 * without an independent ranking percentage or a filled Top4 quota.
 * Source NBA-style reach probability is NOT forward-calibrated for outcomes.
 */
export function nflPrimaryProbabilityPicks(game:ExistingNflGame,limit=4):NflShowcasePick[]{
  if(!Number.isInteger(limit)||limit<1||limit>24)
    throw new Error('invalid NFL probability-ranked slots');
  return game.projections.filter(coherent)
    .sort((a,b)=>b.nba_style_reach_probability!-a.nba_style_reach_probability!||
      a.player.localeCompare(b.player)||a.market.localeCompare(b.market)||a.team.localeCompare(b.team))
    .slice(0,limit)
    .map(p=>({
      player:p.player,player_id:p.player_id,team:p.team,opponent:p.opponent,
      kickoff_utc:p.kickoff_utc,market:p.market,
      probability:p.nba_style_reach_probability!,
      model_source:p.model_source,
      targetYards:p.nba_style_whole_mean_projection!,
      meanYards:p.projected_mean,medianYards:p.projected_median,
      simulationN:p.projection_simulation_n??undefined,
      residualHistoricalSampleN:p.v2_probability_residual_sample_n??undefined,
      projectionProbabilityEvent:'P_YARDS_AT_LEAST_ROUNDED_PUBLISHED_MEAN'
    }));
}

/** Browse SOURCE NUMERICAL FORECASTS without ANY ranking, implied
 * probability or confidence. Alphabetical list is not a prediction order.
 */
export function nflUnrankedNumericalForecasts(
  projections:readonly ExistingYardProjection[]
):ExistingYardProjection[]{
  return projections.filter(p=>
    Number.isFinite(p.projected_median)&&p.projected_median>=0&&
    Number.isFinite(p.projected_mean)&&p.projected_mean>=0&&
    !requiresVerifiedStarterResimulation(p))
    .sort((a,b)=>a.player.localeCompare(b.player)||
      a.market.localeCompare(b.market)||a.team.localeCompare(b.team));
}
