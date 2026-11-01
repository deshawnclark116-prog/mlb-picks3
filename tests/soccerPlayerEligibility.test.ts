import test from 'node:test';
import assert from 'node:assert/strict';
import {currentSoccerRoster,currentSoccerUnavailable,
 confirmedSoccerStartingXI} from '../server/soccerPlayerEligibility';

const roster=(n=18)=>({team:{id:'359'},athletes:Array.from({length:n},(_,i)=>
 ({id:String(100+i),displayName:'Player '+i}))});
test('current squad check rejects missing/stale/implausibly short rosters',()=>{
 assert.equal(currentSoccerRoster({},'359'),null);
 assert.equal(currentSoccerRoster(roster(9),'359'),null);
 assert.equal(currentSoccerRoster(roster(18),'350'),null);
 assert.equal(currentSoccerRoster(roster(),'359')?.size,18);
 assert.equal(currentSoccerRoster({team:{id:'359'},athletes:[{position:'Forward',
   items:roster(18).athletes}]},'359')?.size,18);
});
test('known absence records exclude matching athlete, but missing injury coverage fails closed',()=>{
 const report={injuries:[{athlete:{id:'104'},status:'Out'},
  {athlete:{id:'105'},status:{name:'Suspended'}},
  {athlete:{id:'106'},status:'Questionable'},
  {athlete:{id:'107'},status:'Doubtful'}]};
 assert.deepEqual([...currentSoccerUnavailable(report)!].sort(),['104','105','107']);
 assert.equal(currentSoccerUnavailable({}),null);
 assert.equal(currentSoccerUnavailable({injuries:[]})?.size,0);
});
test('starting XI requires exactly 11 starters per team; bench and missing starters excluded',()=>{
 const players=(idStart:number)=>Array.from({length:14},(_,i)=>({
  athlete:{id:String(idStart+i)},starter:i<11}));
 const payload={rosters:[
  {team:{id:'359'},roster:players(100)},
  {team:{id:'350'},roster:players(200)}
 ]};
 const xi=confirmedSoccerStartingXI(payload,'359','350');
 assert.equal(xi?.['359'].size,11);
 assert.equal(xi?.['359'].has('113'),false);
 assert.equal(confirmedSoccerStartingXI({rosters:payload.rosters.slice(0,1)},'359','350'),null);
 assert.equal(confirmedSoccerStartingXI({rosters:[
  {...payload.rosters[0],roster:players(100).slice(0,10)},
  payload.rosters[1]]},'359','350'),null);
});
