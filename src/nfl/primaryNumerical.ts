/** NFL GAME-DAY TOP FOUR: strictly rank a PROBABILITY ACTUALLY PUBLISHED
 * FOR THAT PLAYER'S MODEL YARDAGE TARGET, by the original matching
 * distribution. This does not rank an invented "confidence" score.
 *
 * V2 context shifts the mean/median but does not regenerate the bootstrap
 * distribution. Its source explicitly marks the matched probability
 * UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION. A bare 29.8-yard forecast
 * therefore CANNOT enter a "probability-ranked" Top 4. It remains visible
 * in an UNRANKED research ledger.
 *
 * We intentionally require a meaningful source yardage event: e.g.
 * "P(25+ receiving yards)" — NEVER imply that its probability measures the
 * chance of finishing at or above the model's 29.8-yard point estimate.
 * 60% Wilson lower bound is a finite-simulation filter, NOT calibration.
 */
import type {ExistingNflGame,ExistingYardProjection} from './existing';
import {rankNflShowcase,requiresVerifiedStarterResimulation,type NflShowcasePick} from './weeklyShowcase';

/** No independent percentile, confidence tier, games-played tie-breaker,
 * Vegas odds, size-of-projection, or TD probability enters ranking.
 * The source-only selectNflMeaningfulTarget validation lives upstream of
 * rankNflShowcase, and rejects missing/mismatched probability distributions.
 */
export function nflPrimaryProbabilityPicks(game:ExistingNflGame,limit=4):NflShowcasePick[]{
  if(!Number.isInteger(limit)||limit<1||limit>24)
    throw new Error('invalid NFL probability-ranked slots');
  return rankNflShowcase({...game,events:[]},'','ALL',limit)
    .filter(p=>p.targetYards!=null && (
      p.market==='receiving_yards'||p.market==='rushing_yards'));
}

/** Browse SOURCE NUMERICAL FORECASTS without any rank, qualifier or implied
 * statistical confidence. Alphabetical presentation makes it impossible
 * to confuse earlier MEDIUM/HIGH workload-stability grades with accuracy.
 * Exact original model means/medians are left untouched.
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
