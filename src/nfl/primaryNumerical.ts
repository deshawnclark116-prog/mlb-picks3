/** NFL GAME-DAY TOP FOUR: rank by the source model's OWN probability
 * of reaching its OWN rounded projected mean: P(YDS >= round(model mean)).
 *
 * Do not substitute an easier 25+/30+ event, an arbitrary +/-10 tolerance,
 * a sportsbook line, a TD probability, or a historical stability grade.
 * Those are DIFFERENT events and must never be represented as the chance
 * of reaching the original model's point projection.
 *
 * V2 context numerical models do not currently publish any matched
 * simulation for their revised mean/median. They therefore cannot occupy
 * a probability-ranked Top4 until the model itself publishes that
 * exact-event probability. Preserve the raw predictions unranked.
 */
import type {ExistingNflGame,ExistingYardProjection} from './existing';
import type {NflShowcasePick} from './weeklyShowcase';
import {requiresVerifiedStarterResimulation} from './weeklyShowcase';
import {hasNflNbaMeanProjectionEvidence} from './ownProjectionRank';

const coherent=(p:ExistingYardProjection):boolean =>
  (p.model_source==='blended_sim'||p.model_source==='prior_season_sim') &&
  hasNflNbaMeanProjectionEvidence(p) &&
  p.projected_mean >= (p.market==='receiving_yards'?25:30) &&
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
      simulationN:p.projection_simulation_n!,
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
