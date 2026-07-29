import express from "express";
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

  // Helper to fetch from upstream API with retries and timeout
  const fetchUpstream = async (endpoint: string, maxRetries = 2) => {
    const targetUrl = `https://prop-edge-api.onrender.com${endpoint}?t=${Date.now()}`;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
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
        return data;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Proxy Server] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${endpoint}:`, err?.message || err);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    }
    throw lastError || new Error(`Failed to fetch ${endpoint} from upstream API`);
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
