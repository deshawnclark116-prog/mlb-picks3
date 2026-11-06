import test from 'node:test';
import assert from 'node:assert/strict';
import {v3ProjectionPicks,diversifiedPicks,chanceAtLeast,projectionItem} from '../src/components/NbaV3ResearchPanel.tsx';

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

test('steals, blocks and turnovers rank like every other stat, with their own minimum projection',()=>{
 const g=game([
  row({player_id:'s',market:'steals',mean:1.2}),        // 1 -> 90% (uniform 0..9)
  row({player_id:'b',market:'blocks',mean:0.4}),        // 0 -> below the floor of 1, not shown
  row({player_id:'t',market:'turnovers',mean:1.6}),     // rounds to 2 -> 80%
  row({player_id:'p',market:'points',mean:6.2}),        // 6 -> 40%
 ]);
 const picks=v3ProjectionPicks(g as any);
 assert.deepEqual(picks.map(p=>p.row.market),['steals','turnovers','points']);
});

test('featured tiles take the best pick of each stat first, so cheap stats cannot crowd out the rest',()=>{
 const g=game([
  row({player_id:'a',market:'steals',mean:1.2}),        // 1 -> 90%
  row({player_id:'b',market:'steals',mean:1.1}),        // 1 -> 90%
  row({player_id:'c',market:'blocks',mean:1.3}),        // 1 -> 90%
  row({player_id:'d',market:'turnovers',mean:2.1}),     // 2 -> 80%
  row({player_id:'e',market:'points',mean:6.2}),        // 6 -> 40%
  row({player_id:'f',market:'assists',mean:3.2}),       // 3 -> 70%
 ]);
 const picks=v3ProjectionPicks(g as any);
 const top4=diversifiedPicks(picks).slice(0,4).map(p=>p.row.market);
 assert.equal(new Set(top4).size,4);
 assert.deepEqual(picks.slice(0,3).map(p=>p.row.market),['steals','steals','blocks']);   // the expanded list stays in chance order
});
