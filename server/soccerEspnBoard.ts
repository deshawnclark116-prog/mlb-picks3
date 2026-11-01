/** Fresh availability-gated ESPN soccer board.
 * Historical forecasting originals remain immutable in docs/. The live API
 * never treats past appearances as evidence of current squad selection.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {Request,Response} from 'express';
import type {EspnOriginal} from '../src/soccer/espnAutofeed';
import {currentSoccerRoster,currentSoccerUnavailable,
 confirmedSoccerStartingXI} from './soccerPlayerEligibility';

type CurrentPlayer=EspnOriginal&{currentEligibility:'STARTER_CONFIRMED'|'EARLY_ROSTER_ELIGIBLE'};
type Board={schema:string;generatedAtUtc:string;officialPicks:number;items:EspnOriginal[]};
type TeamEligibility={roster:Set<string>;unavailable:Set<string>}|null;
const REQUEST_TIMEOUT_MS=4500;
const MAX_CONCURRENCY=12;
const BASE='https://site.api.espn.com/apis/site/v2/sports/soccer/';
async function getJson(url:string):Promise<unknown>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
 try{
  const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!r.ok)throw Error('SOCCER_AVAILABILITY_HTTP_'+r.status);
  return await r.json() as unknown;
 }finally{clearTimeout(timer);}
}
async function batch<T>(items:T[],fn:(item:T)=>Promise<void>){
 let index=0;
 await Promise.all(Array.from({length:Math.min(MAX_CONCURRENCY,items.length)},async()=>{
  while(index<items.length)await fn(items[index++]);
 }));
}
const validId=(s:string)=>/^\d{1,15}$/.test(s);
const validLeague=(s:string)=>['eng.1','esp.1','ita.1','ger.1','fra.1'].includes(s);
/** One in-flight refresh per process. Failed validation never falls back
 * to the unfiltered historical snapshot.
 */
export function soccerEspnPlayerBoardHandler(clock:()=>Date=()=>new Date()){
 let cached:{at:number;value:unknown}|null=null;
 let active:Promise<unknown>|null=null;
 async function rebuild():Promise<unknown>{
  const now=clock().getTime();
  const raw=JSON.parse(readFileSync(resolve(process.cwd(),
   'docs/soccer_player_espn/board.json'),'utf8')) as Board;
  if(raw.schema!=='soccer-espn-rolling-player-board-v1'||raw.officialPicks!==0||
    !Array.isArray(raw.items)||!Number.isFinite(Date.parse(raw.generatedAtUtc))||
    now-Date.parse(raw.generatedAtUtc)>72*3600000)throw Error('SOCCER_BOARD_STALE');
  const upcoming=raw.items.filter(x=>x&&validLeague(x.league)&&
   validId(x.teamId)&&validId(x.playerId)&&validId(x.gameId)&&
   Date.parse(x.kickoffUtc)>now&&Date.parse(x.kickoffUtc)-now<=7*86400000);
  const teamKeys=new Map<string,{league:string;teamId:string}>();
  for(const p of upcoming){
   const key=p.league+'|'+p.teamId;
   teamKeys.set(key,{league:p.league,teamId:p.teamId});
  }
  const eligible=new Map<string,TeamEligibility>();
  await batch([...teamKeys].map(([key,ids])=>({key,...ids})),async(t)=>{
   try{
    const prefix=BASE+t.league+'/teams/'+t.teamId+'/';
    const [rosterRaw,injuryRaw]=await Promise.all([
     getJson(prefix+'roster'),getJson(prefix+'injuries')
    ]);
    const roster=currentSoccerRoster(rosterRaw,t.teamId);
    const unavailable=currentSoccerUnavailable(injuryRaw);
    eligible.set(t.key,roster&&unavailable?{roster,unavailable}:null);
   }catch{eligible.set(t.key,null);}
  });
  // Request actual game lineups only near kickoff. Do not convert a partial
  // roster, an old game box score, or unconfirmed team sheet into a starter.
  const fixtureKeys=new Map<string,{league:string;gameId:string;
    homeId:string;awayId:string;kickoff:number}>();
  const grouped=new Map<string,EspnOriginal[]>();
  for(const p of upcoming){
   const key=p.league+'|'+p.gameId;
   grouped.set(key,[...(grouped.get(key)||[]),p]);
  }
  for(const [key,players] of grouped){
   const kickoff=Date.parse(players[0].kickoffUtc);
   if(kickoff-now>3*3600000)continue;
   const teams=[...new Set(players.map(x=>x.teamId))];
   if(teams.length!==2)continue;
   fixtureKeys.set(key,{league:players[0].league,gameId:players[0].gameId,
    homeId:teams[0],awayId:teams[1],kickoff});
  }
  const confirmed=new Map<string,Record<string,Set<string>>|null>();
  await batch([...fixtureKeys],async([key,f])=>{
   try{
    const payload=await getJson(BASE+f.league+'/summary?event='+f.gameId);
    confirmed.set(key,confirmedSoccerStartingXI(payload,f.homeId,f.awayId));
   }catch{confirmed.set(key,null);}
  });
  const items:CurrentPlayer[]=[];
  let noCurrentRoster=0,knownOut=0,notStarting=0,unconfirmedNearKickoff=0;
  for(const p of upcoming){
   const team=eligible.get(p.league+'|'+p.teamId);
   if(!team||!team.roster.has(p.playerId)){noCurrentRoster++;continue;}
   if(team.unavailable.has(p.playerId)){knownOut++;continue;}
   const kickoff=Date.parse(p.kickoffUtc);
   const starters=confirmed.get(p.league+'|'+p.gameId);
   if(starters){
    if(!starters[p.teamId]?.has(p.playerId)){notStarting++;continue;}
    items.push({...p,currentEligibility:'STARTER_CONFIRMED'});
   }else if(kickoff-now<=90*60000){
    unconfirmedNearKickoff++;
   }else{
    items.push({...p,currentEligibility:'EARLY_ROSTER_ELIGIBLE'});
   }
  }
  return {...raw,generatedAtUtc:new Date(now).toISOString(),
   sourceForecastGeneratedAtUtc:raw.generatedAtUtc,
   status:items.length?'CURRENT_ELIGIBILITY_FILTERED':'NO_VERIFIED_ELIGIBLE_PLAYERS',
   verifiedAvailabilityCoverage:false,
   liveEligibilityCheckedAtUtc:new Date(now).toISOString(),
   participationFilter:{rosterCheckedTeams:[...eligible.values()].filter(Boolean).length,
    attemptedTeams:teamKeys.size,confirmedLineupFixtures:[...confirmed.values()].filter(Boolean).length,
    noCurrentRoster,knownOut,notStarting,unconfirmedNearKickoff},
   items};
 }
 return async(_req:Request,res:Response)=>{
  res.setHeader('Cache-Control','no-store');
  const ms=clock().getTime();
  if(cached&&ms-cached.at<5*60000)return res.json(cached.value);
  if(!active)active=rebuild();
  try{
   const value=await active;
   cached={at:clock().getTime(),value};
   return res.json(value);
  }catch(e){
   console.error('Soccer eligibility feed unavailable, failing closed:',String(e));
   return res.status(503).json({schema:'soccer-espn-rolling-player-board-v1',
    status:'LIVE_ELIGIBILITY_UNAVAILABLE',generatedAtUtc:clock().toISOString(),
    items:[],officialPicks:0});
  }finally{active=null;}
 };
}
