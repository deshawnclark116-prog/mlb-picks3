import test from 'node:test';
import assert from 'node:assert/strict';
import {exactNflCountEvent} from '../src/nfl/exactCount';
import type {ForecastRow} from '../src/nfl/phase1';
const row=(fields:Partial<ForecastRow>):ForecastRow=>({
 id:'x',game_id:'game',player:'example',team:'MIN',opp:'GB',
 pos:'WR',outcome:'rec',mean:3.4,median:3.4,...fields
});
test('NFL 3.5 median predicts 3 and probability comes from exact 3-bin CDF',()=>{
 const x=exactNflCountEvent(row({median:3.5,cdf_lattice:{
  step:1,cdf:[.04,.16,.36,.62,.81,.93,.99]}}));
 assert.equal(x?.count,3);
 assert.equal(x?.probability,.26);
 assert.equal(x?.semantics,'EXACT_INTEGER_COUNT');
});
test('NFL 3.6 median predicts 4 with a different exact probability',()=>{
 const x=exactNflCountEvent(row({median:3.6,cdf_lattice:{
  step:1,cdf:[.04,.16,.36,.62,.81,.93,.99]}}));
 assert.equal(x?.count,4);
 assert.equal(x?.probability,.19);
});
test('no fabricated exact percentage from a point median, quantile grid, or half-sack CDF',()=>{
 assert.equal(exactNflCountEvent(row({median:3.4})),null);
 assert.equal(exactNflCountEvent(row({outcome:'pass_yds',
  quantile_grid_99:Array(99).fill(200)})),null);
 assert.equal(exactNflCountEvent(row({outcome:'sacks',
  cdf_lattice:{step:.5,cdf:[.2,.3,.8,.9]}})),null);
 assert.equal(exactNflCountEvent(row({cdf_lattice:{step:1,cdf:[.2,.8,.3]}})),null);
 assert.equal(exactNflCountEvent(row({median:15,cdf_lattice:{
  step:1,cdf:[.3,.5,.7]}})),null);
});
