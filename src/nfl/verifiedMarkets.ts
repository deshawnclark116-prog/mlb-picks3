import {normalizePlayer} from './bettable';
import type {ExistingNflGame,ExistingYardProjection} from './existing';

export interface NflLiveQuote {
 player:string;market:'rushing_yards'|'receiving_yards';line:number;
 over_price:number;under_price:number;book:string;
 market_updated_at_utc:string;home:string;away:string;kickoff_utc:string;
}
export interface LiveMarketResponse{
 status:string;lines:NflLiveQuote[];book?:string;checked_at_utc?:string;
}
export type MarketSelection={
 projection:ExistingYardProjection;
 quote:NflLiveQuote;
 side:'OVER'|'UNDER';odds:number;
};
const TIER={HIGH:3,MEDIUM:2,LOW:1} as const;
const isPrice=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)&&
  (n>=100||n<=-100)&&Math.abs(n)<=20000;
const time=(n:unknown):number=>typeof n==='string'?Date.parse(n):NaN;

/** The only players permitted on actionable existing-model export.
 * Require a live exactly matched sportsbook offer on the correct game,
 * market, player, kickoff AND both sides of the same point. An offered market
 * does not prove starting lineup, nor a calibrated probability of winning.
 */
export function verifiedNflSelections(
 game:ExistingNflGame,market:LiveMarketResponse|null,now=Date.now(),limit=6
):MarketSelection[]{
 if(!Number.isInteger(limit)||limit<1||limit>24)throw new Error('invalid export limit');
 if(market?.status!=='VERIFIED_QUOTES'||!Array.isArray(market.lines)||
    !game.home||!game.away||!Number.isFinite(time(market.checked_at_utc))||
    now-time(market.checked_at_utc)<0||now-time(market.checked_at_utc)>10*60000||
    time(game.kickoff_utc)<=now)return [];
 const byPlayer=new Map<string,NflLiveQuote[]>();
 for(const q of market.lines){
  if(!q||q.book!=='fanduel'||q.home!==game.home||q.away!==game.away||
     time(q.kickoff_utc)!==time(game.kickoff_utc)||
     !['rushing_yards','receiving_yards'].includes(q.market)||
     !Number.isFinite(q.line)||q.line<0||
     !isPrice(q.over_price)||!isPrice(q.under_price)||
     !Number.isFinite(time(q.market_updated_at_utc))||
     now-time(q.market_updated_at_utc)<0||now-time(q.market_updated_at_utc)>30*60000||
     typeof q.player!=='string'||!normalizePlayer(q.player))continue;
  const key=normalizePlayer(q.player)+'|'+q.market;
  byPlayer.set(key,[...(byPlayer.get(key)||[]),q]);
 }
 const selections:MarketSelection[]=[];
 for(const p of game.projections){
  const matches=byPlayer.get(normalizePlayer(p.player)+'|'+p.market)||[];
  if(matches.length!==1 || !Number.isFinite(p.projected_median))continue;
  const quote=matches[0];
  if(p.projected_median===quote.line)continue;
  const side=p.projected_median>quote.line?'OVER':'UNDER';
  selections.push({projection:p,quote,side,odds:side==='OVER'?quote.over_price:quote.under_price});
 }
 return selections.sort((a,b)=>{
   const conf=(x:MarketSelection)=>x.projection.confidence?TIER[x.projection.confidence]:0;
   return conf(b)-conf(a)||
     (b.projection.games_played||0)-(a.projection.games_played||0)||
     a.projection.player.localeCompare(b.projection.player)||a.quote.market.localeCompare(b.quote.market);
 }).slice(0,limit);
}
