# NHL — EVERY original pregame shot projection vs official actual shots (Oct 30–Nov 1, 2026)

**Purpose:** Grade source-frozen model **numerical expected shots** against independently saved final shots—not sportsbook 2.5 lines, probabilities, or easy targets. Includes **all original forecasts** in the daily source snapshots, not just favorable results.

**HIT definition:** after rounding the original numerical projection to a whole shot (**exact 0.5 rounds down**, e.g., 3.5→3 and 3.6→4), HIT means that rounded number **exactly equals** the player's verified final shots. MISS otherwise. A separate **Reached?** column records whether the player got at least the rounded model projection; it is a lower-bound test, not the numerical accuracy score. A projected 0-shot lower bound is recorded as TRIVIAL instead of a meaningful reached hit.

**Availability:** confirmed DNP gets DNP rather than 0-shot scoring; missing outcomes are UNVERIFIED. All three pregame horizons T24H, T90, and T30 are preserved with **one row each**. They are repeated snapshots, **not independent players or separate bets**. ★ denotes the **latest available original pregame** snapshot for a given game/player, selected systematically T30 > T90 > T24H.
**Inventory:** 18 dated games; 1905 actual original pregame forecast snapshots; 1532 played and verified rows; 373 DNP snapshot rows; 0 unresolved. **Snapshot exact-round matches: 454/1532; latest-per-player exact-round matches: 185/628.** No cherry-picked player selection.


**Evidence:** original date partitions from `deshawnclark116-prog/mlb-picks2/docs/nhl_sog_daily/YYYY-MM-DD.json`, source-verified frozen expected shot means joined by immutable forecast_id to official final grader ledger in the research branch. Historical corrected probability fields are ignored; numerical mean only. Identity and availability caveats inherited from frozen source apply.

## 2026-10-30 — NJD vs VGK

Original snapshots: 84 (T24H=0, T90=42, T30=42); unique players=42. Verified played snapshot rows=70; DNP rows=14; unverified=0. **Exact rounded match among played snapshots: 22/70**. **Latest-snapshot exact matches: 11/35**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Amadeus Lombardi | T90 | 1.34 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Amadeus Lombardi ★ | T30 | 1.34 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Anthony Mantha | T90 | 1.18 | 1 | 1 | **HIT** | YES | 0.18 | PLAYED |
| Anthony Mantha ★ | T30 | 1.18 | 1 | 1 | **HIT** | YES | 0.18 | PLAYED |
| Arseny Gritsyuk | T90 | 1.50 | 1 | 8 | **MISS** | YES | 6.50 | PLAYED |
| Arseny Gritsyuk ★ | T30 | 1.50 | 1 | 8 | **MISS** | YES | 6.50 | PLAYED |
| Braeden Bowman | T90 | 1.31 | 1 | 1 | **HIT** | YES | 0.31 | PLAYED |
| Braeden Bowman ★ | T30 | 1.31 | 1 | 1 | **HIT** | YES | 0.31 | PLAYED |
| Brayden McNabb | T90 | 1.32 | 1 | 0 | **MISS** | NO | 1.32 | PLAYED |
| Brayden McNabb ★ | T30 | 1.32 | 1 | 0 | **MISS** | NO | 1.32 | PLAYED |
| Brenden Dillon | T90 | 0.69 | 1 | — | **DNP** | — | — | DNP |
| Brenden Dillon ★ | T30 | 0.69 | 1 | — | **DNP** | — | — | DNP |
| Brett Howden | T90 | 1.33 | 1 | 0 | **MISS** | NO | 1.33 | PLAYED |
| Brett Howden ★ | T30 | 1.33 | 1 | 0 | **MISS** | NO | 1.33 | PLAYED |
| Brett Pesce | T90 | 1.04 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Brett Pesce ★ | T30 | 1.04 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Cody Glass | T90 | 1.11 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Cody Glass ★ | T30 | 1.11 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Connor Brown | T90 | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Connor Brown ★ | T30 | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Declan Chisholm | T90 | 0.62 | 1 | 0 | **MISS** | NO | 0.62 | PLAYED |
| Declan Chisholm ★ | T30 | 0.62 | 1 | 0 | **MISS** | NO | 0.62 | PLAYED |
| Dougie Hamilton | T90 | 1.37 | 1 | 2 | **MISS** | YES | 0.63 | PLAYED |
| Dougie Hamilton ★ | T30 | 1.37 | 1 | 2 | **MISS** | YES | 0.63 | PLAYED |
| Dylan Coghlan | T90 | 0.31 | 0 | — | **DNP** | — | — | DNP |
| Dylan Coghlan ★ | T30 | 0.31 | 0 | — | **DNP** | — | — | DNP |
| Evan Rodrigues | T90 | 1.39 | 1 | 0 | **MISS** | NO | 1.39 | PLAYED |
| Evan Rodrigues ★ | T30 | 1.39 | 1 | 0 | **MISS** | NO | 1.39 | PLAYED |
| Ivan Barbashev | T90 | 1.50 | 2 | 3 | **MISS** | YES | 1.50 | PLAYED |
| Ivan Barbashev ★ | T30 | 1.50 | 2 | 3 | **MISS** | YES | 1.50 | PLAYED |
| Jack Eichel | T90 | 2.92 | 3 | 0 | **MISS** | NO | 2.92 | PLAYED |
| Jack Eichel ★ | T30 | 2.92 | 3 | 0 | **MISS** | NO | 2.92 | PLAYED |
| Jack Hughes | T90 | 2.84 | 3 | 7 | **MISS** | YES | 4.16 | PLAYED |
| Jack Hughes ★ | T30 | 2.84 | 3 | 7 | **MISS** | YES | 4.16 | PLAYED |
| Jeremy Lauzon | T90 | 1.14 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Jeremy Lauzon ★ | T30 | 1.14 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Jesper Boqvist | T90 | 1.09 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Jesper Boqvist ★ | T30 | 1.09 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Jesper Bratt | T90 | 1.80 | 2 | 0 | **MISS** | NO | 1.80 | PLAYED |
| Jesper Bratt ★ | T30 | 1.80 | 2 | 0 | **MISS** | NO | 1.80 | PLAYED |
| Johnathan Kovacevic | T90 | 0.26 | 0 | 2 | **MISS** | TRIVIAL | 1.74 | PLAYED |
| Johnathan Kovacevic ★ | T30 | 0.26 | 0 | 2 | **MISS** | TRIVIAL | 1.74 | PLAYED |
| Jonas Siegenthaler | T90 | 0.87 | 1 | 0 | **MISS** | NO | 0.87 | PLAYED |
| Jonas Siegenthaler ★ | T30 | 0.87 | 1 | 0 | **MISS** | NO | 0.87 | PLAYED |
| Luke Evangelista | T90 | 2.13 | 2 | 3 | **MISS** | YES | 0.87 | PLAYED |
| Luke Evangelista ★ | T30 | 2.13 | 2 | 3 | **MISS** | YES | 0.87 | PLAYED |
| Luke Hughes | T90 | 2.04 | 2 | 2 | **HIT** | YES | 0.04 | PLAYED |
| Luke Hughes ★ | T30 | 2.04 | 2 | 2 | **HIT** | YES | 0.04 | PLAYED |
| Marc Gatcomb | T90 | 1.23 | 1 | 0 | **MISS** | NO | 1.23 | PLAYED |
| Marc Gatcomb ★ | T30 | 1.23 | 1 | 0 | **MISS** | NO | 1.23 | PLAYED |
| Mark Stone | T90 | 2.31 | 2 | 1 | **MISS** | NO | 1.31 | PLAYED |
| Mark Stone ★ | T30 | 2.31 | 2 | 1 | **MISS** | NO | 1.31 | PLAYED |
| Mitch Marner | T90 | 2.21 | 2 | 1 | **MISS** | NO | 1.21 | PLAYED |
| Mitch Marner ★ | T30 | 2.21 | 2 | 1 | **MISS** | NO | 1.21 | PLAYED |
| Nic Dowd | T90 | 0.78 | 1 | 0 | **MISS** | NO | 0.78 | PLAYED |
| Nic Dowd ★ | T30 | 0.78 | 1 | 0 | **MISS** | NO | 0.78 | PLAYED |
| Nico Hischier | T90 | 2.30 | 2 | 1 | **MISS** | NO | 1.30 | PLAYED |
| Nico Hischier ★ | T30 | 2.30 | 2 | 1 | **MISS** | NO | 1.30 | PLAYED |
| Noah Hanifin | T90 | 1.23 | 1 | 4 | **MISS** | YES | 2.77 | PLAYED |
| Noah Hanifin ★ | T30 | 1.23 | 1 | 4 | **MISS** | YES | 2.77 | PLAYED |
| Parker Wotherspoon | T90 | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Parker Wotherspoon ★ | T30 | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Player 8482110 | T90 | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Player 8482110 ★ | T30 | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Player 8482125 | T90 | 0.36 | 0 | — | **DNP** | — | — | DNP |
| Player 8482125 ★ | T30 | 0.36 | 0 | — | **DNP** | — | — | DNP |
| Raphael Lavoie | T90 | 0.97 | 1 | — | **DNP** | — | — | DNP |
| Raphael Lavoie ★ | T30 | 0.97 | 1 | — | **DNP** | — | — | DNP |
| Rasmus Andersson | T90 | 1.43 | 1 | 2 | **MISS** | YES | 0.57 | PLAYED |
| Rasmus Andersson ★ | T30 | 1.43 | 1 | 2 | **MISS** | YES | 0.57 | PLAYED |
| Shea Theodore | T90 | 1.77 | 2 | 3 | **MISS** | YES | 1.23 | PLAYED |
| Shea Theodore ★ | T30 | 1.77 | 2 | 3 | **MISS** | YES | 1.23 | PLAYED |
| Stefan Noesen | T90 | 0.14 | 0 | — | **DNP** | — | — | DNP |
| Stefan Noesen ★ | T30 | 0.14 | 0 | — | **DNP** | — | — | DNP |
| Timo Meier | T90 | 1.91 | 2 | 2 | **HIT** | YES | 0.09 | PLAYED |
| Timo Meier ★ | T30 | 1.91 | 2 | 2 | **HIT** | YES | 0.09 | PLAYED |
| Tomas Hertl | T90 | 1.86 | 2 | 2 | **HIT** | YES | 0.14 | PLAYED |
| Tomas Hertl ★ | T30 | 1.86 | 2 | 2 | **HIT** | YES | 0.14 | PLAYED |
| Trevor Connelly | T90 | 1.89 | 2 | 2 | **HIT** | YES | 0.11 | PLAYED |
| Trevor Connelly ★ | T30 | 1.89 | 2 | 2 | **HIT** | YES | 0.11 | PLAYED |
| Ville Heinola | T90 | 0.74 | 1 | 0 | **MISS** | NO | 0.74 | PLAYED |
| Ville Heinola ★ | T30 | 0.74 | 1 | 0 | **MISS** | NO | 0.74 | PLAYED |
| William Karlsson | T90 | 1.67 | 2 | 1 | **MISS** | NO | 0.67 | PLAYED |
| William Karlsson ★ | T30 | 1.67 | 2 | 1 | **MISS** | NO | 0.67 | PLAYED |

## 2026-10-30 — FLA vs WPG

Original snapshots: 132 (T24H=44, T90=44, T30=44); unique players=44. Verified played snapshot rows=105; DNP rows=27; unverified=0. **Exact rounded match among played snapshots: 23/105**. **Latest-snapshot exact matches: 8/35**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Aaron Ekblad | T24H | 1.46 | 1 | 2 | **MISS** | YES | 0.54 | PLAYED |
| Aaron Ekblad | T90 | 1.45 | 1 | 2 | **MISS** | YES | 0.55 | PLAYED |
| Aaron Ekblad ★ | T30 | 1.45 | 1 | 2 | **MISS** | YES | 0.55 | PLAYED |
| Adam Lowry | T24H | 1.06 | 1 | 0 | **MISS** | NO | 1.06 | PLAYED |
| Adam Lowry | T90 | 1.03 | 1 | 0 | **MISS** | NO | 1.03 | PLAYED |
| Adam Lowry ★ | T30 | 1.03 | 1 | 0 | **MISS** | NO | 1.03 | PLAYED |
| Alex Iafallo | T24H | 1.20 | 1 | 2 | **MISS** | YES | 0.80 | PLAYED |
| Alex Iafallo | T90 | 1.13 | 1 | 2 | **MISS** | YES | 0.87 | PLAYED |
| Alex Iafallo ★ | T30 | 1.13 | 1 | 2 | **MISS** | YES | 0.87 | PLAYED |
| Anton Lundell | T24H | 2.14 | 2 | 8 | **MISS** | YES | 5.86 | PLAYED |
| Anton Lundell | T90 | 2.11 | 2 | 8 | **MISS** | YES | 5.89 | PLAYED |
| Anton Lundell ★ | T30 | 2.11 | 2 | 8 | **MISS** | YES | 5.89 | PLAYED |
| Bokondji Imama | T24H | 0.88 | 1 | 0 | **MISS** | NO | 0.88 | PLAYED |
| Bokondji Imama | T90 | 0.87 | 1 | 0 | **MISS** | NO | 0.87 | PLAYED |
| Bokondji Imama ★ | T30 | 0.87 | 1 | 0 | **MISS** | NO | 0.87 | PLAYED |
| Brad Lambert | T24H | 0.62 | 1 | — | **DNP** | — | — | DNP |
| Brad Lambert | T90 | 0.65 | 1 | — | **DNP** | — | — | DNP |
| Brad Lambert ★ | T30 | 0.65 | 1 | — | **DNP** | — | — | DNP |
| Brad Marchand | T24H | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Brad Marchand | T90 | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Brad Marchand ★ | T30 | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Brady Tkachuk | T24H | 2.62 | 3 | 6 | **MISS** | YES | 3.38 | PLAYED |
| Brady Tkachuk | T90 | 2.58 | 3 | 6 | **MISS** | YES | 3.42 | PLAYED |
| Brady Tkachuk ★ | T30 | 2.58 | 3 | 6 | **MISS** | YES | 3.42 | PLAYED |
| Carter Verhaeghe | T24H | 2.24 | 2 | 3 | **MISS** | YES | 0.76 | PLAYED |
| Carter Verhaeghe | T90 | 2.21 | 2 | 3 | **MISS** | YES | 0.79 | PLAYED |
| Carter Verhaeghe ★ | T30 | 2.21 | 2 | 3 | **MISS** | YES | 0.79 | PLAYED |
| Cole Koepke | T24H | 0.81 | 1 | 0 | **MISS** | NO | 0.81 | PLAYED |
| Cole Koepke | T90 | 0.79 | 1 | 0 | **MISS** | NO | 0.79 | PLAYED |
| Cole Koepke ★ | T30 | 0.79 | 1 | 0 | **MISS** | NO | 0.79 | PLAYED |
| Cole Perfetti | T24H | 2.42 | 2 | 2 | **HIT** | YES | 0.42 | PLAYED |
| Cole Perfetti | T90 | 2.37 | 2 | 2 | **HIT** | YES | 0.37 | PLAYED |
| Cole Perfetti ★ | T30 | 2.37 | 2 | 2 | **HIT** | YES | 0.37 | PLAYED |
| Cole Reinhardt | T24H | 0.30 | 0 | — | **DNP** | — | — | DNP |
| Cole Reinhardt | T90 | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Cole Reinhardt ★ | T30 | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Cole Schwindt | T24H | 1.14 | 1 | 0 | **MISS** | NO | 1.14 | PLAYED |
| Cole Schwindt | T90 | 1.13 | 1 | 0 | **MISS** | NO | 1.13 | PLAYED |
| Cole Schwindt ★ | T30 | 1.13 | 1 | 0 | **MISS** | NO | 1.13 | PLAYED |
| Dawson Mercer | T24H | 1.40 | 1 | 2 | **MISS** | YES | 0.60 | PLAYED |
| Dawson Mercer | T90 | 1.48 | 1 | 2 | **MISS** | YES | 0.52 | PLAYED |
| Dawson Mercer ★ | T30 | 1.48 | 1 | 2 | **MISS** | YES | 0.52 | PLAYED |
| Dmitry Kulikov | T24H | 0.78 | 1 | 1 | **HIT** | YES | 0.22 | PLAYED |
| Dmitry Kulikov | T90 | 0.77 | 1 | 1 | **HIT** | YES | 0.23 | PLAYED |
| Dmitry Kulikov ★ | T30 | 0.77 | 1 | 1 | **HIT** | YES | 0.23 | PLAYED |
| Dylan DeMelo | T24H | 0.96 | 1 | 2 | **MISS** | YES | 1.04 | PLAYED |
| Dylan DeMelo | T90 | 0.92 | 1 | 2 | **MISS** | YES | 1.08 | PLAYED |
| Dylan DeMelo ★ | T30 | 0.92 | 1 | 2 | **MISS** | YES | 1.08 | PLAYED |
| Dylan Samberg | T24H | 1.19 | 1 | 0 | **MISS** | NO | 1.19 | PLAYED |
| Dylan Samberg | T90 | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Dylan Samberg ★ | T30 | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Eetu Luostarinen | T24H | 1.47 | 1 | 1 | **HIT** | YES | 0.47 | PLAYED |
| Eetu Luostarinen | T90 | 1.45 | 1 | 1 | **HIT** | YES | 0.45 | PLAYED |
| Eetu Luostarinen ★ | T30 | 1.45 | 1 | 1 | **HIT** | YES | 0.45 | PLAYED |
| Elias Salomonsson | T24H | 0.76 | 1 | 2 | **MISS** | YES | 1.24 | PLAYED |
| Elias Salomonsson | T90 | 0.94 | 1 | 2 | **MISS** | YES | 1.06 | PLAYED |
| Elias Salomonsson ★ | T30 | 0.94 | 1 | 2 | **MISS** | YES | 1.06 | PLAYED |
| Gabriel Vilardi | T24H | 1.89 | 2 | 1 | **MISS** | NO | 0.89 | PLAYED |
| Gabriel Vilardi | T90 | 1.77 | 2 | 1 | **MISS** | NO | 0.77 | PLAYED |
| Gabriel Vilardi ★ | T30 | 1.77 | 2 | 1 | **MISS** | NO | 0.77 | PLAYED |
| Garnet Hathaway | T24H | 0.79 | 1 | 0 | **MISS** | NO | 0.79 | PLAYED |
| Garnet Hathaway | T90 | 0.78 | 1 | 0 | **MISS** | NO | 0.78 | PLAYED |
| Garnet Hathaway ★ | T30 | 0.78 | 1 | 0 | **MISS** | NO | 0.78 | PLAYED |
| Gustav Forsling | T24H | 1.37 | 1 | 2 | **MISS** | YES | 0.63 | PLAYED |
| Gustav Forsling | T90 | 1.35 | 1 | 2 | **MISS** | YES | 0.65 | PLAYED |
| Gustav Forsling ★ | T30 | 1.35 | 1 | 2 | **MISS** | YES | 0.65 | PLAYED |
| Haydn Fleury | T24H | 0.30 | 0 | 1 | **MISS** | TRIVIAL | 0.70 | PLAYED |
| Haydn Fleury | T90 | 0.79 | 1 | 1 | **HIT** | YES | 0.21 | PLAYED |
| Haydn Fleury ★ | T30 | 0.79 | 1 | 1 | **HIT** | YES | 0.21 | PLAYED |
| Isak Rosen | T24H | 1.23 | 1 | 0 | **MISS** | NO | 1.23 | PLAYED |
| Isak Rosen | T90 | 1.19 | 1 | 0 | **MISS** | NO | 1.19 | PLAYED |
| Isak Rosen ★ | T30 | 1.19 | 1 | 0 | **MISS** | NO | 1.19 | PLAYED |
| Josh Morrissey | T24H | 0.13 | 0 | — | **DNP** | — | — | DNP |
| Josh Morrissey | T90 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Josh Morrissey ★ | T30 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Kyle Connor | T24H | 3.18 | 3 | 2 | **MISS** | NO | 1.18 | PLAYED |
| Kyle Connor | T90 | 2.99 | 3 | 2 | **MISS** | NO | 0.99 | PLAYED |
| Kyle Connor ★ | T30 | 2.99 | 3 | 2 | **MISS** | NO | 0.99 | PLAYED |
| Lars Eller | T24H | 1.28 | 1 | 2 | **MISS** | YES | 0.72 | PLAYED |
| Lars Eller | T90 | 1.26 | 1 | 2 | **MISS** | YES | 0.74 | PLAYED |
| Lars Eller ★ | T30 | 1.26 | 1 | 2 | **MISS** | YES | 0.74 | PLAYED |
| Mario Ferraro | T24H | 1.06 | 1 | 2 | **MISS** | YES | 0.94 | PLAYED |
| Mario Ferraro | T90 | 1.02 | 1 | 2 | **MISS** | YES | 0.98 | PLAYED |
| Mario Ferraro ★ | T30 | 1.02 | 1 | 2 | **MISS** | YES | 0.98 | PLAYED |
| Mark Scheifele | T24H | 2.62 | 3 | 1 | **MISS** | NO | 1.62 | PLAYED |
| Mark Scheifele | T90 | 2.39 | 2 | 1 | **MISS** | NO | 1.39 | PLAYED |
| Mark Scheifele ★ | T30 | 2.39 | 2 | 1 | **MISS** | NO | 1.39 | PLAYED |
| Matthew Tkachuk | T24H | 2.33 | 2 | 2 | **HIT** | YES | 0.33 | PLAYED |
| Matthew Tkachuk | T90 | 2.29 | 2 | 2 | **HIT** | YES | 0.29 | PLAYED |
| Matthew Tkachuk ★ | T30 | 2.29 | 2 | 2 | **HIT** | YES | 0.29 | PLAYED |
| Morgan Barron | T24H | 0.93 | 1 | 3 | **MISS** | YES | 2.07 | PLAYED |
| Morgan Barron | T90 | 0.90 | 1 | 3 | **MISS** | YES | 2.10 | PLAYED |
| Morgan Barron ★ | T30 | 0.90 | 1 | 3 | **MISS** | YES | 2.10 | PLAYED |
| Neal Pionk | T24H | 1.91 | 2 | 4 | **MISS** | YES | 2.09 | PLAYED |
| Neal Pionk | T90 | 1.86 | 2 | 4 | **MISS** | YES | 2.14 | PLAYED |
| Neal Pionk ★ | T30 | 1.86 | 2 | 4 | **MISS** | YES | 2.14 | PLAYED |
| Niko Mikkola | T24H | 1.29 | 1 | 1 | **HIT** | YES | 0.29 | PLAYED |
| Niko Mikkola | T90 | 1.28 | 1 | 1 | **HIT** | YES | 0.28 | PLAYED |
| Niko Mikkola ★ | T30 | 1.28 | 1 | 1 | **HIT** | YES | 0.28 | PLAYED |
| Nino Niederreiter | T24H | 0.36 | 0 | — | **DNP** | — | — | DNP |
| Nino Niederreiter | T90 | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Nino Niederreiter ★ | T30 | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Player 8478043 | T24H | 0.14 | 0 | — | **DNP** | — | — | DNP |
| Player 8478043 | T90 | 0.13 | 0 | — | **DNP** | — | — | DNP |
| Player 8478043 ★ | T30 | 0.13 | 0 | — | **DNP** | — | — | DNP |
| Player 8481030 | T24H | 0.10 | 0 | — | **DNP** | — | — | DNP |
| Player 8481030 | T90 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Player 8481030 ★ | T30 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Radko Gudas | T24H | 0.71 | 1 | 1 | **HIT** | YES | 0.29 | PLAYED |
| Radko Gudas | T90 | 0.71 | 1 | 1 | **HIT** | YES | 0.29 | PLAYED |
| Radko Gudas ★ | T30 | 0.71 | 1 | 1 | **HIT** | YES | 0.29 | PLAYED |
| Sam Bennett | T24H | 2.19 | 2 | 2 | **HIT** | YES | 0.19 | PLAYED |
| Sam Bennett | T90 | 2.16 | 2 | 2 | **HIT** | YES | 0.16 | PLAYED |
| Sam Bennett ★ | T30 | 2.16 | 2 | 2 | **HIT** | YES | 0.16 | PLAYED |
| Sam Reinhart | T24H | 3.11 | 3 | 4 | **MISS** | YES | 0.89 | PLAYED |
| Sam Reinhart | T90 | 3.07 | 3 | 4 | **MISS** | YES | 0.93 | PLAYED |
| Sam Reinhart ★ | T30 | 3.07 | 3 | 4 | **MISS** | YES | 0.93 | PLAYED |
| Sandis Vilmanis | T24H | 1.20 | 1 | 2 | **MISS** | YES | 0.80 | PLAYED |
| Sandis Vilmanis | T90 | 1.18 | 1 | 2 | **MISS** | YES | 0.82 | PLAYED |
| Sandis Vilmanis ★ | T30 | 1.18 | 1 | 2 | **MISS** | YES | 0.82 | PLAYED |
| Seth Jones | T24H | 2.52 | 3 | 1 | **MISS** | NO | 1.52 | PLAYED |
| Seth Jones | T90 | 2.49 | 2 | 1 | **MISS** | NO | 1.49 | PLAYED |
| Seth Jones ★ | T30 | 2.49 | 2 | 1 | **MISS** | NO | 1.49 | PLAYED |
| Uvis Balinskis | T24H | 0.23 | 0 | — | **DNP** | — | — | DNP |
| Uvis Balinskis | T90 | 0.21 | 0 | — | **DNP** | — | — | DNP |
| Uvis Balinskis ★ | T30 | 0.21 | 0 | — | **DNP** | — | — | DNP |
| Viggo Björck | T24H | 0.95 | 1 | 0 | **MISS** | NO | 0.95 | PLAYED |
| Viggo Björck | T90 | 0.92 | 1 | 0 | **MISS** | NO | 0.92 | PLAYED |
| Viggo Björck ★ | T30 | 0.92 | 1 | 0 | **MISS** | NO | 0.92 | PLAYED |
| Vladislav Namestnikov | T24H | 0.12 | 0 | — | **DNP** | — | — | DNP |
| Vladislav Namestnikov | T90 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Vladislav Namestnikov ★ | T30 | 0.09 | 0 | — | **DNP** | — | — | DNP |

## 2026-10-30 — CGY vs SEA

Original snapshots: 126 (T24H=42, T90=42, T30=42); unique players=42. Verified played snapshot rows=105; DNP rows=21; unverified=0. **Exact rounded match among played snapshots: 33/105**. **Latest-snapshot exact matches: 11/35**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Klapka | T24H | 1.48 | 1 | 1 | **HIT** | YES | 0.48 | PLAYED |
| Adam Klapka | T90 | 1.48 | 1 | 1 | **HIT** | YES | 0.48 | PLAYED |
| Adam Klapka ★ | T30 | 1.48 | 1 | 1 | **HIT** | YES | 0.48 | PLAYED |
| Adam Larsson | T24H | 1.17 | 1 | 1 | **HIT** | YES | 0.17 | PLAYED |
| Adam Larsson | T90 | 1.17 | 1 | 1 | **HIT** | YES | 0.17 | PLAYED |
| Adam Larsson ★ | T30 | 1.17 | 1 | 1 | **HIT** | YES | 0.17 | PLAYED |
| Aydar Suniev | T24H | 1.42 | 1 | 2 | **MISS** | YES | 0.58 | PLAYED |
| Aydar Suniev | T90 | 1.43 | 1 | 2 | **MISS** | YES | 0.57 | PLAYED |
| Aydar Suniev ★ | T30 | 1.43 | 1 | 2 | **MISS** | YES | 0.57 | PLAYED |
| Ben Jones | T24H | 0.29 | 0 | — | **DNP** | — | — | DNP |
| Ben Jones | T90 | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Ben Jones ★ | T30 | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Ben Meyers | T24H | 1.09 | 1 | 0 | **MISS** | NO | 1.09 | PLAYED |
| Ben Meyers | T90 | 1.09 | 1 | 0 | **MISS** | NO | 1.09 | PLAYED |
| Ben Meyers ★ | T30 | 1.09 | 1 | 0 | **MISS** | NO | 1.09 | PLAYED |
| Berkly Catton | T24H | 1.85 | 2 | 1 | **MISS** | NO | 0.85 | PLAYED |
| Berkly Catton | T90 | 1.85 | 2 | 1 | **MISS** | NO | 0.85 | PLAYED |
| Berkly Catton ★ | T30 | 1.85 | 2 | 1 | **MISS** | NO | 0.85 | PLAYED |
| Bobby McMann | T24H | 2.01 | 2 | 3 | **MISS** | YES | 0.99 | PLAYED |
| Bobby McMann | T90 | 2.01 | 2 | 3 | **MISS** | YES | 0.99 | PLAYED |
| Bobby McMann ★ | T30 | 2.01 | 2 | 3 | **MISS** | YES | 0.99 | PLAYED |
| Brandon Montour | T24H | 1.93 | 2 | 2 | **HIT** | YES | 0.07 | PLAYED |
| Brandon Montour | T90 | 1.94 | 2 | 2 | **HIT** | YES | 0.06 | PLAYED |
| Brandon Montour ★ | T30 | 1.94 | 2 | 2 | **HIT** | YES | 0.06 | PLAYED |
| Brennan Othmann | T24H | 0.84 | 1 | — | **DNP** | — | — | DNP |
| Brennan Othmann | T90 | 0.85 | 1 | — | **DNP** | — | — | DNP |
| Brennan Othmann ★ | T30 | 0.85 | 1 | — | **DNP** | — | — | DNP |
| Cale Fleury | T24H | 0.61 | 1 | 2 | **MISS** | YES | 1.39 | PLAYED |
| Cale Fleury | T90 | 0.62 | 1 | 2 | **MISS** | YES | 1.38 | PLAYED |
| Cale Fleury ★ | T30 | 0.62 | 1 | 2 | **MISS** | YES | 1.38 | PLAYED |
| Chandler Stephenson | T24H | 1.41 | 1 | 0 | **MISS** | NO | 1.41 | PLAYED |
| Chandler Stephenson | T90 | 1.41 | 1 | 0 | **MISS** | NO | 1.41 | PLAYED |
| Chandler Stephenson ★ | T30 | 1.41 | 1 | 0 | **MISS** | NO | 1.41 | PLAYED |
| Curtis Douglas | T24H | 0.24 | 0 | 0 | **HIT** | TRIVIAL | 0.24 | PLAYED |
| Curtis Douglas | T90 | 0.23 | 0 | 0 | **HIT** | TRIVIAL | 0.23 | PLAYED |
| Curtis Douglas ★ | T30 | 0.23 | 0 | 0 | **HIT** | TRIVIAL | 0.23 | PLAYED |
| Frederick Gaudreau | T24H | 1.19 | 1 | 2 | **MISS** | YES | 0.81 | PLAYED |
| Frederick Gaudreau | T90 | 1.19 | 1 | 2 | **MISS** | YES | 0.81 | PLAYED |
| Frederick Gaudreau ★ | T30 | 1.19 | 1 | 2 | **MISS** | YES | 0.81 | PLAYED |
| Jake Middleton | T24H | 1.05 | 1 | 0 | **MISS** | NO | 1.05 | PLAYED |
| Jake Middleton | T90 | 1.06 | 1 | 0 | **MISS** | NO | 1.06 | PLAYED |
| Jake Middleton ★ | T30 | 1.06 | 1 | 0 | **MISS** | NO | 1.06 | PLAYED |
| Jani Nyman | T24H | 0.87 | 1 | — | **DNP** | — | — | DNP |
| Jani Nyman | T90 | 0.89 | 1 | — | **DNP** | — | — | DNP |
| Jani Nyman ★ | T30 | 0.89 | 1 | — | **DNP** | — | — | DNP |
| Jared McCann | T24H | 0.58 | 1 | — | **DNP** | — | — | DNP |
| Jared McCann | T90 | 0.54 | 1 | — | **DNP** | — | — | DNP |
| Jared McCann ★ | T30 | 0.54 | 1 | — | **DNP** | — | — | DNP |
| Joel Farabee | T24H | 2.87 | 3 | 1 | **MISS** | NO | 1.87 | PLAYED |
| Joel Farabee | T90 | 2.87 | 3 | 1 | **MISS** | NO | 1.87 | PLAYED |
| Joel Farabee ★ | T30 | 2.87 | 3 | 1 | **MISS** | NO | 1.87 | PLAYED |
| Jordan Eberle | T24H | 2.22 | 2 | 2 | **HIT** | YES | 0.22 | PLAYED |
| Jordan Eberle | T90 | 2.23 | 2 | 2 | **HIT** | YES | 0.23 | PLAYED |
| Jordan Eberle ★ | T30 | 2.23 | 2 | 2 | **HIT** | YES | 0.23 | PLAYED |
| Josh Mahura | T24H | 0.71 | 1 | 0 | **MISS** | NO | 0.71 | PLAYED |
| Josh Mahura | T90 | 0.72 | 1 | 0 | **MISS** | NO | 0.72 | PLAYED |
| Josh Mahura ★ | T30 | 0.72 | 1 | 0 | **MISS** | NO | 0.72 | PLAYED |
| Kaapo Kakko | T24H | 1.39 | 1 | 0 | **MISS** | NO | 1.39 | PLAYED |
| Kaapo Kakko | T90 | 1.39 | 1 | 0 | **MISS** | NO | 1.39 | PLAYED |
| Kaapo Kakko ★ | T30 | 1.39 | 1 | 0 | **MISS** | NO | 1.39 | PLAYED |
| Kevin Bahl | T24H | 1.32 | 1 | 0 | **MISS** | NO | 1.32 | PLAYED |
| Kevin Bahl | T90 | 1.32 | 1 | 0 | **MISS** | NO | 1.32 | PLAYED |
| Kevin Bahl ★ | T30 | 1.32 | 1 | 0 | **MISS** | NO | 1.32 | PLAYED |
| Mackie Samoskevich | T24H | 1.51 | 2 | 4 | **MISS** | YES | 2.49 | PLAYED |
| Mackie Samoskevich | T90 | 1.50 | 2 | 4 | **MISS** | YES | 2.50 | PLAYED |
| Mackie Samoskevich ★ | T30 | 1.50 | 2 | 4 | **MISS** | YES | 2.50 | PLAYED |
| Martin Pospisil | T24H | 1.46 | 1 | 1 | **HIT** | YES | 0.46 | PLAYED |
| Martin Pospisil | T90 | 1.46 | 1 | 1 | **HIT** | YES | 0.46 | PLAYED |
| Martin Pospisil ★ | T30 | 1.46 | 1 | 1 | **HIT** | YES | 0.46 | PLAYED |
| Matt Coronato | T24H | 2.69 | 3 | 1 | **MISS** | NO | 1.69 | PLAYED |
| Matt Coronato | T90 | 2.68 | 3 | 1 | **MISS** | NO | 1.68 | PLAYED |
| Matt Coronato ★ | T30 | 2.68 | 3 | 1 | **MISS** | NO | 1.68 | PLAYED |
| Matty Beniers | T24H | 1.72 | 2 | 1 | **MISS** | NO | 0.72 | PLAYED |
| Matty Beniers | T90 | 1.72 | 2 | 1 | **MISS** | NO | 0.72 | PLAYED |
| Matty Beniers ★ | T30 | 1.72 | 2 | 1 | **MISS** | NO | 0.72 | PLAYED |
| Matvei Gridin | T24H | 2.54 | 3 | 5 | **MISS** | YES | 2.46 | PLAYED |
| Matvei Gridin | T90 | 2.55 | 3 | 5 | **MISS** | YES | 2.45 | PLAYED |
| Matvei Gridin ★ | T30 | 2.55 | 3 | 5 | **MISS** | YES | 2.45 | PLAYED |
| Maxim Tsyplakov | T24H | 0.12 | 0 | 2 | **MISS** | TRIVIAL | 1.88 | PLAYED |
| Maxim Tsyplakov | T90 | 0.11 | 0 | 2 | **MISS** | TRIVIAL | 1.89 | PLAYED |
| Maxim Tsyplakov ★ | T30 | 0.11 | 0 | 2 | **MISS** | TRIVIAL | 1.89 | PLAYED |
| Mikael Backlund | T24H | 1.81 | 2 | 1 | **MISS** | NO | 0.81 | PLAYED |
| Mikael Backlund | T90 | 1.82 | 2 | 1 | **MISS** | NO | 0.82 | PLAYED |
| Mikael Backlund ★ | T30 | 1.82 | 2 | 1 | **MISS** | NO | 0.82 | PLAYED |
| Morgan Frost | T24H | 2.00 | 2 | 1 | **MISS** | NO | 1.00 | PLAYED |
| Morgan Frost | T90 | 2.00 | 2 | 1 | **MISS** | NO | 1.00 | PLAYED |
| Morgan Frost ★ | T30 | 2.00 | 2 | 1 | **MISS** | NO | 1.00 | PLAYED |
| Player 8482074 | T24H | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Player 8482074 | T90 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Player 8482074 ★ | T30 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Ryan Lindgren | T24H | 0.04 | 0 | — | **DNP** | — | — | DNP |
| Ryan Lindgren | T90 | 0.04 | 0 | — | **DNP** | — | — | DNP |
| Ryan Lindgren ★ | T30 | 0.04 | 0 | — | **DNP** | — | — | DNP |
| Ryan Strome | T24H | 1.94 | 2 | 2 | **HIT** | YES | 0.06 | PLAYED |
| Ryan Strome | T90 | 1.94 | 2 | 2 | **HIT** | YES | 0.06 | PLAYED |
| Ryan Strome ★ | T30 | 1.94 | 2 | 2 | **HIT** | YES | 0.06 | PLAYED |
| Ryan Winterton | T24H | 1.11 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Ryan Winterton | T90 | 1.11 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Ryan Winterton ★ | T30 | 1.11 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Ryker Evans | T24H | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Ryker Evans | T90 | 1.29 | 1 | 1 | **HIT** | YES | 0.29 | PLAYED |
| Ryker Evans ★ | T30 | 1.29 | 1 | 1 | **HIT** | YES | 0.29 | PLAYED |
| Samuel Honzek | T24H | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Samuel Honzek | T90 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Samuel Honzek ★ | T30 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Shane Wright | T24H | 1.55 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Shane Wright | T90 | 1.55 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Shane Wright ★ | T30 | 1.55 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Simon Nemec | T24H | 1.46 | 1 | 3 | **MISS** | YES | 1.54 | PLAYED |
| Simon Nemec | T90 | 1.46 | 1 | 3 | **MISS** | YES | 1.54 | PLAYED |
| Simon Nemec ★ | T30 | 1.46 | 1 | 3 | **MISS** | YES | 1.54 | PLAYED |
| Vince Dunn | T24H | 2.02 | 2 | 0 | **MISS** | NO | 2.02 | PLAYED |
| Vince Dunn | T90 | 2.01 | 2 | 0 | **MISS** | NO | 2.01 | PLAYED |
| Vince Dunn ★ | T30 | 2.01 | 2 | 0 | **MISS** | NO | 2.01 | PLAYED |
| Yan Kuznetsov | T24H | 1.00 | 1 | 1 | **HIT** | YES | 0.00 | PLAYED |
| Yan Kuznetsov | T90 | 1.00 | 1 | 1 | **HIT** | YES | 0.00 | PLAYED |
| Yan Kuznetsov ★ | T30 | 1.00 | 1 | 1 | **HIT** | YES | 0.00 | PLAYED |
| Yegor Sharangovich | T24H | 1.56 | 2 | 1 | **MISS** | NO | 0.56 | PLAYED |
| Yegor Sharangovich | T90 | 1.55 | 2 | 1 | **MISS** | NO | 0.55 | PLAYED |
| Yegor Sharangovich ★ | T30 | 1.55 | 2 | 1 | **MISS** | NO | 0.55 | PLAYED |
| Zach Whitecloud | T24H | 1.17 | 1 | 0 | **MISS** | NO | 1.17 | PLAYED |
| Zach Whitecloud | T90 | 1.17 | 1 | 0 | **MISS** | NO | 1.17 | PLAYED |
| Zach Whitecloud ★ | T30 | 1.17 | 1 | 0 | **MISS** | NO | 1.17 | PLAYED |
| Zayne Parekh | T24H | 1.61 | 2 | 3 | **MISS** | YES | 1.39 | PLAYED |
| Zayne Parekh | T90 | 1.61 | 2 | 3 | **MISS** | YES | 1.39 | PLAYED |
| Zayne Parekh ★ | T30 | 1.61 | 2 | 3 | **MISS** | YES | 1.39 | PLAYED |

## 2026-10-31 — BOS vs CHI

Original snapshots: 132 (T24H=44, T90=44, T30=44); unique players=44. Verified played snapshot rows=108; DNP rows=24; unverified=0. **Exact rounded match among played snapshots: 33/108**. **Latest-snapshot exact matches: 11/36**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Alex Vlasic | T24H | 1.06 | 1 | 6 | **MISS** | YES | 4.94 | PLAYED |
| Alex Vlasic | T90 | 1.06 | 1 | 6 | **MISS** | YES | 4.94 | PLAYED |
| Alex Vlasic ★ | T30 | 1.06 | 1 | 6 | **MISS** | YES | 4.94 | PLAYED |
| Andrew Mangiapane | T24H | 0.19 | 0 | 2 | **MISS** | TRIVIAL | 1.81 | PLAYED |
| Andrew Mangiapane | T90 | 0.18 | 0 | 2 | **MISS** | TRIVIAL | 1.82 | PLAYED |
| Andrew Mangiapane ★ | T30 | 0.18 | 0 | 2 | **MISS** | TRIVIAL | 1.82 | PLAYED |
| Anton Frondell | T24H | 1.28 | 1 | 9 | **MISS** | YES | 7.72 | PLAYED |
| Anton Frondell | T90 | 1.27 | 1 | 9 | **MISS** | YES | 7.73 | PLAYED |
| Anton Frondell ★ | T30 | 1.27 | 1 | 9 | **MISS** | YES | 7.73 | PLAYED |
| Artyom Levshunov | T24H | 1.18 | 1 | 1 | **HIT** | YES | 0.18 | PLAYED |
| Artyom Levshunov | T90 | 1.18 | 1 | 1 | **HIT** | YES | 0.18 | PLAYED |
| Artyom Levshunov ★ | T30 | 1.18 | 1 | 1 | **HIT** | YES | 0.18 | PLAYED |
| Bowen Byram | T24H | 0.19 | 0 | — | **DNP** | — | — | DNP |
| Bowen Byram | T90 | 0.17 | 0 | — | **DNP** | — | — | DNP |
| Bowen Byram ★ | T30 | 0.17 | 0 | — | **DNP** | — | — | DNP |
| Casey Mittelstadt | T24H | 1.40 | 1 | 3 | **MISS** | YES | 1.60 | PLAYED |
| Casey Mittelstadt | T90 | 1.41 | 1 | 3 | **MISS** | YES | 1.59 | PLAYED |
| Casey Mittelstadt ★ | T30 | 1.41 | 1 | 3 | **MISS** | YES | 1.59 | PLAYED |
| Charlie McAvoy | T24H | 1.93 | 2 | 3 | **MISS** | YES | 1.07 | PLAYED |
| Charlie McAvoy | T90 | 1.93 | 2 | 3 | **MISS** | YES | 1.07 | PLAYED |
| Charlie McAvoy ★ | T30 | 1.93 | 2 | 3 | **MISS** | YES | 1.07 | PLAYED |
| Cole Smith | T24H | 1.12 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Cole Smith | T90 | 1.12 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Cole Smith ★ | T30 | 1.12 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Connor Bedard | T24H | 2.30 | 2 | 6 | **MISS** | YES | 3.70 | PLAYED |
| Connor Bedard | T90 | 2.30 | 2 | 6 | **MISS** | YES | 3.70 | PLAYED |
| Connor Bedard ★ | T30 | 2.30 | 2 | 6 | **MISS** | YES | 3.70 | PLAYED |
| Connor Clifton | T24H | 0.99 | 1 | — | **DNP** | — | — | DNP |
| Connor Clifton | T90 | 1.00 | 1 | — | **DNP** | — | — | DNP |
| Connor Clifton ★ | T30 | 1.00 | 1 | — | **DNP** | — | — | DNP |
| David Pastrnak | T24H | 2.98 | 3 | 4 | **MISS** | YES | 1.02 | PLAYED |
| David Pastrnak | T90 | 2.98 | 3 | 4 | **MISS** | YES | 1.02 | PLAYED |
| David Pastrnak ★ | T30 | 2.98 | 3 | 4 | **MISS** | YES | 1.02 | PLAYED |
| Dominic Toninato | T24H | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Dominic Toninato | T90 | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Dominic Toninato ★ | T30 | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Elias Lindholm | T24H | 1.83 | 2 | 2 | **HIT** | YES | 0.17 | PLAYED |
| Elias Lindholm | T90 | 1.83 | 2 | 2 | **HIT** | YES | 0.17 | PLAYED |
| Elias Lindholm ★ | T30 | 1.83 | 2 | 2 | **HIT** | YES | 0.17 | PLAYED |
| Ethan Del Mastro | T24H | 0.15 | 0 | 2 | **MISS** | TRIVIAL | 1.85 | PLAYED |
| Ethan Del Mastro | T90 | 0.14 | 0 | 2 | **MISS** | TRIVIAL | 1.86 | PLAYED |
| Ethan Del Mastro ★ | T30 | 0.14 | 0 | 2 | **MISS** | TRIVIAL | 1.86 | PLAYED |
| Frank Nazar | T24H | 1.34 | 1 | 2 | **MISS** | YES | 0.66 | PLAYED |
| Frank Nazar | T90 | 1.34 | 1 | 2 | **MISS** | YES | 0.66 | PLAYED |
| Frank Nazar ★ | T30 | 1.34 | 1 | 2 | **MISS** | YES | 0.66 | PLAYED |
| Fraser Minten | T24H | 1.97 | 2 | 0 | **MISS** | NO | 1.97 | PLAYED |
| Fraser Minten | T90 | 1.97 | 2 | 0 | **MISS** | NO | 1.97 | PLAYED |
| Fraser Minten ★ | T30 | 1.97 | 2 | 0 | **MISS** | NO | 1.97 | PLAYED |
| Frederic Brunet | T24H | 0.34 | 0 | — | **DNP** | — | — | DNP |
| Frederic Brunet | T90 | 0.32 | 0 | — | **DNP** | — | — | DNP |
| Frederic Brunet ★ | T30 | 0.32 | 0 | — | **DNP** | — | — | DNP |
| Hampus Lindholm | T24H | 1.39 | 1 | 1 | **HIT** | YES | 0.39 | PLAYED |
| Hampus Lindholm | T90 | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| Hampus Lindholm ★ | T30 | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| Ian Cole | T24H | 0.90 | 1 | 3 | **MISS** | YES | 2.10 | PLAYED |
| Ian Cole | T90 | 0.91 | 1 | 3 | **MISS** | YES | 2.09 | PLAYED |
| Ian Cole ★ | T30 | 0.91 | 1 | 3 | **MISS** | YES | 2.09 | PLAYED |
| James Hagens | T24H | 1.71 | 2 | 0 | **MISS** | NO | 1.71 | PLAYED |
| James Hagens | T90 | 1.71 | 2 | 0 | **MISS** | NO | 1.71 | PLAYED |
| James Hagens ★ | T30 | 1.71 | 2 | 0 | **MISS** | NO | 1.71 | PLAYED |
| JJ Peterka | T24H | 1.84 | 2 | 4 | **MISS** | YES | 2.16 | PLAYED |
| JJ Peterka | T90 | 1.85 | 2 | 4 | **MISS** | YES | 2.15 | PLAYED |
| JJ Peterka ★ | T30 | 1.85 | 2 | 4 | **MISS** | YES | 2.15 | PLAYED |
| Jonathan Aspirot | T24H | 0.14 | 0 | 2 | **MISS** | TRIVIAL | 1.86 | PLAYED |
| Jonathan Aspirot | T90 | 0.13 | 0 | 2 | **MISS** | TRIVIAL | 1.87 | PLAYED |
| Jonathan Aspirot ★ | T30 | 0.13 | 0 | 2 | **MISS** | TRIVIAL | 1.87 | PLAYED |
| Jordan Greenway | T24H | 0.98 | 1 | 0 | **MISS** | NO | 0.98 | PLAYED |
| Jordan Greenway | T90 | 0.99 | 1 | 0 | **MISS** | NO | 0.99 | PLAYED |
| Jordan Greenway ★ | T30 | 0.99 | 1 | 0 | **MISS** | NO | 0.99 | PLAYED |
| Kevin Korchinski | T24H | 0.61 | 1 | — | **DNP** | — | — | DNP |
| Kevin Korchinski | T90 | 0.61 | 1 | — | **DNP** | — | — | DNP |
| Kevin Korchinski ★ | T30 | 0.61 | 1 | — | **DNP** | — | — | DNP |
| Marat Khusnutdinov | T24H | 1.20 | 1 | 1 | **HIT** | YES | 0.20 | PLAYED |
| Marat Khusnutdinov | T90 | 1.20 | 1 | 1 | **HIT** | YES | 0.20 | PLAYED |
| Marat Khusnutdinov ★ | T30 | 1.20 | 1 | 1 | **HIT** | YES | 0.20 | PLAYED |
| Mark Kastelic | T24H | 1.15 | 1 | 1 | **HIT** | YES | 0.15 | PLAYED |
| Mark Kastelic | T90 | 1.15 | 1 | 1 | **HIT** | YES | 0.15 | PLAYED |
| Mark Kastelic ★ | T30 | 1.15 | 1 | 1 | **HIT** | YES | 0.15 | PLAYED |
| Mason Lohrei | T24H | 1.06 | 1 | 1 | **HIT** | YES | 0.06 | PLAYED |
| Mason Lohrei | T90 | 1.07 | 1 | 1 | **HIT** | YES | 0.07 | PLAYED |
| Mason Lohrei ★ | T30 | 1.07 | 1 | 1 | **HIT** | YES | 0.07 | PLAYED |
| Matthew Poitras | T24H | 1.11 | 1 | — | **DNP** | — | — | DNP |
| Matthew Poitras | T90 | 1.07 | 1 | — | **DNP** | — | — | DNP |
| Matthew Poitras ★ | T30 | 1.07 | 1 | — | **DNP** | — | — | DNP |
| Morgan Geekie | T24H | 1.59 | 2 | 3 | **MISS** | YES | 1.41 | PLAYED |
| Morgan Geekie | T90 | 1.59 | 2 | 3 | **MISS** | YES | 1.41 | PLAYED |
| Morgan Geekie ★ | T30 | 1.59 | 2 | 3 | **MISS** | YES | 1.41 | PLAYED |
| Nikita Zadorov | T24H | 1.11 | 1 | 0 | **MISS** | NO | 1.11 | PLAYED |
| Nikita Zadorov | T90 | 1.11 | 1 | 0 | **MISS** | NO | 1.11 | PLAYED |
| Nikita Zadorov ★ | T30 | 1.11 | 1 | 0 | **MISS** | NO | 1.11 | PLAYED |
| Oliver Moore | T24H | 1.13 | 1 | 2 | **MISS** | YES | 0.87 | PLAYED |
| Oliver Moore | T90 | 1.13 | 1 | 2 | **MISS** | YES | 0.87 | PLAYED |
| Oliver Moore ★ | T30 | 1.13 | 1 | 2 | **MISS** | YES | 0.87 | PLAYED |
| Patrick Kane | T24H | 1.87 | 2 | 2 | **HIT** | YES | 0.13 | PLAYED |
| Patrick Kane | T90 | 1.86 | 2 | 2 | **HIT** | YES | 0.14 | PLAYED |
| Patrick Kane ★ | T30 | 1.86 | 2 | 2 | **HIT** | YES | 0.14 | PLAYED |
| Pavel Zacha | T24H | 1.99 | 2 | 3 | **MISS** | YES | 1.01 | PLAYED |
| Pavel Zacha | T90 | 1.99 | 2 | 3 | **MISS** | YES | 1.01 | PLAYED |
| Pavel Zacha ★ | T30 | 1.99 | 2 | 3 | **MISS** | YES | 1.01 | PLAYED |
| Player 8484185 | T24H | 0.10 | 0 | — | **DNP** | — | — | DNP |
| Player 8484185 | T90 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Player 8484185 ★ | T30 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Roman Kantserov | T24H | 2.09 | 2 | 0 | **MISS** | NO | 2.09 | PLAYED |
| Roman Kantserov | T90 | 2.09 | 2 | 0 | **MISS** | NO | 2.09 | PLAYED |
| Roman Kantserov ★ | T30 | 2.09 | 2 | 0 | **MISS** | NO | 2.09 | PLAYED |
| Ryan Donato | T24H | 1.07 | 1 | 0 | **MISS** | NO | 1.07 | PLAYED |
| Ryan Donato | T90 | 1.08 | 1 | 0 | **MISS** | NO | 1.08 | PLAYED |
| Ryan Donato ★ | T30 | 1.08 | 1 | 0 | **MISS** | NO | 1.08 | PLAYED |
| Ryan Greene | T24H | 1.08 | 1 | 2 | **MISS** | YES | 0.92 | PLAYED |
| Ryan Greene | T90 | 1.08 | 1 | 2 | **MISS** | YES | 0.92 | PLAYED |
| Ryan Greene ★ | T30 | 1.08 | 1 | 2 | **MISS** | YES | 0.92 | PLAYED |
| Sam Rinzel | T24H | 0.88 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Sam Rinzel | T90 | 0.88 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Sam Rinzel ★ | T30 | 0.88 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Sean Kuraly | T24H | 0.17 | 0 | 1 | **MISS** | TRIVIAL | 0.83 | PLAYED |
| Sean Kuraly | T90 | 0.15 | 0 | 1 | **MISS** | TRIVIAL | 0.85 | PLAYED |
| Sean Kuraly ★ | T30 | 0.15 | 0 | 1 | **MISS** | TRIVIAL | 0.85 | PLAYED |
| Tanner Jeannot | T24H | 0.86 | 1 | 2 | **MISS** | YES | 1.14 | PLAYED |
| Tanner Jeannot | T90 | 0.86 | 1 | 2 | **MISS** | YES | 1.14 | PLAYED |
| Tanner Jeannot ★ | T30 | 0.86 | 1 | 2 | **MISS** | YES | 1.14 | PLAYED |
| Teuvo Teravainen | T24H | 1.30 | 1 | — | **DNP** | — | — | DNP |
| Teuvo Teravainen | T90 | 1.31 | 1 | — | **DNP** | — | — | DNP |
| Teuvo Teravainen ★ | T30 | 1.31 | 1 | — | **DNP** | — | — | DNP |
| Tyler Bertuzzi | T24H | 1.59 | 2 | 1 | **MISS** | NO | 0.59 | PLAYED |
| Tyler Bertuzzi | T90 | 1.59 | 2 | 1 | **MISS** | NO | 0.59 | PLAYED |
| Tyler Bertuzzi ★ | T30 | 1.59 | 2 | 1 | **MISS** | NO | 0.59 | PLAYED |
| Will Borgen | T24H | 1.06 | 1 | 1 | **HIT** | YES | 0.06 | PLAYED |
| Will Borgen | T90 | 1.06 | 1 | 1 | **HIT** | YES | 0.06 | PLAYED |
| Will Borgen ★ | T30 | 1.06 | 1 | 1 | **HIT** | YES | 0.06 | PLAYED |
| Wyatt Kaiser | T24H | 0.96 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Wyatt Kaiser | T90 | 0.96 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Wyatt Kaiser ★ | T30 | 0.96 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |

## 2026-10-31 — DET vs STL

Original snapshots: 129 (T24H=43, T90=43, T30=43); unique players=43. Verified played snapshot rows=105; DNP rows=24; unverified=0. **Exact rounded match among played snapshots: 30/105**. **Latest-snapshot exact matches: 10/35**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Jiricek | T24H | 1.01 | 1 | 2 | **MISS** | YES | 0.99 | PLAYED |
| Adam Jiricek | T90 | 1.02 | 1 | 2 | **MISS** | YES | 0.98 | PLAYED |
| Adam Jiricek ★ | T30 | 1.02 | 1 | 2 | **MISS** | YES | 0.98 | PLAYED |
| Albert Johansson | T24H | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Albert Johansson | T90 | 0.25 | 0 | — | **DNP** | — | — | DNP |
| Albert Johansson ★ | T30 | 0.25 | 0 | — | **DNP** | — | — | DNP |
| Aleksanteri Kaskimaki | T24H | 0.97 | 1 | 1 | **HIT** | YES | 0.03 | PLAYED |
| Aleksanteri Kaskimaki | T90 | 0.98 | 1 | 1 | **HIT** | YES | 0.02 | PLAYED |
| Aleksanteri Kaskimaki ★ | T30 | 0.98 | 1 | 1 | **HIT** | YES | 0.02 | PLAYED |
| Alex DeBrincat | T24H | 3.45 | 3 | 3 | **HIT** | YES | 0.45 | PLAYED |
| Alex DeBrincat | T90 | 3.43 | 3 | 3 | **HIT** | YES | 0.43 | PLAYED |
| Alex DeBrincat ★ | T30 | 3.43 | 3 | 3 | **HIT** | YES | 0.43 | PLAYED |
| Alexey Toropchenko | T24H | 0.73 | 1 | 0 | **MISS** | NO | 0.73 | PLAYED |
| Alexey Toropchenko | T90 | 0.74 | 1 | 0 | **MISS** | NO | 0.74 | PLAYED |
| Alexey Toropchenko ★ | T30 | 0.74 | 1 | 0 | **MISS** | NO | 0.74 | PLAYED |
| Andreas Englund | T24H | 0.76 | 1 | 0 | **MISS** | NO | 0.76 | PLAYED |
| Andreas Englund | T90 | 0.77 | 1 | 0 | **MISS** | NO | 0.77 | PLAYED |
| Andreas Englund ★ | T30 | 0.77 | 1 | 0 | **MISS** | NO | 0.77 | PLAYED |
| Andrew Copp | T24H | 1.74 | 2 | 1 | **MISS** | NO | 0.74 | PLAYED |
| Andrew Copp | T90 | 1.74 | 2 | 1 | **MISS** | NO | 0.74 | PLAYED |
| Andrew Copp ★ | T30 | 1.74 | 2 | 1 | **MISS** | NO | 0.74 | PLAYED |
| Anton Johansson | T24H | 0.88 | 1 | 2 | **MISS** | YES | 1.12 | PLAYED |
| Anton Johansson | T90 | 0.88 | 1 | 2 | **MISS** | YES | 1.12 | PLAYED |
| Anton Johansson ★ | T30 | 0.88 | 1 | 2 | **MISS** | YES | 1.12 | PLAYED |
| Axel Sandin-Pellikka | T24H | 0.13 | 0 | — | **DNP** | — | — | DNP |
| Ben Chiarot | T24H | 1.16 | 1 | 2 | **MISS** | YES | 0.84 | PLAYED |
| Ben Chiarot | T90 | 1.16 | 1 | 2 | **MISS** | YES | 0.84 | PLAYED |
| Ben Chiarot ★ | T30 | 1.16 | 1 | 2 | **MISS** | YES | 0.84 | PLAYED |
| Brandon Carlo | T24H | 0.86 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Brandon Carlo | T90 | 0.86 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Brandon Carlo ★ | T30 | 0.86 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Cam Fowler | T24H | 1.25 | 1 | 0 | **MISS** | NO | 1.25 | PLAYED |
| Cam Fowler | T90 | 1.25 | 1 | 0 | **MISS** | NO | 1.25 | PLAYED |
| Cam Fowler ★ | T30 | 1.25 | 1 | 0 | **MISS** | NO | 1.25 | PLAYED |
| Carter Mazur | T24H | 0.88 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Carter Mazur | T90 | 0.89 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Carter Mazur ★ | T30 | 0.89 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Colton Parayko | T24H | 1.08 | 1 | — | **DNP** | — | — | DNP |
| Colton Parayko | T90 | 1.08 | 1 | — | **DNP** | — | — | DNP |
| Colton Parayko ★ | T30 | 1.08 | 1 | — | **DNP** | — | — | DNP |
| Connor McMichael | T24H | 1.42 | 1 | 1 | **HIT** | YES | 0.42 | PLAYED |
| Connor McMichael | T90 | 1.42 | 1 | 1 | **HIT** | YES | 0.42 | PLAYED |
| Connor McMichael ★ | T30 | 1.42 | 1 | 1 | **HIT** | YES | 0.42 | PLAYED |
| Dalibor Dvorsky | T24H | 1.09 | 1 | 2 | **MISS** | YES | 0.91 | PLAYED |
| Dalibor Dvorsky | T90 | 1.09 | 1 | 2 | **MISS** | YES | 0.91 | PLAYED |
| Dalibor Dvorsky ★ | T30 | 1.09 | 1 | 2 | **MISS** | YES | 0.91 | PLAYED |
| Dillon Dube | T24H | 0.05 | 0 | — | **DNP** | — | — | DNP |
| Dillon Dube | T90 | 0.04 | 0 | — | **DNP** | — | — | DNP |
| Dillon Dube ★ | T30 | 0.04 | 0 | — | **DNP** | — | — | DNP |
| Dylan Holloway | T24H | 1.90 | 2 | 1 | **MISS** | NO | 0.90 | PLAYED |
| Dylan Holloway | T90 | 1.90 | 2 | 1 | **MISS** | NO | 0.90 | PLAYED |
| Dylan Holloway ★ | T30 | 1.90 | 2 | 1 | **MISS** | NO | 0.90 | PLAYED |
| Emmitt Finnie | T24H | 2.16 | 2 | 5 | **MISS** | YES | 2.84 | PLAYED |
| Emmitt Finnie | T90 | 2.16 | 2 | 5 | **MISS** | YES | 2.84 | PLAYED |
| Emmitt Finnie ★ | T30 | 2.16 | 2 | 5 | **MISS** | YES | 2.84 | PLAYED |
| J.T. Compher | T24H | 1.22 | 1 | 1 | **HIT** | YES | 0.22 | PLAYED |
| J.T. Compher | T90 | 1.23 | 1 | 1 | **HIT** | YES | 0.23 | PLAYED |
| J.T. Compher ★ | T30 | 1.23 | 1 | 1 | **HIT** | YES | 0.23 | PLAYED |
| Jake Neighbours | T24H | 1.75 | 2 | 0 | **MISS** | NO | 1.75 | PLAYED |
| Jake Neighbours | T90 | 1.75 | 2 | 0 | **MISS** | NO | 1.75 | PLAYED |
| Jake Neighbours ★ | T30 | 1.75 | 2 | 0 | **MISS** | NO | 1.75 | PLAYED |
| Jimmy Snuggerud | T24H | 1.75 | 2 | 1 | **MISS** | NO | 0.75 | PLAYED |
| Jimmy Snuggerud | T90 | 1.74 | 2 | 1 | **MISS** | NO | 0.74 | PLAYED |
| Jimmy Snuggerud ★ | T30 | 1.74 | 2 | 1 | **MISS** | NO | 0.74 | PLAYED |
| Jonatan Berggren | T24H | 1.34 | 1 | 0 | **MISS** | NO | 1.34 | PLAYED |
| Jonatan Berggren | T90 | 1.34 | 1 | 0 | **MISS** | NO | 1.34 | PLAYED |
| Jonatan Berggren ★ | T30 | 1.34 | 1 | 0 | **MISS** | NO | 1.34 | PLAYED |
| Justin Barron | T24H | 0.92 | 1 | 1 | **HIT** | YES | 0.08 | PLAYED |
| Justin Barron | T90 | 0.92 | 1 | 1 | **HIT** | YES | 0.08 | PLAYED |
| Justin Barron ★ | T30 | 0.92 | 1 | 1 | **HIT** | YES | 0.08 | PLAYED |
| Justin Faulk | T24H | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| Justin Faulk | T90 | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| Justin Faulk ★ | T30 | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| Keegan Kolesar | T24H | 0.76 | 1 | 2 | **MISS** | YES | 1.24 | PLAYED |
| Keegan Kolesar | T90 | 0.76 | 1 | 2 | **MISS** | YES | 1.24 | PLAYED |
| Keegan Kolesar ★ | T30 | 0.76 | 1 | 2 | **MISS** | YES | 1.24 | PLAYED |
| Lucas Raymond | T24H | 2.88 | 3 | 4 | **MISS** | YES | 1.12 | PLAYED |
| Lucas Raymond | T90 | 2.87 | 3 | 4 | **MISS** | YES | 1.13 | PLAYED |
| Lucas Raymond ★ | T30 | 2.87 | 3 | 4 | **MISS** | YES | 1.13 | PLAYED |
| Mason McTavish | T24H | 2.35 | 2 | 1 | **MISS** | NO | 1.35 | PLAYED |
| Mason McTavish | T90 | 2.35 | 2 | 1 | **MISS** | NO | 1.35 | PLAYED |
| Mason McTavish ★ | T30 | 2.35 | 2 | 1 | **MISS** | NO | 1.35 | PLAYED |
| Michael Brandsegg-Nygård | T24H | 1.71 | 2 | 0 | **MISS** | NO | 1.71 | PLAYED |
| Michael Brandsegg-Nygård | T90 | 1.70 | 2 | 0 | **MISS** | NO | 1.70 | PLAYED |
| Michael Brandsegg-Nygård ★ | T30 | 1.70 | 2 | 0 | **MISS** | NO | 1.70 | PLAYED |
| Michael Rasmussen | T24H | 1.60 | 2 | 0 | **MISS** | NO | 1.60 | PLAYED |
| Michael Rasmussen | T90 | 1.60 | 2 | 0 | **MISS** | NO | 1.60 | PLAYED |
| Michael Rasmussen ★ | T30 | 1.60 | 2 | 0 | **MISS** | NO | 1.60 | PLAYED |
| Moritz Seider | T24H | 2.39 | 2 | 1 | **MISS** | NO | 1.39 | PLAYED |
| Moritz Seider | T90 | 2.38 | 2 | 1 | **MISS** | NO | 1.38 | PLAYED |
| Moritz Seider ★ | T30 | 2.38 | 2 | 1 | **MISS** | NO | 1.38 | PLAYED |
| Nate Danielson | T24H | 0.90 | 1 | 0 | **MISS** | NO | 0.90 | PLAYED |
| Nate Danielson | T90 | 0.90 | 1 | 0 | **MISS** | NO | 0.90 | PLAYED |
| Nate Danielson ★ | T30 | 0.90 | 1 | 0 | **MISS** | NO | 0.90 | PLAYED |
| Pavel Buchnevich | T24H | 1.67 | 2 | 1 | **MISS** | NO | 0.67 | PLAYED |
| Pavel Buchnevich | T90 | 1.66 | 2 | 1 | **MISS** | NO | 0.66 | PLAYED |
| Pavel Buchnevich ★ | T30 | 1.66 | 2 | 1 | **MISS** | NO | 0.66 | PLAYED |
| Philip Broberg | T24H | 2.00 | 2 | 0 | **MISS** | NO | 2.00 | PLAYED |
| Philip Broberg | T90 | 2.00 | 2 | 0 | **MISS** | NO | 2.00 | PLAYED |
| Philip Broberg ★ | T30 | 2.00 | 2 | 0 | **MISS** | NO | 2.00 | PLAYED |
| Pius Suter | T24H | 1.02 | 1 | 0 | **MISS** | NO | 1.02 | PLAYED |
| Pius Suter | T90 | 1.02 | 1 | 0 | **MISS** | NO | 1.02 | PLAYED |
| Pius Suter ★ | T30 | 1.02 | 1 | 0 | **MISS** | NO | 1.02 | PLAYED |
| Player 8477946 | T24H | 1.10 | 1 | — | **DNP** | — | — | DNP |
| Player 8477946 | T90 | 1.03 | 1 | — | **DNP** | — | — | DNP |
| Player 8477946 ★ | T30 | 1.03 | 1 | — | **DNP** | — | — | DNP |
| Player 8482784 | T24H | 0.10 | 0 | — | **DNP** | — | — | DNP |
| Player 8482784 | T90 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Player 8482784 ★ | T30 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Player 8484188 | T24H | 0.11 | 0 | 1 | **MISS** | TRIVIAL | 0.89 | PLAYED |
| Player 8484223 | T90 | 0.12 | 0 | — | **DNP** | — | — | DNP |
| Player 8484223 ★ | T30 | 0.12 | 0 | — | **DNP** | — | — | DNP |
| Player 8484230 | T24H | 0.23 | 0 | — | **DNP** | — | — | DNP |
| Player 8484230 | T90 | 0.22 | 0 | — | **DNP** | — | — | DNP |
| Player 8484230 ★ | T30 | 0.22 | 0 | — | **DNP** | — | — | DNP |
| Robert Thomas | T24H | 1.60 | 2 | 2 | **HIT** | YES | 0.40 | PLAYED |
| Robert Thomas | T90 | 1.60 | 2 | 2 | **HIT** | YES | 0.40 | PLAYED |
| Robert Thomas ★ | T30 | 1.60 | 2 | 2 | **HIT** | YES | 0.40 | PLAYED |
| Ross Johnston | T24H | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Ross Johnston | T90 | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Ross Johnston ★ | T30 | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Sheldon Dries | T24H | 0.78 | 1 | 1 | **HIT** | YES | 0.22 | PLAYED |
| Sheldon Dries | T90 | 0.78 | 1 | 1 | **HIT** | YES | 0.22 | PLAYED |
| Sheldon Dries ★ | T30 | 0.78 | 1 | 1 | **HIT** | YES | 0.22 | PLAYED |
| Theo Lindstein | T90 | 0.10 | 0 | 1 | **MISS** | TRIVIAL | 0.90 | PLAYED |
| Theo Lindstein ★ | T30 | 0.10 | 0 | 1 | **MISS** | TRIVIAL | 0.90 | PLAYED |
| Viktor Arvidsson | T24H | 2.71 | 3 | 2 | **MISS** | NO | 0.71 | PLAYED |
| Viktor Arvidsson | T90 | 2.70 | 3 | 2 | **MISS** | NO | 0.70 | PLAYED |
| Viktor Arvidsson ★ | T30 | 2.70 | 3 | 2 | **MISS** | NO | 0.70 | PLAYED |

## 2026-10-31 — NSH vs TBL

Original snapshots: 84 (T24H=0, T90=42, T30=42); unique players=42. Verified played snapshot rows=72; DNP rows=12; unverified=0. **Exact rounded match among played snapshots: 24/72**. **Latest-snapshot exact matches: 12/36**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Edstrom | T90 | 1.28 | 1 | 2 | **MISS** | YES | 0.72 | PLAYED |
| Adam Edstrom ★ | T30 | 1.28 | 1 | 2 | **MISS** | YES | 0.72 | PLAYED |
| Adam Wilsby | T90 | 1.11 | 1 | 3 | **MISS** | YES | 1.89 | PLAYED |
| Adam Wilsby ★ | T30 | 1.11 | 1 | 3 | **MISS** | YES | 1.89 | PLAYED |
| Alexander Kerfoot | T90 | 1.26 | 1 | 0 | **MISS** | NO | 1.26 | PLAYED |
| Alexander Kerfoot ★ | T30 | 1.26 | 1 | 0 | **MISS** | NO | 1.26 | PLAYED |
| Anthony Cirelli | T90 | 1.68 | 2 | 0 | **MISS** | NO | 1.68 | PLAYED |
| Anthony Cirelli ★ | T30 | 1.68 | 2 | 0 | **MISS** | NO | 1.68 | PLAYED |
| Brady Skjei | T90 | 1.16 | 1 | 0 | **MISS** | NO | 1.16 | PLAYED |
| Brady Skjei ★ | T30 | 1.16 | 1 | 0 | **MISS** | NO | 1.16 | PLAYED |
| Brandon Hagel | T90 | 4.03 | 4 | 3 | **MISS** | NO | 1.03 | PLAYED |
| Brandon Hagel ★ | T30 | 4.03 | 4 | 3 | **MISS** | NO | 1.03 | PLAYED |
| Brayden Point | T90 | 2.35 | 2 | 3 | **MISS** | YES | 0.65 | PLAYED |
| Brayden Point ★ | T30 | 2.35 | 2 | 3 | **MISS** | YES | 0.65 | PLAYED |
| Charle-Edouard D'Astous | T90 | 1.50 | 1 | 0 | **MISS** | NO | 1.50 | PLAYED |
| Charle-Edouard D'Astous ★ | T30 | 1.50 | 1 | 0 | **MISS** | NO | 1.50 | PLAYED |
| Conor Geekie | T90 | 1.19 | 1 | 1 | **HIT** | YES | 0.19 | PLAYED |
| Conor Geekie ★ | T30 | 1.19 | 1 | 1 | **HIT** | YES | 0.19 | PLAYED |
| Daemon Hunt | T90 | 0.70 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Daemon Hunt ★ | T30 | 0.70 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Dominic James | T90 | 1.13 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Dominic James ★ | T30 | 1.13 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Emil Lilleberg | T90 | 0.68 | 1 | — | **DNP** | — | — | DNP |
| Emil Lilleberg ★ | T30 | 0.68 | 1 | — | **DNP** | — | — | DNP |
| Erik Cernak | T90 | 1.08 | 1 | — | **DNP** | — | — | DNP |
| Erik Cernak ★ | T30 | 1.08 | 1 | — | **DNP** | — | — | DNP |
| Filip Forsberg | T90 | 2.84 | 3 | 2 | **MISS** | NO | 0.84 | PLAYED |
| Filip Forsberg ★ | T30 | 2.84 | 3 | 2 | **MISS** | NO | 0.84 | PLAYED |
| Gage Goncalves | T90 | 1.32 | 1 | 1 | **HIT** | YES | 0.32 | PLAYED |
| Gage Goncalves ★ | T30 | 1.32 | 1 | 1 | **HIT** | YES | 0.32 | PLAYED |
| Ilya Lyubushkin | T90 | 0.12 | 0 | — | **DNP** | — | — | DNP |
| Ilya Lyubushkin ★ | T30 | 0.12 | 0 | — | **DNP** | — | — | DNP |
| Ilya Mikheyev | T90 | 1.26 | 1 | 1 | **HIT** | YES | 0.26 | PLAYED |
| Ilya Mikheyev ★ | T30 | 1.26 | 1 | 1 | **HIT** | YES | 0.26 | PLAYED |
| J.J. Moser | T90 | 1.09 | 1 | 2 | **MISS** | YES | 0.91 | PLAYED |
| J.J. Moser ★ | T30 | 1.09 | 1 | 2 | **MISS** | YES | 0.91 | PLAYED |
| Jack Drury | T90 | 1.44 | 1 | 1 | **HIT** | YES | 0.44 | PLAYED |
| Jack Drury ★ | T30 | 1.44 | 1 | 1 | **HIT** | YES | 0.44 | PLAYED |
| Jake Guentzel | T90 | 3.06 | 3 | 3 | **HIT** | YES | 0.06 | PLAYED |
| Jake Guentzel ★ | T30 | 3.06 | 3 | 3 | **HIT** | YES | 0.06 | PLAYED |
| Jayden Struble | T90 | 0.66 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Jayden Struble ★ | T30 | 0.66 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Jeffrey Viel | T90 | 0.84 | 1 | 0 | **MISS** | NO | 0.84 | PLAYED |
| Jeffrey Viel ★ | T30 | 0.84 | 1 | 0 | **MISS** | NO | 0.84 | PLAYED |
| John Carlson | T90 | 1.76 | 2 | 5 | **MISS** | YES | 3.24 | PLAYED |
| John Carlson ★ | T30 | 1.76 | 2 | 5 | **MISS** | YES | 3.24 | PLAYED |
| Jonathan Marchessault | T90 | 2.06 | 2 | 4 | **MISS** | YES | 1.94 | PLAYED |
| Jonathan Marchessault ★ | T30 | 2.06 | 2 | 4 | **MISS** | YES | 1.94 | PLAYED |
| Matthew Wood | T90 | 1.26 | 1 | 1 | **HIT** | YES | 0.26 | PLAYED |
| Matthew Wood ★ | T30 | 1.26 | 1 | 1 | **HIT** | YES | 0.26 | PLAYED |
| Mavrik Bourque | T90 | 1.48 | 1 | 1 | **HIT** | YES | 0.48 | PLAYED |
| Mavrik Bourque ★ | T30 | 1.48 | 1 | 1 | **HIT** | YES | 0.48 | PLAYED |
| Max Crozier | T90 | 0.27 | 0 | 2 | **MISS** | TRIVIAL | 1.73 | PLAYED |
| Max Crozier ★ | T30 | 0.27 | 0 | 2 | **MISS** | TRIVIAL | 1.73 | PLAYED |
| Nick Perbix | T90 | 0.90 | 1 | 2 | **MISS** | YES | 1.10 | PLAYED |
| Nick Perbix ★ | T30 | 0.90 | 1 | 2 | **MISS** | YES | 1.10 | PLAYED |
| Nicolas Hague | T90 | 0.76 | 1 | — | **DNP** | — | — | DNP |
| Nicolas Hague ★ | T30 | 0.76 | 1 | — | **DNP** | — | — | DNP |
| Nikita Kucherov | T90 | 2.83 | 3 | 1 | **MISS** | NO | 1.83 | PLAYED |
| Nikita Kucherov ★ | T30 | 2.83 | 3 | 1 | **MISS** | NO | 1.83 | PLAYED |
| Nils Hoglander | T90 | 1.00 | 1 | 0 | **MISS** | NO | 1.00 | PLAYED |
| Nils Hoglander ★ | T30 | 1.00 | 1 | 0 | **MISS** | NO | 1.00 | PLAYED |
| Player 8482072 | T90 | 0.04 | 0 | — | **DNP** | — | — | DNP |
| Player 8482072 ★ | T30 | 0.04 | 0 | — | **DNP** | — | — | DNP |
| Pontus Holmberg | T90 | 1.44 | 1 | 1 | **HIT** | YES | 0.44 | PLAYED |
| Pontus Holmberg ★ | T30 | 1.44 | 1 | 1 | **HIT** | YES | 0.44 | PLAYED |
| Reid Schaefer | T90 | 0.14 | 0 | 2 | **MISS** | TRIVIAL | 1.86 | PLAYED |
| Reid Schaefer ★ | T30 | 0.14 | 0 | 2 | **MISS** | TRIVIAL | 1.86 | PLAYED |
| Roman Josi | T90 | 2.51 | 3 | 5 | **MISS** | YES | 2.49 | PLAYED |
| Roman Josi ★ | T30 | 2.51 | 3 | 5 | **MISS** | YES | 2.49 | PLAYED |
| Ross Colton | T90 | 1.30 | 1 | 2 | **MISS** | YES | 0.70 | PLAYED |
| Ross Colton ★ | T30 | 1.30 | 1 | 2 | **MISS** | YES | 0.70 | PLAYED |
| Ryan McDonagh | T90 | 0.91 | 1 | 0 | **MISS** | NO | 0.91 | PLAYED |
| Ryan McDonagh ★ | T30 | 0.91 | 1 | 0 | **MISS** | NO | 0.91 | PLAYED |
| Ryan O'Reilly | T90 | 2.43 | 2 | 0 | **MISS** | NO | 2.43 | PLAYED |
| Ryan O'Reilly ★ | T30 | 2.43 | 2 | 0 | **MISS** | NO | 2.43 | PLAYED |
| Scott Sabourin | T90 | 0.21 | 0 | 0 | **HIT** | TRIVIAL | 0.21 | PLAYED |
| Scott Sabourin ★ | T30 | 0.21 | 0 | 0 | **HIT** | TRIVIAL | 0.21 | PLAYED |
| Steven Stamkos | T90 | 2.14 | 2 | 6 | **MISS** | YES | 3.86 | PLAYED |
| Steven Stamkos ★ | T30 | 2.14 | 2 | 6 | **MISS** | YES | 3.86 | PLAYED |
| Victor Hedman | T90 | 0.78 | 1 | 2 | **MISS** | YES | 1.22 | PLAYED |
| Victor Hedman ★ | T30 | 0.78 | 1 | 2 | **MISS** | YES | 1.22 | PLAYED |
| Zemgus Girgensons | T90 | 0.40 | 0 | — | **DNP** | — | — | DNP |
| Zemgus Girgensons ★ | T30 | 0.40 | 0 | — | **DNP** | — | — | DNP |

## 2026-10-31 — EDM vs NYI

Original snapshots: 88 (T24H=0, T90=44, T30=44); unique players=44. Verified played snapshot rows=72; DNP rows=16; unverified=0. **Exact rounded match among played snapshots: 30/72**. **Latest-snapshot exact matches: 15/36**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Pelech | T90 | 1.39 | 1 | 0 | **MISS** | NO | 1.39 | PLAYED |
| Adam Pelech ★ | T30 | 1.39 | 1 | 0 | **MISS** | NO | 1.39 | PLAYED |
| Alex Formenton | T90 | 1.03 | 1 | 1 | **HIT** | YES | 0.03 | PLAYED |
| Alex Formenton ★ | T30 | 1.03 | 1 | 1 | **HIT** | YES | 0.03 | PLAYED |
| Anthony Duclair | T90 | 1.41 | 1 | 0 | **MISS** | NO | 1.41 | PLAYED |
| Anthony Duclair ★ | T30 | 1.41 | 1 | 0 | **MISS** | NO | 1.41 | PLAYED |
| Bo Horvat | T90 | 3.20 | 3 | 3 | **HIT** | YES | 0.20 | PLAYED |
| Bo Horvat ★ | T30 | 3.20 | 3 | 3 | **HIT** | YES | 0.20 | PLAYED |
| Brayden Schenn | T90 | 1.93 | 2 | 0 | **MISS** | NO | 1.93 | PLAYED |
| Brayden Schenn ★ | T30 | 1.93 | 2 | 0 | **MISS** | NO | 1.93 | PLAYED |
| Calum Ritchie | T90 | 0.12 | 0 | — | **DNP** | — | — | DNP |
| Calum Ritchie ★ | T30 | 0.12 | 0 | — | **DNP** | — | — | DNP |
| Casey Cizikas | T90 | 0.89 | 1 | 0 | **MISS** | NO | 0.89 | PLAYED |
| Casey Cizikas ★ | T30 | 0.89 | 1 | 0 | **MISS** | NO | 0.89 | PLAYED |
| Colton Dach | T90 | 1.35 | 1 | 2 | **MISS** | YES | 0.65 | PLAYED |
| Colton Dach ★ | T30 | 1.35 | 1 | 2 | **MISS** | YES | 0.65 | PLAYED |
| Connor McDavid | T90 | 2.86 | 3 | 3 | **HIT** | YES | 0.14 | PLAYED |
| Connor McDavid ★ | T30 | 2.86 | 3 | 3 | **HIT** | YES | 0.14 | PLAYED |
| Connor Murphy | T90 | 1.15 | 1 | 2 | **MISS** | YES | 0.85 | PLAYED |
| Connor Murphy ★ | T30 | 1.15 | 1 | 2 | **MISS** | YES | 0.85 | PLAYED |
| Emil Heineman | T90 | 1.69 | 2 | 0 | **MISS** | NO | 1.69 | PLAYED |
| Emil Heineman ★ | T30 | 1.69 | 2 | 0 | **MISS** | NO | 1.69 | PLAYED |
| Evan Bouchard | T90 | 2.56 | 3 | 3 | **HIT** | YES | 0.44 | PLAYED |
| Evan Bouchard ★ | T30 | 2.56 | 3 | 3 | **HIT** | YES | 0.44 | PLAYED |
| Filip Hallander | T90 | 0.24 | 0 | — | **DNP** | — | — | DNP |
| Filip Hallander ★ | T30 | 0.24 | 0 | — | **DNP** | — | — | DNP |
| Isaac Howard | T90 | 0.88 | 1 | 0 | **MISS** | NO | 0.88 | PLAYED |
| Isaac Howard ★ | T30 | 0.88 | 1 | 0 | **MISS** | NO | 0.88 | PLAYED |
| Jake Walman | T90 | 0.31 | 0 | — | **DNP** | — | — | DNP |
| Jake Walman ★ | T30 | 0.31 | 0 | — | **DNP** | — | — | DNP |
| Jason Dickinson | T90 | 0.96 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Jason Dickinson ★ | T30 | 0.96 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Jean-Gabriel Pageau | T90 | 1.36 | 1 | 0 | **MISS** | NO | 1.36 | PLAYED |
| Jean-Gabriel Pageau ★ | T30 | 1.36 | 1 | 0 | **MISS** | NO | 1.36 | PLAYED |
| Kasperi Kapanen | T90 | 1.61 | 2 | 2 | **HIT** | YES | 0.39 | PLAYED |
| Kasperi Kapanen ★ | T30 | 1.61 | 2 | 2 | **HIT** | YES | 0.39 | PLAYED |
| Kyle MacLean | T90 | 0.69 | 1 | 0 | **MISS** | NO | 0.69 | PLAYED |
| Kyle MacLean ★ | T30 | 0.69 | 1 | 0 | **MISS** | NO | 0.69 | PLAYED |
| Kyle Palmieri | T90 | 2.07 | 2 | 4 | **MISS** | YES | 1.93 | PLAYED |
| Kyle Palmieri ★ | T30 | 2.07 | 2 | 4 | **MISS** | YES | 1.93 | PLAYED |
| Leon Draisaitl | T90 | 3.12 | 3 | 2 | **MISS** | NO | 1.12 | PLAYED |
| Leon Draisaitl ★ | T30 | 3.12 | 3 | 2 | **MISS** | NO | 1.12 | PLAYED |
| Logan Stanley | T90 | 1.16 | 1 | 0 | **MISS** | NO | 1.16 | PLAYED |
| Logan Stanley ★ | T30 | 1.16 | 1 | 0 | **MISS** | NO | 1.16 | PLAYED |
| Mathieu Joseph | T90 | 1.03 | 1 | 1 | **HIT** | YES | 0.03 | PLAYED |
| Mathieu Joseph ★ | T30 | 1.03 | 1 | 1 | **HIT** | YES | 0.03 | PLAYED |
| Matias Maccelli | T90 | 0.19 | 0 | — | **DNP** | — | — | DNP |
| Matias Maccelli ★ | T30 | 0.19 | 0 | — | **DNP** | — | — | DNP |
| Matthew Kessel | T90 | 0.27 | 0 | 1 | **MISS** | TRIVIAL | 0.73 | PLAYED |
| Matthew Kessel ★ | T30 | 0.27 | 0 | 1 | **MISS** | TRIVIAL | 0.73 | PLAYED |
| Matthew Schaefer | T90 | 3.93 | 4 | 2 | **MISS** | NO | 1.93 | PLAYED |
| Matthew Schaefer ★ | T30 | 3.93 | 4 | 2 | **MISS** | NO | 1.93 | PLAYED |
| Mattias Ekholm | T90 | 0.95 | 1 | 0 | **MISS** | NO | 0.95 | PLAYED |
| Mattias Ekholm ★ | T30 | 0.95 | 1 | 0 | **MISS** | NO | 0.95 | PLAYED |
| Max Jones | T90 | 0.18 | 0 | — | **DNP** | — | — | DNP |
| Max Jones ★ | T30 | 0.18 | 0 | — | **DNP** | — | — | DNP |
| Mitchell Chaffee | T90 | 0.78 | 1 | 1 | **HIT** | YES | 0.22 | PLAYED |
| Mitchell Chaffee ★ | T30 | 0.78 | 1 | 1 | **HIT** | YES | 0.22 | PLAYED |
| Ondrej Palat | T90 | 1.17 | 1 | 0 | **MISS** | NO | 1.17 | PLAYED |
| Ondrej Palat ★ | T30 | 1.17 | 1 | 0 | **MISS** | NO | 1.17 | PLAYED |
| Owen Michaels | T90 | 0.91 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Owen Michaels ★ | T30 | 0.91 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Player 8484509 | T90 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Player 8484509 ★ | T30 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Ryan Nugent-Hopkins | T90 | 2.45 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Ryan Nugent-Hopkins ★ | T30 | 2.45 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Ryan Pulock | T90 | 0.79 | 1 | — | **DNP** | — | — | DNP |
| Ryan Pulock ★ | T30 | 0.79 | 1 | — | **DNP** | — | — | DNP |
| Ryan Shea | T90 | 1.40 | 1 | 1 | **HIT** | YES | 0.40 | PLAYED |
| Ryan Shea ★ | T30 | 1.40 | 1 | 1 | **HIT** | YES | 0.40 | PLAYED |
| Scott Mayfield | T90 | 0.67 | 1 | 2 | **MISS** | YES | 1.33 | PLAYED |
| Scott Mayfield ★ | T30 | 0.67 | 1 | 2 | **MISS** | YES | 1.33 | PLAYED |
| Shakir Mukhamadullin | T90 | 0.83 | 1 | 0 | **MISS** | NO | 0.83 | PLAYED |
| Shakir Mukhamadullin ★ | T30 | 0.83 | 1 | 0 | **MISS** | NO | 0.83 | PLAYED |
| Simon Holmstrom | T90 | 2.27 | 2 | 3 | **MISS** | YES | 0.73 | PLAYED |
| Simon Holmstrom ★ | T30 | 2.27 | 2 | 3 | **MISS** | YES | 0.73 | PLAYED |
| Tony DeAngelo | T90 | 1.11 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Tony DeAngelo ★ | T30 | 1.11 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Trent Frederic | T90 | 0.80 | 1 | 1 | **HIT** | YES | 0.20 | PLAYED |
| Trent Frederic ★ | T30 | 0.80 | 1 | 1 | **HIT** | YES | 0.20 | PLAYED |
| Ty Emberson | T90 | 0.71 | 1 | 0 | **MISS** | NO | 0.71 | PLAYED |
| Ty Emberson ★ | T30 | 0.71 | 1 | 0 | **MISS** | NO | 0.71 | PLAYED |
| Vasily Podkolzin | T90 | 1.80 | 2 | 2 | **HIT** | YES | 0.20 | PLAYED |
| Vasily Podkolzin ★ | T30 | 1.80 | 2 | 2 | **HIT** | YES | 0.20 | PLAYED |
| Victor Eklund | T90 | 1.34 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Victor Eklund ★ | T30 | 1.34 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Zach Hyman | T90 | 0.57 | 1 | — | **DNP** | — | — | DNP |
| Zach Hyman ★ | T30 | 0.57 | 1 | — | **DNP** | — | — | DNP |

## 2026-10-31 — BUF vs LAK

Original snapshots: 132 (T24H=44, T90=44, T30=44); unique players=44. Verified played snapshot rows=105; DNP rows=27; unverified=0. **Exact rounded match among played snapshots: 21/105**. **Latest-snapshot exact matches: 7/35**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adrian Kempe | T24H | 3.21 | 3 | — | **DNP** | — | — | DNP |
| Adrian Kempe | T90 | 3.19 | 3 | — | **DNP** | — | — | DNP |
| Adrian Kempe ★ | T30 | 3.19 | 3 | — | **DNP** | — | — | DNP |
| Alex Laferriere | T24H | 2.87 | 3 | 3 | **HIT** | YES | 0.13 | PLAYED |
| Alex Laferriere | T90 | 2.86 | 3 | 3 | **HIT** | YES | 0.14 | PLAYED |
| Alex Laferriere ★ | T30 | 2.86 | 3 | 3 | **HIT** | YES | 0.14 | PLAYED |
| Alex Turcotte | T24H | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Alex Turcotte | T90 | 0.05 | 0 | — | **DNP** | — | — | DNP |
| Alex Turcotte ★ | T30 | 0.05 | 0 | — | **DNP** | — | — | DNP |
| Andre Lee | T24H | 0.93 | 1 | 2 | **MISS** | YES | 1.07 | PLAYED |
| Andre Lee | T90 | 0.93 | 1 | 2 | **MISS** | YES | 1.07 | PLAYED |
| Andre Lee ★ | T30 | 0.93 | 1 | 2 | **MISS** | YES | 1.07 | PLAYED |
| Artemi Panarin | T24H | 3.49 | 3 | 3 | **HIT** | YES | 0.49 | PLAYED |
| Artemi Panarin | T90 | 3.48 | 3 | 3 | **HIT** | YES | 0.48 | PLAYED |
| Artemi Panarin ★ | T30 | 3.48 | 3 | 3 | **HIT** | YES | 0.48 | PLAYED |
| Beck Malenstyn | T24H | 0.97 | 1 | 0 | **MISS** | NO | 0.97 | PLAYED |
| Beck Malenstyn | T90 | 0.98 | 1 | 0 | **MISS** | NO | 0.98 | PLAYED |
| Beck Malenstyn ★ | T30 | 0.98 | 1 | 0 | **MISS** | NO | 0.98 | PLAYED |
| Brandt Clarke | T24H | 1.35 | 1 | 1 | **HIT** | YES | 0.35 | PLAYED |
| Brandt Clarke | T90 | 1.35 | 1 | 1 | **HIT** | YES | 0.35 | PLAYED |
| Brandt Clarke ★ | T30 | 1.35 | 1 | 1 | **HIT** | YES | 0.35 | PLAYED |
| Brian Dumoulin | T24H | 0.97 | 1 | 0 | **MISS** | NO | 0.97 | PLAYED |
| Brian Dumoulin | T90 | 0.97 | 1 | 0 | **MISS** | NO | 0.97 | PLAYED |
| Brian Dumoulin ★ | T30 | 0.97 | 1 | 0 | **MISS** | NO | 0.97 | PLAYED |
| Cody Ceci | T24H | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Cody Ceci | T90 | 0.26 | 0 | — | **DNP** | — | — | DNP |
| Cody Ceci ★ | T30 | 0.26 | 0 | — | **DNP** | — | — | DNP |
| Corey Perry | T24H | 1.14 | 1 | 9 | **MISS** | YES | 7.86 | PLAYED |
| Corey Perry | T90 | 1.15 | 1 | 9 | **MISS** | YES | 7.85 | PLAYED |
| Corey Perry ★ | T30 | 1.15 | 1 | 9 | **MISS** | YES | 7.85 | PLAYED |
| Dennis Gilbert | T24H | 0.49 | 0 | — | **DNP** | — | — | DNP |
| Dennis Gilbert | T90 | 0.50 | 0 | — | **DNP** | — | — | DNP |
| Dennis Gilbert ★ | T30 | 0.50 | 0 | — | **DNP** | — | — | DNP |
| Drew Doughty | T24H | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Drew Doughty | T90 | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Drew Doughty ★ | T30 | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Erik Gustafsson | T24H | 1.34 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Erik Gustafsson | T90 | 1.35 | 1 | 1 | **HIT** | YES | 0.35 | PLAYED |
| Erik Gustafsson ★ | T30 | 1.35 | 1 | 1 | **HIT** | YES | 0.35 | PLAYED |
| Erik Haula | T24H | 1.59 | 2 | 2 | **HIT** | YES | 0.41 | PLAYED |
| Erik Haula | T90 | 1.59 | 2 | 2 | **HIT** | YES | 0.41 | PLAYED |
| Erik Haula ★ | T30 | 1.59 | 2 | 2 | **HIT** | YES | 0.41 | PLAYED |
| Jack Quinn | T24H | 2.57 | 3 | 2 | **MISS** | NO | 0.57 | PLAYED |
| Jack Quinn | T90 | 2.57 | 3 | 2 | **MISS** | NO | 0.57 | PLAYED |
| Jack Quinn ★ | T30 | 2.57 | 3 | 2 | **MISS** | NO | 0.57 | PLAYED |
| Jason Zucker | T24H | 1.55 | 2 | 1 | **MISS** | NO | 0.55 | PLAYED |
| Jason Zucker | T90 | 1.56 | 2 | 1 | **MISS** | NO | 0.56 | PLAYED |
| Jason Zucker ★ | T30 | 1.56 | 2 | 1 | **MISS** | NO | 0.56 | PLAYED |
| Jiri Kulich | T24H | 0.25 | 0 | — | **DNP** | — | — | DNP |
| Jiri Kulich | T90 | 0.23 | 0 | — | **DNP** | — | — | DNP |
| Jiri Kulich ★ | T30 | 0.23 | 0 | — | **DNP** | — | — | DNP |
| Joel Armia | T24H | 1.31 | 1 | 2 | **MISS** | YES | 0.69 | PLAYED |
| Joel Armia | T90 | 1.32 | 1 | 2 | **MISS** | YES | 0.68 | PLAYED |
| Joel Armia ★ | T30 | 1.32 | 1 | 2 | **MISS** | YES | 0.68 | PLAYED |
| Joel Edmundson | T24H | 1.09 | 1 | 0 | **MISS** | NO | 1.09 | PLAYED |
| Joel Edmundson | T90 | 1.10 | 1 | 0 | **MISS** | NO | 1.10 | PLAYED |
| Joel Edmundson ★ | T30 | 1.10 | 1 | 0 | **MISS** | NO | 1.10 | PLAYED |
| Josh Doan | T24H | 1.41 | 1 | 3 | **MISS** | YES | 1.59 | PLAYED |
| Josh Doan | T90 | 1.40 | 1 | 3 | **MISS** | YES | 1.60 | PLAYED |
| Josh Doan ★ | T30 | 1.40 | 1 | 3 | **MISS** | YES | 1.60 | PLAYED |
| Josh Norris | T24H | 1.42 | 1 | 0 | **MISS** | NO | 1.42 | PLAYED |
| Josh Norris | T90 | 1.42 | 1 | 0 | **MISS** | NO | 1.42 | PLAYED |
| Josh Norris ★ | T30 | 1.42 | 1 | 0 | **MISS** | NO | 1.42 | PLAYED |
| Justin Danforth | T24H | 0.11 | 0 | — | **DNP** | — | — | DNP |
| Justin Danforth | T90 | 0.10 | 0 | — | **DNP** | — | — | DNP |
| Justin Danforth ★ | T30 | 0.10 | 0 | — | **DNP** | — | — | DNP |
| Konsta Helenius | T24H | 0.36 | 0 | — | **DNP** | — | — | DNP |
| Konsta Helenius | T90 | 0.34 | 0 | — | **DNP** | — | — | DNP |
| Konsta Helenius ★ | T30 | 0.34 | 0 | — | **DNP** | — | — | DNP |
| Louis Crevier | T24H | 0.67 | 1 | 0 | **MISS** | NO | 0.67 | PLAYED |
| Louis Crevier | T90 | 0.67 | 1 | 0 | **MISS** | NO | 0.67 | PLAYED |
| Louis Crevier ★ | T30 | 0.67 | 1 | 0 | **MISS** | NO | 0.67 | PLAYED |
| Mats Zuccarello | T24H | 0.30 | 0 | — | **DNP** | — | — | DNP |
| Mats Zuccarello | T90 | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Mats Zuccarello ★ | T30 | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Mattias Samuelsson | T24H | 1.54 | 2 | 1 | **MISS** | NO | 0.54 | PLAYED |
| Mattias Samuelsson | T90 | 1.54 | 2 | 1 | **MISS** | NO | 0.54 | PLAYED |
| Mattias Samuelsson ★ | T30 | 1.54 | 2 | 1 | **MISS** | NO | 0.54 | PLAYED |
| Mikey Anderson | T24H | 0.90 | 1 | 1 | **HIT** | YES | 0.10 | PLAYED |
| Mikey Anderson | T90 | 0.90 | 1 | 1 | **HIT** | YES | 0.10 | PLAYED |
| Mikey Anderson ★ | T30 | 0.90 | 1 | 1 | **HIT** | YES | 0.10 | PLAYED |
| Noah Ostlund | T24H | 2.33 | 2 | 3 | **MISS** | YES | 0.67 | PLAYED |
| Noah Ostlund | T90 | 2.33 | 2 | 3 | **MISS** | YES | 0.67 | PLAYED |
| Noah Ostlund ★ | T30 | 2.33 | 2 | 3 | **MISS** | YES | 0.67 | PLAYED |
| Olen Zellweger | T24H | 1.57 | 2 | 1 | **MISS** | NO | 0.57 | PLAYED |
| Olen Zellweger | T90 | 1.57 | 2 | 1 | **MISS** | NO | 0.57 | PLAYED |
| Olen Zellweger ★ | T30 | 1.57 | 2 | 1 | **MISS** | NO | 0.57 | PLAYED |
| Owen Power | T24H | 1.87 | 2 | 0 | **MISS** | NO | 1.87 | PLAYED |
| Owen Power | T90 | 1.86 | 2 | 0 | **MISS** | NO | 1.86 | PLAYED |
| Owen Power ★ | T30 | 1.86 | 2 | 0 | **MISS** | NO | 1.86 | PLAYED |
| Peyton Krebs | T24H | 0.93 | 1 | 0 | **MISS** | NO | 0.93 | PLAYED |
| Peyton Krebs | T90 | 0.93 | 1 | 0 | **MISS** | NO | 0.93 | PLAYED |
| Peyton Krebs ★ | T30 | 0.93 | 1 | 0 | **MISS** | NO | 0.93 | PLAYED |
| Player 8483756 | T24H | 0.35 | 0 | — | **DNP** | — | — | DNP |
| Player 8483756 | T90 | 0.34 | 0 | — | **DNP** | — | — | DNP |
| Player 8483756 ★ | T30 | 0.34 | 0 | — | **DNP** | — | — | DNP |
| Quinton Byfield | T24H | 2.73 | 3 | 0 | **MISS** | NO | 2.73 | PLAYED |
| Quinton Byfield | T90 | 2.73 | 3 | 0 | **MISS** | NO | 2.73 | PLAYED |
| Quinton Byfield ★ | T30 | 2.73 | 3 | 0 | **MISS** | NO | 2.73 | PLAYED |
| Rasmus Dahlin | T24H | 2.73 | 3 | 2 | **MISS** | NO | 0.73 | PLAYED |
| Rasmus Dahlin | T90 | 2.74 | 3 | 2 | **MISS** | NO | 0.74 | PLAYED |
| Rasmus Dahlin ★ | T30 | 2.74 | 3 | 2 | **MISS** | NO | 0.74 | PLAYED |
| Ryan McLeod | T24H | 1.29 | 1 | 0 | **MISS** | NO | 1.29 | PLAYED |
| Ryan McLeod | T90 | 1.29 | 1 | 0 | **MISS** | NO | 1.29 | PLAYED |
| Ryan McLeod ★ | T30 | 1.29 | 1 | 0 | **MISS** | NO | 1.29 | PLAYED |
| Sam Carrick | T24H | 0.65 | 1 | 4 | **MISS** | YES | 3.35 | PLAYED |
| Sam Carrick | T90 | 0.66 | 1 | 4 | **MISS** | YES | 3.34 | PLAYED |
| Sam Carrick ★ | T30 | 0.66 | 1 | 4 | **MISS** | YES | 3.34 | PLAYED |
| Samuel Helenius | T24H | 0.85 | 1 | 0 | **MISS** | NO | 0.85 | PLAYED |
| Samuel Helenius | T90 | 0.85 | 1 | 0 | **MISS** | NO | 0.85 | PLAYED |
| Samuel Helenius ★ | T30 | 0.85 | 1 | 0 | **MISS** | NO | 0.85 | PLAYED |
| Scott Laughton | T24H | 1.40 | 1 | 0 | **MISS** | NO | 1.40 | PLAYED |
| Scott Laughton | T90 | 1.40 | 1 | 0 | **MISS** | NO | 1.40 | PLAYED |
| Scott Laughton ★ | T30 | 1.40 | 1 | 0 | **MISS** | NO | 1.40 | PLAYED |
| Tage Thompson | T24H | 3.07 | 3 | 8 | **MISS** | YES | 4.93 | PLAYED |
| Tage Thompson | T90 | 3.05 | 3 | 8 | **MISS** | YES | 4.95 | PLAYED |
| Tage Thompson ★ | T30 | 3.05 | 3 | 8 | **MISS** | YES | 4.95 | PLAYED |
| Taylor Ward | T24H | 1.01 | 1 | 0 | **MISS** | NO | 1.01 | PLAYED |
| Taylor Ward | T90 | 1.02 | 1 | 0 | **MISS** | NO | 1.02 | PLAYED |
| Taylor Ward ★ | T30 | 1.02 | 1 | 0 | **MISS** | NO | 1.02 | PLAYED |
| Trevor Moore | T24H | 1.79 | 2 | 3 | **MISS** | YES | 1.21 | PLAYED |
| Trevor Moore | T90 | 1.79 | 2 | 3 | **MISS** | YES | 1.21 | PLAYED |
| Trevor Moore ★ | T30 | 1.79 | 2 | 3 | **MISS** | YES | 1.21 | PLAYED |
| Tyson Kozak | T24H | 0.83 | 1 | 0 | **MISS** | NO | 0.83 | PLAYED |
| Tyson Kozak | T90 | 0.84 | 1 | 0 | **MISS** | NO | 0.84 | PLAYED |
| Tyson Kozak ★ | T30 | 0.84 | 1 | 0 | **MISS** | NO | 0.84 | PLAYED |
| Zach Benson | T24H | 2.51 | 3 | 4 | **MISS** | YES | 1.49 | PLAYED |
| Zach Benson | T90 | 2.50 | 2 | 4 | **MISS** | YES | 1.50 | PLAYED |
| Zach Benson ★ | T30 | 2.50 | 2 | 4 | **MISS** | YES | 1.50 | PLAYED |
| Zach Metsa | T24H | 0.21 | 0 | 2 | **MISS** | TRIVIAL | 1.79 | PLAYED |
| Zach Metsa | T90 | 0.20 | 0 | 2 | **MISS** | TRIVIAL | 1.80 | PLAYED |
| Zach Metsa ★ | T30 | 0.20 | 0 | 2 | **MISS** | TRIVIAL | 1.80 | PLAYED |

## 2026-10-31 — OTT vs SJS

Original snapshots: 126 (T24H=42, T90=42, T30=42); unique players=42. Verified played snapshot rows=99; DNP rows=27; unverified=0. **Exact rounded match among played snapshots: 27/99**. **Latest-snapshot exact matches: 9/33**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Gaudette | T24H | 1.04 | 1 | — | **DNP** | — | — | DNP |
| Adam Gaudette | T90 | 1.05 | 1 | — | **DNP** | — | — | DNP |
| Adam Gaudette ★ | T30 | 1.05 | 1 | — | **DNP** | — | — | DNP |
| Alexander Wennberg | T24H | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Alexander Wennberg | T90 | 0.26 | 0 | — | **DNP** | — | — | DNP |
| Alexander Wennberg ★ | T30 | 0.26 | 0 | — | **DNP** | — | — | DNP |
| Andre Burakovsky | T24H | 0.83 | 1 | — | **DNP** | — | — | DNP |
| Andre Burakovsky | T90 | 0.83 | 1 | — | **DNP** | — | — | DNP |
| Andre Burakovsky ★ | T30 | 0.83 | 1 | — | **DNP** | — | — | DNP |
| Artem Zub | T24H | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Artem Zub | T90 | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Artem Zub ★ | T30 | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Barclay Goodrow | T24H | 1.02 | 1 | 0 | **MISS** | NO | 1.02 | PLAYED |
| Barclay Goodrow | T90 | 1.03 | 1 | 0 | **MISS** | NO | 1.03 | PLAYED |
| Barclay Goodrow ★ | T30 | 1.03 | 1 | 0 | **MISS** | NO | 1.03 | PLAYED |
| Carter Yakemchuk | T24H | 0.47 | 0 | — | **DNP** | — | — | DNP |
| Carter Yakemchuk | T90 | 0.45 | 0 | — | **DNP** | — | — | DNP |
| Carter Yakemchuk ★ | T30 | 0.45 | 0 | — | **DNP** | — | — | DNP |
| Claude Giroux | T24H | 1.69 | 2 | 0 | **MISS** | NO | 1.69 | PLAYED |
| Claude Giroux | T90 | 1.69 | 2 | 0 | **MISS** | NO | 1.69 | PLAYED |
| Claude Giroux ★ | T30 | 1.69 | 2 | 0 | **MISS** | NO | 1.69 | PLAYED |
| Collin Graf | T24H | 1.39 | 1 | 0 | **MISS** | NO | 1.39 | PLAYED |
| Collin Graf | T90 | 1.40 | 1 | 0 | **MISS** | NO | 1.40 | PLAYED |
| Collin Graf ★ | T30 | 1.40 | 1 | 0 | **MISS** | NO | 1.40 | PLAYED |
| Darnell Nurse | T24H | 1.50 | 2 | 0 | **MISS** | NO | 1.50 | PLAYED |
| Darnell Nurse | T90 | 1.51 | 2 | 0 | **MISS** | NO | 1.51 | PLAYED |
| Darnell Nurse ★ | T30 | 1.51 | 2 | 0 | **MISS** | NO | 1.51 | PLAYED |
| Dmitry Orlov | T24H | 1.34 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Dmitry Orlov | T90 | 1.34 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Dmitry Orlov ★ | T30 | 1.34 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Drake Batherson | T24H | 2.39 | 2 | 4 | **MISS** | YES | 1.61 | PLAYED |
| Drake Batherson | T90 | 2.38 | 2 | 4 | **MISS** | YES | 1.62 | PLAYED |
| Drake Batherson ★ | T30 | 2.38 | 2 | 4 | **MISS** | YES | 1.62 | PLAYED |
| Dylan Cozens | T24H | 2.19 | 2 | 5 | **MISS** | YES | 2.81 | PLAYED |
| Dylan Cozens | T90 | 2.18 | 2 | 5 | **MISS** | YES | 2.82 | PLAYED |
| Dylan Cozens ★ | T30 | 2.18 | 2 | 5 | **MISS** | YES | 2.82 | PLAYED |
| Fabian Zetterlund | T24H | 1.89 | 2 | 4 | **MISS** | YES | 2.11 | PLAYED |
| Fabian Zetterlund | T90 | 1.89 | 2 | 4 | **MISS** | YES | 2.11 | PLAYED |
| Fabian Zetterlund ★ | T30 | 1.89 | 2 | 4 | **MISS** | YES | 2.11 | PLAYED |
| Hayden Hodgson | T24H | 0.60 | 1 | — | **DNP** | — | — | DNP |
| Hayden Hodgson | T90 | 0.61 | 1 | — | **DNP** | — | — | DNP |
| Hayden Hodgson ★ | T30 | 0.61 | 1 | — | **DNP** | — | — | DNP |
| Igor Chernyshov | T24H | 0.25 | 0 | — | **DNP** | — | — | DNP |
| Igor Chernyshov | T90 | 0.23 | 0 | — | **DNP** | — | — | DNP |
| Igor Chernyshov ★ | T30 | 0.23 | 0 | — | **DNP** | — | — | DNP |
| Ivar Stenberg | T24H | 1.89 | 2 | 1 | **MISS** | NO | 0.89 | PLAYED |
| Ivar Stenberg | T90 | 1.89 | 2 | 1 | **MISS** | NO | 0.89 | PLAYED |
| Ivar Stenberg ★ | T30 | 1.89 | 2 | 1 | **MISS** | NO | 0.89 | PLAYED |
| Jacob Trouba | T24H | 1.43 | 1 | 4 | **MISS** | YES | 2.57 | PLAYED |
| Jacob Trouba | T90 | 1.43 | 1 | 4 | **MISS** | YES | 2.57 | PLAYED |
| Jacob Trouba ★ | T30 | 1.43 | 1 | 4 | **MISS** | YES | 2.57 | PLAYED |
| Jake Sanderson | T24H | 2.49 | 2 | 0 | **MISS** | NO | 2.49 | PLAYED |
| Jake Sanderson | T90 | 2.51 | 3 | 0 | **MISS** | NO | 2.51 | PLAYED |
| Jake Sanderson ★ | T30 | 2.51 | 3 | 0 | **MISS** | NO | 2.51 | PLAYED |
| Jordan Spence | T24H | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Jordan Spence | T90 | 1.21 | 1 | 0 | **MISS** | NO | 1.21 | PLAYED |
| Jordan Spence ★ | T30 | 1.21 | 1 | 0 | **MISS** | NO | 1.21 | PLAYED |
| Kiefer Sherwood | T24H | 1.81 | 2 | 0 | **MISS** | NO | 1.81 | PLAYED |
| Kiefer Sherwood | T90 | 1.81 | 2 | 0 | **MISS** | NO | 1.81 | PLAYED |
| Kiefer Sherwood ★ | T30 | 1.81 | 2 | 0 | **MISS** | NO | 1.81 | PLAYED |
| Macklin Celebrini | T24H | 3.73 | 4 | 2 | **MISS** | NO | 1.73 | PLAYED |
| Macklin Celebrini | T90 | 3.72 | 4 | 2 | **MISS** | NO | 1.72 | PLAYED |
| Macklin Celebrini ★ | T30 | 3.72 | 4 | 2 | **MISS** | NO | 1.72 | PLAYED |
| Mason Marchment | T24H | 1.76 | 2 | 2 | **HIT** | YES | 0.24 | PLAYED |
| Mason Marchment | T90 | 1.77 | 2 | 2 | **HIT** | YES | 0.23 | PLAYED |
| Mason Marchment ★ | T30 | 1.77 | 2 | 2 | **HIT** | YES | 0.23 | PLAYED |
| Michael Amadio | T24H | 1.29 | 1 | 3 | **MISS** | YES | 1.71 | PLAYED |
| Michael Amadio | T90 | 1.29 | 1 | 3 | **MISS** | YES | 1.71 | PLAYED |
| Michael Amadio ★ | T30 | 1.29 | 1 | 3 | **MISS** | YES | 1.71 | PLAYED |
| Michael Kesselring | T24H | 1.01 | 1 | 4 | **MISS** | YES | 2.99 | PLAYED |
| Michael Kesselring | T90 | 1.01 | 1 | 4 | **MISS** | YES | 2.99 | PLAYED |
| Michael Kesselring ★ | T30 | 1.01 | 1 | 4 | **MISS** | YES | 2.99 | PLAYED |
| Michael Misa | T24H | 1.23 | 1 | 2 | **MISS** | YES | 0.77 | PLAYED |
| Michael Misa | T90 | 1.23 | 1 | 2 | **MISS** | YES | 0.77 | PLAYED |
| Michael Misa ★ | T30 | 1.23 | 1 | 2 | **MISS** | YES | 0.77 | PLAYED |
| Nick Cousins | T24H | 0.85 | 1 | 0 | **MISS** | NO | 0.85 | PLAYED |
| Nick Cousins | T90 | 0.86 | 1 | 0 | **MISS** | NO | 0.86 | PLAYED |
| Nick Cousins ★ | T30 | 0.86 | 1 | 0 | **MISS** | NO | 0.86 | PLAYED |
| Nikolas Matinpalo | T24H | 0.80 | 1 | 0 | **MISS** | NO | 0.80 | PLAYED |
| Nikolas Matinpalo | T90 | 0.81 | 1 | 0 | **MISS** | NO | 0.81 | PLAYED |
| Nikolas Matinpalo ★ | T30 | 0.81 | 1 | 0 | **MISS** | NO | 0.81 | PLAYED |
| Nolan Allan | T24H | 0.82 | 1 | 1 | **HIT** | YES | 0.18 | PLAYED |
| Nolan Allan | T90 | 0.82 | 1 | 1 | **HIT** | YES | 0.18 | PLAYED |
| Nolan Allan ★ | T30 | 0.82 | 1 | 1 | **HIT** | YES | 0.18 | PLAYED |
| Player 8480075 | T24H | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Player 8480075 | T90 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Player 8480075 ★ | T30 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Player 8484152 | T24H | 0.39 | 0 | — | **DNP** | — | — | DNP |
| Player 8484152 | T90 | 0.37 | 0 | — | **DNP** | — | — | DNP |
| Player 8484152 ★ | T30 | 0.37 | 0 | — | **DNP** | — | — | DNP |
| Ridly Greig | T24H | 1.56 | 2 | 3 | **MISS** | YES | 1.44 | PLAYED |
| Ridly Greig | T90 | 1.56 | 2 | 3 | **MISS** | YES | 1.44 | PLAYED |
| Ridly Greig ★ | T30 | 1.56 | 2 | 3 | **MISS** | YES | 1.44 | PLAYED |
| Sam Dickinson | T24H | 0.97 | 1 | 1 | **HIT** | YES | 0.03 | PLAYED |
| Sam Dickinson | T90 | 0.97 | 1 | 1 | **HIT** | YES | 0.03 | PLAYED |
| Sam Dickinson ★ | T30 | 0.97 | 1 | 1 | **HIT** | YES | 0.03 | PLAYED |
| Shane Pinto | T24H | 2.35 | 2 | 1 | **MISS** | NO | 1.35 | PLAYED |
| Shane Pinto | T90 | 2.35 | 2 | 1 | **MISS** | NO | 1.35 | PLAYED |
| Shane Pinto ★ | T30 | 2.35 | 2 | 1 | **MISS** | NO | 1.35 | PLAYED |
| Stephen Halliday | T24H | 1.47 | 1 | 3 | **MISS** | YES | 1.53 | PLAYED |
| Stephen Halliday | T90 | 1.47 | 1 | 3 | **MISS** | YES | 1.53 | PLAYED |
| Stephen Halliday ★ | T30 | 1.47 | 1 | 3 | **MISS** | YES | 1.53 | PLAYED |
| Thomas Chabot | T24H | 1.58 | 2 | 2 | **HIT** | YES | 0.42 | PLAYED |
| Thomas Chabot | T90 | 1.57 | 2 | 2 | **HIT** | YES | 0.43 | PLAYED |
| Thomas Chabot ★ | T30 | 1.57 | 2 | 2 | **HIT** | YES | 0.43 | PLAYED |
| Tim Stützle | T24H | 2.84 | 3 | 7 | **MISS** | YES | 4.16 | PLAYED |
| Tim Stützle | T90 | 2.82 | 3 | 7 | **MISS** | YES | 4.18 | PLAYED |
| Tim Stützle ★ | T30 | 2.82 | 3 | 7 | **MISS** | YES | 4.18 | PLAYED |
| Ty Dellandrea | T24H | 0.99 | 1 | 0 | **MISS** | NO | 0.99 | PLAYED |
| Ty Dellandrea | T90 | 0.99 | 1 | 0 | **MISS** | NO | 0.99 | PLAYED |
| Ty Dellandrea ★ | T30 | 0.99 | 1 | 0 | **MISS** | NO | 0.99 | PLAYED |
| Tyler Kleven | T24H | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Tyler Kleven | T90 | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Tyler Kleven ★ | T30 | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Tyler Toffoli | T24H | 1.42 | 1 | 1 | **HIT** | YES | 0.42 | PLAYED |
| Tyler Toffoli | T90 | 1.42 | 1 | 1 | **HIT** | YES | 0.42 | PLAYED |
| Tyler Toffoli ★ | T30 | 1.42 | 1 | 1 | **HIT** | YES | 0.42 | PLAYED |
| Warren Foegele | T24H | 0.45 | 0 | — | **DNP** | — | — | DNP |
| Warren Foegele | T90 | 0.42 | 0 | — | **DNP** | — | — | DNP |
| Warren Foegele ★ | T30 | 0.42 | 0 | — | **DNP** | — | — | DNP |
| Will Smith | T24H | 2.69 | 3 | 3 | **HIT** | YES | 0.31 | PLAYED |
| Will Smith | T90 | 2.69 | 3 | 3 | **HIT** | YES | 0.31 | PLAYED |
| Will Smith ★ | T30 | 2.69 | 3 | 3 | **HIT** | YES | 0.31 | PLAYED |
| Zack Ostapchuk | T24H | 0.32 | 0 | 0 | **HIT** | TRIVIAL | 0.32 | PLAYED |
| Zack Ostapchuk | T90 | 0.31 | 0 | 0 | **HIT** | TRIVIAL | 0.31 | PLAYED |
| Zack Ostapchuk ★ | T30 | 0.31 | 0 | 0 | **HIT** | TRIVIAL | 0.31 | PLAYED |

## 2026-10-31 — MTL vs PIT

Original snapshots: 135 (T24H=45, T90=45, T30=45); unique players=45. Verified played snapshot rows=108; DNP rows=27; unverified=0. **Exact rounded match among played snapshots: 27/108**. **Latest-snapshot exact matches: 9/36**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Engstrom | T24H | 0.66 | 1 | 2 | **MISS** | YES | 1.34 | PLAYED |
| Adam Engstrom | T90 | 0.67 | 1 | 2 | **MISS** | YES | 1.33 | PLAYED |
| Adam Engstrom ★ | T30 | 0.67 | 1 | 2 | **MISS** | YES | 1.33 | PLAYED |
| Alex Newhook | T24H | 1.43 | 1 | 0 | **MISS** | NO | 1.43 | PLAYED |
| Alex Newhook | T90 | 1.43 | 1 | 0 | **MISS** | NO | 1.43 | PLAYED |
| Alex Newhook ★ | T30 | 1.43 | 1 | 0 | **MISS** | NO | 1.43 | PLAYED |
| Alexandre Carrier | T24H | 1.14 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Alexandre Carrier | T90 | 1.14 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Alexandre Carrier ★ | T30 | 1.14 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Alexandre Texier | T24H | 1.31 | 1 | 3 | **MISS** | YES | 1.69 | PLAYED |
| Alexandre Texier | T90 | 1.31 | 1 | 3 | **MISS** | YES | 1.69 | PLAYED |
| Alexandre Texier ★ | T30 | 1.31 | 1 | 3 | **MISS** | YES | 1.69 | PLAYED |
| Andrei Kuzmenko | T24H | 1.11 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Andrei Kuzmenko | T90 | 1.12 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Andrei Kuzmenko ★ | T30 | 1.12 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Arber Xhekaj | T24H | 0.62 | 1 | 0 | **MISS** | NO | 0.62 | PLAYED |
| Arber Xhekaj | T90 | 0.63 | 1 | 0 | **MISS** | NO | 0.63 | PLAYED |
| Arber Xhekaj ★ | T30 | 0.63 | 1 | 0 | **MISS** | NO | 0.63 | PLAYED |
| Ben Kindel | T24H | 1.81 | 2 | 3 | **MISS** | YES | 1.19 | PLAYED |
| Ben Kindel | T90 | 1.81 | 2 | 3 | **MISS** | YES | 1.19 | PLAYED |
| Ben Kindel ★ | T30 | 1.81 | 2 | 3 | **MISS** | YES | 1.19 | PLAYED |
| Blake Lizotte | T24H | 1.08 | 1 | 0 | **MISS** | NO | 1.08 | PLAYED |
| Blake Lizotte | T90 | 1.08 | 1 | 0 | **MISS** | NO | 1.08 | PLAYED |
| Blake Lizotte ★ | T30 | 1.08 | 1 | 0 | **MISS** | NO | 1.08 | PLAYED |
| Bryan Rust | T24H | 0.34 | 0 | — | **DNP** | — | — | DNP |
| Bryan Rust | T90 | 0.32 | 0 | — | **DNP** | — | — | DNP |
| Bryan Rust ★ | T30 | 0.32 | 0 | — | **DNP** | — | — | DNP |
| Chris Kreider | T24H | 1.15 | 1 | 5 | **MISS** | YES | 3.85 | PLAYED |
| Chris Kreider | T90 | 1.15 | 1 | 5 | **MISS** | YES | 3.85 | PLAYED |
| Chris Kreider ★ | T30 | 1.15 | 1 | 5 | **MISS** | YES | 3.85 | PLAYED |
| Cole Caufield | T24H | 2.75 | 3 | 2 | **MISS** | NO | 0.75 | PLAYED |
| Cole Caufield | T90 | 2.74 | 3 | 2 | **MISS** | NO | 0.74 | PLAYED |
| Cole Caufield ★ | T30 | 2.74 | 3 | 2 | **MISS** | NO | 0.74 | PLAYED |
| Connor Dewar | T24H | 1.41 | 1 | 0 | **MISS** | NO | 1.41 | PLAYED |
| Connor Dewar | T90 | 1.41 | 1 | 0 | **MISS** | NO | 1.41 | PLAYED |
| Connor Dewar ★ | T30 | 1.41 | 1 | 0 | **MISS** | NO | 1.41 | PLAYED |
| Declan Carlile | T24H | 1.13 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Declan Carlile | T90 | 1.14 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Declan Carlile ★ | T30 | 1.14 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Egor Chinakhov | T24H | 1.40 | 1 | 2 | **MISS** | YES | 0.60 | PLAYED |
| Egor Chinakhov | T90 | 1.40 | 1 | 2 | **MISS** | YES | 0.60 | PLAYED |
| Egor Chinakhov ★ | T30 | 1.40 | 1 | 2 | **MISS** | YES | 0.60 | PLAYED |
| Elmer Soderblom | T24H | 0.33 | 0 | — | **DNP** | — | — | DNP |
| Elmer Soderblom | T90 | 0.31 | 0 | — | **DNP** | — | — | DNP |
| Elmer Soderblom ★ | T30 | 0.31 | 0 | — | **DNP** | — | — | DNP |
| Erik Karlsson | T24H | 1.95 | 2 | 4 | **MISS** | YES | 2.05 | PLAYED |
| Erik Karlsson | T90 | 1.95 | 2 | 4 | **MISS** | YES | 2.05 | PLAYED |
| Erik Karlsson ★ | T30 | 1.95 | 2 | 4 | **MISS** | YES | 2.05 | PLAYED |
| Evgeni Malkin | T24H | 1.80 | 2 | 1 | **MISS** | NO | 0.80 | PLAYED |
| Evgeni Malkin | T90 | 1.80 | 2 | 1 | **MISS** | NO | 0.80 | PLAYED |
| Evgeni Malkin ★ | T30 | 1.80 | 2 | 1 | **MISS** | NO | 0.80 | PLAYED |
| Florian Xhekaj | T24H | 0.84 | 1 | 0 | **MISS** | NO | 0.84 | PLAYED |
| Florian Xhekaj | T90 | 0.85 | 1 | 0 | **MISS** | NO | 0.85 | PLAYED |
| Florian Xhekaj ★ | T30 | 0.85 | 1 | 0 | **MISS** | NO | 0.85 | PLAYED |
| Hendrix Lapierre | T24H | 1.15 | 1 | 0 | **MISS** | NO | 1.15 | PLAYED |
| Hendrix Lapierre | T90 | 1.16 | 1 | 0 | **MISS** | NO | 1.16 | PLAYED |
| Hendrix Lapierre ★ | T30 | 1.16 | 1 | 0 | **MISS** | NO | 1.16 | PLAYED |
| Ilya Solovyov | T24H | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Ilya Solovyov | T90 | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Ilya Solovyov ★ | T30 | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Jake Evans | T24H | 1.16 | 1 | 1 | **HIT** | YES | 0.16 | PLAYED |
| Jake Evans | T90 | 1.17 | 1 | 1 | **HIT** | YES | 0.17 | PLAYED |
| Jake Evans ★ | T30 | 1.17 | 1 | 1 | **HIT** | YES | 0.17 | PLAYED |
| Josh Anderson | T24H | 1.57 | 2 | 2 | **HIT** | YES | 0.43 | PLAYED |
| Josh Anderson | T90 | 1.57 | 2 | 2 | **HIT** | YES | 0.43 | PLAYED |
| Josh Anderson ★ | T30 | 1.57 | 2 | 2 | **HIT** | YES | 0.43 | PLAYED |
| Juraj Slafkovský | T24H | 2.34 | 2 | 2 | **HIT** | YES | 0.34 | PLAYED |
| Juraj Slafkovský | T90 | 2.33 | 2 | 2 | **HIT** | YES | 0.33 | PLAYED |
| Juraj Slafkovský ★ | T30 | 2.33 | 2 | 2 | **HIT** | YES | 0.33 | PLAYED |
| Kaedan Korczak | T24H | 1.01 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Kaedan Korczak | T90 | 1.01 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Kaedan Korczak ★ | T30 | 1.01 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Kaiden Guhle | T24H | 1.40 | 1 | 1 | **HIT** | YES | 0.40 | PLAYED |
| Kaiden Guhle | T90 | 1.41 | 1 | 1 | **HIT** | YES | 0.41 | PLAYED |
| Kaiden Guhle ★ | T30 | 1.41 | 1 | 1 | **HIT** | YES | 0.41 | PLAYED |
| Kirby Dach | T24H | 1.02 | 1 | — | **DNP** | — | — | DNP |
| Kirby Dach | T90 | 1.03 | 1 | — | **DNP** | — | — | DNP |
| Kirby Dach ★ | T30 | 1.03 | 1 | — | **DNP** | — | — | DNP |
| Kris Letang | T24H | 1.39 | 1 | 2 | **MISS** | YES | 0.61 | PLAYED |
| Kris Letang | T90 | 1.39 | 1 | 2 | **MISS** | YES | 0.61 | PLAYED |
| Kris Letang ★ | T30 | 1.39 | 1 | 2 | **MISS** | YES | 0.61 | PLAYED |
| Lane Hutson | T24H | 1.87 | 2 | 1 | **MISS** | NO | 0.87 | PLAYED |
| Lane Hutson | T90 | 1.87 | 2 | 1 | **MISS** | NO | 0.87 | PLAYED |
| Lane Hutson ★ | T30 | 1.87 | 2 | 1 | **MISS** | NO | 0.87 | PLAYED |
| Mike Matheson | T24H | 0.53 | 1 | — | **DNP** | — | — | DNP |
| Mike Matheson | T90 | 0.51 | 1 | — | **DNP** | — | — | DNP |
| Mike Matheson ★ | T30 | 0.51 | 1 | — | **DNP** | — | — | DNP |
| Nick Robertson | T24H | 1.69 | 2 | 0 | **MISS** | NO | 1.69 | PLAYED |
| Nick Robertson | T90 | 1.69 | 2 | 0 | **MISS** | NO | 1.69 | PLAYED |
| Nick Robertson ★ | T30 | 1.69 | 2 | 0 | **MISS** | NO | 1.69 | PLAYED |
| Nick Suzuki | T24H | 0.46 | 0 | — | **DNP** | — | — | DNP |
| Nick Suzuki | T90 | 0.42 | 0 | — | **DNP** | — | — | DNP |
| Nick Suzuki ★ | T30 | 0.42 | 0 | — | **DNP** | — | — | DNP |
| Noah Dobson | T24H | 1.77 | 2 | 1 | **MISS** | NO | 0.77 | PLAYED |
| Noah Dobson | T90 | 1.77 | 2 | 1 | **MISS** | NO | 0.77 | PLAYED |
| Noah Dobson ★ | T30 | 1.77 | 2 | 1 | **MISS** | NO | 0.77 | PLAYED |
| Oliver Kapanen | T24H | 1.23 | 1 | 2 | **MISS** | YES | 0.77 | PLAYED |
| Oliver Kapanen | T90 | 1.24 | 1 | 2 | **MISS** | YES | 0.76 | PLAYED |
| Oliver Kapanen ★ | T30 | 1.24 | 1 | 2 | **MISS** | YES | 0.76 | PLAYED |
| Owen Beck | T24H | 0.16 | 0 | 1 | **MISS** | TRIVIAL | 0.84 | PLAYED |
| Owen Beck | T90 | 0.15 | 0 | 1 | **MISS** | TRIVIAL | 0.85 | PLAYED |
| Owen Beck ★ | T30 | 0.15 | 0 | 1 | **MISS** | TRIVIAL | 0.85 | PLAYED |
| Phillip Danault | T24H | 1.59 | 2 | 1 | **MISS** | NO | 0.59 | PLAYED |
| Phillip Danault | T90 | 1.60 | 2 | 1 | **MISS** | NO | 0.60 | PLAYED |
| Phillip Danault ★ | T30 | 1.60 | 2 | 1 | **MISS** | NO | 0.60 | PLAYED |
| Player 8482993 | T24H | 0.46 | 0 | — | **DNP** | — | — | DNP |
| Player 8482993 | T90 | 0.44 | 0 | — | **DNP** | — | — | DNP |
| Player 8482993 ★ | T30 | 0.44 | 0 | — | **DNP** | — | — | DNP |
| Rickard Rakell | T24H | 2.56 | 3 | 2 | **MISS** | NO | 0.56 | PLAYED |
| Rickard Rakell | T90 | 2.55 | 3 | 2 | **MISS** | NO | 0.55 | PLAYED |
| Rickard Rakell ★ | T30 | 2.55 | 3 | 2 | **MISS** | NO | 0.55 | PLAYED |
| Rutger McGroarty | T24H | 0.40 | 0 | — | **DNP** | — | — | DNP |
| Rutger McGroarty | T90 | 0.39 | 0 | — | **DNP** | — | — | DNP |
| Rutger McGroarty ★ | T30 | 0.39 | 0 | — | **DNP** | — | — | DNP |
| Samuel Girard | T24H | 0.94 | 1 | 2 | **MISS** | YES | 1.06 | PLAYED |
| Samuel Girard | T90 | 0.94 | 1 | 2 | **MISS** | YES | 1.06 | PLAYED |
| Samuel Girard ★ | T30 | 0.94 | 1 | 2 | **MISS** | YES | 1.06 | PLAYED |
| Sidney Crosby | T24H | 1.93 | 2 | 2 | **HIT** | YES | 0.07 | PLAYED |
| Sidney Crosby | T90 | 1.93 | 2 | 2 | **HIT** | YES | 0.07 | PLAYED |
| Sidney Crosby ★ | T30 | 1.93 | 2 | 2 | **HIT** | YES | 0.07 | PLAYED |
| Spencer Stastney | T24H | 0.90 | 1 | 5 | **MISS** | YES | 4.10 | PLAYED |
| Spencer Stastney | T90 | 0.90 | 1 | 5 | **MISS** | YES | 4.10 | PLAYED |
| Spencer Stastney ★ | T30 | 0.90 | 1 | 5 | **MISS** | YES | 4.10 | PLAYED |
| Tommy Novak | T24H | 1.68 | 2 | 3 | **MISS** | YES | 1.32 | PLAYED |
| Tommy Novak | T90 | 1.68 | 2 | 3 | **MISS** | YES | 1.32 | PLAYED |
| Tommy Novak ★ | T30 | 1.68 | 2 | 3 | **MISS** | YES | 1.32 | PLAYED |
| Trevor van Riemsdyk | T24H | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Trevor van Riemsdyk | T90 | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Trevor van Riemsdyk ★ | T30 | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Ville Koivunen | T24H | 1.29 | 1 | 0 | **MISS** | NO | 1.29 | PLAYED |
| Ville Koivunen | T90 | 1.30 | 1 | 0 | **MISS** | NO | 1.30 | PLAYED |
| Ville Koivunen ★ | T30 | 1.30 | 1 | 0 | **MISS** | NO | 1.30 | PLAYED |
| Zachary Bolduc | T24H | 1.40 | 1 | 2 | **MISS** | YES | 0.60 | PLAYED |
| Zachary Bolduc | T90 | 1.41 | 1 | 2 | **MISS** | YES | 0.59 | PLAYED |
| Zachary Bolduc ★ | T30 | 1.41 | 1 | 2 | **MISS** | YES | 0.59 | PLAYED |

## 2026-10-31 — TOR vs VAN

Original snapshots: 132 (T24H=44, T90=44, T30=44); unique players=44. Verified played snapshot rows=102; DNP rows=30; unverified=0. **Exact rounded match among played snapshots: 18/102**. **Latest-snapshot exact matches: 6/34**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Arshdeep Bains | T24H | 0.82 | 1 | — | **DNP** | — | — | DNP |
| Arshdeep Bains | T90 | 0.83 | 1 | — | **DNP** | — | — | DNP |
| Arshdeep Bains ★ | T30 | 0.83 | 1 | — | **DNP** | — | — | DNP |
| Auston Matthews | T24H | 2.87 | 3 | 2 | **MISS** | NO | 0.87 | PLAYED |
| Auston Matthews | T90 | 2.87 | 3 | 2 | **MISS** | NO | 0.87 | PLAYED |
| Auston Matthews ★ | T30 | 2.87 | 3 | 2 | **MISS** | NO | 0.87 | PLAYED |
| Bo Groulx | T24H | 0.65 | 1 | — | **DNP** | — | — | DNP |
| Bo Groulx | T90 | 0.66 | 1 | — | **DNP** | — | — | DNP |
| Bo Groulx ★ | T30 | 0.66 | 1 | — | **DNP** | — | — | DNP |
| Brandon Duhaime | T24H | 1.08 | 1 | 0 | **MISS** | NO | 1.08 | PLAYED |
| Brandon Duhaime | T90 | 1.08 | 1 | 0 | **MISS** | NO | 1.08 | PLAYED |
| Brandon Duhaime ★ | T30 | 1.08 | 1 | 0 | **MISS** | NO | 1.08 | PLAYED |
| Brendan Gallagher | T24H | 0.27 | 0 | 3 | **MISS** | TRIVIAL | 2.73 | PLAYED |
| Brendan Gallagher | T90 | 0.25 | 0 | 3 | **MISS** | TRIVIAL | 2.75 | PLAYED |
| Brendan Gallagher ★ | T30 | 0.25 | 0 | 3 | **MISS** | TRIVIAL | 2.75 | PLAYED |
| Brock Boeser | T24H | 2.00 | 2 | 1 | **MISS** | NO | 1.00 | PLAYED |
| Brock Boeser | T90 | 2.00 | 2 | 1 | **MISS** | NO | 1.00 | PLAYED |
| Brock Boeser ★ | T30 | 2.00 | 2 | 1 | **MISS** | NO | 1.00 | PLAYED |
| Chris Tanev | T24H | 0.05 | 0 | 1 | **MISS** | TRIVIAL | 0.95 | PLAYED |
| Chris Tanev | T90 | 0.04 | 0 | 1 | **MISS** | TRIVIAL | 0.96 | PLAYED |
| Chris Tanev ★ | T30 | 0.04 | 0 | 1 | **MISS** | TRIVIAL | 0.96 | PLAYED |
| Colton Sissons | T24H | 1.12 | 1 | 0 | **MISS** | NO | 1.12 | PLAYED |
| Colton Sissons | T90 | 1.12 | 1 | 0 | **MISS** | NO | 1.12 | PLAYED |
| Colton Sissons ★ | T30 | 1.12 | 1 | 0 | **MISS** | NO | 1.12 | PLAYED |
| Dakota Mermis | T24H | 0.65 | 1 | — | **DNP** | — | — | DNP |
| Dakota Mermis | T90 | 0.66 | 1 | — | **DNP** | — | — | DNP |
| Dakota Mermis ★ | T30 | 0.66 | 1 | — | **DNP** | — | — | DNP |
| Darren Raddysh | T24H | 2.28 | 2 | 2 | **HIT** | YES | 0.28 | PLAYED |
| Darren Raddysh | T90 | 2.28 | 2 | 2 | **HIT** | YES | 0.28 | PLAYED |
| Darren Raddysh ★ | T30 | 2.28 | 2 | 2 | **HIT** | YES | 0.28 | PLAYED |
| Drew O'Connor | T24H | 1.27 | 1 | 0 | **MISS** | NO | 1.27 | PLAYED |
| Drew O'Connor | T90 | 1.27 | 1 | 0 | **MISS** | NO | 1.27 | PLAYED |
| Drew O'Connor ★ | T30 | 1.27 | 1 | 0 | **MISS** | NO | 1.27 | PLAYED |
| Easton Cowan | T24H | 1.73 | 2 | 1 | **MISS** | NO | 0.73 | PLAYED |
| Easton Cowan | T90 | 1.74 | 2 | 1 | **MISS** | NO | 0.74 | PLAYED |
| Easton Cowan ★ | T30 | 1.74 | 2 | 1 | **MISS** | NO | 0.74 | PLAYED |
| Elias Pettersson | T24H | 2.21 | 2 | 1 | **MISS** | NO | 1.21 | PLAYED |
| Elias Pettersson | T24H | 0.97 | 1 | 3 | **MISS** | YES | 2.03 | PLAYED |
| Elias Pettersson | T90 | 2.21 | 2 | 1 | **MISS** | NO | 1.21 | PLAYED |
| Elias Pettersson | T90 | 0.97 | 1 | 3 | **MISS** | YES | 2.03 | PLAYED |
| Elias Pettersson ★ | T30 | 2.21 | 2 | 1 | **MISS** | NO | 1.21 | PLAYED |
| Elias Pettersson ★ | T30 | 0.97 | 1 | 3 | **MISS** | YES | 2.03 | PLAYED |
| Filip Chytil | T24H | 1.83 | 2 | — | **DNP** | — | — | DNP |
| Filip Chytil | T90 | 1.84 | 2 | — | **DNP** | — | — | DNP |
| Filip Chytil ★ | T30 | 1.84 | 2 | — | **DNP** | — | — | DNP |
| Filip Hronek | T24H | 2.00 | 2 | 3 | **MISS** | YES | 1.00 | PLAYED |
| Filip Hronek | T90 | 1.99 | 2 | 3 | **MISS** | YES | 1.01 | PLAYED |
| Filip Hronek ★ | T30 | 1.99 | 2 | 3 | **MISS** | YES | 1.01 | PLAYED |
| Gavin McKenna | T24H | 1.83 | 2 | 3 | **MISS** | YES | 1.17 | PLAYED |
| Gavin McKenna | T90 | 1.84 | 2 | 3 | **MISS** | YES | 1.16 | PLAYED |
| Gavin McKenna ★ | T30 | 1.84 | 2 | 3 | **MISS** | YES | 1.16 | PLAYED |
| Guillaume Brisebois | T24H | 0.21 | 0 | — | **DNP** | — | — | DNP |
| Guillaume Brisebois | T90 | 0.20 | 0 | — | **DNP** | — | — | DNP |
| Guillaume Brisebois ★ | T30 | 0.20 | 0 | — | **DNP** | — | — | DNP |
| Jack Roslovic | T24H | 2.03 | 2 | 1 | **MISS** | NO | 1.03 | PLAYED |
| Jack Roslovic | T90 | 2.04 | 2 | 1 | **MISS** | NO | 1.04 | PLAYED |
| Jack Roslovic ★ | T30 | 2.04 | 2 | 1 | **MISS** | NO | 1.04 | PLAYED |
| Jake DeBrusk | T24H | 2.03 | 2 | 2 | **HIT** | YES | 0.03 | PLAYED |
| Jake DeBrusk | T90 | 2.03 | 2 | 2 | **HIT** | YES | 0.03 | PLAYED |
| Jake DeBrusk ★ | T30 | 2.03 | 2 | 2 | **HIT** | YES | 0.03 | PLAYED |
| Jake McCabe | T24H | 1.24 | 1 | 0 | **MISS** | NO | 1.24 | PLAYED |
| Jake McCabe | T90 | 1.25 | 1 | 0 | **MISS** | NO | 1.25 | PLAYED |
| Jake McCabe ★ | T30 | 1.25 | 1 | 0 | **MISS** | NO | 1.25 | PLAYED |
| Jamie Oleksiak | T24H | 0.91 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Jamie Oleksiak | T90 | 0.92 | 1 | 1 | **HIT** | YES | 0.08 | PLAYED |
| Jamie Oleksiak ★ | T30 | 0.92 | 1 | 1 | **HIT** | YES | 0.08 | PLAYED |
| John Tavares | T24H | 0.18 | 0 | — | **DNP** | — | — | DNP |
| John Tavares | T90 | 0.16 | 0 | — | **DNP** | — | — | DNP |
| John Tavares ★ | T30 | 0.16 | 0 | — | **DNP** | — | — | DNP |
| Jonathan Lekkerimäki | T24H | 1.84 | 2 | 4 | **MISS** | YES | 2.16 | PLAYED |
| Jonathan Lekkerimäki | T90 | 1.83 | 2 | 4 | **MISS** | YES | 2.17 | PLAYED |
| Jonathan Lekkerimäki ★ | T30 | 1.83 | 2 | 4 | **MISS** | YES | 2.17 | PLAYED |
| Kirill Marchenko | T24H | 0.73 | 1 | — | **DNP** | — | — | DNP |
| Kirill Marchenko | T90 | 0.69 | 1 | — | **DNP** | — | — | DNP |
| Kirill Marchenko ★ | T30 | 0.69 | 1 | — | **DNP** | — | — | DNP |
| Liam Ohgren | T24H | 1.19 | 1 | 3 | **MISS** | YES | 1.81 | PLAYED |
| Liam Ohgren | T90 | 1.19 | 1 | 3 | **MISS** | YES | 1.81 | PLAYED |
| Liam Ohgren ★ | T30 | 1.19 | 1 | 3 | **MISS** | YES | 1.81 | PLAYED |
| Linus Karlsson | T24H | 1.67 | 2 | 0 | **MISS** | NO | 1.67 | PLAYED |
| Linus Karlsson | T90 | 1.68 | 2 | 0 | **MISS** | NO | 1.68 | PLAYED |
| Linus Karlsson ★ | T30 | 1.68 | 2 | 0 | **MISS** | NO | 1.68 | PLAYED |
| Luke Schenn | T24H | 0.20 | 0 | 0 | **HIT** | TRIVIAL | 0.20 | PLAYED |
| Luke Schenn | T90 | 0.19 | 0 | 0 | **HIT** | TRIVIAL | 0.19 | PLAYED |
| Luke Schenn ★ | T30 | 0.19 | 0 | 0 | **HIT** | TRIVIAL | 0.19 | PLAYED |
| Marco Rossi | T24H | 1.38 | 1 | 4 | **MISS** | YES | 2.62 | PLAYED |
| Marco Rossi | T90 | 1.38 | 1 | 4 | **MISS** | YES | 2.62 | PLAYED |
| Marco Rossi ★ | T30 | 1.38 | 1 | 4 | **MISS** | YES | 2.62 | PLAYED |
| Max Sasson | T24H | 0.90 | 1 | 2 | **MISS** | YES | 1.10 | PLAYED |
| Max Sasson | T90 | 0.90 | 1 | 2 | **MISS** | YES | 1.10 | PLAYED |
| Max Sasson ★ | T30 | 0.90 | 1 | 2 | **MISS** | YES | 1.10 | PLAYED |
| Morgan Rielly | T24H | 1.20 | 1 | 2 | **MISS** | YES | 0.80 | PLAYED |
| Morgan Rielly | T90 | 1.21 | 1 | 2 | **MISS** | YES | 0.79 | PLAYED |
| Morgan Rielly ★ | T30 | 1.21 | 1 | 2 | **MISS** | YES | 0.79 | PLAYED |
| Nick Blankenburg | T24H | 0.20 | 0 | — | **DNP** | — | — | DNP |
| Nick Blankenburg | T90 | 0.18 | 0 | — | **DNP** | — | — | DNP |
| Nick Blankenburg ★ | T30 | 0.18 | 0 | — | **DNP** | — | — | DNP |
| Nick Paul | T24H | 1.21 | 1 | 2 | **MISS** | YES | 0.79 | PLAYED |
| Nick Paul | T90 | 1.21 | 1 | 2 | **MISS** | YES | 0.79 | PLAYED |
| Nick Paul ★ | T30 | 1.21 | 1 | 2 | **MISS** | YES | 0.79 | PLAYED |
| Oliver Ekman-Larsson | T24H | 1.04 | 1 | 0 | **MISS** | NO | 1.04 | PLAYED |
| Oliver Ekman-Larsson | T90 | 1.04 | 1 | 0 | **MISS** | NO | 1.04 | PLAYED |
| Oliver Ekman-Larsson ★ | T30 | 1.04 | 1 | 0 | **MISS** | NO | 1.04 | PLAYED |
| Paul Cotter | T24H | 0.86 | 1 | 0 | **MISS** | NO | 0.86 | PLAYED |
| Paul Cotter | T90 | 0.86 | 1 | 0 | **MISS** | NO | 0.86 | PLAYED |
| Paul Cotter ★ | T30 | 0.86 | 1 | 0 | **MISS** | NO | 0.86 | PLAYED |
| Player 8482691 | T24H | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Player 8482691 | T90 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Player 8482691 ★ | T30 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Teddy Blueger | T24H | 1.27 | 1 | 2 | **MISS** | YES | 0.73 | PLAYED |
| Teddy Blueger | T90 | 1.27 | 1 | 2 | **MISS** | YES | 0.73 | PLAYED |
| Teddy Blueger ★ | T30 | 1.27 | 1 | 2 | **MISS** | YES | 0.73 | PLAYED |
| Tom Willander | T24H | 1.21 | 1 | 0 | **MISS** | NO | 1.21 | PLAYED |
| Tom Willander | T90 | 1.21 | 1 | 0 | **MISS** | NO | 1.21 | PLAYED |
| Tom Willander ★ | T30 | 1.21 | 1 | 0 | **MISS** | NO | 1.21 | PLAYED |
| Troy Stecher | T24H | 1.36 | 1 | 1 | **HIT** | YES | 0.36 | PLAYED |
| Troy Stecher | T90 | 1.36 | 1 | 1 | **HIT** | YES | 0.36 | PLAYED |
| Troy Stecher ★ | T30 | 1.36 | 1 | 1 | **HIT** | YES | 0.36 | PLAYED |
| Victor Mancini | T24H | 0.60 | 1 | — | **DNP** | — | — | DNP |
| Victor Mancini | T90 | 0.61 | 1 | — | **DNP** | — | — | DNP |
| Victor Mancini ★ | T30 | 0.61 | 1 | — | **DNP** | — | — | DNP |
| Vinni Lettieri | T24H | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Vinni Lettieri | T90 | 1.31 | 1 | 1 | **HIT** | YES | 0.31 | PLAYED |
| Vinni Lettieri ★ | T30 | 1.31 | 1 | 1 | **HIT** | YES | 0.31 | PLAYED |
| William Nylander | T24H | 3.01 | 3 | 2 | **MISS** | NO | 1.01 | PLAYED |
| William Nylander | T90 | 3.00 | 3 | 2 | **MISS** | NO | 1.00 | PLAYED |
| William Nylander ★ | T30 | 3.00 | 3 | 2 | **MISS** | NO | 1.00 | PLAYED |
| Zack MacEwen | T24H | 0.97 | 1 | 3 | **MISS** | YES | 2.03 | PLAYED |
| Zack MacEwen | T90 | 0.98 | 1 | 3 | **MISS** | YES | 2.02 | PLAYED |
| Zack MacEwen ★ | T30 | 0.98 | 1 | 3 | **MISS** | YES | 2.02 | PLAYED |
| Zeev Buium | T24H | 1.13 | 1 | 0 | **MISS** | NO | 1.13 | PLAYED |
| Zeev Buium | T90 | 1.13 | 1 | 0 | **MISS** | NO | 1.13 | PLAYED |
| Zeev Buium ★ | T30 | 1.13 | 1 | 0 | **MISS** | NO | 1.13 | PLAYED |

## 2026-10-31 — CBJ vs DAL

Original snapshots: 82 (T24H=41, T90=41, T30=0); unique players=41. Verified played snapshot rows=68; DNP rows=14; unverified=0. **Exact rounded match among played snapshots: 22/68**. **Latest-snapshot exact matches: 11/34**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Fantilli | T24H | 2.62 | 3 | 3 | **HIT** | YES | 0.38 | PLAYED |
| Adam Fantilli ★ | T90 | 2.62 | 3 | 3 | **HIT** | YES | 0.38 | PLAYED |
| Arttu Hyry | T24H | 1.51 | 2 | 4 | **MISS** | YES | 2.49 | PLAYED |
| Arttu Hyry ★ | T90 | 1.52 | 2 | 4 | **MISS** | YES | 2.48 | PLAYED |
| Charlie Coyle | T24H | 2.02 | 2 | 2 | **HIT** | YES | 0.02 | PLAYED |
| Charlie Coyle ★ | T90 | 2.01 | 2 | 2 | **HIT** | YES | 0.01 | PLAYED |
| Cole Sillinger | T24H | 1.21 | 1 | 2 | **MISS** | YES | 0.79 | PLAYED |
| Cole Sillinger ★ | T90 | 1.21 | 1 | 2 | **MISS** | YES | 0.79 | PLAYED |
| Colin Blackwell | T24H | 1.07 | 1 | 0 | **MISS** | NO | 1.07 | PLAYED |
| Colin Blackwell ★ | T90 | 1.07 | 1 | 0 | **MISS** | NO | 1.07 | PLAYED |
| Conor Garland | T24H | 1.15 | 1 | 2 | **MISS** | YES | 0.85 | PLAYED |
| Conor Garland ★ | T90 | 1.15 | 1 | 2 | **MISS** | YES | 0.85 | PLAYED |
| Damon Severson | T24H | 1.25 | 1 | 1 | **HIT** | YES | 0.25 | PLAYED |
| Damon Severson ★ | T90 | 1.24 | 1 | 1 | **HIT** | YES | 0.24 | PLAYED |
| Dante Fabbro | T24H | 0.71 | 1 | 1 | **HIT** | YES | 0.29 | PLAYED |
| Dante Fabbro ★ | T90 | 0.72 | 1 | 1 | **HIT** | YES | 0.28 | PLAYED |
| Danton Heinen | T24H | 0.64 | 1 | 1 | **HIT** | YES | 0.36 | PLAYED |
| Danton Heinen ★ | T90 | 0.64 | 1 | 1 | **HIT** | YES | 0.36 | PLAYED |
| Denton Mateychuk | T24H | 1.49 | 1 | 2 | **MISS** | YES | 0.51 | PLAYED |
| Denton Mateychuk ★ | T90 | 1.49 | 1 | 2 | **MISS** | YES | 0.51 | PLAYED |
| Dmitri Voronkov | T24H | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Dmitri Voronkov ★ | T90 | 0.26 | 0 | — | **DNP** | — | — | DNP |
| Emil Andrae | T24H | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Emil Andrae ★ | T90 | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Erik Gudbranson | T24H | 0.76 | 1 | 0 | **MISS** | NO | 0.76 | PLAYED |
| Erik Gudbranson ★ | T90 | 0.76 | 1 | 0 | **MISS** | NO | 0.76 | PLAYED |
| Esa Lindell | T24H | 0.16 | 0 | 1 | **MISS** | TRIVIAL | 0.84 | PLAYED |
| Esa Lindell ★ | T90 | 0.15 | 0 | 1 | **MISS** | TRIVIAL | 0.85 | PLAYED |
| Jake Christiansen | T24H | 0.72 | 1 | 1 | **HIT** | YES | 0.28 | PLAYED |
| Jake Christiansen ★ | T90 | 0.72 | 1 | 1 | **HIT** | YES | 0.28 | PLAYED |
| Jamie Benn | T24H | 1.07 | 1 | 0 | **MISS** | NO | 1.07 | PLAYED |
| Jamie Benn ★ | T90 | 1.07 | 1 | 0 | **MISS** | NO | 1.07 | PLAYED |
| Jason Robertson | T24H | 3.43 | 3 | 1 | **MISS** | NO | 2.43 | PLAYED |
| Jason Robertson ★ | T90 | 3.42 | 3 | 1 | **MISS** | NO | 2.42 | PLAYED |
| Joel Kiviranta | T24H | 1.35 | 1 | 1 | **HIT** | YES | 0.35 | PLAYED |
| Joel Kiviranta ★ | T90 | 1.35 | 1 | 1 | **HIT** | YES | 0.35 | PLAYED |
| Justin Hryckowian | T24H | 1.33 | 1 | 0 | **MISS** | NO | 1.33 | PLAYED |
| Justin Hryckowian ★ | T90 | 1.33 | 1 | 0 | **MISS** | NO | 1.33 | PLAYED |
| Kent Johnson | T24H | 1.99 | 2 | 1 | **MISS** | NO | 0.99 | PLAYED |
| Kent Johnson ★ | T90 | 1.99 | 2 | 1 | **MISS** | NO | 0.99 | PLAYED |
| Kyle Capobianco | T24H | 0.24 | 0 | — | **DNP** | — | — | DNP |
| Kyle Capobianco ★ | T90 | 0.23 | 0 | — | **DNP** | — | — | DNP |
| Lian Bichsel | T24H | 0.90 | 1 | 0 | **MISS** | NO | 0.90 | PLAYED |
| Lian Bichsel ★ | T90 | 0.91 | 1 | 0 | **MISS** | NO | 0.91 | PLAYED |
| Luca Del Bel Belluz | T24H | 0.60 | 1 | — | **DNP** | — | — | DNP |
| Luca Del Bel Belluz ★ | T90 | 0.61 | 1 | — | **DNP** | — | — | DNP |
| Mathieu Olivier | T24H | 1.32 | 1 | 1 | **HIT** | YES | 0.32 | PLAYED |
| Mathieu Olivier ★ | T90 | 1.32 | 1 | 1 | **HIT** | YES | 0.32 | PLAYED |
| Matthew Knies | T24H | 1.68 | 2 | 0 | **MISS** | NO | 1.68 | PLAYED |
| Matthew Knies ★ | T90 | 1.67 | 2 | 0 | **MISS** | NO | 1.67 | PLAYED |
| Mikko Rantanen | T24H | 2.46 | 2 | 3 | **MISS** | YES | 0.54 | PLAYED |
| Mikko Rantanen ★ | T90 | 2.46 | 2 | 3 | **MISS** | YES | 0.54 | PLAYED |
| Miro Heiskanen | T24H | 2.39 | 2 | 1 | **MISS** | NO | 1.39 | PLAYED |
| Miro Heiskanen ★ | T90 | 2.38 | 2 | 1 | **MISS** | NO | 1.38 | PLAYED |
| Nils Lundkvist | T24H | 0.90 | 1 | 0 | **MISS** | NO | 0.90 | PLAYED |
| Nils Lundkvist ★ | T90 | 0.90 | 1 | 0 | **MISS** | NO | 0.90 | PLAYED |
| Oskar Bäck | T24H | 0.10 | 0 | — | **DNP** | — | — | DNP |
| Oskar Bäck ★ | T90 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Player 8477369 | T24H | 0.17 | 0 | — | **DNP** | — | — | DNP |
| Player 8477369 ★ | T90 | 0.16 | 0 | — | **DNP** | — | — | DNP |
| Radek Faksa | T24H | 0.19 | 0 | — | **DNP** | — | — | DNP |
| Radek Faksa ★ | T90 | 0.18 | 0 | — | **DNP** | — | — | DNP |
| Roope Hintz | T24H | 2.24 | 2 | 0 | **MISS** | NO | 2.24 | PLAYED |
| Roope Hintz ★ | T90 | 2.24 | 2 | 0 | **MISS** | NO | 2.24 | PLAYED |
| Ryan Lomberg | T24H | 1.04 | 1 | 0 | **MISS** | NO | 1.04 | PLAYED |
| Ryan Lomberg ★ | T90 | 1.04 | 1 | 0 | **MISS** | NO | 1.04 | PLAYED |
| Sam Steel | T24H | 1.10 | 1 | 0 | **MISS** | NO | 1.10 | PLAYED |
| Sam Steel ★ | T90 | 1.10 | 1 | 0 | **MISS** | NO | 1.10 | PLAYED |
| Sean Monahan | T24H | 1.38 | 1 | 0 | **MISS** | NO | 1.38 | PLAYED |
| Sean Monahan ★ | T90 | 1.38 | 1 | 0 | **MISS** | NO | 1.38 | PLAYED |
| Thomas Harley | T24H | 1.86 | 2 | 2 | **HIT** | YES | 0.14 | PLAYED |
| Thomas Harley ★ | T90 | 1.85 | 2 | 2 | **HIT** | YES | 0.15 | PLAYED |
| Tyler Myers | T24H | 0.87 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Tyler Myers ★ | T90 | 0.87 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Tyler Seguin | T24H | 1.73 | 2 | 0 | **MISS** | NO | 1.73 | PLAYED |
| Tyler Seguin ★ | T90 | 1.73 | 2 | 0 | **MISS** | NO | 1.73 | PLAYED |
| Valeri Nichushkin | T24H | 1.41 | 1 | 3 | **MISS** | YES | 1.59 | PLAYED |
| Valeri Nichushkin ★ | T90 | 1.41 | 1 | 3 | **MISS** | YES | 1.59 | PLAYED |
| Wyatt Johnston | T24H | 2.76 | 3 | 3 | **HIT** | YES | 0.24 | PLAYED |
| Wyatt Johnston ★ | T90 | 2.76 | 3 | 3 | **HIT** | YES | 0.24 | PLAYED |
| Zach Werenski | T24H | 2.84 | 3 | 4 | **MISS** | YES | 1.16 | PLAYED |
| Zach Werenski ★ | T90 | 2.82 | 3 | 4 | **MISS** | YES | 1.18 | PLAYED |

## 2026-10-31 — CGY vs COL

Original snapshots: 129 (T24H=43, T90=43, T30=43); unique players=44. Verified played snapshot rows=107; DNP rows=22; unverified=0. **Exact rounded match among played snapshots: 43/107**. **Latest-snapshot exact matches: 14/36**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Klapka | T24H | 1.40 | 1 | 3 | **MISS** | YES | 1.60 | PLAYED |
| Adam Klapka | T90 | 1.26 | 1 | 3 | **MISS** | YES | 1.74 | PLAYED |
| Adam Klapka ★ | T30 | 1.26 | 1 | 3 | **MISS** | YES | 1.74 | PLAYED |
| Artturi Lehkonen | T24H | 2.00 | 2 | 4 | **MISS** | YES | 2.00 | PLAYED |
| Artturi Lehkonen | T90 | 1.94 | 2 | 4 | **MISS** | YES | 2.06 | PLAYED |
| Artturi Lehkonen ★ | T30 | 1.94 | 2 | 4 | **MISS** | YES | 2.06 | PLAYED |
| Aydar Suniev | T24H | 1.35 | 1 | 1 | **HIT** | YES | 0.35 | PLAYED |
| Aydar Suniev | T90 | 1.48 | 1 | 1 | **HIT** | YES | 0.48 | PLAYED |
| Aydar Suniev ★ | T30 | 1.48 | 1 | 1 | **HIT** | YES | 0.48 | PLAYED |
| Ben Jones | T24H | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Ben Jones | T90 | 0.20 | 0 | — | **DNP** | — | — | DNP |
| Ben Jones ★ | T30 | 0.20 | 0 | — | **DNP** | — | — | DNP |
| Brennan Othmann | T24H | 0.80 | 1 | — | **DNP** | — | — | DNP |
| Brennan Othmann | T90 | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Brennan Othmann ★ | T30 | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Brent Burns | T24H | 1.16 | 1 | 1 | **HIT** | YES | 0.16 | PLAYED |
| Brent Burns | T90 | 1.13 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Brent Burns ★ | T30 | 1.13 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Brett Kulak | T24H | 1.30 | 1 | 3 | **MISS** | YES | 1.70 | PLAYED |
| Brett Kulak | T90 | 1.27 | 1 | 3 | **MISS** | YES | 1.73 | PLAYED |
| Brett Kulak ★ | T30 | 1.27 | 1 | 3 | **MISS** | YES | 1.73 | PLAYED |
| Brock Nelson | T24H | 2.04 | 2 | 3 | **MISS** | YES | 0.96 | PLAYED |
| Brock Nelson | T90 | 1.97 | 2 | 3 | **MISS** | YES | 1.03 | PLAYED |
| Brock Nelson ★ | T30 | 1.97 | 2 | 3 | **MISS** | YES | 1.03 | PLAYED |
| Cale Makar | T24H | 2.67 | 3 | 3 | **HIT** | YES | 0.33 | PLAYED |
| Cale Makar | T90 | 2.60 | 3 | 3 | **HIT** | YES | 0.40 | PLAYED |
| Cale Makar ★ | T30 | 2.60 | 3 | 3 | **HIT** | YES | 0.40 | PLAYED |
| Devon Toews | T24H | 1.68 | 2 | 1 | **MISS** | NO | 0.68 | PLAYED |
| Devon Toews | T90 | 1.63 | 2 | 1 | **MISS** | NO | 0.63 | PLAYED |
| Devon Toews ★ | T30 | 1.63 | 2 | 1 | **MISS** | NO | 0.63 | PLAYED |
| Fedor Svechkov | T24H | 1.01 | 1 | 0 | **MISS** | NO | 1.01 | PLAYED |
| Fedor Svechkov | T90 | 0.98 | 1 | 0 | **MISS** | NO | 0.98 | PLAYED |
| Fedor Svechkov ★ | T30 | 0.98 | 1 | 0 | **MISS** | NO | 0.98 | PLAYED |
| Gabriel Landeskog | T24H | 1.34 | 1 | 1 | **HIT** | YES | 0.34 | PLAYED |
| Gabriel Landeskog | T90 | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Gabriel Landeskog ★ | T30 | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Gavin Brindley | T90 | 0.17 | 0 | 1 | **MISS** | TRIVIAL | 0.83 | PLAYED |
| Gavin Brindley ★ | T30 | 0.17 | 0 | 1 | **MISS** | TRIVIAL | 0.83 | PLAYED |
| Jaden Schwartz | T24H | 1.55 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Jaden Schwartz | T90 | 1.50 | 2 | 2 | **HIT** | YES | 0.50 | PLAYED |
| Jaden Schwartz ★ | T30 | 1.50 | 2 | 2 | **HIT** | YES | 0.50 | PLAYED |
| Jake Middleton | T24H | 1.00 | 1 | 0 | **MISS** | NO | 1.00 | PLAYED |
| Jake Middleton | T90 | 0.99 | 1 | 0 | **MISS** | NO | 0.99 | PLAYED |
| Jake Middleton ★ | T30 | 0.99 | 1 | 0 | **MISS** | NO | 0.99 | PLAYED |
| Joel Farabee | T24H | 2.72 | 3 | 3 | **HIT** | YES | 0.28 | PLAYED |
| Joel Farabee | T90 | 2.45 | 2 | 3 | **MISS** | YES | 0.55 | PLAYED |
| Joel Farabee ★ | T30 | 2.45 | 2 | 3 | **MISS** | YES | 0.55 | PLAYED |
| Jonathan Castagna | T90 | 0.95 | 1 | 1 | **HIT** | YES | 0.05 | PLAYED |
| Jonathan Castagna ★ | T30 | 0.95 | 1 | 1 | **HIT** | YES | 0.05 | PLAYED |
| Josh Manson | T24H | 0.82 | 1 | — | **DNP** | — | — | DNP |
| Josh Manson | T90 | 0.80 | 1 | — | **DNP** | — | — | DNP |
| Josh Manson ★ | T30 | 0.80 | 1 | — | **DNP** | — | — | DNP |
| Kevin Bahl | T24H | 1.25 | 1 | 1 | **HIT** | YES | 0.25 | PLAYED |
| Kevin Bahl | T90 | 1.20 | 1 | 1 | **HIT** | YES | 0.20 | PLAYED |
| Kevin Bahl ★ | T30 | 1.20 | 1 | 1 | **HIT** | YES | 0.20 | PLAYED |
| Logan O'Connor | T24H | 1.30 | 1 | — | **DNP** | — | — | DNP |
| Logan O'Connor | T90 | 1.28 | 1 | — | **DNP** | — | — | DNP |
| Logan O'Connor ★ | T30 | 1.28 | 1 | — | **DNP** | — | — | DNP |
| Martin Necas | T24H | 2.13 | 2 | 2 | **HIT** | YES | 0.13 | PLAYED |
| Martin Necas | T90 | 2.06 | 2 | 2 | **HIT** | YES | 0.06 | PLAYED |
| Martin Necas ★ | T30 | 2.06 | 2 | 2 | **HIT** | YES | 0.06 | PLAYED |
| Martin Pospisil | T24H | 1.38 | 1 | 2 | **MISS** | YES | 0.62 | PLAYED |
| Martin Pospisil | T90 | 1.36 | 1 | 2 | **MISS** | YES | 0.64 | PLAYED |
| Martin Pospisil ★ | T30 | 1.36 | 1 | 2 | **MISS** | YES | 0.64 | PLAYED |
| Matt Coronato | T24H | 2.55 | 3 | 2 | **MISS** | NO | 0.55 | PLAYED |
| Matt Coronato | T90 | 2.24 | 2 | 2 | **HIT** | YES | 0.24 | PLAYED |
| Matt Coronato ★ | T30 | 2.24 | 2 | 2 | **HIT** | YES | 0.24 | PLAYED |
| Matvei Gridin | T24H | 2.41 | 2 | 2 | **HIT** | YES | 0.41 | PLAYED |
| Matvei Gridin | T90 | 2.59 | 3 | 2 | **MISS** | NO | 0.59 | PLAYED |
| Matvei Gridin ★ | T30 | 2.59 | 3 | 2 | **MISS** | NO | 0.59 | PLAYED |
| Maxim Tsyplakov | T24H | 0.12 | 0 | 0 | **HIT** | TRIVIAL | 0.12 | PLAYED |
| Maxim Tsyplakov | T90 | 0.82 | 1 | 0 | **MISS** | NO | 0.82 | PLAYED |
| Maxim Tsyplakov ★ | T30 | 0.82 | 1 | 0 | **MISS** | NO | 0.82 | PLAYED |
| Mikael Backlund | T24H | 1.72 | 2 | 5 | **MISS** | YES | 3.28 | PLAYED |
| Mikael Backlund | T90 | 1.92 | 2 | 5 | **MISS** | YES | 3.08 | PLAYED |
| Mikael Backlund ★ | T30 | 1.92 | 2 | 5 | **MISS** | YES | 3.08 | PLAYED |
| Morgan Frost | T24H | 1.90 | 2 | 1 | **MISS** | NO | 0.90 | PLAYED |
| Morgan Frost | T90 | 1.84 | 2 | 1 | **MISS** | NO | 0.84 | PLAYED |
| Morgan Frost ★ | T30 | 1.84 | 2 | 1 | **MISS** | NO | 0.84 | PLAYED |
| Nathan MacKinnon | T24H | 3.52 | 4 | 5 | **MISS** | YES | 1.48 | PLAYED |
| Nathan MacKinnon | T90 | 3.40 | 3 | 5 | **MISS** | YES | 1.60 | PLAYED |
| Nathan MacKinnon ★ | T30 | 3.40 | 3 | 5 | **MISS** | YES | 1.60 | PLAYED |
| Nazem Kadri | T24H | 2.30 | 2 | 2 | **HIT** | YES | 0.30 | PLAYED |
| Nazem Kadri | T90 | 2.22 | 2 | 2 | **HIT** | YES | 0.22 | PLAYED |
| Nazem Kadri ★ | T30 | 2.22 | 2 | 2 | **HIT** | YES | 0.22 | PLAYED |
| Nicolas Roy | T24H | 1.00 | 1 | 0 | **MISS** | NO | 1.00 | PLAYED |
| Nicolas Roy | T90 | 0.97 | 1 | 0 | **MISS** | NO | 0.97 | PLAYED |
| Nicolas Roy ★ | T30 | 0.97 | 1 | 0 | **MISS** | NO | 0.97 | PLAYED |
| Noah Juulsen | T24H | 0.12 | 0 | 0 | **HIT** | TRIVIAL | 0.12 | PLAYED |
| Noah Juulsen | T90 | 0.11 | 0 | 0 | **HIT** | TRIVIAL | 0.11 | PLAYED |
| Noah Juulsen ★ | T30 | 0.11 | 0 | 0 | **HIT** | TRIVIAL | 0.11 | PLAYED |
| Parker Kelly | T24H | 1.25 | 1 | 0 | **MISS** | NO | 1.25 | PLAYED |
| Parker Kelly | T90 | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Parker Kelly ★ | T30 | 1.22 | 1 | 0 | **MISS** | NO | 1.22 | PLAYED |
| Player 8482074 ★ | T24H | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Player 8482953 | T24H | 0.24 | 0 | — | **DNP** | — | — | DNP |
| Player 8482953 | T90 | 0.22 | 0 | — | **DNP** | — | — | DNP |
| Player 8482953 ★ | T30 | 0.22 | 0 | — | **DNP** | — | — | DNP |
| Player 8484149 | T24H | 0.19 | 0 | 1 | **MISS** | TRIVIAL | 0.81 | PLAYED |
| Ryan Strome | T24H | 1.84 | 2 | 1 | **MISS** | NO | 0.84 | PLAYED |
| Ryan Strome | T90 | 1.96 | 2 | 1 | **MISS** | NO | 0.96 | PLAYED |
| Ryan Strome ★ | T30 | 1.96 | 2 | 1 | **MISS** | NO | 0.96 | PLAYED |
| Sam Malinski | T24H | 1.20 | 1 | 3 | **MISS** | YES | 1.80 | PLAYED |
| Sam Malinski | T90 | 1.17 | 1 | 3 | **MISS** | YES | 1.83 | PLAYED |
| Sam Malinski ★ | T30 | 1.17 | 1 | 3 | **MISS** | YES | 1.83 | PLAYED |
| Samuel Honzek | T24H | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Samuel Honzek | T90 | 0.05 | 0 | — | **DNP** | — | — | DNP |
| Samuel Honzek ★ | T30 | 0.05 | 0 | — | **DNP** | — | — | DNP |
| Simon Nemec | T24H | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| Simon Nemec | T90 | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| Simon Nemec ★ | T30 | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| T.J. Hughes | T24H | 2.26 | 2 | 2 | **HIT** | YES | 0.26 | PLAYED |
| T.J. Hughes | T90 | 2.20 | 2 | 2 | **HIT** | YES | 0.20 | PLAYED |
| T.J. Hughes ★ | T30 | 2.20 | 2 | 2 | **HIT** | YES | 0.20 | PLAYED |
| Yan Kuznetsov | T24H | 0.94 | 1 | 0 | **MISS** | NO | 0.94 | PLAYED |
| Yan Kuznetsov | T90 | 0.91 | 1 | 0 | **MISS** | NO | 0.91 | PLAYED |
| Yan Kuznetsov ★ | T30 | 0.91 | 1 | 0 | **MISS** | NO | 0.91 | PLAYED |
| Yegor Sharangovich | T24H | 1.48 | 1 | 3 | **MISS** | YES | 1.52 | PLAYED |
| Yegor Sharangovich | T90 | 1.56 | 2 | 3 | **MISS** | YES | 1.44 | PLAYED |
| Yegor Sharangovich ★ | T30 | 1.56 | 2 | 3 | **MISS** | YES | 1.44 | PLAYED |
| Zach Whitecloud | T24H | 1.11 | 1 | 1 | **HIT** | YES | 0.11 | PLAYED |
| Zach Whitecloud | T90 | 1.09 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Zach Whitecloud ★ | T30 | 1.09 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Zachary L'Heureux | T24H | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Zachary L'Heureux | T90 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Zachary L'Heureux ★ | T30 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Zayne Parekh | T24H | 1.53 | 2 | 0 | **MISS** | NO | 1.53 | PLAYED |
| Zayne Parekh | T90 | 1.57 | 2 | 0 | **MISS** | NO | 1.57 | PLAYED |
| Zayne Parekh ★ | T30 | 1.57 | 2 | 0 | **MISS** | NO | 1.57 | PLAYED |

## 2026-11-01 — CAR vs WPG

Original snapshots: 43 (T24H=0, T90=43, T30=0); unique players=43. Verified played snapshot rows=35; DNP rows=8; unverified=0. **Exact rounded match among played snapshots: 7/35**. **Latest-snapshot exact matches: 7/35**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Lowry ★ | T90 | 0.96 | 1 | 0 | **MISS** | NO | 0.96 | PLAYED |
| Alex Iafallo ★ | T90 | 1.14 | 1 | 0 | **MISS** | NO | 1.14 | PLAYED |
| Andrei Svechnikov ★ | T90 | 2.35 | 2 | 3 | **MISS** | YES | 0.65 | PLAYED |
| Brad Lambert ★ | T90 | 0.22 | 0 | — | **DNP** | — | — | DNP |
| Cole Koepke ★ | T90 | 0.75 | 1 | — | **DNP** | — | — | DNP |
| Cole Perfetti ★ | T90 | 2.17 | 2 | 3 | **MISS** | YES | 0.83 | PLAYED |
| Dawson Mercer ★ | T90 | 1.46 | 1 | 0 | **MISS** | NO | 1.46 | PLAYED |
| Dylan DeMelo ★ | T90 | 0.94 | 1 | 0 | **MISS** | NO | 0.94 | PLAYED |
| Dylan Samberg ★ | T90 | 1.14 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Elias Salomonsson ★ | T90 | 0.96 | 1 | 3 | **MISS** | YES | 2.04 | PLAYED |
| Eric Robinson ★ | T90 | 1.22 | 1 | 2 | **MISS** | YES | 0.78 | PLAYED |
| Gabriel Vilardi ★ | T90 | 1.73 | 2 | 2 | **HIT** | YES | 0.27 | PLAYED |
| Haydn Fleury ★ | T90 | 0.77 | 1 | 1 | **HIT** | YES | 0.23 | PLAYED |
| Isak Rosen ★ | T90 | 1.08 | 1 | 0 | **MISS** | NO | 1.08 | PLAYED |
| Jaccob Slavin ★ | T90 | 1.64 | 2 | 0 | **MISS** | NO | 1.64 | PLAYED |
| Jackson Blake ★ | T90 | 2.72 | 3 | 1 | **MISS** | NO | 1.72 | PLAYED |
| Jalen Chatfield ★ | T90 | 1.38 | 1 | 0 | **MISS** | NO | 1.38 | PLAYED |
| Jesperi Kotkaniemi ★ | T90 | 1.19 | 1 | 1 | **HIT** | YES | 0.19 | PLAYED |
| Jordan Martinook ★ | T90 | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| Jordan Staal ★ | T90 | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Juuso Välimäki ★ | T90 | 0.89 | 1 | 2 | **MISS** | YES | 1.11 | PLAYED |
| K'Andre Miller ★ | T90 | 1.59 | 2 | 1 | **MISS** | NO | 0.59 | PLAYED |
| Kyle Connor ★ | T90 | 2.71 | 3 | 2 | **MISS** | NO | 0.71 | PLAYED |
| Logan Stankoven ★ | T90 | 2.39 | 2 | 3 | **MISS** | YES | 0.61 | PLAYED |
| Mario Ferraro ★ | T90 | 1.04 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Mark Jankowski ★ | T90 | 1.59 | 2 | 3 | **MISS** | YES | 1.41 | PLAYED |
| Mark Scheifele ★ | T90 | 2.27 | 2 | 4 | **MISS** | YES | 1.73 | PLAYED |
| Mike Reilly ★ | T90 | 0.10 | 0 | — | **DNP** | — | — | DNP |
| Morgan Barron ★ | T90 | 1.01 | 1 | 2 | **MISS** | YES | 0.99 | PLAYED |
| Neal Pionk ★ | T90 | 1.89 | 2 | 4 | **MISS** | YES | 2.11 | PLAYED |
| Nicolas Deslauriers ★ | T90 | 0.83 | 1 | 1 | **HIT** | YES | 0.17 | PLAYED |
| Nikolaj Ehlers ★ | T90 | 2.16 | 2 | 4 | **MISS** | YES | 1.84 | PLAYED |
| Nino Niederreiter ★ | T90 | 0.20 | 0 | 3 | **MISS** | TRIVIAL | 2.80 | PLAYED |
| Player 8481030 ★ | T90 | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Player 8484203 ★ | T90 | 0.20 | 0 | — | **DNP** | — | — | DNP |
| Sean Walker ★ | T90 | 1.50 | 1 | 5 | **MISS** | YES | 3.50 | PLAYED |
| Sebastian Aho ★ | T90 | 2.83 | 3 | 1 | **MISS** | NO | 1.83 | PLAYED |
| Seth Jarvis ★ | T90 | 2.02 | 2 | 3 | **MISS** | YES | 0.98 | PLAYED |
| Shayne Gostisbehere ★ | T90 | 1.57 | 2 | 1 | **MISS** | NO | 0.57 | PLAYED |
| Taylor Hall ★ | T90 | 0.12 | 0 | — | **DNP** | — | — | DNP |
| Viggo Björck ★ | T90 | 0.93 | 1 | 0 | **MISS** | NO | 0.93 | PLAYED |
| Vladislav Namestnikov ★ | T90 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| William Carrier ★ | T90 | 1.60 | 2 | 0 | **MISS** | NO | 1.60 | PLAYED |

## 2026-11-01 — MIN vs WSH

Original snapshots: 43 (T24H=43, T90=0, T30=0); unique players=43. Verified played snapshot rows=35; DNP rows=8; unverified=0. **Exact rounded match among played snapshots: 11/35**. **Latest-snapshot exact matches: 11/35**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Alex Ovechkin ★ | T24H | 1.55 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Alex Tuch ★ | T24H | 2.38 | 2 | 4 | **MISS** | YES | 1.62 | PLAYED |
| Aliaksei Protas ★ | T24H | 1.39 | 1 | 1 | **HIT** | YES | 0.39 | PLAYED |
| Anthony Beauvillier ★ | T24H | 0.81 | 1 | 1 | **HIT** | YES | 0.19 | PLAYED |
| Blake Coleman ★ | T24H | 1.69 | 2 | 1 | **MISS** | NO | 0.69 | PLAYED |
| Bobby Brink ★ | T24H | 1.17 | 1 | 4 | **MISS** | YES | 2.83 | PLAYED |
| Boone Jenner ★ | T24H | 1.51 | 2 | 0 | **MISS** | NO | 1.51 | PLAYED |
| Cole Hutson ★ | T24H | 1.53 | 2 | 1 | **MISS** | NO | 0.53 | PLAYED |
| Danila Yurov ★ | T24H | 1.36 | 1 | 2 | **MISS** | YES | 0.64 | PLAYED |
| Dylan McIlrath ★ | T24H | 0.12 | 0 | — | **DNP** | — | — | DNP |
| Dylan Strome ★ | T24H | 2.12 | 2 | 0 | **MISS** | NO | 2.12 | PLAYED |
| Ethen Frank ★ | T24H | 0.10 | 0 | — | **DNP** | — | — | DNP |
| Ilya Protas ★ | T24H | 1.07 | 1 | 1 | **HIT** | YES | 0.07 | PLAYED |
| Ivan Miroshnichenko ★ | T24H | 0.16 | 0 | — | **DNP** | — | — | DNP |
| Jack St. Ivany ★ | T24H | 0.63 | 1 | 3 | **MISS** | YES | 2.37 | PLAYED |
| Jakob Chychrun ★ | T24H | 2.37 | 2 | 4 | **MISS** | YES | 1.63 | PLAYED |
| Jared Spurgeon ★ | T24H | 0.37 | 0 | — | **DNP** | — | — | DNP |
| Joel Eriksson Ek ★ | T24H | 3.05 | 3 | 3 | **HIT** | YES | 0.05 | PLAYED |
| Jonas Brodin ★ | T24H | 1.23 | 1 | 0 | **MISS** | NO | 1.23 | PLAYED |
| Jordan Kyrou ★ | T24H | 1.75 | 2 | 0 | **MISS** | NO | 1.75 | PLAYED |
| Justin Sourdif ★ | T24H | 1.03 | 1 | 2 | **MISS** | YES | 0.97 | PLAYED |
| Kirill Kaprizov ★ | T24H | 3.42 | 3 | 2 | **MISS** | NO | 1.42 | PLAYED |
| Martin Fehérváry ★ | T24H | 1.12 | 1 | 0 | **MISS** | NO | 1.12 | PLAYED |
| Matt Boldy ★ | T24H | 3.64 | 4 | 3 | **MISS** | NO | 0.64 | PLAYED |
| Matt Kiersted ★ | T24H | 0.70 | 1 | 0 | **MISS** | NO | 0.70 | PLAYED |
| Matt Roy ★ | T24H | 1.06 | 1 | 0 | **MISS** | NO | 1.06 | PLAYED |
| Maxim Shabanov ★ | T24H | 1.48 | 1 | 3 | **MISS** | YES | 1.52 | PLAYED |
| Michael McCarron ★ | T24H | 1.41 | 1 | 1 | **HIT** | YES | 0.41 | PLAYED |
| Nico Sturm ★ | T24H | 0.82 | 1 | 0 | **MISS** | NO | 0.82 | PLAYED |
| Olli Maatta ★ | T24H | 0.98 | 1 | 1 | **HIT** | YES | 0.02 | PLAYED |
| Pierre-Luc Dubois ★ | T24H | 1.50 | 1 | 3 | **MISS** | YES | 1.50 | PLAYED |
| Player 8475718 ★ | T24H | 0.11 | 0 | — | **DNP** | — | — | DNP |
| Player 8477380 ★ | T24H | 0.20 | 0 | — | **DNP** | — | — | DNP |
| Player 8482094 ★ | T24H | 0.16 | 0 | — | **DNP** | — | — | DNP |
| Quinn Hughes ★ | T24H | 2.86 | 3 | 3 | **HIT** | YES | 0.14 | PLAYED |
| Ryan Hartman ★ | T24H | 1.21 | 1 | 3 | **MISS** | YES | 1.79 | PLAYED |
| Ryan Leonard ★ | T24H | 1.96 | 2 | 3 | **MISS** | YES | 1.04 | PLAYED |
| Timothy Liljegren ★ | T24H | 0.83 | 1 | 0 | **MISS** | NO | 0.83 | PLAYED |
| Tom Wilson ★ | T24H | 2.17 | 2 | 2 | **HIT** | YES | 0.17 | PLAYED |
| Tyler Pitlick ★ | T24H | 0.87 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Vincent Desharnais ★ | T24H | 0.18 | 0 | — | **DNP** | — | — | DNP |
| Yakov Trenin ★ | T24H | 1.02 | 1 | 1 | **HIT** | YES | 0.02 | PLAYED |
| Zach Bogosian ★ | T24H | 0.92 | 1 | 0 | **MISS** | NO | 0.92 | PLAYED |

## 2026-11-01 — PHI vs UTA

Original snapshots: 135 (T24H=45, T90=45, T30=45); unique players=45. Verified played snapshot rows=99; DNP rows=36; unverified=0. **Exact rounded match among played snapshots: 45/99**. **Latest-snapshot exact matches: 15/33**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Alex Bump | T24H | 1.64 | 2 | — | **DNP** | — | — | DNP |
| Alex Bump | T90 | 1.66 | 2 | — | **DNP** | — | — | DNP |
| Alex Bump ★ | T30 | 1.66 | 2 | — | **DNP** | — | — | DNP |
| Anders Lee | T24H | 1.52 | 2 | 0 | **MISS** | NO | 1.52 | PLAYED |
| Anders Lee | T90 | 1.52 | 2 | 0 | **MISS** | NO | 1.52 | PLAYED |
| Anders Lee ★ | T30 | 1.52 | 2 | 0 | **MISS** | NO | 1.52 | PLAYED |
| Andrew Peeke | T24H | 0.99 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Andrew Peeke | T90 | 0.99 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Andrew Peeke ★ | T30 | 0.99 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Barrett Hayton | T24H | 1.70 | 2 | 1 | **MISS** | NO | 0.70 | PLAYED |
| Barrett Hayton | T90 | 1.70 | 2 | 1 | **MISS** | NO | 0.70 | PLAYED |
| Barrett Hayton ★ | T30 | 1.70 | 2 | 1 | **MISS** | NO | 0.70 | PLAYED |
| Cam York | T24H | 1.11 | 1 | 0 | **MISS** | NO | 1.11 | PLAYED |
| Cam York | T90 | 1.12 | 1 | 0 | **MISS** | NO | 1.12 | PLAYED |
| Cam York ★ | T30 | 1.12 | 1 | 0 | **MISS** | NO | 1.12 | PLAYED |
| Christian Dvorak | T24H | 1.70 | 2 | 1 | **MISS** | NO | 0.70 | PLAYED |
| Christian Dvorak | T90 | 1.70 | 2 | 1 | **MISS** | NO | 0.70 | PLAYED |
| Christian Dvorak ★ | T30 | 1.70 | 2 | 1 | **MISS** | NO | 0.70 | PLAYED |
| Clayton Keller | T24H | 2.26 | 2 | 4 | **MISS** | YES | 1.74 | PLAYED |
| Clayton Keller | T90 | 2.26 | 2 | 4 | **MISS** | YES | 1.74 | PLAYED |
| Clayton Keller ★ | T30 | 2.26 | 2 | 4 | **MISS** | YES | 1.74 | PLAYED |
| David Jiricek | T24H | 0.16 | 0 | — | **DNP** | — | — | DNP |
| David Jiricek | T90 | 0.14 | 0 | — | **DNP** | — | — | DNP |
| David Jiricek ★ | T30 | 0.14 | 0 | — | **DNP** | — | — | DNP |
| Denver Barkey | T24H | 1.36 | 1 | 1 | **HIT** | YES | 0.36 | PLAYED |
| Denver Barkey | T90 | 1.36 | 1 | 1 | **HIT** | YES | 0.36 | PLAYED |
| Denver Barkey ★ | T30 | 1.36 | 1 | 1 | **HIT** | YES | 0.36 | PLAYED |
| Dmitri Simashev | T24H | 0.91 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Dmitri Simashev | T90 | 0.91 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Dmitri Simashev ★ | T30 | 0.91 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Dylan Guenther | T24H | 2.21 | 2 | 4 | **MISS** | YES | 1.79 | PLAYED |
| Dylan Guenther | T90 | 2.21 | 2 | 4 | **MISS** | YES | 1.79 | PLAYED |
| Dylan Guenther ★ | T30 | 2.21 | 2 | 4 | **MISS** | YES | 1.79 | PLAYED |
| Jack McBain | T24H | 0.94 | 1 | 1 | **HIT** | YES | 0.06 | PLAYED |
| Jack McBain | T90 | 0.94 | 1 | 1 | **HIT** | YES | 0.06 | PLAYED |
| Jack McBain ★ | T30 | 0.94 | 1 | 1 | **HIT** | YES | 0.06 | PLAYED |
| Jack Studnicka | T24H | 0.10 | 0 | — | **DNP** | — | — | DNP |
| Jack Studnicka | T90 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Jack Studnicka ★ | T30 | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Jamie Drysdale | T24H | 2.00 | 2 | 0 | **MISS** | NO | 2.00 | PLAYED |
| Jamie Drysdale | T90 | 2.00 | 2 | 0 | **MISS** | NO | 2.00 | PLAYED |
| Jamie Drysdale ★ | T30 | 2.00 | 2 | 0 | **MISS** | NO | 2.00 | PLAYED |
| John Marino | T24H | 0.18 | 0 | — | **DNP** | — | — | DNP |
| John Marino | T90 | 0.16 | 0 | — | **DNP** | — | — | DNP |
| John Marino ★ | T30 | 0.16 | 0 | — | **DNP** | — | — | DNP |
| Kailer Yamamoto | T24H | 1.67 | 2 | — | **DNP** | — | — | DNP |
| Kailer Yamamoto | T90 | 1.67 | 2 | — | **DNP** | — | — | DNP |
| Kailer Yamamoto ★ | T30 | 1.67 | 2 | — | **DNP** | — | — | DNP |
| Kevin Stenlund | T24H | 1.00 | 1 | 0 | **MISS** | NO | 1.00 | PLAYED |
| Kevin Stenlund | T90 | 1.00 | 1 | 0 | **MISS** | NO | 1.00 | PLAYED |
| Kevin Stenlund ★ | T30 | 1.00 | 1 | 0 | **MISS** | NO | 1.00 | PLAYED |
| Lawson Crouse | T24H | 1.16 | 1 | 1 | **HIT** | YES | 0.16 | PLAYED |
| Lawson Crouse | T90 | 1.16 | 1 | 1 | **HIT** | YES | 0.16 | PLAYED |
| Lawson Crouse ★ | T30 | 1.16 | 1 | 1 | **HIT** | YES | 0.16 | PLAYED |
| Liam O'Brien | T24H | 0.29 | 0 | 0 | **HIT** | TRIVIAL | 0.29 | PLAYED |
| Liam O'Brien | T90 | 0.28 | 0 | 0 | **HIT** | TRIVIAL | 0.28 | PLAYED |
| Liam O'Brien ★ | T30 | 0.28 | 0 | 0 | **HIT** | TRIVIAL | 0.28 | PLAYED |
| Logan Cooley | T24H | 2.19 | 2 | 2 | **HIT** | YES | 0.19 | PLAYED |
| Logan Cooley | T90 | 2.19 | 2 | 2 | **HIT** | YES | 0.19 | PLAYED |
| Logan Cooley ★ | T30 | 2.19 | 2 | 2 | **HIT** | YES | 0.19 | PLAYED |
| MacKenzie Weegar | T24H | 1.73 | 2 | 0 | **MISS** | NO | 1.73 | PLAYED |
| MacKenzie Weegar | T90 | 1.74 | 2 | 0 | **MISS** | NO | 1.74 | PLAYED |
| MacKenzie Weegar ★ | T30 | 1.74 | 2 | 0 | **MISS** | NO | 1.74 | PLAYED |
| Matvei Michkov | T24H | 1.90 | 2 | 2 | **HIT** | YES | 0.10 | PLAYED |
| Matvei Michkov | T90 | 1.91 | 2 | 2 | **HIT** | YES | 0.09 | PLAYED |
| Matvei Michkov ★ | T30 | 1.91 | 2 | 2 | **HIT** | YES | 0.09 | PLAYED |
| Michael Bunting | T24H | 0.45 | 0 | — | **DNP** | — | — | DNP |
| Michael Bunting | T90 | 0.43 | 0 | — | **DNP** | — | — | DNP |
| Michael Bunting ★ | T30 | 0.43 | 0 | — | **DNP** | — | — | DNP |
| Michael Carcone | T24H | 0.09 | 0 | 0 | **HIT** | TRIVIAL | 0.09 | PLAYED |
| Michael Carcone | T90 | 0.08 | 0 | 0 | **HIT** | TRIVIAL | 0.08 | PLAYED |
| Michael Carcone ★ | T30 | 0.08 | 0 | 0 | **HIT** | TRIVIAL | 0.08 | PLAYED |
| Mikhail Sergachev | T24H | 2.26 | 2 | 2 | **HIT** | YES | 0.26 | PLAYED |
| Mikhail Sergachev | T90 | 2.26 | 2 | 2 | **HIT** | YES | 0.26 | PLAYED |
| Mikhail Sergachev ★ | T30 | 2.26 | 2 | 2 | **HIT** | YES | 0.26 | PLAYED |
| Nate Schmidt | T24H | 1.11 | 1 | 0 | **MISS** | NO | 1.11 | PLAYED |
| Nate Schmidt | T90 | 1.11 | 1 | 0 | **MISS** | NO | 1.11 | PLAYED |
| Nate Schmidt ★ | T30 | 1.11 | 1 | 0 | **MISS** | NO | 1.11 | PLAYED |
| Nick DeSimone | T24H | 0.23 | 0 | — | **DNP** | — | — | DNP |
| Nick DeSimone | T90 | 0.22 | 0 | — | **DNP** | — | — | DNP |
| Nick DeSimone ★ | T30 | 0.22 | 0 | — | **DNP** | — | — | DNP |
| Nick Schmaltz | T24H | 2.01 | 2 | 3 | **MISS** | YES | 0.99 | PLAYED |
| Nick Schmaltz | T90 | 2.01 | 2 | 3 | **MISS** | YES | 0.99 | PLAYED |
| Nick Schmaltz ★ | T30 | 2.01 | 2 | 3 | **MISS** | YES | 0.99 | PLAYED |
| Nick Seeler | T24H | 1.01 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Nick Seeler | T90 | 1.01 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Nick Seeler ★ | T30 | 1.01 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Noah Cates | T24H | 1.10 | 1 | 1 | **HIT** | YES | 0.10 | PLAYED |
| Noah Cates | T90 | 1.10 | 1 | 1 | **HIT** | YES | 0.10 | PLAYED |
| Noah Cates ★ | T30 | 1.10 | 1 | 1 | **HIT** | YES | 0.10 | PLAYED |
| Noel Acciari | T24H | 1.03 | 1 | 2 | **MISS** | YES | 0.97 | PLAYED |
| Noel Acciari | T90 | 1.04 | 1 | 2 | **MISS** | YES | 0.96 | PLAYED |
| Noel Acciari ★ | T30 | 1.04 | 1 | 2 | **MISS** | YES | 0.96 | PLAYED |
| Oliver Bonk | T24H | 1.12 | 1 | 2 | **MISS** | YES | 0.88 | PLAYED |
| Oliver Bonk | T90 | 1.13 | 1 | 2 | **MISS** | YES | 0.87 | PLAYED |
| Oliver Bonk ★ | T30 | 1.13 | 1 | 2 | **MISS** | YES | 0.87 | PLAYED |
| Owen Tippett | T24H | 0.24 | 0 | 1 | **MISS** | TRIVIAL | 0.76 | PLAYED |
| Owen Tippett | T90 | 0.21 | 0 | 1 | **MISS** | TRIVIAL | 0.79 | PLAYED |
| Owen Tippett ★ | T30 | 0.21 | 0 | 1 | **MISS** | TRIVIAL | 0.79 | PLAYED |
| Player 8475253 | T24H | 0.15 | 0 | — | **DNP** | — | — | DNP |
| Player 8475253 | T90 | 0.13 | 0 | — | **DNP** | — | — | DNP |
| Player 8475253 ★ | T30 | 0.13 | 0 | — | **DNP** | — | — | DNP |
| Player 8479336 | T24H | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Player 8479336 | T90 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Player 8479336 ★ | T30 | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Player 8481848 | T24H | 0.72 | 1 | — | **DNP** | — | — | DNP |
| Player 8481848 | T90 | 0.73 | 1 | — | **DNP** | — | — | DNP |
| Player 8481848 ★ | T30 | 0.73 | 1 | — | **DNP** | — | — | DNP |
| Player 8484388 | T24H | 0.88 | 1 | — | **DNP** | — | — | DNP |
| Player 8484388 | T90 | 0.88 | 1 | — | **DNP** | — | — | DNP |
| Player 8484388 ★ | T30 | 0.88 | 1 | — | **DNP** | — | — | DNP |
| Porter Martone | T24H | 1.79 | 2 | 2 | **HIT** | YES | 0.21 | PLAYED |
| Porter Martone | T90 | 1.80 | 2 | 2 | **HIT** | YES | 0.20 | PLAYED |
| Porter Martone ★ | T30 | 1.80 | 2 | 2 | **HIT** | YES | 0.20 | PLAYED |
| Rasmus Ristolainen | T24H | 0.30 | 0 | — | **DNP** | — | — | DNP |
| Rasmus Ristolainen | T90 | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Rasmus Ristolainen ★ | T30 | 0.28 | 0 | — | **DNP** | — | — | DNP |
| Sean Couturier | T24H | 1.38 | 1 | 0 | **MISS** | NO | 1.38 | PLAYED |
| Sean Couturier | T90 | 1.38 | 1 | 0 | **MISS** | NO | 1.38 | PLAYED |
| Sean Couturier ★ | T30 | 1.38 | 1 | 0 | **MISS** | NO | 1.38 | PLAYED |
| Simon Benoit | T24H | 0.17 | 0 | 1 | **MISS** | TRIVIAL | 0.83 | PLAYED |
| Simon Benoit | T90 | 0.16 | 0 | 1 | **MISS** | TRIVIAL | 0.84 | PLAYED |
| Simon Benoit ★ | T30 | 0.16 | 0 | 1 | **MISS** | TRIVIAL | 0.84 | PLAYED |
| Travis Sanheim | T24H | 1.78 | 2 | 2 | **HIT** | YES | 0.22 | PLAYED |
| Travis Sanheim | T90 | 1.77 | 2 | 2 | **HIT** | YES | 0.23 | PLAYED |
| Travis Sanheim ★ | T30 | 1.77 | 2 | 2 | **HIT** | YES | 0.23 | PLAYED |
| Trevor Zegras | T24H | 2.75 | 3 | 1 | **MISS** | NO | 1.75 | PLAYED |
| Trevor Zegras | T90 | 2.76 | 3 | 1 | **MISS** | NO | 1.76 | PLAYED |
| Trevor Zegras ★ | T30 | 2.76 | 3 | 1 | **MISS** | NO | 1.76 | PLAYED |
| Tyson Foerster | T24H | 2.06 | 2 | 1 | **MISS** | NO | 1.06 | PLAYED |
| Tyson Foerster | T90 | 2.07 | 2 | 1 | **MISS** | NO | 1.07 | PLAYED |
| Tyson Foerster ★ | T30 | 2.07 | 2 | 1 | **MISS** | NO | 1.07 | PLAYED |
| Vincent Trocheck | T24H | 1.94 | 2 | 2 | **HIT** | YES | 0.06 | PLAYED |
| Vincent Trocheck | T90 | 1.95 | 2 | 2 | **HIT** | YES | 0.05 | PLAYED |
| Vincent Trocheck ★ | T30 | 1.95 | 2 | 2 | **HIT** | YES | 0.05 | PLAYED |

## 2026-11-01 — EDM vs NYR

Original snapshots: 44 (T24H=44, T90=0, T30=0); unique players=44. Verified played snapshot rows=35; DNP rows=9; unverified=0. **Exact rounded match among played snapshots: 8/35**. **Latest-snapshot exact matches: 8/35**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adam Fox ★ | T24H | 2.05 | 2 | 2 | **HIT** | YES | 0.05 | PLAYED |
| Alberts Smits ★ | T24H | 0.75 | 1 | 0 | **MISS** | NO | 0.75 | PLAYED |
| Alex Formenton ★ | T24H | 1.09 | 1 | 3 | **MISS** | YES | 1.91 | PLAYED |
| Alexis Lafrenière ★ | T24H | 2.69 | 3 | 4 | **MISS** | YES | 1.31 | PLAYED |
| Braden Schneider ★ | T24H | 1.13 | 1 | 3 | **MISS** | YES | 1.87 | PLAYED |
| Colton Dach ★ | T24H | 1.48 | 1 | 4 | **MISS** | YES | 2.52 | PLAYED |
| Connor McDavid ★ | T24H | 2.99 | 3 | 6 | **MISS** | YES | 3.01 | PLAYED |
| Connor Murphy ★ | T24H | 1.24 | 1 | 0 | **MISS** | NO | 1.24 | PLAYED |
| Eeli Tolvanen ★ | T24H | 1.06 | 1 | 2 | **MISS** | YES | 0.94 | PLAYED |
| Evan Bouchard ★ | T24H | 2.46 | 2 | 3 | **MISS** | YES | 0.54 | PLAYED |
| Filip Hallander ★ | T24H | 0.20 | 0 | 1 | **MISS** | TRIVIAL | 0.80 | PLAYED |
| Gabe Perreault ★ | T24H | 2.18 | 2 | 2 | **HIT** | YES | 0.18 | PLAYED |
| Isaac Howard ★ | T24H | 0.78 | 1 | — | **DNP** | — | — | DNP |
| J.T. Miller ★ | T24H | 2.20 | 2 | 2 | **HIT** | YES | 0.20 | PLAYED |
| Jake Walman ★ | T24H | 0.25 | 0 | — | **DNP** | — | — | DNP |
| Jason Dickinson ★ | T24H | 1.00 | 1 | 0 | **MISS** | NO | 1.00 | PLAYED |
| Kasperi Kapanen ★ | T24H | 1.72 | 2 | 2 | **HIT** | YES | 0.28 | PLAYED |
| Leon Draisaitl ★ | T24H | 3.06 | 3 | 3 | **HIT** | YES | 0.06 | PLAYED |
| Luke Glendening ★ | T24H | 0.65 | 1 | 0 | **MISS** | NO | 0.65 | PLAYED |
| Marcus Pettersson ★ | T24H | 1.16 | 1 | 0 | **MISS** | NO | 1.16 | PLAYED |
| Mathieu Joseph ★ | T24H | 1.10 | 1 | 0 | **MISS** | NO | 1.10 | PLAYED |
| Matt Rempe ★ | T24H | 0.07 | 0 | — | **DNP** | — | — | DNP |
| Mattias Ekholm ★ | T24H | 1.01 | 1 | 1 | **HIT** | YES | 0.01 | PLAYED |
| Max Jones ★ | T24H | 0.15 | 0 | — | **DNP** | — | — | DNP |
| Mika Zibanejad ★ | T24H | 2.60 | 3 | 5 | **MISS** | YES | 2.40 | PLAYED |
| Noah Laba ★ | T24H | 1.16 | 1 | 0 | **MISS** | NO | 1.16 | PLAYED |
| Oliver Bjorkstrand ★ | T24H | 1.38 | 1 | 1 | **HIT** | YES | 0.38 | PLAYED |
| Owen Michaels ★ | T24H | 0.93 | 1 | 0 | **MISS** | NO | 0.93 | PLAYED |
| Pavel Dorofeyev ★ | T24H | 2.58 | 3 | 1 | **MISS** | NO | 1.58 | PLAYED |
| Player 8475413 ★ | T24H | 0.17 | 0 | — | **DNP** | — | — | DNP |
| Player 8482877 ★ | T24H | 0.11 | 0 | — | **DNP** | — | — | DNP |
| Player 8484509 ★ | T24H | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Ryan Nugent-Hopkins ★ | T24H | 2.48 | 2 | 0 | **MISS** | NO | 2.48 | PLAYED |
| Ryan Shea ★ | T24H | 1.35 | 1 | 0 | **MISS** | NO | 1.35 | PLAYED |
| Sean Durzi ★ | T24H | 1.14 | 1 | — | **DNP** | — | — | DNP |
| Shakir Mukhamadullin ★ | T24H | 0.83 | 1 | 0 | **MISS** | NO | 0.83 | PLAYED |
| Taylor Raddysh ★ | T24H | 0.80 | 1 | 0 | **MISS** | NO | 0.80 | PLAYED |
| Trent Frederic ★ | T24H | 0.91 | 1 | 1 | **HIT** | YES | 0.09 | PLAYED |
| Ty Emberson ★ | T24H | 0.70 | 1 | 0 | **MISS** | NO | 0.70 | PLAYED |
| Tye Kartye ★ | T24H | 1.60 | 2 | 0 | **MISS** | NO | 1.60 | PLAYED |
| Vasily Podkolzin ★ | T24H | 1.74 | 2 | 1 | **MISS** | NO | 0.74 | PLAYED |
| Vladislav Gavrikov ★ | T24H | 1.50 | 2 | 3 | **MISS** | YES | 1.50 | PLAYED |
| Will Cuylle ★ | T24H | 1.97 | 2 | 0 | **MISS** | NO | 1.97 | PLAYED |
| Zach Hyman ★ | T24H | 0.47 | 0 | — | **DNP** | — | — | DNP |

## 2026-11-01 — ANA vs OTT

Original snapshots: 129 (T24H=43, T90=43, T30=43); unique players=43. Verified played snapshot rows=102; DNP rows=27; unverified=0. **Exact rounded match among played snapshots: 30/102**. **Latest-snapshot exact matches: 10/34**.

| Player | Cutoff | Model shots | Rounded | Final shots | Exact? | Reached? | Error | Participation |
|---|---:|---:|---:|---:|---|---|---:|---|
| A.J. Greer | T24H | 1.25 | 1 | 2 | **MISS** | YES | 0.75 | PLAYED |
| A.J. Greer | T90 | 1.26 | 1 | 2 | **MISS** | YES | 0.74 | PLAYED |
| A.J. Greer ★ | T30 | 1.26 | 1 | 2 | **MISS** | YES | 0.74 | PLAYED |
| Alex Killorn | T24H | 1.50 | 2 | 0 | **MISS** | NO | 1.50 | PLAYED |
| Alex Killorn | T90 | 1.50 | 1 | 0 | **MISS** | NO | 1.50 | PLAYED |
| Alex Killorn ★ | T30 | 1.50 | 1 | 0 | **MISS** | NO | 1.50 | PLAYED |
| Andre Burakovsky | T24H | 0.27 | 0 | — | **DNP** | — | — | DNP |
| Andre Burakovsky | T90 | 0.26 | 0 | — | **DNP** | — | — | DNP |
| Andre Burakovsky ★ | T30 | 0.26 | 0 | — | **DNP** | — | — | DNP |
| Artem Zub | T24H | 1.12 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Artem Zub | T90 | 1.12 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Artem Zub ★ | T30 | 1.12 | 1 | 1 | **HIT** | YES | 0.12 | PLAYED |
| Beckett Sennecke | T24H | 2.39 | 2 | 3 | **MISS** | YES | 0.61 | PLAYED |
| Beckett Sennecke | T90 | 2.38 | 2 | 3 | **MISS** | YES | 0.62 | PLAYED |
| Beckett Sennecke ★ | T30 | 2.38 | 2 | 3 | **MISS** | YES | 0.62 | PLAYED |
| Carter Yakemchuk | T24H | 0.34 | 0 | — | **DNP** | — | — | DNP |
| Carter Yakemchuk | T90 | 0.32 | 0 | — | **DNP** | — | — | DNP |
| Carter Yakemchuk ★ | T30 | 0.32 | 0 | — | **DNP** | — | — | DNP |
| Claude Giroux | T24H | 1.51 | 2 | 3 | **MISS** | YES | 1.49 | PLAYED |
| Claude Giroux | T90 | 1.51 | 2 | 3 | **MISS** | YES | 1.49 | PLAYED |
| Claude Giroux ★ | T30 | 1.51 | 2 | 3 | **MISS** | YES | 1.49 | PLAYED |
| Cutter Gauthier | T24H | 3.50 | 3 | 5 | **MISS** | YES | 1.50 | PLAYED |
| Cutter Gauthier | T90 | 3.50 | 4 | 5 | **MISS** | YES | 1.50 | PLAYED |
| Cutter Gauthier ★ | T30 | 3.50 | 4 | 5 | **MISS** | YES | 1.50 | PLAYED |
| Drake Batherson | T24H | 2.30 | 2 | 1 | **MISS** | NO | 1.30 | PLAYED |
| Drake Batherson | T90 | 2.30 | 2 | 1 | **MISS** | NO | 1.30 | PLAYED |
| Drake Batherson ★ | T30 | 2.30 | 2 | 1 | **MISS** | NO | 1.30 | PLAYED |
| Drew Helleson | T24H | 0.36 | 0 | 1 | **MISS** | TRIVIAL | 0.64 | PLAYED |
| Drew Helleson | T90 | 0.34 | 0 | 1 | **MISS** | TRIVIAL | 0.66 | PLAYED |
| Drew Helleson ★ | T30 | 0.34 | 0 | 1 | **MISS** | TRIVIAL | 0.66 | PLAYED |
| Dylan Cozens | T24H | 2.18 | 2 | 0 | **MISS** | NO | 2.18 | PLAYED |
| Dylan Cozens | T90 | 2.18 | 2 | 0 | **MISS** | NO | 2.18 | PLAYED |
| Dylan Cozens ★ | T30 | 2.18 | 2 | 0 | **MISS** | NO | 2.18 | PLAYED |
| Fabian Zetterlund | T24H | 1.94 | 2 | 3 | **MISS** | YES | 1.06 | PLAYED |
| Fabian Zetterlund | T90 | 1.94 | 2 | 3 | **MISS** | YES | 1.06 | PLAYED |
| Fabian Zetterlund ★ | T30 | 1.94 | 2 | 3 | **MISS** | YES | 1.06 | PLAYED |
| Frank Vatrano | T24H | 0.94 | 1 | — | **DNP** | — | — | DNP |
| Frank Vatrano | T90 | 0.94 | 1 | — | **DNP** | — | — | DNP |
| Frank Vatrano ★ | T30 | 0.94 | 1 | — | **DNP** | — | — | DNP |
| Hayden Hodgson | T24H | 0.21 | 0 | — | **DNP** | — | — | DNP |
| Hayden Hodgson | T90 | 0.20 | 0 | — | **DNP** | — | — | DNP |
| Hayden Hodgson ★ | T30 | 0.20 | 0 | — | **DNP** | — | — | DNP |
| Jackson LaCombe | T24H | 2.11 | 2 | 2 | **HIT** | YES | 0.11 | PLAYED |
| Jackson LaCombe | T90 | 2.11 | 2 | 2 | **HIT** | YES | 0.11 | PLAYED |
| Jackson LaCombe ★ | T30 | 2.11 | 2 | 2 | **HIT** | YES | 0.11 | PLAYED |
| Jake Sanderson | T24H | 2.21 | 2 | 1 | **MISS** | NO | 1.21 | PLAYED |
| Jake Sanderson | T90 | 2.23 | 2 | 1 | **MISS** | NO | 1.23 | PLAYED |
| Jake Sanderson ★ | T30 | 2.23 | 2 | 1 | **MISS** | NO | 1.23 | PLAYED |
| Jeff Malott | T24H | 1.03 | 1 | 3 | **MISS** | YES | 1.97 | PLAYED |
| Jeff Malott | T90 | 1.04 | 1 | 3 | **MISS** | YES | 1.96 | PLAYED |
| Jeff Malott ★ | T30 | 1.04 | 1 | 3 | **MISS** | YES | 1.96 | PLAYED |
| Jordan Spence | T24H | 1.09 | 1 | 2 | **MISS** | YES | 0.91 | PLAYED |
| Jordan Spence | T90 | 1.09 | 1 | 2 | **MISS** | YES | 0.91 | PLAYED |
| Jordan Spence ★ | T30 | 1.09 | 1 | 2 | **MISS** | YES | 0.91 | PLAYED |
| Judd Caulfield | T24H | 1.23 | 1 | 3 | **MISS** | YES | 1.77 | PLAYED |
| Judd Caulfield | T90 | 1.24 | 1 | 3 | **MISS** | YES | 1.76 | PLAYED |
| Judd Caulfield ★ | T30 | 1.24 | 1 | 3 | **MISS** | YES | 1.76 | PLAYED |
| Leo Carlsson | T24H | 2.34 | 2 | 2 | **HIT** | YES | 0.34 | PLAYED |
| Leo Carlsson | T90 | 2.34 | 2 | 2 | **HIT** | YES | 0.34 | PLAYED |
| Leo Carlsson ★ | T30 | 2.34 | 2 | 2 | **HIT** | YES | 0.34 | PLAYED |
| Michael Amadio | T24H | 1.29 | 1 | 2 | **MISS** | YES | 0.71 | PLAYED |
| Michael Amadio | T90 | 1.29 | 1 | 2 | **MISS** | YES | 0.71 | PLAYED |
| Michael Amadio ★ | T30 | 1.29 | 1 | 2 | **MISS** | YES | 0.71 | PLAYED |
| Mikael Granlund | T24H | 2.62 | 3 | 2 | **MISS** | NO | 0.62 | PLAYED |
| Mikael Granlund | T90 | 2.62 | 3 | 2 | **MISS** | NO | 0.62 | PLAYED |
| Mikael Granlund ★ | T30 | 2.62 | 3 | 2 | **MISS** | NO | 0.62 | PLAYED |
| Nick Cousins | T24H | 0.82 | 1 | 0 | **MISS** | NO | 0.82 | PLAYED |
| Nick Cousins | T90 | 0.82 | 1 | 0 | **MISS** | NO | 0.82 | PLAYED |
| Nick Cousins ★ | T30 | 0.82 | 1 | 0 | **MISS** | NO | 0.82 | PLAYED |
| Nick Jensen | T24H | 0.69 | 1 | — | **DNP** | — | — | DNP |
| Nick Jensen | T90 | 0.69 | 1 | — | **DNP** | — | — | DNP |
| Nick Jensen ★ | T30 | 0.69 | 1 | — | **DNP** | — | — | DNP |
| Nikita Nesterenko | T24H | 0.38 | 0 | 2 | **MISS** | TRIVIAL | 1.62 | PLAYED |
| Nikita Nesterenko | T90 | 0.36 | 0 | 2 | **MISS** | TRIVIAL | 1.64 | PLAYED |
| Nikita Nesterenko ★ | T30 | 0.36 | 0 | 2 | **MISS** | TRIVIAL | 1.64 | PLAYED |
| Nikolas Matinpalo | T24H | 0.74 | 1 | 2 | **MISS** | YES | 1.26 | PLAYED |
| Nikolas Matinpalo | T90 | 0.74 | 1 | 2 | **MISS** | YES | 1.26 | PLAYED |
| Nikolas Matinpalo ★ | T30 | 0.74 | 1 | 2 | **MISS** | YES | 1.26 | PLAYED |
| Noah Warren | T24H | 0.96 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Noah Warren | T90 | 0.96 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Noah Warren ★ | T30 | 0.96 | 1 | 1 | **HIT** | YES | 0.04 | PLAYED |
| Pavel Mintyukov | T24H | 0.14 | 0 | 0 | **HIT** | TRIVIAL | 0.14 | PLAYED |
| Pavel Mintyukov | T90 | 0.13 | 0 | 0 | **HIT** | TRIVIAL | 0.13 | PLAYED |
| Pavel Mintyukov ★ | T30 | 0.13 | 0 | 0 | **HIT** | TRIVIAL | 0.13 | PLAYED |
| Player 8480075 | T24H | 0.06 | 0 | — | **DNP** | — | — | DNP |
| Player 8480075 | T90 | 0.05 | 0 | — | **DNP** | — | — | DNP |
| Player 8480075 ★ | T30 | 0.05 | 0 | — | **DNP** | — | — | DNP |
| Player 8481577 | T24H | 0.86 | 1 | 1 | **HIT** | YES | 0.14 | PLAYED |
| Player 8481577 | T90 | 0.87 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Player 8481577 ★ | T30 | 0.87 | 1 | 1 | **HIT** | YES | 0.13 | PLAYED |
| Ridly Greig | T24H | 1.55 | 2 | 0 | **MISS** | NO | 1.55 | PLAYED |
| Ridly Greig | T90 | 1.55 | 2 | 0 | **MISS** | NO | 1.55 | PLAYED |
| Ridly Greig ★ | T30 | 1.55 | 2 | 0 | **MISS** | NO | 1.55 | PLAYED |
| Ryan Poehling | T24H | 0.09 | 0 | — | **DNP** | — | — | DNP |
| Ryan Poehling | T90 | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Ryan Poehling ★ | T30 | 0.08 | 0 | — | **DNP** | — | — | DNP |
| Sam Colangelo | T24H | 1.27 | 1 | 1 | **HIT** | YES | 0.27 | PLAYED |
| Sam Colangelo | T90 | 1.27 | 1 | 1 | **HIT** | YES | 0.27 | PLAYED |
| Sam Colangelo ★ | T30 | 1.27 | 1 | 1 | **HIT** | YES | 0.27 | PLAYED |
| Shane Pinto | T24H | 2.08 | 2 | 1 | **MISS** | NO | 1.08 | PLAYED |
| Shane Pinto | T90 | 2.08 | 2 | 1 | **MISS** | NO | 1.08 | PLAYED |
| Shane Pinto ★ | T30 | 2.08 | 2 | 1 | **MISS** | NO | 1.08 | PLAYED |
| Stephen Halliday | T24H | 1.55 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Stephen Halliday | T90 | 1.55 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Stephen Halliday ★ | T30 | 1.55 | 2 | 2 | **HIT** | YES | 0.45 | PLAYED |
| Thomas Chabot | T24H | 1.47 | 1 | 0 | **MISS** | NO | 1.47 | PLAYED |
| Thomas Chabot | T90 | 1.46 | 1 | 0 | **MISS** | NO | 1.46 | PLAYED |
| Thomas Chabot ★ | T30 | 1.46 | 1 | 0 | **MISS** | NO | 1.46 | PLAYED |
| Tim Stützle | T24H | 2.78 | 3 | 1 | **MISS** | NO | 1.78 | PLAYED |
| Tim Stützle | T90 | 2.76 | 3 | 1 | **MISS** | NO | 1.76 | PLAYED |
| Tim Stützle ★ | T30 | 2.76 | 3 | 1 | **MISS** | NO | 1.76 | PLAYED |
| Tim Washe | T24H | 1.46 | 1 | 1 | **HIT** | YES | 0.46 | PLAYED |
| Tim Washe | T90 | 1.46 | 1 | 1 | **HIT** | YES | 0.46 | PLAYED |
| Tim Washe ★ | T30 | 1.46 | 1 | 1 | **HIT** | YES | 0.46 | PLAYED |
| Travis Mitchell | T24H | 0.93 | 1 | 0 | **MISS** | NO | 0.93 | PLAYED |
| Travis Mitchell | T90 | 0.93 | 1 | 0 | **MISS** | NO | 0.93 | PLAYED |
| Travis Mitchell ★ | T30 | 0.93 | 1 | 0 | **MISS** | NO | 0.93 | PLAYED |
| Tristan Luneau | T24H | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Tristan Luneau | T90 | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Tristan Luneau ★ | T30 | 1.30 | 1 | 1 | **HIT** | YES | 0.30 | PLAYED |
| Tyler Kleven | T24H | 1.19 | 1 | 2 | **MISS** | YES | 0.81 | PLAYED |
| Tyler Kleven | T90 | 1.18 | 1 | 2 | **MISS** | YES | 0.82 | PLAYED |
| Tyler Kleven ★ | T30 | 1.18 | 1 | 2 | **MISS** | YES | 0.82 | PLAYED |
| Tyson Hinds | T24H | 0.95 | 1 | — | **DNP** | — | — | DNP |
| Tyson Hinds | T90 | 0.95 | 1 | — | **DNP** | — | — | DNP |
| Tyson Hinds ★ | T30 | 0.95 | 1 | — | **DNP** | — | — | DNP |
| Warren Foegele | T24H | 0.32 | 0 | — | **DNP** | — | — | DNP |
| Warren Foegele | T90 | 0.30 | 0 | — | **DNP** | — | — | DNP |
| Warren Foegele ★ | T30 | 0.30 | 0 | — | **DNP** | — | — | DNP |
