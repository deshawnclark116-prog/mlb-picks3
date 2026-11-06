# NBA V5: genuine forward lineup challenger evaluation

## Why this exists

Retrospective basketball replay tests often know exactly who played and the
final roster. Even perfect train/test chronology on that information does NOT
establish pregame availability calibration or that a model would have produced
the same numbers before the opening tip.

The lineup-pair model looked promising for point-count probabilities on 68
historical games (Brier improvement +0.001545). We must not continually tune
on those already-tested games, nor claim superiority from those numbers.

## Immutable prospective contract

At a genuine NBA V5 **first pretip** forecast:

1. Keep the champion's existing `docs/nba_v5_archive/first/<game>.json.gz`
   untouched, including model-derived means and the full integer CDF.
2. Only if the champion snapshot is less than 30 minutes old and tipoff is
   still at least 15 minutes away, run an otherwise identical V5 model with
   `lineup_pairs: true` and all other switches unchanged.
3. Freeze the challenger into a **separate** `docs/nba_v5_lineup_archive/first`
   file, never used by the public frontend or production projections.
   Its source is an identical 3000-draw V5/V4 blend, V3 roster snapshot,
   official/ESPN injury receipts and prior-season game history. A truncated
   V3 input contains *only* newly eligible games, preventing an old game from
   acquiring a false historical challenger after the fact.
4. At final, grade all the original champion and challenger player/stat rows,
   including bench players, all seven stat markets and DNPs. Compare
   probabilities at the **champion's own rounded numerical projection**,
   never a lower alternate threshold. Preserve results of every single row
   in `docs/nba_v5_forward/lineup_challenger_latest.json`.
5. Fail closed if the snapshot is after tip cutoff, CDF invalid, timestamps
   not comparable, player missing or game not officially final. Game-cluster
   confidence intervals preserve same-team statistical dependencies.

Nightly scheduler: `.github/workflows/nba_v5_postmortem.yml`.
Current production V5 feature flag: `docs/nba_v5_latest/features.json`
with `lineup_pairs: false`. Its original grade loop is unchanged.

## Interpretation

- A zero-pair report on the first run is **expected**; the infrastructure
  cannot go back in time to invent first-seen experimental forecasts.
- Individual game outcomes will appear as real scheduled games finish.
- Do not promote lineup_pairs without sufficient untouched forward games,
  a defensible representative playing/DNP sample, statistically meaningful
  point MAE/Brier improvement, good 80% interval coverage, and no
  unacceptable damage to other markets.
- This is an honest experiment with one already predeclared hypothesis and
  absolutely no sportsbook lines.
- The two runs are within a maximum 30-45 minute data interval; injury news
  can change even then. A future stronger paired evaluation could replay the
  single captured source snapshot with both arms in one process.

## Reproduction

```bash
python -m unittest discover -s tests -p 'test_nba_v5*.py' -v
python -m nba.nba_v5_forward_compare \
  --champion-archive docs/nba_v5_archive \
  --challenger-archive docs/nba_v5_lineup_archive \
  --grades docs/nba_v5_grades \
  --out /tmp/forward_lineup_comparison.json
```

Note: a public-facing player prediction is always the incumbent champion
unless *future* independent validation and an explicit reviewed feature
promotion change this. The experimental CDF remains research-only.
