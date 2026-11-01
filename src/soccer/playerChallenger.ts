/** Soccer player-count research challenger.
 * No sportsbook targets, no post-fixture data, no inferred injuries.
 * Provider facts -> historical usage and shooting rates -> uncalibrated
 * pregame number distributions; independent first-seen validation required.
 */
import {wholeStatProjection} from '../lib/wholeStatProjection';
export type PlayerMatch={
 game_id:string;game_date:string;team_id:string;team:string;
 minutes:number;starter:boolean;shots:number;shots_on_target:number;
 xg:number|null;position:string|null;
};
export type PlayerHistory={player_id:string;games:PlayerMatch[]};
export type LineupEvidence={
 source:'STRIKERAPI_GET_LINEUPS';game_id:string;starts_at:string;
 observed_at:string;status:'CONFIRMED_STARTER'|'CONFIRMED_BENCH'|'UNKNOWN';
};
export type Availability='CONFIRMED_OUT'|'CONFIRMED_AVAILABLE'|'UNKNOWN';
export type PlayerForecast={
 playerId:string;fixtureDate:string;historyGames:number;
 startsInHistory:number;totalMinutes:number;
 predictedMinutes:number;predictedShots:number;predictedShotsOnTarget:number;
 predictedXg:number|null;
 historicalShotsPer90:number;historicalSotPer90:number;
 startProbability:number;playProbability:number;
 pShotsAtLeast3:number;pSotAtLeast1:number;
 /** Probability of reaching or exceeding the displayed numerical mean,
  * at the next integer observation; NOT a sportsbook betting target. */
 shotsReachCount:number;sotReachCount:number;
 pReachProjectedShots:number;pReachProjectedSot:number;
 /** Newly saved pregame exact-count research probabilities, no retrospective
  * rewriting of legacy original forecasts; old archives omit these. */
 pExactRoundedShots?:number;pExactRoundedSot?:number;
 baselineShots:number;baselineSot:number;
 lineupState:'CONFIRMED_STARTER'|'CONFIRMED_BENCH'|'UNKNOWN';
 availabilityState:Availability;
 status:'RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS';
};
const dateRe=/^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const validDate=(s:string)=>dateRe.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const good=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);
const num=(n:number,d=4)=>Number(n.toFixed(d));
const bound=(x:number,l:number,h:number)=>Math.max(l,Math.min(h,x));
const pPoissonAtLeast=(mean:number,k:number)=>{
 let p=Math.exp(-mean),cdf=p;
 for(let i=1;i<k;i++){p=p*mean/i;cdf+=p;}
 return bound(1-cdf,0,1);
};
const pPoissonExactly=(mean:number,k:number)=>{
 if(!Number.isInteger(k)||k<0||mean<0)return 0;
 let p=Math.exp(-mean);
 for(let i=1;i<=k;i++)p=p*mean/i;
 return bound(p,0,1);
};
const decay=(date:string,fixtureDate:string)=>Math.exp(
 -Math.log(2)*(Date.parse(fixtureDate+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/86400000/60);
export function parsePlayerMatchLog(raw:unknown):PlayerHistory {
 const doc=raw as Record<string,unknown>;
 if(!doc||typeof doc!=='object'||typeof doc.player_id!=='string'||!doc.player_id.trim()
   ||!Array.isArray(doc.games))throw Error('SOCCER_PLAYER_SOURCE_SHAPE');
 const ids=new Set<string>();
 const games:PlayerMatch[]=doc.games.map((r:unknown)=>{
   const x=r as Record<string,unknown>;
   if(!x||typeof x!=='object'||typeof x.game_id!=='string'||!x.game_id||
     typeof x.game_date!=='string'||!validDate(x.game_date)||
     typeof x.team_id!=='string'||!x.team_id||
     typeof x.team!=='string'||!x.team||typeof x.starter!=='boolean'||
     !good(x.minutes)||!Number.isInteger(x.minutes)||x.minutes<0||x.minutes>130||
     !good(x.shots)||!Number.isInteger(x.shots)||x.shots<0||x.shots>35||
     !good(x.shots_on_target)||!Number.isInteger(x.shots_on_target)||
     x.shots_on_target<0||x.shots_on_target>x.shots||
     (x.xg!==null&&x.xg!==undefined&&(!good(x.xg)||x.xg<0||x.xg>12))||
     (x.minutes===0&&(x.shots!==0||x.shots_on_target!==0)))
     throw Error('SOCCER_PLAYER_GAME_INCOMPLETE_OR_INVALID');
   if(ids.has(x.game_id))throw Error('SOCCER_PLAYER_DUPLICATE_GAME');
   ids.add(x.game_id);
   return {game_id:x.game_id,game_date:x.game_date,team_id:x.team_id,team:x.team,
    starter:x.starter,minutes:x.minutes,shots:x.shots,shots_on_target:x.shots_on_target,
    xg:good(x.xg)?x.xg:null,position:typeof x.position==='string'?x.position:null};
 });
 return {player_id:doc.player_id,games};
}
export function playerShotForecast(
 history:PlayerHistory,fixtureDate:string,opts:{
   teamId:string;availability:Availability;lineup?:LineupEvidence;
   asofUtc:string;fixtureGameId?:string;fixtureKickoffUtc?:string;
 }):PlayerForecast|null {
 const asof=new Date(opts.asofUtc);
 if(!validDate(fixtureDate)||!Number.isFinite(asof.getTime())||
   asof.toISOString()!==opts.asofUtc||
   (opts.fixtureKickoffUtc?(
     !Number.isFinite(Date.parse(opts.fixtureKickoffUtc))||
     new Date(opts.fixtureKickoffUtc).toISOString()!==opts.fixtureKickoffUtc||
     opts.fixtureKickoffUtc.slice(0,10)!==fixtureDate||
     Date.parse(opts.fixtureKickoffUtc)-asof.getTime()<15*60_000
   ):fixtureDate<=asof.toISOString().slice(0,10)))
   throw Error('SOCCER_PLAYER_NOT_VERIFIED_PREGAME_DATE');
 if(opts.availability==='CONFIRMED_OUT')return null;
 if(!['UNKNOWN','CONFIRMED_AVAILABLE','CONFIRMED_OUT'].includes(opts.availability)||
    typeof opts.teamId!=='string'||!opts.teamId)
   throw Error('SOCCER_PLAYER_INVALID_AVAILABILITY');
 const lineup=opts.lineup;
 if(lineup&&(lineup.game_id!==opts.fixtureGameId||
    !Number.isFinite(Date.parse(lineup.starts_at))||
    !Number.isFinite(Date.parse(lineup.observed_at))||
    Date.parse(lineup.observed_at)>asof.getTime()||
    Date.parse(lineup.starts_at)<=asof.getTime()||
    !['CONFIRMED_STARTER','CONFIRMED_BENCH','UNKNOWN'].includes(lineup.status)))
   throw Error('SOCCER_PLAYER_UNVERIFIED_LINEUP_TIMING');
 // Exact team ID and strictly earlier dates; old-team/transfer minutes
 // cannot silently contaminate current-club usage.
 const rows=history.games.filter(g=>g.game_date<fixtureDate&&
    g.game_date<asof.toISOString().slice(0,10)&&g.team_id===opts.teamId&&
    g.game_id!==opts.fixtureGameId).sort((a,b)=>b.game_date.localeCompare(a.game_date))
    .slice(0,25);
 const appearances=rows.filter(g=>g.minutes>0);
 const totalMinutes=appearances.reduce((s,g)=>s+g.minutes,0);
 if(rows.length<6||appearances.length<5||totalMinutes<350)return null;
 const weighted=rows.map(g=>({g,w:decay(g.game_date,fixtureDate)}));
 const exposure=weighted.reduce((s,x)=>s+x.w*x.g.minutes,0);
 const attempts=weighted.reduce((s,x)=>s+x.w*x.g.shots,0);
 const onTarget=weighted.reduce((s,x)=>s+x.w*x.g.shots_on_target,0);
 // Provider xG is periodically recomputed using future seasons. It cannot
 // be used as a leak-safe historical feature until we fit a point-in-time xG
 // model from training-period-only shot locations. Preserve raw coverage for
 // an independent audit, but do not use provider xG in forecasts.
 // Neutral Gamma-Beta shrinkage prevents 1 standout game dominating a
 // newly promoted player; fixed priors must beat honest blind baselines.
 const shotRate90=(attempts+2.4)/(exposure/90+1.5);
 const sotFraction=(onTarget+1.2)/(attempts+3);
 const startWeighted=weighted.reduce((s,x)=>s+x.w*Number(x.g.starter),0);
 const gameWeighted=weighted.reduce((s,x)=>s+x.w,0);
 let pStart=(startWeighted+1.5)/(gameWeighted+2.5);
 let pPlay=bound(appearances.length/(rows.length+1)*.9+.07,.05,.96);
 const starterMinutes=weighted.filter(x=>x.g.starter&&x.g.minutes>0);
 const subMinutes=weighted.filter(x=>!x.g.starter&&x.g.minutes>0);
 const mean=(items:typeof weighted,prior:number)=>{
   const n=items.reduce((s,x)=>s+x.w,0);
   return (items.reduce((s,x)=>s+x.w*x.g.minutes,0)+prior*1.5)/(n+1.5);
 };
 let minStart=mean(starterMinutes,77),minSub=mean(subMinutes,25);
 const lineupState=lineup?.status??'UNKNOWN';
 if(lineupState==='CONFIRMED_STARTER'){pStart=1;pPlay=1;}
 if(lineupState==='CONFIRMED_BENCH'){pStart=0;pPlay=1;}
 const expectedMinutes=bound(
   pPlay*(pStart*minStart+(1-pStart)*minSub),0,100);
 const expectedShots=shotRate90*expectedMinutes/90;
 const expectedSot=expectedShots*sotFraction;
 // Probability is a zero-inflated mixture of DNP / starter / substitute
 // states, NOT a Poisson at the marginal (play-weighted) point estimate.
 // The marginal mean remains the numerical stat projection.
 const lambdaStarter=shotRate90*minStart/90;
 const lambdaSub=shotRate90*minSub/90;
 const shots3=pPlay*(pStart*pPoissonAtLeast(lambdaStarter,3)
   +(1-pStart)*pPoissonAtLeast(lambdaSub,3));
 const sot1=pPlay*(pStart*pPoissonAtLeast(lambdaStarter*sotFraction,1)
   +(1-pStart)*pPoissonAtLeast(lambdaSub*sotFraction,1));
 const shotsReachCount=Math.max(1,Math.ceil(expectedShots));
 const sotReachCount=Math.max(1,Math.ceil(expectedSot));
 const exactCount=(k:number,fraction:number)=>{
   const played=pPlay*(pStart*pPoissonExactly(lambdaStarter*fraction,k)+
     (1-pStart)*pPoissonExactly(lambdaSub*fraction,k));
   return k===0?1-pPlay+played:played;
 };
 const pExactRoundedShots=exactCount(wholeStatProjection(expectedShots),1);
 const pExactRoundedSot=exactCount(wholeStatProjection(expectedSot),sotFraction);
 const reach=(k:number,fraction:number)=>pPlay*(
   pStart*pPoissonAtLeast(lambdaStarter*fraction,k)+
   (1-pStart)*pPoissonAtLeast(lambdaSub*fraction,k));
 const expectedXg:null=null; // XG_FEATURE_BLOCKED_POSTHOC_PROVIDER_REVALUE
 // Poisson thinning is only a research approximation: these p-values
 // are not calibrated against unseen first-seen outcomes.
 return {playerId:history.player_id,fixtureDate,historyGames:rows.length,
   startsInHistory:rows.filter(g=>g.starter).length,totalMinutes,
   predictedMinutes:num(expectedMinutes),predictedShots:num(expectedShots),
   predictedShotsOnTarget:num(expectedSot),predictedXg:expectedXg,
   historicalShotsPer90:num(attempts/(exposure/90)),
   historicalSotPer90:num(onTarget/(exposure/90)),
   startProbability:num(pStart),playProbability:num(pPlay),
   pShotsAtLeast3:num(shots3),
   pSotAtLeast1:num(sot1),
   shotsReachCount,sotReachCount,
   pReachProjectedShots:num(reach(shotsReachCount,1)),
   pReachProjectedSot:num(reach(sotReachCount,sotFraction)),
   pExactRoundedShots:num(pExactRoundedShots),
   pExactRoundedSot:num(pExactRoundedSot),
   baselineShots:num(rows.slice(0,10).reduce((s,g)=>s+g.shots,0)/Math.min(rows.length,10)),
   baselineSot:num(rows.slice(0,10).reduce((s,g)=>s+g.shots_on_target,0)/Math.min(rows.length,10)),
   lineupState,availabilityState:opts.availability,
   status:'RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS'};
}
export function forwardPlayerShadow(history:PlayerHistory,teamId:string){
 // Walk-forward includes only games with at least six older league/team
 // records; the current outcome is NOT included in input.
 const rows=history.games.filter(g=>g.team_id===teamId).sort((a,b)=>
  a.game_date.localeCompare(b.game_date)||a.game_id.localeCompare(b.game_id));
 const items:{date:string;shotsError:number;sotError:number;baselineShotsError:number;
   baselineSotError:number}[]=[];
 for(const g of rows){
   if(g.minutes<=0)continue; // track DNP separately from an eligible played result
   const date=new Date(g.game_date+'T00:00:00Z');
   const yesterday=new Date(date.getTime()-86400000).toISOString();
   const prior:PlayerHistory={...history,games:rows.filter(r=>r.game_date<g.game_date)};
   const pred=playerShotForecast(prior,g.game_date,{teamId,availability:'UNKNOWN',
     asofUtc:yesterday,fixtureGameId:g.game_id});
   if(!pred)continue;
   items.push({date:g.game_date,shotsError:Math.abs(pred.predictedShots-g.shots),
     sotError:Math.abs(pred.predictedShotsOnTarget-g.shots_on_target),
     baselineShotsError:Math.abs(pred.baselineShots-g.shots),
     baselineSotError:Math.abs(pred.baselineSot-g.shots_on_target)});
 }
 const avg=(k:keyof typeof items[number])=>items.length?
   num(items.reduce((s,r)=>s+(r[k] as number),0)/items.length):null;
 return {status:'RETROSPECTIVE_TIME_ORDERED_SHADOW_NOT_FROZEN_FIRSTSEEN',
  playerId:history.player_id,teamId,n:items.length,
  shotsMAE:avg('shotsError'),baselineShotsMAE:avg('baselineShotsError'),
  sotMAE:avg('sotError'),baselineSotMAE:avg('baselineSotError'),
  noModelPromotion:true,rows:items};
}
