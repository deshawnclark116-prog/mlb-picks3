/** Read-only presentation of the published NFL Phase 1 schema. */
export type Horizon = 'T24' | 'T90';
export const HORIZONS: Horizon[] = ['T90', 'T24'];
export const PHASE1_URL = 'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nfl_phase1_shadow.json';
export const OUTCOMES: Record<string, string> = {
  rush_yds: 'Rushing yards', rec_yds: 'Receiving yards', pass_yds: 'Passing yards', rec: 'Receptions',
  pass_td: 'Passing TDs', int: 'Interceptions thrown', rush_td: 'Rushing TDs', rec_td: 'Receiving TDs',
  atd: 'Anytime TD', tackles: 'Tackles', sacks: 'Sacks', def_int: 'Defensive interceptions',
};
export interface Alt65 { milestone: number; probability: number; method: 'quantile_grid_99_conservative' | 'empirical_cdf_lattice' }
export interface ForecastRow {
  game_id: string; player: string; team: string; opp: string; pos: string; outcome: string; id: string;
  mean: number | null; median: number | null; sd?: number | null; p10?: number | null; p25?: number | null;
  p75?: number | null; p90?: number | null; p_active?: number | null; exp_opp?: number | null;
  role_share?: number | null; p0?: number | null; p_ge1?: number | null; unc?: number | null;
  unc_reasons?: string[]; quantile_grid_99?: number[]; cdf_lattice?: { step: number; cdf: number[] };
}
export interface ForecastGame {
  game_id: string; away: string; home: string; kickoff_utc: string;
  horizons: Partial<Record<Horizon, { cutoff: string; model_version: string; n_records: number; n_draws?: number }>>;
}
export interface Phase1Artifact {
  schema: string; row_fields: string[]; default_horizon: Horizon | null;
  forecasts: Record<Horizon, unknown[][]>; games: ForecastGame[];
  status: { season: number | null; week: number | null; r11: string; last_shadow_run_utc: string;
    last_provider_retrieval_utc?: string; reference_clock_utc?: string; model_versions: string[];
    counts: Record<Horizon, { valid_games: number; [key: string]: unknown }>; [key: string]: unknown };
  alt_65?: Record<string, Alt65 | null>; empty_message?: string; [key: string]: unknown;
}
export interface Phase1View {
  artifact: Phase1Artifact; rows: Record<Horizon, ForecastRow[]>; games: ForecastGame[];
  defaultHorizon: Horizon; excludedGames: number; publicationMs: number;
}
const object = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object' && !Array.isArray(x);
const requiredText = ['game_id', 'player', 'team', 'opp', 'pos', 'outcome', 'id'];
const numbers = ['mean', 'median', 'sd', 'p10', 'p25', 'p75', 'p90', 'p_active', 'exp_opp', 'role_share', 'p0', 'p_ge1', 'unc'];
const probabilities = ['p_active', 'role_share', 'p0', 'p_ge1'];
function invalid(message: string): never { throw new Error(`Invalid NFL Phase 1 artifact: ${message}`); }
export function etDate(iso: string | number | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}
export function formatET(iso?: string | null): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return 'Unavailable';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(iso));
}
export function decodeRows(fields: string[], rows: unknown[][]): ForecastRow[] {
  if (!Array.isArray(fields) || fields.some(f => typeof f !== 'string') || new Set(fields).size !== fields.length) invalid('row_fields must be unique names');
  if (![...requiredText, 'mean', 'median'].every(f => fields.includes(f))) invalid('missing required row_fields');
  return rows.map(row => {
    if (!Array.isArray(row) || row.length !== fields.length) invalid('compact row length does not match row_fields');
    const decoded = Object.fromEntries(fields.map((field, i) => [field, row[i]]));
    if (requiredText.some(f => typeof decoded[f] !== 'string' || (!['player', 'pos'].includes(f) && !decoded[f]))) invalid('missing row identity');
    for (const f of numbers) if (decoded[f] != null && (typeof decoded[f] !== 'number' || !Number.isFinite(decoded[f]))) invalid(`invalid ${f}`);
    for (const f of probabilities) if (typeof decoded[f] === 'number' && (decoded[f] < 0 || decoded[f] > 1)) invalid(`invalid probability ${f}`);
    if (decoded.unc_reasons != null && (!Array.isArray(decoded.unc_reasons) || decoded.unc_reasons.some((x: unknown) => typeof x !== 'string'))) invalid('invalid uncertainty reasons');
    return decoded as unknown as ForecastRow;
  });
}
export function parsePhase1(raw: unknown, now = new Date()): Phase1View {
  if (!object(raw) || raw.schema !== 'nfl-new-engine-shadow-v1') invalid('expected shadow schema, legacy picks are unsupported');
  if (!object(raw.status) || !object(raw.forecasts) || !Array.isArray(raw.games)) invalid('missing status/forecasts/games');
  const status = raw.status;
  if (typeof status.r11 !== 'string' || !Array.isArray(status.model_versions) || status.model_versions.some((v: unknown) => typeof v !== 'string') || !object(status.counts)) invalid('invalid status metadata');
  const publicationMs = Date.parse(status.last_shadow_run_utc);
  if (!Number.isFinite(publicationMs)) invalid('missing shadow publication/run timestamp');
  if (now.getTime() - publicationMs > 36 * 3600_000) throw new Error('Stale NFL Phase 1 artifact: shadow publication/run is more than 36 hours old. Refresh required.');
  if (publicationMs - now.getTime() > 10 * 60_000) invalid('publication/run timestamp is in the future');
  const allGames = new Map<string, ForecastGame>();
  for (const game of raw.games) {
    if (!object(game) || typeof game.game_id !== 'string' || typeof game.away !== 'string' || !game.away || typeof game.home !== 'string' || !game.home || !Number.isFinite(Date.parse(game.kickoff_utc)) || !object(game.horizons)) invalid('invalid game metadata');
    if (allGames.has(game.game_id)) invalid('duplicate game ID');
    const prefix = `${status.season}_${String(status.week).padStart(2, '0')}_`;
    if (!game.game_id.startsWith(prefix) || game.game_id !== `${prefix}${game.away}_${game.home}`) invalid('game is outside published season/week or has mismatched teams');
    allGames.set(game.game_id, game as ForecastGame);
  }
  const today = etDate(now);
  const games = [...allGames.values()].filter(g => etDate(g.kickoff_utc) >= today);
  const eligible = new Set(games.map(g => g.game_id));
  const rows = {} as Record<Horizon, ForecastRow[]>;
  let totalRows = 0;
  for (const horizon of HORIZONS) {
    if (!Array.isArray(raw.forecasts[horizon])) invalid(`missing ${horizon} array`);
    const decoded = decodeRows(raw.row_fields, raw.forecasts[horizon]);
    const ids = new Set<string>(), counts = new Map<string, number>();
    for (const row of decoded) {
      const game = allGames.get(row.game_id), meta = game?.horizons[horizon];
      if (!game || !meta || !Number.isFinite(Date.parse(meta.cutoff)) || Date.parse(meta.cutoff) > Date.parse(game.kickoff_utc) || typeof meta.model_version !== 'string' || !meta.model_version) invalid('row has no valid game/horizon metadata');
      if (!([game.away, game.home].includes(row.team)) || !([game.away, game.home].includes(row.opp)) || row.team === row.opp) invalid('row teams do not match the game');
      if (ids.has(row.id)) invalid(`duplicate ${horizon} forecast ID`);
      ids.add(row.id); counts.set(row.game_id, (counts.get(row.game_id) || 0)+1);
    }
    if (!object(status.counts[horizon]) || status.counts[horizon].valid_games !== counts.size) invalid(`${horizon} game count mismatch`);
    for (const [id, count] of counts) if (allGames.get(id)!.horizons[horizon]!.n_records !== count) invalid(`${horizon} row count mismatch`);
    rows[horizon] = decoded.filter(r => eligible.has(r.game_id));
    totalRows += decoded.length;
  }
  if (totalRows && !HORIZONS.some(h => rows[h].length)) throw new Error('Stale NFL Phase 1 artifact: all published games are from an earlier date. Refresh required.');
  if (raw.default_horizon != null && !HORIZONS.includes(raw.default_horizon)) invalid('invalid default horizon');
  if (raw.alt_65 != null) {
    if (!object(raw.alt_65)) invalid('invalid alt_65 map');
    for (const alt of Object.values(raw.alt_65)) if (alt != null && (!object(alt) || !Number.isInteger(alt.milestone) || alt.milestone < 1 || typeof alt.probability !== 'number' || !Number.isFinite(alt.probability) || alt.probability < .65 || alt.probability > 1 || !['quantile_grid_99_conservative', 'empirical_cdf_lattice'].includes(alt.method))) invalid('invalid published 65% alt');
  }
  const preferred = raw.default_horizon as Horizon | null;
  const defaultHorizon = preferred && rows[preferred].length ? preferred : rows.T90.length ? 'T90' : 'T24';
  return { artifact: raw as Phase1Artifact, rows, games, defaultHorizon, excludedGames: allGames.size-games.length, publicationMs };
}
export function groupGames(view: Phase1View, horizon: Horizon) {
  return view.games.map(game => ({ ...game, rows: view.rows[horizon].filter(r => r.game_id === game.game_id) }))
    .filter(g => g.rows.length).sort((a, b) => Date.parse(a.kickoff_utc)-Date.parse(b.kickoff_utc) || a.game_id.localeCompare(b.game_id));
}
function validGrid(values: unknown, size?: number, probabilities = false): values is number[] {
  return Array.isArray(values) && values.length > 0 && (size == null || values.length === size)
    && values.every((v, i) => typeof v === 'number' && Number.isFinite(v) && (!i || v >= values[i-1]) && (!probabilities || (v >= 0 && v <= 1)));
}
/** Exact port of PR #62, commit 30fde211..., nfl_phase1_publisher.alt_65.
 * Never infer a distribution from the compact mean/median/percentiles. */
export function deriveAlt65(record: { outcome: string; quantile_grid_99?: unknown; cdf_lattice?: unknown }): Alt65 | null {
  const oc = record.outcome;
  if (['rush_yds', 'rec_yds', 'pass_yds'].includes(oc)) {
    const q = record.quantile_grid_99;
    if (!validGrid(q, 99)) return null;
    const [start, step] = oc === 'pass_yds' ? [100, 25] : [10, 10];
    let best: Alt65 | null = null;
    for (let m = start; m <= Math.floor(q[34]/step)*step; m += step) {
      const first = q.findIndex(x => x >= m);
      const probability = first < 0 ? 0 : (99-first)/100;
      if (probability < .65) break;
      best = { milestone: m, probability, method: 'quantile_grid_99_conservative' };
    }
    return best;
  }
  if (!(oc in OUTCOMES)) return null;
  const lat = record.cdf_lattice;
  const step = oc === 'sacks' ? .5 : 1;
  if (!object(lat) || lat.step !== step || !validGrid(lat.cdf, undefined, true)) return null;
  const max = Math.floor(lat.cdf.length*step);
  if (!max || 1-lat.cdf[max/step-1] >= .65) return null;
  let best: Alt65 | null = null;
  for (let m = 1; m <= max; m++) {
    const probability = 1-lat.cdf[m/step-1];
    if (probability < .65) break;
    best = { milestone: m, probability, method: 'empirical_cdf_lattice' };
  }
  return best;
}
export function altFor(view: Phase1View, row: ForecastRow): Alt65 | null {
  if (view.artifact.alt_65 && Object.hasOwn(view.artifact.alt_65, row.id)) return view.artifact.alt_65[row.id];
  return deriveAlt65(row);
}
