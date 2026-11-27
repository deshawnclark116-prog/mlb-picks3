# NBA opportunity audit — 2026-11-27

Research only. No production model, ranker, threshold, sportsbook line, or frontend change.

## Source and limitations

Replayed immutable original pregame V5 grade files under `docs/nba_v5_grades/first/`. Results are from a new connector-side calculation on the saved JSON, not a rerun of the V5 simulator. This is a V5 audit, not a complete V5/V3/V4 specialist-system benchmark. Conditional numerical errors use actual played rows with finite original predictions and pregame opportunity features. That is not a test of pregame participation or confirmed starter eligibility. Archive dates have been used in previous project research; these results are diagnostic, not an untouched holdout.

## 12-game error attribution, November 24–25

IDs 401909314–401909325 inclusive. All 12 files loaded. 251 played player-games, 1,004 four-market observations. Same eligible rows in every column.

| Market | V5 original MAE | 50% shrink minutes to pregame recent minutes | Replace with pregame recent minutes | Actual minutes oracle |
|---|---:|---:|---:|---:|
| Points | 4.270 | 4.236 | 4.254 | 3.480 |
| Rebounds | 1.805 | 1.807 | 1.835 | 1.581 |
| Assists | 1.226 | 1.237 | 1.254 | 1.131 |
| Made threes | 0.911 | 0.912 | 0.916 | 0.829 |

Points shot-attempt oracle: same 251 rows, original MAE 4.270, oracle 2.711. Formula: original conditional points forecast * actual field-goal attempts / original field-goal attempt forecast. Actual minutes oracle similarly scales by actual / forecast minutes. Actual game statistics are unavailable pregame; these are hindsight sensitivity diagnostics, not viable forecasts, causal estimates, or achievable improvement guarantees. Oracles overlap and gains cannot be added.

Original minutes MAE 4.100 versus 4.695 for pregame recent minutes. Reject naive minutes replacement.

The restricted four-market, original-rank top four across these 12 games reached their original targets 34/48 (70.83%); mean DNP-inclusive stated chance 60.53%. None of those rows had confirmed starter evidence. This is not the production specialist card and not a confirmed-starter performance claim.

## Chronological residual correction trial

IDs 401909296–401909313, nine November 13 games to train, nine November 20 games to test. 188 eligible training and 177 test player-games per market. Standardized pregame features: original market forecast, expected minutes, recent minus expected minutes, availability chance, prior per-36 FGA/3PA/AST/REB/FTA scaled to expected minutes. Fit separate ridge regressions on actual minus original market projection. Intercept unpenalized, ridge penalty 0.25*n, apply half the estimated residual; clip at zero. No test outcomes enter fitting.

| Market | Original MAE | Challenger MAE |
|---|---:|---:|
| Points | 4.8644 | 4.8857 |
| Rebounds | 1.8880 | 1.9067 |
| Assists | 1.3571 | 1.3668 |
| Made threes | 0.9036 | 0.9229 |

Reject: worsened every market.

## Direct opportunity correction trial

Same chronological split, points rows only; 188 training, 177 test. Features: expected minutes, recent minus expected minutes, availability chance, original expected FGA, historical FGA/3PA/FTA/AST/REB per-36 scaled to expected minutes. Same regularization and half-residual correction.

| Target | Original MAE | Historical-rate proxy | Half proxy blend | Learned correction |
|---|---:|---:|---:|---:|
| Field-goal attempts | 2.6273 | 2.6164 | 2.6187 | 2.6297 |
| Minutes | 4.1715 | 5.0175 | 4.4403 | 4.2047 |

Scaling points by corrected FGA worsened points MAE 4.8644 -> 4.8837; corrected minutes worsened it to 4.9070. Reject learned adjustments and do not promote tiny exploratory proxy gains. Initial trial using November 6 training files did not have compatible opportunity features; no metrics were generated for that split.

## Conclusion

Evidence points toward opportunity forecasting (especially attempts), not a guaranteed simulation improvement. The next distinct hypothesis should predict pregame shot opportunities and rotation/usage changes directly with historical possessions, teammate availability and real timestamped lineups, then compare with the entire specialist system on identical targets, player eligibility, forecast time and coverage. Freeze before new forward games; no artificial target lowering or selective removal of misses. Do not treat this audit as proof of a stronger model.
