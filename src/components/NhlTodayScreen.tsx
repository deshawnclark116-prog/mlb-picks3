/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import UnifiedSportGameCards, {type UnifiedGame} from './UnifiedSportGameCards';
import {groupNhlPredictionsByGame} from '../nhl/gameGrouping';
import {addTrueNhlShotCounts,nhlDisplayGameDates,nhlVisibleGames,NHL_COUNT_SCHEMA,type NhlSogResearch} from "../nhl/countResearch";
import { motion, AnimatePresence } from "motion/react";
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
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [confidenceFilter, setConfidenceFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
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
  const [pullY, setPullY] = useState(0);
  const [expandedGameKey, setExpandedGameKey] = useState<string | null>(null);

  const toggleExpand = (key: string) => {
    setExpandedGameKey((cur) => (cur === key ? null : key));
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setShotRefreshSeq(n=>n+1);
    try{await onRefresh();}
    finally{setIsRefreshing(false);}
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    touchStartY.current = containerRef.current.scrollTop === 0 ? e.touches[0].clientY : -1;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === -1) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      const damped = Math.min(80, Math.pow(diff, 0.8) * 1.5);
      setPullY(damped);
      if (diff > 10 && e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 50) {
      setIsRefreshing(true);
      setPullY(40);
      setShotRefreshSeq(n=>n+1);
      try{await onRefresh();}
      finally{setPullY(0);setIsRefreshing(false);}
    } else {
      setPullY(0);
    }
    touchStartY.current = -1;
  };

  // Do not mix stale points picks into an independent current SOG slate.
  const currentPredictions=predictions.filter(p=>countDates.includes(p.game_date));
  const marketsPresent = Array.from(new Set([
    ...currentPredictions.map((p) => p.market),
    ...(numericSog.some(d=>d.projected_count>0) ? ['shots_on_goal'] : [])
  ])).filter((m) => MARKET_LABELS[m]);

  const sortedPredictions = [...currentPredictions].sort((a, b) => (b.prob_pct ?? 0) - (a.prob_pct ?? 0));

  const filteredPredictions = sortedPredictions.filter((pred) => {
    if (marketFilter !== "ALL" && pred.market !== marketFilter) return false;
    if (confidenceFilter !== "ALL" && pred.confidence !== confidenceFilter) return false;
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
  const filteredSog=(marketFilter==='ALL'||marketFilter==='shots_on_goal') &&
    confidenceFilter==='ALL'
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
      className="flex flex-col h-full bg-[#0D0D0D] text-gray-200 select-none overflow-hidden"
    >
      {/* Pull indicator */}
      <motion.div
        id="nhl-pull-indicator-bar"
        className="flex items-center justify-center bg-[#0D0D0D] overflow-hidden text-[#00FF41] border-b border-[#1A1A1A]"
        animate={{ height: pullY > 0 ? Math.max(32, pullY) : 0, opacity: pullY > 0 ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      >
        <span className="text-[10px] font-mono tracking-widest flex items-center gap-2">
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
          {pullY > 50 ? "RELEASE TO UPDATE" : "PULL TO REFRESH"}
        </span>
      </motion.div>

      {/* Header */}
      <header id="nhl-screen-header" className="pt-8 px-6 pb-4 bg-[#0A0A0A] border-b border-[#1A1A1A] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase font-sans">
            PROP <span className="text-[#00FF41]">EDGE</span>
          </h1>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-mono">
            NHL • {countDates.join(' + ')}
          </p>
          {getLatestGeneratedAt(predictions) && (
            <p className="text-[8px] text-[#00FF41]/80 font-mono mt-1 uppercase tracking-wider">
              Updated: {new Date(getLatestGeneratedAt(predictions)!).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York",
              })} ET
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#141414] rounded-full border border-[#222]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41] shadow-[0_0_8px_#00FF41] animate-pulse"></div>
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider font-mono">LIVE</span>
          </div>
          <button
            id="nhl-refresh-btn"
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#222] text-gray-400 hover:text-[#00FF41] cursor-pointer transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || isRefreshing ? "animate-spin text-[#00FF41]" : ""}`} />
          </button>
        </div>
      </header>

      {/* Filters */}
      <div id="nhl-filter-controls-board" className="px-6 py-4 bg-[#0D0D0D] border-b border-[#1A1A1A] flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2 font-mono">Market</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
            {(["ALL", ...marketsPresent] as MarketFilter[]).map((m) => {
              const active = marketFilter === m;
              return (
                <button
                  id={`nhl-btn-market-${m}`}
                  key={m}
                  onClick={() => setMarketFilter(m)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide border transition-all cursor-pointer whitespace-nowrap uppercase ${
                    active
                      ? "bg-[#00FF41] text-black border-none font-bold"
                      : "bg-[#141414] text-gray-400 border-[#222] hover:text-white hover:border-gray-700"
                  }`}
                >
                  {m === "ALL" ? "All Markets" : MARKET_LABELS[m] || m}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2 font-mono">Confidence Group</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((conf) => {
              const active = confidenceFilter === conf;
              return (
                <button
                  id={`nhl-btn-conf-${conf}`}
                  key={conf}
                  onClick={() => setConfidenceFilter(conf)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide border transition-all cursor-pointer whitespace-nowrap uppercase ${
                    active
                      ? "bg-[#00FF41] text-black border-none font-bold"
                      : "bg-[#141414] text-gray-400 border-[#222] hover:text-white hover:border-gray-700"
                  }`}
                >
                  {conf === "ALL" ? "All Confidence" : `${conf} Conf`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-3 w-3 text-gray-600" />
          </span>
          <input
            id="nhl-team-search-input"
            type="text"
            placeholder="Filter by player, team, or pick..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-[#141414] text-gray-200 pl-8 pr-4 py-2 rounded-xl border border-[#222] focus:border-[#00FF41]/40 focus:outline-none placeholder-gray-700 font-sans transition-all"
          />
        </div>
      </div>

      {/* Scroll area */}
      <div
        id="nhl-predictions-scroll-area"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 scroll-smooth no-scrollbar"
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
          {numericSog.some(d=>d.projected_count>0)&&<p role="status" className="mb-2 text-[11px] text-gray-400">Frozen V2 numerical shot forecasts ({numericSog.map(d=>d.game_date+': '+d.projected_count).join(' · ')}). Shot milestone probabilities come directly from the locked count distribution—NOT from a sportsbook—and remain UNCALIBRATED research until genuinely frozen pregame probability outcomes pass forward validation. Game-day participation not certified. Points targets remain binary event probabilities.</p>}
          <p role="status" className="mb-2 text-[11px] text-gray-500">Anytime Goals: no source-verified goal-scoring model is connected yet. Anytime Point (goal OR assist) is a different event and is not substituted.</p>
          <UnifiedSportGameCards sport="NHL" prefix="nhl-game-card-" games={unifiedGames}/>
          </div>
        )}
      </div>
    </div>
  );
}
