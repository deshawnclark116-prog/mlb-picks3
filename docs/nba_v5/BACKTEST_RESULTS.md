# NBA V5: what the tests showed

Test: `python -m nba.nba_v5_backtest` (chronological; every learned number from earlier dates only). 150 randomly chosen games
from Jan to Nov 2026, 3,133 player-games, scored on players who played, against V4 (the model that was live) and a plain
recent average. Availability (who was out) is taken from who actually played, exactly as in V4's own test, so this is like for like but
slightly generous to every model.

## Average miss (lower is better)
| Stat | Recent average | V4 | V5 simulation | **V4+V5 blend** |
|---|---|---|---|---|
| Minutes | 5.221 | **4.962** | 5.016 | – |
| Points | 4.799 | 4.670 | 4.683 | **4.614** |
| Rebounds | 1.888 | 1.854 | 1.866 | **1.834** |
| Assists | 1.434 | 1.403 | 1.439 | **1.396** |
| Threes | 0.939 | 0.935 | 0.939 | **0.933** |
| Steals | 0.740 | – | **0.718** | – |
| Blocks | **0.515** | – | 0.526 | – |
| Turnovers | 0.952 | – | **0.926** | – |

## Probabilities, same event (chance of reaching the blended rounded projection; Brier, lower is better)
| Stat | V4 | V5 | Blend | Blend vs V4 (95% interval) | Blend vs V5 |
|---|---|---|---|---|---|
| Points | 0.2561 | 0.2536 | **0.2500** | -0.0060 [-0.0087, -0.0036] | -0.0035 [-0.0058, -0.0013] |
| Rebounds | 0.2496 | 0.2563 | **0.2488** | -0.0007 [-0.0035, +0.0018] | -0.0074 [-0.0100, -0.0051] |
| Assists | 0.2471 | 0.2537 | **0.2449** | -0.0022 [-0.0064, +0.0013] | -0.0088 [-0.0123, -0.0053] |
| Threes | 0.2389 | 0.2392 | **0.2374** | -0.0015 [-0.0030, -0.0000] | -0.0017 [-0.0033, -0.0001] |

The blend is clearly better than V4 on points and threes, and not worse on rebounds and assists. The simulation alone is not clearly better
than V4 (V4 is significantly better on assists), which is why the published forecast is the blend and the simulation alone is used only for
steals, blocks and turnovers.

## Honest percentages
Raw percentages matched results within 1 to 2 points (stated vs actual: points 0.502/0.502, rebounds 0.554/0.541, assists 0.568/0.557,
threes 0.617/0.612). A correction fitted on the earlier 60% of games made the later 40% slightly worse on every stat, so none is applied.

## Whole-game consistency (team totals vs real, 30 games)
Shots 1.01x, threes made 1.00x, turnovers 0.99x, assists 0.98x, steals 0.96x, blocks 0.95x, rebounds 0.98x (the simulation plays only the
modeled players, so points and fouls read about 3 to 5% high against box sums that exclude unmodeled bench players). Found and fixed along the way:
box scores leave out about 6.5 team offensive rebounds per team per game, which made box-score pace read about 6% too high; the opponent-defence
adjustment was applied backwards in an early run.

## Not proven yet
Forward results. Every original forecast is frozen before tip-off (`docs/nba_v5_archive/first`) and graded nightly
(`nba_v5_postmortem.py`). Until enough games are graded, treat all percentages as estimates, not proven betting probabilities.

## Second round: pieces added from play-by-play and availability
110 held-out games, 2,299 player-games, each piece switched off in turn (paired, bootstrap by game):

| Piece | Result |
|---|---|
| Individual defenders' on-court effect | no clear effect on any stat |
| Shot timing (transition / late clock) | no clear effect; rebounds slightly worse |
| Team-by-team rotation (coach proxy) | no clear effect |
| Timeouts | no clear effect |
| Joint availability (teammates sit together) | better prediction of how many regulars are out: +0.031 log-likelihood per team-game, 5.2 standard errors, 1,720 team-games |

Only the last is on in the published forecast. The other four are in the code and switchable (`docs/nba_v5_latest/features.json`).

## Third round: the four play-by-play pieces on 300 held-out games (6,245 player-games)
Each piece switched off in turn, paired bootstrap by game. Positive means removing it made things worse.

| Piece | Clear gain | Clear harm | Now |
|---|---|---|---|
| Team-by-team rotation | assist Brier +0.0013, made-three Brier +0.0014 | none | **on** |
| Timeouts | assist Brier +0.0011, made-three Brier +0.0015 | none | **on** |
| Individual defenders' on-court effect | assist Brier +0.0012 | none | **on** |
| Shot timing (transition / late clock) | none | none | off |

The gains are small and measured on four stats with several pieces, so some of this could be luck; every piece stays switchable and the nightly grading of
live forecasts is the real check.


## November 6, 2026: new role-change detector — SHADOW ONLY

Source: `python -m nba.nba_v5_change_audit --games nba/data/nba_v4_games_2025_26.jsonl.gz --games nba/data/nba_v4_games_2026_27.jsonl --from-date 2026-10-20`, run by the NBA V5 quality workflow. All observations used to detect a change precede the test game date. The table concerns flagged player-stat instances on their next observed game.

| Flagged opportunity | Next games | Older-window baseline MAE | Recent shrunken estimate MAE | Improvement |
|---|---:|---:|---:|---:|
| Minutes | 390 | 8.1069 | 6.6417 | +1.4652 |
| Field-goal attempts per 36 | 178 | 4.5236 | 3.5829 | +0.9406 |
| Assists per 36 | 150 | 2.1091 | 1.8985 | +0.2106 |
| Three attempts per 36 | 124 | 3.0007 | 2.7137 | +0.2871 |
| Rebounds per 36 | 107 | 2.6876 | 2.7168 | -0.0293 |
| Turnovers per 36 | 79 | 1.9098 | 2.0026 | -0.0928 |

**Research boundary:** This is one-game-ahead error against a simple older-window baseline, **not** an incremental comparison against the existing V5 simulation, V4/V5 blend, or a separately tuned recent-average champion. Metrics are correlated within the same players/games; no paired bootstrap confidence intervals were calculated here. The event rate of a detector flag is also selected on its input history. Consequently **none of these changes is yet promoted into the live V5 forecasting model**. Rebounds and turnovers were negative on the flagged cohorts even under the weak baseline comparison.

Before promotion, run a strictly chronological paired V5 baseline-vs-role-adaptive simulation with identical games, ex-ante availability, and equal simulation budgets, and require a meaningful, replicated improvement in numerical error and event probability calibration without damage to other markets. Preserve untouched seasons for final confirmation.

## November 6: actual champion-vs-role trial (no promotion)

Source: `nba_v5_role_trial.py`, `nba_v5_role_trial_score.py`, and the automatic `nba_v5_role_trial.yml` CI job on PR #81. Precommitted candidate: detector-flagged minutes, FGA/36, AST/36, and 3PA/36 nudged 35% toward the shrinkage estimate, bounded ±20% relative to V5's existing rate. Same game roster, same simulator seed and simulation count (500 per game) for both arms. Chosen 70 games after March 1, 2026; 68 met both models' data requirements, yielding 1,391 player-games.

Score comparison is made at **the incumbent model's own whole-number target** and uses Brier error for P(reaching that exact number), with 800-replication game-cluster bootstrap confidence intervals. Positive reduction means the challenger was better.

| Metric | n player-events | Champion | Role trial | Error reduction | 95% game-cluster interval |
|---|---:|---:|---:|---:|---|
| Minutes MAE | 1391 | 5.372679 | 5.356728 | +0.015951 | [-0.016042, +0.044470] |
| Points Brier (V4+V5 blend) | 1185 | 0.250178 | 0.250313 | -0.000135 | [-0.000954, +0.000622] |
| Rebounds Brier (blend) | 1102 | 0.249056 | 0.248570 | +0.000486 | [-0.000484, +0.001374] |
| Assists Brier (blend) | 962 | 0.243965 | 0.243154 | +0.000811 | [-0.000109, +0.001729] |
| Made threes Brier (blend) | 1071 | 0.235404 | 0.235425 | -0.000020 | [-0.001064, +0.000991] |

Candidate adjustments across 68 games: minutes 216 player appearances, FGA/36 86, AST/36 78, 3PA/36 64 (multiple signals may coincide). Minutes improvements were practically negligible. Every CI includes zero, and the key points/threes Brier differences are negative. **Reject promotion**; retain prior V5/V4 weights, distributions, and simulator untouched. Do not perform rescue tuning against this used evaluation data. A future role-change model needs genuinely new evidence or a predeclared holdout with substantially different structure.

**Limit:** both simulations share the retrospective actual player roster, just like earlier V5 research. This isolates the incremental skill/role hypothesis but is not an honest test of knowing who would participate before tipoff. The fixed rounded event and clustered intervals prevent artificially easy threshold substitutions and pseudo-independent teammate samples.

## November 6: five-man lineup interactions — research-only

Full source-integrity and paired results: [LINEUP_PAIR_RESEARCH.md](LINEUP_PAIR_RESEARCH.md).

- 1,283 of 1,351 ESPN play-by-play games (94.97%) were reconstructable with strict five-on-court validation after correcting 12,405 event-team annotations from unambiguous on-court athlete IDs. The remaining 68 failed games were excluded.
- A bounded, shrinkage-based ON/OFF teammate-opportunity model for shooter, assister, offensive rebounder and defensive rebounder selection ran as a **disabled-by-default feature flag** against the unchanged V5/V4 champion.
- Fixed-target, clustered 68-game retrospective testing (1,391 player-games) showed a **0.001545 point-Brier reduction**, 95% interval [+0.000720,+0.002410]. Rebounds and assists did not improve; threes were inconclusive.
- A second test identified a deterministic-replay bug in unordered player-roster set iteration; this was fixed by stable sorting and verified across distinct Python hash seeds before freezing the above results.
- **No promotion**: this is an exploratory reused retrospective sample, not independent prospective proof. No sportsbook inputs. Production `lineup_pairs=false`.


## November 6: shot-execution-style hypothesis failed, OFF

The player/zone shot-family experiment from 240,495 parsed ESPN shot events did not yield a significant improvement in points, assists, rebounds or threes. On 68 identical held-out historical games and 1,391 player-games, points Brier improvement was +0.000595 (95% game-cluster interval [-0.000158,+0.001361]), but blocks Brier worsened by 0.003782 (interval of error improvement [-0.006866,-0.001090]). This branch was **not promoted and must not be rescue-tuned** on this reused sample. See [SHOT_STYLE_RESEARCH.md](SHOT_STYLE_RESEARCH.md).


## November 6 — game-flow possession cadence not promoted

From 1,351 prior ESPN PBP games, V5 learned a bounded, normalized 24-segment possession timing shape. Paired 68-game historical replay compared same roster/seed and original whole-number thresholds; points Brier reduction +0.000047 (95% game-cluster [-0.000811,+0.000877]), assists +0.000280 ([-0.000852,+0.001389]), steals -0.001199 and blocks -0.002376. No reliable gain. **game_flow=false** remains. [Complete research](GAME_FLOW_RESEARCH.md).
