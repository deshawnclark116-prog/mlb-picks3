/** NBA prediction DECISION layer: turns real frozen numerical V2 forecasts
 * into a restrained, reproducible list of MODEL targets. This is not an
 * independently calibrated price/EV model. The original ~900+ numerical
 * projections remain intact for grading, NEVER all shown as "picks".
 *
 * Stage 1 (implemented): candidate selection based on original forecast,
 * historical research MAE (played-player holdout Jan10-Feb1 2026), explicit
 * historical P(play), role minutes and available ESPN injury report.
 * Stage 2 (not certified): compare immutable market quotes + probability
 * calibrated on untouched historical closing lines, then confirm active
 * game-day status. No such bets are fabricated here.
 */
export const NBA_DECISION_SCHEMA='NBA_V2_SAVED_PREGAME_SYSTEM_TARGET_BOARD_V1';
export const NBA_MARKETS=['points','rebounds','assists','three_pointers_made'] as const;
export type NbaMarket=typeof NBA_MARKETS[number];
export type NbaBoardMode='SYSTEM PICKS'|'BETTABLE NOW'|'MODEL BOARD';

// These are the genuinely measured conditional-on-playing MAE on the fixed
// January 10-February 1 research holdout, NOT 1 sigma or calibrated P(hit).
// Never reinterpret a standardized distance below as a win probability.
export const NBA_V2_HOLDOUT_MAE:Record<NbaMarket,number>={
  points:4.4675,rebounds:1.8978,assists:1.3433,three_pointers_made:.8999
};
// Minimum meaningful model milestones. They are NEVER asserted to be actual
// sportsbook main lines. Price/execution requires a separate real provider.
export const MODEL_TARGETS:Record<NbaMarket,readonly number[]>={
  points:[14.5,19.5,24.5,29.5,34.5],
  rebounds:[5.5,7.5,9.5,11.5,13.5],
  assists:[4.5,6.5,8.5,10.5,12.5],
  three_pointers_made:[1.5,2.5,3.5,4.5,5.5]
};
export const MARKETS_NAMED:Record<NbaMarket,string>={
  points:'POINTS',rebounds:'REBOUNDS',assists:'ASSISTS',
  three_pointers_made:'MADE THREES'
};
const BLOCKED=new Set(['OUT','DOUBTFUL','QUESTIONABLE','DAY_TO_DAY',
  'UNKNOWN_NOT_A_GAME_ACTIVE_DESIGNATION']);
const MIN_ROLE_MINUTES=26;
const MIN_HISTORICAL_PLAY_PROB=.85;
const MIN_STANDARDIZED_FORECAST_GAP=.9;
const MAX_PER_GAME=2;

export type InputPlayer={
  forecast_id:string;game_id:string;team_id:string;player_id:string;player:string;
  tipoff_utc:string;forecast_generated_at_utc:string;
  p_play_unverified:number;conditional_minutes_mean:number;
  official_pick:false;research_only:true;stat_market_lines:null;
  predictions:Record<NbaMarket,number>;
  espn_source_reported_injury_status?:string;
  reported_out_in_24h_conditional_scenario_p_play?:number|null;
};
export type InputGame={
  game_id:string;home:string;away:string;home_id:string;away_id:string;tipoff_utc:string;
  players:InputPlayer[];source:'FROZEN_OPENING_V2'|'ROLLING_ORIGINAL_V2';
  original_at_utc:string;player_predictions_count:number;
};
export type NbaSystemTarget={
  id:string;forecast_id:string;game_id:string;home:string;away:string;
  tipoff_utc:string;source:InputGame['source'];
  player:string;player_id:string;team_id:string;
  market:NbaMarket; predicted_stat:number;conditional_minutes:number;
  historical_p_play:number;
  model_milestone:number;model_target:string;model_gap:number;
  gap_in_historical_mae_units:number;
  type:'UNPRICED_MODEL_TARGET_NOT_A_BOOK_BET';
  model_hit_probability:null;bookmaker_line:null;bookmaker_odds:null;
  confidence_is_not_calibrated:true;official_pick:false;
};
export type NbaSystemGame={
  game_id:string;home:string;away:string;tipoff_utc:string;
  original_at_utc:string;source:InputGame['source'];
  candidate_count:number;picks:NbaSystemTarget[];
};
export type NbaSystemBoard={
  schema:typeof NBA_DECISION_SCHEMA;
  research_only:true;official_bets:0;verified_book_lines:0;
  probability_model_calibrated_for_NBA_targets:false;
  original_game_count:number;original_player_stat_count:number;
  evaluated_player_count:number;eligible_player_count:number;
  all_uncapped_system_candidate_count:number;
  displayed_system_picks:number;games_with_picks:number;
  games:NbaSystemGame[];
  not_shown_raw_graded_predictions:int;
  disclosure:string;
};
type int=number;
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v);
export function easternDay(iso:string){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',
    year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
}
export function forecastEligible(p:InputPlayer,g:InputGame):boolean{
  if(!p || p.game_id!==g.game_id || p.tipoff_utc!==g.tipoff_utc ||
     p.official_pick!==false || p.research_only!==true ||
     p.stat_market_lines!==null || !num(p.p_play_unverified) ||
     !num(p.conditional_minutes_mean)||p.p_play_unverified<MIN_HISTORICAL_PLAY_PROB ||
     p.conditional_minutes_mean<MIN_ROLE_MINUTES || p.conditional_minutes_mean>42 ||
     p.reported_out_in_24h_conditional_scenario_p_play===0 ||
     BLOCKED.has(p.espn_source_reported_injury_status||''))return false;
  return Object.values(p.predictions).every(v=>num(v)&&v>=0);
}
export function targetFor(player:InputPlayer,g:InputGame):NbaSystemTarget|null{
  if(!forecastEligible(player,g))return null;
  let candidates:NbaSystemTarget[]=[];
  for(const market of NBA_MARKETS){
    const projection=player.predictions[market];
    const mae=NBA_V2_HOLDOUT_MAE[market];
    const levels=MODEL_TARGETS[market].filter(v=>projection-v>=mae*MIN_STANDARDIZED_FORECAST_GAP);
    if(!levels.length)continue;
    const selected=Math.max(...levels);
    const gap=projection-selected;
    candidates.push({
      id:player.forecast_id+'|'+market,
      forecast_id:player.forecast_id,game_id:g.game_id,home:g.home,away:g.away,
      tipoff_utc:g.tipoff_utc,source:g.source,
      player:player.player,player_id:player.player_id,team_id:player.team_id,
      market,predicted_stat:projection,conditional_minutes:player.conditional_minutes_mean,
      historical_p_play:player.p_play_unverified,
      model_milestone:selected+.5,
      model_target:(selected+.5).toString()+'+ '+MARKETS_NAMED[market],
      model_gap:Number(gap.toFixed(4)),
      gap_in_historical_mae_units:Number((gap/mae).toFixed(4)),
      type:'UNPRICED_MODEL_TARGET_NOT_A_BOOK_BET',
      model_hit_probability:null,bookmaker_line:null,bookmaker_odds:null,
      confidence_is_not_calibrated:true,official_pick:false
    });
  }
  return candidates.sort(compareTarget)[0]||null;
}
export function compareTarget(a:NbaSystemTarget,b:NbaSystemTarget):number{
  return b.gap_in_historical_mae_units-a.gap_in_historical_mae_units||
    b.historical_p_play-a.historical_p_play||
    b.conditional_minutes-a.conditional_minutes||
    a.player.localeCompare(b.player)||a.id.localeCompare(b.id);
}
export function buildNbaSystemBoard(games:InputGame[]):NbaSystemBoard {
  let statRows=0,eligible=0,uncapped=0;
  const ids=new Set<string>(),forecastIds=new Set<string>();
  const board:NbaSystemGame[]=[];
  for(const g of [...games].sort((a,b)=>a.tipoff_utc.localeCompare(b.tipoff_utc)||
                                            a.game_id.localeCompare(b.game_id))){
    if(ids.has(g.game_id))throw new Error('NBA_DUPLICATE_ORIGINAL_GAME_ACROSS_OPENING_AND_ROLLING');
    ids.add(g.game_id);
    if(Date.parse(g.original_at_utc)>=Date.parse(g.tipoff_utc) ||
       !Number.isFinite(Date.parse(g.original_at_utc))||
       !Number.isFinite(Date.parse(g.tipoff_utc)))
      throw new Error('NBA_ORIGINAL_BETTING_BOARD_MUST_BE_FROZEN_PREGAME');
    if(g.player_predictions_count!==g.players.length*4)
      throw new Error('NBA_BETTING_BOARD_DROPPED_ORIGINAL_STAT_PREDICTIONS');
    statRows+=g.player_predictions_count;
    let all:NbaSystemTarget[]=[];
    for(const p of g.players){
      if(forecastIds.has(p.forecast_id))
        throw new Error('NBA_DUPLICATE_ORIGINAL_PLAYER_ID');
      forecastIds.add(p.forecast_id);
      if(forecastEligible(p,g))eligible++;
      const pick=targetFor(p,g);
      if(pick)all.push(pick);
    }
    uncapped+=all.length;
    all.sort(compareTarget);
    board.push({
      game_id:g.game_id,home:g.home,away:g.away,
      tipoff_utc:g.tipoff_utc,original_at_utc:g.original_at_utc,
      source:g.source,candidate_count:all.length,picks:all.slice(0,MAX_PER_GAME)
    });
  }
  const count=board.reduce((s,g)=>s+g.picks.length,0);
  return{
    schema:NBA_DECISION_SCHEMA,research_only:true,official_bets:0,
    verified_book_lines:0,probability_model_calibrated_for_NBA_targets:false,
    original_game_count:ids.size,original_player_stat_count:statRows,
    evaluated_player_count:forecastIds.size,eligible_player_count:eligible,
    all_uncapped_system_candidate_count:uncapped,
    displayed_system_picks:count,
    games_with_picks:board.filter(g=>g.picks.length).length,
    games:board,not_shown_raw_graded_predictions:statRows,
    disclosure:'Ranked numerical model targets, not 65% hit-rate claims and NOT bookmaker betting lines. Gap/2026 played-player holdout MAE is not a probability, confidence or edge. No wager is certified until matching real sportsbook prices, calibrated conditional target probabilities and injury/participation validation exist. All original player/stat forecasts remain in the immutable grading archive.'
  };
}
