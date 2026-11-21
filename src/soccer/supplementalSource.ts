/** Explicit additional leagues missed by open-matchday 75-comp catalog.
 * The public TSDB v1 guest endpoint has strong rate limits and may expose
 * only ONE next fixture per league. Treat it as partial fixture discovery,
 * NEVER as a complete league schedule or betting-probability data source.
 */
export const SUPPLEMENTAL_SOCCER_SCHEMA='supplemental-soccer-partial-fixtures-v1' as const;
export const SUPPLEMENTAL_SOCCER_LEAGUES=[
 {league:'NIC_1_primera',name:'Nicaraguan Primera División',providerLeagueId:'4806'},
 {league:'COL_1_primera-a',name:'Colombian Primera A',providerLeagueId:'4497'},
 {league:'CRI_1_primera',name:'Costa Rican Primera División',providerLeagueId:'4815'},
 {league:'KOR_2_k-league',name:'South Korean K2 League',providerLeagueId:'4822'},
 {league:'AUS_2_championship',name:'Australian Championship',providerLeagueId:'5710'}
] as const;
export type SupplementalLeague=typeof SUPPLEMENTAL_SOCCER_LEAGUES[number];
export type SupplementalMatch={
 id:string;league:string;season:string;date:string;home:string;away:string;
 kickoffUtc:string;
 source:'THESPORTSDB_PUBLIC_NEXT_EVENT'|'ESPN_SITE_SOCCER_SCOREBOARD';
 providerStatus:'NS';
 coverage:'PARTIAL_NEXT_EVENT_ONLY'|'PARTIAL_ESPN_SCHEDULE';
 sourceCapturedAtUtc:string;
};
export type SupplementalStatus={
 league:string;name:string;providerLeagueId:string;
 status:'OK_NEXT_FIXTURE'|'NO_NEXT_FIXTURE'|'RATE_LIMITED'|'SOURCE_UNAVAILABLE';
 count:number;error?:string;
};
export type SupplementalSnapshot={
 schema:typeof SUPPLEMENTAL_SOCCER_SCHEMA;
 generated_at_utc:string;
 coverage:'FIVE_EXPLICIT_MISSING_LEAGUES_PARTIAL_NEXT_EVENT_ONLY';
 competitions:SupplementalStatus[];
 fixtures:SupplementalMatch[];
 guardrails:{official_bets:0;calibrated:false;historical_model_ready:false;
 exact_kickoff_independently_confirmed:false;all_league_fixtures_claimed:false};
};
const strictDay=(s:string)=>/^20\d\d-\d\d-\d\d$/.test(s)&&
 !Number.isNaN(Date.parse(s+'T00:00:00Z'))&&
 new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const strictClock=(s:string)=>/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(s);
const safe=(x:unknown)=>typeof x==='string'?x.trim():'';
export function readSupplementalNextEvent(raw:unknown,
 competition:SupplementalLeague,capturedAtUtc:string):SupplementalMatch[]{
 const v=raw as {events?:unknown}|null;
 if(!v||typeof v!=='object'||!Array.isArray(v.events)&&v.events!==null)
  throw Error('SOCCER_SUPPLEMENTAL_INVALID_PROVIDER_SCHEMA');
 const entries=v.events===null?[]:v.events as Record<string,unknown>[];
 if(entries.length>8)throw Error('SOCCER_SUPPLEMENTAL_UNEXPECTED_FREE_FEED_SIZE');
 const matches:SupplementalMatch[]=[];
 const seen=new Set<string>();
 for(const e of entries){
  if(!e||typeof e!=='object')throw Error('SOCCER_SUPPLEMENTAL_INVALID_EVENT');
  if(safe(e.idLeague)!==competition.providerLeagueId)
   throw Error('SOCCER_SUPPLEMENTAL_WRONG_COMPETITION');
  if(safe(e.strSport)!=='Soccer')throw Error('SOCCER_SUPPLEMENTAL_WRONG_SPORT');
  // A live, abandoned, postponed, or completed game MUST NOT be published
  // as pregame information. Never use scores/odds as model features.
  if(safe(e.strStatus)!=='NS')continue;
  const day=safe(e.dateEvent),clock=safe(e.strTime);
  const home=safe(e.strHomeTeam),away=safe(e.strAwayTeam);
  const sourceId=safe(e.idEvent);
  if(!strictDay(day)||!strictClock(clock)||!home||!away||
     home===away||home.length>120||away.length>120||
     !/^\d{1,15}$/.test(sourceId))
   throw Error('SOCCER_SUPPLEMENTAL_INVALID_FIXTURE');
  const at=day+'T'+clock+'Z';
  if(!Number.isFinite(Date.parse(at)))
   throw Error('SOCCER_SUPPLEMENTAL_INVALID_PROVIDER_TIME');
  if(seen.has(sourceId))throw Error('SOCCER_SUPPLEMENTAL_DUPLICATED_EVENT');
  seen.add(sourceId);
  matches.push({id:'tsdb:'+sourceId,league:competition.league,
   season:day.slice(0,4),date:day,home,away,kickoffUtc:at,
   source:'THESPORTSDB_PUBLIC_NEXT_EVENT',providerStatus:'NS',
   coverage:'PARTIAL_NEXT_EVENT_ONLY',sourceCapturedAtUtc:capturedAtUtc});
 }
 return matches;
}
export function validateSupplementalSnapshot(raw:unknown):SupplementalSnapshot{
 const v=raw as SupplementalSnapshot|null;
 if(!v||v.schema!==SUPPLEMENTAL_SOCCER_SCHEMA||
    !Number.isFinite(Date.parse(v.generated_at_utc))||
    !Array.isArray(v.competitions)||!Array.isArray(v.fixtures)||
    v.guardrails?.official_bets!==0||v.guardrails.calibrated!==false||
    v.guardrails.historical_model_ready!==false||
    v.guardrails.exact_kickoff_independently_confirmed!==false||
    v.guardrails.all_league_fixtures_claimed!==false)
  throw Error('SOCCER_SUPPLEMENTAL_INVALID_SNAPSHOT');
 const names=new Set<string>(SUPPLEMENTAL_SOCCER_LEAGUES.map(x=>x.league));
 const unique=new Set<string>();
 for(const c of v.competitions){
  if(!names.has(c.league)||unique.has(c.league))
   throw Error('SOCCER_SUPPLEMENTAL_INVALID_COMPETITION');
  unique.add(c.league);
 }
 if(v.competitions.length&&v.competitions.length!==names.size)
  throw Error('SOCCER_SUPPLEMENTAL_INCOMPLETE_LEAGUE_CATALOG');
 const fixtureIds=new Set<string>();
 for(const f of v.fixtures){
  if(!names.has(f.league)||![
       'THESPORTSDB_PUBLIC_NEXT_EVENT','ESPN_SITE_SOCCER_SCOREBOARD'
     ].includes(f.source)||![
       'PARTIAL_NEXT_EVENT_ONLY','PARTIAL_ESPN_SCHEDULE'
     ].includes(f.coverage)||f.providerStatus!=='NS'||
     !Number.isFinite(Date.parse(f.kickoffUtc))||
     f.date!==f.kickoffUtc.slice(0,10)||fixtureIds.has(f.id))
   throw Error('SOCCER_SUPPLEMENTAL_INVALID_OR_DUPLICATE_EVENT');
  fixtureIds.add(f.id);
 }
 return v;
}


/** Verified ESPN fixture identity and timestamp parser for Colombian /
 * Costa Rican scoreboards only. Scores and in-play fixtures are excluded.
 * The scheduled kickoff is still supplied by ONE provider only.
 */
export function readSupplementalESPNFixtures(raw:unknown,league:
 'COL_1_primera-a'|'CRI_1_primera',capturedAtUtc:string):SupplementalMatch[]{
 const v=raw as {events?:unknown;leagues?:unknown}|null;
 if(!v||!Array.isArray(v.events)||!Array.isArray(v.leagues))
  throw Error('SOCCER_ESPN_SUPPLEMENT_INVALID_SCHEMA');
 if(v.events.length>200)throw Error('SOCCER_ESPN_UNEXPECTED_SIZE');
 const out:SupplementalMatch[]=[];const seen=new Set<string>();
 for(const e of v.events){
  if(!e||typeof e!=='object')throw Error('SOCCER_ESPN_BAD_EVENT');
  const ev=e as Record<string,unknown>;
  const status=ev.status as {type?:{name?:string}}|undefined;
  if(status?.type?.name!=='STATUS_SCHEDULED')continue;
  const comps=ev.competitions;
  if(!Array.isArray(comps)||comps.length!==1||
      !Array.isArray(comps[0]?.competitors))
    throw Error('SOCCER_ESPN_INVALID_COMPETITORS');
  const players=comps[0].competitors as Array<{
    homeAway?:string;team?:{displayName?:string};
  }>;
  const home=players.filter(x=>x.homeAway==='home');
  const away=players.filter(x=>x.homeAway==='away');
  if(home.length!==1||away.length!==1)
    throw Error('SOCCER_ESPN_AMBIGUOUS_HOME_AWAY');
  const h=safe(home[0].team?.displayName),a=safe(away[0].team?.displayName);
  const sourceId=safe(ev.id),time=safe(ev.date);
  const d=Date.parse(time);
  if(!h||!a||h===a||!/^\d{1,15}$/.test(sourceId)||
     !Number.isFinite(d)||!time.endsWith('Z'))
    throw Error('SOCCER_ESPN_INVALID_SOURCE_TIME_OR_TEAM');
  const kickoffUtc=new Date(d).toISOString();
  const id='espn:'+league+':'+sourceId;
  if(seen.has(id))throw Error('SOCCER_ESPN_DUPLICATE_EVENT');
  seen.add(id);
  out.push({id,league,season:kickoffUtc.slice(0,4),
    date:kickoffUtc.slice(0,10),home:h,away:a,kickoffUtc,
    source:'ESPN_SITE_SOCCER_SCOREBOARD',providerStatus:'NS',
    coverage:'PARTIAL_ESPN_SCHEDULE',sourceCapturedAtUtc:capturedAtUtc});
 }
 return out;
}
