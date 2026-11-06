import test from 'node:test';
import assert from 'node:assert/strict';
import {v3ProjectionPicks,chanceAtLeast,projectionItem} from '../src/components/NbaV3ResearchPanel.tsx';

// cdf[i] = P(X < i+1): the published lattice. Uniform on 0..9 -> P(X>=k)=(10-k)/10.
const uniform=Array.from({length:12},(_,i)=>Math.min(1,(i+1)/10));
const row=(o:any={})=>({player:'P',team_id:'1',player_id:'1',market:'rebounds',mean:5,median:5,p10:2,p25:3,p75:7,p90:8,
 p_active:.9,exp_opp:30,role_share:.1,unc_reasons:[],reported_status:'UNKNOWN_NOT_ACTIVE_CERTIFIED',
 model_target:null,cdf_lattice:{step:1,cdf:uniform},...o});
const game=(rows:any[])=>({game_id:'g',away:'A',home:'H',tipoff_utc:'2026-11-06T02:00:00Z',forecast_at_utc:'x',rows_count:rows.length,rows});

test('percentage is the chance of reaching at least the rounded projection',()=>{
 assert.equal(chanceAtLeast(row() as any,0),1);
 assert.ok(Math.abs(chanceAtLeast(row() as any,5)!-.5)<1e-12);
 assert.ok(Math.abs(chanceAtLeast(row() as any,1)!-.9)<1e-12);
 assert.equal(chanceAtLeast(row() as any,99),0);
 assert.equal(chanceAtLeast(row({cdf_lattice:undefined}) as any,3),null);
});
test('20.5 rounds to 20 and 20.6 rounds to 21 and the percentage matches the rounded number',()=>{
 const a=projectionItem(row({market:'points',mean:20.5}) as any)!, b=projectionItem(row({market:'points',mean:20.6}) as any)!;
 assert.equal(a.whole,20);assert.equal(b.whole,21);
 assert.equal(a.prob,chanceAtLeast(a.row,20));assert.equal(b.prob,chanceAtLeast(b.row,21));
});
test('ranked by chance, highest first; out, unlikely and trivial projections never shown',()=>{
 const g=game([
  row({player_id:'a',mean:3.2}),                       // 3 -> 70%
  row({player_id:'b',mean:2.2}),                       // 2 -> below the rebound floor of 3, not shown
  row({player_id:'c',mean:6.1}),                       // 6 -> 40%
  row({player_id:'d',mean:4.1}),                       // 4 -> 60%
  row({player_id:'e',mean:4.1,reported_status:'OUT'}), // out
  row({player_id:'f',mean:4.1,p_active:.5}),           // may not play
 ]);
 const picks=v3ProjectionPicks(g as any);
 assert.deepEqual(picks.map(p=>p.row.player_id),['a','d','c']);
 assert.deepEqual(picks.map(p=>p.whole),[3,4,6]);
 assert.ok(picks.every((p,i)=>i===0||picks[i-1].prob>=p.prob));
});
test('duplicate player and stat is refused',()=>{
 assert.throws(()=>v3ProjectionPicks(game([row({mean:4.1}),row({mean:4.1})]) as any),/DUPLICATE/);
});
