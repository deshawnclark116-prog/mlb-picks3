import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {readSoccerForwardScorecard} from '../server/soccerForwardStatus';
test('real pregame scorecard does not invent any hit rate while outcomes are pending',()=>{
 const dir=mkdtempSync(join(tmpdir(),'soccer-forward-'));
 try{
   const f=join(dir,'status.json');
   const valid={schema:'soccer-forward-scorecard-v1',status:'RESEARCH',
     originallyFrozen:51,graded:0,ungraded:51,gradedTeamScores:0,
     modelGoalMAE:null,baselineGoalMAE:null,withinOneGoalRate:null,
     exactRoundedGoalRate:null,model3wayBrier:null,baseline3wayBrier:null,
     asofDateUTC:'2026-11-01'};
   writeFileSync(f,JSON.stringify(valid));
   assert.equal(readSoccerForwardScorecard(f).graded,0);
   writeFileSync(f,JSON.stringify({...valid,withinOneGoalRate:0}));
   assert.throws(()=>readSoccerForwardScorecard(f),/CANNOT_CLAIM_ACCURACY/);
   writeFileSync(f,JSON.stringify({...valid,graded:2,ungraded:49,gradedTeamScores:4}));
   assert.throws(()=>readSoccerForwardScorecard(f),/INVALID_GRADED_ACCURACY/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
