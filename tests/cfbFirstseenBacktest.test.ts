import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const report=JSON.parse(readFileSync('research/cfb_firstseen_2026-10-17_backtest.json','utf8'));
const kickoffDay=(iso:string)=>new Intl.DateTimeFormat('en-CA',{
  timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'
}).format(new Date(iso));
const approx=(a:number,b:number,precision=.00006)=>assert(Math.abs(a-b)<precision,`${a} vs ${b}`);

test('CFB scientific report is explicitly a frozen partial Saturday snapshot from the correct app repo',()=>{
 assert.equal(report.schema,'CFB_FIRST_SEEN_PLAYER_STAT_BACKTEST_SNAPSHOT_V1');
 assert.equal(report.scope.date_et,'2026-10-17');
 assert.equal(report.scope.one_et_kickoff_date_only,true);
 assert.equal(report.scope.all_games_for_day_have_final_player_stats_verified,false);
 assert.equal(report.scope.first_pregame_only,true);
 assert.equal(report.scope.not_betting_record,true);
 assert.equal(report.scope.numerical_forecasts_are_uncalibrated_expected_means_NOT_medians,true);
 assert.equal(report.provenance.source_repository,'deshawnclark116-prog/mlb-picks2');
 assert.equal(report.provenance.immutable_reader_repository,'deshawnclark116-prog/mlb-picks3');
 assert.match(report.provenance.source_commit,/^[0-9a-f]{40}$/);
 assert.equal(report.provenance.no_retraining_or_postgame_backfill,true);
});

test('120 first-seen model-threshold predictions actually occurred before kickoff; 70 won, 50 lost',()=>{
 const rows=report.week_7_saturday_live_firstseen;
 assert.equal(rows.length,120);
 const seen=new Set<string>();
 for(const r of rows){
   assert.equal(kickoffDay(r.kickoff_utc),'2026-10-17');
   assert(Date.parse(r.logged_at)<Date.parse(r.kickoff_utc),'post-kickoff prediction cannot be graded');
   assert.equal(r.evidence,'FIRST_PREGAME_LEDGER_ENTRY');
   assert(['hit','miss'].includes(r.result));
   assert(r.model_probability>=0 && r.model_probability<=1);
   const key=[r.game_id,r.market,r.player_id||'GAME',r.model_line??'ML'].join('|');
   assert(!seen.has(key),'duplicate grader prediction key: '+key);
   seen.add(key);
 }
 const wins=rows.filter((r:any)=>r.result==='hit').length;
 assert.equal(wins,70);
 assert.equal(rows.length-wins,50);
 approx(wins/rows.length,report.summary.live.hit_rate);
 for(const [market,summary] of Object.entries(report.summary.live_by_market) as [string,any][]){
   const m=rows.filter((r:any)=>r.market===market);
   assert.equal(summary.n,m.length);
   assert.equal(summary.wins,m.filter((r:any)=>r.result==='hit').length);
   assert.equal(summary.losses,m.filter((r:any)=>r.result==='miss').length);
   approx(m.reduce((s:number,r:any)=>s+r.model_probability,0)/m.length,summary.average_stated_probability);
 }
 assert.equal(new Set(rows.map((r:any)=>r.game_id)).size,27);
 assert(rows.filter((r:any)=>r.market==='rushing_yards').every((r:any)=>r.model_line===69.5));
 assert(rows.filter((r:any)=>r.market==='passing_touchdowns').every((r:any)=>r.model_line===1.5));
});

test('72 independent first-pregame numerical comparisons preserve both units and per-player recorded truth',()=>{
 const rows=report.week_7_saturday_numeric_firstseen;
 assert.equal(rows.length,72);
 const seen=new Set<string>();
 for(const r of rows){
   assert.equal(kickoffDay(r.kickoff_utc),'2026-10-17');
   assert(Date.parse(r.published_at_utc)<Date.parse(r.kickoff_utc),'cannot backfill numerical projections');
   assert.equal(r.is_expected_mean_not_conditional_median,true);
   assert(Number.isFinite(r.projected_expected_stat)&&Number.isFinite(r.actual));
   approx(r.projected_expected_stat-r.actual,r.signed_error_projected_minus_actual,.0001);
   approx(Math.abs(r.projected_expected_stat-r.actual),r.absolute_error,.0001);
   const key=[r.game_id,r.player_id,r.market].join('|');
   assert(!seen.has(key),'duplicate numerical first-seen identity: '+key);
   seen.add(key);
 }
 const rush=rows.filter((r:any)=>r.market==='rushing_yards'), td=rows.filter((r:any)=>r.market==='passing_touchdowns');
 assert.equal(rush.length,31);
 assert.equal(td.length,41);
 assert.equal(rush.filter((r:any)=>r.absolute_error<=10).length,5);
 assert.equal(rush.filter((r:any)=>r.absolute_error>50).length,8);
 approx(rush.reduce((s:number,r:any)=>s+r.absolute_error,0)/rush.length,
        report.summary.numerical_by_market.rushing_yards.mae,.00051);
 approx(td.reduce((s:number,r:any)=>s+r.absolute_error,0)/td.length,
        report.summary.numerical_by_market.passing_touchdowns.mae,.00051);
 assert.equal(report.summary.numerical.mae,undefined,'never average yards and touchdowns into fake universal MAE');
 assert(!rows.some((r:any)=>r.market==='receiving_yards'),'not one receiving yard was graded by source');
});

test('moneyline overconfidence and missing-player sample exclusion remain visible',()=>{
 const ml=report.summary.live_by_market.moneyline;
 assert.equal(ml.n,25);
 assert.equal(ml.wins,13);
 assert(ml.average_stated_probability>ml.hit_rate+.2);
 assert(report.summary.global_ungraded_not_date_scoped.player_no_stat_line_after_final>0);
 assert(report.summary.numeric_ungraded_not_date_scoped.player_no_stat_line_after_final_NOT_ZERO>0);
 assert(report.limitations.some((s:string)=>s.includes('missing')));
});
