/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Health } from "../types";
import { formatRelativeTime, formatToEasternTime } from "../utils";
import { 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Activity, 
  TrendingUp, 
  Gamepad2, 
  Server, 
  CheckCircle2, 
  XCircle,
  Cpu,
  RefreshCcw,
  Zap
} from "lucide-react";

interface StatusScreenProps {
  health: Health | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

export default function StatusScreen({
  health,
  loading,
  error,
  onRefresh
}: StatusScreenProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const isOk = health?.status?.toLowerCase() === "ok";

  return (
    <div id="status-screen-wrapper" className="flex flex-col h-full bg-[#0D0D0D] text-[#E0E0E0] overflow-hidden">
      {/* Header section */}
      <div id="status-header" className="pt-8 px-6 pb-4 bg-[#0A0A0A] border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase font-sans">
              SYSTEM <span className="text-[#00FF41]">STATUS</span>
            </h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-mono">
              Live Neural Model Telemetry
            </p>
          </div>
          <button 
            id="status-refresh-btn"
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#222] text-gray-400 hover:text-[#00FF41] cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loading || isRefreshing) ? "animate-spin text-[#00FF41]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Stats Panel */}
      <div id="status-scroll-area" className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 no-scrollbar">
        {loading && !health ? (
          <div id="status-loading-box" className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Querying health status...</p>
          </div>
        ) : error ? (
          <div id="status-error-box" className="p-4 rounded-3xl bg-[#141414] border border-red-950 text-gray-300">
            <div className="flex items-center gap-2.5 text-red-500 font-bold text-xs mb-1.5 uppercase font-mono">
              <XCircle className="w-5 h-5" />
              <span>Failed to fetch health check</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="w-full text-center py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-mono uppercase font-bold tracking-wider transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : health ? (
          <div id="status-content" className="space-y-4">
            
            {/* Status card */}
            <motion.div 
              id="status-system-status-card"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-5 rounded-3xl border bg-[#141414] border-[#1F1F1F] shadow-lg transition-all`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#555] font-bold">Model Engine Status</span>
                  <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                    {isOk ? "All Systems Operational" : "System Alert Action Required"}
                  </h3>
                </div>
                
                {/* Active pulsating beacon */}
                <div className="flex items-center gap-1.5 bg-[#1F1F1F] px-3 py-1 rounded-full border border-[#2A2A2A]">
                  <span className="w-1.5 h-1.5 rounded-full relative flex">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${isOk ? 'bg-[#00FF41]' : 'bg-amber-400'}`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isOk ? 'bg-[#00FF41]' : 'bg-amber-500'}`} />
                  </span>
                  <span className="text-[9px] font-mono font-black uppercase text-gray-300 tracking-wide">{health.status}</span>
                </div>
              </div>

              {/* Server indicator detail */}
              <div className="mt-4 pt-4 border-t border-[#1F1F1F] flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-gray-600" />
                  Feed Endpoint
                </span>
                <span className="font-mono text-xs text-[#00FF41] font-bold">ONLINE</span>
              </div>
            </motion.div>

            {/* Grid of numbers - Large readable numbers */}
            <div id="status-metrics-grid" className="grid grid-cols-2 gap-4">
              
              {/* Predictions / Models Loaded */}
              <motion.div 
                id="metric-card-predictions"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-3xl bg-[#141414] border border-[#1F1F1F] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-7 h-7 rounded-lg bg-[#00FF41]/15 flex items-center justify-center mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00FF41]" />
                  </div>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#555] font-bold">Neural Engine</span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-mono font-black tracking-tight text-white uppercase truncate block">
                    {health.predictions_today !== undefined ? health.predictions_today : `${health.models_loaded?.length || 5} Active`}
                  </span>
                  <div className="text-[10px] text-gray-500 mt-1 uppercase font-mono font-bold leading-tight">
                    {health.predictions_today !== undefined ? "Cleared Edges" : "MLB Models Online"}
                  </div>
                </div>
              </motion.div>

              {/* Games / Preferred Book Feed */}
              <motion.div 
                id="metric-card-games"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-5 rounded-3xl bg-[#141414] border border-[#1F1F1F] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-7 h-7 rounded-lg bg-[#00FF41]/15 flex items-center justify-center mb-3">
                    <Gamepad2 className="w-3.5 h-3.5 text-[#00FF41]" />
                  </div>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#555] font-bold">Feed Source</span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-mono font-black tracking-tight text-white uppercase truncate block">
                    {health.games_today !== undefined ? health.games_today : (health.preferred_book || "Fanduel")}
                  </span>
                  <div className="text-[10px] text-gray-500 mt-1 uppercase font-mono font-bold leading-tight">
                    {health.games_today !== undefined ? "MLB Matches" : "Target Sportsbook"}
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Last updated relative time indicator */}
            <motion.div 
              id="status-timing-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F1F1F] rounded-xl text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-wider text-[#555] font-semibold">Synchronization</div>
                  <div className="text-xs text-gray-400 font-sans mt-0.5">
                    Last compiled: <strong className="font-bold text-white">{formatToEasternTime(health.last_updated || health.server_time_et)}</strong>
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-[#00FF41] bg-[#00FF41]/10 px-2 py-0.5 rounded border border-[#00FF41]/20">
                ET
              </span>
            </motion.div>

            {/* Model stats disclaimer */}
            <div id="status-info-box" className="p-5 rounded-3xl border border-[#1F1F1F] bg-[#141414]/40 text-[#666] flex gap-3">
              <Zap className="w-4 h-4 text-[#00FF41] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                The neural pipeline synthesizes fair win indices on the pitch-per-pitch log every 30 minutes. If updates delay, contact operational team or pull to try.
              </p>
            </div>

          </div>
        ) : (
          <div id="status-missing-info" className="text-center py-20 text-gray-600 text-xs font-mono uppercase tracking-widest">
            no telemetry recorded
          </div>
        )}
      </div>
    </div>
  );
}
