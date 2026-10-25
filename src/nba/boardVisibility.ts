/** Schedule-first NBA pick presentation.
 * A verified game with zero qualifying selections MUST remain on the board.
 * Publishing an original projection and qualifying it as a pick are separate
 * decisions. Querying for a player/team may narrow the displayed games, but
 * market filters never disguise the day's full scheduled slate.
 */
import {MARKETS_NAMED,type NbaMarket,type NbaSystemGame} from './decisionBoard.ts';
export type NbaGameDateChoice='TODAY'|'ALL'|string;
export function nbaEasternGameDay(iso:string){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
  timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(new Date(iso)).map(p=>[p.type,p.value]));
 return parts.year+'-'+parts.month+'-'+parts.day;
}
export function visibleNbaGameSlate(
 games:readonly NbaSystemGame[],selectedDate:NbaGameDateChoice,
 todayET:string,market:'ALL'|NbaMarket='ALL',search=''
):NbaSystemGame[]{
 const q=search.trim().toLowerCase();
 const targetDate=selectedDate==='TODAY'?todayET:selectedDate;
 return games.filter(g=>selectedDate==='ALL'||
  nbaEasternGameDay(g.tipoff_utc)===targetDate).map(g=>{
   const fullMatch=(g.away+' '+g.home+' '+g.game_id).toLowerCase().includes(q);
   return {
     ...g,
     picks:g.picks.filter(p=>(market==='ALL'||p.market===market)&&
       (!q||fullMatch||
         (p.player+' '+MARKETS_NAMED[p.market]).toLowerCase().includes(q)))
   };
 }).filter(g=>!q||
   (g.away+' '+g.home+' '+g.game_id).toLowerCase().includes(q)||
   g.picks.length>0);
}
