# NBA V6: accuracy-first independent research program

Production is frozen. No market odds, no target lowering or selective deletion of misses. V6 must outperform the actual market-specific incumbent, not a weak straw baseline. Every prediction has an as-of time, eligibility, conditional distribution, availability probability, source lineage, model hash and immutable final grade.

## Architecture and research sequence
1. Source ledger: historical box/possession data, verified pregame rosters, injury/status publication times, starters, coach/team regime, lineup stints, rest/travel, opponent scheme and actual tracking. Missing is explicit. Reconstruct historical substitution stints and reconcile five players on court per team; no false tracking claims.
2. Availability and minutes: active/starting/rotation states, teammate absences, minutes restriction, coaching patterns, foul/blowout/OT scenarios. Train on pregame eligible rosters, not actual participants. Enforce 240 expected regulation player-minutes per team in the future joint simulator.
3. Opportunity heads: attempts by shot type, free throws, assist opportunities, rebound opportunities and turnovers, conditional on role, opponent and minutes. Separate skill from opportunity and estimate uncertainty.
4. Competing direct statistical, opportunity-factorized and possession-simulation specialists; select on inner chronological validation by market, not on final holdout. Use coherent simulation with shared game and lineup states only once constituent models demonstrate predictive improvement.
5. Distribution calibration: conditional on play and including DNP, exact same original event thresholds, reliability, Brier/log loss, count error, interval coverage, top4/top10 at equal selection counts. Rank by calibrated model probabilities, never sportsbook lines.
6. Promotion: compare paired first-seen and final confirmed pretip forecasts against exact production champion and simple baselines. Report clustered uncertainty by game, subgroup errors and missing rows. Freeze model/parameters before untouched prospective games. Require nonregression in calibration and high-confidence board, meaningful MAE/Brier lift, no availability or coverage regression. No promotion from the first retrospective experiment.

## Implemented initial experiment
nba/nba_v6_foundation.py trains direct and opportunity heads plus an availability/minutes model on older box data, calibrates distributions on a disjoint later historical period, compares against frozen archived forecasts, and includes the recent-average baseline. The current challenger is intentionally not a full lineup simulator. Historical candidate rosters use past-four-game participants; evaluation uses frozen archived roster, not future outcomes. Future certified starters, tracking and stints are separate source-conditioned stages. November archives have already been studied, so results are exploratory rather than an untouched prospective holdout.

## Previously rejected
The six-game confidence experiment degraded Top 4 (24/36 to 23/36) and the simple minutes correction worsened MAE (5.00 to 5.29 minutes) on nine games. Neither is deployed. Actual-minutes diagnostic demonstrated opportunity for better minutes modeling, not an attainable forecast. Existing hoopR source acquisition is not verified and completed-season aggregate is not current-game tracking.
