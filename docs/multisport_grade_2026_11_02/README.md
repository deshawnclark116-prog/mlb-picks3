# Multi-sport original model projection vs official results — November 2, 2026

**Research only. No production-selection rule or model was modified.** Sources are the original GitHub firstseen forecasts and independent postgame grading records. Do not substitute easy-target milestone hit rates for original numerical-projection accuracy. Use original frozen means/medians, keep game/roster identities, and treat DNP/unverified separately.

## NBA V2 — full game and player record

[Download/open complete NBA V2 original player/actual CSV](./nba_v2_all_original_player_stat_projections.csv)

- Frozen games: **90**; player forecasts: **1652**; four-market observations: **6608**.
- Played-player outcomes: **3712**; verified DNP conditional statistics correctly excluded: **1208**; stats not yet verified: **1688**.
- Original player availability: **1230** verified, **422** unverified.
- Numerical MAE among played: points **5.0868**, rebounds **2.0175**, assists **1.4616**, three-pointers **0.9058**, minutes **8.8525**.
- A separate V2 probability grade reports 47 verified and 39 unverified milestone predictions, but this is **NOT** the 1,652-player numerical forecast population. Some records mark stat value zero; verify DNP versus a true 0 before interpreting individual probability hits.

## NBA V3 — current newer research source, *not* an earned champion promotion

Source: [complete V3 firstseen probability/actual score](../nba_v3_phase1_forward_grade.json). It reports **69** pretip games frozen, **36** completed verified game boxes and **40344** threshold rows, of which **20952** verified and **19392** unverified. Threshold rows reuse player-game outcomes: they are **not independent player forecasts**.

| Market | V3 played-player MAE (all verified) | V2 paired MAE | V3 paired MAE |
|---|---:|---:|---:|
| points | 5.170 | 5.155 | 5.448 |
| rebounds | 2.082 | 2.225 | 2.385 |
| assists | 1.546 | 1.501 | 1.488 |
| three_pointers_made | 0.927 | 0.849 | 0.881 |

Paired same-player, same-game matched comparison is **38** players in **3** games; it is too small for champion promotion. **Forward calibration NOT verified**; no sportsbooks or bet record should be inferred. V3 was numerically worse on paired PTS, REB and 3PM, marginally better AST.

## NHL — original numerical shots, not easy milestones

[Download/open full NHL original player-projection vs official-final CSV](./nhl_frozen_pregame_shots_vs_official_finals.csv)

The exact **561 unique player-game** research snapshots span Oct 29–Nov 1, deduplicated across T24 and T90 with T90 preferred when available. **406** independently grade as played, **28** DNP, **127** have no finished official ledger row. The 406 played forecasts have **1.111** shots mean absolute error, **113/406** exact by the custom .6 rounding convention, **312/406** within one rounded shot. Neither exact nor within-one probability is the source probability of meeting a threshold.

| Date | Original matchup abbreviations | Verified/All | Shot MAE | Exact | DNP | Awaiting grade |
|---|---|---:|---:|---:|---:|---:|
| 2026-10-29 | BUF–ANA | 28/32 | 1.27 | 8 | 4 | 0 |
| 2026-10-29 | LAK–OTT | 32/35 | 1.23 | 9 | 3 | 0 |
| 2026-10-29 | SJS–VAN | 31/34 | 1.14 | 4 | 3 | 0 |
| 2026-10-30 | WPG–FLA | 32/34 | 1.11 | 7 | 2 | 0 |
| 2026-10-30 | CGY–SEA | 32/32 | 0.95 | 10 | 0 | 0 |
| 2026-10-31 | BOS–CHI | 32/35 | 1.30 | 12 | 3 | 0 |
| 2026-10-31 | DET–STL | 31/33 | 0.97 | 8 | 2 | 0 |
| 2026-10-31 | LAK–BUF | 30/32 | 1.31 | 9 | 2 | 0 |
| 2026-10-31 | SJS–OTT | 30/33 | 1.30 | 8 | 3 | 0 |
| 2026-10-31 | MTL–PIT | 34/35 | 1.00 | 10 | 1 | 0 |
| 2026-10-31 | TOR–VAN | 31/34 | 1.09 | 5 | 3 | 0 |
| 2026-10-31 | DAL–CBJ | 32/33 | 0.95 | 10 | 1 | 0 |
| 2026-10-31 | COL–CGY | 31/32 | 0.88 | 13 | 1 | 0 |
| 2026-11-01 | MIN–WSH | 0/31 | Not graded | 0 | 0 | 31 |
| 2026-11-01 | PHI–UTA | 0/31 | Not graded | 0 | 0 | 31 |
| 2026-11-01 | EDM–NYR | 0/31 | Not graded | 0 | 0 | 31 |
| 2026-11-01 | ANA–OTT | 0/34 | Not graded | 0 | 0 | 34 |

*WARNING:* The source official final ledger currently covers games only through October 31 (local); November 1 source-freezes must not be labelled misses, hits or complete-game outcomes. CDF P(at least projected rounded count) remains **uncalibrated**. Shot means and easy 1+ shot threshold probabilities are distinct.

## Soccer — firstseen player numerical forecasts

[Download/open full soccer player/actual CSV](./soccer_player_shots_sot_minutes_vs_verified_finals.csv)

The source has **1055** frozen individual forecasts; **217** evaluated, including **194** verified played players and **23** missing participation; **838** have no graded result. Shot MAE **0.9164** vs historical baseline **0.9189**; SOT MAE **0.4948** vs baseline **0.5032**; minutes MAE **24.0713**. Exact rounded shot accuracy **33.0%** and exact rounded SOT **66.0%**. These are not threshold hit rates, and comparison to baseline is only marginal.

| Completed fixture | Verified/all evaluated | Shots MAE | Historical baseline MAE |
|---|---:|---:|---:|
| Torino at Frosinone | 15/19 | 1.29 | 1.21 |
| Real Madrid at Racing Santander | 15/17 | 1.26 | 1.01 |
| Angers at Lyon | 9/10 | 1.19 | 1.19 |
| AS Monaco at Paris FC | 13/15 | 1.17 | 0.99 |
| Arsenal at Liverpool | 13/15 | 1.01 | 1.07 |
| Toulouse at Marseille | 13/14 | 0.99 | 0.90 |
| AJ Auxerre at Strasbourg | 11/12 | 0.93 | 0.94 |
| Sevilla at Getafe | 15/17 | 0.88 | 0.90 |
| Valencia at Elche | 15/15 | 0.86 | 0.86 |
| Venezia at Como | 15/15 | 0.84 | 1.05 |
| FC Cologne at 1. FC Union Berlin | 10/13 | 0.73 | 0.68 |
| Genoa at Lecce | 15/17 | 0.71 | 0.70 |
| Hamburg SV at Eintracht Frankfurt | 8/8 | 0.69 | 0.88 |
| Napoli at Juventus | 9/11 | 0.57 | 0.72 |
| Cagliari at Lazio | 18/19 | 0.55 | 0.70 |

The match outcome forward scorecard in `docs/soccer_forward/status.json` still lists **0** matches graded and **51** ungraded, so **soccer match winner/goal total probability quality cannot yet be claimed**. Player shots/SOT grading above is separate.

## Frontend-selection interpretation (NOT a selection backtest)

These are original source populations, **not a verified capture of the exact ten cards served to individual frontend viewers**. The current saved distributions alone cannot establish that any default per-game shortlist beat the current UI ordering. A credible comparison must freeze *actual served player IDs, market, model version, numeric forecast and defined probability event before kickoff*; then compare selection variants on unseen later games. No frontend selection promotion is justified using this retrospective analysis.

Research checkpoints: November 1 V2/V3/Soccer aggregates and available independent NHL official final ledger as retrieved November 2. Nonparticipation and stale forecast vintages are explicit, not filled as zero.