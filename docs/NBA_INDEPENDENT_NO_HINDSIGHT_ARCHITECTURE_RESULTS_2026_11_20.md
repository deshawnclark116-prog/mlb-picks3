# Independent NBA architecture tournament — 2026-11-20 complete numerical study

**Not a new production champion.** A genuinely separate model experiment
found that direct gradient-boosted stat projections consistently beat a
recent-five-game average on played-player points, rebounds, assists and
three-pointers, even when its features used only PRIOR-DATE games.

This was a historical as-of reconstruction based on actual player-game boxes,
not an original-time-frozen daily-board prediction. It is conditional on
actual player participation and the eventual team assignment. It cannot
determine who plays, actual projected minutes, live sportsbook hit
percentages, or comparison against the actual production V4 on identical
firstseen lineups. 2026 spring and 2026 fall have previously been examined
by related research and are NOT pristine promotion holdouts.

Independent PR: https://github.com/deshawnclark116-prog/mlb-picks3/pull/140
Successful raw actual data workflow:
https://github.com/deshawnclark116-prog/mlb-picks3/actions/runs/44812767498

## Predeclared architectures

- **Baseline**: preceding five played-game stat means
- **Direct learned**: histogram gradient boosting on exclusively historical
  minutes, starter rate, usage, per-minute production, team pace and
  opponent last-known allowed stats.
- **Minutes × rate**: independently predict minutes with another learner,
  multiply by Bayesian-shrunk stat production per historical minute.
- Source builder enforces a complete SAME-DAY barrier: no team's
  or player's box from the target game/day is visible to the feature
  extractor. Synthetic future-roster and 100-point outcome mutation
  tests confirm same pregame feature vector.

## Honest chronological split

- Train original games through 2025-12-31.
- Choose architecture ONLY on 2026-01-01 to 2026-02-14, n=6,880
  player observations PER market.
- Fit on train+validation for diagnostic 2026 Feb15–Apr14,
  n=8,558 PER market; and 2026-27 current-season through
  November 20, n=4,779 PER market.
- Same exact player/game/market rows for all arms, no thresholds or
  sportsbook odds involved.

## Validation-only architecture selection

| Market | Baseline MAE | Direct learned MAE | Minutes × rate MAE |
|---|---:|---:|---:|
| Points | 4.7086 | **4.5257** | 4.5634 |
| Rebounds | 1.9849 | **1.9219** | 1.9276 |
| Assists | 1.3958 | **1.3473** | 1.3641 |
| Threes made | 0.9473 | **0.9113** | 0.9242 |

Direct learned wins all four on the selection period. However its
player-game participation cohort is retrospectively selected from actual
boxes, so this is a *conditional* model selection only.

## Already-consulted 2026-27 separate diagnostic

| Market | n | Baseline MAE | Direct learned MAE | Minutes × rate MAE |
|---|---:|---:|---:|---:|
| Points | 4,779 | 4.9818 | **4.8056** | 4.8652 |
| Rebounds | 4,779 | 1.9939 | 1.9741 | **1.9355** |
| Assists | 4,779 | 1.4434 | **1.3883** | 1.3950 |
| Threes made | 4,779 | 0.9504 | **0.9271** | 0.9297 |

Same-game block-bootstrap 95% improvement interval for direct learned
over baseline: points [+0.1175,+0.2352], rebounds [-0.0066,+0.0445],
assists [+0.0382,+0.0712], threes [+0.0115,+0.0343]. The rebounds
interval includes zero; minutes×rate instead did better on that market
[+0.0340,+0.0806] in this already-consulted diagnostic. DO NOT choose
a new architecture based on which one wins in this test.

## Meaning and next research

This is the first full independent head-to-head outside the V2→V7 patch
family. The results disprove a universal assumption that a detailed
joint simulator is necessary for lowest next-player-stats MAE.
But this experiment has not beaten the PRODUCTION V4 champion on a
shared genuinely firstseen, same-roster, same-scheduled-game distribution.

**Decision: no production change or new bet percentage from this study.**
Carry direct learned architecture forward as a preregistered
potential challenger for future firstseen shadow forecasts and measure
(1) player-selection/participation log loss, (2) same-player numeric MAE,
(3) game clustered paired uncertainty, (4) distributional calibration,
(5) V3/V4 incumbent on the same original as-of sources.

The CI contract tests verify no future-day player or opponent information,
and the real model-training workflow includes the complete 2025 and 2026
numbers with all failed arms; there is no cherry-pick promotion.
