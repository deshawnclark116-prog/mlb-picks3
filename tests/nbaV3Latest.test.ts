import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeLatestRun,overlayLatestRun} from '../server/nbaV3Latest.ts';

const VERSION='nba-v3-phase1-opportunity-role-mc-shotratefix-20261026';
const TIP='2026-11-05T00:30:00Z';
const NOW=Date.parse('2026-11-04T22:00:00Z');
function game(forecastAt:string,mean:number){
 const fields=['points','rebounds','assists','three_pointers_made'];
 return {game_id:'401',tipoff_utc:TIP,home:'Boston Celtics',away:'Milwaukee Bucks',forecast_at_utc:forecastAt,rows_count:4,seed_source_sha256:'c'.repeat(64),
  source_opportunity_pace:{},team_opportunity_diagnostics:{},
  rows:fields.map(m=>({game_id:'401',team_id:'2',player_id:'9',player:'Test Player',model_version:VERSION,market:m,mean,median:mean,p10:1,p25:2,p75:4,p90:6,
   p_active:.9,role_share:.2,exp_opp:1,sd:2,cdf_lattice:{step:1,cdf:[.1,.2,.7,1]},model_target:{milestone:2,probability:.8,method:'pregame_full_game_mc_cdf'},
   unc_reasons:[],calibrated_for_2026_27:false,research_only:true,not_an_official_bet:true,reported_status:'UNKNOWN'}))};
}
const header=(games:any[],at:string)=>({schema:'NBA_V3_2026_27_FIRSTSEEN_FULL_DISTRIBUTION_SHADOW_V1',model_version:VERSION,upstream_fixtures_source_sha256:'a'.repeat(64),
 prior_game_id_sha256:'b'.repeat(64),roster_sources_verified_all_30:true,historical_source_boxes:500,model_promoted:false,live_nba_system_board_changed:false,
 official_bets:0,research_only:true,no_lookahead_or_retrospective_backfill:true,games_forecast:games.length,games,generated_at_utc:at});
const base=()=>({games:[game('2026-11-01T01:06:14Z',5)]});

test('a newer, valid latest run replaces the original and keeps a pointer to it',()=>{
 const out=mergeLatestRun(base(),header([game('2026-11-04T21:30:00Z',9)],'2026-11-04T21:30:05Z'),NOW);
 assert.equal(out.latest_run.applied,1);
 assert.equal(out.games[0].rows[0].mean,9);
 assert.equal(out.games[0].forecast_kind,'LATEST_RUN');
 assert.equal(out.games[0].first_seen_forecast_at_utc,'2026-11-01T01:06:14Z');
});
test('an older or equal forecast never replaces the original',()=>{
 const out=mergeLatestRun(base(),header([game('2026-10-30T00:00:00Z',9)],'2026-11-04T21:30:05Z'),NOW);
 assert.equal(out.latest_run.applied,0);assert.equal(out.games[0].rows[0].mean,5);
});
test('a forecast made inside 15 minutes of tip-off or after it is rejected',()=>{
 const out=mergeLatestRun(base(),header([game('2026-11-05T00:20:00Z',9)],'2026-11-04T21:30:05Z'),NOW+3*3600_000);
 assert.equal(out.latest_run.applied,0);assert.equal(out.games[0].rows[0].mean,5);
});
test('a stale or future-dated file is ignored',()=>{
 assert.equal(mergeLatestRun(base(),header([game('2026-11-04T01:00:00Z',9)],'2026-11-04T01:00:05Z'),NOW).latest_run.reason,'LATEST_STALE_OR_FUTURE');
 assert.equal(mergeLatestRun(base(),header([game('2026-11-04T21:30:00Z',9)],'2026-11-05T09:00:00Z'),NOW).latest_run.reason,'LATEST_STALE_OR_FUTURE');
});
test('a game with a broken distribution or a different tip-off keeps the original',()=>{
 const bad=game('2026-11-04T21:30:00Z',9);bad.rows[0].cdf_lattice.cdf=[.5,.2,.7,1];           // not monotone
 assert.equal(mergeLatestRun(base(),header([bad],'2026-11-04T21:30:05Z'),NOW).games[0].rows[0].mean,5);
 const moved:any=game('2026-11-04T21:30:00Z',9);moved.tipoff_utc='2026-11-05T01:00:00Z';
 assert.equal(mergeLatestRun(base(),header([moved],'2026-11-04T21:30:05Z'),NOW).games[0].rows[0].mean,5);
});
test('games the app does not already show are never added, and a missing file changes nothing',()=>{
 const other:any=game('2026-11-04T21:30:00Z',9);other.game_id='999';other.rows.forEach((r:any)=>r.game_id='999');
 assert.equal(mergeLatestRun(base(),header([other],'2026-11-04T21:30:05Z'),NOW).games.length,1);
 assert.equal(mergeLatestRun(base(),null,NOW).latest_run.reason,'NO_LATEST_FILE');
});
test('fail-open when the network is dead',async()=>{
 const dead=(async()=>{throw new Error('down');}) as unknown as typeof fetch;
 const out=await overlayLatestRun(base(),dead,Date.now()+1_000_000);
 assert.equal(out.games[0].rows[0].mean,5);
});
