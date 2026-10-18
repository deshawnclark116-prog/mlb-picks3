/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import UnifiedSportGameCards, {type UnifiedGame} from './UnifiedSportGameCards';
import {addTrueNhlShotCounts,NHL_COUNT_SCHEMA,type NhlSogResearch} from "../nhl/countResearch";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, RefreshCw, AlertTriangle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { NhlPrediction } from "../types";
import { getNhlPredictionKey, getLatestGeneratedAt } from "../utils";

// Groups a flat list of picks into one card per real-world game, matching
// CfbTodayScreen/NflTodayScreen's treatment -- NHL predictions carry team/
// opponent per pick (no separate schedule feed), and now that points/
// shots_on_goal/goalie_saves/moneyline can all fire for the same game at
// once (243 picks on a 5-game slate isn't unusual), a flat list of
// ungrouped cards doesn't scale the way it did when NHL only had a
// handful of moneyline-only picks a day. Keyed on the unordered team pair
// since a single game produces picks for both sides (and both team-level
// moneyline picks and player-level prop picks together).
interface NhlGameGroup {
  key: string;
  teamA: string;
  teamB: string;
  season: number;
  game_date: string;
  kickoff_utc?: string;
  predictions: NhlPrediction[];
}

function groupPredictionsByGame(preds: NhlPrediction[]): NhlGameGroup[] {
  const map = new Map<string, NhlGameGroup>();
  for (const p of preds) {
    if (!p.team || !p.opponent) continue;
    const key = [p.team, p.opponent].sort().join("__");
    let group = map.get(key);
    if (!group) {
      group = {
        key, teamA: p.team, teamB: p.opponent, season: p.season, game_date: p.game_date,
        kickoff_utc: p.kickoff_utc, predictions: [],
      };
      map.set(key, group);
    } else if (!group.kickoff_utc && p.kickoff_utc) {
      group.kickoff_utc = p.kickoff_utc;
    }
    group.predictions.push(p);
  }
  // Real kickoff time first, same fix as CFB/NFL's (found live
  // 2026-09-27, user asked why every sport wasn't fixed alongside CFB).
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

interface NhlTodayScreenProps {
  predictions: NhlPrediction[];
  gameDate: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

const MARKET_LABELS: Record<string, string> = {
  moneyline: "Moneyline",
  moneyline_early_season: "Moneyline (Prior-Season-Informed)",
  points: "Anytime Point",
  points_early_season: "Anytime Point (Prior-Season-Informed)",
  shots_on_goal: "Shots on Goal",
  shots_on_goal_early_season: "Shots on Goal (Prior-Season-Informed)",
  goalie_saves: "Goalie Saves",
};

const PLAYER_MARKETS = ["points", "points_early_season", "shots_on_goal",
  "shots_on_goal_early_season", "goalie_saves"];

type MarketFilter =
  | "ALL"
  | "moneyline"
  | "moneyline_early_season"
  | "points"
  | "points_early_season"
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
  const [numericSog, setNumericSog] = useState<NhlSogResearch|null>(null);
  const [numericSogError, setNumericSogError] = useState<string|null>(null);
  useEffect(()=>{
    if(!gameDate){setNumericSog(null);return;}
    const ctl=new AbortController();
    setNumericSog(null);setNumericSogError(null);
    void (async()=>{
      try{
        const response=await fetch('/api/nhl-count-research?date='+encodeURIComponent(gameDate),{
          cache:'no-store',signal:ctl.signal});
        if(!response.ok)throw Error('NHL V2 frozen count source HTTP '+response.status);
        const doc=await response.json();
        if(doc?.schema!==NHL_COUNT_SCHEMA || doc?.game_date!==gameDate ||
          doc?.research_only!==true || doc?.not_an_official_betting_board!==true)
          throw Error('Unverified NHL numerical shot-count source');
        if(!ctl.signal.aborted)setNumericSog(doc as NhlSogResearch);
      }catch(e){
        if(!ctl.signal.aborted)setNumericSogError(e instanceof Error?e.message:String(e));
      }
    })();
    return()=>ctl.abort();
  },[gameDate]);
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
  );

  const sortedPredictions = [...predictions].sort((a, b) => (b.prob_pct ?? 0) - (a.prob_pct ?? 0));

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

  const gameGroups = groupPredictionsByGame(filteredPredictions);
  const unifiedGames:UnifiedGame[]=gameGroups.map(g=>({
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
        detail:(p.line!=null?'Model evaluated line '+p.line+'. ':'')+
          (p.games_played!=null?'Historical player games: '+p.games_played+'. ':'')+
          'No numeric player-stat median is present in this current predictions feed.'
      }))
    }));

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
            NHL{gameDate ? ` • ${gameDate}` : ""}
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
        {loading && predictions.length === 0 ? (
          <div id="nhl-loading-spinner-state" className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Loading NHL Board...</p>
          </div>
        ) : error ? (
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
        ) : gameGroups.length === 0 ? (
          <div id="nhl-empty-predictions-state" className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-[#222] bg-[#141414]/30">
            <TrendingUp className="w-8 h-8 text-gray-700 mb-3" />
            <h3 className="text-gray-300 text-sm font-semibold mb-1">No NHL picks found.</h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed mt-1">
              No real NHL games scheduled for the target date, or every eligible team already has
              a final result. Try changing filters, or check back closer to the next real slate.
            </p>
          </div>
        ) : (
          <div id="nhl-games-list" className="space-y-4">
            <UnifiedSportGameCards sport="NHL" prefix="nhl-game-card-" games={unifiedGames}/>
          </div>
        )}
      </div>
    </div>
  );
}
