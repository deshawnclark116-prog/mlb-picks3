# NBA V5 live forecast readiness and release evidence

**Scope:** checks whether a current V5 file is internally consistent and
reasonably fresh; not evidence of actual predictive accuracy.

`python -m nba.nba_v5_readiness --forecast docs/nba_v5_latest/latest.json
--out /tmp/v5_readiness.json --strict` independently checks:
- UTC generated timestamp within a configurable 180-minute freshness window.
- Every game is before tipoff and forecast before the archival cutoff.
- V5 model identity, distinct game IDs and distinct player-stat keys.
- At least two players with all-scenario distributions per game.
- Valid P(active) and simulated means, never an active forecast for a reported
  OUT player.
- Monotone counting-stat CDFs and agreement between CDF-derived reach chance
  and the actual reported DNP-inclusive probability.
- Clear evidence flags when certified starters, optical tracking or strong
  forward validation are **not** connected. These flags are warnings and
  not fabricated provider readings.

The scheduled refresh writes a `docs/nba_v5_latest/readiness.json`
diagnostic report after V5 forecasts. A failed readiness check is surfaced
in workflow logs, but `continue-on-error` preserves the independent V3
publisher: no claim that the frontend has an enforced V5 failover yet.

The contract is regression-tested separately in
`tests/test_nba_v5_readiness.py`; the current GitHub-hosted CI runners are
unavailable before execution, so restoring Actions is an outstanding
production acceptance criterion.

**Still blocked for the full blueprint:** actual permitted source for
confirmed starters and real playing-time restrictions; optical player
tracking, defender-specific assignments and verified play types; full
uncertainty calibration and a meaningful untouched 2026-27 forward sample;
operational proof that automated source refresh, independent challenger
snapshots, grade publication and frontend integration run reliably.
