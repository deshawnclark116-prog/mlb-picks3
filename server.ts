import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

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

  // API Route - Proxy Predictions
  app.get("/api/predictions", async (req, res) => {
    try {
      const data = await fetchUpstream("/predictions");
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
