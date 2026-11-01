import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePlayerMatchLog,playerShotForecast,forwardPlayerShadow} from '../src/soccer/playerChallenger';
const games=Array.from({length:12},(_,i)=>({
 game_id:'g'+i,game_date:'2026-09-'+String(i+1).padStart(2,'0'),
 team_id:'382',team:'MNC',starter:i%4!==0,position:'Forward',
 minutes:i%4===0?28:83,shots:i%3+1,shots_on_target:i%3===0?1:0,
 xg:.2*(i%3+1)
}));
const log=()=>parsePlayerMatchLog({player_id:'p1',games});
const options={teamId:'382',fixtureGameId:'future',availability:'UNKNOWN' as const,
 asofUtc:'2026-09-30T14:00:00.000Z'};
test('real player minutes, shots, SOT and xG are parsed with source-consistency guards',()=>{
 const l=log();assert.equal(l.games.length,12);
 assert.equal(l.games[2].shots,3);
 assert.throws(()=>parsePlayerMatchLog({player_id:'p1',
   games:[{...games[0],shots_on_target:4}]}),/INVALID/);
 assert.throws(()=>parsePlayerMatchLog({player_id:'p1',
   games:[games[0],games[0]]}),/DUPLICATE/);
 assert.throws(()=>parsePlayerMatchLog({player_id:'p1',
   games:[{...games[0],shots:null}]}),/INVALID/);
});
test('original pregame shot and SOT means derive from player minutes, with no official betting claims',()=>{
 const p=playerShotForecast(log(),'2026-10-04',options);
 assert(p);
 assert(p.predictedShots>0&&p.predictedShotsOnTarget>0);
 assert(p.predictedShotsOnTarget<p.predictedShots);
 assert(p.predictedMinutes>0&&p.predictedMinutes<100);
 assert(p.pShotsAtLeast3>0&&p.pShotsAtLeast3<1);
 assert.equal(p.lineupState,'UNKNOWN');
 assert.equal(p.availabilityState,'UNKNOWN');
 assert.match(p.status,/RESEARCH_ONLY/);
});
test('future-game, opponent, transfer and identity leakage are blocked',()=>{
 const p=playerShotForecast(log(),'2026-10-04',options);
 const bad=log();bad.games.push({...games[0],game_id:'post',
  game_date:'2026-10-05',minutes:90,shots:35,shots_on_target:35});
 assert.deepEqual(p,playerShotForecast(bad,'2026-10-04',options));
 const transfer=log();transfer.games.push({...games[0],game_id:'oldTeam',
  team_id:'AAA',shots:30,shots_on_target:20});
 assert.deepEqual(p,playerShotForecast(transfer,'2026-10-04',options));
 assert.throws(()=>playerShotForecast(log(),'2026-09-30',options),/NOT_VERIFIED/);
 assert.equal(playerShotForecast(log(),'2026-10-04',{...options,availability:'CONFIRMED_OUT'}),null);
 assert.equal(playerShotForecast(log(),'2026-10-04',{...options,teamId:'other'}),null);
});
test('strict prekickoff observed lineup can inform minutes, while postkickoff knowledge cannot',()=>{
 const o=options;const regular=playerShotForecast(log(),'2026-10-04',o);
 const start=playerShotForecast(log(),'2026-10-04',{...o,
  lineup:{source:'STRIKERAPI_GET_LINEUPS',game_id:'future',
  starts_at:'2026-10-04T16:00:00Z',observed_at:o.asofUtc,status:'CONFIRMED_STARTER'}});
 assert(start&&regular&&start.predictedMinutes>regular.predictedMinutes);
 assert.throws(()=>playerShotForecast(log(),'2026-10-04',{...o,
   lineup:{source:'STRIKERAPI_GET_LINEUPS',game_id:'future',
    starts_at:'2026-10-04T16:00:00Z',
    observed_at:'2026-10-04T17:00:00Z',status:'CONFIRMED_STARTER'}}),/UNVERIFIED_LINEUP/);
});
test('historical shadow never borrows future observations to calculate a past projection',()=>{
 const r=forwardPlayerShadow(log(),'382');
 assert.equal(r.noModelPromotion,true);
 assert(r.n>0);
 const future=log();future.games.push({...games[0],game_id:'future',
   game_date:'2026-10-18',shots:35,shots_on_target:30});
 const a=forwardPlayerShadow(future,'382').rows.filter(x=>x.date<'2026-10-18');
 assert.deepEqual(r.rows,a);
});
