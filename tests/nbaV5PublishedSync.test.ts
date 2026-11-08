import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createPublishedV5Sync} from '../server/nbaV5PublishedSync.ts';

const V5='nba-v5-blend-possession-simulation-20261106';
const TIP='2026-11-08T01:00:00+00:00';
const NOW=Date.parse('2026-11-08T00:50:00Z');
const GENERATION='2026-11-08T00:15:42.876975+00:00';

function game(at:string,mean:number,id='401909940'){
 return {
  game_id:id,tipoff_utc:TIP,home:'Cleveland Cavaliers',away:'New York Knicks',
  forecast_at_utc:at,seed_source_sha256:'c'.repeat(64),rows_count:1,
  rows:[{game_id:id,team_id:'18',player_id:'123',player:'Simulated NBA Player',
   model_version:V5,market:'points',mean,median:mean,p10:4,p25:8,p75:15,p90:21,
   p_active:.93,role_share:.20,exp_opp:40,sd:3,
   cdf_lattice:{step:1,cdf:[.01,.02,.10,.15,.20,.31,.42,.5,.6,.7,.8,.9,1]},
   calibrated_for_2026_27:false,research_only:true,not_an_official_bet:true,
   model_target:null,reported_status:'AVAILABLE',unc_reasons:[]}],
  source_opportunity_pace:{},team_opportunity_diagnostics:{}
 };
}
function header(games:ReturnType<typeof game>[],generated=GENERATION,version=V5){
 return {
  schema:'NBA_V3_2026_27_FIRSTSEEN_FULL_DISTRIBUTION_SHADOW_V1',
  model_version:version,
  upstream_fixtures_source_sha256:'a'.repeat(64),
  prior_game_id_sha256:'b'.repeat(64),
  roster_sources_verified_all_30:true,
  historical_source_boxes:500,
  model_promoted:false,live_nba_system_board_changed:false,
  official_bets:0,research_only:true,no_lookahead_or_retrospective_backfill:true,
  games_forecast:games.length,generated_at_utc:generated,games
 };
}
const ready=(time=GENERATION)=>JSON.stringify({
 schema:'NBA_V5_FORECAST_READINESS_V1',
 document_generated_at_utc:time,all_games_ready:true
});
function mock(getResponse:(path:string)=>string|Uint8Array|null){
 const calls:string[]=[];
 const get=async (url:string,_opts:RequestInit)=>{
  const pathname=new URL(url).pathname;
  calls.push(pathname);
  const body=getResponse(pathname);
  if(body===null)return new Response('not found',{status:404});
  return new Response(body,{status:200});
 };
 return {get,calls};
}
function local(){return {
 games:[game('2026-11-07T22:00:00Z',5)],
 latest_run:{applied:1,reason:'ORIGINAL_V3_LATEST'}
};}
test('long-running AI Studio preview receives published 7:15 V5 instead of its old local 5 PM file',async()=>{
 const {get,calls}=mock(path=>{
  if(path.endsWith('/readiness.json'))return ready();
  if(path.endsWith('/latest.json'))return JSON.stringify(header([game(GENERATION,21)]));
  return null;
 });
 const run=createPublishedV5Sync(get);
 const original=local();
 const newer=await run(original,NOW);
 assert.equal(newer.games[0].rows[0].mean,21);
 assert.equal(newer.games[0].forecast_kind,'V5_LATEST');
 assert.equal(newer.games[0].forecast_at_utc,GENERATION);
 assert.equal(newer.v5_published_sync.latest_generation_at_utc,GENERATION);
 assert.equal(newer.v5_published_sync.latest_applied,1);
 assert.equal(newer.v5_published_sync.source_state,'SOURCE_VERIFIED');
 assert.equal(newer.v5_published_sync.no_backfill_no_sportsbook_reprojection,true);
 assert.deepEqual(newer.latest_run,original.latest_run);
 assert.equal(original.games[0].rows[0].mean,5);
 assert.deepEqual(calls,[
  '/deshawnclark116-prog/mlb-picks3/main/docs/nba_v5_latest/readiness.json',
  '/deshawnclark116-prog/mlb-picks3/main/docs/nba_v5_latest/latest.json'
 ]);
 await run(original,NOW+30_000);
 assert.equal(calls.length,2,'60s TTL must prevent repeated 3MB downloads per UI viewer');
});
test('only readiness changes cause another full latest download',async()=>{
 let stamp=GENERATION;
 const newer='2026-11-08T00:20:00+00:00';
 const {get,calls}=mock(path=>{
  if(path.endsWith('/readiness.json'))return ready(stamp);
  if(path.endsWith('/latest.json'))return JSON.stringify(header([game(stamp,30)],stamp));
  return null;
 });
 const run=createPublishedV5Sync(get);
 assert.equal((await run(local(),NOW)).games[0].rows[0].mean,30);
 assert.equal((await run(local(),NOW+61_000)).games[0].rows[0].mean,30);
 assert.equal(calls.filter(x=>x.endsWith('latest.json')).length,1);
 stamp=newer;
 assert.equal((await run(local(),NOW+123_000)).games[0].rows[0].mean,30);
 assert.equal(calls.filter(x=>x.endsWith('latest.json')).length,2);
});
test('public last archive restores a pretip game already evicted from latest',async()=>{
 const archiveAt='2026-11-08T00:13:37+00:00';
 const archive=header([game(archiveAt,19)],archiveAt);
 const {get,calls}=mock(path=>{
  if(path.endsWith('/readiness.json'))return ready();
  if(path.endsWith('/latest.json'))return JSON.stringify(header([]));
  if(path.endsWith('/401909940.json.gz'))return new Uint8Array(gzipSync(JSON.stringify(archive)));
  return null;
 });
 const out=await createPublishedV5Sync(get)(local(),NOW);
 assert.equal(out.games[0].rows[0].mean,19);
 assert.equal(out.games[0].forecast_at_utc,archiveAt);
 assert.equal(out.v5_published_sync.archived_applied,1);
 assert.deepEqual(out.v5_published_sync.archived_game_ids_applied,['401909940']);
 assert.ok(calls.some(x=>x.endsWith('401909940.json.gz')));
});
test('later original/local V5 is NEVER overwritten by an older remote snapshot',async()=>{
 const {get}=mock(path=>{
  if(path.endsWith('/readiness.json'))return ready();
  if(path.endsWith('/latest.json'))return JSON.stringify(header([game(GENERATION,11)]));
  return null;
 });
 const localNew={games:[game('2026-11-08T00:20:00+00:00',29)]};
 const out=await createPublishedV5Sync(get)(localNew,NOW);
 assert.equal(out.games[0].rows[0].mean,29);
 assert.equal(out.v5_published_sync.latest_applied,0);
});
test('wrong-generation response and unreachable CDN fall back to prior model numbers',async()=>{
 const mismatch=mock(path=>{
  if(path.endsWith('/readiness.json'))return ready();
  if(path.endsWith('/latest.json'))return JSON.stringify(header([game(GENERATION,28)],'2026-11-08T00:12:00+00:00'));
  return null;
 });
 const out=await createPublishedV5Sync(mismatch.get)(local(),NOW);
 assert.equal(out.games[0].rows[0].mean,5);
 assert.equal(out.v5_published_sync.source_state,'SOURCE_UNAVAILABLE_LOCAL_FALLBACK');
 assert.match(out.v5_published_sync.source_error,/NOT_MATCHING_PUBLISHED_READINESS/);
 const missing=await createPublishedV5Sync(async()=>{throw Error('BLOCKED_PREVIEW_NETWORK');})(local(),NOW);
 assert.equal(missing.games[0].rows[0].mean,5);
 assert.equal(missing.v5_published_sync.source_state,'SOURCE_UNAVAILABLE_LOCAL_FALLBACK');
});
test('after-tip archive and mismatched game identity cannot replace an original projection',async()=>{
 for(const invalid of [
  header([game('2026-11-08T00:52:00+00:00',39)],'2026-11-08T00:52:00+00:00'),
  header([game('2026-11-08T00:13:00+00:00',39,'999999')],'2026-11-08T00:13:00+00:00')
 ]){
  const {get}=mock(path=>{
   if(path.endsWith('/readiness.json'))return ready();
   if(path.endsWith('/latest.json'))return JSON.stringify(header([]));
   if(path.endsWith('/401909940.json.gz'))return new Uint8Array(gzipSync(JSON.stringify(invalid)));
   return null;
  });
  const out=await createPublishedV5Sync(get)(local(),NOW);
  assert.equal(out.games[0].rows[0].mean,5);
  assert.equal(out.v5_published_sync.archived_applied,0);
 }
});
test('oversized or malformed public release cannot override a locally verified distribution',async()=>{
 const {get}=mock(path=>{
  if(path.endsWith('/readiness.json'))return ready();
  if(path.endsWith('/latest.json'))return 'x'.repeat(5_000_001);
  return null;
 });
 const out=await createPublishedV5Sync(get)(local(),NOW);
 assert.equal(out.games[0].rows[0].mean,5);
 assert.equal(out.v5_published_sync.source_state,'SOURCE_UNAVAILABLE_LOCAL_FALLBACK');
});
