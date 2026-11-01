import test from 'node:test';
import assert from 'node:assert/strict';
import {gradeEspnPlayerOriginal,soccerEspnPlayerScorecard} from '../src/soccer/espnPlayerGrade';
import type {EspnFixture,EspnOriginal,EspnPlayerRow} from '../src/soccer/espnAutofeed';
const f:EspnFixture={gameId:'123456',league:'eng.1',
 kickoffUtc:'2026-11-02T16:00:00.000Z',homeId:'1',home:'Home FC',
 awayId:'2',away:'Away FC',completed:true};
const x:EspnOriginal={
 id:'abc',gameId:f.gameId,league:f.league,kickoffUtc:f.kickoffUtc,
 fixtureDate:'2026-11-02',playerId:'17',playerName:'Example Forward',
 teamId:'1',teamName:'Home FC',opponent:'Away FC',
 capturedAtUtc:'2026-11-01T10:00:00.000Z',
 modelVersion:'soccer-player-minutes-shots-v1',
 source:'ESPN_COMPLETED_MATCH_ROSTERS',evidenceGames:8,
 lineupsVerified:false,injuriesVerified:false,
 status:'EARLY_PREGAME_RESEARCH_UNCALIBRATED',
 forecast:{playerId:'17',fixtureDate:'2026-11-02',historyGames:8,
  startsInHistory:7,totalMinutes:610,predictedMinutes:70,
  predictedShots:2.6,predictedShotsOnTarget:1.2,predictedXg:null,
  historicalShotsPer90:3,historicalSotPer90:1.5,
  startProbability:.7,playProbability:.9,pShotsAtLeast3:.43,
  pSotAtLeast1:.6,shotsReachCount:3,sotReachCount:2,
  pReachProjectedShots:.45,pReachProjectedSot:.31,
  baselineShots:2.3,baselineSot:1,lineupState:'UNKNOWN',
  availabilityState:'UNKNOWN',
  status:'RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS'}
};
const observed:EspnPlayerRow={
 league:f.league,kickoffUtc:f.kickoffUtc,
 playerId:x.playerId,playerName:x.playerName,teamId:x.teamId,teamName:x.teamName,
 match:{game_id:f.gameId,game_date:'2026-11-02',team_id:'1',team:'Home FC',
  starter:true,minutes:79,shots:3,shots_on_target:1,xg:null,position:'Forward'}
};
const sha='a'.repeat(64),after='2026-11-03T12:00:00.000Z';
test('grade exactly frozen 2.6 shots mean against actual 3, not an easy target',()=>{
 const g=gradeEspnPlayerOriginal(x,f,[observed],sha,after);
 assert.equal(g.gradingStatus,'PLAYED_VERIFIED');
 assert.equal(g.actualShots,3);assert.equal(g.shotsError,.4);
 assert.equal(g.actualSot,1);assert.equal(g.sotError,.2);
 assert.equal(g.shotsReachedModelMean,true);
 assert.equal(g.sotReachedModelMean,false);
 assert.equal(g.shotsEventBrier,.3025);
 assert.equal(g.sotEventBrier,.0961);
 const summary=soccerEspnPlayerScorecard([g],2);
 assert.equal(summary.originallyFrozen,2);
 assert.equal(summary.verifiedPlayerActuals,1);
 assert.equal(summary.shotsWithinOneRate,1);
});
test('missing actual participation is not invented as 0 and never boosts hit rate',()=>{
 const g=gradeEspnPlayerOriginal(x,f,[],sha,after);
 assert.equal(g.gradingStatus,'PARTICIPATION_UNKNOWN');
 assert.equal(g.actualShots,null);
 const s=soccerEspnPlayerScorecard([g],1);
 assert.equal(s.verifiedPlayerActuals,0);
 assert.equal(s.shotsWithinOneRate,null);
 assert.equal(s.participationUnverified,1);
});
test('no grading a pregame record before final, or a mismatched/postmatch original',()=>{
 assert.throws(()=>gradeEspnPlayerOriginal(x,f,[observed],sha,
   '2026-11-02T17:00:00.000Z'),/NOT_VERIFIABLY_POSTGAME/);
 assert.throws(()=>gradeEspnPlayerOriginal({...x,
   capturedAtUtc:'2026-11-02T15:30:00.000Z'},f,[observed],sha,after),
   /NOT_VERIFIABLY_POSTGAME/);
 assert.throws(()=>gradeEspnPlayerOriginal(x,{...f,gameId:'wrong'},[observed],sha,after),
   /NOT_VERIFIABLY_POSTGAME/);
});
