/** Immutable soccer first-seen research ledger: fixture-date T-1 forecasts only.
 * Date-only OpenFootball fixtures have no verified kickoff timestamp, so
 * SAME-DAY forecasts are NEVER eligible as independent pregame evidence.
 */
import {createHash} from 'node:crypto';
import type {Forecast,Match,League} from './model';

export const SOCCER_FORWARD_SCHEMA='soccer-forward-original-v1' as const;
export const SOCCER_FINAL_SCHEMA='soccer-forward-final-grade-v1' as const;
type Receipt={league:League;season:string;url:string;sha256:string;matchCount:number};
export type SoccerOriginal={
 schema:typeof SOCCER_FORWARD_SCHEMA;
 id:string;captured_at_utc:string;capture_code_sha:string;
 source_set_sha256:string;fixture_source_sha256:string;
 source_receipts_count:number;model_version:string;
 forecast:Forecast;
 eligibility:'FROZEN_ON_PRIOR_UTC_CALENDAR_DAY_NO_VERIFIED_KICKOFF';
};
export type SoccerGrade={
 schema:typeof SOCCER_FINAL_SCHEMA;
 id:string;original_captured_at_utc:string;fixture_date:string;
 league:League;home:string;away:string;
 final_home_goals:number;final_away_goals:number;
 model_home_goal_error:number;model_away_goal_error:number;
 model_goal_mae:number;baseline_goal_mae:number;
 exact_rounded_goals:number;within_one_goal_count:number;
 model_three_way_brier:number;baseline_three_way_brier:number;
 result_source:string;status:'RESEARCH_NOT_BOOKMAKER_VALIDATED';
};
export const soccerId=(f:Pick<Forecast,'league'|'season'|'date'|'home'|'away'>)=>
 createHash('sha256').update(JSON.stringify([f.league,f.season,f.date,f.home,f.away]))
   .digest('hex').slice(0,32);
const day=(timestamp:string)=>{
 const date=new Date(timestamp);
 if(!Number.isFinite(date.getTime())||date.toISOString()!==timestamp)
   throw Error('SOCCER_FORWARD_INVALID_CAPTURE_TIME');
 return date.toISOString().slice(0,10);
};
const sha=(x:string)=>createHash('sha256').update(x).digest('hex');
const num=(x:unknown)=>typeof x==='number'&&Number.isFinite(x);
export function makeOriginal(f:Forecast,at:string,version:string,codeSha:string,receipts:Receipt[]):SoccerOriginal {
 const asof=day(at);
 if(f.date<=asof)throw Error('SOCCER_FORWARD_NOT_PRIOR_DAY');
 if(!Array.isArray(receipts)||receipts.length!==20||
    receipts.some(x=>!x.sha256||!/^[a-f0-9]{64}$/.test(x.sha256)))
   throw Error('SOCCER_FORWARD_INCOMPLETE_SOURCE_PROVENANCE');
 const source=receipts.find(r=>r.league===f.league&&r.season===f.season);
 if(!source)throw Error('SOCCER_FORWARD_MISSING_FIXTURE_SOURCE_RECEIPT');
 const g=[f.expectedHomeGoals,f.expectedAwayGoals,f.baselineHomeGoals,f.baselineAwayGoals];
 if(g.some(x=>!num(x)||x<=0||x>10))throw Error('SOCCER_FORWARD_INVALID_GOAL_MEANS');
 const p=f.probabilities;
 if([p.home,p.draw,p.away,p.over25,p.btts].some(x=>!num(x)||x<0||x>1)||
    Math.abs(p.home+p.draw+p.away-1)>.0003)
   throw Error('SOCCER_FORWARD_INVALID_PROBABILITIES');
 if(f.status!=='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET')
   throw Error('SOCCER_FORWARD_UNAPPROVED_MODEL_STATUS');
 const ordered=[...receipts].sort((a,b)=>
   (a.league+'|'+a.season).localeCompare(b.league+'|'+b.season));
 return {schema:SOCCER_FORWARD_SCHEMA,id:soccerId(f),captured_at_utc:at,
   capture_code_sha:codeSha,source_set_sha256:sha(JSON.stringify(ordered)),
   fixture_source_sha256:source.sha256,source_receipts_count:receipts.length,
   model_version:version,forecast:{...f},
   eligibility:'FROZEN_ON_PRIOR_UTC_CALENDAR_DAY_NO_VERIFIED_KICKOFF'};
}
export function validateOriginal(o:SoccerOriginal):void {
 if(!o||o.schema!==SOCCER_FORWARD_SCHEMA||o.id!==soccerId(o.forecast)||
   o.forecast.date<=day(o.captured_at_utc)||
   o.eligibility!=='FROZEN_ON_PRIOR_UTC_CALENDAR_DAY_NO_VERIFIED_KICKOFF'||
   !/^[a-f0-9]{64}$/.test(o.source_set_sha256)||
   !/^[a-f0-9]{64}$/.test(o.fixture_source_sha256)||
   o.source_receipts_count!==20||!o.capture_code_sha||
   !o.model_version)
   throw Error('SOCCER_FORWARD_INVALID_ORIGINAL_INTEGRITY');
 const f=o.forecast;
 if([f.expectedHomeGoals,f.expectedAwayGoals,f.baselineHomeGoals,f.baselineAwayGoals].some(
   x=>!num(x)||x<=0||x>10)||
   [f.probabilities.home,f.probabilities.draw,f.probabilities.away].some(
   x=>!num(x)||x<0||x>1)||
   Math.abs(f.probabilities.home+f.probabilities.draw+f.probabilities.away-1)>.0003)
   throw Error('SOCCER_FORWARD_INVALID_ORIGINAL_VALUES');
}
export function gradeOriginal(o:SoccerOriginal,m:Match,at:string):SoccerGrade {
 validateOriginal(o);
 if(m.date>=day(at))throw Error('SOCCER_FORWARD_MATCH_NOT_OLDER_THAN_TODAY');
 const f=o.forecast;
 if(m.league!==f.league||m.season!==f.season||m.date!==f.date||
    m.home!==f.home||m.away!==f.away)
   throw Error('SOCCER_FORWARD_RESULT_IDENTITY_MISMATCH');
 if(!Number.isInteger(m.homeGoals)||!Number.isInteger(m.awayGoals)||
    (m.homeGoals as number)<0||(m.awayGoals as number)<0)
   throw Error('SOCCER_FORWARD_MISSING_VERIFIED_FULL_TIME');
 const home=m.homeGoals as number,away=m.awayGoals as number;
 const expected=[f.expectedHomeGoals,f.expectedAwayGoals];
 const observed=[home,away];
 const baseline=[f.baselineHomeGoals,f.baselineAwayGoals];
 const actual=home>away?'home':home<away?'away':'draw';
 const brier=(p:{home:number;draw:number;away:number})=>
   ['home','draw','away'].reduce((sum,k)=>
     sum+(p[k as 'home'|'draw'|'away']-Number(k===actual))**2,0);
 // Baseline is independent Poisson at its ORIGINAL pregame league means.
 const baselineP=threeWayFromMeans(baseline[0],baseline[1]);
 return {schema:SOCCER_FINAL_SCHEMA,id:o.id,original_captured_at_utc:o.captured_at_utc,
   fixture_date:f.date,league:f.league,home:f.home,away:f.away,
   final_home_goals:home,final_away_goals:away,
   model_home_goal_error:+(expected[0]-home).toFixed(4),
   model_away_goal_error:+(expected[1]-away).toFixed(4),
   model_goal_mae:+((Math.abs(expected[0]-home)+Math.abs(expected[1]-away))/2).toFixed(4),
   baseline_goal_mae:+((Math.abs(baseline[0]-home)+Math.abs(baseline[1]-away))/2).toFixed(4),
   exact_rounded_goals:observed.reduce((n,g,i)=>n+Number(Math.round(expected[i])===g),0),
   within_one_goal_count:observed.reduce((n,g,i)=>n+Number(Math.abs(expected[i]-g)<=1),0),
   model_three_way_brier:+brier(f.probabilities).toFixed(4),
   baseline_three_way_brier:+brier(baselineP).toFixed(4),
   result_source:m.source,status:'RESEARCH_NOT_BOOKMAKER_VALIDATED'};
}
/** Same source-independent Poisson calculation as original model, without recalibration. */
import {poissonProb} from './model';
const threeWayFromMeans=(h:number,a:number)=>poissonProb(h,a);
export function forwardScore(originals:SoccerOriginal[],grades:SoccerGrade[]){
 const known=new Map<string,SoccerOriginal>();
 for(const o of originals){
   validateOriginal(o);
   if(known.has(o.id))throw Error('SOCCER_FORWARD_DUPLICATE_ORIGINAL');
   known.set(o.id,o);
 }
 const graded=new Set<string>();
 const byLeague:Record<string,{games:number;mae:number;baselineMae:number}>={};
 let errors=0,base=0,exact=0,within=0,modelBrier=0,baselineBrier=0;
 for(const g of grades){
   const o=known.get(g.id);
   if(!o||graded.has(g.id)||g.schema!==SOCCER_FINAL_SCHEMA||
      g.original_captured_at_utc!==o.captured_at_utc||
      g.home!==o.forecast.home||g.away!==o.forecast.away||
      g.fixture_date!==o.forecast.date)
     throw Error('SOCCER_FORWARD_GRADE_INTEGRITY');
   graded.add(g.id);errors+=g.model_goal_mae;base+=g.baseline_goal_mae;
   exact+=g.exact_rounded_goals;within+=g.within_one_goal_count;
   modelBrier+=g.model_three_way_brier;baselineBrier+=g.baseline_three_way_brier;
   const line=byLeague[g.league]??={games:0,mae:0,baselineMae:0};
   line.games++;line.mae+=g.model_goal_mae;line.baselineMae+=g.baseline_goal_mae;
 }
 const n=graded.size,avg=(x:number,den:number)=>den?+(x/den).toFixed(4):null;
 return {schema:'soccer-forward-scorecard-v1',
   status:'RESEARCH_FIRSTSEEN_NEEDS_GITHUB_COMMIT_TIME_PROOF',
   originallyFrozen:known.size,graded:n,ungraded:known.size-n,
   gradedTeamScores:n*2,
   modelGoalMAE:avg(errors,n),baselineGoalMAE:avg(base,n),
   exactRoundedGoalRate:avg(exact,2*n),withinOneGoalRate:avg(within,2*n),
   model3wayBrier:avg(modelBrier,n),baseline3wayBrier:avg(baselineBrier,n),
   byLeague:Object.fromEntries(Object.entries(byLeague).map(([league,x])=>
    [league,{n:x.games,modelGoalMAE:avg(x.mae,x.games),baselineGoalMAE:avg(x.baselineMae,x.games)}]))};
}
