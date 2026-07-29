#!/usr/bin/env python3
"""
lineup_markov_simulator.py
--------------------------
Generative 9-Man Lineup Markov Simulator.

Simulates 50,000+ complete game progressions plate-by-plate using a 9-man closed-loop
batting rotation, starter expected batters faced (BF), home/away bottom-9th dynamics,
and fatigue-adjusted bullpen OBPs to compute the exact Plate Appearance (PA) probability distribution.
"""

import time
import math
import random
from typing import Dict, List, Tuple, Any, Optional

class LineupMarkovSimulator:
    """
    Simulates a 9-man baseball lineup progression using Monte Carlo Markov chains.
    Returns exact PA probability distributions and expected volume for all 9 lineup slots.
    """

    def __init__(
        self, 
        lineup_obps: List[float], 
        is_home: bool = False, 
        expected_starter_bf: float = 22.0, 
        bullpen_obp: float = 0.315
    ):
        """
        lineup_obps: List of 9 matchup-adjusted OBPs for lineup slots 1 through 9.
        is_home: True if target team is Home (may skip bottom 9th if leading).
        expected_starter_bf: Batter count before starter exits for bullpen.
        bullpen_obp: Average matchup OBP against the team's projected available bullpen.
        """
        if len(lineup_obps) != 9:
            raise ValueError("Lineup must contain exactly 9 OBP values.")
            
        self.lineup_obps = lineup_obps
        self.is_home = is_home
        self.expected_starter_bf = expected_starter_bf
        self.bullpen_obp = bullpen_obp

    def simulate_game_batch(self, num_sims: int = 50000) -> List[List[int]]:
        """
        Runs Monte Carlo Markov simulations of game plate appearances.
        Returns matrix of shape (num_sims, 9) where cell [i, j] is total PAs for slot j in sim i.
        """
        pa_counts = [[0] * 9 for _ in range(num_sims)]

        for sim in range(num_sims):
            current_slot = 0 # Lead-off batter (index 0)
            total_bf = 0
            
            # Simple stochastic home-team leading probability in bottom of 9th
            # Home teams do not bat in bottom 9th if leading (~53% probability)
            skip_bottom_9th = self.is_home and (random.random() < 0.53)

            for inning in range(1, 10):
                # If home team leading in 9th, skip bottom inning
                if inning == 9 and skip_bottom_9th:
                    break

                outs = 0
                while outs < 3:
                    # Determine OBP: Starter vs Bullpen exposure
                    if total_bf < self.expected_starter_bf:
                        obp = self.lineup_obps[current_slot]
                    else:
                        # Blend batter skill with bullpen fatigue-weighted OBP
                        obp = 0.5 * (self.lineup_obps[current_slot] + self.bullpen_obp)

                    pa_counts[sim][current_slot] += 1
                    total_bf += 1

                    # Out vs On-Base simulation
                    if random.random() > obp:
                        outs += 1

                    # Advance to next batter in closed-loop rotation
                    current_slot = (current_slot + 1) % 9

        return pa_counts

    def calculate_pa_distributions(self, num_sims: int = 50000) -> List[Dict[str, Any]]:
        """
        Calculates expected PAs, probability vector P(3 PA), P(4 PA), P(5 PA), P(6 PA),
        and variance metrics for all 9 lineup positions.
        """
        start_time = time.time()
        raw_pa_matrix = self.simulate_game_batch(num_sims=num_sims)
        elapsed_ms = (time.time() - start_time) * 1000.0

        slot_results = []

        for slot_idx in range(9):
            slot_pas = [raw_pa_matrix[sim][slot_idx] for sim in range(num_sims)]
            
            p3 = sum(1 for pa in slot_pas if pa == 3) / float(num_sims)
            p4 = sum(1 for pa in slot_pas if pa == 4) / float(num_sims)
            p5 = sum(1 for pa in slot_pas if pa == 5) / float(num_sims)
            p6 = sum(1 for pa in slot_pas if pa >= 6) / float(num_sims)
            p_less_3 = sum(1 for pa in slot_pas if pa < 3) / float(num_sims)

            mean_pas = sum(slot_pas) / float(num_sims)
            
            # Variance calculation
            var_pas = sum((pa - mean_pas) ** 2 for pa in slot_pas) / float(num_sims)
            std_pas = math.sqrt(var_pas)

            slot_results.append({
                "batting_order_slot": slot_idx + 1,
                "expected_pas": round(mean_pas, 2),
                "std_dev_pas": round(std_pas, 2),
                "prob_less_3_pas": round(p_less_3, 4),
                "prob_3_pas": round(p3, 4),
                "prob_4_pas": round(p4, 4),
                "prob_5_pas": round(p5, 4),
                "prob_6_plus_pas": round(p6, 4),
                "prob_at_least_4_pas": round(p4 + p5 + p6, 4)
            })

        return {
            "simulation_runs": num_sims,
            "execution_time_ms": round(elapsed_ms, 2),
            "is_home": self.is_home,
            "expected_starter_bf": self.expected_starter_bf,
            "lineup_slots": slot_results
        }


if __name__ == "__main__":
    print("=========================================================================")
    print(" PROP EDGE GENERATIVE 9-MAN LINEUP MARKOV SIMULATOR DIAGNOSTIC")
    print("=========================================================================\n")

    # Sample Matchup Adjusted OBPs for NYY 1-9 Lineup
    # 1. G. Torres (.340), 2. J. Soto (.415), 3. A. Judge (.440), 4. G. Stanton (.325),
    # 5. J. Chisholm (.320), 6. A. Rizzo (.310), 7. A. Volpe (.305), 8. A. Wells (.315), 9. O. Cabrera (.295)
    nyy_lineup_obps = [0.340, 0.415, 0.440, 0.325, 0.320, 0.310, 0.305, 0.315, 0.295]

    sim = LineupMarkovSimulator(
        lineup_obps=nyy_lineup_obps,
        is_home=True,
        expected_starter_bf=22.4,
        bullpen_obp=0.310
    )

    results = sim.calculate_pa_distributions(num_sims=50000)

    print(f"Executed {results['simulation_runs']:,} full game simulations in {results['execution_time_ms']} ms.\n")
    print("LINEUP PA PROBABILITY DISTRIBUTIONS:")
    print(f"{'Slot':<5} | {'Expected PA':<11} | {'P(3 PA)':<8} | {'P(4 PA)':<8} | {'P(5 PA)':<8} | {'P(6+ PA)':<8} | {'P(>=4 PA)':<9}")
    print("-" * 75)

    for slot in results['lineup_slots']:
        print(
            f"#{slot['batting_order_slot']:<4} | "
            f"{slot['expected_pas']:<11.2f} | "
            f"{slot['prob_3_pas']*100:>6.1f}% | "
            f"{slot['prob_4_pas']*100:>6.1f}% | "
            f"{slot['prob_5_pas']*100:>6.1f}% | "
            f"{slot['prob_6_plus_pas']*100:>6.1f}% | "
            f"{slot['prob_at_least_4_pas']*100:>7.1f}%"
        )

    print("\n=========================================================================")
