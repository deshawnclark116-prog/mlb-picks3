/** Contract for original forward NBA V2 historical-role research, NEVER wagers. */
export const NBA_PLAYER_SCHEMA='NBA_2026_27_V2_FIRST_SEEN_PLAYER_RESEARCH_V1';
export const NBA_PLAYER_MODEL='nba-v2-rotation-and-exposure-frozen-challenger-20261019';
export interface NbaPlayerResearch {
  schema:typeof NBA_PLAYER_SCHEMA;model_version:typeof NBA_PLAYER_MODEL;
  generated_at_utc:string;research_only:true;official_bets:0;
  current_season:'2026-27';no_sportsbook_pricing_or_Kelly:true;
  game_roster_active_injury_starter_status_unknown:true;
  history_game_identity_sha256:string;
  source_roster_count:number;
  source_roster_receipts:Record<string,{sha256:string;url:string;retrieved_at_utc:string;players:number}>;
  previous_season_games_replayed:number;verified_previous_season_full_boxscores:number;
  games_forecast:number;number_of_player_stat_predictions:number;warning:string;
  forecasts:Array<{
    game_id:string;home_id:string;away_id:string;home:string;away:string;
    tipoff_utc:string;no_wagers:true;game_day_active_and_injury_certified:false;
    roster_membership_certified_by_espn:true;player_predictions_count:number;
    roster_players_without_model_forecast:Array<{team_id:string;player_id:string;reason:string}>;
    players:Array<{
      forecast_id:string;game_id:string;tipoff_utc:string;team_id:string;player_id:string;
      player:string;conditional_minutes_mean:number;expected_minutes:number;
      p_play_unverified:number;research_only:true;official_pick:false;
      game_day_active_certified:false;official_injury_certified:false;
      starter_certified:false;stat_market_lines:null;model_target_probabilities:null;
      forecast_generated_at_utc:string;current_roster_retrieved_at_utc:string;
      predictions:{points:number;rebounds:number;assists:number;three_pointers_made:number};
    }>;
  }>;
}
const obj=(x:unknown):x is Record<string,unknown>=>typeof x==='object'&&x!==null&&!Array.isArray(x);
const num=(v:unknown,low:number,high:number):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=low&&v<=high;
const sha=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const validTime=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const bad=(s:string):never=>{throw new Error('NBA original player research source violation: '+s);};
export function parseNbaPlayerResearch(raw:unknown):NbaPlayerResearch {
  if(!obj(raw))throw new Error('NBA original player research source violation: document is not an object');
  const d=raw as Record<string,any>;
  if(d.schema!==NBA_PLAYER_SCHEMA || d.model_version!==NBA_PLAYER_MODEL ||
     d.research_only!==true||d.official_bets!==0 ||
     d.no_sportsbook_pricing_or_Kelly!==true ||
     d.game_roster_active_injury_starter_status_unknown!==true ||
     d.current_season!=='2026-27'||!validTime(d.generated_at_utc)||
     !sha(d.history_game_identity_sha256)||
     !num(d.previous_season_games_replayed,100,1000)||
     !num(d.verified_previous_season_full_boxscores,95,1000)||
     d.verified_previous_season_full_boxscores<d.previous_season_games_replayed*.95 ||
     !num(d.source_roster_count,300,800)||!obj(d.source_roster_receipts)||
     Object.keys(d.source_roster_receipts).length!==30 ||
     !Array.isArray(d.forecasts)||!num(d.games_forecast,1,14)||
     d.forecasts.length!==d.games_forecast ||
     !num(d.number_of_player_stat_predictions,1,3000)||
     typeof d.warning!=='string'||!d.warning.includes('not official')){
    bad('document source, coverage, or betting boundary invalid');
  }
  const generated=Date.parse(d.generated_at_utc as string);
  const receipts=d.source_roster_receipts as Record<string,unknown>;
  let rosters=0;
  for(let id=1;id<=30;id++){
    const row=receipts[String(id)];
    if(!obj(row)||!sha(row.sha256)||!validTime(row.retrieved_at_utc)||
       Date.parse(row.retrieved_at_utc as string)>generated||
       row.url!=='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/'+id+'/roster'||
       !num(row.players,8,35))bad('missing or future roster identity');
    rosters+=(row as Record<string,unknown>).players as number;
  }
  if(rosters!==d.source_roster_count)bad('roster count not preserved');
  const games=new Set<string>(),ids=new Set<string>();
  let stats=0;
  for(const game of d.forecasts){
    if(!obj(game)||typeof game.game_id!=='string'||!/^\d{8,12}$/.test(game.game_id)||
       games.has(game.game_id)||!validTime(game.tipoff_utc)||
       Date.parse(game.tipoff_utc as string)<=generated||
       typeof game.home!=='string'||typeof game.away!=='string'||
       typeof game.home_id!=='string'||typeof game.away_id!=='string'||
       game.home_id===game.away_id||!receipts[game.home_id]||!receipts[game.away_id]||
       game.no_wagers!==true||game.game_day_active_and_injury_certified!==false||
       game.roster_membership_certified_by_espn!==true||
       !Array.isArray(game.players)||!Array.isArray(game.roster_players_without_model_forecast)||
       game.player_predictions_count!==game.players.length*4){
      bad('game start, unique identity, or player count invalid');
    }
    games.add(game.game_id as string);
    const people=new Set<string>();
    for(const row of game.players){
      if(!obj(row)||!sha(row.forecast_id)||ids.has(row.forecast_id as string)||
         row.game_id!==game.game_id||row.tipoff_utc!==game.tipoff_utc||
         typeof row.team_id!=='string'||
         (row.team_id!==game.home_id&&row.team_id!==game.away_id)||
         typeof row.player_id!=='string'||!/^\d+$/.test(row.player_id)||
         typeof row.player!=='string'||!row.player.trim()||
         people.has(row.team_id+'|'+row.player_id)||
         row.research_only!==true||row.official_pick!==false||
         row.game_day_active_certified!==false||row.official_injury_certified!==false||
         row.starter_certified!==false||row.stat_market_lines!==null||
         row.model_target_probabilities!==null||
         !num(row.conditional_minutes_mean,0,42)||!num(row.expected_minutes,0,42)||
         !num(row.p_play_unverified,0,1)||
         !validTime(row.forecast_generated_at_utc)||
         Date.parse(row.forecast_generated_at_utc as string)!==generated||
         (receipts[row.team_id] as Record<string,unknown>).retrieved_at_utc!==row.current_roster_retrieved_at_utc||
         !obj(row.predictions)||Object.keys(row.predictions).length!==4||
         !num(row.predictions.points,0,80)||
         !num(row.predictions.rebounds,0,35)||
         !num(row.predictions.assists,0,25)||
         !num(row.predictions.three_pointers_made,0,15)){
        bad('model player identity/lineup status/stat output invalid');
      }
      people.add(row.team_id+'|'+row.player_id);
      ids.add(row.forecast_id as string);
    }
    stats+=game.player_predictions_count as number;
  }
  if(stats!==d.number_of_player_stat_predictions)bad('model markets missing');
  return d as unknown as NbaPlayerResearch;
}
