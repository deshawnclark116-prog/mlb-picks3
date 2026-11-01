import test from 'node:test';
import assert from 'node:assert/strict';
import {usableEspnPlayerBoard} from '../src/soccer/espnPlayerBoard';
const now='2026-11-01T10:00:00.000Z';
const item={id:'a1',gameId:'401',league:'eng.1',kickoffUtc:'2026-11-01T21:00:00.000Z',
 fixtureDate:'2026-11-01',capturedAtUtc:'2026-11-01T09:00:00.000Z',
 source:'ESPN_COMPLETED_MATCH_ROSTERS',status:'EARLY_PREGAME_RESEARCH_UNCALIBRATED',
 playerId:'123',playerName:'Real Example',teamId:'363',teamName:'Chelsea',opponent:'Arsenal',
 evidenceGames:8,lineupsVerified:false,injuriesVerified:false,
 currentEligibility:'EARLY_ROSTER_ELIGIBLE',
 forecast:{playerId:'123',fixtureDate:'2026-11-01',
  status:'RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS',
  predictedMinutes:72,predictedShots:2.6,predictedShotsOnTarget:1.2,
  shotsReachCount:3,sotReachCount:2,pReachProjectedShots:.45,pReachProjectedSot:.31}};
const snapshot=(items:unknown[])=>({schema:'soccer-espn-rolling-player-board-v1',
 generatedAtUtc:'2026-11-01T09:00:00.000Z',
 liveEligibilityCheckedAtUtc:'2026-11-01T09:50:00.000Z',
 status:'CURRENT_ELIGIBILITY_FILTERED',
 officialPicks:0,items});
test('static real first-seen player board displays projections before same-day kickoff',()=>{
 const r=usableEspnPlayerBoard(snapshot([item]),now);
 assert.equal(r.length,1);assert.equal(r[0].forecast.shotsReachCount,3);
 assert.equal(r[0].forecast.predictedMinutes,72);
});
test('reject future snapshots, already-started games, invented injury clearance',()=>{
 assert.equal(usableEspnPlayerBoard(snapshot([item]),'2026-11-01T08:00:00.000Z').length,0);
 assert.equal(usableEspnPlayerBoard(snapshot([item]),'2026-11-01T21:00:01.000Z').length,0);
 assert.equal(usableEspnPlayerBoard(snapshot([{...item,injuriesVerified:true}]),now).length,0);
 assert.equal(usableEspnPlayerBoard(snapshot([{...item,forecast:{...item.forecast,shotsReachCount:1}}]),now).length,0);
 assert.throws(()=>usableEspnPlayerBoard(snapshot([item,item]),now),/DUPLICATE/);
});

test('raw frozen history and stale eligibility cannot be surfaced as current picks',()=>{
 const raw={...snapshot([item])};
 delete (raw as {liveEligibilityCheckedAtUtc?:string}).liveEligibilityCheckedAtUtc;
 assert.equal(usableEspnPlayerBoard(raw,now).length,0);
 assert.equal(usableEspnPlayerBoard(snapshot([{...item,currentEligibility:undefined}]),now).length,0);
 assert.equal(usableEspnPlayerBoard(snapshot([item]),'2026-11-01T10:10:01.000Z').length,0);
 assert.equal(usableEspnPlayerBoard(snapshot([{...item,
  currentEligibility:'STARTER_CONFIRMED'}]),now).length,1);
});
