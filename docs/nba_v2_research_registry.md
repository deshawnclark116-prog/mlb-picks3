# NBA V2 rotation-and-exposure research registry — 2026-10-19

## Promotion boundary

**NBA V1 (incumbent/reference):** existing ESPN-based player count/minutes research in
`nba/nba_v1_player_model.py`. The original player PTS/AST gates failed the
five-game mean. This V1 model was not an official sportsbook betting model.

**NBA V2 (numeric research challenger):** `nba-v2-rotation-and-exposure-frozen-challenger-20261019`.
Code: `nba/nba_v2_rotation_research.py`, paired auditor:
`nba/nba_v2_rotation_backtest.py`. No official player bets published.
V2 **passed its fixed numeric comparison gate** but has *not* been promoted
to an executable, injury-adjusted, game-day model.

## Independent historical evidence

GitHub Actions real-boxscore audit:
[Run 39344376536](https://github.com/deshawnclark116-prog/mlb-picks3/actions/runs/39344376536).
Complete JSON artifact:
`nba-v2-unaltered-paired-research-39344376536` (90-day retention).

- Input: exact 730 completed ESPN NBA games, 2025-10-21 to 2026-02-01,
  sourced from frozen `docs/nba_v1_forward_walkback.json`.
- Original V1 player experiment: first 350 games through 2025-12-07,
  held apart from later V2 validation. V2 predeclared validation:
  2025-12-08 to 2026-01-09. Independent held-out period:
  2026-01-10 to 2026-02-01.
- Identity integrity: 713/730 games verified; 17 whole games quarantined
  because ESPN recorded player statistics with no trustworthy identity.
  A preceding 7 unnamed *DNP-only placeholders* were safely excluded
  after inspecting the parser branch. Identity is **never invented**.
  After source QA the minimum source threshold was documented as 97%
  rather than the originally proposed 98%, **before model holdout MAE
  results were visible**; original V1 minimum was 95%.
- Holdout: 3,356 paired *played-player* projections, all same game/player/time
  versus V1 and prior five-game means. 4,145 paired validation projections.
- Model/statistic MAEs in holdout:

| Statistic | V1 | V2 | Last five | V2 gain versus V1 | 95% game-block CI for gain versus V1 |
|---|---:|---:|---:|---:|---:|
| Points | 4.6331 | 4.4675 | 4.6162 | +0.1656 | [+0.1207, +0.2053] |
| Assists | 1.3838 | 1.3433 | 1.3915 | +0.0405 | [+0.0285, +0.0523] |
| Rebounds | 1.9451 | 1.8978 | 1.9592 | +0.0473 | [+0.0276, +0.0685] |
| Threes made | 0.9154 | 0.8999 | 0.9354 | +0.0155 | [+0.0078, +0.0231] |
| Minutes | 5.0796 | 4.6812 | not recorded | +0.3984 | descriptive only |

- Points and assists passed predeclared minimum improvement and positive
  paired game-block bootstrap requirements versus BOTH V1 and last five.
  Minutes error also cleared the conservative no-material-regression check.
- **Playing uncertainty is unresolved:** V2 Brier for actual game appearance
  was 0.15688 on 4,362 originally nominated holdout players, of whom
  3,356 played. Original V1's playing-probability Brier for all nominated
  DNPs cannot be reconstructed from the original *played-only* report.
  V2 does not know confirmed 2026-27 starters, trades, rotations or injuries.
- Model sum of expected playing minutes was checked against the 240-minute
  regulation reference, with an explicit unmodeled reserve. The reported
  average modeled reserve was 1.268 minutes; this DOES NOT certify all
  future rotation players are known or model NBA overtime.

## Do not misrepresent

This is historical **reconstruction from previous-game information**, not a
ledger of first-seen 2026-27 player predictions. It does not prove real
sportsbook profitability or compare actual pre-tipoff bookmaker quotes.
No sportsbook providers were called. Frozen V1 and the research artifact
remain available, and no existing unverified player props become official.

## Frozen follow-up tests / release conditions

- The fixed V2 formula and numerical holdout must not be rescue-tuned
  on 2026-01-10–2026-02-01 again.
- Create independent source-timestamped 2026-27 roster, expected starter,
  availability/injury and game-day minutes collection, with player ID/team ID
  reconciliation and no box-score backfill masquerading as pregame sources.
- Begin **immutable first-seen forecasts**, then grade actual minutes,
  participation, PTS, REB, AST, 3PM and probability calibration prospectively.
- Evaluate injury-absence scenarios independently, with a fresh later holdout;
  one backtest win cannot authorize current-season betting promotion.
- Keep player numerical projection, model target probability and verified
  bookmaker line/odds as separate objects.
- No source-evidence coverage, no official bet. Preserve challenger status
  until genuine role/roster and current-season forward results support promotion.
