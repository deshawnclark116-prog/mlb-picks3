/** Fetch supplemental fixture-only data once a day, with a strict
 * provider-quota breaker. This is NOT sports betting odds or a fitted model.
 * A public guest API gives a partial list (often ONE next match/league).
 */
import {writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {SUPPLEMENTAL_SOCCER_SCHEMA,SUPPLEMENTAL_SOCCER_LEAGUES,
 readSupplementalNextEvent,readSupplementalESPNFixtures,
 validateSupplementalSnapshot,
 type SupplementalStatus,type SupplementalMatch,type SupplementalSnapshot
} from '../src/soccer/supplementalSource';
const now=new Date(), at=now.toISOString();
const output='docs/soccer_wide/supplemental_fixtures.json';
const byId=new Set<string>(SUPPLEMENTAL_SOCCER_LEAGUES.map(c=>c.league));
const statuses:SupplementalStatus[]=[];
const fixtures:SupplementalMatch[]=[];
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const isHttpError=(e:unknown)=>e instanceof Error?e.message:String(e);
const ESPN_FALLBACK:Record<string,'col.1'|'crc.1'>={
 'COL_1_primera-a':'col.1','CRI_1_primera':'crc.1'
};
async function getESPN(l:
 'COL_1_primera-a'|'CRI_1_primera',slug:string){
 const out:SupplementalMatch[]=[];
 const d0=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
 const seen=new Set<string>();
 for(let n=0;n<3;n++){
  const day=new Date(d0+n*86400000).toISOString().slice(0,10).replace(/-/g,'');
  const url='https://site.api.espn.com/apis/site/v2/sports/soccer/'
   +slug+'/scoreboard?dates='+day;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
   const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
   if(!r.ok)throw Error('ESPN_HTTP_'+r.status);
   const raw=await r.text();
   if(raw.length<10||raw.length>1000000)throw Error('ESPN_SOURCE_SIZE');
   const rows=readSupplementalESPNFixtures(JSON.parse(raw),l,at);
   for(const f of rows){
    if(Date.parse(f.kickoffUtc)<=now.getTime()||
       Date.parse(f.kickoffUtc)>now.getTime()+14*86400000)continue;
    if(seen.has(f.id))continue;
    seen.add(f.id);out.push(f);
   }
  }finally{clearTimeout(timer);}
 }
 return out;
}

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
  const slug=ESPN_FALLBACK[c.league];
  if(!locked){
   await sleep(650);
   try{
    const raw=await getOne(c.providerLeagueId);
    const parsed=readSupplementalNextEvent(raw,c,at);
    const upcoming=parsed.filter(f=>Date.parse(f.kickoffUtc)>now.getTime()&&
      Date.parse(f.kickoffUtc)<=now.getTime()+14*86400000);
    fixtures.push(...upcoming);
    statuses.push({league:c.league,name:c.name,
      providerLeagueId:c.providerLeagueId,
      status:upcoming.length?'OK_NEXT_FIXTURE':'NO_NEXT_FIXTURE',
      count:upcoming.length});
    continue;
   }catch(e){
    const message=isHttpError(e);
    locked=message.includes('RATE_LIMITED_429');
    if(!slug){
     statuses.push({league:c.league,name:c.name,
       providerLeagueId:c.providerLeagueId,
       status:locked?'RATE_LIMITED':'SOURCE_UNAVAILABLE',
       count:0,error:message.slice(0,120)});
     continue;
    }
   }
  }
  if(slug){
   try{
    const rows=await getESPN(c.league as
       'COL_1_primera-a'|'CRI_1_primera',slug);
    fixtures.push(...rows);
    statuses.push({league:c.league,name:c.name,
      providerLeagueId:c.providerLeagueId,
      status:rows.length?'OK_NEXT_FIXTURE':'NO_NEXT_FIXTURE',
      count:rows.length,
      error:'INDEPENDENT_ESPN_FIXTURE_FALLBACK'});
   }catch(e){
    statuses.push({league:c.league,name:c.name,
      providerLeagueId:c.providerLeagueId,
      status:locked?'RATE_LIMITED':'SOURCE_UNAVAILABLE',count:0,
      error:'ESPN_FALLBACK_'+isHttpError(e).slice(0,90)});
   }
  }else{
   statuses.push({league:c.league,name:c.name,providerLeagueId:c.providerLeagueId,
     status:'RATE_LIMITED',count:0,
     error:'NOT_QUERIED_AFTER_429_CIRCUIT_BREAKER'});
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
 if(worked<2)throw Error('SUPPLEMENTAL_PROVIDER_NOT_RELIABLE_ENOUGH_'+worked);
}
main().catch(e=>{
 console.error('SOCCER_SUPPLEMENTAL_FAIL_CLOSED',
  e instanceof Error?e.message:String(e));
 process.exitCode=1;
});
