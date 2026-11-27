# NBA direct conditional outcome head — 2026-11-27
Status: exploratory, shadow only. No promotion or production change.

## Design
Frozen pre-January rotation architecture provides roster, play/start probabilities and minutes. On January–February 2026 predictions (11,617 inferred-roster rows), learn a separate conditional statistical expectation, and conditional probability of reaching an unchanged target. Fit regularized logistic regression across original targets and neighboring integer thresholds. Compare with frozen rotation, no-budget rotation, simple probability calibration and a fixed 50/50 probability mixture. No sportsbook lines. Mean head is fitted on the same training interval as the conditional head; its fitted predictions are not cross-fitted in that interval, a potential training optimism concern. Evaluation intervals are chronologically later but already used by prior research; not independent holdouts.

## Broad retrospective ranking
| Cohort | Model | Top 4 hit | Top 4 mean P | Top 10 hit | Top 10 mean P | All fixed-event Brier |
|---|---|---:|---:|---:|---:|---:|
| Spring 338 games | Rotation | 68.71% | 76.99% | 65.03% | 71.97% | .219185 |
| Spring | Direct | 72.41% | 72.21% | 66.72% | 68.07% | .214707 |
| Current 263 games | Rotation | 69.30% | 76.62% | 65.36% | 71.73% | .199466 |
| Current | Direct | 71.20% | 71.27% | 66.88% | 67.24% | .195532 |
| Current | Fixed blend | 69.87% | 69.82% | 67.15% | 65.87% | .196531 |

Same eligible player events and unchanged original research targets, 26,901 spring and 21,973 current-season events. Top cards are diagnostic, not actual confirmed-starter frontend cards. Current conditional mean errors for rotation vs direct: points 4.81379 vs 4.81463; rebounds 1.93057 vs 1.91688; assists 1.38970 vs 1.37243; made threes .93343 vs .93223. No substantial mean gain.

## Archived original V3/V4/V5 featured-event audit
Original archive report blob 602f388a45ca1c28d55b4d3ddad249ae65b9f996; sources from previous rotation report unchanged. 25 source games; 363 matched version-event rows across overlapping games. 115 unsupported market rows, 11 missing probability, one missing player, 250 prior-day source forecasts excluded (different information cutoff), one conditional DNP. No outcome conflicts. V4 is conditional on playing, V3/V5 unconditional, so do not pool those scores. Game-cluster bootstrap 1,500 iterations; intervals approximate.
| Source | N | Original Brier | New Brier | 95% CI gain | Original MAE | New MAE |
|---|---:|---:|---:|---|---:|---:|
| V3 | 147 | .238170 | .235024 | [-.01757,.02438] | 1.86709 | 1.82017 |
| V4 | 148 | .238058 | .238579 | [-.01512,.01362] | 1.44362 | 1.43399 |
| V5 | 68 | .230141 | .203173 | [-.00446,.05360] | 1.07584 | 1.00623 |

Current market assignments only:
| Market/source | N | Original Brier | New Brier | 95% CI gain |
|---|---:|---:|---:|---|
| Points V5 | 0 | unavailable | unavailable | unavailable |
| Rebounds V3 | 37 | .237348 | .251057 | [-.06082,.04187] |
| Assists V4 | 45 | .273233 | .268016 | [-.02093,.03002] |
| Threes V3 | 60 | .224048 | .219395 | [-.01518,.02624] |

This is a matched original-target audit of selected archived model rows, NOT a full replay of the current specialist board or its ranking, and does not establish statistical superiority. Historical raw game date served as a tip proxy; exact provider completion/availability times are unavailable.

## Distribution validity
Across 167,648 local integer-threshold monotonicity checks, one violation. The direct outcome head is not a certified CDF. Do not deploy, publish, simulate as a distribution or assert full calibration based on group mean agreement. Future work needs monotone full support, distribution normalization, cross-fitted head, actual confirmed-lineup data, exact frozen specialist event comparison and genuinely new temporal holdout. Do not tune then call the same consumed cohort independent.

Scripts executed as research functions in isolated JS runtime; Node wrappers saved for reproduction, not separately tested:
- nba/nba_rotation_direct_distribution_research.mjs
- nba/nba_rotation_specialist_fixed_event_research.mjs

Production main, workflows, frontend and historical receipts unchanged.
