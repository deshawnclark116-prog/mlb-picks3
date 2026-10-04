/** NFL model-first mobile decision board. Scientific outputs remain read-only. */
import React, { useEffect, useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { usePhase1 } from '../nfl/usePhase1';
import { HORIZONS, OUTCOMES, altFor, formatET, groupGames, type ForecastRow, type Horizon, type Phase1View } from '../nfl/phase1';
import { systemGames, todaysBest, executableGames, lineFreshness, matchesFilter, targetText, type Family, type SystemPick, type Execution } from '../nfl/bettable';
const number=(n?:number|null)=>n==null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
const percent=(n?:number|null)=>n==null?'—':`${(n*100).toFixed(1)}%`;
const unit=(outcome:string)=>outcome.endsWith('_yds')?' yds':'';
const touch='min-h-11 rounded-xl border border-[#282828] bg-[#181818] px-3 text-xs';
const etTime=(iso?:string|null)=>iso && Number.isFinite(Date.parse(iso)) ? new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).format(new Date(iso))+' ET':'Unavailable';
function ModelAlt({row,view}:{row:ForecastRow;view:Phase1View}) {
  const alt=altFor(view,row);
  return <div className="mt-4 rounded-xl border border-[#00FF41]/25 bg-[#00FF41]/5 p-3" data-testid="alt-line">
    <p className="text-[11px] text-gray-400">65%+ MODEL TARGET</p>
    <p className="mt-1 font-bold text-white">{alt?`${alt.milestone}+ ${OUTCOMES[row.outcome]?.toLowerCase() || row.outcome}`:'No 65%+ alt'}</p>
    {alt && <p className="mt-1 text-xs text-gray-300">Model hit probability: {percent(alt.probability)}</p>}
    {alt?.method==='quantile_grid_99_conservative' && <p className="mt-1 text-[11px] text-gray-500">Conservative simulated quantile estimate · ~1 percentage point resolution</p>}
  </div>;
}
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
    <ModelAlt row={row} view={view}/>
    <div className="mt-3 break-words text-[11px] text-gray-400">Uncertainty: {number(row.unc)}{row.unc_reasons?.length ? ` · ${row.unc_reasons.join(', ')}` : ''}</div>
  </article>;
}

export function SystemPickCard({pick,view,horizon,execution}:{pick:SystemPick;view:Phase1View;horizon:Horizon;execution?:Execution|null}) {
  const {row,target}=pick;
  const game=view.games.find(g=>g.game_id===row.game_id)!;
  const summary=[['Median',number(row.median)+unit(row.outcome)],['Mean',number(row.mean)+unit(row.outcome)],['P10–P90',`${number(row.p10)}–${number(row.p90)}${unit(row.outcome)}`],['P(active)',percent(row.p_active)]];
  return <article id={`pick-${row.id}`} data-testid="system-pick" className="min-w-0 scroll-mt-3 rounded-2xl border border-[#292929] bg-[#1C1C1C] p-4">
    <div className="flex items-start justify-between gap-3"><h3 className="min-w-0 break-words text-lg font-bold capitalize text-white">{row.player}</h3><span className="rounded-md bg-[#303030] px-2 py-1 text-xs font-bold text-gray-300">{row.team}</span></div>
    <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">{OUTCOMES[row.outcome]}</p>
    <p className="mt-4 text-[10px] font-mono text-gray-500">MODEL TARGET · SYSTEM PICK</p>
    <p className="mt-1 text-3xl font-black leading-tight text-[#00FF41]" data-testid="system-target">{targetText(pick)}</p>
    <div className="my-4"><p className="text-[10px] tracking-wide text-gray-400">MODEL HIT PROBABILITY</p><p className="text-2xl font-black text-[#00FF41]">{percent(target.probability)}</p></div>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">{summary.map(([label,value])=><div key={label}><dt className="text-[11px] text-gray-500">{label}</dt><dd className="text-sm font-semibold text-gray-200">{value}</dd></div>)}</dl>
    {execution && <div data-testid="available-market" className="mt-4 rounded-xl border border-[#363636] bg-[#141414] p-3 text-sm text-gray-200">
      <p className="mb-2 text-[10px] font-mono text-gray-500">AVAILABLE MARKET</p>
      <div className="flex justify-between gap-2"><span className="capitalize">{execution.book}</span><span>{execution.odds>0?'+':''}{execution.odds}</span></div>
      <p className="mt-1 font-bold">{execution.kind==='over'?`OVER ${execution.line}`:targetText(pick)}</p>
    </div>}
    <details className="mt-4 border-t border-[#303030] pt-1" data-testid="system-details"><summary className="flex min-h-11 cursor-pointer items-center text-[11px] font-bold text-gray-400">VIEW DETAILS ▾</summary>
      <dl className="grid grid-cols-2 gap-3 pb-3 text-xs text-gray-300">
        {[['Expected opportunities',number(row.exp_opp)],['Role share',percent(row.role_share)],['Standard deviation',number(row.sd)],['P25–P75',`${number(row.p25)}–${number(row.p75)}`],['Horizon',horizon],['Information cutoff',formatET(game.horizons[horizon]?.cutoff)]].map(([label,value])=><div key={label}><dt className="text-[10px] text-gray-500">{label}</dt><dd>{value}</dd></div>)}
      </dl><p className="break-words pb-2 text-[11px] text-gray-500">Uncertainty: {number(row.unc)} · {row.unc_reasons?.join(', ') || 'None reported'}</p>
      <p className="break-all text-[10px] text-gray-500">Model: {game.horizons[horizon]?.model_version}</p>
    </details>
  </article>;
}
type Mode='SYSTEM PICKS'|'BETTABLE NOW'|'MODEL BOARD';
interface BoardProps {view:Phase1View|null;loading:boolean;error:string|null;retrievedAt:string|null;refresh:()=>Promise<void>}
export function NflPhase1Board({view,loading,error,retrievedAt,refresh}:BoardProps) {
  const [mode,setMode]=useState<Mode>('SYSTEM PICKS'),[horizon,setHorizon]=useState<Horizon>('T90');
  const [family,setFamily]=useState<Family>('ALL'),[search,setSearch]=useState(''),[outcome,setOutcome]=useState('');
  const [expanded,setExpanded]=useState<string|null>(null),[limit,setLimit]=useState(40),[clock,setClock]=useState(Date.now);
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer);},[]);
  const selected=view && !view.rows[horizon].length?view.defaultHorizon:horizon;
  useEffect(()=>{setExpanded(null);setLimit(40);},[mode,selected,view?.publicationMs]);
  const systems=!view ? [] : mode==='BETTABLE NOW'
    ? executableGames(view,selected,search,family)
    : systemGames(view,selected,search,family).map(g=>({...g,picks:g.picks.map(p=>({...p,execution:null}))}));
  const groups=view?groupGames(view,selected).map(game=>{
    const picks=systems.find(g=>g.game_id===game.game_id)!.picks;
    return {...game,picks,visibleRows:game.rows.filter(r=>matchesFilter(r,search,family,outcome))};
  }):[];
  const best=view?todaysBest(view,selected,search,family):[];
  const freshness=view?lineFreshness(view,clock):null;
  const toggle=(id:string)=>{setExpanded(v=>v===id?null:id);setLimit(40);};
  const jump=(pick:SystemPick)=>{
    setExpanded(pick.row.game_id);
    requestAnimationFrame(()=>requestAnimationFrame(()=>document.getElementById(`pick-${pick.row.id}`)?.scrollIntoView({behavior:'smooth',block:'start'})));
  };
  const empty=mode==='SYSTEM PICKS'?'No model-derived 65%+ system picks are available for this game.':mode==='BETTABLE NOW'?"No current sportsbook market matches this game's system picks.":view?.artifact.empty_message || 'No valid New Engine forecast has been captured for this slate yet.';
  return <div id="nfl-today-screen-wrapper" className="flex h-full min-w-0 flex-col overflow-hidden bg-[#0D0D0D] text-gray-200">
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#222] px-4 py-3">
      <div className="min-w-0"><h1 className="text-xl font-black tracking-tighter text-white">PROP <span className="text-[#00FF41]">EDGE</span></h1>
        <p className="mt-1 text-[10px] font-mono text-gray-400">NFL · {view?.artifact.status.season || '—'} WEEK {view?.artifact.status.week || '—'} · UPDATED {etTime(retrievedAt)}</p>
      </div><button aria-label="Refresh NFL forecasts" disabled={loading} onClick={()=>void refresh()} className={`${touch} flex min-w-11 items-center justify-center text-[#00FF41] disabled:opacity-40`}><RefreshCw size={17} className={loading?'animate-spin':''}/></button>
    </header>
    <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-28" id="nfl-scroll-area">
      <div className="mt-3 grid grid-cols-3 gap-1" aria-label="NFL board mode">{(['SYSTEM PICKS','BETTABLE NOW','MODEL BOARD'] as Mode[]).map(m=><button key={m} onClick={()=>setMode(m)} aria-pressed={mode===m} className={`${touch} !px-1 text-[10px] font-bold whitespace-nowrap ${mode===m?'!border-[#00FF41]/50 !bg-[#00FF41]/10 text-[#00FF41]':'text-gray-400'}`}>{m}</button>)}</div>
      <div className="mt-2 flex gap-2" aria-label="Forecast horizon">{HORIZONS.map(h=><button key={h} disabled={!view?.rows[h].length} aria-pressed={selected===h} onClick={()=>setHorizon(h)} className={`${touch} px-5 font-bold disabled:opacity-30 ${selected===h?'text-[#00FF41]':'text-gray-400'}`}>{h}</button>)}
        {view && !view.rows.T24.length && <span className="self-center text-[10px] text-gray-500">No valid T24 forecast captured.</span>}</div>
      <div className="mt-2 flex gap-1 overflow-x-auto" aria-label="Outcome family">{(['ALL','PASS','RUSH','REC','TD'] as Family[]).map(f=><button key={f} aria-pressed={family===f} onClick={()=>setFamily(f)} className={`${touch} shrink-0 ${family===f?'!border-[#00FF41]/40 text-[#00FF41]':'text-gray-400'}`}>{f}</button>)}</div>
      <div className="mt-2 flex min-w-0 gap-2"><input type="search" aria-label="Search player or team" placeholder="Search player or team" value={search} onChange={e=>setSearch(e.target.value)} className={`${touch} min-w-0 w-full text-gray-200`}/>
        {mode==='MODEL BOARD' && <select aria-label="Filter NFL outcome" value={outcome} onChange={e=>setOutcome(e.target.value)} className={`${touch} min-w-0 w-1/2 text-gray-300`}><option value="">All outcomes</option>{Object.entries(OUTCOMES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}</div>
      <div className="mt-2 flex items-center gap-2 text-[9px] text-gray-500"><span className="rounded-md bg-[#222] px-2 py-1">SHADOW</span><span className="rounded-md bg-[#222] px-2 py-1">NO SPORTSBOOK INPUTS</span></div>
      {mode==='BETTABLE NOW' && view && <div className="mt-3 rounded-xl border border-[#333] p-3 text-[11px] text-gray-400"><p className="text-[10px]">SPORTSBOOK LINES UPDATED</p><p className="mt-1">{formatET(freshness?.timestamp)}</p>
        {(freshness?.stale || freshness?.unknown) && <p role="status" className="mt-2 font-bold text-amber-300">LINE MAY HAVE MOVED<br/>VERIFY BEFORE PLACING{freshness?.unknown?' · Timestamp unavailable or invalid.':''}</p>}</div>}
      {error?<div role="alert" className="mt-4 rounded-xl border border-red-900 p-4 text-sm text-red-300">NFL forecast unavailable<p className="mt-2 break-words">{error}</p><button className={`${touch} mt-3 w-full`} onClick={()=>void refresh()}>Retry new-engine feed</button></div>
      :!view?<p role="status" className="py-8 text-center text-sm text-gray-500">{loading?'Loading Phase 1 forecasts…':empty}</p>:<>
        {mode==='SYSTEM PICKS' && best.length>0 && <section className="mt-4" aria-label="Today's best"><h2 className="text-xs font-bold text-gray-300">TODAY'S BEST</h2><div className="mt-2 flex gap-2 overflow-x-auto pb-1">{best.map(p=><button data-testid="today-best" key={p.row.id} onClick={()=>jump(p)} className="flex min-h-24 w-44 shrink-0 flex-col items-start justify-between gap-2 rounded-xl border border-[#292929] bg-[#171717] p-3 text-left">
          <div className="min-w-0"><p className="break-words text-[10px] font-bold uppercase text-gray-300">{p.row.player} · {p.row.team}</p><p className="mt-1 text-sm font-bold text-[#00FF41]">{targetText(p,true)}</p></div><span className="text-lg font-bold text-[#00FF41]">{percent(p.target.probability)}</span></button>)}</div></section>}
        {groups.length===0 && <p role="status" className="mt-4 rounded-xl border border-[#222] p-4 text-sm text-gray-500">{empty}</p>}
        <div className="mt-4 space-y-3">{groups.map(game=>{
          const preview=game.picks[0];const count=mode==='MODEL BOARD'?game.visibleRows.length:game.picks.length;
          return <section key={`${selected}|${game.game_id}`} data-testid="nfl-game" className="min-w-0 overflow-hidden rounded-2xl border border-[#292929] bg-[#141414]">
            <button onClick={()=>toggle(game.game_id)} aria-expanded={expanded===game.game_id} aria-controls={`rows-${game.game_id}`} className="flex min-h-20 w-full items-center gap-3 p-4 text-left"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-1"><h2 className="text-base font-bold text-white">{game.away} vs {game.home}</h2><span className="text-[11px] text-gray-500">{etTime(game.kickoff_utc)}</span></div>
              <p className="mt-2 text-[10px] font-bold text-gray-400">{selected} · {count} {mode==='MODEL BOARD'?'player outcomes':mode==='SYSTEM PICKS'?'SYSTEM PICKS':'BETTABLE NOW'}</p>
              {mode!=='MODEL BOARD' && preview && <p className="mt-2 break-words text-[11px] text-gray-500">BEST: <span className="capitalize text-gray-300">{preview.row.player}</span> · {targetText(preview,true)} · {percent(preview.target.probability)}</p>}
            </div><ChevronDown size={16} className={`shrink-0 text-gray-500 ${expanded===game.game_id?'rotate-180':''}`}/></button>
            {expanded===game.game_id && <div id={`rows-${game.game_id}`} className="space-y-3 border-t border-[#292929] p-3">
              {count===0 && <p className="p-2 text-sm text-gray-500">{empty}</p>}
              {mode==='MODEL BOARD'?game.visibleRows.slice(0,limit).map(row=><OutcomeCard key={row.id} row={row} view={view}/>):game.picks.map(p=><SystemPickCard key={p.row.id} pick={p} view={view} horizon={selected} execution={p.execution}/>)}
              {mode==='MODEL BOARD' && game.visibleRows.length>limit && <button className={`${touch} w-full text-gray-300`} onClick={()=>setLimit(n=>n+40)}>Show more outcomes ({game.visibleRows.length-limit} remaining)</button>}
            </div>}
          </section>;
        })}</div>
      </>}
      <details className="mt-4 rounded-xl border border-[#252525] px-3 text-[11px] text-gray-500"><summary className="flex min-h-11 cursor-pointer items-center font-bold">MODEL STATUS / ABOUT ▾</summary><div className="space-y-2 pb-3 break-words">
        <p>NEW NFL OUTCOME ENGINE · SHADOW / RESEARCH · NOT YET PROMOTED TO PRODUCTION</p><p>Model / football data → player outcome distribution → system-derived target → optional sportsbook execution check.</p>
        <p>R11: {view?.artifact.status.r11 || 'Unavailable'}</p><p>Last forecast retrieval: {formatET(retrievedAt)}</p><p>Last shadow publication/run: {formatET(view?.artifact.status.last_shadow_run_utc)}</p><p className="break-all">Model version: {view?.artifact.status.model_versions.join(', ') || 'Unavailable'}</p>
        {view?.excludedGames ? <p>{view.excludedGames} past-date games excluded.</p>:null}<p>Nonparticipation counts as zero. T24 and T90 remain separate. System targets use existing simulated distributions; sportsbooks only supply optional execution markets.</p>
      </div></details>
    </div>
  </div>;
}
export default function NflTodayScreen(){return <NflPhase1Board {...usePhase1()}/>;}
