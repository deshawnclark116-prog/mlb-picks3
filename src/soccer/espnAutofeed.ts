/** Strict ESPN soccer data adapter using observed completed-match rosters.
 * A date-only event is insufficient for prospective forecasts. Never treat
 * missing player shots or substitute clock as a zero or assumed 90 minutes.
 */
import {createHash} from 'node:crypto';
import type {PlayerMatch,PlayerHistory,PlayerForecast} from './playerChallenger';
import {playerShotForecast} from './playerChallenger';

export type EspnLeague='eng.1'|'esp.1'|'ita.1'|'ger.1'|'fra.1';
export const ESPN_SOCCER_LEAGUES:EspnLeague[]=['eng.1','esp.1','ita.1','ger.1','fra.1'];
export type EspnFixture={
 league:EspnLeague;gameId:string;kickoffUtc:string;
 homeId:string;home:string;awayId:string;away:string;
 completed:boolean;
};
export type EspnPlayerRow={
 playerId:string;playerName:string;teamId:string;teamName:string;
 league:EspnLeague;kickoffUtc:string;match:PlayerMatch;
};
export type EspnOriginal={
 id:string;gameId:string;league:EspnLeague;kickoffUtc:string;
 fixtureDate:string;playerId:string;playerName:string;teamId:string;
 teamName:string;opponent:string;capturedAtUtc:string;
 modelVersion:'soccer-player-minutes-shots-v1';
 source:'ESPN_COMPLETED_MATCH_ROSTERS';evidenceGames:number;
 lineupsVerified:false;injuriesVerified:false;
 status:'EARLY_PREGAME_RESEARCH_UNCALIBRATED';
 forecast:PlayerForecast;
};
const obj=(v:unknown):Record<string,unknown>|null=>
 v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;
const txt=(v:unknown)=>typeof v==='string'?v:'';
const id=(v:unknown)=>txt(v).match(/^[a-zA-Z0-9_-]{1,50}$/)!==null;
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&
 new Date(v).toISOString()===v;
const integer=(n:unknown)=>typeof n==='number'&&Number.isInteger(n);
const key=(x:EspnFixture)=>x.league+':'+x.gameId;
export function espnSourceSha(raw:string){return createHash('sha256').update(raw).digest('hex');}
export function parseEspnSoccerScoreboard(league:EspnLeague,raw:unknown):EspnFixture[]{
 if(!ESPN_SOCCER_LEAGUES.includes(league))throw Error('ESPN_SOCCER_INVALID_LEAGUE');
 const doc=obj(raw),events=doc?.events;
 if(!Array.isArray(events))throw Error('ESPN_SOCCER_EVENTS_MISSING');
 const games:EspnFixture[]=[],seen=new Set<string>();
 for(const original of events){
  const e=obj(original),comp=obj((e?.competitions as unknown[]|undefined)?.[0]);
  const teams=comp?.competitors;
  if(!e||!id(e.id)||!date(e.date)||!Array.isArray(teams)||teams.length!==2)
   continue;
  const home=obj(teams.find(t=>obj(t)?.homeAway==='home'));
  const away=obj(teams.find(t=>obj(t)?.homeAway==='away'));
  const ht=obj(home?.team),at=obj(away?.team);
  if(!ht||!at||!id(ht.id)||!id(at.id)||ht.id===at.id||
    !txt(ht.displayName)||!txt(at.displayName))continue;
  const status=obj(obj(e.status)?.type);
  const canceled=['STATUS_CANCELED','STATUS_POSTPONED','STATUS_ABANDONED']
    .includes(txt(status?.name));
  if(canceled)continue;
  if(seen.has(String(e.id)))throw Error('ESPN_SOCCER_DUPLICATE_EVENT');
  seen.add(String(e.id));
  games.push({league,gameId:String(e.id),kickoffUtc:String(e.date),
   homeId:String(ht.id),home:String(ht.displayName),
   awayId:String(at.id),away:String(at.displayName),
   completed:status?.completed===true});
 }
 return games.sort((a,b)=>a.kickoffUtc.localeCompare(b.kickoffUtc)||key(a).localeCompare(key(b)));
}
const clockMinute=(raw:unknown):number|null=>{
 const value=txt(obj(raw)?.displayValue);
 const match=/^(\d{1,3})'(?:\+(\d{1,2})')?$/.exec(value);
 if(!match)return null;
 const mins=Number(match[1])+Number(match[2]||0);
 return Number.isFinite(mins)&&mins>=0&&mins<=130?mins:null;
};
function playerMinutes(p:Record<string,unknown>):number|null {
 const start=p.starter===true,subIn=p.subbedIn===true,subOut=p.subbedOut===true;
 if(!start&&!subIn)return null;
 const plays=Array.isArray(p.plays)?p.plays:[];
 const times=plays.filter(x=>obj(x)?.substitution===true).map(x=>clockMinute(obj(x)?.clock));
 if((subIn||subOut)&&(times.length!==1||times[0]===null))return null;
 const minute=times[0]??0;
 // Normalize to regulation minutes. Extra time injury clock is NOT more
 // pregame exposure; substitute who enters at 90'+ must be zero minutes.
 const limit=(m:number)=>Math.min(90,m);
 const duration=start?(subOut?limit(minute):90):(subIn?90-limit(minute):0);
 return Number.isInteger(duration)&&duration>0&&duration<=90?duration:null;
}
function matchStat(p:Record<string,unknown>,name:string):number|null {
 if(!Array.isArray(p.stats))return null;
 const item=p.stats.map(obj).find(x=>x?.name===name);
 const value=item?.value;
 return integer(value)&&value>=0&&value<=35?value:null;
}
/** The caller must prove finished match and that kickoff precedes capture time. */
export function parseCompletedSoccerRoster(f:EspnFixture,data:unknown,asofUtc:string):EspnPlayerRow[]{
 if(!f.completed||!date(asofUtc)||Date.parse(f.kickoffUtc)>=Date.parse(asofUtc))
   throw Error('ESPN_SOCCER_NOT_COMPLETED_OR_AFTER_CUTOFF');
 const doc=obj(data),squads=doc?.rosters;
 if(!Array.isArray(squads)||squads.length!==2)
   throw Error('ESPN_SOCCER_ROSTER_MISSING');
 const rows:EspnPlayerRow[]=[],ids=new Set<string>();
 for(const item of squads){
  const squad=obj(item),team=obj(squad?.team),roster=squad?.roster;
  if(!team||!id(team.id)||!Array.isArray(roster))continue;
  const tid=String(team.id);
  const expectedName=tid===f.homeId?f.home:tid===f.awayId?f.away:null;
  if(!expectedName)throw Error('ESPN_SOCCER_MATCH_TEAM_ID_MISMATCH');
  for(const entry of roster){
   const p=obj(entry),athlete=obj(p?.athlete);
   if(!p||!athlete||!id(athlete.id)||!txt(athlete.displayName))continue;
   const mins=playerMinutes(p);
   const shots=matchStat(p,'totalShots'),sot=matchStat(p,'shotsOnTarget');
   if(mins===null||shots===null||sot===null)continue;
   if(sot>shots)throw Error('ESPN_SOCCER_SOT_GT_SHOTS');
   const playerId=String(athlete.id);
   if(ids.has(playerId))throw Error('ESPN_SOCCER_DUPLICATE_PLAYER');
   ids.add(playerId);
   rows.push({playerId,playerName:String(athlete.displayName),
    teamId:tid,teamName:expectedName,league:f.league,kickoffUtc:f.kickoffUtc,
    match:{game_id:f.gameId,game_date:f.kickoffUtc.slice(0,10),
      team_id:tid,team:expectedName,minutes:mins,
      starter:p.starter===true,shots,shots_on_target:sot,xg:null,
      position:txt(obj(p.position)?.name)||null}});
  }
 }
 if(rows.length<14)throw Error('ESPN_SOCCER_INSUFFICIENT_VALID_PLAYER_BOXES');
 return rows;
}
/** Forecast all recently active players for a verified future fixture.
 * Lineups are not required; player availability is explicitly UNKNOWN.
 * Historical cutoff is strictly prior to the fixture day, also for same-day.
 */
export function buildEspnEarlyPlayerForecasts(
 fixture:EspnFixture,rows:EspnPlayerRow[],at:string,limitPerTeam=15
):EspnOriginal[]{
 if(!date(at)||!date(fixture.kickoffUtc)||
   Date.parse(fixture.kickoffUtc)-Date.parse(at)<15*60000||
   fixture.completed)return [];
 const byId=new Map<string,EspnPlayerRow[]>();
 const fixtureDay=fixture.kickoffUtc.slice(0,10);
 for(const r of rows){
   if(r.league!==fixture.league||r.match.game_date>=fixtureDay||
      Date.parse(r.kickoffUtc)>=Date.parse(at))continue;
   const list=byId.get(r.playerId)||[];
   list.push(r);byId.set(r.playerId,list);
 }
 const predictions:EspnOriginal[]=[];
 for(const [teamId,teamName,opponent] of [
   [fixture.homeId,fixture.home,fixture.away],[fixture.awayId,fixture.away,fixture.home]
 ]){
  const prospects:EspnOriginal[]=[];
  for(const [playerId,raw] of byId){
   const own=raw.filter(r=>r.teamId===teamId)
     .sort((a,b)=>b.kickoffUtc.localeCompare(a.kickoffUtc));
   if(own.length<6||!own[0])continue;
   const age=Date.parse(fixtureDay+'T00:00:00Z')-Date.parse(own[0].kickoffUtc);
   if(age<0||age>24*86400000)continue;
   const prior:PlayerHistory={player_id:playerId,games:own.map(x=>x.match)};
   const projected=playerShotForecast(prior,fixtureDay,{
     teamId,availability:'UNKNOWN',asofUtc:at,
     fixtureGameId:fixture.gameId,fixtureKickoffUtc:fixture.kickoffUtc
   });
   if(!projected)continue;
   // No goalkeepers, and never promote uncertain injury/lineup to official.
   if(own[0].match.position?.toLowerCase().includes('goalkeeper'))continue;
   const originalId=espnSourceSha([fixture.league,fixture.gameId,playerId].join('|')).slice(0,32);
   prospects.push({id:originalId,gameId:fixture.gameId,league:fixture.league,
     kickoffUtc:fixture.kickoffUtc,fixtureDate:fixtureDay,
     playerId,playerName:own[0].playerName,
     teamId,teamName,opponent,capturedAtUtc:at,
     modelVersion:'soccer-player-minutes-shots-v1',
     source:'ESPN_COMPLETED_MATCH_ROSTERS',evidenceGames:projected.historyGames,
     lineupsVerified:false,injuriesVerified:false,
     status:'EARLY_PREGAME_RESEARCH_UNCALIBRATED',forecast:projected});
  }
  // A fully contextual player list, not cherry-picked "top 2 picks":
  // stable recent sample and starts, rather than maximizing easy event chance.
  prospects.sort((a,b)=>b.forecast.totalMinutes-a.forecast.totalMinutes||
   a.playerName.localeCompare(b.playerName));
  predictions.push(...prospects.slice(0,limitPerTeam));
 }
 return predictions;
}
