# NBA V5 missed-shot origin -> named rebounder research — 2026-11-06

**Status:** Real historical evidence reconstructed, simulator component built and
historically tested. No promotion, `rebound_zones=false`.

## Verified free source
Source: saved ESPN completed-game play-by-play, coordinated with the already
strict five-on-court reconstruction. Among **1,283** games passing court
verification out of 1,351 historical PBP games, the engine observed
**121,522 named misses with known shot locations** and linked **96,491**
misses to a named rebound credited within ten seconds and correctly matched
to the actual offense/defense. **24,948** ambiguous, delayed or otherwise
unmatched rebounds were excluded from training; all 30 teams have accepted
event data.

This identifies the actual rebounding player conditioned on the missed-shot
location. It **does not** identify where that player stood on court, whether
he was boxed out or contested, or every missed/FT rebound chance.

## Frozen one-feature challenger
`nba_v5_rebound_zones.py` derives bounded (±0.23 log) player-vs-team
rebounds by five shot-origin zones, separate offensive and defensive side.
Requires >=100 team-side named rebounds, >=15 named player-side rebounds,
>=25 named rebounds from the relevant team/zone, 15 pseudo-rebound shrinkage.
Simulator samples rebounder from the current on-court five while preserving
the number of simulated rebounds and scoring possessions. No FT-miss location
is invented. All data enters Replay after the historical game is complete.

Fixed champion-mean whole-number projections; 68 paired games, 1,391
player-games and 500 same-seed draws/arm, 800 game-cluster bootstrap samples.

| Market | n | Champion Brier | Candidate Brier | Mean reduction | 95% CI |
|---|---:|---:|---:|---:|---|
| Rebounds | 1,101 | 0.249169 | 0.249070 | +0.000099 | [-0.000266,+0.000490] |
| Points | 1,184 | 0.250121 | 0.250121 | 0 | [0,0] |
| Assists | 956 | 0.244298 | 0.244298 | 0 | [0,0] |
| Threes | 1,073 | 0.236113 | 0.236113 | 0 | [0,0] |
| Steals | 985 | 0.237673 | 0.237673 | 0 | [0,0] |
| Blocks | 334 | 0.241779 | 0.241779 | 0 | [0,0] |
| Turnovers | 416 | 0.235081 | 0.235081 | 0 | [0,0] |

Minutes MAE was exactly unchanged at 5.406065.

**Decision:** The rebound-type split has strong raw evidence but no
reliable improvement over the current rebound projection. Do not enable
or tune this branch repeatedly against the reused 68-game sample.
A genuinely untouched forward trial or new positional tracking data is
needed. Historical actual participants were known, and this is not a live
pregame roster performance check.

CI: `.github/workflows/nba_v5_rebound_zones.yml`, all **100 NBA V5
regression tests passed** and audited source coverage.
