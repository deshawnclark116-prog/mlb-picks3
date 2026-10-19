import React, { useEffect, useMemo, useState } from 'react';
import { parseNbaResearch, type NbaResearchDocument } from '../nba/research';

const pct = (v: number) => (v * 100).toFixed(1) + '%';
const tipLabel = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'America/New_York', timeZoneName: 'short'
  });

/**
 * Opening-week NBA V1 research only. This component NEVER presents model
 * targets as sportsbook lines or the unpromoted player model as picks.
 */
export default function NbaResearchScreen() {
  const [doc, setDoc] = useState<NbaResearchDocument | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState('ALL');
  const [search, setSearch] = useState('');

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
    new Date(f.tipoff_utc).toISOString().slice(0,10)))].sort() : [], [doc]);
  const games = useMemo(() => (doc?.forecasts || []).filter(f =>
    (day === 'ALL' || f.tipoff_utc.slice(0,10) === day) &&
    (!search || (f.home + ' ' + f.away).toLowerCase().includes(search.toLowerCase()))
  ).sort((a,b) => a.tipoff_utc.localeCompare(b.tipoff_utc)), [doc, day, search]);

  return <main className="h-full overflow-y-auto bg-[#0D0D0D] p-4 pb-28 space-y-4 text-stone-100" data-testid="nba-research-screen">
    <div className="space-y-1">
      <h1 className="text-xl font-black tracking-wide">NBA V1</h1>
      <p className="text-xs text-gray-400">October 20–21, 2026 · Frozen opening-week team projections</p>
    </div>
    <section className="rounded-2xl border border-amber-700/60 bg-amber-950/20 p-3 space-y-1 text-xs text-amber-200">
      <strong className="block">RESEARCH ONLY · NO VERIFIED BETS</strong>
      <p>Previous-season team form, with offseason uncertainty. No certified current rosters, injuries, starters, player minutes or bookmaker lines. Percentages estimate winners, not profit or a betting edge.</p>
      <p>NBA player points and assists have NOT passed the baseline gate; no player props are published here.</p>
    </section>
    {loading && <p className="text-sm text-gray-400">Loading saved pregame research…</p>}
    {error && <p role="alert" className="rounded-xl border border-red-700/50 bg-red-950/20 p-3 text-xs text-red-200">NBA data unavailable: {error}. No guesses or fallback betting picks will appear.</p>}
    {doc && <>
      <div className="text-[11px] text-gray-400 space-y-1">
        <p>Original forecast frozen {tipLabel(doc.generated_at_utc)} · {doc.projected_games} historical opening-week previews</p>
        <p>Verified source foundation: {doc.historical_completed_regular_games.toLocaleString()} prior regular-season games · ESPN event IDs</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="NBA fixture date">
        {['ALL', ...dates].map(d => <button key={d} type="button" onClick={() => setDay(d)}
          aria-pressed={day === d}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${day === d ? 'bg-[#00FF41] text-black' : 'bg-[#252525] text-gray-300'}`}>
          {d === 'ALL' ? 'All games' : d.slice(5)}
        </button>)}
      </div>
      <input aria-label="Find NBA team" placeholder="Search a team" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full rounded-xl border border-[#333] bg-[#191919] px-4 py-3 text-sm text-stone-100" />
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
  </main>;
}
