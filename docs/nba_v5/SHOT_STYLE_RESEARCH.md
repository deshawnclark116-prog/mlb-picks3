# NBA V5: shot-execution style research — November 6, 2026

**Research decision: DO NOT PROMOTE.** The current V4+V5 production champion is unchanged, and `shot_style=false` in `docs/nba_v5_latest/features.json`.

## Source audit

ESPN completed-game play-by-play `nba/data/nba_v5_pbp_2025_26.jsonl.gz` and `nba/data/nba_v5_pbp_2026_27.jsonl.gz` contain the recorded shot description, shooting coordinates, and make/miss outcome. The audit examined **1,351 games**, **240,495 recorded shot attempts**, and **638 players with observed execution styles**. All 240,495 saved shot attempts had coordinate data (100% **of the parsed PBP dataset**, not a claim of 100% NBA tracking coverage). Observed categories:

| Style family | Parsed attempts |
|---|---:|
| Rim finish (layup, dunk, tip, etc.) | 77,676 |
| Created jumper (stepback/pull-up/fade/turnaround) | 56,760 |
| Floater/hook | 26,546 |
| Driving/running | 7,468 |
| Other jumper | 72,045 |

These are **ESPN shot descriptions**, **not** Synergy possession play types, player touches, closest defender distance or screening events.

## Predeclared challenger

`nba_v5_shot_style.py` constructs per-player, per-shot-zone execution family frequencies, shrunk toward observed league-by-zone rates. Per-style accuracy is strongly shrunk and capped; its expectation across the player's styles at each shot zone is *exactly 1*, preventing the experiment from inflating V5's existing shot quality. A separate random generator avoids perturbing the champion's random stream unnecessarily. All shot-style state enters `Replay` *only after* each test date.

Paired experiment: same 68 scored games, same retrospective players, 500 simulated games per arm, same seeds, and evaluation at the champion's own rounded projection. Game-cluster bootstrap 95% intervals. Positive Brier error reduction means a better challenger.

| Market | Player-events | Champion Brier | Challenger Brier | Change (positive better) | 95% interval |
|---|---:|---:|---:|---:|---|
| Points (blended) | 1,184 | 0.250121 | 0.249526 | +0.000595 | [-0.000158, +0.001361] |
| Rebounds (blended) | 1,101 | 0.249169 | 0.249088 | +0.000081 | [-0.000898, +0.000992] |
| Assists (blended) | 956 | 0.244298 | 0.244662 | -0.000365 | [-0.001418, +0.000607] |
| Made threes (blended) | 1,073 | 0.236113 | 0.235734 | +0.000378 | [-0.000421, +0.001157] |
| Blocks (standalone V5) | 334 | 0.241779 | 0.245561 | **-0.003782** | **[-0.006866, -0.001090]** |
| Steals (standalone V5) | 985 | 0.237673 | 0.238998 | -0.001325 | [-0.003144, +0.000512] |
| Turnovers (standalone V5) | 416 | 0.235081 | 0.234647 | +0.000434 | [-0.001715, +0.002635] |

Minutes MAE was 5.406065 (champion) vs 5.409530 (challenger).

**Conclusion:** No statistically clear improvement in any principal market, and the blocks distribution is materially harmed. The proposed execution-style head is a frozen negative trial. Do not rescue-tune this same feature on the used 68-game evaluation sample. It could only be reconsidered with a genuinely new source (proper play-type tracking, defender distance or contextual action data) and a predeclared untouched future validation.

The test conditions both arms on the retrospectively known roster, so it is not prospective pregame injury/rotation confirmation.
