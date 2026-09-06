/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Game, Prediction } from "../types";
import { formatLocalTime, formatOdds, formatPercent, formatKellyStake, formatToEasternTime, getPredictionKey, getLatestGeneratedAt } from "../utils";
import { Calendar, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";

// Dynamic mapping logic linking predictions to a given game based on team and opponent fields
export function getPredictionsForGame(game: Game, allPredictions: Prediction[]): Prediction[] {
  return allPredictions.filter(pred => {
    if (!pred.team || !pred.opponent) {
      return false;
    }

    const matchesName = (t1: string, t2: string): boolean => {
      const clean1 = t1.toLowerCase().trim();
      const clean2 = t2.toLowerCase().trim();
      return clean1.includes(clean2) || clean2.includes(clean1);
    };

    const teamMatchesHome = matchesName(pred.team, game.home_team);
    const teamMatchesAway = matchesName(pred.team, game.away_team);
    const oppMatchesHome = matchesName(pred.opponent, game.home_team);
    const oppMatchesAway = matchesName(pred.opponent, game.away_team);

    // Match if prediction team or opponent matches either home team or away team
    return teamMatchesHome || teamMatchesAway || oppMatchesHome || oppMatchesAway;
  });
}

interface GamesScreenProps {
  games: Game[];
  predictions: Prediction[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

export default function GamesScreen({
  games,
  predictions,
  loading,
  error,
  onRefresh
}: GamesScreenProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const toggleExpand = (gameId: string) => {
    if (expandedGameId === gameId) {
      setExpandedGameId(null);
    } else {
      setExpandedGameId(gameId);
    }
  };

  // Helper code to format game date beautifully in Eastern Time
  const formatGameDate = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) {
        return "Unknown Date";
      }
      
      const todayETStr = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" });
      const todayET = new Date(todayETStr);
      const tomorrowET = new Date(todayET);
      tomorrowET.setDate(tomorrowET.getDate() + 1);
      const tomorrowETStr = tomorrowET.toLocaleDateString("en-US", { timeZone: "America/New_York" });
      
      const gameETStr = date.toLocaleDateString("en-US", { timeZone: "America/New_York" });

      if (gameETStr === todayETStr) {
        return "Today";
      } else if (gameETStr === tomorrowETStr) {
        return "Tomorrow";
      }
      
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short", timeZone: "America/New_York" });
    } catch {
      return "Schedule Time";
    }
  };

  return (
    <div id="games-screen-wrapper" className="flex flex-col h-full bg-[#0D0D0D] text-gray-200 overflow-hidden">
      {/* Header banner */}
      <div id="games-header" className="pt-8 px-6 pb-4 bg-[#0A0A0A] border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase font-sans">
              MLB <span className="text-[#00FF41]">SLATE</span>
            </h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-mono">
              Live scheduled matches today
            </p>
            {getLatestGeneratedAt(predictions) && (
              <p className="text-[8px] text-[#00FF41]/80 font-mono mt-1 uppercase tracking-wider">
                Updated: {formatToEasternTime(getLatestGeneratedAt(predictions))}
              </p>
            )}
          </div>
          <button 
            id="games-refresh-btn"
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#222] text-gray-400 hover:text-[#00FF41] cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loading || isRefreshing) ? "animate-spin text-[#00FF41]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main List Column */}
      <div id="games-scroll-area" className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 no-scrollbar">
        {loading && games.length === 0 ? (
          <div id="games-loading-box" className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Polling Slate...</p>
          </div>
        ) : error ? (
          <div id="games-error-box" className="p-4 rounded-3xl bg-[#141414] border border-red-950 text-gray-300">
            <div className="flex items-center gap-2 text-red-500 font-bold text-xs mb-1.5 uppercase font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>Failed to load schedule</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="w-full text-center py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-mono uppercase font-bold tracking-wider transition-all"
            >
              Retry
            </button>
          </div>
        ) : games.length === 0 ? (
          <div id="games-empty-state" className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-[#222] bg-[#141414]/30">
            <Calendar className="w-8 h-8 text-gray-700 mb-3" />
            <h3 className="text-gray-300 text-sm font-semibold mb-1">No games scheduled.</h3>
            <p className="text-xs text-gray-500 max-w-xs font-sans leading-relaxed">
              There are no MLB games currently captured on the system schedule.
            </p>
          </div>
        ) : (
          <div id="games-list-container" className="space-y-4">
            <AnimatePresence mode="popLayout">
              {games.map((game, idx) => {
                const gameId = game.game_id || String(idx);
                const isExpanded = expandedGameId === gameId;
                const gameStatus = (game.status || "SCHEDULED").toUpperCase();
                
                let statusBadge = (
                  <span className="text-[9px] font-mono font-bold tracking-wide px-2.5 py-0.5 rounded border bg-[#1A1A1A] border-[#222] text-gray-400">
                    SCHEDULED
                  </span>
                );

                if (gameStatus === "LIVE") {
                  statusBadge = (
                    <span className="text-[9px] font-mono font-black tracking-wider px-2.5 py-0.5 rounded border bg-[#00FF41]/10 border-[#00FF41]/20 text-[#00FF41] animate-pulse flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,255,65,0.08)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] shadow-[0_0_6px_#00FF41]" />
                      LIVE
                    </span>
                  );
                } else if (gameStatus === "FINISHED" || gameStatus === "FINAL" || gameStatus === "COMPLETED") {
                  statusBadge = (
                    <span className="text-[9px] font-mono font-bold tracking-wide px-2.5 py-0.5 rounded border bg-[#141414] border-stone-850 text-gray-600">
                      COMPLETED
                    </span>
                  );
                }

                // Get matched projections sorted by prob_pct descending
                const gamePredictions = getPredictionsForGame(game, predictions)
                  .sort((a, b) => (b.prob_pct ?? 0) - (a.prob_pct ?? 0));

                return (
                  <motion.div
                    id={`game-card-${idx}`}
                    key={game.game_id || `${game.away_team}-${game.home_team}-${game.game_time}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                    onClick={() => toggleExpand(gameId)}
                    className={`bg-[#141414] rounded-3xl p-5 border cursor-pointer select-none transition-all duration-200 flex flex-col justify-between ${
                      isExpanded ? 'border-[#00FF41]/40 shadow-[0_0_15px_rgba(0,255,65,0.04)] bg-[#171717]' : 'border-[#1F1F1F] hover:border-gray-800'
                    }`}
                  >
                    {/* Primary Game Bar Layout */}
                    <div className="flex items-center justify-between w-full">
                      {/* Visual Team info */}
                      <div className="flex-1">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono uppercase bg-[#1A1A1A] text-gray-500 border border-[#222] px-1.5 py-0.5 rounded">AWAY</span>
                            <span className="font-sans font-bold text-white text-base leading-none tracking-tight">
                              {game.away_team}
                            </span>
                          </div>
                          <div className="text-gray-600 text-[10px] font-mono font-bold pl-4">VS</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono uppercase bg-[#1A1A1A] text-gray-500 border border-[#222] px-1.5 py-0.5 rounded">HOME</span>
                            <span className="font-sans font-bold text-white text-base leading-none tracking-tight">
                              {game.home_team}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right schedule box */}
                      <div className="flex flex-col items-end justify-center min-w-[120px] pl-4 text-right">
                        {statusBadge}
                        <span className="mt-2 text-base font-mono font-bold text-white leading-none">
                          {formatLocalTime(game.game_time)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-gray-500">
                          <span>{formatGameDate(game.game_time)}</span>
                          <span>•</span>
                          <span className={`text-[10px] font-bold ${gamePredictions.length > 0 ? "text-[#00FF41]" : "text-gray-600"}`}>
                            {gamePredictions.length} {gamePredictions.length === 1 ? "PROP" : "PROPS"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand Chevron bar */}
                    <div className="flex justify-center mt-3 pt-2 border-t border-[#1F1F1F]/50">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500 hover:text-white" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500 hover:text-white" />
                      )}
                    </div>

                    {/* Collapsible Panel containing game properties */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          id={`game-props-expanded-${gameId}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden mt-4 pt-4 border-t border-[#1F1F1F] w-full"
                          onClick={(e) => e.stopPropagation()} // stop toggle collapse when clicking children items
                        >
                          <div className="space-y-3 pb-2 pt-1">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-2">
                              System Projections for Matchup
                            </p>
                            {gamePredictions.length === 0 ? (
                              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#0D0D0D] border border-[#1A1A1A] text-gray-500">
                                <TrendingUp className="w-3.5 h-3.5 text-gray-700 mt-0.5 shrink-0" />
                                <span className="text-[10px] font-mono leading-relaxed uppercase">
                                  No player projections available for this matchup.
                                </span>
                              </div>
                            ) : (
                              gamePredictions.map((pred, pIdx) => {
                                // Confidence badge chip colors: HIGH = green, MEDIUM = yellow, LOW = gray
                                let confidenceChipClass = "bg-[#252525] text-gray-400 border-[#333]";
                                if (pred.confidence === "HIGH") {
                                  confidenceChipClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
                                } else if (pred.confidence === "MEDIUM") {
                                  confidenceChipClass = "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
                                } else if (pred.confidence === "LOW") {
                                  confidenceChipClass = "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
                                }

                                return (
                                  <div 
                                    id={`prop-row-${pIdx}`}
                                    key={getPredictionKey(pred)} 
                                    className="bg-[#1C1C1C] rounded-2xl p-4 border border-[#242424] hover:border-gray-750 transition-all duration-150 space-y-3"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="min-w-0 flex-1 pr-2">
                                        <h4 className="text-sm font-bold text-white tracking-tight truncate">
                                          {pred.player}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                          {pred.prop_type} • <span className="text-white font-semibold italic">{pred.pick}</span>
                                        </p>
                                      </div>
                                      <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`text-[8px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 border rounded ${confidenceChipClass}`}>
                                          {pred.confidence}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Prominent probability headline */}
                                    <div className="bg-[#141414] rounded-xl p-2.5 border border-[#222] flex flex-col items-center justify-center text-center shadow-inner">
                                      <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-widest font-mono mb-0.5">
                                        Hit Probability
                                      </span>
                                      <span className="text-2xl font-black font-mono text-[#00FF41] tracking-tight drop-shadow-[0_0_8px_rgba(0,255,65,0.15)]">
                                        {pred.prob_pct !== undefined && pred.prob_pct !== null ? `${pred.prob_pct.toFixed(1)}%` : "N/A"}
                                      </span>
                                    </div>

                                    {/* Prop spec stats line */}
                                    <div className="grid grid-cols-3 gap-2 text-center bg-[#141414] p-2 rounded-xl border border-[#222] text-[9.5px] font-mono">
                                      <div>
                                        <p className="text-[#555] font-bold uppercase leading-none mb-1">Projected</p>
                                        <p className="text-white font-bold text-xs">
                                          {pred.projected !== undefined && pred.projected !== null ? pred.projected.toFixed(2) : "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[#555] font-bold uppercase leading-none mb-1">Odds</p>
                                        <p className="text-[#00FF41] font-bold text-xs">
                                          {formatOdds(pred.odds)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[#555] font-bold uppercase leading-none mb-1">Stake</p>
                                        <p className="text-white font-bold text-xs">{formatKellyStake(pred.kelly_fraction)}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
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
