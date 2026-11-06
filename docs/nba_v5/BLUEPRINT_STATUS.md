# NBA V5: your 27-point blueprint, item by item

Status words: **Built** (in the model and tested), **Partly** (some of it, said below), **No data** (needs data we do not have; not faked),
**Not yet** (possible with our data, not built). Item 27 (sportsbook) is excluded on your instruction.
Code: `nba/nba_v5_sim.py` (the game), `nba_v5_context.py` (learned context), `nba_v5_backtest.py` (tests), `nba_v5_forecast.py`,
`nba_v5_info.py` (information receipts), `nba_v5_postmortem.py` (grading). Tests: `tests/test_nba_v5.py`.

| # | Item | Status | What exists, and what is missing |
|---|------|--------|----------------------------------|
| 1 | Information available | Partly | Two independent ESPN injury feeds fetched, timestamped, cross-checked (stale, conflicting, one-feed-only, duplicate or unknown players); every distinct report is logged once with the time we first saw it (`docs/nba_v5_info/ledger.jsonl`); original forecasts frozen in `docs/nba_v5_archive/first`; source reliability counted after games. Missing: postponement handling, trade/waiver/G League feeds beyond the roster source, update-speed per source. |
| 2 | Availability beyond in/out | Partly | Each simulated game draws who plays (chance of playing), so a questionable player has separate "plays" and "sits" games with a different rotation in each; chance of starting and of being on the floor to close; minutes range; first-games-back effect learned; minutes-restriction input supported; rest and back-to-back effects. Missing: injury-type effects, early-exit risk, warm-up news, correlated joint scenarios (teammates are drawn independently), and a data source for announced restrictions. |
| 3 | Real rotation | Partly | Floor time per player per two-minute stretch learned from real substitutions; starter/bench staggering; stint continuity; foul-trouble and blowout floor-time tables learned; overtime; each team's minutes always total 240. Missing: matchup-based substitutions, explicit small-ball vs traditional lineups, coach-by-coach tables (coach effects are only in each player's own pattern). |
| 4 | What each player does | Partly | Role comes from usage, assist, rebound, steal, block rates and shot-spot mix. Missing: named archetypes and play types (no play-type data). |
| 5 | Opportunity before results | Partly | Shot attempts by type and spot, free-throw attempts, rebound chances (from misses), assisted share. **No data:** touches, possession time, dribbles, passes, drives, screens, potential assists, contested rebounds, deflections. |
| 6 | Teammate interactions | Partly | When someone sits, minutes, shots, rebounds and assists go to the teammates who actually take them (shared 240 minutes, usage-weighted possessions, assist weights); re-simulation with a key teammate out shows who moves. Missing: lineup-pair synergies and spacing effects. |
| 7 | Opponent's defence | Partly | How much each team concedes and how accurately opponents shoot from each spot, turnovers forced, free-throw rate, offensive rebounds, blocks, pace. **No data:** defenders' assignments, schemes (switch, drop, trap, zone), closeouts. |
| 8 | Action-level offence | No data | Needs play-type data. Shot styles (pull-up, driving, step-back…) are stored but not used yet. |
| 9 | Scoring from components | Partly | Two-point, three-point and free-throw attempts, shot-spot mix, assisted share by spot, accuracy by spot with per-game uncertainty. Points are the sum of simulated makes. Missing: shot clock, defender distance, fatigue effects. |
| 10 | Rebounds from chances | Partly | Every rebound comes from a simulated miss; offensive vs defensive from learned rates incl. team rebounds; rebounder chosen by rebound rates. Missing: positioning/box-out, location of misses. |
| 11 | Assists | Partly | Assists attach to simulated made baskets by spot; assister chosen by assist rates; receiver finishing is the shooter's own accuracy. Missing: pass types, potential assists. |
| 12 | Threes, steals, blocks, turnovers | Built (separate) | Threes from spot-level shooting; steals attach to turnovers; blocks to misses; turnovers by usage. Each stat has its own distribution from the same game. Missing: pass-lane/pressure detail. |
| 13 | The game as it unfolds | Partly | Pace draw, score state, rotation reacting to the gap, fouls and fouling out, late-game fouling (learned), overtime. Missing: timeouts, end-of-quarter possessions, bonus. |
| 14 | Schedule and physical context | Built | Rest, back-to-backs, three in four, travel distance, time-zone change, altitude; effects measured from earlier games with shrinkage and kept only if testing supports them. |
| 15 | Coaching tendencies | Partly | Learned rotation and foul-trouble patterns (league level plus each player's own pattern). Missing: coach-specific tables, matchup choices. |
| 16 | Officials | Built | Each crew's foul/free-throw lean versus the league (shrunk) scales free-throw trips. |
| 17 | How players change | Partly | Recency weighting and shrinkage; first-games-back effect. Missing: formal change detection. |
| 18 | Small samples | Partly | Rates and percentages shrunk toward the league; accuracy sampled per game from its own uncertainty. Missing: pooling across similar players. |
| 19 | Relationships between outcomes | Built | One shared game: pace, shooting luck, rotation and minutes link teammates and opponents; points, assists and rebounds come from the same events. |
| 20 | Internally consistent game | Built | Tested: player points sum to team score; 240 regulation minutes; threes inside makes; assists need makes; rebounds need misses; OUT players never play. |
| 21 | Kinds of uncertainty | Partly | Randomness, who plays, minutes/rotation, per-game accuracy uncertainty, shooting luck, stale/conflicting reports are separate and recorded; each projection lists which teammate's absence moves it most. Missing: a variance split report. |
| 22 | Honest probabilities | Built | Full distribution; chance of reaching the exact rounded projection; per-stat checks; a correction fitted on earlier games and tested on later ones; screen picks graded separately. Missing: checks by role and opportunity level. |
| 23 | Test against alternatives | Built | `nba_v5_backtest.py`: recent average, V4, a V4+V5 blend; chronological; same players. |
| 24 | Prove each feature helps | Built | Every piece has an on/off switch (`--features ablate`). |
| 25 | Learn from every miss | Built | `nba_v5_postmortem.py` (nightly workflow): did he play, minutes, role, shot volume, shooting, fouls, blowout, overtime, range coverage; cause counts across games. |
| 26 | Choose what the app shows | Built | Ranked by the chance of reaching the rounded projection; dependency flags; original and updated forecasts kept separately; screen picks identifiable and graded. |
| 27 | Sportsbook | Excluded | Per your instruction. |
