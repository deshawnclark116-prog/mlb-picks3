/** Attach only real frozen V2 SOG counts as a separate market.
 * A P(points >= 1) classifier can NEVER determine E[points], E[shots], or
 * a median: these forecasts use the distinct original NHL V2 count ledger.
 */
import type {UnifiedGame,UnifiedPick} from '../components/UnifiedSportGameCards';

export interface NhlSogCount {
 game_id:string;player_id:string;player:string;team:string;opponent:string;
 game_date:string;scheduled_start:string;
 mean:number;median:number;sd:number;p10:number;p90:number;
 forecast_horizon:string;source_generated_at:string;source_cutoff_at:string;
 research_only:true;not_an_official_betting_prediction:true;
}
export interface NhlSogResearch {
 schema:'NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1';game_date:string;
 research_only:true;not_an_official_betting_board:true;
 projected_count:number;projections:NhlSogCount[];
}
export const NHL_COUNT_SCHEMA='NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1';
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const stamp=(value:string)=>Date.parse(value);
const match=(a:UnifiedGame,p:NhlSogCount)=> {
 const sides=a.label.split(' vs ').map(x=>x.trim().toUpperCase());
 return sides.length===2&&sides.includes(p.team)&&sides.includes(p.opponent)&&
   stamp(a.when||'')===stamp(p.scheduled_start);
};
export function addTrueNhlShotCounts(games:UnifiedGame[],source:NhlSogResearch|null){
 if(source===null)return games;
 if(source.schema!==NHL_COUNT_SCHEMA||source.research_only!==true||
    source.not_an_official_betting_board!==true||
    !Array.isArray(source.projections)||source.projected_count<source.projections.length)
   throw Error('UNVERIFIED_SOG_RESEARCH_CLIENT_PAYLOAD');
 const seen=new Set<string>();
 const list:UnifiedPick[]=[];
 const named:NhlSogCount[]=[];
 for(const p of source.projections){
   if(p.research_only!==true||p.not_an_official_betting_prediction!==true||
      !p.player||!p.game_id||!p.player_id||
      p.game_date!==source.game_date||
      !finite(p.mean)||!finite(p.median)||p.mean<0||p.median<0||
      !(stamp(p.source_generated_at)<=stamp(p.source_cutoff_at)&&
        stamp(p.source_cutoff_at)<stamp(p.scheduled_start)))
       throw Error('INVALID_INDEPENDENT_NHL_COUNT_RESEARCH_ROW');
   const id=p.game_id+'|'+p.player_id;
   if(seen.has(id))throw Error('DUPLICATE_INDEPENDENT_NHL_COUNT');
   seen.add(id);
   named.push(p);
   list.push({
      id:'NHL-V2-SOG-'+id,
      player:p.player,team:p.team,market:'shots_on_goal',
      target:'NO VERIFIED SPORTSBOOK SHOT LINE',
      modelProbability:null,
      prediction:p.mean,predictionKind:'mean',unit:'shots',
      source:'Frozen original NHL V2 SOG count research · '+p.forecast_horizon,
      detail:'Numerical median '+p.median+' shots · P10–P90 '+p.p10+'–'+p.p90+
       '. Player dressed/ice-time role not independently verified. Research only.'
   });
 }
 // No guesses about opponent/team or date: each frozen shot-count forecast
 // must match a real published matchup/clock exactly before the app shows it.
 return games.map(game=>{
    const additions=list.filter((_,i)=>match(game,named[i]));
    return additions.length?{...game,
       sourceLabel:'NHL REAL V2 SOG COUNT + SEPARATE POINTS CLASSIFIER · RESEARCH',
       picks:[...additions,...game.picks]}:game;
 });
}
