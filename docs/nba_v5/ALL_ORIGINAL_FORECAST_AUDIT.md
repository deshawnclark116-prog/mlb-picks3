# V5 original pretip all-player calibration repair

**Status:** additive immutable-source replay implemented. This does not alter
live means, simulation distributions, lineups, or the existing champion.

## Why this was needed

The 2026-11-06 `docs/nba_v5_grades/summary.json` contains two completed
first-seen game grades but its `stated_unconditional_chance_vs_actual` is
empty. Those original snapshots were written before the newer explicit
`reach_probabilities` row format. The grading summary only checks that
new field, so the older original opportunities were silently excluded from
all-scenarios calibration.

The frozen original row already stores the *real* simulated `cdf_lattice`,
`p_active`, `mean`, and exact player/stat identity. We can derive
`P(stat >= original whole-number projection AND plays)` directly from
what the model knew **before tipoff**. We must never substitute a different
threshold or use the final score to reconstruct a probability.

## Implemented

`nba/nba_v5_original_audit.py` reads immutable
`docs/nba_v5_archive/first/*.json.gz`, verifies original projection and
participation chance against the independently graded first-seen final
record, and derives:

1. `whole(original_mean)` with **the existing 0.6 rounding rule**;
2. `P(reach | plays)` from the frozen original lattice;
3. `P(reach including DNP) = P(plays) * P(reach | plays)`;
4. the real hit/miss at that same whole-number level, with DNP = miss;
5. every original player and all seven counting stats, displayed and
   undisplayed, not just the frontend top four;
6. original mean error and original p10–p90 interval coverage **only if
   the player actually played**;
7. game-by-game, market, participation, play/DNP and role-stratified Brier
   / calibration with absolute counts, never cherry-picked subsets.

An old or damaged distribution is explicitly **UNGRADABLE** instead of
receiving a fabricated estimate. Missing finished-game rows, changed player
IDs, mismatched projections, duplicate records or changed capture timestamps
fail closed. Original archives and previously issued grades are not modified.

An independent `nba_v5_original_audit_publish.yml` workflow runs after
successful final grading (and on its own schedule), writing
`docs/nba_v5_grades/original_all_rows_audit.json`. Audit failures never block
capture of the existing immutable original result grades. The result contains
each original forecast and final outcome, plus all summary cohorts. Unfinished
games stay pending rather than being imputed.

### Run on archived games

```bash
python -m nba.nba_v5_original_audit \
  --archive-first docs/nba_v5_archive/first \
  --grades-first docs/nba_v5_grades/first \
  --out /tmp/nba_v5_original_all_rows.json
```

**Promotion gate:** a report computed from 2 games, or any reused historical
trial, cannot calibrate or approve a new model. The audit explicitly marks
fewer than 100 independent graded games as still requiring forward evidence.
Brier, error, coverage and top-of-board stability must be assessed over
future, untouched games; the 100-game indication is a *floor for review*,
not automatic proof.

## Other remaining blueprint gaps

Play-type/optical tracking, opponent assignment and confirmed pregame
minutes restrictions remain source-gated. The independent PBP Stats export
contract is in PR #95; it does not assert those unavailable measurements.
