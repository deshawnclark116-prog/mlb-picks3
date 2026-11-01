import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEspnSoccerScoreboard,parseCompletedSoccerRoster,buildEspnEarlyPlayerForecasts,
 type EspnFixture,type EspnPlayerRow} from '../src/soccer/espnAutofeed';
const e=(date:string,done:boolean)=>({events:[{id:'401879248',date,
 status:{type:{completed:done,name:done?'STATUS_FINAL':'STATUS_SCHEDULED'}},
 competitions:[{competitors:[{homeAway:'home',team:{id:'363',displayName:'Chelsea'}},
 {homeAway:'away',team:{id:'350',displayName:'Liverpool'}}]}]}]});
const when='2026-11-01T02:30:00.000Z';
const row=(athleteId:string,starter:boolean,minutesKind:'full'|'out'|'in'|'missing'='full')=>({
 starter,subbedIn:minutesKind==='in',subbedOut:minutesKind==='out',
 athlete:{id:athleteId,displayName:'Player '+athleteId},
 position:{name:'Midfielder'},
 plays:minutesKind==='out'||minutesKind==='in'?[{substitution:true,clock:{displayValue:"70'"}}]:
 minutesKind==='missing'?[{substitution:true,clock:{displayValue:'???'}}]:[],
 stats:[{name:'totalShots',value:2},{name:'shotsOnTarget',value:1}]
});
test('ESPN soccer uses stable game/team IDs, verified kickoff, date and completion',()=>{
 const f=parseEspnSoccerScoreboard('eng.1',e('2026-10-31T15:00:00Z',true));
 assert.equal(f.length,1);assert.equal(f[0].homeId,'363');
 assert.equal(f[0].away,'Liverpool');assert(f[0].completed);
});
test('completed real soccer roster shot lines and substitution times reconstruct actual exposure',()=>{
 const f=parseEspnSoccerScoreboard('eng.1',e('2026-10-31T15:00:00Z',true))[0];
 const starters=Array.from({length:11},(_,i)=>row(String(i+100),true,i===0?'out':'full'));
 const squadA=[...starters,row('201',false,'in')];
 const squadB=Array.from({length:11},(_,i)=>row(String(i+300),true));
 const payload={rosters:[
  {team:{id:'363'},roster:squadA},
  {team:{id:'350'},roster:squadB}
 ]};
 const result=parseCompletedSoccerRoster(f,payload,when);
 assert.equal(result.length,23);
 assert.equal(result.find(x=>x.playerId==='100')?.match.minutes,70);
 assert.equal(result.find(x=>x.playerId==='201')?.match.minutes,20);
 assert.equal(result.find(x=>x.playerId==='101')?.match.minutes,90);
 assert.equal(result[0].match.shots,2);
 assert.equal(result[0].match.shots_on_target,1);
 assert.throws(()=>parseCompletedSoccerRoster(f,payload,'2026-10-30T19:00:00.000Z'),
   /NOT_COMPLETED/);
});
test('future original forecast uses only previous completed match inputs, never same-match stats',()=>{
 const future:EspnFixture={league:'eng.1',gameId:'future1',
 kickoffUtc:'2026-11-01T21:00:00.000Z',homeId:'363',home:'Chelsea',
 awayId:'350',away:'Liverpool',completed:false};
 const rows:EspnPlayerRow[]=Array.from({length:8},(_,i)=>({
  playerId:'101',playerName:'Player 101',teamId:'363',teamName:'Chelsea',
  league:'eng.1',kickoffUtc:'2026-10-'+String(3+i*3).padStart(2,'0')+'T15:00:00.000Z',
  match:{game_id:'old'+i,game_date:'2026-10-'+String(3+i*3).padStart(2,'0'),
   team_id:'363',team:'Chelsea',minutes:85,starter:true,shots:3,shots_on_target:1,
   xg:null,position:'Midfielder'}
 }));
 const same={...rows[0],kickoffUtc:future.kickoffUtc,
  match:{...rows[0].match,game_id:'future1',game_date:'2026-11-01',shots:35}};
 const original=buildEspnEarlyPlayerForecasts(future,rows,'2026-11-01T12:00:00.000Z');
 const poisoned=buildEspnEarlyPlayerForecasts(future,[...rows,same],
  '2026-11-01T12:00:00.000Z');
 assert.deepEqual(original,poisoned);
 assert.equal(original.length,1);
 assert.equal(original[0].forecast.lineupState,'UNKNOWN');
 assert.equal(original[0].injuriesVerified,false);
 assert.equal(original[0].forecast.predictedShots>0,true);
 assert.equal(buildEspnEarlyPlayerForecasts(future,rows,'2026-11-01T20:55:00.000Z').length,0);
});
