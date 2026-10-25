import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 parseNbaProbabilityArtifact,derivedNbaMilestoneProbability,bestNbaMilestone,
 type NbaProbabilityArtifact,NBA_PROBABILITY_SCHEMA,NBA_PROBABILITY_MODEL,
 MILESTONES
} from '../src/nba/probabilityEngine.ts';
import {buildNbaSystemBoard,targetFor,type InputPlayer,type InputGame} from '../src/nba/decisionBoard.ts';

const zeroSha='a'.repeat(64);
function fixture():NbaProbabilityArtifact{
 const statistics=['points','rebounds','assists','three_pointers_made'] as const;
 const bins=Object.fromEntries(Array.from({length:10},(_,i)=>[String(i),{
   n:70,observed_played:60,mean_original_p:(i+.5)/10
 }]));
 const residuals=Array.from({length:600},(_,i)=>(i-300)/80);
 const mk=(pass:boolean)=>({
   n_original_player_outcomes:1600,
   n_market_threshold_observations:8000,
   n_ge65_probability:pass?400:30,
   brier_distribution:pass?.17:.26,
   brier_training_climatology:.22,
   brier_improvement:pass?.05:-.04,
   ece_tenths:pass?.045:.13,
   p_ge65_absolute_reliability_gap:pass?.06:.2,
   heldout_probability_gate_passed:pass,
   release_status:pass?'HISTORICAL_HOLDOUT_VALIDATED_2026_27_UNPROVEN':
     'HISTORICAL_PROBABILITY_GATE_FAILED'
 });
 return {
   schema:NBA_PROBABILITY_SCHEMA,
   numerical_model_version:NBA_PROBABILITY_MODEL,
   outcome_distribution:'validation_empirical_scale_adjusted_residual_cdf_and_play_reliability_v1',
   heldout_start_date:'2026-01-10',heldout_last_date:'2026-02-01',
   training_and_holdout_are_disjoint_games:true,
   training_source_is_prior_2025_26_season:true,
   no_bookmaker_data_needed:true,official_bets:0,
   calibrated_for_forward_2026_27:false,cannot_certify_game_day_injuries_or_bets:true,
   source_team_sha256:zeroSha,source_boxscore_coverage:.98,
   source_boxscore_games:713,source_player_firstseen_rows:8000,
   artifact_sha256:zeroSha,some_historical_market_passed:true,
   heldout_release_gates:{
     minimum_holdout_player_outcomes:1200,
     minimum_holdout_market_target_observations:4500,
     minimum_65plus_predictions:80,max_ece:.09,
     minimum_brier_improvement_over_prior_climatology:.003,
     max_65plus_reliability_gap:.11
   },
   fit:{
     trained_between_utc_dates:['2025-12-08','2026-01-10'],
     training_n_preselected_players:700,training_n_played_players:600,
     training_games:75,source_cutoff_last_day:'2026-01-09',
     play_reliability_bins:bins,
     conditional_scaled_residuals: Object.fromEntries(statistics.map(m=>[m,[...residuals]])) as NbaProbabilityArtifact['fit']['conditional_scaled_residuals'],
     training_target_baselines: Object.fromEntries(statistics.map(m=>[m,Object.fromEntries(MILESTONES[m].map(k=>[String(k),.2]))])) as NbaProbabilityArtifact['fit']['training_target_baselines']
   },
   markets:{
     points:mk(true) as NbaProbabilityArtifact['markets']['points'],
     rebounds:mk(false) as NbaProbabilityArtifact['markets']['rebounds'],
     assists:mk(false) as NbaProbabilityArtifact['markets']['assists'],
     three_pointers_made:mk(false) as NbaProbabilityArtifact['markets']['three_pointers_made']
   }
 };
}
const clone=(x:any)=>JSON.parse(JSON.stringify(x));
function input():InputGame{
 const p:InputPlayer={
   forecast_id:'f001',game_id:'401999999',team_id:'6',player_id:'4000000',
   player:'Synthetic Rotation Candidate',
   tipoff_utc:'2026-10-29T00:00:00Z',forecast_generated_at_utc:'2026-10-27T00:00:00Z',
   p_play_unverified:.95,conditional_minutes_mean:34,
   official_pick:false,research_only:true,stat_market_lines:null,
   predictions:{points:28.0,rebounds:10,assists:7,three_pointers_made:3}
 };
 return {game_id:p.game_id,home:'Dallas Mavericks',away:'New York Knicks',
   home_id:'6',away_id:'18',tipoff_utc:p.tipoff_utc,
   source:'ROLLING_ORIGINAL_V2',original_at_utc:p.forecast_generated_at_utc,
   player_predictions_count:4,players:[p]};
}
test('exact source validates earlier-only distribution, Brier/ECE and no bookmaker source',()=>{
 const f=fixture();
 const d=parseNbaProbabilityArtifact(f,zeroSha);
 assert.equal(d.official_bets,0);
 assert.equal(d.some_historical_market_passed,true);
 assert.equal(d.calibrated_for_forward_2026_27,false);
 assert.equal(d.markets.points.heldout_probability_gate_passed,true);
 assert.equal(d.markets.assists.heldout_probability_gate_passed,false);
});
test('NBA probabilities come from independent empirical outcomes + P(plays), not sportsbook odds or MAE confidence',()=>{
 const d=parseNbaProbabilityArtifact(fixture());
 const p15=derivedNbaMilestoneProbability(d,'points',28,.95,15);
 const p20=derivedNbaMilestoneProbability(d,'points',28,.95,20);
 const p25=derivedNbaMilestoneProbability(d,'points',28,.95,25);
 const p30=derivedNbaMilestoneProbability(d,'points',28,.95,30);
 assert(p15!=null&&p20!=null&&p25!=null&&p30!=null);
 assert(p15>=p20&&p20>=p25&&p25>=p30);
 assert(p25<=1&&p30>=0);
 assert.equal(derivedNbaMilestoneProbability(d,'rebounds',10,.95,6),null);
 const pReduced=derivedNbaMilestoneProbability(d,'points',28,.5,20);
 assert(pReduced!=null&&pReduced<p20);
 assert.throws(()=>derivedNbaMilestoneProbability(d,'points',28,.95,21),
  /BAD_PLAYER_THRESHOLD/);
 const best=bestNbaMilestone(d,'points',28,.95,.65);
 assert(best&&best.probability>=.65&&MILESTONES.points.includes(best.milestone));
});
test('real-vintage model selection only publishes verified market hit probabilities when historical gate passed',()=>{
 const model=fixture(),game=input();
 const pick=targetFor(game.players[0],game,model);
 assert(pick);
 assert.equal(pick.market,'points');
 assert(pick.model_hit_probability!=null&&pick.model_hit_probability>=.65);
 assert.equal(pick.probability_method,'HISTORICAL_VALIDATED_EMPIRICAL_CDF');
 assert.equal(pick.probability_historical_holdout_validated,true);
 assert.equal(pick.bookmaker_line,null);
 assert.equal(pick.bookmaker_odds,null);
 assert.equal(pick.official_pick,false);
 const board=buildNbaSystemBoard([game],model);
 assert.equal(board.historical_probability_distribution_loaded,true);
 assert.deepEqual(board.historical_holdout_probability_markets,['points']);
 assert.equal(board.current_season_probability_calibration_verified,false);
 assert.equal(board.official_bets,0);
 const legacy=buildNbaSystemBoard([game]);
 assert.equal(legacy.historical_probability_distribution_loaded,false);
 assert(legacy.games[0].picks.some(p=>p.model_hit_probability===null));
 assert.equal(game.players[0].predictions.points,28);
});
test('future-leak, source identity, fake passing markets and manipulated calibration metrics fail closed',()=>{
 const broken=clone(fixture());
 broken.calibrated_for_forward_2026_27=true;
 assert.throws(()=>parseNbaProbabilityArtifact(broken),/SOURCE_INVALID/);
 const mismatched=clone(fixture());
 mismatched.source_team_sha256='b'.repeat(64);
 assert.throws(()=>parseNbaProbabilityArtifact(mismatched,zeroSha),/PROVENANCE/);
 const repaired=clone(fixture());
 repaired.markets.assists.heldout_probability_gate_passed=true;
 assert.throws(()=>parseNbaProbabilityArtifact(repaired),/FAKE_PROMOTION/);
 const reversed=clone(fixture());
 reversed.fit.conditional_scaled_residuals.points.reverse();
 assert.throws(()=>parseNbaProbabilityArtifact(reversed),/CDF/);
 const leak=clone(fixture());
 leak.fit.source_cutoff_last_day='2026-02-01';
 assert.throws(()=>parseNbaProbabilityArtifact(leak),/MODEL_SOURCE_BOUNDARY/);
});
test('real scored outcome absent leaves original conditional forecast intact; no probability for failed market',()=>{
 const artifact=parseNbaProbabilityArtifact(fixture());
 const g=input();
 const before=clone(g);
 g.players[0].predictions.points=12;
 assert.equal(bestNbaMilestone(artifact,'rebounds',10,.95),null);
 const selected=targetFor(g.players[0],g,artifact);
 assert.equal(selected,null);
 assert.equal(before.players[0].predictions.points,28);
});
