/** Primary NFL screen: publish the model's OWN NUMERICAL yardage means.
 *
 * The V2 context recalculation changes the center without recomputing the
 * matched simulated probability distribution. A probability-ranked yardage
 * top ten therefore does NOT exist for those rows, but the actual numerical
 * forecasts do. Rank by historical workload-stability *metadata*, not
 * bookmaker price, TD probability, yardage magnitude or fabricated accuracy.
 *
 * Keep unsupported QB-role-dependent receiving projections in the unaltered
 * source ledger (MODEL BOARD) until a fresh starter-conditioned model runs.
 */
import type {ExistingNflGame,ExistingYardProjection} from './existing';
import {rankedExistingCardProjections} from './existingCardRank';
import {requiresVerifiedStarterResimulation} from './weeklyShowcase';
export function nflPrimaryNumericalForecasts(
  projections:readonly ExistingYardProjection[],limit=10
):ExistingYardProjection[]{
  const usable=projections.filter(p=>
    Number.isFinite(p.projected_mean)&&
    p.projected_mean>=(p.market==='rushing_yards'?30:25)&&
    p.projected_median>=0&&
    !requiresVerifiedStarterResimulation(p));
  return rankedExistingCardProjections(usable,limit);
}
export function nflGamePrimaryNumericalForecasts(game:ExistingNflGame,limit=10){
  return nflPrimaryNumericalForecasts(game.projections,limit);
}
