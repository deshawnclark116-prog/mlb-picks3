/** 75+ discovered competitions: publish coverage and original research,
 * preserve immutable pre-match source versions, then grade exact real finals.
 * Runs under GitHub Actions on the actual main branch, no production odds.
 */
import {readFileSync,writeFileSync,readdirSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {computeWideResearch,type WideBoard} from '../src/soccer/wideResearch';
import {wideMatchKey} from '../src/soccer/wideSource';
import {poissonProb,type Forecast,type Match} from '../src/soccer/model';

const DIR='docs/soccer_wide';
const odir=join(DIR,'originals'),gdir=join(DIR,'grades');
const now=new Date(),at=now.toISOString(),day=at.slice(0,10);
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const readJson=<T>(p:string):T=>JSON.parse(readFileSync(p,'utf8')) as T;
const ensure=()=>{for(const p of [DIR,odir,gdir])mkdirSync(p,{recursive:true});};
const idFor=(f:Forecast)=>sha(JSON.stringify([
 f.league,f.season,f.date,f.home,f.away])).slice(0,32);
type Original={
 schema:'soccer-wide-original-v1';id:string;
 captured_at_utc:string;catalog_generated_at_utc:string;
 original_code_sha:string;source_results_sha256:string;
 source_fixtures_sha256:string;model_version:'soccer-wide-prior-result-poisson-v1';
 forecast:Forecast;
};
type Grade={
 schema:'soccer-wide-final-v1';id:string;
 original_captured_at_utc:string;league:string;date:string;
 match_result_source:string;final_home_goals:number;final_away_goals:number;
 model_goal_mae:number;baseline_goal_mae:number;
 model_three_way_brier:number;baseline_three_way_brier:number;
};
const num=(x:unknown)=>typeof x==='number'&&Number.isFinite(x);
function validateOriginal(o:Original){
 const f=o.forecast;
 if(o.schema!=='soccer-wide-original-v1'||o.id!==idFor(f)||
   !Number.isFinite(Date.parse(o.captured_at_utc))||
   f.date<=o.captured_at_utc.slice(0,10)||
   !/^[a-f0-9]{64}$/.test(o.source_results_sha256)||
   !/^[a-f0-9]{64}$/.test(o.source_fixtures_sha256)||
   !o.original_code_sha||
   o.model_version!=='soccer-wide-prior-result-poisson-v1'||
   f.status!=='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'||
   !num(f.expectedHomeGoals)||!num(f.expectedAwayGoals)||
   f.expectedHomeGoals<=0||f.expectedAwayGoals<=0||
   !num(f.probabilities.home)||!num(f.probabilities.draw)||
   !num(f.probabilities.away)||
   Math.abs(f.probabilities.home+f.probabilities.draw+f.probabilities.away-1)>.0003)
   throw Error('SOCCER_WIDE_ORIGINAL_INTEGRITY_FAILED_'+o.id);
}
function proveFirstGitAddition(path:string,fixtureDate:string){
 const times=execFileSync('git',['log','--follow','--diff-filter=A',
   '--format=%cI','--',path],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 if(times.length!==1||times[0].slice(0,10)>=fixtureDate)
   throw Error('SOCCER_WIDE_FIRST_COMMIT_NOT_BEFORE_FIXTURE_'+path);
}
function gradeOne(o:Original,m:Match):Grade{
 validateOriginal(o);
 const f=o.forecast;
 if(m.date>=day||wideMatchKey(m)!==wideMatchKey(f)||
   m.season!==f.season||!Number.isInteger(m.homeGoals)||
   !Number.isInteger(m.awayGoals))
   throw Error('SOCCER_WIDE_FINAL_OR_IDENTITY_INVALID');
 const h=m.homeGoals!,a=m.awayGoals!;
 const outcome=h>a?'home':h<a?'away':'draw';
 const error=(x:number,y:number)=>Math.abs(x-y);
 const brier=(p:{home:number;draw:number;away:number})=>
   ['home','draw','away'].reduce((n,k)=>
    n+(p[k as keyof typeof p]-Number(k===outcome))**2,0);
 return {schema:'soccer-wide-final-v1',id:o.id,
   original_captured_at_utc:o.captured_at_utc,league:f.league,
   date:f.date,match_result_source:m.source,
   final_home_goals:h,final_away_goals:a,
   model_goal_mae:(error(f.expectedHomeGoals,h)+error(f.expectedAwayGoals,a))/2,
   baseline_goal_mae:(error(f.baselineHomeGoals,h)+error(f.baselineAwayGoals,a))/2,
   model_three_way_brier:brier(f.probabilities),
   baseline_three_way_brier:brier(poissonProb(f.baselineHomeGoals,f.baselineAwayGoals))};
}
function score(originals:Original[],grades:Grade[],board:WideBoard){
 const origIds=new Set(originals.map(o=>o.id));
 const seen=new Set<string>();
 const byLeague:Record<string,{n:number;modelGoalMAE:number;baselineGoalMAE:number;
     model3wayBrier:number;baseline3wayBrier:number}>={};
 let goal=0,bgoal=0,brier=0,bbrier=0;
 for(const g of grades){
   if(g.schema!=='soccer-wide-final-v1'||!origIds.has(g.id)||seen.has(g.id))
     throw Error('SOCCER_WIDE_GRADE_NOT_FROZEN_OR_DUPLICATE');
   seen.add(g.id);
   const r=byLeague[g.league]??={
    n:0,modelGoalMAE:0,baselineGoalMAE:0,
    model3wayBrier:0,baseline3wayBrier:0};
   r.n++;r.modelGoalMAE+=g.model_goal_mae;r.baselineGoalMAE+=g.baseline_goal_mae;
   r.model3wayBrier+=g.model_three_way_brier;
   r.baseline3wayBrier+=g.baseline_three_way_brier;
   goal+=g.model_goal_mae;bgoal+=g.baseline_goal_mae;
   brier+=g.model_three_way_brier;bbrier+=g.baseline_three_way_brier;
 }
 const n=grades.length;
 const avg=(x:number,m:number)=>m?+(x/m).toFixed(5):null;
 return {schema:'soccer-wide-firstseen-score-v1',asofDateUTC:day,
  listedCompetitions:board.competition_count,
  sourceVerifiedCompetitions:board.source_receipts.length,
  upcomingFixtures:board.fixture_count,
  upcomingQuantitativeForecasts:board.forecast_count,
  originallyFrozen:originals.length,graded:n,ungraded:originals.length-n,
  modelGoalMAE:avg(goal,n),baselineGoalMAE:avg(bgoal,n),
  model3wayBrier:avg(brier,n),baseline3wayBrier:avg(bbrier,n),
  byLeague:Object.fromEntries(Object.entries(byLeague).map(([k,v])=>[k,{
    n:v.n,modelGoalMAE:avg(v.modelGoalMAE,v.n),
    baselineGoalMAE:avg(v.baselineGoalMAE,v.n),
    model3wayBrier:avg(v.model3wayBrier,v.n),
    baseline3wayBrier:avg(v.baseline3wayBrier,v.n)
  }])),
  no_market_or_profitability_promotion:true,
  errorsAndCoverage:board.competitions.filter(l=>l.status!=='FORECAST_ELIGIBLE')
    .map(l=>({league:l.id,status:l.status,reason:l.reason,
      pastResults:l.pastResults,upcomingFixtures:l.futureFixtures}))};
}
async function main(){
 ensure();
 const {board,verifiedFinals}=await computeWideResearch(now);
 const knownResults=new Map<string,Match>();
 for(const r of verifiedFinals){
   const key=wideMatchKey(r);
   if(knownResults.has(key))throw Error('SOCCER_WIDE_DUPLICATE_SOURCE_RESULT');
   knownResults.set(key,r);
 }
 const receipts=new Map(board.source_receipts.map(r=>[r.competition,r]));
 let newOriginals=0,gradedNow=0,pending=0;
 for(const f of board.forecasts){
   const rec=receipts.get(f.league);
   if(!rec)throw Error('SOCCER_WIDE_NO_RESULT_OR_FIXTURE_SOURCE_RECEIPT');
   const id=idFor(f),file=join(odir,id+'.json');
   if(existsSync(file))continue; // immutable first pre-match snapshot
   const o:Original={schema:'soccer-wide-original-v1',id,
     captured_at_utc:at,catalog_generated_at_utc:board.catalog_generated_at_utc,
     original_code_sha:process.env.GITHUB_SHA||'unverified-manual-run',
     source_results_sha256:rec.resultsSha256,
     source_fixtures_sha256:rec.fixturesSha256,
     model_version:'soccer-wide-prior-result-poisson-v1',forecast:f};
   validateOriginal(o);
   writeFileSync(file,JSON.stringify(o,null,2)+'\n',{flag:'wx'});
   newOriginals++;
 }
 const originals=readdirSync(odir).filter(f=>/^[0-9a-f]{32}\.json$/.test(f))
  .map(f=>({name:f,original:readJson<Original>(join(odir,f))}));
 for(const {name,original:o} of originals){
   validateOriginal(o);
   if(o.id+'.json'!==name)throw Error('SOCCER_WIDE_MISMATCHED_ORIGINAL_FILENAME');
   if(o.forecast.date>=day)continue;
   const originalPath=join(odir,name),gradePath=join(gdir,name);
   // Originals created in this run cannot have a past fixture date.
   proveFirstGitAddition(originalPath,o.forecast.date);
   if(existsSync(gradePath))continue;
   const verified=knownResults.get(wideMatchKey(o.forecast));
   if(!verified){pending++;continue;}
   const g=gradeOne(o,verified);
   writeFileSync(gradePath,JSON.stringify(g,null,2)+'\n',{flag:'wx'});
   gradedNow++;
 }
 const grades=readdirSync(gdir).filter(f=>/^[0-9a-f]{32}\.json$/.test(f))
  .map(f=>readJson<Grade>(join(gdir,f)));
 const status=score(originals.map(x=>x.original),grades,board);
 const writeUpdated=(p:string,value:unknown)=>{
   const raw=JSON.stringify(value,null,2)+'\n';
   if(!existsSync(p)||readFileSync(p,'utf8')!==raw)writeFileSync(p,raw);
 };
 writeUpdated(join(DIR,'board.json'),board);
 writeUpdated(join(DIR,'status.json'),status);
 console.log('SOCCER_WIDE_REAL_SOURCE_FIRSTSEEN',JSON.stringify({
  competitions:board.competition_count,
  sourceVerifiedCompetitions:board.source_receipts.length,
  upcomingFixtures:board.fixture_count,
  upcomingForecasts:board.forecast_count,
  skippedCompetitions:board.competitions.filter(c=>c.status==='SOURCE_UNAVAILABLE')
    .map(c=>({id:c.id,reason:c.reason})),
  newOriginals,gradedNow,pending,...status
 }));
}
main().catch(e=>{console.error('SOCCER_WIDE_FEED_FAILURE',e);process.exitCode=1});
