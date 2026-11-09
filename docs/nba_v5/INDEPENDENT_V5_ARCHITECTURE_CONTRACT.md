# NBA V5 independent-engine contract — 2026-11-09

## User's intended architecture (binding)

The next version **inherits tested ideas, not the prior version's forecast values**.
V3 and V4 remain frozen research benchmarks, NOT runtime prediction inputs to
V5. Every supported player/stat threshold must originate from the V5's own
predicted stat distribution and the established x.6-up rounding rule.

Shared raw NBA sources are fine. V5 must eventually generate its own
game-specific player availability, lineup/rotation, opportunity rates,
possessions, matchup adjustments, and final player-stat distributions.
No sportsbook odds or lines participate in generating a player projection.

## Current production truth (do not mislabel)

- V5 simulates at least 10,000 complete correlated games per matchup.
- For points, rebounds, assists and threes, it mixes V5 and V4 numerical means
  and CDFs in equal proportions when a matching V4 source exists.
- V5 still consumes the V3 forecast's player list and availability prior.
- A model's historical improvement must NOT be claimed from older models'
  conditional numerical MAE alone; compare the actual featured projection cards.
- 25 games from November 5-8, 2026: V3 145/245, V4 144/249, V5 147/247
  original featured thresholds hit. This is diagnostic, not a promotion test;
  the supported stat markets differ and cards contain correlated outcomes.

## Stages / explicit exit conditions

### Stage 1: Measure V5's own simulation-only outputs — IMPLEMENTED, research only
- [x] Preserve unblended V5 player-stat means and CDFs *before* any V4 mixture.
- [x] Independently rank and round those unblended means, without lowering targets.
- [x] Keep live V5/Google AI Studio/frontend output and blend unchanged.
- [x] Freeze original research projections before game time, first and last.
- [x] Grade research forecasts using the original simulation-only targets.
- [x] Also compare identical champion thresholds with a paired forward Brier
      evaluation, including DNP.
- [x] Unit checks verify that champion input is unmodified and original rounding
      applies; no extra simulation run is required.
- [ ] Collect enough untouched games to establish credible differences.
      Research latest/first archive is empty until next legitimate run/game.

**Caveat:** This arm is independent of V4's *predictions*, NOT independent of
V3-derived roster and availability inputs. Never call it fully standalone.

### Stage 2: Replace forecast-to-forecast inputs with neutral game data — OPEN
- [ ] Provide a shared, dated, as-of-safe game facts schema sourced from raw
      schedules, team rosters, official injuries and certified starters.
- [ ] V5 estimates its own P(plays), starts, minutes and opportunity allocations.
- [ ] No `--v3` forecast-file input or `--v4` forecast-file input in final V5.
- [ ] Test absence of previous-version mean/CDF/p_active in V5's source graph.
- [ ] Every row includes provenance, confidence/coverage, and role state.
- [ ] Verify source freshness, player-to-team identity, transfers and out/DNP.

### Stage 3: Improve game-specific player opportunity — OPEN / RESEARCH
- [ ] Falsify/test a better pretip minutes and rotation distribution, including
      confirmed five, injuries, conditional substitutions and foul/blowout risk.
- [ ] Falsify/test per-player possessions, shot volume, 3PA, possible assists,
      rebound chances, usage redistribution and opposing scheme based on
      genuinely observed past information.
- [ ] Promote existing disabled research features only after new untouched
      forward evidence; many historical ablations were neutral or negative.
- [ ] Keep complete-game simulator's conservation/identity checks at >=10k
      joint worlds, with no fabricated tracking coverage.

### Stage 4: Compete fairly against previous versions — OPEN
- [ ] Before games, freeze a V3 card, V4 card, unblended V5 card, and old
      production-blend card, each at its OWN original rounded threshold.
- [ ] After games, grade all featured projections game by game, player by
      player, not cherry-picked winners. DNP is a miss for positive targets.
- [ ] Report actual hit rate, forecast/target deviation, market mix,
      calibration and both same-market comparisons and own-card selection.
- [ ] Include all original covered games and publish missing/invalid-source
      exclusions. Never silently pad cards with weaker selections.
- [ ] Compare with paired game-level/season-forward holdouts; no rescue-tuning
      after opening a holdout.

### Stage 5: Production promotion — BLOCKED until Stage 2–4 pass
- [ ] New V5 must beat the strongest viable predecessor on the predeclared
      target-quality and forward reliability metrics, not novelty alone.
- [ ] Preserve incumbent champion and rollback path; do not silently alter
      existing target rule or frontend displays.
- [ ] No claim of calibrated 70-80% performance until verified prospectively.

## Prohibitions
- No forcing category diversity, arbitrary high-confidence re-selection,
  manipulating model targets to easy thresholds, odds shopping, or marketing
  promises instead of genuine model skill.
- No model forecast dependencies disguised as shared raw data.
- No replacing uncertainty modeling with more Monte Carlo draws.
- No producing pick hit-rate claims from a postgame-selected subset.

## Source code and research outputs
- `nba/nba_v5_forecast.py`
- `.github/workflows/nba_v3_latest_refresh.yml`
- `.github/workflows/nba_v5_postmortem.yml`
- `tests/test_nba_v5_unblended_research.py`
- `docs/nba_v5_independent_latest/latest.json` (populated at genuine pretip run)
- `docs/nba_v5_independent_archive/{first,last}/<game>.json.gz`
- `docs/nba_v5_independent_grades/{first,last}/<game>.json`
- `docs/nba_v5_forward/unblended_simulation_challenger_latest.json`
