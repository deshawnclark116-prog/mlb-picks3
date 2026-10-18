/** Model-first presentation decisions. No forecast or distribution is changed. */
import { altFor, groupGames, type Alt65, type ForecastRow, type Horizon, type Phase1View } from './phase1';
export const OFFENSIVE_OUTCOMES = ['pass_yds','pass_td','int','rush_yds','rush_td','rec_yds','rec','rec_td','atd'];
export type Family = 'ALL' | 'PASS' | 'RUSH' | 'REC' | 'TD';
export interface SystemPick { row: ForecastRow; target: Alt65 }
export interface Execution { book: string; line: number; odds: number; kind: 'over' | 'milestone' }
export function normalizePlayer(name: string): string {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
export function compareSystem(a: SystemPick,b: SystemPick): number {
  return b.target.probability-a.target.probability || b.row.p_active!-a.row.p_active!
    || a.row.player.localeCompare(b.row.player) || a.row.outcome.localeCompare(b.row.outcome)
    || a.row.game_id.localeCompare(b.row.game_id) || a.row.id.localeCompare(b.row.id);
}
/** Uncapped eligibility: existing model targets plus availability, never books. */
export function systemCandidates(view: Phase1View,horizon: Horizon): SystemPick[] {
  return groupGames(view,horizon).flatMap(game=>game.rows.flatMap(row=>{
    if (!OFFENSIVE_OUTCOMES.includes(row.outcome) || !row.player.trim() || row.p_active==null || row.p_active<.75) return [];
    const target=altFor(view,row);
    return target && target.probability>=.65 ? [{row,target}] : [];
  }));
}
/** Search/family eligibility precedes ranking and the per-game DISPLAY cap. */
export function systemGames(view: Phase1View,horizon: Horizon,search='',family: Family='ALL') {
  const candidates=systemCandidates(view,horizon).filter(p=>matchesFilter(p.row,search,family));
  return groupGames(view,horizon).map(game=>({...game,picks:candidates.filter(p=>p.row.game_id===game.game_id).sort(compareSystem).slice(0,10)}));
}
export function todaysBest(view: Phase1View,horizon: Horizon,search='',family: Family='ALL') {
  return systemCandidates(view,horizon).filter(p=>matchesFilter(p.row,search,family)).sort(compareSystem).slice(0,5);
}
export function matchesFilter(row: ForecastRow,search: string,family: Family,outcome='') {
  const families={ALL:OFFENSIVE_OUTCOMES,PASS:['pass_yds','pass_td','int'],RUSH:['rush_yds','rush_td'],REC:['rec_yds','rec','rec_td'],TD:['pass_td','rush_td','rec_td','atd']};
  return (!outcome || row.outcome===outcome) && (family==='ALL' || families[family].includes(row.outcome))
    && (!search.trim() || `${row.player} ${row.team} ${row.opp}`.toLowerCase().includes(search.trim().toLowerCase()));
}
export function targetText(pick: SystemPick,compact=false): string {
  const labels:Record<string,string>=compact ? {pass_yds:'PASS YDS',rush_yds:'RUSH YDS',rec_yds:'REC YDS',rec:'REC',pass_td:'PASS TD',rush_td:'RUSH TD',rec_td:'REC TD',atd:'TD',int:'INT THROWN'}
    : {pass_yds:'PASSING YARDS',rush_yds:'RUSHING YARDS',rec_yds:'RECEIVING YARDS',rec:'RECEPTIONS',pass_td:'PASSING TD',rush_td:'RUSHING TD',rec_td:'RECEIVING TD',atd:'TD',int:'INTERCEPTIONS THROWN'};
  return `${pick.target.milestone}+ ${labels[pick.row.outcome]}`;
}
const finite=(x:unknown):x is number=>typeof x==='number' && Number.isFinite(x);
/** Known NFL integer settlements only: >=m equals OVER m-.5.
 * Numeric equality alone NEVER proves an explicit m+ market. The optional
 * explicit format requires market_type=milestone AND settlement=at_least. */
export function bestExecution(view: Phase1View,horizon: Horizon,pick: SystemPick): Execution | null {
  if (!OFFENSIVE_OUTCOMES.includes(pick.row.outcome) || !Number.isInteger(pick.target.milestone)) return null;
  // Fail closed if the published name is ambiguous within this game/outcome.
  const matching=view.rows[horizon].filter(r=>r.game_id===pick.row.game_id && r.outcome===pick.row.outcome && normalizePlayer(r.player)===normalizePlayer(pick.row.player));
  if (matching.length!==1) return null;
  const options:Execution[]=[];
  for (const m of Array.isArray(view.artifact.lines)?view.artifact.lines:[]) {
    if (!m || m.game_id!==pick.row.game_id || m.horizon!==horizon || m.outcome!==pick.row.outcome
      || typeof m.player!=='string' || normalizePlayer(m.player)!==normalizePlayer(pick.row.player)
      || typeof m.book!=='string' || !m.book.trim() || !finite(m.line)) continue;
    const explicit=m.market_type==='milestone' && m.settlement==='at_least' && m.line===pick.target.milestone;
    const conventional=(m.market_type==null || m.market_type==='over_under') && (m.side==null || m.side==='OVER') && m.line===pick.target.milestone-.5;
    if (!explicit && !conventional) continue;
    const odds=explicit ? m.price ?? m.over_price : m.over_price;
    if (!finite(odds) || Math.abs(odds)<100) continue;
    options.push({book:m.book,line:m.line,odds,kind:explicit?'milestone':'over'});
  }
  // American odds: positive prices outrank negative, then larger is better.
  return options.sort((a,b)=>b.odds-a.odds || a.book.localeCompare(b.book) || a.kind.localeCompare(b.kind))[0] || null;
}
/** Execution intersects uncapped model eligibility; it has its OWN display cap. */
export function executableGames(view: Phase1View,horizon: Horizon,search='',family: Family='ALL') {
  const executable=systemCandidates(view,horizon).filter(p=>matchesFilter(p.row,search,family)).flatMap(pick=>{
    const execution=bestExecution(view,horizon,pick);return execution?[{...pick,execution}]:[];
  });
  return groupGames(view,horizon).map(game=>({...game,picks:executable.filter(p=>p.row.game_id===game.game_id).sort(compareSystem).slice(0,10)}));
}
export function lineFreshness(view: Phase1View,now=Date.now()) {
  const timestamp=(view.artifact.lines_meta as {generated_at_utc?:string}|null)?.generated_at_utc;
  const ms=typeof timestamp==='string'?Date.parse(timestamp):NaN;
  return {timestamp,unknown:!Number.isFinite(ms) || ms>now+600000,stale:Number.isFinite(ms) && now-ms>3600000};
}
