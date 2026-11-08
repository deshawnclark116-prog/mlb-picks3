import type {ExistingYardProjection} from './existing';
import type {NflRoleSnapshot} from './roleSupportedNfl';
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
  // Median attainment is approximately 50% by construction and cannot
  // meaningfully rank numerical forecast ACCURACY. Use a single fixed
  // +/-10-yard numerical error window across all candidates instead.
  // This is an uncalibrated simulation estimate, not a verified hit rate.
  return projections.filter(hasNflOwnProjectionEvidence)
    .sort((a,b)=>b.projection_within_10_probability!-a.projection_within_10_probability! ||
      b.projection_reach_probability!-a.projection_reach_probability! ||
      (b.games_played||0)-(a.games_played||0) ||
      a.player.localeCompare(b.player) ||
      a.market.localeCompare(b.market)).slice(0,limit);
}

/**
 * NBA-style availability/role gate for the research shortlist.
 * A weekly roster listing alone is NOT proof that a player will be active.
 * Missing/conflicting/old snapshots fail closed to the full research ledger.
 */
/** Share ONE timestamp/role gate across archival numerical precision
 * research and the NBA V5-style P(reach mean target) presentation.
 * Never backfill starter or play probability from a roster listing. */
function roleMatchedPregameRows(
  projections:readonly ExistingYardProjection[],
  role:NflRoleSnapshot|null,
  generatedAtUtc:string,
  kickoffUtc:string,
  now:number
):ExistingYardProjection[]{
  const generated=Date.parse(generatedAtUtc),captured=Date.parse(role?.captured_at_utc||''),
    kickoff=Date.parse(kickoffUtc);
  if(role?.schema!=='nfl-role-evidence-coverage-v1'||
    role.status!=='PREGAME_RESEARCH_ROLE_SNAPSHOT'||
    !Array.isArray(role.player_market_evidence)||
    !Number.isFinite(generated)||!Number.isFinite(captured)||!Number.isFinite(kickoff)||
    Date.parse(role.forecast_generated_at_utc)!==generated||
    captured<generated||captured>now||now-captured>8*3600_000||
    captured>=kickoff||now>=kickoff)return [];
  const verified=new Set<string>();
  for(const row of role.player_market_evidence){
    if(row.role_evidence_complete_for_showcase!==true||
      row.roster_status!=='ROSTER_LISTED_NOT_STARTER_VERIFIED'||
      row.observed_stat_rows!==3||row.has_verified_starting_role!==false||
      row.has_calibrated_book_bet_probability!==false||
      !Array.isArray(row.warnings)||row.warnings.length!==0||
      Date.parse(row.kickoff_utc)!==kickoff)continue;
    verified.add([row.player.trim().toLowerCase(),row.team,row.opponent,
      row.market,row.published_model_median,row.published_model_source].join('|'));
  }
  return projections.filter(p=>verified.has([
    p.player.trim().toLowerCase(),p.team,p.opponent,p.market,
    p.projected_median,p.model_source].join('|')));
}
export function rankNflRoleSupportedOwnProjections(
  projections:readonly ExistingYardProjection[],
  role:NflRoleSnapshot|null,
  generatedAtUtc:string,
  kickoffUtc:string,
  now=Date.now(),
  limit=10
):ExistingYardProjection[]{
  if(!Number.isInteger(limit)||limit<1||limit>24)throw new Error('invalid NFL model shortlist size');
  return rankNflOwnProjections(
    roleMatchedPregameRows(projections,role,generatedAtUtc,kickoffUtc,now),limit);
}

/** NBA V5's ACTUAL display event is P(stat >= wholeStatProjection(MEAN)).
 * Never show the median-based ~50% number or a +/-10 yard error-band
 * probability beside the NBA-style mean target. Published mean and the
 * event probability must come from the identical player simulation.
 * DNP probability is NOT supplied by this NFL engine.
 */
export function hasNflNbaMeanProjectionEvidence(p:ExistingYardProjection):boolean{
  return p.projected_mean>0 &&
    p.projection_probability_source==='UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP' &&
    p.projection_simulation_n!=null&&p.projection_simulation_n>=10_000 &&
    p.nba_style_probability_event==='P_YARDS_AT_LEAST_ROUNDED_PUBLISHED_MEAN' &&
    p.nba_style_whole_mean_projection!=null &&
    p.nba_style_whole_mean_projection>0 &&
    p.nba_style_whole_mean_projection===wholeStatProjection(p.projected_mean) &&
    p.nba_style_reach_probability!=null &&
    Number.isFinite(p.nba_style_reach_probability) &&
    p.nba_style_reach_probability>=0&&p.nba_style_reach_probability<=1;
}
export function rankNflNbaMeanProjections(
  projections:readonly ExistingYardProjection[],limit=10
):ExistingYardProjection[]{
  if(!Number.isInteger(limit)||limit<1||limit>24)throw new Error('invalid NFL model shortlist size');
  return projections.filter(hasNflNbaMeanProjectionEvidence)
    .sort((a,b)=>b.nba_style_reach_probability!-a.nba_style_reach_probability!||
      (b.games_played||0)-(a.games_played||0)||
      a.player.localeCompare(b.player)||a.market.localeCompare(b.market)).slice(0,limit);
}
export function rankNflRoleSupportedNbaMeanProjections(
  projections:readonly ExistingYardProjection[],
  role:NflRoleSnapshot|null,
  generatedAtUtc:string,
  kickoffUtc:string,
  now=Date.now(),
  limit=10
):ExistingYardProjection[]{
  if(!Number.isInteger(limit)||limit<1||limit>24)throw new Error('invalid NFL model shortlist size');
  return rankNflNbaMeanProjections(
    roleMatchedPregameRows(projections,role,generatedAtUtc,kickoffUtc,now),limit);
}

/** The NBA screen keeps original prescheduled projections visible after tipoff.
 * This is a HISTORICAL pregame display, never a new postkickoff decision. */
export function rankNflPregameNbaMeanSnapshotForDisplay(
  projections:readonly ExistingYardProjection[],
  role:NflRoleSnapshot|null,
  generatedAtUtc:string,
  kickoffUtc:string,
  now=Date.now(),
  limit=10
):ExistingYardProjection[]{
  const tip=Date.parse(kickoffUtc),at=Date.parse(generatedAtUtc),
    roleAt=Date.parse(role?.captured_at_utc||'');
  if(!Number.isFinite(tip)||!Number.isFinite(at)||at>=tip||
     !Number.isFinite(roleAt)||roleAt>=tip)return [];
  return rankNflRoleSupportedNbaMeanProjections(
    projections,role,generatedAtUtc,kickoffUtc,Math.min(now,tip-1000),limit);
}

/** Display a REAL saved pre-kickoff projection after the game starts.
 * Historical cards remain visible for accountability, just like NBA V5.
 * This never authorizes post-kickoff selection or regenerates a forecast
 * using later injuries or actual box scores.
 */
export function rankNflPregameSnapshotForDisplay(
  projections:readonly ExistingYardProjection[],
  role:NflRoleSnapshot|null,
  generatedAtUtc:string,
  kickoffUtc:string,
  now=Date.now(),
  limit=10
):ExistingYardProjection[]{
  const tip=Date.parse(kickoffUtc),at=Date.parse(generatedAtUtc);
  const roleAt=Date.parse(role?.captured_at_utc||'');
  if(!Number.isFinite(tip)||!Number.isFinite(at)||at>=tip||
     !Number.isFinite(roleAt)||roleAt>=tip)return [];
  // For a started game, validate the original archived pregame snapshot
  // against its genuine pre-kickoff clock, without treating it as live.
  const originalDecisionClock=Math.min(now,tip-1000);
  return rankNflRoleSupportedOwnProjections(
    projections,role,generatedAtUtc,kickoffUtc,originalDecisionClock,limit
  );
}


/** Highest meaningful MODEL-DERIVED yardage thresholds, separate from
 * the mean projection. No sportsbook line used. The one-sided Wilson
 * bound only controls finite-MC noise; it is NOT a backtested success rate.
 */
export function hasNflMeaningfulTargetEvidence(p:ExistingYardProjection):boolean{
 const t=p.nfl_model_target,g=p.nfl_model_target_grid;
 if(!t||!g||!Number.isFinite(p.projected_mean)||p.projected_mean<=0||
    p.projection_probability_source!=='UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP'||
    p.nfl_model_target_event!=='P_YARDS_AT_LEAST_FIXED_MEANINGFUL_THRESHOLD'||
    p.projection_simulation_n==null||p.projection_simulation_n<10_000||
    g.schema!=='nfl_meaningful_yardage_targets_v1'||
    g.simulation_n!==p.projection_simulation_n||
    g.minimum_relative_mean_fraction!==.55||
    g.required_wilson_lower_95!==.65||g.grid_step_yards!==5||
    g.conditional_on_modeled_opportunities!==true||
    g.forward_calibrated!==false||g.official_active_status_verified!==false||
    g.minimum_absolute_yards!==(p.market==='receiving_yards'?25:30)||
    !Number.isInteger(t.yards)||t.yards%5!==0||
    t.yards<Math.max(g.minimum_absolute_yards,Math.ceil(.55*p.projected_mean))||
    !Number.isFinite(t.probability)||t.probability<.65||t.probability>1||
    !Number.isFinite(t.wilson_lower_95)||t.wilson_lower_95<.65||
    t.wilson_lower_95>t.probability||!Array.isArray(g.grid)||
    g.chosen_target?.yards!==t.yards||
    g.chosen_target.probability!==t.probability||
    g.chosen_target.wilson_lower_95!==t.wilson_lower_95)return false;
 const valid=g.grid.filter(x=>x.wilson_lower_95>=.65);
 return valid.length>0&&valid[valid.length-1].yards===t.yards&&
    valid[valid.length-1].probability===t.probability&&
    valid[valid.length-1].wilson_lower_95===t.wilson_lower_95;
}
export function rankNflMeaningfulTargets(
  projections:readonly ExistingYardProjection[],limit=10
):ExistingYardProjection[]{
 if(!Number.isInteger(limit)||limit<1||limit>24)throw new Error('invalid NFL shortlist size');
 return projections.filter(hasNflMeaningfulTargetEvidence)
  .sort((a,b)=>b.nfl_model_target!.probability-a.nfl_model_target!.probability||
     b.nfl_model_target!.wilson_lower_95-a.nfl_model_target!.wilson_lower_95||
     b.nfl_model_target!.yards-a.nfl_model_target!.yards||
     (b.games_played||0)-(a.games_played||0)||
     a.player.localeCompare(b.player)||a.market.localeCompare(b.market))
  .slice(0,limit);
}
export function rankNflRoleSupportedMeaningfulTargets(
  projections:readonly ExistingYardProjection[],
  role:NflRoleSnapshot|null,
  generatedAtUtc:string,kickoffUtc:string,
  now=Date.now(),limit=10
):ExistingYardProjection[]{
 return rankNflMeaningfulTargets(
   roleMatchedPregameRows(projections,role,generatedAtUtc,kickoffUtc,now),limit);
}
/** Historical pregame list remains visible after kickoff; new betting or
 * research decisions cannot be created from in-game or postgame data. */
export function rankNflPregameMeaningfulTargetsForDisplay(
  projections:readonly ExistingYardProjection[],
  role:NflRoleSnapshot|null,
  generatedAtUtc:string,kickoffUtc:string,
  now=Date.now(),limit=10
):ExistingYardProjection[]{
 const tip=Date.parse(kickoffUtc),at=Date.parse(generatedAtUtc),
   roleAt=Date.parse(role?.captured_at_utc||'');
 if(!Number.isFinite(tip)||!Number.isFinite(at)||at>=tip||
    !Number.isFinite(roleAt)||roleAt>=tip)return [];
 return rankNflRoleSupportedMeaningfulTargets(
   projections,role,generatedAtUtc,kickoffUtc,Math.min(now,tip-1000),limit);
}
