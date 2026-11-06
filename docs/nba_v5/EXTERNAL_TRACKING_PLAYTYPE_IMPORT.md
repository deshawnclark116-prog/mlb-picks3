# NBA V5 advanced tracking and play-type ingestion

**Engineering status: input contract implemented. Provider data NOT ACQUIRED;
advanced effects NOT promoted.** No sportsbook data is involved.

V5 can now validate and join authorized third-party player tracking and play
type aggregates from local JSON snapshots. The information is allowed to
enter source diagnostics only. No fake values are substituted when a provider
is unavailable, and no licensed raw row is redistributed into public
\`latest.json\`.

## Required data delivery

Do **not** commit licensed raw exports or provider credentials to GitHub. Make
them available to an authorized private execution environment and pass one
\`--licensed-data /secure/path/data.json\` per dataset.

Example schema (illustrative fabricated fixture values, *not NBA observations*):

\`\`\`json
{
  "provider":"AUTHORIZED_PROVIDER_NAME",
  "dataset_schema":"NBA_PLAYER_TRACKING_AGGREGATES_V1",
  "source_documentation_url":"https://authorized-provider.example/docs",
  "license_or_authorization_reference":"private_subscription_receipt_reference",
  "observation_end_utc":"2026-11-05T23:00:00Z",
  "published_at_utc":"2026-11-06T10:00:00Z",
  "captured_at_utc":"2026-11-06T12:00:00Z",
  "player_rows":[{
    "team_id":"2","player_id":"101","sample_games":12,
    "features":{
      "touches_per_game":58.3,
      "drives_per_game":10.1,
      "potential_assists_per_game":7.5
    }
  }]
}
\`\`\`

Accepted \`dataset_schema\` alternatives:

- \`NBA_PLAYER_TRACKING_AGGREGATES_V1\`: touches, drives, passes,
  possession time, potential assists, rebound chances, contested rebounds,
  screen assists, contested shots, nearest-defender shooting distance,
  shot-clock average and related legitimate measurements.
- \`NBA_PLAYER_PLAY_TYPES_V1\`: isolation, pick-and-roll ball handler,
  pick-and-roll roll man, spot up, handoff, cut, off screen, post-up,
  transition and offensive rebound possession volumes and quality.

The validator explicitly requires the provider's authorization reference,
source documentation URL, valid UTC capture/publication/end-of-observation
timestamps and numeric ranges. Observations ending **after the forecast
time** are rejected, as are duplicates, ambiguous identities, unknown team
assignments and postdated reports. Rejected records are counted.

Only the present official/ESPN source roster may determine eligible
(player,team) pairs. A historic former-team identifier is not silently
reassigned after a trade.

## Connection and promotion contract

The code:

- \`nba/nba_v5_external_source.py\`: validating import and quality audit
- \`nba/nba_v5_forecast.py --licensed-data PATH\`: attach data-quality metadata
  and per-player coverage only; no raw field values in publicly published
  forecasts, no change to Monte Carlo rate inputs.
- \`tests/test_nba_v5_external_source.py\`: timestamp, mapping, duplicate,
  missing authorization, invented field and plausibility protections.

No API key is bundled. Automatic extraction of NBA.com / Synergy / provider
data, or new causal defender assignments, is **NOT implemented**. A source
may be public on a website while still not allowing unrestricted automation
or redistribution.

Once a licensed and stable live source exists, the next gated step is
to derive opposing play-type/coverage features from *as-of* observations,
condition opponent-zone and player-opportunity events on those features,
run identical-game champion-versus-challenger paired simulations, and only
promote an honestly validated forward improvement.

This delivers input-source **infrastructure**, not the full licensed
tracking-dependent basketball intelligence requested by the blueprint.
