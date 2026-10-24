/** Independent upcoming schedule for every Prop Edge sport.
 *
 * CRITICAL: a fixture is NOT the same as a prediction. Never build a game
 * list from published picks, never invent a kickoff or bookmaker market.
 * Public ESPN schedule only; bookmaker providers are NOT queried or billed.
 * Unavailable source => SOURCE_UNAVAILABLE/PARTIAL, never "no games".
 */
import type {Request,Response} from 'express';

export const SCHEDULE_SCHEMA='PROP_EDGE_ALL_SPORTS_UPCOMING_FIXTURES_V1';
export const SPORTS=['MLB','NFL','CFB','NHL','NBA','TENNIS','SOCCER'] as const;
export type ScheduleSport=typeof SPORTS[number];
export type Fixture={
  event_id:string;source_league:string;away:string;home:string;
  start_utc:string;status:'scheduled'|'in_progress';
  source:'ESPN_PUBLIC_SCOREBOARD';prediction_attached:false;
};
export type ScheduleDocument={
  schema:typeof SCHEDULE_SCHEMA;sport:ScheduleSport;
  generated_at_utc:string;through_utc:string;
  status:'SOURCE_VERIFIED'|'PARTIAL_SOURCE'|'SOURCE_UNAVAILABLE';
  fixtures:Fixture[];fixture_count:number;
  sources_checked:number;sources_succeeded:number;
  source_errors:Array<{league:string;error:string}>;
  note:string;
};
type Source={slug:string;url:string};
type Fetcher=typeof fetch;
const ORIGIN='https://site.api.espn.com/apis/site/v2/sports/';
const SLUGS:Record<ScheduleSport,string[]>={
  MLB:['baseball/mlb'],
  NFL:['football/nfl'],
  CFB:['football/college-football?groups=80','football/college-football?groups=81'],
  NHL:['hockey/nhl'],
  NBA:['basketball/nba'],
  TENNIS:['tennis/atp','tennis/wta'],
  SOCCER:['soccer/eng.1','soccer/esp.1','soccer/ita.1',
          'soccer/ger.1','soccer/fra.1']
};
const validDate=(v:unknown)=>typeof v==='string'&&
  Number.isFinite(Date.parse(v))&&/^\d{4}-\d\d-\d\dT/.test(v);
function sourcesFor(sport:ScheduleSport,now:Date):Source[]{
  // Query through 9 calendar days: covers immediate nights on both sides
  // of US/Eastern midnight plus next week's football weekend.
  const date=(d:Date)=>d.toISOString().slice(0,10).replaceAll('-','');
  const start=new Date(now.getTime()-86400000),end=new Date(now.getTime()+9*86400000);
  const range=date(start)+'-'+date(end);
  return SLUGS[sport].map(slug=>{
    const [path,extra]=slug.split('?');
    const params=new URLSearchParams(extra||'');
    params.set('dates',range);
    params.set('limit',sport==='CFB'?'500':'250');
    return {slug,url:ORIGIN+path+'/scoreboard?'+params.toString()};
  });
}
function entrant(obj:any):string{
  const a=obj?.team||obj?.athlete||obj;
  const name=a?.displayName||a?.fullName||a?.name;
  return typeof name==='string'?name.trim():'';
}
function statusOf(event:any,competition:any):'scheduled'|'in_progress'|null{
  const st=competition?.status?.type||event?.status?.type||{};
  if(st.completed===true||st.state==='post'||st.name==='STATUS_FINAL')return null;
  if(st.state==='in'||st.name==='STATUS_IN_PROGRESS')return 'in_progress';
  if(st.state==='pre'||st.name==='STATUS_SCHEDULED'||st.completed===false)
    return 'scheduled';
  return null; // Fail closed on unknown match state.
}
export function parseEspnFixtures(raw:unknown,sourceLeague:string,
  now:Date,through:Date):Fixture[]{
  if(!raw||typeof raw!=='object'||!Array.isArray((raw as any).events))
    throw Error('ESPN_MISSING_EVENTS_ARRAY');
  const parsed:Fixture[]=[];
  for(const event of (raw as any).events){
    // Tennis can represent many matches as competitions in one tournament.
    // For team leagues, a game normally contains one competition.
    const competitions=Array.isArray(event?.competitions)?event.competitions:[];
    for(const comp of competitions){
      const competitors=comp?.competitors;
      if(!Array.isArray(competitors)||competitors.length!==2)continue;
      const names=competitors.map(entrant);
      if(!names[0]||!names[1]||names[0]===names[1])continue;
      const rawTime=comp?.date||event?.date;
      if(!validDate(rawTime))continue;
      const start=Date.parse(rawTime);
      if(start>=through.getTime())continue;
      const status=statusOf(event,comp);
      if(!status)continue;
      if(status==='scheduled'&&start<now.getTime())continue;
      // Only include actual in-progress games no older than 24h.
      if(status==='in_progress'&&start<now.getTime()-86400000)continue;
      const identifier=comp?.id||event?.id;
      if(!/^[\w.-]+$/.test(String(identifier||'')))continue;
      const home=competitors.find((c:any)=>c.homeAway==='home');
      const away=competitors.find((c:any)=>c.homeAway==='away');
      const h=home?entrant(home):names[0],a=away?entrant(away):names[1];
      parsed.push({event_id:sourceLeague+':'+String(identifier),
        source_league:sourceLeague,away:a,home:h,
        start_utc:new Date(start).toISOString(),status,
        source:'ESPN_PUBLIC_SCOREBOARD',prediction_attached:false});
    }
  }
  return parsed;
}
const inflight=new Map<string,Promise<ScheduleDocument>>();
const cache=new Map<string,{expires:number,value:ScheduleDocument}>();
const CACHE_MS=4*60_000;
export async function loadUpcomingFixtures(sport:ScheduleSport,
  now=new Date(),fetcher:Fetcher=fetch,cacheEnabled=false):Promise<ScheduleDocument>{
  if(!SPORTS.includes(sport)||!Number.isFinite(now.getTime()))
    throw Error('UNSUPPORTED_SPORT_OR_DATE');
  const through=new Date(now.getTime()+8*86400000);
  const cacheKey=sport+'|'+Math.floor(now.getTime()/(60*1000));
  if(cacheEnabled){
    const hit=cache.get(sport);
    if(hit&&hit.expires>now.getTime())return hit.value;
    const pending=inflight.get(sport);
    if(pending)return pending;
  }
  const work=async()=>{
    const sources=sourcesFor(sport,now);
    const results=await Promise.all(sources.map(async src=>{
      try{
        const response=await fetcher(src.url,{headers:{Accept:'application/json'},
          signal:AbortSignal.timeout(11000),cache:'no-store'});
        if(!response.ok)throw Error('HTTP_'+response.status);
        const body=await response.json();
        return {league:src.slug.split('?')[0],matches:parseEspnFixtures(body,
          src.slug.split('?')[0],now,through)};
      }catch(err){
        return {league:src.slug.split('?')[0],
          error:err instanceof Error?err.message:'SOURCE_FAILED'};
      }
    }));
    const matches=new Map<string,Fixture>();
    let success=0;
    const errors:Array<{league:string;error:string}>=[];
    for(const part of results){
      if('error' in part){
        errors.push({league:part.league,error:String(part.error).slice(0,100)});
        continue;
      }
      success++;
      for(const f of part.matches||[]){
        const old=matches.get(f.event_id);
        if(old&&(old.home!==f.home||old.away!==f.away||
                 old.start_utc!==f.start_utc)){
          errors.push({league:part.league,error:'CONFLICTING_EVENT_ID'});
          matches.delete(f.event_id);
          continue;
        }
        matches.set(f.event_id,f);
      }
    }
    const fixtures=[...matches.values()].sort((a,b)=>
      a.start_utc.localeCompare(b.start_utc)||a.event_id.localeCompare(b.event_id));
    const value:ScheduleDocument={
      schema:SCHEDULE_SCHEMA,sport,generated_at_utc:now.toISOString(),
      through_utc:through.toISOString(),
      status:success===0?'SOURCE_UNAVAILABLE':
             errors.length?'PARTIAL_SOURCE':'SOURCE_VERIFIED',
      fixtures,fixture_count:fixtures.length,
      sources_checked:sources.length,sources_succeeded:success,
      source_errors:errors,
      note:'Independently sourced fixtures, not model-generated picks. '+
       'No posted prediction or sportsbook line is implied; empty verified '+
       'fixtures may mean an offseason or an uncovered source schedule.'
    };
    if(cacheEnabled&&success>0)cache.set(sport,{expires:now.getTime()+CACHE_MS,value});
    return value;
  };
  if(!cacheEnabled)return work();
  const promise=work().finally(()=>inflight.delete(sport));
  inflight.set(sport,promise);
  return promise;
}
export function upcomingFixturesHandler(fetcher:Fetcher=fetch,clock=()=>new Date()){
  return async(req:Request,res:Response)=>{
    res.setHeader('Cache-Control','no-store, max-age=0');
    const sport=String(req.params.sport||'').toUpperCase() as ScheduleSport;
    if(!SPORTS.includes(sport))return res.status(400).json({
      error:'UNSUPPORTED_PROP_EDGE_SPORT'});
    try{
      const d=await loadUpcomingFixtures(sport,clock(),fetcher,true);
      if(d.status==='SOURCE_UNAVAILABLE')return res.status(502).json(d);
      return res.json(d);
    }catch(err){
      return res.status(503).json({schema:SCHEDULE_SCHEMA,sport,
        status:'SOURCE_UNAVAILABLE',fixture_count:0,fixtures:[],
        source_errors:[{league:sport,error:'UNVERIFIED_SCHEDULE_SOURCE'}]});
    }
  };
}
