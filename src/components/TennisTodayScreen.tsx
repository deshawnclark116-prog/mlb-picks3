/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import UnifiedSportGameCards, {type UnifiedGame} from './UnifiedSportGameCards';
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, RefreshCw, AlertTriangle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { TennisPrediction } from "../types";
import { getTennisPredictionKey, getLatestGeneratedAt } from "../utils";
import { liveTennisMoneylines } from '../tennis/moneylineOnly';

interface TennisTodayScreenProps {
  predictions: TennisPrediction[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

// Only moneyline forecast rows are eligible. The model's historical
// moneyline research gates failed both tours; no paid bookmaker edge proven.
interface TennisMatchGroup {
  key: string;
  player1: string;
  player2: string;
  tourney: string;
  surface: string;
  surface_confirmed: boolean;
  best_of: number;
  start_time_utc?: string;
  predictions: TennisPrediction[];
}

// Keyed on the unordered player pair plus tourney (not just the pair) --
// same two players could in principle appear across more than one event
// in the feed, and the tourney qualifier keeps those from colliding.
function groupPredictionsByMatch(preds: TennisPrediction[]): TennisMatchGroup[] {
  const map = new Map<string, TennisMatchGroup>();
  for (const p of preds) {
    if (!p.player1 || !p.player2) continue;
    const key = [p.player1, p.player2].sort().join("__") + "::" + p.tourney;
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        player1: p.player1,
        player2: p.player2,
        tourney: p.tourney,
        surface: p.surface,
        surface_confirmed: p.surface_confirmed,
        best_of: p.best_of,
        start_time_utc: p.start_time_utc,
        predictions: [],
      };
      map.set(key, group);
    }
    group.predictions.push(p);
  }
  // Real start time first, same as CFB/NFL/NHL -- the backend already
  // carried start_time_utc on every pick, it just wasn't being sorted by
  // (found live 2026-09-27, user asked why every sport wasn't fixed
  // alongside CFB).
  return Array.from(map.values()).sort((a, b) =>
    (a.start_time_utc || "9999").localeCompare(b.start_time_utc || "9999")
  );
}

function formatMatchTime(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York",
  });
}

export default function TennisTodayScreen({
  predictions,
  loading,
  error,
  onRefresh,
}: TennisTodayScreenProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [expandedMatchKey, setExpandedMatchKey] = useState<string | null>(null);

  const toggleExpand = (key: string) => {
    setExpandedMatchKey((cur) => (cur === key ? null : key));
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
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
      await onRefresh();
      setPullY(0);
      setIsRefreshing(false);
    } else {
      setPullY(0);
    }
    touchStartY.current = -1;
  };

  const sortedPredictions = [...liveTennisMoneylines(predictions)]
    .sort((a,b)=>(b.prob_pct ?? b.model_prob*100)-(a.prob_pct ?? a.model_prob*100));
  const filteredPredictions = sortedPredictions.filter((pred) => {
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const nameMatch =
        pred.player1?.toLowerCase().includes(q) || pred.player2?.toLowerCase().includes(q);
      const tourneyMatch = pred.tourney?.toLowerCase().includes(q);
      const pickMatch = pred.pick?.toLowerCase().includes(q);
      if (!nameMatch && !tourneyMatch && !pickMatch) return false;
    }
    return true;
  });

  const matchGroups = groupPredictionsByMatch(filteredPredictions);
  const unifiedGames:UnifiedGame[]=matchGroups.map(g=>({
      id:g.key,label:g.player1+' vs '+g.player2,when:g.start_time_utc,
      sourceLabel:'ATP/WTA MATCH WINNER · RESEARCH ONLY',
      subtitle:g.tourney+' · '+g.surface+(g.surface_confirmed?'':' (unverified surface)'),
      picks:g.predictions.map((p,i)=>({
        id:getTennisPredictionKey(p)+'|'+i,player:p.player1+' vs '+p.player2,
        market:p.market,target:p.pick,
        modelProbability:Number.isFinite(p.model_prob)?p.model_prob:null,
        prediction:p.market==='total_games'&&p.predicted_mean!=null&&Number.isFinite(p.predicted_mean)
          ?p.predicted_mean:null,
        predictionKind:p.market==='total_games'&&p.predicted_mean!=null&&Number.isFinite(p.predicted_mean)
          ?'mean' as const:'not_published' as const,
        unit:p.market==='total_games'?'games':'',confidence:p.confidence,
        source:p.model_source||'Tennis model',
        detail:'Unvalidated match-winner probability. No sportsbook price or calibrated market edge. '+
          (p.note||'')+' '+(p.book?'Published book: '+p.book+'. ': '')+
          'No independent current sportsbook availability is certified by this screen.'
      }))
    }));

  return (
    <div
      id="tennis-today-screen-wrapper"
      className="flex flex-col h-full bg-[#0D0D0D] text-gray-200 select-none overflow-hidden"
    >
      {/* Pull indicator */}
      <motion.div
        id="tennis-pull-indicator-bar"
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
      <header id="tennis-screen-header" className="flex items-center justify-between gap-3 border-b border-[#1A1A1A] bg-[#0A0A0A] px-4 py-2">
        <h1 className="min-w-0 truncate text-[16px] font-bold text-white">Tennis <span className="font-normal text-gray-300">· ATP &amp; WTA</span></h1>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={()=>setShowFilters(v=>!v)} aria-expanded={showFilters} className={`min-h-10 rounded-xl border px-3 text-[13px] font-semibold bg-[#202a2c] ${showFilters?'border-[#79FF48]/60 text-[#79FF48]':'border-white/10 text-gray-300'}`}>Filter</button>
          <button id="tennis-refresh-btn" onClick={handleManualRefresh} disabled={loading || isRefreshing} aria-label="Refresh tennis feed"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#222] bg-[#141414] text-gray-400 hover:text-[#00FF41]" title="Refresh feed">
            <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? "animate-spin text-[#00FF41]" : ""}`} />
          </button>
        </div>
      </header>

      {/* Single-market moneyline board: no false confidence tabs or
           non-ML sportsbook filters that the model hasn't validated. */}
      {showFilters&&<div id="tennis-filter-controls-board" className="px-4 py-3 bg-[#0D0D0D] border-b border-[#1A1A1A] flex flex-col gap-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-3 w-3 text-gray-600" />
          </span>
          <input
            id="tennis-player-search-input"
            type="text"
            placeholder="Filter by player, tournament, or pick..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-[#141414] text-gray-200 pl-8 pr-4 py-2 rounded-xl border border-[#222] focus:border-[#00FF41]/40 focus:outline-none placeholder-gray-700 font-sans transition-all"
          />
        </div>
      </div>}

      {/* Scroll area */}
      <div
        id="tennis-predictions-scroll-area"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 scroll-smooth no-scrollbar"
      >
        {loading && predictions.length === 0 ? (
          <div id="tennis-loading-spinner-state" className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Loading Tennis Board...</p>
          </div>
        ) : error ? (
          <div id="tennis-error-alert-state" className="p-4 rounded-3xl bg-[#141414] border border-red-950 text-gray-300">
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
        ) : matchGroups.length === 0 ? (
          <div id="tennis-empty-predictions-state" className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-[#222] bg-[#141414]/30">
            <TrendingUp className="w-8 h-8 text-gray-700 mb-3" />
            <h3 className="text-gray-300 text-sm font-semibold mb-1">No tennis picks found.</h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed mt-1">
              Moneyline forecasts appear only for matches where both players have sufficient history.
              No other tennis markets are published. Check back when new ATP or WTA matches are scheduled.
            </p>
          </div>
        ) : (
          <div id="tennis-matches-list" className="space-y-4">
            <UnifiedSportGameCards sport="TENNIS" prefix="tennis-match-card-" games={unifiedGames}/>
        <div className="mt-3 rounded-xl border border-[#333] bg-[#141414] p-3">
          <p className="text-[11px] font-bold uppercase text-[#00FF41]">Match winner (moneyline) only</p>
          <p className="mt-1 text-[11px] text-gray-400">Model probability is not a verified sportsbook edge. ATP and WTA research forecasts only; no certified bets or odds.</p>
        </div>

          </div>
        )}
      </div>
    </div>
  );
}
