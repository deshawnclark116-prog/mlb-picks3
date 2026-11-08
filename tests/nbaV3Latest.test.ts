import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {mergeLatestRun,overlayLatestRun,overlaySavedNbaV5Pretip} from '../server/nbaV3Latest.ts';

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
test('fail-open: a missing or unreadable latest file leaves the original untouched',()=>{
 const missing=overlayLatestRun(base(),'/nonexistent/latest.json',Date.now());
 assert.equal(missing.games[0].rows[0].mean,5);assert.equal(missing.latest_run.reason,'NO_LATEST_FILE');
 const dir=mkdtempSync(path.join(tmpdir(),'v3latest-'));
 try{
  const f=path.join(dir,'latest.json');writeFileSync(f,'{not json');
  assert.equal(overlayLatestRun(base(),f,Date.now()).latest_run.reason,'LATEST_FILE_UNREADABLE');
  writeFileSync(f,JSON.stringify(header([game('2026-11-04T21:30:00Z',9)],'2026-11-04T21:30:05Z')));
  const ok=overlayLatestRun(base(),f,NOW);
  assert.equal(ok.latest_run.applied,1);assert.equal(ok.games[0].rows[0].mean,9);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('a V4 shadow run layers on top of a V3 latest run and still points at the first forecast',()=>{
 const v3=mergeLatestRun(base(),header([game('2026-11-04T20:00:00Z',7)],'2026-11-04T20:00:05Z'),NOW);
 const g4:any=game('2026-11-04T21:30:00Z',9);g4.rows.forEach((r:any)=>{r.model_version='nba-v4-minutes-rate-teammates-out-20261106';r.mean_basis='CONDITIONAL_ON_PLAYING';});
 const doc4:any=header([g4],'2026-11-04T21:30:05Z');doc4.model_version='nba-v4-minutes-rate-teammates-out-20261106';
 const out=mergeLatestRun(v3,doc4,NOW,'V4_LATEST');
 assert.equal(out.latest_run.applied,1);
 assert.equal(out.games[0].forecast_kind,'V4_LATEST');
 assert.equal(out.games[0].rows[0].mean,9);
 assert.equal(out.games[0].first_seen_forecast_at_utc,'2026-11-01T01:06:14Z');   // not the V3 latest-run time
});
test('an unknown model version is still rejected',()=>{
 const g:any=game('2026-11-04T21:30:00Z',9);g.rows.forEach((r:any)=>{r.model_version='something-else';});
 assert.equal(mergeLatestRun(base(),header([g],'2026-11-04T21:30:05Z'),NOW,'V4_LATEST').games[0].rows[0].mean,5);
});

test('a V5 simulation run layers on top of V4, carries the new stats, and still points at the first forecast',()=>{
 const V5='nba-v5-possession-simulation-20261106';
 const g4:any=game('2026-11-04T21:30:00Z',9);g4.rows.forEach((r:any)=>{r.model_version='nba-v4-minutes-rate-teammates-out-20261106';});
 const doc4:any=header([g4],'2026-11-04T21:30:05Z');doc4.model_version='nba-v4-minutes-rate-teammates-out-20261106';
 const v4=mergeLatestRun(base(),doc4,NOW,'V4_LATEST');
 const g5:any=game('2026-11-04T21:40:00Z',11);
 g5.rows.forEach((r:any)=>{r.model_version=V5;r.mean_basis='CONDITIONAL_ON_PLAYING';});
 g5.rows[0].market='steals';g5.rows[1].market='blocks';g5.rows[2].market='turnovers';
 g5.rows.forEach((r:any)=>{r.p_start=.9;r.depends_on=[{if_out:'7',if_out_name:'Star Player',projection_if_out:3,change:1}];});
 const doc5:any=header([g5],'2026-11-04T21:40:05Z');doc5.model_version=V5;
 const out=mergeLatestRun(v4,doc5,NOW,'V5_LATEST');
 assert.equal(out.latest_run.applied,1);
 assert.equal(out.games[0].forecast_kind,'V5_LATEST');
 assert.deepEqual(out.games[0].rows.map((r:any)=>r.market).slice(0,3),['steals','blocks','turnovers']);
 assert.equal(out.games[0].first_seen_forecast_at_utc,'2026-11-01T01:06:14Z');
});
test('an unknown stat name is still rejected',()=>{
 const g:any=game('2026-11-04T21:30:00Z',9);g.rows[0].market='free_throws';
 assert.equal(mergeLatestRun(base(),header([g],'2026-11-04T21:30:05Z'),NOW).games[0].rows[0].mean,5);
});

const V5_FINAL='nba-v5-blend-possession-simulation-20261106';
function v5Archived(at='2026-11-04T23:45:00Z',mean=21){
 const g:any=game(at,mean);
 g.rows.forEach((r:any)=>{r.model_version=V5_FINAL;r.mean_basis='CONDITIONAL_ON_PLAYING';});
 const d:any=header([g],at);
 d.model_version=V5_FINAL;
 return d;
}
function withSavedLast(doc:any,fn:(archiveRoot:string)=>void){
 withTmp(root=>{
  writeFileSync(path.join(root,'401.json.gz'),gzipSync(JSON.stringify(doc)));
  fn(root);
 });
}
test('a saved confirmed V5 forecast returns to the board after latest.json drops the imminent game',()=>{
 const now=Date.parse('2026-11-05T00:00:00Z');
 withSavedLast(v5Archived(),root=>{
  const result=overlaySavedNbaV5Pretip(base(),root,now);
  assert.equal(result.v5_saved_pretip_run.applied,1);
  assert.deepEqual(result.v5_saved_pretip_run.game_ids,['401']);
  assert.equal(result.games[0].rows[0].mean,21);
  assert.equal(result.games[0].forecast_kind,'V5_LATEST');
  assert.equal(result.games[0].forecast_at_utc,'2026-11-04T23:45:00Z');
  assert.equal(result.games[0].first_seen_forecast_at_utc,'2026-11-01T01:06:14Z');
 });
});
test('saved pretip forecast NEVER rolls a newer valid live V5 forecast back',()=>{
 const now=Date.parse('2026-11-05T00:00:00Z');
 const recent:any=game('2026-11-04T23:50:00Z',25);
 recent.forecast_kind='V5_LATEST';
 recent.rows.forEach((r:any)=>r.model_version=V5_FINAL);
 withSavedLast(v5Archived(),root=>{
  const result=overlaySavedNbaV5Pretip({games:[recent]},root,now);
  assert.equal(result.v5_saved_pretip_run.applied,0);
  assert.equal(result.games[0].rows[0].mean,25);
 });
});
test('game cannot be backfilled from inside the 15-minute cutoff, from after tip, or from the future',()=>{
 const now=Date.parse('2026-11-05T00:24:00Z');
 withSavedLast(v5Archived('2026-11-05T00:20:00Z'),root=>{
  const result=overlaySavedNbaV5Pretip(base(),root,now);
  assert.equal(result.v5_saved_pretip_run.applied,0);
  assert.deepEqual(result.v5_saved_pretip_run.rejected_game_ids,['401']);
  assert.equal(result.games[0].rows[0].mean,5);
 });
 withSavedLast(v5Archived('2026-11-05T00:40:00Z'),root=>{
  const result=overlaySavedNbaV5Pretip(base(),root,now);
  assert.equal(result.v5_saved_pretip_run.applied,0);
  assert.equal(result.games[0].rows[0].mean,5);
 });
});
test('corrupt, wrong-game or non-V5 archives cannot poison the legitimate game board',()=>{
 const now=Date.parse('2026-11-05T00:00:00Z');
 withTmp(root=>{
  writeFileSync(path.join(root,'401.json.gz'),'not gzip');
  const result=overlaySavedNbaV5Pretip(base(),root,now);
  assert.equal(result.v5_saved_pretip_run.applied,0);
  assert.equal(result.games[0].rows[0].mean,5);
 });
 const wrong:any=v5Archived();wrong.games[0].game_id='402';
 withSavedLast(wrong,root=>{
  const result=overlaySavedNbaV5Pretip(base(),root,now);
  assert.equal(result.v5_saved_pretip_run.applied,0);
  assert.equal(result.games[0].rows[0].mean,5);
 });
 const old:any=v5Archived();old.model_version=VERSION;
 withSavedLast(old,root=>{
  const result=overlaySavedNbaV5Pretip(base(),root,now);
  assert.equal(result.v5_saved_pretip_run.applied,0);
  assert.equal(result.games[0].rows[0].mean,5);
 });
});
test('absent archive preserves the prior original and previous latest-run diagnostics',()=>{
 const result=overlaySavedNbaV5Pretip({...base(),latest_run:{applied:1,reason:'OK'}},
                                 '/nonexistent/nba-v5-archive',NOW);
 assert.equal(result.games[0].rows[0].mean,5);
 assert.deepEqual(result.latest_run,{applied:1,reason:'OK'});
 assert.equal(result.v5_saved_pretip_run.reason,'NO_SAVED_V5_LAST_ARCHIVE');
});
