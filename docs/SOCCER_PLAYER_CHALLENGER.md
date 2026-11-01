# Soccer player intelligence: research challenger only

Existing five-league match-goals champion remains unchanged. We have added
a player role and shooting challenger, which consumes real match-by-match
minutes, starting roles, shots and SOT from StrikerAPI when connected.
Provider xG is only inspected for source coverage: because its historical values
are refitted using future seasons, that xG is BLOCKED from pregame predictors
until a strictly as-of xG model is trained on earlier shot-location data.

Credentials are required as server environment variables:
- STRIKERAPI_API_KEY: secret; never commit to Git or paste in chat.
- SOCCER_RESEARCH_PLAYER_IDS: exact provider player ID whitelist, e.g. 123,456.

Research endpoint:
GET /api/soccer-player-research?playerId=123&teamId=382&gameId=5000&date=2026-11-04

No key or no allowlist => unavailable, zero simulated player picks.
Provider calls are constrained to 2 per day (10 credits), cached six hours and circuit-broken
on 429. Pre-kickoff game ID/lineup is source verified; postkickoff lineups cannot
become pregame features. Historical matches must precede as-of and fixture days.
Missing actual shots/minutes are never imputed as zero; transfers use exact
team IDs; confirmed OUT means no forecast. Injuries are still NOT connected,
so all output remains UNVALIDATED RESEARCH and zero official picks.

The challenger reports numerically projected minutes, shots and shots on target.
It has a chronological shadow scorecard against a last-ten-game baseline, but
no earned promotion gate or real prospectively calibrated probabilities.

Next: authorized provider credentials, sample verified player histories and
live lineup fixtures, an injury/suspension source, immutable first-seen player
forecasts, prospective holdout and independent model-vs-baseline testing.
Provider terms must permit the intended deployment and usage.

## Frontend player-props pilot
The Soccer > Player props tab reads `/api/soccer-player-board`. No source
connection produces an explicit empty state rather than fake projections.
The guarded provider-backed cohort is configured on the server using
`STRIKERAPI_API_KEY`, `SOCCER_RESEARCH_PLAYER_IDS`, and
`SOCCER_PLAYER_RESEARCH_COHORT` (JSON containing named playerId, teamId,
teamName, opponent, date, and optional gameId). Each source-backed forecast
shows expected minutes, expected shots, expected shots on target, and the
separate original-model probabilities of reaching ceil(each mean).
This first pilot only evaluates one allowlisted player per refresh, prevents
unknown identities, and is not a production or calibrated betting board.
Configured labels require manual provider-ID verification. The underlying
provider credit limit is process-local and does not persist after restarts.
