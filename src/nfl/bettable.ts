/** Downstream market matching only. Never calculates or changes forecasts. */
import { groupGames, type ForecastRow, type Horizon, type Phase1View } from './phase1';
export interface SportsbookLine {
  game_id: string; horizon: Horizon; player: string; outcome: string; book: string;
  line: number; p_over: number; p_under: number; over_price?: number; under_price?: number;
}
export interface BettablePick {
  row: ForecastRow; market: SportsbookLine; side: 'OVER' | 'UNDER'; probability: number; odds?: number;
}
export function normalizePlayer(name: string): string {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
function validLine(value: any): value is SportsbookLine {
  return value && ['game_id','player','outcome','book'].every(k=>typeof value[k]==='string' && value[k].trim())
    && ['T24','T90'].includes(value.horizon) && finite(value.line)
    && finite(value.p_over) && finite(value.p_under) && value.p_over>=0 && value.p_over<=1
    && value.p_under>=0 && value.p_under<=1 && Math.abs(value.p_over+value.p_under-1)<=.002;
}
const key = (game: string, horizon: Horizon, player: string, outcome: string) => JSON.stringify([game,horizon,normalizePlayer(player),outcome]);
export function bettablePicks(view: Phase1View, horizon: Horizon): BettablePick[] {
  const rows = new Map<string, ForecastRow[]>();
  for (const row of view.rows[horizon]) {
    if (!normalizePlayer(row.player)) continue;
    const k=key(row.game_id,horizon,row.player,row.outcome);
    rows.set(k,[...(rows.get(k)||[]),row]);
  }
  const picks: BettablePick[]=[], seen=new Set<string>();
  const lines=view.artifact.lines;
  for (const market of Array.isArray(lines)?lines:[]) {
    if (!validLine(market) || market.horizon!==horizon) continue;
    const matched=rows.get(key(market.game_id,horizon,market.player,market.outcome));
    // An ambiguous name must never be assigned to an arbitrary player.
    if (matched?.length!==1) continue;
    const row=matched[0];
    if (!finite(row.p_active) || row.p_active<.75) continue;
    const identity=JSON.stringify([row.id,market.book,market.line]);
    if (seen.has(identity)) continue;
    seen.add(identity);
    const side=market.p_over>market.p_under?'OVER':'UNDER';
    const price=side==='OVER'?market.over_price:market.under_price;
    picks.push({row,market,side,probability:side==='OVER'?market.p_over:market.p_under,odds:finite(price)?price:undefined});
  }
  return picks.sort((a,b)=>b.probability-a.probability || a.row.id.localeCompare(b.row.id)
    || a.market.book.localeCompare(b.market.book) || a.market.line-b.market.line);
}
export function bettableGames(view: Phase1View, horizon: Horizon, search='', outcome='') {
  const query=search.trim().toLowerCase();
  const picks=bettablePicks(view,horizon).filter(p=>(!outcome || p.row.outcome===outcome)
    && (!query || `${p.row.player} ${p.row.team} ${p.row.opp}`.toLowerCase().includes(query)));
  return groupGames(view,horizon).map(game=>({...game,picks:picks.filter(p=>p.row.game_id===game.game_id).slice(0,10)})).filter(g=>g.picks.length);
}
export function exactAltMarket(view: Phase1View, row: ForecastRow, horizon: Horizon, milestone: number): boolean {
  return Array.isArray(view.artifact.lines) && view.artifact.lines.some((m:any)=>m && typeof m.player==='string'
    && typeof m.book==='string' && m.book.trim() && finite(m.line) && m.line===milestone
    && key(m.game_id,m.horizon,m.player,m.outcome)===key(row.game_id,horizon,row.player,row.outcome));
}
export function lineFreshness(view: Phase1View, now=Date.now()) {
  const meta=view.artifact.lines_meta as {generated_at_utc?:string}|null;
  const timestamp=meta?.generated_at_utc;
  const ms=typeof timestamp==='string'?Date.parse(timestamp):NaN;
  return {timestamp,unknown:!Number.isFinite(ms) || ms>now+600000,stale:Number.isFinite(ms) && now-ms>3600000};
}
