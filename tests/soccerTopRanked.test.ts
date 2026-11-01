import test from 'node:test';
import assert from 'node:assert/strict';
import type {Forecast} from '../src/soccer/model';
import {bestSoccerEvent,rankSoccerProjections} from '../src/soccer/topRanked';
function fixture(home:string,away:string,homeP:number,drawP:number,awayP:number,btts:number,over:number):Forecast{
 return {home,away,league:'LaLiga',season:'2026-27',date:'2026-11-04',
  expectedHomeGoals:1.61,expectedAwayGoals:1.34,baselineHomeGoals:1.5,
  baselineAwayGoals:1.3,homeWeightedMatches:30,awayWeightedMatches:30,
  probabilities:{home:homeP,draw:drawP,away:awayP,btts,over25:over},
  mostLikely:'H',source:'research',status:'RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'};
}
test('user screenshot: 59.1% both teams score wins over 56.6% 3+ and 43.9% home win',()=>{
 const f=fixture('Elche CF','Valencia CF',.439,.243,.318,.591,.566);
 const x=bestSoccerEvent(f);
 assert.equal(x.label,'Both teams to score');assert.equal(x.modelProbability,.591);
 assert.equal(x.market,'BOTH_TEAMS_SCORE');
});
test('rank across fixtures by actual original event probabilities, one per match',()=>{
 const a=fixture('Elche CF','Valencia CF',.439,.243,.318,.591,.566);
 const b=fixture('FC Barcelona','Sevilla',.75,.15,.10,.42,.54);
 const c=fixture('Athletic Club','Espanyol',.35,.37,.28,.23,.25);
 const ranked=rankSoccerProjections([
  {id:'a',forecast:a,source:'FROZEN'},
  {id:'b',forecast:b,source:'FROZEN'},
  {id:'c',forecast:c,source:'LIVE'}
 ]);
 assert.deepEqual(ranked.map(x=>x.modelProbability),[.75,.591,.37]);
 assert.deepEqual(ranked.map(x=>x.label),
   ['FC Barcelona to win','Both teams to score','Match ends in a draw']);
 assert.equal(ranked.filter(x=>x.id==='a').length,1);
 assert.deepEqual([a.probabilities.home,a.probabilities.btts,a.probabilities.over25],[.439,.591,.566]);
 assert.throws(()=>rankSoccerProjections([{id:'a',forecast:a,source:'FROZEN'},{id:'b',forecast:a,source:'LIVE'}]),/DUPLICATE/);
});
test('never rank malformed probability distributions or promote other model statuses',()=>{
 const f=fixture('Elche','Valencia',.439,.243,.318,.591,.566);
 assert.throws(()=>bestSoccerEvent({...f,probabilities:{...f.probabilities,btts:1.1}}),/INVALID/);
 assert.throws(()=>bestSoccerEvent({...f,probabilities:{...f.probabilities,home:.7}}),/INVALID/);
});
