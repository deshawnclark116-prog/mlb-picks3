# NFL frontend model-projection selector — research decision, November 2, 2026

**Status: DO NOT PROMOTE.** No production model or UI selection change was made by this research. Original historical forecasts and final outcomes remain frozen.

## User objective

Frontend game cards should show a defensible **mix of actual model-generated rounded numerical projections** and a model-estimated chance of a **precisely defined** event. Do not rank the easiest 65%+ alternate milestones and then misrepresent their success as numerical projection accuracy. Do not force ten picks per game if fewer satisfy the evidence gates.

## Evidence and diagnostic experiments

Source populations:
- 2026 Week 7: 14 archived T24 game batches, originally published before kickoff, retrospectively matched to verified ESPN final player box scores.
- 2026 Week 8 (Nov 1): 12 archived T24 game batches, retrospectively matched to final box scores; the old frontend ten-per-game population is separately reconstructed from its published snapshot.
- Both are **known historical development data**, not an untouched prospective holdout. No rule was tuned and promoted on these samples.

### Model distribution properties

The Week 8 source yielded 464 positive rounded count/yard forecasts with P(active) ≥75%. Average **uncalibrated simulation probability** of reaching the original rounded median: 61.5% (receptions, n=170), 66.5% (passing TDs, n=22), 50.9% (receiving yards, n=165), 51.1% (rushing yards, n=77), 50.3% (passing yards, n=25). This is why a common 65% cutoff on the real median would reject nearly all yardage forecasts.

For count events use `P(X>=rounded median)` from the **original full CDF** and separately `P(X=rounded median)`. For yards use `P(Y>=rounded median)` and a clearly labelled **P(within ±10 yards)** (passing ±25). A **band** chance is NOT an exact-number chance. No percentages are forward-calibrated yet; don't show them as verified hit rates.

### Selection ablation

| Frozen week | Policy | Candidate selections | Verified | Unverified | Count mean absolute error | Yardage mean absolute error |
|---|---|---:|---:|---:|---:|---:|
| 7 | Existing easier 65%+ target ranking | 140 | 139 | 1 | 1.472 | 24.460 yd |
| 7 | Highest chance reaching rounded median | 140 | 133 | 7 | 1.203 | **No yardage candidates** |
| 7 | Preliminary diverse mix | 140 | 130 | 10 | 1.000 | 13.485 yd |
| 8 | Existing easier 65%+ target ranking | 120 | 114 | 6 | 1.667 | 29.714 yd |
| 8 | Highest chance reaching rounded median | 120 | 108 | 12 | 1.528 | **No yardage candidates** |
| 8 | Preliminary diverse mix | 119 | 99 | 20 | 1.163 | 17.320 yd |

**Interpretation:** Mixed candidates showed lower yardage error **among verified rows**, but coverage got much worse: the mixed rule selected 30 unverified events / 259 versus 7 / 260 from the old selection. The ratio is not comparable to a true accuracy improvement; unresolved appearances may not be random. No claim of a promoted winner is justified.

The preliminary mix used P(active)≥0.9, projected-median attainment probabilities and original distribution concentration, plus maximum family quotas. It still favored trivial low-volume predictions (1 reception, 5–10 yards) with high model-estimated activity confidence and unresolved final participation. This reveals an **availability/role calibration fault in the source**, not just a bad frontend ordering function.

A post hoc simple volume floor (receptions >=2, receiving yards >=20, rushing yards >=25, passing yards >=150) retained only **27/140** Week 7 and **24/119** Week 8 preliminary mixed selections, around two per game, and did not reliably improve yardage accuracy. It is **not approved** as a blanket solution.

## Required architecture for a credible game-level shortlist

1. **Pregame integrity and team identity:** Only pre-kickoff first-seen forecasts; no game-final, in-game, or postgame signals in selection. Prefer verified player IDs rather than potentially ambiguous names.
2. **Availability and position-role confidence gate:** Use timestamped game-day active/inactive confirmation when available (T90), QB starter status, team depth chart, injury participation, recent snaps/routes/targets/carries, and teammate absences. The original high P(active) is NOT enough: Week 7 and Week 8 research revealed off-roster/nonparticipating players with P(active)>0.95. Unverified or conflicting role may require **no selection**.
3. **Weather and workload risk:** Preserve injury, rain/wind severity, game-script sensitivity and expected-opportunities uncertainty as model features or reject/warning factors. Never infer a postgame injury was knowable beforehand.
4. **Prediction semantics:** Main card = exactly one original rounded model median (or a validated champion output). For count statistics show **P(at least rounded count)**; for yardage show P(at least rounded yards) and optionally a clearly distinct accuracy band (with units). Neither a 65% easy alt nor a wide band may masquerade as the projected count's success rate.
5. **Market-specific quality scores:** Calibrate model outcome probabilities and numerical accuracy *per stat type*. Compare source-only baselines, Brier/reliability, count exact and ±1 accuracy, yardage MAE and fixed ±10/±25 band coverage, injury/role strata. No universal 65% median gate.
6. **Controlled diversity, not quotas that inject weak picks:** Ranking should favor validated confidence and uncertainty first; soft caps on duplicative receptions or correlated same-player outcomes; at most ten per game but **fewer if evidence fails**. No forced market mix or mandatory ten picks.
7. **Reproducible viewer logging:** Archive actual final ranked output per game at fetch/serve time, original publication timestamp/horizon/source, lineup/role gate, projection, event/probability semantics and model version. Compare those exact served candidates to final stats, including missing or DNP, instead of claiming raw feed backtests are frontend results.
8. **Promotion gate:** Need walk-forward data across multiple full weeks with strict timestamp discipline and **new untouched forward weeks**; avoid promoting rules selected using the evaluated Week 7/8 results. Require improvement in error, calibration and verified coverage, with no unacceptable subgroup harm.

### Next scoped test

Reconstruct timestamped player participation/availability from **prior** active reports and route/snap history for every candidate. Audit the specific high-P(active) selections absent from the final box. Compare Brier and coverage of current P(active) versus a reliable source-backed T90 gate, *before* optimizing ranking scores or frontend cards. Once that gate passes, run locked selectors on new future games.

### Frozen evidence

- [Week 7 research ablation](./nfl_week7_projection_selection_shadow_ablation.json)
- [Week 8 research ablation](./nfl_week8_projection_selection_shadow_ablation.json)
- [Week 7 per-game research candidates](./NFL_WEEK7_FRONTEND_SELECTION_SHADOW_TEST.md)
- [Week 8 per-game research candidates](./NFL_WEEK8_FRONTEND_SELECTION_SHADOW_TEST.md)
- [Actual Week 8 numerical model-grading record](./NFL_WEEK8_NOV01_FRONTEND_NUMERIC_PROJECTION_GRADE.md)

**Status: research candidates only; live NFL frontend selector remains unchanged.**
