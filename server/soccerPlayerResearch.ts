/** Opt-in, credit-capped player-stat provider adapter; unavailable without key.
 * All player predictions remain research-only and must never be displayed as bets.
 */
import {createHash} from 'node:crypto';
import type {Request,Response} from 'express';
import {parsePlayerMatchLog,playerShotForecast,type LineupEvidence} from '../src/soccer/playerChallenger';
type Config={key?:string;allowlist:string[];fetcher?:typeof fetch;clock?:()=>Date;
 maxProviderCallsPerDay?:number};
const validId=(s:unknown):s is string=>typeof s==='string'&&/^[0-9A-Za-z_-]{1,40}$/.test(s);
const validDay=(s:unknown):s is string=>typeof s==='string'&&/^20\d\d-\d\d-\d\d$/.test(s)&&
 Number.isFinite(Date.parse(s+'T00:00:00Z'))&&
 new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
type SourceResult={json:Record<string,unknown>;sha:string;captured:string};
export function soccerPlayerResearchHandler(config:Config){
 const whitelist=new Set(config.allowlist.filter(validId));
 const fetcher=config.fetcher??fetch,clock=config.clock??(()=>new Date());
 const quota=Math.min(4,Math.max(1,config.maxProviderCallsPerDay??2));
 const daily=new Map<string,number>();
 const cache=new Map<string,{expires:number;result:SourceResult}>();
 const inFlight=new Map<string,Promise<SourceResult>>();
 let lockedUntil=0;
 async function source(endpoint:'get_player_games'|'get_lineups',body:Record<string,unknown>,
  now:Date):Promise<SourceResult>{
  const k=endpoint+'|'+JSON.stringify(body),cached=cache.get(k);
  if(cached&&cached.expires>now.getTime())return cached.result;
  if(inFlight.has(k))return inFlight.get(k)!;
  const pending=(async()=>{
   if(!config.key||lockedUntil>now.getTime())
    throw Error('SOCCER_PROVIDER_UNAVAILABLE_OR_QUOTA_LOCKED');
   const d=now.toISOString().slice(0,10),used=daily.get(d)??0;
   if(used>=quota)throw Error('SOCCER_PROVIDER_DAILY_CREDIT_GUARD');
   daily.set(d,used+1);
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
   try{
    const res=await fetcher('https://mcp.strikerapi.com/v1/'+endpoint,{
     method:'POST',headers:{'Content-Type':'application/json','x-api-key':config.key},
     body:JSON.stringify(body),signal:controller.signal});
    if(res.status===429){lockedUntil=now.getTime()+86400000;
      throw Error('SOCCER_PROVIDER_429_QUOTA_LOCK');}
    if(!res.ok)throw Error('SOCCER_PROVIDER_HTTP_'+res.status);
    const text=await res.text();
    if(text.length<30||text.length>1_500_000)throw Error('SOCCER_PROVIDER_RESPONSE_SIZE');
    const json=JSON.parse(text) as Record<string,unknown>;
    if(json.error)throw Error('SOCCER_PROVIDER_ERROR_RESPONSE');
    const result={json,sha:hash(text),captured:now.toISOString()};
    cache.set(k,{expires:now.getTime()+6*3600_000,result});
    return result;
   }finally{clearTimeout(timer);}
  })();
  inFlight.set(k,pending);
  try{return await pending;}finally{inFlight.delete(k);}
 }
 return async(req:Request,res:Response)=>{
  res.setHeader('Cache-Control','no-store');
  const q=req.query as Record<string,unknown>;
  const id=q.playerId,team=q.teamId,game=q.gameId,date=q.date;
  const now=clock();
  if(!validId(id)||!validId(team)||!validDay(date)||
   (game!==undefined&&!validId(game)))
   return res.status(400).json({status:'INVALID_PLAYER_QUERY',officialPicks:0});
  if(!config.key||!whitelist.has(id))
   return res.status(503).json({status:'NOT_CONNECTED_OR_ALLOWLISTED',officialPicks:0});
  if(date<=now.toISOString().slice(0,10))
   return res.status(422).json({status:'NOT_VERIFIED_PREMATCH_DATE',officialPicks:0});
  try{
   const p=await source('get_player_games',{player_id:id,limit:30},now);
   const history=parsePlayerMatchLog(p.json);
   if(history.player_id!==id)throw Error('SOCCER_PLAYER_ID_MISMATCH');
   let lineup:LineupEvidence|undefined,receipt:string|null=null;
   if(game){
    try{
     const l=await source('get_lineups',{game_id:game},now);
     const meta=l.json.game as Record<string,unknown>|undefined;
     if(meta?.game_id!==game)throw Error('SOCCER_LINEUP_GAME_ID_MISMATCH');
     const starts=typeof meta.starts_at==='string'?meta.starts_at:'';
     if(meta.date===date&&Number.isFinite(Date.parse(starts))&&Date.parse(starts)>now.getTime()){
      const teams=Array.isArray(l.json.lineups)?l.json.lineups:[];
      const matches=teams.filter(x=>x&&typeof x==='object'&&
        (x as Record<string,unknown>).team_id===team);
      if(matches.length>1)throw Error('SOCCER_LINEUP_TEAM_COLLISION');
      const record=(matches[0]??{}) as Record<string,unknown>;
      const xi=Array.isArray(record.starting_xi)?record.starting_xi:[];
      const bench=Array.isArray(record.unused_substitutes)?record.unused_substitutes:[];
      const has=(v:unknown)=>v&&typeof v==='object'&&
        (v as Record<string,unknown>).player_id===id;
      const state=xi.some(has)?'CONFIRMED_STARTER':
       (xi.length>=11&&bench.some(has)?'CONFIRMED_BENCH':'UNKNOWN');
      lineup={source:'STRIKERAPI_GET_LINEUPS',game_id:game as string,
       starts_at:starts,observed_at:l.captured,status:state};
      receipt=l.sha;
     }
    }catch(e){
     if(e instanceof Error&&/QUOTA|MISMATCH|COLLISION/.test(e.message))throw e;
     // No lineup verified means UNKNOWN, not OUT.
    }
   }
   const forecast=playerShotForecast(history,date,{
    teamId:team as string,fixtureGameId:game as string|undefined,
    asofUtc:now.toISOString(),availability:'UNKNOWN',lineup});
   if(!forecast)return res.json({status:'INSUFFICIENT_REAL_HISTORY',
    playerId:id,teamId:team,lineupState:lineup?.status??'UNKNOWN',
    historySha256:p.sha,officialPicks:0});
   return res.json({schema:'soccer-player-shadow-v1',status:'UNVALIDATED_RESEARCH',
    asofUtc:now.toISOString(),source:'StrikerAPI',
    historySha256:p.sha,lineupSha256:receipt,
    injuryCoverage:'NOT_CONNECTED',playerId:id,teamId:team,officialPicks:0,
    forecast});
  }catch(e){return res.status(503).json({status:'SOCCER_PLAYER_DATA_UNAVAILABLE',
   reason:e instanceof Error?e.message:'Provider failed',officialPicks:0});}
 };
}
