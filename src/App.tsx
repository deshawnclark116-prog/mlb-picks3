/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Prediction, Game, Health, RecordData, CfbPrediction, CfbPredictionsDoc, TennisPrediction, TennisPredictionsDoc, NhlPrediction, NhlPredictionsDoc } from "./types";
import TodayScreen from "./components/TodayScreen";
import GamesScreen from "./components/GamesScreen";
import StatusScreen from "./components/StatusScreen";
import RecordScreen from "./components/RecordScreen";
import NflTodayScreen from "./components/NflTodayScreen";
import CfbTodayScreen from "./components/CfbTodayScreen";
import TennisTodayScreen from "./components/TennisTodayScreen";
import NhlTodayScreen from "./components/NhlTodayScreen";
import NbaResearchScreen from "./components/NbaResearchScreen";
import SoccerTodayScreen from "./components/SoccerTodayScreen";
import UpcomingGamesStrip from "./components/UpcomingGamesStrip";
import type {ScheduleSport} from "../server/upcomingFixtures.ts";
import SportProjectionScreen from "./components/SportProjectionScreen";
import { deduplicatePredictions, deduplicateCfbPredictions, deduplicateTennisPredictions, deduplicateNhlPredictions } from "./utils";
import { Home, Trophy, Activity, Waves, Menu, X, ChevronRight, LayoutGrid, CalendarDays, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type TabType = "TODAY" | "GAMES" | "STATUS" | "RECORD" | "NFL" | "CFB" | "TENNIS" | "NHL" | "NBA" | "SOCCER";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("TODAY");
  const [moreOpen, setMoreOpen] = useState(false);
  const navigateTo = (tab:TabType) => {setMoreOpen(false);setActiveTab(tab);};
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [recordData, setRecordData] = useState<RecordData | null>(null);
  const [cfbPredictions, setCfbPredictions] = useState<CfbPrediction[]>([]);
  const [cfbSeason, setCfbSeason] = useState<number | null>(null);
  const [cfbWeek, setCfbWeek] = useState<number | null>(null);
  const [cfbError, setCfbError] = useState<string | null>(null);
  const [tennisPredictions, setTennisPredictions] = useState<TennisPrediction[]>([]);
  const [tennisError, setTennisError] = useState<string | null>(null);
  const [nhlPredictions, setNhlPredictions] = useState<NhlPrediction[]>([]);
  const [nhlGameDate, setNhlGameDate] = useState<string | null>(null);
  const [nhlError, setNhlError] = useState<string | null>(null);

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

  // NHL plays near-daily (unlike NFL/CFB's weekly cadence), so its doc is
  // keyed on a real calendar game_date instead of season/week -- same
  // one-fetch-per-poll reasoning as NFL/CFB/tennis otherwise.
  const loadNhlData = async () => {
    const doc: NhlPredictionsDoc | null = await fetchEndpoint(`/api/nhl-predictions?t=${Date.now()}`);
    if (doc && Array.isArray(doc.picks)) {
      setNhlPredictions(deduplicateNhlPredictions(doc.picks));
      setNhlGameDate(doc.game_date ?? null);
      setNhlError(null);
    } else {
      setNhlError("Unable to connect to Prop Edge NHL predictions server.");
    }
  };

  useEffect(() => {
    loadWorkspaceData();
    loadCfbData();
    loadTennisData();
    loadNhlData();
    // Poll endpoints every 30 seconds to fetch fresh predictions
    const interval = setInterval(() => {
      loadWorkspaceData();
      loadCfbData();
      loadTennisData();
      loadNhlData();
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
          <NflTodayScreen />
        );
      case "CFB":
        return (
          <SportProjectionScreen sport="cfb" legacy={
            <CfbTodayScreen
              predictions={cfbPredictions}
              season={cfbSeason}
              week={cfbWeek}
              loading={loading}
              error={cfbError}
              onRefresh={loadCfbData}
            />
          }/>
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
      case "NHL":
        return (
          <SportProjectionScreen sport="nhl" legacy={
            <NhlTodayScreen
              predictions={nhlPredictions}
              gameDate={nhlGameDate}
              loading={loading}
              error={nhlError}
              onRefresh={loadNhlData}
            />
          }/>
        );
      case "NBA":
        return <NbaResearchScreen />;
      case "SOCCER":
        return <SoccerTodayScreen />;
      default:
        return null;
    }
  };

  const quickSports: {tab:TabType;label:string}[]=[
    {tab:'TODAY',label:'MLB'}, {tab:'NFL',label:'NFL'},
    {tab:'NBA',label:'NBA'}, {tab:'NHL',label:'NHL'},
    {tab:'CFB',label:'CFB'}, {tab:'TENNIS',label:'Tennis'},
    {tab:'SOCCER',label:'Soccer'}
  ];
  const mainTabs=[
    {tab:'TODAY' as TabType,label:'Home',Icon:Home},
    {tab:'NFL' as TabType,label:'NFL',Icon:Trophy},
    {tab:'NBA' as TabType,label:'NBA',Icon:Activity},
    {tab:'NHL' as TabType,label:'NHL',Icon:Waves},
  ];
  const moreSections=[
    {label:'More sports',items:[
      {tab:'CFB' as TabType,label:'College football',desc:'CFB projections',Icon:Trophy},
      {tab:'TENNIS' as TabType,label:'Tennis',desc:'Match forecasts',Icon:Activity},
      {tab:'SOCCER' as TabType,label:'Soccer',desc:'Match and player models',Icon:LayoutGrid},
      {tab:'GAMES' as TabType,label:'MLB schedule',desc:'Upcoming baseball games',Icon:CalendarDays}
    ]},
    {label:'Your system',items:[
      {tab:'RECORD' as TabType,label:'Model record',desc:'Graded results and history',Icon:BarChart3},
      {tab:'STATUS' as TabType,label:'System health',desc:'Feeds, connections and diagnostics',Icon:Activity}
    ]}
  ];
  const activeLabel:Record<TabType,string>={
    TODAY:'MLB',GAMES:'MLB Games',STATUS:'System health',RECORD:'Model record',
    NFL:'NFL',CFB:'College football',TENNIS:'Tennis',NHL:'NHL',NBA:'NBA',SOCCER:'Soccer'
  };
  return (
    <div id="app-root-shell" className="h-dvh w-full bg-[#070b0d] text-gray-100 font-sans antialiased selection:bg-[#79FF48]/20 selection:text-[#79FF48] md:flex md:items-center md:justify-center">
      <div id="phone-frame-container" className="relative flex h-full w-full min-w-0 flex-col overflow-hidden bg-[#0d1114] md:h-[92vh] md:max-h-[960px] md:max-w-[1050px] md:rounded-[28px] md:border md:border-white/10 md:shadow-[0_30px_100px_#000a]">
        <header id="app-native-header" className="z-20 shrink-0 border-b border-white/10 bg-[#101719]">
          <div className="flex min-h-[58px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#79FF48] text-[#0b170b] shadow-[0_3px_16px_#79FF4825]">
                <BarChart3 size={23} strokeWidth={2.6}/>
              </div>
              <div className="min-w-0">
                <p className="truncate font-black tracking-[-.035em] text-[19px] leading-tight">PROP <span className="text-[#79FF48]">EDGE</span></p>
                <p className="truncate text-[11px] text-gray-400">{activeLabel[activeTab]} · Model projections</p>
              </div>
            </div>
            <button type="button" onClick={()=>setMoreOpen(true)}
              aria-label="Open all sports and settings" className="flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-[12px] font-semibold text-gray-200 active:bg-white/10">
              <LayoutGrid size={17}/> <span>Explore</span>
            </button>
          </div>
          <nav aria-label="Switch sport" className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickSports.map(({tab,label})=><button key={tab} type="button" id={'sport-chip-'+tab.toLowerCase()}
              onClick={()=>navigateTo(tab)} aria-pressed={activeTab===tab}
              className={`min-h-9 shrink-0 rounded-full border px-4 text-[12px] font-bold transition-colors ${activeTab===tab?'border-[#79FF48] bg-[#79FF48] text-[#111a12]':'border-white/10 bg-[#1e2629] text-gray-300 active:bg-[#303b3f]'}`}>
              {label}
            </button>)}
          </nav>
        </header>

        {/* Official independent schedule stays accessible without crowding the page. */}
        {!['STATUS','RECORD','SOCCER'].includes(activeTab)&&<UpcomingGamesStrip
          sport={(activeTab==='TODAY'||activeTab==='GAMES'?'MLB':activeTab) as ScheduleSport}/>}

        <main id="active-screen-container" className="relative min-h-0 flex-1 overflow-hidden bg-[#0c1114]">
          <AnimatePresence mode="wait">
            <motion.div id={`motion-screen-${activeTab}`} key={activeTab}
              initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}}
              transition={{duration:0.14,ease:'easeOut'}} className="absolute inset-0 h-full w-full">
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav id="bottom-tab-navigation" aria-label="Primary navigation"
          className="z-30 flex shrink-0 items-stretch justify-around border-t border-white/10 bg-[#11191b] px-2 pt-1 shadow-[0_-8px_28px_#0004]"
          style={{paddingBottom:'max(env(safe-area-inset-bottom), 6px)'}}>
          {mainTabs.map(({tab,label,Icon})=><button key={tab} id={'tab-btn-'+tab.toLowerCase()}
            type="button" onClick={()=>navigateTo(tab)} aria-current={activeTab===tab?'page':undefined}
            className={`flex min-h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors ${activeTab===tab&&!moreOpen?'text-[#79FF48]':'text-gray-400 active:bg-white/5'}`}>
            <Icon size={21} strokeWidth={activeTab===tab?2.6:1.9}/>
            <span className="text-[11px] font-bold">{label}</span>
          </button>)}
          <button id="tab-btn-more" type="button" onClick={()=>setMoreOpen(v=>!v)}
            aria-expanded={moreOpen} aria-controls="app-more-sheet"
            className={`flex min-h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 ${moreOpen?'text-[#79FF48]':'text-gray-400'}`}>
            <Menu size={21} strokeWidth={moreOpen?2.6:1.9}/>
            <span className="text-[11px] font-bold">More</span>
          </button>
        </nav>

        {moreOpen&&<div id="app-more-overlay" className="absolute inset-0 z-40 flex flex-col justify-end">
          <button type="button" aria-label="Close menu" onClick={()=>setMoreOpen(false)}
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"/>
          <section id="app-more-sheet" role="dialog" aria-modal="true" aria-label="Explore Prop Edge"
            className="relative max-h-[88%] w-full overflow-y-auto rounded-t-[28px] border-t border-white/15 bg-[#172023] px-5 pb-7 pt-4 shadow-[0_-20px_80px_#0008]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20"/>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[23px] font-black tracking-tight">Explore Prop Edge</h2>
                <p className="mt-1 text-[12px] text-gray-400">All your sports and system tools</p>
              </div>
              <button type="button" onClick={()=>setMoreOpen(false)} aria-label="Close explore menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><X size={20}/></button>
            </div>
            {moreSections.map(section=><div key={section.label} className="mb-5">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[.15em] text-gray-400">{section.label}</h3>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1d292c]">
                {section.items.map(({tab,label,desc,Icon},i)=><button type="button" key={tab}
                  id={'tab-btn-'+tab.toLowerCase()} onClick={()=>navigateTo(tab)}
                  className={`flex min-h-[64px] w-full items-center gap-3 px-4 text-left active:bg-white/10 ${i?'border-t border-white/10':''}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#79FF48]/10 text-[#79FF48]"><Icon size={20}/></span>
                  <span className="min-w-0 flex-1"><span className="block text-[14px] font-bold">{label}</span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">{desc}</span></span>
                  <ChevronRight size={17} className="text-gray-500"/>
                </button>)}
              </div>
            </div>)}
            <p className="border-t border-white/10 pt-4 text-[11px] leading-relaxed text-gray-400">
              Projections are statistical estimates, not guarantees. Research probabilities may not be prospectively calibrated. Bet responsibly. 21+
            </p>
          </section>
        </div>}
      </div>
    </div>
  );
}
