import test from 'node:test';
import assert from 'node:assert/strict';
import {groupSoccerGameProjections,soccerTeamKey,
 type GameMatch,type GamePlayer} from '../src/soccer/gameBoard';
const at='2026-11-01T14:00:00.000Z';
const f:GameMatch={id:'match1',origin:'FROZEN',forecast:{
 league:'EPL',season:'2026-27',date:'2026-11-02',home:'Chelsea FC',away:'Liverpool FC',
 expectedHomeGoals:1.6,expectedAwayGoals:1.4,
 probabilities:{home:.45,draw:.25,away:.30,btts:.66,over25:.59},
 baselineHomeGoals:1.4,baselineAwayGoals:1.1,mostLikely:'H',
 homeWeightedMatches:20,awayWeightedMatches:20,source:'openfootball',
 status:'RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'
}};
const p=(id:string,team='Chelsea',opponent='Liverpool',gameId='401'):GamePlayer=>({
 id:'fc'+id,playerId:id,playerName:'Player '+id,teamName:team,opponent,
 fixtureDate:'2026-11-02',kickoffUtc:'2026-11-02T18:00:00.000Z',
 league:'eng.1',gameId,source:'ESPN_COMPLETED_MATCH_ROSTERS',
 forecast:{predictedShots:2.6,predictedShotsOnTarget:1.2,predictedMinutes:72,
  shotsReachCount:3,sotReachCount:2,pReachProjectedShots:.46,
  pReachProjectedSot:.3,lineupState:'UNKNOWN',
  status:'RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS'}
});
test('one game contains ALL player props and all 5 source model outcomes; no cap or cherry pick',()=>{
 const players=Array.from({length:28},(_,i)=>p(String(i+1),
  i%2?'Liverpool':'Chelsea',i%2?'Chelsea':'Liverpool'));
 const groups=groupSoccerGameProjections([f],players,at);
 assert.equal(groups.length,1);
 assert.equal(groups[0].match?.id,'match1');
 assert.equal(groups[0].players.length,28);
 assert.equal(groups[0].kickoffUtc,'2026-11-02T18:00:00.000Z');
 assert.equal(groups[0].home,'Chelsea FC');
 assert.equal(groups[0].match?.forecast.probabilities.btts,.66);
});
test('never attach to a different opponent, league or calendar day',()=>{
 const g=groupSoccerGameProjections([f],[p('1','Chelsea','Arsenal','other')],at);
 assert.equal(g.length,2);
 assert.equal(g.find(x=>x.players.length===1)?.match,null);
 assert.equal(g.find(x=>x.match!==null)?.players.length,0);
 const differentLeague=groupSoccerGameProjections([f],[{...p('2'),league:'esp.1'}],at);
 assert.equal(differentLeague.length,2);
 const differentDate=groupSoccerGameProjections([f],[{...p('3'),fixtureDate:'2026-11-03',
   kickoffUtc:'2026-11-03T18:00:00.000Z'}],at);
 assert.equal(differentDate.length,2);
});
test('same verified ESPN ID cannot silently contain two conflicting team sets',()=>{
 assert.throws(()=>groupSoccerGameProjections([],[p('1'),p('2','Arsenal','Everton')],at),
 /CONFLICTING_FIXTURE/);
 assert.throws(()=>groupSoccerGameProjections([],[p('1'),p('1')],at),/DUPLICATE_PLAYER/);
});
test('FC/CF suffix differences normalize, but unrelated clubs never join',()=>{
 assert.equal(soccerTeamKey('Chelsea FC'),soccerTeamKey('Chelsea'));
 assert.equal(soccerTeamKey('Valencia CF'),soccerTeamKey('Valencia'));
 assert.notEqual(soccerTeamKey('Real Madrid CF'),soccerTeamKey('Atlético de Madrid'));
});
test('expired games or bad kickoff timestamps cannot sneak in through player data',()=>{
 assert.equal(groupSoccerGameProjections([],[{...p('1'),
  kickoffUtc:'2026-11-01T12:00:00.000Z'}],at).length,0);
 assert.equal(groupSoccerGameProjections([],[{...p('1'),
  kickoffUtc:'not a time'}],at).length,0);
});
