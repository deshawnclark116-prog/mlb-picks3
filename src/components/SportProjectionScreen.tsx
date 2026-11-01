import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Search } from "lucide-react";

type Sport = "cfb" | "nhl";
type CfbRow = {
  player: string; team: string; opponent: string; player_id: string; game_id: string;
  market: string; kickoff_utc: string; unit: string;
  baseline: { mean: number; median: number; last_three: number[] };
  monte_carlo: null | { mean: number; median: number; p10: number; p90: number; n_simulations: number };
};
type CfbFeed = {
  schema: "cfb-player-stat-projections-research-v1"; research_only: true;
  forecast_count: number; monte_carlo_count: number; original_run_id: number;
  original_baseline_generated_at: string; forecasts: CfbRow[];
};
type NhlFeed = {
  schema: "nhl-v2-sog-nfl-style-shadow-v1"; status: string; dates: string[];
  row_fields: string[]; horizons: string[]; total_valid_forecasts: number;
  forecasts: Record<string, unknown[][]>;
};
type Feed = CfbFeed | NhlFeed;

const n = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? v.toFixed(1) : "–";
const pct = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? (v * 100).toFixed(1) + "%" : "–";
const title = (s: string) => s.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

function NumberCell({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg border border-[#262626] bg-[#101010] p-2">
    <div className="text-[9px] uppercase text-gray-500">{label}</div>
    <div className="text-sm font-bold text-stone-100 break-words">{value}</div>
  </div>;
}

function CfbModelRows({ doc, query, market, limit }: {
  doc: CfbFeed; query: string; market: string; limit: number;
}) {
  const rows = useMemo(() => doc.forecasts.filter(r =>
    (!query || (r.player + " " + r.team + " " + r.opponent).toLowerCase().includes(query))
    && (market === "ALL" || r.market === market)
  ).sort((a,b) => a.kickoff_utc.localeCompare(b.kickoff_utc)), [doc,query,market]);
  return <>
    <div className="text-[11px] text-gray-400 py-2">{rows.length} original pregame statistical estimates, {doc.monte_carlo_count} with separate simulated distributions</div>
    {rows.slice(0, limit).map(r => {
      const mc = r.monte_carlo;
      const value = mc?.mean ?? r.baseline.mean;
      return <article key={r.game_id + "|" + r.player_id + "|" + r.market} className="rounded-2xl border border-[#292929] bg-[#171717] p-4 space-y-3">
        <div className="flex justify-between gap-2">
          <div><div className="font-bold text-stone-100">{r.player}</div>
            <div className="text-[11px] text-gray-400">{r.team} vs {r.opponent}</div>
            <div className="text-[11px] text-gray-500">{title(r.market)} · {r.kickoff_utc.slice(0,10)}</div>
          </div>
          <div className="text-[10px] text-amber-300 text-right shrink-0">{mc ? "UNCALIBRATED MC" : "3-GAME BASELINE"}</div>
        </div>
        <div className="bg-[#0D0D0D] rounded-xl p-3 text-center">
          <div className="text-[10px] tracking-widest text-gray-400 uppercase">Estimated {title(r.market)}</div>
          <div className="text-3xl font-black text-[#00FF41]">{n(value)} <span className="text-sm font-medium text-gray-400">{r.unit}</span></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumberCell label="Prior 3 Avg" value={n(r.baseline.mean)} />
          <NumberCell label={mc ? "MC Median" : "Prior Median"} value={n(mc?.median ?? r.baseline.median)} />
          <NumberCell label={mc ? "MC P10–P90" : "Prior Games"} value={mc ? n(mc.p10) + "–" + n(mc.p90) : r.baseline.last_three.map(n).join(", ")} />
        </div>
        <div className="text-[10px] text-gray-500">Prior actual totals: {r.baseline.last_three.map(n).join(" · ")}{mc ? " · " + mc.n_simulations.toLocaleString() + " simulated outcomes" : ""}</div>
      </article>;
    })}
    {rows.length === 0 && <div className="text-sm text-amber-300">No qualifying player-stat estimates match your filters.</div>}
    {rows.length > limit && <div className="text-xs text-gray-500">Showing first {limit} of {rows.length} rows. Narrow your search to find a player.</div>}
  </>;
}

function NhlModelRows({ doc, query, horizon, date, limit }: {
  doc: NhlFeed; query: string; horizon: string; date: string; limit: number;
}) {
  const fields = useMemo(() => Object.fromEntries(doc.row_fields.map((x,i) => [x,i])), [doc]);
  const get = (r: unknown[], k: string) => r[fields[k]];
  const rows = useMemo(() => (doc.forecasts[horizon] || []).filter(r =>
    (!date || get(r,"game_date") === date) &&
    (!query || (String(get(r,"player")) + " " + String(get(r,"team")) + " " + String(get(r,"opponent"))).toLowerCase().includes(query))
  ), [doc,horizon,date,query,fields]);
  return <>
    <div className="text-[11px] text-gray-400 py-2">{rows.length} historically recorded {horizon} player-shot projections</div>
    {rows.slice(0,limit).map((r,i) => <article key={String(get(r,"game_id")) + "|" + String(get(r,"player_id")) + "|" + horizon + "|" + i} className="rounded-2xl border border-[#292929] bg-[#171717] p-4 space-y-3">
      <div>
        <div className="font-bold text-stone-100">{String(get(r,"player"))}</div>
        <div className="text-[11px] text-gray-400">{String(get(r,"team"))} vs {String(get(r,"opponent"))} · {String(get(r,"game_date"))} · {horizon}</div>
      </div>
      <div className="rounded-xl bg-[#0D0D0D] p-3 text-center">
        <div className="text-[10px] tracking-widest text-gray-400 uppercase">Model-expected shots on goal</div>
        <div className="text-3xl font-black text-[#00FF41]">{n(get(r,"mean"))}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberCell label="Median" value={n(get(r,"median"))} />
        <NumberCell label="P10–P90" value={n(get(r,"p10")) + "–" + n(get(r,"p90"))} />
        <NumberCell label="SD" value={n(get(r,"sd"))} />
        <NumberCell label="P(1+)" value={pct(get(r,"p_ge1"))} />
        <NumberCell label="P(2+)" value={pct(get(r,"p_ge2"))} />
        <NumberCell label="P(3+)" value={pct(get(r,"p_ge3"))} />
        <NumberCell label="P(4+)" value={pct(get(r,"p_ge4"))} />
        <NumberCell label="P(5+)" value={pct(get(r,"p_ge5"))} />
        <NumberCell label="P(0)" value={pct(get(r,"p0"))} />
      </div>
      <div className="text-[10px] text-gray-500">Historical frozen B2 research snapshot. Threshold probabilities derived later from frozen distribution, not original pregame book picks. Roster and lines unverified.</div>
    </article>)}
    {!rows.length && <div className="text-sm text-amber-300">No verified projections match this date, horizon and search.</div>}
    {rows.length > limit && <div className="text-xs text-gray-500">Showing first {limit} of {rows.length} rows. Use filters for more.</div>}
  </>;
}

/** Current predictions open first; frozen research stays available but separate. */
export default function SportProjectionScreen({ sport, legacy }: { sport: Sport; legacy: React.ReactNode }) {
  const [mode, setMode] = useState<"CURRENT"|"RESEARCH">("CURRENT");
  const [doc, setDoc] = useState<Feed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("ALL");
  const [horizon, setHorizon] = useState("T90");
  const [date, setDate] = useState("");
  const [limit, setLimit] = useState(60);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/model-projections/" + sport + "?t=" + Date.now(), {cache:"no-store"});
      const data = await response.json();
      if (!response.ok) throw Error(data.details || data.error || "Research feed unavailable");
      if (sport === "cfb" && (data.schema !== "cfb-player-stat-projections-research-v1" || !data.research_only))
        throw Error("Unverified CFB model feed");
      if (sport === "nhl" && (data.schema !== "nhl-v2-sog-nfl-style-shadow-v1" ||
          data.status !== "RESEARCH_ONLY_NOT_VALIDATED_FOR_BETTING")) throw Error("Unverified NHL model feed");
      setDoc(data);setError(null);
      if (sport === "nhl") {
        setHorizon((old) => data.horizons.includes(old) ? old : data.horizons[0]);
        setDate((old) => data.dates.includes(old) ? old : (data.dates.at(-1) || ""));
      }
    } catch (e) {
      setDoc(null);setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, [sport]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {void refresh();}, 180000);
    return () => clearInterval(timer);
  }, [refresh]);

  const cfb = sport === "cfb" && doc?.schema === "cfb-player-stat-projections-research-v1" ? doc : null;
  const nhl = sport === "nhl" && doc?.schema === "nhl-v2-sog-nfl-style-shadow-v1" ? doc : null;

  return <div className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-[#0D0D0D]">
    <div className="shrink-0 px-4 pt-3 pb-2 border-b border-[#222] bg-[#111]">
      <div className="text-sm font-bold text-stone-100">{sport.toUpperCase()} PREDICTIONS</div>
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={() => setMode("CURRENT")} aria-pressed={mode==="CURRENT"} className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode==="CURRENT" ? "bg-[#00FF41] text-black" : "bg-[#262626] text-gray-300"}`}>Current predictions</button>
        <button type="button" onClick={() => setMode("RESEARCH")} aria-pressed={mode==="RESEARCH"} className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode==="RESEARCH" ? "bg-[#00FF41] text-black" : "bg-[#262626] text-gray-300"}`}>Research archive</button>
      </div>
    </div>
    {mode === "CURRENT" ? <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{legacy}</div> :
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-4 pb-28 space-y-3 [-webkit-overflow-scrolling:touch]">
        <div className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-3 text-amber-200 text-xs leading-relaxed">
          <strong>RESEARCH — NOT OFFICIAL PICKS.</strong> {sport==="cfb"
          ? "Original 2026 Week 6 pregame three-game baselines and an uncalibrated rushing simulation subset. This is NOT a validated forward live projection system."
          : "Frozen historical player shot-count forecasts. Probabilities were repaired after the historical forecast. No certified starting roster or sportsbook-specific main lines."}
          {" "}Missing research data is never replaced with older OVER/UNDER picks.
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1"><Search className="absolute top-3 left-3 w-4 h-4 text-gray-500" />
            <input value={query} onChange={e=>{setQuery(e.target.value.toLowerCase());setLimit(60);}} placeholder="Search player or team"
              className="w-full rounded-xl bg-[#191919] border border-[#333] text-gray-100 py-2.5 pl-9 pr-3 text-sm" />
          </div>
          <button type="button" onClick={()=>void refresh()} aria-label="Refresh source-verified projections" className="rounded-xl bg-[#202020] p-3 text-[#00FF41]"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
        {loading && !doc && <p className="text-xs text-gray-400">Checking original-source projection evidence…</p>}
        {error && <div role="alert" className="rounded-xl border border-amber-700 p-4 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 inline mr-2" />No verified {sport.toUpperCase()} model projection feed: {error}. The legacy classifier will not appear automatically.
        </div>}
        {cfb && <>
          <div className="text-[11px] text-gray-500">Original GitHub Actions run #{cfb.original_run_id} · original forecast {cfb.original_baseline_generated_at}</div>
          <select aria-label="CFB statistical market" value={market} onChange={e=>{setMarket(e.target.value);setLimit(60);}} className="w-full rounded-lg p-2.5 bg-[#202020] text-stone-100 text-sm border border-[#333]">
            {["ALL","rushing_yards","passing_touchdowns","anytime_touchdowns"].map(k=><option key={k} value={k}>{title(k)}</option>)}
          </select>
          <CfbModelRows doc={cfb} query={query} market={market} limit={limit} />
          {cfb.forecasts.length > limit && <button className="w-full p-3 rounded-xl bg-[#202020] text-[#00FF41] text-xs" onClick={()=>setLimit(v=>v+60)}>Load more</button>}
        </>}
        {nhl && <>
          <div className="text-[11px] text-gray-500">{nhl.total_valid_forecasts} source-verified historical observations · not current live picks</div>
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="NHL horizon" value={horizon} onChange={e=>{setHorizon(e.target.value);setLimit(60);}} className="bg-[#202020] text-white border border-[#333] rounded-lg p-2 text-sm">
              {nhl.horizons.map(h=><option value={h} key={h}>{h}</option>)}
            </select>
            <select aria-label="NHL historical game date" value={date} onChange={e=>{setDate(e.target.value);setLimit(60);}} className="bg-[#202020] text-white border border-[#333] rounded-lg p-2 text-sm">
              <option value="">All historical dates</option>
              {nhl.dates.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <NhlModelRows doc={nhl} query={query} horizon={horizon} date={date} limit={limit}/>
          <button className="w-full p-3 rounded-xl bg-[#202020] text-[#00FF41] text-xs" onClick={()=>setLimit(v=>v+60)}>Load more historical rows</button>
        </>}
      </div>}
  </div>;
}
