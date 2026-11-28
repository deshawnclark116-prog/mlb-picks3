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
