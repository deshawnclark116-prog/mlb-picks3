# NBA WORLD — independent clean-room research architecture

This is not V6 or a modification of V3/V4/V5. The old systems are competitors and their frozen outputs are used solely for evaluation (plus frozen pregame roster identity in this retrospective test). Existing raw box score files are reused as observations. No existing NBA model, features, simulation, calibration, or rotation code is imported. No live production changes.

## Scientific model

The unit of prediction is the entire game, not an isolated player. Encode each player's ordered raw game history using a recurrent sequence encoder. Let the model learn how the complete two-team player set changes opportunity through cross-player attention. Learn availability, conditional minutes and uncertainty, shot-attempt types, shooting conversion, rebound and assist opportunity simultaneously. Use exposure only as a training outcome, never next-game actual minutes as input.

Generate whole-game worlds with shared tempo, uncertain rotations, sampled overtime and constrained team minutes. Draw attempts and makes; derive points and threes from the same shots. Allocate rebounds from missed shots and assists from made field goals, no self-assists. Unknown roster players occupy an explicit anonymous reserve; never invent a named player. This first simulation is aggregate, not a possession-by-possession sequence. It approximates reboundable free throws and uses fixed dispersion priors pending independent calibration. The model does not claim causal identification of coaching or tracking from box scores.

## Next research layers — independent, not inherited

1. Build clean-room historical stints from raw substitution events, align with box seconds, learn conditional lineup states and coach regimes. Validate missing/invalid traces.
2. Acquire timestamped official injury, starters and roster transitions; keep current and historical as-of snapshots distinct. Add independent verified tracking and matchup information, only with demonstrated out-of-sample lift.
3. Learn shared latent game state and probability dispersion from held-out games. Compare an independent structured statistical model and the neural world model on fixed forecasts; preserve the winner by market and information horizon.
4. Implement possession-state simulator if it beats the aggregate world model, not merely because it is more complex. Add pace, foul/bonus, substitution, fatigue, shot zone and assist/rebound chains with causal as-of guards.
5. Freeze prospective predictions before tipoff. Compare exact same thresholds, full coverage, minutes, availability, MAE, Brier, top-card counts, calibration and uncertainty by game. November evaluation is previously examined and not prospective; no automatic promotion.

## First experiment

Train through January 2026, choose checkpoint on February–April validation, evaluate November 2026 immutable original V5 targets and compare independent shadow forecasts where paired. Separate raw outcome conflicts; retain original records. Report all played numeric predictions and separately the featured positive-threshold subset. This is a fresh model design, not proof of accuracy yet.
