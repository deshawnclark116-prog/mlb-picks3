/** Read-only, strictly validated real soccer first-seen accuracy summary. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {Request,Response} from 'express';
export type SoccerForwardStatus={
 schema:'soccer-forward-scorecard-v1';status:string;
 originallyFrozen:number;graded:number;ungraded:number;gradedTeamScores:number;
 modelGoalMAE:number|null;baselineGoalMAE:number|null;
 exactRoundedGoalRate:number|null;withinOneGoalRate:number|null;
 model3wayBrier:number|null;baseline3wayBrier:number|null;asofDateUTC:string;
};
export function readSoccerForwardScorecard(file=resolve(process.cwd(),'docs/soccer_forward/status.json')):SoccerForwardStatus {
 const data=JSON.parse(readFileSync(file,'utf8')) as SoccerForwardStatus;
 if(!data||data.schema!=='soccer-forward-scorecard-v1'||
    !Number.isInteger(data.originallyFrozen)||data.originallyFrozen<0||
    !Number.isInteger(data.graded)||data.graded<0||
    data.graded>data.originallyFrozen||
    data.ungraded!==data.originallyFrozen-data.graded||
    data.gradedTeamScores!==2*data.graded||
    !/^20\d\d-\d\d-\d\d$/.test(data.asofDateUTC))
   throw Error('SOCCER_FORWARD_STATUS_INTEGRITY');
 if(data.graded===0){
   if(data.modelGoalMAE!==null||data.withinOneGoalRate!==null||
      data.exactRoundedGoalRate!==null)
      throw Error('SOCCER_FORWARD_MISSING_GRADES_CANNOT_CLAIM_ACCURACY');
 }else if([data.modelGoalMAE,data.baselineGoalMAE,data.withinOneGoalRate,
   data.exactRoundedGoalRate,data.model3wayBrier,data.baseline3wayBrier].some(
     x=>typeof x!=='number'||!Number.isFinite(x)))
   throw Error('SOCCER_FORWARD_INVALID_GRADED_ACCURACY');
 return data;
}
export function soccerForwardStatusHandler(){
 return (_req:Request,res:Response)=>{
   res.setHeader('Cache-Control','no-store');
   try{res.json(readSoccerForwardScorecard());}
   catch{res.status(503).json({
     status:'SOCCER_FORWARD_STATUS_UNAVAILABLE',
     explanation:'No verified first-seen grades; never replace with retrospective forecasts.'
   });}
 };
}
