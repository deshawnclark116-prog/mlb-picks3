import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 freezeSourceNhlShotProbabilities,verifyFirstseenShotLedger,
 gradeNhlOriginalShotProbabilities,NHL_PROB_FREEZE_SCHEMA,NHL_PROB_GRADE_SCHEMA,
 type OfficialNhlForecast,type OfficialNhlGrade
} from '../src/nhl/probabilityForward.ts';
import type {NhlSogResearch,NhlSogCount} from '../src/nhl/countResearch.ts';

const NOW=new Date('2026-10-24T20:00:00Z');
const SOURCE_GENERATED='2026-10-24T16:45:00Z';
const CUTOFF='2026-10-24T17:00:00Z';
const TIP='2026-10-25T00:00:00Z';
function forecast():NhlSogCount{
 return {game_id:'2026020301',player_id:'8478000',player:'Synthetic skater',
 team:'DAL',opponent:'NYI',game_date:'2026-10-24',scheduled_start:TIP,
 mean:3.2,median:3,sd:1.7,p10:1,p90:5,forecast_horizon:'T24H',
 source_generated_at:SOURCE_GENERATED,source_cutoff_at:CUTOFF,
 model_probability_milestones_research_only:{'1':.95,'2':.88,
    '3':.72,'4':.52,'5':.30},
 model_probability_forward_calibrated:false,
 probability_not_an_official_bet:true,
 research_only:true,not_an_official_betting_prediction:true};
}
function report():NhlSogResearch{
 return {schema:'NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1',
   game_date:'2026-10-24',source_has_original_hash_chain:true,
   source_snapshot_commit_sha:'a'.repeat(40),source_ledger_sha256:'b'.repeat(64),
   research_only:true,not_an_official_betting_board:true,
   projected_count:1,projections:[forecast()]};
}
function truth(actual=4,played=true):[OfficialNhlForecast,OfficialNhlGrade]{
 const forecastRow:OfficialNhlForecast={
  record_type:'FORECAST',game_id:'2026020301',player_id:'8478000',team:'DAL',
  forecast_horizon:'T24H',scheduled_start:TIP,generated_at:SOURCE_GENERATED,
  cutoff_at:CUTOFF,expected_sog:3.2,row_hash:'d'.repeat(64),
  forecast_id:'original-2026020301-8478000-T24H'};
 const grade:OfficialNhlGrade={
  record_type:'GRADE',forecast_row_hash:forecastRow.row_hash,
  forecast_id:forecastRow.forecast_id,game_id:forecastRow.game_id,
  player_id:forecastRow.player_id,forecast_horizon:'T24H',
  game_state:'OFF',played,actual_sog:actual};
 return [forecastRow,grade];
}
test('all original NHL threshold probabilities 1–5 are frozen before puckdrop with no bookmaker or original alteration',()=>{
 const before=JSON.stringify(report());
 const saved=freezeSourceNhlShotProbabilities(report(),NOW);
 assert.equal(saved.schema,NHL_PROB_FREEZE_SCHEMA);
 assert.equal(saved.selected_predicted_events,1);
 assert.equal(saved.official_bets,0);
 assert.equal(saved.predictions[0].original_model_p_ge['3'],.72);
 assert.equal(saved.predictions[0].bookmaker_line,null);
 assert.equal(saved.predictions[0].currently_forward_calibrated,false);
 assert.equal(verifyFirstseenShotLedger([saved]).size,1);
 assert.equal(JSON.stringify(report()),before);
});
test('unchanged original cannot be re-frozen as an apparently newer pick and aftertip attempts create ZERO records',()=>{
 const first=freezeSourceNhlShotProbabilities(report(),NOW);
 const duplicate=freezeSourceNhlShotProbabilities(report(),
   new Date('2026-10-24T21:00:00Z'),[first]);
 assert.equal(duplicate.selected_predicted_events,0);
 assert.throws(()=>verifyFirstseenShotLedger([first,first]),/DUPLICATE/);
 const late=freezeSourceNhlShotProbabilities(report(),
   new Date('2026-10-24T23:55:00Z'));
 assert.equal(late.selected_predicted_events,0);
 const bad=report();bad.source_snapshot_commit_sha='fake';
 assert.throws(()=>freezeSourceNhlShotProbabilities(bad,NOW),/NO_VERIFIED/);
});
test('score ALL model shot milestones with actual final and DNP=zero, independent of sportsbook',()=>{
 const snapshot=freezeSourceNhlShotProbabilities(report(),NOW);
 const [f,g]=truth(4,true);
 const graded=gradeNhlOriginalShotProbabilities([snapshot],[f],[g],
   new Date('2026-10-25T13:00:00Z'));
 assert.equal(graded.schema,NHL_PROB_GRADE_SCHEMA);
 assert.equal(graded.original_milestone_predictions,5);
 assert.equal(graded.verified_milestone_outcomes,5);
 assert.equal(graded.official_bets,0);
 assert.deepEqual(graded.predicted_vs_actual.map(x=>x.result),
   ['HIT','HIT','HIT','HIT','MISS']);
 assert.equal(graded.by_milestone['3'].brier,.0784);
 assert.equal(graded.by_milestone['3'].current_season_market_certified,false);
 const DNP=gradeNhlOriginalShotProbabilities([snapshot],[f],
   [{...g,played:false,actual_sog:0}]);
 assert(DNP.predicted_vs_actual.every(x=>x.result==='MISS'));
 assert.equal(DNP.verified_milestone_outcomes,5);
});
test('missing actual or missing exact original as-of count source NEVER becomes a fabricated hit/miss',()=>{
 const snapshot=freezeSourceNhlShotProbabilities(report(),NOW);
 const [f,g]=truth();
 const pending=gradeNhlOriginalShotProbabilities([snapshot],[f],[]);
 assert.equal(pending.unverified_milestone_outcomes,5);
 assert(pending.predicted_vs_actual.every(x=>x.result==='UNVERIFIED'));
 const changed=gradeNhlOriginalShotProbabilities([snapshot],
   [{...f,expected_sog:9.0}],[g]);
 assert.equal(changed.unverified_milestone_outcomes,5);
 const tamper={...g,actual_sog:3,played:false};
 assert.throws(()=>gradeNhlOriginalShotProbabilities([snapshot],[f],[tamper]),
   /BROKEN_DNP/);
 assert.throws(()=>gradeNhlOriginalShotProbabilities([snapshot],[f],[g,g]),
   /DUPLICATE_VERIFIED/);
});
test('source monotonicity tampering and apparently posttip receipt are invalid',()=>{
 const source=report();
 source.projections[0].model_probability_milestones_research_only!['4']=.9;
 assert.throws(()=>freezeSourceNhlShotProbabilities(source,NOW),
   /NONMONOTONE/);
 const first=freezeSourceNhlShotProbabilities(report(),NOW);
 const copied=JSON.parse(JSON.stringify(first));
 copied.predictions[0].captured_at_utc=TIP;
 copied.captured_at_utc=TIP;
 assert.throws(()=>verifyFirstseenShotLedger([copied]),/PRETIP/);
});
