/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Prediction, Game, Health, RecordData, NflPrediction, NflPredictionsDoc, CfbPrediction, CfbPredictionsDoc, TennisPrediction, TennisPredictionsDoc } from "./types";
import TodayScreen from "./components/TodayScreen";
import GamesScreen from "./components/GamesScreen";
import StatusScreen from "./components/StatusScreen";
import RecordScreen from "./components/RecordScreen";
import NflTodayScreen from "./components/NflTodayScreen";
import CfbTodayScreen from "./components/CfbTodayScreen";
import TennisTodayScreen from "./components/TennisTodayScreen";
import { deduplicatePredictions, deduplicateNflPredictions, deduplicateCfbPredictions, deduplicateTennisPredictions } from "./utils";
import { TrendingUp, Calendar, Activity, ShieldCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type TabType = "TODAY" | "GAMES" | "STATUS" | "RECORD" | "NFL" | "CFB" | "TENNIS";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("TODAY");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [recordData, setRecordData] = useState<RecordData | null>(null);
  const [nflPredictions, setNflPredictions] = useState<NflPrediction[]>([]);
  const [nflSeason, setNflSeason] = useState<number | null>(null);
  const [nflWeek, setNflWeek] = useState<number | null>(null);
  const [nflError, setNflError] = useState<string | null>(null);
  const [cfbPredictions, setCfbPredictions] = useState<CfbPrediction[]>([]);
  const [cfbSeason, setCfbSeason] = useState<number | null>(null);
  const [cfbWeek, setCfbWeek] = useState<number | null>(null);
  const [cfbError, setCfbError] = useState<string | null>(null);
  const [tennisPredictions, setTennisPredictions] = useState<TennisPrediction[]>([]);
  const [tennisError, setTennisError] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to fetch endpoint with error detail extraction and graceful handling
  const fetchEndpoint = async (url: string) => {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) errDetail = body.error + (body.details ? `: ${body.details}` : "");
        } catch (_) {}
        console.warn(`[API] Endpoint ${url} returned ${errDetail}`);
        return null;
      }
      return await res.json();
    } catch (err: any) {
      console.warn(`[API] Fetch error for ${url}:`, err?.message || err);
      return null;
    }
  };

  // Consolidated parallel loader with retries and background update support
  const loadWorkspaceData = async (isBackground = false) => {
    // Only set global loading screen if we have no existing predictions and it's not a background poll
    if (!isBackground && predictions.length === 0) {
      setLoading(true);
    }
    
    let retries = 0;
    const maxRetries = isBackground ? 1 : 3;

    while (retries < maxRetries) {
      const timestamp = Date.now();
      const [pRes, gRes, hRes, rRes] = await Promise.allSettled([
        fetchEndpoint(`/api/predictions?t=${timestamp}`),
        fetchEndpoint(`/api/games?t=${timestamp}`),
        fetchEndpoint(`/api/health?t=${timestamp}`),
        fetchEndpoint(`/api/record?t=${timestamp}`)
      ]);

      const preds = pRes.status === "fulfilled" ? pRes.value : null;
      const gList = gRes.status === "fulfilled" ? gRes.value : null;
      const hData = hRes.status === "fulfilled" ? hRes.value : null;
      const rData = rRes.status === "fulfilled" ? rRes.value : null;

      // Update predictions if returned as array
      if (Array.isArray(preds)) {
        const cleanPreds = deduplicatePredictions(preds);
        setPredictions(cleanPreds);
        if (Array.isArray(gList)) setGames(gList);
        if (hData) setHealth(hData);
        if (rData) setRecordData(rData);
        setError(null);
        setLoading(false);
        return;
      }

      retries++;
      if (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      }
    }

    // If predictions are still empty after retries, set error state
    if (predictions.length === 0) {
      setError("Unable to connect to Prop Edge predictions server. Retrying connection...");
    }
    setLoading(false);
  };

  // NFL is a weekly-cadence feed (unlike MLB's daily slate), so it doesn't
  // need the same retry/backoff plumbing -- one fetch is enough, still on
  // the same 30s interval as MLB for consistency.
  const loadNflData = async () => {
    const doc: NflPredictionsDoc | null = await fetchEndpoint(`/api/nfl-predictions?t=${Date.now()}`);
    if (doc && Array.isArray(doc.picks)) {
      setNflPredictions(deduplicateNflPredictions(doc.picks));
      setNflSeason(doc.season ?? null);
      setNflWeek(doc.week ?? null);
      setNflError(null);
    } else {
      setNflError("Unable to connect to Prop Edge NFL predictions server.");
    }
  };

  // CFB is also a weekly-cadence feed, same reasoning as loadNflData.
  const loadCfbData = async () => {
    const doc: CfbPredictionsDoc | null = await fetchEndpoint(`/api/cfb-predictions?t=${Date.now()}`);
    if (doc && Array.isArray(doc.picks)) {
      setCfbPredictions(deduplicateCfbPredictions(doc.picks));
      setCfbSeason(doc.season ?? null);
      setCfbWeek(doc.week ?? null);
      setCfbError(null);
    } else {
      setCfbError("Unable to connect to Prop Edge CFB predictions server.");
    }
  };

  // Tennis has no season/week cadence at all (individual matches, not a
  // team schedule) -- same one-fetch-per-poll reasoning as NFL/CFB.
  const loadTennisData = async () => {
    const doc: TennisPredictionsDoc | null = await fetchEndpoint(`/api/tennis-predictions?t=${Date.now()}`);
    if (doc && Array.isArray(doc.picks)) {
      setTennisPredictions(deduplicateTennisPredictions(doc.picks));
      setTennisError(null);
    } else {
      setTennisError("Unable to connect to Prop Edge tennis predictions server.");
    }
  };

  useEffect(() => {
    loadWorkspaceData();
    loadNflData();
    loadCfbData();
    loadTennisData();
    // Poll endpoints every 30 seconds to fetch fresh predictions
    const interval = setInterval(() => {
      loadWorkspaceData();
      loadNflData();
      loadCfbData();
      loadTennisData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Map active screen transitions inside Framer Motion AnimatePresence
  const renderScreen = () => {
    switch (activeTab) {
      case "TODAY":
        return (
          <TodayScreen 
            predictions={predictions} 
            loading={loading} 
            error={error} 
            onRefresh={loadWorkspaceData}
          />
        );
      case "GAMES":
        return (
          <GamesScreen 
            games={games} 
            predictions={predictions}
            loading={loading} 
            error={error} 
            onRefresh={loadWorkspaceData}
          />
        );
      case "STATUS":
        return (
          <StatusScreen 
            health={health} 
            loading={loading} 
            error={error} 
            onRefresh={loadWorkspaceData}
          />
        );
      case "RECORD":
        return (
          <RecordScreen
            recordData={recordData}
            loading={loading}
            error={error}
            onRefresh={loadWorkspaceData}
          />
        );
      case "NFL":
        return (
          <NflTodayScreen
            predictions={nflPredictions}
            season={nflSeason}
            week={nflWeek}
            loading={loading}
            error={nflError}
            onRefresh={loadNflData}
          />
        );
      case "CFB":
        return (
          <CfbTodayScreen
            predictions={cfbPredictions}
            season={cfbSeason}
            week={cfbWeek}
            loading={loading}
            error={cfbError}
            onRefresh={loadCfbData}
          />
        );
      case "TENNIS":
        return (
          <TennisTodayScreen
            predictions={tennisPredictions}
            loading={loading}
            error={tennisError}
            onRefresh={loadTennisData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div id="app-root-shell" className="h-dvh w-full bg-[#050505] md:py-6 flex items-center justify-center font-sans antialiased text-stone-200 select-none selection:bg-[#00FF41]/20 selection:text-[#00FF41]">
      
      {/* Phone frame wrapper container for immersive desktop feeling, fully fluid on mobile */}
      <div 
        id="phone-frame-container" 
        className="w-full max-w-[430px] h-full md:h-[840px] md:max-h-[92vh] md:rounded-[40px] bg-[#0A0A0A] md:border-[8px] md:border-[#1A1A1A] md:shadow-2xl flex flex-col relative overflow-hidden"
      >
        
        {/* Dynamic screen element transition */}
        <div id="active-screen-container" className="flex-1 overflow-hidden relative bg-[#0D0D0D]">
          <AnimatePresence mode="wait">
            <motion.div
              id={`motion-screen-${activeTab}`}
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.16, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Footer Notes on every screen */}
        <div 
          id="global-legal-footer" 
          className="absolute bottom-[66px] left-0 w-full px-5 py-2.5 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#1A1A1A] text-center z-10"
        >
          <p className="text-[9px] text-gray-600 text-center leading-tight max-w-[280px] mx-auto">
            Projections are statistical estimates, not guarantees. Bet responsibly. <strong className="text-[#00FF41] font-semibold">21+</strong>
          </p>
        </div>

        {/* Dynamic Bottom Tab Navigation */}
        <nav 
          id="bottom-tab-navigation" 
          className="h-[64px] bg-[#0A0A0A] border-t border-[#1A1A1A] px-6 flex items-center justify-between z-20 shrink-0 select-none"
        >
          {/* Today Button */}
          <button
            id="tab-btn-today"
            onClick={() => setActiveTab("TODAY")}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all group relative h-full cursor-pointer"
          >
            <div className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              activeTab === "TODAY" ? "bg-[#00FF41]/20" : "bg-transparent"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeTab === "TODAY" ? "bg-[#00FF41] shadow-[0_0_8px_#00FF41]" : "bg-white/40 group-hover:bg-white"
              }`} />
            </div>
            <span 
              className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-250 ${
                activeTab === "TODAY" 
                  ? "text-[#00FF41]" 
                  : "text-white opacity-40 group-hover:opacity-80"
              }`}
            >
              Today
            </span>
          </button>

          {/* Games Button */}
          <button
            id="tab-btn-games"
            onClick={() => setActiveTab("GAMES")}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all group relative h-full cursor-pointer"
          >
            <div className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              activeTab === "GAMES" ? "bg-[#00FF41]/20" : "bg-transparent"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeTab === "GAMES" ? "bg-[#00FF41] shadow-[0_0_8px_#00FF41]" : "bg-white/40 group-hover:bg-white"
              }`} />
            </div>
            <span 
              className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-250 ${
                activeTab === "GAMES" 
                  ? "text-[#00FF41]" 
                  : "text-white opacity-40 group-hover:opacity-80"
              }`}
            >
              Games
            </span>
          </button>

          {/* Status Button */}
          <button
            id="tab-btn-status"
            onClick={() => setActiveTab("STATUS")}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all group relative h-full cursor-pointer"
          >
            <div className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              activeTab === "STATUS" ? "bg-[#00FF41]/20" : "bg-transparent"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeTab === "STATUS" ? "bg-[#00FF41] shadow-[0_0_8px_#00FF41]" : "bg-white/40 group-hover:bg-white"
              }`} />
            </div>
            <span 
              className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-250 ${
                activeTab === "STATUS" 
                  ? "text-[#00FF41]" 
                  : "text-white opacity-40 group-hover:opacity-80"
              }`}
            >
              Status
            </span>
          </button>

          {/* Record Button */}
          <button
            id="tab-btn-record"
            onClick={() => setActiveTab("RECORD")}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all group relative h-full cursor-pointer"
          >
            <div className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              activeTab === "RECORD" ? "bg-[#00FF41]/20" : "bg-transparent"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeTab === "RECORD" ? "bg-[#00FF41] shadow-[0_0_8px_#00FF41]" : "bg-white/40 group-hover:bg-white"
              }`} />
            </div>
            <span 
              className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-250 ${
                activeTab === "RECORD" 
                  ? "text-[#00FF41]" 
                  : "text-white opacity-40 group-hover:opacity-80"
              }`}
            >
              Record
            </span>
          </button>

          {/* NFL Button */}
          <button
            id="tab-btn-nfl"
            onClick={() => setActiveTab("NFL")}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all group relative h-full cursor-pointer"
          >
            <div className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              activeTab === "NFL" ? "bg-[#00FF41]/20" : "bg-transparent"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeTab === "NFL" ? "bg-[#00FF41] shadow-[0_0_8px_#00FF41]" : "bg-white/40 group-hover:bg-white"
              }`} />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-250 ${
                activeTab === "NFL"
                  ? "text-[#00FF41]"
                  : "text-white opacity-40 group-hover:opacity-80"
              }`}
            >
              NFL
            </span>
          </button>

          {/* CFB Button */}
          <button
            id="tab-btn-cfb"
            onClick={() => setActiveTab("CFB")}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all group relative h-full cursor-pointer"
          >
            <div className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              activeTab === "CFB" ? "bg-[#00FF41]/20" : "bg-transparent"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeTab === "CFB" ? "bg-[#00FF41] shadow-[0_0_8px_#00FF41]" : "bg-white/40 group-hover:bg-white"
              }`} />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-250 ${
                activeTab === "CFB"
                  ? "text-[#00FF41]"
                  : "text-white opacity-40 group-hover:opacity-80"
              }`}
            >
              CFB
            </span>
          </button>

          {/* Tennis Button */}
          <button
            id="tab-btn-tennis"
            onClick={() => setActiveTab("TENNIS")}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all group relative h-full cursor-pointer"
          >
            <div className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              activeTab === "TENNIS" ? "bg-[#00FF41]/20" : "bg-transparent"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeTab === "TENNIS" ? "bg-[#00FF41] shadow-[0_0_8px_#00FF41]" : "bg-white/40 group-hover:bg-white"
              }`} />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-250 ${
                activeTab === "TENNIS"
                  ? "text-[#00FF41]"
                  : "text-white opacity-40 group-hover:opacity-80"
              }`}
            >
              Tennis
            </span>
          </button>
        </nav>

      </div>
    </div>
  );
}
