/** Existing weekly NFL model output. Separate scientific product from T24/T90.
 * Never turn an ungraded projection into a wager, odds edge or Phase1 forecast. */
import { etDate } from './phase1';

export type ExistingYardMarket = 'rushing_yards' | 'receiving_yards';
export interface ExistingYardProjection {
  player: string; team: string; opponent: string; market: ExistingYardMarket;
  kickoff_utc: string; projected_median: number; projected_mean: number;
  projected_low: number; projected_high: number; model_source: string;
  ungraded: boolean; player_id: string;
}
export interface ExistingNflGame {
  id: string; kickoff_utc: string; teams: [string,string]; projections: ExistingYardProjection[];
}
export interface ExistingNflSlate {
  season: number; week: number; generated_at_utc: string;
  games: ExistingNflGame[]; projections: number;
}
const record=(x:unknown):x is Record<string,unknown>=>x!=null&&typeof x==='object'&&!Array.isArray(x);
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const team=(x:unknown):x is string=>typeof x==='string'&&/^[A-Z]{2,3}$/.test(x);
const time=(x:unknown):x is string=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&/(Z|[+-][0-9]{2}:[0-9]{2})$/.test(x);
const markets:ExistingYardMarket[]=['rushing_yards','receiving_yards'];
const fail=(reason:string):never=>{throw new Error('Existing NFL projection feed invalid: '+reason)};

/** Never merge these projections into immutable Phase1 rows or call the ranges P10/P90.
 * Game group identity is unordered because production rows contain team/opponent, not home/away.
 * The publication is a separately generated weekly forecast, not a per-game deadline receipt.
 */
export function parseExistingNfl(raw:unknown,now=new Date(),expected?:{season:number|null;week:number|null}):ExistingNflSlate{
  if(!record(raw)||!Array.isArray(raw.picks)||!Number.isInteger(raw.season)||!Number.isInteger(raw.week)||!time(raw.generated_at_utc))
    fail('missing weekly metadata');
  const season=raw.season as number,week=raw.week as number,generated_at_utc=raw.generated_at_utc as string;
  if(season<2020||week<1||week>22)fail('invalid season/week');
  if(expected?.season!=null&&expected?.week!=null&&(season!==expected.season||week!==expected.week))
    fail('weekly feed differs from Phase1 season/week');
  const generated=Date.parse(generated_at_utc);
  if(generated>now.getTime()+10*60000||now.getTime()-generated>8*86400000)
    fail('weekly forecast timestamp expired or in the future');
  const games=new Map<string,ExistingNflGame>();
  const dedupe=new Set<string>();
  for(const row of raw.picks){
    if(!record(row)||!markets.includes(row.market as ExistingYardMarket))continue;
    if(!team(row.team)||!team(row.opponent)||row.team===row.opponent||
       !time(row.kickoff_utc)||typeof row.player!=='string'||!row.player.trim()||
       !finite(row.projected_median)||!finite(row.projected_mean)||!finite(row.projected_low)||!finite(row.projected_high)||
       row.projected_low<0||row.projected_low>row.projected_median||row.projected_high<row.projected_median)
      fail('invalid yardage row');
    // Only game-date current/future week entries. Started games remain visible for audit.
    if(etDate(row.kickoff_utc)<etDate(now))continue;
    if(Date.parse(row.kickoff_utc)<generated)fail('forecast generated after its game kicked off');
    const teams=[row.team,row.opponent].sort() as [string,string];
    const id=row.kickoff_utc+'|'+teams.join('_');
    const identity=id+'|'+row.market+'|'+row.team+'|'+(row.player_id||row.player).toString().toLowerCase();
    if(dedupe.has(identity))fail('duplicate player outcome in weekly document');
    dedupe.add(identity);
    const item:ExistingYardProjection={
      player:row.player,team:row.team,opponent:row.opponent,market:row.market as ExistingYardMarket,
      kickoff_utc:row.kickoff_utc,projected_median:row.projected_median,projected_mean:row.projected_mean,
      projected_low:row.projected_low,projected_high:row.projected_high,
      model_source:typeof row.model_source==='string'?row.model_source:'unlabeled_existing_model',
      ungraded:row.ungraded!==false,player_id:typeof row.player_id==='string'?row.player_id:''
    };
    if(!games.has(id))games.set(id,{id,kickoff_utc:row.kickoff_utc,teams,projections:[]});
    games.get(id)!.projections.push(item);
  }
  const listed=[...games.values()].sort((a,b)=>Date.parse(a.kickoff_utc)-Date.parse(b.kickoff_utc)||a.id.localeCompare(b.id));
  for(const g of listed)g.projections.sort((a,b)=>a.market.localeCompare(b.market)||b.projected_median-a.projected_median||a.player.localeCompare(b.player));
  return {season,week,generated_at_utc,games:listed,projections:listed.reduce((n,g)=>n+g.projections.length,0)};
}
