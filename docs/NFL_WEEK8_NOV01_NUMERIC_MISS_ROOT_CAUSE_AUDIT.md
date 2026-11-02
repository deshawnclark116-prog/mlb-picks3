# NFL Week 8 / Nov 1 2026 — numerical projection error attribution

**Evidence-preserving diagnosis, not a retroactive correction to the model.** Source population: the 120 reconstructed `SYSTEM PICKS` V2 T24 frontend-eligible slots from the original 2026-11-01 17:12:34Z publication. Only 114 individual results are verified; six missing ESPN player rows remain unverified. This report does not prove which exact cards a particular user saw. **The earlier 316-row weekly backend audit is a different prediction population.**

## Actual numerical model accuracy, NOT 65% easy-target hits

- 72 verified count outcomes; 20 exact after nearest-integer rounding; count mean absolute error (MAE) 1.667.
- 42 verified yardage outcomes; 0 exact; yardage MAE 29.714 yards. Of these, 13 were within 10 yards.
- Every original projection stays in the denominator. Do not remove bad-weather or in-game injury outcomes from the official historical grade.

### Largest yardage errors and supported explanations

| Pregame projection → final | Absolute error | Evidence-based diagnostic explanation |
|---|---:|---|
| Baker Mayfield pass: 182 → 0 | 182 | Torrential rain, 0 completions on just 3 attempts. Tampa Bay coach directly described severe conditions; **Mayfield played** and was a full practice participant (thumb risk, not documented game-ending injury). |
| Tyler Allgeier rush: 22 → 147 | 125 | Cardinals RB Jeremiyah Love (ankle) and Bam Knight (concussion) exited; Allgeier inherited backfield work and made explosive runs. |
| Bucky Irving rush: 56 → 170 | 114 | Extraordinary rain-driven run-only game in Tampa; the club ran for a franchise-record 324 yards. |
| Adonai Mitchell receiving: 30 → 142 | 112 | Jets team confirms 7 catches/9 targets and a career high. This is an offensive role/output upside failure, **not confirmed injury-driven** for Mitchell. |
| Drake London receiving: 63 → 8 | 55 | Falcons game in severe rain and 16–0 shutout; weather/game script is an obvious contributor but exact causal share not identified. |
| Chris Godwin receiving: 50 → 0 | 50 | Buccaneers completed 0 passes in extreme rain; not attributable to Godwin's own injury without evidence. |
| Brock Bowers receiving: 51 → 92 | 41 | Seven catches and two TDs in high-scoring Raiders–Jets game; not shown to be injury-driven. |
| Ashton Jeanty receiving: 26 → 64 | 38 | Three catches for 64 yards, including large-play contribution; not shown to be injury-driven. |
| Blake Corum rush: 37 → 73 | 36 | Additional usage/efficiency variance; no causal injury attribution established. |

### Error concentration / sensitivity (diagnostic only)

Total absolute yardage error: **1,248 yards / 42 = 29.714-yard MAE**.

- Atlanta–Tampa Bay's **four** tracked yardage rows contribute **401 of 1,248 (32.1%)** in absolute error.
- Including Allgeier's **125-yard** miss gives **526 / 1,248 (42.1%)** of all yardage absolute error from **five** of 42 rows.
- Excluding Atlanta–Tampa Bay as a *descriptive sensitivity check* gives 847/38 = **22.29-yard** MAE.
- Also excluding Allgeier gives 722/37 = **19.51-yard** MAE.
- These are retrospectively selected outliers and **must not** replace 29.714 as reported model performance.

### Count-projection failure mechanisms

- **Zay Flowers 4 expected receptions, 0 actual**: Ravens starting QB Lamar Jackson injured his throwing thumb on the very first snap, and backup Tyler Huntley subsequently left with a toe injury. This was an in-game QB shock. A separate QB-role quality contingency may reduce pregame confidence but cannot foresee the exact injuries.
- **Harold Fannin 3 expected receptions, 10 actual**: 12 targets, 41 routes on 49 QB dropbacks and 57 of 67 offensive snaps in a trailing Browns effort; possibly lagging role/target share, not demonstrated 'poor player talent'.
- **Tee Higgins 4 vs 10 and Ja'Marr Chase 5 vs 11**: 43–36 overtime shootout; Joe Burrow 48 attempts and 462 yards; large game-level pass-volume shock.
- **Jeremiyah Love 2 expected receptions, 0 actual**: RB had an ankle injury history and then exited midgame. His receiving role was truncated.

### Pregame vs unknowable evidence

**Knowable before kickoff:** Love had recently returned from an ankle issue; Tampa rain was forecast October 29/30 and noted pregame; a team could model weather *risk* and snap/route uncertainty. The currently reviewed `nfl_phase1_team_environment.py` code does not expose an explicit rain/wind feature; this is a targeted code-review lead, **not proof that no other upstream subsystem handles weather**. The availability module explicitly models injuries, and T24 has no game-day active roster list by design (T90 does).

**Unknown before kickoff:** exact multiple in-game quarterback/RB injuries, Tampa completing zero passes, individual explosive runs, Mitchell's exact career-best output. The correct pregame response is a probabilistic mixture or uncertainty/no-selection gate, not hindsight replacement of predictions.

**Selection problem independent of injuries:** the frontend's default 120 slots consist of 75 receptions, 28 receiving yards, 11 rushing yards, three passing yards, and three passing TDs. This selection heavily favors easy 1+ / 2+ catch events from a 65% target probability. That is a separate ranking objective from accurate **numerical medians**. A target 'hit' is not validation of the projected median.

## Primary references

- [Locked V2 numerical median vs actual audit](./nfl_week8_nov1_frontend_numeric_accuracy.json)
- [Full 120-player numerical report](./NFL_WEEK8_NOV01_FRONTEND_NUMERIC_PROJECTION_GRADE.md)
- [Official Tampa Bay postgame recap](https://www.buccaneers.com/news/falcons-bucs-week-8-recap-postgame-report-2026)
- [Buccaneers pregame injury and participation report](https://www.buccaneers.com/news/2026-game-preview-falcons-buccaneers-week-8)
- [Falcons official rainy-game account](https://www.atlantafalcons.com/news/falcons-say-wet-conditions-can-t-be-excuse-for-overall-play-in-loss-to-bucs)
- [Oct 29 predating forecast of the Tampa rain risk](https://www.fantasyalarm.com/articles/nfl/nfl-weather/nfl-week-8-weather-report-fantasy-football-dfs-impact/197947)
- [NFL Ravens QB injury report](https://www.nfl.com/news/ravens-qb-lamar-jackson-suffers-right-thumb-injury-bills)
- [Cardinals RB injury exits](https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/cardinals-rule-out-jeremiyah-love-bam-knight-kendrick-bourne)
- [Arizona Oct 30 Love pregame return status](https://www.azcardinals.com/news/injury-report-week-8-vs-cowboys)
- [Jets official Adonai Mitchell career game](https://www.newyorkjets.com/news/adonai-mitchell-posts-career-game-in-loss-to-the-raiders-11-01-2026)
- [Browns Harold Fannin postgame role](https://www.nbcsports.com/fantasy/football/player-news/2026-11-01/fannin-has-career-highs-in-catches-and-yards-in-loss)
- [Bengals team game report / passing volume](https://www.bengals.com/news/bengals-titans-recap-postgame-notes-quotes-stats-week-8-2026)
- [T24 availability design](https://github.com/deshawnclark116-prog/mlb-picks2/blob/main/nfl_phase1_availability.py)
- [V2 team environment feature model](https://github.com/deshawnclark116-prog/mlb-picks2/blob/main/nfl_phase1_team_environment.py)

## Proposed experiments — **not yet installed or promoted**

1. Build timestamp-correct weather/rain/wind severity and *separate pass-volume uncertainty* at T24 and T90; measure against historical baseline, not just Tampa.
2. Build role-mixture conditional on injury status of primary and backup RB/QB, true game-day inactive list and timestamped replacement usage, with stale data => no confident forecast.
3. Train role stability/calibration strata (high-snap established starter, split role, new starter, volatile/low-snap player); never just designate 'bad players' by reputation.
4. Evaluate accuracy improvement across prior seasons and untouched subsequent weeks; compare model medians, MAE, pinball loss/calibration by conditional role/weather slices. No posthoc 2026-11-01 optimized promotion.
5. Ensure frontend ranking targets **source-backed expected stat & P(a precisely stated outcome)**, no ranking that validates a low/easy threshold as proof of numerical skill.

This diagnosis preserves the raw errors and separates *pre-known risk*, *in-game unforeseen shocks*, and *model selection/role errors*.
