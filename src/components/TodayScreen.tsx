/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  RefreshCw, 
  Sparkles, 
  AlertTriangle, 
  User, 
  Dribbble, 
  Hash, 
  Layers,
  Percent,
  Search,
  CheckCircle,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { Prediction } from "../types";
import { formatOdds, formatPercent, formatKellyStake, formatToEasternTime, getPredictionKey } from "../utils";

interface TodayScreenProps {
  predictions: Prediction[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

export default function TodayScreen({ 
  predictions, 
  loading, 
  error, 
  onRefresh 
}: TodayScreenProps) {
  // Filters state
  const [confidenceFilter, setConfidenceFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  // Manual trigger
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = -1;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === -1) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    if (diff > 0) {
      const damped = Math.min(80, Math.pow(diff, 0.8) * 1.5);
      setPullY(damped);
      if (diff > 10) {
        if (e.cancelable) e.preventDefault();
      }
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

  const sortedPredictions = [...predictions].sort((a, b) => (b.prob_pct ?? 0) - (a.prob_pct ?? 0));

  const filteredPredictions = sortedPredictions.filter(pred => {
    if (confidenceFilter !== "ALL" && pred.confidence !== confidenceFilter) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const nameMatch = pred.player.toLowerCase().includes(q);
      const propMatch = pred.prop_type.toLowerCase().includes(q);
      const pickMatch = pred.pick.toLowerCase().includes(q);
      if (!nameMatch && !propMatch && !pickMatch) return false;
    }
    return true;
  });

  return (
    <div 
      id="today-screen-wrapper"
      className="flex flex-col h-full bg-[#0D0D0D] text-gray-200 select-none overflow-hidden"
    >
      {/* Pull indicator */}
      <motion.div 
        id="pull-indicator-bar"
        className="flex items-center justify-center bg-[#0D0D0D] overflow-hidden text-[#00FF41] border-b border-[#1A1A1A]"
        animate={{ 
          height: pullY > 0 ? Math.max(32, pullY) : 0,
          opacity: pullY > 0 ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      >
        <span className="text-[10px] font-mono tracking-widest flex items-center gap-2">
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          {pullY > 50 ? "RELEASE TO UPDATE" : "PULL TO REFRESH"}
        </span>
      </motion.div>

      {/* Sophisticated Dark Header */}
      <header id="screen-header" className="pt-8 px-6 pb-4 bg-[#0A0A0A] border-b border-[#1A1A1A] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase font-sans">
            PROP <span className="text-[#00FF41]">EDGE</span>
          </h1>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-mono">
            Daily MLB Value Finder
          </p>
          {predictions && predictions.length > 0 && predictions[0].generated_at && (
            <p className="text-[8px] text-[#00FF41]/80 font-mono mt-1 uppercase tracking-wider">
              Updated: {formatToEasternTime(predictions[0].generated_at)}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Pulsating status badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#141414] rounded-full border border-[#222]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41] shadow-[0_0_8px_#00FF41] animate-pulse"></div>
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider font-mono">LIVE</span>
          </div>

          <button 
            id="today-refresh-btn"
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#222] text-gray-400 hover:text-[#00FF41] cursor-pointer transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loading || isRefreshing) ? "animate-spin text-[#00FF41]" : ""}`} />
          </button>
        </div>
      </header>

      {/* Sticky Filters Board */}
      <div id="filter-controls-board" className="px-6 py-4 bg-[#0D0D0D] border-b border-[#1A1A1A] flex flex-col gap-4">
        
        {/* Confidence Filter Chips Scrollable */}
        <div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2 font-mono">Confidence Group</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((conf) => {
              const active = confidenceFilter === conf;
              return (
                <button
                  id={`btn-conf-${conf}`}
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

        {/* Player Name Search bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-3 w-3 text-gray-600" />
          </span>
          <input
            id="player-search-input"
            type="text"
            placeholder="Filter by player, selection, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-[#141414] text-gray-200 pl-8 pr-4 py-2 rounded-xl border border-[#222] focus:border-[#00FF41]/40 focus:outline-none placeholder-gray-700 font-sans transition-all"
          />
        </div>
      </div>

      {/* Main Predictions Scroll Area */}
      <div 
        id="predictions-scroll-area"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 scroll-smooth no-scrollbar"
      >
        {loading && predictions.length === 0 ? (
          <div id="loading-spinner-state" className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Polling Live Odds...</p>
          </div>
        ) : error ? (
          <div id="error-alert-state" className="p-4 rounded-3xl bg-[#141414] border border-red-950 text-gray-300">
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
        ) : filteredPredictions.length === 0 ? (
          <div id="empty-predictions-state" className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-[#222] bg-[#141414]/30">
            <TrendingUp className="w-8 h-8 text-gray-700 mb-3" />
            <h3 className="text-gray-300 text-sm font-semibold mb-1">
              No predictions found.
            </h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed mt-1">
              Try changing search queries or selecting other confidence group filters.
            </p>
          </div>
        ) : (
          <div id="predictions-list" className="space-y-4">
            {/* Dynamic performance metrics for graded/settled props */}
            {(() => {
              const settled = predictions.filter(p => p.outcome === "WIN" || p.outcome === "LOSS");
              if (settled.length === 0) return null;
              
              const wins = settled.filter(p => p.outcome === "WIN").length;
              const losses = settled.filter(p => p.outcome === "LOSS").length;
              const rate = (wins / settled.length) * 100;
              
              return (
                <motion.div 
                  id="historical-stats-banner"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"
                >
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-gray-500 font-bold">Accuracy Diagnostics</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">Neural Pipeline Performance</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-gray-500 uppercase">Graded Slate</div>
                      <div className="text-xs font-mono font-bold text-white">
                        <span className="text-[#00FF41]">{wins}W</span> - <span className="text-red-500">{losses}L</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-[#1F1F1F]" />
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-gray-500 uppercase">Hit Rate</div>
                      <div className="text-sm font-mono font-black text-[#00FF41]">
                        {rate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            <AnimatePresence mode="popLayout">
              {filteredPredictions.map((pred, i) => {
                // Confidence badge chip
                let confidenceChipClass = "bg-[#252525] text-gray-400 border-[#333]";
                if (pred.confidence === "HIGH") {
                  confidenceChipClass = "bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/20";
                } else if (pred.confidence === "MEDIUM") {
                  confidenceChipClass = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
                } else if (pred.confidence === "LOW") {
                  confidenceChipClass = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
                }

                return (
                  <motion.div
                    id={`prediction-card-${i}`}
                    key={getPredictionKey(pred)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.3) }}
                    className={`bg-[#141414] rounded-3xl p-5 border shadow-lg flex flex-col gap-4 relative overflow-hidden group transition-all ${
                      pred.outcome === "WIN" 
                        ? "border-[#00FF41]/20 shadow-[#00FF41]/3"
                        : pred.outcome === "LOSS"
                        ? "border-red-500/10"
                        : "border-[#1F1F1F]"
                    }`}
                  >
                    {/* Upper heading segment */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5 flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-white leading-none tracking-tight truncate">
                            {pred.player}
                          </h2>
                          {pred.outcome && (
                            <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded uppercase ${
                              pred.outcome === "WIN" 
                                ? "bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/30"
                                : pred.outcome === "LOSS"
                                ? "bg-red-500/20 text-red-500 border border-red-500/30"
                                : "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
                            }`}>
                              {pred.outcome}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {pred.prop_type} • <span className="text-white font-semibold italic">{pred.pick}</span>
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border tracking-wider font-mono uppercase ${confidenceChipClass}`}>
                          {pred.confidence}
                        </span>
                      </div>
                    </div>

                    {/* Headline Hit Probability block */}
                    <div className="bg-[#1A1A1A]/50 rounded-2xl p-4 border border-[#222] flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-mono mb-1">
                        Hit Probability
                      </span>
                      <span className="text-4xl font-black font-mono text-[#00FF41] tracking-tight drop-shadow-[0_0_12px_rgba(0,255,65,0.2)]">
                        {pred.prob_pct !== undefined && pred.prob_pct !== null ? `${pred.prob_pct.toFixed(1)}%` : "N/A"}
                      </span>
                    </div>

                    {/* Styled internal grid divider */}
                    <div className="grid grid-cols-2 gap-4 border-t border-[#1F1F1F] pt-3">
                      
                      {/* Left specs: Proj/Stake/Actual */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-[9px] text-[#555] uppercase font-mono font-bold leading-none mb-1">Projected</p>
                          <p className="text-base font-mono font-bold text-white">
                            {pred.projected !== undefined && pred.projected !== null ? pred.projected.toFixed(2) : "N/A"}
                          </p>
                        </div>
                        {pred.actual_value !== undefined && pred.actual_value !== null && (
                          <div>
                            <p className="text-[9px] text-[#555] uppercase font-mono font-bold leading-none mb-1">Actual</p>
                            <p className={`text-base font-mono font-bold ${
                              pred.outcome === "WIN" ? "text-[#00FF41]" : pred.outcome === "LOSS" ? "text-red-500" : "text-gray-300"
                            }`}>
                              {pred.actual_value.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right specs: Odds & Stake */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-[9px] text-[#555] uppercase font-mono font-bold leading-none mb-1">Odds</p>
                          <p className="text-base font-mono font-bold text-[#00FF41]">
                            {formatOdds(pred.odds)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-[#555] uppercase font-mono font-bold leading-none mb-1 font-sans">Stake</p>
                          <p className="text-sm font-mono font-bold text-white">
                            {formatKellyStake(pred.kelly_fraction)} <span className="text-[10px] font-normal text-[#555] font-mono">Kelly</span>
                          </p>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
