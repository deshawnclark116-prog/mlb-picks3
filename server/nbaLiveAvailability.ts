/** Pregame NBA PLAYER-AVAILABILITY serving gate.
 * Independently fetches ESPN's LIVE NBA injury observations on each board
 * refresh (2-minute TTL). Historical injury snapshots can NEVER certify
 * current availability. Exact ESPN team + athlete IDs only: no fuzzy player
 * joins, inferred eligibility or fabricated injury reports.
 *
 * ESPN source is NOT the NBA's official active/inactive list. The feed can lag
 * team statements, so failed/implausibly empty evidence FAILS CLOSED rather
 * than republishing an unchecked SYSTEM PICKS board.
 */
import {createHash} from 'node:crypto';

export const NBA_INJURY_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries';
export const LIVE_AVAILABILITY_SCHEMA='NBA_LIVE_ESPN_INJURY_OBSERVATIONS_V1';
export const LIVE_AVAILABILITY_TTL_MS=120000;
export type AvailabilityStatus='OUT'|'DOUBTFUL'|'QUESTIONABLE'|'DAY_TO_DAY'|
  'INACTIVE'|'SUSPENDED'|'PROBABLE'|'AVAILABLE'|'UNKNOWN';
export type LiveAvailabilityRow={
  player_id:string;team_id:string;status:AvailabilityStatus;
  original_status:string;source_event_utc:string|null;
  player:string;
};
export type LiveAvailability={
  schema:typeof LIVE_AVAILABILITY_SCHEMA;source_url:typeof NBA_INJURY_URL;
  captured_at_utc:string;sha256:string;raw_entries:number;
  accepted_entries:number;quarantined_entries:number;
  teams_with_reported_injuries:number;
  status:'ESPN_REPORTED_NOT_OFFICIAL_GAME_ACTIVE_CERTIFICATION';
  players:LiveAvailabilityRow[];
};
const known=new Set(['OUT','DOUBTFUL','QUESTIONABLE','DAY_TO_DAY',
  'INACTIVE','SUSPENDED','PROBABLE','AVAILABLE']);
const normalized=(s:string):AvailabilityStatus=>{
  const x=s.toUpperCase().replace(/[\s-]+/g,'_').trim();
  if(x==='GTD'||x==='GAME_TIME_DECISION'||x==='GAME_TIME')
    return 'QUESTIONABLE';
  if(x==='DTD')return 'DAY_TO_DAY';
  if(x==='NOT_ACTIVE'||x==='NOT_WITH_TEAM'||x==='IR')
    return 'INACTIVE';
  return known.has(x)?x as AvailabilityStatus:'UNKNOWN';
};
const digit=(s:string)=>/^\d+$/.test(s);
export function parseLiveNbaInjuries(raw:unknown,captured=new Date(),
  sha='synthetic_test_source'):LiveAvailability {
  if(!Number.isFinite(captured.getTime()))throw Error('NBA_INJURY_CAPTURE_INVALID_TIME');
  const arr=(raw as any)?.injuries;
  if(!Array.isArray(arr))throw Error('NBA_ESPN_MISSING_INJURY_COLLECTION');
  const players:LiveAvailabilityRow[]=[];
  let quarantined=0;
  const seen=new Set<string>(),teams=new Set<string>();
  for(const v of arr){
    const team=String(v?.team?.id??''),id=String(v?.athlete?.id??'');
    const status=String(v?.status??'').trim();
    if(!digit(team)||!digit(id)||!status){quarantined++;continue;}
    const key=team+'|'+id;
    if(seen.has(key))throw Error('NBA_INJURY_DUPLICATE_TEAM_PLAYER_ID');
    seen.add(key);
    const at=v?.date;
    if(at!=null&&(!Number.isFinite(Date.parse(at))||
      Date.parse(at)>captured.getTime()+60000)){
      quarantined++;continue;
    }
    const s=normalized(status);
    players.push({team_id:team,player_id:id,status:s,original_status:status,
      source_event_utc:at??null,player:String(v?.athlete?.displayName??'')});
    teams.add(team);
  }
  // At regular-season slate time a truly league-wide response with zero
  // injuries is not adequate evidence to certify current decisions.
  // Isolated malformed rows or empty responses must not become "all healthy".
  if(players.length<5||teams.size<4||
    quarantined>Math.max(10,arr.length*.5)){
    throw Error('NBA_ESPN_INJURY_COVERAGE_NOT_SAFELY_VERIFIABLE');
  }
  return {
    schema:LIVE_AVAILABILITY_SCHEMA,source_url:NBA_INJURY_URL,
    captured_at_utc:captured.toISOString(),sha256:sha,
    raw_entries:arr.length,accepted_entries:players.length,
    quarantined_entries:quarantined,teams_with_reported_injuries:teams.size,
    status:'ESPN_REPORTED_NOT_OFFICIAL_GAME_ACTIVE_CERTIFICATION',players
  };
}
export function requireFreshLiveAvailability(v:LiveAvailability,now=new Date()){
  const age=now.getTime()-Date.parse(v.captured_at_utc);
  if(v.schema!==LIVE_AVAILABILITY_SCHEMA||
    v.source_url!==NBA_INJURY_URL||
    !Number.isFinite(age)||age<0||age>LIVE_AVAILABILITY_TTL_MS||
    v.accepted_entries<5||v.teams_with_reported_injuries<4||
    v.status!=='ESPN_REPORTED_NOT_OFFICIAL_GAME_ACTIVE_CERTIFICATION')
    throw Error('NBA_LIVE_INJURY_EVIDENCE_UNAVAILABLE_OR_EXPIRED');
}
export const nbaInjuryBlocks=(s:AvailabilityStatus)=>
  s!=='AVAILABLE'&&s!=='PROBABLE';
// Absent from ESPN feed is UNKNOWN, not certified active.
export function liveStatusMap(v:LiveAvailability){
  return new Map(v.players.map(p=>[p.team_id+'|'+p.player_id,p.status]));
}
let cached:{until:number;value:LiveAvailability}|null=null;
let ongoing:Promise<LiveAvailability>|null=null;
export function resetLiveNbaInjuryCacheForTest(){cached=null;ongoing=null;}
export async function loadLiveNbaInjuries(fetcher:typeof fetch=fetch,
  now=new Date(),useCache=true):Promise<LiveAvailability>{
  if(useCache&&cached&&cached.until>now.getTime()){
    requireFreshLiveAvailability(cached.value,now);
    return cached.value;
  }
  if(useCache&&ongoing)return ongoing;
  const action=(async()=>{
    const res=await fetcher(NBA_INJURY_URL,{
      cache:'no-store',headers:{Accept:'application/json'},
      signal:AbortSignal.timeout(8500)
    });
    if(!res.ok)throw Error('NBA_INJURY_UPSTREAM_HTTP_'+res.status);
    const body=await res.text();
    if(body.length<30||body.length>3_000_000)
      throw Error('NBA_INJURY_SOURCE_BODY_SIZE');
    const v=parseLiveNbaInjuries(JSON.parse(body),now,
      createHash('sha256').update(body).digest('hex'));
    requireFreshLiveAvailability(v,now);
    if(useCache)cached={until:now.getTime()+LIVE_AVAILABILITY_TTL_MS,value:v};
    return v;
  })();
  if(!useCache)return action;
  ongoing=action;
  try{return await action;}
  catch(e){cached=null;throw e;}
  finally{ongoing=null;}
}
