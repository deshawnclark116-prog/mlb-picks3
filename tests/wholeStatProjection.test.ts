import test from 'node:test';
import assert from 'node:assert/strict';
import {wholeStatProjection,wholeStatEvent,exactCountFromSurvival}
 from '../src/lib/wholeStatProjection';
test('the model display always rounds UP only at decimal 0.6',()=>{
 for(const [inValue,out] of [[0,0],[.5,0],[.6,1],[1.59,1],[1.6,2],
 [3,3],[3.4,3],[3.5,3],[3.5999,3],[3.6,4],[3.9,4],[10.6,11]]){
  assert.equal(wholeStatProjection(inValue),out, String(inValue));
 }
 assert.throws(()=>wholeStatProjection(NaN));
 assert.throws(()=>wholeStatProjection(-1));
});
test('exact P(X=3) is P(X>=3) MINUS P(X>=4), NOT P(X>=3)',()=>{
 const cdf={1:.97,2:.81,3:.58,4:.22,5:.06};
 const e=wholeStatEvent(3.5,cdf);
 assert.equal(e.count,3);assert.equal(e.label,'Exactly 3');
 assert(Math.abs(e.probability!-.36)<1e-12);
 assert.equal(e.semantics,'EXACT_INTEGER_COUNT');
 assert(Math.abs(wholeStatEvent(3.6,cdf).probability!-.16)<1e-12);
});
test('no extrapolation when k+1 boundary missing or survival malformed',()=>{
 assert.equal(wholeStatEvent(5.7,{1:.97,2:.82,3:.55,4:.25,5:.06}).probability,null);
 assert.equal(wholeStatEvent(3.4).probability,null);
 assert.equal(exactCountFromSurvival(2,{2:.4,3:.9}),null);
 assert(Math.abs(exactCountFromSurvival(0,{1:.9})!-.1)<1e-12);
});
