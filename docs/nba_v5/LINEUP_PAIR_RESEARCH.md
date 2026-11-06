# NBA V5: five-man lineup evidence — November 6, 2026

**Status:** Historical data reconstruction working; lineup-conditioned forecast
candidate remains **OFF IN PRODUCTION**. No sportsbook inputs used.

## Source and integrity

Source: ESPN play-by-play saved at
`nba/data/nba_v5_pbp_2025_26.jsonl.gz` and
`nba/data/nba_v5_pbp_2026_27.jsonl.gz`.

The model reconstructs the five on court from named opening starters plus
timestamped substitutions. Named shot, assist and rebound events are counted only
when their acting player is verifiably on one team's reconstructed five.

An ESPN event may report the *other* team's ID despite naming an active shooter.
The repair uses the independently reconstructed **on-court identity** and only
when the athlete is on exactly one of the two five-man lineups. It never
guesses an unseen substitution, inserts a player based on the final box score,
or attributes an event when the player is absent from both lineups.

Full-data audit, 1,351 saved games:

| Result | Count |
|---|---:|
| Valid reconstructed games | 1,283 (94.97%) |
| Rejected: actor absent from both reconstructed lineups | 51 |
| Rejected: impossible substitution | 14 |
| Rejected: assister absent from reconstructed lineup | 3 |
| Athlete-verified event-team label corrections in accepted games | 12,405 |
| Reconstructed player-teammate overlap ledger entries | 13,786 |
| NBA teams covered | 30 |

These numbers are observed **source data**, not a fabricated coverage estimate.
The 68 failures contribute zero lineup-pair training data; use the report in
`nba_v5_lineup_audit.py` to diagnose further, never guess their court positions.

## Candidate construction (one preregistered experiment)

- Train only from games completed strictly before the game under test.
- Compute player-specific FGA, assist, offensive-rebound and defensive-rebound
  rates per minute when each teammate is on/off the court.
- Require at least 90 historical co-minutes and 90 minutes apart.
- Shrink both on/off rates toward that player's overall rate with 240 pseudo-minutes,
  then cap each pair coefficient at log magnitude 0.13 and multiply by 0.60.
- Center the opportunity effect on the player's historical teammate-overlap
  shares, and cap total lineup log effect at ±0.22.
- Apply only to relative choice of shooter, passer or rebounder **among
  the actual five on the floor** in the current simulated segment.
- Preserve player minutes, possessions and event accounting from the existing
  simulator; keep `lineup_pairs` explicitly OFF by default.

This is a historical observational association, **not proof of a causal
teammate synergy**. Coaches, game state, competition and co-lineup selection
confound the on/off rates.

## Exploratory paired comparison, no promotion

GitHub Actions: `nba_v5_lineup_pairs.yml` on PR #82,
70 selected games after March 1, 2026, 68 scored, 1,391 player-games.
The unchanged V5/V4 champion and candidate used identical historical-game
rosters, seeds and simulation budgets. Brier scores used the CHAMPION'S OWN
rounded number to prevent easier substituted thresholds.

| Metric | n | Champion error | Pair candidate | Mean error reduction | 95% game-cluster interval |
|---|---:|---:|---:|---:|---|
| Points Brier (V4/V5 blend) | 1,186 | 0.249870 | 0.248278 | +0.001592 | [+0.000407, +0.002780] |
| Rebounds Brier (blend) | 1,102 | 0.248991 | 0.249009 | -0.000018 | [-0.001140, +0.001074] |
| Assists Brier (blend) | 962 | 0.241882 | 0.242010 | -0.000128 | [-0.001101, +0.000828] |
| Threes Brier (blend) | 1,068 | 0.237104 | 0.236809 | +0.000295 | [-0.000551, +0.001050] |
| Minutes MAE | 1,391 | 5.390999 | 5.375132 | +0.015868 | [-0.003224, +0.035779] |

Points Brier shows a promising exploratory signal; other main stats are
inconclusive. No independently untouched future period has confirmed it and
the earlier V5 research already reused parts of this historical dataset.
**Do not promote on this evidence**. Predeclare an untouched chronological
future window and evaluate all original forecasts, including injuries and DNP,
before enabling in production.

### Reproduction

```bash
python -m unittest discover -s tests -p 'test_nba_v5*.py' -v
python -m nba.nba_v5_lineup_audit --pbp nba/data/nba_v5_pbp_2025_26.jsonl.gz --pbp nba/data/nba_v5_pbp_2026_27.jsonl.gz
python -m nba.nba_v5_backtest \
  --games nba/data/nba_v4_games_2025_26.jsonl.gz \
  --games nba/data/nba_v4_games_2026_27.jsonl \
  --pbp nba/data/nba_v5_pbp_2025_26.jsonl.gz \
  --pbp nba/data/nba_v5_pbp_2026_27.jsonl.gz \
  --test-from 2026-03-01 --sample 70 --sims 500 \
  --lineup-trial --out /tmp/nba_v5_lineup_pairs.json
```
