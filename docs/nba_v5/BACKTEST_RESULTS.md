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
