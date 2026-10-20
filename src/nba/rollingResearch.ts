/** Rigorous serving contract for ORIGINAL continuously frozen NBA V2 game forecasts.
 * Real raw model output only. Never invent sportsbook threshold, injury
 * certification, late lookahead or "won" from a projected stat number.
 */
export const ROLLING_NBA_SCHEMA='NBA_V2_2026_27_IMMUTABLE_ROLLING_PLAYER_PREDICTIONS_V1';
export const ROLLING_NBA_MODEL='nba-v2-rotation-and-exposure-frozen-challenger-20261019';

export interface RollingPlayer {
  forecast_id:string;game_id:string;team_id:string;player_id:string;player:string;
  tipoff_utc:string;forecast_generated_at_utc:string;
  conditional_minutes_mean:number;expected_minutes:number;
  p_play_unverified:number;research_only:true;official_pick:false;
  espn_source_reported_injury_status?:string;
  espn_source_reported_injury_detail?:string|null;
  reported_injury_is_not_official_game_active_status?:true;
  source_reported_injury_observed_at_utc?:string|null;
  reported_out_in_24h_conditional_scenario_p_play?:number|null;
  reported_out_in_24h_conditional_scenario_expected_minutes?:number|null;
  game_day_active_certified:false;starting_lineup_certified:false;
  stat_market_lines:null;
  predictions:{points:number;rebounds:number;assists:number;three_pointers_made:number};
}
export interface RollingGame {
  game_id:string;home_id:string;away_id:string;home:string;away:string;
  tipoff_utc:string;players:RollingPlayer[];player_predictions_count:number;
  game_day_active_and_injury_certified:false;roster_membership_certified_by_espn:true;
  no_wagers:true;
  roster_players_without_model_forecast:Array<{team_id:string;player_id:string;reason:string}>;
}
export interface RollingFile {
  schema:typeof ROLLING_NBA_SCHEMA;model_version:typeof ROLLING_NBA_MODEL;
  generated_at_utc:string;research_only:true;official_bets:0;current_season:'2026-27';
  games_forecast:number;number_of_player_stat_predictions:number;forecasts:RollingGame[];
  game_roster_active_injury_starter_status_unknown:true;
  history_game_identity_sha256:string;fixture_source_sha256:string;
  source_roster_count:number;source_roster_receipts:Record<string,unknown>;
  history_source_coverage:number;
  no_sportsbook_pricing_or_Kelly:true;
}
export interface RollingResponse {
  schema:'NBA_V2_ALL_SAVED_ROLLING_GAME_VIEW_V1';
  model_version:typeof ROLLING_NBA_MODEL;
  status:'HAS_AUTHENTIC_PREGAME_FORECASTS'|'NO_ROLLING_ORIGINALS_YET';
  research_only:true;official_bets:0;injury_or_starters_certified:false;
  returned_games:number;returned_player_forecasts:number;
  returned_stat_forecasts:number;
  forecasts:Array<RollingGame&{first_seen_at_utc:string;source_file:string}>;
  note:string;
}

const obj=(v:unknown):v is Record<string,any>=>
    !!v&&typeof v==='object'&&!Array.isArray(v);
const finite=(x:unknown,a:number,b:number):x is number=>
    typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
const sha=(x:unknown)=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const iso=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const fail=(reason:string):never=>{throw new Error('NBA rolling original-source contract: '+reason);};

export function parseRollingNbaOriginal(raw:unknown):RollingFile {
  if(!obj(raw))return fail('not an object');
  const d=raw as Record<string,any>;
  if(d.schema!==ROLLING_NBA_SCHEMA||d.model_version!==ROLLING_NBA_MODEL||
     d.research_only!==true||d.official_bets!==0||
     d.no_sportsbook_pricing_or_Kelly!==true||
     d.game_roster_active_injury_starter_status_unknown!==true||
     d.current_season!=='2026-27'||!iso(d.generated_at_utc)||
     !sha(d.history_game_identity_sha256)||!sha(d.fixture_source_sha256)||
     !finite(d.history_source_coverage,.95,1)||
     !finite(d.source_roster_count,200,800)||
     !obj(d.source_roster_receipts)||
     Object.keys(d.source_roster_receipts).length!==30||
     !Array.isArray(d.forecasts)||!finite(d.games_forecast,1,50)||
     d.games_forecast!==d.forecasts.length||
     !finite(d.number_of_player_stat_predictions,4,6000)){
    fail('not certified as a pregame source-only V2 record');
  }
  const generated=Date.parse(d.generated_at_utc);
  const receipts=d.source_roster_receipts as Record<string,unknown>;
  for(let i=1;i<=30;i++){
    const row=receipts[String(i)];
    if(!obj(row)||!sha(row.sha256)||!iso(row.retrieved_at_utc)||
       Date.parse(row.retrieved_at_utc)>generated||
       !finite(row.players,8,35))fail('roster history mismatch');
  }
  const gids=new Set<string>(),ids=new Set<string>();
  let count=0;
  for(const g of d.forecasts){
    if(!obj(g)||typeof g.game_id!=='string'||!/^\d{8,12}$/.test(g.game_id)||
       gids.has(g.game_id)||!iso(g.tipoff_utc)||
       Date.parse(g.tipoff_utc)<=generated||
       !obj(receipts[g.home_id])||!obj(receipts[g.away_id])||
       g.home_id===g.away_id||g.no_wagers!==true||
       g.game_day_active_and_injury_certified!==false||
       g.roster_membership_certified_by_espn!==true||
       !Array.isArray(g.players)||!g.players.length||
       !Array.isArray(g.roster_players_without_model_forecast)||
       g.player_predictions_count!==g.players.length*4){
      fail('missing real game or after tip/unsupported model');
    }
    gids.add(g.game_id);
    const people=new Set<string>();
    for(const p of g.players){
      if(!obj(p)||!sha(p.forecast_id)||ids.has(p.forecast_id)||
         p.game_id!==g.game_id||p.tipoff_utc!==g.tipoff_utc||
         p.team_id!==g.home_id&&p.team_id!==g.away_id||
         typeof p.player_id!=='string'||!/^\d+$/.test(p.player_id)||
         people.has(p.team_id+'|'+p.player_id)||
         typeof p.player!=='string'||!p.player.trim()||
         !iso(p.forecast_generated_at_utc)||
         Date.parse(p.forecast_generated_at_utc)!==generated||
         p.official_pick!==false||p.research_only!==true||
         p.stat_market_lines!==null||p.game_day_active_certified!==false||
         p.starting_lineup_certified!==false||
         !finite(p.p_play_unverified,0,1)||
         !finite(p.conditional_minutes_mean,0,42)||
         !finite(p.expected_minutes,0,42)||
         !obj(p.predictions)||Object.keys(p.predictions).length!==4||
         !finite(p.predictions.points,0,80)||
         !finite(p.predictions.rebounds,0,35)||
         !finite(p.predictions.assists,0,25)||
         !finite(p.predictions.three_pointers_made,0,15)){
        fail('invalid player forecast and/or imagined injury/odds');
      }
      if(p.espn_source_reported_injury_status!==undefined){
        if(typeof p.espn_source_reported_injury_status!=='string'||
           p.reported_injury_is_not_official_game_active_status!==true||
           (p.source_reported_injury_observed_at_utc!=null&&
            (!iso(p.source_reported_injury_observed_at_utc)||
             Date.parse(p.source_reported_injury_observed_at_utc)>generated))||
           !(p.reported_out_in_24h_conditional_scenario_p_play===null||
             p.reported_out_in_24h_conditional_scenario_p_play===undefined||
             p.reported_out_in_24h_conditional_scenario_p_play===0)){
          fail('untrustworthy ESPN-reported game-availability context');
        }
      }
      people.add(p.team_id+'|'+p.player_id);ids.add(p.forecast_id);
    }
    count+=g.player_predictions_count;
  }
  if(count!==d.number_of_player_stat_predictions)fail('some original stat projections were omitted');
  return d as RollingFile;
}

export function combineRollingNbaOriginals(
  sources:Array<{filename:string;original:unknown}>,
  openingIds:readonly string[],
  now=new Date()
):RollingResponse {
  if(!Number.isFinite(now.getTime()))fail('invalid current time');
  const ids=new Set(openingIds),players=new Set<string>();
  const games:Array<RollingGame&{first_seen_at_utc:string;source_file:string}>=[];
  for(const src of sources.sort((a,b)=>a.filename.localeCompare(b.filename))){
    if(!/^20\d\d-\d\d-\d\dT\d{6}Z\.json$/.test(src.filename))
       fail('not the append-only original filename convention');
    const original=parseRollingNbaOriginal(src.original);
    for(const g of original.forecasts){
      if(ids.has(g.game_id))fail('two independent original forecasts for the same game');
      ids.add(g.game_id);
      for(const p of g.players){
        if(players.has(p.forecast_id))fail('same original player ID appeared twice');
        players.add(p.forecast_id);
      }
      const tip=Date.parse(g.tipoff_utc);
      // Do not overwhelm mobile clients with months of historical game cards.
      // The complete immutable archive and independent full grader remain stored.
      if(tip>=now.getTime()-3*864e5 && tip<=now.getTime()+8*864e5)
        games.push({...g,first_seen_at_utc:original.generated_at_utc,
                          source_file:src.filename});
    }
  }
  games.sort((a,b)=>a.tipoff_utc.localeCompare(b.tipoff_utc)||
                     a.game_id.localeCompare(b.game_id));
  return {
    schema:'NBA_V2_ALL_SAVED_ROLLING_GAME_VIEW_V1',
    model_version:ROLLING_NBA_MODEL,
    status:games.length?'HAS_AUTHENTIC_PREGAME_FORECASTS':'NO_ROLLING_ORIGINALS_YET',
    research_only:true,official_bets:0,injury_or_starters_certified:false,
    returned_games:games.length,
    returned_player_forecasts:games.reduce((n,g)=>n+g.players.length,0),
    returned_stat_forecasts:games.reduce((n,g)=>n+g.player_predictions_count,0),
    forecasts:games,
    note:'Original pretip player stat numbers only. Model P(play) is historical, NOT verified pregame injury/active status. No book line or official wager.'
  };
}
