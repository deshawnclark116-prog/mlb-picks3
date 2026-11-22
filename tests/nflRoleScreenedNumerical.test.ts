import test from 'node:test';
import assert from 'node:assert/strict';
import type {ExistingNflGame,ExistingYardProjection} from '../src/nfl/existing.ts';
import type {NflRoleSnapshot,NflRoleEvidenceRow} from '../src/nfl/roleSupportedNfl.ts';
import {roleScreenedNflNumerical,type NflNumericGradeReport} from '../src/nfl/roleScreenedNumerical.ts';

const KICK='2026-11-22T18:00:00Z';
const GEN='2026-11-22T15:40:28Z';
const NOW=Date.parse('2026-11-22T16:15:00Z');
type Market='receiving_yards'|'rushing_yards';
const proj=(player:string,team:string,market:Market,median:number,source='v2_context'):ExistingYardProjection=>({
  player,player_id:player,team,opponent:team==='KC'?'ARI':'KC',
  market,kickoff_utc:KICK,projected_median:median,projected_mean:median,
  projected_low:Math.max(0,median*.1),projected_high:median*2.5,
  ungraded:true,confidence:'HIGH',games_played:6,model_source:source
});
const ev=(p:ExistingYardProjection,n=3,opps=7,share=.2,
  status='RECENT_OPPORTUNITIES_OBSERVED_NO_STARTER_PROOF'):NflRoleEvidenceRow=>({
    player:p.player,team:p.team,opponent:p.opponent,market:p.market,kickoff_utc:KICK,
    published_model_median:p.projected_median,published_model_source:p.model_source,
    roster_status:'ROSTER_LISTED_NOT_STARTER_VERIFIED',
    observed_stat_rows:n,recent_opportunities_per_observed_game:opps,
    recent_team_share:share,role_status:status,
    role_evidence_complete_for_showcase:n===3,
    has_verified_starting_role:false,has_calibrated_book_bet_probability:false,
    warnings:n===3?[]:['THREE_PRIOR_TEAM_GAME_ROWS_UNVERIFIED']
});
const ps=[
 proj('Tyler Allgeier','ARI','rushing_yards',42.9),
 proj('Jerome Ford','ARI','rushing_yards',5,'prior_season_sim'),
 proj('Bam Knight','ARI','rushing_yards',18.4),
 proj('Emmett Johnson','KC','rushing_yards',25.7),
 proj('Josh Downs','KC','receiving_yards',37.4),
 proj('Rashee Rice','KC','receiving_yards',60.1),
 proj('Xavier Worthy','KC','receiving_yards',29.8),
 proj('Reggie Virgil','ARI','receiving_yards',13.1)
];
const evidence=[
 ev(ps[0],3,11,.60),
 ev(ps[1],0,0,0),
 ev(ps[2],2,4,.28),
 ev(ps[3],3,9.67,.35,'RECENT_OPPORTUNITIES_EXPANDING'),
 ev(ps[4],1,5,.15),
 ev(ps[5],3,7,.21),
 ev(ps[6],3,5,.15,'RECENT_OPPORTUNITIES_DECLINING'),
 ev(ps[7],3,3,.07)
];
const game:ExistingNflGame={
 id:'2026-11-22T18:00:00.000Z|ARI_KC',teams:['ARI','KC'],
 kickoff_utc:KICK,projections:ps,events:[]
};
const snapshot=(rows:NflRoleEvidenceRow[]=evidence):NflRoleSnapshot=>({
 schema:'nfl-role-evidence-coverage-v1',status:'PREGAME_RESEARCH_ROLE_SNAPSHOT',
 season:2026,week:11,forecast_generated_at_utc:GEN,
 captured_at_utc:'2026-11-22T15:40:29Z',
 player_market_evidence:rows,is_betting_probability_calibrated:false,
 starter_status_verified:false
});
const grade:NflNumericGradeReport={
 schema:'NFL_NUMERICAL_FIRST_SEEN_FORWARD_GRADE_V1',
 graded_at_utc:'2026-11-22T15:40:31Z',
 first_seen_count:1361,graded_count:918,
 recent_repeated_overprojections:[
  {player_id:'00-0039894',player:'Xavier Worthy',team:'KC',
   market:'receiving_yards',last_completed_week:10,
   observed_prior_games:3,overprojected_by_10_count:2,
   last3_median_errors:[20.4,-20,33.3]},
  {player_id:'00-0038997',player:'Josh Downs',team:'IND',
   market:'receiving_yards',last_completed_week:9,
   observed_prior_games:3,overprojected_by_10_count:3,
   last3_median_errors:[17.2,12,12.8]}
 ]
};
test('REAL Week11 screenshot: no alphabetical 5/18/26-yard featured fillers or declining repeatedly-missed Worthy',()=>{
 const original=JSON.stringify(ps);
 const result=roleScreenedNflNumerical(game,GEN,snapshot(),grade,NOW);
 assert.equal(result.reason,'ROLE_EVIDENCE_OK');
 assert.deepEqual(result.leaders.map(x=>[x.projection.player,x.projection.projected_median]),
   [['Rashee Rice',60.1],['Tyler Allgeier',42.9]]);
 assert(result.leaders.every(x=>x.role.observed_stat_rows===3));
 assert(result.leaders.every(x=>x.ranking_basis==='MODELED_YARDS_WITHIN_MARKET_NOT_HIT_PROBABILITY'));
 assert(result.excluded.low_projected_impact>=3); // Ford, Knight, Emmett
 assert(result.excluded.not_enough_recent_role_proof>=1); // Downs
 assert(result.excluded.declining_opportunities>=1); // Worthy
 assert.equal(original,JSON.stringify(ps),'original frozen forecasts must remain unchanged');
});
test('role screen never makes a four-item quota from low-volume bench players',()=>{
 const thin=[ps[1],ps[2],ps[4],ps[6]];
 const g={...game,projections:thin};
 const result=roleScreenedNflNumerical(g,GEN,snapshot(),grade,NOW);
 assert.equal(result.leaders.length,0);
});
test('documented 2-of-3 forecast misses stop a high-mean lead without any name-specific blacklist',()=>{
 const big=proj('Test Player','KC','receiving_yards',88.0);
 const role=ev(big,3,9,.3);
 const doc=snapshot([role]);
 const before=roleScreenedNflNumerical({...game,projections:[big]},GEN,doc,grade,NOW);
 assert.deepEqual(before.leaders.map(x=>x.projection.player),['Test Player']);
 const update={...grade,recent_repeated_overprojections:[{
  player_id:'player-id',player:'Test Player',team:'KC',
  market:'receiving_yards',observed_prior_games:3,overprojected_by_10_count:2,
  last_completed_week:10,last3_median_errors:[20,18,-8]
 }]};
 const blocked=roleScreenedNflNumerical({...game,projections:[big]},GEN,doc,update,NOW);
 assert.deepEqual(blocked.leaders,[]);
 assert.equal(blocked.excluded.repeated_forward_misses,1);
});
test('strict forecast timestamp, same game team, and stale or after-kickoff receipts fail closed',()=>{
 for(const doc of [
  null,{...snapshot(),forecast_generated_at_utc:'2026-11-21T00:00:00Z'},
  {...snapshot(),captured_at_utc:'2026-11-22T18:05:00Z'},
  {...snapshot(),captured_at_utc:'2026-11-22T06:00:00Z'},
  {...snapshot(),player_market_evidence:evidence.map(x=>({...x,opponent:'BUF'}))}
 ]){
  const r=roleScreenedNflNumerical(game,GEN,doc,grade,NOW);
  assert.deepEqual(r.leaders,[]);
 }
});
test('separate receiving and rushing volume forecast groups; no made-up % or games-played rank',()=>{
 const people=[
  proj('Receiver A','KC','receiving_yards',41),
  proj('Receiver B','KC','receiving_yards',74),
  proj('Receiver C','KC','receiving_yards',60),
  proj('Runner A','ARI','rushing_yards',70),
  proj('Runner B','ARI','rushing_yards',35),
  proj('Runner C','ARI','rushing_yards',67)
 ];
 const results=roleScreenedNflNumerical({...game,projections:people},
   GEN,snapshot(people.map(p=>ev(p,3,10,.25))),grade,NOW);
 assert.deepEqual(results.leaders.map(x=>x.projection.player),
   ['Receiver B','Receiver C','Runner A','Runner C']);
 assert(results.leaders.every(x=>!('probability' in x)));
});
test('unverified starting-QB context not suddenly promoted as ARI receiver',()=>{
 const risky=proj('ARI pass catcher','ARI','receiving_yards',110);
 const r=roleScreenedNflNumerical({...game,projections:[risky]},
   GEN,snapshot([ev(risky)]),grade,NOW);
 assert.deepEqual(r.leaders,[]);
 assert.equal(r.excluded.starter_context_unverified,1);
});
