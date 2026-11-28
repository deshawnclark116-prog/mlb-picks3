# NBA WORLD experiment registry

## WORLD V1 — frozen, no promotion
Commit 9ea756f685ff1b5e1ec10a9c759cf438605bb1fe, run 46170115841.
640 training games, 506 validation games, 142 archived evaluation games,
15,264 graded rows. All-player MAE (V5 -> WORLD): points 4.5944 -> 4.7150,
rebounds 1.8818 -> 2.1820, assists 1.3326 -> 1.4407, threes .9167 -> .9419.
Availability Brier .13131 -> .11760; threes fixed-event Brier .24689 -> .23385.
Top4 364/568 -> 366/568; Top10 872/1420 -> 891/1420.
28 raw box/grade conflicts excluded. November is exploratory and archived V5
is not necessarily identical to the current market-specific production stack.
Numerical performance rejected; availability and three-point probability are
research signals, not promoted.

## ANALOG V1 — independent non-neural challenger
Retrieve player-specific historical situations using time decay, teammate
composition, opponent's prior defense profile and home/away. Compare against
recency-only analogs, choose per market on December-February observations.
Separate March-April calibration of conditional and availability probabilities.
November paired grading uses immutable old targets and forecasts. No old
model features, stat estimates, or parameter weights imported. Explicitly
record no-history abstentions and source discrepancies. No promotion from
this already examined November test.

## Next source priority
Expand historical seasons and collect timestamped pregame roster/availability
information. Existing data are not sufficient to validate true coach intent or
defender matchup assignment. Do not claim tracking until actual source access
and coverage are established.

## Verified source reconciliation
Run 46168467075 checked 15,292 original rows. All 28 conflicts were confirmed in favor of archived grading using freshly retrieved final ESPN outcomes. A read-only correction ledger carries the original audit and hashes. Apply exact matched corrections to evaluation outcomes only; preserve all raw inputs and frozen forecasts. Six minutes differences remain separate. Original WORLD V1 results above remain unchanged.

## ANALOG V1 corrected outcome result
Run 46170454331: 15,292 rows across 142 games, all 28 corrections, zero remaining conflicts. Minutes MAE 5.0403 -> 4.7870; points MAE 4.5951 -> 4.5215, rebounds 1.8773 -> 1.8828, assists 1.3340 -> 1.3237, threes .91675 -> .92061. Top4 365/568 -> 364/568; Top10 unchanged 872/1420. No promotion. Corrected neural rerun 46170454318 lost on all numerical markets but Top4 385/568 and Top10 907/1420; neural rerun variation indicates nondeterminism requiring seed replication before claims.

## Expanded source acquired
Run 46170510786 acquisition: 1227 (2023), 1229 (2024), 1228 (2025) verified regular-season games; total 3684. Thirteen candidate games rejected (4,3,6 respectively); authoritative per-season rejection counts in source manifest. Expanded neural training in progress at registration.

## DISTRIBUTION V1
New architecture: independent learned conditional count survival functions using expanded historical examples, explicit teammate resource/role features, monotone threshold classifier, separate direct numerical and minutes regressors, and separate later calibration. Equal original target evaluation and own target descriptive metrics. No automatic promotion.
