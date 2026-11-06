# NBA V5 named passer-to-scorer assist network — November 6, 2026

**Status:** Fully implemented as a switchable simulator component and historically
tested; `assist_network=false` in production. Not yet forward-promoted.

## Free verifiable source: already stored ESPN play-by-play

Only reconstructed/verified five-man court events from 1,351 completed
ESPN PBP game files were used. Of those, **1,283** meet the strict lineup
replay requirements. Across those accepted games the model observed:

- **106,923** named made baskets and **68,378** with a named assister.
- **8,616** distinct directed (team, passer, scorer) combinations, covering 30 teams.
- **0** ambiguous passer-to-scorer court attribution errors in validated games.

The model **does not know** every pass, potential assist, defensive scheme,
dribble or screen. A named assist only means a successful credited assist on
a made basket; the rest of passing opportunity is unobserved.

## Predeclared code path and controls

`nba_v5_assist_network.py` learns passer-to-scorer counts from completed
games only after their historical game date. It independently reconstructs
the on-court IDs from starting five plus substitutions and never trusts
event team labels by themselves. A malformed event rejects the complete
game atomically. Passer/co-court exposure requirements prevent transferring
pair histories to trades/new teammates by mere matching player names.

The resulting `(passer,scorer)` matrix is shrunk toward the predicted
independent rate using 12 pseudo-assists, clipped to ±0.26 log units, and
multiplied by 0.65. The optional switch changes relative assister selection
ONLY among the five currently playing, after the basket has already been
made. It does not change whether that basket was scored or assisted.

## 68-game paired simulation results

Exact champion player roster, seeded 500 simulations/arm per game,
champion's original rounded projection fixed, 800 game-cluster bootstrap
replicates. The V4+V5 blend remains the incumbent.

| Market | n | Champion Brier | Candidate Brier | Improvement | 95% game-cluster interval |
|---|---:|---:|---:|---:|---|
| **Assists** | **956** | **0.244298** | **0.243291** | **+0.001007** | **[+0.000031,+0.001968]** |
| Points | 1,184 | 0.250121 | 0.250121 | 0 | [0,0] |
| Rebounds | 1,101 | 0.249169 | 0.249169 | 0 | [0,0] |
| Made threes | 1,073 | 0.236113 | 0.236113 | 0 | [0,0] |
| Steals | 985 | 0.237673 | 0.237673 | 0 | [0,0] |
| Blocks | 334 | 0.241779 | 0.241779 | 0 | [0,0] |
| Turnovers | 416 | 0.235081 | 0.235081 | 0 | [0,0] |

Minute MAE was identical at 5.406065.

**Interpretation:** This looks encouraging as a *pure assister allocation*
improvement with other game outcomes held exactly constant, but the
research test has been reused for other features. It is NOT an independent
pregame validation and does NOT justify changing public production
probabilities now. Existing feature flags remain unchanged.

## Next promotion gate

- Capture frozen original and independent assist-network challenger
  before NBA tipoff, with the same verified roster/availability/source clock.
- Evaluate every model player/assists projection, including DNPs, at the
  original champion whole number; game-cluster bootstrap and rate coverage.
- Require a meaningful incremental Brier/MAE improvement over the active
  champion with no damage to the top displayed tier and without post-hoc
  tuning on reused games. Retain source and model audit trail.
- Extend only if actual passing/potential-assist data become legitimately
  available; do not call a made-basket network a comprehensive passing model.

CI: `.github/workflows/nba_v5_assist_network.yml`.
Regression tests: `tests/test_nba_v5_assist_network.py`.
