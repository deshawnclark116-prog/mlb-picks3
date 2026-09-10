/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, RefreshCw, AlertTriangle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { TennisPrediction } from "../types";
import { getTennisPredictionKey, getLatestGeneratedAt } from "../utils";

interface TennisTodayScreenProps {
  predictions: TennisPrediction[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

// Only two markets ever appear here -- total_aces, double_faults,
// moneyline, and games_spread all failed their backtests and are never
// generated (see mlb-picks2's tennis_serving_builder_a.py).
const MARKET_LABELS: Record<string, string> = {
  total_games: "Total Games",
  set_betting: "Correct Score (Projection)",
};

type MarketFilter = "ALL" | "total_games" | "set_betting";

interface TennisMatchGroup {
  key: string;
  player1: string;
  player2: string;
  tourney: string;
  surface: string;
  surface_confirmed: boolean;
  best_of: number;
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
        predictions: [],
      };
      map.set(key, group);
    }
    group.predictions.push(p);
  }
  return Array.from(map.values()).sort(
    (a, b) => (b.predictions[0]?.prob_pct ?? 0) - (a.predictions[0]?.prob_pct ?? 0)
  );
}

export default function TennisTodayScreen({
  predictions,
  loading,
  error,
  onRefresh,
}: TennisTodayScreenProps) {
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [confidenceFilter, setConfidenceFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  const marketsPresent = Array.from(new Set(predictions.map((p) => p.market))).filter(
    (m) => MARKET_LABELS[m]
  );

  const sortedPredictions = [...predictions].sort((a, b) => (b.prob_pct ?? 0) - (a.prob_pct ?? 0));

  const filteredPredictions = sortedPredictions.filter((pred) => {
    if (marketFilter !== "ALL" && pred.market !== marketFilter) return false;
    // set_betting picks have no confidence field at all (unagraded, no
    // real market to grade against) -- a confidence filter other than
    // ALL should only ever show total_games picks, never hide them
    // silently by matching undefined against a real tier.
    if (confidenceFilter !== "ALL" && pred.confidence !== confidenceFilter) return false;
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
      <header id="tennis-screen-header" className="pt-8 px-6 pb-4 bg-[#0A0A0A] border-b border-[#1A1A1A] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase font-sans">
            PROP <span className="text-[#00FF41]">EDGE</span>
          </h1>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-mono">
            ATP Player Props
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
            id="tennis-refresh-btn"
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
      <div id="tennis-filter-controls-board" className="px-6 py-4 bg-[#0D0D0D] border-b border-[#1A1A1A] flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2 font-mono">Market</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
            {(["ALL", ...marketsPresent] as MarketFilter[]).map((m) => {
              const active = marketFilter === m;
              return (
                <button
                  id={`tennis-btn-market-${m}`}
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
                  id={`tennis-btn-conf-${conf}`}
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
          <p className="text-[9px] text-gray-700 font-mono mt-1.5 leading-tight">
            Correct-score picks are unagraded projections (no real market to grade against) and won't
            match a confidence filter other than "All".
          </p>
        </div>

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
      </div>

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
              Picks only appear for matches where both players have enough ATP match history to rate,
              and (for Total Games) a real market line was found. Try changing filters, or check back
              when more matches are scheduled.
            </p>
          </div>
        ) : (
          <div id="tennis-matches-list" className="space-y-4">
            <AnimatePresence mode="popLayout">
              {matchGroups.map((match, idx) => {
                const isExpanded = expandedMatchKey === match.key;
                return (
                  <motion.div
                    id={`tennis-match-card-${idx}`}
                    key={match.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.3) }}
                    onClick={() => toggleExpand(match.key)}
                    className={`bg-[#141414] rounded-3xl p-5 border cursor-pointer select-none transition-all duration-200 flex flex-col ${
                      isExpanded ? "border-[#00FF41]/40 shadow-[0_0_15px_rgba(0,255,65,0.04)] bg-[#171717]" : "border-[#1F1F1F] hover:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-white leading-tight tracking-tight truncate">
                          {match.player1} <span className="text-gray-600 font-normal">vs</span> {match.player2}
                        </h2>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-1">
                          {match.tourney} • {match.surface}
                          {!match.surface_confirmed && (
                            <span className="text-gray-700"> (assumed)</span>
                          )}
                          {" "}• Bo{match.best_of}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0 pl-4">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded border tracking-wider font-mono uppercase bg-[#252525] text-gray-400 border-[#333]">
                          {match.predictions.length} {match.predictions.length === 1 ? "PROP" : "PROPS"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center mt-3 pt-2 border-t border-[#1F1F1F]/50">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          id={`tennis-match-props-expanded-${idx}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden mt-4 pt-4 border-t border-[#1F1F1F] w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-3 pb-1">
                            {match.predictions.map((pred) => (
                              <div
                                key={getTennisPredictionKey(pred)}
                                className="bg-[#1C1C1C] rounded-2xl p-4 border border-[#242424] space-y-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="text-[10px] text-gray-400">
                                      {MARKET_LABELS[pred.market] || pred.market} •{" "}
                                      <span className="text-white font-semibold italic">{pred.pick}</span>
                                    </p>
                                  </div>
                                  {pred.confidence ? (
                                    <span
                                      className={`text-[8px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 border rounded shrink-0 ${
                                        pred.confidence === "HIGH"
                                          ? "bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/20"
                                          : pred.confidence === "MEDIUM"
                                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                      }`}
                                    >
                                      {pred.confidence}
                                    </span>
                                  ) : pred.unagraded ? (
                                    <span className="text-[8px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 border rounded shrink-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                                      Projection
                                    </span>
                                  ) : null}
                                </div>

                                <div className="bg-[#141414] rounded-xl p-2.5 border border-[#222] flex flex-col items-center justify-center text-center shadow-inner">
                                  <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-widest font-mono mb-0.5">
                                    {pred.market === "total_games" ? "Hit Probability" : "Model Probability"}
                                  </span>
                                  <span className="text-2xl font-black font-mono text-[#00FF41] tracking-tight drop-shadow-[0_0_8px_rgba(0,255,65,0.15)]">
                                    {pred.prob_pct !== undefined && pred.prob_pct !== null ? `${pred.prob_pct.toFixed(1)}%` : "N/A"}
                                  </span>
                                </div>

                                {pred.market === "total_games" ? (
                                  <div className="grid grid-cols-3 gap-2 text-center bg-[#141414] p-2 rounded-xl border border-[#222] text-[9.5px] font-mono">
                                    <div>
                                      <p className="text-[#555] font-bold uppercase leading-none mb-1">Line</p>
                                      <p className="text-white font-bold text-xs">{pred.line}</p>
                                    </div>
                                    <div>
                                      <p className="text-[#555] font-bold uppercase leading-none mb-1">Projected</p>
                                      <p className="text-white font-bold text-xs">
                                        {pred.predicted_mean !== undefined && pred.predicted_mean !== null ? pred.predicted_mean.toFixed(1) : "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[#555] font-bold uppercase leading-none mb-1">Book Odds</p>
                                      <p className="text-white font-bold text-xs">
                                        {pred.odds !== undefined && pred.odds !== null ? pred.odds : "N/A"}
                                        {pred.book && <span className="text-gray-600 text-[8px] ml-1">({pred.book})</span>}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  pred.note && (
                                    <p className="text-[9px] text-gray-600 font-mono leading-tight border-t border-[#1F1F1F] pt-2">
                                      {pred.note}
                                    </p>
                                  )
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
