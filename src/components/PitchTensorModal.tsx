/**
 * PitchTensorModal.tsx
 * Interactive Pitch-Mix Matchup Tensor Inspector & Diagnostic Indicator.
 * Renders raw matchup dot products, percentile ranks, primary vulnerabilities,
 * and an interactive pitch arsenal simulator.
 */

import React, { useState } from "react";
import { PitchTensorData } from "../types";
import {
  evaluatePitchMatchup,
  FEATURED_BATTERS,
  FEATURED_STARTERS,
  PITCH_NAMES,
} from "../utils/pitchMatchupTensor";
import {
  calculateBullpenExposure,
  TEAM_BULLPENS,
  BullpenExposureResult
} from "../utils/bullpenExposureEngine";
import {
  LineupMarkovSimulatorTS,
  DEFAULT_LINEUP_OBPS
} from "../utils/lineupMarkovSimulator";
import { X, Activity, AlertTriangle, CheckCircle2, Sliders, Layers, Sparkles, RefreshCw, ShieldAlert, Zap, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PitchTensorData | null;
  defaultHitter?: string;
  defaultPitcher?: string;
}

export default function PitchTensorModal({
  isOpen,
  onClose,
  initialData,
  defaultHitter = "Aaron Judge",
  defaultPitcher = "Spencer Strider",
}: Props) {
  const [activeTab, setActiveTab] = useState<"DIAGNOSTIC" | "SIMULATOR" | "BULLPEN_EXPOSURE" | "LINEUP_MARKOV">("DIAGNOSTIC");

  // State for interactive simulator
  const [selectedHitter, setSelectedHitter] = useState<string>(
    initialData?.hitter || defaultHitter
  );
  const [selectedPitcher, setSelectedPitcher] = useState<string>(
    initialData?.pitcher || defaultPitcher
  );

  // Custom Arsenal sliders
  const defaultArsenal = FEATURED_STARTERS[selectedPitcher] || { FF: 0.5, SL: 0.35, CH: 0.15 };
  const [customArsenal, setCustomArsenal] = useState<Record<string, number>>(defaultArsenal);

  // Custom Batter RV inputs
  const defaultRv = FEATURED_BATTERS[selectedHitter] || {
    FF: 2.45,
    SI: 1.8,
    FC: 1.2,
    SL: -1.2,
    ST: -1.4,
    CU: 0.8,
    CH: 0.1,
  };
  const [customRv, setCustomRv] = useState<Record<string, number>>(defaultRv);

  if (!isOpen) return null;

  // Active data source
  const currentData: PitchTensorData =
    activeTab === "DIAGNOSTIC" && initialData
      ? initialData
      : evaluatePitchMatchup(
          selectedHitter,
          selectedPitcher,
          customArsenal,
          customRv
        );

  const handlePitcherChange = (pitcherName: string) => {
    setSelectedPitcher(pitcherName);
    const newArsenal = FEATURED_STARTERS[pitcherName] || { FF: 0.45, SL: 0.35, CH: 0.2 };
    setCustomArsenal(newArsenal);
  };

  const handleHitterChange = (hitterName: string) => {
    setSelectedHitter(hitterName);
    const newRv = FEATURED_BATTERS[hitterName] || { FF: 1.5, SL: -0.8, CH: 0.2 };
    setCustomRv(newRv);
  };

  const getBadgeStyle = (color: PitchTensorData["badge_color"]) => {
    switch (color) {
      case "green":
      case "emerald":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-500/40";
      case "amber":
        return "bg-amber-950/80 text-amber-400 border-amber-500/40";
      case "red":
        return "bg-rose-950/80 text-rose-400 border-rose-500/40";
      default:
        return "bg-stone-800 text-stone-300 border-stone-700";
    }
  };

  return (
    <AnimatePresence>
      <div id="pitch-tensor-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
        <motion.div
          id="pitch-tensor-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-lg max-h-[90vh] bg-[#0E0E0E] border border-[#262626] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-100 font-sans"
        >
          {/* Header */}
          <div id="tensor-modal-header" className="px-5 py-4 border-b border-[#1F1F1F] flex items-center justify-between bg-[#121212]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00FF41]/10 border border-[#00FF41]/30 flex items-center justify-center text-[#00FF41]">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Pitch-Mix Matchup Tensor
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/30">
                    PHASE 1
                  </span>
                </h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  {currentData.hitter} vs {currentData.pitcher}
                </p>
              </div>
            </div>
            <button
              id="close-tensor-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sub-navigation tabs */}
          <div id="tensor-tab-bar" className="px-5 py-2 bg-[#090909] border-b border-[#1A1A1A] flex items-center gap-1.5 text-xs font-medium">
            <button
              id="tab-diagnostic-btn"
              onClick={() => setActiveTab("DIAGNOSTIC")}
              className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px] ${
                activeTab === "DIAGNOSTIC"
                  ? "bg-[#1A1A1A] text-white border border-[#333]"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Layers size={13} />
              Diagnostic
            </button>
            <button
              id="tab-simulator-btn"
              onClick={() => setActiveTab("SIMULATOR")}
              className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px] ${
                activeTab === "SIMULATOR"
                  ? "bg-[#1A1A1A] text-white border border-[#333]"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Sliders size={13} />
              Sandbox
            </button>
            <button
              id="tab-bullpen-btn"
              onClick={() => setActiveTab("BULLPEN_EXPOSURE")}
              className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px] ${
                activeTab === "BULLPEN_EXPOSURE"
                  ? "bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/30"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Zap size={13} />
              Phase 2 Bullpen
            </button>
            <button
              id="tab-markov-btn"
              onClick={() => setActiveTab("LINEUP_MARKOV")}
              className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px] ${
                activeTab === "LINEUP_MARKOV"
                  ? "bg-purple-950/60 text-purple-400 border border-purple-800/50"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Cpu size={13} />
              Markov Lineup
            </button>
          </div>

          {/* Body Content */}
          <div id="tensor-modal-body" className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
            {activeTab === "SIMULATOR" && (
              <div id="tensor-simulator-controls" className="p-3.5 bg-[#141414] border border-[#262626] rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#00FF41]" />
                    Interactive Matchup Sandbox
                  </span>
                  <button
                    id="reset-sandbox-btn"
                    onClick={() => {
                      handleHitterChange(selectedHitter);
                      handlePitcherChange(selectedPitcher);
                    }}
                    className="text-[10px] text-stone-400 hover:text-[#00FF41] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} /> Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Select Hitter</label>
                    <select
                      id="select-hitter-dropdown"
                      value={selectedHitter}
                      onChange={(e) => handleHitterChange(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-[#00FF41]"
                    >
                      {Object.keys(FEATURED_BATTERS).map((hitter) => (
                        <option key={hitter} value={hitter}>
                          {hitter}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Select Pitcher</label>
                    <select
                      id="select-pitcher-dropdown"
                      value={selectedPitcher}
                      onChange={(e) => handlePitcherChange(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-[#00FF41]"
                    >
                      {Object.keys(FEATURED_STARTERS).map((pitcher) => (
                        <option key={pitcher} value={pitcher}>
                          {pitcher}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pitcher Arsenal Frequency Sliders */}
                <div className="space-y-1.5 pt-1 border-t border-[#222]">
                  <p className="text-[10px] font-semibold text-stone-400">
                    Adjust {selectedPitcher}'s Arsenal Frequencies:
                  </p>
                  {Object.entries(customArsenal).map(([pitchType, freq]) => (
                    <div key={pitchType} className="flex items-center gap-2 text-[11px]">
                      <span className="w-12 font-mono text-stone-300 font-semibold">{pitchType}</span>
                      <input
                        type="range"
                        min="0"
                        max="0.80"
                        step="0.05"
                        value={freq}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setCustomArsenal((prev) => ({ ...prev, [pitchType]: val }));
                        }}
                        className="flex-1 accent-[#00FF41] h-1.5 bg-[#262626] rounded-lg cursor-pointer"
                      />
                      <span className="w-10 text-right font-mono text-stone-400">
                        {Math.round(Number(freq) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Cards Grid */}
            <div id="tensor-score-cards-grid" className="grid grid-cols-2 gap-3">
              {/* Percentile Rank Card */}
              <div className="p-3.5 bg-[#121212] border border-[#222] rounded-2xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-semibold">
                  Matchup Percentile Rank
                </span>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1 font-mono">
                    {currentData.percentile_display}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md border ${getBadgeStyle(currentData.badge_color)}`}>
                      {currentData.rating}
                    </span>
                  </div>
                </div>

                {/* Visual Spectrum Gauge */}
                <div className="space-y-1 pt-1">
                  <div className="h-2 w-full bg-[#1F1F1F] rounded-full overflow-hidden p-0.5 flex">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-[#00FF41] transition-all duration-300"
                      style={{ width: `${Math.max(5, currentData.percentile_rank * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-stone-500">
                    <span>0% (Disadvantage)</span>
                    <span>100% (Elite)</span>
                  </div>
                </div>
              </div>

              {/* Raw Matchup Score Card */}
              <div className="p-3.5 bg-[#121212] border border-[#222] rounded-2xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-semibold">
                  Raw Matchup Tensor
                </span>
                <div>
                  <div className={`text-2xl font-black font-mono tracking-tight ${currentData.raw_matchup_score >= 0 ? "text-[#00FF41]" : "text-rose-400"}`}>
                    {currentData.raw_matchup_score >= 0 ? "+" : ""}
                    {currentData.raw_matchup_score.toFixed(3)}
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Weighted Statcast RV / 100 pitches
                  </span>
                </div>

                <div className="p-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl text-[10px] text-stone-400 font-mono">
                  League Baseline: <span className="text-stone-200">+0.080</span>
                </div>
              </div>
            </div>

            {/* Callouts for Primary Vulnerability & Advantage */}
            <div id="tensor-key-drivers" className="space-y-2.5">
              {/* Primary Vulnerability Alert */}
              <div id="tensor-vulnerability-alert" className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex gap-2.5 items-start">
                <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-rose-400 font-mono font-bold block">
                    Primary Vulnerability Indicator
                  </span>
                  <p className="text-xs text-stone-200 leading-snug font-medium">
                    {currentData.primary_vulnerability}
                  </p>
                </div>
              </div>

              {/* Primary Advantage Callout */}
              <div id="tensor-advantage-alert" className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl flex gap-2.5 items-start">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-bold block">
                    Key Matchup Edge Driver
                  </span>
                  <p className="text-xs text-stone-200 leading-snug font-medium">
                    {currentData.primary_advantage}
                  </p>
                </div>
              </div>
            </div>

            {/* Pitch Arsenal vs Run Value Tensor Table */}
            <div id="tensor-breakdown-section" className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
                <span>Arsenal Usage vs. Batter Run Value Matrix</span>
                <span className="text-[10px] text-stone-500 font-mono">Dot Product Decomposition</span>
              </div>

              <div id="tensor-breakdown-list" className="space-y-2">
                {currentData.arsenal_breakdown.map((item) => {
                  const isPositive = item.batter_rv100 >= 0;
                  return (
                    <div
                      key={item.pitch_type}
                      className="p-2.5 bg-[#121212] border border-[#222] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1 flex-1 pr-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-200 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-[#1C1C1C] text-stone-300 font-mono text-[10px] border border-[#333]">
                              {item.pitch_type}
                            </span>
                            {item.pitch_name}
                          </span>
                          <span className="text-[11px] font-mono text-stone-400">
                            Usage: <strong className="text-stone-200">{item.frequency_pct}%</strong>
                          </span>
                        </div>

                        {/* Frequency visual bar */}
                        <div className="w-full bg-[#1F1F1F] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#00FF41] h-full rounded-full"
                            style={{ width: `${Math.min(100, item.frequency_pct * 1.5)}%` }}
                          />
                        </div>
                      </div>

                      {/* Statcast RV and Impact */}
                      <div className="text-right shrink-0 space-y-0.5">
                        <div className="text-[10px] text-stone-400 font-mono">
                          Batter RV/100:{" "}
                          <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {item.batter_rv100 >= 0 ? "+" : ""}
                            {item.batter_rv100.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold font-mono text-white">
                          Impact:{" "}
                          <span className={item.weighted_impact >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {item.weighted_impact >= 0 ? "+" : ""}
                            {item.weighted_impact.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PHASE 2 BULLPEN EXPOSURE TAB */}
            {activeTab === "BULLPEN_EXPOSURE" && (() => {
              const hitterHand = selectedHitter.includes("Ohtani") || selectedHitter.includes("Soto") || selectedHitter.includes("Freeman") || selectedHitter.includes("Schwarber") || selectedHitter.includes("Seager") ? "L" : "R";
              const teamCode = selectedPitcher.includes("Strider") || selectedPitcher.includes("Sale") ? "ATL" : selectedPitcher.includes("Yamamoto") || selectedPitcher.includes("Glasnow") ? "LAD" : "NYY";
              
              const bullpenResult = calculateBullpenExposure(
                selectedHitter,
                hitterHand,
                FEATURED_BATTERS[selectedHitter] || { FF: 2.0, SL: -1.0 },
                selectedPitcher,
                22.0,
                FEATURED_STARTERS[selectedPitcher] || { FF: 0.5, SL: 0.35, CH: 0.15 },
                TEAM_BULLPENS[teamCode] || TEAM_BULLPENS["NYY"]
              );

              return (
                <div id="bullpen-exposure-view" className="space-y-3">
                  <div className="p-3 bg-[#111111] border border-[#222] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <Zap size={14} className="text-[#00FF41]" />
                        Phase 2 Probabilistic Bullpen Exposure
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/30">
                        {teamCode} Bullpen
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Calculates starter fatigue exit depth ({bullpenResult.starter_expected_bf} BF = {(bullpenResult.starter_game_share * 100).toFixed(0)}% game share) and projects fatigue-weighted bullpen matchup exposure vector for remaining {(bullpenResult.bullpen_game_share * 100).toFixed(0)}% of game PAs.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 bg-[#1A1A1A] rounded-xl border border-[#2B2B2B]">
                        <div className="text-[10px] text-stone-400 font-mono">Starter Matchup Score</div>
                        <div className="text-sm font-bold font-mono text-emerald-400">
                          {bullpenResult.starter_matchup_score >= 0 ? "+" : ""}{bullpenResult.starter_matchup_score.toFixed(3)} RV
                        </div>
                      </div>
                      <div className="p-2 bg-[#1A1A1A] rounded-xl border border-[#2B2B2B]">
                        <div className="text-[10px] text-stone-400 font-mono">Weighted Bullpen Score</div>
                        <div className="text-sm font-bold font-mono text-[#00FF41]">
                          {bullpenResult.weighted_bullpen_matchup_score >= 0 ? "+" : ""}{bullpenResult.weighted_bullpen_matchup_score.toFixed(3)} RV
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reliever Exposure List */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-stone-300 flex items-center justify-between">
                      <span>Reliever Availability & Platoon Exposure Probabilities</span>
                      <span className="text-[10px] text-stone-500 font-mono">Workload-Discounted</span>
                    </div>

                    {bullpenResult.reliever_exposures.map((rel) => (
                      <div key={rel.reliever_id} className="p-2.5 bg-[#121212] border border-[#222] rounded-xl flex items-center justify-between">
                        <div className="space-y-1 flex-1 pr-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-200 flex items-center gap-1.5">
                              {rel.name}
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-stone-800 text-stone-400">
                                {rel.hand}HP
                              </span>
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              rel.fatigue_status === "Rested" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40" :
                              rel.fatigue_status === "Moderate" ? "bg-amber-950/80 text-amber-400 border border-amber-800/40" :
                              "bg-rose-950/80 text-rose-400 border border-rose-800/40"
                            }`}>
                              {rel.fatigue_status} (Avail: {(rel.availability_score * 100).toFixed(0)}%)
                            </span>
                          </div>

                          <div className="w-full bg-[#1F1F1F] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#00FF41] h-full rounded-full"
                              style={{ width: `${Math.min(100, rel.exposure_probability * 300)}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5">
                          <div className="text-[10px] text-stone-400 font-mono">
                            P(Face): <strong className="text-white">{(rel.exposure_probability * 100).toFixed(1)}%</strong>
                          </div>
                          <div className="text-[11px] font-bold font-mono text-stone-200">
                            Tensor:{" "}
                            <span className={rel.reliever_matchup_score >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              {rel.reliever_matchup_score >= 0 ? "+" : ""}{rel.reliever_matchup_score.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* GENERATIVE LINEUP MARKOV SIMULATOR TAB */}
            {activeTab === "LINEUP_MARKOV" && (() => {
              const teamCode = selectedPitcher.includes("Strider") || selectedPitcher.includes("Sale") ? "ATL" : selectedPitcher.includes("Yamamoto") || selectedPitcher.includes("Glasnow") ? "LAD" : "NYY";
              const lineupObps = DEFAULT_LINEUP_OBPS[teamCode] || DEFAULT_LINEUP_OBPS["NYY"];
              
              const markovSim = new LineupMarkovSimulatorTS(lineupObps, true, 22.0, 0.310);
              const simSummary = markovSim.calculatePaDistributions(15000);

              return (
                <div id="markov-lineup-view" className="space-y-3">
                  <div className="p-3 bg-[#111111] border border-[#222] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <Cpu size={14} className="text-purple-400" />
                        Generative 9-Man Lineup Markov Simulator
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                        {simSummary.simulation_runs.toLocaleString()} Sims ({simSummary.execution_time_ms}ms)
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Simulates 15,000 full game closed-loop 1-9 batting rotations incorporating starter exit depth, home team 9th-inning bypass dynamics, and bullpen OBP to derive exact PA probability vectors.
                    </p>
                  </div>

                  {/* Lineup Slots Grid */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-stone-300 flex items-center justify-between">
                      <span>Lineup PA Volume Probability Vector</span>
                      <span className="text-[10px] text-stone-500 font-mono">15K Runs</span>
                    </div>

                    {simSummary.lineup_slots.map((slot) => (
                      <div key={slot.batting_order_slot} className="p-2.5 bg-[#121212] border border-[#222] rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-200 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-purple-950/80 border border-purple-700/50 text-purple-300 flex items-center justify-center text-[10px] font-mono">
                              #{slot.batting_order_slot}
                            </span>
                            Slot #{slot.batting_order_slot}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-purple-300">
                            Exp PAs: <span className="text-white">{slot.expected_pas.toFixed(2)}</span> (±{slot.std_dev_pas.toFixed(2)})
                          </span>
                        </div>

                        {/* Probability Bars: P(3), P(4), P(5), P(6+) */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono">
                          <div className="p-1.5 bg-[#1A1A1A] rounded-lg border border-[#2B2B2B] text-center">
                            <div className="text-stone-500 text-[9px]">P(3 PAs)</div>
                            <div className="font-bold text-stone-300">{(slot.prob_3_pas * 100).toFixed(1)}%</div>
                          </div>
                          <div className="p-1.5 bg-[#1A1A1A] rounded-lg border border-[#2B2B2B] text-center">
                            <div className="text-stone-500 text-[9px]">P(4 PAs)</div>
                            <div className="font-bold text-emerald-400">{(slot.prob_4_pas * 100).toFixed(1)}%</div>
                          </div>
                          <div className="p-1.5 bg-[#1A1A1A] rounded-lg border border-[#2B2B2B] text-center">
                            <div className="text-stone-500 text-[9px]">P(5 PAs)</div>
                            <div className="font-bold text-purple-400">{(slot.prob_5_pas * 100).toFixed(1)}%</div>
                          </div>
                          <div className="p-1.5 bg-[#1A1A1A] rounded-lg border border-[#2B2B2B] text-center">
                            <div className="text-stone-500 text-[9px]">P(≥4 PAs)</div>
                            <div className="font-bold text-[#00FF41]">{(slot.prob_at_least_4_pas * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer info */}
          <div id="tensor-modal-footer" className="px-5 py-3 bg-[#0A0A0A] border-t border-[#1A1A1A] flex items-center justify-between text-[10px] text-stone-500 font-mono">
            <span>Normalized vs 150k historical MLB pairings</span>
            <button
              id="tensor-modal-done-btn"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-stone-200 font-sans font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close Diagnostic
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
