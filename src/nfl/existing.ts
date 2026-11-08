/** Existing weekly NFL model output. Separate scientific product from T24/T90.
 * Never turn an ungraded projection into a wager, odds edge or Phase1 forecast. */
import { etDate } from './phase1.ts';

export type ExistingYardMarket = 'rushing_yards' | 'receiving_yards';
export type NflMeaningfulEvent={yards:number;probability:number;wilson_lower_95:number};
export type NflMeaningfulGrid={
  schema:'nfl_meaningful_yardage_targets_v1';
  simulation_n:number;
  minimum_absolute_yards:number;
  minimum_relative_mean_fraction:number;
  required_wilson_lower_95:number;
  grid_step_yards:number;
  conditional_on_modeled_opportunities:true;
  forward_calibrated:false;
  official_active_status_verified:false;
  chosen_target:NflMeaningfulEvent|null;
  grid:NflMeaningfulEvent[];
};
export interface ExistingYardProjection {
  player: string; team: string; opponent: string; market: ExistingYardMarket;
  kickoff_utc: string; projected_median: number; projected_mean: number;
  projected_low: number; projected_high: number; model_source: string;
  ungraded: boolean; player_id: string;
  /** Historical simulator workload stability, NOT calibrated yardage-hit likelihood. */
  confidence: 'HIGH'|'MEDIUM'|'LOW'|null; games_played: number|null;
  // Same original simulation's numerical events, NOT market-line odds,
  // independent active-status proof, or forward-calibrated probabilities.
  whole_projection?: number|null;
  projection_reach_probability?: number|null;
  projection_within_10_probability?: number|null;
  /** NBA V5 display convention: round published model mean using x.6 up. */
  nba_style_whole_mean_projection?: number|null;
  /** P(yards >= that exact NBA-style mean threshold), from matched samples. */
  nba_style_reach_probability?: number|null;
  nba_style_probability_event?: string|null;
  /** Independent of any sportsbook or the model mean: hardest meaningful
   * fixed-grid threshold with one-sided 95% Wilson lower bound >=65%. */
  nfl_model_target?: NflMeaningfulEvent|null;
  nfl_model_target_event?: string|null;
  nfl_model_target_grid?: NflMeaningfulGrid|null;
  projection_simulation_n?: number|null;
  projection_probability_source?: string|null;
}
export interface ExistingNflGame {
  id: string; kickoff_utc: string; teams: [string,string]; home?: string; away?: string; projections: ExistingYardProjection[];
}
export interface ExistingNflSlate {
  season: number; week: number; generated_at_utc: string;
  games: ExistingNflGame[]; projections: number; scheduledGames: number; scheduleComplete: boolean;
}
const record=(x:unknown):x is Record<string,unknown>=>x!=null&&typeof x==='object'&&!Array.isArray(x);
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const team=(x:unknown):x is string=>typeof x==='string'&&/^[A-Z]{2,3}$/.test(x);
const time=(x:unknown):x is string=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&/(Z|[+-][0-9]{2}:[0-9]{2})$/.test(x);
const markets:ExistingYardMarket[]=['rushing_yards','receiving_yards'];
const parsedEvent=(v:unknown):NflMeaningfulEvent|null=>{
  if(!record(v)||!Number.isInteger(v.yards)||!finite(v.probability)||
     !finite(v.wilson_lower_95)||v.yards<1||v.probability<0||
     v.probability>1||v.wilson_lower_95<0||
     v.wilson_lower_95>v.probability)return null;
  return {yards:v.yards as number,probability:v.probability,
    wilson_lower_95:v.wilson_lower_95};
};
function parsedGrid(raw:unknown):NflMeaningfulGrid|null{
  if(!record(raw)||raw.schema!=='nfl_meaningful_yardage_targets_v1'||
     !Number.isInteger(raw.simulation_n)||raw.simulation_n<10000||
     !Number.isInteger(raw.minimum_absolute_yards)||
     !finite(raw.minimum_relative_mean_fraction)||
     !finite(raw.required_wilson_lower_95)||
     raw.grid_step_yards!==5||raw.conditional_on_modeled_opportunities!==true||
     raw.forward_calibrated!==false||raw.official_active_status_verified!==false||
     !Array.isArray(raw.grid))return null;
  const grid: NflMeaningfulEvent[]=[];
  for(const item of raw.grid){
    const value=parsedEvent(item);
    if(!value)return null;
    if(grid.length>0&&(grid[grid.length-1].yards>=value.yards||
       grid[grid.length-1].probability<value.probability))return null;
    grid.push(value);
  }
  const chosen=raw.chosen_target==null?null:parsedEvent(raw.chosen_target);
  if(raw.chosen_target!=null&&!chosen)return null;
  if(chosen&&!grid.some(x=>x.yards===chosen.yards&&
      x.probability===chosen.probability&&
      x.wilson_lower_95===chosen.wilson_lower_95))return null;
  return {schema:'nfl_meaningful_yardage_targets_v1',
    simulation_n:raw.simulation_n as number,
    minimum_absolute_yards:raw.minimum_absolute_yards as number,
    minimum_relative_mean_fraction:raw.minimum_relative_mean_fraction,
    required_wilson_lower_95:raw.required_wilson_lower_95,
    grid_step_yards:5,
    conditional_on_modeled_opportunities:true,
    forward_calibrated:false,
    official_active_status_verified:false,
    chosen_target:chosen,grid};
}
const fail=(reason:string):never=>{throw new Error('Existing NFL projection feed invalid: '+reason)};

/** Never merge these projections into immutable Phase1 rows or call the ranges P10/P90.
 * Game group identity is unordered because production rows contain team/opponent, not home/away.
 * The publication is a separately generated weekly forecast, not a per-game deadline receipt.
 */
export function parseExistingNfl(raw:unknown,now=new Date(),expected?:{season:number|null;week:number|null}):ExistingNflSlate{
  if(!record(raw)||!Array.isArray(raw.picks)||!Number.isInteger(raw.season)||!Number.isInteger(raw.week)||!time(raw.generated_at_utc))
    fail('missing weekly metadata');
  // Runtime guards above precede this local view; each projected field is separately validated.
  const doc=raw as Record<string,any>;
  const season=doc.season as number,week=doc.week as number,generated_at_utc=doc.generated_at_utc as string;
  if(season<2020||week<1||week>22)fail('invalid season/week');
  if(expected?.season!=null&&expected?.week!=null&&(season!==expected.season||week!==expected.week))
    fail('weekly feed differs from Phase1 season/week');
  const generated=Date.parse(generated_at_utc);
  if(generated>now.getTime()+10*60000||now.getTime()-generated>8*86400000)
    fail('weekly forecast timestamp expired or in the future');
  const games=new Map<string,ExistingNflGame>();
  const officialSchedule=doc.scheduled_games;
  if(officialSchedule!==undefined && (!Array.isArray(officialSchedule)||officialSchedule.length===0))
    fail('scheduled game manifest invalid');
  // New serving contract: all matchups originate from the foundation game's
  // schedule, not from player eligibility. No fake or averaged projections.
  if(Array.isArray(officialSchedule)){
    for(const scheduled of officialSchedule){
      if(!record(scheduled)||!team(scheduled.home_team)||!team(scheduled.away_team)||
         scheduled.home_team===scheduled.away_team||!time(scheduled.kickoff_utc))
        fail('invalid scheduled NFL game');
      if(etDate(scheduled.kickoff_utc)<etDate(now))continue;
      const teams=[scheduled.home_team,scheduled.away_team].sort() as [string,string];
      const id=new Date(scheduled.kickoff_utc).toISOString()+'|'+teams.join('_');
      if(games.has(id))fail('duplicated game in scheduled manifest');
      games.set(id,{id,kickoff_utc:scheduled.kickoff_utc,teams,home:scheduled.home_team,away:scheduled.away_team,projections:[]});
    }
  }
  const dedupe=new Set<string>();
  for(const row of doc.picks){
    // Keep raw values dynamically validated below; the type predicate's unknown
    // index signature would otherwise erase TypeScript narrowing for fields.
    if(!row||typeof row!=='object'||Array.isArray(row)||!markets.includes(row.market as ExistingYardMarket))continue;
    if(!team(row.team)||!team(row.opponent)||row.team===row.opponent||
       !time(row.kickoff_utc)||typeof row.player!=='string'||!row.player.trim()||
       !finite(row.projected_median)||!finite(row.projected_mean)||!finite(row.projected_low)||!finite(row.projected_high)||
       row.projected_low<0||row.projected_low>row.projected_median||row.projected_high<row.projected_median)
      fail('invalid yardage row');
    // Only game-date current/future week entries. Started games remain visible for audit.
    if(etDate(row.kickoff_utc)<etDate(now))continue;
    if(Date.parse(row.kickoff_utc)<generated)fail('forecast generated after its game kicked off');
    const teams=[row.team,row.opponent].sort() as [string,string];
    const id=new Date(row.kickoff_utc).toISOString()+'|'+teams.join('_');
    if(Array.isArray(officialSchedule)&&!games.has(id))
      fail('NFL player projection does not match the authoritative game schedule');
    const identity=id+'|'+row.market+'|'+row.team+'|'+(row.player_id||row.player).toString().toLowerCase();
    if(dedupe.has(identity))fail('duplicate player outcome in weekly document');
    dedupe.add(identity);
    const item:ExistingYardProjection={
      player:row.player,team:row.team,opponent:row.opponent,market:row.market as ExistingYardMarket,
      kickoff_utc:row.kickoff_utc,projected_median:row.projected_median,projected_mean:row.projected_mean,
      projected_low:row.projected_low,projected_high:row.projected_high,
      model_source:typeof row.model_source==='string'?row.model_source:'unlabeled_existing_model',
      ungraded:row.ungraded!==false,player_id:typeof row.player_id==='string'?row.player_id:'',
      confidence:['HIGH','MEDIUM','LOW'].includes(row.confidence)?row.confidence:null,
      games_played:Number.isInteger(row.games_played)&&row.games_played>0?row.games_played:null,
      whole_projection:Number.isInteger(row.whole_projection)&&row.whole_projection>=0?row.whole_projection:null,
      projection_reach_probability:finite(row.projection_reach_probability)&&row.projection_reach_probability>=0&&row.projection_reach_probability<=1?row.projection_reach_probability:null,
      projection_within_10_probability:finite(row.projection_within_10_probability)&&row.projection_within_10_probability>=0&&row.projection_within_10_probability<=1?row.projection_within_10_probability:null,
      nba_style_whole_mean_projection:Number.isInteger(row.nba_style_whole_mean_projection)&&row.nba_style_whole_mean_projection>=0?row.nba_style_whole_mean_projection:null,
      nba_style_reach_probability:finite(row.nba_style_reach_probability)&&row.nba_style_reach_probability>=0&&row.nba_style_reach_probability<=1?row.nba_style_reach_probability:null,
      nba_style_probability_event:typeof row.nba_style_probability_event==='string'?row.nba_style_probability_event:null,
      nfl_model_target:parsedEvent(row.nfl_model_target),
      nfl_model_target_event:typeof row.nfl_model_target_event==='string'?row.nfl_model_target_event:null,
      nfl_model_target_grid:parsedGrid(row.nfl_model_target_grid),
      projection_simulation_n:Number.isInteger(row.projection_simulation_n)&&row.projection_simulation_n>=10_000?row.projection_simulation_n:null,
      projection_probability_source:typeof row.projection_probability_source==='string'?row.projection_probability_source:null
    };
    if(!games.has(id))games.set(id,{id,kickoff_utc:row.kickoff_utc,teams,projections:[]});
    games.get(id)!.projections.push(item);
  }
  const listed=[...games.values()].sort((a,b)=>Date.parse(a.kickoff_utc)-Date.parse(b.kickoff_utc)||a.id.localeCompare(b.id));
  for(const g of listed)g.projections.sort((a,b)=>a.market.localeCompare(b.market)||b.projected_median-a.projected_median||a.player.localeCompare(b.player));
  return {season,week,generated_at_utc,games:listed,
    projections:listed.reduce((n,g)=>n+g.projections.length,0),
    scheduledGames:Array.isArray(officialSchedule)?officialSchedule.length:listed.length,
    scheduleComplete:Array.isArray(officialSchedule)};
}

/** Prefer source-confirmed away/home from the real NFL schedule.
 * The older projection-only feed contains an unordered pair and must not
 * pretend its alphabetical order establishes home field. */
export function existingMatchup(game:ExistingNflGame):string{
  return game.away&&game.home?`${game.away} vs ${game.home}`:game.teams.join(' vs ');
}
