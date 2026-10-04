import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { PHASE1_URL, HORIZONS, parsePhase1, groupGames, deriveAlt65, type ForecastGame, type Horizon, type Alt65, type Phase1Artifact } from '../src/nfl/phase1.ts';

const RAW_STATE = 'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/nfl-shadow-state/forecasts/batches/';
const NO_STORE = 'no-cache, no-store, must-revalidate';
type Fetcher = typeof fetch;
type Verified = { record: Record<string, any>; alt: Alt65 | null };
// Only immutable, footer-verified distribution results are cached. The published
// artifact is ALWAYS fetched afresh; cache entries can never add games/rows.
const batches = new Map<string, Promise<Map<string, Verified>>>();
async function upstream(url: string, fetcher: Fetcher, stamp: number) {
  const response = await fetcher(`${url}?t=${stamp}`, { cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { 'Cache-Control': NO_STORE, Pragma: 'no-cache', Accept: 'application/json' } });
  if (!response.ok) throw new Error(`GitHub upstream HTTP ${response.status}: ${url}`);
  return response;
}
export function verifyBatch(text: string, game: ForecastGame, horizon: Horizon): Map<string, Verified> {
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.length < 2) throw new Error('Invalid shadow batch: missing footer');
  const footer = JSON.parse(lines.at(-1)!);
  const header = JSON.parse(lines[0]);
  const body = lines.slice(0, -1).join('\n')+'\n';
  if (footer._footer !== true || createHash('sha256').update(body).digest('hex') !== footer.sha256 || footer.n !== lines.length-2 || footer.n !== game.horizons[horizon]?.n_records) throw new Error('Invalid shadow batch: footer/hash/count failed');
  if (header.game_id !== game.game_id || header.horizon !== horizon || header.adhoc_label) throw new Error('Invalid shadow batch: wrong game/horizon');
  const records = new Map<string, Verified>();
  for (const line of lines.slice(1, -1)) {
    const r = JSON.parse(line);
    if (r.game_id !== game.game_id || r.horizon !== horizon || r.cutoff !== game.horizons[horizon]?.cutoff
      || r.kickoff !== game.kickoff_utc || r.input_snapshots?.time_travel || records.has(r.id)) throw new Error('Invalid shadow batch: forecast identity/cutoff failed');
    const alt = deriveAlt65(r);
    // Retain identity and derived display values, not the large scientific data.
    records.set(r.id, { record: { id: r.id, game_id: r.game_id, player_name: r.player_name, team: r.team,
      opponent: r.opponent, outcome: r.outcome, model_version: r.model_version, mean: r.mean, median: r.median }, alt });
  }
  return records;
}
export async function loadPhase1(fetcher: Fetcher = fetch, now = Date.now(), cache = batches): Promise<Phase1Artifact> {
  const response = await upstream(PHASE1_URL, fetcher, now);
  const raw = await response.json();
  const view = parsePhase1(raw, new Date(now));
  const additions: Record<string, Alt65 | null> = {};
  await Promise.all(HORIZONS.flatMap(horizon => groupGames(view, horizon).map(async game => {
    const missing = game.rows.filter(row => !raw.alt_65 || !Object.hasOwn(raw.alt_65, row.id));
    if (!missing.length) return;
    const season = view.artifact.status.season, week = view.artifact.status.week;
    const url = `${RAW_STATE}${season}_wk${String(week).padStart(2, '0')}_${horizon}_${game.game_id}.jsonl`;
    const key = url+'|'+game.horizons[horizon]!.cutoff;
    if (!cache.has(key)) {
      if (cache.size >= 128) cache.delete(cache.keys().next().value!);
      const promise = upstream(url, fetcher, now).then(r => r.text()).then(text => verifyBatch(text, game, horizon));
      cache.set(key, promise);
      promise.catch(() => cache.delete(key));
    }
    const records = await cache.get(key)!;
    for (const row of missing) {
      const verified = records.get(row.id), r = verified?.record;
      if (!r || r.game_id !== row.game_id || r.player_name !== row.player || r.team !== row.team || r.opponent !== row.opp
        || r.outcome !== row.outcome || r.model_version !== game.horizons[horizon]!.model_version) throw new Error(`Published forecast ID ${row.id} does not match its verified distribution`);
      // Compact moments are rounded to four decimals by the publisher.
      // Matching checks only: these values never enter the alt calculation.
      for (const field of ['mean', 'median'] as const) if (row[field] != null && (typeof r[field] !== 'number' || !Number.isFinite(r[field]) || Math.abs(r[field]-row[field]!) > .000051)) throw new Error(`Published forecast ID ${row.id} has mismatched distribution moments`);
      additions[row.id] = verified!.alt;
    }
  })));
  // Every original field and compact row remains unchanged. Only PR #62's
  // presentation map is added when not yet provided by the main publisher.
  return { ...raw, alt_65: { ...raw.alt_65, ...additions } };
}
export function phase1Handler(fetcher: Fetcher = fetch, clock = Date.now) {
  return async (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', NO_STORE);
    try {
      const doc = await loadPhase1(fetcher, clock());
      res.setHeader('X-Forecast-Retrieved-At', new Date(clock()).toISOString());
      res.json(doc);
    } catch (error) {
      res.status(502).json({ error: 'NFL Phase 1 upstream unavailable or invalid',
        details: error instanceof Error ? error.message : String(error) });
    }
  };
}
