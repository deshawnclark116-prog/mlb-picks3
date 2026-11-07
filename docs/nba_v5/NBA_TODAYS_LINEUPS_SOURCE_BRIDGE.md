# V5 NBA Today's Starting Lineups: permissioned input bridge

Source page: https://www.nba.com/players/todays-lineups

## What's wired

The V5 pretip scheduled refresh can now accept a dated, structured export of the
NBA Today's Lineups page **from a provider authorized to supply and reuse it**.
It normalizes explicit, separately confirmed five-man starters into V5's
existing `NBA_V5_PREGAME_LINEUP_V1` evidence and uses that output in the
`nba_v5_forecast --pregame-evidence` simulation stage (10,000 complete games).
It refreshes in the normal 10-minute scheduled GitHub Actions workflow.

The new module `nba/nba_v5_todays_lineups.py` performs **no page scraping**.
The existing NBA official scoreboard/boxscore collector remains a fallback.
The winning collector's `lineup_source_audit.json` is persisted in
`docs/nba_v5_latest/` for each refresh.

### Required configuration

Set a GitHub Actions **repository secret** named
`NBA_V5_AUTHORIZED_LINEUP_JSON_URL` to the HTTPS URL of a provider-authorized
JSON exporter with the schema below. The exporter, not the GitHub workflow,
is responsible for obtaining the webpage data with the appropriate rights and
accurate timestamps. Do **not** point this secret to the ordinary NBA.com
webpage: that page is client-rendered HTML, not the JSON contract below.

If no authorized exporter has been provided, the input is off. The pipeline
does **not** automatically get starters from nba.com just because the source
URL is recorded here. NBA.com's current terms restrict use of NBA Statistics
in gambling products, and a publicly viewable page is not an API license.

### Exact snapshot contract

The following is **synthetic** and is not a real observed lineup:

```json
{
  "source_page": "https://www.nba.com/players/todays-lineups",
  "obtained_with_permission": true,
  "captured_at_utc": "2026-11-06T23:35:00+00:00",
  "games": [
    {
      "game_id": "4011111",
      "away_team": "BOS",
      "home_team": "CHA",
      "tipoff_utc": "2026-11-07T00:00:00+00:00",
      "game_status": "PREGAME",
      "teams": [
        {
          "team_abbr": "CHA",
          "lineup_status": "CONFIRMED",
          "players": [
            {"name": "Fictional Player One", "starter": true},
            {"name": "Fictional Player Two", "starter": true},
            {"name": "Fictional Player Three", "starter": true},
            {"name": "Fictional Player Four", "starter": true},
            {"name": "Fictional Player Five", "starter": true}
          ]
        }
      ]
    }
  ]
}
```

The names, ESPN game ID, teams and tipoff must match the actual V3 fixture.
A missing, stale, incorrectly matched, merely active or projected team cannot
be elevated to confirmed. Exactly **five distinct** player identities with
`starter: true` and `lineup_status: CONFIRMED` must match ESPN's roster.
The snapshot must have been observed before tipoff and within 90 minutes.
The collector never uses post-start data to certify a pregame forecast.

### Operational verification still required

1. Obtain permissioned access to a real, timely provider feed that derives
   the starting-five information. The NBA page is not yet such a feed.
2. Test the transport against real near-tipoff fixtures and confirm the source
   report contains five explicit *starters* per team, not an active list.
3. Check `lineup_source_audit.json`: `confirmed_teams > 0` and provenance.
4. Verify the V5 forecast's applied-evidence receipt and that the resulting
   probability distributions were published **before** each game's tipoff.
5. Monitor freshness/coverage across a forward season, including late scratches.

This is an **implemented, tested adapter** and scheduled runner hook, **not**
a claim that the NBA webpage's hidden client data has been reverse-engineered,
scraped, licensed, or successfully ingested live.
