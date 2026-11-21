import React, { useEffect, useMemo, useState } from 'react';
import { parseNbaResearch, type NbaResearchDocument } from '../nba/research';
import NbaPlayerResearchPanel from './NbaPlayerResearchPanel';
import NbaRollingPlayerPanel from './NbaRollingPlayerPanel';
import NbaSystemPicksPanel from './NbaSystemPicksPanel';
import NbaV3ResearchPanel from './NbaV3ResearchPanel';
import NbaIndependentLivePanel from './NbaIndependentLivePanel';
import NbaSpecialistPanel from './NbaSpecialistPanel';

const pct = (v: number) => (v * 100).toFixed(1) + '%';
const gameDayEastern = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(iso));
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};
const tipLabel = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'America/New_York', timeZoneName: 'short'
  });

/** The primary NBA picks screen now routes each statistical category to one
 * source-verified specialist model, without averaging. The previous V3/V4/V5
 * selector remains accessible for comparison, never used as a hidden fallback.
 */
export default function NbaResearchScreen() {
  const [doc, setDoc] = useState<NbaResearchDocument | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showSearch,setShowSearch]=useState(false);
  const [mode, setMode] = useState<'PICKS'|'BOARD'|'INDEPENDENT'|'LEGACY'|'EVIDENCE'|'V2'|'ROLLING'|'TEAMS'|'PLAYERS'>('PICKS');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch('/api/nba-research', { cache: 'no-store' });
        if (!r.ok) throw new Error('research endpoint HTTP ' + r.status);
        const parsed = parseNbaResearch(await r.json());
        if (mounted) { setDoc(parsed); setError(''); }
      } catch (e) {
        if (mounted) { setDoc(null); setError(e instanceof Error ? e.message : String(e)); }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const dates = useMemo(() => doc ? [...new Set(doc.forecasts.map(f =>
    gameDayEastern(f.tipoff_utc)))].sort() : [], [doc]);
  const games = useMemo(() => (doc?.forecasts || []).filter(f =>
    (day === 'ALL' || gameDayEastern(f.tipoff_utc) === day) &&
    (!search || (f.home + ' ' + f.away).toLowerCase().includes(search.toLowerCase()))
  ).sort((a,b) => a.tipoff_utc.localeCompare(b.tipoff_utc)), [doc, day, search]);

  return <main className="h-full overflow-y-auto bg-[#0D0D0D] px-4 pb-28 pt-3 space-y-3 text-stone-100" data-testid="nba-research-screen">
    <div className="flex items-center justify-between gap-3">
      <h1 className="min-w-0 truncate text-[16px] font-bold">NBA <span className="font-normal text-gray-300">· 2026–27 model projections</span></h1>
      <button type="button" onClick={()=>setShowSearch(v=>!v)} aria-expanded={showSearch} className={`min-h-10 shrink-0 rounded-xl border px-3 text-[13px] font-semibold bg-[#202a2c] ${showSearch?'border-[#79FF48]/60 text-[#79FF48]':'border-white/10 text-gray-300'}`}>Search</button>
    </div>
    <div className="grid grid-cols-4 gap-1" role="group" aria-label="NBA projection model view">
      {(['PICKS','BOARD','EVIDENCE','V2'] as const).map(m=><button key={m}
        type="button" aria-pressed={mode===m} onClick={()=>setMode(m)}
        className={'min-h-11 rounded-lg border px-1 text-[10px] font-bold '+
          (mode===m?'border-[#00FF41] bg-[#00FF41]/10 text-[#00FF41]':
                       'border-[#333] bg-[#242424] text-gray-300')}>
        {m==='PICKS'?'SYSTEM PICKS':m==='BOARD'?'OTHER MODELS':m==='EVIDENCE'?'MODEL EVIDENCE':'V2 ARCHIVE'}
      </button>)}
    </div>
    {showSearch&&<input aria-label="Find NBA team or player" placeholder="Search NBA picks, players or games"
      value={search} onChange={e=>setSearch(e.target.value)}
      className="w-full rounded-xl border border-[#333] bg-[#191919] px-4 py-3 text-sm text-stone-100" />}
    <button type="button" data-testid="nba-independent-model-tab"
      aria-pressed={mode==='INDEPENDENT'} onClick={()=>setMode('INDEPENDENT')}
      className={'min-h-11 w-full rounded-lg border px-3 text-xs font-black '+
       (mode==='INDEPENDENT'?'border-[#79FF48] bg-[#79FF48]/15 text-[#79FF48]':
       'border-[#79FF48]/35 bg-[#17311f] text-[#79FF48]')}>
      NEW AI MODEL · Independent player projections
    </button>
    {mode==='PICKS'&&<NbaSpecialistPanel search={search}/>}
    {mode==='BOARD'&&<NbaV3ResearchPanel mode="BOARD" search={search}/>}
    {mode==='LEGACY'&&<NbaV3ResearchPanel mode="PICKS" search={search}/>}
    <button type="button" data-testid="nba-previous-system-tab"
      aria-pressed={mode==='LEGACY'} onClick={()=>setMode('LEGACY')}
      className={'min-h-11 w-full rounded-lg border px-3 text-xs font-bold '+
       (mode==='LEGACY'?'border-[#79FF48] bg-[#79FF48]/15 text-[#79FF48]':
       'border-[#444] bg-[#242424] text-gray-300')}>
      Compare with previous NBA system picks
    </button>
    {mode==='INDEPENDENT'&&<NbaIndependentLivePanel search={search}/>}
    {mode==='EVIDENCE'&&<section data-testid="nba-v5-evidence" className="rounded-xl border border-[#465650] bg-[#102018] p-4 text-sm text-gray-100">
      <strong>NBA MODEL · FORECAST VALIDATION STATUS</strong>
      <p className="mt-2 text-xs">The primary NBA projection board assigns points to V5, rebounds and made threes to V3, and assists to V4. Each stat uses its assigned model's own original pregame distribution. No averaging, bookmaker input, or automatic cross-model fallback. Other models and the legacy V5 empirical-game system remain available for comparison.</p>
      <p className="mt-2 text-xs">Projection probabilities are model estimates, not yet certified by
       current-season forward calibration. Original forecasts are retained for result-by-result grading;
       new role-change signals are research-only until they improve chronological holdout performance.</p>
    </section>}
    {mode==='V2'&&<NbaSystemPicksPanel mode="SYSTEM PICKS" search={search}/>}
    {mode==='ROLLING'&&<NbaRollingPlayerPanel search={search}/>}
    <details className="rounded-2xl border border-amber-700/60 bg-amber-950/20 px-3 text-[13px] leading-relaxed text-amber-200">
      <summary className="min-h-10 cursor-pointer py-2 font-semibold">How the NBA projection system works <span className="font-normal">· version and uncertainty</span></summary>
      <strong className="block pb-1 text-xs">EACH GAME IDENTIFIES WHICH MODEL PRODUCED ITS PROJECTIONS</strong>
      <p className="pb-2">Official system picks now use one specialist per market: V5 for points, V3 for rebounds and made threes, V4 for assists. Missing sources remain unavailable, rather than silently switching models. Original pregame records remain separate for grading. The NEW AI MODEL tab is an independent research model, not the primary NBA system.</p>
      <p className="pb-2">Published projection chances are model estimates, not yet independently forward-calibrated. A model-specific probability may be conditional on playing; a clearly labeled V5 chance can include DNP. The system does not use sportsbook lines.</p>
    </details>
    <details className="rounded-xl border border-[#303030] bg-[#171717] p-3 text-xs"
      open={mode==='TEAMS'||mode==='PLAYERS'}>
      <summary className="min-h-10 cursor-pointer font-bold text-gray-300">
        OPENING-WEEK ORIGINAL RESEARCH ARCHIVE · NOT THE BETTING BOARD
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={()=>setMode('TEAMS')}
          aria-pressed={mode==='TEAMS'}
          className="min-h-11 rounded-lg border border-[#444] p-2">Original team forecasts</button>
        <button type="button" onClick={()=>setMode('PLAYERS')}
          aria-pressed={mode==='PLAYERS'}
          className="min-h-11 rounded-lg border border-[#444] p-2">All opening player stats</button>
        <button type="button" onClick={()=>setMode('ROLLING')}
          aria-pressed={mode==='ROLLING'}
          className="min-h-11 rounded-lg border border-[#444] p-2 col-span-2">All frozen V2 rolling stats · original grading archive</button>
      </div>
    </details>
    {(mode==='TEAMS'||mode==='PLAYERS')&&loading &&
      <p className="text-sm text-gray-400">Loading frozen opening-week archive…</p>}
    {(mode==='TEAMS'||mode==='PLAYERS')&&error &&
      <p role="alert" className="rounded-xl border border-red-700 p-3 text-xs text-red-200">
        Archived original NBA research unavailable: {error}</p>}
    {(mode==='TEAMS'||mode==='PLAYERS')&&doc && <>
      <div className="text-[11px] text-gray-400 space-y-1">
        <p>Original forecast frozen {tipLabel(doc.generated_at_utc)} · {doc.projected_games} historical opening-week previews</p>
        <p>Verified source foundation: {doc.historical_completed_regular_games.toLocaleString()} prior regular-season games · ESPN event IDs</p>
      </div>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="NBA research model view">
        <button type="button" onClick={()=>setMode('TEAMS')}
          aria-pressed={mode==='TEAMS'}
          className={`rounded-lg px-3 py-2 text-xs font-bold ${mode==='TEAMS'?'bg-[#00FF41] text-black':'bg-[#262626] text-gray-200'}`}>Opening teams</button>
        <button type="button" onClick={()=>setMode('PLAYERS')}
          aria-pressed={mode==='PLAYERS'}
          className={`rounded-lg px-3 py-2 text-xs font-bold ${mode==='PLAYERS'?'bg-[#00FF41] text-black':'bg-[#262626] text-gray-200'}`}>Opening V2</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="NBA fixture date">
        {['ALL', ...dates].map(d => <button key={d} type="button" onClick={() => setDay(d)}
          aria-pressed={day === d}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${day === d ? 'bg-[#00FF41] text-black' : 'bg-[#252525] text-gray-300'}`}>
          {d === 'ALL' ? 'All games' : d.slice(5)}
        </button>)}
      </div>

      {mode==='PLAYERS' && <NbaPlayerResearchPanel day={day} search={search} />}
      {mode==='TEAMS' && <>
      <div className="text-xs text-gray-400">{games.length} matching historical pregame forecasts</div>
      {games.map(f => <article key={f.game_id} className="rounded-2xl border border-[#303030] bg-[#171717] p-4 space-y-3">
        <div className="text-[11px] text-gray-400">{tipLabel(f.tipoff_utc)} · ESPN #{f.game_id}</div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-bold">{f.away} <span className="text-gray-400 font-normal">at</span> {f.home}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#0E0E0E] p-3">
            <div className="text-[10px] text-gray-400">Away win probability</div>
            <div className="text-xl font-black">{pct(f.away_win_probability)}</div>
            <div className="text-xs text-gray-300">Projected: {f.projected_away_score_mean.toFixed(1)} pts</div>
          </div>
          <div className="rounded-xl bg-[#0E0E0E] p-3">
            <div className="text-[10px] text-gray-400">Home win probability</div>
            <div className="text-xl font-black text-[#00FF41]">{pct(f.home_win_probability)}</div>
            <div className="text-xs text-gray-300">Projected: {f.projected_home_score_mean.toFixed(1)} pts</div>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Model projected game total</span>
          <span className="font-bold">{f.projected_game_total_mean.toFixed(1)} pts</span>
        </div>
        <div className="text-[10px] text-amber-300">ROSTER-BLIND FORECAST · NOT A SPORTSBOOK LINE · NO WAGER RECOMMENDATION</div>
      </article>)}
      {!games.length && <p className="text-xs text-gray-400">No games match the selected date and team.</p>}
      <p className="text-[10px] text-gray-500">Immutable source SHA-256: {doc.historical_source_sha256}. Forecasts are original October 19 research, not updated injury-adjusted game-day advice.</p>
      </>}
    </>}
  </main>;
}
