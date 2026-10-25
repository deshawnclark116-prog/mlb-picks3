import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  freezeNbaProbabilities,verifyFrozenProbabilitySnapshots,
  gradeForwardNbaProbabilities,
} from '../src/nba/probabilityLedger.ts';
import {derivedNbaMilestoneProbability} from '../src/nba/probabilityEngine.ts';

const MODEL:any={
  official_bets:0,
  artifact_sha256:'a'.repeat(64),source_team_sha256:'b'.repeat(64),
  markets:{points:{heldout_probability_gate_passed:true}},
  fit:{play_reliability_bins:Object.fromEntries(Array.from({length:10},(_,k)=>
      [String(k),{n:100,observed_played:88,mean_original_p:.88}])),
    conditional_scaled_residuals:{points:Array.from({length:100},(_,k)=>(k-50)/20)}
  }
};
const NOW=new Date('2026-10-24T19:00:00Z');
function fixture(){
  const p=derivedNbaMilestoneProbability(MODEL,'points',27,.95,20)!;
  return {official_bets:0,
    historical_probability_distribution_loaded:true,
    live_injury_check:'LIVE_ESPN_SOURCE_VERIFIED',
    live_injury_source_sha256:'c'.repeat(64),
    current_season_probability_calibration_verified:false,
    games:[{game_id:'401999991',home:'Dallas Mavericks',away:'San Antonio Spurs',
      tipoff_utc:'2026-10-25T01:00:00Z',
      original_at_utc:'2026-10-24T15:00:00Z',
      picks:[{forecast_id:'first001',game_id:'401999991',
        home:'Dallas Mavericks',away:'San Antonio Spurs',
        tipoff_utc:'2026-10-25T01:00:00Z',player_id:'5041938',team_id:'6',
        player:'Imaginary Athlete',market:'points',model_milestone:20,
        predicted_stat:27,model_hit_probability:p,historical_p_play:.95,
        probability_historical_holdout_validated:true,
        probability_method:'HISTORICAL_VALIDATED_EMPIRICAL_CDF',
        official_pick:false,bookmaker_line:null,bookmaker_odds:null}
      ]}]
  } as any;
}
test('NFL-style independent probabilities are frozen with original timestamp, model version and injury-source evidence before tipoff',()=>{
  const data=freezeNbaProbabilities(fixture(),MODEL,NOW);
  assert.equal(data.schema,'NBA_V2_FIRST_OBSERVED_OUTCOME_DISTRIBUTION_PICKS_V1');
  assert.equal(data.game_count,1);
  assert.equal(data.selected_predictions,1);
  assert.equal(data.official_bets,0);
  assert.equal(data.sportsbook_lines_used,0);
  assert.equal(data.games[0].player_predictions[0].bookmaker_line,null);
  assert.equal(data.games[0].player_predictions[0].current_season_calibration_verified,false);
  assert.equal(data.games[0].player_predictions[0].model_hit_probability,
    derivedNbaMilestoneProbability(MODEL,'points',27,.95,20));
  verifyFrozenProbabilitySnapshots([data]);
});
test('saved game ID never overwritten in the next prediction run, no post-tip backfill',()=>{
  const data=freezeNbaProbabilities(fixture(),MODEL,NOW);
  const again=freezeNbaProbabilities(fixture(),MODEL,NOW,
                                     new Set([data.games[0].game_id]));
  assert.equal(again.selected_predictions,0);
  assert.throws(()=>verifyFrozenProbabilitySnapshots([data,data]),/DUPLICATE/);
  const late=new Date('2026-10-25T00:50:00Z');
  assert.throws(()=>freezeNbaProbabilities(fixture(),MODEL,late),/CUTOFF/);
  const stale=fixture();stale.live_injury_check='UNVERIFIED';
  assert.throws(()=>freezeNbaProbabilities(stale,MODEL,NOW),/REQUIRES_LIVE_INJURY/);
});
test('fake changed probability, unofficial bookmaker line, and missing model promotion never frozen',()=>{
  const w=fixture();w.games[0].picks[0].model_hit_probability=.9999;
  assert.throws(()=>freezeNbaProbabilities(w,MODEL,NOW),/DIFFERS/);
  const book=fixture();book.games[0].picks[0].bookmaker_line=19.5;
  assert.throws(()=>freezeNbaProbabilities(book,MODEL,NOW),/NOT_VALIDATED/);
  const bad=fixture();bad.games[0].picks[0].probability_historical_holdout_validated=false;
  assert.throws(()=>freezeNbaProbabilities(bad,MODEL,NOW),/NOT_VALIDATED/);
});
const truth=(status:string,actual:number|null)=>{
  return {schema:'NBA_V2_ALL_IMMUTABLE_ROLLING_PLAYER_STATS_ACTUAL_GRADES_V1',
    player_rows:[{game_id:'401999991',team_id:'6',player_id:'5041938',
      forecast_id:'first001',status,stats:{
        points:{verified_actual_if_played:actual,
                status:'VERIFIED_PLAYED_STAT'}}}]};
};
test('freeze all original model probabilities, grade real hit / miss / DNP with Brier, never invent a sportsbook outcome',()=>{
  const snapshot=freezeNbaProbabilities(fixture(),MODEL,NOW);
  const t= new Date('2026-10-26T15:00:00Z');
  const won=gradeForwardNbaProbabilities([snapshot],truth('VERIFIED_PLAYED',23),t);
  assert.equal(won.original_probabilistic_predictions,1);
  assert.equal(won.verified_hit_or_miss,1);
  assert.equal(won.predicted_vs_actual[0].actual_stat,23);
  assert.equal(won.predicted_vs_actual[0].result,'HIT');
  assert(won.predicted_vs_actual[0].brier!=null);
  assert.equal(won.by_market.points.verified_n,1);
  assert.equal(won.bookmaker_win_loss_record,null);
  const lost=gradeForwardNbaProbabilities([snapshot],truth('VERIFIED_PLAYED',8),t);
  assert.equal(lost.predicted_vs_actual[0].result,'MISS');
  const didNotPlay=gradeForwardNbaProbabilities([snapshot],truth('VERIFIED_DID_NOT_PLAY',null),t);
  assert.equal(didNotPlay.predicted_vs_actual[0].actual_stat,0);
  assert.equal(didNotPlay.predicted_vs_actual[0].result,'MISS');
  const unknown=gradeForwardNbaProbabilities([snapshot],truth('WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX',null),t);
  assert.equal(unknown.unverified,1);
  assert.equal(unknown.verified_hit_or_miss,0);
  assert.equal(unknown.predicted_vs_actual[0].result,'SOURCE_UNVERIFIED');
  const conflicting=truth('VERIFIED_PLAYED',23);conflicting.player_rows[0].forecast_id='changed';
  assert.throws(()=>gradeForwardNbaProbabilities([snapshot],conflicting,t),/NOT_ORIGINAL/);
});
