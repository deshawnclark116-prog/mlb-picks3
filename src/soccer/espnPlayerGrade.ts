/** Prospective grade for immutable, time-stamped original soccer player means.
 * Only source-verified full-time player records can be actuals. If player
 * participation is absent, DO NOT silently convert that to 0 or a win.
 */
import type {EspnOriginal,EspnFixture,EspnPlayerRow} from './espnAutofeed';
export type EspnPlayerGrade={
 id:string;gameId:string;league:string;playerId:string;
 originalCapturedAtUtc:string;kickoffUtc:string;resultSourceSha256:string;
 gradingStatus:'PLAYED_VERIFIED'|'PARTICIPATION_UNKNOWN';
 actualShots:number|null;actualSot:number|null;actualMinutes:number|null;
 projectedShots:number;projectedSot:number;projectedMinutes:number;
 baselineShots:number;baselineSot:number;
 shotsError:number|null;sotError:number|null;minutesError:number|null;
 baselineShotsError:number|null;baselineSotError:number|null;
 shotsWithinOne:boolean|null;sotWithinOne:boolean|null;
 shotsRoundedExact:boolean|null;sotRoundedExact:boolean|null;
 shotsReachedModelMean:boolean|null;sotReachedModelMean:boolean|null;
 shotsEventBrier:number|null;sotEventBrier:number|null;
};
const round=(n:number)=>Number(n.toFixed(4));
const valid=(s:string)=>Number.isFinite(Date.parse(s));
export function gradeEspnPlayerOriginal(x:EspnOriginal,f:EspnFixture,
  rows:EspnPlayerRow[],sourceSha:string,gradedAtUtc:string):EspnPlayerGrade {
 if(!valid(gradedAtUtc)||!valid(x.kickoffUtc)||
    !/^[a-f0-9]{64}$/.test(sourceSha)||
    !f.completed||x.gameId!==f.gameId||x.league!==f.league||
    x.kickoffUtc!==f.kickoffUtc||
    Date.parse(x.capturedAtUtc)>Date.parse(x.kickoffUtc)-90*60000||
    Date.parse(gradedAtUtc)<Date.parse(f.kickoffUtc)+3*3600000)
  throw Error('SOCCER_ESPN_GRADE_NOT_VERIFIABLY_POSTGAME');
 const p=rows.filter(r=>r.match.game_id===f.gameId&&
   r.playerId===x.playerId&&r.teamId===x.teamId);
 if(p.length>1)throw Error('SOCCER_ESPN_DUPLICATE_ACTUAL_PLAYER');
 const actual=p[0]?.match,proj=x.forecast;
 const base={
   id:x.id,gameId:f.gameId,league:f.league,playerId:x.playerId,
   originalCapturedAtUtc:x.capturedAtUtc,kickoffUtc:x.kickoffUtc,
   resultSourceSha256:sourceSha,
   projectedShots:proj.predictedShots,projectedSot:proj.predictedShotsOnTarget,
   projectedMinutes:proj.predictedMinutes,
   baselineShots:proj.baselineShots,baselineSot:proj.baselineSot
 };
 if(!actual)return {...base,gradingStatus:'PARTICIPATION_UNKNOWN',
    actualShots:null,actualSot:null,actualMinutes:null,
    shotsError:null,sotError:null,minutesError:null,
    baselineShotsError:null,baselineSotError:null,shotsWithinOne:null,
    sotWithinOne:null,shotsRoundedExact:null,sotRoundedExact:null,
    shotsReachedModelMean:null,sotReachedModelMean:null,
    shotsEventBrier:null,sotEventBrier:null};
 const shotEvent=actual.shots>=proj.shotsReachCount;
 const sotEvent=actual.shots_on_target>=proj.sotReachCount;
 return {...base,gradingStatus:'PLAYED_VERIFIED',
  actualShots:actual.shots,actualSot:actual.shots_on_target,
  actualMinutes:actual.minutes,
  shotsError:round(Math.abs(actual.shots-proj.predictedShots)),
  sotError:round(Math.abs(actual.shots_on_target-proj.predictedShotsOnTarget)),
  minutesError:round(Math.abs(actual.minutes-proj.predictedMinutes)),
  baselineShotsError:round(Math.abs(actual.shots-proj.baselineShots)),
  baselineSotError:round(Math.abs(actual.shots_on_target-proj.baselineSot)),
  shotsWithinOne:Math.abs(actual.shots-proj.predictedShots)<=1,
  sotWithinOne:Math.abs(actual.shots_on_target-proj.predictedShotsOnTarget)<=1,
  shotsRoundedExact:Math.round(proj.predictedShots)===actual.shots,
  sotRoundedExact:Math.round(proj.predictedShotsOnTarget)===actual.shots_on_target,
  shotsReachedModelMean:shotEvent,sotReachedModelMean:sotEvent,
  shotsEventBrier:round((proj.pReachProjectedShots-Number(shotEvent))**2),
  sotEventBrier:round((proj.pReachProjectedSot-Number(sotEvent))**2)};
}
export function soccerEspnPlayerScorecard(grades:EspnPlayerGrade[],originals:number){
 if(!Number.isInteger(originals)||originals<grades.length)
   throw Error('SOCCER_ESPN_INVALID_SCORECARD_DENOMINATOR');
 const seen=new Set<string>();
 for(const g of grades){
  if(seen.has(g.id))throw Error('SOCCER_ESPN_GRADE_DUPLICATE');
  seen.add(g.id);
 }
 const verified=grades.filter(g=>g.gradingStatus==='PLAYED_VERIFIED');
 const n=verified.length;
 const avg=(f:(g:EspnPlayerGrade)=>number)=>n?
  round(verified.reduce((s,g)=>s+f(g),0)/n):null;
 const share=(f:(g:EspnPlayerGrade)=>boolean)=>avg(g=>Number(f(g)));
 return {schema:'soccer-espn-player-firstseen-grade-v1',
  originallyFrozen:originals,postmatchAttempted:grades.length,
  verifiedPlayerActuals:n,
  participationUnverified:grades.length-n,
  notYetGraded:originals-grades.length,
  coverageOfEvaluatedResults:grades.length?round(n/grades.length):null,
  shotsMAE:avg(g=>g.shotsError!),baselineShotsMAE:avg(g=>g.baselineShotsError!),
  sotMAE:avg(g=>g.sotError!),baselineSotMAE:avg(g=>g.baselineSotError!),
  minutesMAE:avg(g=>g.minutesError!),
  shotsWithinOneRate:share(g=>g.shotsWithinOne===true),
  sotWithinOneRate:share(g=>g.sotWithinOne===true),
  shotsExactRoundedRate:share(g=>g.shotsRoundedExact===true),
  sotExactRoundedRate:share(g=>g.sotRoundedExact===true),
  shotsReachOriginalMeanRate:share(g=>g.shotsReachedModelMean===true),
  sotReachOriginalMeanRate:share(g=>g.sotReachedModelMean===true),
  uncalibratedShotsReachBrier:avg(g=>g.shotsEventBrier!),
  uncalibratedSotReachBrier:avg(g=>g.sotEventBrier!),
  status:'FORWARD_RESEARCH_NOT_OFFICIAL_BET_NOT_CALIBRATED'};
}
