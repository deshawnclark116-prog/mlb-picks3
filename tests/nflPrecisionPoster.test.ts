import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nflPrecisionPosterData,nflPrecisionPosterFilename} from '../src/nfl/precisionShare.ts';
import {rankNflMeaningfulTargets} from '../src/nfl/ownProjectionRank.ts';
import type {ExistingNflGame,ExistingYardProjection,NflMeaningfulGrid} from '../src/nfl/existing.ts';

const kickoff='2026-11-08T18:00:00Z';
const game:ExistingNflGame={id:'CLE-NO',kickoff_utc:kickoff,teams:['CLE','NO'],
  away:'CLE',home:'NO',projections:[]};

const make=(id:number,probability:number,target=35):ExistingYardProjection=>{
 const chosen={yards:target,probability,wilson_lower_95:probability-.01};
 const grid:NflMeaningfulGrid={
  schema:'nfl_meaningful_yardage_targets_v1',
  simulation_n:10000,minimum_absolute_yards:25,
  minimum_relative_mean_fraction:.55,required_wilson_lower_95:.65,
  grid_step_yards:5,conditional_on_modeled_opportunities:true,
  forward_calibrated:false,official_active_status_verified:false,
  chosen_target:chosen,grid:[
    {yards:25,probability:.94,wilson_lower_95:.93},
    ...(target>30?[{yards:30,probability:.89,wilson_lower_95:.88}]:[]),
    chosen,
    {yards:target+5,probability:.52,wilson_lower_95:.51}
  ].filter((x,i,a)=>a.findIndex(y=>y.yards===x.yards)===i)
   .sort((a,b)=>a.yards-b.yards)
 };
 return {
  player:'Player '+id,player_id:String(id),team:'CLE',opponent:'NO',
  market:'receiving_yards',kickoff_utc:kickoff,
  projected_median:40,projected_mean:44,projected_low:4,projected_high:130,
  model_source:'blended_sim',ungraded:true,confidence:'HIGH',games_played:6,
  whole_projection:40,projection_reach_probability:.51,
  projection_within_10_probability:.2,projection_simulation_n:10000,
  nfl_model_target:chosen,nfl_model_target_grid:grid,
  nfl_model_target_event:'P_YARDS_AT_LEAST_FIXED_MEANINGFUL_THRESHOLD',
  projection_probability_source:'UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP'
 };
};

test('TOP 10 poster uses SAME strongest fixed-target percentage as NFL preview, no book substitution',()=>{
 const rows=Array.from({length:13},(_,i)=>make(i,.67+(i/100)));
 const ranked=rankNflMeaningfulTargets(rows);
 const doc=nflPrecisionPosterData(game,ranked,9,'2026-11-08T17:56:00Z');
 assert.equal(doc.picks.length,10);
 assert.deepEqual(doc.picks.map(p=>p.player),ranked.map(p=>p.player));
 assert.deepEqual(doc.picks.map(p=>p.rank),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(doc.picks[0].reach,.79);
 assert.equal(doc.picks[0].projectedYards,35);
 assert.equal(doc.picks[0].meanYards,44);
 assert.equal(doc.bettingLineIncluded,false);
 assert.equal(doc.probabilityForwardCalibrated,false);
 assert(!JSON.stringify(doc).includes('fanduel'));
 assert.match(nflPrecisionPosterFilename(doc),/nfl-w09-cle-no-top10-2026-11-08\.png$/);
});
test('invalid data, V2 overwrite, <65% target or missed real event never appears on share card',()=>{
 const p=make(1,.74),v2=make(2,.94),bad=make(3,.64);
 v2.model_source='v2_context';
 v2.projection_probability_source='UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION';
 const ranked=rankNflMeaningfulTargets([v2,bad,p]);
 assert.deepEqual(ranked.map(x=>x.player),['Player 1']);
 const doc=nflPrecisionPosterData(game,ranked,9,'2026-11-08T17:56:00Z');
 assert.equal(doc.picks.length,1);
 assert.equal(doc.picks[0].projectedYards,35);
 assert.throws(()=>nflPrecisionPosterData(game,[p],9,'2026-11-08T18:02:00Z'),
   /ORIGINAL_PREGAME/);
});
test('poster refuses out-of-order percentages even when yards look higher',()=>{
 const a=make(1,.71),b=make(2,.86);
 assert.throws(()=>nflPrecisionPosterData(game,[a,b],9,'2026-11-08T17:56:00Z'),
   /MEANINGFUL_TARGET_RANKED/);
});
test('very high probability of trivial yards cannot be promoted into the official card',()=>{
 const fake=make(1,.99,5);
 assert.deepEqual(rankNflMeaningfulTargets([fake]),[]);
});
