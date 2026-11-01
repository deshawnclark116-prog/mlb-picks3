/** Scheduled real-firstseen soccer forward journal, never reconstructs old predictions. */
import {readFileSync,writeFileSync,existsSync,readdirSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
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
 let newlyGraded=0;
 for(const o of originals){
   if(o.forecast.date>=ymd)continue; // never same-day grade
   const path=join(gradesDir,o.id+'.json');
   if(existsSync(path))continue;
   const match=resultsByKey.get(matchKey({
     ...o.forecast,homeGoals:null,awayGoals:null
   }));
   if(!match||match.homeGoals===null||match.awayGoals===null)continue;
   // No outcome match through fuzzy team identity or changed kickoff/date.
   const grade=gradeOriginal(o,match,now);
   writeFileSync(path,JSON.stringify(grade,null,2)+'\n',{flag:'wx'});
   newlyGraded++;
 }
 const grades=list(gradesDir).map(file=>readJson<SoccerGrade>(join(gradesDir,file)));
 const summary=forwardScore(originals,grades);
 const status=JSON.stringify({...summary,asofDateUTC:ymd,
   evidence:'Github earliest commit before fixture date; no same-day freeze'},null,2)+'\n';
 const statusPath=join(DIR,'status.json');
 if(!existsSync(statusPath)||readFileSync(statusPath,'utf8')!==status)
   writeFileSync(statusPath,status);
 console.log('SOCCER_FORWARD_FIRSTSEEN',JSON.stringify({
   newImmutableOriginals:made,newImmutableGrades:newlyGraded,...summary
 }));
}
main().catch(e=>{console.error('SOCCER_FORWARD_FAILED',e);process.exitCode=1});
