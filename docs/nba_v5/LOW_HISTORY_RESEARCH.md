# NBA V5 low-history NBA player simulation — November 6, 2026

**Status: RESEARCH BUILT, promising; NOT PROMOTED.**
The current V5 model remains unchanged: \`low_history_rotation=false\`.

## What the actual bug was

Before this change, \`nba_v5_backtest.team_input()\` refused players
with fewer than 5 completed NBA box scores or lacking a recorded
substitution-based rotation. That systematically excludes early-career,
recently promoted, traded/new-role and rare bench players from a fully
coherent possession simulation. Their absence can also overallocate
simulated opportunities to established teammates.

## New bounded, dated-only research path

- A player with 1–4 **actual earlier** NBA appearances may receive a
  heavily league-shrunk usage/shooting prior. **Zero earlier boxes: no
  invented NBA skill estimate.**
- Build six common 24-segment playing-time shapes from previously
  completed NBA play-by-play: starter/bench × low/mid/high real minutes.
  The historical pool contained **27,243 player-game floor patterns**.
- The pregame V3 conditional-minutes estimate can inform the target,
  but only for a player already on the actual current roster and only
  where V3 has that source.
- Missing player-specific shot locations use an earlier-league
  distribution. They cannot disable the reliable historical zone
  profiles of other players.
- Both arms still conserve 240 regulation team minutes, player
  scores sum to simulated team totals, and OUT players never score.
- Nothing in the published forecast changes with
  \`low_history_rotation=false\`.

## Retrospective paired result, same original forecast events

The 70 selected March-onward games yielded 68 complete paired games
and 1,391 original V5 player-games. A candidate with low-history players
produced **54 additional player-games**, all included in the report,
with a **4.942 points MAE** and **1.648 rebounds MAE** on their own
first-appearance estimates. Those are absolute errors, **not** proof
of superiority over another baseline for that cohort.

All original incumbent whole-number probability thresholds stayed
fixed. Same as-of *historical* source windows and simulation seeds,
500 draws per game and 800 game-cluster bootstrap replicates:

| Market / metric | Champion | Challenger | Error reduction (positive better) | 95% cluster interval |
|---|---:|---:|---:|---|
| Minutes MAE | 5.406065 | 5.275327 | +0.130738 | [+0.050210,+0.247076] |
| Points Brier (V4/V5 blend) | 0.250121 | 0.248059 | +0.002062 | [+0.000191,+0.004184] |
| Assists Brier (blend) | 0.244298 | 0.241764 | +0.002534 | [+0.000802,+0.004619] |
| Rebounds Brier (blend) | 0.249169 | 0.248515 | +0.000653 | [-0.001198,+0.002971] |
| Made threes Brier (blend) | 0.236113 | 0.235336 | +0.000776 | [-0.000297,+0.001987] |
| Steals Brier (V5) | 0.237673 | 0.237531 | +0.000142 | [-0.002244,+0.002798] |
| Blocks Brier (V5) | 0.241779 | 0.243571 | -0.001792 | [-0.005406,+0.002402] |
| Turnovers Brier (V5) | 0.235081 | 0.231087 | +0.003994 | [-0.000454,+0.009862] |

The points, assists and minutes improvements are encouraging.
**No auto-promotion**: the 68 historical games were already used for
earlier feature decisions, so this is not an untouched proof of pregame
performance. Both models also know the retrospective actual participants;
a real before-tip roster and availability forecast is harder.

Next acceptance evidence: freeze separate actual pretip forecasts on
future games, record every excluded/added player and DNP, compare
original numerical events and conditional means with identical source
captures, and enforce aggregate calibration/interval coverage gates.

Code: \`nba/nba_v5_cold_start.py\`,
\`nba/nba_v5_backtest.py --cold-start-trial\`.
CI: \`.github/workflows/nba_v5_cold_start.yml\`.
