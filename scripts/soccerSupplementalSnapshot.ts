/** Fetch supplemental fixture-only data once a day, with a strict
 * provider-quota breaker. This is NOT sports betting odds or a fitted model.
 * A public guest API gives a partial list (often ONE next match/league).
 */
import {writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {SUPPLEMENTAL_SOCCER_SCHEMA,SUPPLEMENTAL_SOCCER_LEAGUES,
 readSupplementalNextEvent,validateSupplementalSnapshot,
 type SupplementalStatus,type SupplementalMatch,type SupplementalSnapshot
} from '../src/soccer/supplementalSource';
const now=new Date(), at=now.toISOString();
const output='docs/soccer_wide/supplemental_fixtures.json';
const byId=new Set<string>(SUPPLEMENTAL_SOCCER_LEAGUES.map(c=>c.league));
const statuses:SupplementalStatus[]=[];
const fixtures:SupplementalMatch[]=[];
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const isHttpError=(e:unknown)=>e instanceof Error?e.message:String(e);
async function getOne(id:string){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),12000);
 const url='https://www.thesportsdb.com/api/v1/json/123/eventsnextleague.php?id='+id;
 try{
  const r=await fetch(url,{signal:controller.signal,headers:{
   'Accept':'application/json','User-Agent':'PropEdge-Soccer-Source-Probe/1.0'}});
  if(r.status===429)throw Error('RATE_LIMITED_429');
  if(!r.ok)throw Error('SOURCE_HTTP_'+r.status);
  const raw=await r.text();
  if(raw.length<5||raw.length>800000)throw Error('SOURCE_INVALID_BYTES');
  return JSON.parse(raw);
 }finally{clearTimeout(timer);}
}
async function main(){
 let locked=false;
 for(const c of SUPPLEMENTAL_SOCCER_LEAGUES){
  if(locked){
   statuses.push({league:c.league,name:c.name,providerLeagueId:c.providerLeagueId,
     status:'RATE_LIMITED',count:0,
     error:'NOT_QUERIED_AFTER_429_CIRCUIT_BREAKER'});
   continue;
  }
  await sleep(650);
  try{
   const raw=await getOne(c.providerLeagueId);
   const parsed=readSupplementalNextEvent(raw,c,at);
   // Never score a past or live game as a future recommendation.
   const upcoming=parsed.filter(f=>Date.parse(f.kickoffUtc)>now.getTime()&&
      Date.parse(f.kickoffUtc)<=now.getTime()+14*86400000);
   fixtures.push(...upcoming);
   statuses.push({league:c.league,name:c.name,
     providerLeagueId:c.providerLeagueId,
     status:upcoming.length?'OK_NEXT_FIXTURE':'NO_NEXT_FIXTURE',count:upcoming.length});
  }catch(e){
   const message=isHttpError(e);
   locked=message.includes('RATE_LIMITED_429');
   statuses.push({league:c.league,name:c.name,
     providerLeagueId:c.providerLeagueId,
     status:locked?'RATE_LIMITED':'SOURCE_UNAVAILABLE',count:0,
     error:message.slice(0,120)});
  }
 }
 const snap:SupplementalSnapshot={
  schema:SUPPLEMENTAL_SOCCER_SCHEMA,generated_at_utc:at,
  coverage:'FIVE_EXPLICIT_MISSING_LEAGUES_PARTIAL_NEXT_EVENT_ONLY',
  competitions:statuses,fixtures,
  guardrails:{official_bets:0,calibrated:false,
    historical_model_ready:false,
    exact_kickoff_independently_confirmed:false,
    all_league_fixtures_claimed:false}
 };
 validateSupplementalSnapshot(snap);
 if(new Set(fixtures.map(f=>f.id)).size!==fixtures.length)
  throw Error('DUPLICATE_SUPPLEMENTAL_UPCOMING_EVENT');
 if(statuses.some(s=>!byId.has(s.league))||
    statuses.length!==SUPPLEMENTAL_SOCCER_LEAGUES.length)
  throw Error('SUPPLEMENTAL_CATALOG_CHANGED_DURING_FETCH');
 mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,JSON.stringify(snap,null,2)+'\n');
 console.log('SOCCER_SUPPLEMENTAL_FIXTURE_SOURCE_AUDIT',JSON.stringify({
  time:at,configuredLeagues:statuses.length,upcoming:fixtures.length,
  status:statuses,firstFixtures:fixtures.slice(0,5),
  officialPredictions:0,coverageComplete:false,
  rateLimitCircuitBreaker:locked
 }));
 // Do not report a successful refresh when the public free feed is unavailable.
 // Existing compact snapshot remains in the main branch on workflow failure.
 const worked=statuses.filter(s=>s.status==='OK_NEXT_FIXTURE'||
   s.status==='NO_NEXT_FIXTURE').length;
 if(worked<3)throw Error('SUPPLEMENTAL_PROVIDER_NOT_RELIABLE_ENOUGH_'+worked);
}
main().catch(e=>{
 console.error('SOCCER_SUPPLEMENTAL_FAIL_CLOSED',
  e instanceof Error?e.message:String(e));
 process.exitCode=1;
});
