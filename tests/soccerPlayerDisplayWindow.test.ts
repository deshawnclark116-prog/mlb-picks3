import test from 'node:test';
import assert from 'node:assert/strict';
import {soccerPlayerWindow} from '../src/soccer/playerDisplayWindow';
const at='2026-11-01T14:00:00.000Z';
const p=(name:string,time:string,prob=.6)=>({
 fixtureDate:time.slice(0,10),kickoffUtc:time,playerName:name,
 forecast:{pReachProjectedShots:prob,pReachProjectedSot:.2}
});
const all=[
 p('One hour','2026-11-01T15:00:00.000Z',.40),
 p('Tomorrow','2026-11-02T20:00:00.000Z',.75),
 p('Next week','2026-11-07T20:00:00.000Z',.95),
 p('Started','2026-11-01T13:00:00.000Z',.99),
 p('Same kickoff strong','2026-11-01T15:00:00.000Z',.80)
];
test('default 48h: imminent first, not high-probability week-away match',()=>{
 const view=soccerPlayerWindow(all,at,'48H');
 assert.deepEqual(view.map(x=>x.playerName),
  ['Same kickoff strong','One hour','Tomorrow']);
 assert(view.every(x=>Date.parse(x.kickoffUtc)>Date.parse(at)));
});
test('7-day explicit view shows future games without reviving started ones',()=>{
 const view=soccerPlayerWindow(all,at,'7D');
 assert.deepEqual(view.map(x=>x.playerName),
  ['Same kickoff strong','One hour','Tomorrow','Next week']);
});
test('no synthetic kickoff for date-only pilots in 48h board',()=>{
 const uncertain={fixtureDate:'2026-11-02',playerName:'Unknown time',
  forecast:{pReachProjectedShots:.72,pReachProjectedSot:.2}};
 assert.equal(soccerPlayerWindow([uncertain],at,'48H').length,0);
 assert.equal(soccerPlayerWindow([uncertain],at,'7D').length,1);
});
test('bad dates and cross-day mismatches are excluded',()=>{
 const bad={...p('Incorrect','2026-11-01T16:00:00.000Z'),fixtureDate:'2026-11-09'};
 assert.equal(soccerPlayerWindow([bad],at,'7D').length,0);
 assert.throws(()=>soccerPlayerWindow(all,'not-a-date','48H'),/INVALID_WINDOW/);
});
