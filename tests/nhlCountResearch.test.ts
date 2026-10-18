import test from 'node:test';
import assert from 'node:assert/strict';
import {reduceFrozenNhlShots,loadNhlCountResearch} from '../server/nhlCountResearch';
import {addTrueNhlShotCounts,NHL_COUNT_SCHEMA,type NhlSogResearch} from '../src/nhl/countResearch';
import type {UnifiedGame} from '../src/components/UnifiedSportGameCards';

const cols=['game_id','player_id','player','team','opponent','game_date','scheduled_start',
 'mean','median','sd','p10','p25','p75','p90','p0','p_ge1','p_ge2','p_ge3','p_ge4','p_ge5',
 'generated_at','cutoff_at','meaningful_candidate'];
const good=['2026020048','8478864','Kirill Kaprizov','MIN','CBJ','2026-10-18',
 '2026-10-18T22:00:00Z',3.2,3,1.4,1,2,4,6,.05,.95,.82,.65,.44,.22,
 '2026-10-17T16:00:00Z','2026-10-17T22:00:00Z',true];
function src(){
 return {
  schema:'nhl-v2-sog-nfl-style-shadow-v1',
  status:'RESEARCH_ONLY_NOT_VALIDATED_FOR_BETTING',
  verified_original_hash_chain:true,verified_frozen_code_and_model_lock:true,
  dressed_lineups_verified:false,actual_player_book_lines_verified:false,
  historical_corrected_probabilities_were_not_published_pregame:true,
  not_a_betting_board:true,
  source_snapshot_commit_sha:'a'.repeat(40),source_ledger_sha256:'b'.repeat(64),
  row_fields:cols,horizons:['T24H'],dates:['2026-10-18'],
  forecasts:{T24H:[good]},total_valid_forecasts:1
 };
}
const baseGame:UnifiedGame={id:'CBJ__MIN',label:'MIN vs CBJ',when:'2026-10-18T22:00:00Z',
 sourceLabel:'NHL CURRENT MODEL · FIXED-LINE CLASSIFIER',
 picks:[{id:'current-points',player:'Kirill Kaprizov',team:'MIN',market:'points',
   target:'OVER 0.5',modelProbability:.744,prediction:null,
   predictionKind:'not_published',unit:'',source:'NHL points classifier'}]};

test('frozen NHL V2 shot-count forecast independently supplies MEAN and MEDIAN, not P(point)',()=>{
 const reduced=reduceFrozenNhlShots(src(),'2026-10-18');
 assert.equal(reduced.schema,NHL_COUNT_SCHEMA);
 assert.equal(reduced.projected_count,1);
 assert.equal(reduced.projections[0].mean,3.2);
 assert.equal(reduced.projections[0].median,3);
 assert.equal(reduced.projections[0].forecast_horizon,'T24H');
 assert.equal(reduced.projections[0].source_cutoff_at,'2026-10-17T22:00:00Z');
 const game=addTrueNhlShotCounts([baseGame],reduced as NhlSogResearch)[0];
 assert.equal(game.picks.length,2);
 assert.equal(game.picks[0].market,'shots_on_goal');
 assert.equal(game.picks[0].prediction,3.2);
 assert.equal(game.picks[0].modelProbability,null);
 assert.equal(game.picks[0].predictionKind,'mean');
 assert.equal(game.picks[1].prediction,null);
 assert.equal(game.picks[1].modelProbability,.744);
 assert.match(game.sourceLabel,/SEPARATE POINTS CLASSIFIER/);
});

test('original sourced NHL count cannot be generated after cutoff or puck drop',()=>{
 const d=src();d.forecasts.T24H[0][cols.indexOf('generated_at')]='2026-10-18T22:05:00Z';
 assert.equal(reduceFrozenNhlShots(d,'2026-10-18').projected_count,0);
});
test('missing immutable source and wrong dates refuse false numeric predictions',()=>{
 const d=src();d.source_ledger_sha256='fake';
 assert.throws(()=>reduceFrozenNhlShots(d,'2026-10-18'),/UNVERIFIED/);
 assert.equal(reduceFrozenNhlShots(src(),'2026-10-19').projected_count,0);
});

test('duplicate original V2 horizon/player forecast is quarantined',()=>{
 const d=src();
 d.forecasts.T24H.push([...good]);d.total_valid_forecasts=2;
 assert.throws(()=>reduceFrozenNhlShots(d,'2026-10-18'),/DUPLICATE_FROZEN/);
});

test('wrong NHL matchup identity and kickoff may not inherit real projections',()=>{
 const d=reduceFrozenNhlShots(src(),'2026-10-18') as NhlSogResearch;
 assert.equal(addTrueNhlShotCounts([{...baseGame,when:'2026-10-19T22:00:00Z'}],d)[0].picks.length,1);
 assert.equal(addTrueNhlShotCounts([{...baseGame,label:'BOS vs CBJ'}],d)[0].picks.length,1);
});

test('server read-only research endpoint uses source frozen snapshot and no market fallback',async()=>{
 const data=src();
 const requests:string[]=[];
 const fetcher=async (u:string,opts:any)=>{
   requests.push(u);
   assert.equal(opts.cache,'no-store');
   return Response.json(data);
 };
 const out=await loadNhlCountResearch('2026-10-18',fetcher as any,42);
 assert.equal(out.projected_count,1);
 assert.equal(requests.length,1);
 assert.match(requests[0],/mlb-picks2\/main\/docs\/nhl_v2_shadow.json/);
});
