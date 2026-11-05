/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import UnifiedSportGameCards, {type UnifiedGame} from './UnifiedSportGameCards';
import {groupNhlPredictionsByGame} from '../nhl/gameGrouping';
import {addTrueNhlShotCounts,nhlDisplayGameDates,nhlVisibleGames,NHL_COUNT_SCHEMA,dailyShotResearchForDate,type NhlSogResearch} from "../nhl/countResearch";
import { TrendingUp, RefreshCw, AlertTriangle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { NhlPrediction } from "../types";
import { getNhlPredictionKey, getLatestGeneratedAt } from "../utils";

// Franchise-aware grouping keeps all current NHL model projections under each real game.
function formatKickoff(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York",
  });
}

interface NhlTodayScreenProps {
  predictions: NhlPrediction[];
  gameDate: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

const MARKET_LABELS: Record<string, string> = {
  moneyline: "Moneyline",
  // Prior moneyline estimates are likewise alternate versions.
  points: "Anytime Point",
  // Earlier-model estimates are alternate versions of the SAME outcome.
  // The source remains available in model_source; no duplicate filter.
  shots_on_goal: "Shots on Goal",
  shots_on_goal_early_season: "Shots on Goal (Prior-Season-Informed)",
  goalie_saves: "Goalie Saves",
};

const PLAYER_MARKETS = ["points", "points_early_season", "shots_on_goal",
  "shots_on_goal_early_season", "goalie_saves"];

type MarketFilter =
  | "ALL"
  | "moneyline"
   | "points"
   | "shots_on_goal"
  | "shots_on_goal_early_season"
  | "goalie_saves";

export default function NhlTodayScreen({
  predictions,
  gameDate,
  loading,
  error,
  onRefresh,
}: NhlTodayScreenProps) {
  // Open on all available game and player models, not shots alone.
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [numericSog, setNumericSog] = useState<NhlSogResearch[]>([]);
  const [numericSogError, setNumericSogError] = useState<string|null>(null);
  // The points feed and the shot-count API are separate requests. A manual
  // Refresh must retry BOTH even when the game date hasn't changed.
  const [shotRefreshSeq, setShotRefreshSeq] = useState(0);
  const countDates=nhlDisplayGameDates(gameDate);
  const countDatesKey=countDates.join('|');
  useEffect(()=>{
    const ctl=new AbortController();
    setNumericSog([]);setNumericSogError(null);
    void (async()=>{
      // Request independently verified shot-model dates in parallel; one
      // missing day's source must not hide other genuine, frozen forecasts.
      const dates=countDatesKey.split('|');
      const results=await Promise.allSettled(dates.map(async date=>{
        // Freshest source first: the Node route reads the newest frozen forecasts
        // and applies the late lineup overlay (out players removed, confirmed
        // starters). The static compact file is rebuilt only every few hours, so it
        // is the fallback for the static AI Studio preview and for an offline API.
        // Either way the exact requested date and original source SHA are required.
        try{
          const response=await fetch('/api/nhl-count-research?date='+encodeURIComponent(date),{
            cache:'no-store',signal:ctl.signal
          });
          if(!response.ok){
            const info=await response.json().catch(()=>null);
            throw Error(date+': NHL shots '+response.status+
              (info?.details?': '+String(info.details):''));
          }
          const doc=await response.json();
          if(doc?.schema!==NHL_COUNT_SCHEMA||doc?.game_date!==date||
             doc?.research_only!==true||doc?.not_an_official_betting_board!==true)
            throw Error(date+': Unverified NHL numerical shot-count source');
          return doc as NhlSogResearch;
        }catch(apiUnavailable){
          if(ctl.signal.aborted)throw apiUnavailable;
          const compact=await fetch('/nhl-daily-shot-counts.json?t='+Date.now(),{
            cache:'no-store',signal:ctl.signal});
          if(!compact.ok)throw apiUnavailable;
          return dailyShotResearchForDate(await compact.json(),date);
        }
      }));
      if(ctl.signal.aborted)return;
      setNumericSog(results.filter((r):r is PromiseFulfilledResult<NhlSogResearch>=>
        r.status==='fulfilled').map(r=>r.value));
      const failures=results.filter((r):r is PromiseRejectedResult=>r.status==='rejected');
      if(failures.length)setNumericSogError(failures.map(r=>
        r.reason instanceof Error?r.reason.message:String(r.reason)).join(' | '));
    })();
    return()=>ctl.abort();
  },[countDatesKey,shotRefreshSeq]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedGameKey, setExpandedGameKey] = useState<string | null>(null);

  const toggleExpand = (key: string) => {
    setExpandedGameKey((cur) => (cur === key ? null : key));
  };

  // Refresh explicitly via the button. The old touchmove handler called
  // preventDefault() during a pull gesture and could steal vertical scrolling
  // from the nested NHL projection panel on mobile WebViews.
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setShotRefreshSeq(n=>n+1);
    try{await onRefresh();}
    finally{setIsRefreshing(false);}
  };

  // Do not mix stale points picks into an independent current SOG slate.
  const currentPredictions=predictions.filter(p=>countDates.includes(p.game_date));
  const marketsPresent = new Set([
    ...currentPredictions.map((p)=>p.market),
    ...(numericSog.some(d=>d.projected_count>0)?['shots_on_goal']:[])
  ]);

  const sortedPredictions = [...currentPredictions].sort((a, b) => (b.prob_pct ?? 0) - (a.prob_pct ?? 0));

  const filteredPredictions = sortedPredictions.filter((pred) => {
    if (marketFilter !== "ALL" && pred.market !== marketFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const teamMatch = pred.team?.toLowerCase().includes(q) || pred.opponent?.toLowerCase().includes(q);
      const playerMatch = pred.player?.toLowerCase().includes(q);
      const pickMatch = pred.pick?.toLowerCase().includes(q);
      if (!teamMatch && !playerMatch && !pickMatch) return false;
    }
    return true;
  });

  // Moneyline full team names and player-stat NHL abbreviations refer to the
  // same actual game. Normalize both before passing to the unified board.
  // No sportsbook line is necessary to preserve an original model projection.
  const gameGroups = groupNhlPredictionsByGame(filteredPredictions);
  const originalGames:UnifiedGame[]=gameGroups.map(g=>({
      id:g.key,label:g.teamA+' vs '+g.teamB,when:g.kickoff_utc,
      sourceLabel:'NHL CURRENT MODEL · FIXED-LINE CLASSIFIER',
      subtitle:g.game_date,
      picks:g.predictions.map((p,i)=>({
        id:getNhlPredictionKey(p)+'|'+i,player:p.player,team:p.team,
        market:p.market,target:p.pick,
        modelProbability:Number.isFinite(p.model_prob)?p.model_prob:null,
        prediction:null,predictionKind:'not_published' as const,
        unit:'',confidence:p.confidence,
        source:p.model_source||'NHL current fixed-line classifier',
        detail:(p.source_market?'Selected estimate: '+p.source_market+'. ':'')+
          (p.line!=null?'Model evaluated line '+p.line+'. ':'')+
          (p.games_played!=null?'Historical player games: '+p.games_played+'. ':'')+
          'No numeric player-stat median is present in this current predictions feed.'
      }))
    }));
  const filteredSog=(marketFilter==='ALL'||marketFilter==='shots_on_goal')
      ?numericSog.map(d=>({...d,projections:d.projections.filter(p=>
          !searchQuery.trim() || (p.player+' '+p.team+' '+p.opponent).toLowerCase()
            .includes(searchQuery.trim().toLowerCase()))}))
      :[];
  // Every dated source attaches only by exact original team/opponent/time.
  // A future points feed and tonight's frozen shot feed remain separate games.
  const unifiedGames=filteredSog.reduce<UnifiedGame[]>(
    (acc,doc)=>addTrueNhlShotCounts(acc,doc),originalGames);
  const viewState=nhlVisibleGames(unifiedGames.length,loading&&currentPredictions.length===0,error);

  return (
    <div
      id="nhl-today-screen-wrapper"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#0D0D0D] text-gray-200"
    >
      {/* Compact sport heading. Global shell provides brand and cross-sport navigation. */}
      <header id="nhl-screen-header" className="shrink-0 border-b border-white/10 bg-[#111719] px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-[16px] font-bold text-white">NHL <span className="font-normal text-gray-300">· {countDates.join(' · ')}</span></h1>
          <button type="button" onClick={()=>setShowFilters(v=>!v)} aria-expanded={showFilters}
            className={`ml-auto min-h-10 shrink-0 rounded-xl border px-3 text-[13px] font-semibold ${showFilters?'border-[#79FF48]/60 text-[#79FF48]':'border-white/10 text-gray-300'} bg-[#202a2c]`}>Filter</button>
          <button id="nhl-refresh-btn" type="button" onClick={handleManualRefresh}
            disabled={loading||isRefreshing} aria-label="Refresh NHL projections"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#202a2c] text-[#79FF48] disabled:opacity-50">
            <RefreshCw size={17} className={loading||isRefreshing?'animate-spin':''}/>
          </button>
        </div>
      </header>
      {showFilters&&<div id="nhl-filter-controls-board" className="shrink-0 space-y-3 border-b border-white/10 bg-[#111719] px-4 py-3">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="NHL projection markets">
          {(['ALL','moneyline','points','shots_on_goal','goalie_saves'] as MarketFilter[]).filter(m=>
            m==='ALL'||m==='shots_on_goal'||marketsPresent.has(m)).map(m=>
            <button id={`nhl-btn-market-${m}`} key={m} type="button" onClick={()=>setMarketFilter(m)} aria-pressed={marketFilter===m}
              className={`min-h-10 shrink-0 rounded-xl px-4 text-[12px] font-bold ${marketFilter===m?'bg-[#79FF48] text-[#111b13]':'border border-white/10 bg-[#202a2c] text-gray-200'}`}>
              {m==='ALL'?'All markets':m==='moneyline'?'Game winner':
                m==='points'?'Anytime points':m==='shots_on_goal'?'Shots on goal':'Goalie saves'}
            </button>)}
        </div>
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3 top-3 text-gray-500"/>
          <input id="nhl-team-search-input" type="search" value={searchQuery}
            onChange={e=>setSearchQuery(e.target.value)} placeholder="Find a player or team"
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#20282b] pl-10 pr-3 text-[13px] text-white outline-none focus:border-[#79FF48]/60"/>
        </div>
      </div>}
      {/* Scroll area */}
      <div
        id="nhl-predictions-scroll-area"
        role="region"
        aria-label="Scrollable NHL model projections"
        tabIndex={0}
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 py-4 space-y-3 pb-28 no-scrollbar [-webkit-overflow-scrolling:touch]"
      >
        {viewState==="loading" ? (
          <div id="nhl-loading-spinner-state" className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Loading NHL Board...</p>
          </div>
        ) : viewState==="error" ? (
          <div id="nhl-error-alert-state" className="p-4 rounded-3xl bg-[#141414] border border-red-950 text-gray-300">
            <div className="flex items-center gap-2 text-red-500 font-bold text-xs mb-1.5 uppercase font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>Network Sync Error</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="w-full text-center py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-mono uppercase font-bold tracking-wider transition-all"
            >
              Retry Sync
            </button>
          </div>
        ) : viewState==="empty" ? (
          <div id="nhl-empty-predictions-state" className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-[#222] bg-[#141414]/30">
            <TrendingUp className="w-8 h-8 text-gray-700 mb-3" />
            <h3 className="text-gray-300 text-sm font-semibold mb-1">No NHL picks found.</h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed mt-1">
              No source-verified NHL forecasts available for this game date, or every eligible game has
              a final result. Try changing filters, or check back closer to the next real slate.
            </p>
          </div>
        ) : (
          <div id="nhl-games-list" className="space-y-4">
            {error&&<p role="status" className="mb-2 text-[11px] text-amber-300">Points classifier unavailable; independent V2 shot-count projections remain visible.</p>}
            {numericSogError&&<div role="alert" className="mb-3 rounded-lg border border-amber-700/60 p-3 text-[11px] text-amber-200">
              <p>Shots on Goal source unavailable for one or more dates: {numericSogError}</p>
              <button type="button" onClick={handleManualRefresh} className="mt-2 rounded border border-amber-600 px-3 py-1 font-semibold">Retry Shots Feed</button>
            </div>}
          <UnifiedSportGameCards sport="NHL" prefix="nhl-game-card-" games={unifiedGames}/>
          <details data-testid="nhl-about-numbers" className="mb-2 rounded-xl bg-[#172321] px-3 py-1 text-[13px] leading-relaxed text-gray-300">
            <summary className="min-h-10 cursor-pointer py-2 font-semibold text-gray-200">About these numbers <span className="font-normal text-amber-200">· research estimates, not yet calibrated</span></summary>
            {numericSog.some(d=>d.projected_count>0)&&<p role="status" className="pb-2">Showing {numericSog.reduce((n,d)=>n+d.projected_count,0)} original numerical shot forecasts. The chance to reach each forecast comes from the frozen model distribution and is <strong className="text-amber-200">not yet calibrated</strong>.</p>}
            {marketFilter==='ALL'&&<p role="status" className="pb-2 text-gray-400">Showing game winners and anytime points when published, plus independent numerical shots. No separate goals/assists forecasts or eligible saves model is connected.</p>}
          </details>
          </div>
        )}
      </div>
    </div>
  );
}
