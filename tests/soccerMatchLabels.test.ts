import test from 'node:test';
import assert from 'node:assert/strict';
import {namedSoccerOutcomes,preferredSoccerOutcome} from '../src/soccer/matchLabels';
const f=(home:number,draw:number,away:number)=>({
 home:'1. FC Union Berlin',away:'1. FC Köln',
 probabilities:{home,draw,away,over25:.668,btts:.665}
});
test('display named home/away teams and draw, preserving source model probability',()=>{
 const p=f(.485,.219,.296);
 assert.deepEqual(namedSoccerOutcomes(p).map(x=>x.label),[
  '1. FC Union Berlin to win','Match ends in a draw','1. FC Köln to win']);
 assert.deepEqual(namedSoccerOutcomes(p).map(x=>x.probability),[.485,.219,.296]);
 assert.equal(preferredSoccerOutcome(p).label,'1. FC Union Berlin to win');
 assert.equal(preferredSoccerOutcome(p).probability,.485);
});
test('away favorite and most-likely draw label the correct result',()=>{
 assert.equal(preferredSoccerOutcome(f(.20,.21,.59)).label,'1. FC Köln to win');
 assert.equal(preferredSoccerOutcome(f(.29,.40,.31)).label,'Match ends in a draw');
});
test('a near-tie must never imply a confident winner',()=>{
 const x=preferredSoccerOutcome(f(.356,.29,.354));
 assert.equal(x.label,'Too close to call');assert.equal(x.probability,null);
});
