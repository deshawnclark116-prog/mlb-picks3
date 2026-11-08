import type {ExistingYardProjection} from './existing';
import {wholeStatProjection} from '../lib/wholeStatProjection';

/**
 * Research-only NBA-style NFL ranking by the chance of reaching the model's
 * OWN rounded numerical yardage projection. Never import the sportsbook's
 * model_prob: that is P(over/under a DIFFERENT event and offered line).
 *
 * A new V2 context median INVALIDATES the original bootstrap distribution;
 * the publisher deliberately omits the probability in that case.
 *
 * This is NOT calibrated numerical accuracy or verified game-day activity.
 * It must never be used to mark a selection as an official wager.
 */
export function hasNflOwnProjectionEvidence(p:ExistingYardProjection):boolean{
  return p.projected_median>0 &&
    p.projection_probability_source==='UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP' &&
    p.projection_simulation_n!=null && p.projection_simulation_n>=10_000 &&
    p.whole_projection===wholeStatProjection(p.projected_median) &&
    p.projection_reach_probability!=null &&
    Number.isFinite(p.projection_reach_probability) &&
    p.projection_reach_probability>=0 && p.projection_reach_probability<=1 &&
    p.projection_within_10_probability!=null &&
    Number.isFinite(p.projection_within_10_probability) &&
    p.projection_within_10_probability>=0 && p.projection_within_10_probability<=1;
}

export function rankNflOwnProjections(
  projections:readonly ExistingYardProjection[],limit=10
):ExistingYardProjection[]{
  if(!Number.isInteger(limit)||limit<1||limit>24)throw new Error('invalid NFL model shortlist size');
  return projections.filter(hasNflOwnProjectionEvidence)
    .sort((a,b)=>b.projection_reach_probability!-a.projection_reach_probability! ||
      b.projection_within_10_probability!-a.projection_within_10_probability! ||
      (b.games_played||0)-(a.games_played||0) ||
      a.player.localeCompare(b.player) ||
      a.market.localeCompare(b.market)).slice(0,limit);
}
