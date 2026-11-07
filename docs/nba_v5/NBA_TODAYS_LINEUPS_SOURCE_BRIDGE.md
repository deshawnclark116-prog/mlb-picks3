# NBA V5 confirmed starters: NBA daily lineups JSON

Source page: https://www.nba.com/players/todays-lineups

Direct daily NBA JSON (dated ET):
`https://stats.nba.com/js/data/leaders/00_daily_lineups_YYYYMMDD.json`

The source was successfully read from a GitHub Actions runner on November 6,
2026 (HTTP 200, 9 games, structured `games` / `homeTeam` /
`awayTeam` / `players`). No API key is required for that successful
public endpoint observation; datacenter access may vary over time.

## Important source semantics (validated against actual November 6 feed)

- `gameStatus == 1` = not yet started; 2 and 3 cannot certify a new pregame run.
- A team's `players` array contains the roster, not only its five starters.
- **`lineupStatus: "Confirmed"` can appear on all 17–18 players**, including
  bench players. It is NOT a standalone starter flag.
- Exactly one `PG`, `SG`, `SF`, `PF`, and `C` in `position`, each with
  `lineupStatus: "Confirmed"` and `rosterStatus: "Active"`, defines
  the validated five. No partial, unconfirmed, inactive or ambiguous team
  may change the V5 rotation.
- NBA `playerName` must match a unique name on the current ESPN game roster.
  Source NBA player IDs and ESPN player IDs are not treated as interchangeable.
- The feed has `timestamp` strings with no explicit offset in the inspected
  response; these are NOT assumed to represent a pretip publication time.
  Only our actually observed pretip fetch time is used as source evidence.

## Production workflow

- `nba/nba_v5_daily_lineups_feed.py`: fetch, parse, validate dates and
  not-started status, match to ESPN identities, produce V5
  `NBA_V5_PREGAME_LINEUP_V1` evidence and a detailed source audit.
- `.github/workflows/nba_v5_daily_lineups_poll.yml`: check every five
  scheduled minutes for games within two hours of tipoff. GitHub scheduling
  is best-effort and may be delayed.
- `nba/nba_v5_daily_lineups_trigger.py`: persist each confirmed five
  fingerprint and dispatch an immediate V5 refresh only on an initial
  confirmation or a genuine change (such as a late scratch).
- `.github/workflows/nba_v3_latest_refresh.yml`: pull the NBA daily JSON
  again after obtaining the current ESPN roster; use whichever available
  verified pretip source confirms the greatest number of teams. On ties
  prefer official NBA daily JSON, then separately permissioned capture,
  then the existing NBA live boxscore source. Preserve the source-selection
  and source-audit files in `docs/nba_v5_latest/`.
- V5 simulates **10,000 whole games** with verified starters via
  `--pregame-evidence`. No bookmaker props are needed for this layer.
- `nba_v5_refresh_decision` allows new lineup evidence with at least five
  minutes before tipoff; it must not certify observations from after tipoff.
- A feed outage, mismatch, stale data or only `Expected` statuses results in
  **NOT_POSTED**, never fabricated `CONFIRMED`.

### Fallback and usage rights

The existing NBA live-boxscore source and an optional authorized snapshot
source remain fallback paths. Do **not** introduce automated RotoWire scraping
as an unlicensed backup; RotoWire's publicly viewable page is not a free API.

A working unkeyed NBA URL is not automatically a grant of NBA statistics
reuse rights for betting or commercial applications. Check applicable NBA
terms/permission before operating this feed for such use.

### Verification

Test:
`python -m unittest discover -s tests -p 'test_nba_v5_daily_lineups*.py' -v`

Check latest forecast:
- `docs/nba_v5_latest/lineup_source_choice.json`
- `docs/nba_v5_latest/lineup_source_audit.json`
- `docs/nba_v5_latest/readiness.json`
- Each row's `starter_evidence` and `starter_source`.
- Each game's `certified_pregame_team_effect`.

**Do not call the feed live-confirmed on the frontend until a forward
pre-tip run has a nonzero confirmed team count AND the simulation receipt
proves those starters were actually applied before tipoff.**
