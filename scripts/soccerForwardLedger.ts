/** Scheduled real-firstseen soccer forward journal, never reconstructs old predictions. */
import {readFileSync,writeFileSync,existsSync,readdirSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {SOURCE_ROOT,SOURCE_2627,parseAltResults,reconcileVerifiedResult,gameResultKey} from '../src/soccer/verifiedIndependentFinals';
import {computeSoccerResearch} from '../server/soccerResearch';
import {parseOpenFootball,LEAGUES,type League,type Match} from '../src/soccer/model';
import {makeOriginal,gradeOriginal,validateOriginal,forwardScore,
 type SoccerOriginal,type SoccerGrade} from '../src/soccer/forwardLedger';

const DIR='docs/soccer_forward';
const originalsDir=join(DIR,'originals'),gradesDir=join(DIR,'grades');
const today=new Date();
const now=today.toISOString(),ymd=now.slice(0,10);
const readJson=<T>(file:string):T=>JSON.parse(readFileSync(file,'utf8')) as T;
const list=(dir:string)=>existsSync(dir)?readdirSync(dir).filter(x=>/^[a-f0-9]{32}\.json$/.test(x)):[];
const matchKey=(m:Match)=>[m.league,m.season,m.date,m.home,m.away].join('|');
function validateGitCreation(file:string,fixtureDate:string){
 // Strict first addition from a git commit, not a later regenerated file.
 const first=execFileSync('git',['log','--follow','--diff-filter=A',
   '--format=%cI','--',file],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 if(first.length!==1||!first[0].startsWith('20')||first[0].slice(0,10)>=fixtureDate)
   throw Error('SOCCER_FORWARD_NOT_PREMATCH_GIT_COMMIT:'+file);
}
async function main(){
 mkdirSync(originalsDir,{recursive:true});
 mkdirSync(gradesDir,{recursive:true});
 const report=await computeSoccerResearch(today);
 if(report.original_source_receipts.length!==20)
   throw Error('SOCCER_FORWARD_MISSING_COMPLETE_SOURCES');
 const receipts=report.original_source_receipts as Parameters<typeof makeOriginal>[4];
 let made=0;
 for(const f of report.forecasts){
   // OpenFootball has DATE ONLY. An same-day forecast cannot establish
   // that kickoff has not happened: freeze only next UTC calendar day onward.
   if(f.date<=ymd)continue;
   const original=makeOriginal(f,now,report.version,
     process.env.GITHUB_SHA||'manual-unverified-code-ref',receipts);
   const file=join(originalsDir,original.id+'.json');
   if(existsSync(file))continue; // immutable original, never re-score or rewrite
   writeFileSync(file,JSON.stringify(original,null,2)+'\n',{flag:'wx'});
   made++;
 }
 const originals=list(originalsDir).map(name=>{
   const file=join(originalsDir,name);
   const o=readJson<SoccerOriginal>(file);
   validateOriginal(o);
   if(name!==o.id+'.json')throw Error('SOCCER_FORWARD_FILENAME_INTEGRITY');
   // Existing originals must be proven added in an earlier pregame commit.
   // Files just created on this invocation will be committed by the workflow.
   if(o.captured_at_utc!==now)
      validateGitCreation(file,o.forecast.date);
   return o;
 });
 const source=report.original_source_receipts.filter(r=>r.season===report.season);
 if(source.length!==5)throw Error('SOCCER_FORWARD_NO_FIVE_LEAGUE_CURRENT_SOURCES');
 const results:Match[]=[];
 for(const r of source){
   const response=await fetch(r.url,{headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('SOCCER_FORWARD_FINAL_SOURCE_FAILED_'+response.status);
   const content=await response.text();
   if(content.length<100||content.length>900000)
     throw Error('SOCCER_FORWARD_FINAL_SOURCE_SIZE');
   results.push(...parseOpenFootball(r.league as League,r.season,JSON.parse(content)));
 }
 const resultsByKey=new Map(results.map(m=>[matchKey(m),m]));
 // The original OpenFootball feed can have older fixtures with no confirmed
 // final score. Fetch a separately maintained FULL-TIME RESULTS source,
 // but match only exact date/league/teams using reviewed bijective aliases.
 const providerAudit:Record<string,{url:string;sha256:string;rows:number;latest:string|null}>={};
 const independent:Match[]=[];
 for(const league of LEAGUES){
   const url=SOURCE_ROOT+'/'+SOURCE_2627[league]+'/results_2627.csv';
   const response=await fetch(url,{headers:{Accept:'text/csv'}});
   if(!response.ok)throw Error('SOCCER_VERIFIED_FINAL_SOURCE_HTTP_'+league+'_'+response.status);
   const raw=await response.text();
   const matches=parseAltResults(league,raw);
   if(matches.length<30)throw Error('SOCCER_VERIFIED_FINAL_TOO_FEW_'+league);
   providerAudit[league]={url,
     sha256:createHash('sha256').update(raw).digest('hex'),
     rows:matches.length,
     latest:matches.map(m=>m.date).sort().at(-1)??null};
   independent.push(...matches);
 }
 const altByKey=new Map<string,Match>();
 for(const m of independent){
   const key=gameResultKey(m);
   if(altByKey.has(key))throw Error('SOCCER_INDEPENDENT_DUPLICATE_SCORE');
   altByKey.set(key,m);
 }
 let independentGraded=0,primaryGraded=0,conflicted=0,unresolved=0;
 let newlyGraded=0;
 for(const o of originals){
   if(o.forecast.date>=ymd)continue; // never same-day grade
   const path=join(gradesDir,o.id+'.json');
   if(existsSync(path))continue;
   const identity={...o.forecast,homeGoals:null,awayGoals:null};
   const primary=resultsByKey.get(matchKey(identity));
   const alt=altByKey.get(gameResultKey(identity));
   const resolution=reconcileVerifiedResult(primary,alt);
   if(!resolution.match){
     if(resolution.reason.includes('CONFLICT'))conflicted++;
     else unresolved++;
     continue;
   }
   // No outcome selected by score, best outcome, or fuzzy team identity.
   const match=resolution.match;
   const grade=gradeOriginal(o,match,now);
   if(resolution.reason==='SOURCE_VERIFIED_INDEPENDENT_FULL_TIME')
     independentGraded++;
   else primaryGraded++;
   writeFileSync(path,JSON.stringify(grade,null,2)+'\n',{flag:'wx'});
   newlyGraded++;
 }
 const grades=list(gradesDir).map(file=>readJson<SoccerGrade>(join(gradesDir,file)));
 const summary=forwardScore(originals,grades);
 const status=JSON.stringify({...summary,asofDateUTC:ymd,
   evidence:'Github earliest original commit BEFORE fixture date; no same-day freeze. Independent result source matches exact names/date/league and records source SHA',
   finalSourceAudit:{providerAudit,independentGraded,primaryGraded,conflicted,unresolved,
      independentRawSourceIsNotOriginalForecastData:true}},null,2)+'\n';
 const statusPath=join(DIR,'status.json');
 if(!existsSync(statusPath)||readFileSync(statusPath,'utf8')!==status)
   writeFileSync(statusPath,status);
 console.log('SOCCER_FORWARD_FIRSTSEEN',JSON.stringify({
   newImmutableOriginals:made,newImmutableGrades:newlyGraded,
   independentGraded,primaryGraded,conflicted,unresolved,
   independentSources:providerAudit,...summary
 }));
}
main().catch(e=>{console.error('SOCCER_FORWARD_FAILED',e);process.exitCode=1});
