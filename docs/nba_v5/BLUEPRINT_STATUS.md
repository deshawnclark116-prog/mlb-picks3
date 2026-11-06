# NBA V5 — 26-point basketball intelligence implementation ledger

**Reviewed November 6, 2026, following merged PRs #79–#86.**
This is the **actual repository implementation**, not a list of requested features.
V5 generates independent numerical player projections. Sportsbook logic
(#27) is intentionally deferred.

**Status definitions:** **LIVE** = code currently used in forecasts; **BUILT,
SHADOW** = implemented but disabled pending prospective validation; **PARTIAL**
= some required elements work, others are missing; **BLOCKED DATA** = an
additional verified/authorized source is necessary; **RESEARCH INVALIDATED**
= tested challenger failed to improve the champion. A working test is not
proof of calibrated real-world probabilities.

The currently promoted forecasting formula remains the possession-level V5
simulation, with 50/50 V4/V5 **marginal distribution** blends for points,
rebounds, assists and threes and standalone V5 for steals, blocks and
turnovers. **No experimental role, lineup or shot-style weights are promoted.**

| # | Original blueprint capability | Verified state | Specific remaining work or validation |
|---|---|---|---|
| 1 | Data sources, timestamps, roster changes | **PARTIAL**. ESPN prior games, saved source receipts, current team roster, plus independently timestamped **official NBA injury PDF** integrated in PR #83. Scheduler responds to both official and ESPN status changes in PR #86. | Full transactions/G League rosters, postponements/changed tipoffs, source publication latency/uptime and third-party lineup verification; source permissions |
| 2 | Availability, start, close, restrictions and early exits | **PARTIAL**. Conditional-playing and DNP scenarios, learned playing likelihood, correlated team absences, return-from-injury adjustments, initial/closing lineup probabilities, official fresh OUT and AVAILABLE support | Official dressed/inactive certification, pregame announced minute limits, warmup news, early exit/in-game injury survival modeling; forward calibration |
| 3 | Shared 240-minute rotations | **LIVE**. Two-minute segment lineups, starters, bench, foul trouble, blowouts, overtime, team stint/timeout effects | Matchup-specific rotation strategy, lineup-type labels, cross-game coaching change-points |
| 4 | Offensive and defensive player roles | **PARTIAL**. Rate, usage, assisted share, shooting zone and board opportunities; no invented archetypes | Role/skill archetype-conditioned priors for sparse players, observed on-ball/off-ball responsibilities, verified new-team role transitions |
| 5 | Opportunity before outcomes | **PARTIAL**. Shot mix, FT attempts, minutes, rebound events, pass-to-made-shot assists and timing (experimental/off) | Touches, possessions held, dribbles, drives, screens, potential assists, rebound chances and contested events require another measured source |
| 6 | Teammate on/off and lineups | **BUILT, SHADOW**. Verified five-man PBP: 1,283/1,351 games with 13,786 pair entries; future-only lineup opponent challenger archives now run independently | Untouched forward game comparisons, coaching/opponent confounding controls, true spacing/matchup-based effects. `lineup_pairs=false` |
| 7 | Opponent defense | **PARTIAL/LIVE**. Opponent by-zone rates, TO/FT/ORB, individual defenders' historic on-court zone effects | Actual guard assignments, coverage schemes, distance, switches, traps, rotating help and physical matchups |
| 8 | Offensive possession/play types | **BLOCKED DATA**. ESPN shot descriptions are **not** Synergy isolation/P&R/spot-up/cut/handoff possessions | Authorized game-level action/possession data and coverage/ID mapping for Synergy or equivalent |
| 9 | Points from detailed shot/free-throw events | **PARTIAL/LIVE**. Shared simulated FGA/2PA/3PA/FTA, makes, accuracy by zone, 2/3/FT score arithmetic | Shot clock, creation/contest, true fatigue/defender distance. ESPN shot-style experiment in #84 **failed the gate** and stays off |
| 10 | Rebounds from missed shots, positioning | **PARTIAL/LIVE**. Shared misses, OREB/DREB, team rebounds and rebounding players | Rebound chance positioning, box-outs, shot-location-dependent rebound distribution |
| 11 | Assists from passes and actual baskets | **PARTIAL/LIVE**. Assists only on made baskets and passer chosen from eligible floor players | Potential assists and full pass-type/recipient networks; teammate finishing-quality context |
| 12 | Threes, steals, blocks, turnovers | **LIVE**. Separate event components and count distributions from one game | Player-level scheme/pressure, passing lanes and location-aware block events |
| 13 | Live game-flow mechanisms | **PARTIAL/LIVE**. Possessions, pace, score differential, late fouling, timeouts, foulouts, overtime | End-of-quarter playbook, bonus/penalty transitions, timeout/lineup strategic counters |
| 14 | Rest and travel environment | **LIVE**. Back-to-backs, three in four, distance, time zones, altitude with shrinkage | Validate unusual venue/neutral-site edge cases and season-specific physical fatigue |
| 15 | Coaching and strategy | **PARTIAL/LIVE**. Team rotation/stint and foul timeout tendencies | Coach identity changes, opposing archetypes, matchup-specific substitution instructions |
| 16 | Officiating | **LIVE**. Shrunk foul/free throw crew effect | More sample before crew-specific high-leverage modifications |
| 17 | Player skill/role change detector | **BUILT, RESEARCH INVALIDATED FOR PROMOTION**. Past-only disjoint-window skill opportunity signals; 68-game equal-seed whole-model trial did not beat V5 reliably | New independent role signal or different prior measured data; no rescue tuning on the spent sample |
| 18 | Small-sample Bayesian intelligence | **PARTIAL**. League-shrunk opportunity and accuracy rates, parameter uncertainty | Hierarchical position/archetype priors, honest rookie estimates and prospective low-minute cohort calibration |
| 19 | Cross-player and cross-stat correlations | **PARTIAL/LIVE**. V5 shared-game pace, minutes and event relationships | Important: blending V4/V5 marginal CDFs does **not** make the blended marginal outputs a fully coherent joint model; must validate joint dependence separately |
| 20 | Exactly consistent entire-game engine | **LIVE for V5 simulation**. Verified score = summed player points, five players per segment, threes within made baskets, assists only on makes, correct team minutes | Preserve coherence when adding future blend/copula and tactical events; no unsupported claims about joint V4+V5 blend |
| 21 | Decomposed uncertainty | **PARTIAL/DIAGNOSTIC**. V5 conditional distributions, P(plays), minutes-association and Monte Carlo standard errors | Quantified causal/parameter/tactical vs minutes vs opponent effect, interval coverage calibration and model misspecification |
| 22 | Probabilities at actual rounded model projection | **LIVE but not prospectively calibrated**. CDF at exact own x.6 rounded number, both conditional and DNP-inclusive; lineup overlay recomputes after confirmed updates | Real future calibration by market/role/status/minutes; no lower sportsbook target masquerading as projection |
| 23 | Rigorous benchmark selection | **BUILT/HISTORICAL**. Chronological V4, recent-average, V5/blend; original vs challenger same games and seeds, predeclared feature controls | Sufficient **genuine pretip** prospective games; avoid repeated reused holdout tuning |
| 24 | Ablation and feature promotion gates | **BUILT/LIVE**. Paired Brier/MAE and game cluster CIs; negative results frozen; separate shadow flags | Predeclare distinct future seasons or first-seen windows and correction for multiple feature screening |
| 25 | Game-by-game postmortems and feedback | **LIVE, early sample**. Immutable first/last archives, per player/stat outcomes, error causes, DNP-aware event scoring; nightly scheduled grading; new hidden lineup challenger and all-player forward comparator in #85 | More final games, authoritative availability outcomes, interval reliability and prospective sufficient sample; initial 2 graded games cannot calibrate the season |
| 26 | Smart frontend without hiding projections | **PARTIAL/LIVE**. Own numerical projection and hit chance, four featured tiles plus expandable full game list; V5/V4/V3 attribution, warnings, DNP source, research extras separated | Prospective feature-selection quality and accuracy by market/role; better explanation without duplicating displayed statistical targets |
| 27 | Sportsbook line/odds work | **DEFERRED** by user | Deliberately not in V5 model feature development |

## Source evidence

- [Data-source audit, access, rights and acquisition](SOURCE_COVERAGE_AND_ACQUISITION.md): NBA official injury PDFs **integrated**; ESPN history and PBP **integrated**; pbpstats, licensed tracking, SportsDataIO, Sportradar and Synergy *not yet integrated/licensed*.
- [V5 lineup interactions and verified PBP](LINEUP_PAIR_RESEARCH.md): 94.97% reconstructable play-by-play; historical point-Brier improvement +0.001545, but no independent prospective acceptance.
- [V5 shot-style experiment](SHOT_STYLE_RESEARCH.md): 240,495 observed shot descriptions; no reliable core gain, significant blocks deterioration; **off**.
- [Frozen first-seen challenger acceptance](FORWARD_LINEUP_CHALLENGER.md): no backfill, no cherry-picking, DNP-aware probabilities, exact original champion threshold.
- [Numerical model backtests and negative role trial](BACKTEST_RESULTS.md): V4+V5 historical champion rationale, preserved role-feature failure.

## Next independently verifiable acceptance gates

1. **Availability correctness:** audit league-report and ESPN status conflicts, source freshness, reported active/inactive outcomes and minute forecast errors by starter, bench, return-from-injury and DNP cohorts.
2. **Forward calibration:** grade every original game/player/stat event at the exact forecast number, not model targets. Examine Brier/log loss, 80% interval coverage, minutes MAE and misses by context. Small early samples are diagnostics, not a win certificate.
3. **Lineup challenger:** collect truly frozen V5 champion and alternative before the same tipoff with at most a 30-minute capture gap and identical simulator settings, then compare at the champion's event. **No auto promotion**.
4. **Observed action data:** verify developer-key/contract access and timestamps before any P&R, isolation, drives, potential assists, closest defender or screen feature. Blank data ≠ zero events.
5. **Model promotion:** require a practical forward gain, game-cluster CI, broad-market nonharm, and no damage to top-confidence buckets; keep all failed branches in research registry.

The assistant must not represent inaccessible licensed data, failed features,
historic hindsight rosters or projections from a future game as work that V5
has completed.
