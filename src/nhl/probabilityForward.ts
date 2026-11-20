/** NHL first-seen true source-distribution probabilities with prospective scores.
 *
 * Not a sportsbook system: all five fixed SOG milestones are frozen BEFORE
 * puck drop for all eligible skaters, not just favorable "picks". Comparison
 * requires verified *independent* official grade and original count ledger.
 * No backfill after puckdrop or retrospective P(hit) from later outcomes.
 */
import type {NhlSogResearch,NhlSogCount} from './countResearch.ts';
export const NHL_PROB_FREEZE_SCHEMA='NHL_V2_FIRST_PREGAME_SHOT_PROBABILITY_LEDGER_V1';
export const NHL_PROB_GRADE_SCHEMA='NHL_V2_PROSPECTIVE_SHOT_PROBABILITY_GRADE_V1';
const MARKETS=['1','2','3','4','5'] as const;
type M=typeof MARKETS[number];
const iso=(s:string)=>Date.parse(s);
const valid=(v:any):v is number=>typeof v==='number'&&Number.isFinite(v);
export type FrozenShotProbability={
 game_id:string;player_id:string;player:string;team:string;opponent:string;
 game_date:string;scheduled_start:string;
 original_forecast_horizon:string;original_source_generated_at:string;
 original_source_cutoff_at:string;captured_at_utc:string;
 model_expected_shots:number;
 original_model_p_ge:Record<M,number>;
 original_source_commit_sha:string;original_ledger_sha256:string;
 participation_certified:false;
 currently_forward_calibrated:false;official_bet:false;bookmaker_line:null;
};
export type FrozenNhlShotDoc={
 schema:typeof NHL_PROB_FREEZE_SCHEMA;captured_at_utc:string;
 source_frozen_model:'NHL_V2_LOCKED_ORIGINAL_COUNT_CDF';
 predictions:FrozenShotProbability[];
 selected_predicted_events:number;official_bets:0;
 source_is_research_only:true;
};
export type OfficialNhlForecast={
 record_type:'FORECAST';forecast_horizon:string;row_hash:string;
 game_id:string|number;player_id:string|number;team:string;
 scheduled_start:string;generated_at:string;cutoff_at:string;
 expected_sog:number;forecast_id:string;
};
export type OfficialNhlGrade={
 record_type:'GRADE';forecast_row_hash:string;forecast_id:string;
 game_id:string|number;player_id:string|number;forecast_horizon:string;
 game_state:string;played:boolean;actual_sog:number;
};
export function originalKey(p:{game_id:string|number;player_id:string|number;
  forecast_horizon?:string;original_forecast_horizon?:string}){
  return [String(p.game_id),String(p.player_id),
    p.forecast_horizon||p.original_forecast_horizon].join('|');
}
export function verifyFirstseenShotLedger(docs:FrozenNhlShotDoc[]){
 const seen=new Set<string>();
 for(const d of docs){
   if(d.schema!==NHL_PROB_FREEZE_SCHEMA||d.official_bets!==0||
      d.source_is_research_only!==true||
      d.selected_predicted_events!==d.predictions.length)
       throw Error('NHL_INVALID_FIRSTSEEN_PROBABILITY_LEDGER');
   for(const row of d.predictions){
     const key=originalKey(row);
     if(seen.has(key)||row.captured_at_utc!==d.captured_at_utc||
        !/^[a-f0-9]{40}$/.test(row.original_source_commit_sha)||
        !/^[a-f0-9]{64}$/.test(row.original_ledger_sha256)||
        row.official_bet!==false||row.bookmaker_line!==null||
        row.currently_forward_calibrated!==false||
        row.participation_certified!==false||
        !valid(row.model_expected_shots)||row.model_expected_shots<0||
        !valid(iso(row.scheduled_start))||
        !valid(iso(row.original_source_generated_at))||
        !valid(iso(row.original_source_cutoff_at))||
        !valid(iso(row.captured_at_utc))||
        iso(row.original_source_generated_at)>iso(row.original_source_cutoff_at)||
        iso(row.original_source_cutoff_at)>=iso(row.scheduled_start)||
        iso(row.captured_at_utc)>iso(row.scheduled_start)-15*60_000)
       throw Error('NHL_INVALID_OR_DUPLICATE_PRETIP_MILESTONE_RECEIPT');
     let prior=1;
     for(const k of MARKETS){
       const v=row.original_model_p_ge[k];
       if(!valid(v)||v<0||v>1||v>prior+.002)
        throw Error('NHL_UNVERIFIED_OR_NONMONOTONE_MODEL_PROBABILITY');
       prior=v;
     }
     seen.add(key);
   }
 }
 return seen;
}
export function freezeSourceNhlShotProbabilities(
 doc:NhlSogResearch,now:Date,history:FrozenNhlShotDoc[]=[]):FrozenNhlShotDoc {
 const existing=verifyFirstseenShotLedger(history);
 if(!valid(now.getTime())||doc.schema!=='NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1'||
    doc.research_only!==true||doc.not_an_official_betting_board!==true||
    doc.source_has_original_hash_chain!==true||
    !/^[a-f0-9]{40}$/.test(doc.source_snapshot_commit_sha||'')||
    !/^[a-f0-9]{64}$/.test(doc.source_ledger_sha256||'')||
    !Array.isArray(doc.projections)||doc.projected_count<doc.projections.length)
    throw Error('NHL_NO_VERIFIED_PROSPECTIVE_COUNT_SOURCE');
 const captured=now.toISOString(),rows:FrozenShotProbability[]=[];
 const current=new Set<string>();
 for(const x of doc.projections){
   const key=originalKey({...x,original_forecast_horizon:x.forecast_horizon});
   if(existing.has(key))continue;
   if(current.has(key))throw Error('NHL_PROBABILITY_DUPLICATE_CURRENT_SOURCE_PLAYER');
   current.add(key);
   if(iso(x.scheduled_start)<=now.getTime()+15*60_000)continue;
   if(x.game_date!==doc.game_date||!x.player_id||!x.game_id||
      !x.team||!x.opponent||x.team===x.opponent||
      x.research_only!==true||x.not_an_official_betting_prediction!==true||
      x.model_probability_forward_calibrated!==false||
      x.probability_not_an_official_bet!==true)
      throw Error('NHL_UNVERIFIED_SOG_PLAYER_IDENTITY_OR_STATUS');
   if(!x.model_probability_milestones_research_only)continue;
   const p=x.model_probability_milestones_research_only;
   rows.push({
     game_id:x.game_id,player_id:x.player_id,player:x.player,team:x.team,
     opponent:x.opponent,game_date:x.game_date,
     scheduled_start:x.scheduled_start,
     original_forecast_horizon:x.forecast_horizon,
     original_source_generated_at:x.source_generated_at,
     original_source_cutoff_at:x.source_cutoff_at,
     captured_at_utc:captured,model_expected_shots:x.mean,
     original_model_p_ge:{'1':p['1'],'2':p['2'],'3':p['3'],
                         '4':p['4'],'5':p['5']},
     original_source_commit_sha:doc.source_snapshot_commit_sha!,
     original_ledger_sha256:doc.source_ledger_sha256!,
     participation_certified:false,currently_forward_calibrated:false,
     official_bet:false,bookmaker_line:null
   });
 }
 const output:FrozenNhlShotDoc={
   schema:NHL_PROB_FREEZE_SCHEMA,captured_at_utc:captured,
   source_frozen_model:'NHL_V2_LOCKED_ORIGINAL_COUNT_CDF',
   predictions:rows,selected_predicted_events:rows.length,
   official_bets:0,source_is_research_only:true
 };
 verifyFirstseenShotLedger([...history,output]);
 return output;
}
export function gradeNhlOriginalShotProbabilities(
 docs:FrozenNhlShotDoc[],forecasts:OfficialNhlForecast[],
 grades:OfficialNhlGrade[],now=new Date()){
 verifyFirstseenShotLedger(docs);
 // A genuine original-ledger source can contain several pregame versions of
 // the same player/game/horizon. Select the EXACT frozen source, not the
 // newest version, and never select based on actual outcomes.
 const sourceByEvent=new Map<string,OfficialNhlForecast[]>();
 const sourceByHash=new Map<string,OfficialNhlForecast>();
 let redundantOriginalCopies=0, redundantFinalCopies=0;
 for(const f of forecasts){
   if(f.record_type!=='FORECAST')continue;
   const prior=sourceByHash.get(f.row_hash);
   if(prior){
     if(JSON.stringify(prior)!==JSON.stringify(f))
       throw Error('NHL_ORIGINAL_HASH_COLLISION_OR_MUTATION');
     redundantOriginalCopies++;
     continue;
   }
   sourceByHash.set(f.row_hash,f);
   const key=originalKey(f);
   const group=sourceByEvent.get(key)||[];
   group.push(f);sourceByEvent.set(key,group);
 }
 const finalByHash=new Map<string,OfficialNhlGrade>();
 for(const g of grades){
   if(g.record_type!=='GRADE')continue;
   const orig=sourceByHash.get(g.forecast_row_hash);
   if(!orig||orig.forecast_id!==g.forecast_id||
      String(orig.game_id)!==String(g.game_id)||
      String(orig.player_id)!==String(g.player_id)||
      orig.forecast_horizon!==g.forecast_horizon)
     throw Error('NHL_OFFICIAL_OUTCOME_NOT_LINKED_TO_ORIGINAL');
   const previous=finalByHash.get(g.forecast_row_hash);
   if(previous){
     if(JSON.stringify(previous)!==JSON.stringify(g))
       throw Error('NHL_CONFLICTING_VERIFIED_OFFICIAL_SHOTS');
     redundantFinalCopies++;
     continue;
   }
   if(!['FINAL','OFF'].includes(g.game_state)||
      !Number.isInteger(g.actual_sog)||g.actual_sog<0||
      typeof g.played!=='boolean'||(!g.played&&g.actual_sog!==0))
     throw Error('NHL_NOT_OFFICIAL_FINAL_OR_BROKEN_DNP');
   finalByHash.set(g.forecast_row_hash,g);
 }
 let exactSourceAmbiguities=0, noExactSource=0, noVerifiedFinal=0;
 const rows=[];
 const byMilestone:Record<string,{n:number;hits:number;brierSum:number;
     pSum:number;bins:Array<{n:number;hits:number;pSum:number}>}>={};
 for(const k of MARKETS)byMilestone[k]={n:0,hits:0,brierSum:0,pSum:0,
   bins:Array.from({length:10},()=>({n:0,hits:0,pSum:0}))};
 for(const d of docs)for(const x of d.predictions){
   const key=originalKey(x);
   const candidates=(sourceByEvent.get(key)||[]).filter(f=>
      f.team===x.team&&f.scheduled_start===x.scheduled_start&&
      f.generated_at===x.original_source_generated_at&&
      f.cutoff_at===x.original_source_cutoff_at&&
      Math.abs(f.expected_sog-x.model_expected_shots)<.001);
   let actual:number|null=null;
   if(candidates.length>1)exactSourceAmbiguities++;
   else if(!candidates.length)noExactSource++;
   else {
     const grade=finalByHash.get(candidates[0].row_hash);
     if(!grade)noVerifiedFinal++;
     else actual=grade.actual_sog;
   }
   for(const k of MARKETS){
     const p=x.original_model_p_ge[k];
     const y=actual===null?null:Number(actual>=Number(k));
     const brier=y===null?null:(p-y)*(p-y);
     rows.push({game_id:x.game_id,player_id:x.player_id,
       player:x.player,source_horizon:x.original_forecast_horizon,
       milestone_shots:Number(k),probability_pre_tip:p,
       actual_sog:actual,result:y===null?'UNVERIFIED':y?'HIT':'MISS',
       brier:brier===null?null:Number(brier.toFixed(7))});
     if(y!==null){
       const q=byMilestone[k];q.n++;q.hits+=y;q.brierSum+=brier!;
       q.pSum+=p;const bin=q.bins[Math.min(9,Math.floor(p*10))];
       bin.n++;bin.hits+=y;bin.pSum+=p;
     }
   }
 }
 const report:Record<string,any>={};
 for(const k of MARKETS){
   const q=byMilestone[k];
   const ece=q.n?q.bins.reduce((sum,bin)=>
     sum+(bin.n/q.n)*Math.abs(bin.n?bin.pSum/bin.n-bin.hits/bin.n:0),0):null;
   report[k]={n_verified:q.n,hits:q.hits,
     average_model_probability:q.n?Number((q.pSum/q.n).toFixed(6)):null,
     observed_event_frequency:q.n?Number((q.hits/q.n).toFixed(6)):null,
     brier:q.n?Number((q.brierSum/q.n).toFixed(6)):null,
     ece_10bins:ece===null?null:Number(ece.toFixed(6)),
     current_season_market_certified:false};
 }
 return {
   schema:NHL_PROB_GRADE_SCHEMA,graded_at_utc:now.toISOString(),
   firstseen_independent_player_forecasts:docs.reduce((z,d)=>z+d.predictions.length,0),
   original_milestone_predictions:rows.length,
   verified_milestone_outcomes:rows.filter(r=>r.actual_sog!==null).length,
   unverified_milestone_outcomes:rows.filter(r=>r.actual_sog===null).length,
   historical_market_promotion_claimed:false,
   distinct_official_original_forecasts:sourceByHash.size,
   repeated_original_event_keys:[...sourceByEvent.values()].filter(a=>a.length>1).length,
   redundant_byte_identical_original_copies:redundantOriginalCopies,
   redundant_byte_identical_final_copies:redundantFinalCopies,
   unverified_players_no_exact_frozen_source:noExactSource,
   unverified_players_ambiguous_exact_source:exactSourceAmbiguities,
   unverified_players_no_independent_final:noVerifiedFinal,
   notes:'Prospective only; exact original source/horizon matched to independently verified official final. No retroactive original probability repair. Book lines not used. Forward promotion requires future preregistered reliable independent samples.',
   official_bets:0,by_milestone:report,predicted_vs_actual:rows
 };
}
