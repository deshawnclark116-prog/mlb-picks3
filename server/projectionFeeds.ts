/**
 * Read-only scientific projection bridge for the actual React app.
 * These are separately verified RESEARCH feeds, never legacy picks,
 * never a sportsbook line, and never silently substituted for a missing feed.
 */
import type { Request, Response } from "express";

export type ProjectionSport = "cfb" | "nhl";
const NO_STORE = "no-cache, no-store, must-revalidate";
const SOURCES: Record<ProjectionSport, string> = {
  cfb: "https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/feature/cfb-projections-frontend-bridge/docs/cfb_player_stat_projections.json",
  nhl: "https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/feature/nhl-model-projections-site/docs/nhl_v2_shadow.json",
};
const finite = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const fail = (what: string): never => { throw new Error("PROJECTION_CONTRACT_REJECTED: " + what); };
const obj = (x: unknown): x is Record<string, any> => x !== null && typeof x === "object" && !Array.isArray(x);

export function validateCfb(input: unknown): Record<string, any> {
  const x: any = input;
  if (!obj(x) || x.schema !== "cfb-player-stat-projections-research-v1"
    || x.research_only !== true || x.is_live_predictions_feed !== false
    || x.official_new_betting_picks !== 0 || x.backfilled_forecasts !== 0
    || !Array.isArray(x.forecasts) || x.forecast_count !== x.forecasts.length
    || !Number.isInteger(x.original_run_id) || !x.original_baseline_sha256
    || !x.original_monte_carlo_sha256) fail("CFB source or status");
  if (x.forecasts.length === 0 || x.forecasts.length > 100000) fail("CFB source row count");
  const seen = new Set<string>();
  let mcRows = 0;
  for (const r of x.forecasts) {
    if (!obj(r) || !["rushing_yards","passing_touchdowns","anytime_touchdowns"].includes(r.market)
      || typeof r.player !== "string" || !r.player || !r.team || !r.opponent || !r.game_id
      || !r.player_id || r.presentation_status !== "PREGAME_RESEARCH_ONLY"
      || !obj(r.baseline) || r.baseline.kind !== "three_game_average_NOT_trained_model"
      || !finite(r.baseline.mean) || !finite(r.baseline.median)
      || !Array.isArray(r.baseline.last_three) || r.baseline.last_three.length !== 3
      || r.baseline.last_three.some((n: unknown) => !finite(n) || n < 0)
      || !Number.isFinite(Date.parse(r.kickoff_utc))) fail("CFB forecast row");
    const id = [r.game_id,r.player_id,r.market].join("|");
    if (seen.has(id)) fail("CFB duplicate identity");
    seen.add(id);
    if (r.monte_carlo !== null) {
      if (!obj(r.monte_carlo) || r.market !== "rushing_yards"
        || r.monte_carlo.kind !== "uncalibrated_empirical_distribution_research_only"
        || !finite(r.monte_carlo.mean) || !finite(r.monte_carlo.median)
        || !finite(r.monte_carlo.p10) || !finite(r.monte_carlo.p90)
        || r.monte_carlo.p10 > r.monte_carlo.median || r.monte_carlo.median > r.monte_carlo.p90
        || !Number.isInteger(r.monte_carlo.n_simulations) || r.monte_carlo.n_simulations < 100) fail("CFB MC row");
      mcRows++;
    }
  }
  if (mcRows !== x.monte_carlo_count) fail("CFB MC row count");
  return x;
}

export function validateNhl(input: unknown): Record<string, any> {
  const x: any = input;
  if (!obj(x) || x.schema !== "nhl-v2-sog-nfl-style-shadow-v1"
    || x.status !== "RESEARCH_ONLY_NOT_VALIDATED_FOR_BETTING"
    || x.verified_original_hash_chain !== true || x.verified_frozen_code_and_model_lock !== true
    || x.dressed_lineups_verified !== false || x.actual_player_book_lines_verified !== false
    || x.historical_corrected_probabilities_were_not_published_pregame !== true
    || !Array.isArray(x.row_fields) || !Array.isArray(x.horizons)
    || !obj(x.forecasts) || !Array.isArray(x.dates)) fail("NHL source or status");
  const need = ["game_id","player","team","game_date","mean","median","sd","p10","p25","p75","p90",
    "p0","p_ge1","p_ge2","p_ge3","p_ge4","p_ge5"];
  if (new Set(x.row_fields).size !== x.row_fields.length || need.some(k => !x.row_fields.includes(k)))
    fail("NHL row-field mapping");
  const idx = Object.fromEntries(x.row_fields.map((k: string,i: number) => [k,i]));
  let count = 0;
  for (const hz of x.horizons) {
    if (!["T24H","T90","T30"].includes(hz) || !Array.isArray(x.forecasts[hz])) fail("NHL horizon");
    const seen = new Set<string>();
    for (const row of x.forecasts[hz]) {
      count++;
      if (!Array.isArray(row) || row.length !== x.row_fields.length
        || typeof row[idx.player] !== "string" || !row[idx.player]
        || !row[idx.game_id] || !row[idx.team] || !row[idx.game_date]
        || need.slice(4).some(k => !finite(row[idx[k]]))) fail("NHL forecast row");
      if (row[idx.mean] < 0 || row[idx.sd] < 0
        || row[idx.p10] > row[idx.p25] || row[idx.p25] > row[idx.median]
        || row[idx.median] > row[idx.p75] || row[idx.p75] > row[idx.p90]) fail("NHL quantiles");
      const probs = ["p0","p_ge1","p_ge2","p_ge3","p_ge4","p_ge5"].map(k => row[idx[k]]);
      if (probs.some(p => p < 0 || p > 1)
        || probs[1] > 1 - probs[0] + 0.002
        || probs.slice(2).some((p,i) => p > probs[i+1] + 0.002)) fail("NHL survival probabilities");
      const id = [row[idx.game_id],row[idx.player],row[idx.team],row[idx.game_date]].join("|");
      if (seen.has(id)) fail("NHL duplicate player/game identity within horizon");
      seen.add(id);
    }
  }
  if (count !== x.total_valid_forecasts || count > 150000) fail("NHL source row count");
  return x;
}

export async function loadProjectionFeed(sport: ProjectionSport, fetcher: typeof fetch = fetch, now = Date.now()) {
  const url = SOURCES[sport];
  if (!url) fail("Unsupported sport");
  const response = await fetcher(url + "?t=" + now, {
    cache: "no-store", signal: AbortSignal.timeout(20000),
    headers: { Accept: "application/json", "Cache-Control": NO_STORE },
  });
  if (!response.ok) throw new Error("Research publication artifact unavailable (HTTP " + response.status + ")");
  const body: unknown = await response.json();
  return sport === "cfb" ? validateCfb(body) : validateNhl(body);
}

export function projectionFeedHandler(fetcher: typeof fetch = fetch, clock = Date.now) {
  return async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", NO_STORE);
    const sport = req.params.sport?.toLowerCase();
    if (sport !== "cfb" && sport !== "nhl") {
      return res.status(404).json({ error: "No certified projection source for this sport" });
    }
    try {
      const result = await loadProjectionFeed(sport, fetcher, clock());
      res.setHeader("X-Projection-Classification", "research-only");
      res.setHeader("X-Projection-Retrieved-At", new Date(clock()).toISOString());
      return res.json(result);
    } catch (error) {
      return res.status(503).json({
        error: sport.toUpperCase() + " research projections unavailable or rejected",
        details: error instanceof Error ? error.message : String(error),
        no_legacy_fallback: true,
      });
    }
  };
}
