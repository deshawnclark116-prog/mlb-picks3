/** Player board is an opt-in guarded research pilot.
 * Uses original player model output, never invents player data or bookmaker lines.
 */
import type {Request,Response} from 'express';
import type {PlayerForecast} from '../src/soccer/playerChallenger';
type Fixture={playerId:string;playerName:string;teamId:string;teamName:string;opponent:string;date:string;gameId?:string};
const validId=(s:unknown)=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,40}$/.test(s);
const validName=(s:unknown)=>typeof s==='string'&&s.trim().length>=2&&s.length<=90;
const validDay=(s:unknown)=>typeof s==='string'&&/^20\d\d-\d\d-\d\d$/.test(s)&&
 Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function parseSoccerPlayerCohort(raw:string|undefined):Fixture[]{
 if(!raw)return [];
 const data:unknown=JSON.parse(raw);
 if(!Array.isArray(data)||data.length>12)throw Error('INVALID_SOCCER_COHORT_SIZE');
 const seen=new Set<string>();
 return data.map(x=>{
   const f=x as Fixture;
   if(!f||!validId(f.playerId)||!validId(f.teamId)||!validName(f.playerName)||
      !validName(f.teamName)||!validName(f.opponent)||!validDay(f.date)||
      (f.gameId!==undefined&&!validId(f.gameId)))throw Error('INVALID_SOCCER_COHORT_FIXTURE');
   const k=f.playerId+'|'+f.date;
   if(seen.has(k))throw Error('DUPLICATE_SOCCER_COHORT_PLAYER');
   seen.add(k);return f;
 });
}
type ResearchHandler=(req:Request,res:Response)=>Promise<unknown>;
export function soccerPlayerBoardHandler(config:{
 cohort:Fixture[];providerConfigured:boolean;allowlist:string[];
 researchHandler:ResearchHandler;clock?:()=>Date;
}){
 const now=config.clock??(()=>new Date());
 const allowed=new Set(config.allowlist);
 let cached:{at:number;value:unknown}|null=null;
 let active:Promise<unknown>|null=null;
 return async(_req:Request,res:Response)=>{
  res.setHeader('Cache-Control','no-store');
  if(!config.providerConfigured||!config.cohort.length)return res.json({
   schema:'soccer-player-board-v1',status:'PLAYER_FEED_NOT_CONNECTED',items:[],
   officialPicks:0,calibrated:false});
  if(cached&&now().getTime()-cached.at<10*60*1000)return res.json(cached.value);
  if(active)return res.json(await active);
  active=(async()=>{
   const today=now().toISOString().slice(0,10);
   const items:unknown[]=[];
   // A single allowlisted pilot per invocation. Existing individual handler
   // independently enforces 2 provider calls/day and its six-hour cache.
   for(const fixture of config.cohort.filter(f=>f.date>today&&allowed.has(f.playerId)).slice(0,1)){
     let code=200;let payload:unknown;
     const response={setHeader(){return this;},status(n:number){code=n;return this;},
       json(x:unknown){payload=x;return this;}} as unknown as Response;
     try{await config.researchHandler({query:{
       playerId:fixture.playerId,teamId:fixture.teamId,date:fixture.date,
       ...(fixture.gameId?{gameId:fixture.gameId}:{})
     }} as unknown as Request,response);}
     catch{continue;}
     const d=payload as Record<string,unknown>|undefined;
     if(code!==200||!d||d.schema!=='soccer-player-shadow-v1'||
       d.status!=='UNVALIDATED_RESEARCH'||d.playerId!==fixture.playerId||
       d.teamId!==fixture.teamId||
       typeof d.historySha256!=='string'||!/^[a-f0-9]{64}$/.test(d.historySha256))continue;
     const f=d.forecast as PlayerForecast|undefined;
     if(!f||f.playerId!==fixture.playerId||f.fixtureDate!==fixture.date||
       f.status!=='RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS'||
       ![f.predictedMinutes,f.predictedShots,f.predictedShotsOnTarget,
         f.pReachProjectedShots,f.pReachProjectedSot].every(x=>Number.isFinite(x)&&x>=0)||
       f.pReachProjectedShots>1||f.pReachProjectedSot>1||
       f.shotsReachCount!==Math.max(1,Math.ceil(f.predictedShots))||
       f.sotReachCount!==Math.max(1,Math.ceil(f.predictedShotsOnTarget)))continue;
     items.push({id:fixture.playerId+'|'+fixture.date,
       playerId:fixture.playerId,playerName:fixture.playerName,
       teamName:fixture.teamName,opponent:fixture.opponent,
       fixtureDate:fixture.date,source:'AUTHORIZED_PLAYER_MATCH_LOG',
       identityLabel:'ADMIN_COHORT_NOT_PROVIDER_ATTESTED',
       historySha256:d.historySha256,forecast:f});
   }
   const value={schema:'soccer-player-board-v1',
     status:items.length?'RESEARCH_PLAYER_FORECASTS':'NO_VERIFIED_PLAYER_FORECASTS',
     items,officialPicks:0,calibrated:false};
   cached={at:now().getTime(),value};return value;
  })();
  try{return res.json(await active);}finally{active=null;}
 };
}
