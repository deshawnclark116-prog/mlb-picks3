import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requiresVerifiedStarterResimulation,rankNflShowcase} from '../src/nfl/weeklyShowcase.ts';
import type {ExistingNflGame,ExistingYardProjection} from '../src/nfl/existing.ts';

const kickoff='2026-11-22T18:00:00Z';
const yard=(player:string,team:string,opponent:string,market:'receiving_yards'|'rushing_yards'):ExistingYardProjection=>({
  player,player_id:player,team,opponent,kickoff_utc:kickoff,market,
  projected_median:60,projected_mean:62,projected_low:10,projected_high:100,
  model_source:'blended_sim',ungraded:true,games_played:8,confidence:'HIGH',
  projection_simulation_n:250000,
  projection_probability_source:'UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP',
  nfl_model_target_event:'P_YARDS_AT_LEAST_FIXED_MEANINGFUL_THRESHOLD',
  nfl_model_target:{yards:35,probability:.82,wilson_lower_95:.81},
  nfl_model_target_grid:{
    schema:'nfl_meaningful_yardage_targets_v1',simulation_n:250000,
    minimum_absolute_yards:market==='receiving_yards'?25:30,
    minimum_relative_mean_fraction:.55,required_wilson_lower_95:.60,
    grid_step_yards:5,conditional_on_modeled_opportunities:true,forward_calibrated:false,
    official_active_status_verified:false,
    chosen_target:{yards:35,probability:.82,wilson_lower_95:.81},
    grid:[{yards:35,probability:.82,wilson_lower_95:.81},{yards:40,probability:.5,wilson_lower_95:.49}]
  }
});
const game=(projections:ExistingYardProjection[],events:ExistingNflGame['events']):ExistingNflGame=>({
  id:'exact-test',kickoff_utc:kickoff,teams:['ARI','KC'],projections,events
});
const ev=(name:string,team:string,opponent:string,market:'anytime_touchdowns'|'sacks')=>({
 player:name,player_id:name,team,opponent,kickoff_utc:kickoff,market,
 probability:market==='sacks'?.69:.62,model_source:'v4_context',games_played:8
});
test('Exact NFL primary-source 1 PM QB-role guard only covers affected offensive events',()=>{
  for(const [team,opponent] of [['ARI','KC'],['PHI','PIT']] as const){
    for(const market of ['receiving_yards','anytime_touchdowns']){
      assert.equal(requiresVerifiedStarterResimulation({kickoff_utc:kickoff,team,opponent,market}),true);
    }
    for(const market of ['rushing_yards','sacks'])
      assert.equal(requiresVerifiedStarterResimulation({kickoff_utc:kickoff,team,opponent,market}),false);
    assert.equal(requiresVerifiedStarterResimulation({kickoff_utc:kickoff,team:opponent,opponent:team,market:'receiving_yards'}),false);
    assert.equal(requiresVerifiedStarterResimulation({kickoff_utc:'2026-11-29T18:00:00Z',team,opponent,market:'receiving_yards'}),false);
  }
});
test('Showcase retains unaffected model selections, never adjusts probabilities or source player ledger',()=>{
 const projections=[
   yard('Arizona target','ARI','KC','receiving_yards'),
   yard('Kansas City target','KC','ARI','receiving_yards'),
   yard('Arizona back','ARI','KC','rushing_yards'),
   yard('Philadelphia target','PHI','PIT','receiving_yards'),
   yard('Pittsburgh target','PIT','PHI','receiving_yards')
 ];
 const events=[
   ev('Arizona receiver TD','ARI','KC','anytime_touchdowns'),
   ev('Philadelphia receiver TD','PHI','PIT','anytime_touchdowns'),
   ev('KC defender sack','KC','ARI','sacks'),
   ev('Pittsburgh defender sack','PIT','PHI','sacks'),
   ev('KC TD','KC','ARI','anytime_touchdowns')
 ];
 const g=game(projections,events);
 const before=JSON.stringify(g);
 const result=rankNflShowcase(g,'','ALL',200);
 const names=result.map(p=>p.player);
 for(const name of ['Arizona target','Philadelphia target','Arizona receiver TD','Philadelphia receiver TD'])
   assert(!names.includes(name),'QB-dependent unchanged prediction should be withheld from top 10: '+name);
 for(const name of ['Kansas City target','Arizona back','Pittsburgh target','KC defender sack','Pittsburgh defender sack','KC TD'])
   assert(names.includes(name),'unaffected market must remain ranked: '+name);
 assert.equal(JSON.stringify(g),before,'original forecast and outcome ledger untouched');
 assert(result.every(p=>p.probability>0));
});
