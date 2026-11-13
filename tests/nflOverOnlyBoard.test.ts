import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseExistingNfl} from '../src/nfl/existing.ts';
import {selectNflMeaningfulTarget} from '../src/nfl/ownProjectionRank.ts';
import {rankNflShowcase} from '../src/nfl/weeklyShowcase.ts';
import {nflPrecisionPosterData} from '../src/nfl/precisionShare.ts';

const kickoff='2026-11-13T01:15:00Z';
const generated='2026-11-13T00:14:09Z';
const base={team:'NYG',opponent:'WAS',kickoff_utc:kickoff,model_source:'blended_sim'};
function grid(market:string,mean:number,min:number,required:number,entries:{yards:number;probability:number;wilson_lower_95:number}[]){
 const chosen=entries.filter(x=>x.wilson_lower_95>=required).at(-1)||null;
 return {
  schema:'nfl_meaningful_yardage_targets_v1',simulation_n:10000,
  minimum_absolute_yards:min,minimum_relative_mean_fraction:.55,
  required_wilson_lower_95:required,grid_step_yards:5,
  conditional_on_modeled_opportunities:true,
  forward_calibrated:false,official_active_status_verified:false,
  chosen_target:chosen,grid:entries
 };
}
function yard(player:string,market:string,mean:number,required:number,events:{yards:number;probability:number;wilson_lower_95:number}[]){
 const g=grid(market,mean,market==='receiving_yards'?25:30,required,events);
 return {...base,player,player_id:player,market,
  projected_mean:mean,projected_median:mean,projected_low:0,projected_high:120,
  projection_probability_source:'UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP',
  projection_simulation_n:10000,nfl_model_target_grid:g,
  nfl_model_target:g.chosen_target,
  nfl_model_target_event:'P_YARDS_AT_LEAST_FIXED_MEANINGFUL_THRESHOLD'};
}
function fixture(){
 return {season:2026,week:10,generated_at_utc:generated,
  scheduled_games:[{home_team:'NYG',away_team:'WAS',kickoff_utc:kickoff}],
  picks:[
   yard('Legacy 60', 'receiving_yards',40,.65,[
    {yards:25,probability:.645,wilson_lower_95:.637},
    {yards:30,probability:.58,wilson_lower_95:.572}]),
   yard('New 60','rushing_yards',50,.60,[
    {yards:30,probability:.79,wilson_lower_95:.783},
    {yards:35,probability:.615,wilson_lower_95:.607},
    {yards:40,probability:.58,wilson_lower_95:.572}]),
   {...base,player:'TD yes',player_id:'td',market:'anytime_touchdowns',
    pick:'Scores a TD (OVER 0.5)',model_prob:.30,prob_over:.30},
   {...base,player:'TD below',player_id:'tdb',market:'anytime_touchdowns',
    pick:'Scores a TD (OVER 0.5)',model_prob:.299,prob_over:.299},
   {...base,player:'Under sack',player_id:'su',market:'sacks',
    pick:'UNDER 0.5',model_prob:.91,prob_over:.09},
   {...base,player:'Over sack',player_id:'so',market:'sacks',
    pick:'OVER 0.5',model_prob:.603,prob_over:.603},
   {...base,player:'Below sack',player_id:'sb',market:'sacks',
    pick:'OVER 0.5',model_prob:.599,prob_over:.599}
  ]};
}
test('legacy 65%-stamped grid remains immutable, but 60% board selects real historical event',()=>{
 const raw=fixture(),original=JSON.stringify(raw.picks[0]);
 const slate=parseExistingNfl(raw,new Date('2026-11-13T00:15:00Z'));
 const legacy=slate.games[0].projections[0];
 assert.equal(legacy.nfl_model_target,null);
 assert.equal(legacy.nfl_model_target_grid?.required_wilson_lower_95,.65);
 assert.equal(selectNflMeaningfulTarget(legacy)?.yards,25);
 assert.equal(JSON.stringify(raw.picks[0]),original,'never rewrite the frozen feed');
 const fresh=slate.games[0].projections[1];
 assert.equal(selectNflMeaningfulTarget(fresh)?.yards,35);
});
test('show affirmative 30% TDs and 60% sack OVERS, never high-probability sack UNDERS',()=>{
 const slate=parseExistingNfl(fixture(),new Date('2026-11-13T00:15:00Z'));
 const game=slate.games[0],picks=rankNflShowcase(game,'','ALL',10);
 assert.equal(game.projections.length,2);
 assert.equal(game.events?.length,2);
 assert.equal(picks.length,4);
 assert.deepEqual(picks.map(x=>x.player),['Legacy 60','New 60','Over sack','TD yes']);
 assert(!picks.some(x=>x.player==='Under sack'||x.player==='TD below'));
 assert.deepEqual(rankNflShowcase(game,'','TD',10).map(x=>x.player),['TD yes']);
 assert.equal(rankNflShowcase(game,'','ALL',1).length,1);
 const poster=nflPrecisionPosterData(game,picks,10,generated);
 assert.equal(poster.picks.length,4);
 assert.equal(poster.picks[3].market,'anytime_touchdowns');
 assert.equal(poster.picks[3].reach,.30);
 assert.equal(poster.picks[3].meanYards,undefined,'TD is not a yardage mean');
});
test('malformed OVER scoring events cannot impersonate actual model probabilities',()=>{
 const raw=fixture() as any;
 raw.picks.push({...base,player:'Bogus',player_id:'bogus',market:'anytime_touchdowns',
  pick:'OVER 0.5',model_prob:.95,prob_over:.20});
 assert.throws(()=>parseExistingNfl(raw,new Date('2026-11-13T00:15:00Z')),/invalid NFL scoring-event forecast/);
});
