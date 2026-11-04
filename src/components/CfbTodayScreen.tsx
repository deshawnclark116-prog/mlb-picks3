/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import UnifiedSportGameCards, {type UnifiedGame} from './UnifiedSportGameCards';
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, RefreshCw, AlertTriangle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { CfbPrediction } from "../types";
import { getCfbPredictionKey, getLatestGeneratedAt } from "../utils";

// Groups a flat list of player-prop picks into one card per real-world
// matchup, mirroring GamesScreen.tsx's MLB slate view and NflTodayScreen's
// same treatment -- CFB predictions carry team/opponent per pick (no
// separate game/schedule feed), so the matchup itself is derived here.
// Keyed on the unordered team pair since a single game produces picks
// for players on both sides.
interface CfbGameGroup {
  key: string;
  teamA: string;
  teamB: string;
  season: number;
  week: number;
  kickoff_utc?: string;
  predictions: CfbPrediction[];
}

function groupPredictionsByGame(preds: CfbPrediction[]): CfbGameGroup[] {
  const map = new Map<string, CfbGameGroup>();
  for (const p of preds) {
    if (!p.team || !p.opponent) continue;
    const key = [p.team, p.opponent].sort().join("__");
    let group = map.get(key);
    if (!group) {
      group = {
        key, teamA: p.team, teamB: p.opponent, season: p.season, week: p.week,
        kickoff_utc: p.kickoff_utc, predictions: [],
      };
      map.set(key, group);
    } else if (!group.kickoff_utc && p.kickoff_utc) {
      group.kickoff_utc = p.kickoff_utc;
    }
    group.predictions.push(p);
  }
  // Real kickoff time first (earliest game at the top), same as the
  // backend now orders picks -- a missing kickoff_utc (shouldn't happen
  // for a real scheduled game) sorts to the end rather than to the top
  // by accident. Model confidence is no longer what a whole week's worth
  // of games sorts by (found live 2026-09-26 -- there was no real
  // kickoff-time signal anywhere until cfb_serving_builder_a.py started
  // sending one).
  return Array.from(map.values()).sort((a, b) =>
    (a.kickoff_utc || "9999").localeCompare(b.kickoff_utc || "9999")
  );
}

function formatKickoff(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York",
  });
}

interface CfbTodayScreenProps {
  predictions: CfbPrediction[];
  season: number | null;
  week: number | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

const MARKET_LABELS: Record<string, string> = {
  rushing_yards: "Rushing Yards",
  receiving_yards: "Receiving Yards",
  passing_yards: "Passing Yards",
  passing_touchdowns: "Passing TDs",
  anytime_touchdowns: "Anytime TD",
  moneyline: "Moneyline",
  moneyline_early_season: "Moneyline (Prior-Season-Informed)",
  rushing_yards_early_season: "Rushing Yards (Prior-Season-Informed)",
  receiving_yards_early_season: "Receiving Yards (Prior-Season-Informed)",
  passing_yards_early_season: "Passing Yards (Prior-Season-Informed)",
  passing_touchdowns_early_season: "Passing TDs (Prior-Season-Informed)",
  anytime_touchdowns_early_season: "Anytime TD (Prior-Season-Informed)",
};

type MarketFilter =
  | "ALL"
  | "rushing_yards"
  | "receiving_yards"
  | "passing_yards"
  | "passing_touchdowns"
  | "anytime_touchdowns"
  | "moneyline"
  | "moneyline_early_season"
  | "rushing_yards_early_season"
  | "receiving_yards_early_season"
  | "passing_yards_early_season"
  | "passing_touchdowns_early_season"
  | "anytime_touchdowns_early_season";

export default function CfbTodayScreen({
  predictions,
  season,
  week,
  loading,
  error,
  onRefresh,
}: CfbTodayScreenProps) {
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [confidenceFilter, setConfidenceFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
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
  ).sort((a, b) => Number(!a.startsWith("moneyline")) - Number(!b.startsWith("moneyline")));
  // Market-specific, existing serving model output: never derive sportsbook odds
  // or convert archival three-game means into new betting picks.
  const moneylinePicks = predictions.filter((p) =>
    p.market === "moneyline" || p.market === "moneyline_early_season"
  ).sort((a, b) => (b.model_prob ?? 0) - (a.model_prob ?? 0));

  const sortedPredictions = [...predictions].sort((a, b) => (b.prob_pct ?? 0) - (a.prob_pct ?? 0));

  const filteredPredictions = sortedPredictions.filter((pred) => {
    if (marketFilter !== "ALL" && pred.market !== marketFilter) return false;
    if (confidenceFilter !== "ALL" && pred.confidence !== confidenceFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const nameMatch = pred.player?.toLowerCase().includes(q);
      const teamMatch = pred.team?.toLowerCase().includes(q) || pred.opponent?.toLowerCase().includes(q);
      const pickMatch = pred.pick?.toLowerCase().includes(q);
      if (!nameMatch && !teamMatch && !pickMatch) return false;
    }
    return true;
  });

  const gameGroups = groupPredictionsByGame(filteredPredictions);
  const unifiedGames:UnifiedGame[]=gameGroups.map(g=>({
      id:g.key,label:g.teamA+' vs '+g.teamB,when:g.kickoff_utc,
      sourceLabel:'CFB CURRENT MODEL · FIXED-LINE CLASSIFIER',
      subtitle:'2026 · WEEK '+g.week,
      picks:g.predictions.map((p,i)=>({
        id:getCfbPredictionKey(p)+'|'+i,player:p.player,team:p.team,
        market:p.market,target:p.pick,
        modelProbability:Number.isFinite(p.model_prob)?p.model_prob:null,
        prediction:p.sim_median!=null&&Number.isFinite(p.sim_median)?p.sim_median:
          p.projected!=null&&Number.isFinite(p.projected)?p.projected:null,
        predictionKind:p.sim_median!=null&&Number.isFinite(p.sim_median)?'median' as const:
          p.projected!=null&&Number.isFinite(p.projected)?'mean' as const:'not_published' as const,
        unit:p.market.includes('yards')?'yds':p.market.includes('touchdowns')?'TD':'',
        confidence:p.confidence,source:p.model_source||'CFB current champion classifier',
        detail:(p.games_played!=null?'Historical games: '+p.games_played+'. ':'')+
          (p.validation_note||'Fixed threshold is not a player-stat median.')
      }))
    }));

  return (
    <div
      id="cfb-today-screen-wrapper"
      className="flex flex-col h-full bg-[#0D0D0D] text-gray-200 select-none overflow-hidden"
    >
      {/* Pull indicator */}
      <motion.div
        id="cfb-pull-indicator-bar"
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
      <header id="cfb-screen-header" className="flex items-center justify-between gap-3 border-b border-[#1A1A1A] bg-[#0A0A0A] px-4 py-2">
        <h1 className="min-w-0 truncate text-[16px] font-bold text-white">CFB <span className="font-normal text-gray-300">· {season ? `${season} Week ${week ?? "-"}` : "Predictions"}</span></h1>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={()=>setShowFilters(v=>!v)} aria-expanded={showFilters} className={`min-h-10 rounded-xl border px-3 text-[13px] font-semibold bg-[#202a2c] ${showFilters?'border-[#79FF48]/60 text-[#79FF48]':'border-white/10 text-gray-300'}`}>Filter</button>
          <button id="cfb-refresh-btn" onClick={handleManualRefresh} disabled={loading || isRefreshing} aria-label="Refresh feed"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#222] bg-[#141414] text-gray-400 hover:text-[#00FF41]" title="Refresh feed">
            <RefreshCw className={`w-4 h-4 ${(loading || isRefreshing) ? "animate-spin text-[#00FF41]" : ""}`} />
          </button>
        </div>
      </header>

      {/* Filters */}
      {showFilters&&<div id="cfb-filter-controls-board" className="px-4 py-4 bg-[#0D0D0D] border-b border-[#1A1A1A] flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2 font-mono">Market</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
            {(["ALL", ...marketsPresent] as MarketFilter[]).map((m) => {
              const active = marketFilter === m;
              return (
                <button
                  id={`cfb-btn-market-${m}`}
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
                  id={`cfb-btn-conf-${conf}`}
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
            id="cfb-player-search-input"
            type="text"
            placeholder="Filter by player, team, or pick..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-[#141414] text-gray-200 pl-8 pr-4 py-2 rounded-xl border border-[#222] focus:border-[#00FF41]/40 focus:outline-none placeholder-gray-700 font-sans transition-all"
          />
        </div>
      </div>}

      {/* Scroll area */}
      <div
        id="cfb-predictions-scroll-area"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 scroll-smooth no-scrollbar"
      >
        {loading && predictions.length === 0 ? (
          <div id="cfb-loading-spinner-state" className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Loading CFB Board...</p>
          </div>
        ) : error ? (
          <div id="cfb-error-alert-state" className="p-4 rounded-3xl bg-[#141414] border border-red-950 text-gray-300">
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
        ) : gameGroups.length === 0 ? (
          <div id="cfb-empty-predictions-state" className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-[#222] bg-[#141414]/30">
            <TrendingUp className="w-8 h-8 text-gray-700 mb-3" />
            <h3 className="text-gray-300 text-sm font-semibold mb-1">No CFB picks found.</h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed mt-1">
              Early-season weeks are empty by design -- eligibility requires prior-game history the season
              hasn't produced yet. Try changing filters, or check back once the week advances.
            </p>
          </div>
        ) : (
          <div id="cfb-games-list" className="space-y-4">
            {marketFilter === "ALL" && confidenceFilter === "ALL" && searchQuery.trim() === "" && moneylinePicks.length > 0 && (
              <section aria-label="Current CFB moneyline model predictions" className="rounded-2xl border border-[#00FF41]/25 bg-[#101b13] p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase">Moneyline model predictions</h3>
                    <p className="text-[10px] text-gray-400 mt-1">{moneylinePicks.length} current team-win selections · model probabilities, not sportsbook prices</p>
                  </div>
                  <button id="cfb-show-all-moneylines" type="button"
                    onClick={() => setMarketFilter(moneylinePicks.some(p => p.market === "moneyline") ? "moneyline" : "moneyline_early_season")}
                    className="shrink-0 min-h-[44px] px-3 rounded-lg bg-[#00FF41] text-black font-bold text-xs">
                    View all {moneylinePicks.length}
                  </button>
                </div>
                {moneylinePicks.slice(0, 4).map((p) => (
                  <div key={String(p.week) + "|" + p.team + "|" + p.market}
                    className="bg-[#141414] border border-[#29312b] rounded-xl p-3 flex justify-between gap-3 items-center">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white">{p.pick}</div>
                      <div className="text-[10px] text-gray-400">vs {p.opponent}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-[#00FF41] text-lg">
                        {typeof p.model_prob === "number" && Number.isFinite(p.model_prob) && p.model_prob >= 0 && p.model_prob <= 1
                          ? (p.model_prob * 100).toFixed(1) + "%" : "–"}
                      </div>
                      <div className="text-[9px] text-gray-400">model chance</div>
                    </div>
                  </div>
                ))}
              </section>
            )}
            <UnifiedSportGameCards sport="CFB" prefix="cfb-game-card-" games={unifiedGames}/>
          </div>
        )}
      </div>
    </div>
  );
}
