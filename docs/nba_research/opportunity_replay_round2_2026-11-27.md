# NBA opportunity research continuation — November 27, 2026

Research-only. No live forecast, probability, threshold, or frontend changes.

## Data and evaluation boundaries

- Complete 2025–26 regular-season box archive: 1,230 games, blob `cff2db095a803105e9a43c34e797e791a9e93b23`.
- 2026–27 current box archive: 270 games through the November 26 UTC slate, blob `d5ef886471d41e6f8c4d087d4c684121e5a432bf`.
- The nonlinear trial fits on 23,122 eligible played player-games from 2025–26. The next-season raw evaluation covers 5,498 eligible played player-games, using only prior results for features. The paired archive comparison is 307 played player-games across 15 fixed November games (IDs 401909296–300, 308–312, 321–325).
- Ordinary simulated historical issue time is six hours before tip. All feature history must precede issue time by another six hours. Archived comparisons use their actual original issue time, with the same six-hour history lag. This is a conservative proxy for box completion timestamps, not a timestamped source receipt.
- Candidate roster membership is inferred exclusively from recent prior team boxes and previous team identity, not the target box; scoring is conditional on actually playing and does not cover DNPs, cold-start players, traded players before their first observed new-team box, or complete roster prediction. All metrics are MAE, not bet hit rates or full-distribution calibration.
- Dates have already been used by project research. Do not call this an untouched holdout. Comparisons are against V5, not all four production specialist components.
- The initial linear experiment grouped by target game UTC date, which can include information unavailable at an archive's earlier forecast issue time. Its 15-game comparison is superseded and cannot authorize promotion.

## Raw nonlinear count/rate head

Runnable research script: `node nba/research_opportunity_replay.mjs`. Connector-side equivalent algorithm executed on the above exact blobs. The checked-in runner adds fail-closed identity and timestamp checks; it has not yet been independently executed from a repository checkout in this environment.

Features: EW historical minutes, start rate, per-minute opportunities and stat rates over 1/5/25 games, trend, recent participation, rest, venue, team and opponent opportunities/pace, recent absent-teammate minutes and shots, and competition. Quantile-bin residual boosting, 45 depth-two trees per head, 12 bins, 180 minimum split samples, learning rate 0.12. Compare direct count learning and per-minute rate learning multiplied by independently forecast minutes. Rate training weights minutes with cap 40/24. No test outcomes enter model fitting.

### Next-season raw evaluation (5,498)

| Target | Recent weighted baseline | Direct count | Learned rate × learned minutes |
|---|---:|---:|---:|
| Minutes | 5.0310 | 4.9533 | 4.9533 |
| FGA | 2.9000 | 2.8474 | 2.8306 |
| Points | 4.8973 | 4.7707 | 4.7402 |
| Rebounds | 1.9791 | 1.9079 | 1.8978 |
| Assists | 1.4261 | 1.3766 | 1.3694 |
| Threes | 0.9631 | 0.9352 | 0.9310 |

### Paired original V5 forecasts (307)

| Target | V5 | Direct count | Independent rate × minutes | Rate × V5 minutes | Half-count blend |
|---|---:|---:|---:|---:|---:|
| Minutes | 4.6626 | 4.6268 | 4.6268 | 4.6268 | 4.5968 |
| FGA | 2.7045 | 2.7444 | 2.7524 | 2.7321 | 2.7009 |
| Points | 4.5239 | 4.6374 | 4.6465 | 4.5820 | 4.5609 |
| Rebounds | 1.8445 | 1.8519 | 1.8277 | 1.8393 | 1.8352 |
| Assists | 1.2955 | 1.3282 | 1.3116 | 1.2986 | 1.3040 |
| Threes | 0.9060 | 0.9304 | 0.9326 | 0.9260 | 0.9151 |

Reject promotion. Beating a simple weighted recent baseline does not establish superiority over V5 or the specialist system. No post-hoc cherry-picking of marginal minutes or rebounds improvements.

## Teammate availability similarity

18 immutable first forecasts, IDs 401909308–325. History restricted to UTC dates earlier than the original forecast UTC date. Current-season raw prior boxes only. Each player needs at least six same-team previous played games and four known teammate availability inputs; teammate membership comes from past teams. For each of the last 20 same-team played games, apply exponential recency 0.90 per game and lineup similarity exp(-4*distance), where distance is the pregame P(active) mismatch weighted by each teammate's past shot volume. Estimate rate difference from recency-only history; scale by original expected minutes and shrink by effective sample size/(effective sample size+8). Retain original V5 forecasts otherwise. No target outcome used to generate the adjustment. Conditional-on-playing matched scores: 354 player-games.

| Target | V5 | Similarity adjustment |
|---|---:|---:|
| FGA | 2.6164 | 2.6056 |
| Points | 4.4489 | 4.4184 |
| Rebounds | 1.8246 | 1.8179 |
| Assists | 1.2969 | 1.2937 |
| Threes | 0.9117 | 0.9116 |

Points MAE changes: November 20 cohort 4.7324 -> 4.7232 (111); November 24–25 cohort 4.3194 -> 4.2792 (243). Not meaningful enough to promote; no evidence of calibrated probabilities. Earlier UTC date alone is a conservative date gate, but exact completion receipts unavailable for this trial.

## Team budget diagnostic and attempted repair

Same 18 games, 36 team-games; raw history ends at least six hours before the original issue. Map archived players to their most recently observed prior team. Require at least 90% of the previous five games' player-minute coverage in the archive and at least eight expected players. 28 team-games meet that gate (292 played player-games).

For those teams, sum of original p_active × conditional expected minutes averages 215.53 versus 240 regulation minutes. Sum of p_active × conditional expected FGA averages 76.20 versus 87.61 observed prior-five team FGA. This is a modeled-coverage discrepancy, not proof that every missing minute or attempt belongs to the archived players. The full V5 team simulation arrays were not replayed.

Test limited minute redistribution (max 20 missing minutes/team, limited to 15% of each eligible player's forecast and 40-minute cap, probability-weighted; p_active >=0.75), limited shot redistribution (half the gap to prior-five team shots, gap capped at ±8, proportional to eligible player's expected FGA), and both.

| Target | V5 | Minutes repair | Shots repair | Combined |
|---|---:|---:|---:|---:|
| Minutes | 3.9748 | 4.2828 | 3.9748 | 4.2828 |
| FGA | 2.5899 | 2.6222 | 2.5785 | 2.7261 |
| Points | 4.2709 | 4.4300 | 4.3454 | 4.6075 |
| Rebounds | 1.8094 | 1.8798 | 1.8094 | 1.8798 |
| Assists | 1.2619 | 1.2695 | 1.2619 | 1.2695 |
| Threes | 0.8910 | 0.9206 | 0.9048 | 0.9446 |

Reject all budget patches. Need distinguish forecast participation errors, roster incompleteness and conditional workload errors before changing team conservation. No actual future lineup membership or target outcome used in repairs.

## New code-path finding (not a model performance claim)

`docs/nba_v5_latest/features.json` has empirical_game_projection=true and tracking_opportunity_role=false. In `nba/nba_v5_forecast.py`, the tracking adjustment changes native team profile rate fields before native simulation, whereas the empirical engine subsequently generates its own history-based worlds. Inspection of `nba/nba_v5_empirical_stat_engine.py` shows that it consumes prior player boxes, roster, p_play, expected starter, minutes caps, pace and return modifiers; its stat samples do not consume the adjusted profile opportunity rates. Consequently flipping the old tracking switch alone is not a validated way to add touches, drives, potential assists and rebound chances to the current empirical champion. The external completed-season tracking source is private to the runner; raw tracking files were not available in the repository connector, and no current-season licensed tracking data were obtained.

This is a genuinely separate research direction: implement and validate a tracking-aware empirical head, with source-time snapshots, current-team joins, fallback coverage and separate opportunity/efficiency models. First establish whether historical tracking adds information beyond past box rates. Do not tune on these reused November samples; require a new paired forward test at identical original thresholds, all eligible players, and specialist benchmarks. No change to production until proven.

## Decision

All tested challengers remain rejected or research-only. No substantial verified improvement this round. Preserve the incumbent and the negative experiments; do not market them as breakthroughs.
