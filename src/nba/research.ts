/** NBA V1 frozen pregame research, deliberately NOT an executable betting feed. */
export const NBA_RESEARCH_SCHEMA = 'NBA_V1_2026_OPENING_ROSTER_BLIND_RESEARCH_V1';

export interface NbaGameResearch {
  game_id: string;
  tipoff_utc: string;
  home: string;
  away: string;
  home_id: string;
  away_id: string;
  home_win_probability: number;
  away_win_probability: number;
  projected_home_score_mean: number;
  projected_away_score_mean: number;
  projected_game_total_mean: number;
  role_availability_verified: false;
  betting_line_available: false;
  wager_recommendation: false;
  offseason_scenario: string;
}

export interface NbaResearchDocument {
  schema: typeof NBA_RESEARCH_SCHEMA;
  generated_at_utc: string;
  historical_source_sha256: string;
  historical_completed_regular_games: 1230;
  projected_games: number;
  upcoming_fixture_ids_from_live_espn: string[];
  forecasts: NbaGameResearch[];
  research_only: true;
  official_wagers: 0;
  player_markets_official: 0;
  role_and_lineup_verification: 'MISSING_DO_NOT_BET';
  no_real_money_staking_or_roi: true;
  warning: string;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const probability = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const positive = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Fail closed: a score/probability artifact cannot silently become an official pick. */
export function parseNbaResearch(raw: unknown): NbaResearchDocument {
  if (!isObject(raw) || raw.schema !== NBA_RESEARCH_SCHEMA ||
      raw.research_only !== true || raw.official_wagers !== 0 ||
      raw.player_markets_official !== 0 || raw.no_real_money_staking_or_roi !== true ||
      raw.role_and_lineup_verification !== 'MISSING_DO_NOT_BET' ||
      raw.historical_completed_regular_games !== 1230 ||
      typeof raw.historical_source_sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(raw.historical_source_sha256) ||
      !Array.isArray(raw.forecasts) || !Array.isArray(raw.upcoming_fixture_ids_from_live_espn) ||
      raw.forecasts.length < 1 || raw.forecasts.length > 20 ||
      raw.projected_games !== raw.forecasts.length ||
      typeof raw.warning !== 'string') {
    throw new Error('NBA frozen research source fails certification boundary');
  }
  const frozenAt = Date.parse(String(raw.generated_at_utc));
  if (!Number.isFinite(frozenAt)) throw new Error('Missing NBA original forecast timestamp');
  const fixtures = new Set(raw.upcoming_fixture_ids_from_live_espn);
  const observed = new Set<string>();
  if (fixtures.size !== raw.upcoming_fixture_ids_from_live_espn.length ||
      fixtures.size !== raw.forecasts.length ||
      !raw.upcoming_fixture_ids_from_live_espn.every(id => typeof id === 'string')) {
    throw new Error('NBA fixture identity coverage mismatch');
  }
  for (const row of raw.forecasts) {
    if (!isObject(row) || typeof row.game_id !== 'string' ||
        !fixtures.has(row.game_id) || observed.has(row.game_id) ||
        typeof row.home !== 'string' || !row.home.trim() ||
        typeof row.away !== 'string' || !row.away.trim() ||
        row.home === row.away || typeof row.home_id !== 'string' ||
        typeof row.away_id !== 'string' || row.home_id === row.away_id ||
        !probability(row.home_win_probability) || !probability(row.away_win_probability) ||
        Math.abs(row.home_win_probability + row.away_win_probability - 1) > 0.00011 ||
        !positive(row.projected_home_score_mean) || !positive(row.projected_away_score_mean) ||
        !positive(row.projected_game_total_mean) ||
        Math.abs(row.projected_home_score_mean + row.projected_away_score_mean -
                 row.projected_game_total_mean) > 0.11 ||
        row.role_availability_verified !== false || row.betting_line_available !== false ||
        row.wager_recommendation !== false ||
        row.offseason_scenario !== 'UNVERIFIED_ROSTER_AND_MINUTES_RESEARCH_ONLY') {
      throw new Error('NBA game row cannot be certified as safe research');
    }
    const tip = Date.parse(String(row.tipoff_utc));
    if (!Number.isFinite(tip) || frozenAt >= tip ||
        !['2026-10-20', '2026-10-21'].includes(new Date(tip).toISOString().slice(0, 10))) {
      throw new Error('NBA game was not frozen before its 2026 opening-week tipoff');
    }
    observed.add(row.game_id);
  }
  return raw as unknown as NbaResearchDocument;
}
