/** Pure source-integrity diagnostic; NO original publication or grading. */
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {parseOpenFootball,LEAGUES,type League,type Match} from '../src/soccer/model';
import {
  SOURCE_ROOT,SOURCE_2627,parseAltResults,gameResultKey,reconcileVerifiedResult
} from '../src/soccer/verifiedIndependentFinals';
import type {SoccerOriginal} from '../src/soccer/forwardLedger';

const today=new Date().toISOString().slice(0,10);
async function main(){
 const main=new Map<string,Match>(),other=new Map<string,Match>();
 const byLeague:Record<string,Record<string,number>>={};
 for(const league of Object.keys(LEAGUES) as League[]){
   const primaryUrl='https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/'+LEAGUES[league].path;
   const secondaryUrl=SOURCE_ROOT+'/'+SOURCE_2627[league]+'/results_2627.csv';
   const [p,s]=await Promise.all([fetch(primaryUrl),fetch(secondaryUrl)]);
   if(!p.ok||!s.ok)throw Error('SOCCER_SOURCE_FETCH_FAILED_'+league);
   const orig=parseOpenFootball(league,'2026-27',await p.json());
   const alt=parseAltResults(league,await s.text());
   byLeague[league]={originalMatches:orig.length,independentFinalRows:alt.length,
                     exactHistoricalMatches:0,scoreConflicts:0};
   for(const m of orig){
     const key=gameResultKey(m);
     if(main.has(key))throw Error('DUPLICATE_SOURCE_IDENTITY_'+league);
     main.set(key,m);
   }
   for(const m of alt){
     const key=gameResultKey(m);
     if(other.has(key))throw Error('DUPLICATE_INDEPENDENT_IDENTITY_'+league);
     other.set(key,m);
     if(main.has(key)){
       byLeague[league].exactHistoricalMatches++;
       if(reconcileVerifiedResult(main.get(key),m).reason===
           'INDEPENDENT_FINAL_SCORE_CONFLICT')
         byLeague[league].scoreConflicts++;
     }
   }
 }
 const originalsDir='docs/soccer_forward/originals';
 let frozen=0,playedDates=0,nowIndependentVerifiable=0,conflicts=0;
 for(const file of readdirSync(originalsDir).filter(x=>x.endsWith('.json'))){
   const o=JSON.parse(readFileSync(join(originalsDir,file),'utf8')) as SoccerOriginal;
   frozen++;
   if(o.forecast.date>=today)continue;
   playedDates++;
   const k=gameResultKey(o.forecast);
   const res=reconcileVerifiedResult(main.get(k),other.get(k));
   if(res.match)nowIndependentVerifiable++;
   if(res.reason.includes('CONFLICT'))conflicts++;
 }
 const coverage=Object.values(byLeague).reduce(
   (n,x)=>n+x.exactHistoricalMatches,0);
 if(coverage<70)throw Error('SOCCER_INDEPENDENT_IDENTITY_COVERAGE_LOW_'+coverage);
 console.log('SOCCER_INDEPENDENT_VERIFIED_FINAL_AUDIT',JSON.stringify({
   today,byLeague,frozen,playedDates,nowIndependentVerifiable,conflicts,
   no_forecasts_updated:true,originals_not_modified:true,
   not_a_model_promotional_score:true
 }));
}
main().catch(e=>{console.error('SOCCER_INDEPENDENT_AUDIT_FAILED',e);process.exitCode=1});
