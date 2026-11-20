import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  TEAM_TO_RESULTS,SOURCE_2627,parseAltResults,reconcileVerifiedResult,
  csvFields,gameResultKey
} from '../src/soccer/verifiedIndependentFinals';
import type {Match,League} from '../src/soccer/model';

test('all five fixed current-season result aliases are bijective; no fuzzy team guesses',()=>{
 const expected:Record<League,number>={EPL:20,LaLiga:20,SerieA:20,
   Bundesliga:18,Ligue1:18};
 for(const league of Object.keys(expected) as League[]){
   const mapping=TEAM_TO_RESULTS[league];
   assert.equal(Object.keys(mapping).length,expected[league]);
   assert.equal(new Set(Object.values(mapping)).size,expected[league]);
   assert.ok(SOURCE_2627[league].includes('_1_'));
 }
});
test('RFC result CSV handles quoted goals and exact 2026-27 league club aliases',()=>{
 const csv='gw,date,home,away,ft_home,ft_away,ft_result,goal_minutes,source\n'+
    '10,2026-11-08,Arsenal,Coventry,3,2,H,"12,45,91",fixturedl\n'+
    '10,2026-11-08,Nott\'m Forest,Spurs,0,0,D,,fixturedl\n';
 const parsed=parseAltResults('EPL',csv);
 assert.equal(parsed.length,2);
 assert.deepEqual([parsed[0].home,parsed[0].away,
   parsed[0].homeGoals,parsed[0].awayGoals],
   ['Arsenal FC','Coventry City FC',3,2]);
 assert.deepEqual([parsed[1].home,parsed[1].away],
   ['Nottingham Forest FC','Tottenham Hotspur FC']);
 assert.equal(parsed[0].source,'open-matchday/fixturedl/2627/ENG_1_premier-league');
 assert.deepEqual(csvFields('"A,B","x""y",z'),['A,B','x"y','z']);
});
test('unknown team is not guessed and never creates fabricated outcome',()=>{
 const csv='date,home,away,ft_home,ft_away,source\n'+
   '2026-11-08,Coventry,Unknown City,9,0,fixturedl\n'+
   '2026-11-08,Arsenal,Coventry,1,2,fixturedl\n';
 const rows=parseAltResults('EPL',csv);
 assert.equal(rows.length,1);
 assert.equal(rows[0].homeGoals,1);
 assert.throws(()=>parseAltResults('EPL',csv+
   '2026-11-08,Arsenal,Coventry,8,3,fixturedl\n'),/DUPLICATE/);
});
test('stale original ft may use VERIFIED independent source, conflicts quarantine',()=>{
 const prior:Match={league:'EPL',season:'2026-27',date:'2026-11-08',
   home:'Arsenal FC',away:'Coventry City FC',homeGoals:null,awayGoals:null,
   source:'openfootball/original'};
 const alt={...prior,homeGoals:2,awayGoals:1,source:'independent'};
 assert.equal(reconcileVerifiedResult(prior,alt).reason,
   'SOURCE_VERIFIED_INDEPENDENT_FULL_TIME');
 assert.equal(reconcileVerifiedResult(prior,alt).match?.homeGoals,2);
 assert.equal(reconcileVerifiedResult({...prior,homeGoals:3,awayGoals:1},
    alt).reason,'INDEPENDENT_FINAL_SCORE_CONFLICT');
 assert.equal(reconcileVerifiedResult({...prior,away:'Liverpool FC'},
    alt).reason,'INDEPENDENT_IDENTITY_CONFLICT');
 assert.equal(reconcileVerifiedResult(prior,undefined).match,null);
 assert.equal(gameResultKey(alt),gameResultKey(prior));
});
