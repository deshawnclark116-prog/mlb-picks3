/** NFL model-first mobile decision board. Scientific outputs remain read-only. */
import React, { useEffect, useState } from 'react';
import { ChevronDown, RefreshCw, Image } from 'lucide-react';
import NflShareModal from './NflShareModal';
import ExistingNflProjectionSlate from './ExistingNflProjectionSlate';
import {wholeStatProjection} from '../lib/wholeStatProjection';
import { usePhase1 } from '../nfl/usePhase1';
import { useNflRoleResearch } from '../nfl/useNflRoleResearch';
import { teamKey, statKey, type NflRoleResearch, type RoleStat } from '../nfl/roleResearch';
import {roleEligibleGames} from '../nfl/roleEligibleRanking';
import { HORIZONS, OUTCOMES, altFor, formatET, groupGames, type ForecastRow, type Horizon, type Phase1View } from '../nfl/phase1';
import { systemGames, executableGames, systemCandidates, compareSystem, lineFreshness, matchesFilter, targetText, type Family, type SystemPick, type Execution } from '../nfl/bettable';
import { publicationCoverage } from '../nfl/readable';
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
export function OutcomeCard({ row, view, roleStat }: { row: ForecastRow; view: Phase1View; roleStat?: RoleStat }) {
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
    {roleStat && <div data-testid="nfl-role-corrected-projection" className="mt-4 rounded-xl border border-amber-600/50 bg-amber-950/20 p-3">
      <div className="text-[11px] font-bold tracking-wide text-amber-200">UPDATED ROLE-CONDITIONED MEDIAN · NOT A VERIFIED BET</div>
      <div className="mt-1 text-3xl font-black text-amber-100">{number(roleStat.correctedMedian)}{unit(row.outcome)}</div>
      <div className="mt-1 text-xs text-amber-200">Assumes {roleStat.starter} starts and plays the game. {roleStat.sourceTier==='OFFICIAL_TEAM_STARTER_SOURCE'?'Starting QB confirmed by team source.':roleStat.sourceTier==='NFL_NETWORK_EXPECTED_START_NOT_ACTIVE_VERIFIED'?'Expected to start; not certified active.':'ESPN QB1; not a confirmed starter.'} {roleStat.draws.toLocaleString()} full-game draws.</div>
    </div>}
    <div className="my-4" data-testid="model-projection">
      <div className="text-[11px] font-mono font-bold tracking-wide text-gray-400">{roleStat?'ORIGINAL FROZEN V2 MEDIAN · BEFORE ROLE CORRECTION':'MODEL PROJECTION · MEDIAN'}</div>
      <div className={roleStat?'text-xl font-semibold text-gray-400':'text-3xl font-black text-[#00FF41]'}>{row.median==null?'—':wholeStatProjection(row.median)}{unit(row.outcome)}</div>
      <p className="mt-1 text-[11px] text-amber-200">Chance of exactly this integer: unavailable. Alternative 65%+ targets are different events.</p>
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
    <div className="mt-4 rounded-xl border border-[#00FF41]/25 bg-[#0E1D14] p-3" data-testid="primary-projection">
      <p className="text-[10px] font-bold tracking-wide text-gray-300">PREDICTED STAT · MODEL MEDIAN</p>
      <p data-testid="nfl-whole-stat" className="mt-1 text-3xl font-black text-[#00FF41]">{row.median==null?'—':wholeStatProjection(row.median)}{unit(row.outcome)}</p>
      <p className="mt-1 text-[11px] text-amber-200">Exact-count probability unavailable; no 65% target reused for this number.</p>
      <p className="mt-1 text-xs text-gray-300">Mean: {number(row.mean)}{unit(row.outcome)} · 10–90%: {number(row.p10)}–{number(row.p90)}{unit(row.outcome)}</p>
    </div>
    <details className="mt-3 rounded-xl border border-[#303030] p-3" data-testid="nfl-alternative-model-target">
      <summary className="min-h-9 cursor-pointer text-[11px] font-bold text-gray-400">ALTERNATIVE MODEL TARGET ▾</summary>
    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[#303030] p-3">
      <div className="min-w-0"><p className="text-[10px] font-bold text-gray-400">MODEL TARGET · NOT A SPORTSBOOK BET</p>
        <p className="mt-1 text-lg font-bold leading-tight text-gray-100" data-testid="system-target">{targetText(pick)}</p></div>
      <div className="text-right"><p className="text-[10px] text-gray-400">MODEL HIT PROBABILITY</p><p className="mt-1 text-lg font-bold text-[#00FF41]">{percent(target.probability)}</p></div>
    </div>
    </details>
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
interface BoardProps {view:Phase1View|null;loading:boolean;error:string|null;retrievedAt:string|null;refresh:()=>Promise<void>;
  role?:NflRoleResearch|null;roleError?:string|null;roleLoading?:boolean}
export function NflPhase1Board({view,loading,error,retrievedAt,refresh,role=null,roleError=null,roleLoading=false}:BoardProps) {
  const [share,setShare]=useState<{view:Phase1View;gameId:string;horizon:Horizon}|null>(null);
  const [mode,setMode]=useState<Mode>('SYSTEM PICKS'),[horizon,setHorizon]=useState<Horizon>('T90');
  const [family,setFamily]=useState<Family>('ALL'),[search,setSearch]=useState(''),[outcome,setOutcome]=useState('');
  const [expanded,setExpanded]=useState<string|null>(null),[limit,setLimit]=useState(40),[clock,setClock]=useState(Date.now);
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer);},[]);
  const selected=view && !view.rows[horizon].length?view.defaultHorizon:horizon;
  useEffect(()=>{setExpanded(null);setLimit(40);},[mode,selected,view?.publicationMs]);
  const isRoleBlocked=(row:ForecastRow)=>role?.blocked.has(teamKey(row.game_id,selected,row.team))===true;
  // Do not promote original model targets on a team whose starting-QB
  // probabilities contradict the published source. Show the corrected
  // RESEARCH scenario on the numerical board instead, not a fabricated bet.
  // For role-contradicted teams, gate the UNCAPPED candidate pool before
  // ranking. Unaffected games still use the original, locked selection code.
  const systems=(!view ? [] : role?.blocked.size
    ? roleEligibleGames(view,selected,search,family,row=>!isRoleBlocked(row),
        mode==='BETTABLE NOW'?'bettable':'system')
    : mode==='BETTABLE NOW'
      ? executableGames(view,selected,search,family)
      : systemGames(view,selected,search,family)
          .map(g=>({...g,picks:g.picks.map(p=>({...p,execution:null}))})));
  const groups=view?groupGames(view,selected).map(game=>{
    const picks=systems.find(g=>g.game_id===game.game_id)!.picks;
    return {...game,picks,visibleRows:game.rows.filter(r=>matchesFilter(r,search,family,outcome))};
  }):[];
  const best=view?systemCandidates(view,selected)
    .filter(p=>!isRoleBlocked(p.row)&&matchesFilter(p.row,search,family))
    .sort(compareSystem).slice(0,5):[];
  const visibleConflicts=role?.conflicts.filter(x=>x.horizon===selected)||[];
  const coverage=view?publicationCoverage(view,selected):null;
  const freshness=view?lineFreshness(view,clock):null;
  const toggle=(id:string)=>{setExpanded(v=>v===id?null:id);setLimit(40);};
  const jump=(pick:SystemPick)=>{
    setExpanded(pick.row.game_id);
    requestAnimationFrame(()=>requestAnimationFrame(()=>document.getElementById(`pick-${pick.row.id}`)?.scrollIntoView({behavior:'smooth',block:'start'})));
  };
  const empty=mode==='SYSTEM PICKS'?'No model-derived 65%+ system picks are available for this game.':mode==='BETTABLE NOW'?"No current sportsbook market matches this game's system picks.":view?.artifact.empty_message || 'No valid New Engine forecast has been captured for this slate yet.';
  return <div id="nfl-today-screen-wrapper" className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#0D0D0D] text-gray-200">
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#222] px-4 py-3">
      <div className="min-w-0"><h1 className="text-xl font-black tracking-tighter text-white">PROP <span className="text-[#00FF41]">EDGE</span></h1>
        <p className="mt-1 text-[10px] font-mono text-gray-400"> NFL · {view?.artifact.status.season || '—'} WEEK {view?.artifact.status.week || '—'} · DATA CHECKED {etTime(retrievedAt)}</p>
      </div><button aria-label="Refresh NFL forecasts" disabled={loading} onClick={()=>void refresh()} className={`${touch} flex min-w-11 items-center justify-center text-[#00FF41] disabled:opacity-40`}><RefreshCw size={17} className={loading?'animate-spin':''}/></button>
    </header>
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 pb-28 [-webkit-overflow-scrolling:touch]" id="nfl-scroll-area" role="region" aria-label="Scrollable NFL model projections" tabIndex={0}>
      <div className="mt-3 grid grid-cols-3 gap-1" aria-label="NFL board mode">{(['SYSTEM PICKS','BETTABLE NOW','MODEL BOARD'] as Mode[]).map(m=><button key={m} onClick={()=>setMode(m)} aria-pressed={mode===m} className={`${touch} !px-1 text-[10px] font-bold whitespace-nowrap ${mode===m?'!border-[#00FF41]/50 !bg-[#00FF41]/10 text-[#00FF41]':'text-gray-400'}`}>{m}</button>)}</div>
      <div className="mt-2 flex gap-2" aria-label="Forecast horizon">{HORIZONS.map(h=><button key={h} disabled={!view?.rows[h].length} aria-pressed={selected===h} onClick={()=>setHorizon(h)} className={`${touch} min-w-20 px-5 font-bold disabled:opacity-30 ${selected===h?'text-[#00FF41]':'text-gray-400'}`}>{h}</button>)}</div>
      <div className="mt-2 flex gap-1 overflow-x-auto" aria-label="Outcome family">{(['ALL','PASS','RUSH','REC','TD'] as Family[]).map(f=><button key={f} aria-pressed={family===f} onClick={()=>setFamily(f)} className={`${touch} shrink-0 ${family===f?'!border-[#00FF41]/40 text-[#00FF41]':'text-gray-400'}`}>{f}</button>)}</div>
      <div className="mt-2 flex min-w-0 gap-2"><input type="search" aria-label="Search player or team" placeholder="Search player or team" value={search} onChange={e=>setSearch(e.target.value)} className={`${touch} min-w-0 w-full text-gray-200`}/>
        {mode==='MODEL BOARD' && <select aria-label="Filter NFL outcome" value={outcome} onChange={e=>setOutcome(e.target.value)} className={`${touch} min-w-0 w-1/2 text-gray-300`}><option value="">All outcomes</option>{Object.entries(OUTCOMES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-gray-400"><span className="rounded-md bg-[#222] px-2 py-1">SHADOW RESEARCH</span><span className="rounded-md bg-[#222] px-2 py-1">NO VERIFIED SPORTSBOOK INPUTS</span></div>
      {view && roleLoading && !role && <p role="status" className="mt-2 text-xs text-gray-400">Checking updated quarterback roles…</p>}
      {view && roleError && <p role="status" data-testid="nfl-role-feed-unavailable" className="mt-2 rounded-xl border border-amber-900 p-3 text-xs text-amber-300">Updated QB role assessment unavailable. Original frozen predictions remain research-only and have not been certified for betting.</p>}
      {visibleConflicts.length>0 && <section data-testid="nfl-starter-role-corrections" aria-label="NFL role-adjusted predictions" className="mt-3 rounded-xl border border-amber-800/70 bg-[#231B13] p-3">
        <p className="text-xs font-bold text-amber-200">STARTER / OPPORTUNITY CORRECTIONS · {selected}</p>
        <p className="mt-1 text-[11px] text-gray-300">The original model has contradictory QB participation assumptions. These teams are removed from original-model system targets below; their separate conditional projections remain visible in MODEL BOARD.</p>
        {visibleConflicts.map(c=>{
          const stats=[...role!.corrected.values()].filter(x=>x.gameId===c.gameId&&x.team===c.team&&x.horizon===c.horizon&&x.outcome==='pass_yds'&&x.player.toLowerCase()===c.starter?.toLowerCase());
          const starter=stats[0];
          return <p key={teamKey(c.gameId,c.horizon,c.team)} className="mt-2 text-xs text-gray-100">
            <strong>{c.team}:</strong> {starter?<>{starter.starter} · role-conditioned passing median <strong>{number(starter.correctedMedian)} yds</strong> (frozen V2 {number(starter.originalMedian)}). {starter.sourceTier==='OFFICIAL_TEAM_STARTER_SOURCE'?'Team-confirmed starting role.':'Conditional start, game-day status not verified.'}</>:'Starting QB workload unresolved; original targets withheld.'}
          </p>;
        })}
      </section>}
      {mode==='BETTABLE NOW' && view && <div className="mt-3 rounded-xl border border-[#333] p-3 text-[11px] text-gray-400"><p className="text-[10px]">SPORTSBOOK LINES UPDATED</p><p className="mt-1">{formatET(freshness?.timestamp)}</p>
        {(freshness?.stale || freshness?.unknown) && <p role="status" className="mt-2 font-bold text-amber-300">LINE MAY HAVE MOVED<br/>VERIFY BEFORE PLACING{freshness?.unknown?' · Timestamp unavailable or invalid.':''}</p>}</div>}
      {error?<><ExistingNflProjectionSlate view={null} search={search} family={family} visible={true} horizon={selected} mode={mode}/><div role="alert" className="mt-4 rounded-xl border border-red-900 p-4 text-sm text-red-300">T24/T90 research unavailable<p className="mt-2 break-words">{error}</p><button className={`${touch} mt-3 w-full`} onClick={()=>void refresh()}>Retry research feed</button></div></>
      :!view?<><ExistingNflProjectionSlate view={null} search={search} family={family} visible={true} horizon={selected} mode={mode}/><p role="status" className="py-4 text-center text-xs text-gray-500">{loading?'Loading T24/T90 research…':empty}</p></>:<>
        {mode==='SYSTEM PICKS' && best.length>0 && <section className="mt-6" aria-label="Today's best">
          <h2 className="mb-3 text-sm font-black text-gray-200">TODAY'S BEST</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">{best.map(p=><button data-testid="today-best" key={p.row.id}
            onClick={()=>jump(p)} className="flex min-h-36 w-52 shrink-0 flex-col items-start rounded-2xl border border-[#292929] bg-[#181818] p-4 text-left">
            <p className="break-words text-xs font-bold uppercase text-gray-200">{p.row.player} · {p.row.team}</p>
            <p className="mt-2 text-base font-black text-[#00FF41]">Predicted {p.row.median!=null?wholeStatProjection(p.row.median):'—'}{unit(p.row.outcome)} {OUTCOMES[p.row.outcome]}</p>
            <p className="mt-auto pt-3 text-[11px] text-amber-200">P(exact result) unavailable</p>
          </button>)}</div>
        </section>}
        <ExistingNflProjectionSlate view={view} search={search} family={family} visible={true} horizon={selected} mode={mode}/>
        {groups.length===0 && <p role="status" className="mt-4 rounded-xl border border-[#222] p-4 text-sm text-gray-500">{empty}</p>}
        <div className="mt-4 space-y-3">{groups.map(game=>{
          const preview=game.picks[0];const count=mode==='MODEL BOARD'?game.visibleRows.length:game.picks.length;
          const cannotExportOriginal=role?.conflicts.some(r=>r.gameId===game.game_id&&r.horizon===selected)===true;
          return <section key={`${selected}|${game.game_id}`} data-testid="nfl-game" className="min-w-0 overflow-hidden rounded-2xl border border-[#292929] bg-[#141414]">
            <div className="flex items-center gap-1 pr-3"><button onClick={()=>toggle(game.game_id)} aria-expanded={expanded===game.game_id} aria-controls={`rows-${game.game_id}`} className="flex min-h-20 min-w-0 flex-1 items-center gap-3 p-4 text-left"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-1"><h2 className="text-base font-bold text-white">{game.away} vs {game.home}</h2><span className="text-[11px] text-gray-500">{etTime(game.kickoff_utc)}</span></div>
              <p className="mt-2 text-[10px] font-bold text-gray-400">{selected} · {count} {mode==='MODEL BOARD'?'player outcomes':mode==='SYSTEM PICKS'?'SYSTEM PICKS':'BETTABLE NOW'}</p>
              {mode!=='MODEL BOARD' && preview && <p className="mt-2 break-words text-[11px] text-gray-300">TOP MODEL FORECAST: <span className="capitalize text-white">{preview.row.player}</span> · {preview.row.median!=null?wholeStatProjection(preview.row.median):'—'}{unit(preview.row.outcome)} · P(exact result) unavailable</p>}
            </div><ChevronDown size={16} className={`shrink-0 text-gray-500 ${expanded===game.game_id?'rotate-180':''}`}/></button>
              <button aria-label={`Create share card for ${game.away} vs ${game.home}`}
                disabled={cannotExportOriginal}
                title={cannotExportOriginal?'Original QB role projections are contradicted; corrected simulation has no certified betting card.':'Create game share card'}
                onClick={()=>{if(!cannotExportOriginal)setShare({view,gameId:game.game_id,horizon:selected});}}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-[#333] bg-[#1B211E] text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"><Image size={18}/></button>
            </div>
            {cannotExportOriginal && <p data-testid="nfl-role-share-blocked" className="px-4 pb-3 text-[11px] text-amber-300">Game card withheld: original QB role model contradicted. See role-conditioned numerical predictions; no certified corrected betting card.</p>}
            {expanded===game.game_id && <div id={`rows-${game.game_id}`} className="space-y-3 border-t border-[#292929] p-3">
              {count===0 && <p className="p-2 text-sm text-gray-500">{empty}</p>}
              {mode==='MODEL BOARD'?game.visibleRows.slice(0,limit).map(row=><OutcomeCard key={row.id} row={row} view={view}
                roleStat={role?.corrected.get(statKey(row.game_id,selected,row.team,row.player,row.outcome))}/>):game.picks.map(p=><SystemPickCard key={p.row.id} pick={p} view={view} horizon={selected} execution={p.execution}/>)}
              {mode==='MODEL BOARD' && game.visibleRows.length>limit && <button className={`${touch} w-full text-gray-300`} onClick={()=>setLimit(n=>n+40)}>Show more outcomes ({game.visibleRows.length-limit} remaining)</button>}
            </div>}
          </section>;
        })}</div>
      </>}
      {view && <div data-testid="nfl-coverage" className={`mt-3 rounded-xl border p-3 text-xs ${(coverage?.missed || 0)>0 || !view.artifact.status.readiness_ready?'border-amber-800/60 bg-amber-950/20 text-amber-100':'border-[#2C4230] bg-[#102018] text-gray-200'}`}>
        <p className="font-bold">FORECAST COVERAGE · {selected}</p>
        <p className="mt-1">{coverage?.captured ?? 0} games captured{coverage?.planned!=null?` · ${coverage.planned} pending`:''}{coverage?.missed!=null&&coverage.missed>0?` · ${coverage.missed} missed cutoff(s)`:''}{coverage?.failed!=null&&coverage.failed>0?` · ${coverage.failed} failed`:''}</p>
        <p className="mt-1 text-[11px] text-gray-300">Last pipeline check: {formatET(view.artifact.status.last_shadow_run_utc)} · Not the forecast generation time.</p>
        {view.artifact.status.readiness_ready !== true && <p className="mt-1 text-[11px] font-semibold">Experimental shadow model; not cleared for official betting picks.</p>}
      </div>}
      <details className="mt-4 rounded-xl border border-[#252525] px-3 text-[11px] text-gray-500"><summary className="flex min-h-11 cursor-pointer items-center font-bold">MODEL STATUS / ABOUT ▾</summary><div className="space-y-2 pb-3 break-words">
        <p>NEW NFL OUTCOME ENGINE · SHADOW / RESEARCH · NOT YET PROMOTED TO PRODUCTION</p><p>Model / football data → player outcome distribution → system-derived target → optional sportsbook execution check.</p>
        <p>R11: {view?.artifact.status.r11 || 'Unavailable'}</p><p>Last forecast retrieval: {formatET(retrievedAt)}</p><p>Last shadow publication/run: {formatET(view?.artifact.status.last_shadow_run_utc)}</p><p className="break-all">Model version: {view?.artifact.status.model_versions.join(', ') || 'Unavailable'}</p>
        {view?.excludedGames ? <p>{view.excludedGames} past-date games excluded.</p>:null}<p>Nonparticipation counts as zero. T24 and T90 remain separate. System targets use existing simulated distributions; sportsbooks only supply optional execution markets.</p>
      </div></details>
    </div>
    {share && <NflShareModal {...share} onClose={()=>setShare(null)}/>}
  </div>;
}
export default function NflTodayScreen(){
  const phase=usePhase1();
  const roles=useNflRoleResearch(phase.view);
  return <NflPhase1Board {...phase} role={roles.data} roleError={roles.error} roleLoading={roles.loading}/>;
}
