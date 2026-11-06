# NBA V5: actual free player tracking now attached to the projection pipeline

## What was verified

**This is a major core source, not an invented substitute for tracking.**

SportsDataverse publishes prebuilt NBA Stats LeagueDash parquet assets covering
36 families. Relevant NBA player tracking families include drives, passing,
possessions/touches, rebounding, and pull-up shots. The **published code/data
repository is CC BY 4.0**, requiring attribution. The upstream NBA Stats data
remain subject to the NBA's original rights, which should be reviewed for the
intended use. The release assets are publicly downloadable without a paid API
key or cloud scraping of stats.nba.com.

Attribution:
- SportsDataverse / hoopR NBA Stats Data
  https://github.com/sportsdataverse/hoopR-nba-stats-data
- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
- Dataset documentation:
  https://hoopr.sportsdataverse.org/reference/load_nba_stats_leaguedash.html
- Original NBA Stats source credited to NBA.com

## Implemented core functionality

- `nba/nba_v5_hoopr_tracking.py` downloads only **completed-season** release
  tables from `sportsdataverse-data/releases/download/nba_stats_leaguedash`.
  It never pretends that a current, unfinished season is available.
- The adapter normalizes actual tracked touches, passes, potential assists,
  drives, rebound chances, contested rebounds, pull-up attempts, and observed
  time of possession. No synthetic stand-ins.
- Exact normalized-name **and current ESPN team** roster joining; ambiguous
  players, former-team rows, unknown team abbreviations and unsupported
  identity matches are rejected, not guessed.
- Provider, license, source hashes, capture time, completed-season observation
  cutoff, source fields, coverage and unavailable families are recorded.
  The per-player source payload is kept on the private workflow runner and
  validated with the already strict `nba_v5_external_source.read_source`.
- The existing 20-minute pregame V5 refresh runs this collector, when the
  pregame forecast is regenerated, before the full game simulation and
  attaches its **observed** source coverage to original player projections.
  The V5 champion's numbers are unchanged by this source hookup.
- `nba/nba_v5_tracking_opportunities.py` connects four actual tracked
  opportunity inputs to existing simulation events: touches→relative shot
  selection, drives→free-throw-trip selection, potential assists→assister
  allocation and rebound chances→rebounder allocation. Each uses same-team
  shares relative to **current pregame historical box role**, >=5 covered
  teammates, >=15 actual prior-season games, shrinkage and a ±13% relative
  effect cap. No score, total regulation minutes, lineup eligibility or
  shot-make probabilities are independently changed.
- `tracking_opportunity_role=false` by default, awaiting a frozen genuinely
  forward paired trial. The projection switch is wired to the full V5 game
  simulation; it is **not** merely a schema with no model consumer.
- Regression tests cover data identity, source-timestamp cutoff,
  third-party validator compliance, missing fields, low coverage, safe
  off-switch and bounded actual rate changes.

## Important limitations

- The release used for a November 2026 forecast is **2025-26**, not
  the currently underway 2026-27 season. It's a historical role prior.
- A completed-season total is a *season-level aggregate*, not an exact
  observation of current-game dribbles, possession-level passes, defensive
  matchup or play-call identification. It cannot establish pick-and-roll
  frequency per game or the identity of the guarding defender.
- No external raw table is committed to the public repository. The completed
  season source is attributed above; forecasts display source coverage
  metadata only.
- The downloadable release must be reachable on the runner; if missing,
  the sourcing step fails without taking the existing champion offline.
- GitHub Actions runner/startup failures have prevented running new workflow
  tests in this development session. Until a successful workflow and source
  quality receipt exist, **live acquisition is configured, not verified**.
- Only prospectively frozen tracking-challenger predictions at equal original
  numerical thresholds and equal game/roster states can authorize turning
  the role adjustment on. No backtest against 2025-26 outcomes may use full
  2025-26 season tracking aggregates as if they had been available earlier.

## Still truly missing from the large blueprint

1. Real up-to-date current-season tracking samples with known publication
   cutoff and the ability to isolate each game window (not just previous
   completed-season aggregate).
2. **Synergy offensive play types** (isolation, pick-and-roll, off-screen,
   cut, roll man, handoff). A GitHub historic 2012-25 dataset exists but
   permission and release cadence need checking; do not silently load it as
   current game-level tracking.
3. **Individual defensive assignment/scheme** observations, including
   switches, traps, drop and zone, and causal matchup tests.
4. Genuinely forward-validated opponent-specific coaching/closing rotations
   and rookie-development effects.
5. Enough independently archived and completely graded pretip forecasts to
   calibrate probabilities by player role/opportunity and avoid overfitting.

The objective remains V5's **system-derived projections only**, no sportsbook
markets or odds.
