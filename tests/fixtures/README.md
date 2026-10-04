These are curated read-only snapshots from the published October 4, 2026 T90 ARI/NYG forecast. Three real compact rows are retained; fixture row/game counts are adjusted accordingly. Only two downstream display lines are retained. T24 is genuinely empty. Forecast values and corresponding distribution arrays are unchanged.

Publication source: https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nfl_phase1_shadow.json
Distribution source: https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/nfl-shadow-state/forecasts/batches/2026_wk04_T90_2026_04_ARI_NYG.jsonl
Original complete batch footer SHA256: 58453f85391aae82f8a9534b2d029aeaf087bccd3cc384a56bec211ed6ceb904

Unit checks construct a footer for the three-record subset to exercise verification, including tampering. Browser checks freeze their clock at October 4 and mock only transport. Synthetic horizon/count/clock edits in individual tests exercise isolation and error handling; they are never written to source artifacts.

`nfl-nyj-chi-bettable.json` retains the full 286-row October 4 T90 NYJ/CHI outcome universe and all 19 original downstream lines. Only the game set and count metadata are narrowed to that matchup. Its `alt_65` values come from the existing verified shadow-batch port; model values are unchanged. The old line timestamp is intentionally retained to exercise the freshness warning. This fixture is presentation evidence, not a new scientific forecast or protocol.
