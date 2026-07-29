/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PitchBreakdownItem {
  pitch_type: string;
  pitch_name: string;
  frequency_pct: number;
  batter_rv100: number;
  weighted_impact: number;
}

export interface PitchTensorData {
  hitter: string;
  pitcher: string;
  raw_matchup_score: number;
  percentile_rank: number;
  percentile_display: string;
  rating: string;
  badge_color: "green" | "emerald" | "gray" | "amber" | "red";
  primary_vulnerability: string;
  primary_advantage: string;
  arsenal_breakdown: PitchBreakdownItem[];
  vulnerability_detail?: {
    pitch_type: string;
    pitch_name: string;
    frequency_pct: number;
    batter_rv100: number;
    summary: string;
  };
  advantage_detail?: {
    pitch_type: string;
    pitch_name: string;
    frequency_pct: number;
    batter_rv100: number;
    summary: string;
  };
}

export interface Prediction {
  player: string;
  team?: string;
  opponent?: string;
  prop_type: string;
  pick: string;
  projected: number;
  model_prob: number;
  prob_pct?: number; // Hit probability percentage, e.g., 64.5 meaning 64.5%
  fair_prob?: number;
  odds?: number;
  value_edge?: number;
  kelly_fraction?: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  generated_at: string;
  outcome?: "WIN" | "LOSS" | "VOID" | "PENDING"; // Graded value outcome
  actual_value?: number; // Actual value recorded during the game
  player_id?: string;
  game_id?: string;
  opposing_pitcher?: string;
  pitch_tensor?: PitchTensorData;
}

export interface Game {
  game_id: string;
  away_team: string;
  home_team: string;
  game_time: string;
  status: string;
}

export interface Health {
  status: string;
  predictions_today?: number;
  games_today?: number;
  last_updated?: string;
  models_loaded?: string[];
  preferred_book?: string;
  propline?: boolean;
  bvp?: boolean;
  server_date_et?: string;
  server_time_et?: string;
}

export interface RecordSummary {
  total: number;
  hits: number;
  misses: number;
  hit_rate: number;
}

export interface BreakdownItem {
  hits: number;
  total: number;
  hit_rate: number;
}

export interface RecordResult {
  date: string;
  player: string;
  prop_type: string;
  pick: string;
  projected: number;
  actual: number;
  result: "hit" | "miss";
  confidence: string;
  value_edge: number;
}

export interface RecordData {
  summary: RecordSummary;
  by_prop: Record<string, BreakdownItem>;
  by_confidence: Record<string, BreakdownItem>;
  results: RecordResult[];
  last_updated: string;
}

