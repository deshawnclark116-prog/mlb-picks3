import test from 'node:test';
import assert from 'node:assert/strict';
import {v3ProjectionPicks,topProbabilityPicks,chanceAtLeast,projectionItem} from '../src/components/NbaV3ResearchPanel.tsx';

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

test('system picks omit turnovers but full model row still exists',()=>{
 const g=game([
  row({player_id:'t',market:'turnovers',mean:2.1}),  // 80% but unavailable on user's sportsbook
  row({player_id:'s',market:'steals',mean:1.2}),    // 90%
  row({player_id:'b',market:'blocks',mean:0.4}),    // below floor
  row({player_id:'p',market:'points',mean:6.2})     // 40%
 ]);
 const picks=v3ProjectionPicks(g as any);
 assert.deepEqual(picks.map(p=>p.row.market),['steals','points']);
 assert.ok(g.rows.some(r=>r.market==='turnovers')); // still researchable
});

test('top cards are exactly the 4 highest probability projections, not 4 distinct stat types',()=>{
 const g=game([
  row({player_id:'a',market:'steals',mean:1.2}),    // 90%
  row({player_id:'b',market:'steals',mean:1.1}),    // 90%
  row({player_id:'c',market:'blocks',mean:1.3}),    // 90%
  row({player_id:'d',market:'turnovers',mean:2.1}), // 80%, no pick
  row({player_id:'e',market:'points',mean:6.2}),    // 40%
  row({player_id:'f',market:'assists',mean:3.2}),   // 70%
  row({player_id:'g',market:'points',mean:7.2})     // 30%
 ]);
 const picks=v3ProjectionPicks(g as any);
 const top=topProbabilityPicks(picks).map(p=>p.row.player_id);
 assert.deepEqual(top,picks.slice(0,4).map(p=>p.row.player_id));
 assert.deepEqual(top,['a','b','c','f']);
 assert.equal(topProbabilityPicks(picks).length,4);
 // No category quota can push a weaker player into the first four.
 assert.equal(top.includes('e'),false);
});

test('V5 picks rank by DNP-inclusive probability, not the easier conditional percentage',()=>{
 const g=game([
  row({player_id:'a',market:'points',mean:7.2,p_active:.9,
   reach_probabilities:{whole_projection:7,probability_including_dnp:.68,probability_if_playing:.80,p_active:.9,forward_calibrated:false}}),
  row({player_id:'b',market:'rebounds',mean:3.2,p_active:.8,
   reach_probabilities:{whole_projection:3,probability_including_dnp:.72,probability_if_playing:.75,p_active:.8,forward_calibrated:false}})
 ]);
 const picks=v3ProjectionPicks(g as any);
 assert.deepEqual(picks.map(p=>p.row.player_id),['b','a']);
});
