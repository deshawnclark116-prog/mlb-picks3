/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { NbaResearchDoc, NbaGameForecast } from "../nba/types";
import { AlertTriangle, RefreshCw, Search, ShieldAlert, Calendar, Clock, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NbaTodayScreenProps {
  doc: NbaResearchDoc | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

// Convert UTC tipoff ISO string to Eastern Time date string ("YYYY-MM-DD")
export function getEasternDateKey(tipoffUtc: string): string {
  try {
    const d = new Date(tipoffUtc);
    return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  } catch {
    return tipoffUtc.slice(0, 10);
  }
}

// Format tipoff in Eastern Time (America/New_York)
export function formatTipoffET(tipoffUtc: string): string {
  try {
    const d = new Date(tipoffUtc);
    return d.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
  } catch {
    return tipoffUtc;
  }
}

// Format generated timestamp
export function formatGeneratedAt(isoUtc: string): string {
  try {
    const d = new Date(isoUtc);
    return d.toLocaleString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return isoUtc;
  }
}

// Team short code helper
const NBA_ABBR: Record<string, string> = {
  "Boston Celtics": "BOS",
  "Detroit Pistons": "DET",
  "Philadelphia 76ers": "PHI",
  "New York Knicks": "NYK",
  "Oklahoma City Thunder": "OKC",
  "San Antonio Spurs": "SAS",
  "Atlanta Hawks": "ATL",
  "Orlando Magic": "ORL",
  "Milwaukee Bucks": "MIL",
  "Washington Wizards": "WAS",
  "Minnesota Timberwolves": "MIN",
  "Miami Heat": "MIA",
  "Charlotte Hornets": "CHA",
  "Brooklyn Nets": "BKN",
  "Chicago Bulls": "CHI",
  "Toronto Raptors": "TOR",
  "Utah Jazz": "UTA",
  "Memphis Grizzlies": "MEM",
  "Indiana Pacers": "IND",
  "New Orleans Pelicans": "NOP",
  "Dallas Mavericks": "DAL",
  "Houston Rockets": "HOU",
  "Golden State Warriors": "GSW",
  "Los Angeles Lakers": "LAL",
  "Phoenix Suns": "PHX",
  "Portland Trail Blazers": "POR",
  "Sacramento Kings": "SAC",
  "LA Clippers": "LAC",
};

export default function NbaTodayScreen({ doc, loading, error, onRefresh }: NbaTodayScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"ALL" | "2026-10-20" | "2026-10-21">("ALL");
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const toggleExpanded = (gameId: string) => {
    setExpandedDetails(prev => ({ ...prev, [gameId]: !prev[gameId] }));
  };

  const forecasts = doc?.forecasts || [];

  // Group forecasts by Eastern Time date
  const groupedByDate = useMemo(() => {
    const oct20: NbaGameForecast[] = [];
    const oct21: NbaGameForecast[] = [];
    const other: NbaGameForecast[] = [];

    for (const f of forecasts) {
      const etDate = getEasternDateKey(f.tipoff_utc);
      if (etDate === "2026-10-20") {
        oct20.push(f);
      } else if (etDate === "2026-10-21") {
        oct21.push(f);
      } else {
        other.push(f);
      }
    }

    return {
      "2026-10-20": oct20.sort((a, b) => a.tipoff_utc.localeCompare(b.tipoff_utc)),
      "2026-10-21": oct21.sort((a, b) => a.tipoff_utc.localeCompare(b.tipoff_utc)),
      other: other.sort((a, b) => a.tipoff_utc.localeCompare(b.tipoff_utc)),
    };
  }, [forecasts]);

  // Filtered forecasts
  const filteredForecasts = useMemo(() => {
    return forecasts.filter(f => {
      // Date filter
      if (dateFilter !== "ALL") {
        const etDate = getEasternDateKey(f.tipoff_utc);
        if (etDate !== dateFilter) return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const homeMatch = f.home.toLowerCase().includes(q);
        const awayMatch = f.away.toLowerCase().includes(q);
        const homeAbbr = (NBA_ABBR[f.home] || "").toLowerCase().includes(q);
        const awayAbbr = (NBA_ABBR[f.away] || "").toLowerCase().includes(q);
        if (!homeMatch && !awayMatch && !homeAbbr && !awayAbbr) return false;
      }
      return true;
    }).sort((a, b) => a.tipoff_utc.localeCompare(b.tipoff_utc));
  }, [forecasts, dateFilter, searchQuery]);

  return (
    <div id="nba-screen" className="flex flex-col h-full bg-[#0D0D0D] text-stone-200 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-[#1A1A1A] bg-[#0A0A0A] shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-wider text-white">NBA V1 RESEARCH</h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                RESEARCH ONLY
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">
              14 Opening Week Forecasts · Regressed Form Model
            </p>
          </div>
          <button
            onClick={() => onRefresh()}
            disabled={loading}
            aria-label="Refresh NBA research forecasts"
            className="p-2 rounded-xl border border-[#2A2A2A] bg-[#141414] hover:bg-[#1E1E1E] text-stone-300 disabled:opacity-40 transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#00FF41]" : ""}`} />
          </button>
        </div>

        {/* Search & Date Filter Bar */}
        <div className="mt-3 flex flex-col gap-2">
          {/* Team Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NBA team (e.g. Lakers, Celtics, Pistons)..."
              className="w-full bg-[#141414] border border-[#262626] rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-gray-500 focus:outline-none focus:border-[#00FF41]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Selector Pills (Eastern Time) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setDateFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                dateFilter === "ALL"
                  ? "bg-[#00FF41] text-black shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                  : "bg-[#161616] border border-[#262626] text-gray-400 hover:text-white"
              }`}
            >
              All Dates ({forecasts.length})
            </button>
            <button
              onClick={() => setDateFilter("2026-10-20")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                dateFilter === "2026-10-20"
                  ? "bg-[#00FF41] text-black shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                  : "bg-[#161616] border border-[#262626] text-gray-400 hover:text-white"
              }`}
            >
              Tue Oct 20 ({groupedByDate["2026-10-20"]?.length || 0})
            </button>
            <button
              onClick={() => setDateFilter("2026-10-21")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                dateFilter === "2026-10-21"
                  ? "bg-[#00FF41] text-black shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                  : "bg-[#161616] border border-[#262626] text-gray-400 hover:text-white"
              }`}
            >
              Wed Oct 21 ({groupedByDate["2026-10-21"]?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-28">
        {/* Model Integrity & Research Notice Card */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-3.5 space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-300">NBA V1 RESEARCH NOTICE</span>
                <span className="text-[10px] text-amber-400/80 font-mono">NOT SPORTSBOOK WAGERS</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Prior regular-season form regressed toward 50%. Current offseason roster changes, injuries, minutes, and confirmed starting lineups are not included.
              </p>
              {doc?.generated_at_utc && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-1 border-t border-amber-500/10">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span>Model generated: <strong className="text-gray-300 font-mono">{formatGeneratedAt(doc.generated_at_utc)}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin mx-auto" />
            <p className="text-xs text-gray-400 font-medium">Loading certified NBA V1 research predictions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-center space-y-2">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
            <p className="text-xs text-red-300 font-semibold">{error}</p>
            <button
              onClick={() => onRefresh()}
              className="px-3 py-1 rounded-lg bg-red-500/20 text-red-200 text-xs border border-red-500/40 hover:bg-red-500/30"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Forecast Cards */}
        {!loading && !error && filteredForecasts.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-400">
            No NBA matchups match your search or date filters.
          </div>
        )}

        {!loading && !error && filteredForecasts.length > 0 && (
          <div className="space-y-3">
            {filteredForecasts.map((f) => {
              const awayAbbr = NBA_ABBR[f.away] || f.away.slice(0, 3).toUpperCase();
              const homeAbbr = NBA_ABBR[f.home] || f.home.slice(0, 3).toUpperCase();
              const tipoffET = formatTipoffET(f.tipoff_utc);
              const homeWinPct = (f.home_win_probability * 100).toFixed(1);
              const awayWinPct = (f.away_win_probability * 100).toFixed(1);
              const isExpanded = !!expandedDetails[f.game_id];

              return (
                <article
                  key={f.game_id}
                  data-testid="nba-game-card"
                  className="rounded-2xl border border-[#242424] bg-[#141414] overflow-hidden transition-all hover:border-[#383838]"
                >
                  {/* Card Header: Teams & Tipoff */}
                  <div className="p-4 border-b border-[#1E1E1E]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-[#00FF41]" />
                          <span>{tipoffET}</span>
                        </div>
                        <h2 className="text-base font-extrabold text-white mt-0.5 tracking-tight">
                          {f.away} <span className="text-gray-500 font-normal">@</span> {f.home}
                        </h2>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                        RESEARCH ONLY
                      </span>
                    </div>

                    {/* Prominent Score Predictions */}
                    <div className="mt-3.5 grid grid-cols-3 gap-2">
                      {/* Away Team Projected Score */}
                      <div className="rounded-xl border border-[#262626] bg-[#0E0E0E] p-2.5 text-center flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 truncate">{awayAbbr} (Away)</div>
                          <div className="text-2xl font-black text-[#00FF41] mt-0.5 tracking-tight">
                            {f.projected_away_score_mean.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Win: <strong className="text-stone-200">{awayWinPct}%</strong>
                        </div>
                      </div>

                      {/* Game Total Mean */}
                      <div className="rounded-xl border border-[#2E362F] bg-[#111A13] p-2.5 text-center flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-[#00FF41] uppercase tracking-wider">Total</div>
                          <div className="text-2xl font-black text-white mt-0.5 tracking-tight">
                            {f.projected_game_total_mean.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Pts Mean
                        </div>
                      </div>

                      {/* Home Team Projected Score */}
                      <div className="rounded-xl border border-[#262626] bg-[#0E0E0E] p-2.5 text-center flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 truncate">{homeAbbr} (Home)</div>
                          <div className="text-2xl font-black text-[#00FF41] mt-0.5 tracking-tight">
                            {f.projected_home_score_mean.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Win: <strong className="text-stone-200">{homeWinPct}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Win Probability Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-gray-400">
                        <span>{f.away}: {awayWinPct}%</span>
                        <span>{f.home}: {homeWinPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#202020] rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${f.away_win_probability * 100}%` }}
                          className="bg-blue-500/80 transition-all duration-300"
                        />
                        <div
                          style={{ width: `${f.home_win_probability * 100}%` }}
                          className="bg-[#00FF41] transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Expandable Model Evidence */}
                  <div className="px-4 py-2.5 bg-[#0F0F0F] flex items-center justify-between text-[11px] text-gray-400">
                    <span className="text-[10px] font-mono text-gray-500">
                      ESPN ID: {f.game_id}
                    </span>
                    <button
                      onClick={() => toggleExpanded(f.game_id)}
                      className="text-[11px] text-[#00FF41] hover:underline cursor-pointer flex items-center gap-1 font-medium"
                    >
                      {isExpanded ? "Hide Model Evidence" : "Model Evidence & Audit"}
                    </button>
                  </div>

                  {/* Expanded Audit Details */}
                  {isExpanded && (
                    <div className="px-4 py-3 bg-[#0A0A0A] border-t border-[#1C1C1C] text-[11px] space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 rounded bg-[#141414] border border-[#222]">
                          <div className="text-gray-500 uppercase">Prior Season Win Prob</div>
                          <div className="font-mono text-stone-200 font-bold">
                            {f.raw_previous_season_home_win_prob
                              ? (f.raw_previous_season_home_win_prob * 100).toFixed(2) + "%"
                              : "N/A"}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-[#141414] border border-[#222]">
                          <div className="text-gray-500 uppercase">Role Availability</div>
                          <div className="font-mono text-amber-400 font-bold">
                            {f.role_availability_verified ? "VERIFIED" : "UNVERIFIED"}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-[#141414] border border-[#222]">
                          <div className="text-gray-500 uppercase">Betting Line</div>
                          <div className="font-mono text-stone-300">
                            {f.betting_line_available ? "AVAILABLE" : "NO BOOK LINE"}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-[#141414] border border-[#222]">
                          <div className="text-gray-500 uppercase">Wager Recommendation</div>
                          <div className="font-mono text-amber-400 font-bold">
                            {f.wager_recommendation ? "RECOMMENDED" : "NONE (RESEARCH)"}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 pt-1 leading-normal">
                        <strong>Source:</strong> {f.source}
                        <br />
                        <strong>Scenario:</strong> {f.offseason_scenario}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
