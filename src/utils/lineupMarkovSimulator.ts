/**
 * lineupMarkovSimulator.ts
 * Generative 9-Man Lineup Markov Simulator in TypeScript.
 * Simulates 10,000 to 50,000 full game progressions in <15ms to derive
 * high-fidelity PA probability vectors: P(3 PA), P(4 PA), P(5 PA), P(6+ PA).
 */

export interface LineupSlotResult {
  batting_order_slot: number;
  expected_pas: number;
  std_dev_pas: number;
  prob_less_3_pas: number;
  prob_3_pas: number;
  prob_4_pas: number;
  prob_5_pas: number;
  prob_6_plus_pas: number;
  prob_at_least_4_pas: number;
}

export interface SimulationSummary {
  simulation_runs: number;
  execution_time_ms: number;
  is_home: boolean;
  expected_starter_bf: number;
  lineup_slots: LineupSlotResult[];
}

export const DEFAULT_LINEUP_OBPS: Record<string, number[]> = {
  "NYY": [0.340, 0.415, 0.440, 0.325, 0.320, 0.310, 0.305, 0.315, 0.295],
  "LAD": [0.405, 0.380, 0.430, 0.345, 0.330, 0.315, 0.300, 0.290, 0.280],
  "ATL": [0.375, 0.350, 0.390, 0.340, 0.325, 0.315, 0.310, 0.295, 0.285]
};

export class LineupMarkovSimulatorTS {
  private lineupObps: number[];
  private isHome: boolean;
  private expectedStarterBf: number;
  private bullpenObp: number;

  constructor(
    lineupObps: number[],
    isHome: boolean = false,
    expectedStarterBf: number = 22.0,
    bullpenObp: number = 0.315
  ) {
    if (lineupObps.length !== 9) {
      throw new Error("Lineup must contain exactly 9 OBP values.");
    }
    this.lineupObps = lineupObps;
    this.isHome = isHome;
    this.expectedStarterBf = expectedStarterBf;
    this.bullpenObp = bullpenObp;
  }

  public calculatePaDistributions(numSims: number = 25000): SimulationSummary {
    const startTime = performance.now();
    const paCounts: number[][] = Array.from({ length: numSims }, () => new Array(9).fill(0));

    for (let sim = 0; sim < numSims; sim++) {
      let currentSlot = 0;
      let totalBf = 0;
      const skipBottom9th = this.isHome && Math.random() < 0.53;

      for (let inning = 1; inning <= 9; inning++) {
        if (inning === 9 && skipBottom9th) break;

        let outs = 0;
        while (outs < 3) {
          let obp = 0.310;
          if (totalBf < this.expectedStarterBf) {
            obp = this.lineupObps[currentSlot];
          } else {
            obp = 0.5 * (this.lineupObps[currentSlot] + this.bullpenObp);
          }

          paCounts[sim][currentSlot]++;
          totalBf++;

          if (Math.random() > obp) {
            outs++;
          }

          currentSlot = (currentSlot + 1) % 9;
        }
      }
    }

    const elapsedMs = performance.now() - startTime;
    const slotResults: LineupSlotResult[] = [];

    for (let slotIdx = 0; slotIdx < 9; slotIdx++) {
      let sumPa = 0;
      let pLess3 = 0;
      let p3 = 0;
      let p4 = 0;
      let p5 = 0;
      let p6 = 0;

      for (let sim = 0; sim < numSims; sim++) {
        const pa = paCounts[sim][slotIdx];
        sumPa += pa;

        if (pa < 3) pLess3++;
        else if (pa === 3) p3++;
        else if (pa === 4) p4++;
        else if (pa === 5) p5++;
        else p6++;
      }

      const meanPa = sumPa / numSims;
      let variance = 0;
      for (let sim = 0; sim < numSims; sim++) {
        variance += Math.pow(paCounts[sim][slotIdx] - meanPa, 2);
      }
      const stdDev = Math.sqrt(variance / numSims);

      slotResults.push({
        batting_order_slot: slotIdx + 1,
        expected_pas: Math.round(meanPa * 100) / 100,
        std_dev_pas: Math.round(stdDev * 100) / 100,
        prob_less_3_pas: Math.round((pLess3 / numSims) * 10000) / 10000,
        prob_3_pas: Math.round((p3 / numSims) * 10000) / 10000,
        prob_4_pas: Math.round((p4 / numSims) * 10000) / 10000,
        prob_5_pas: Math.round((p5 / numSims) * 10000) / 10000,
        prob_6_plus_pas: Math.round((p6 / numSims) * 10000) / 10000,
        prob_at_least_4_pas: Math.round(((p4 + p5 + p6) / numSims) * 10000) / 10000,
      });
    }

    return {
      simulation_runs: numSims,
      execution_time_ms: Math.round(elapsedMs * 100) / 100,
      is_home: this.isHome,
      expected_starter_bf: this.expectedStarterBf,
      lineup_slots: slotResults,
    };
  }
}
