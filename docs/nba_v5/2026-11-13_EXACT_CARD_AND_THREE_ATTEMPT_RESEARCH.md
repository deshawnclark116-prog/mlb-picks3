# NBA V5 — exact public Top 4/Top 10 audit and 3PA→3PM challenger
**Date:** 2026-11-13  
**Research status:** production champion preserved; no new probability/mean model promoted.

## Source and metric correction
The former postmortem's `stated_chance_vs_actual.frontend_top4` applies an old general ranking and scores **P(reach | playing)** on played players, not the public V5 confirmed-starter card or its DNP-inclusive probability. The existing last-forecast unconditional field also ranks broadly. Do not compare either field directly to the public confirmed-starter Top 4.

The new independent `nba_v5_exact_card_audit.py` replays dated, immutable, pretip archived player-market rows and joins their final-game grades. Selection matches the live confirmed-starter gate, existing market minima, source CDF and rounded mean, displayed DNP-inclusive chance and tie-breaking. It does not use later injuries or box scores to choose the picks. Exclusions are visible rather than silently backfilled.

### Frozen last-pregame historical replay
| Cohort | N | Hit | Hit rate | Average displayed P | Brier |
|---|---:|---:|---:|---:|---:|
| Confirmed-starter Top 4 | 88 | 60 | 68.18% | 72.42% | 0.227993 |
| Confirmed-starter Top 10 | 220 | 152 | 69.09% | 66.37% | 0.220829 |
| Top 4: three-pointers made | 33 | 21 | 63.64% | 71.40% | 0.242926 |
| Top 4: steals | 36 | 26 | 72.22% | 74.83% | 0.204511 |

53 graded pregame games were matched; only 22 had any qualifying confirmed-starter selection. The remaining 31 do **not** constitute 31 proven bad slates. Historical card replay is not proof of a wager or profitable edge; 3PM and other markets can include small-sample variance. Every Top 4 selection used a valid DNP-inclusive probability; other archived source rows need separate coverage QA.

### Single precommitted probability-offset research challenger — rejected
Trained using **only previous ET dates** with a prior and shrinkage, evaluated on later dates. Its 19-game holdout had 76 original picks (52 hits, Brier 0.224741) and 76 shadow picks (52 hits, Brier 0.226864). Difference in Brier = **-0.002123**, game-cluster 95% interval [-0.004806, +0.000726]. This did **not** beat the baseline. The experiment must not be tuned to this consumed holdout.

## Original empirical model vs 3PA→3PM probability challenger
A separate, fixed shadow branch uses the same historic sampled game to draw **three-point attempts**, then samples makes from player-level Bayesian-shrunk three-point accuracy. It never uses actual target-game attempts or actual target-game shooting, and its random stream is independent. The default empirical model is bit-for-bit unchanged with the flag off.

Paired test: 117 scored historic games / 2,463 player appearances, identical prior data, known-retrospective roster, same incumbent whole-number threshold, Monte Carlo budgets and date order. The data is **retrospective**, not an independent live/forward validation.

| Measurement (lower better) | Incumbent empirical | 3PA→3PM candidate | Candidate gain |
|---|---:|---:|---:|
| Made-three fixed-event Brier | 0.237386 | **0.230601** | **+0.006785**, 95% game-cluster CI [+0.003231,+0.010340] |
| Made-three numerical MAE | **0.892919** | 0.897874 | -0.004955; interval includes zero |
| Points numerical MAE | **4.609295** | 4.626710 | -0.017415; interval includes zero |
| Points fixed-event Brier | **0.251011** | 0.251677 | -0.000666; interval includes zero |

**Interpretation:** 3PA→3PM shows a meaningful retrospective improvement in *three-point fixed-target probabilities*, but did not establish improvement in numerical means or all-market accuracy. It is not promoted. Do not rescue-tune this fixed hypothesis on the same used holdout.

## Durable changes
1. Nightly postmortem now produces an independent `exact_card_summary.json` while preserving all historical raw grades and their old summary fields.
2. Newly graded rows preserve source-confirmed starter state, model identity, actual/forecast FGA and 3PA (3PA forecast may be null where source is absent), and explicitly distinguish conditional and DNP-inclusive probabilities.
3. Immutable retrospective snapshots are never rewritten; scored games remain grade-once.
4. Both candidate implementations remain shadow-only. Any challenger is promoted only after a new, predeclared forward holdout establishes consistent improved **verified Top 10 ranking** and core probability/mean nonregression.

**Validation:** GitHub Actions workflow `nba_v5_exact_card_audit.yml` runs replay/grade contracts; `nba_v5_empirical_attempts_shadow.yml` runs the 117-game paired evaluation.
