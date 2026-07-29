/**
 * bullpenExposureEngine.ts
 * Phase 2 Pregame Probabilistic Bullpen Exposure Engine.
 * Calculates fatigue-discounted reliever availability, projected starter exit depth,
 * platoon leverage weights, and calculates exposure probability vector for the bullpen.
 */

import { PitchTensorData } from "../types";
import { evaluatePitchMatchup, applyBayesShrinkage } from "./pitchMatchupTensor";

export interface RelieverProfile {
  reliever_id: string;
  name: string;
  hand: "R" | "L";
  pitch_history_3d: {
    d1_pitches: number;
    d2_pitches: number;
    d3_pitches: number;
  };
  strikeout_rate: number; // e.g. 0.32
  pitch_mix: Record<string, number>;
}

export interface BullpenExposureResult {
  starter_name: string;
  starter_expected_bf: number;
  starter_game_share: number;
  starter_matchup_score: number;
  bullpen_game_share: number;
  weighted_bullpen_matchup_score: number;
  combined_pregame_matchup_score: number;
  combined_percentile_rank: number;
  reliever_exposures: Array<{
    reliever_id: string;
    name: string;
    hand: "R" | "L";
    availability_score: number;
    exposure_probability: number;
    reliever_matchup_score: number;
    fatigue_status: "Rested" | "Moderate" | "Fatigued" | "Burned";
  }>;
}

/**
 * Calculates fatigue-discounted availability multiplier (0.0 to 1.0) based on 3-day workload.
 */
export function calculateRelieverAvailability(history: { d1_pitches: number; d2_pitches: number; d3_pitches: number }): {
  score: number;
  status: "Rested" | "Moderate" | "Fatigued" | "Burned";
} {
  const p1 = history.d1_pitches || 0;
  const p2 = history.d2_pitches || 0;
  const p3 = history.d3_pitches || 0;

  const fatigueScore = 0.5 * p1 + 0.3 * p2 + 0.2 * p3;
  const rawAvailability = 1.0 - fatigueScore / 45.0;
  const score = Math.max(0.0, Math.min(1.0, rawAvailability));

  let status: "Rested" | "Moderate" | "Fatigued" | "Burned" = "Rested";
  if (score < 0.2) status = "Burned";
  else if (score < 0.5) status = "Fatigued";
  else if (score < 0.8) status = "Moderate";

  return { score: Math.round(score * 100) / 100, status };
}

/**
 * Sample Team Bullpens Database
 */
export const TEAM_BULLPENS: Record<string, RelieverProfile[]> = {
  "NYY": [
    {
      reliever_id: "NYY_1",
      name: "Clay Holmes",
      hand: "R",
      pitch_history_3d: { d1_pitches: 12, d2_pitches: 0, d3_pitches: 18 },
      strikeout_rate: 0.27,
      pitch_mix: { SI: 0.52, SL: 0.38, CH: 0.10 }
    },
    {
      reliever_id: "NYY_2",
      name: "Luke Weaver",
      hand: "R",
      pitch_history_3d: { d1_pitches: 0, d2_pitches: 14, d3_pitches: 0 },
      strikeout_rate: 0.31,
      pitch_mix: { FF: 0.44, CH: 0.32, FC: 0.24 }
    },
    {
      reliever_id: "NYY_3",
      name: "Tim Hill",
      hand: "L",
      pitch_history_3d: { d1_pitches: 28, d2_pitches: 18, d3_pitches: 0 },
      strikeout_rate: 0.18,
      pitch_mix: { SI: 0.72, SL: 0.28 }
    }
  ],
  "LAD": [
    {
      reliever_id: "LAD_1",
      name: "Evan Phillips",
      hand: "R",
      pitch_history_3d: { d1_pitches: 0, d2_pitches: 0, d3_pitches: 15 },
      strikeout_rate: 0.33,
      pitch_mix: { ST: 0.46, FC: 0.34, FF: 0.20 }
    },
    {
      reliever_id: "LAD_2",
      name: "Alex Vesia",
      hand: "L",
      pitch_history_3d: { d1_pitches: 15, d2_pitches: 0, d3_pitches: 12 },
      strikeout_rate: 0.35,
      pitch_mix: { FF: 0.62, SL: 0.38 }
    },
    {
      reliever_id: "LAD_3",
      name: "Blake Treinen",
      hand: "R",
      pitch_history_3d: { d1_pitches: 22, d2_pitches: 0, d3_pitches: 24 },
      strikeout_rate: 0.30,
      pitch_mix: { SI: 0.54, ST: 0.36, FC: 0.10 }
    }
  ],
  "ATL": [
    {
      reliever_id: "ATL_1",
      name: "Raisel Iglesias",
      hand: "R",
      pitch_history_3d: { d1_pitches: 0, d2_pitches: 0, d3_pitches: 0 },
      strikeout_rate: 0.29,
      pitch_mix: { CH: 0.42, FF: 0.38, SL: 0.20 }
    },
    {
      reliever_id: "ATL_2",
      name: "A.J. Minter",
      hand: "L",
      pitch_history_3d: { d1_pitches: 18, d2_pitches: 22, d3_pitches: 0 },
      strikeout_rate: 0.32,
      pitch_mix: { FC: 0.52, FF: 0.34, CH: 0.14 }
    }
  ]
};

/**
 * Evaluates combined Pregame Pitch-Mix + Bullpen Exposure Vector
 */
export function calculateBullpenExposure(
  hitterName: string,
  hitterHand: "R" | "L",
  batterRv100: Record<string, number>,
  starterName: string,
  starterExpectedBf: number = 22.0,
  starterArsenal: Record<string, number>,
  bullpen: RelieverProfile[]
): BullpenExposureResult {
  const avgTotalGamePAs = 38.0;
  const expectedBullpenPAs = Math.max(0, avgTotalGamePAs - starterExpectedBf);
  
  const starterShare = starterExpectedBf / avgTotalGamePAs;
  const bullpenShare = expectedBullpenPAs / avgTotalGamePAs;

  // Starter Matchup Tensor
  const starterTensor = evaluatePitchMatchup(hitterName, starterName, starterArsenal, batterRv100);
  const starterMatchupScore = starterTensor.raw_matchup_score;

  // Calculate Reliever Exposure Weights
  let totalWeight = 0;
  const tempWeights: Array<{
    reliever: RelieverProfile;
    availScore: number;
    status: "Rested" | "Moderate" | "Fatigued" | "Burned";
    weight: number;
    matchupScore: number;
  }> = [];

  for (const reliever of bullpen) {
    const { score: availScore, status } = calculateRelieverAvailability(reliever.pitch_history_3d);
    
    // Platoon leverage: managers deploy same-side relievers vs dangerous hitters
    const platoonMultiplier = reliever.hand === hitterHand ? 1.35 : 0.85;
    const skillMultiplier = 1.0 + (reliever.strikeout_rate - 0.22);
    
    const weight = availScore * platoonMultiplier * skillMultiplier;
    
    const relieverTensor = evaluatePitchMatchup(hitterName, reliever.name, reliever.pitch_mix, batterRv100);
    const matchupScore = relieverTensor.raw_matchup_score;

    tempWeights.push({
      reliever,
      availScore,
      status,
      weight,
      matchupScore,
    });

    totalWeight += weight;
  }

  // Normalize bullpen exposure probabilities
  let weightedBullpenScore = 0;
  const relieverExposures = tempWeights.map((item) => {
    const probShare = totalWeight > 0 ? item.weight / totalWeight : 1.0 / tempWeights.length;
    const exposureProb = probShare * bullpenShare;
    weightedBullpenScore += exposureProb * item.matchupScore;

    return {
      reliever_id: item.reliever.reliever_id,
      name: item.reliever.name,
      hand: item.reliever.hand,
      availability_score: item.availScore,
      exposure_probability: Math.round(exposureProb * 1000) / 1000,
      reliever_matchup_score: Math.round(item.matchupScore * 1000) / 1000,
      fatigue_status: item.status,
    };
  });

  const combinedScore = (starterShare * starterMatchupScore) + weightedBullpenScore;
  const combinedPercentile = starterTensor.percentile_rank; // Normalized against league distribution

  return {
    starter_name: starterName,
    starter_expected_bf: starterExpectedBf,
    starter_game_share: Math.round(starterShare * 100) / 100,
    starter_matchup_score: Math.round(starterMatchupScore * 1000) / 1000,
    bullpen_game_share: Math.round(bullpenShare * 100) / 100,
    weighted_bullpen_matchup_score: Math.round(weightedBullpenScore * 1000) / 1000,
    combined_pregame_matchup_score: Math.round(combinedScore * 1000) / 1000,
    combined_percentile_rank: combinedPercentile,
    reliever_exposures: relieverExposures,
  };
}
