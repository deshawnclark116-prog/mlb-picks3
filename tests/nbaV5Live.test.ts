import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {readDirectV5Forecast} from '../server/nbaV5Live.ts';

const NOW=Date.parse('2026-11-06T19:00:00Z');
const MADE='2026-11-06T18:00:00Z';
const TIP='2026-11-07T01:00:00Z';
const VERSION='nba-v5-blend-possession-simulation-20261106';
const row=(market='points',kind='CONDITIONAL_ON_PLAYING')=>({
 game_id:'401901234',team_id:'2',player_id:'123',
 player:'NBA Player',model_version:VERSION,market,mean:15.2,
 median:15,p10:6,p25:10,p75:18,p90:22,mean_basis:kind,
 p_active:.98,role_share:.15,exp_opp:10,sd:3,
 cdf_lattice:{step:1,cdf:Array.from({length:40},(_,i)=>Math.min(1,(i+1)/40))},
 model_target:null,unc_reasons:[],calibrated_for_2026_27:false,
 research_only:true,not_an_official_bet:true,reported_status:'AVAILABLE'
});
const game=(id='401901234')=>({
 game_id:id,tipoff_utc:TIP,forecast_at_utc:MADE,home:'Boston Celtics',
 away:'Milwaukee Bucks',home_id:'2',away_id:'15',rows_count:1,
 rows:[{...row(),game_id:id}],model_version:VERSION,
 forecast_kind:'V5_SHADOW',seed_source_sha256:'a'.repeat(64),
 model_outcome_projection:{
  home_win_probability:.55,away_win_probability:.45,home_score_mean:112,
  away_score_mean:108,total_score_mean:220,source:'V5_CONNECTED_POSSESSION_SIMULATION_NOT_BOOKMAKER'}
});
const doc=(games:any[])=>({
 schema:'NBA_V3_2026_27_FIRSTSEEN_FULL_DISTRIBUTION_SHADOW_V1',
 model_version:VERSION,upstream_fixtures_source_sha256:'a'.repeat(64),
 prior_game_id_sha256:'b'.repeat(64),roster_sources_verified_all_30:true,
 historical_source_boxes:500,model_promoted:false,
 live_nba_system_board_changed:false,official_bets:0,
 research_only:true,no_lookahead_or_retrospective_backfill:true,
 games_forecast:games.length,generated_at_utc:MADE,games
});
function check(v:any,now=NOW){
 const dir=mkdtempSync(path.join(tmpdir(),'nba-v5-'));
 try{
  const f=path.join(dir,'latest.json');
  writeFileSync(f,JSON.stringify(v));
  return readDirectV5Forecast(now,f);
 }finally{rmSync(dir,{recursive:true,force:true});}
}

test('V5 direct feed lists its own game, even with NO earlier V3 archive',()=>{
 const d=check(doc([game()]));
 assert.equal(d.status,'NBA_V5_AVAILABLE');
 assert.equal(d.games.length,1);
 assert.equal(d.games[0].game_id,'401901234');
 assert.equal(d.source_model,'NBA_V5_ONLY');
 assert.equal(d.games[0].model_outcome_projection.home_win_probability,.55);
});

test('V5 direct feed exposes multiple games without needing V3 keys',()=>{
 const d=check(doc([game(),game('401901235')]));
 assert.equal(d.status,'NBA_V5_AVAILABLE');
 assert.equal(d.games.length,2);
});

test('V5 refuses older model versions and never relabels their numbers',()=>{
 const old=doc([game()]);
 old.model_version='nba-v4-minutes-rate-teammates-out-20261106';
 assert.equal(check(old).status,'NBA_V5_SOURCE_REJECTED');
 const wrong=doc([game()]);
 wrong.games[0].rows[0].model_version='nba-v3-phase1-opportunity-role-mc-shotratefix-20261026';
 assert.equal(check(wrong).status,'NBA_V5_SOURCE_REJECTED');
});

test('a stale or posttip snapshot is not shown as live',()=>{
 const value=doc([game()]);
 assert.equal(check(value,NOW+17*3600000).status,'NBA_V5_SOURCE_STALE');
});

test('missing direct V5 file is explicit and never filled with V3',()=>{
 const out=readDirectV5Forecast(NOW,'/this/never/existed.json');
 assert.equal(out.status,'NBA_V5_SOURCE_NOT_PUBLISHED');
 assert.equal(out.games.length,0);
});

test('malformed probability CDF fails closed',()=>{
 const value=doc([game()]);
 value.games[0].rows[0].cdf_lattice.cdf=[.6,.2,1];
 assert.equal(check(value).status,'NBA_V5_SOURCE_REJECTED');
});
