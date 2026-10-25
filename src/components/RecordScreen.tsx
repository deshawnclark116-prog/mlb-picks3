/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RecordData, RecordResult } from "../types";
import { formatRelativeTime, formatPercent, formatToEasternTime, deduplicateRecordResults } from "../utils";
import { 
  History, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Award,
  ChevronDown,
  Percent,
  XCircle,
  HelpCircle
} from "lucide-react";

interface RecordScreenProps {
  recordData: RecordData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

// Format prop category keys for premium interface
function formatPropName(prop: string): string {
  if (!prop) return "General";
  return prop
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
}

export default function RecordScreen({
  recordData,
  loading,
  error,
  onRefresh
}: RecordScreenProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterResult, setFilterResult] = useState<"ALL" | "HIT" | "MISS">("ALL");

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const summary = recordData?.summary || { total: 0, hits: 0, misses: 0, hit_rate: 0 };
  const byProp = recordData?.by_prop || {};
  const byConfidence = recordData?.by_confidence || {};
  const rawResults = recordData?.results || [];
  const results = deduplicateRecordResults(rawResults);

  const filteredResults = results.filter(res => {
    if (filterResult === "HIT") return res.result === "hit";
    if (filterResult === "MISS") return res.result === "miss";
    return true;
  });

  return (
    <div id="record-screen-wrapper" className="flex flex-col h-full bg-[#0D0D0D] text-[#E0E0E0] overflow-hidden">
      {/* Header Segment */}
      <div id="record-header" className="pt-8 px-6 pb-4 bg-[#0A0A0A] border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase font-sans">
              Neural <span className="text-[#00FF41]">Record</span>
            </h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-mono">
              Overnight Settled Prop Slates
            </p>
          </div>
          <button 
            id="record-refresh-btn"
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#222] text-gray-400 hover:text-[#00FF41] cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loading || isRefreshing) ? "animate-spin text-[#00FF41]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main content scroll context */}
      <div id="record-scroll-area" className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 no-scrollbar">
        
        {loading && !recordData ? (
          <div id="record-loading-box" className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Querying settled ledgers...</p>
          </div>
        ) : error ? (
          <div id="record-error-box" className="p-4 rounded-3xl bg-[#141414] border border-red-950 text-gray-300">
            <div className="flex items-center gap-2.5 text-red-500 font-bold text-xs mb-1.5 uppercase font-mono">
              <XCircle className="w-5 h-5" />
              <span>Diagnostic Feed Error</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="w-full text-center py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-mono uppercase font-bold tracking-wider transition-all"
            >
              Try Reconnecting
            </button>
          </div>
        ) : (
          <div id="record-dashboard-canvas" className="space-y-4">
            
            {/* Top Scoreboard: overall record & hit rate */}
            <motion.div 
              id="overall-scoreboard-banner"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative p-5 rounded-3xl bg-radial from-[#141414] to-[#0D0D0D] bg-[#141414] border border-[#1F1F1F] shadow-xl overflow-hidden flex items-center justify-between"
            >
              <div className="space-y-1 z-10">
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#555] font-black">Consolidated Standing</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-mono font-black text-white leading-none tracking-tight">
                    {summary.hits}W
                  </span>
                  <span className="text-xl font-mono text-gray-600 font-bold">-</span>
                  <span className="text-4xl font-mono font-black text-red-500 leading-none tracking-tight">
                    {summary.misses}L
                  </span>
                </div>
                <p className="text-[10px] font-mono text-gray-400">
                  Total Slates Polled: <strong className="text-white font-bold">{summary.total}</strong>
                </p>
              </div>

              {/* Huge dynamic accuracy rate display */}
              <div className="text-right z-10 flex flex-col items-end">
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#555] font-black">Hit Rate</span>
                <span className="text-4xl font-mono font-black text-[#00FF41] leading-none drop-shadow-[0_0_12px_rgba(0,255,65,0.15)]">
                  {formatPercent(summary.hit_rate / 100)}
                </span>
                <span className="text-[9px] font-mono font-bold text-gray-500 mt-1 uppercase tracking-tight">
                  verified win fraction
                </span>
              </div>

              {/* Styled background abstract decorative element */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#00FF41]/4 to-transparent pointer-events-none" />
            </motion.div>

            {/* Side-by-side Breakdowns */}
            <div id="breakdowns-grid" className="grid grid-cols-2 gap-4">
              
              {/* Card 1: By Prop Type */}
              <motion.div 
                id="prop-type-breakdown-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.05 }}
                className="p-4 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00FF41]" />
                    <span className="text-[9.5px] uppercase font-mono tracking-wider text-white font-black">By Prop Tag</span>
                  </div>
                  
                  {Object.keys(byProp).length === 0 ? (
                    <p className="text-[10px] font-semibold text-gray-500 mt-2 font-mono uppercase tracking-wide">None Computed</p>
                  ) : (
                    <div className="space-y-2 mt-1">
                      {Object.entries(byProp).map(([propKey, value]) => (
                        <div key={propKey} className="border-b border-[#1F1F1F]/60 pb-1.5 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 truncate max-w-[95px]" title={formatPropName(propKey)}>
                              {formatPropName(propKey)}
                            </span>
                            <span className="font-mono text-gray-400">
                              {value.hits}/{value.total}
                            </span>
                          </div>
                          {/* Mini micro visual loader bar */}
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <div className="flex-1 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#00FF41] rounded-full" 
                                style={{ width: `${Math.min(100, Math.max(0, value.hit_rate))}%` }} 
                              />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-[#00FF41] shrink-0">
                              {formatPercent(value.hit_rate / 100)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Card 2: By Confidence Level */}
              <motion.div 
                id="confidence-breakdown-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.1 }}
                className="p-4 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Award className="w-3.5 h-3.5 text-[#00FF41]" />
                    <span className="text-[9.5px] uppercase font-mono tracking-wider text-white font-black">Confidence</span>
                  </div>
                  
                  {Object.keys(byConfidence).length === 0 ? (
                    <p className="text-[10px] font-semibold text-gray-500 mt-2 font-mono uppercase tracking-wide">None Computed</p>
                  ) : (
                    <div className="space-y-2 mt-1">
                      {Object.entries(byConfidence).map(([confKey, value]) => {
                        const scoreColor = confKey === "HIGH" ? "text-emerald-400" : confKey === "MEDIUM" ? "text-amber-400" : "text-sky-400";
                        return (
                          <div key={confKey} className="border-b border-[#1F1F1F]/60 pb-1.5 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className={`font-bold ${scoreColor} font-mono text-[9px]`}>
                                {confKey}
                              </span>
                              <span className="font-mono text-gray-400">
                                {value.hits}/{value.total}
                              </span>
                            </div>
                            {/* Mini micro visual loader bar */}
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <div className="flex-1 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#00FF41] rounded-full" 
                                  style={{ width: `${Math.min(100, Math.max(0, value.hit_rate))}%` }} 
                                />
                              </div>
                              <span className="text-[9px] font-mono font-bold text-[#00FF41] shrink-0">
                                {formatPercent(value.hit_rate / 100)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>

            </div>

            {/* Individual Records Scroll List Header */}
            <div id="results-sections-ledger" className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Individual Graded Slates</h3>
                  <p className="text-[9px] text-gray-500 font-mono">Dynamic Historic Ledger</p>
                </div>

                {/* Filter controls if results exist */}
                {results.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#141414] p-0.5 rounded-lg border border-[#1F1F1F]">
                    <button 
                      onClick={() => setFilterResult("ALL")}
                      className={`text-[8.5px] uppercase font-mono font-bold px-2 py-1 rounded transition-all ${
                        filterResult === "ALL" 
                          ? "bg-[#0FF141]/10 text-[#00FF41]" 
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilterResult("HIT")}
                      className={`text-[8.5px] uppercase font-mono font-bold px-2 py-1 rounded transition-all ${
                        filterResult === "HIT" 
                          ? "bg-[#00FF41]/20 text-[#00FF41]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Hits
                    </button>
                    <button 
                      onClick={() => setFilterResult("MISS")}
                      className={`text-[8.5px] uppercase font-mono font-bold px-2 py-1 rounded transition-all ${
                        filterResult === "MISS" 
                          ? "bg-red-500/20 text-red-400"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Misses
                    </button>
                  </div>
                )}
              </div>

              {/* Scroll list or empty state */}
              {results.length === 0 ? (
                <div id="empty-results-fallback" className="p-8 rounded-3xl border border-[#1F1F1F] bg-[#141414]/30 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-[#1A1A1A] rounded-full text-[#00FF41]/30">
                    <History className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-300 font-medium max-w-[240px] leading-relaxed mx-auto">
                    No results yet — check back after today's games finish.
                  </p>
                  <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                    automatic settlement engine is live
                  </span>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 rounded-3xl border border-[#1F1F1F] bg-[#141414]/10 text-center">
                  <p className="text-xs text-gray-400 font-mono">No matching graded records found</p>
                </div>
              ) : (
                <div id="individual-results-ledger" className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {filteredResults.map((res, index) => {
                      const isHit = res.result === "hit";
                      const valEdge = res.value_edge ?? 0;
                      const edgeValue = valEdge <= 1 ? valEdge * 100 : valEdge;
                      const scoreColor = res.confidence === "HIGH" ? "text-emerald-400" : res.confidence === "MEDIUM" ? "text-amber-400" : "text-sky-400";
                      const recordKey = `${res.player}-${res.date}-${res.prop_type}-${res.pick}-${res.actual ?? ''}-${index}`;
                      
                      return (
                        <motion.div 
                          id={`result-ledger-item-${index}`}
                          key={recordKey}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.2) }}
                          className={`p-4 rounded-3xl border bg-[#141414] shadow flex flex-col gap-3 transition-all ${
                            isHit 
                              ? "border-[#00FF41]/20 shadow-[#00FF41]/2" 
                              : "border-red-500/10"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-white tracking-tight">{res.player}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {formatPropName(res.prop_type)} • <span className="text-white font-semibold italic">{res.pick}</span>
                              </p>
                            </div>

                            {/* Status Chip */}
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                              isHit 
                                ? "bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20" 
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {res.result.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 border-t border-[#1F1F1F]/70 pt-2.5 text-center">
                            <div>
                              <span className="text-[8px] uppercase font-mono text-gray-500 block">Projected</span>
                              <span className="text-xs font-mono font-medium text-white">
                                {res.projected !== undefined && res.projected !== null ? res.projected.toFixed(2) : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-mono text-gray-500 block">Actual</span>
                              <span className={`text-xs font-mono font-bold ${isHit ? 'text-[#00FF41]' : 'text-red-400'}`}>
                                {res.actual !== undefined && res.actual !== null ? res.actual.toFixed(2) : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-mono text-gray-500 block">Value Edge</span>
                              <span className="text-xs font-mono font-semibold text-[#00FF41]">
                                {res.value_edge !== undefined && res.value_edge !== null ? `+${edgeValue.toFixed(1)}%` : "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 border-t border-[#1F1F1F]/40 pt-2">
                            <span>{res.date}</span>
                            <span className="flex items-center gap-1">
                              Confidence: <span className={`font-semibold uppercase ${scoreColor}`}>{res.confidence}</span>
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

            </div>

            {/* Timings updated details card */}
            <motion.div 
              id="record-timing-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="p-4 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F1F1F] rounded-xl text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-wider text-[#555] font-semibold">Feed Status Sync</div>
                  <div className="text-xs text-gray-400 font-sans mt-0.5">
                    Latest Ledger: <strong className="font-bold text-white">{formatToEasternTime(recordData?.last_updated || "")}</strong>
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                ACTIVE
              </span>
            </motion.div>

          </div>
        )}

      </div>
    </div>
  );
}
