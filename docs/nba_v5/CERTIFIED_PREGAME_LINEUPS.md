# NBA V5 certified pregame starter and restriction evidence

**Implemented in the simulator input:** `nba/nba_v5_pregame_certified.py`,
plus `nba_v5_forecast.py --pregame-evidence PATH`. This is a model-independent
source interface, not a claim that a third-party lineup feed has already
been subscribed, licensed or connected to the scheduled runner.

## What the model changes when actual CONFIRMED evidence exists

The independent source must be fresh (<=90 minutes), already published and
captured, before the exact game's scheduled tipoff. Both team ID and ESPN
player IDs must match a player already in the V3 game roster; a source can
never introduce a newly invented athlete. Reported OUT versus confirmed
starter, a conflicting fresh NBA report, duplicates, unknown athletes, or
fewer/more than five certified starters fail closed.

For a verified confirmed starting five, the **actual V5 Monte Carlo**
`TeamInput.starter` array is replaced, each starter receives a 99.9%
participation probability (late scratches remain possible), and explicit
inactive players receive zero participation probability. Inactive players
are listed as excluded in the public output rather than projected as active.
The probabilities in forecast output are kept consistent with the simulated
participation probabilities. Public metadata records only source timestamps,
a checksum, and applied team counts.

An explicit announced minutes ceiling is accepted *only when independently
sourced with a URL*. It is currently applied as the existing V5
`minutes_cap` **soft rotation-weight adjustment**. It is **not** a
guaranteed hard cap: do not advertise exact remaining minutes as certified.
Unreported minutes limits are never inferred. PROJECTED/NOT_POSTED lineup
information is diagnostics-only and never overrides model roster/rotation.

## Validated JSON schema, example ONLY (not a real report)

```json
{
  "schema": "NBA_V5_PREGAME_LINEUP_V1",
  "provider": "OFFICIAL_TEAM_RELEASE",
  "source_url": "https://example.org/official-2026-11-06-lineup-release",
  "published_at_utc": "2026-11-06T21:45:00Z",
  "captured_at_utc": "2026-11-06T21:50:00Z",
  "games": [
    {"game_id": "400", "tipoff_utc": "2026-11-06T23:00:00Z",
     "teams": [
       {"team_id": "1", "lineup_state": "CONFIRMED",
        "starters": ["1","2","3","4","5"], "inactive": ["7"],
        "minute_limits": [
          {"player_id": "1", "announced_max_minutes": 24,
           "announcement_source_url": "https://example.org/coaches-statement"}
        ]}
     ]}
  ]
}
```

This fixture uses **fabricated IDs/URLs** solely to show field names.
Only an approved source collector with appropriate reuse rights should
supply the local JSON file; a filename or the string `OFFICIAL_TEAM_RELEASE`
alone cannot authenticate a source.

Example (when a verified local capture is available):

```bash
python -m nba.nba_v5_forecast ... --pregame-evidence /secure/verified-lineup.json
```

Do not check licensed raw source material or tokens into the public repo.

## Actually free vs restricted source reality

The public official NBA injury PDF is already integrated. It provides
player statuses, but not a guaranteed five-man starting lineup or
announced playing-time limits.

PBP Stats and SportsDataverse can help derive historical rotations,
stints, possessions and shot-origin rebounding; they cannot identify
future certified starters or true optical-tracking defender assignments.
NBA.com displays aggregate tracking information, but league website
terms restrict reuse in gambling/commercial products. Hoop Dossier's
free public MCP says **personal use** with heavy automation throttled;
it is not an unrestricted production-feed license. A public page or a
free API key is not equal to distribution or automated reuse approval.

## Remaining acceptance gates

1. Connect a permissioned real-time official/confirmed lineup collector
   with source version, change detection, ID crosswalk and operational
   monitoring. **Not yet operational**.
2. Track explicit restrictions and build/test a true minutes-cap
   constrained solver instead of treating a relative weight as exact.
3. Run actual pretip archived champion-versus-confirmed-source
   forecasts on enough games, including DNP, before declaring probability
   calibration or accuracy improved.
4. Verify the independent source's *actual* authenticity. JSON validation
   alone is not cryptographic proof.
5. Obtain authorized tracking/play-type data for off-ball possession
   creation, contested rebounds, closest defenders and schemes.

No betting odds or lines are used anywhere in this source interface.
