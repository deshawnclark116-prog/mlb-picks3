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
 model_probability_milestones_research_only?:Record<'1'|'2'|'3'|'4'|'5',number>;
 model_probability_forward_calibrated?:false;
 probability_not_an_official_bet?:true;
 research_only:true;not_an_official_betting_prediction:true;
}
export interface NhlSogResearch {
 schema:'NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1';game_date:string;
 research_only:true;not_an_official_betting_board:true;
 source_has_original_hash_chain?:true;
 source_snapshot_commit_sha?:string;source_ledger_sha256?:string;
 projected_count:number;projections:NhlSogCount[];
}
export const NHL_COUNT_SCHEMA='NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1';
/** Original NHL V2 survival CDF, not a sportsbook or validated odds quote. */
export function selectNhlShotMilestoneResearch(p:NhlSogCount){
 const probabilities=p.model_probability_milestones_research_only;
 if(!probabilities||p.model_probability_forward_calibrated!==false||
    p.probability_not_an_official_bet!==true)return null;
 const values=[1,2,3,4,5].map(k=>probabilities[String(k) as '1'|'2'|'3'|'4'|'5']);
 if(values.some((v,i)=>typeof v!=='number'||!Number.isFinite(v)||
      v<0||v>1||(i>0&&v>values[i-1]+.002)))
    throw Error('NHL_SHOT_MILESTONE_CDF_FAILED_SURVIVAL_INVARIANT');
 const chosen=([2,3,4,5] as const).filter(k=>
   probabilities[String(k) as '2'|'3'|'4'|'5']>=.65).at(-1);
 return chosen?{milestone:chosen,
   model_probability:probabilities[String(chosen) as '2'|'3'|'4'|'5']}:null;
}

/** A stale/missing POINTS-classifier day must not suppress real shot-count
 * research on the current NHL date. Use Eastern game dates, never UTC date.
 * An explicitly future classifier slate still selects its own future date.
 */
export function nhlCountGameDate(classifierGameDate:string|null,now:Date=new Date()):string{
 if(!Number.isFinite(now.getTime()))throw Error('NHL_INVALID_CLOCK');
 const parts=new Intl.DateTimeFormat('en-US',{
   timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(now);
 const get=(part:string)=>parts.find(x=>x.type===part)?.value;
 const today=get('year')+'-'+get('month')+'-'+get('day');
 // Around 8–11:59 PM ET the UTC date is already TOMORROW.
 // The NHL still has active North American games. Never auto-jump an
 // evening view to tomorrow solely because an upstream server used UTC.
 const localHour=Number(new Intl.DateTimeFormat('en-US',{
   timeZone:'America/New_York',hour:'2-digit',hourCycle:'h23'
 }).format(now));
 if(classifierGameDate && /^20\d{2}-\d{2}-\d{2}$/.test(classifierGameDate) &&
    Number.isFinite(Date.parse(classifierGameDate+'T00:00:00Z')) &&
    classifierGameDate>=today){
   if(classifierGameDate>today&&(localHour>=18||localHour<5))
     return today;
   return classifierGameDate;
 }
 return today;
}

/** The live publisher can correctly be on tomorrow while late US evening
 * games are still active. Both source-verified slates must remain accessible:
 * today first and the separately sourced upcoming day second. DO NOT relabel
 * any forecast date or attach a player to the wrong game.
 */
export function nhlDisplayGameDates(classifierGameDate:string|null,now:Date=new Date()):string[]{
 const current=nhlCountGameDate(classifierGameDate,now);
 if(classifierGameDate&&/^20\d{2}-\d{2}-\d{2}$/.test(classifierGameDate)){
   const ahead=Date.parse(classifierGameDate+'T00:00:00Z')-
       Date.parse(current+'T00:00:00Z');
   if(ahead>0&&ahead<=2*86400000)return [current,classifierGameDate];
 }
 return [current];
}

export function nhlVisibleGames(count:number,loading:boolean,legacyError:string|null):'loading'|'error'|'games'|'empty' {
 if(count>0)return 'games';
 if(loading)return 'loading';
 if(legacyError)return 'error';
 return 'empty';
}

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
   const modelMilestone=selectNhlShotMilestoneResearch(p);
   list.push({
      id:'NHL-V2-SOG-'+id,
      player:p.player,team:p.team,market:'shots_on_goal',
      target:modelMilestone?
       'MODEL EVENT '+modelMilestone.milestone+'+ SHOTS · UNVALIDATED RESEARCH':
       'NO VERIFIED SPORTSBOOK SHOT LINE',
      modelProbability:modelMilestone?.model_probability??null,
      prediction:p.mean,predictionKind:'mean',unit:'shots',
      source:'Locked NHL V2 SOG count distribution · '+p.forecast_horizon,
      detail:'Numerical median '+p.median+' shots · P10–P90 '+p.p10+'–'+p.p90+
       '. Model P(shots milestone), if displayed, is raw CDF research, NOT prospectively calibrated, certified active, a bookmaker line, or an official betting pick.'
   });
 }
 // Frozen shot-count forecasts are a valid independent research feed:
 // they MUST NOT depend on an unrelated fixed-line POINTS classifier game
 // existing. Match existing cards by exact teams/clock when possible; then
 // create a separate game from the *source's* game_id/teams/clock. Never
 // invent a fixture, duplicate a game, infer a point count or add a book.
 const assigned=new Set<string>();
 const attached=games.map(game=>{
   const additions=list.filter((_,i)=>match(game,named[i]));
   additions.forEach(p=>assigned.add(p.id));
   return additions.length?{...game,
      sourceLabel:'NHL REAL V2 SOG COUNT + SEPARATE POINTS CLASSIFIER · RESEARCH',
      picks:[...additions,...game.picks]}:game;
 });
 const missing=new Map<string,{game_id:string;when:string;teams:string;label:string;picks:UnifiedPick[]}>();
 for(let i=0;i<named.length;i++){
   const p=named[i],pick=list[i];
   if(assigned.has(pick.id))continue;
   const teams=[p.team,p.opponent].sort().join('|');
   const existing=missing.get(p.game_id);
   if(existing && (existing.when!==p.scheduled_start||existing.teams!==teams))
     throw Error('NHL_SOURCE_GAME_ID_TEAM_OR_KICKOFF_CONFLICT');
   if(existing)existing.picks.push(pick);
   else missing.set(p.game_id,{
     game_id:p.game_id,when:p.scheduled_start,teams,
     label:p.team+' vs '+p.opponent,picks:[pick]
   });
 }
 const independent:UnifiedGame[]=[...missing.values()].map(g=>({
   id:'NHL-FROZEN-COUNT-'+g.game_id,label:g.label,when:g.when,
   subtitle:source.game_date,
   sourceLabel:'NHL ORIGINAL FROZEN V2 SOG COUNT · RESEARCH ONLY',
   picks:g.picks
 }));
 return [...attached,...independent].sort((a,b)=>
   (a.when||'9999').localeCompare(b.when||'9999')||a.label.localeCompare(b.label));

}
