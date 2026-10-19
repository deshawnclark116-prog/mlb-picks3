/** NBA V1 opening-week previews: source-frozen team RESEARCH, never betting picks. */
import type { Request, Response } from "express";
const SOURCE = "https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks3/main/docs/nba_v1_opening_week_research.json";
const NO_STORE = "no-cache, no-store, must-revalidate";

export interface NbaResearchForecast {
  game_id: string;
  tipoff_utc: string;
  home: string; away: string;
  home_id: string; away_id: string;
  home_win_probability: number; away_win_probability: number;
  projected_home_score_mean: number; projected_away_score_mean: number;
  projected_game_total_mean: number;
  raw_previous_season_home_win_prob: number;
  prior_season_team_games: Record<string, number>;
  role_availability_verified: false;
  betting_line_available: false;
  wager_recommendation: false;
  source: string;
  offseason_scenario: string;
}
export interface NbaResearchDocument {
  schema: "NBA_V1_2026_OPENING_ROSTER_BLIND_RESEARCH_V1";
  generated_at_utc: string;
  historical_source_sha256: string;
  historical_completed_regular_games: number;
  projected_games: number;
  role_and_lineup_verification: "MISSING_DO_NOT_BET";
  official_wagers: 0;
  player_markets_official: 0;
  forecasts: NbaResearchForecast[];
}
const object = (x: unknown): x is Record<string, any> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const finite = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);
function invalid(message: string): never {
  throw new Error("NBA_V1_SOURCE_REJECTED: " + message);
}
export function validateNbaResearch(input: unknown): NbaResearchDocument {
  if (!object(input)) invalid("not a document");
  const doc = input as Record<string,any>;
  if (doc.schema !== "NBA_V1_2026_OPENING_ROSTER_BLIND_RESEARCH_V1"
    || doc.historical_completed_regular_games !== 1230
    || typeof doc.historical_source_sha256 !== "string"
    || !/^[0-9a-f]{64}$/i.test(doc.historical_source_sha256)
    || doc.role_and_lineup_verification !== "MISSING_DO_NOT_BET"
    || doc.official_wagers !== 0 || doc.player_markets_official !== 0
    || !Array.isArray(doc.forecasts)
    || doc.forecasts.length < 1 || doc.forecasts.length > 60
    || doc.projected_games !== doc.forecasts.length) invalid("metadata/uncertified status");
  const generated = Date.parse(doc.generated_at_utc);
  if (!Number.isFinite(generated)) invalid("timestamp");
  const ids = new Set<string>();
  for (const r of doc.forecasts) {
    if (!object(r) || !/^\d+$/.test(r.game_id)
      || typeof r.home !== "string" || !r.home.trim()
      || typeof r.away !== "string" || !r.away.trim()
      || r.home === r.away || !/^\d+$/.test(String(r.home_id || ""))
      || !/^\d+$/.test(String(r.away_id || ""))
      || r.home_id === r.away_id) invalid("fixture identity");
    if (ids.has(r.game_id)) invalid("duplicate fixture");
    ids.add(r.game_id);
    const start = Date.parse(r.tipoff_utc);
    if (!Number.isFinite(start) || start <= generated) invalid("post-start/synthetic fixture");
    const probs = [r.home_win_probability, r.away_win_probability,
      r.raw_previous_season_home_win_prob];
    if (probs.some(p => !finite(p) || p < 0 || p > 1)
      || Math.abs(r.home_win_probability + r.away_win_probability - 1) > .00011)
      invalid("probability contract");
    const scores = [r.projected_home_score_mean,r.projected_away_score_mean,
      r.projected_game_total_mean];
    if (scores.some(p => !finite(p) || p < 50 || p > 400)
      || Math.abs(r.projected_home_score_mean + r.projected_away_score_mean
        - r.projected_game_total_mean) > .11) invalid("numeric projected scores");
    if (!object(r.prior_season_team_games)
      || r.prior_season_team_games[r.home] !== 82
      || r.prior_season_team_games[r.away] !== 82) invalid("historical coverage");
    if (r.role_availability_verified !== false
      || r.betting_line_available !== false
      || r.wager_recommendation !== false
      || r.offseason_scenario !== "UNVERIFIED_ROSTER_AND_MINUTES_RESEARCH_ONLY"
      || typeof r.source !== "string"
      || !r.source.includes("ESPN")) invalid("model promoted without roster/price");
  }
  return input as NbaResearchDocument;
}
export async function loadNbaResearch(fetcher: typeof fetch = fetch, now = Date.now()) {
  const response = await fetcher(SOURCE + "?t=" + now, {
    cache: "no-store", signal: AbortSignal.timeout(18000),
    headers: {Accept:"application/json", "Cache-Control":NO_STORE}
  });
  if (!response.ok) throw new Error("NBA original research unavailable HTTP " + response.status);
  return validateNbaResearch(await response.json());
}
export function nbaResearchHandler(fetcher: typeof fetch = fetch, clock = Date.now) {
  return async (_req: Request, res: Response) => {
    res.setHeader("Cache-Control",NO_STORE);
    try {
      const research = await loadNbaResearch(fetcher, clock());
      res.setHeader("X-Projection-Classification","research-only-roster-unverified");
      return res.json(research);
    } catch (error) {
      return res.status(503).json({
        error:"NBA V1 verified opening-week source unavailable",
        details:error instanceof Error ? error.message : String(error),
        no_legacy_or_odds_fallback:true,
        official_wagers:0
      });
    }
  };
}
