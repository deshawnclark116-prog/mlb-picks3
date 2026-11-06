# Free-data pathway: independent possession and lineup quality audit

## Verified resources

- [pbpstats open-source library](https://github.com/dblackrun/pbpstats): constructs on-court lineups and possession context from play-by-play; package and documentation are publicly accessible. Verify upstream data terms before importing or redistributing any game data.
- [pbpstats API documentation](https://api.pbpstats.com/docs): game totals, lineup and possession endpoints. Public documentation is not a promise of unrestricted bulk API usage.
- [NBA.com Stats FAQ](https://www.nba.com/stats/help/faq): NBA states its Stats tables are not available for download for academic or personal use. Do not assume free viewing implies permitted automated bulk ingestion.
- Existing ESPN game summaries and historical play-by-play remain the V5 model's current source.

## Another confirmed free historical-data route: SportsDataverse hoopR

The [hoopR NBA loader](https://hoopr.sportsdataverse.org/reference/load_nba_pbp.html)
reads publicly published NBA seasons back to 2002 without requiring a paid
tracking subscription. As documented by the
[hoopR project](https://hoopr.sportsdataverse.org/articles/getting-started-hoopR.html),
the bulk releases include ESPN play-by-play, shot coordinates, schedules,
box scores, rosters and crosswalks. The 2025-26 season example has 642,472
play rows across 1,325 games.

**Important:** These bulk play-by-play rows originate from ESPN. They can
extend training history and reduce repeated API requests after appropriate
reuse checks, but they are *not an independent observation of ESPN game events*.
Do not cite agreement between our ESPN PBP and hoopR ESPN-derived rows as
independent validation. Use genuinely separately sourced official NBA/pbpstats
data for such cross-checks. Public release access also does not establish
commercial redistribution or an NBA optical-tracking license.

Potential chronology-safe future acquisition path: use the published
`load_nba_pbp(seasons = 2025:2026)` release assets, retain raw release
version/checksum and capture timestamp, join on audited ESPN game/player ids,
drop target-date or later games from each training window, and run identical
champion/challenger tests before any longer-history prior changes the model.

## Implemented now

`nba/nba_v5_pbp_crosscheck.py` ingests an *independently obtained, permission-compliant* JSONL export of pbpstats game aggregates and checks game/team identities and scored points against the existing ESPN event stream. All missing, mismatched and matched games are explicitly counted. No disagreement is silently corrected, and no third-party source is used as a model feature until independently validated.

Input JSONL row:
```json
{"game_id":"1","source":"pbpstats","source_observed_at_utc":"2026-11-05T23:00:00Z","home_team_id":"2","away_team_id":"30","home_points":100,"away_points":95,"home_possessions":96,"away_possessions":95}
```
Game identifiers and team IDs must already be mapped to ESPN's scheme by an audited crosswalk. The example is a format example, **not a real game result**.

Run:
```bash
python -m nba.nba_v5_pbp_crosscheck --espn nba/data/nba_v5_pbp_2025_26.jsonl.gz --independent /secure/authorized_pbpstats_games.jsonl --out /tmp/nba_pbp_quality.json
```

## Remaining work, not disguised as completion

- A real verified pbpstats export or access approval; no such source has been loaded by this change.
- Per-possession validation and game-clock/score margins, followed by replay-safe simulation features.
- Official NBA tracking and Synergy action-level data have **not** been acquired. Individual defender assignments and optical spacing cannot be derived from game-level play-by-play.
- New features still require paired, future-only model validation and explicit promotion.

The adapter is deliberately an audit first: it cannot improve projections without verified input data and testing.
