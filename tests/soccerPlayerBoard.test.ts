import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSoccerPlayerCohort,soccerPlayerBoardHandler} from '../server/soccerPlayerBoard';
const p={playerId:'123',playerName:'Test Forward',teamId:'382',teamName:'Test FC',opponent:'Opp FC',date:'2026-11-06'};
const result=()=>({data:{} as any,setHeader(){return this;},json(x:any){this.data=x;return this;}});
test('no connected provider gives a truthful empty board and zero upstream calls',async()=>{
 let calls=0;const h=soccerPlayerBoardHandler({cohort:[p],providerConfigured:false,
 allowlist:['123'],researchHandler:async()=>{calls++;}});
 const r=result();await h({} as never,r as never);
 assert.equal(r.data.status,'PLAYER_FEED_NOT_CONNECTED');
 assert.equal(r.data.items.length,0);assert.equal(calls,0);
});
test('admin cohort validates exact fixture identities',()=>{
 assert.equal(parseSoccerPlayerCohort(JSON.stringify([p]))[0].playerName,'Test Forward');
 assert.throws(()=>parseSoccerPlayerCohort(JSON.stringify([p,p])),/DUPLICATE/);
 assert.throws(()=>parseSoccerPlayerCohort(JSON.stringify([{...p,playerId:'../../bad'}])),/INVALID/);
});
test('valid source-backed mean-to-ceil projections appear and cache without reinterpretation',async()=>{
 let calls=0;
 const forecast={playerId:'123',fixtureDate:p.date,predictedMinutes:72,predictedShots:2.6,
 predictedShotsOnTarget:1.2,shotsReachCount:3,sotReachCount:2,pReachProjectedShots:.42,
 pReachProjectedSot:.30,status:'RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS'};
 const h=soccerPlayerBoardHandler({cohort:[p],providerConfigured:true,allowlist:['123'],
 clock:()=>new Date('2026-11-01T12:00:00.000Z'),
 researchHandler:async(_req,res)=>{
  calls++;res.status(200).json({schema:'soccer-player-shadow-v1',status:'UNVALIDATED_RESEARCH',
   playerId:'123',teamId:'382',historySha256:'a'.repeat(64),forecast});
 }});
 const r=result();await h({} as never,r as never);
 assert.equal(r.data.items.length,1);
 assert.equal(r.data.items[0].forecast.shotsReachCount,3);
 assert.equal(r.data.items[0].forecast.pReachProjectedShots,.42);
 assert.equal(r.data.officialPicks,0);
 const again=result();await h({} as never,again as never);
 assert.equal(calls,1);
});
