import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateGame,probabilityAtLeast,type Player} from '../src/nba/v3GameSimulation.ts';
const rates={points:.5,rebounds:.2,assists:.12,three_pointers_made:.07};
const players:Player[]=['A','B'].flatMap(team=>Array.from({length:8},(_,i)=>({id:team+i,team,active:true,minutes:30,minutesSd:3,rates})));
test('NBA V3 game draws conserve regulation 240 minutes for each team and never exceed 48/player',()=>{
 const ds=simulateGame({players,draws:80,seed:14});
 assert.equal(ds.length,80);
 for(const d of ds)for(const team of ['A','B']){
  const ps=d.filter(p=>p.id.startsWith(team));
  assert(Math.abs(ps.reduce((s,p)=>s+p.minutes,0)-240)<1e-5);
  assert(ps.every(p=>p.minutes>=0&&p.minutes<=48.000001));
  assert(ps.every(p=>Object.values(p.stats).every(v=>Number.isInteger(v)&&v>=0)));
 }
 assert.deepEqual(ds,simulateGame({players,draws:80,seed:14}));
 const p=probabilityAtLeast(ds,'A0','points',15);
 assert(p>=0&&p<=1);
});
test('injured player cannot receive minutes or a simulated stat',()=>{
 const ps=players.map(p=>p.id==='A0'?{...p,active:false}:p);
 const ds=simulateGame({players:ps,draws:10});
 assert(ds.every(d=>!d.some(p=>p.id==='A0')));
 assert.equal(probabilityAtLeast(ds,'A0','points',1),0);
});
test('fail closed when active rotation cannot fill 240 minutes',()=>{
 const ps=players.map(p=>p.team==='A'&&!['A0','A1','A2','A3'].includes(p.id)?{...p,active:false}:p);
 assert.throws(()=>simulateGame({players:ps,draws:1}),/INSUFFICIENT_ACTIVE_ROTATION_CAPACITY/);
});
