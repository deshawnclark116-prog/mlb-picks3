/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NbaGameForecast {
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
  raw_previous_season_home_win_prob?: number;
  prior_season_team_games?: Record<string, number>;
  role_availability_verified: boolean;
  betting_line_available: boolean;
  wager_recommendation: boolean;
  source: string;
  offseason_scenario: string;
}

export interface NbaResearchDoc {
  schema: string;
  generated_at_utc: string;
  historical_source_sha256?: string;
  historical_completed_regular_games?: number;
  historical_date_span?: { from: string; to: string };
  opening_fixture_dates_requested?: string[];
  upcoming_fixture_ids_from_live_espn?: string[];
  projected_games: number;
  forecasts: NbaGameForecast[];
  unknown_team_matchups_excluded?: string[];
  research_only: boolean;
  official_wagers: number;
  player_markets_official: number;
  role_and_lineup_verification: string;
  no_real_money_staking_or_roi: boolean;
  warning?: string;
}
