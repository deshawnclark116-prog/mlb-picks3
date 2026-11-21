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
