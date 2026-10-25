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
function extractAthleteId(athlete:any,fallback?:unknown):string{
  if(athlete?.id!=null&&digit(String(athlete.id)))return String(athlete.id);
  if(athlete?.athleteId!=null&&digit(String(athlete.athleteId)))return String(athlete.athleteId);
  if(athlete?.playerId!=null&&digit(String(athlete.playerId)))return String(athlete.playerId);
  if(athlete?.uid!=null){
    const m=String(athlete.uid).match(/~a:(\d+)/);
    if(m)return m[1];
  }
  if(Array.isArray(athlete?.links)){
    for(const l of athlete.links){
      const href=String(l?.href??'');
      const m1=href.match(/\/id\/(\d+)/);
      if(m1)return m1[1];
      const m2=href.match(/~a:(\d+)/);
      if(m2)return m2[1];
    }
  }
  if(athlete?.headshot?.href){
    const m=String(athlete.headshot.href).match(/\/(\d+)\.png/);
    if(m)return m[1];
  }
  if(Array.isArray(athlete?.notes?.items)){
    for(const n of athlete.notes.items){
      const ref=String(n?.injury?.['$ref']??'');
      const m=ref.match(/\/athletes\/(\d+)\//);
      if(m)return m[1];
    }
  }
  if(fallback!=null&&digit(String(fallback)))return String(fallback);
  return '';
}
export function parseLiveNbaInjuries(raw:unknown,captured=new Date(),
  sha='synthetic_test_source'):LiveAvailability {
  if(!Number.isFinite(captured.getTime()))throw Error('NBA_INJURY_CAPTURE_INVALID_TIME');
  const arr=(raw as any)?.injuries;
  if(!Array.isArray(arr))throw Error('NBA_ESPN_MISSING_INJURY_COLLECTION');
  type Candidate={team:string;id:string;status:string;date:any;player:string;};
  const candidates:Candidate[]=[];
  for(const item of arr){
    if(Array.isArray(item?.injuries)){
      const parentTeam=String(item?.id??item?.team?.id??item?.team_id??'');
      for(const sub of item.injuries){
        const team=String(sub?.team?.id??sub?.team_id??sub?.athlete?.team?.id??parentTeam);
        const athlete=sub?.athlete;
        const id=extractAthleteId(athlete,sub?.athlete?.id??sub?.player_id??sub?.athlete_id);
        const status=String(sub?.status??sub?.type?.description??sub?.type?.name??sub?.details?.fantasyStatus?.description??'').trim();
        const date=sub?.date;
        const player=String(athlete?.displayName??athlete?.name??sub?.player??'');
        candidates.push({team,id,status,date,player});
      }
    }else{
      const team=String(item?.team?.id??item?.team_id??item?.teamId??item?.id??'');
      const athlete=item?.athlete;
      const id=extractAthleteId(athlete,item?.athlete?.id??item?.player_id??item?.playerId);
      const status=String(item?.status??item?.type?.description??item?.type?.name??item?.details?.fantasyStatus?.description??'').trim();
      const date=item?.date;
      const player=String(athlete?.displayName??athlete?.name??item?.player??'');
      candidates.push({team,id,status,date,player});
    }
  }
  const players:LiveAvailabilityRow[]=[];
  let quarantined=0;
  const seen=new Set<string>(),teams=new Set<string>();
  for(const v of candidates){
    const {team,id,status,date:at,player}=v;
    if(!digit(team)||!digit(id)||!status){quarantined++;continue;}
    const key=team+'|'+id;
    if(seen.has(key))throw Error('NBA_INJURY_DUPLICATE_TEAM_PLAYER_ID');
    seen.add(key);
    const atStr=typeof at==='string'?at:null;
    if(at!=null&&(!Number.isFinite(Date.parse(String(at)))||
      Date.parse(String(at))>captured.getTime()+3600000)){
      quarantined++;continue;
    }
    const s=normalized(status);
    players.push({team_id:team,player_id:id,status:s,original_status:status,
      source_event_utc:atStr,player});
    teams.add(team);
  }
  // At regular-season slate time a truly league-wide response with zero
  // injuries is not adequate evidence to certify current decisions.
  // Isolated malformed rows or empty responses must not become "all healthy".
  const totalBaseline=candidates.length||arr.length;
  if(players.length<5||teams.size<4||
    quarantined>Math.max(25,totalBaseline*.6)){
    throw Error('NBA_ESPN_INJURY_COVERAGE_NOT_SAFELY_VERIFIABLE');
  }
  return {
    schema:LIVE_AVAILABILITY_SCHEMA,source_url:NBA_INJURY_URL,
    captured_at_utc:captured.toISOString(),sha256:sha,
    raw_entries:totalBaseline,accepted_entries:players.length,
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
