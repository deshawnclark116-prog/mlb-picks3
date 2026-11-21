import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createIndependentLiveLoader,validateIndependentLive,
 INDEPENDENT_SCHEMA,INDEPENDENT_VERSION} from '../server/nbaIndependentShadow.ts';

const NOW=Date.parse('2026-11-20T23:00:00Z');
function fixture(){
 return {schema:INDEPENDENT_SCHEMA,model_version:INDEPENDENT_VERSION,
  research_only:true,official_bets:0,no_sportsbook_probability:true,
  prospective_calibration_verified:false,
  projections_conditional_on_playing:true,
  individual_starter_certified:false,
  model_is_not_the_v5_serving_champion:true,
  model_2025_validation_arm:'direct',
  source_v3_sha256:'a'.repeat(64),
  source_game_history_sha256:'b'.repeat(64),
  projection_accuracy_confidence_source:'NBA_INDEPENDENT_PREDICTION_ACCURACY_VALIDATION_2026_V1',
  projection_accuracy_calibration_sha256:'c'.repeat(64),
  projection_accuracy_definition:'PROB_ACTUAL_WITHIN_PLUS_MINUS_OF_OWN_MODEL_PREDICTION_IF_PLAYS',
  projection_accuracy_not_a_bookmaker_hit_probability:true,
  projection_accuracy_forward_2026_27_calibrated:false,
  projection_accuracy_windows:{points:5,rebounds:2,assists:2,three_pointers_made:1},
  generated_at_utc:'2026-11-20T22:59:00Z',
  source_v3_generated_at_utc:'2026-11-20T22:56:00Z',
  games_forecast:1,players_forecast:1,rows_forecast:4,
  games:[{game_id:'401909308',home:'Cleveland Cavaliers',
   away:'Indiana Pacers',
   tipoff_utc:'2026-11-21T00:30:00Z',
   forecast_at_utc:'2026-11-20T22:59:00Z',
   players_forecast:1,rows_count:4,players:[{
     player:'Test Player',team_id:'1',player_id:'123',
     source_active_probability_unverified:.9,
     active_or_starter_certified:false,
     projection_accuracy_confidence:{
      points:{probability_within_window_if_plays:.62,window_plus_or_minus:5,
       historical_validation_n_in_bin:200,metric:'PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION',
       calibration_source:'NBA_INDEPENDENT_PREDICTION_ACCURACY_VALIDATION_2026_V1',
       not_over_under_probability:true,current_season_calibration_verified:false},
      rebounds:{probability_within_window_if_plays:.58,window_plus_or_minus:2,
       historical_validation_n_in_bin:200,metric:'PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION',
       calibration_source:'NBA_INDEPENDENT_PREDICTION_ACCURACY_VALIDATION_2026_V1',
       not_over_under_probability:true,current_season_calibration_verified:false},
      assists:{probability_within_window_if_plays:.55,window_plus_or_minus:2,
       historical_validation_n_in_bin:200,metric:'PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION',
       calibration_source:'NBA_INDEPENDENT_PREDICTION_ACCURACY_VALIDATION_2026_V1',
       not_over_under_probability:true,current_season_calibration_verified:false},
      three_pointers_made:{probability_within_window_if_plays:.70,window_plus_or_minus:1,
       historical_validation_n_in_bin:200,metric:'PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION',
       calibration_source:'NBA_INDEPENDENT_PREDICTION_ACCURACY_VALIDATION_2026_V1',
       not_over_under_probability:true,current_season_calibration_verified:false}
     },
     predictions:{points:15.1,rebounds:4.2,assists:5.3,
       three_pointers_made:2.1},
   }]}]};
}
test('Independent NBA 4 market numerical live artifact validated exactly',()=>{
 const d=validateIndependentLive(fixture(),NOW);
 assert.equal(d.games[0].players[0].predictions.assists,5.3);
 assert.equal(d.official_bets,0);
});
test('Never accept V5 numbers, fake confirmed active state or post-tip regeneration',()=>{
 const f=fixture();
 assert.throws(()=>validateIndependentLive({...f,model_version:'nba-v5-sim'},NOW),
   /RESEARCH_INTEGRITY/);
 assert.throws(()=>validateIndependentLive({...f,official_bets:1},NOW),
   /RESEARCH_INTEGRITY/);
 const started=fixture();
 started.games[0].tipoff_utc='2026-11-20T22:30:00Z';
 assert.throws(()=>validateIndependentLive(started,NOW),/AFTER_TIP/);
 const cert=fixture();
 cert.games[0].players[0].active_or_starter_certified=true;
 assert.throws(()=>validateIndependentLive(cert,NOW),/UNSAFE_PLAYER/);
 const bogus=fixture();
 bogus.games[0].players[0].predictions.points=NaN;
 assert.throws(()=>validateIndependentLive(bogus,NOW),/INVALID_NUMERIC/);
});
test('No stale, backdated or future model is presented as live',()=>{
 const f=fixture();
 assert.throws(()=>validateIndependentLive({...f,
   generated_at_utc:'2026-11-18T22:59:00Z'},NOW),
   /STALE_OR_FUTURE/);
 assert.throws(()=>validateIndependentLive({...f,
   generated_at_utc:'2026-11-20T23:05:00Z'},NOW),
   /STALE_OR_FUTURE/);
});
test('Actual remote research model is fetched but never fabricated on missing source',async()=>{
 const f=fixture();
 let requests=0;
 const get=async()=>{
   requests++;
   return new Response(JSON.stringify(f),{status:200,
    headers:{'content-type':'application/json'}});
 };
 const load=createIndependentLiveLoader(get);
 const a=await load(NOW);
 assert.equal(a.games.length,1);
 assert.equal(a.games[0].players[0].predictions.points,15.1);
 assert.equal(a.source_state,'VERIFIED_PUBLISHED_SOURCE');
 const b=await load(NOW+1000);
 assert.equal(b.games.length,1);
 assert.equal(requests,1,'cache must prevent overpolling GitHub');
});
test('Unavailable remote and missing local source present clear absence, no V5 fallback',async()=>{
 const load=createIndependentLiveLoader(async()=>
   new Response('not found',{status:404}));
 const result=await load(NOW);
 assert.equal(result.games.length,0);
 assert.equal(result.status,'SOURCE_NOT_YET_PUBLISHED');
 assert.equal(result.official_bets,0);
});

test('Never accept fake confidence or unverified season win probabilities',()=>{
 const doc=fixture();
 assert.equal(validateIndependentLive(doc,NOW).games[0].players[0]
  .projection_accuracy_confidence.points.probability_within_window_if_plays,.62);
 const wrong=fixture();
 wrong.projection_accuracy_forward_2026_27_calibrated=true;
 assert.throws(()=>validateIndependentLive(wrong,NOW),/FAKE_MODEL_ACCURACY_CONFIDENCE/);
 const misleading=fixture();
 misleading.games[0].players[0]
  .projection_accuracy_confidence.points.not_over_under_probability=false;
 assert.throws(()=>validateIndependentLive(misleading,NOW),/INVALID_PROJECTION_ACCURACY_PERCENT/);
 const wrongWindow=fixture();
 wrongWindow.games[0].players[0]
  .projection_accuracy_confidence.points.window_plus_or_minus=50;
 assert.throws(()=>validateIndependentLive(wrongWindow,NOW),/INVALID_PROJECTION_ACCURACY_PERCENT/);
});
