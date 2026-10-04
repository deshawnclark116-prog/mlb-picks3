/** NFL Phase 1 shadow presentation. Model forecasts and downstream sportsbook presentation. */
import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, RefreshCw } from 'lucide-react';
import { usePhase1 } from '../nfl/usePhase1';
import { HORIZONS, OUTCOMES, altFor, formatET, groupGames, type ForecastRow, type Horizon, type Phase1View } from '../nfl/phase1';

import { bettableGames, exactAltMarket, lineFreshness, type BettablePick } from '../nfl/bettable';

const number = (n?: number | null) => n == null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n);
const percent = (n?: number | null) => n == null ? '—' : `${(n*100).toFixed(n < .1 ? 1 : 0)}%`;
const unit = (outcome: string) => outcome.endsWith('_yds') ? ' yds' : '';
const touch = 'min-h-11 rounded-xl border border-[#282828] bg-[#181818] px-3 text-sm';

export function OutcomeCard({ row, view }: { row: ForecastRow; view: Phase1View }) {
  const cells = [
    ['Expected average (mean)', number(row.mean)+unit(row.outcome)],
    ['Middle 50% (P25–P75)', `${number(row.p25)}–${number(row.p75)}${unit(row.outcome)}`],
    ['Range (P10–P90)', `${number(row.p10)}–${number(row.p90)}${unit(row.outcome)}`],
    ['P(active)', percent(row.p_active)], ['Expected opportunities', number(row.exp_opp)],
    ['Role share', percent(row.role_share)], ['P(≥1)', percent(row.p_ge1)], ['P(0)', percent(row.p0)],
    ['Standard deviation', number(row.sd)],
  ];
  return <article className="min-w-0 rounded-2xl border border-[#292929] bg-[#1C1C1C] p-4" data-testid="forecast-row">
    <div className="break-words text-base font-bold capitalize text-white">{row.player || 'Player name unavailable'}</div>
    <div className="mt-1 text-xs text-gray-400">{row.team}{row.pos ? ` · ${row.pos}` : ''} · {OUTCOMES[row.outcome] || row.outcome}</div>
    <div className="my-4" data-testid="model-projection">
      <div className="text-[11px] font-mono font-bold tracking-wide text-gray-400">MODEL PROJECTION · MEDIAN</div>
      <div className="text-3xl font-black text-[#00FF41]">{number(row.median)}{unit(row.outcome)}</div>
    </div>
    <dl className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-3">
      {cells.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[11px] leading-4 text-gray-400">{label}</dt><dd className="mt-0.5 break-words text-sm font-semibold text-gray-100">{value}</dd></div>)}
    </dl>
    <AltPanel row={row} view={view}/>
    <div className="mt-3 break-words text-[11px] text-gray-400">Uncertainty: {number(row.unc)}{row.unc_reasons?.length ? ` · ${row.unc_reasons.join(', ')}` : ''}</div>
  </article>;
}

function AltPanel({ row, view, horizon }: { row: ForecastRow; view: Phase1View; horizon?: Horizon }) {
  const alt = altFor(view, row);
  const distributionAvailable = Object.hasOwn(view.artifact.alt_65 || {}, row.id) || !!row.quantile_grid_99 || !!row.cdf_lattice;
  const label = horizon ? alt && exactAltMarket(view,row,horizon,alt.milestone) ? 'BETTABLE ALT' : 'MODEL ALT TARGET' : '65%+ ALT LINE';
  return (
    <div className="mt-4 rounded-xl border border-[#00FF41]/40 bg-[#00FF41]/5 p-3" data-testid="alt-line">
      <div className="text-[11px] font-mono font-bold text-[#00FF41]">{label}</div>
      <div className="mt-1 text-lg font-bold text-white">{alt ? `${alt.milestone}+ ${OUTCOMES[row.outcome]?.toLowerCase() || row.outcome}` : 'No 65%+ alt'}</div>
      {alt && <div className="mt-1 text-xs text-gray-200">Model hit probability: {percent(alt.probability)}</div>}
      {alt?.method === 'quantile_grid_99_conservative' && <div className="mt-1 text-[11px] text-gray-400">Conservative simulated quantile estimate · ~1 percentage point resolution</div>}
      {!distributionAvailable && <div className="mt-1 text-[11px] text-gray-400">Distribution detail unavailable; no alt inferred from the projection.</div>}
    </div>
  );
}
export function BettableCard({pick,view,horizon,cutoff}: {pick:BettablePick;view:Phase1View;horizon:Horizon;cutoff:string}) {
  const {row,market,side,probability,odds}=pick;
  return <article data-testid="bettable-pick" className="min-w-0 rounded-2xl border border-[#292929] bg-[#1C1C1C] p-4">
    <div className="break-words text-base font-bold capitalize text-white">{row.player}</div>
    <p className="mt-1 text-xs text-gray-400">{row.team} · {OUTCOMES[row.outcome] || row.outcome}</p>
    <div className="mt-3 text-3xl font-black text-[#00FF41]">{side} {market.line}</div>
    <p className="mt-1 break-words text-sm text-gray-200"><span className="capitalize">{market.book}</span> {odds==null?'Odds unavailable':odds>0?`+${odds}`:odds}</p>
    <div className="my-4"><p className="text-[11px] font-mono text-gray-400">MODEL PROBABILITY</p><p className="text-2xl font-bold text-white">{(probability*100).toFixed(1)}%</p></div>
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <div data-testid="model-projection"><dt className="text-[11px] text-gray-400">Projection (median)</dt><dd>{number(row.median)}{unit(row.outcome)}</dd></div>
      <div><dt className="text-[11px] text-gray-400">Expected average (mean)</dt><dd>{number(row.mean)}{unit(row.outcome)}</dd></div>
      <div><dt className="text-[11px] text-gray-400">P(active)</dt><dd>{row.p_active==null?'—':`${(row.p_active*100).toFixed(1)}%`}</dd></div>
      <div><dt className="text-[11px] text-gray-400">Selected horizon</dt><dd>{horizon}</dd></div>
    </dl>
    <p className="mt-3 text-[11px] text-gray-400">Information cutoff: {formatET(cutoff)}</p>
    <AltPanel row={row} view={view} horizon={horizon}/>
  </article>;
}

interface BoardProps {
  view: Phase1View | null; loading: boolean; error: string | null;
  retrievedAt: string | null; refresh: () => Promise<void>;
}
export function NflPhase1Board({ view, loading, error, retrievedAt, refresh }: BoardProps) {
  const [mode,setMode] = useState<'BETTABLE'|'MODEL BOARD'>('BETTABLE');
  const [clock,setClock] = useState(Date.now);
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return ()=>clearInterval(timer);},[]);
  const [horizon, setHorizon] = useState<Horizon>('T90');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState(''), [outcome, setOutcome] = useState('');
  const [limit, setLimit] = useState(40);
  // The effective horizon is checked on every render, before effects run.
  const selected = view && !view.rows[horizon].length ? view.defaultHorizon : horizon;
  useEffect(() => { if (view) setHorizon(current => view.rows[current].length ? current : view.defaultHorizon); }, [view]);
  useEffect(() => { setExpanded(null); setLimit(40); }, [view?.publicationMs, selected, mode]);
  const groups = view ? groupGames(view, selected) : [];
  const search = query.trim().toLowerCase();
  const modelGroups = groups.map(game => ({ ...game, visibleRows: game.rows.filter(r => (!outcome || r.outcome === outcome)
    && (!search || `${r.player} ${r.team} ${r.opp}`.toLowerCase().includes(search))) })).filter(game => game.visibleRows.length);
  const betGames = view ? bettableGames(view,selected,search,outcome) : [];
  const filtered = mode==='BETTABLE' ? betGames.map(g=>({...g,visibleRows:[],picks:g.picks})) : modelGroups.map(g=>({...g,picks:[]}));
  const freshness = view ? lineFreshness(view,clock) : null;
  const toggle = (id: string) => { setExpanded(current => current === id ? null : id); setLimit(40); };
  return <div id="nfl-today-screen-wrapper" className="flex h-full min-w-0 flex-col overflow-hidden bg-[#0D0D0D] text-gray-200">
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#222] bg-[#0A0A0A] px-4 pb-3 pt-5">
      <div className="min-w-0"><h1 className="text-2xl font-black tracking-tighter text-white">PROP <span className="text-[#00FF41]">EDGE</span></h1>
        <p className="mt-1 text-[11px] font-mono font-bold text-[#00FF41]">NEW NFL OUTCOME ENGINE</p></div>
      <button aria-label="Refresh NFL forecasts" onClick={() => void refresh()} disabled={loading} className={`${touch} flex min-w-11 items-center justify-center text-[#00FF41] disabled:opacity-50`}><RefreshCw size={18} className={loading ? 'animate-spin' : ''}/></button>
    </header>
    <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-28 pt-3" id="nfl-scroll-area">
      <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold">
        {['SHADOW / RESEARCH', 'NO SPORTSBOOK INPUTS', 'NOT YET PROMOTED TO PRODUCTION'].map(label => <span key={label} className="rounded-md border border-[#00FF41]/25 bg-[#00FF41]/5 px-2 py-1 text-[#00FF41]">{label}</span>)}
      </div>
      <dl className="my-4 space-y-2 rounded-xl bg-[#151515] p-3 text-[11px]">
        <div><dt className="text-gray-500">Last forecast retrieval</dt><dd>{formatET(retrievedAt)}</dd></div>
        <div><dt className="text-gray-500">Last shadow publication/run</dt><dd>{formatET(view?.artifact.status.last_shadow_run_utc)}</dd></div>
        <div><dt className="text-gray-500">Model version</dt><dd className="break-all">{view?.artifact.status.model_versions.join(', ') || 'Unavailable'}</dd></div>
      </dl>
      {view && <>
        <div className="mb-3 grid grid-cols-2 gap-2" aria-label="NFL board mode">
          {(['BETTABLE','MODEL BOARD'] as const).map(m=><button key={m} aria-pressed={mode===m} onClick={()=>setMode(m)} className={`${touch} font-bold ${mode===m?'!border-[#00FF41]/50 !bg-[#00FF41]/10 text-[#00FF41]':'text-gray-400'}`}>{m}</button>)}
        </div>
        {mode==='BETTABLE' && <div className="mb-3 text-xs text-gray-400">
          <p>Sportsbook lines updated: {formatET(freshness?.timestamp)}</p>
          {(freshness?.stale || freshness?.unknown) && <p role="status" className="mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 font-bold text-amber-300">LINE MAY HAVE MOVED — verify before placing{freshness?.unknown?' · Line timestamp unavailable or invalid.':''}</p>}
          <p className="mt-2">Up to 10 matched markets per game · P(active) ≥ 75% · Lines are downstream only.</p>
        </div>}
        <div className="grid grid-cols-2 gap-2" aria-label="Forecast horizon">
          {HORIZONS.map(h => <button key={h} disabled={!view.rows[h].length} aria-pressed={selected === h} onClick={() => setHorizon(h)} className={`${touch} font-bold disabled:opacity-40 ${selected === h ? '!border-[#00FF41]/50 !bg-[#00FF41]/10 text-[#00FF41]' : 'text-gray-400'}`}>{h}</button>)}
        </div>
        {!view.rows.T24.length && <p className="mt-2 text-xs text-amber-300">No valid T24 forecast captured.</p>}
        {!view.rows.T90.length && <p className="mt-2 text-xs text-amber-300">No valid T90 forecast captured.</p>}
        {view.excludedGames > 0 && <p role="status" className="mt-2 text-xs text-amber-300">{view.excludedGames} past-date game(s) excluded from the published set.</p>}
        <div className="my-4 grid grid-cols-2 gap-2">
          <input aria-label="Filter NFL players or teams" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Player or team" className={`${touch} min-w-0 w-full text-gray-200`} />
          <select aria-label="Filter NFL outcome" value={outcome} onChange={e => setOutcome(e.target.value)} className={`${touch} min-w-0 w-full text-gray-200`}>
            <option value="">All outcomes</option>{Object.entries(OUTCOMES).filter(([key]) => view.rows[selected].some(r => r.outcome === key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
      </>}
      {error ? <div role="alert" className="rounded-2xl border border-red-900 bg-red-950/20 p-4 text-sm">
        <div className="mb-2 flex items-center gap-2 font-bold text-red-400"><AlertTriangle size={18}/> NFL forecast unavailable</div>
        <p className="break-words text-gray-300">{error}</p><button onClick={() => void refresh()} className={`${touch} mt-3 w-full text-red-300`}>Retry new-engine feed</button>
      </div> : !view && loading ? <p role="status" className="py-8 text-center text-sm text-gray-400">Loading Phase 1 forecasts…</p>
        : filtered.length === 0 ? <p role="status" className="rounded-2xl border border-[#222] p-5 text-sm text-gray-400">{view && mode==='BETTABLE' ? 'No matching sportsbook picks meet the availability guard. Explore all outcomes in MODEL BOARD.' : view?.artifact.empty_message || 'No valid New Engine forecast has been captured for this slate yet.'}</p>
        : <div className="space-y-3" id="nfl-games-list">
          {filtered.map(game => <section key={`${selected}|${game.game_id}`} className="min-w-0 overflow-hidden rounded-2xl border border-[#242424] bg-[#141414]" data-testid="nfl-game">
            <button className="flex min-h-20 w-full items-center gap-3 p-4 text-left" aria-expanded={expanded === game.game_id} aria-controls={`rows-${selected}-${game.game_id}`} onClick={() => toggle(game.game_id)}>
              <div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-white">{game.away} <span className="text-gray-500">vs</span> {game.home}</h2>
                <p className="mt-1 text-xs text-gray-400">{formatET(game.kickoff_utc)}</p>
                <p className="mt-1 text-xs text-[#00FF41]">{selected} · {mode==='BETTABLE' ? `${game.picks.length} BETTABLE PICKS` : `${game.rows.length} player outcomes`}</p></div>
              <ChevronDown size={18} className={`shrink-0 text-gray-400 ${expanded === game.game_id ? 'rotate-180' : ''}`}/>
            </button>
            {expanded === game.game_id && <div id={`rows-${selected}-${game.game_id}`} className="space-y-3 border-t border-[#252525] p-3">
              <p className="text-[11px] text-gray-500">Information cutoff: {formatET(game.horizons[selected]?.cutoff)}</p>
              {mode==='BETTABLE' && game.picks.map(pick=><BettableCard key={`${pick.row.id}|${pick.market.book}|${pick.market.line}`} pick={pick} view={view!} horizon={selected} cutoff={game.horizons[selected]!.cutoff}/>)}
              {game.visibleRows.slice(0, limit).map(row => <OutcomeCard key={row.id} row={row} view={view!}/>)}
              {game.visibleRows.length > limit && <button onClick={() => setLimit(n => n+40)} className={`${touch} w-full text-[#00FF41]`}>Show more outcomes ({game.visibleRows.length-limit} remaining)</button>}
            </div>}
          </section>)}
        </div>}
      {view && <p className="mt-5 break-words text-[10px] leading-4 text-gray-500">R11: {view.artifact.status.r11}</p>}
      <p className="mt-3 text-[11px] leading-4 text-gray-500">Calibrated simulated outcomes; nonparticipation counts as zero. T24 and T90 remain separate. Shadow research forecasts; sportsbook matches are downstream presentation only.</p>
    </div>
  </div>;
}
export default function NflTodayScreen() {
  return <NflPhase1Board {...usePhase1()}/>;
}
