# NBA V5 opponent-shot-profile-conditioned coaching rotations — 2026-11-06

**Result: implemented and falsified, keep OFF.** No sportsbook input.

## Free evidence

Existing verified ESPN completed-game box scores and game play-by-play:
- Opponent's 3PA / FGA ratio from **8–15 previous games**, excluding the target game and any future results.
- Player's actual 24 two-minute court-occupancy segments learned from independently validated five-man substitution history.
- **1,171** completed games with usable opponent shot-style profiles; **25,141** player-game observed segment rotations; **812** distinct team-player histories.
- The league-comparison hypothesis was one precommitted grouping: prior-opponent threes ≥0.40 vs below 0.40. This is **not** true switching/drop/help defense and does not identify an opposing defender.

## Candidate

Per player, at least 16 earlier eligible game segment patterns and at least five in the matching style group; shrink toward all-opponent rotation pattern by 10 pseudo-games and clip effects to ±14%. Apply only to that player's on-court probability in each two-minute stretch; the 240-minute team-wide conservation and all scoring accounting remain unchanged.

The hypothesis was: a team may systematically stagger/close different players against opponents with greater three-point shot volume. It is observational and confounded by personnel, schedule, competition and coaches.

## Paired actual champion comparison

70 selected games, 68 with complete historical replay, 1,391 original player-games, 500 identical-seed simulations per arm. Fixed **champion's original rounded** reach target; 800 game-cluster bootstrap replications. Positive is an improvement in Brier/MAE.

| Metric | Champion | Candidate | Error reduction | 95% cluster interval |
|---|---:|---:|---:|---:|
| Minutes MAE | 5.406065 | 5.412345 | **-0.006280** | [-0.032555,+0.017921] |
| Points Brier | 0.250121 | 0.250047 | +0.000074 | [-0.000713,+0.000886] |
| Rebounds Brier | 0.249169 | 0.249450 | -0.000281 | [-0.001096,+0.000514] |
| Assists Brier | 0.244298 | 0.244410 | -0.000112 | [-0.001113,+0.000757] |
| Threes Brier | 0.236113 | 0.235955 | +0.000157 | [-0.000765,+0.001135] |
| Steals Brier | 0.237673 | 0.237728 | -0.000056 | [-0.002125,+0.001936] |
| Blocks Brier | 0.241779 | 0.240805 | +0.000974 | [-0.002817,+0.004740] |
| Turnovers Brier | 0.235081 | 0.233615 | +0.001467 | [-0.000676,+0.003499] |

**No outcome provides reliable outperformance** on this explored historical sample; minutes and main rebounds/assists drift slightly worse. No activation and no rescue tuning on the same used data. Matchup-aware coaching still needs stronger actual lineup, opponent personnel, action-level and defensive-scheme observations or an untouched genuinely different hypothesis.

Code: `nba/nba_v5_matchup_rotation.py`, `nba/nba_v5_backtest.py --matchup-rotation-trial`, tests `tests/test_nba_v5_matchup_rotation.py`, CI `.github/workflows/nba_v5_matchup_rotation.yml`. The published feature switch remains `matchup_rotation=false`.
