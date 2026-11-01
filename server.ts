import express from "express";
import { phase1Handler } from "./server/nflPhase1.ts";
import { nflRoleResearchHandler } from "./server/nflRoleResearch.ts";
import { loadCurrentNfl } from "./server/nflCurrent.ts";
import { projectionFeedHandler } from "./server/projectionFeeds.ts";
import { nhlCountResearchHandler } from "./server/nhlCountResearch.ts";
import { nbaResearchHandler } from "./server/nbaResearch.ts";
import { nbaV3ShadowHandler } from "./server/nbaV3Shadow.ts";
import { nbaPlayerResearchHandler } from "./server/nbaPlayerResearch.ts";
import { nbaRollingResearchHandler, nbaRollingGradeHandler } from "./server/nbaRollingResearch.ts";
import { nbaSystemPicksHandler } from "./server/nbaSystemPicks.ts";
import { soccerResearchHandler } from "./server/soccerResearch.ts";
import {soccerForwardStatusHandler} from "./server/soccerForwardStatus.ts";
import {soccerPlayerResearchHandler} from "./server/soccerPlayerResearch.ts";
import {soccerPlayerBoardHandler,parseSoccerPlayerCohort} from "./server/soccerPlayerBoard.ts";
import { upcomingFixturesHandler } from "./server/upcomingFixtures.ts";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  evaluatePitchMatchup,
  getPredictionTensor,
  FEATURED_STARTERS,
  FEATURED_BATTERS
} from "./src/utils/pitchMatchupTensor.ts";
import {
  calculateBullpenExposure,
  TEAM_BULLPENS
} from "./src/utils/bullpenExposureEngine.ts";
import {
  LineupMarkovSimulatorTS,
  DEFAULT_LINEUP_OBPS
} from "./src/utils/lineupMarkovSimulator.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory cache and in-flight request deduping to handle Render cold starts gracefully
  const upstreamCache = new Map<string, any>();
  const inFlightUpstream = new Map<string, Promise<any>>();

  // Helper to fetch from upstream API with retries and timeout
  const fetchUpstream = async (endpoint: string, maxRetries = 3) => {
    if (inFlightUpstream.has(endpoint)) {
      return inFlightUpstream.get(endpoint);
    }

    const task = (async () => {
      let lastError: any = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const targetUrl = `https://prop-edge-api.onrender.com${endpoint}?t=${Date.now()}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout per attempt for Render cold start

          const fetchRes = await fetch(targetUrl, {
            cache: "no-store",
            signal: controller.signal,
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Accept": "application/json",
              "User-Agent": "PropEdgeProxy/1.0"
            }
          });
          clearTimeout(timeout);

          if (!fetchRes.ok) {
            throw new Error(`Upstream status ${fetchRes.status}`);
          }

          const data = await fetchRes.json();
          upstreamCache.set(endpoint, data);
          return data;
        } catch (err: any) {
          lastError = err;
          const isColdStart = String(err?.message || "").includes("502") ||
                              String(err?.message || "").includes("503") ||
                              String(err?.message || "").includes("504") ||
                              String(err?.name || "").includes("AbortError");
          if (attempt < maxRetries) {
            // Progressive backoff: allow Render cold start container to finish booting
            const delay = isColdStart ? (attempt + 1) * 2000 : 1200;
            await new Promise((r) => setTimeout(r, delay));
          } else {
            console.warn(`[Proxy Server] All attempts failed for ${endpoint}:`, err?.message || err);
          }
        }
      }

      // If upstream failed on cold start or temporary downtime, return cached data if available
      if (upstreamCache.has(endpoint)) {
        console.info(`[Proxy Server] Serving cached data for ${endpoint} during upstream downtime`);
        return upstreamCache.get(endpoint);
      }

      throw lastError || new Error(`Failed to fetch ${endpoint} from upstream API`);
    })();

    inFlightUpstream.set(endpoint, task);
    try {
      return await task;
    } finally {
      inFlightUpstream.delete(endpoint);
    }
  };

  // API Route - Pitch Matchup Tensor Diagnostic Generator
  app.get("/api/pitch-matchup", (req, res) => {
    try {
      const hitter = (req.query.hitter as string) || "Aaron Judge";
      const pitcher = (req.query.pitcher as string) || "Spencer Strider";

      const tensorData = getPredictionTensor(hitter, pitcher);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(tensorData);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to evaluate pitch matchup", details: err.message });
    }
  });

  app.post("/api/pitch-matchup", (req, res) => {
    try {
      const { hitter, pitcher, pitcherArsenal, batterRv100 } = req.body;
      if (!hitter || !pitcher) {
        return res.status(400).json({ error: "hitter and pitcher names are required" });
      }

      const arsenal = pitcherArsenal || FEATURED_STARTERS[pitcher] || { FF: 0.50, SL: 0.35, CH: 0.15 };
      const rv100 = batterRv100 || FEATURED_BATTERS[hitter] || { FF: 1.5, SI: 1.0, SL: -0.8, CU: 0.5, CH: 0.0 };

      const result = evaluatePitchMatchup(hitter, pitcher, arsenal, rv100);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to process custom pitch tensor simulation", details: err.message });
    }
  });

  // API Route - Phase 2 Probabilistic Bullpen Exposure Engine
  app.get("/api/bullpen-exposure", (req, res) => {
    try {
      const hitter = (req.query.hitter as string) || "Aaron Judge";
      const hitterHand = ((req.query.hand as string)?.toUpperCase() === "L" ? "L" : "R") as "R" | "L";
      const starter = (req.query.starter as string) || "Spencer Strider";
      const starterBf = parseFloat(req.query.bf as string) || 22.0;
      const team = (req.query.team as string)?.toUpperCase() || "NYY";

      const rv100 = FEATURED_BATTERS[hitter] || { FF: 2.45, SI: 1.8, SL: -1.2, CH: 0.1 };
      const arsenal = FEATURED_STARTERS[starter] || { FF: 0.58, SL: 0.35, CH: 0.07 };
      const bullpen = TEAM_BULLPENS[team] || TEAM_BULLPENS["NYY"];

      const exposureResult = calculateBullpenExposure(
        hitter,
        hitterHand,
        rv100,
        starter,
        starterBf,
        arsenal,
        bullpen
      );

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(exposureResult);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to calculate bullpen exposure", details: err.message });
    }
  });

  // API Route - Generative 9-Man Lineup Markov Simulator
  app.get("/api/lineup-markov", (req, res) => {
    try {
      const team = (req.query.team as string)?.toUpperCase() || "NYY";
      const isHome = req.query.home === "true" || req.query.home === "1";
      const starterBf = parseFloat(req.query.bf as string) || 22.0;
      const bullpenObp = parseFloat(req.query.bullpen_obp as string) || 0.310;
      const numSims = parseInt(req.query.sims as string, 10) || 25000;

      const lineupObps = DEFAULT_LINEUP_OBPS[team] || DEFAULT_LINEUP_OBPS["NYY"];
      const sim = new LineupMarkovSimulatorTS(lineupObps, isHome, starterBf, bullpenObp);
      const summary = sim.calculatePaDistributions(numSims);

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to run Lineup Markov simulation", details: err.message });
    }
  });

  // Current independent pregame role evidence, published as-of with the
  // existing NFL numerical forecast. Never substitute stale or missing
  // role snapshots with a HIGH workload stability badge.
  app.get("/api/nfl-role-snapshot",async(_req,res)=>{
    try{
      const url="https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nfl_role_snapshot.json";
      const upstream=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(12000)});
      if(!upstream.ok)throw new Error("Role snapshot unavailable");
      const doc=await upstream.json();
      if(!doc||doc.schema!=="nfl-role-evidence-coverage-v1"||
         doc.status!=="PREGAME_RESEARCH_ROLE_SNAPSHOT"||
         !Array.isArray(doc.player_market_evidence))throw new Error("Role snapshot invalid");
      res.setHeader("Cache-Control","no-store, max-age=0");
      res.json(doc);
    }catch{
      res.setHeader("Cache-Control","no-store, max-age=0");
      res.json({status:"ROLE_EVIDENCE_UNAVAILABLE",player_market_evidence:[]});
    }
  });

  // Only the exact scheduled game may request live bookmaker availability.
  // The backend owns the bookmaker credentials and the 15-minute quota cache.
  app.get("/api/nfl-live-markets", async (req,res)=>{
    const home=typeof req.query.home==='string'?req.query.home.toUpperCase():'';
    const away=typeof req.query.away==='string'?req.query.away.toUpperCase():'';
    if(!/^[A-Z]{2,3}$/.test(home)||!/^[A-Z]{2,3}$/.test(away)||home===away)
      return res.status(400).json({status:'INVALID_MATCHUP',lines:[]});
    try{
      const params=new URLSearchParams({home,away});
      const url='https://prop-edge-api.onrender.com/nfl/live-markets?'+params.toString();
      const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(16000)});
      if(!response.ok)throw new Error('NFL quote source HTTP '+response.status);
      const payload=await response.json();
      res.setHeader('Cache-Control','no-store, max-age=0');
      return res.json(payload);
    }catch(e){
      res.setHeader('Cache-Control','no-store, max-age=0');
      return res.json({status:'ODDS_PROVIDER_UNAVAILABLE',lines:[]});
    }
  });

  // API Route - Proxy Predictions (enriched with pitch_tensor)
  app.get("/api/predictions", async (req, res) => {
    try {
      const data = await fetchUpstream("/predictions");
      if (Array.isArray(data)) {
        const enriched = data.map((pred: any) => {
          if (!pred.pitch_tensor && pred.player) {
            pred.pitch_tensor = getPredictionTensor(pred.player, pred.opposing_pitcher);
          }
          return pred;
        });
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.json(enriched);
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy Server] Error fetching predictions:", error);
      res.status(502).json({ error: "Failed to fetch predictions from upstream API", details: error.message });
    }
  });

  // Read-only new-engine feed; never falls back to the legacy Render route.
  app.get("/api/nfl-phase1-predictions", phase1Handler());

  // Updated NFL role-adjusted projections belong on the picks3 app.
  // Kept separate from immutable T24/T90 numbers and legacy selections.
  app.get("/api/nfl-role-research", nflRoleResearchHandler());
  app.get("/api/nhl-count-research", nhlCountResearchHandler());

  // Frozen 2026 opening-week team research from picks3; never proxy nonexistent Render NBA route.
  app.get("/api/nba-research", nbaResearchHandler());
  // First-seen NBA V2 played-player statistical research, NOT sports betting.
  app.get("/api/nba-player-research", nbaPlayerResearchHandler());
  // Daily genuine pre-tip NBA V2 originals, never modeled from postgame boxes.
  // Ranked NBA model candidates like NFL SYSTEM PICKS; no fabricated sportsbook bets.
  app.get("/api/nba-system-picks", nbaSystemPicksHandler());
  // Full original NBA V3 Phase1 player outcome distributions; NOT a promoted betting model.
  app.get("/api/nba-v3-shadow", nbaV3ShadowHandler());
  app.get("/api/nba-rolling-research", nbaRollingResearchHandler());
  // Outcome grades for all original NBA rolling player stats, not betting targets.
  app.get("/api/nba-rolling-grades", nbaRollingGradeHandler());

  // Existing PR #30 five-league source-first research only; no bookmaker or player prop claims.
  app.get("/api/soccer-research", soccerResearchHandler());
  app.get("/api/soccer-forward-scorecard", soccerForwardStatusHandler());
  const soccerResearchAllowlist=(process.env.SOCCER_RESEARCH_PLAYER_IDS||'')
    .split(',').map(s=>s.trim()).filter(Boolean);
  const soccerResearchHandler=soccerPlayerResearchHandler({
    key:process.env.STRIKERAPI_API_KEY,
    allowlist:soccerResearchAllowlist,
    maxProviderCallsPerDay:2
  });
  app.get("/api/soccer-player-research",soccerResearchHandler);
  let soccerPilotFixtures:ReturnType<typeof parseSoccerPlayerCohort>=[];
  try{
    soccerPilotFixtures=parseSoccerPlayerCohort(process.env.SOCCER_PLAYER_RESEARCH_COHORT);
  }catch(err){console.error('Soccer player research cohort invalid; player board disabled',err);}
  app.get("/api/soccer-player-board",soccerPlayerBoardHandler({
    cohort:soccerPilotFixtures,
    providerConfigured:!!process.env.STRIKERAPI_API_KEY,
    allowlist:soccerResearchAllowlist,
    researchHandler:soccerResearchHandler
  }));

  // Read-only, independently verified upcoming fixtures for EVERY sport.
  // Not inferred from published picks, no sportsbook request or credit use.
  app.get("/api/upcoming-fixtures/:sport", upcomingFixturesHandler());

  // Verify original research artifacts; never fall back to Render classifiers.
  app.get("/api/model-projections/:sport", projectionFeedHandler());

  // API Route - Proxy NFL Predictions
  app.get("/api/nfl-predictions", async (req, res) => {
    try {
      const {document,origin}=await loadCurrentNfl();
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("X-NFL-Forecast-Source",origin);
      res.json({...document,serving_origin:origin});
    } catch (error: any) {
      console.error("[Proxy Server] Error fetching NFL predictions:", error);
      res.status(502).json({ error: "Failed to fetch NFL predictions from upstream API", details: error.message });
    }
  });

  // API Route - Proxy CFB Predictions
  app.get("/api/cfb-predictions", async (req, res) => {
    try {
      const data = await fetchUpstream("/cfb/predictions");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy Server] Error fetching CFB predictions:", error);
      res.status(502).json({ error: "Failed to fetch CFB predictions from upstream API", details: error.message });
    }
  });

  // API Route - Proxy Tennis Predictions
  app.get("/api/tennis-predictions", async (req, res) => {
    try {
      const data = await fetchUpstream("/tennis/predictions");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy Server] Error fetching tennis predictions:", error);
      res.status(502).json({ error: "Failed to fetch tennis predictions from upstream API", details: error.message });
    }
  });

  // API Route - Proxy NHL Predictions
  app.get("/api/nhl-predictions", async (req, res) => {
    try {
      const data = await fetchUpstream("/nhl/predictions");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy Server] Error fetching NHL predictions:", error);
      res.status(502).json({ error: "Failed to fetch NHL predictions from upstream API", details: error.message });
    }
  });

  // API Route - Proxy Games
  app.get("/api/games", async (req, res) => {
    try {
      const data = await fetchUpstream("/games");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy Server] Error fetching games:", error);
      res.status(502).json({ error: "Failed to fetch games data", details: error.message });
    }
  });

  // API Route - Proxy Health
  app.get("/api/health", async (req, res) => {
    try {
      const data = await fetchUpstream("/health");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy Server] Error fetching health:", error);
      res.status(502).json({ error: "Failed to fetch health data", details: error.message });
    }
  });

  // API Route - Proxy Record
  app.get("/api/record", async (req, res) => {
    try {
      const data = await fetchUpstream("/record");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy Server] Error fetching record:", error);
      res.status(502).json({ error: "Failed to fetch record data", details: error.message });
    }
  });

  // Vite middleware for development or serving built assets for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
