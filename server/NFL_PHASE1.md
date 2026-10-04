The NFL tab fetches `/api/nfl-phase1-predictions` only. That endpoint reads the public main-branch artifact at:

https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nfl_phase1_shadow.json

Every artifact request uses a cache-busting timestamp and no-store headers. Failures return HTTP 502 with upstream details; there is no legacy fallback. The existing Render proxy `/api/nfl-predictions` is unchanged.

Until the publisher supplies `alt_65`, the endpoint reads missing distributions from:

`https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/nfl-shadow-state/forecasts/batches/{season}_wk{week:02d}_{horizon}_{game_id}.jsonl`

The main artifact alone determines the displayed games and rows. Supplementary batches cannot add rows. Each batch must pass its SHA256 footer and record count, game/horizon/cutoff/kickoff checks, and absence of time travel. Forecast IDs, player/team/opponent/outcome/model and rounded compact mean/median must match. Only the derived `alt_65` map is added; all original artifact fields remain unchanged. Verified batch results are cached by URL and cutoff (bounded to 128 entries); the main artifact is never cached here. Any verification failure fails the response visibly.

`deriveAlt65` ports PR #62 commit `30fde2115522bcf3c233ec415801bb0235576ca8`. For yards, invert the monotone simulated Q(.01)..Q(.99) grid conservatively: the first Q(p) >= m gives 1-p, preserving ties. Select the highest 10-yard rushing/receiving milestone, or passing milestone starting at 100 with step 25, clearing .65. For counts use 1-F(m-step), with integer milestones and a half-step CDF for sacks. Missing/invalid distributions or an unidentified truncated tail return no alt. Mean, median, partial percentiles, sportsbook lines and odds never enter this calculation. Matching moments above only verify provenance.

Presentation freshness rules reject a publication/run older than 36 hours or more than 10 minutes in the future, exclude kickoffs on earlier America/New_York calendar dates, and validate the published season/week and horizon counts. These rules do not change scientific forecast validity or generation. A successful refresh replaces the whole snapshot; older publications, failures and malformed data clear the cards. Request cancellation and sequencing prevent late responses from restoring previous snapshots. T24 and T90 remain separate. Polling is every 30 seconds while the NFL screen is mounted.

Run `npm test`, `npm run lint`, `npm run build`, and `npm run test:browser` (after `npx playwright install chromium`). Browser tests use a frozen October 4 clock and curated real forecast rows; production uses the current clock. No writes to mlb-picks2 are required.
