import test from 'node:test';
import assert from 'node:assert/strict';
import {reduceFrozenNhlShots,loadNhlCountResearch} from '../server/nhlCountResearch';
import {addTrueNhlShotCounts,selectNhlShotMilestoneResearch,nhlCountGameDate,nhlVisibleGames,NHL_COUNT_SCHEMA,type NhlSogResearch,type NhlSogCount} from '../src/nhl/countResearch';
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
  forecasts:{T24H:[[...good]]},total_valid_forecasts:1
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
 const game=addTrueNhlShotCounts([baseGame],reduced as unknown as NhlSogResearch)[0];
 assert.equal(game.picks.length,2);
 assert.equal(game.picks[0].market,'shots_on_goal');
 assert.equal(game.picks[0].prediction,3.2);
 assert.equal(game.picks[0].modelProbability,.65);
 assert.equal(game.picks[0].target,'MODEL EVENT 3+ SHOTS · UNVALIDATED RESEARCH');
 assert.match(game.picks[0].detail||'',/NOT prospectively calibrated/);
 assert.equal(reduced.projections[0].model_probability_forward_calibrated,false);
 assert.deepEqual(reduced.projections[0].model_probability_milestones_research_only,
   {'1':.95,'2':.82,'3':.65,'4':.44,'5':.22});
 assert.equal(game.picks[0].predictionKind,'mean');
 assert.equal(game.picks[1].prediction,null);
 assert.equal(game.picks[1].modelProbability,.744);
 assert.match(game.sourceLabel,/SEPARATE POINTS CLASSIFIER/);
});

test('locked NHL SOG milestone CDF is NFL-style event probability, NOT a sportsbook line or a prospectively validated win rate',()=>{
 const report=reduceFrozenNhlShots(src(),'2026-10-18');
 const row=report.projections[0] as NhlSogCount;
 assert.deepEqual(selectNhlShotMilestoneResearch(row),{milestone:3,model_probability:.65});
 const oneHigher={...row,model_probability_milestones_research_only:{
   '1':.99,'2':.92,'3':.81,'4':.69,'5':.46
 }};
 assert.deepEqual(selectNhlShotMilestoneResearch(oneHigher),
   {milestone:4,model_probability:.69});
 const low={...row,model_probability_milestones_research_only:{
   '1':.52,'2':.42,'3':.25,'4':.11,'5':.01
 }};
 assert.equal(selectNhlShotMilestoneResearch(low),null);
 const noCal={...row,model_probability_forward_calibrated:undefined};
 assert.equal(selectNhlShotMilestoneResearch(noCal),null);
 const tamper={...row,model_probability_milestones_research_only:{
   '1':.85,'2':.95,'3':.6,'4':.4,'5':.2
 }};
 assert.throws(()=>selectNhlShotMilestoneResearch(tamper),
   /SURVIVAL_INVARIANT/);
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
 assert.throws(()=>reduceFrozenNhlShots(d,'2026-10-18'),/duplicate player\/game|DUPLICATE_FROZEN/i);
});

test('independent frozen shot-count matchup exists even when current points model offers no pick',()=>{
 const d=reduceFrozenNhlShots(src(),'2026-10-18') as unknown as NhlSogResearch;
 const games=addTrueNhlShotCounts([],d);
 assert.equal(games.length,1);
 assert.equal(games[0].label,'MIN vs CBJ');
 assert.equal(games[0].when,'2026-10-18T22:00:00Z');
 assert.equal(games[0].picks[0].market,'shots_on_goal');
 assert.equal(games[0].picks[0].prediction,3.2);
 assert.equal(games[0].picks[0].modelProbability,null);
 assert.match(games[0].sourceLabel,/FROZEN V2 SOG COUNT/);
});

test('wrong point-classifier matchup or kickoff cannot inherit count forecasts',()=>{
 const d=reduceFrozenNhlShots(src(),'2026-10-18') as unknown as NhlSogResearch;
 for(const broken of [{...baseGame,when:'2026-10-19T22:00:00Z'},
                      {...baseGame,label:'BOS vs CBJ'}]){
   const result=addTrueNhlShotCounts([broken],d);
   assert.equal(result.length,2);
   assert.equal(result.find(g=>g.id===broken.id)!.picks.length,1);
   const frozen=result.find(g=>g.id.startsWith('NHL-FROZEN-COUNT-'))!;
   assert.equal(frozen.label,'MIN vs CBJ');
   assert.equal(frozen.picks[0].prediction,3.2);
 }
});

test('conflicting identity in frozen game can never manufacture a blended matchup',()=>{
 const d=reduceFrozenNhlShots(src(),'2026-10-18') as unknown as NhlSogResearch;
 d.projections.push({...d.projections[0],player_id:'other',player:'Other',
   team:'BOS',opponent:'MTL'});
 d.projected_count=2;
 assert.throws(()=>addTrueNhlShotCounts([],d),/NHL_SOURCE_GAME_ID_TEAM_OR_KICKOFF_CONFLICT/);
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

test('NHL current shot projections are independent of missing or stale points feed date in ET',()=>{
 const evening=new Date('2026-10-19T01:30:00Z'); // Oct 18 9:30 PM ET
 assert.equal(nhlCountGameDate(null,evening),'2026-10-18');
 assert.equal(nhlCountGameDate('2026-10-17',evening),'2026-10-18');
 assert.equal(nhlCountGameDate('2026-10-18',evening),'2026-10-18');
 assert.equal(nhlCountGameDate('2026-10-20',evening),'2026-10-18',
   'At 9:30PM ET, a tomorrow-classifier must not hide current NHL games');
 assert.equal(nhlCountGameDate('2026-10-20',new Date('2026-10-19T15:00:00Z')),
   '2026-10-20','A genuine future slate is available during the daytime');
 assert.equal(nhlCountGameDate('2026-10-20',new Date('2026-10-19T08:30:00Z')),
   '2026-10-19','Overnight NHL current-day cutoff extends through 5 AM ET');
 assert.equal(nhlCountGameDate('invalid',evening),'2026-10-18');
 assert.equal(nhlCountGameDate(null,new Date('2026-10-19T05:30:00Z')),'2026-10-19');
});

test('a missing or failing points classifier cannot hide separately verified NHL shot-count games',()=>{
 assert.equal(nhlVisibleGames(30,true,'points provider unavailable'),'games');
 assert.equal(nhlVisibleGames(30,false,'points provider unavailable'),'games');
 assert.equal(nhlVisibleGames(0,true,null),'loading');
 assert.equal(nhlVisibleGames(0,false,'provider failed'),'error');
 assert.equal(nhlVisibleGames(0,false,null),'empty');
});
