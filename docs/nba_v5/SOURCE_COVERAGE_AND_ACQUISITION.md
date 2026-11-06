# NBA V5 data-source acquisition and reliability register
Updated: November 6, 2026. Scope: **independent player and game forecasts**, no sportsbook inputs.

## Source tiers, evidence, rights and action

| Need | Candidate | What is actually accessible / documented | Current integration | Next requirement |
|---|---|---|---|---|
| Pregame official player status, G League assignment, reason | [NBA official injury reports](https://official.nba.com/nba-injury-report-2026-27-season/) | Official timestamped PDFs repeatedly throughout the day, including game/team/player/status/reason; a team may say NOT YET SUBMITTED | **New V5 adapter + CI live test** in PR #83; 89 player entries from 18 teams, 46 matched to current forecasts at 09:00 ET November 6 | Monitor daily reliability and exact game/player matches; not a guaranteed active roster |
| Historical player boxes, schedule, substitutions, on-court shooting, assists | ESPN scoreboards/summary, existing saved V5 data | Running historical feed + strict historical before-date filtering; 1,283/1,351 PBP games reconstructable on-court | Already built and verified; 12,405 unambiguous team-label corrections | Fill missing events conservatively or exclude, maintain raw-source hashes and provenance |
| Independent lineup/possession cross-check | [pbpstats API](https://api.pbpstats.com/docs) and [library](https://pbpstats.readthedocs.io/en/latest/) | Documented game-level lineup, on/off, possession, shot-zone, assist-network and G League coverage | **Candidate** only; no consumption in model | Establish availability/rate limits/terms and stable ESPN↔NBA ID mapping, then use to validate our PBP reconstructions |
| Tracking: touches, passes, drives, potential assists, rebound chances, shot clock, closest defender | [NBA statistics tracking](https://www.nba.com/stats/quicklinks) | Public pages show relevant categories; official website also discloses missing tracking for some games | **Not ingested**; direct automation rights and reliable access not verified | Establish licensed, time-stamped data feed, per-game coverage and cross-provider ID mapping before any effect |
| Play-type PPP, frequency, transition, isolation, pick-and-roll, roll man, spot up, handoff, cut, off-screen | [NBA.com play types (Synergy)](https://www.nba.com/stats/players/ball-handler?SeasonType=Regular+Season) | Public web pages display qualifying player/team play-type tables, branded as Synergy | **Not ingested**; web visibility does not establish bulk reuse rights | Arrange permitted API/export and game-level observation dates, not a scrape of unversioned current aggregates |
| Pregame projected/confirmed lineups, depth charts, injuries, daily transactions | [SportsDataIO NBA coverage](https://sportsdata.io/developers/coverages/nba), [developer docs](https://sportsdata.io/developers/api-documentation/nba) | Provider states 5-day projected/confirmed lineups, transaction feed, depth charts and injury details | **Not connected**; NBA access requires authorization | Obtain API credentials/plan and agree on freshness/terms; cross-check with NBA PDF and ESPN |
| More detailed official possession data, injuries and transfers | [Sportradar NBA API v8](https://developer.sportradar.com/basketball/reference/nba-overview) | Official provider documents PBP, substitutions, event positional data, injuries, daily transfers; API key required | **Not connected** | Source agreement/API key, feed-level rights and complete provider ID mapping |

**Availability is not the same as playing time.** An NBA PDF OUT is a specific observed pregame status. An AVAILABLE designation may clear an injury but does not guarantee meaningful minutes or a starting assignment. Silence in a report says nothing about active status.

## Engineering contract for all future sources

Every new source should have a schema and a field-by-field audit containing:
- Source provider, exact endpoint/file URL, observed/published/captured UTC timestamps, source checksum/immutable receipt, team/player/game ID mapping and ambiguous/unknown record counts.
- No observation time after the original forecast; evidence recorded *as originally received*, never backfilled with revised future standings or box scores.
- Coverage by game/season/player and meaningful sample count. No invented tracking value when data are unavailable.
- Programmatic refresh limits, credential storage, licensing/redistribution permission and fail-closed behavior when source is stale, blocked, conflicting, or incomplete.
- A no-activation default for each new model feature. Pair identical games, seeds, available information and sample sizes; compare forecast mean errors, Brier/log loss, coverage and critical top-bucket performance, cluster by game, and preserve an untouched later period.
- Distinguish **source ingested**, **features built**, **paired historical improvement**, and **forward validated**. None implies the next.

## Missing measurements requiring licensed or verified alternative data

These are *not* currently solved by existing ESPN PBP: touches, time of possession, dribbles, drives, screens, potential assists, teammate spacing, contested rebounds, exact closest defender, defensive assignment/switch/drop/trap/zone coverage, and reliable fine-grained play-type events. A two-minute lineup and shooter location cannot identify these without an independent tracking source.

## Development order

1. [x] Integrate official game-specific NBA injury PDF source independently of ESPN, with publication timestamp, exact name/team/game matching and reproducible tests. Live CI smoke report: 89 parsed, 18 NBA teams, 46 current-game matched entries.
2. [ ] Improve actual pregame roster/starting-lineup certification and injury *minutes* restrictions. SportsDataIO is a viable candidate but needs service access.
3. [ ] Cross-check our reconstructed PBP against pbpstats and audit mismatched possessions; no unapproved bulk access.
4. [ ] Add approved tracking + Synergy play-type source adapters with strict no-lookahead and coverage constraints.
5. [ ] Test archetype-conditioned minutes/shot opportunity, play type x opponent defense, lineup x coaching adjustments and event-specific player forecasting under identical game simulation.
6. [ ] Grade all archived original player/market predictions over sufficient forward games, with interval coverage and calibration strata before final model promotion.

A **public webpage being viewable** is not proof that a data license or unrestricted programmatic ingestion exists. The repository cannot create a paid provider subscription, agree to licensing terms or produce credentials autonomously.
