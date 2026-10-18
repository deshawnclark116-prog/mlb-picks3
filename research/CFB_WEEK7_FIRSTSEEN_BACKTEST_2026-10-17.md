# CFB Week 7 — first-pregame, player-by-player backtest

**Scope:** Saturday October 17, 2026, Eastern kickoff date; completed games in the original scorer snapshot **2026-10-18 01:19:17 UTC** (Saturday 9:19 PM EDT). **Partial slate only.** Several late games had not finished. This is an observational postgame audit of previously published forecasts, **not a new forecast, not training, and not an executable sportsbook betting record.**

## A. Actual live CFB threshold picks vs observed outcomes

| Market | Graded | Correct | Incorrect | Hit rate | Avg first-seen stated P(hit) |
|---|---:|---:|---:|---:|---:|
| Moneyline | 25 | 13 | 12 | 52.0% | 72.6% |
| Rushing yards | 31 | 18 | 13 | 58.1% | 63.3% |
| Passing touchdowns | 41 | 23 | 18 | 56.1% | 57.4% |
| Anytime touchdowns | 23 | 16 | 7 | 69.6% | 58.9% |
| **Total** | **120** | **70** | **50** | **58.3%** | **62.4%** |

27 completed games contributed scored selections. In the wider Week 7-to-date cohort, **154** first-seen selections were graded with **86 wins / 68 losses (55.8%)**; this includes other kickoff dates, and is **not** the Saturday subtotal. All-season graded source context was **905 hits-or-misses** (556 hit / 349 miss).

**Major concern — moneylines:** average declared win probability **72.6%**, but only **52.0%** won on Saturday. Examples: Georgia win at **93.53%** (Auburn won), Pittsburgh **85.43%** (Boston College won), Texas **79.7%** (Florida won). Descriptive in this 25-game sample; cannot assert stable calibration from one Saturday.

**Threshold limitation:** all Saturday rushing-yard decisions were made against model **69.5**; passing TDs against **1.5**, anytime TDs **0.5**. None of those were certified to match a sportsbook's executable player prop for each player. Therefore 70–50 is **model-side threshold accuracy**, **not profitable bets**, and has no ROI calculation.

## B. Numerical first-pregame research predictions: expected stat vs final player stat

These are a **separate locked numerical CFB shadow model**, not the live binary Over/Under classifier. Its numerical outputs are **conditional expected means, not medians** or actionable betting projections. Measured only where an observed player-game box score was present; missing rows remain ungraded, **not assumed to be zero**.

| Numeric statistic | Graded player games | Mean absolute error | Bias (projected minus actual) |
|---|---:|---:|---:|
| Rushing yards | **31** | **35.43 yards** | **+7.79 yards** |
| Passing touchdowns | **41** | **0.887 TDs** | **+0.010 TDs** |
| Receiving yards | **0** | **Not measurable** | — |

Rushing-yard forecast/actual Pearson correlation **0.154** (31 observations). **Five** of 31 projections were within ten rushing yards, and **eight** missed by over fifty yards. The players' average forecast was **77.4 yards**; their actual average was **69.6 yards**.

### Exact numerical player comparisons from the frozen pregame ledger

| Player / team | Predicted rush yd | Actual rush yd | Signed error (predicted − actual) |
|---|---:|---:|---:|
| Jamal Roberts, Missouri | 137.2 | 39 | +98.2 |
| Jalen Buckley, Western Michigan | 55.1 | 150 | −94.9 |
| Cam Cook, West Virginia | 132.4 | 40 | +92.4 |
| Rodney Nelson, Miami (OH) | 58.0 | 142 | −84.0 |
| Messiah Burch, Buffalo | 99.2 | 172 | −72.8 |
| Lee Beebe Jr., Indiana | 84.9 | 24 | +60.9 |
| DeSean Bishop, Tennessee | 103.8 | 159 | −55.2 |
| Jaziun Patterson, Michigan State | 72.3 | 72 | +0.3 |
| Austyn Dendy | 58.7 | 61 | −2.3 |

### Why this matters

The model is not failing uniformly. Several forecasts land close, while the tail of the error distribution is large and two-sided. Hypotheses worth **testing later**, rather than claiming as established causes, include player role/usage volatility, running-back rotation, game-script changes, mismeasured injury/starter availability, and nonstationary opponent conditions. Don't "rescue-tune" on these already-observed results.

## C. Data integrity, unresolved cases, and freeze

- **First-seen pregame only:** every Saturday scored pick has a first pre-kickoff ledger entry; newer model probabilities and post-kickoff live-page refreshes cannot replace it.
- **Numerical records verified:** 72 matched first-seen receipts reconcile to individual game ID, player ID, market, kickoff UTC, and strictly earlier publication UTC.
- **Partial coverage and missing stat rows:** all-date live forward report has **113** entries where no final player stat row was found, **48** unresolved games and **110** unfinished entries as of source snapshot; these numbers are global, **not counts for October 17 alone**. The numerical grader also has 71 nonfinal games, 14 unresolved and 16 final-game missing player stat rows globally. Missing player rows are **not confirmed zeroes**, but exclusion can introduce selection bias.
- **Dependence:** 120 decisions span only 27 games and 73 unique players; the 120 aren't independent betting opportunities.
- **Provenance:** Source repository `deshawnclark116-prog/mlb-picks2`, immutable reading of commit `ebc15c482546d12fcd16205eefbeb17ca8f30152`: `docs/cfb_record.json`, `docs/cfb_numeric_forward_grade.json`, `docs/cfb_numeric_first_seen.jsonl`, `docs/cfb_forward_status.json`.
- **Model unchanged.** All evidence is observational, and no candidate was post hoc backfilled or retuned.

**Full audit with all 120 graded threshold selections and all 72 numerical forecast-versus-actual rows:** [`cfb_firstseen_2026-10-17_backtest.json`](cfb_firstseen_2026-10-17_backtest.json).

**Decision:** Do not label current model high-accuracy, assume high confidence means actual accuracy, or convert model-generated thresholds into verified bets. Prioritize a clean player-role and opportunity audit with independent future dates, then compare numerical MAE against simple baselines before any promotion.
