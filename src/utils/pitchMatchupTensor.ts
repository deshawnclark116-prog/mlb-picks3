/**
 * Pitch-Mix Matchup Tensor Engine (TypeScript Implementation)
 * Computes dot products between pitcher pitch-mix frequencies and batter Statcast RV/100 values,
 * normalizes to a 0.0-1.0 Percentile Rank vs League Distribution, and isolates primary vulnerabilities.
 */

import type { PitchTensorData, PitchBreakdownItem } from "../types.ts";

export const PITCH_NAMES: Record<string, string> = {
  FF: "4-Seam Fastball",
  SI: "Sinker",
  FC: "Cutter",
  SL: "Slider",
  ST: "Sweeper",
  CU: "Curveball",
  CH: "Changeup",
  FS: "Splitter",
  KN: "Knuckleball",
};

// Empirical distribution constants for MLB batter vs pitcher matchups
const LEAGUE_MEAN = 0.08;
const LEAGUE_STD = 0.78;

const EMPIRICAL_TABLE: Array<[number, number]> = [
  [-2.5, 0.001],
  [-2.0, 0.005],
  [-1.6, 0.015],
  [-1.2, 0.05],
  [-0.9, 0.1],
  [-0.6, 0.18],
  [-0.3, 0.3],
  [-0.1, 0.4],
  [0.08, 0.5],
  [0.25, 0.58],
  [0.5, 0.7],
  [0.85, 0.84],
  [1.15, 0.92],
  [1.45, 0.96],
  [1.8, 0.985],
  [2.2, 0.995],
];

// Error function approximation for normal CDF
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

export function calculatePercentileRank(rawScore: number): number {
  if (rawScore <= EMPIRICAL_TABLE[0][0]) return EMPIRICAL_TABLE[0][1];
  if (rawScore >= EMPIRICAL_TABLE[EMPIRICAL_TABLE.length - 1][0]) {
    return EMPIRICAL_TABLE[EMPIRICAL_TABLE.length - 1][1];
  }

  for (let i = 0; i < EMPIRICAL_TABLE.length - 1; i++) {
    const [x0, y0] = EMPIRICAL_TABLE[i];
    const [x1, y1] = EMPIRICAL_TABLE[i + 1];
    if (rawScore >= x0 && rawScore <= x1) {
      const t = (rawScore - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }

  const z = (rawScore - LEAGUE_MEAN) / LEAGUE_STD;
  const cdf = 0.5 * (1.0 + erf(z / Math.sqrt(2.0)));
  return Math.max(0.001, Math.min(0.999, cdf));
}

/**
 * Empirical Bayes Shrinkage to prevent rare pitch small-sample outliers from warping dot products:
 * Adjusted RV = (n / (n + K)) * Observed_RV + (K / (n + K)) * Overall_RV
 * Where K is the shrinkage constant (default 100).
 */
export function applyBayesShrinkage(
  observedRv: number,
  sampleN: number,
  overallRv: number = 0.0,
  k: number = 100
): number {
  if (sampleN <= 0) return overallRv;
  const weight = sampleN / (sampleN + k);
  return weight * observedRv + (1.0 - weight) * overallRv;
}

export function calculateRawMatchupScore(
  pitcherArsenal: Record<string, number>,
  batterRv100: Record<string, number>,
  batterPitchCounts?: Record<string, number>,
  overallRv: number = 0.0,
  shrinkageK: number = 100
): number {
  let totalFreq = 0;
  for (const freq of Object.values(pitcherArsenal)) {
    totalFreq += freq;
  }
  if (totalFreq <= 0) return 0;

  let rawScore = 0;
  for (const [pitchType, rawFreq] of Object.entries(pitcherArsenal)) {
    const normFreq = rawFreq / totalFreq;
    const obsRv = batterRv100[pitchType] ?? 0.0;
    const sampleN = batterPitchCounts?.[pitchType] ?? 250;
    const adjRv = applyBayesShrinkage(obsRv, sampleN, overallRv, shrinkageK);
    rawScore += normFreq * adjRv;
  }

  return rawScore;
}

export function evaluatePitchMatchup(
  hitterName: string,
  pitcherName: string,
  pitcherArsenal: Record<string, number>,
  batterRv100: Record<string, number>,
  batterPitchCounts?: Record<string, number>,
  overallRv: number = 0.0,
  shrinkageK: number = 100
): PitchTensorData {
  let totalFreq = 0;
  for (const f of Object.values(pitcherArsenal)) totalFreq += f;
  if (totalFreq <= 0) totalFreq = 1;

  const breakdown: PitchBreakdownItem[] = [];
  let rawScore = 0;

  for (const [pitchType, rawFreq] of Object.entries(pitcherArsenal)) {
    const normFreq = rawFreq / totalFreq;
    if (normFreq <= 0.02) continue;

    const obsRv = batterRv100[pitchType] ?? 0.0;
    // Default to estimated sample size: Fastball/Sinker ~350, rare pitch (FS, KN) ~25, others ~150
    const sampleN = batterPitchCounts?.[pitchType] ?? (pitchType === "FS" || pitchType === "KN" ? 25 : 200);
    const adjRv = applyBayesShrinkage(obsRv, sampleN, overallRv, shrinkageK);
    const weightedImpact = normFreq * adjRv;
    rawScore += weightedImpact;

    breakdown.push({
      pitch_type: pitchType,
      pitch_name: PITCH_NAMES[pitchType] || pitchType,
      frequency_pct: Math.round(normFreq * 1000) / 10,
      batter_rv100: Math.round(adjRv * 100) / 100,
      weighted_impact: Math.round(weightedImpact * 1000) / 1000,
    });
  }

  breakdown.sort((a, b) => b.frequency_pct - a.frequency_pct);

  const percentile = calculatePercentileRank(rawScore);

  // Identify primary vulnerability
  let primaryVulnerability = "No major pitch vulnerability detected vs this arsenal.";
  let vulnerabilityDetail: PitchTensorData["vulnerability_detail"] = undefined;

  const vulnerableItems = breakdown.filter(
    (item) => item.frequency_pct >= 10 && item.batter_rv100 < 0
  );
  if (vulnerableItems.length > 0) {
    vulnerableItems.sort((a, b) => a.weighted_impact - b.weighted_impact);
    const v = vulnerableItems[0];
    const summary = `Hitter is ${v.batter_rv100 > 0 ? "+" : ""}${v.batter_rv100.toFixed(2)} RV/100 vs ${v.pitch_name}; Pitcher uses it ${v.frequency_pct.toFixed(1)}% of time`;
    primaryVulnerability = summary;
    vulnerabilityDetail = {
      pitch_type: v.pitch_type,
      pitch_name: v.pitch_name,
      frequency_pct: v.frequency_pct,
      batter_rv100: v.batter_rv100,
      summary,
    };
  }

  // Identify primary advantage
  let primaryAdvantage = "Balanced profile against opponent pitch types.";
  let advantageDetail: PitchTensorData["advantage_detail"] = undefined;

  const advantageItems = breakdown.filter(
    (item) => item.frequency_pct >= 10 && item.batter_rv100 > 0
  );
  if (advantageItems.length > 0) {
    advantageItems.sort((a, b) => b.weighted_impact - a.weighted_impact);
    const a = advantageItems[0];
    const summary = `Hitter is +${a.batter_rv100.toFixed(2)} RV/100 vs ${a.pitch_name} (${a.frequency_pct.toFixed(1)}% usage)`;
    primaryAdvantage = summary;
    advantageDetail = {
      pitch_type: a.pitch_type,
      pitch_name: a.pitch_name,
      frequency_pct: a.frequency_pct,
      batter_rv100: a.batter_rv100,
      summary,
    };
  }

  let rating = "NEUTRAL / BALANCED";
  let badge_color: PitchTensorData["badge_color"] = "gray";

  if (percentile >= 0.85) {
    rating = "ELITE HITTER MATCHUP";
    badge_color = "green";
  } else if (percentile >= 0.65) {
    rating = "FAVORABLE MATCHUP";
    badge_color = "emerald";
  } else if (percentile >= 0.35) {
    rating = "NEUTRAL / BALANCED";
    badge_color = "gray";
  } else if (percentile >= 0.15) {
    rating = "PITCHER ADVANTAGE";
    badge_color = "amber";
  } else {
    rating = "HEAVY VULNERABILITY";
    badge_color = "red";
  }

  return {
    hitter: hitterName,
    pitcher: pitcherName,
    raw_matchup_score: Math.round(rawScore * 1000) / 1000,
    percentile_rank: Math.round(percentile * 1000) / 1000,
    percentile_display: `${Math.round(percentile * 100)}th Percentile`,
    rating,
    badge_color,
    primary_vulnerability: primaryVulnerability,
    primary_advantage: primaryAdvantage,
    vulnerability_detail: vulnerabilityDetail,
    advantage_detail: advantageDetail,
    arsenal_breakdown: breakdown,
  };
}

// Statcast Starters Database
export const FEATURED_STARTERS: Record<string, Record<string, number>> = {
  "Spencer Strider": { FF: 0.58, SL: 0.35, CH: 0.07 },
  "Tarik Skubal": { FF: 0.44, CH: 0.28, SI: 0.16, SL: 0.12 },
  "Corbin Burnes": { FC: 0.55, CU: 0.18, SL: 0.14, SI: 0.13 },
  "Zack Wheeler": { FF: 0.42, SI: 0.24, SL: 0.20, CU: 0.14 },
  "Paul Skenes": { FF: 0.48, FS: 0.28, SL: 0.18, CU: 0.06 },
  "Logan Webb": { SI: 0.38, CH: 0.32, SL: 0.22, CU: 0.08 },
  "Dylan Cease": { FF: 0.43, SL: 0.41, CU: 0.12, CH: 0.04 },
  "Yoshinobu Yamamoto": { FF: 0.41, FS: 0.26, CU: 0.22, FC: 0.11 },
  "Gerrit Cole": { FF: 0.52, SL: 0.22, KC: 0.14, CH: 0.12 },
  "Tyler Glasnow": { FF: 0.46, SL: 0.34, CU: 0.20 },
  "Shota Imanaga": { FF: 0.54, FS: 0.32, SL: 0.10, CU: 0.04 },
  "Logan Gilbert": { FF: 0.41, SL: 0.28, FS: 0.16, CU: 0.15 },
  "Chris Sale": { SL: 0.42, FF: 0.38, CH: 0.20 },
  "Framber Valdez": { SI: 0.48, CH: 0.28, CU: 0.22, FC: 0.02 },
  "Hunter Greene": { FF: 0.56, SL: 0.38, CH: 0.06 },
};

// Statcast Batters Database (Run Value per 100 pitches)
export const FEATURED_BATTERS: Record<string, Record<string, number>> = {
  "Aaron Judge": { FF: 2.45, SI: 1.80, FC: 1.20, SL: -1.20, ST: -1.40, CU: 0.80, CH: 0.10, FS: 0.40 },
  "Shohei Ohtani": { FF: 2.80, SI: 1.95, FC: 0.90, SL: 1.10, ST: 0.40, CU: 1.50, CH: -0.80, FS: -1.10 },
  "Juan Soto": { FF: 2.30, SI: 2.10, FC: 1.40, SL: 0.85, ST: 0.60, CU: 1.10, CH: 1.35, FS: 0.20 },
  "Mookie Betts": { FF: 1.90, SI: 1.65, FC: 0.70, SL: 0.40, ST: 0.20, CU: 0.90, CH: 0.60, FS: -0.30 },
  "Vladimir Guerrero Jr.": { FF: 1.85, SI: 2.05, FC: 0.50, SL: -0.60, ST: -0.90, CU: 0.40, CH: 0.70, FS: 0.10 },
  "Julio Rodríguez": { FF: 1.60, SI: 1.20, FC: 0.40, SL: -1.45, ST: -1.80, CU: 0.20, CH: -0.50, FS: -0.70 },
  "Gunnar Henderson": { FF: 2.20, SI: 1.70, FC: 0.80, SL: 0.30, ST: -0.40, CU: 0.60, CH: 0.20, FS: -0.20 },
  "Bobby Witt Jr.": { FF: 2.10, SI: 1.90, FC: 1.10, SL: 0.50, ST: -0.30, CU: 0.80, CH: 0.40, FS: -0.10 },
  "Bryce Harper": { FF: 2.05, SI: 1.80, FC: 0.60, SL: -0.50, ST: -0.70, CU: 1.20, CH: 0.80, FS: 0.30 },
  "Yordan Alvarez": { FF: 2.90, SI: 2.40, FC: 1.60, SL: 0.90, ST: 0.50, CU: 1.40, CH: 1.10, FS: 0.80 },
  "Javier Báez": { FF: 0.20, SI: 0.10, FC: -0.80, SL: -2.40, ST: -2.80, CU: -1.10, CH: -1.85, FS: -2.10 },
  "Kyle Schwarber": { FF: 2.50, SI: 1.60, FC: 0.90, SL: -1.30, ST: -1.60, CU: 0.70, CH: -0.40, FS: -0.80 },
  "Elly De La Cruz": { FF: 1.75, SI: 1.40, FC: 0.30, SL: -1.90, ST: -2.20, CU: -0.60, CH: -1.20, FS: -1.40 },
  "Freddie Freeman": { FF: 2.15, SI: 2.25, FC: 1.20, SL: 0.80, ST: 0.40, CU: 1.00, CH: 1.15, FS: 0.50 },
  "Corey Seager": { FF: 2.60, SI: 2.10, FC: 1.30, SL: 0.70, ST: 0.20, CU: 0.90, CH: 0.80, FS: 0.40 },
};

/**
 * Utility helper to attach Tensor metrics to any player prediction
 */
export function getPredictionTensor(player: string, opponentPitcher?: string): PitchTensorData {
  const hitterRv = FEATURED_BATTERS[player] || {
    FF: 1.4,
    SI: 1.1,
    FC: 0.4,
    SL: -0.6,
    ST: -0.8,
    CU: 0.3,
    CH: 0.1,
    FS: -0.2,
  };

  const pitcherName = opponentPitcher || "Spencer Strider";
  const pitcherArsenal = FEATURED_STARTERS[pitcherName] || {
    FF: 0.48,
    SL: 0.34,
    CH: 0.18,
  };

  return evaluatePitchMatchup(player, pitcherName, pitcherArsenal, hitterRv);
}
