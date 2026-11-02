# NHL V2 — original numerical shots projected versus actual official shot counts

> This report grades **true model expected shot totals**, not alternate shot thresholds (1+, 2+, 3+), sportsbook betting lines, or easy model targets. Source: frozen first-pregame NHL V2 B2 forecasts and official final reconciled shot records. No retraining or selection promotion.

Model version: nhl-v2-sog-b2-1.1. Original grade rows matched across three separate forecasting horizons: 21039. Forecasts across horizons are **not independent** player games.
Full original grade ledger is retained in the source repository; this report provides complete horizon scorecards and every source-listed **large-miss** row, not a false claim that the large-miss appendix contains every player forecast.

## Numeric accuracy by pregame horizon

| Snapshot | Games | Meaningful expected participants | Average shot-count error | Within ±1 shot | Prior-10 average comparator MAE on same rows |
|---|---:|---:|---:|---:|---:|
| T24H | 128 | 4106 | 1.026 | 56.9% | 1.086 |
| T90 | 142 | 4549 | 1.022 | 57.2% | 1.081 |
| T30 | 136 | 4396 | 1.021 | 57.1% | 1.076 |

- Mean absolute error is the absolute difference between **unrounded original expected SOG** and actual shots, averaged over the selected population. No target win/loss calculation.
- Played-only results are diagnostic, since selecting only players who later participated would use hindsight. For admission, the meaningful *expected* participation population is primary.
- Model improvement versus same-row prior-ten average is modest (about 0.056–0.060 shots). The later T30 forecast showed essentially no measurable same-player accuracy gain over T90.

## Source-listed large numerical misses by game

These are **all large-miss examples exposed in the frozen forensics report**, not every forecast. Postgame deployment observations are explanations to investigate, never inputs backfilled into the pregame projection.

### T24H — 25 source-listed large misses across 22 games

**Official NHL game ID 2026020056**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Michael Carcone (UTA) | 1.344 | 7 | 5.656 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020064**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Mikael Backlund (CGY) | 1.903 | 8 | 6.097 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020068**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Charlie Coyle (CBJ) | 2.146 | 7 | 4.854 | ACTUAL_TOI_MORE_THAN_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020108**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Olen Zellweger (BUF) | 1.307 | 6 | 4.693 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020111**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Nikita Kucherov (TBL) | 2.422 | 8 | 5.578 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020114**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Nino Niederreiter (WPG) | 0.976 | 7 | 6.024 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020115**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Roman Josi (NSH) | 2.125 | 8 | 5.875 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020116**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Matt Boldy (MIN) | 3.289 | 8 | 4.711 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020119**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Nathan MacKinnon (COL) | 3.857 | 9 | 5.143 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020142**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Timo Meier (NJD) | 2.247 | 8 | 5.753 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020145**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Zach Werenski (CBJ) | 3.235 | 8 | 4.765 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020148**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Joel Eriksson Ek (MIN) | 2.833 | 8 | 5.167 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020156**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Fabian Zetterlund (OTT) | 1.512 | 9 | 7.488 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020159**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Matthew Schaefer (NYI) | 3.221 | 9 | 5.779 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |
| Emil Heineman (NYI) | 1.266 | 6 | 4.734 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020171**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Alexis Lafrenière (NYR) | 2.131 | 7 | 4.869 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020182**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Mark Scheifele (WPG) | 2.260 | 7 | 4.740 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020186**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Aydar Suniev (CGY) | 1.315 | 6 | 4.685 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020211**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Cutter Gauthier (ANA) | 2.935 | 10 | 7.065 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020212**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Alex Laferriere (LAK) | 2.301 | 7 | 4.699 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020215**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Anton Lundell (FLA) | 2.139 | 8 | 5.861 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020217**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Anton Frondell (CHI) | 1.276 | 9 | 7.724 | ACTUAL_TOI_MORE_THAN_125PCT_OF_RECENT3 |
| Alex Vlasic (CHI) | 1.055 | 6 | 4.945 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020221**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Corey Perry (LAK) | 1.143 | 9 | 7.857 | ACTUAL_TOI_MORE_THAN_125PCT_OF_RECENT3 |
| Tage Thompson (BUF) | 3.065 | 8 | 4.935 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

### T90 — 25 source-listed large misses across 22 games

**Official NHL game ID 2026020055**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Beckett Sennecke (ANA) | 2.066 | 7 | 4.934 | ACTUAL_TOI_MORE_THAN_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020056**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Michael Carcone (UTA) | 1.342 | 7 | 5.658 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020090**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Jack Hughes (NJD) | 2.871 | 8 | 5.129 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020103**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Ryan Strome (CGY) | 1.239 | 7 | 5.761 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020111**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Nikita Kucherov (TBL) | 2.417 | 8 | 5.583 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020114**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Nino Niederreiter (WPG) | 0.981 | 7 | 6.019 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020115**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Roman Josi (NSH) | 2.127 | 8 | 5.873 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020116**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Matt Boldy (MIN) | 3.296 | 8 | 4.704 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020119**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Nathan MacKinnon (COL) | 3.866 | 9 | 5.134 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020142**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Timo Meier (NJD) | 2.220 | 8 | 5.780 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020145**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Zach Werenski (CBJ) | 3.147 | 8 | 4.853 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020148**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Joel Eriksson Ek (MIN) | 2.838 | 8 | 5.162 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020156**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Fabian Zetterlund (OTT) | 1.462 | 9 | 7.538 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020159**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Matthew Schaefer (NYI) | 3.219 | 9 | 5.781 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |
| Emil Heineman (NYI) | 1.267 | 6 | 4.733 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020171**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Alexis Lafrenière (NYR) | 2.127 | 7 | 4.873 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020182**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Mark Scheifele (WPG) | 2.258 | 7 | 4.742 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020211**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Cutter Gauthier (ANA) | 2.936 | 10 | 7.064 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020212**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Alex Laferriere (LAK) | 2.298 | 7 | 4.702 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020214**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Arseny Gritsyuk (NJD) | 1.499 | 8 | 6.501 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020215**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Anton Lundell (FLA) | 2.108 | 8 | 5.892 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020217**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Anton Frondell (CHI) | 1.273 | 9 | 7.727 | ACTUAL_TOI_MORE_THAN_125PCT_OF_RECENT3 |
| Alex Vlasic (CHI) | 1.055 | 6 | 4.945 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020221**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Corey Perry (LAK) | 1.148 | 9 | 7.852 | ACTUAL_TOI_MORE_THAN_125PCT_OF_RECENT3 |
| Tage Thompson (BUF) | 3.052 | 8 | 4.948 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

### T30 — 25 source-listed large misses across 22 games

**Official NHL game ID 2026020055**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Beckett Sennecke (ANA) | 2.066 | 7 | 4.934 | ACTUAL_TOI_MORE_THAN_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020090**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Jack Hughes (NJD) | 2.871 | 8 | 5.129 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020103**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Ryan Strome (CGY) | 1.239 | 7 | 5.761 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020108**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Olen Zellweger (BUF) | 1.315 | 6 | 4.685 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020111**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Nikita Kucherov (TBL) | 2.417 | 8 | 5.583 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020114**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Nino Niederreiter (WPG) | 0.981 | 7 | 6.019 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020115**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Roman Josi (NSH) | 2.127 | 8 | 5.873 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020116**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Matt Boldy (MIN) | 3.296 | 8 | 4.704 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020119**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Nathan MacKinnon (COL) | 3.866 | 9 | 5.134 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020142**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Timo Meier (NJD) | 2.220 | 8 | 5.780 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020145**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Zach Werenski (CBJ) | 3.147 | 8 | 4.853 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020148**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Joel Eriksson Ek (MIN) | 2.838 | 8 | 5.162 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020156**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Fabian Zetterlund (OTT) | 1.462 | 9 | 7.538 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020159**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Matthew Schaefer (NYI) | 3.219 | 9 | 5.781 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |
| Emil Heineman (NYI) | 1.267 | 6 | 4.733 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020171**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Alexis Lafrenière (NYR) | 2.127 | 7 | 4.873 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020182**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Mark Scheifele (WPG) | 2.258 | 7 | 4.742 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020211**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Cutter Gauthier (ANA) | 2.936 | 10 | 7.064 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020212**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Alex Laferriere (LAK) | 2.298 | 7 | 4.702 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020214**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Arseny Gritsyuk (NJD) | 1.499 | 8 | 6.501 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020215**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Anton Lundell (FLA) | 2.108 | 8 | 5.892 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020217**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Anton Frondell (CHI) | 1.273 | 9 | 7.727 | ACTUAL_TOI_MORE_THAN_125PCT_OF_RECENT3 |
| Alex Vlasic (CHI) | 1.055 | 6 | 4.945 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

**Official NHL game ID 2026020221**

| Player / team | Model projected shots | Actual shots | Absolute error | Postgame ice-time diagnostic |
|---|---:|---:|---:|---|
| Corey Perry (LAK) | 1.148 | 9 | 7.852 | ACTUAL_TOI_MORE_THAN_125PCT_OF_RECENT3 |
| Tage Thompson (BUF) | 3.052 | 8 | 4.948 | ACTUAL_TOI_75_TO_125PCT_OF_RECENT3 |

## Missing and not graded

- Source records show 100 source-official ungraded rows, 442 pending or never-graded forecast rows, and 100 quarantined ambiguous forecast rows. They are not recoded as hit/miss.
- Original publication and deployment provenance must be audited before ascribing any particular game row to the frontend's ranked selections.
- Game-by-game tables above include source-flagged extreme misses, whereas the source scorecard covers all independently matched outcomes. This is not a complete per-player leaderboard of 21,039 rows.
- No changes to the prediction model or live UI were made.
