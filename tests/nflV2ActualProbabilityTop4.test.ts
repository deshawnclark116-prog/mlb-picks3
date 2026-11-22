import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExistingNfl} from '../src/nfl/existing.ts';
import {nflPrimaryProbabilityPicks,V2_EXACT_MEAN_SOURCE,V2_LEARNED_SOURCE} from '../src/nfl/primaryNumerical.ts';
import {wholeStatProjection} from '../src/lib/wholeStatProjection.ts';

const kickoff='2026-11-22T18:00:00Z';
const generated='2026-11-22T16:05:00Z';
const base={
  market:'receiving_yards',team:'KC',opponent:'ARI',kickoff_utc:kickoff,
  projected_low:0,projected_high:140,ungraded:true,confidence:'HIGH',
  games_played:12,model_source:'v2_context',
  nba_style_probability_event:'P_YARDS_AT_LEAST_ROUNDED_PUBLISHED_MEAN',
  v2_probability_calibration:'NOT_FORWARD_CERTIFIED',
  v2_probability_active_verified:false
};
const v2=(player:string,mean:number,p:number,source=V2_EXACT_MEAN_SOURCE)=>{
  return {...base,player,player_id:player,
    projected_mean:mean,projected_median:mean,
    nba_style_whole_mean_projection:wholeStatProjection(mean),
    nba_style_reach_probability:p,projection_probability_source:source,
    v2_probability_model_version:source,
    v2_probability_residual_sample_n:source===V2_LEARNED_SOURCE?1310:160,
    v2_probability_total_prior_n:1310,
    v2_probability_reference_mean:mean
  };
};
const doc=(rows:unknown[])=>({
  season:2026,week:11,generated_at_utc:generated,
  scheduled_games:[{home_team:'KC',away_team:'ARI',kickoff_utc:kickoff}],
  picks:rows
});
test('Restored real-model Top4: exact projection probabilities outrank HIGH confidence and TD',()=>{
 const rows=[
   v2('Xavier Worthy',29.8,.35),
   {...v2('Rashee Rice',60.1,.53),confidence:'LOW',games_played:3},
   {...v2('Josh Downs',37.4,.48),confidence:'MEDIUM'},
   {...v2('Other receiver',55.5,.45),confidence:'LOW'},
   {...v2('Another receiver',44.6,.41),confidence:'LOW'},
   {...v2('Below top four',55.1,.38),confidence:'HIGH',games_played:30},
   {...base,player:'TD player',player_id:'td',market:'anytime_touchdowns',
     pick:'Scores a TD (OVER 0.5)',model_prob:.95,prob_over:.95}
 ];
 const original=JSON.stringify(rows);
 const parsed=parseExistingNfl(doc(rows),new Date('2026-11-22T16:06:00Z'));
 const ranked=nflPrimaryProbabilityPicks(parsed.games[0]);
 assert.deepEqual(ranked.map(p=>p.player),[
    'Rashee Rice','Josh Downs','Other receiver','Another receiver']);
 assert.deepEqual(ranked.map(p=>p.probability),[.53,.48,.45,.41]);
 assert.deepEqual(ranked.map(p=>p.targetYards),[60,37,55,45]);
 assert.equal(ranked[0].residualHistoricalSampleN,160);
 assert(!ranked.some(p=>p.player==='Xavier Worthy'));
 assert(!ranked.some(p=>p.player==='TD player'));
 assert.equal(JSON.stringify(rows),original);
});
test('Learned V2 forecaster has different real error sample count, not 10k fake MC',()=>{
 const rows=[v2('Learned Receiver',45.6,.51,V2_LEARNED_SOURCE)];
 const g=parseExistingNfl(doc(rows),new Date('2026-11-22T16:06:00Z')).games[0];
 const list=nflPrimaryProbabilityPicks(g);
 assert.equal(list.length,1);
 assert.equal(list[0].targetYards,46);
 assert.equal(list[0].simulationN,undefined);
 assert.equal(list[0].residualHistoricalSampleN,1310);
});
test('Never import V2 percentage with swapped target, mismatched center or fake 10k sim',()=>{
 const initial=v2('Spoof',29.8,.91);
 const spoof=[
  {...initial,nba_style_whole_mean_projection:29},
  {...initial,v2_probability_reference_mean:28.9},
  {...initial,v2_probability_model_version:'UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP'},
  {...initial,projection_simulation_n:10000},
  {...initial,v2_probability_residual_sample_n:7},
  {...initial,v2_probability_active_verified:true},
  {...initial,projection_probability_source:'UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION'},
  {...initial,nba_style_probability_event:'P_WITHIN_10_YARDS'},
 ];
 for(const [i,row] of spoof.entries()){
   const g=parseExistingNfl(doc([row]),new Date('2026-11-22T16:06:00Z')).games[0];
   assert.deepEqual(nflPrimaryProbabilityPicks(g),[], 'spoof '+i);
 }
});
