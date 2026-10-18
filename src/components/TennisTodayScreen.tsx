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

interface TennisTodayScreenProps {
  predictions: TennisPrediction[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

// total_aces, double_faults, and games_spread all failed their backtests
// and are never generated. moneyline ALSO failed its own gate on both
// tours (see tennis_serving_builder_a.py's moneyline comment) but is
// served anyway by explicit product decision -- see mlb-picks2's
// tennis_serving_builder_a.py for the real numbers.
const MARKET_LABELS: Record<string, string> = {
  total_games: "Total Games",
  set_betting: "Correct Score (Projection)",
  moneyline: "Moneyline",
};

type MarketFilter = "ALL" | "total_games" | "set_betting" | "moneyline";

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
  const unifiedGames:UnifiedGame[]=matchGroups.map(g=>({
      id:g.key,label:g.player1+' vs '+g.player2,when:g.start_time_utc,
      sourceLabel:'TENNIS CURRENT MODEL · PROJECTION CLASSIFIER',
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
        detail:(p.unagraded?'Not graded against a real market. ':'')+
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
            <UnifiedSportGameCards sport="TENNIS" prefix="tennis-match-card-" games={unifiedGames}/>
          </div>
        )}
      </div>
    </div>
  );
}
