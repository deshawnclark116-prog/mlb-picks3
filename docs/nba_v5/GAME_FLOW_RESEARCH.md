# NBA V5 historical two-minute game flow trial — November 6, 2026

**Promotion decision: DO NOT ACTIVATE.** Current V5 forecasting remains
unchanged, with \`game_flow=false\` in published feature switches.

## Real observed event source

V5 counted two-minute FGA, TO, ORB and 0.44*FTA events in every saved,
completed ESPN play-by-play. It successfully created a usable timing proxy
for **1,351 games** (0 rejected). The events from both teams are pooled,
so an inconsistent ESPN event-team label does not change the timing signal.

The learned season-average distribution has exactly 24 segments totaling
24.00 baseline units. The last two-minute segment of each quarter has
a relative game-pressure multiplier of Q1 **1.0510**, Q2 **1.0561**,
Q3 **1.0412**, Q4 **1.0805**. This is an **event proxy**, not possession
identity or shot-clock tracking. Prior-game learning only; 40 game-equivalent
uniform shrinkage; all segments bounded within 0.80–1.20.

## Paired test at champion's original projection

Same 68 scored historical games after March 1, 2026, 1,391 player-games,
identical 500-draw seeds and roster, only the 24-segment possession cadence
changed. Test event was the original champion whole-number projection,
never a more favorable new target. Game-cluster bootstrap 95% intervals.

| Statistic | Incumbent Brier | Candidate Brier | Error reduction (positive=better) | Game-cluster 95% interval |
|---|---:|---:|---:|---|
| Points | 0.250121 | 0.250074 | +0.000047 | [-0.000811,+0.000877] |
| Rebounds | 0.249169 | 0.249086 | +0.000083 | [-0.000765,+0.000947] |
| Assists | 0.244298 | 0.244018 | +0.000280 | [-0.000852,+0.001389] |
| Threes | 0.236113 | 0.236000 | +0.000113 | [-0.000784,+0.001066] |
| Steals | 0.237673 | 0.238872 | -0.001199 | [-0.003177,+0.000740] |
| Blocks | 0.241779 | 0.244155 | -0.002376 | [-0.006127,+0.001198] |
| Turnovers | 0.235081 | 0.234229 | +0.000852 | [-0.002058,+0.003485] |

**No principal market has a statistically credible gain on this used
historical sample**, and steals/blocks trends are negative. The observable
timing effect exists, but it does not earn model promotion. Do not
"rescue-tune" segment caps or prior strength against the burned 68-game
evaluation. The source does not encode true possession end times.

Tests: \`tests/test_nba_v5_game_flow.py\` and the full NBA V5 suite;
CI: \`.github/workflows/nba_v5_game_flow.yml\`.

The current champion remains unchanged. New informative data such as
verified shot clock / possession action timestamps could justify a separately
preregistered structural approach and untouched future holdout.
