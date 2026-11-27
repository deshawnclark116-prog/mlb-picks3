# NBA rotation/opportunity research — 2026-11-27
Status: SHADOW ONLY. Production not changed. No promotion.
 
## Source and procedure
- 1,230 raw 2025-26 games, 263 raw 2026-27 games; 1,493 total.
- 2025-26 compressed source blob cff2db095a803105e9a43c34e797e791a9e93b23; current-season raw blob 1c1dd648fa392c124699f2870f71780a5c12a30f.
- Fit 9,310 inferred-roster player-game rows dated before 2026-01-01; evaluation Jan-Feb, March-April and current season. Same UTC-date history is withheld. Source completion timestamps are not independently verified; this is retrospective, not a certified pretip replay.
- Roster inferred from prior 10 team games and last-known team, not today's final roster. Actual current starter, minutes and stats are labels only. No sportsbook lines.
- Three fitted components: participation probability, conditional starting probability, conditional minutes. Role-conditioned per-minute skills and empirical historical outcomes give fixed-event chances. Expected minutes are scaled by a bounded team budget, not an exact simulated rotation.
- Script: nba/nba_rotation_opportunity_research.mjs. Executed research function in isolated JS runtime; Node wrapper saved for replay, not separately executed. Pin source blobs to reproduce this exact run.

## Results (baseline = smoothed recent-10 participation and past player box empirical probabilities)
| Cohort | Games | P(play) baseline | P(play) model | Fixed event Brier baseline | Fixed event Brier model |
|---|---:|---:|---:|---:|---:|
| Jan-Feb | 401 | .163351 | .132727 | .235754 | .223056 |
| Spring | 338 | .168290 | .147933 | .229677 | .219185 |
| Current | 263 | .179657 | .129795 | .216336 | .199466 |

Current: 21,973 fixed player-market events; 5,414 of 5,865 actual played player-games recovered (92.3%). 451 missing, not counted as accurate forecasts. Current Top 4 historical baseline 68.54%, challenger 69.30%; Top 10 61.71% vs 65.36%, equal event targets and number of picks. No verified starter roster; these are diagnostic ranks, not the real live featured cards. Challenger mean Top 10 chance 71.73%, observed 65.36%; still overconfident.

Current conditional minutes MAE: last-5 5.1569, learned 5.1520, bounded budget 5.2439. Budget did not improve current minutes MAE. No budget variant current fixed-event Brier .198954; preserve as research, not selected post hoc.

## Archived V5 original fixed-target comparison
Seven grade files inspected, six games matched to raw history, 517 comparable events, 453 played. Excluded one unavailable game, 12 unavailable players (market rows), 113 invalid/missing original targets or probabilities, 2 source outcome conflicts. Original V5 thresholds unchanged.
| Market | N | V5 Brier | Challenger Brier | V5 conditional MAE | Challenger conditional MAE |
|---|---:|---:|---:|---:|---:|
| Points | 153 | .238055 | .232305 | 4.3077 | 4.2410 |
| Rebounds | 147 | .245965 | .234519 | 1.7519 | 1.8260 |
| Assists | 126 | .244911 | .226820 | 1.3012 | 1.3370 |
| Threes | 91 | .247962 | .222674 | 1.2223 | 1.2110 |
| Pooled | 517 | .243719 | .229903 | 2.2678 | 2.2761 |

Small matched V5 cohort: 5.67% pooled Brier reduction, but no game-cluster significance established. Not equivalent to V5/V3/V4 production specialists. Participation Brier .101848 -> .094971 (153 points rows); minutes MAE 4.5253 -> 4.4179 (129 played points rows).

## Decision
Do not promote. Availability/role probability architecture is promising; numerical projections, exact minutes budget, starter evidence, full live specialist comparison, timestamped availability, calibration and exact same-target top-card evaluation remain unresolved. Freeze this hypothesis; additional tuning on these consumed cohorts is not independent evidence. No change to production, deployment, cron, UI or historic records.
