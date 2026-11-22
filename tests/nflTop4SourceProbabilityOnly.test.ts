import test from 'node:test';
import assert from 'node:assert/strict';
import type {ExistingNflGame,ExistingYardProjection} from '../src/nfl/existing.ts';
import {nflPrimaryProbabilityPicks,nflUnrankedNumericalForecasts} from '../src/nfl/primaryNumerical.ts';
import {rankNflShowcase} from '../src/nfl/weeklyShowcase.ts';
const KICK='2026-11-22T18:00:00Z';
const marketEvent=(player:string,market:'receiving_yards'|'rushing_yards',chance:number,
                   confidence:'HIGH'|'MEDIUM'|'LOW',games:number):ExistingYardProjection=>{
  const min=market==='receiving_yards'?25:30;
  const target={yards:min,probability:chance,wilson_lower_95:chance-.012};
  return {
    player,player_id:player,team:'KC',opponent:'ARI',market,kickoff_utc:KICK,
    projected_mean:min+8,projected_median:min+7,projected_low:0,
    projected_high:100,model_source:'blended_sim',ungraded:true,confidence,
    games_played:games,projection_probability_source:'UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP',
    projection_simulation_n:10000,
    nfl_model_target_event:'P_YARDS_AT_LEAST_FIXED_MEANINGFUL_THRESHOLD',
    nfl_model_target_grid:{
      schema:'nfl_meaningful_yardage_targets_v1',simulation_n:10000,
      minimum_absolute_yards:min,minimum_relative_mean_fraction:.55,
      required_wilson_lower_95:.60,grid_step_yards:5,
      conditional_on_modeled_opportunities:true,forward_calibrated:false,
      official_active_status_verified:false,chosen_target:target,grid:[target]
    },
    nfl_model_target:target
  };
};
const context=(player:string,market:'receiving_yards'|'rushing_yards',
               grade:'HIGH'|'MEDIUM'|'LOW',games=25):ExistingYardProjection=>({
  player,player_id:player,team:'KC',opponent:'ARI',market,kickoff_utc:KICK,
  projected_mean:80,projected_median:80,projected_low:1,projected_high:160,
  model_source:'v2_context',ungraded:true,confidence:grade,games_played:games,
  projection_probability_source:'UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION'
});
const game=(projections:ExistingYardProjection[]):ExistingNflGame=>({
  id:'2026-11-22T18:00:00Z|ARI_KC',teams:['ARI','KC'],
  kickoff_utc:KICK,projections,
  events:[
    {player:'99 pct TD',player_id:'td',team:'KC',opponent:'ARI',
     kickoff_utc:KICK,market:'anytime_touchdowns',probability:.99,
     model_source:'v4_context',games_played:20}
  ]
});
test('Top4 only uses target event percentage sourced from the exact model forecast',()=>{
 const projections=[
   context('Xavier Worthy','receiving_yards','HIGH',30),
   marketEvent('Lower grade best','receiving_yards',.81,'LOW',3),
   marketEvent('Medium 2','rushing_yards',.77,'MEDIUM',3),
   marketEvent('Low 3','receiving_yards',.72,'LOW',4),
   marketEvent('High 4','rushing_yards',.66,'HIGH',36),
   marketEvent('High grade 5','receiving_yards',.64,'HIGH',200),
   context('Huge old estimate','rushing_yards','HIGH',99)
 ];
 const original=JSON.stringify(projections);
 const g=game(projections);
 const ranked=nflPrimaryProbabilityPicks(g);
 assert.deepEqual(ranked.map(x=>x.player),
    ['Lower grade best','Medium 2','Low 3','High 4']);
 assert.deepEqual(ranked.map(x=>x.probability),[.81,.77,.72,.66]);
 assert.deepEqual(ranked.map(x=>x.targetYards),[25,30,25,30]);
 assert(ranked.every(x=>x.targetYards!=null));
 assert(!ranked.some(x=>x.player==='Xavier Worthy'||x.player==='99 pct TD'));
 assert.deepEqual(nflPrimaryProbabilityPicks(g,2).map(x=>x.player),
   ['Lower grade best','Medium 2']);
 assert.equal(JSON.stringify(projections),original);
});
test('mis-matched numeric V2 projection cannot borrow a stale bootstrap percentage',()=>{
 const v=context('Stale v2','receiving_yards','HIGH');
 const borrowed=marketEvent('Stale v2','receiving_yards',.93,'LOW',1);
 const spoof={...v,nfl_model_target_grid:borrowed.nfl_model_target_grid,
   nfl_model_target:borrowed.nfl_model_target,
   nfl_model_target_event:borrowed.nfl_model_target_event,
   projection_simulation_n:10000,projection_reach_probability:.93};
 assert.deepEqual(nflPrimaryProbabilityPicks(game([spoof])),[]);
 const cloned=marketEvent('Malformed chosen','receiving_yards',.85,'LOW',1);
 cloned.nfl_model_target_grid!.chosen_target={
   yards:30,probability:.85,wilson_lower_95:.83};
 assert.deepEqual(nflPrimaryProbabilityPicks(game([cloned])),[]);
 const stripped=marketEvent('Unmatched actual','rushing_yards',.80,'HIGH',6);
 stripped.projection_probability_source='UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION';
 assert.deepEqual(nflPrimaryProbabilityPicks(game([stripped])),[]);
});
test('0 valid source yardage events yields NO Top4, never 30 percent TD fallback',()=>{
 const worthy=context('Xavier Worthy','receiving_yards','MEDIUM',9);
 const rice=context('Rashee Rice','receiving_yards','HIGH',6);
 const g=game([worthy,rice]);
 const mixed=rankNflShowcase(g);
 assert.equal(mixed.length,1);
 assert.equal(mixed[0].player,'99 pct TD');
 assert.deepEqual(nflPrimaryProbabilityPicks(g),[]);
 assert.deepEqual(nflUnrankedNumericalForecasts(g.projections).map(x=>x.player),
   ['Rashee Rice','Xavier Worthy']);
});
