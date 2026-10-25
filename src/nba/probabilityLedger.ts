/** Append-only FIRST OBSERVED NBA P(hit) ledger: never grade retrofitted targets.
 *
 * Source is the unmodified numeric V2 original, a historically verified
 * validation-fit/forward-holdout probability CDF, and live ESPN injury check.
 * Each selected market threshold is frozen independently BEFORE tipoff.
 * Grading uses only independently verified final played/DNP data; DNP=0
 * for unconditional milestone events. NO bookmaker line is required.
 */
import {
  derivedNbaMilestoneProbability,type NbaProbabilityArtifact
} from './probabilityEngine.ts';
import type {NbaSystemTarget,NbaMarket} from './decisionBoard.ts';

export const NBA_PROBABILITY_SNAPSHOT_SCHEMA=
 'NBA_V2_FIRST_OBSERVED_OUTCOME_DISTRIBUTION_PICKS_V1';
export const NBA_PROBABILITY_FORWARD_GRADE_SCHEMA=
 'NBA_V2_PROSPECTIVE_PROBABILITY_MILESTONE_ACTUAL_GRADE_V1';
export type FrozenProbPick={
  forecast_id:string;game_id:string;home:string;away:string;
  player_id:string;team_id:string;player:string;
  market:NbaMarket;milestone:number;
  predicted_stat:number;historical_p_play:number;
  model_hit_probability:number;
  source_numeric_original_at_utc:string;
  frozen_probability_at_utc:string;
  tipoff_utc:string;
  probability_historical_holdout_validated:true;
  2026_27_calibration_verified:false;
  official_pick:false;bookmaker_line:null;bookmaker_odds:null;
};
export type FrozenProbGame={
 game_id:string;tipoff_utc:string;home:string;away:string;
 player_predictions:FrozenProbPick[];
};
export type FrozenProbSnapshot={
 schema:typeof NBA_PROBABILITY_SNAPSHOT_SCHEMA;frozen_at_utc:string;
 probability_source_artifact_sha256:string;
 prior_historical_team_source_sha256:string;
 live_espn_injury_source_sha256:string;
 probability_research_2026_27_not_yet_certified:true;
 sports_bookmarks_used:0;official_bets:0;first_observed_before_tip:true;
 games:FrozenProbGame[];game_count:number;selected_predictions:number;
};
type SnapshotBoard={
 live_injury_check?:string;live_injury_source_sha256?:string|null;
 historical_probability_distribution_loaded?:boolean;
 current_season_probability_calibration_verified?:boolean;
 official_bets:number;
 games:Array<{game_id:string;tipoff_utc:string;
   home:string;away:string;original_at_utc:string;
   picks:NbaSystemTarget[]}>;
};

export function freezeNbaProbabilities(board:SnapshotBoard,model:NbaProbabilityArtifact,
  now:Date,alreadyFrozen=new Set<string>()):FrozenProbSnapshot {
  if(!Number.isFinite(now.getTime())||
     board.live_injury_check!=='LIVE_ESPN_SOURCE_VERIFIED'||
     !board.live_injury_source_sha256||
     !board.historical_probability_distribution_loaded||
     board.current_season_probability_calibration_verified!==false||
     board.official_bets!==0||model.official_bets!==0)
    throw Error('NBA_PROBABILITY_FREEZE_REQUIRES_LIVE_INJURY_AND_MODEL_RECEIPTS');
  const iso=now.toISOString(),seen=new Set<string>();
  const games:FrozenProbGame[]=[];
  for(const g of board.games){
    if(alreadyFrozen.has(g.game_id)||g.picks.length===0)continue;
    if(seen.has(g.game_id)||!Number.isFinite(Date.parse(g.tipoff_utc))||
       Date.parse(g.tipoff_utc)<=now.getTime()+15*60*1000||
       Date.parse(g.original_at_utc)>=now.getTime())
      throw Error('NBA_PREGAME_PROBABILITY_CUTOFF_OR_ID_FAILURE');
    seen.add(g.game_id);
    const selected:FrozenProbPick[]=[];
    const people=new Set<string>();
    for(const p of g.picks){
      if(p.model_hit_probability==null)continue;
      if(people.has(p.player_id)||p.game_id!==g.game_id||
         p.tipoff_utc!==g.tipoff_utc||p.bookmaker_line!==null||
         p.bookmaker_odds!==null||p.official_pick!==false||
         p.probability_historical_holdout_validated!==true||
         p.probability_method!=='HISTORICAL_VALIDATED_EMPIRICAL_CDF'||
         !model.markets[p.market].heldout_probability_gate_passed||
         !Number.isInteger(p.model_milestone)||
         p.model_hit_probability<.65)
         throw Error('NBA_FROZEN_PROBABILITY_NOT_VALIDATED_REAL_V2_TARGET');
      const correct=derivedNbaMilestoneProbability(model,p.market,
         p.predicted_stat,p.historical_p_play,p.model_milestone);
      if(correct==null||Math.abs(correct-p.model_hit_probability)>.000001)
         throw Error('NBA_PROBABILITY_DIFFERS_FROM_VALIDATED_EMPIRICAL_DISTRIBUTION');
      people.add(p.player_id);
      selected.push({
        forecast_id:p.forecast_id,game_id:g.game_id,home:g.home,away:g.away,
        player_id:p.player_id,team_id:p.team_id,player:p.player,
        market:p.market,milestone:p.model_milestone,
        predicted_stat:p.predicted_stat,historical_p_play:p.historical_p_play,
        model_hit_probability:p.model_hit_probability,
        source_numeric_original_at_utc:g.original_at_utc,
        frozen_probability_at_utc:iso,tipoff_utc:g.tipoff_utc,
        probability_historical_holdout_validated:true,
        2026_27_calibration_verified:false,official_pick:false,
        bookmaker_line:null,bookmaker_odds:null
      });
    }
    if(selected.length)games.push({
       game_id:g.game_id,tipoff_utc:g.tipoff_utc,home:g.home,away:g.away,
       player_predictions:selected
    });
  }
  return {
    schema:NBA_PROBABILITY_SNAPSHOT_SCHEMA,frozen_at_utc:iso,
    probability_source_artifact_sha256:model.artifact_sha256,
    prior_historical_team_source_sha256:model.source_team_sha256,
    live_espn_injury_source_sha256:board.live_injury_source_sha256,
    probability_research_2026_27_not_yet_certified:true,
    sports_bookmarks_used:0,official_bets:0,first_observed_before_tip:true,
    games,game_count:games.length,
    selected_predictions:games.reduce((n,g)=>n+g.player_predictions.length,0)
  };
}
export function verifyFrozenProbabilitySnapshots(
  snapshots:FrozenProbSnapshot[]):FrozenProbSnapshot[] {
  const gameIds=new Set<string>();
  const ordered=[...snapshots].sort((a,b)=>a.frozen_at_utc.localeCompare(b.frozen_at_utc));
  for(const doc of ordered){
    if(doc.schema!==NBA_PROBABILITY_SNAPSHOT_SCHEMA||doc.official_bets!==0||
       doc.first_observed_before_tip!==true||
       doc.probability_research_2026_27_not_yet_certified!==true||
       doc.game_count!==doc.games.length||
       doc.selected_predictions!==doc.games.reduce((n,g)=>n+g.player_predictions.length,0))
      throw Error('NBA_BAD_PUBLISHED_PROBABILITY_LEDGER');
    for(const g of doc.games){
      if(gameIds.has(g.game_id)||Date.parse(doc.frozen_at_utc)>=Date.parse(g.tipoff_utc))
        throw Error('NBA_DUPLICATE_OR_AFTER_TIP_FROZEN_PROBABILITY_GAME');
      gameIds.add(g.game_id);
      const players=new Set<string>();
      for(const p of g.player_predictions){
        if(p.game_id!==g.game_id||p.tipoff_utc!==g.tipoff_utc||
           p.frozen_probability_at_utc!==doc.frozen_at_utc||
           Date.parse(p.source_numeric_original_at_utc)>=Date.parse(doc.frozen_at_utc)||
           !p.probability_historical_holdout_validated||
           p.2026_27_calibration_verified!==false||
           p.official_pick!==false||p.bookmaker_line!==null||p.bookmaker_odds!==null||
           p.model_hit_probability<.65||p.model_hit_probability>1||
           !Number.isInteger(p.milestone)||players.has(p.player_id))
          throw Error('NBA_INVALID_INDEPENDENT_PREGAME_PROBABILITY_ENTRY');
        players.add(p.player_id);
      }
    }
  }
  return ordered;
}
type ResultRow={
 game_id:string;team_id:string;player_id:string;forecast_id:string;
 status:string;stats:Record<NbaMarket,{
   verified_actual_if_played:number|null;status:string
 }>;
};
export type ProbabilityForwardGrade={
 schema:typeof NBA_PROBABILITY_FORWARD_GRADE_SCHEMA;
 graded_at_utc:string;firstseen_games:number;
 original_probabilistic_predictions:number;
 verified_hit_or_miss:number;unverified:number;
 by_market:Record<string,{verified_n:number;mean_brier:number|null;
   hit_rate:number|null;mean_model_p:number|null}>;
 official_bets:0;bookmaker_win_loss_record:null;
 predicted_vs_actual:Array<FrozenProbPick&{
   result:'HIT'|'MISS'|'SOURCE_UNVERIFIED';
   actual_stat:number|null;event_happened:boolean|null;brier:number|null
 }>;
};
export function gradeForwardNbaProbabilities(snapshots:FrozenProbSnapshot[],
  grades:{schema:string;player_rows:ResultRow[]},now=new Date()):ProbabilityForwardGrade{
  const ordered=verifyFrozenProbabilitySnapshots(snapshots);
  if(grades.schema!=='NBA_V2_ALL_IMMUTABLE_ROLLING_PLAYER_STATS_ACTUAL_GRADES_V1')
    throw Error('NBA_PROBABILITY_FORWARD_TRUTH_SOURCE_WRONG');
  const lookup=new Map<string,ResultRow>();
  for(const p of grades.player_rows){
    const key=p.game_id+'|'+p.team_id+'|'+p.player_id;
    if(lookup.has(key))throw Error('NBA_CONFLICTING_POSTGAME_PLAYER_SOURCE');
    lookup.set(key,p);
  }
  const rows:ProbabilityForwardGrade['predicted_vs_actual']=[];
  for(const doc of ordered)for(const g of doc.games)for(const p of g.player_predictions){
    const src=lookup.get(p.game_id+'|'+p.team_id+'|'+p.player_id);
    if(src&&src.forecast_id!==p.forecast_id)
      throw Error('NBA_PROBABILITY_GRADE_NOT_ORIGINAL_NUMERICAL_FORECAST');
    const valid=src&&(src.status==='VERIFIED_PLAYED'||
                         src.status==='VERIFIED_DID_NOT_PLAY');
    const actual=valid?
       (src.status==='VERIFIED_DID_NOT_PLAY'?0:
        src.stats[p.market].verified_actual_if_played):null;
    if(valid&&actual==null)throw Error('NBA_PROBABILITY_VERIFIED_BUT_NO_REAL_PLAYER_STAT');
    const event=actual==null?null:actual>=p.milestone;
    const brier=event===null?null:(p.model_hit_probability-Number(event))**2;
    rows.push({...p,result:event===null?'SOURCE_UNVERIFIED':event?'HIT':'MISS',
      actual_stat:actual,event_happened:event,brier:brier===null?null:Number(brier.toFixed(6))});
  }
  const byMarket:ProbabilityForwardGrade['by_market']={};
  for(const market of ['points','rebounds','assists','three_pointers_made']){
    const good=rows.filter(x=>x.market===market&&x.brier!=null);
    byMarket[market]={verified_n:good.length,
      mean_brier:good.length?Number((good.reduce((s,x)=>s+x.brier!,0)/good.length).toFixed(6)):null,
      hit_rate:good.length?Number((good.filter(x=>x.event_happened).length/good.length).toFixed(6)):null,
      mean_model_p:good.length?Number((good.reduce((s,x)=>s+x.model_hit_probability,0)/good.length).toFixed(6)):null};
  }
  return {schema:NBA_PROBABILITY_FORWARD_GRADE_SCHEMA,
    graded_at_utc:now.toISOString(),
    firstseen_games:ordered.reduce((sum,d)=>sum+d.game_count,0),
    original_probabilistic_predictions:rows.length,
    verified_hit_or_miss:rows.filter(x=>x.brier!=null).length,
    unverified:rows.filter(x=>x.brier==null).length,
    by_market:byMarket,official_bets:0,bookmaker_win_loss_record:null,
    predicted_vs_actual:rows};
}
