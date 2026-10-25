/** NBA V2 independent NFL-style probability engine.
 *
 * For any source-proven milestone k, estimate
 *   P(stat >= k) = P(plays) * P(stat >= k | plays).
 * (DNP = 0 for unconditional milestone outcomes.)
 *
 * Conditional CDF is fit on Dec8–Jan9 2025/26 V2 historical residuals.
 * Evaluation Jan10–Feb1 is disjoint and market-specific; any market failing
 * the predeclared Brier/ECE/reliability gates gets NO probability card.
 * Historical calibration evidence is NOT a claim of 2026/27 forward-season
 * betting profitability, nor does a book line enter the calculation.
 */
export const NBA_PROBABILITY_SCHEMA=
  'NBA_V2_VALIDATION_FIT_FORWARD_HOLDOUT_PROBABILITY_DISTRIBUTIONS_V1';
export const NBA_PROBABILITY_MODEL=
  'nba-v2-rotation-and-exposure-frozen-challenger-20261019';
export const PROBABILITY_MIN=.65;
export type Stat='points'|'rebounds'|'assists'|'three_pointers_made';
export const MILESTONES:Record<Stat,readonly number[]>={
  points:[15,20,25,30,35],rebounds:[6,8,10,12,14],
  assists:[5,7,9,11,13],three_pointers_made:[2,3,4,5,6]
};
const SCALE_FLOOR:Record<Stat,number>={points:8,rebounds:3,
  assists:2,three_pointers_made:1};
const STATS=Object.keys(MILESTONES) as Stat[];
export type MarketGrade={
  n_original_player_outcomes:number;
  n_market_threshold_observations:number;
  n_ge65_probability:number;
  brier_distribution:number;brier_training_climatology:number;
  brier_improvement:number;ece_tenths:number;
  p_ge65_absolute_reliability_gap:number|null;
  heldout_probability_gate_passed:boolean;
  release_status:'HISTORICAL_HOLDOUT_VALIDATED_2026_27_UNPROVEN'|
                 'HISTORICAL_PROBABILITY_GATE_FAILED';
};
export type NbaProbabilityArtifact={
  schema:typeof NBA_PROBABILITY_SCHEMA;
  numerical_model_version:typeof NBA_PROBABILITY_MODEL;
  outcome_distribution:'validation_empirical_scale_adjusted_residual_cdf_and_play_reliability_v1';
  heldout_start_date:'2026-01-10';
  heldout_last_date:'2026-02-01';
  training_and_holdout_are_disjoint_games:true;
  training_source_is_prior_2025_26_season:true;
  no_bookmaker_data_needed:true;official_bets:0;
  calibrated_for_forward_2026_27:false;
  cannot_certify_game_day_injuries_or_bets:true;
  source_team_sha256:string;source_boxscore_coverage:number;
  source_boxscore_games:number;source_player_firstseen_rows:number;
  artifact_sha256:string;
  some_historical_market_passed:boolean;
  heldout_release_gates:{
    minimum_holdout_player_outcomes:number;
    minimum_holdout_market_target_observations:number;
    minimum_65plus_predictions:number;
    max_ece:number;
    minimum_brier_improvement_over_prior_climatology:number;
    max_65plus_reliability_gap:number;
  };
  fit:{
    trained_between_utc_dates:['2025-12-08','2026-01-10'];
    training_n_preselected_players:number;
    training_n_played_players:number;training_games:number;
    source_cutoff_last_day:'2026-01-09';
    play_reliability_bins:Record<string,{
      n:number;observed_played:number;mean_original_p:number
    }>;
    conditional_scaled_residuals:Record<Stat,number[]>;
    training_target_baselines:Record<Stat,Record<string,number>>;
  };
  markets:Record<Stat,MarketGrade>;
};
const invalid=(e:string):never=>{throw Error('NBA_PROBABILITY_SOURCE_INVALID_'+e);};
const positiveInt=(x:any,min=0)=>Number.isInteger(x)&&x>=min;
const bound=(x:any,a:number,b:number)=>typeof x==='number'&&
    Number.isFinite(x)&&x>=a&&x<=b;
const sha=(x:any)=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const ALL_MARKETS=STATS;
export function parseNbaProbabilityArtifact(raw:unknown,
   expectedTeamSha?:string):NbaProbabilityArtifact {
  if(!raw||typeof raw!=='object')invalid('OBJECT');
  const d=raw as any;
  if(d.schema!==NBA_PROBABILITY_SCHEMA||
     d.numerical_model_version!==NBA_PROBABILITY_MODEL||
     d.outcome_distribution!=='validation_empirical_scale_adjusted_residual_cdf_and_play_reliability_v1'||
     d.heldout_start_date!=='2026-01-10'||d.heldout_last_date!=='2026-02-01'||
     d.training_and_holdout_are_disjoint_games!==true||
     d.training_source_is_prior_2025_26_season!==true||
     d.no_bookmaker_data_needed!==true||d.official_bets!==0||
     d.calibrated_for_forward_2026_27!==false||
     d.cannot_certify_game_day_injuries_or_bets!==true||
     !sha(d.source_team_sha256)||!sha(d.artifact_sha256)||
     expectedTeamSha!=null&&d.source_team_sha256!==expectedTeamSha||
     !bound(d.source_boxscore_coverage,.97,1)||
     !positiveInt(d.source_boxscore_games,550)||
     !positiveInt(d.source_player_firstseen_rows,1500)||
     !d.heldout_release_gates||!d.fit||!d.markets)
    invalid('HISTORICAL_HOLDOUT_PROVENANCE');
  const f=d.fit,gate=d.heldout_release_gates;
  if(f.trained_between_utc_dates?.[0]!=='2025-12-08'||
     f.trained_between_utc_dates?.[1]!=='2026-01-10'||
     f.source_cutoff_last_day!=='2026-01-09'||
     !positiveInt(f.training_n_preselected_players,600)||
     !positiveInt(f.training_n_played_players,500)||
     f.training_n_preselected_players<f.training_n_played_players||
     !positiveInt(f.training_games,40)||
     gate.minimum_holdout_player_outcomes!==1200||
     gate.minimum_holdout_market_target_observations!==4500||
     gate.minimum_65plus_predictions!==80||
     gate.max_ece!==.09||
     gate.minimum_brier_improvement_over_prior_climatology!==.003||
     gate.max_65plus_reliability_gap!==.11)
    invalid('MODEL_SOURCE_BOUNDARY');
  let totalBins=0,seenPlays=0;
  for(let i=0;i<10;i++){
    const b=f.play_reliability_bins?.[String(i)];
    if(!b||!positiveInt(b.n)||!positiveInt(b.observed_played)||
       b.observed_played>b.n||!bound(b.mean_original_p,0,1))
      invalid('PLAY_RELIABILITY_BIN');
    totalBins+=b.n;seenPlays+=b.observed_played;
  }
  if(totalBins!==f.training_n_preselected_players||
     seenPlays!==f.training_n_played_players)invalid('PLAY_LABEL_CONSERVATION');
  let pass=false;
  for(const m of ALL_MARKETS){
    const arr=f.conditional_scaled_residuals?.[m];
    const evidence=d.markets[m];
    if(!Array.isArray(arr)||arr.length!==f.training_n_played_players||
       arr.some((x:any,i:number)=>!bound(x,-1000,1000)||
          i>0&&arr[i-1]>x)||
       !evidence)invalid('CONDITIONAL_CDF_'+m);
    for(const milestone of MILESTONES[m]){
      if(!bound(f.training_target_baselines?.[m]?.[String(milestone)],0,1))
        invalid('TRAINING_THRESHOLD_'+m);
    }
    if(!positiveInt(evidence.n_original_player_outcomes,500)||
       evidence.n_market_threshold_observations!==
           MILESTONES[m].length*evidence.n_original_player_outcomes||
       !positiveInt(evidence.n_ge65_probability)||
       evidence.n_ge65_probability>evidence.n_market_threshold_observations||
       !bound(evidence.brier_distribution,0,1)||
       !bound(evidence.brier_training_climatology,0,1)||
       !bound(evidence.ece_tenths,0,1)||
       !bound(evidence.brier_improvement,-1,1))
      invalid('HOLDOUT_METRICS_'+m);
    const earns=evidence.n_original_player_outcomes>=1200&&
      evidence.n_market_threshold_observations>=4500&&
      evidence.n_ge65_probability>=80&&
      evidence.brier_improvement>=.003&&
      evidence.ece_tenths<=.09&&
      evidence.p_ge65_absolute_reliability_gap!=null&&
      bound(evidence.p_ge65_absolute_reliability_gap,0,.11);
    if(evidence.heldout_probability_gate_passed!==earns||
       evidence.release_status!==(earns?
         'HISTORICAL_HOLDOUT_VALIDATED_2026_27_UNPROVEN':
         'HISTORICAL_PROBABILITY_GATE_FAILED'))
      invalid('FAKE_PROMOTION_'+m);
    if(earns)pass=true;
  }
  if(d.some_historical_market_passed!==pass)invalid('FAKE_MARKET_COUNT');
  return d as NbaProbabilityArtifact;
}
function cdfSurvival(xs:readonly number[],barrier:number):number{
  let lo=0,hi=xs.length;
  while(lo<hi){const mid=(lo+hi)>>1;
    if(xs[mid]<barrier)lo=mid+1;else hi=mid;
  }
  return (xs.length-lo)/xs.length;
}
export function derivedNbaMilestoneProbability(
    doc:NbaProbabilityArtifact,market:Stat,mean:number,pPlay:number,
    threshold:number):number|null{
  if(!doc.markets[market]?.heldout_probability_gate_passed)return null;
  if(!Number.isInteger(threshold)||!MILESTONES[market].includes(threshold)||
     !bound(mean,0,100)||!bound(pPlay,0,1))
    invalid('BAD_PLAYER_THRESHOLD');
  const xs=doc.fit.conditional_scaled_residuals[market];
  const b=doc.fit.play_reliability_bins[String(Math.min(9,Math.floor(pPlay*10)))];
  const probabilityPlay=(b.observed_played+35*pPlay)/(b.n+35);
  const boundary=(threshold-mean)/Math.sqrt(Math.max(mean,SCALE_FLOOR[market]));
  const conditional=cdfSurvival(xs,boundary);
  return Number((probabilityPlay*conditional).toFixed(6));
}
/** Return strongest eligible model-probability threshold from a heldout-
 * validated source; similar to NFL's derivation from its pregame outcome CDF.
 * No sportsbook line or odds required.
 */
export function bestNbaMilestone(
  doc:NbaProbabilityArtifact,market:Stat,mean:number,pPlay:number,
  minimum=PROBABILITY_MIN){
  let best:{milestone:number;probability:number}|null=null;
  for(const k of MILESTONES[market]){
    const prob=derivedNbaMilestoneProbability(doc,market,mean,pPlay,k);
    if(prob!=null&&prob>=minimum)
      best={milestone:k,probability:prob};
  }
  return best;
}
