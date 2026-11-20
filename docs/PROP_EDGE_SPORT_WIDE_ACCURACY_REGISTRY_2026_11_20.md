# Prop Edge: independently audited model accuracy baseline
Frozen investigation opened November 20, 2026

**Mission:** maximize empirically supported prediction accuracy for every
sport and market. Never assume a more elaborate simulator beats a simpler
model. Never promote based on a code test, a changed betting-card threshold,
an unverified final, a backfilled original, a profitable-looking subset, or
an already-consulted holdout.

## Findings from actual original/graded model artifacts

### NBA — urgent architecture choice (research only)
- On **25** original pregame comparable NBA games, **484** played-player
  numerical rows PER market (1,936 across four core markets), the frozen
  standalone **V4** component had lower MAE than both the frozen blend and
  standalone V5 **on all four core markets**.
  - PTS V4 4.9244; blend 5.2555; V5 5.7488.
  - REB V4 1.96895; blend 2.07112; V5 2.23983.
  - AST V4 1.53271; blend 1.59894; V5 1.73262.
  - 3PM V4 0.92743; blend 0.97139; V5 1.02787.
- On **14 games, 1,150 same frozen original research threshold events**,
  V4 also had a lower Brier score than V5 for every core market:
  PTS .202585 vs .240634; REB .232546 vs .259575;
  AST .227413 vs .260001; 3PM .233982 vs .251790.
  Both arms used the same frozen individual threshold and original game.
  This research does NOT prove sportsbook ROI or a head-to-head V3 win.
  **74 saved zero-threshold events** are disclosed as unscorable, not
  fabricated wins; all original nonzero research thresholds are preserved.
  The production-target certification remains FALSE while zero events exist.
- Earlier NBA source-specific root-cause report shows V5 overprojecting
  playing time by about +5.16 minutes on average among 246 modeled-player
  entries across 11 available games, a clear opportunity-model weakness.
  Do not tune a retrospective minutes multiplier on this consulted cohort.
- **Decision:** V5 is NOT automatically the champion just because it is
  a more sophisticated simulation. Real next step is a same-player,
  same-game, same-information frozen V3/V4 and entirely independent
  next-generation minutes/opportunity model competition. This study does
  not authorize production replacement without comparable forward proof.

### NFL — build a separate architecture rather than V8 increment
- November 15 W10 exploratory 176 same-player yardage observations:
  V7 median MAE 19.879 vs earlier V6B 19.166; V7 worse. Its
  historical roster source was PRODUCTION-SELECTED and incomplete,
  therefore this is NOT a genuine prospective champion selection.
- Existing actual live V2 originals remain the benchmark. New independent
  opportunity model research in the backend trains on 2024,
  chooses architecture using 2025 only, and reports 2026 as a
  *consulted descriptive* period. Conditional on recorded participation;
  cannot replace an active/DNP model or prove a betting edge.

### NHL — original numeric shot count is worth preserving
- Verified forward shot-count grade with one original V2 source:
  at T24H, **5,388 meaningful expected participants** had MAE 1.0168
  shots, versus a prior-10-game baseline MAE 1.0736 on the SAME rows.
  This is a shots-count comparison, NOT a calibration or profitability
  result.
- Original 1+ through 5+ milestone probability grading had failed when
  the official source contained repeated pregame forecast VERSIONS for
  the same player/game/horizon. The grader now matches EXACT original
  snapshot identity (timestamp, source cutoff, expected shots, team,
  schedule, immutable hash-linked final); identical duplicate entries
  dedupe, conflicting originals stay UNVERIFIED, edited hashes fail.
  No original probabilities or player selection changed.
- Maintain V2 shots champion until future pretip probability calibration
  is complete. Train roles/shots/PP time before simulating goals.

### College football — do not promote an overconfident challenger
- Prospective original moneyline comparison: **243** exact frozen
  completed games; challenger Brier .21893, incumbent .21880.
  Challenger did not improve; hold it. 2026 context probabilities
  require further calibration and pretip roster uncertainty.
- Run independent offense/opponent/roster workload validation by
  yardage/TD market, not one shared probability gate.

### Soccer and tennis — no false accuracy claims
- Soccer forward status: 157 stored original forecasts but ZERO with
  sufficient GitHub first-observed commit-time proof and final grade
  as of this freeze. Cannot promote a soccer challenger from 0.
- Tennis has a separate first-seen production backtest workflow; isolate
  match outcome from bookmaker price and verify first-seen time before
  any current-tennis accuracy claim.

### MLB — preserve frozen winners, test each market independently
- The 2026 HR current-information champion is
  ENVIRONMENT_C_LOCKED_A, and earlier 2026 feature rescues were
  rejected on forward holdout. Do not reopen failed HR experiments or
  borrow their credibility for hits, TB, runs, RBI or pitcher Ks.
- Hitter hits, pitcher Ks, TB, RBI, runs and moneyline must each have
  dedicated calibrated future labels and market-specific coverage
  audits. Monte Carlo is final uncertainty propagation, not a magic
  source of predictive signal. Offseason research uses historical
  temporal splits and preserves all original firstseen outputs.

## Nonnegotiable experiment design

1. **Source**: freeze the exact model, version SHA, player/team/game identity,
   active-lineup evidence, provider capture time, original numeric projection,
   complete conditional distribution, and lead time *before* the game.
2. **Training**: walk-forward chronological cuts; sample split by whole
   game/season; choose all parameters using training/validation only;
   retain untouched prospective comparisons for release.
3. **Targets**: MAE for numeric yards/shots/stats, Brier/log loss for events
   and moneylines, CRPS/interval coverage for distributions, and
   participation Brier separately. No probability confidence metric is
   interchangeable with a prop-hit frequency on cherry-picked targets.
4. **Comparability**: same exact games, players, markets, original timing,
   eligible candidates, and team/role coverage; report dropped/unmatched
   cases rather than hiding them; game-cluster bootstrap confidence interval.
5. **Decision**: a model must beat a strong *simple* baseline AND the
   actual frozen production champion with enough game-level coverage.
   Test code can pass while prediction accuracy fails. Never auto-promote.
6. **Scope**: an architecture trained or tested on already-inspected 2026
   results is diagnostic unless frozen in advance for later games. Do
   not "rescue tune" a failed holdout.

## Technical changes in this research submission
- NHL version-exact original forecast matching and idempotent duplicate
  receipt handling with fail-closed conflicting finals.
- NBA exact saved original research threshold scoring including DNP;
  pretip zero-threshold exclusions and source-target mismatches prominently
  reported; the separate frozen played-player numeric MAE is retained.
- No change to served NBA/NHL forecast formulas, official publication
  gates, sportsbook lines, or displayed odds. Test success is NOT
  reported as improved model accuracy.
