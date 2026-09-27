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

// NFL predictions -- a deliberately separate shape from Prediction (MLB).
// The NFL pipeline is predictions-first with NO odds/kelly_fraction/
// value_edge/fair_prob concept anywhere (see mlb-picks2's api.py
// /nfl/predictions) -- those genuinely require a market price this
// pipeline never has, so this type doesn't carry them at all rather than
// leaving them perpetually undefined. confidence IS included: it's just
// a HIGH/MEDIUM/LOW bucket of model_prob (same conf_from_prob() bucketing
// MLB's Prediction.confidence uses), which needs no odds at all.
export interface NflPrediction {
  market: string; // "rushing_yards" | "receiving_yards" | "sacks"
  prop_type: string; // alias of market, kept for symmetry with MLB's Prediction shape
  player_id?: string;
  player: string;
  team?: string;
  opponent?: string;
  season: number;
  week: number;
  // Real kickoff timestamp (ISO 8601 UTC), same as CfbPrediction's --
  // added so games can be ordered by actual kickoff time instead of by
  // model confidence.
  kickoff_utc?: string;
  // rushing_yards/receiving_yards: absent when no real book line was matched today
  // (see unagraded below) -- there's no line to show or a probability to grade
  // against one, just the model's own projected_median/mean/low/high instead.
  // sacks and any real-line yardage pick always have both.
  line?: number;
  pick: string; // e.g. "OVER 49.5" (real line or classifier) or "Projected 76 yards" (no real line)
  model_prob?: number; // 0..1
  prob_pct?: number; // 0..100, e.g. 64.5 meaning 64.5%
  prob_over?: number;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  games_played?: number;
  generated_at?: string;
  // rushing_yards/receiving_yards only: real book line priced by a real
  // Monte Carlo projection (nfl_serving_builder_a.py's
  // build_real_odds_yardage_picks) -- same shape as MLB's own props.
  // sacks has none of these; it's still the flat classifier design.
  odds?: number; // American odds for the picked side, e.g. -110
  book?: string; // bookmaker key, e.g. "draftkings"
  fair_prob?: number; // de-vigged (no-vig) probability for the picked side
  value_edge?: number; // (model_prob - fair_prob) / fair_prob
  kelly_fraction?: number; // 0..0.25, capped
  projected_median?: number; // simulator's median simulated yards -- always agrees with
  // the pick's OVER/UNDER direction (mean does not, for a boom/bust player)
  projected_mean?: number; // no-real-line picks only
  projected_low?: number; // p10 of the simulated distribution -- no-real-line picks only
  projected_high?: number; // p90 of the simulated distribution -- no-real-line picks only
  unagraded?: boolean; // true when no real book line was matched -- pick is a real
  // projection, not a bet; no confidence tier assigned (api.py skips conf_from_prob())
  note?: string;
  model_source?: string; // "in_season_sim" | "prior_season_sim" | "blended_sim" | "classifier_fixed_line"
  validation_note?: string;
}

export interface NflPredictionsDoc {
  generated_at_utc: string | null;
  season: number | null;
  week: number | null;
  markets: Record<string, { eligible: number } & Record<string, unknown>>;
  note?: string;
  picks: NflPrediction[];
}

// CFB predictions -- same predictions-first shape as NFL (see mlb-picks2's
// api.py /cfb/predictions): no odds/kelly_fraction/value_edge/fair_prob,
// but confidence IS included (see NflPrediction's comment for why that's
// real parity, not fabrication). Don't confuse it with sim_confidence
// below -- that's the Monte Carlo simulator's own confidence in ITS
// projection, a different, CFB-only concept that predates this field.
export interface CfbPrediction {
  market: string; // "rushing_yards" | "receiving_yards" | "passing_yards" | "passing_touchdowns" | "anytime_touchdowns" | "rushing_yards_early_season" | "receiving_yards_early_season" | "passing_yards_early_season" | "passing_touchdowns_early_season" | "anytime_touchdowns_early_season"
  prop_type: string; // alias of market, added by the api.py route
  player_id?: string;
  player: string;
  team?: string;
  opponent?: string;
  season: number;
  week: number;
  // Real kickoff timestamp (ISO 8601 UTC, e.g. "2026-09-26T16:00:00.000Z")
  // from cfbfastR-data's own schedule -- added so games can be ordered by
  // actual kickoff time instead of by model confidence, which is all a
  // week's picks had to sort by before this existed (found live
  // 2026-09-26). Absent only if the raw schedule row itself had no
  // start_date (shouldn't happen for a real, already-scheduled game).
  kickoff_utc?: string;
  line: number;
  pick: string; // e.g. "OVER 69.5"
  model_prob: number; // 0..1
  prob_pct?: number; // 0..100, e.g. 64.5 meaning 64.5%
  prob_over?: number;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  games_played?: number;
  generated_at?: string;
  model_source?: string; // present on "*_early_season" picks (prior-season-informed bootstrap)
  validation_note?: string;
  // Present only for rushing_yards and passing_touchdowns, and only when
  // real per-carry/per-attempt data exists for this player (a Monte Carlo
  // simulator, mirroring the MLB pitcher-strikeout model's projected
  // value -- see cfb_rush_sim.py). Absent, not zero, when the simulator
  // couldn't run for this pick.
  projected?: number;
  sim_median?: number;
  sim_prob_over?: number;
  sim_confidence?: "HIGH" | "MEDIUM" | "LOW" | "NO_BET";
}

export interface CfbPredictionsDoc {
  generated_at_utc: string | null;
  season: number | null;
  week: number | null;
  markets: Record<string, { eligible: number } & Record<string, unknown>>;
  note?: string;
  picks: CfbPrediction[];
}

// NHL predictions -- team-level moneyline only (this repo's first and,
// for now, only NHL market -- see mlb-picks2's nhl_serving_builder_a.py).
// Unlike CFB/NFL's week-based cadence, NHL plays near-daily, so the doc
// is keyed on a real calendar game_date instead of season/week.
export interface NhlPrediction {
  market: string; // "moneyline" | "moneyline_early_season" | "points" | "shots_on_goal" | "goalie_saves"
  prop_type: string; // alias of market, added by the api.py route
  player_id?: string | number | null;
  player: string; // team name for moneyline picks; the real skater/goalie's name for player-level picks
  team: string;
  opponent: string;
  season: number;
  game_date: string; // YYYY-MM-DD
  // Real kickoff timestamp (ISO 8601 UTC), same as CfbPrediction's --
  // added so games can be ordered by actual puck-drop time instead of by
  // model confidence.
  kickoff_utc?: string;
  pick: string; // e.g. "Boston Bruins ML", "OVER 2.5", "UNDER 24.5"
  model_prob: number; // 0..1
  prob_pct?: number; // 0..100
  prob_over?: number; // present on points/shots_on_goal/goalie_saves (two-sided/anytime markets)
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  is_home?: number;
  line?: number; // present on points/shots_on_goal/goalie_saves
  team_games_played?: number; // moneyline only
  opp_games_played?: number; // moneyline only
  games_played?: number; // points/shots_on_goal/goalie_saves only
  generated_at?: string;
  model_source?: string; // present on moneyline_early_season picks (prior-season-informed bootstrap)
  prior_season?: number;
}

export interface NhlPredictionsDoc {
  generated_at_utc: string | null;
  season: number | null;
  game_date: string | null;
  markets: Record<string, { eligible: number } & Record<string, unknown>>;
  note?: string;
  picks: NhlPrediction[];
}

// Tennis predictions -- structurally different from every other sport here:
// a match is two players, not one player vs a team, and only two markets
// ship at all (see mlb-picks2's tennis_serving_builder_a.py):
//   total_games   graded against a REAL market line (The Odds API) --
//                 has line/odds/book/predicted_mean and a real confidence
//                 tier, same conf_from_prob() bucketing as NFL/CFB.
//   set_betting   an UNAGRADED model projection -- no real correct-score
//                 market exists anywhere checked, so there's deliberately
//                 no confidence field at all (api.py's /tennis/predictions
//                 route skips conf_from_prob() for this market on purpose).
//                 `unagraded: true` is the signal to render this
//                 differently, not as a graded HIGH/MEDIUM/LOW pick.
// total_aces, double_faults, moneyline, and games_spread all failed their
// backtests and are never present in this feed at all.
export interface TennisPrediction {
  market: "total_games" | "set_betting";
  prop_type: string; // alias of market, added by the api.py route
  tour: string; // "atp" -- WTA has no historical data source, ATP only
  tourney: string;
  surface: string;
  surface_confirmed: boolean; // false means surface was guessed (defaulted to Hard), not looked up
  best_of: number;
  start_time_utc: string;
  player1: string;
  player1_id?: string;
  player2: string;
  player2_id?: string;
  pick: string; // e.g. "UNDER 40.0" (total_games) or "Carlos Alcaraz 3-1" (set_betting)
  model_prob: number; // 0..1
  prob_pct?: number; // 0..100
  confidence?: "HIGH" | "MEDIUM" | "LOW"; // only when a real market line backs the pick (see unagraded)
  unagraded?: boolean; // true for set_betting always, and for total_games whenever no real book
                        // line was matched today (odds fetch failed, or not offered) -- the pick
                        // is still the model's own real projection, just not graded against a market
  model_source?: string; // "real_book_line" | "model_projected_line" (total_games only)
  note?: string;
  // total_games only:
  line?: number;
  predicted_mean?: number;
  odds?: number;
  book?: string;
  generated_at?: string;
}

export interface TennisPredictionsDoc {
  generated_at_utc: string | null;
  builder?: string;
  design?: string;
  markets: Record<string, { eligible: number } & Record<string, unknown>>;
  note?: string;
  picks: TennisPrediction[];
}

