import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildNbaSystemBoard,type InputGame} from '../src/nba/decisionBoard.ts';
import {readVerifiedNbaSystemBoard,nbaSystemPicksHandler} from '../server/nbaSystemPicks.ts';
import {loadLiveNbaInjuries,parseLiveNbaInjuries,requireFreshLiveAvailability,
 resetLiveNbaInjuryCacheForTest} from '../server/nbaLiveAvailability.ts';
const NOW=new Date('2026-10-24T23:24:00Z');
const REPORT='2026-10-24T19:00:00Z';
const ESPN_ID='5041939';
const TEAM_DAL='6';
function entry(team:string,id:string,status:string,player='Test athlete'){
  return {team:{id:team},athlete:{id,displayName:player},status,date:REPORT};
}
function payload(status='OUT'){
  return {injuries:[
    entry(TEAM_DAL,ESPN_ID,status,'Cooper Flagg'),
    entry('1','700001','OUT'),
    entry('2','700002','DOUBTFUL'),
    entry('3','700003','QUESTIONABLE'),
    entry('4','700004','PROBABLE'),
    entry('5','700005','AVAILABLE')
  ]};
}
const modelPlayer=(id:string,name:string,prediction=28):InputGame['players'][number]=>({
  forecast_id:'f'+id,game_id:'401909858',team_id:TEAM_DAL,
  player_id:id,player:name,tipoff_utc:'2026-10-25T00:00:00Z',
  forecast_generated_at_utc:'2026-10-23T16:00:00Z',
  p_play_unverified:.95,conditional_minutes_mean:33,
  official_pick:false,research_only:true,stat_market_lines:null,
  predictions:{points:prediction,rebounds:9,assists:6,three_pointers_made:2}
});
const game:InputGame={game_id:'401909858',home:'Dallas Mavericks',away:'San Antonio Spurs',
  home_id:TEAM_DAL,away_id:'24',tipoff_utc:'2026-10-25T00:00:00Z',
  source:'ROLLING_ORIGINAL_V2',original_at_utc:'2026-10-23T16:00:00Z',
  player_predictions_count:12,
  players:[modelPlayer(ESPN_ID,'Cooper Flagg',39),
    modelPlayer('777777','Other Maverick',30),
    modelPlayer('888888','Third Maverick',27)]};

test('Cooper Flagg confirmed OUT Oct 24 is blocked by live ESPN even if frozen old P(play)=95%',()=>{
  const v=parseLiveNbaInjuries(payload(),NOW);
  assert.equal(v.accepted_entries,6);
  assert.equal(v.players.find(p=>p.player_id===ESPN_ID)?.status,'OUT');
  requireFreshLiveAvailability(v,NOW);
  const archived=structuredClone(game);
  assert(buildNbaSystemBoard([archived]).games[0].picks.some(p=>p.player_id===ESPN_ID));
  const active=structuredClone(game);
  for(const p of active.players){
    const match=v.players.find(x=>x.team_id===p.team_id&&x.player_id===p.player_id);
    if(match)p.espn_source_reported_injury_status=match.status;
  }
  const board=buildNbaSystemBoard([active]);
  assert(!board.games[0].picks.some(p=>p.player_id===ESPN_ID));
  assert.equal(board.games[0].picks.length,2);
  // The source-first frozen prediction itself must stay intact.
  assert.equal(archived.players[0].predictions.points,39);
  assert.equal(archived.players[0].p_play_unverified,.95);
});
test('game-specific confirmed absence independently blocks Flagg even when ESPN report lags',()=>{
  const board=readVerifiedNbaSystemBoard(NOW,parseLiveNbaInjuries(payload('AVAILABLE'),NOW));
  assert.equal(board.live_injury_check,'LIVE_ESPN_SOURCE_VERIFIED');
  assert.equal(board.live_injury_source_at_utc,NOW.toISOString());
  assert(board.games.every(g=>!g.picks.some(p=>p.game_id==='401909858'&&p.player_id===ESPN_ID)));
  const explicit=JSON.parse(readFileSync('docs/nba_verified_game_absences.json','utf8'));
  assert(explicit.entries.some((x:any)=>x.game_id==='401909858'&&x.player_id===ESPN_ID&&
    x.team_id===TEAM_DAL&&x.status==='OUT'&&x.valid_until_utc>'2026-10-24T23:24:00Z'));
});
test('live source refresh rejects old, future, empty, malformed, and duplicate injury records',()=>{
  const v=parseLiveNbaInjuries(payload(),NOW);
  assert.throws(()=>requireFreshLiveAvailability(v,new Date(NOW.getTime()+121000)),/EXPIRED/);
  assert.throws(()=>requireFreshLiveAvailability(v,new Date(NOW.getTime()-5000)),/EXPIRED/);
  assert.throws(()=>parseLiveNbaInjuries({injuries:[]},NOW),/COVERAGE/);
  assert.throws(()=>parseLiveNbaInjuries({x:1},NOW),/MISSING/);
  assert.throws(()=>parseLiveNbaInjuries({injuries:[...payload().injuries,payload().injuries[0]]},NOW),/DUPLICATE/);
});
test('NBA server cannot publish any unchecked SYSTEM PICKS when injury upstream is unavailable',async()=>{
  resetLiveNbaInjuryCacheForTest();
  let code=200,body:any;
  const response:any={setHeader:()=>{},status:(x:number)=>{code=x;return response;},json:(o:any)=>{body=o;return response;}};
  await nbaSystemPicksHandler((async()=>new Response('not found',{status:503})) as typeof fetch,
    ()=>NOW)({} as any,response);
  assert.equal(code,503);
  assert.equal(body.status,'SYSTEM_PICKS_PAUSED_UNTIL_FRESH_INJURY_SOURCE');
  assert.equal(body.official_bets,0);
  assert(!('games' in body));
});
test('fresh ESPN injury observations are cached two minutes without repeated provider credits',async()=>{
  resetLiveNbaInjuryCacheForTest();
  let count=0;
  const f=(async()=>{count++;return Response.json(payload());}) as typeof fetch;
  await loadLiveNbaInjuries(f,NOW);
  await loadLiveNbaInjuries(f,new Date(NOW.getTime()+60000));
  assert.equal(count,1);
  await loadLiveNbaInjuries(f,new Date(NOW.getTime()+121000));
  assert.equal(count,2);
});
