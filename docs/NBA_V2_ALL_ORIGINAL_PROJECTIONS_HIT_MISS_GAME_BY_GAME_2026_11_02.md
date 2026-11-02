# NBA V2 — ALL original player projections game by game with HIT / MISS

**Not model targets.** This uses only each player's frozen, pregame **numerical point forecasts** for PTS, REB, AST, 3PM, and minutes, compared with independent final boxscore counts. No sportsbook lines, model-selected milestone, or retrospective replacement of misses.

**Exact HIT** = verified final equals the original numerical projection rounded to whole count (**0.5 rounds down**, e.g., 3.5→3, 3.6→4); otherwise MISS. Every cell shows original raw numerical forecast **→** verified final **HIT/MISS**. A player scoring **more** than a projection does *not* count as an exact hit (the exact whole count was wrong). For at-least target interpretations, see the separate question of reaching/exceeding the forecast; this report intentionally evaluates numeric accuracy.

**DNP** means player did not participate; the conditional stat count must not be misgraded as zero. **UNVERIFIED** means a final player row was not fully proven. Minutes column includes conditional expected minutes and also unconditional minutes forecast, both original; HIT/MISS uses conditional minutes only when the player actually played.

**Strict exact-match inventory:** points 55/928; rebounds 146/928; assists 191/928; threes 362/928; minutes 58/928. All original rows are in the game tables; this summary is not used to select or hide anyone.

**Coverage:** 90 saved games; 1652 frozen player forecasts (including every DNP and unverified original); model version `nba-v2-rotation-and-exposure-frozen-challenger-20261019`. Source: `docs/nba_v2_rolling_player_grades.json`, authoritative frozen firstseen and independent verified final player grades.

**Source caution:** This audits **all model-generated archived V2 projections**, not a reconstructed list of which 10 predictions the frontend served. This model is not the same as a V3 research shadow.

## Cleveland Cavaliers at Philadelphia 76ers — 2026-10-22T23:00 UTC

Original player rows: 19; verified played: 13; DNP: 6; unverified: 0. Final away–home: 106–114.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Adem Bona | 5.56 → 2 **MISS** | 3.20 → 2 **MISS** | 0.90 → 0 **MISS** | 0.17 → 0 **HIT** | 16.41; 14.77 → 14 **MISS** | VERIFIED_PLAYED |
| Craig Porter Jr. | 6.49 → 0 **MISS** | 3.93 → 3 **MISS** | 2.51 → 0 **MISS** | 0.57 → 0 **MISS** | 21.18; 15.88 → 8 **MISS** | VERIFIED_PLAYED |
| Dominick Barlow | 5.61 → DNP | 4.04 → DNP | 1.36 → DNP | 0.18 → DNP | 19.82; 18.83 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Donovan Mitchell | 23.04 → 32 **MISS** | 4.59 → 10 **MISS** | 4.53 → 3 **MISS** | 1.82 → 2 **HIT** | 32.81; 26.25 → 35 **MISS** | VERIFIED_PLAYED |
| Evan Mobley | 15.73 → 18 **MISS** | 8.23 → 8 **HIT** | 3.13 → 2 **MISS** | 0.33 → 1 **MISS** | 28.48; 24.21 → 34 **MISS** | VERIFIED_PLAYED |
| Jabari Walker | 2.86 → 2 **MISS** | 1.19 → 1 **HIT** | 0.52 → 0 **MISS** | 0.28 → 0 **HIT** | 6.77; 4.74 → 4 **MISS** | VERIFIED_PLAYED |
| James Harden | 19.12 → 16 **MISS** | 3.82 → 3 **MISS** | 5.71 → 5 **MISS** | 2.64 → 3 **HIT** | 32.64; 27.75 → 33 **HIT** | VERIFIED_PLAYED |
| Jarrett Allen | 12.51 → 14 **MISS** | 6.01 → 7 **MISS** | 1.35 → 0 **MISS** | 0.33 → 0 **HIT** | 23.00; 16.10 → 28 **MISS** | VERIFIED_PLAYED |
| Jaylon Tyson | 10.08 → 3 **MISS** | 3.66 → 6 **MISS** | 2.26 → 2 **HIT** | 1.07 → 0 **MISS** | 21.36; 11.75 → 24 **MISS** | VERIFIED_PLAYED |
| Joel Embiid | 22.31 → 24 **MISS** | 7.22 → 7 **HIT** | 3.62 → 1 **MISS** | 1.69 → 1 **MISS** | 34.20; 23.94 → 34 **HIT** | VERIFIED_PLAYED |
| Justin Edwards | 5.91 → DNP | 1.12 → DNP | 0.97 → DNP | 0.87 → DNP | 13.57; 12.21 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nae'Qwan Tomlin | 7.82 → DNP | 3.79 → DNP | 1.47 → DNP | 0.77 → DNP | 19.80; 16.83 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Riley Minix | 3.84 → DNP | 1.12 → DNP | 0.78 → DNP | 0.34 → DNP | 8.88; 5.77 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Sam Merrill | 11.02 → 5 **MISS** | 3.23 → 5 **MISS** | 2.89 → 2 **MISS** | 1.68 → 1 **MISS** | 27.47; 20.60 → 24 **MISS** | VERIFIED_PLAYED |
| Thomas Bryant | 8.34 → DNP | 4.50 → DNP | 0.86 → DNP | 0.94 → DNP | 18.67; 14.00 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Tristan Enaruna | 5.16 → DNP | 1.66 → DNP | 1.08 → DNP | 0.43 → DNP | 12.40; 7.44 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Tyrese Maxey | 20.54 → 32 **MISS** | 4.27 → 3 **MISS** | 4.71 → 6 **MISS** | 1.75 → 2 **HIT** | 35.16; 31.64 → 42 **MISS** | VERIFIED_PLAYED |
| Tyrese Proctor | 8.20 → 0 **MISS** | 2.67 → 0 **MISS** | 2.15 → 0 **MISS** | 0.96 → 0 **MISS** | 15.92; 13.54 → 5 **MISS** | VERIFIED_PLAYED |
| VJ Edgecombe | 16.75 → 11 **MISS** | 6.19 → 7 **MISS** | 4.96 → 6 **MISS** | 1.81 → 1 **MISS** | 36.60; 34.77 → 33 **MISS** | VERIFIED_PLAYED |

## Denver Nuggets at Oklahoma City Thunder — 2026-10-23T01:30 UTC

Original player rows: 21; verified played: 18; DNP: 3; unverified: 0. Final away–home: 84–96.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Gordon | 13.75 → 20 **MISS** | 5.15 → 6 **MISS** | 3.02 → 1 **MISS** | 1.34 → 3 **MISS** | 29.76; 22.32 → 29 **MISS** | VERIFIED_PLAYED |
| Ajay Mitchell | 9.88 → 12 **MISS** | 2.84 → 0 **MISS** | 2.95 → 0 **MISS** | 0.81 → 0 **MISS** | 23.23; 19.74 → 23 **HIT** | VERIFIED_PLAYED |
| Alex Caruso | 5.53 → 7 **MISS** | 2.64 → 4 **MISS** | 1.65 → 5 **MISS** | 0.69 → 1 **HIT** | 16.54; 13.23 → 20 **MISS** | VERIFIED_PLAYED |
| Brooks Barnhizer | 4.46 → 0 **MISS** | 2.43 → 0 **MISS** | 1.04 → 1 **HIT** | 0.35 → 0 **HIT** | 13.74; 8.93 → 2 **MISS** | VERIFIED_PLAYED |
| Cameron Johnson | 14.53 → 5 **MISS** | 4.51 → 2 **MISS** | 3.04 → 1 **MISS** | 2.25 → 1 **MISS** | 31.36; 26.65 → 11 **MISS** | VERIFIED_PLAYED |
| Cason Wallace | 8.26 → 9 **MISS** | 2.84 → 1 **MISS** | 1.78 → 1 **MISS** | 1.24 → 3 **MISS** | 22.36; 19.01 → 24 **MISS** | VERIFIED_PLAYED |
| Chet Holmgren | 14.58 → 12 **MISS** | 7.01 → 17 **MISS** | 1.62 → 2 **HIT** | 1.25 → 0 **MISS** | 25.56; 20.44 → 28 **MISS** | VERIFIED_PLAYED |
| Christian Braun | 14.63 → 7 **MISS** | 4.83 → 6 **MISS** | 2.42 → 1 **MISS** | 1.19 → 1 **HIT** | 33.16; 28.19 → 33 **HIT** | VERIFIED_PLAYED |
| DaRon Holmes II | 1.27 → 3 **MISS** | 0.52 → 1 **HIT** | 0.24 → 1 **MISS** | 0.12 → 1 **MISS** | 3.00; 2.10 → 2 **MISS** | VERIFIED_PLAYED |
| Isaiah Hartenstein | 6.46 → 6 **HIT** | 6.90 → 6 **MISS** | 2.54 → 2 **MISS** | 0.19 → 0 **HIT** | 19.22; 15.38 → 23 **MISS** | VERIFIED_PLAYED |
| Jalen Williams | 13.84 → 21 **MISS** | 4.33 → 5 **MISS** | 4.55 → 3 **MISS** | 0.56 → 2 **MISS** | 26.83; 20.12 → 33 **MISS** | VERIFIED_PLAYED |
| Jamal Murray | 22.94 → 6 **MISS** | 4.89 → 10 **MISS** | 6.36 → 3 **MISS** | 3.58 → 0 **MISS** | 37.66; 32.01 → 37 **MISS** | VERIFIED_PLAYED |
| Jared McCain | 8.08 → 4 **MISS** | 2.02 → 0 **MISS** | 1.36 → 1 **HIT** | 0.99 → 0 **MISS** | 17.51; 16.63 → 18 **HIT** | VERIFIED_PLAYED |
| Jaylin Williams | 5.98 → 3 **MISS** | 4.66 → 7 **MISS** | 1.81 → 3 **MISS** | 1.04 → 1 **HIT** | 16.86; 14.33 → 15 **MISS** | VERIFIED_PLAYED |
| Julian Strawther | 10.17 → DNP | 2.68 → DNP | 1.73 → DNP | 1.45 → DNP | 20.12; 19.11 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kenrich Williams | 6.61 → 3 **MISS** | 3.55 → 1 **MISS** | 1.70 → 1 **MISS** | 0.63 → 1 **HIT** | 16.16; 13.74 → 6 **MISS** | VERIFIED_PLAYED |
| Nikola Jokic | 22.41 → 13 **MISS** | 11.46 → 7 **MISS** | 9.06 → 5 **MISS** | 1.02 → 1 **HIT** | 34.48; 31.03 → 35 **MISS** | VERIFIED_PLAYED |
| Nikola Topic | 7.84 → DNP | 2.69 → DNP | 4.24 → DNP | 0.70 → DNP | 21.60; 17.79 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Shai Gilgeous-Alexander | 24.66 → 17 **MISS** | 3.71 → 2 **MISS** | 5.52 → 3 **MISS** | 1.41 → 3 **MISS** | 31.09; 26.42 → 35 **MISS** | VERIFIED_PLAYED |
| Tyus Jones | 3.38 → 2 **MISS** | 1.51 → 0 **MISS** | 1.14 → 0 **MISS** | 0.43 → 0 **HIT** | 9.70; 6.30 → 10 **HIT** | VERIFIED_PLAYED |
| Zeke Nnaji | 3.28 → DNP | 1.64 → DNP | 0.88 → DNP | 0.24 → DNP | 10.03; 6.52 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Chicago Bulls at Milwaukee Bucks — 2026-10-23T20:00 UTC

Original player rows: 13; verified played: 9; DNP: 4; unverified: 0. Final away–home: 132–125.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| AJ Green | 15.94 → 11 **MISS** | 4.34 → 1 **MISS** | 2.60 → 0 **MISS** | 3.90 → 3 **MISS** | 34.20; 32.49 → 17 **MISS** | VERIFIED_PLAYED |
| Cormac Ryan | 15.82 → DNP | 3.74 → DNP | 2.30 → DNP | 2.35 → DNP | 29.68; 26.71 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Gary Trent Jr. | 11.55 → DNP | 1.90 → DNP | 1.53 → DNP | 2.06 → DNP | 22.90; 16.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Isaac Okoro | 10.46 → 12 **MISS** | 3.16 → 3 **HIT** | 2.01 → 1 **MISS** | 1.07 → 1 **HIT** | 26.36; 21.08 → 28 **MISS** | VERIFIED_PLAYED |
| Jericho Sims | 10.88 → DNP | 7.41 → DNP | 3.75 → DNP | 0.23 → DNP | 30.75; 29.21 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kyle Kuzma | 11.33 → 14 **MISS** | 3.48 → 9 **MISS** | 2.83 → 4 **MISS** | 1.13 → 2 **MISS** | 23.32; 15.16 → 30 **MISS** | VERIFIED_PLAYED |
| Leonard Miller | 16.48 → 19 **MISS** | 7.51 → 3 **MISS** | 2.35 → 2 **HIT** | 1.54 → 2 **HIT** | 32.63; 31.00 → 24 **MISS** | VERIFIED_PLAYED |
| Matas Buzelis | 16.01 → 7 **MISS** | 6.71 → 5 **MISS** | 2.21 → 3 **MISS** | 1.86 → 0 **MISS** | 30.08; 22.56 → 17 **MISS** | VERIFIED_PLAYED |
| Myles Turner | 10.70 → 12 **MISS** | 4.85 → 3 **MISS** | 1.52 → 1 **MISS** | 1.58 → 2 **HIT** | 24.44; 17.11 → 30 **MISS** | VERIFIED_PLAYED |
| Ousmane Dieng | 13.68 → 3 **MISS** | 5.94 → 1 **MISS** | 5.37 → 1 **MISS** | 1.00 → 0 **MISS** | 33.12; 31.46 → 16 **MISS** | VERIFIED_PLAYED |
| Patrick Williams | 10.25 → DNP | 4.39 → DNP | 2.68 → DNP | 1.37 → DNP | 29.44; 27.97 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ryan Rollins | 19.59 → 11 **MISS** | 4.08 → 7 **MISS** | 5.18 → 6 **MISS** | 2.42 → 2 **HIT** | 31.57; 20.52 → 34 **MISS** | VERIFIED_PLAYED |
| Tre Jones | 17.47 → 11 **MISS** | 3.99 → 3 **MISS** | 4.45 → 8 **MISS** | 0.77 → 0 **MISS** | 26.87; 25.53 → 24 **MISS** | VERIFIED_PLAYED |

## New York Knicks at Boston Celtics — 2026-10-23T23:00 UTC

Original player rows: 23; verified played: 0; DNP: 0; unverified: 23. Final away–home: 103–107.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Amari Williams | 2.07 → UNVERIFIED | 1.04 → UNVERIFIED | 0.52 → UNVERIFIED | 0.13 → UNVERIFIED | 5.60; 3.36 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Baylor Scheierman | 10.27 → UNVERIFIED | 3.61 → UNVERIFIED | 2.17 → UNVERIFIED | 1.99 → UNVERIFIED | 24.20; 22.99 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Derrick White | 11.22 → UNVERIFIED | 3.96 → UNVERIFIED | 3.52 → UNVERIFIED | 1.78 → UNVERIFIED | 32.05; 27.25 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Hugo Gonzalez | 3.75 → UNVERIFIED | 2.12 → UNVERIFIED | 0.62 → UNVERIFIED | 0.50 → UNVERIFIED | 11.43; 8.57 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Brunson | 21.88 → UNVERIFIED | 3.25 → UNVERIFIED | 7.12 → UNVERIFIED | 1.54 → UNVERIFIED | 35.28; 29.99 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jayson Tatum | 21.06 → UNVERIFIED | 9.78 → UNVERIFIED | 5.62 → UNVERIFIED | 2.59 → UNVERIFIED | 35.35; 28.28 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan Clarkson | 5.83 → UNVERIFIED | 2.10 → UNVERIFIED | 1.52 → UNVERIFIED | 0.18 → UNVERIFIED | 14.51; 13.79 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan Walsh | 6.69 → UNVERIFIED | 3.28 → UNVERIFIED | 1.36 → UNVERIFIED | 0.80 → UNVERIFIED | 20.31; 19.30 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jose Alvarado | 9.03 → UNVERIFIED | 2.77 → UNVERIFIED | 3.42 → UNVERIFIED | 1.19 → UNVERIFIED | 20.34; 17.29 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Josh Hart | 11.42 → UNVERIFIED | 5.66 → UNVERIFIED | 3.38 → UNVERIFIED | 1.47 → UNVERIFIED | 30.28; 27.25 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Karl-Anthony Towns | 18.34 → UNVERIFIED | 9.86 → UNVERIFIED | 3.87 → UNVERIFIED | 1.07 → UNVERIFIED | 30.49; 25.92 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Landry Shamet | 7.17 → UNVERIFIED | 2.10 → UNVERIFIED | 1.31 → UNVERIFIED | 1.26 → UNVERIFIED | 22.71; 15.90 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Luka Garza | 11.78 → UNVERIFIED | 5.05 → UNVERIFIED | 1.33 → UNVERIFIED | 1.03 → UNVERIFIED | 21.14; 16.91 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Mikal Bridges | 13.07 → UNVERIFIED | 2.87 → UNVERIFIED | 2.90 → UNVERIFIED | 1.44 → UNVERIFIED | 31.40; 28.26 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Miles McBride | 7.00 → UNVERIFIED | 2.09 → UNVERIFIED | 1.57 → UNVERIFIED | 1.09 → UNVERIFIED | 17.45; 13.77 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Mohamed Diawara | 4.52 → UNVERIFIED | 1.59 → UNVERIFIED | 1.41 → UNVERIFIED | 0.40 → UNVERIFIED | 12.96; 11.02 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Neemias Queta | 11.44 → UNVERIFIED | 7.18 → UNVERIFIED | 2.40 → UNVERIFIED | 0.28 → UNVERIFIED | 25.58; 21.74 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| OG Anunoby | 15.99 → UNVERIFIED | 5.38 → UNVERIFIED | 2.19 → UNVERIFIED | 2.71 → UNVERIFIED | 32.44; 29.19 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Pacome Dadiet | 3.37 → UNVERIFIED | 1.32 → UNVERIFIED | 0.65 → UNVERIFIED | 0.30 → UNVERIFIED | 8.48; 5.51 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Payton Pritchard | 16.73 → UNVERIFIED | 3.49 → UNVERIFIED | 4.06 → UNVERIFIED | 2.62 → UNVERIFIED | 30.48; 27.43 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ron Harper Jr. | 6.44 → UNVERIFIED | 1.95 → UNVERIFIED | 1.19 → UNVERIFIED | 0.94 → UNVERIFIED | 13.52; 9.46 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Sam Hauser | 10.04 → UNVERIFIED | 3.81 → UNVERIFIED | 1.93 → UNVERIFIED | 2.03 → UNVERIFIED | 25.81; 23.23 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tyler Kolek | 3.78 → UNVERIFIED | 1.16 → UNVERIFIED | 1.32 → UNVERIFIED | 0.51 → UNVERIFIED | 8.78; 5.71 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Atlanta Hawks at Charlotte Hornets — 2026-10-23T23:00 UTC

Original player rows: 14; verified played: 10; DNP: 4; unverified: 0. Final away–home: 128–81.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Brandon Miller | 17.23 → 6 **MISS** | 4.26 → 2 **MISS** | 2.60 → 0 **MISS** | 2.48 → 1 **MISS** | 31.14; 29.59 → 23 **MISS** | VERIFIED_PLAYED |
| CJ McCollum | 17.20 → 13 **MISS** | 3.21 → 1 **MISS** | 4.30 → 2 **MISS** | 2.24 → 2 **HIT** | 29.83; 26.85 → 22 **MISS** | VERIFIED_PLAYED |
| Coby White | 12.88 → DNP | 2.71 → DNP | 2.23 → DNP | 1.67 → DNP | 17.96; 16.16 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Corey Kispert | 7.21 → 11 **MISS** | 1.81 → 1 **MISS** | 1.17 → 1 **HIT** | 1.13 → 3 **MISS** | 14.83; 11.86 → 10 **MISS** | VERIFIED_PLAYED |
| Dyson Daniels | 13.12 → 11 **MISS** | 7.27 → 9 **MISS** | 4.78 → 4 **MISS** | 0.84 → 0 **MISS** | 32.25; 27.41 → 23 **MISS** | VERIFIED_PLAYED |
| Grant Williams | 7.21 → DNP | 3.80 → DNP | 1.32 → DNP | 1.20 → DNP | 21.13; 17.96 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jalen Johnson | 17.64 → 19 **MISS** | 8.88 → 7 **MISS** | 5.55 → 8 **MISS** | 1.54 → 0 **MISS** | 33.39; 30.05 → 29 **MISS** | VERIFIED_PLAYED |
| Kon Knueppel | 13.59 → DNP | 5.09 → DNP | 3.28 → DNP | 2.14 → DNP | 30.79; 29.25 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Mouhamed Gueye | 3.95 → DNP | 2.63 → DNP | 1.05 → DNP | 0.52 → DNP | 13.23; 11.91 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Moussa Diabate | 7.50 → 5 **MISS** | 7.13 → 8 **MISS** | 2.46 → 1 **MISS** | 0.20 → 0 **HIT** | 26.72; 24.04 → 21 **MISS** | VERIFIED_PLAYED |
| Nickeil Alexander-Walker | 22.15 → 14 **MISS** | 3.69 → 3 **MISS** | 3.17 → 5 **MISS** | 3.22 → 2 **MISS** | 34.85; 31.36 → 27 **MISS** | VERIFIED_PLAYED |
| Onyeka Okongwu | 12.20 → 10 **MISS** | 6.10 → 4 **MISS** | 2.54 → 1 **MISS** | 1.34 → 2 **MISS** | 30.44; 25.88 → 22 **MISS** | VERIFIED_PLAYED |
| Ryan Kalkbrenner | 6.42 → 6 **HIT** | 3.89 → 7 **MISS** | 1.21 → 1 **HIT** | 0.19 → 0 **HIT** | 19.87; 18.87 → 19 **MISS** | VERIFIED_PLAYED |
| Sion James | 6.45 → 3 **MISS** | 3.63 → 2 **MISS** | 2.04 → 5 **MISS** | 1.02 → 1 **HIT** | 19.98; 18.98 → 24 **MISS** | VERIFIED_PLAYED |

## Dallas Mavericks at Indiana Pacers — 2026-10-23T23:00 UTC

Original player rows: 11; verified played: 11; DNP: 0; unverified: 0. Final away–home: 121–105.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Cooper Flagg | 21.45 → 14 **MISS** | 6.31 → 5 **MISS** | 4.07 → 6 **MISS** | 1.11 → 2 **MISS** | 30.83; 29.29 → 17 **MISS** | VERIFIED_PLAYED |
| Daniel Gafford | 11.76 → 4 **MISS** | 5.85 → 3 **MISS** | 1.57 → 5 **MISS** | 0.23 → 0 **HIT** | 22.17; 14.41 → 15 **MISS** | VERIFIED_PLAYED |
| Jalen Slawson | 9.27 → 4 **MISS** | 4.44 → 5 **MISS** | 2.75 → 2 **MISS** | 1.18 → 0 **MISS** | 26.81; 22.79 → 16 **MISS** | VERIFIED_PLAYED |
| Jarace Walker | 12.33 → 2 **MISS** | 4.95 → 1 **MISS** | 3.28 → 1 **MISS** | 1.81 → 0 **MISS** | 26.06; 18.24 → 17 **MISS** | VERIFIED_PLAYED |
| Jay Huff | 9.76 → 0 **MISS** | 4.43 → 2 **MISS** | 2.32 → 0 **MISS** | 1.20 → 0 **MISS** | 22.63; 21.49 → 5 **MISS** | VERIFIED_PLAYED |
| Kobe Brown | 11.36 → 0 **MISS** | 5.02 → 0 **MISS** | 2.87 → 0 **MISS** | 1.64 → 0 **MISS** | 28.54; 25.68 → 1 **MISS** | VERIFIED_PLAYED |
| Max Christie | 10.81 → 16 **MISS** | 2.82 → 4 **MISS** | 1.71 → 4 **MISS** | 1.78 → 2 **HIT** | 26.61; 25.28 → 38 **MISS** | VERIFIED_PLAYED |
| Naji Marshall | 14.20 → 15 **MISS** | 4.27 → 4 **HIT** | 3.43 → 6 **MISS** | 0.71 → 0 **MISS** | 28.43; 19.90 → 33 **MISS** | VERIFIED_PLAYED |
| Obi Toppin | 12.77 → 13 **HIT** | 4.24 → 5 **MISS** | 2.44 → 1 **MISS** | 1.55 → 0 **MISS** | 19.47; 18.50 → 25 **MISS** | VERIFIED_PLAYED |
| P.J. Washington | 14.15 → 20 **MISS** | 6.83 → 13 **MISS** | 1.40 → 0 **MISS** | 1.47 → 2 **MISS** | 32.16; 19.29 → 33 **MISS** | VERIFIED_PLAYED |
| Quenton Jackson | 12.47 → 8 **MISS** | 3.32 → 1 **MISS** | 4.43 → 3 **MISS** | 0.77 → 1 **HIT** | 25.89; 24.60 → 17 **MISS** | VERIFIED_PLAYED |

## Minnesota Timberwolves at Orlando Magic — 2026-10-23T23:00 UTC

Original player rows: 21; verified played: 18; DNP: 3; unverified: 0. Final away–home: 115–93.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Anthony Edwards | 18.34 → 15 **MISS** | 3.85 → 4 **HIT** | 3.57 → 4 **HIT** | 1.67 → 2 **HIT** | 30.20; 18.12 → 33 **MISS** | VERIFIED_PLAYED |
| Ayo Dosunmu | 16.61 → 14 **MISS** | 5.47 → 7 **MISS** | 3.79 → 10 **MISS** | 1.66 → 1 **MISS** | 32.56; 24.42 → 27 **MISS** | VERIFIED_PLAYED |
| Bones Hyland | 13.07 → 3 **MISS** | 3.11 → 1 **MISS** | 2.97 → 0 **MISS** | 2.34 → 1 **MISS** | 24.52; 20.84 → 8 **MISS** | VERIFIED_PLAYED |
| Desmond Bane | 15.27 → 5 **MISS** | 3.67 → 2 **MISS** | 3.25 → 0 **MISS** | 1.56 → 1 **MISS** | 27.81; 26.42 → 27 **MISS** | VERIFIED_PLAYED |
| Donte DiVincenzo | 10.34 → DNP | 2.59 → DNP | 2.25 → DNP | 2.22 → DNP | 25.09; 23.84 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Franz Wagner | 13.11 → 18 **MISS** | 2.94 → 6 **MISS** | 1.97 → 5 **MISS** | 0.84 → 1 **HIT** | 21.50; 17.92 → 33 **MISS** | VERIFIED_PLAYED |
| Goga Bitadze | 7.47 → 4 **MISS** | 5.33 → 3 **MISS** | 1.71 → 0 **MISS** | 0.19 → 0 **HIT** | 17.64; 16.75 → 12 **MISS** | VERIFIED_PLAYED |
| Jaden McDaniels | 15.26 → 15 **HIT** | 4.09 → 6 **MISS** | 2.32 → 3 **MISS** | 1.18 → 2 **MISS** | 31.76; 19.06 → 30 **MISS** | VERIFIED_PLAYED |
| Jalen Suggs | 13.04 → 14 **MISS** | 3.84 → 6 **MISS** | 5.24 → 6 **MISS** | 2.43 → 1 **MISS** | 30.25; 28.74 → 34 **MISS** | VERIFIED_PLAYED |
| Jamal Cain | 8.28 → 0 **MISS** | 3.34 → 1 **MISS** | 1.45 → 0 **MISS** | 0.79 → 0 **MISS** | 19.54; 18.56 → 11 **MISS** | VERIFIED_PLAYED |
| Jase Richardson | 2.70 → 6 **MISS** | 0.85 → 1 **HIT** | 0.52 → 3 **MISS** | 0.17 → 1 **MISS** | 6.24; 4.99 → 14 **MISS** | VERIFIED_PLAYED |
| Jaylen Clark | 7.20 → 0 **MISS** | 2.21 → 2 **HIT** | 1.52 → 1 **MISS** | 0.98 → 0 **MISS** | 18.27; 14.62 → 3 **MISS** | VERIFIED_PLAYED |
| Jevon Carter | 6.34 → 0 **MISS** | 2.13 → 1 **MISS** | 1.69 → 1 **MISS** | 0.90 → 0 **MISS** | 18.71; 17.77 → 13 **MISS** | VERIFIED_PLAYED |
| Joan Beringer | 7.50 → 9 **MISS** | 3.45 → 9 **MISS** | 1.05 → 0 **MISS** | 0.22 → 0 **HIT** | 15.27; 12.22 → 15 **HIT** | VERIFIED_PLAYED |
| Noah Penda | 1.66 → DNP | 0.92 → DNP | 0.78 → DNP | 0.16 → DNP | 6.57; 4.93 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Paolo Banchero | 20.13 → 14 **MISS** | 7.68 → 6 **MISS** | 5.39 → 5 **HIT** | 0.94 → 0 **MISS** | 34.09; 32.38 → 26 **MISS** | VERIFIED_PLAYED |
| Rudy Gobert | 10.33 → 14 **MISS** | 9.94 → 9 **MISS** | 1.63 → 1 **MISS** | 0.21 → 0 **HIT** | 29.79; 23.83 → 30 **HIT** | VERIFIED_PLAYED |
| Terrence Shannon Jr. | 10.19 → 13 **MISS** | 2.05 → 4 **MISS** | 1.80 → 1 **MISS** | 1.01 → 2 **MISS** | 18.24; 17.33 → 22 **MISS** | VERIFIED_PLAYED |
| Tristan da Silva | 9.45 → 5 **MISS** | 3.31 → 3 **HIT** | 2.29 → 1 **MISS** | 0.92 → 1 **HIT** | 23.63; 22.45 → 29 **MISS** | VERIFIED_PLAYED |
| Wendell Carter Jr. | 10.62 → 20 **MISS** | 5.51 → 9 **MISS** | 1.56 → 1 **MISS** | 0.48 → 3 **MISS** | 26.27; 24.96 → 29 **MISS** | VERIFIED_PLAYED |
| Zyon Pullin | 3.62 → DNP | 1.06 → DNP | 1.03 → DNP | 0.23 → DNP | 8.40; 5.04 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Toronto Raptors at Washington Wizards — 2026-10-23T23:00 UTC

Original player rows: 16; verified played: 15; DNP: 1; unverified: 0. Final away–home: 112–102.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alijah Martin | 1.99 → 0 **MISS** | 0.79 → 0 **MISS** | 0.51 → 0 **MISS** | 0.16 → 0 **HIT** | 5.56; 4.45 → 1 **MISS** | VERIFIED_PLAYED |
| Anthony Gill | 13.04 → 0 **MISS** | 4.30 → 0 **MISS** | 2.23 → 0 **MISS** | 0.83 → 0 **MISS** | 32.27; 30.65 → 1 **MISS** | VERIFIED_PLAYED |
| Bilal Coulibaly | 13.69 → 11 **MISS** | 3.82 → 6 **MISS** | 2.27 → 0 **MISS** | 1.19 → 1 **HIT** | 23.95; 17.96 → 26 **MISS** | VERIFIED_PLAYED |
| Bub Carrington | 14.54 → 3 **MISS** | 2.57 → 1 **MISS** | 4.82 → 0 **MISS** | 2.39 → 1 **MISS** | 29.07; 27.61 → 11 **MISS** | VERIFIED_PLAYED |
| Collin Murray-Boyles | 10.36 → 8 **MISS** | 4.45 → 3 **MISS** | 1.65 → 0 **MISS** | 0.22 → 0 **HIT** | 20.47; 17.40 → 18 **MISS** | VERIFIED_PLAYED |
| Immanuel Quickley | 9.93 → 12 **MISS** | 3.25 → 1 **MISS** | 3.59 → 6 **MISS** | 1.38 → 0 **MISS** | 25.15; 15.09 → 29 **MISS** | VERIFIED_PLAYED |
| Ja'Kobe Walter | 10.86 → 7 **MISS** | 3.47 → 4 **MISS** | 1.93 → 2 **HIT** | 2.29 → 2 **HIT** | 27.06; 25.71 → 24 **MISS** | VERIFIED_PLAYED |
| Jakob Poeltl | 9.78 → 6 **MISS** | 3.95 → 9 **MISS** | 1.73 → 2 **HIT** | 0.18 → 0 **HIT** | 21.20; 20.14 → 27 **MISS** | VERIFIED_PLAYED |
| Jamal Shead | 7.40 → 5 **MISS** | 1.51 → 2 **HIT** | 5.09 → 5 **HIT** | 0.92 → 0 **MISS** | 24.42; 23.20 → 24 **HIT** | VERIFIED_PLAYED |
| Jamir Watkins | 12.38 → DNP | 5.36 → DNP | 2.23 → DNP | 1.42 → DNP | 29.82; 28.33 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jamison Battle | 2.43 → 5 **MISS** | 0.76 → 0 **MISS** | 0.45 → 0 **HIT** | 0.22 → 1 **MISS** | 5.37; 4.29 → 12 **MISS** | VERIFIED_PLAYED |
| Justin Champagnie | 10.73 → 8 **MISS** | 5.32 → 6 **MISS** | 1.84 → 0 **MISS** | 0.90 → 0 **MISS** | 23.56; 20.03 → 23 **MISS** | VERIFIED_PLAYED |
| RJ Barrett | 18.62 → 23 **MISS** | 4.78 → 9 **MISS** | 3.32 → 4 **MISS** | 1.39 → 1 **HIT** | 31.30; 28.17 → 34 **MISS** | VERIFIED_PLAYED |
| Scottie Barnes | 14.81 → 28 **MISS** | 5.69 → 14 **MISS** | 6.96 → 5 **MISS** | 0.75 → 1 **HIT** | 30.48; 28.96 → 37 **MISS** | VERIFIED_PLAYED |
| Trayce Jackson-Davis | 1.99 → 0 **MISS** | 0.95 → 0 **MISS** | 0.47 → 0 **HIT** | 0.10 → 0 **HIT** | 5.16; 3.61 → 1 **MISS** | VERIFIED_PLAYED |
| Will Riley | 15.97 → 0 **MISS** | 4.65 → 0 **MISS** | 3.56 → 0 **MISS** | 1.25 → 0 **MISS** | 32.04; 30.44 → 1 **MISS** | VERIFIED_PLAYED |

## Detroit Pistons at Miami Heat — 2026-10-24T00:00 UTC

Original player rows: 20; verified played: 17; DNP: 3; unverified: 0. Final away–home: 128–111.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Andrew Wiggins | 11.97 → 8 **MISS** | 3.34 → 8 **MISS** | 2.26 → 2 **HIT** | 1.80 → 1 **MISS** | 26.44; 25.12 → 26 **HIT** | VERIFIED_PLAYED |
| Ausar Thompson | 9.55 → 4 **MISS** | 4.59 → 3 **MISS** | 3.61 → 5 **MISS** | 0.19 → 0 **HIT** | 26.29; 24.97 → 19 **MISS** | VERIFIED_PLAYED |
| Bam Adebayo | 17.70 → 4 **MISS** | 9.54 → 6 **MISS** | 4.61 → 3 **MISS** | 1.56 → 0 **MISS** | 33.70; 32.01 → 23 **MISS** | VERIFIED_PLAYED |
| Cade Cunningham | 13.26 → 16 **MISS** | 3.82 → 2 **MISS** | 6.89 → 8 **MISS** | 1.17 → 2 **MISS** | 24.61; 14.77 → 30 **MISS** | VERIFIED_PLAYED |
| Chaz Lanier | 2.11 → DNP | 0.73 → DNP | 0.49 → DNP | 0.23 → DNP | 6.60; 5.61 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Daniss Jenkins | 12.23 → 15 **MISS** | 3.55 → 5 **MISS** | 5.38 → 5 **HIT** | 1.12 → 1 **HIT** | 26.53; 25.21 → 22 **MISS** | VERIFIED_PLAYED |
| Davion Mitchell | 11.97 → 18 **MISS** | 2.98 → 2 **MISS** | 5.08 → 5 **HIT** | 1.49 → 3 **MISS** | 30.23; 27.21 → 33 **MISS** | VERIFIED_PLAYED |
| Dru Smith | 3.46 → 3 **HIT** | 1.36 → 0 **MISS** | 1.37 → 1 **HIT** | 0.17 → 1 **MISS** | 10.06; 6.04 → 6 **MISS** | VERIFIED_PLAYED |
| Duncan Robinson | 12.67 → 17 **MISS** | 2.79 → 1 **MISS** | 2.25 → 2 **HIT** | 2.31 → 5 **MISS** | 25.34; 20.27 → 28 **MISS** | VERIFIED_PLAYED |
| Jalen Duren | 18.51 → 4 **MISS** | 8.50 → 6 **MISS** | 3.20 → 3 **HIT** | 0.21 → 0 **HIT** | 29.75; 25.29 → 10 **MISS** | VERIFIED_PLAYED |
| Javonte Green | 6.90 → 5 **MISS** | 2.81 → 3 **HIT** | 0.97 → 0 **MISS** | 1.07 → 1 **HIT** | 15.57; 14.79 → 13 **MISS** | VERIFIED_PLAYED |
| Keshad Johnson | 6.24 → DNP | 2.11 → DNP | 0.98 → DNP | 0.42 → DNP | 13.63; 10.22 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kevin Huerter | 10.62 → 5 **MISS** | 3.24 → 6 **MISS** | 2.95 → 2 **MISS** | 1.46 → 1 **HIT** | 23.53; 21.17 → 20 **MISS** | VERIFIED_PLAYED |
| Myron Gardner | 1.81 → 0 **MISS** | 1.05 → 0 **MISS** | 0.57 → 0 **MISS** | 0.15 → 0 **HIT** | 4.94; 3.71 → 3 **MISS** | VERIFIED_PLAYED |
| Paul Reed | 9.31 → 19 **MISS** | 4.15 → 11 **MISS** | 1.51 → 3 **MISS** | 0.28 → 2 **MISS** | 16.42; 15.60 → 26 **MISS** | VERIFIED_PLAYED |
| Pelle Larsson | 13.64 → 7 **MISS** | 3.90 → 2 **MISS** | 3.38 → 1 **MISS** | 0.87 → 1 **HIT** | 29.79; 26.81 → 29 **MISS** | VERIFIED_PLAYED |
| Ronald Holland II | 7.95 → 8 **HIT** | 3.12 → 5 **MISS** | 1.31 → 4 **MISS** | 1.06 → 0 **MISS** | 19.46; 18.49 → 22 **MISS** | VERIFIED_PLAYED |
| Simone Fontecchio | 7.50 → 0 **MISS** | 2.22 → 1 **MISS** | 1.28 → 0 **MISS** | 1.32 → 0 **MISS** | 14.30; 10.73 → 3 **MISS** | VERIFIED_PLAYED |
| Tolu Smith | 3.04 → 0 **MISS** | 1.47 → 1 **HIT** | 0.77 → 0 **MISS** | 0.15 → 0 **HIT** | 7.48; 5.61 → 2 **MISS** | VERIFIED_PLAYED |
| Vladislav Goldin | 1.11 → DNP | 0.55 → DNP | 0.26 → DNP | 0.07 → DNP | 3.00; 1.95 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Houston Rockets at San Antonio Spurs — 2026-10-24T01:30 UTC

Original player rows: 19; verified played: 15; DNP: 4; unverified: 0. Final away–home: 114–110.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alperen Sengun | 17.88 → 29 **MISS** | 7.70 → 7 **MISS** | 5.27 → 7 **MISS** | 0.69 → 2 **MISS** | 31.58; 28.43 → 36 **MISS** | VERIFIED_PLAYED |
| Amen Thompson | 20.14 → 20 **HIT** | 7.17 → 10 **MISS** | 5.22 → 4 **MISS** | 0.31 → 1 **MISS** | 38.42; 34.58 → 36 **MISS** | VERIFIED_PLAYED |
| Carter Bryant | 7.16 → 0 **MISS** | 3.30 → 0 **MISS** | 1.82 → 0 **MISS** | 0.99 → 0 **MISS** | 18.34; 17.42 → 4 **MISS** | VERIFIED_PLAYED |
| Clint Capela | 4.54 → DNP | 3.28 → DNP | 0.85 → DNP | 0.22 → DNP | 11.70; 11.12 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| De'Aaron Fox | 16.39 → 19 **MISS** | 3.96 → 4 **HIT** | 5.15 → 9 **MISS** | 1.40 → 2 **MISS** | 31.37; 28.23 → 34 **MISS** | VERIFIED_PLAYED |
| Devin Vassell | 12.65 → 10 **MISS** | 4.78 → 4 **MISS** | 2.62 → 2 **MISS** | 1.90 → 2 **HIT** | 31.11; 29.56 → 36 **MISS** | VERIFIED_PLAYED |
| Dylan Harper | 13.12 → 20 **MISS** | 3.69 → 3 **MISS** | 3.46 → 2 **MISS** | 1.18 → 1 **HIT** | 25.13; 23.87 → 36 **MISS** | VERIFIED_PLAYED |
| Harrison Barnes | 8.75 → 0 **MISS** | 2.25 → 0 **MISS** | 1.43 → 0 **MISS** | 1.24 → 0 **MISS** | 22.16; 21.05 → 5 **MISS** | VERIFIED_PLAYED |
| Jabari Smith Jr. | 16.28 → 7 **MISS** | 6.31 → 5 **MISS** | 1.88 → 1 **MISS** | 2.48 → 1 **MISS** | 34.64; 31.17 → 34 **MISS** | VERIFIED_PLAYED |
| Jae'Sean Tate | 4.31 → DNP | 2.34 → DNP | 1.04 → DNP | 0.27 → DNP | 11.90; 10.71 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jordan McLaughlin | 2.17 → DNP | 0.85 → DNP | 0.65 → DNP | 0.23 → DNP | 5.99; 4.49 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Julian Champagnie | 10.49 → 6 **MISS** | 5.48 → 0 **MISS** | 2.02 → 0 **MISS** | 1.60 → 2 **HIT** | 27.41; 26.04 → 25 **MISS** | VERIFIED_PLAYED |
| Keldon Johnson | 13.81 → 8 **MISS** | 4.70 → 6 **MISS** | 1.68 → 1 **MISS** | 1.05 → 0 **MISS** | 23.59; 22.41 → 19 **MISS** | VERIFIED_PLAYED |
| Kevin Durant | 24.69 → 20 **MISS** | 5.54 → 7 **MISS** | 5.60 → 6 **HIT** | 2.42 → 2 **HIT** | 36.12; 32.51 → 37 **MISS** | VERIFIED_PLAYED |
| Luke Kornet | 6.79 → 7 **HIT** | 4.89 → 3 **MISS** | 2.12 → 0 **MISS** | 0.19 → 0 **HIT** | 20.82; 16.65 → 16 **MISS** | VERIFIED_PLAYED |
| Reed Sheppard | 11.55 → DNP | 3.14 → DNP | 2.61 → DNP | 2.23 → DNP | 23.73; 22.54 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Stephon Castle | 16.18 → 15 **MISS** | 6.50 → 7 **MISS** | 7.98 → 5 **MISS** | 1.41 → 3 **MISS** | 32.26; 27.42 → 33 **MISS** | VERIFIED_PLAYED |
| Tari Eason | 10.06 → 12 **MISS** | 5.17 → 6 **MISS** | 1.48 → 0 **MISS** | 0.99 → 0 **MISS** | 24.37; 23.16 → 27 **MISS** | VERIFIED_PLAYED |
| Victor Wembanyama | 25.03 → 25 **HIT** | 10.93 → 13 **MISS** | 3.50 → 2 **MISS** | 1.47 → 2 **MISS** | 28.55; 22.84 → 32 **MISS** | VERIFIED_PLAYED |

## New Orleans Pelicans at Utah Jazz — 2026-10-24T01:30 UTC

Original player rows: 12; verified played: 11; DNP: 1; unverified: 0. Final away–home: 119–120.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ace Bailey | 17.46 → 6 **MISS** | 5.07 → 7 **MISS** | 2.35 → 2 **HIT** | 2.06 → 1 **MISS** | 31.44; 28.29 → 22 **MISS** | VERIFIED_PLAYED |
| Blake Hinson | 12.42 → DNP | 2.68 → DNP | 1.79 → DNP | 1.98 → DNP | 21.19; 13.77 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Brice Sensabaugh | 20.92 → 10 **MISS** | 3.83 → 3 **MISS** | 3.34 → 2 **MISS** | 2.97 → 2 **MISS** | 29.62; 25.18 → 16 **MISS** | VERIFIED_PLAYED |
| Derik Queen | 14.19 → 12 **MISS** | 8.28 → 7 **MISS** | 3.26 → 2 **MISS** | 0.43 → 1 **MISS** | 30.62; 29.09 → 29 **MISS** | VERIFIED_PLAYED |
| Herbert Jones | 7.57 → 3 **MISS** | 2.86 → 1 **MISS** | 2.25 → 0 **MISS** | 1.20 → 1 **HIT** | 23.12; 18.50 → 18 **MISS** | VERIFIED_PLAYED |
| Jeremiah Fears | 23.58 → 7 **MISS** | 4.83 → 0 **MISS** | 4.90 → 1 **MISS** | 1.78 → 1 **MISS** | 36.64; 34.81 → 24 **MISS** | VERIFIED_PLAYED |
| Jordan Poole | 9.99 → 12 **MISS** | 2.22 → 2 **HIT** | 2.52 → 2 **MISS** | 1.39 → 1 **HIT** | 21.32; 13.86 → 19 **MISS** | VERIFIED_PLAYED |
| Kyle Filipowski | 15.38 → 0 **MISS** | 7.46 → 1 **MISS** | 3.65 → 0 **MISS** | 1.35 → 0 **MISS** | 27.51; 22.01 → 8 **MISS** | VERIFIED_PLAYED |
| Saddiq Bey | 18.06 → 20 **MISS** | 4.62 → 3 **MISS** | 2.44 → 1 **MISS** | 2.37 → 3 **MISS** | 32.79; 26.23 → 22 **MISS** | VERIFIED_PLAYED |
| Trey Murphy III | 17.60 → 9 **MISS** | 5.63 → 6 **HIT** | 3.17 → 3 **HIT** | 2.54 → 1 **MISS** | 35.93; 21.56 → 31 **MISS** | VERIFIED_PLAYED |
| Yves Missi | 8.39 → 6 **MISS** | 6.37 → 1 **MISS** | 2.01 → 0 **MISS** | 0.21 → 0 **HIT** | 25.86; 20.68 → 9 **MISS** | VERIFIED_PLAYED |
| Zion Williamson | 16.43 → 23 **MISS** | 4.69 → 5 **HIT** | 2.61 → 2 **MISS** | 0.20 → 0 **HIT** | 29.07; 23.26 → 33 **MISS** | VERIFIED_PLAYED |

## Memphis Grizzlies at Golden State Warriors — 2026-10-24T02:00 UTC

Original player rows: 17; verified played: 9; DNP: 8; unverified: 0. Final away–home: 111–108.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Al Horford | 7.63 → 3 **MISS** | 3.40 → 5 **MISS** | 2.22 → 0 **MISS** | 0.97 → 1 **HIT** | 21.00; 11.55 → 19 **MISS** | VERIFIED_PLAYED |
| Brandin Podziemski | 17.11 → 18 **MISS** | 4.21 → 2 **MISS** | 2.92 → 3 **HIT** | 1.80 → 2 **HIT** | 29.98; 26.98 → 33 **MISS** | VERIFIED_PLAYED |
| Cam Spencer | 9.82 → 11 **MISS** | 2.38 → 2 **HIT** | 5.13 → 1 **MISS** | 1.57 → 3 **MISS** | 24.14; 15.69 → 17 **MISS** | VERIFIED_PLAYED |
| Cedric Coward | 13.08 → DNP | 3.98 → DNP | 2.24 → DNP | 1.27 → DNP | 24.03; 19.22 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| De'Anthony Melton | 8.48 → 10 **MISS** | 3.44 → 1 **MISS** | 2.56 → 0 **MISS** | 0.91 → 2 **MISS** | 22.49; 17.99 → 20 **MISS** | VERIFIED_PLAYED |
| Draymond Green | 8.74 → 5 **MISS** | 4.81 → 5 **HIT** | 5.37 → 6 **MISS** | 1.28 → 1 **HIT** | 27.97; 23.77 → 31 **MISS** | VERIFIED_PLAYED |
| Gary Payton II | 9.67 → 7 **MISS** | 3.91 → 2 **MISS** | 1.59 → 0 **MISS** | 0.29 → 1 **MISS** | 19.61; 16.67 → 11 **MISS** | VERIFIED_PLAYED |
| GG Jackson | 14.81 → 2 **MISS** | 3.90 → 4 **HIT** | 2.01 → 1 **MISS** | 1.17 → 0 **MISS** | 23.62; 17.71 → 15 **MISS** | VERIFIED_PLAYED |
| Gui Santos | 13.42 → 5 **MISS** | 4.73 → 4 **MISS** | 3.15 → 2 **MISS** | 1.24 → 1 **HIT** | 28.52; 22.81 → 20 **MISS** | VERIFIED_PLAYED |
| Jahmai Mashack | 9.66 → DNP | 4.35 → DNP | 4.53 → DNP | 0.75 → DNP | 31.23; 24.98 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Javon Small | 12.30 → DNP | 3.38 → DNP | 3.42 → DNP | 1.69 → DNP | 24.38; 17.07 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kristaps Porzingis | 14.81 → DNP | 5.53 → DNP | 2.23 → DNP | 1.29 → DNP | 25.92; 20.74 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| LJ Cryer | 9.33 → DNP | 1.92 → DNP | 1.60 → DNP | 1.70 → DNP | 20.64; 15.48 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Malevy Leons | 5.83 → DNP | 2.25 → DNP | 1.45 → DNP | 0.29 → DNP | 15.77; 11.83 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Olivier-Maxence Prosper | 14.14 → DNP | 3.67 → DNP | 1.26 → DNP | 1.53 → DNP | 21.47; 15.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Taylor Hendricks | 9.48 → DNP | 4.02 → DNP | 1.11 → DNP | 1.15 → DNP | 23.30; 16.31 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Will Richard | 3.87 → 0 **MISS** | 2.05 → 0 **MISS** | 1.13 → 0 **MISS** | 0.44 → 0 **HIT** | 16.55; 13.24 → 3 **MISS** | VERIFIED_PLAYED |

## LA Clippers at Los Angeles Lakers — 2026-10-24T02:00 UTC

Original player rows: 11; verified played: 5; DNP: 6; unverified: 0. Final away–home: 117–125.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Adou Thiero | 3.12 → DNP | 1.25 → DNP | 0.71 → DNP | 0.21 → DNP | 7.90; 5.53 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Bronny James | 6.03 → DNP | 1.52 → DNP | 1.51 → DNP | 0.82 → DNP | 15.92; 15.13 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Brook Lopez | 11.80 → 22 **MISS** | 6.09 → 4 **MISS** | 2.11 → 0 **MISS** | 1.71 → 2 **HIT** | 27.91; 25.12 → 20 **MISS** | VERIFIED_PLAYED |
| Cam Christie | 1.54 → DNP | 0.68 → DNP | 0.35 → DNP | 0.08 → DNP | 4.52; 3.39 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Darius Garland | 17.95 → 26 **MISS** | 2.75 → 0 **MISS** | 5.34 → 6 **MISS** | 2.38 → 4 **MISS** | 31.82; 27.04 → 37 **MISS** | VERIFIED_PLAYED |
| Derrick Jones Jr. | 8.35 → 16 **MISS** | 4.43 → 4 **HIT** | 1.61 → 1 **MISS** | 0.82 → 3 **MISS** | 25.18; 22.66 → 35 **MISS** | VERIFIED_PLAYED |
| Jake LaRavia | 7.72 → DNP | 4.56 → DNP | 1.82 → DNP | 0.78 → DNP | 28.37; 26.95 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jarred Vanderbilt | 4.76 → DNP | 3.25 → DNP | 1.55 → DNP | 0.35 → DNP | 15.19; 13.67 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jordan Miller | 11.09 → DNP | 3.34 → DNP | 2.59 → DNP | 0.68 → DNP | 25.82; 21.95 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kobe Sanders | 8.02 → 5 **MISS** | 2.09 → 3 **MISS** | 1.57 → 5 **MISS** | 1.07 → 1 **HIT** | 17.72; 15.06 → 19 **MISS** | VERIFIED_PLAYED |
| Kris Dunn | 5.70 → 7 **MISS** | 3.26 → 5 **MISS** | 3.08 → 5 **MISS** | 0.58 → 1 **HIT** | 25.64; 23.07 → 34 **MISS** | VERIFIED_PLAYED |

## Portland Trail Blazers at Sacramento Kings — 2026-10-24T02:00 UTC

Original player rows: 16; verified played: 12; DNP: 4; unverified: 0. Final away–home: 128–120.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Daeqwon Plowden | 13.20 → 3 **MISS** | 3.43 → 0 **MISS** | 1.86 → 0 **MISS** | 2.12 → 1 **MISS** | 28.99; 24.64 → 20 **MISS** | VERIFIED_PLAYED |
| Deni Avdija | 23.44 → 26 **MISS** | 6.15 → 7 **MISS** | 6.21 → 6 **HIT** | 1.48 → 1 **HIT** | 35.31; 33.54 → 38 **MISS** | VERIFIED_PLAYED |
| Donovan Clingan | 11.53 → 8 **MISS** | 9.20 → 10 **MISS** | 1.93 → 3 **MISS** | 1.32 → 0 **MISS** | 26.48; 25.16 → 21 **MISS** | VERIFIED_PLAYED |
| Dylan Cardwell | 5.79 → DNP | 5.51 → DNP | 1.65 → DNP | 0.26 → DNP | 19.10; 16.23 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jayson Kent | 1.83 → DNP | 0.72 → DNP | 0.35 → DNP | 0.14 → DNP | 4.60; 2.76 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jrue Holiday | 16.50 → 12 **MISS** | 5.29 → 1 **MISS** | 5.31 → 8 **MISS** | 2.57 → 3 **HIT** | 33.15; 31.49 → 26 **MISS** | VERIFIED_PLAYED |
| Malik Monk | 11.68 → 0 **MISS** | 2.63 → 1 **MISS** | 4.42 → 2 **MISS** | 1.52 → 0 **MISS** | 25.13; 17.59 → 12 **MISS** | VERIFIED_PLAYED |
| Maxime Raynaud | 17.72 → DNP | 7.24 → DNP | 2.28 → DNP | 1.01 → DNP | 32.53; 27.65 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nique Clifford | 15.59 → 0 **MISS** | 5.30 → 0 **MISS** | 4.40 → 0 **MISS** | 1.56 → 0 **MISS** | 36.48; 27.36 → 2 **MISS** | VERIFIED_PLAYED |
| Precious Achiuwa | 15.50 → 14 **MISS** | 8.55 → 6 **MISS** | 2.16 → 1 **MISS** | 0.48 → 0 **HIT** | 31.11; 24.89 → 26 **MISS** | VERIFIED_PLAYED |
| Robert Williams III | 7.02 → 13 **MISS** | 6.31 → 6 **HIT** | 1.29 → 0 **MISS** | 0.35 → 0 **HIT** | 19.25; 17.32 → 18 **MISS** | VERIFIED_PLAYED |
| Scoot Henderson | 15.11 → 4 **MISS** | 3.05 → 1 **MISS** | 3.24 → 2 **MISS** | 1.89 → 0 **MISS** | 30.35; 28.84 → 21 **MISS** | VERIFIED_PLAYED |
| Sidy Cissoko | 2.14 → 15 **MISS** | 1.01 → 7 **MISS** | 0.74 → 1 **HIT** | 0.13 → 2 **MISS** | 7.76; 7.37 → 26 **MISS** | VERIFIED_PLAYED |
| Toumani Camara | 16.96 → 19 **MISS** | 4.39 → 3 **MISS** | 2.30 → 1 **MISS** | 3.38 → 5 **MISS** | 34.94; 33.20 → 27 **MISS** | VERIFIED_PLAYED |
| Vit Krejci | 5.00 → 0 **MISS** | 2.18 → 2 **HIT** | 1.28 → 0 **MISS** | 0.60 → 0 **MISS** | 13.40; 6.70 → 3 **MISS** | VERIFIED_PLAYED |
| Yang Hansen | 2.01 → DNP | 0.88 → DNP | 0.36 → DNP | 0.11 → DNP | 4.94; 3.21 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Washington Wizards at Chicago Bulls — 2026-10-25T00:00 UTC

Original player rows: 15; verified played: 12; DNP: 3; unverified: 0. Final away–home: 124–120.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alex Sarr | 7.92 → 10 **MISS** | 4.70 → 2 **MISS** | 2.85 → 3 **HIT** | 0.74 → 0 **MISS** | 22.94; 12.62 → 23 **HIT** | VERIFIED_PLAYED |
| Anthony Gill | 10.18 → DNP | 3.40 → DNP | 1.82 → DNP | 0.67 → DNP | 26.13; 23.52 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Bilal Coulibaly | 13.69 → 7 **MISS** | 3.98 → 4 **HIT** | 2.12 → 0 **MISS** | 1.13 → 0 **MISS** | 25.21; 18.91 → 25 **HIT** | VERIFIED_PLAYED |
| Bub Carrington | 12.44 → 9 **MISS** | 2.14 → 2 **HIT** | 3.95 → 1 **MISS** | 2.24 → 3 **MISS** | 25.11; 23.86 → 21 **MISS** | VERIFIED_PLAYED |
| Isaac Okoro | 9.71 → 0 **MISS** | 2.85 → 1 **MISS** | 1.86 → 0 **MISS** | 0.86 → 0 **MISS** | 25.01; 20.01 → 14 **MISS** | VERIFIED_PLAYED |
| Jalen Smith | 9.08 → 14 **MISS** | 4.41 → 3 **MISS** | 1.29 → 1 **HIT** | 0.87 → 2 **MISS** | 18.93; 10.41 → 24 **MISS** | VERIFIED_PLAYED |
| Jamir Watkins | 12.39 → DNP | 5.37 → DNP | 2.24 → DNP | 1.42 → DNP | 29.85; 25.37 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Josh Giddey | 10.45 → 9 **MISS** | 6.52 → 8 **MISS** | 7.56 → 10 **MISS** | 1.05 → 1 **HIT** | 29.89; 19.43 → 30 **HIT** | VERIFIED_PLAYED |
| Justin Champagnie | 10.00 → 11 **MISS** | 5.47 → 14 **MISS** | 1.76 → 4 **MISS** | 0.95 → 1 **HIT** | 24.02; 20.42 → 26 **MISS** | VERIFIED_PLAYED |
| Leonard Miller | 15.00 → 7 **MISS** | 6.46 → 4 **MISS** | 2.14 → 0 **MISS** | 1.38 → 1 **HIT** | 31.08; 29.52 → 21 **MISS** | VERIFIED_PLAYED |
| Matas Buzelis | 13.35 → 21 **MISS** | 5.83 → 5 **MISS** | 1.99 → 2 **HIT** | 1.27 → 2 **MISS** | 26.12; 19.59 → 35 **MISS** | VERIFIED_PLAYED |
| Patrick Williams | 10.25 → DNP | 4.39 → DNP | 2.68 → DNP | 1.37 → DNP | 29.44; 25.02 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Tre Johnson | 10.40 → 13 **MISS** | 2.85 → 2 **MISS** | 1.86 → 2 **HIT** | 1.21 → 2 **MISS** | 23.00; 16.10 → 23 **HIT** | VERIFIED_PLAYED |
| Tre Jones | 14.77 → 10 **MISS** | 3.57 → 2 **MISS** | 3.58 → 3 **MISS** | 0.66 → 1 **HIT** | 22.95; 21.80 → 18 **MISS** | VERIFIED_PLAYED |
| Will Riley | 12.95 → 2 **MISS** | 4.11 → 0 **MISS** | 2.88 → 0 **MISS** | 0.98 → 0 **MISS** | 27.01; 24.31 → 5 **MISS** | VERIFIED_PLAYED |

## San Antonio Spurs at Dallas Mavericks — 2026-10-25T00:00 UTC

Original player rows: 17; verified played: 16; DNP: 1; unverified: 0. Final away–home: 122–106.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Carter Bryant | 6.40 → 4 **MISS** | 2.43 → 1 **MISS** | 1.66 → 0 **MISS** | 0.89 → 0 **MISS** | 16.58; 15.75 → 10 **MISS** | VERIFIED_PLAYED |
| Cooper Flagg | 19.29 → DNP | 5.57 → DNP | 3.42 → DNP | 1.11 → DNP | 27.10; 25.75 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Daniel Gafford | 8.24 → 12 **MISS** | 4.29 → 9 **MISS** | 1.59 → 2 **HIT** | 0.21 → 0 **HIT** | 19.16; 14.37 → 23 **MISS** | VERIFIED_PLAYED |
| De'Aaron Fox | 16.35 → 19 **MISS** | 4.27 → 3 **MISS** | 5.74 → 9 **MISS** | 1.39 → 2 **MISS** | 31.41; 29.84 → 28 **MISS** | VERIFIED_PLAYED |
| Devin Vassell | 11.98 → 11 **MISS** | 4.75 → 4 **MISS** | 2.31 → 6 **MISS** | 1.83 → 1 **MISS** | 31.18; 29.62 → 32 **MISS** | VERIFIED_PLAYED |
| Dylan Harper | 14.23 → 22 **MISS** | 4.25 → 5 **MISS** | 3.64 → 2 **MISS** | 0.96 → 3 **MISS** | 28.69; 27.25 → 28 **MISS** | VERIFIED_PLAYED |
| Harrison Barnes | 7.10 → 0 **MISS** | 1.76 → 0 **MISS** | 1.22 → 0 **MISS** | 0.94 → 0 **MISS** | 18.82; 17.88 → 4 **MISS** | VERIFIED_PLAYED |
| Jordan McLaughlin | 2.26 → 0 **MISS** | 0.88 → 1 **HIT** | 0.68 → 0 **MISS** | 0.24 → 0 **HIT** | 6.20; 4.03 → 3 **MISS** | VERIFIED_PLAYED |
| Julian Champagnie | 9.62 → 12 **MISS** | 4.41 → 5 **MISS** | 1.77 → 3 **MISS** | 1.58 → 3 **MISS** | 26.33; 25.01 → 28 **MISS** | VERIFIED_PLAYED |
| Keldon Johnson | 12.44 → 7 **MISS** | 4.64 → 6 **MISS** | 1.60 → 3 **MISS** | 0.88 → 0 **MISS** | 22.95; 21.80 → 26 **MISS** | VERIFIED_PLAYED |
| Luke Kornet | 6.46 → 0 **MISS** | 3.84 → 4 **HIT** | 1.67 → 1 **MISS** | 0.18 → 0 **HIT** | 19.08; 16.21 → 14 **MISS** | VERIFIED_PLAYED |
| Max Christie | 11.16 → 5 **MISS** | 3.01 → 5 **MISS** | 2.12 → 1 **MISS** | 1.83 → 1 **MISS** | 28.59; 27.16 → 26 **MISS** | VERIFIED_PLAYED |
| Moussa Cisse | 7.41 → 4 **MISS** | 5.17 → 4 **MISS** | 0.91 → 0 **MISS** | 0.26 → 0 **HIT** | 17.50; 13.12 → 7 **MISS** | VERIFIED_PLAYED |
| Naji Marshall | 13.74 → 10 **MISS** | 3.82 → 4 **HIT** | 3.86 → 5 **MISS** | 0.74 → 1 **HIT** | 28.15; 19.71 → 21 **MISS** | VERIFIED_PLAYED |
| P.J. Washington | 14.25 → 12 **MISS** | 7.03 → 4 **MISS** | 1.39 → 2 **MISS** | 1.67 → 0 **MISS** | 31.03; 18.62 → 36 **MISS** | VERIFIED_PLAYED |
| Stephon Castle | 16.23 → 19 **MISS** | 6.56 → 4 **MISS** | 6.91 → 8 **MISS** | 1.80 → 3 **MISS** | 31.51; 26.78 → 28 **MISS** | VERIFIED_PLAYED |
| Victor Wembanyama | 23.14 → 23 **HIT** | 10.89 → 7 **MISS** | 3.44 → 2 **MISS** | 1.27 → 2 **MISS** | 29.52; 23.62 → 29 **MISS** | VERIFIED_PLAYED |

## Houston Rockets at Atlanta Hawks — 2026-10-25T00:30 UTC

Original player rows: 18; verified played: 15; DNP: 3; unverified: 0. Final away–home: 121–114.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alperen Sengun | 18.39 → 17 **MISS** | 7.72 → 10 **MISS** | 5.25 → 7 **MISS** | 0.96 → 1 **HIT** | 31.63; 28.46 → 33 **MISS** | VERIFIED_PLAYED |
| Amen Thompson | 19.48 → 17 **MISS** | 7.56 → 11 **MISS** | 5.21 → 6 **MISS** | 0.45 → 0 **HIT** | 37.95; 34.15 → 39 **MISS** | VERIFIED_PLAYED |
| Asa Newell | 5.22 → DNP | 2.30 → DNP | 1.16 → DNP | 0.44 → DNP | 12.60; 9.28 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| CJ McCollum | 16.27 → 17 **MISS** | 3.03 → 2 **MISS** | 3.87 → 1 **MISS** | 2.35 → 1 **MISS** | 28.10; 25.29 → 30 **MISS** | VERIFIED_PLAYED |
| Clint Capela | 4.59 → 2 **MISS** | 3.46 → 3 **HIT** | 0.87 → 1 **HIT** | 0.22 → 0 **HIT** | 12.28; 11.05 → 11 **MISS** | VERIFIED_PLAYED |
| Corey Kispert | 7.46 → DNP | 1.75 → DNP | 1.18 → DNP | 1.28 → DNP | 14.17; 10.63 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Dyson Daniels | 13.65 → 18 **MISS** | 7.21 → 8 **MISS** | 4.70 → 3 **MISS** | 0.74 → 1 **HIT** | 31.95; 27.16 → 29 **MISS** | VERIFIED_PLAYED |
| Isaiah Crawford | 3.45 → 0 **MISS** | 1.34 → 0 **MISS** | 0.65 → 0 **MISS** | 0.27 → 0 **HIT** | 8.20; 4.51 → 1 **MISS** | VERIFIED_PLAYED |
| Jabari Smith Jr. | 17.42 → 14 **MISS** | 6.39 → 5 **MISS** | 1.87 → 3 **MISS** | 2.45 → 2 **HIT** | 36.30; 32.67 → 33 **MISS** | VERIFIED_PLAYED |
| Jae'Sean Tate | 3.76 → 0 **MISS** | 1.97 → 0 **MISS** | 0.91 → 0 **MISS** | 0.24 → 0 **HIT** | 10.51; 8.93 → 1 **MISS** | VERIFIED_PLAYED |
| Jalen Johnson | 17.62 → 26 **MISS** | 8.43 → 9 **MISS** | 5.23 → 16 **MISS** | 1.31 → 2 **MISS** | 32.27; 29.05 → 38 **MISS** | VERIFIED_PLAYED |
| Jock Landale | 9.14 → 2 **MISS** | 4.36 → 4 **HIT** | 2.40 → 2 **HIT** | 0.78 → 0 **MISS** | 21.81; 14.18 → 19 **MISS** | VERIFIED_PLAYED |
| Kevin Durant | 24.02 → 22 **MISS** | 5.77 → 4 **MISS** | 5.51 → 2 **MISS** | 2.13 → 3 **MISS** | 36.94; 33.25 → 37 **HIT** | VERIFIED_PLAYED |
| Mouhamed Gueye | 3.95 → DNP | 2.63 → DNP | 1.05 → DNP | 0.52 → DNP | 13.23; 10.59 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nickeil Alexander-Walker | 21.55 → 18 **MISS** | 3.58 → 5 **MISS** | 3.38 → 4 **MISS** | 3.24 → 4 **MISS** | 33.58; 30.22 → 32 **MISS** | VERIFIED_PLAYED |
| Onyeka Okongwu | 11.38 → 8 **MISS** | 5.40 → 6 **MISS** | 2.52 → 2 **MISS** | 1.18 → 0 **MISS** | 29.45; 25.03 → 26 **MISS** | VERIFIED_PLAYED |
| Reed Sheppard | 10.38 → 19 **MISS** | 3.00 → 6 **MISS** | 2.53 → 7 **MISS** | 2.03 → 5 **MISS** | 21.62; 19.46 → 30 **MISS** | VERIFIED_PLAYED |
| Tari Eason | 9.65 → 19 **MISS** | 4.52 → 3 **MISS** | 1.25 → 0 **MISS** | 0.89 → 0 **MISS** | 21.71; 20.63 → 31 **MISS** | VERIFIED_PLAYED |

## New Orleans Pelicans at Denver Nuggets — 2026-10-25T01:00 UTC

Original player rows: 19; verified played: 14; DNP: 5; unverified: 0. Final away–home: 135–141.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Gordon | 13.66 → 7 **MISS** | 4.89 → 5 **HIT** | 2.91 → 4 **MISS** | 1.50 → 1 **MISS** | 29.54; 22.16 → 37 **MISS** | VERIFIED_PLAYED |
| Cameron Johnson | 13.69 → DNP | 4.49 → DNP | 2.91 → DNP | 2.08 → DNP | 30.01; 25.50 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Christian Braun | 13.64 → 15 **MISS** | 4.98 → 8 **MISS** | 2.36 → 2 **HIT** | 1.18 → 0 **MISS** | 33.26; 28.27 → 40 **MISS** | VERIFIED_PLAYED |
| DaRon Holmes II | 1.29 → DNP | 0.54 → DNP | 0.26 → DNP | 0.14 → DNP | 3.00; 2.25 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Dejounte Murray | 15.54 → 22 **MISS** | 5.03 → 6 **MISS** | 5.46 → 6 **MISS** | 1.07 → 1 **HIT** | 29.84; 19.39 → 35 **MISS** | VERIFIED_PLAYED |
| Derik Queen | 14.96 → 17 **MISS** | 8.96 → 8 **MISS** | 3.18 → 2 **MISS** | 0.47 → 0 **HIT** | 31.16; 29.60 → 25 **MISS** | VERIFIED_PLAYED |
| Herbert Jones | 6.35 → 2 **MISS** | 2.22 → 3 **MISS** | 1.62 → 1 **MISS** | 1.10 → 0 **MISS** | 19.08; 15.26 → 16 **MISS** | VERIFIED_PLAYED |
| Jamal Murray | 21.99 → 42 **MISS** | 5.26 → 3 **MISS** | 6.13 → 6 **HIT** | 3.44 → 8 **MISS** | 38.29; 32.54 → 43 **MISS** | VERIFIED_PLAYED |
| Jeremiah Fears | 20.94 → 10 **MISS** | 4.20 → 6 **MISS** | 3.99 → 2 **MISS** | 1.51 → 0 **MISS** | 33.27; 31.61 → 23 **MISS** | VERIFIED_PLAYED |
| Jordan Poole | 9.72 → 6 **MISS** | 2.20 → 3 **MISS** | 2.38 → 7 **MISS** | 1.26 → 2 **MISS** | 20.38; 15.28 → 23 **MISS** | VERIFIED_PLAYED |
| Julian Strawther | 10.20 → DNP | 2.69 → DNP | 1.73 → DNP | 1.45 → DNP | 20.17; 18.16 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Karlo Matkovic | 6.59 → 3 **MISS** | 3.52 → 0 **MISS** | 0.91 → 0 **MISS** | 0.52 → 1 **HIT** | 16.80; 10.08 → 8 **MISS** | VERIFIED_PLAYED |
| Nikola Jokic | 21.72 → 35 **MISS** | 10.74 → 15 **MISS** | 8.60 → 10 **MISS** | 1.03 → 3 **MISS** | 34.62; 31.15 → 44 **MISS** | VERIFIED_PLAYED |
| Saddiq Bey | 17.30 → 14 **MISS** | 4.19 → 4 **HIT** | 2.10 → 3 **MISS** | 2.35 → 2 **HIT** | 29.83; 23.86 → 25 **MISS** | VERIFIED_PLAYED |
| Trey Murphy III | 15.11 → 26 **MISS** | 5.58 → 6 **HIT** | 2.98 → 4 **MISS** | 2.06 → 4 **MISS** | 34.06; 22.14 → 37 **MISS** | VERIFIED_PLAYED |
| Tyus Jones | 3.70 → 2 **MISS** | 1.58 → 0 **MISS** | 1.20 → 0 **MISS** | 0.46 → 0 **HIT** | 10.82; 7.57 → 10 **MISS** | VERIFIED_PLAYED |
| Yves Missi | 8.72 → DNP | 6.41 → DNP | 2.06 → DNP | 0.21 → DNP | 23.94; 19.15 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Zeke Nnaji | 3.28 → DNP | 1.64 → DNP | 0.88 → DNP | 0.24 → DNP | 10.03; 6.52 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Zion Williamson | 16.93 → 17 **HIT** | 4.62 → 1 **MISS** | 2.71 → 2 **MISS** | 0.39 → 0 **HIT** | 30.31; 24.24 → 33 **MISS** | VERIFIED_PLAYED |

## Golden State Warriors at Phoenix Suns — 2026-10-25T02:00 UTC

Original player rows: 21; verified played: 13; DNP: 8; unverified: 0. Final away–home: 122–131.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Al Horford | 5.34 → DNP | 2.47 → DNP | 1.32 → DNP | 0.66 → DNP | 15.60; 10.14 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Brandin Podziemski | 16.79 → DNP | 3.91 → DNP | 2.85 → DNP | 1.78 → DNP | 29.76; 25.30 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Collin Gillespie | 7.36 → 11 **MISS** | 3.18 → 4 **MISS** | 2.60 → 9 **MISS** | 1.21 → 2 **MISS** | 22.48; 20.23 → 28 **MISS** | VERIFIED_PLAYED |
| De'Anthony Melton | 7.32 → 25 **MISS** | 3.04 → 5 **MISS** | 2.11 → 5 **MISS** | 0.87 → 4 **MISS** | 20.92; 17.78 → 27 **MISS** | VERIFIED_PLAYED |
| Devin Booker | 24.61 → 43 **MISS** | 3.93 → 7 **MISS** | 5.53 → 7 **MISS** | 1.75 → 2 **HIT** | 34.71; 29.51 → 36 **MISS** | VERIFIED_PLAYED |
| Dillon Brooks | 13.22 → 15 **MISS** | 3.78 → 2 **MISS** | 1.98 → 5 **MISS** | 1.27 → 1 **HIT** | 28.99; 24.41 → 34 **MISS** | VERIFIED_PLAYED |
| Draymond Green | 7.68 → DNP | 4.62 → DNP | 5.62 → DNP | 0.95 → DNP | 27.34; 23.23 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Gary Payton II | 8.15 → 2 **MISS** | 2.73 → 1 **MISS** | 1.04 → 0 **MISS** | 0.33 → 0 **HIT** | 16.24; 13.80 → 17 **MISS** | VERIFIED_PLAYED |
| Gui Santos | 11.23 → 7 **MISS** | 4.23 → 4 **HIT** | 2.61 → 3 **HIT** | 1.03 → 1 **HIT** | 25.42; 20.34 → 23 **MISS** | VERIFIED_PLAYED |
| Jalen Green | 15.24 → 12 **MISS** | 3.63 → 2 **MISS** | 2.99 → 1 **MISS** | 1.52 → 1 **MISS** | 26.68; 22.68 → 26 **MISS** | VERIFIED_PLAYED |
| Jamaree Bouyea | 5.66 → DNP | 2.01 → DNP | 1.96 → DNP | 0.43 → DNP | 14.25; 12.11 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jordan Goodwin | 7.94 → 9 **MISS** | 4.26 → 2 **MISS** | 1.52 → 4 **MISS** | 1.53 → 1 **MISS** | 21.38; 18.17 → 20 **MISS** | VERIFIED_PLAYED |
| Khaman Maluach | 6.07 → 9 **MISS** | 4.90 → 9 **MISS** | 0.69 → 3 **MISS** | 0.38 → 1 **MISS** | 16.37; 14.74 → 28 **MISS** | VERIFIED_PLAYED |
| Kristaps Porzingis | 14.69 → DNP | 5.49 → DNP | 2.21 → DNP | 1.28 → DNP | 25.70; 17.99 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| LJ Cryer | 8.25 → 3 **MISS** | 1.72 → 1 **MISS** | 1.57 → 1 **MISS** | 1.47 → 1 **HIT** | 18.01; 12.61 → 14 **MISS** | VERIFIED_PLAYED |
| Malevy Leons | 5.75 → 2 **MISS** | 2.34 → 0 **MISS** | 1.46 → 0 **MISS** | 0.31 → 0 **HIT** | 16.37; 12.28 → 4 **MISS** | VERIFIED_PLAYED |
| Oso Ighodaro | 6.58 → DNP | 4.38 → DNP | 2.02 → DNP | 0.16 → DNP | 18.84; 17.90 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Rasheer Fleming | 6.31 → DNP | 2.68 → DNP | 0.96 → DNP | 0.87 → DNP | 18.48; 16.63 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ryan Dunn | 6.47 → 5 **MISS** | 4.14 → 5 **MISS** | 1.66 → 0 **MISS** | 0.62 → 1 **HIT** | 19.13; 16.26 → 13 **MISS** | VERIFIED_PLAYED |
| Stephen Curry | 16.59 → DNP | 3.41 → DNP | 2.92 → DNP | 2.04 → DNP | 26.60; 20.69 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Will Richard | 3.63 → 11 **MISS** | 1.78 → 0 **MISS** | 0.83 → 1 **HIT** | 0.37 → 3 **MISS** | 12.84; 10.27 → 31 **MISS** | VERIFIED_PLAYED |

## Los Angeles Lakers at Utah Jazz — 2026-10-25T21:00 UTC

Original player rows: 11; verified played: 6; DNP: 5; unverified: 0. Final away–home: 132–123.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ace Bailey | 14.22 → 17 **MISS** | 4.87 → 12 **MISS** | 2.19 → 4 **MISS** | 1.63 → 1 **MISS** | 28.08; 25.27 → 29 **MISS** | VERIFIED_PLAYED |
| Adou Thiero | 3.26 → DNP | 1.27 → DNP | 0.74 → DNP | 0.22 → DNP | 8.19; 5.74 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Austin Reaves | 18.70 → 29 **MISS** | 4.04 → 1 **MISS** | 5.02 → 4 **MISS** | 1.49 → 4 **MISS** | 33.86; 23.70 → 36 **MISS** | VERIFIED_PLAYED |
| Blake Hinson | 12.18 → DNP | 2.72 → DNP | 1.83 → DNP | 1.79 → DNP | 20.60; 12.36 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Brice Sensabaugh | 15.31 → 7 **MISS** | 3.11 → 6 **MISS** | 2.61 → 1 **MISS** | 2.03 → 1 **MISS** | 23.69; 21.32 → 17 **MISS** | VERIFIED_PLAYED |
| Bronny James | 5.93 → DNP | 1.50 → DNP | 1.42 → DNP | 0.78 → DNP | 15.84; 14.26 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Isaiah Collier | 9.98 → 6 **MISS** | 2.92 → 3 **HIT** | 3.92 → 6 **MISS** | 0.42 → 0 **HIT** | 22.20; 12.21 → 13 **MISS** | VERIFIED_PLAYED |
| Jake LaRavia | 7.37 → 0 **MISS** | 4.16 → 4 **HIT** | 1.82 → 1 **MISS** | 0.86 → 0 **MISS** | 25.70; 23.13 → 15 **MISS** | VERIFIED_PLAYED |
| Jarred Vanderbilt | 5.00 → DNP | 3.24 → DNP | 1.58 → DNP | 0.38 → DNP | 15.38; 12.30 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kyle Filipowski | 11.17 → DNP | 5.40 → DNP | 2.53 → DNP | 0.73 → DNP | 21.26; 18.07 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Luka Doncic | 28.13 → 52 **MISS** | 6.12 → 8 **MISS** | 6.18 → 10 **MISS** | 3.42 → 8 **MISS** | 34.48; 22.41 → 38 **MISS** | VERIFIED_PLAYED |

## Indiana Pacers at Brooklyn Nets — 2026-10-25T22:00 UTC

Original player rows: 16; verified played: 14; DNP: 2; unverified: 0. Final away–home: 136–109.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Nesmith | 14.34 → 13 **MISS** | 3.45 → 1 **MISS** | 1.60 → 2 **HIT** | 2.17 → 2 **HIT** | 29.03; 14.52 → 19 **MISS** | VERIFIED_PLAYED |
| Andrew Nembhard | 15.22 → 14 **MISS** | 3.15 → 1 **MISS** | 7.79 → 3 **MISS** | 1.25 → 4 **MISS** | 32.68; 19.61 → 30 **MISS** | VERIFIED_PLAYED |
| Ben Saraf | 13.18 → 2 **MISS** | 4.06 → 1 **MISS** | 3.80 → 0 **MISS** | 0.65 → 0 **MISS** | 30.63; 26.03 → 4 **MISS** | VERIFIED_PLAYED |
| Ben Sheppard | 7.43 → DNP | 2.63 → DNP | 1.53 → DNP | 0.99 → DNP | 19.99; 12.99 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Chaney Johnson | 7.78 → 4 **MISS** | 3.94 → 5 **MISS** | 1.96 → 0 **MISS** | 0.46 → 0 **HIT** | 19.12; 16.25 → 21 **MISS** | VERIFIED_PLAYED |
| Drake Powell | 8.82 → 0 **MISS** | 2.65 → 2 **MISS** | 1.67 → 3 **MISS** | 0.82 → 0 **MISS** | 27.72; 23.56 → 12 **MISS** | VERIFIED_PLAYED |
| Ivica Zubac | 11.40 → 2 **MISS** | 6.99 → 1 **MISS** | 1.89 → 2 **HIT** | 0.29 → 0 **HIT** | 25.81; 14.19 → 7 **MISS** | VERIFIED_PLAYED |
| Jalen Slawson | 7.88 → 1 **MISS** | 4.02 → 2 **MISS** | 2.47 → 0 **MISS** | 0.86 → 0 **MISS** | 23.94; 20.35 → 8 **MISS** | VERIFIED_PLAYED |
| Jarace Walker | 10.71 → 6 **MISS** | 4.64 → 7 **MISS** | 3.10 → 1 **MISS** | 1.51 → 0 **MISS** | 25.18; 17.63 → 19 **MISS** | VERIFIED_PLAYED |
| Jay Huff | 8.92 → 14 **MISS** | 4.23 → 2 **MISS** | 2.00 → 3 **MISS** | 1.08 → 2 **MISS** | 20.72; 18.65 → 21 **HIT** | VERIFIED_PLAYED |
| Kobe Brown | 9.39 → DNP | 4.06 → DNP | 2.47 → DNP | 1.35 → DNP | 23.90; 20.31 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Noah Clowney | 8.24 → 9 **MISS** | 3.62 → 5 **MISS** | 1.33 → 1 **HIT** | 0.83 → 1 **HIT** | 20.45; 14.32 → 20 **HIT** | VERIFIED_PLAYED |
| Nolan Traore | 9.62 → 17 **MISS** | 2.41 → 2 **HIT** | 2.94 → 5 **MISS** | 1.15 → 2 **MISS** | 19.82; 16.84 → 25 **MISS** | VERIFIED_PLAYED |
| Obi Toppin | 13.56 → 16 **MISS** | 4.30 → 6 **MISS** | 2.10 → 2 **HIT** | 1.67 → 4 **MISS** | 20.67; 19.64 → 20 **MISS** | VERIFIED_PLAYED |
| Pascal Siakam | 21.20 → 21 **HIT** | 5.67 → 7 **MISS** | 2.99 → 6 **MISS** | 1.38 → 3 **MISS** | 30.41; 21.29 → 26 **MISS** | VERIFIED_PLAYED |
| Quenton Jackson | 10.67 → 5 **MISS** | 2.98 → 1 **MISS** | 3.69 → 2 **MISS** | 0.70 → 0 **MISS** | 22.37; 21.25 → 18 **MISS** | VERIFIED_PLAYED |

## Orlando Magic at New York Knicks — 2026-10-25T23:00 UTC

Original player rows: 24; verified played: 15; DNP: 9; unverified: 0. Final away–home: 111–102.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alex Morales | 2.07 → DNP | 0.81 → DNP | 0.56 → DNP | 0.13 → DNP | 5.60; 3.64 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Colin Castleton | 2.03 → DNP | 0.94 → DNP | 0.44 → DNP | 0.12 → DNP | 5.00; 3.25 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Desmond Bane | 13.23 → 22 **MISS** | 3.29 → 6 **MISS** | 2.74 → 2 **MISS** | 1.47 → 4 **MISS** | 26.81; 25.47 → 35 **MISS** | VERIFIED_PLAYED |
| Franz Wagner | 15.71 → 23 **MISS** | 3.68 → 13 **MISS** | 2.76 → 9 **MISS** | 1.11 → 0 **MISS** | 25.55; 21.71 → 37 **MISS** | VERIFIED_PLAYED |
| Goga Bitadze | 6.79 → DNP | 4.90 → DNP | 1.33 → DNP | 0.17 → DNP | 15.43; 14.66 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jalen Brunson | 21.81 → 28 **MISS** | 3.18 → 3 **HIT** | 6.57 → 4 **MISS** | 1.57 → 1 **MISS** | 34.76; 27.81 → 32 **MISS** | VERIFIED_PLAYED |
| Jalen Suggs | 12.62 → 4 **MISS** | 4.00 → 6 **MISS** | 4.94 → 6 **MISS** | 2.14 → 0 **MISS** | 30.23; 28.72 → 34 **MISS** | VERIFIED_PLAYED |
| Jamal Cain | 6.69 → 5 **MISS** | 2.59 → 5 **MISS** | 1.12 → 0 **MISS** | 0.64 → 1 **HIT** | 17.04; 16.19 → 15 **MISS** | VERIFIED_PLAYED |
| Jase Richardson | 3.59 → 6 **MISS** | 1.15 → 1 **HIT** | 0.95 → 0 **MISS** | 0.27 → 2 **MISS** | 8.87; 7.10 → 17 **MISS** | VERIFIED_PLAYED |
| Jevon Carter | 5.62 → DNP | 1.87 → DNP | 1.68 → DNP | 0.83 → DNP | 17.41; 15.67 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jordan Clarkson | 5.71 → 0 **MISS** | 1.96 → 1 **MISS** | 1.42 → 0 **MISS** | 0.15 → 0 **HIT** | 14.14; 12.72 → 5 **MISS** | VERIFIED_PLAYED |
| Jose Alvarado | 9.25 → DNP | 2.99 → DNP | 3.48 → DNP | 1.30 → DNP | 20.95; 16.76 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Josh Hart | 12.32 → 13 **MISS** | 5.57 → 8 **MISS** | 3.20 → 2 **MISS** | 1.58 → 3 **MISS** | 30.90; 26.27 → 35 **MISS** | VERIFIED_PLAYED |
| Karl-Anthony Towns | 17.84 → 22 **MISS** | 9.80 → 14 **MISS** | 3.66 → 4 **HIT** | 1.22 → 0 **MISS** | 28.96; 23.17 → 33 **MISS** | VERIFIED_PLAYED |
| Landry Shamet | 6.41 → 6 **HIT** | 2.10 → 2 **HIT** | 1.54 → 1 **MISS** | 1.04 → 2 **MISS** | 21.89; 16.42 → 22 **HIT** | VERIFIED_PLAYED |
| Mikal Bridges | 11.81 → 6 **MISS** | 2.86 → 5 **MISS** | 2.71 → 1 **MISS** | 1.20 → 0 **MISS** | 31.09; 26.42 → 35 **MISS** | VERIFIED_PLAYED |
| Miles McBride | 6.88 → 1 **MISS** | 2.05 → 1 **MISS** | 1.53 → 1 **MISS** | 1.11 → 0 **MISS** | 17.48; 13.98 → 13 **MISS** | VERIFIED_PLAYED |
| Mohamed Diawara | 4.50 → DNP | 1.59 → DNP | 1.40 → DNP | 0.40 → DNP | 12.90; 9.67 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Noah Penda | 1.65 → DNP | 0.92 → DNP | 0.78 → DNP | 0.16 → DNP | 6.54; 4.58 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| OG Anunoby | 14.27 → 22 **MISS** | 4.77 → 3 **MISS** | 1.82 → 2 **HIT** | 2.39 → 3 **MISS** | 31.44; 26.72 → 35 **MISS** | VERIFIED_PLAYED |
| Pacome Dadiet | 3.37 → DNP | 1.32 → DNP | 0.65 → DNP | 0.30 → DNP | 8.48; 5.51 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Paolo Banchero | 18.44 → DNP | 7.33 → DNP | 5.77 → DNP | 0.84 → DNP | 32.68; 31.04 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Tristan da Silva | 9.10 → 19 **MISS** | 3.13 → 2 **MISS** | 2.21 → 2 **HIT** | 1.07 → 5 **MISS** | 23.80; 22.61 → 27 **MISS** | VERIFIED_PLAYED |
| Wendell Carter Jr. | 12.13 → 9 **MISS** | 6.27 → 10 **MISS** | 1.34 → 2 **MISS** | 0.72 → 0 **MISS** | 27.59; 26.21 → 33 **MISS** | VERIFIED_PLAYED |

## Toronto Raptors at Minnesota Timberwolves — 2026-10-25T23:00 UTC

Original player rows: 20; verified played: 19; DNP: 1; unverified: 0. Final away–home: 94–117.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alijah Martin | 1.73 → 2 **HIT** | 0.61 → 2 **MISS** | 0.41 → 1 **MISS** | 0.13 → 0 **HIT** | 4.62; 3.70 → 7 **MISS** | VERIFIED_PLAYED |
| Anthony Edwards | 18.53 → 26 **MISS** | 4.37 → 1 **MISS** | 3.25 → 3 **HIT** | 2.26 → 2 **HIT** | 29.19; 20.44 → 28 **MISS** | VERIFIED_PLAYED |
| Ayo Dosunmu | 15.47 → 9 **MISS** | 5.28 → 3 **MISS** | 4.13 → 3 **MISS** | 1.22 → 1 **HIT** | 30.07; 25.56 → 23 **MISS** | VERIFIED_PLAYED |
| Bones Hyland | 9.63 → 3 **MISS** | 2.44 → 3 **MISS** | 2.22 → 2 **HIT** | 1.83 → 0 **MISS** | 18.79; 15.97 → 15 **MISS** | VERIFIED_PLAYED |
| Collin Murray-Boyles | 9.01 → 3 **MISS** | 4.46 → 7 **MISS** | 1.46 → 2 **MISS** | 0.18 → 0 **HIT** | 19.03; 17.12 → 19 **HIT** | VERIFIED_PLAYED |
| Donte DiVincenzo | 10.33 → DNP | 2.59 → DNP | 2.25 → DNP | 2.22 → DNP | 25.09; 21.33 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Immanuel Quickley | 10.76 → 19 **MISS** | 3.05 → 3 **HIT** | 3.99 → 2 **MISS** | 1.42 → 3 **MISS** | 24.82; 17.37 → 28 **MISS** | VERIFIED_PLAYED |
| Ja'Kobe Walter | 9.62 → 22 **MISS** | 3.23 → 4 **MISS** | 2.07 → 2 **HIT** | 1.86 → 5 **MISS** | 25.31; 24.05 → 31 **MISS** | VERIFIED_PLAYED |
| Jaden McDaniels | 15.33 → 14 **MISS** | 4.50 → 6 **MISS** | 2.19 → 3 **MISS** | 1.23 → 1 **HIT** | 30.07; 19.54 → 31 **MISS** | VERIFIED_PLAYED |
| Jakob Poeltl | 8.81 → 0 **MISS** | 4.61 → 1 **MISS** | 1.66 → 0 **MISS** | 0.18 → 0 **HIT** | 21.81; 20.72 → 19 **MISS** | VERIFIED_PLAYED |
| Jamal Shead | 6.81 → 4 **MISS** | 1.68 → 1 **MISS** | 4.42 → 0 **MISS** | 0.70 → 0 **MISS** | 22.72; 21.58 → 21 **MISS** | VERIFIED_PLAYED |
| Jamison Battle | 3.50 → 4 **MISS** | 1.26 → 1 **HIT** | 0.51 → 2 **MISS** | 0.43 → 1 **MISS** | 7.69; 6.53 → 13 **MISS** | VERIFIED_PLAYED |
| Jaylen Clark | 5.12 → 3 **MISS** | 2.10 → 1 **MISS** | 1.39 → 0 **MISS** | 0.63 → 0 **MISS** | 15.25; 12.96 → 5 **MISS** | VERIFIED_PLAYED |
| Joan Beringer | 8.77 → 6 **MISS** | 4.94 → 6 **MISS** | 1.19 → 0 **MISS** | 0.25 → 0 **HIT** | 18.68; 15.88 → 13 **MISS** | VERIFIED_PLAYED |
| RJ Barrett | 18.57 → 20 **MISS** | 5.27 → 2 **MISS** | 3.12 → 2 **MISS** | 1.01 → 0 **MISS** | 31.05; 27.95 → 32 **MISS** | VERIFIED_PLAYED |
| Rudy Gobert | 10.94 → 8 **MISS** | 10.40 → 13 **MISS** | 1.63 → 0 **MISS** | 0.21 → 0 **HIT** | 30.80; 24.64 → 31 **HIT** | VERIFIED_PLAYED |
| Scottie Barnes | 16.49 → 0 **MISS** | 6.18 → 3 **MISS** | 6.28 → 3 **MISS** | 0.75 → 0 **MISS** | 30.73; 29.19 → 28 **MISS** | VERIFIED_PLAYED |
| Terrence Shannon Jr. | 13.30 → 15 **MISS** | 2.67 → 4 **MISS** | 2.16 → 3 **MISS** | 1.45 → 3 **MISS** | 23.33; 22.17 → 23 **HIT** | VERIFIED_PLAYED |
| Trayce Jackson-Davis | 1.88 → 3 **MISS** | 0.79 → 1 **HIT** | 0.35 → 1 **MISS** | 0.08 → 0 **HIT** | 4.43; 3.32 → 6 **MISS** | VERIFIED_PLAYED |
| Zyon Pullin | 3.62 → 2 **MISS** | 1.06 → 1 **HIT** | 1.03 → 0 **MISS** | 0.23 → 0 **HIT** | 8.40; 5.04 → 5 **MISS** | VERIFIED_PLAYED |

## LA Clippers at Oklahoma City Thunder — 2026-10-25T23:00 UTC

Original player rows: 20; verified played: 16; DNP: 4; unverified: 0. Final away–home: 101–108.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ajay Mitchell | 8.81 → 18 **MISS** | 2.66 → 6 **MISS** | 2.94 → 4 **MISS** | 0.62 → 1 **HIT** | 21.89; 18.60 → 28 **MISS** | VERIFIED_PLAYED |
| Alex Caruso | 5.72 → 12 **MISS** | 2.92 → 7 **MISS** | 1.80 → 6 **MISS** | 0.76 → 2 **MISS** | 16.59; 13.27 → 22 **MISS** | VERIFIED_PLAYED |
| Brook Lopez | 13.60 → 15 **MISS** | 6.02 → 1 **MISS** | 1.74 → 2 **HIT** | 1.80 → 3 **MISS** | 26.66; 23.99 → 23 **MISS** | VERIFIED_PLAYED |
| Brooks Barnhizer | 4.08 → DNP | 2.22 → DNP | 0.93 → DNP | 0.32 → DNP | 12.35; 9.26 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Cam Christie | 1.53 → DNP | 0.65 → DNP | 0.34 → DNP | 0.08 → DNP | 4.51; 3.38 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Cason Wallace | 8.20 → 4 **MISS** | 2.77 → 3 **HIT** | 1.75 → 1 **MISS** | 1.32 → 0 **MISS** | 21.92; 18.63 → 6 **MISS** | VERIFIED_PLAYED |
| Chet Holmgren | 14.73 → 10 **MISS** | 7.86 → 4 **MISS** | 1.86 → 0 **MISS** | 1.15 → 2 **MISS** | 26.84; 22.81 → 31 **MISS** | VERIFIED_PLAYED |
| Darius Garland | 19.98 → 16 **MISS** | 2.54 → 4 **MISS** | 5.23 → 11 **MISS** | 2.62 → 2 **MISS** | 32.48; 27.61 → 36 **MISS** | VERIFIED_PLAYED |
| Derrick Jones Jr. | 8.64 → 11 **MISS** | 4.47 → 6 **MISS** | 1.76 → 1 **MISS** | 0.99 → 3 **MISS** | 26.71; 24.04 → 30 **MISS** | VERIFIED_PLAYED |
| Isaiah Hartenstein | 6.35 → 12 **MISS** | 6.02 → 12 **MISS** | 2.54 → 1 **MISS** | 0.17 → 0 **HIT** | 18.68; 14.95 → 27 **MISS** | VERIFIED_PLAYED |
| Isaiah Jackson | 8.54 → 10 **MISS** | 4.48 → 6 **MISS** | 1.63 → 4 **MISS** | 0.20 → 0 **HIT** | 19.62; 10.79 → 24 **MISS** | VERIFIED_PLAYED |
| Jalen Williams | 14.25 → 8 **MISS** | 4.82 → 2 **MISS** | 4.30 → 5 **MISS** | 0.74 → 0 **MISS** | 28.18; 21.13 → 32 **MISS** | VERIFIED_PLAYED |
| Jared McCain | 8.46 → 3 **MISS** | 2.04 → 1 **MISS** | 1.44 → 0 **MISS** | 1.07 → 1 **HIT** | 18.38; 17.46 → 21 **MISS** | VERIFIED_PLAYED |
| Jaylin Williams | 5.22 → 0 **MISS** | 3.99 → 0 **MISS** | 1.69 → 0 **MISS** | 0.90 → 0 **MISS** | 15.03; 12.77 → 5 **MISS** | VERIFIED_PLAYED |
| Jordan Miller | 11.09 → DNP | 3.34 → DNP | 2.59 → DNP | 0.68 → DNP | 25.82; 20.66 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kenrich Williams | 6.10 → 3 **MISS** | 3.27 → 1 **MISS** | 1.50 → 0 **MISS** | 0.69 → 1 **HIT** | 14.66; 13.19 → 7 **MISS** | VERIFIED_PLAYED |
| Kobe Sanders | 7.68 → 12 **MISS** | 1.95 → 4 **MISS** | 1.92 → 2 **HIT** | 0.97 → 2 **MISS** | 18.10; 16.29 → 20 **MISS** | VERIFIED_PLAYED |
| Kris Dunn | 6.60 → 15 **MISS** | 3.61 → 4 **HIT** | 3.67 → 6 **MISS** | 0.80 → 1 **HIT** | 27.61; 24.85 → 33 **MISS** | VERIFIED_PLAYED |
| Nikola Topic | 7.84 → DNP | 2.69 → DNP | 4.24 → DNP | 0.70 → DNP | 21.60; 15.92 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Shai Gilgeous-Alexander | 22.83 → 34 **MISS** | 3.49 → 6 **MISS** | 5.31 → 5 **HIT** | 1.67 → 1 **MISS** | 31.27; 26.58 → 36 **MISS** | VERIFIED_PLAYED |

## Detroit Pistons at Philadelphia 76ers — 2026-10-25T23:30 UTC

Original player rows: 18; verified played: 10; DNP: 8; unverified: 0. Final away–home: 106–93.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Adem Bona | 4.42 → 6 **MISS** | 2.84 → 13 **MISS** | 0.90 → 1 **HIT** | 0.17 → 0 **HIT** | 15.39; 13.85 → 25 **MISS** | VERIFIED_PLAYED |
| Ausar Thompson | 8.88 → DNP | 5.07 → DNP | 3.78 → DNP | 0.20 → DNP | 25.30; 24.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Cade Cunningham | 13.81 → 26 **MISS** | 3.96 → 8 **MISS** | 6.19 → 8 **MISS** | 0.92 → 3 **MISS** | 27.44; 19.21 → 33 **MISS** | VERIFIED_PLAYED |
| Chaz Lanier | 2.16 → DNP | 0.78 → DNP | 0.50 → DNP | 0.21 → DNP | 6.70; 5.02 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Daniss Jenkins | 9.21 → 18 **MISS** | 3.26 → 8 **MISS** | 3.95 → 6 **MISS** | 0.86 → 3 **MISS** | 20.99; 19.94 → 38 **MISS** | VERIFIED_PLAYED |
| Dominick Barlow | 5.62 → DNP | 4.04 → DNP | 1.36 → DNP | 0.19 → DNP | 19.85; 16.87 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Duncan Robinson | 14.04 → 21 **MISS** | 2.50 → 3 **MISS** | 2.19 → 3 **MISS** | 2.73 → 5 **MISS** | 26.03; 22.13 → 32 **MISS** | VERIFIED_PLAYED |
| Jabari Walker | 2.19 → DNP | 0.99 → DNP | 0.49 → DNP | 0.17 → DNP | 5.54; 4.16 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jalen Duren | 15.91 → DNP | 7.60 → DNP | 2.97 → DNP | 0.18 → DNP | 26.07; 22.16 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Javonte Green | 7.39 → 2 **MISS** | 2.85 → 3 **HIT** | 0.78 → 0 **MISS** | 1.35 → 0 **MISS** | 15.35; 14.59 → 22 **MISS** | VERIFIED_PLAYED |
| Joel Embiid | 21.24 → DNP | 7.84 → DNP | 3.57 → DNP | 1.58 → DNP | 34.50; 24.15 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Justin Edwards | 5.88 → DNP | 1.11 → DNP | 0.97 → DNP | 0.86 → DNP | 13.49; 10.79 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kevin Huerter | 9.39 → 9 **HIT** | 3.25 → 3 **HIT** | 2.66 → 2 **MISS** | 1.42 → 1 **HIT** | 22.18; 19.97 → 26 **MISS** | VERIFIED_PLAYED |
| Paul Reed | 10.00 → 8 **MISS** | 4.80 → 8 **MISS** | 1.74 → 2 **HIT** | 0.40 → 0 **HIT** | 17.36; 16.49 → 23 **MISS** | VERIFIED_PLAYED |
| Ronald Holland II | 7.23 → 2 **MISS** | 3.04 → 9 **MISS** | 1.50 → 4 **MISS** | 0.89 → 0 **MISS** | 17.72; 16.83 → 23 **MISS** | VERIFIED_PLAYED |
| Tolu Smith | 2.95 → 0 **MISS** | 1.47 → 1 **HIT** | 0.75 → 0 **MISS** | 0.14 → 0 **HIT** | 7.30; 5.11 → 3 **MISS** | VERIFIED_PLAYED |
| Tyrese Maxey | 22.86 → 29 **MISS** | 4.36 → 5 **MISS** | 4.92 → 4 **MISS** | 1.86 → 1 **MISS** | 36.60; 34.77 → 34 **MISS** | VERIFIED_PLAYED |
| VJ Edgecombe | 14.26 → DNP | 5.63 → DNP | 5.01 → DNP | 1.33 → DNP | 35.39; 33.62 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Memphis Grizzlies at Sacramento Kings — 2026-10-26T01:00 UTC

Original player rows: 14; verified played: 9; DNP: 5; unverified: 0. Final away–home: 123–112.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Cam Spencer | 8.47 → 13 **MISS** | 2.27 → 2 **HIT** | 4.02 → 1 **MISS** | 1.51 → 3 **MISS** | 20.34; 14.24 → 16 **MISS** | VERIFIED_PLAYED |
| Cedric Coward | 13.20 → 15 **MISS** | 3.86 → 11 **MISS** | 2.20 → 2 **HIT** | 1.29 → 3 **MISS** | 24.65; 18.49 → 32 **MISS** | VERIFIED_PLAYED |
| Daeqwon Plowden | 11.49 → 3 **MISS** | 2.91 → 3 **HIT** | 1.55 → 1 **MISS** | 1.73 → 1 **MISS** | 25.91; 22.03 → 16 **MISS** | VERIFIED_PLAYED |
| Dylan Cardwell | 5.79 → DNP | 5.51 → DNP | 1.65 → DNP | 0.26 → DNP | 19.10; 14.32 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| GG Jackson | 13.20 → 1 **MISS** | 4.17 → 3 **MISS** | 1.63 → 0 **MISS** | 1.22 → 0 **MISS** | 22.04; 16.53 → 10 **MISS** | VERIFIED_PLAYED |
| Jahmai Mashack | 10.21 → DNP | 4.54 → DNP | 4.58 → DNP | 0.81 → DNP | 31.37; 23.53 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Javon Small | 11.33 → DNP | 3.40 → DNP | 2.95 → DNP | 1.52 → DNP | 24.08; 14.45 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jaylen Wells | 9.88 → 16 **MISS** | 2.92 → 5 **MISS** | 1.51 → 3 **MISS** | 1.25 → 2 **MISS** | 23.64; 13.00 → 33 **MISS** | VERIFIED_PLAYED |
| Malik Monk | 10.28 → 6 **MISS** | 2.39 → 1 **MISS** | 3.77 → 2 **MISS** | 1.41 → 0 **MISS** | 22.51; 14.63 → 12 **MISS** | VERIFIED_PLAYED |
| Maxime Raynaud | 17.72 → DNP | 7.24 → DNP | 2.28 → DNP | 1.01 → DNP | 32.52; 24.39 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nique Clifford | 12.28 → DNP | 3.99 → DNP | 3.70 → DNP | 1.24 → DNP | 28.03; 23.82 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Precious Achiuwa | 13.63 → 12 **MISS** | 6.99 → 10 **MISS** | 2.09 → 0 **MISS** | 0.37 → 0 **HIT** | 28.22; 23.98 → 39 **MISS** | VERIFIED_PLAYED |
| Taylor Hendricks | 9.62 → 0 **MISS** | 3.98 → 1 **MISS** | 1.17 → 0 **MISS** | 1.19 → 0 **MISS** | 23.11; 15.02 → 7 **MISS** | VERIFIED_PLAYED |
| Ty Jerome | 18.59 → 31 **MISS** | 4.00 → 4 **HIT** | 4.47 → 6 **MISS** | 2.29 → 1 **MISS** | 27.60; 15.18 → 32 **MISS** | VERIFIED_PLAYED |

## Washington Wizards at Charlotte Hornets — 2026-10-26T23:00 UTC

Original player rows: 16; verified played: 10; DNP: 6; unverified: 0. Final away–home: 103–110.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alex Sarr | 7.92 → 12 **MISS** | 4.70 → 6 **MISS** | 2.85 → 1 **MISS** | 0.74 → 0 **MISS** | 22.94; 12.62 → 26 **MISS** | VERIFIED_PLAYED |
| Anthony Gill | 10.18 → DNP | 3.40 → DNP | 1.82 → DNP | 0.67 → DNP | 26.13; 23.52 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Bilal Coulibaly | 13.69 → 3 **MISS** | 3.98 → 5 **MISS** | 2.12 → 1 **MISS** | 1.13 → 0 **MISS** | 25.21; 18.91 → 29 **MISS** | VERIFIED_PLAYED |
| Brandon Miller | 16.25 → 39 **MISS** | 3.74 → 6 **MISS** | 1.98 → 1 **MISS** | 2.22 → 5 **MISS** | 30.50; 28.98 → 36 **MISS** | VERIFIED_PLAYED |
| Bub Carrington | 12.44 → 6 **MISS** | 2.14 → 0 **MISS** | 3.95 → 3 **MISS** | 2.24 → 2 **HIT** | 25.11; 23.86 → 28 **MISS** | VERIFIED_PLAYED |
| Coby White | 12.88 → DNP | 2.71 → DNP | 2.23 → DNP | 1.67 → DNP | 17.96; 14.36 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Grant Williams | 7.22 → DNP | 3.81 → DNP | 1.32 → DNP | 1.20 → DNP | 21.18; 15.88 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jamir Watkins | 12.39 → DNP | 5.37 → DNP | 2.24 → DNP | 1.42 → DNP | 29.85; 25.37 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Justin Champagnie | 10.00 → 2 **MISS** | 5.47 → 2 **MISS** | 1.76 → 0 **MISS** | 0.95 → 0 **MISS** | 24.02; 20.42 → 4 **MISS** | VERIFIED_PLAYED |
| Kon Knueppel | 13.57 → DNP | 5.09 → DNP | 3.28 → DNP | 2.13 → DNP | 30.75; 26.14 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Liam McNeeley | 3.39 → DNP | 1.77 → DNP | 0.59 → DNP | 0.27 → DNP | 8.00; 5.20 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Moussa Diabate | 8.45 → 11 **MISS** | 7.00 → 17 **MISS** | 2.46 → 3 **MISS** | 0.21 → 0 **HIT** | 27.41; 24.67 → 35 **MISS** | VERIFIED_PLAYED |
| Ryan Kalkbrenner | 5.88 → 6 **HIT** | 3.89 → 4 **HIT** | 1.34 → 1 **HIT** | 0.18 → 0 **HIT** | 18.35; 17.43 → 13 **MISS** | VERIFIED_PLAYED |
| Sion James | 5.88 → 5 **MISS** | 3.57 → 2 **MISS** | 2.14 → 3 **MISS** | 0.86 → 1 **HIT** | 21.59; 20.51 → 29 **MISS** | VERIFIED_PLAYED |
| Tre Johnson | 10.40 → 7 **MISS** | 2.85 → 3 **HIT** | 1.86 → 2 **HIT** | 1.21 → 1 **HIT** | 23.00; 16.10 → 23 **HIT** | VERIFIED_PLAYED |
| Will Riley | 12.95 → 2 **MISS** | 4.11 → 0 **MISS** | 2.88 → 0 **MISS** | 0.98 → 0 **MISS** | 27.01; 24.31 → 4 **MISS** | VERIFIED_PLAYED |

## Minnesota Timberwolves at Cleveland Cavaliers — 2026-10-26T23:00 UTC

Original player rows: 19; verified played: 13; DNP: 6; unverified: 0. Final away–home: 125–127.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Anthony Edwards | 18.53 → 47 **MISS** | 4.37 → 4 **HIT** | 3.25 → 4 **MISS** | 2.26 → 5 **MISS** | 29.19; 20.44 → 41 **MISS** | VERIFIED_PLAYED |
| Ayo Dosunmu | 15.47 → 9 **MISS** | 5.28 → 1 **MISS** | 4.13 → 0 **MISS** | 1.22 → 1 **HIT** | 30.07; 25.56 → 26 **MISS** | VERIFIED_PLAYED |
| Bones Hyland | 9.63 → 0 **MISS** | 2.44 → 1 **MISS** | 2.22 → 2 **HIT** | 1.83 → 0 **MISS** | 18.79; 15.97 → 5 **MISS** | VERIFIED_PLAYED |
| Craig Porter Jr. | 6.27 → DNP | 3.92 → DNP | 2.24 → DNP | 0.55 → DNP | 19.85; 15.88 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Donovan Mitchell | 23.19 → 26 **MISS** | 5.30 → 5 **HIT** | 4.19 → 7 **MISS** | 1.81 → 5 **MISS** | 32.84; 26.28 → 38 **MISS** | VERIFIED_PLAYED |
| Donte DiVincenzo | 10.33 → DNP | 2.59 → DNP | 2.25 → DNP | 2.22 → DNP | 25.09; 21.33 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Evan Mobley | 16.43 → 18 **MISS** | 8.37 → 10 **MISS** | 3.14 → 3 **HIT** | 0.43 → 4 **MISS** | 30.05; 25.55 → 38 **MISS** | VERIFIED_PLAYED |
| Jaden McDaniels | 15.33 → 14 **MISS** | 4.50 → 6 **MISS** | 2.19 → 4 **MISS** | 1.23 → 2 **MISS** | 30.07; 19.54 → 37 **MISS** | VERIFIED_PLAYED |
| James Harden | 18.83 → 19 **HIT** | 3.94 → 5 **MISS** | 5.84 → 9 **MISS** | 2.76 → 3 **HIT** | 33.27; 28.28 → 39 **MISS** | VERIFIED_PLAYED |
| Jarrett Allen | 13.05 → 10 **MISS** | 6.27 → 9 **MISS** | 1.30 → 2 **MISS** | 0.31 → 0 **HIT** | 24.57; 18.43 → 27 **MISS** | VERIFIED_PLAYED |
| Jaylen Clark | 5.12 → DNP | 2.10 → DNP | 1.39 → DNP | 0.63 → DNP | 15.25; 12.96 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jaylon Tyson | 9.62 → 11 **MISS** | 4.11 → 4 **HIT** | 2.30 → 5 **MISS** | 0.84 → 0 **MISS** | 22.03; 13.22 → 20 **MISS** | VERIFIED_PLAYED |
| Joan Beringer | 8.77 → 12 **MISS** | 4.94 → 7 **MISS** | 1.19 → 0 **MISS** | 0.25 → 0 **HIT** | 18.68; 15.88 → 17 **MISS** | VERIFIED_PLAYED |
| Riley Minix | 4.03 → DNP | 1.19 → DNP | 0.82 → DNP | 0.35 → DNP | 9.20; 5.98 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Rudy Gobert | 10.94 → 5 **MISS** | 10.40 → 20 **MISS** | 1.63 → 2 **HIT** | 0.21 → 0 **HIT** | 30.80; 24.64 → 36 **MISS** | VERIFIED_PLAYED |
| Sam Merrill | 10.71 → 9 **MISS** | 3.33 → 4 **MISS** | 2.63 → 2 **MISS** | 1.65 → 1 **MISS** | 26.95; 20.21 → 31 **MISS** | VERIFIED_PLAYED |
| Terrence Shannon Jr. | 13.30 → 14 **MISS** | 2.67 → 4 **MISS** | 2.16 → 5 **MISS** | 1.45 → 3 **MISS** | 23.33; 22.17 → 24 **MISS** | VERIFIED_PLAYED |
| Tyrese Proctor | 7.31 → DNP | 2.41 → DNP | 1.89 → DNP | 0.84 → DNP | 14.68; 12.48 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Zyon Pullin | 3.62 → DNP | 1.06 → DNP | 1.03 → DNP | 0.23 → DNP | 8.40; 5.04 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Chicago Bulls at Boston Celtics — 2026-10-26T23:30 UTC

Original player rows: 17; verified played: 16; DNP: 1; unverified: 0. Final away–home: 99–134.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Baylor Scheierman | 10.57 → 2 **MISS** | 3.51 → 6 **MISS** | 2.11 → 2 **HIT** | 2.08 → 0 **MISS** | 23.99; 21.59 → 18 **MISS** | VERIFIED_PLAYED |
| Derrick White | 11.58 → 5 **MISS** | 3.68 → 6 **MISS** | 3.99 → 4 **HIT** | 1.78 → 1 **MISS** | 32.77; 27.85 → 18 **MISS** | VERIFIED_PLAYED |
| Hugo Gonzalez | 3.56 → 13 **MISS** | 2.17 → 5 **MISS** | 0.60 → 2 **MISS** | 0.46 → 1 **MISS** | 11.08; 7.75 → 24 **MISS** | VERIFIED_PLAYED |
| Isaac Okoro | 9.71 → 1 **MISS** | 2.85 → 1 **MISS** | 1.86 → 4 **MISS** | 0.86 → 0 **MISS** | 25.01; 20.01 → 11 **MISS** | VERIFIED_PLAYED |
| Jalen Smith | 9.08 → 7 **MISS** | 4.41 → 6 **MISS** | 1.29 → 1 **HIT** | 0.87 → 2 **MISS** | 18.93; 10.41 → 20 **MISS** | VERIFIED_PLAYED |
| Jayson Tatum | 20.15 → 23 **MISS** | 9.00 → 7 **MISS** | 5.96 → 6 **HIT** | 2.31 → 2 **HIT** | 35.69; 26.77 → 28 **MISS** | VERIFIED_PLAYED |
| Jordan Walsh | 6.53 → 4 **MISS** | 3.79 → 3 **MISS** | 1.45 → 2 **MISS** | 0.81 → 0 **MISS** | 20.92; 18.82 → 18 **MISS** | VERIFIED_PLAYED |
| Josh Giddey | 10.45 → 11 **MISS** | 6.52 → 1 **MISS** | 7.56 → 4 **MISS** | 1.05 → 1 **HIT** | 29.89; 19.43 → 24 **MISS** | VERIFIED_PLAYED |
| Leonard Miller | 15.00 → 9 **MISS** | 6.46 → 9 **MISS** | 2.14 → 0 **MISS** | 1.38 → 1 **HIT** | 31.08; 29.52 → 14 **MISS** | VERIFIED_PLAYED |
| Luka Garza | 9.91 → 6 **MISS** | 4.26 → 3 **MISS** | 1.14 → 2 **MISS** | 0.82 → 0 **MISS** | 18.05; 13.54 → 13 **MISS** | VERIFIED_PLAYED |
| Matas Buzelis | 13.35 → 11 **MISS** | 5.83 → 1 **MISS** | 1.99 → 2 **HIT** | 1.27 → 2 **MISS** | 26.12; 19.59 → 22 **MISS** | VERIFIED_PLAYED |
| Neemias Queta | 10.22 → 7 **MISS** | 6.60 → 5 **MISS** | 2.29 → 1 **MISS** | 0.27 → 0 **HIT** | 24.31; 19.45 → 19 **MISS** | VERIFIED_PLAYED |
| Patrick Williams | 10.25 → DNP | 4.39 → DNP | 2.68 → DNP | 1.37 → DNP | 29.44; 25.02 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Payton Pritchard | 16.81 → 28 **MISS** | 3.48 → 1 **MISS** | 3.77 → 4 **HIT** | 2.60 → 7 **MISS** | 30.64; 26.04 → 22 **MISS** | VERIFIED_PLAYED |
| Ron Harper Jr. | 5.69 → 3 **MISS** | 1.89 → 1 **MISS** | 1.15 → 0 **MISS** | 0.70 → 1 **HIT** | 12.65; 8.23 → 7 **MISS** | VERIFIED_PLAYED |
| Sam Hauser | 10.00 → 11 **MISS** | 3.57 → 4 **HIT** | 1.82 → 1 **MISS** | 2.08 → 3 **MISS** | 24.24; 20.60 → 20 **MISS** | VERIFIED_PLAYED |
| Tre Jones | 14.77 → 8 **MISS** | 3.57 → 1 **MISS** | 3.58 → 0 **MISS** | 0.66 → 0 **MISS** | 22.95; 21.80 → 15 **MISS** | VERIFIED_PLAYED |

## Dallas Mavericks at Miami Heat — 2026-10-26T23:30 UTC

Original player rows: 15; verified played: 9; DNP: 6; unverified: 0. Final away–home: 113–109.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Andrew Wiggins | 10.45 → 12 **MISS** | 3.52 → 3 **MISS** | 2.17 → 1 **MISS** | 1.46 → 0 **MISS** | 25.80; 24.51 → 34 **MISS** | VERIFIED_PLAYED |
| Bam Adebayo | 16.11 → 8 **MISS** | 8.75 → 8 **MISS** | 4.39 → 3 **MISS** | 1.33 → 0 **MISS** | 32.24; 30.62 → 30 **MISS** | VERIFIED_PLAYED |
| Cooper Flagg | 19.29 → 29 **MISS** | 5.57 → 6 **HIT** | 3.42 → 11 **MISS** | 1.11 → 2 **MISS** | 27.10; 25.75 → 40 **MISS** | VERIFIED_PLAYED |
| Daniel Gafford | 8.24 → 8 **HIT** | 4.29 → 9 **MISS** | 1.59 → 3 **MISS** | 0.21 → 0 **HIT** | 19.16; 14.37 → 26 **MISS** | VERIFIED_PLAYED |
| Davion Mitchell | 11.76 → 21 **MISS** | 2.73 → 0 **MISS** | 5.29 → 2 **MISS** | 1.32 → 2 **MISS** | 30.27; 27.24 → 33 **MISS** | VERIFIED_PLAYED |
| Dru Smith | 2.87 → 6 **MISS** | 0.97 → 2 **MISS** | 0.91 → 1 **HIT** | 0.18 → 2 **MISS** | 7.59; 4.94 → 15 **MISS** | VERIFIED_PLAYED |
| Keshad Johnson | 6.13 → DNP | 2.15 → DNP | 1.02 → DNP | 0.40 → DNP | 13.35; 9.35 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Max Christie | 11.16 → 11 **HIT** | 3.01 → 5 **MISS** | 2.12 → 3 **MISS** | 1.83 → 3 **MISS** | 28.59; 27.16 → 26 **MISS** | VERIFIED_PLAYED |
| Moussa Cisse | 7.41 → DNP | 5.17 → DNP | 0.91 → DNP | 0.26 → DNP | 17.50; 13.12 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Myron Gardner | 1.83 → DNP | 0.85 → DNP | 0.47 → DNP | 0.15 → DNP | 4.57; 3.66 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Naji Marshall | 13.74 → DNP | 3.82 → DNP | 3.86 → DNP | 0.74 → DNP | 28.15; 19.71 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| P.J. Washington | 14.25 → 20 **MISS** | 7.03 → 9 **MISS** | 1.39 → 2 **MISS** | 1.67 → 4 **MISS** | 31.03; 18.62 → 41 **MISS** | VERIFIED_PLAYED |
| Pelle Larsson | 11.15 → 12 **MISS** | 3.45 → 0 **MISS** | 2.91 → 4 **MISS** | 0.75 → 1 **HIT** | 27.82; 25.04 → 34 **MISS** | VERIFIED_PLAYED |
| Simone Fontecchio | 6.24 → DNP | 1.80 → DNP | 1.13 → DNP | 1.07 → DNP | 12.52; 10.02 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Vladislav Goldin | 1.13 → DNP | 0.51 → DNP | 0.27 → DNP | 0.08 → DNP | 3.00; 1.95 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Indiana Pacers at Milwaukee Bucks — 2026-10-27T00:00 UTC

Original player rows: 20; verified played: 12; DNP: 8; unverified: 0. Final away–home: 102–110.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Nesmith | 14.34 → 13 **MISS** | 3.45 → 0 **MISS** | 1.60 → 1 **MISS** | 2.17 → 3 **MISS** | 29.03; 14.52 → 21 **MISS** | VERIFIED_PLAYED |
| AJ Green | 14.05 → 3 **MISS** | 3.50 → 4 **MISS** | 2.04 → 3 **MISS** | 3.46 → 1 **MISS** | 28.60; 27.17 → 20 **MISS** | VERIFIED_PLAYED |
| Andrew Nembhard | 15.22 → DNP | 3.15 → DNP | 7.79 → DNP | 1.25 → DNP | 32.68; 19.61 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ben Sheppard | 7.43 → DNP | 2.63 → DNP | 1.53 → DNP | 0.99 → DNP | 19.99; 12.99 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Cormac Ryan | 15.82 → DNP | 3.74 → DNP | 2.30 → DNP | 2.35 → DNP | 29.68; 23.74 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Gary Trent Jr. | 11.55 → DNP | 1.90 → DNP | 1.53 → DNP | 2.06 → DNP | 22.90; 13.74 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ivica Zubac | 11.40 → DNP | 6.99 → DNP | 1.89 → DNP | 0.29 → DNP | 25.81; 14.19 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jalen Slawson | 7.88 → 2 **MISS** | 4.02 → 1 **MISS** | 2.47 → 0 **MISS** | 0.86 → 0 **MISS** | 23.94; 20.35 → 3 **MISS** | VERIFIED_PLAYED |
| Jarace Walker | 10.71 → 10 **MISS** | 4.64 → 8 **MISS** | 3.10 → 2 **MISS** | 1.51 → 2 **HIT** | 25.18; 17.63 → 29 **MISS** | VERIFIED_PLAYED |
| Jay Huff | 8.92 → 6 **MISS** | 4.23 → 6 **MISS** | 2.00 → 1 **MISS** | 1.08 → 0 **MISS** | 20.72; 18.65 → 23 **MISS** | VERIFIED_PLAYED |
| Jericho Sims | 9.60 → DNP | 6.70 → DNP | 3.39 → DNP | 0.21 → DNP | 27.28; 24.55 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kobe Brown | 9.39 → DNP | 4.06 → DNP | 2.47 → DNP | 1.35 → DNP | 23.90; 20.31 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kyle Kuzma | 9.81 → 17 **MISS** | 4.25 → 7 **MISS** | 3.10 → 3 **HIT** | 0.99 → 4 **MISS** | 24.40; 18.30 → 29 **MISS** | VERIFIED_PLAYED |
| Myles Turner | 10.56 → 6 **MISS** | 4.47 → 9 **MISS** | 1.55 → 4 **MISS** | 1.40 → 0 **MISS** | 25.55; 19.16 → 28 **MISS** | VERIFIED_PLAYED |
| Obi Toppin | 13.56 → 14 **HIT** | 4.30 → 6 **MISS** | 2.10 → 2 **HIT** | 1.67 → 2 **HIT** | 20.67; 19.64 → 23 **MISS** | VERIFIED_PLAYED |
| Ousmane Dieng | 11.19 → 0 **MISS** | 4.86 → 0 **MISS** | 4.49 → 0 **MISS** | 0.84 → 0 **MISS** | 28.56; 27.14 → 3 **MISS** | VERIFIED_PLAYED |
| Pascal Siakam | 21.20 → 20 **MISS** | 5.67 → 13 **MISS** | 2.99 → 6 **MISS** | 1.38 → 1 **HIT** | 30.41; 21.29 → 37 **MISS** | VERIFIED_PLAYED |
| Pete Nance | 9.17 → DNP | 4.28 → DNP | 2.29 → DNP | 1.39 → DNP | 27.90; 20.92 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Quenton Jackson | 10.67 → 4 **MISS** | 2.98 → 2 **MISS** | 3.69 → 4 **HIT** | 0.70 → 0 **MISS** | 22.37; 21.25 → 27 **MISS** | VERIFIED_PLAYED |
| Ryan Rollins | 17.60 → 19 **MISS** | 4.69 → 2 **MISS** | 4.85 → 4 **MISS** | 2.16 → 3 **MISS** | 31.57; 22.10 → 32 **HIT** | VERIFIED_PLAYED |

## Phoenix Suns at Oklahoma City Thunder — 2026-10-27T00:00 UTC

Original player rows: 22; verified played: 17; DNP: 5; unverified: 0. Final away–home: 114–125.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ajay Mitchell | 8.81 → 30 **MISS** | 2.66 → 2 **MISS** | 2.94 → 5 **MISS** | 0.62 → 1 **HIT** | 21.89; 18.60 → 25 **MISS** | VERIFIED_PLAYED |
| Alex Caruso | 5.72 → 9 **MISS** | 2.92 → 2 **MISS** | 1.80 → 3 **MISS** | 0.76 → 3 **MISS** | 16.59; 13.27 → 9 **MISS** | VERIFIED_PLAYED |
| Brooks Barnhizer | 4.08 → 0 **MISS** | 2.22 → 0 **MISS** | 0.93 → 0 **MISS** | 0.32 → 0 **HIT** | 12.35; 9.26 → 3 **MISS** | VERIFIED_PLAYED |
| Cason Wallace | 8.20 → DNP | 2.77 → DNP | 1.75 → DNP | 1.32 → DNP | 21.92; 18.63 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Chet Holmgren | 14.73 → DNP | 7.86 → DNP | 1.86 → DNP | 1.15 → DNP | 26.84; 22.81 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Collin Gillespie | 7.36 → 9 **MISS** | 3.18 → 1 **MISS** | 2.60 → 2 **MISS** | 1.21 → 3 **MISS** | 22.48; 20.23 → 23 **MISS** | VERIFIED_PLAYED |
| Devin Booker | 24.61 → 3 **MISS** | 3.93 → 2 **MISS** | 5.53 → 7 **MISS** | 1.75 → 0 **MISS** | 34.71; 29.51 → 34 **MISS** | VERIFIED_PLAYED |
| Dillon Brooks | 13.22 → 19 **MISS** | 3.78 → 5 **MISS** | 1.98 → 5 **MISS** | 1.27 → 3 **MISS** | 28.99; 24.41 → 33 **MISS** | VERIFIED_PLAYED |
| Isaiah Hartenstein | 6.35 → 15 **MISS** | 6.02 → 13 **MISS** | 2.54 → 3 **HIT** | 0.17 → 0 **HIT** | 18.68; 14.95 → 26 **MISS** | VERIFIED_PLAYED |
| Jalen Green | 15.24 → 20 **MISS** | 3.63 → 4 **HIT** | 2.99 → 4 **MISS** | 1.52 → 1 **MISS** | 26.68; 22.68 → 31 **MISS** | VERIFIED_PLAYED |
| Jalen Williams | 14.25 → DNP | 4.82 → DNP | 4.30 → DNP | 0.74 → DNP | 28.18; 21.13 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jamaree Bouyea | 5.66 → 2 **MISS** | 2.01 → 0 **MISS** | 1.96 → 1 **MISS** | 0.43 → 0 **HIT** | 14.25; 12.11 → 3 **MISS** | VERIFIED_PLAYED |
| Jared McCain | 8.46 → 18 **MISS** | 2.04 → 3 **MISS** | 1.44 → 4 **MISS** | 1.07 → 4 **MISS** | 18.38; 17.46 → 30 **MISS** | VERIFIED_PLAYED |
| Jaylin Williams | 5.22 → 6 **MISS** | 3.99 → 6 **MISS** | 1.69 → 3 **MISS** | 0.90 → 2 **MISS** | 15.03; 12.77 → 26 **MISS** | VERIFIED_PLAYED |
| Jordan Goodwin | 7.94 → 12 **MISS** | 4.26 → 4 **HIT** | 1.52 → 2 **HIT** | 1.53 → 4 **MISS** | 21.38; 18.17 → 17 **MISS** | VERIFIED_PLAYED |
| Kenrich Williams | 6.10 → 3 **MISS** | 3.27 → 7 **MISS** | 1.50 → 0 **MISS** | 0.69 → 0 **MISS** | 14.66; 13.19 → 24 **MISS** | VERIFIED_PLAYED |
| Khaman Maluach | 6.07 → 12 **MISS** | 4.90 → 7 **MISS** | 0.69 → 1 **HIT** | 0.38 → 0 **HIT** | 16.37; 14.74 → 26 **MISS** | VERIFIED_PLAYED |
| Nikola Topic | 7.84 → DNP | 2.69 → DNP | 4.24 → DNP | 0.70 → DNP | 21.60; 15.92 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Oso Ighodaro | 6.58 → DNP | 4.38 → DNP | 2.02 → DNP | 0.16 → DNP | 18.84; 17.90 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Rasheer Fleming | 6.31 → 0 **MISS** | 2.68 → 1 **MISS** | 0.96 → 0 **MISS** | 0.87 → 0 **MISS** | 18.48; 16.63 → 3 **MISS** | VERIFIED_PLAYED |
| Ryan Dunn | 6.47 → 6 **HIT** | 4.14 → 2 **MISS** | 1.66 → 1 **MISS** | 0.62 → 1 **HIT** | 19.13; 16.26 → 14 **MISS** | VERIFIED_PLAYED |
| Shai Gilgeous-Alexander | 22.83 → 26 **MISS** | 3.49 → 3 **HIT** | 5.31 → 3 **MISS** | 1.67 → 1 **MISS** | 31.27; 26.58 → 30 **MISS** | VERIFIED_PLAYED |

## Atlanta Hawks at Houston Rockets — 2026-10-27T00:30 UTC

Original player rows: 18; verified played: 17; DNP: 1; unverified: 0. Final away–home: 110–120.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alperen Sengun | 18.39 → 29 **MISS** | 7.72 → 9 **MISS** | 5.25 → 9 **MISS** | 0.96 → 1 **HIT** | 31.63; 28.46 → 37 **MISS** | VERIFIED_PLAYED |
| Amen Thompson | 19.48 → 15 **MISS** | 7.56 → 5 **MISS** | 5.21 → 2 **MISS** | 0.45 → 0 **HIT** | 37.95; 34.15 → 28 **MISS** | VERIFIED_PLAYED |
| Asa Newell | 5.22 → 0 **MISS** | 2.30 → 1 **MISS** | 1.16 → 0 **MISS** | 0.44 → 0 **HIT** | 12.60; 9.28 → 1 **MISS** | VERIFIED_PLAYED |
| CJ McCollum | 16.27 → 20 **MISS** | 3.03 → 1 **MISS** | 3.87 → 3 **MISS** | 2.35 → 4 **MISS** | 28.10; 25.29 → 30 **MISS** | VERIFIED_PLAYED |
| Clint Capela | 4.59 → 2 **MISS** | 3.46 → 2 **MISS** | 0.87 → 0 **MISS** | 0.22 → 0 **HIT** | 12.28; 11.05 → 4 **MISS** | VERIFIED_PLAYED |
| Corey Kispert | 7.46 → 5 **MISS** | 1.75 → 0 **MISS** | 1.18 → 0 **MISS** | 1.28 → 1 **HIT** | 14.17; 10.63 → 1 **MISS** | VERIFIED_PLAYED |
| Dyson Daniels | 13.65 → 4 **MISS** | 7.21 → 0 **MISS** | 4.70 → 4 **MISS** | 0.74 → 0 **MISS** | 31.95; 27.16 → 28 **MISS** | VERIFIED_PLAYED |
| Isaiah Crawford | 3.45 → 0 **MISS** | 1.34 → 0 **MISS** | 0.65 → 0 **MISS** | 0.27 → 0 **HIT** | 8.20; 4.51 → 1 **MISS** | VERIFIED_PLAYED |
| Jabari Smith Jr. | 17.42 → 16 **MISS** | 6.39 → 12 **MISS** | 1.87 → 5 **MISS** | 2.45 → 2 **HIT** | 36.30; 32.67 → 39 **MISS** | VERIFIED_PLAYED |
| Jae'Sean Tate | 3.76 → 0 **MISS** | 1.97 → 1 **MISS** | 0.91 → 0 **MISS** | 0.24 → 0 **HIT** | 10.51; 8.93 → 1 **MISS** | VERIFIED_PLAYED |
| Jalen Johnson | 17.62 → 21 **MISS** | 8.43 → 9 **MISS** | 5.23 → 3 **MISS** | 1.31 → 1 **HIT** | 32.27; 29.05 → 36 **MISS** | VERIFIED_PLAYED |
| Jock Landale | 9.14 → 8 **MISS** | 4.36 → 6 **MISS** | 2.40 → 4 **MISS** | 0.78 → 0 **MISS** | 21.81; 14.18 → 18 **MISS** | VERIFIED_PLAYED |
| Kevin Durant | 24.02 → 22 **MISS** | 5.77 → 9 **MISS** | 5.51 → 3 **MISS** | 2.13 → 1 **MISS** | 36.94; 33.25 → 30 **MISS** | VERIFIED_PLAYED |
| Mouhamed Gueye | 3.95 → DNP | 2.63 → DNP | 1.05 → DNP | 0.52 → DNP | 13.23; 10.59 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nickeil Alexander-Walker | 21.55 → 12 **MISS** | 3.58 → 2 **MISS** | 3.38 → 3 **HIT** | 3.24 → 2 **MISS** | 33.58; 30.22 → 29 **MISS** | VERIFIED_PLAYED |
| Onyeka Okongwu | 11.38 → 11 **HIT** | 5.40 → 9 **MISS** | 2.52 → 1 **MISS** | 1.18 → 1 **HIT** | 29.45; 25.03 → 29 **HIT** | VERIFIED_PLAYED |
| Reed Sheppard | 10.38 → 13 **MISS** | 3.00 → 0 **MISS** | 2.53 → 4 **MISS** | 2.03 → 2 **HIT** | 21.62; 19.46 → 24 **MISS** | VERIFIED_PLAYED |
| Tari Eason | 9.65 → 13 **MISS** | 4.52 → 8 **MISS** | 1.25 → 2 **MISS** | 0.89 → 1 **HIT** | 21.71; 20.63 → 33 **MISS** | VERIFIED_PLAYED |

## Memphis Grizzlies at Utah Jazz — 2026-10-27T01:00 UTC

Original player rows: 13; verified played: 9; DNP: 4; unverified: 0. Final away–home: 110–105.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ace Bailey | 14.22 → 17 **MISS** | 4.87 → 10 **MISS** | 2.19 → 3 **MISS** | 1.63 → 3 **MISS** | 28.08; 25.27 → 34 **MISS** | VERIFIED_PLAYED |
| Blake Hinson | 12.18 → DNP | 2.72 → DNP | 1.83 → DNP | 1.79 → DNP | 20.60; 12.36 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Brice Sensabaugh | 15.31 → 11 **MISS** | 3.11 → 2 **MISS** | 2.61 → 0 **MISS** | 2.03 → 3 **MISS** | 23.69; 21.32 → 9 **MISS** | VERIFIED_PLAYED |
| Cam Spencer | 8.47 → 8 **HIT** | 2.27 → 5 **MISS** | 4.02 → 5 **MISS** | 1.51 → 2 **HIT** | 20.34; 14.24 → 18 **MISS** | VERIFIED_PLAYED |
| Cedric Coward | 13.20 → 16 **MISS** | 3.86 → 11 **MISS** | 2.20 → 3 **MISS** | 1.29 → 4 **MISS** | 24.65; 18.49 → 31 **MISS** | VERIFIED_PLAYED |
| GG Jackson | 13.20 → 4 **MISS** | 4.17 → 1 **MISS** | 1.63 → 2 **HIT** | 1.22 → 0 **MISS** | 22.04; 16.53 → 16 **MISS** | VERIFIED_PLAYED |
| Isaiah Collier | 9.98 → 7 **MISS** | 2.92 → 8 **MISS** | 3.92 → 8 **MISS** | 0.42 → 0 **HIT** | 22.20; 12.21 → 21 **MISS** | VERIFIED_PLAYED |
| Jahmai Mashack | 10.21 → DNP | 4.54 → DNP | 4.58 → DNP | 0.81 → DNP | 31.37; 23.53 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Javon Small | 11.33 → DNP | 3.40 → DNP | 2.95 → DNP | 1.52 → DNP | 24.08; 14.45 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jaylen Wells | 9.88 → 14 **MISS** | 2.92 → 3 **HIT** | 1.51 → 0 **MISS** | 1.25 → 2 **MISS** | 23.64; 13.00 → 30 **MISS** | VERIFIED_PLAYED |
| Kyle Filipowski | 11.17 → 0 **MISS** | 5.40 → 1 **MISS** | 2.53 → 0 **MISS** | 0.73 → 0 **MISS** | 21.26; 18.07 → 8 **MISS** | VERIFIED_PLAYED |
| Taylor Hendricks | 9.62 → DNP | 3.98 → DNP | 1.17 → DNP | 1.19 → DNP | 23.11; 15.02 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ty Jerome | 18.59 → 15 **MISS** | 4.00 → 1 **MISS** | 4.47 → 8 **MISS** | 2.29 → 1 **MISS** | 27.60; 15.18 → 30 **MISS** | VERIFIED_PLAYED |

## Golden State Warriors at Denver Nuggets — 2026-10-27T02:00 UTC

Original player rows: 20; verified played: 17; DNP: 3; unverified: 0. Final away–home: 134–114.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Gordon | 13.66 → 7 **MISS** | 4.89 → 4 **MISS** | 2.91 → 2 **MISS** | 1.50 → 0 **MISS** | 29.54; 22.16 → 25 **MISS** | VERIFIED_PLAYED |
| Al Horford | 5.34 → 11 **MISS** | 2.47 → 3 **MISS** | 1.32 → 0 **MISS** | 0.66 → 3 **MISS** | 15.60; 10.14 → 19 **MISS** | VERIFIED_PLAYED |
| Brandin Podziemski | 16.79 → 18 **MISS** | 3.91 → 7 **MISS** | 2.85 → 5 **MISS** | 1.78 → 3 **MISS** | 29.76; 25.30 → 33 **MISS** | VERIFIED_PLAYED |
| Cameron Johnson | 13.69 → DNP | 4.49 → DNP | 2.91 → DNP | 2.08 → DNP | 30.01; 25.50 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Christian Braun | 13.64 → 9 **MISS** | 4.98 → 4 **MISS** | 2.36 → 2 **HIT** | 1.18 → 1 **HIT** | 33.26; 28.27 → 34 **MISS** | VERIFIED_PLAYED |
| DaRon Holmes II | 1.29 → 0 **MISS** | 0.54 → 0 **MISS** | 0.26 → 1 **MISS** | 0.14 → 0 **HIT** | 3.00; 2.25 → 4 **MISS** | VERIFIED_PLAYED |
| De'Anthony Melton | 7.32 → 3 **MISS** | 3.04 → 4 **MISS** | 2.11 → 3 **MISS** | 0.87 → 1 **HIT** | 20.92; 17.78 → 19 **MISS** | VERIFIED_PLAYED |
| Draymond Green | 7.68 → 3 **MISS** | 4.62 → 4 **MISS** | 5.62 → 7 **MISS** | 0.95 → 1 **HIT** | 27.34; 23.23 → 27 **HIT** | VERIFIED_PLAYED |
| Gary Payton II | 8.15 → 7 **MISS** | 2.73 → 2 **MISS** | 1.04 → 0 **MISS** | 0.33 → 1 **MISS** | 16.24; 13.80 → 12 **MISS** | VERIFIED_PLAYED |
| Gui Santos | 11.23 → 13 **MISS** | 4.23 → 3 **MISS** | 2.61 → 1 **MISS** | 1.03 → 1 **HIT** | 25.42; 20.34 → 28 **MISS** | VERIFIED_PLAYED |
| Jamal Murray | 21.99 → 19 **MISS** | 5.26 → 6 **MISS** | 6.13 → 8 **MISS** | 3.44 → 3 **HIT** | 38.29; 32.54 → 36 **MISS** | VERIFIED_PLAYED |
| Julian Strawther | 10.20 → DNP | 2.69 → DNP | 1.73 → DNP | 1.45 → DNP | 20.17; 18.16 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kristaps Porzingis | 14.69 → DNP | 5.49 → DNP | 2.21 → DNP | 1.28 → DNP | 25.70; 17.99 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| LJ Cryer | 8.25 → 6 **MISS** | 1.72 → 0 **MISS** | 1.57 → 2 **HIT** | 1.47 → 2 **MISS** | 18.01; 12.61 → 3 **MISS** | VERIFIED_PLAYED |
| Malevy Leons | 5.75 → 0 **MISS** | 2.34 → 1 **MISS** | 1.46 → 0 **MISS** | 0.31 → 0 **HIT** | 16.37; 12.28 → 3 **MISS** | VERIFIED_PLAYED |
| Nikola Jokic | 21.72 → 19 **MISS** | 10.74 → 7 **MISS** | 8.60 → 11 **MISS** | 1.03 → 1 **HIT** | 34.62; 31.15 → 35 **HIT** | VERIFIED_PLAYED |
| Stephen Curry | 16.59 → 24 **MISS** | 3.41 → 3 **HIT** | 2.92 → 3 **HIT** | 2.04 → 3 **MISS** | 26.60; 20.69 → 27 **HIT** | VERIFIED_PLAYED |
| Tyus Jones | 3.70 → 0 **MISS** | 1.58 → 0 **MISS** | 1.20 → 2 **MISS** | 0.46 → 0 **HIT** | 10.82; 7.57 → 9 **MISS** | VERIFIED_PLAYED |
| Will Richard | 3.63 → 0 **MISS** | 1.78 → 0 **MISS** | 0.83 → 0 **MISS** | 0.37 → 0 **HIT** | 12.84; 10.27 → 3 **MISS** | VERIFIED_PLAYED |
| Zeke Nnaji | 3.28 → 5 **MISS** | 1.64 → 1 **MISS** | 0.88 → 0 **MISS** | 0.24 → 1 **MISS** | 10.03; 6.52 → 4 **MISS** | VERIFIED_PLAYED |

## Brooklyn Nets at Boston Celtics — 2026-10-27T23:30 UTC

Original player rows: 15; verified played: 12; DNP: 3; unverified: 0. Final away–home: 124–125.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Baylor Scheierman | 10.57 → 3 **MISS** | 3.51 → 4 **HIT** | 2.11 → 1 **MISS** | 2.08 → 1 **MISS** | 23.99; 21.59 → 21 **MISS** | VERIFIED_PLAYED |
| Ben Saraf | 13.18 → DNP | 4.06 → DNP | 3.80 → DNP | 0.65 → DNP | 30.63; 26.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Chaney Johnson | 7.78 → 15 **MISS** | 3.94 → 3 **MISS** | 1.96 → 2 **HIT** | 0.46 → 3 **MISS** | 19.12; 16.25 → 29 **MISS** | VERIFIED_PLAYED |
| Derrick White | 11.58 → 16 **MISS** | 3.68 → 5 **MISS** | 3.99 → 7 **MISS** | 1.78 → 1 **MISS** | 32.77; 27.85 → 33 **HIT** | VERIFIED_PLAYED |
| Drake Powell | 8.82 → DNP | 2.65 → DNP | 1.67 → DNP | 0.82 → DNP | 27.72; 23.56 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Hugo Gonzalez | 3.56 → 0 **MISS** | 2.17 → 2 **HIT** | 0.60 → 0 **MISS** | 0.46 → 0 **HIT** | 11.08; 7.75 → 6 **MISS** | VERIFIED_PLAYED |
| Jayson Tatum | 20.15 → 40 **MISS** | 9.00 → 5 **MISS** | 5.96 → 8 **MISS** | 2.31 → 2 **HIT** | 35.69; 26.77 → 42 **MISS** | VERIFIED_PLAYED |
| Jordan Walsh | 6.53 → 15 **MISS** | 3.79 → 6 **MISS** | 1.45 → 1 **HIT** | 0.81 → 3 **MISS** | 20.92; 18.82 → 24 **MISS** | VERIFIED_PLAYED |
| Luka Garza | 9.91 → 2 **MISS** | 4.26 → 4 **HIT** | 1.14 → 0 **MISS** | 0.82 → 0 **MISS** | 18.05; 13.54 → 13 **MISS** | VERIFIED_PLAYED |
| Neemias Queta | 10.22 → 7 **MISS** | 6.60 → 3 **MISS** | 2.29 → 2 **HIT** | 0.27 → 0 **HIT** | 24.31; 19.45 → 15 **MISS** | VERIFIED_PLAYED |
| Noah Clowney | 8.24 → 3 **MISS** | 3.62 → 4 **HIT** | 1.33 → 1 **HIT** | 0.83 → 1 **HIT** | 20.45; 14.32 → 24 **MISS** | VERIFIED_PLAYED |
| Nolan Traore | 9.62 → 15 **MISS** | 2.41 → 1 **MISS** | 2.94 → 3 **HIT** | 1.15 → 1 **HIT** | 19.82; 16.84 → 24 **MISS** | VERIFIED_PLAYED |
| Payton Pritchard | 16.81 → 4 **MISS** | 3.48 → 2 **MISS** | 3.77 → 6 **MISS** | 2.60 → 0 **MISS** | 30.64; 26.04 → 24 **MISS** | VERIFIED_PLAYED |
| Ron Harper Jr. | 5.69 → DNP | 1.89 → DNP | 1.15 → DNP | 0.70 → DNP | 12.65; 8.23 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Sam Hauser | 10.00 → 11 **MISS** | 3.57 → 4 **HIT** | 1.82 → 0 **MISS** | 2.08 → 3 **MISS** | 24.24; 20.60 → 25 **MISS** | VERIFIED_PLAYED |

## Detroit Pistons at New York Knicks — 2026-10-28T00:00 UTC

Original player rows: 22; verified played: 19; DNP: 3; unverified: 0. Final away–home: 97–111.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ausar Thompson | 8.88 → 11 **MISS** | 5.07 → 6 **MISS** | 3.78 → 2 **MISS** | 0.20 → 0 **HIT** | 25.30; 24.03 → 25 **HIT** | VERIFIED_PLAYED |
| Cade Cunningham | 13.81 → 19 **MISS** | 3.96 → 9 **MISS** | 6.19 → 8 **MISS** | 0.92 → 2 **MISS** | 27.44; 19.21 → 36 **MISS** | VERIFIED_PLAYED |
| Chaz Lanier | 2.16 → 2 **HIT** | 0.78 → 0 **MISS** | 0.50 → 0 **HIT** | 0.21 → 0 **HIT** | 6.70; 5.02 → 2 **MISS** | VERIFIED_PLAYED |
| Daniss Jenkins | 9.21 → 11 **MISS** | 3.26 → 3 **HIT** | 3.95 → 2 **MISS** | 0.86 → 1 **HIT** | 20.99; 19.94 → 24 **MISS** | VERIFIED_PLAYED |
| Duncan Robinson | 14.04 → 12 **MISS** | 2.50 → 0 **MISS** | 2.19 → 2 **HIT** | 2.73 → 2 **MISS** | 26.03; 22.13 → 33 **MISS** | VERIFIED_PLAYED |
| Jalen Brunson | 21.81 → 23 **MISS** | 3.18 → 1 **MISS** | 6.57 → 7 **HIT** | 1.57 → 0 **MISS** | 34.76; 27.81 → 36 **MISS** | VERIFIED_PLAYED |
| Jalen Duren | 15.91 → DNP | 7.60 → DNP | 2.97 → DNP | 0.18 → DNP | 26.07; 22.16 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Javonte Green | 7.39 → 3 **MISS** | 2.85 → 1 **MISS** | 0.78 → 0 **MISS** | 1.35 → 1 **HIT** | 15.35; 14.59 → 17 **MISS** | VERIFIED_PLAYED |
| Jordan Clarkson | 5.71 → DNP | 1.96 → DNP | 1.42 → DNP | 0.15 → DNP | 14.14; 12.72 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jose Alvarado | 9.25 → DNP | 2.99 → DNP | 3.48 → DNP | 1.30 → DNP | 20.95; 16.76 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Josh Hart | 12.32 → 6 **MISS** | 5.57 → 4 **MISS** | 3.20 → 4 **MISS** | 1.58 → 2 **HIT** | 30.90; 26.27 → 27 **MISS** | VERIFIED_PLAYED |
| Karl-Anthony Towns | 17.84 → 27 **MISS** | 9.80 → 20 **MISS** | 3.66 → 3 **MISS** | 1.22 → 1 **HIT** | 28.96; 23.17 → 33 **MISS** | VERIFIED_PLAYED |
| Kevin Huerter | 9.39 → 7 **MISS** | 3.25 → 1 **MISS** | 2.66 → 0 **MISS** | 1.42 → 1 **HIT** | 22.18; 19.97 → 16 **MISS** | VERIFIED_PLAYED |
| Landry Shamet | 6.41 → 13 **MISS** | 2.10 → 2 **HIT** | 1.54 → 3 **MISS** | 1.04 → 3 **MISS** | 21.89; 16.42 → 28 **MISS** | VERIFIED_PLAYED |
| Mikal Bridges | 11.81 → 12 **HIT** | 2.86 → 3 **HIT** | 2.71 → 4 **MISS** | 1.20 → 4 **MISS** | 31.09; 26.42 → 32 **MISS** | VERIFIED_PLAYED |
| Miles McBride | 6.88 → 5 **MISS** | 2.05 → 1 **MISS** | 1.53 → 1 **MISS** | 1.11 → 1 **HIT** | 17.48; 13.98 → 17 **HIT** | VERIFIED_PLAYED |
| Mohamed Diawara | 4.50 → 0 **MISS** | 1.59 → 0 **MISS** | 1.40 → 0 **MISS** | 0.40 → 0 **HIT** | 12.90; 9.67 → 1 **MISS** | VERIFIED_PLAYED |
| OG Anunoby | 14.27 → 13 **MISS** | 4.77 → 7 **MISS** | 1.82 → 2 **HIT** | 2.39 → 1 **MISS** | 31.44; 26.72 → 36 **MISS** | VERIFIED_PLAYED |
| Pacome Dadiet | 3.37 → 0 **MISS** | 1.32 → 1 **HIT** | 0.65 → 0 **MISS** | 0.30 → 0 **HIT** | 8.48; 5.51 → 1 **MISS** | VERIFIED_PLAYED |
| Paul Reed | 10.00 → 22 **MISS** | 4.80 → 9 **MISS** | 1.74 → 3 **MISS** | 0.40 → 1 **MISS** | 17.36; 16.49 → 26 **MISS** | VERIFIED_PLAYED |
| Ronald Holland II | 7.23 → 4 **MISS** | 3.04 → 3 **HIT** | 1.50 → 2 **HIT** | 0.89 → 0 **MISS** | 17.72; 16.83 → 12 **MISS** | VERIFIED_PLAYED |
| Tolu Smith | 2.95 → 1 **MISS** | 1.47 → 4 **MISS** | 0.75 → 0 **MISS** | 0.14 → 0 **HIT** | 7.30; 5.11 → 6 **MISS** | VERIFIED_PLAYED |

## Sacramento Kings at San Antonio Spurs — 2026-10-28T00:00 UTC

Original player rows: 17; verified played: 15; DNP: 2; unverified: 0. Final away–home: 103–130.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Carter Bryant | 6.40 → 1 **MISS** | 2.43 → 1 **MISS** | 1.66 → 2 **HIT** | 0.89 → 0 **MISS** | 16.58; 15.75 → 17 **HIT** | VERIFIED_PLAYED |
| Daeqwon Plowden | 11.49 → 0 **MISS** | 2.91 → 2 **MISS** | 1.55 → 0 **MISS** | 1.73 → 0 **MISS** | 25.91; 22.03 → 17 **MISS** | VERIFIED_PLAYED |
| De'Aaron Fox | 16.35 → 11 **MISS** | 4.27 → 4 **HIT** | 5.74 → 6 **HIT** | 1.39 → 2 **MISS** | 31.41; 29.84 → 26 **MISS** | VERIFIED_PLAYED |
| Devin Vassell | 11.98 → 14 **MISS** | 4.75 → 4 **MISS** | 2.31 → 8 **MISS** | 1.83 → 4 **MISS** | 31.18; 29.62 → 24 **MISS** | VERIFIED_PLAYED |
| Dylan Cardwell | 5.79 → DNP | 5.51 → DNP | 1.65 → DNP | 0.26 → DNP | 19.10; 14.32 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Dylan Harper | 14.23 → 13 **MISS** | 4.25 → 6 **MISS** | 3.64 → 6 **MISS** | 0.96 → 0 **MISS** | 28.69; 27.25 → 30 **MISS** | VERIFIED_PLAYED |
| Harrison Barnes | 7.10 → 3 **MISS** | 1.76 → 0 **MISS** | 1.22 → 0 **MISS** | 0.94 → 0 **MISS** | 18.82; 17.88 → 14 **MISS** | VERIFIED_PLAYED |
| Jordan McLaughlin | 2.26 → 0 **MISS** | 0.88 → 0 **MISS** | 0.68 → 2 **MISS** | 0.24 → 0 **HIT** | 6.20; 4.03 → 7 **MISS** | VERIFIED_PLAYED |
| Julian Champagnie | 9.62 → 26 **MISS** | 4.41 → 3 **MISS** | 1.77 → 3 **MISS** | 1.58 → 8 **MISS** | 26.33; 25.01 → 25 **MISS** | VERIFIED_PLAYED |
| Keldon Johnson | 12.44 → 14 **MISS** | 4.64 → 4 **MISS** | 1.60 → 0 **MISS** | 0.88 → 0 **MISS** | 22.95; 21.80 → 22 **MISS** | VERIFIED_PLAYED |
| Luke Kornet | 6.46 → 0 **MISS** | 3.84 → 4 **HIT** | 1.67 → 1 **MISS** | 0.18 → 0 **HIT** | 19.08; 16.21 → 17 **MISS** | VERIFIED_PLAYED |
| Malik Monk | 10.28 → 3 **MISS** | 2.39 → 2 **HIT** | 3.77 → 6 **MISS** | 1.41 → 1 **HIT** | 22.51; 14.63 → 13 **MISS** | VERIFIED_PLAYED |
| Maxime Raynaud | 17.72 → DNP | 7.24 → DNP | 2.28 → DNP | 1.01 → DNP | 32.52; 24.39 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nique Clifford | 12.28 → 2 **MISS** | 3.99 → 0 **MISS** | 3.70 → 0 **MISS** | 1.24 → 0 **MISS** | 28.03; 23.82 → 5 **MISS** | VERIFIED_PLAYED |
| Precious Achiuwa | 13.63 → 4 **MISS** | 6.99 → 1 **MISS** | 2.09 → 0 **MISS** | 0.37 → 0 **HIT** | 28.22; 23.98 → 14 **MISS** | VERIFIED_PLAYED |
| Stephon Castle | 16.23 → 15 **MISS** | 6.56 → 5 **MISS** | 6.91 → 5 **MISS** | 1.80 → 3 **MISS** | 31.51; 26.78 → 27 **MISS** | VERIFIED_PLAYED |
| Victor Wembanyama | 23.14 → 29 **MISS** | 10.89 → 10 **MISS** | 3.44 → 2 **MISS** | 1.27 → 0 **MISS** | 29.52; 23.62 → 27 **MISS** | VERIFIED_PLAYED |

## Portland Trail Blazers at Los Angeles Lakers — 2026-10-28T03:00 UTC

Original player rows: 16; verified played: 11; DNP: 5; unverified: 0. Final away–home: 136–129.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Adou Thiero | 3.26 → DNP | 1.27 → DNP | 0.74 → DNP | 0.22 → DNP | 8.19; 5.74 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Austin Reaves | 18.70 → 26 **MISS** | 4.04 → 4 **HIT** | 5.02 → 7 **MISS** | 1.49 → 4 **MISS** | 33.86; 23.70 → 39 **MISS** | VERIFIED_PLAYED |
| Bronny James | 5.93 → DNP | 1.50 → DNP | 1.42 → DNP | 0.78 → DNP | 15.84; 14.26 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Deni Avdija | 22.23 → 23 **MISS** | 6.31 → 4 **MISS** | 5.43 → 9 **MISS** | 1.40 → 4 **MISS** | 33.12; 31.47 → 33 **HIT** | VERIFIED_PLAYED |
| Donovan Clingan | 10.33 → 9 **MISS** | 8.50 → 10 **MISS** | 2.02 → 1 **MISS** | 1.12 → 2 **MISS** | 24.86; 23.62 → 26 **MISS** | VERIFIED_PLAYED |
| Jake LaRavia | 7.37 → 5 **MISS** | 4.16 → 1 **MISS** | 1.82 → 1 **MISS** | 0.86 → 1 **HIT** | 25.70; 23.13 → 19 **MISS** | VERIFIED_PLAYED |
| Jarred Vanderbilt | 5.00 → DNP | 3.24 → DNP | 1.58 → DNP | 0.38 → DNP | 15.38; 12.30 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jayson Kent | 1.98 → DNP | 0.81 → DNP | 0.38 → DNP | 0.15 → DNP | 5.25; 3.41 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jrue Holiday | 13.97 → 22 **MISS** | 4.61 → 4 **MISS** | 4.16 → 3 **MISS** | 1.96 → 2 **HIT** | 28.55; 27.12 → 30 **MISS** | VERIFIED_PLAYED |
| Luka Doncic | 28.13 → 41 **MISS** | 6.12 → 5 **MISS** | 6.18 → 9 **MISS** | 3.42 → 6 **MISS** | 34.48; 22.41 → 37 **MISS** | VERIFIED_PLAYED |
| Robert Williams III | 7.13 → 14 **MISS** | 5.79 → 10 **MISS** | 1.06 → 1 **HIT** | 0.33 → 0 **HIT** | 17.44; 16.57 → 21 **MISS** | VERIFIED_PLAYED |
| Scoot Henderson | 13.38 → 2 **MISS** | 2.66 → 2 **MISS** | 2.86 → 3 **HIT** | 1.57 → 0 **MISS** | 27.26; 25.90 → 17 **MISS** | VERIFIED_PLAYED |
| Sidy Cissoko | 3.94 → 6 **MISS** | 2.02 → 2 **HIT** | 1.22 → 4 **MISS** | 0.35 → 0 **HIT** | 12.92; 12.28 → 20 **MISS** | VERIFIED_PLAYED |
| Toumani Camara | 16.07 → 12 **MISS** | 3.84 → 1 **MISS** | 2.42 → 1 **MISS** | 3.23 → 4 **MISS** | 31.53; 29.95 → 24 **MISS** | VERIFIED_PLAYED |
| Vit Krejci | 3.63 → 4 **HIT** | 1.52 → 0 **MISS** | 1.12 → 0 **MISS** | 0.38 → 1 **MISS** | 10.20; 6.12 → 7 **MISS** | VERIFIED_PLAYED |
| Yang Hansen | 2.69 → DNP | 1.24 → DNP | 0.47 → DNP | 0.19 → DNP | 6.82; 4.43 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Miami Heat at Atlanta Hawks — 2026-10-28T23:00 UTC

Original player rows: 19; verified played: 12; DNP: 7; unverified: 0. Final away–home: 129–117.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Andrew Wiggins | 9.97 → 18 **MISS** | 3.41 → 2 **MISS** | 2.06 → 2 **HIT** | 1.32 → 4 **MISS** | 25.10; 23.84 → 29 **MISS** | VERIFIED_PLAYED |
| Asa Newell | 5.22 → DNP | 2.30 → DNP | 1.16 → DNP | 0.44 → DNP | 12.60; 8.82 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Bam Adebayo | 16.08 → 24 **MISS** | 8.54 → 9 **HIT** | 4.08 → 3 **MISS** | 1.37 → 0 **MISS** | 32.65; 31.01 → 33 **HIT** | VERIFIED_PLAYED |
| CJ McCollum | 16.07 → 13 **MISS** | 2.84 → 2 **MISS** | 3.23 → 1 **MISS** | 2.14 → 1 **MISS** | 27.66; 24.90 → 20 **MISS** | VERIFIED_PLAYED |
| Corey Kispert | 7.49 → DNP | 1.76 → DNP | 1.19 → DNP | 1.28 → DNP | 14.23; 9.96 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Davion Mitchell | 13.57 → 10 **MISS** | 2.77 → 1 **MISS** | 5.92 → 10 **MISS** | 1.58 → 0 **MISS** | 32.43; 29.19 → 34 **MISS** | VERIFIED_PLAYED |
| Dru Smith | 2.61 → 3 **HIT** | 0.88 → 1 **HIT** | 0.84 → 3 **MISS** | 0.18 → 0 **HIT** | 6.99; 4.54 → 14 **MISS** | VERIFIED_PLAYED |
| Dyson Daniels | 13.27 → 7 **MISS** | 6.93 → 4 **MISS** | 4.49 → 7 **MISS** | 0.68 → 0 **MISS** | 30.75; 27.68 → 28 **MISS** | VERIFIED_PLAYED |
| Jalen Johnson | 18.19 → 12 **MISS** | 8.43 → 9 **MISS** | 6.26 → 11 **MISS** | 1.24 → 2 **MISS** | 32.04; 28.84 → 36 **MISS** | VERIFIED_PLAYED |
| Jock Landale | 8.49 → 10 **MISS** | 3.96 → 6 **MISS** | 2.44 → 0 **MISS** | 0.75 → 0 **MISS** | 20.95; 13.62 → 17 **MISS** | VERIFIED_PLAYED |
| Keshad Johnson | 6.13 → DNP | 2.15 → DNP | 1.02 → DNP | 0.40 → DNP | 13.35; 9.35 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Mouhamed Gueye | 3.95 → DNP | 2.63 → DNP | 1.05 → DNP | 0.53 → DNP | 13.25; 9.94 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Myron Gardner | 1.82 → DNP | 0.84 → DNP | 0.47 → DNP | 0.14 → DNP | 4.55; 3.41 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nickeil Alexander-Walker | 19.94 → 23 **MISS** | 3.77 → 3 **MISS** | 3.27 → 1 **MISS** | 3.04 → 5 **MISS** | 32.80; 29.52 → 32 **MISS** | VERIFIED_PLAYED |
| Nikola Jovic | 4.05 → 5 **MISS** | 1.89 → 3 **MISS** | 1.05 → 0 **MISS** | 0.29 → 1 **MISS** | 12.00; 7.80 → 7 **MISS** | VERIFIED_PLAYED |
| Onyeka Okongwu | 10.91 → 11 **HIT** | 5.19 → 4 **MISS** | 2.36 → 4 **MISS** | 1.05 → 1 **HIT** | 28.05; 25.24 → 31 **MISS** | VERIFIED_PLAYED |
| Pelle Larsson | 11.96 → 17 **MISS** | 3.92 → 6 **MISS** | 3.11 → 8 **MISS** | 0.80 → 2 **MISS** | 29.08; 26.17 → 31 **MISS** | VERIFIED_PLAYED |
| Simone Fontecchio | 6.21 → DNP | 1.79 → DNP | 1.12 → DNP | 1.07 → DNP | 12.46; 9.35 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Vladislav Goldin | 1.13 → DNP | 0.51 → DNP | 0.27 → DNP | 0.08 → DNP | 3.00; 1.95 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Washington Wizards at Cleveland Cavaliers — 2026-10-28T23:00 UTC

Original player rows: 18; verified played: 11; DNP: 7; unverified: 0. Final away–home: 111–121.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alex Sarr | 8.37 → 18 **MISS** | 4.57 → 4 **MISS** | 2.94 → 2 **MISS** | 0.70 → 2 **MISS** | 23.20; 13.92 → 26 **MISS** | VERIFIED_PLAYED |
| Anthony Gill | 10.18 → DNP | 3.40 → DNP | 1.82 → DNP | 0.67 → DNP | 26.13; 22.21 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Bilal Coulibaly | 12.96 → 17 **MISS** | 3.88 → 2 **MISS** | 1.88 → 0 **MISS** | 1.05 → 1 **HIT** | 25.03; 20.02 → 27 **MISS** | VERIFIED_PLAYED |
| Bub Carrington | 11.79 → 3 **MISS** | 2.18 → 1 **MISS** | 3.59 → 3 **MISS** | 2.11 → 0 **MISS** | 24.27; 23.06 → 20 **MISS** | VERIFIED_PLAYED |
| Craig Porter Jr. | 5.55 → DNP | 3.44 → DNP | 2.03 → DNP | 0.53 → DNP | 17.05; 14.49 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Donovan Mitchell | 24.16 → 19 **MISS** | 5.70 → 5 **MISS** | 3.90 → 7 **MISS** | 1.86 → 2 **HIT** | 34.13; 27.31 → 31 **MISS** | VERIFIED_PLAYED |
| Evan Mobley | 16.67 → 24 **MISS** | 8.27 → 12 **MISS** | 3.17 → 2 **MISS** | 0.61 → 5 **MISS** | 30.43; 25.86 → 32 **MISS** | VERIFIED_PLAYED |
| James Harden | 17.32 → 16 **MISS** | 4.23 → 2 **MISS** | 5.80 → 6 **HIT** | 2.39 → 2 **HIT** | 32.66; 27.76 → 34 **MISS** | VERIFIED_PLAYED |
| Jamir Watkins | 12.39 → DNP | 5.37 → DNP | 2.24 → DNP | 1.42 → DNP | 29.85; 23.88 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jarrett Allen | 14.09 → 8 **MISS** | 6.74 → 12 **MISS** | 1.18 → 2 **MISS** | 0.39 → 0 **HIT** | 25.74; 19.31 → 30 **MISS** | VERIFIED_PLAYED |
| Jaylon Tyson | 11.00 → 7 **MISS** | 4.27 → 1 **MISS** | 2.56 → 2 **MISS** | 1.15 → 1 **HIT** | 23.19; 15.07 → 21 **MISS** | VERIFIED_PLAYED |
| Justin Champagnie | 9.90 → DNP | 5.90 → DNP | 1.92 → DNP | 0.90 → DNP | 23.64; 20.09 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Riley Minix | 4.03 → DNP | 1.19 → DNP | 0.82 → DNP | 0.35 → DNP | 9.20; 5.52 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Sam Merrill | 10.09 → 8 **MISS** | 3.07 → 1 **MISS** | 2.60 → 1 **MISS** | 1.61 → 2 **HIT** | 25.55; 19.17 → 20 **MISS** | VERIFIED_PLAYED |
| Trae Young | 16.39 → 14 **MISS** | 3.19 → 5 **MISS** | 6.27 → 8 **MISS** | 1.61 → 1 **MISS** | 30.80; 18.48 → 34 **MISS** | VERIFIED_PLAYED |
| Tre Johnson | 10.48 → DNP | 2.62 → DNP | 1.85 → DNP | 1.28 → DNP | 22.73; 15.91 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Tyrese Proctor | 7.69 → 2 **MISS** | 2.54 → 1 **MISS** | 2.08 → 1 **MISS** | 0.91 → 0 **MISS** | 15.37; 13.07 → 6 **MISS** | VERIFIED_PLAYED |
| Will Riley | 11.32 → DNP | 3.20 → DNP | 2.38 → DNP | 0.86 → DNP | 23.29; 20.96 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Charlotte Hornets at Detroit Pistons — 2026-10-28T23:00 UTC

Original player rows: 19; verified played: 13; DNP: 6; unverified: 0. Final away–home: 89–97.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ausar Thompson | 8.88 → 7 **MISS** | 5.07 → 9 **MISS** | 3.78 → 8 **MISS** | 0.20 → 0 **HIT** | 25.30; 24.03 → 29 **MISS** | VERIFIED_PLAYED |
| Brandon Miller | 17.53 → 31 **MISS** | 4.12 → 12 **MISS** | 2.12 → 3 **MISS** | 2.24 → 3 **MISS** | 30.85; 29.31 → 38 **MISS** | VERIFIED_PLAYED |
| Cade Cunningham | 13.81 → 30 **MISS** | 3.96 → 5 **MISS** | 6.19 → 7 **MISS** | 0.92 → 4 **MISS** | 27.44; 19.21 → 39 **MISS** | VERIFIED_PLAYED |
| Chaz Lanier | 2.16 → DNP | 0.78 → DNP | 0.50 → DNP | 0.21 → DNP | 6.70; 5.02 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Coby White | 12.88 → DNP | 2.71 → DNP | 2.23 → DNP | 1.67 → DNP | 17.96; 13.47 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Daniss Jenkins | 9.21 → 14 **MISS** | 3.26 → 2 **MISS** | 3.95 → 3 **MISS** | 0.86 → 2 **MISS** | 20.99; 19.94 → 24 **MISS** | VERIFIED_PLAYED |
| Duncan Robinson | 14.04 → 13 **MISS** | 2.50 → 2 **HIT** | 2.19 → 2 **HIT** | 2.73 → 3 **HIT** | 26.03; 22.13 → 32 **MISS** | VERIFIED_PLAYED |
| Grant Williams | 7.22 → DNP | 3.81 → DNP | 1.32 → DNP | 1.20 → DNP | 21.18; 15.88 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jalen Duren | 15.91 → DNP | 7.60 → DNP | 2.97 → DNP | 0.18 → DNP | 26.07; 22.16 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Javonte Green | 7.39 → 7 **HIT** | 2.85 → 2 **MISS** | 0.78 → 2 **MISS** | 1.35 → 1 **HIT** | 15.35; 14.59 → 21 **MISS** | VERIFIED_PLAYED |
| Kevin Huerter | 9.39 → 3 **MISS** | 3.25 → 2 **MISS** | 2.66 → 3 **HIT** | 1.42 → 1 **HIT** | 22.18; 19.97 → 19 **MISS** | VERIFIED_PLAYED |
| Kon Knueppel | 13.57 → DNP | 5.09 → DNP | 3.28 → DNP | 2.13 → DNP | 30.75; 24.60 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Liam McNeeley | 3.39 → DNP | 1.77 → DNP | 0.59 → DNP | 0.27 → DNP | 8.00; 4.80 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Moussa Diabate | 7.70 → 9 **MISS** | 6.53 → 9 **MISS** | 2.25 → 2 **HIT** | 0.20 → 0 **HIT** | 25.95; 23.35 → 35 **MISS** | VERIFIED_PLAYED |
| Paul Reed | 10.00 → 16 **MISS** | 4.80 → 4 **MISS** | 1.74 → 0 **MISS** | 0.40 → 2 **MISS** | 17.36; 16.49 → 38 **MISS** | VERIFIED_PLAYED |
| Ronald Holland II | 7.23 → 0 **MISS** | 3.04 → 2 **MISS** | 1.50 → 1 **MISS** | 0.89 → 0 **MISS** | 17.72; 16.83 → 12 **MISS** | VERIFIED_PLAYED |
| Ryan Kalkbrenner | 6.25 → 1 **MISS** | 4.13 → 1 **MISS** | 1.50 → 1 **HIT** | 0.19 → 0 **HIT** | 19.50; 18.53 → 13 **MISS** | VERIFIED_PLAYED |
| Sion James | 5.99 → 5 **MISS** | 3.85 → 2 **MISS** | 2.51 → 3 **HIT** | 0.89 → 1 **HIT** | 23.08; 21.92 → 23 **HIT** | VERIFIED_PLAYED |
| Tolu Smith | 2.95 → 2 **MISS** | 1.47 → 1 **HIT** | 0.75 → 0 **MISS** | 0.14 → 0 **HIT** | 7.30; 5.11 → 1 **MISS** | VERIFIED_PLAYED |

## Philadelphia 76ers at Indiana Pacers — 2026-10-28T23:00 UTC

Original player rows: 18; verified played: 12; DNP: 6; unverified: 0. Final away–home: 114–109.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Nesmith | 14.34 → 18 **MISS** | 3.45 → 2 **MISS** | 1.60 → 1 **MISS** | 2.17 → 3 **MISS** | 29.03; 14.52 → 27 **MISS** | VERIFIED_PLAYED |
| Adem Bona | 4.07 → 1 **MISS** | 2.55 → 1 **MISS** | 0.83 → 0 **MISS** | 0.16 → 0 **HIT** | 14.02; 12.62 → 4 **MISS** | VERIFIED_PLAYED |
| Andrew Nembhard | 14.61 → 18 **MISS** | 3.32 → 3 **HIT** | 8.04 → 14 **MISS** | 1.19 → 1 **HIT** | 33.33; 20.00 → 35 **MISS** | VERIFIED_PLAYED |
| Ben Sheppard | 7.30 → DNP | 2.65 → DNP | 1.55 → DNP | 0.95 → DNP | 20.18; 13.11 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Dominick Barlow | 5.62 → DNP | 4.04 → DNP | 1.36 → DNP | 0.19 → DNP | 19.85; 15.88 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ivica Zubac | 11.56 → DNP | 6.99 → DNP | 1.89 → DNP | 0.32 → DNP | 26.37; 14.51 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jabari Walker | 2.72 → DNP | 1.21 → DNP | 0.59 → DNP | 0.18 → DNP | 6.60; 5.28 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jalen Slawson | 7.84 → 2 **MISS** | 4.00 → 1 **MISS** | 2.45 → 1 **MISS** | 0.86 → 0 **MISS** | 23.80; 20.23 → 12 **MISS** | VERIFIED_PLAYED |
| Jarace Walker | 10.72 → 7 **MISS** | 4.65 → 8 **MISS** | 3.11 → 1 **MISS** | 1.51 → 1 **MISS** | 25.21; 17.64 → 22 **MISS** | VERIFIED_PLAYED |
| Jay Huff | 8.92 → 3 **MISS** | 4.23 → 6 **MISS** | 2.00 → 2 **HIT** | 1.08 → 1 **HIT** | 20.72; 18.65 → 16 **MISS** | VERIFIED_PLAYED |
| Joel Embiid | 21.89 → 21 **MISS** | 8.29 → 11 **MISS** | 4.28 → 2 **MISS** | 1.41 → 0 **MISS** | 34.85; 24.39 → 39 **MISS** | VERIFIED_PLAYED |
| Justin Edwards | 4.64 → DNP | 1.06 → DNP | 0.80 → DNP | 0.61 → DNP | 11.58; 9.27 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kobe Brown | 9.43 → DNP | 4.08 → DNP | 2.48 → DNP | 1.35 → DNP | 24.00; 20.40 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Obi Toppin | 13.56 → 13 **MISS** | 4.30 → 6 **MISS** | 2.10 → 0 **MISS** | 1.67 → 1 **MISS** | 20.67; 19.64 → 22 **MISS** | VERIFIED_PLAYED |
| Pascal Siakam | 21.20 → 26 **MISS** | 5.67 → 11 **MISS** | 2.99 → 3 **HIT** | 1.38 → 0 **MISS** | 30.41; 21.29 → 34 **MISS** | VERIFIED_PLAYED |
| Quenton Jackson | 10.67 → 2 **MISS** | 2.98 → 2 **MISS** | 3.69 → 6 **MISS** | 0.70 → 0 **MISS** | 22.37; 21.25 → 14 **MISS** | VERIFIED_PLAYED |
| Tyrese Maxey | 23.31 → 27 **MISS** | 4.42 → 5 **MISS** | 4.85 → 4 **MISS** | 1.93 → 3 **MISS** | 36.94; 35.09 → 36 **MISS** | VERIFIED_PLAYED |
| VJ Edgecombe | 13.55 → 8 **MISS** | 6.15 → 7 **MISS** | 4.45 → 2 **MISS** | 1.43 → 1 **HIT** | 34.11; 32.40 → 29 **MISS** | VERIFIED_PLAYED |

## Orlando Magic at Toronto Raptors — 2026-10-28T23:30 UTC

Original player rows: 23; verified played: 20; DNP: 3; unverified: 0. Final away–home: 99–129.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alex Morales | 2.07 → 2 **HIT** | 0.81 → 2 **MISS** | 0.56 → 1 **HIT** | 0.13 → 0 **HIT** | 5.60; 3.64 → 7 **MISS** | VERIFIED_PLAYED |
| Alijah Martin | 1.72 → 5 **MISS** | 0.63 → 1 **HIT** | 0.42 → 1 **MISS** | 0.12 → 1 **MISS** | 4.79; 3.83 → 5 **HIT** | VERIFIED_PLAYED |
| Colin Castleton | 2.03 → 2 **HIT** | 0.94 → 2 **MISS** | 0.44 → 0 **HIT** | 0.12 → 0 **HIT** | 5.00; 3.25 → 7 **MISS** | VERIFIED_PLAYED |
| Collin Murray-Boyles | 9.01 → 10 **MISS** | 4.46 → 2 **MISS** | 1.46 → 1 **HIT** | 0.18 → 2 **MISS** | 19.03; 17.12 → 15 **MISS** | VERIFIED_PLAYED |
| Desmond Bane | 13.22 → 13 **HIT** | 3.28 → 5 **MISS** | 2.74 → 4 **MISS** | 1.47 → 2 **MISS** | 26.78; 25.44 → 34 **MISS** | VERIFIED_PLAYED |
| Franz Wagner | 15.71 → 15 **MISS** | 3.68 → 4 **HIT** | 2.76 → 5 **MISS** | 1.11 → 0 **MISS** | 25.55; 21.71 → 34 **MISS** | VERIFIED_PLAYED |
| Goga Bitadze | 6.79 → 6 **MISS** | 4.90 → 0 **MISS** | 1.33 → 1 **HIT** | 0.17 → 0 **HIT** | 15.43; 14.66 → 11 **MISS** | VERIFIED_PLAYED |
| Immanuel Quickley | 10.20 → 16 **MISS** | 2.94 → 3 **HIT** | 4.02 → 7 **MISS** | 1.36 → 4 **MISS** | 24.59; 17.21 → 29 **MISS** | VERIFIED_PLAYED |
| Ja'Kobe Walter | 9.63 → 14 **MISS** | 3.23 → 5 **MISS** | 2.07 → 2 **HIT** | 1.86 → 3 **MISS** | 25.34; 24.08 → 28 **MISS** | VERIFIED_PLAYED |
| Jakob Poeltl | 8.80 → 2 **MISS** | 4.61 → 2 **MISS** | 1.66 → 0 **MISS** | 0.18 → 0 **HIT** | 21.78; 20.69 → 10 **MISS** | VERIFIED_PLAYED |
| Jalen Suggs | 12.62 → DNP | 4.00 → DNP | 4.94 → DNP | 2.14 → DNP | 30.22; 28.71 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jamal Cain | 6.69 → 9 **MISS** | 2.59 → 1 **MISS** | 1.12 → 0 **MISS** | 0.64 → 0 **MISS** | 17.04; 16.19 → 16 **MISS** | VERIFIED_PLAYED |
| Jamal Shead | 6.81 → 13 **MISS** | 1.68 → 4 **MISS** | 4.42 → 7 **MISS** | 0.70 → 1 **HIT** | 22.72; 21.58 → 23 **HIT** | VERIFIED_PLAYED |
| Jamison Battle | 3.49 → 7 **MISS** | 1.26 → 0 **MISS** | 0.51 → 1 **HIT** | 0.43 → 1 **MISS** | 7.68; 6.53 → 20 **MISS** | VERIFIED_PLAYED |
| Jase Richardson | 3.59 → 10 **MISS** | 1.15 → 1 **HIT** | 0.95 → 1 **HIT** | 0.27 → 2 **MISS** | 8.87; 7.10 → 14 **MISS** | VERIFIED_PLAYED |
| Jevon Carter | 5.62 → 6 **HIT** | 1.86 → 0 **MISS** | 1.67 → 3 **MISS** | 0.83 → 2 **MISS** | 17.40; 15.66 → 22 **MISS** | VERIFIED_PLAYED |
| Noah Penda | 1.65 → DNP | 0.91 → DNP | 0.78 → DNP | 0.16 → DNP | 6.53; 4.57 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Paolo Banchero | 18.43 → DNP | 7.33 → DNP | 5.76 → DNP | 0.84 → DNP | 32.66; 31.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| RJ Barrett | 18.58 → 25 **MISS** | 5.27 → 9 **MISS** | 3.12 → 6 **MISS** | 1.01 → 3 **MISS** | 31.07; 27.96 → 32 **MISS** | VERIFIED_PLAYED |
| Scottie Barnes | 16.48 → 28 **MISS** | 6.17 → 6 **HIT** | 6.28 → 4 **MISS** | 0.75 → 0 **MISS** | 30.70; 29.17 → 31 **HIT** | VERIFIED_PLAYED |
| Trayce Jackson-Davis | 1.93 → 6 **MISS** | 0.74 → 11 **MISS** | 0.32 → 2 **MISS** | 0.08 → 0 **HIT** | 4.50; 3.38 → 20 **MISS** | VERIFIED_PLAYED |
| Tristan da Silva | 9.10 → 20 **MISS** | 3.13 → 3 **HIT** | 2.21 → 1 **MISS** | 1.07 → 4 **MISS** | 23.81; 22.62 → 31 **MISS** | VERIFIED_PLAYED |
| Wendell Carter Jr. | 12.11 → 3 **MISS** | 6.26 → 10 **MISS** | 1.34 → 3 **MISS** | 0.72 → 0 **MISS** | 27.55; 26.17 → 26 **MISS** | VERIFIED_PLAYED |

## New York Knicks at Chicago Bulls — 2026-10-29T00:00 UTC

Original player rows: 18; verified played: 14; DNP: 4; unverified: 0. Final away–home: 133–127.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Isaac Okoro | 8.52 → 7 **MISS** | 2.62 → 0 **MISS** | 1.62 → 1 **MISS** | 0.77 → 1 **HIT** | 22.82; 18.26 → 18 **MISS** | VERIFIED_PLAYED |
| Jalen Brunson | 21.81 → 38 **MISS** | 3.18 → 1 **MISS** | 6.57 → 7 **HIT** | 1.57 → 6 **MISS** | 34.76; 27.81 → 35 **HIT** | VERIFIED_PLAYED |
| Jalen Smith | 9.80 → 17 **MISS** | 4.48 → 11 **MISS** | 1.31 → 5 **MISS** | 0.97 → 3 **MISS** | 20.03; 12.02 → 30 **MISS** | VERIFIED_PLAYED |
| Jordan Clarkson | 5.71 → 18 **MISS** | 1.96 → 3 **MISS** | 1.42 → 1 **HIT** | 0.15 → 2 **MISS** | 14.14; 12.72 → 17 **MISS** | VERIFIED_PLAYED |
| Jose Alvarado | 9.25 → DNP | 2.99 → DNP | 3.48 → DNP | 1.30 → DNP | 20.95; 16.76 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Josh Giddey | 9.46 → 10 **MISS** | 6.10 → 8 **MISS** | 7.49 → 11 **MISS** | 0.91 → 1 **HIT** | 28.98; 18.84 → 31 **MISS** | VERIFIED_PLAYED |
| Josh Hart | 12.32 → 2 **MISS** | 5.57 → 8 **MISS** | 3.20 → 3 **HIT** | 1.58 → 0 **MISS** | 30.90; 26.27 → 36 **MISS** | VERIFIED_PLAYED |
| Karl-Anthony Towns | 17.84 → 19 **MISS** | 9.80 → 13 **MISS** | 3.66 → 5 **MISS** | 1.22 → 3 **MISS** | 28.96; 23.17 → 28 **MISS** | VERIFIED_PLAYED |
| Landry Shamet | 6.41 → 14 **MISS** | 2.10 → 1 **MISS** | 1.54 → 5 **MISS** | 1.04 → 4 **MISS** | 21.89; 16.42 → 32 **MISS** | VERIFIED_PLAYED |
| Leonard Miller | 12.99 → 10 **MISS** | 5.66 → 0 **MISS** | 1.89 → 1 **MISS** | 1.21 → 1 **HIT** | 28.32; 26.91 → 17 **MISS** | VERIFIED_PLAYED |
| Matas Buzelis | 13.82 → 17 **MISS** | 5.64 → 5 **MISS** | 1.87 → 3 **MISS** | 1.21 → 3 **MISS** | 26.98; 20.23 → 33 **MISS** | VERIFIED_PLAYED |
| Mikal Bridges | 11.81 → 3 **MISS** | 2.86 → 0 **MISS** | 2.71 → 0 **MISS** | 1.20 → 1 **HIT** | 31.09; 26.42 → 13 **MISS** | VERIFIED_PLAYED |
| Miles McBride | 6.88 → 3 **MISS** | 2.05 → 5 **MISS** | 1.53 → 0 **MISS** | 1.11 → 1 **HIT** | 17.48; 13.98 → 14 **MISS** | VERIFIED_PLAYED |
| Mohamed Diawara | 4.50 → DNP | 1.59 → DNP | 1.40 → DNP | 0.40 → DNP | 12.90; 9.67 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| OG Anunoby | 14.27 → 23 **MISS** | 4.77 → 6 **MISS** | 1.82 → 1 **MISS** | 2.39 → 2 **HIT** | 31.44; 26.72 → 31 **HIT** | VERIFIED_PLAYED |
| Pacome Dadiet | 3.37 → DNP | 1.32 → DNP | 0.65 → DNP | 0.30 → DNP | 8.48; 5.51 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Patrick Williams | 10.24 → DNP | 4.39 → DNP | 2.68 → DNP | 1.37 → DNP | 29.43; 23.54 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Tre Jones | 12.70 → 11 **MISS** | 3.03 → 4 **MISS** | 3.18 → 3 **HIT** | 0.62 → 1 **HIT** | 20.90; 19.86 → 18 **MISS** | VERIFIED_PLAYED |

## Houston Rockets at Milwaukee Bucks — 2026-10-29T00:00 UTC

Original player rows: 16; verified played: 14; DNP: 2; unverified: 0. Final away–home: 132–100.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| AJ Green | 13.60 → 9 **MISS** | 3.31 → 1 **MISS** | 1.74 → 2 **HIT** | 3.34 → 3 **HIT** | 26.63; 25.30 → 24 **MISS** | VERIFIED_PLAYED |
| Alperen Sengun | 18.42 → DNP | 7.85 → DNP | 5.58 → DNP | 1.07 → DNP | 32.09; 28.88 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Amen Thompson | 19.72 → 23 **MISS** | 7.72 → 4 **MISS** | 4.98 → 3 **MISS** | 0.46 → 0 **HIT** | 38.24; 34.41 → 33 **MISS** | VERIFIED_PLAYED |
| Clint Capela | 4.65 → 10 **MISS** | 3.43 → 8 **MISS** | 0.94 → 2 **MISS** | 0.23 → 0 **HIT** | 12.36; 11.12 → 22 **MISS** | VERIFIED_PLAYED |
| Cormac Ryan | 15.82 → DNP | 3.74 → DNP | 2.30 → DNP | 2.35 → DNP | 29.68; 23.74 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Isaiah Crawford | 2.51 → 3 **HIT** | 0.94 → 0 **MISS** | 0.47 → 0 **HIT** | 0.21 → 1 **MISS** | 6.00; 3.60 → 5 **MISS** | VERIFIED_PLAYED |
| Jabari Smith Jr. | 17.00 → 14 **MISS** | 6.00 → 2 **MISS** | 2.05 → 2 **HIT** | 2.30 → 3 **MISS** | 35.23; 31.71 → 30 **MISS** | VERIFIED_PLAYED |
| Jae'Sean Tate | 3.39 → 0 **MISS** | 1.74 → 0 **MISS** | 0.80 → 0 **MISS** | 0.22 → 0 **HIT** | 9.16; 7.78 → 4 **MISS** | VERIFIED_PLAYED |
| Jericho Sims | 9.60 → 0 **MISS** | 6.70 → 0 **MISS** | 3.39 → 0 **MISS** | 0.21 → 0 **HIT** | 27.28; 23.19 → 7 **MISS** | VERIFIED_PLAYED |
| Kevin Durant | 23.72 → 18 **MISS** | 5.86 → 5 **MISS** | 5.23 → 4 **MISS** | 2.10 → 2 **HIT** | 36.99; 33.29 → 31 **MISS** | VERIFIED_PLAYED |
| Kyle Kuzma | 10.46 → 4 **MISS** | 4.97 → 6 **MISS** | 3.35 → 1 **MISS** | 0.93 → 0 **MISS** | 26.18; 19.63 → 18 **MISS** | VERIFIED_PLAYED |
| Myles Turner | 10.11 → 4 **MISS** | 4.62 → 2 **MISS** | 1.52 → 2 **HIT** | 1.32 → 0 **MISS** | 25.57; 19.18 → 22 **MISS** | VERIFIED_PLAYED |
| Ousmane Dieng | 11.23 → 4 **MISS** | 4.88 → 0 **MISS** | 4.50 → 0 **MISS** | 0.85 → 0 **MISS** | 28.68; 25.81 → 13 **MISS** | VERIFIED_PLAYED |
| Reed Sheppard | 11.31 → 7 **MISS** | 3.05 → 3 **HIT** | 3.02 → 4 **MISS** | 2.32 → 1 **MISS** | 22.71; 20.44 → 23 **HIT** | VERIFIED_PLAYED |
| Ryan Rollins | 16.51 → 4 **MISS** | 4.52 → 4 **MISS** | 4.37 → 5 **MISS** | 1.97 → 0 **MISS** | 29.71; 20.80 → 17 **MISS** | VERIFIED_PLAYED |
| Tari Eason | 10.14 → 5 **MISS** | 4.24 → 9 **MISS** | 1.16 → 1 **HIT** | 0.73 → 1 **HIT** | 22.41; 21.29 → 31 **MISS** | VERIFIED_PLAYED |

## Golden State Warriors at Minnesota Timberwolves — 2026-10-29T00:00 UTC

Original player rows: 22; verified played: 15; DNP: 7; unverified: 0. Final away–home: 119–114.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Al Horford | 5.34 → 4 **MISS** | 2.47 → 5 **MISS** | 1.32 → 2 **MISS** | 0.66 → 0 **MISS** | 15.60; 10.14 → 18 **MISS** | VERIFIED_PLAYED |
| Anthony Edwards | 18.53 → DNP | 4.37 → DNP | 3.25 → DNP | 2.26 → DNP | 29.19; 20.44 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ayo Dosunmu | 15.47 → 17 **MISS** | 5.28 → 3 **MISS** | 4.13 → 4 **HIT** | 1.22 → 3 **MISS** | 30.07; 25.56 → 32 **MISS** | VERIFIED_PLAYED |
| Bones Hyland | 9.63 → 13 **MISS** | 2.44 → 1 **MISS** | 2.22 → 3 **MISS** | 1.83 → 3 **MISS** | 18.79; 15.97 → 16 **MISS** | VERIFIED_PLAYED |
| Brandin Podziemski | 16.79 → 8 **MISS** | 3.91 → 5 **MISS** | 2.85 → 6 **MISS** | 1.78 → 0 **MISS** | 29.76; 23.81 → 32 **MISS** | VERIFIED_PLAYED |
| Charles Bassey | 8.05 → 0 **MISS** | 4.07 → 0 **MISS** | 1.33 → 0 **MISS** | 0.28 → 0 **HIT** | 17.40; 12.82 → 2 **MISS** | VERIFIED_PLAYED |
| De'Anthony Melton | 8.93 → 8 **MISS** | 3.27 → 6 **MISS** | 2.50 → 0 **MISS** | 1.14 → 2 **MISS** | 22.25; 18.92 → 20 **MISS** | VERIFIED_PLAYED |
| Donte DiVincenzo | 10.33 → DNP | 2.59 → DNP | 2.25 → DNP | 2.22 → DNP | 25.09; 21.33 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Draymond Green | 7.68 → 3 **MISS** | 4.62 → 9 **MISS** | 5.62 → 6 **HIT** | 0.95 → 0 **MISS** | 27.34; 21.87 → 32 **MISS** | VERIFIED_PLAYED |
| Gary Payton II | 7.54 → 2 **MISS** | 2.73 → 2 **MISS** | 0.98 → 1 **HIT** | 0.30 → 0 **HIT** | 16.41; 13.95 → 10 **MISS** | VERIFIED_PLAYED |
| Gui Santos | 10.32 → DNP | 4.09 → DNP | 2.56 → DNP | 0.96 → DNP | 24.07; 19.26 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jaden McDaniels | 15.33 → 19 **MISS** | 4.50 → 7 **MISS** | 2.19 → 4 **MISS** | 1.23 → 1 **HIT** | 30.07; 19.54 → 35 **MISS** | VERIFIED_PLAYED |
| Jaylen Clark | 5.12 → 3 **MISS** | 2.10 → 2 **HIT** | 1.39 → 1 **HIT** | 0.63 → 1 **HIT** | 15.25; 12.96 → 7 **MISS** | VERIFIED_PLAYED |
| Joan Beringer | 8.77 → 7 **MISS** | 4.94 → 10 **MISS** | 1.19 → 2 **MISS** | 0.25 → 0 **HIT** | 18.68; 15.88 → 20 **MISS** | VERIFIED_PLAYED |
| Kristaps Porzingis | 14.69 → DNP | 5.49 → DNP | 2.21 → DNP | 1.28 → DNP | 25.70; 16.71 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| LJ Cryer | 8.13 → DNP | 1.72 → DNP | 1.56 → DNP | 1.54 → DNP | 17.63; 12.34 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Malevy Leons | 4.87 → DNP | 1.72 → DNP | 1.04 → DNP | 0.26 → DNP | 12.80; 9.60 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Rudy Gobert | 10.94 → 1 **MISS** | 10.40 → 4 **MISS** | 1.63 → 1 **MISS** | 0.21 → 0 **HIT** | 30.80; 24.64 → 20 **MISS** | VERIFIED_PLAYED |
| Stephen Curry | 16.59 → 44 **MISS** | 3.41 → 8 **MISS** | 2.92 → 6 **MISS** | 2.04 → 6 **MISS** | 26.60; 19.60 → 32 **MISS** | VERIFIED_PLAYED |
| Terrence Shannon Jr. | 13.30 → 19 **MISS** | 2.67 → 6 **MISS** | 2.16 → 2 **HIT** | 1.45 → 1 **HIT** | 23.33; 22.17 → 27 **MISS** | VERIFIED_PLAYED |
| Will Richard | 4.91 → 6 **MISS** | 2.05 → 3 **MISS** | 1.03 → 0 **MISS** | 0.67 → 0 **MISS** | 16.43; 13.96 → 23 **MISS** | VERIFIED_PLAYED |
| Zyon Pullin | 3.62 → DNP | 1.06 → DNP | 1.03 → DNP | 0.23 → DNP | 8.40; 5.04 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Denver Nuggets at New Orleans Pelicans — 2026-10-29T00:00 UTC

Original player rows: 19; verified played: 14; DNP: 5; unverified: 0. Final away–home: 104–91.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Gordon | 14.27 → 15 **MISS** | 5.15 → 11 **MISS** | 3.18 → 3 **HIT** | 1.57 → 2 **HIT** | 31.14; 24.91 → 31 **HIT** | VERIFIED_PLAYED |
| Cameron Johnson | 13.71 → DNP | 4.49 → DNP | 2.91 → DNP | 2.08 → DNP | 30.04; 24.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Christian Braun | 13.34 → 15 **MISS** | 5.24 → 0 **MISS** | 2.19 → 4 **MISS** | 1.07 → 3 **MISS** | 34.46; 29.29 → 36 **MISS** | VERIFIED_PLAYED |
| DaRon Holmes II | 1.29 → DNP | 0.54 → DNP | 0.26 → DNP | 0.14 → DNP | 3.00; 2.25 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Dejounte Murray | 15.94 → 10 **MISS** | 5.11 → 8 **MISS** | 5.62 → 5 **MISS** | 1.08 → 0 **MISS** | 30.74; 21.52 → 30 **MISS** | VERIFIED_PLAYED |
| Derik Queen | 14.84 → 11 **MISS** | 8.55 → 12 **MISS** | 2.77 → 1 **MISS** | 0.44 → 0 **HIT** | 29.47; 27.99 → 25 **MISS** | VERIFIED_PLAYED |
| Herbert Jones | 5.48 → 4 **MISS** | 2.05 → 2 **HIT** | 1.36 → 0 **MISS** | 0.91 → 0 **MISS** | 17.19; 13.76 → 19 **MISS** | VERIFIED_PLAYED |
| Jamal Murray | 23.61 → 23 **MISS** | 5.00 → 1 **MISS** | 5.97 → 6 **HIT** | 3.67 → 5 **MISS** | 39.16; 33.29 → 38 **MISS** | VERIFIED_PLAYED |
| Jeremiah Fears | 18.31 → 11 **MISS** | 4.30 → 4 **HIT** | 3.59 → 3 **MISS** | 1.26 → 1 **HIT** | 31.37; 29.80 → 24 **MISS** | VERIFIED_PLAYED |
| Jordan Poole | 10.48 → 2 **MISS** | 2.52 → 1 **MISS** | 3.05 → 0 **MISS** | 1.46 → 0 **MISS** | 22.71; 17.03 → 7 **MISS** | VERIFIED_PLAYED |
| Julian Strawther | 10.21 → DNP | 2.69 → DNP | 1.74 → DNP | 1.45 → DNP | 20.20; 17.17 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Karlo Matkovic | 5.69 → 5 **MISS** | 3.04 → 3 **HIT** | 0.79 → 1 **HIT** | 0.47 → 1 **MISS** | 14.74; 8.84 → 18 **MISS** | VERIFIED_PLAYED |
| Nikola Jokic | 22.03 → 21 **MISS** | 11.37 → 13 **MISS** | 8.48 → 10 **MISS** | 1.21 → 0 **MISS** | 34.86; 31.37 → 34 **MISS** | VERIFIED_PLAYED |
| Saddiq Bey | 16.31 → 9 **MISS** | 3.93 → 0 **MISS** | 2.08 → 3 **MISS** | 2.11 → 1 **MISS** | 28.06; 22.44 → 26 **MISS** | VERIFIED_PLAYED |
| Trey Murphy III | 15.50 → 6 **MISS** | 5.54 → 1 **MISS** | 3.12 → 3 **HIT** | 2.01 → 2 **HIT** | 34.29; 24.00 → 30 **MISS** | VERIFIED_PLAYED |
| Tyus Jones | 4.04 → 5 **MISS** | 1.69 → 0 **MISS** | 1.19 → 1 **HIT** | 0.49 → 1 **MISS** | 11.90; 8.92 → 11 **MISS** | VERIFIED_PLAYED |
| Yves Missi | 8.70 → DNP | 6.40 → DNP | 2.06 → DNP | 0.20 → DNP | 23.89; 17.92 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Zeke Nnaji | 3.39 → DNP | 1.66 → DNP | 0.91 → DNP | 0.25 → DNP | 10.19; 6.63 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Zion Williamson | 17.27 → 25 **MISS** | 4.52 → 5 **HIT** | 2.64 → 2 **MISS** | 0.39 → 1 **MISS** | 30.93; 24.74 → 32 **MISS** | VERIFIED_PLAYED |

## San Antonio Spurs at Utah Jazz — 2026-10-29T01:00 UTC

Original player rows: 16; verified played: 12; DNP: 4; unverified: 0. Final away–home: 117–111.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ace Bailey | 14.22 → 19 **MISS** | 4.87 → 6 **MISS** | 2.19 → 0 **MISS** | 1.63 → 1 **MISS** | 28.08; 25.27 → 40 **MISS** | VERIFIED_PLAYED |
| Blake Hinson | 12.18 → DNP | 2.72 → DNP | 1.83 → DNP | 1.79 → DNP | 20.60; 12.36 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Brice Sensabaugh | 15.31 → 16 **MISS** | 3.11 → 3 **HIT** | 2.61 → 1 **MISS** | 2.03 → 4 **MISS** | 23.69; 21.32 → 18 **MISS** | VERIFIED_PLAYED |
| Carter Bryant | 5.44 → 3 **MISS** | 2.10 → 0 **MISS** | 1.40 → 0 **MISS** | 0.67 → 1 **HIT** | 14.55; 13.83 → 5 **MISS** | VERIFIED_PLAYED |
| De'Aaron Fox | 16.05 → 14 **MISS** | 4.11 → 3 **MISS** | 5.87 → 4 **MISS** | 1.38 → 1 **HIT** | 30.49; 28.97 → 39 **MISS** | VERIFIED_PLAYED |
| Devin Vassell | 11.47 → 21 **MISS** | 4.43 → 5 **MISS** | 2.62 → 2 **MISS** | 1.65 → 1 **MISS** | 31.45; 29.88 → 38 **MISS** | VERIFIED_PLAYED |
| Dylan Harper | 14.88 → 13 **MISS** | 4.12 → 5 **MISS** | 3.30 → 8 **MISS** | 1.07 → 2 **MISS** | 28.11; 26.71 → 37 **MISS** | VERIFIED_PLAYED |
| Harrison Barnes | 5.71 → DNP | 1.41 → DNP | 0.94 → DNP | 0.75 → DNP | 15.45; 14.68 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Isaiah Collier | 9.98 → 7 **MISS** | 2.92 → 7 **MISS** | 3.92 → 6 **MISS** | 0.42 → 0 **HIT** | 22.20; 12.21 → 24 **MISS** | VERIFIED_PLAYED |
| Jordan McLaughlin | 2.06 → DNP | 0.88 → DNP | 0.63 → DNP | 0.22 → DNP | 5.80; 4.06 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Julian Champagnie | 9.91 → 6 **MISS** | 4.29 → 6 **MISS** | 1.79 → 0 **MISS** | 1.69 → 2 **HIT** | 26.19; 24.88 → 31 **MISS** | VERIFIED_PLAYED |
| Keldon Johnson | 11.42 → 9 **MISS** | 4.46 → 6 **MISS** | 1.66 → 2 **HIT** | 0.83 → 0 **MISS** | 22.68; 21.54 → 23 **HIT** | VERIFIED_PLAYED |
| Kyle Filipowski | 11.17 → DNP | 5.40 → DNP | 2.53 → DNP | 0.73 → DNP | 21.26; 18.07 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Luke Kornet | 5.79 → 1 **MISS** | 3.75 → 6 **MISS** | 1.65 → 1 **MISS** | 0.17 → 0 **HIT** | 18.04; 15.33 → 14 **MISS** | VERIFIED_PLAYED |
| Stephon Castle | 16.33 → 14 **MISS** | 6.44 → 6 **HIT** | 6.46 → 8 **MISS** | 1.97 → 1 **MISS** | 30.12; 25.60 → 38 **MISS** | VERIFIED_PLAYED |
| Victor Wembanyama | 21.61 → 36 **MISS** | 9.91 → 14 **MISS** | 3.17 → 5 **MISS** | 1.23 → 4 **MISS** | 28.00; 22.40 → 39 **MISS** | VERIFIED_PLAYED |

## Oklahoma City Thunder at Dallas Mavericks — 2026-10-29T01:30 UTC

Original player rows: 18; verified played: 12; DNP: 6; unverified: 0. Final away–home: 96–120.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ajay Mitchell | 8.81 → 29 **MISS** | 2.66 → 4 **MISS** | 2.94 → 3 **HIT** | 0.62 → 2 **MISS** | 21.89; 18.60 → 28 **MISS** | VERIFIED_PLAYED |
| Alex Caruso | 5.72 → DNP | 2.92 → DNP | 1.80 → DNP | 0.76 → DNP | 16.59; 13.27 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Brooks Barnhizer | 4.08 → 3 **MISS** | 2.22 → 2 **HIT** | 0.93 → 0 **MISS** | 0.32 → 0 **HIT** | 12.35; 9.26 → 14 **MISS** | VERIFIED_PLAYED |
| Cason Wallace | 8.20 → DNP | 2.77 → DNP | 1.75 → DNP | 1.32 → DNP | 21.92; 18.63 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Chet Holmgren | 14.73 → DNP | 7.86 → DNP | 1.86 → DNP | 1.15 → DNP | 26.84; 22.81 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Cooper Flagg | 19.29 → 26 **MISS** | 5.57 → 5 **MISS** | 3.42 → 8 **MISS** | 1.11 → 2 **MISS** | 27.10; 24.39 → 33 **MISS** | VERIFIED_PLAYED |
| Daniel Gafford | 9.00 → 7 **MISS** | 4.90 → 11 **MISS** | 1.77 → 2 **HIT** | 0.21 → 1 **MISS** | 20.72; 15.54 → 27 **MISS** | VERIFIED_PLAYED |
| Isaiah Hartenstein | 6.35 → 10 **MISS** | 6.02 → 14 **MISS** | 2.54 → 3 **HIT** | 0.17 → 0 **HIT** | 18.68; 14.95 → 26 **MISS** | VERIFIED_PLAYED |
| Jalen Williams | 14.25 → DNP | 4.82 → DNP | 4.30 → DNP | 0.74 → DNP | 28.18; 21.13 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jared McCain | 8.46 → 10 **MISS** | 2.04 → 4 **MISS** | 1.44 → 4 **MISS** | 1.07 → 0 **MISS** | 18.38; 17.46 → 29 **MISS** | VERIFIED_PLAYED |
| Jaylin Williams | 5.22 → 0 **MISS** | 3.99 → 5 **MISS** | 1.69 → 1 **MISS** | 0.90 → 0 **MISS** | 15.03; 12.77 → 20 **MISS** | VERIFIED_PLAYED |
| Kenrich Williams | 6.10 → 7 **MISS** | 3.27 → 3 **HIT** | 1.50 → 0 **MISS** | 0.69 → 1 **HIT** | 14.66; 13.19 → 17 **MISS** | VERIFIED_PLAYED |
| Max Christie | 10.24 → 11 **MISS** | 3.26 → 5 **MISS** | 2.00 → 2 **HIT** | 1.59 → 3 **MISS** | 27.56; 26.19 → 22 **MISS** | VERIFIED_PLAYED |
| Moussa Cisse | 6.42 → 0 **MISS** | 4.60 → 0 **MISS** | 0.77 → 0 **MISS** | 0.21 → 0 **HIT** | 15.02; 12.02 → 3 **MISS** | VERIFIED_PLAYED |
| Naji Marshall | 13.12 → DNP | 3.77 → DNP | 3.90 → DNP | 0.74 → DNP | 27.44; 20.58 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nikola Topic | 7.84 → DNP | 2.69 → DNP | 4.24 → DNP | 0.70 → DNP | 21.60; 15.92 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| P.J. Washington | 13.96 → 18 **MISS** | 6.49 → 9 **MISS** | 1.46 → 0 **MISS** | 1.57 → 2 **HIT** | 31.79; 20.66 → 27 **MISS** | VERIFIED_PLAYED |
| Shai Gilgeous-Alexander | 22.83 → 21 **MISS** | 3.49 → 6 **MISS** | 5.31 → 2 **MISS** | 1.67 → 1 **MISS** | 31.27; 26.58 → 28 **MISS** | VERIFIED_PLAYED |

## Los Angeles Lakers at LA Clippers — 2026-10-29T02:30 UTC

Original player rows: 14; verified played: 10; DNP: 4; unverified: 0. Final away–home: 103–87.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Adou Thiero | 3.26 → DNP | 1.27 → DNP | 0.74 → DNP | 0.22 → DNP | 8.19; 5.74 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Austin Reaves | 18.70 → 16 **MISS** | 4.04 → 6 **MISS** | 5.02 → 1 **MISS** | 1.49 → 1 **HIT** | 33.86; 23.70 → 31 **MISS** | VERIFIED_PLAYED |
| Bronny James | 5.93 → DNP | 1.50 → DNP | 1.42 → DNP | 0.78 → DNP | 15.84; 14.26 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Brook Lopez | 13.60 → 2 **MISS** | 6.02 → 3 **MISS** | 1.74 → 3 **MISS** | 1.80 → 0 **MISS** | 26.65; 23.99 → 22 **MISS** | VERIFIED_PLAYED |
| Cam Christie | 1.53 → 2 **HIT** | 0.65 → 0 **MISS** | 0.34 → 0 **HIT** | 0.08 → 0 **HIT** | 4.51; 3.38 → 14 **MISS** | VERIFIED_PLAYED |
| Darius Garland | 19.98 → 14 **MISS** | 2.54 → 1 **MISS** | 5.23 → 5 **HIT** | 2.62 → 1 **MISS** | 32.48; 27.61 → 26 **MISS** | VERIFIED_PLAYED |
| Derrick Jones Jr. | 8.63 → 15 **MISS** | 4.47 → 5 **MISS** | 1.76 → 0 **MISS** | 0.99 → 3 **MISS** | 26.67; 24.00 → 28 **MISS** | VERIFIED_PLAYED |
| Isaiah Jackson | 8.53 → 4 **MISS** | 4.34 → 5 **MISS** | 1.61 → 1 **MISS** | 0.21 → 0 **HIT** | 19.65; 10.81 → 19 **MISS** | VERIFIED_PLAYED |
| Jake LaRavia | 7.37 → 2 **MISS** | 4.16 → 10 **MISS** | 1.82 → 0 **MISS** | 0.86 → 0 **MISS** | 25.70; 23.13 → 35 **MISS** | VERIFIED_PLAYED |
| Jarred Vanderbilt | 5.00 → 0 **MISS** | 3.24 → 7 **MISS** | 1.58 → 2 **HIT** | 0.38 → 0 **HIT** | 15.38; 12.30 → 21 **MISS** | VERIFIED_PLAYED |
| Jordan Miller | 11.08 → DNP | 3.34 → DNP | 2.59 → DNP | 0.68 → DNP | 25.80; 20.64 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kobe Sanders | 7.71 → 9 **MISS** | 1.96 → 4 **MISS** | 1.92 → 0 **MISS** | 0.97 → 1 **HIT** | 18.16; 16.35 → 27 **MISS** | VERIFIED_PLAYED |
| Kris Dunn | 6.61 → 5 **MISS** | 3.61 → 3 **MISS** | 3.67 → 3 **MISS** | 0.80 → 1 **HIT** | 27.64; 24.88 → 27 **MISS** | VERIFIED_PLAYED |
| Luka Doncic | 28.13 → DNP | 6.12 → DNP | 6.18 → DNP | 3.42 → DNP | 34.48; 22.41 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Cleveland Cavaliers at Atlanta Hawks — 2026-10-30T00:00 UTC

Original player rows: 18; verified played: 14; DNP: 4; unverified: 0. Final away–home: 111–114.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Asa Newell | 5.22 → DNP | 2.30 → DNP | 1.16 → DNP | 0.44 → DNP | 12.60; 8.82 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| CJ McCollum | 16.07 → 5 **MISS** | 2.84 → 3 **HIT** | 3.23 → 8 **MISS** | 2.14 → 0 **MISS** | 27.66; 24.90 → 31 **MISS** | VERIFIED_PLAYED |
| Corey Kispert | 7.49 → DNP | 1.76 → DNP | 1.19 → DNP | 1.28 → DNP | 14.23; 9.96 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Craig Porter Jr. | 5.55 → 0 **MISS** | 3.44 → 1 **MISS** | 2.03 → 0 **MISS** | 0.53 → 0 **MISS** | 17.05; 14.49 → 4 **MISS** | VERIFIED_PLAYED |
| Donovan Mitchell | 24.16 → 22 **MISS** | 5.70 → 3 **MISS** | 3.90 → 3 **MISS** | 1.86 → 1 **MISS** | 34.13; 27.31 → 33 **MISS** | VERIFIED_PLAYED |
| Dyson Daniels | 13.27 → 4 **MISS** | 6.93 → 6 **MISS** | 4.49 → 5 **MISS** | 0.68 → 0 **MISS** | 30.75; 27.68 → 32 **MISS** | VERIFIED_PLAYED |
| Evan Mobley | 16.67 → 11 **MISS** | 8.27 → 4 **MISS** | 3.17 → 7 **MISS** | 0.61 → 0 **MISS** | 30.43; 25.86 → 33 **MISS** | VERIFIED_PLAYED |
| Jalen Johnson | 18.19 → 17 **MISS** | 8.43 → 8 **HIT** | 6.26 → 7 **MISS** | 1.24 → 2 **MISS** | 32.04; 28.84 → 34 **MISS** | VERIFIED_PLAYED |
| James Harden | 17.32 → 24 **MISS** | 4.23 → 5 **MISS** | 5.80 → 4 **MISS** | 2.39 → 3 **MISS** | 32.66; 27.76 → 36 **MISS** | VERIFIED_PLAYED |
| Jarrett Allen | 14.09 → 14 **HIT** | 6.74 → 8 **MISS** | 1.18 → 1 **HIT** | 0.39 → 1 **MISS** | 25.74; 19.31 → 30 **MISS** | VERIFIED_PLAYED |
| Jaylon Tyson | 11.00 → 3 **MISS** | 4.27 → 6 **MISS** | 2.56 → 1 **MISS** | 1.15 → 1 **HIT** | 23.19; 15.07 → 18 **MISS** | VERIFIED_PLAYED |
| Jock Landale | 8.49 → 6 **MISS** | 3.96 → 10 **MISS** | 2.44 → 1 **MISS** | 0.75 → 2 **MISS** | 20.95; 13.62 → 15 **MISS** | VERIFIED_PLAYED |
| Mouhamed Gueye | 3.95 → DNP | 2.63 → DNP | 1.05 → DNP | 0.53 → DNP | 13.25; 9.94 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nickeil Alexander-Walker | 19.94 → 25 **MISS** | 3.77 → 3 **MISS** | 3.27 → 1 **MISS** | 3.04 → 4 **MISS** | 32.80; 29.52 → 31 **MISS** | VERIFIED_PLAYED |
| Onyeka Okongwu | 10.91 → 29 **MISS** | 5.19 → 12 **MISS** | 2.36 → 2 **HIT** | 1.05 → 4 **MISS** | 28.05; 25.24 → 33 **MISS** | VERIFIED_PLAYED |
| Riley Minix | 4.03 → DNP | 1.19 → DNP | 0.82 → DNP | 0.35 → DNP | 9.20; 5.52 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Sam Merrill | 10.09 → 16 **MISS** | 3.07 → 2 **MISS** | 2.60 → 3 **HIT** | 1.61 → 4 **MISS** | 25.55; 19.17 → 27 **MISS** | VERIFIED_PLAYED |
| Tyrese Proctor | 7.69 → 7 **MISS** | 2.54 → 6 **MISS** | 2.08 → 2 **HIT** | 0.91 → 1 **HIT** | 15.37; 13.07 → 20 **MISS** | VERIFIED_PLAYED |

## Sacramento Kings at New Orleans Pelicans — 2026-10-30T00:00 UTC

Original player rows: 16; verified played: 10; DNP: 6; unverified: 0. Final away–home: 120–132.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Daeqwon Plowden | 9.91 → DNP | 2.87 → DNP | 1.49 → DNP | 1.53 → DNP | 23.65; 20.11 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Dejounte Murray | 15.94 → DNP | 5.11 → DNP | 5.62 → DNP | 1.08 → DNP | 30.74; 21.52 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Derik Queen | 14.84 → 9 **MISS** | 8.55 → 2 **MISS** | 2.77 → 3 **HIT** | 0.44 → 1 **MISS** | 29.47; 27.99 → 22 **MISS** | VERIFIED_PLAYED |
| Dylan Cardwell | 5.79 → DNP | 5.51 → DNP | 1.65 → DNP | 0.26 → DNP | 19.10; 13.37 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Herbert Jones | 5.48 → 16 **MISS** | 2.05 → 4 **MISS** | 1.36 → 1 **HIT** | 0.91 → 0 **MISS** | 17.19; 13.76 → 32 **MISS** | VERIFIED_PLAYED |
| Jeremiah Fears | 18.31 → 22 **MISS** | 4.30 → 8 **MISS** | 3.59 → 13 **MISS** | 1.26 → 3 **MISS** | 31.37; 29.80 → 29 **MISS** | VERIFIED_PLAYED |
| Jordan Poole | 10.48 → DNP | 2.52 → DNP | 3.05 → DNP | 1.46 → DNP | 22.71; 17.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Karlo Matkovic | 5.69 → 12 **MISS** | 3.04 → 4 **MISS** | 0.79 → 1 **HIT** | 0.47 → 1 **MISS** | 14.74; 8.84 → 28 **MISS** | VERIFIED_PLAYED |
| Malik Monk | 8.89 → 2 **MISS** | 2.05 → 1 **MISS** | 3.24 → 1 **MISS** | 1.12 → 0 **MISS** | 19.21; 12.49 → 8 **MISS** | VERIFIED_PLAYED |
| Maxime Raynaud | 17.75 → DNP | 7.25 → DNP | 2.28 → DNP | 1.01 → DNP | 32.59; 22.81 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nique Clifford | 12.07 → 0 **MISS** | 4.03 → 0 **MISS** | 3.53 → 1 **MISS** | 1.22 → 0 **MISS** | 27.72; 22.18 → 4 **MISS** | VERIFIED_PLAYED |
| Precious Achiuwa | 14.19 → 24 **MISS** | 7.51 → 9 **MISS** | 1.99 → 2 **HIT** | 0.34 → 0 **HIT** | 30.25; 25.71 → 41 **MISS** | VERIFIED_PLAYED |
| Saddiq Bey | 16.31 → 10 **MISS** | 3.93 → 4 **HIT** | 2.08 → 3 **MISS** | 2.11 → 1 **MISS** | 28.06; 22.44 → 24 **MISS** | VERIFIED_PLAYED |
| Trey Murphy III | 15.50 → 19 **MISS** | 5.54 → 5 **MISS** | 3.12 → 3 **HIT** | 2.01 → 2 **HIT** | 34.29; 24.00 → 32 **MISS** | VERIFIED_PLAYED |
| Yves Missi | 8.70 → DNP | 6.40 → DNP | 2.06 → DNP | 0.20 → DNP | 23.89; 17.92 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Zion Williamson | 17.27 → 22 **MISS** | 4.52 → 6 **MISS** | 2.64 → 2 **MISS** | 0.39 → 0 **HIT** | 30.93; 24.74 → 31 **HIT** | VERIFIED_PLAYED |

## Memphis Grizzlies at Portland Trail Blazers — 2026-10-30T02:00 UTC

Original player rows: 18; verified played: 14; DNP: 4; unverified: 0. Final away–home: 124–103.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Cam Spencer | 8.32 → 8 **HIT** | 2.15 → 6 **MISS** | 3.65 → 8 **MISS** | 1.50 → 1 **HIT** | 19.57; 13.70 → 23 **MISS** | VERIFIED_PLAYED |
| Cedric Coward | 13.44 → 17 **MISS** | 4.68 → 7 **MISS** | 2.29 → 4 **MISS** | 1.47 → 3 **MISS** | 25.38; 19.03 → 27 **MISS** | VERIFIED_PLAYED |
| Deni Avdija | 22.23 → 24 **MISS** | 6.31 → 9 **MISS** | 5.43 → 7 **MISS** | 1.40 → 0 **MISS** | 33.12; 31.47 → 32 **MISS** | VERIFIED_PLAYED |
| Donovan Clingan | 10.33 → 11 **MISS** | 8.50 → 8 **HIT** | 2.02 → 1 **MISS** | 1.12 → 1 **HIT** | 24.86; 23.62 → 29 **MISS** | VERIFIED_PLAYED |
| GG Jackson | 11.04 → 12 **MISS** | 3.82 → 7 **MISS** | 1.35 → 2 **MISS** | 0.99 → 2 **MISS** | 19.42; 14.57 → 21 **MISS** | VERIFIED_PLAYED |
| Jahmai Mashack | 10.21 → DNP | 4.54 → DNP | 4.58 → DNP | 0.81 → DNP | 31.37; 21.96 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Javon Small | 11.33 → DNP | 3.40 → DNP | 2.95 → DNP | 1.52 → DNP | 24.08; 14.45 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jaylen Wells | 11.04 → 10 **MISS** | 3.34 → 1 **MISS** | 1.77 → 0 **MISS** | 1.43 → 2 **MISS** | 25.71; 15.43 → 25 **MISS** | VERIFIED_PLAYED |
| Jayson Kent | 1.98 → DNP | 0.81 → DNP | 0.38 → DNP | 0.15 → DNP | 5.25; 3.41 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jrue Holiday | 13.97 → 6 **MISS** | 4.61 → 6 **MISS** | 4.16 → 4 **HIT** | 1.96 → 2 **HIT** | 28.55; 27.12 → 24 **MISS** | VERIFIED_PLAYED |
| Robert Williams III | 7.13 → DNP | 5.79 → DNP | 1.06 → DNP | 0.33 → DNP | 17.44; 16.57 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Scoot Henderson | 13.38 → 9 **MISS** | 2.66 → 4 **MISS** | 2.86 → 0 **MISS** | 1.57 → 1 **MISS** | 27.26; 25.90 → 19 **MISS** | VERIFIED_PLAYED |
| Sidy Cissoko | 3.94 → 4 **HIT** | 2.02 → 6 **MISS** | 1.22 → 2 **MISS** | 0.35 → 0 **HIT** | 12.92; 12.28 → 19 **MISS** | VERIFIED_PLAYED |
| Taylor Hendricks | 8.20 → 0 **MISS** | 3.27 → 1 **MISS** | 0.95 → 0 **MISS** | 1.06 → 0 **MISS** | 19.41; 12.61 → 3 **MISS** | VERIFIED_PLAYED |
| Toumani Camara | 16.07 → 13 **MISS** | 3.84 → 2 **MISS** | 2.42 → 1 **MISS** | 3.23 → 3 **HIT** | 31.53; 29.95 → 26 **MISS** | VERIFIED_PLAYED |
| Ty Jerome | 20.38 → 10 **MISS** | 3.91 → 2 **MISS** | 4.62 → 3 **MISS** | 2.14 → 1 **MISS** | 28.75; 17.25 → 24 **MISS** | VERIFIED_PLAYED |
| Vit Krejci | 3.63 → 2 **MISS** | 1.52 → 0 **MISS** | 1.12 → 1 **HIT** | 0.38 → 0 **HIT** | 10.20; 6.12 → 8 **MISS** | VERIFIED_PLAYED |
| Yang Hansen | 2.69 → 3 **HIT** | 1.24 → 2 **MISS** | 0.47 → 1 **MISS** | 0.19 → 1 **MISS** | 6.82; 4.43 → 5 **MISS** | VERIFIED_PLAYED |

## Charlotte Hornets at Washington Wizards — 2026-10-30T23:00 UTC

Original player rows: 16; verified played: 10; DNP: 6; unverified: 0. Final away–home: 79–95.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alex Sarr | 8.89 → 3 **MISS** | 4.73 → 8 **MISS** | 2.80 → 0 **MISS** | 0.59 → 1 **HIT** | 23.91; 15.54 → 29 **MISS** | VERIFIED_PLAYED |
| Anthony Gill | 10.18 → DNP | 3.40 → DNP | 1.82 → DNP | 0.67 → DNP | 26.12; 20.90 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Bilal Coulibaly | 11.76 → 1 **MISS** | 4.08 → 5 **MISS** | 1.79 → 1 **MISS** | 0.85 → 0 **MISS** | 25.52; 20.42 → 22 **MISS** | VERIFIED_PLAYED |
| Brandon Miller | 18.94 → 19 **HIT** | 4.22 → 7 **MISS** | 2.24 → 2 **HIT** | 2.40 → 3 **MISS** | 31.53; 29.95 → 37 **MISS** | VERIFIED_PLAYED |
| Bub Carrington | 10.13 → 9 **MISS** | 1.92 → 4 **MISS** | 3.36 → 2 **MISS** | 1.91 → 3 **MISS** | 23.28; 22.12 → 20 **MISS** | VERIFIED_PLAYED |
| Coby White | 12.85 → DNP | 2.70 → DNP | 2.23 → DNP | 1.67 → DNP | 17.90; 12.53 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Grant Williams | 7.22 → DNP | 3.80 → DNP | 1.32 → DNP | 1.20 → DNP | 21.16; 14.82 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jamir Watkins | 12.40 → DNP | 5.37 → DNP | 2.24 → DNP | 1.42 → DNP | 29.86; 22.40 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Justin Champagnie | 9.01 → DNP | 5.45 → DNP | 1.70 → DNP | 0.78 → DNP | 21.52; 18.30 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kon Knueppel | 13.55 → DNP | 5.08 → DNP | 3.27 → DNP | 2.13 → DNP | 30.71; 23.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Liam McNeeley | 3.39 → 0 **MISS** | 1.77 → 2 **HIT** | 0.59 → 0 **MISS** | 0.27 → 0 **HIT** | 8.00; 4.80 → 3 **MISS** | VERIFIED_PLAYED |
| Moussa Diabate | 8.44 → 10 **MISS** | 7.71 → 12 **MISS** | 2.36 → 1 **MISS** | 0.21 → 0 **HIT** | 27.36; 24.63 → 31 **MISS** | VERIFIED_PLAYED |
| Ryan Kalkbrenner | 6.12 → 2 **MISS** | 4.08 → 4 **HIT** | 1.48 → 0 **MISS** | 0.18 → 0 **HIT** | 18.10; 17.20 → 15 **MISS** | VERIFIED_PLAYED |
| Sion James | 6.47 → 6 **HIT** | 4.00 → 5 **MISS** | 2.77 → 4 **MISS** | 1.01 → 1 **HIT** | 25.44; 24.17 → 29 **MISS** | VERIFIED_PLAYED |
| Tre Johnson | 10.22 → 4 **MISS** | 2.73 → 2 **MISS** | 1.75 → 0 **MISS** | 1.19 → 0 **MISS** | 22.44; 15.71 → 13 **MISS** | VERIFIED_PLAYED |
| Will Riley | 8.21 → 0 **MISS** | 2.23 → 0 **MISS** | 1.61 → 0 **MISS** | 0.60 → 0 **MISS** | 18.00; 16.20 → 1 **MISS** | VERIFIED_PLAYED |

## Chicago Bulls at Boston Celtics — 2026-10-30T23:30 UTC

Original player rows: 17; verified played: 16; DNP: 1; unverified: 0. Final away–home: 111–125.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Baylor Scheierman | 10.44 → 2 **MISS** | 3.83 → 3 **MISS** | 2.27 → 3 **MISS** | 1.96 → 0 **MISS** | 25.07; 22.56 → 23 **MISS** | VERIFIED_PLAYED |
| Derrick White | 10.57 → 9 **MISS** | 3.59 → 2 **MISS** | 3.82 → 4 **HIT** | 1.64 → 1 **MISS** | 30.11; 25.59 → 26 **MISS** | VERIFIED_PLAYED |
| Hugo Gonzalez | 4.53 → 0 **MISS** | 2.49 → 2 **HIT** | 0.78 → 0 **MISS** | 0.53 → 0 **MISS** | 12.82; 8.97 → 15 **MISS** | VERIFIED_PLAYED |
| Isaac Okoro | 6.93 → 6 **MISS** | 2.15 → 3 **MISS** | 1.50 → 2 **MISS** | 0.64 → 1 **HIT** | 18.95; 15.16 → 18 **MISS** | VERIFIED_PLAYED |
| Jalen Smith | 8.95 → 5 **MISS** | 4.41 → 12 **MISS** | 1.29 → 1 **HIT** | 1.01 → 0 **MISS** | 18.91; 12.29 → 27 **MISS** | VERIFIED_PLAYED |
| Jayson Tatum | 19.99 → 26 **MISS** | 8.63 → 7 **MISS** | 5.97 → 7 **MISS** | 2.07 → 2 **HIT** | 35.22; 28.17 → 35 **HIT** | VERIFIED_PLAYED |
| Jordan Walsh | 6.21 → 2 **MISS** | 3.70 → 2 **MISS** | 1.58 → 0 **MISS** | 0.69 → 0 **MISS** | 21.30; 19.17 → 11 **MISS** | VERIFIED_PLAYED |
| Josh Giddey | 9.13 → 13 **MISS** | 5.13 → 4 **MISS** | 6.69 → 5 **MISS** | 0.80 → 2 **MISS** | 27.54; 19.28 → 25 **MISS** | VERIFIED_PLAYED |
| Leonard Miller | 11.76 → 2 **MISS** | 5.46 → 2 **MISS** | 1.55 → 1 **MISS** | 1.10 → 0 **MISS** | 24.76; 23.52 → 11 **MISS** | VERIFIED_PLAYED |
| Luka Garza | 9.26 → 5 **MISS** | 4.11 → 1 **MISS** | 1.28 → 1 **HIT** | 0.70 → 0 **MISS** | 17.63; 13.22 → 7 **MISS** | VERIFIED_PLAYED |
| Matas Buzelis | 13.76 → 14 **HIT** | 5.25 → 5 **HIT** | 2.05 → 1 **MISS** | 1.26 → 2 **MISS** | 26.53; 19.90 → 20 **MISS** | VERIFIED_PLAYED |
| Neemias Queta | 8.88 → 13 **MISS** | 5.90 → 6 **HIT** | 2.02 → 0 **MISS** | 0.25 → 0 **HIT** | 22.10; 18.79 → 20 **MISS** | VERIFIED_PLAYED |
| Patrick Williams | 10.24 → DNP | 4.39 → DNP | 2.68 → DNP | 1.37 → DNP | 29.44; 22.08 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Payton Pritchard | 17.80 → 30 **MISS** | 3.41 → 3 **HIT** | 3.80 → 3 **MISS** | 3.04 → 3 **HIT** | 29.53; 25.10 → 35 **MISS** | VERIFIED_PLAYED |
| Ron Harper Jr. | 5.38 → 0 **MISS** | 1.79 → 0 **MISS** | 1.05 → 0 **MISS** | 0.69 → 0 **MISS** | 11.89; 8.33 → 3 **MISS** | VERIFIED_PLAYED |
| Sam Hauser | 10.14 → 6 **MISS** | 3.62 → 3 **MISS** | 1.76 → 2 **HIT** | 2.23 → 2 **HIT** | 23.19; 19.71 → 18 **MISS** | VERIFIED_PLAYED |
| Tre Jones | 11.00 → 12 **MISS** | 2.47 → 4 **MISS** | 2.64 → 4 **MISS** | 0.47 → 0 **HIT** | 18.84; 17.90 → 20 **MISS** | VERIFIED_PLAYED |

## Detroit Pistons at Brooklyn Nets — 2026-10-30T23:30 UTC

Original player rows: 18; verified played: 16; DNP: 2; unverified: 0. Final away–home: 110–94.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ausar Thompson | 8.89 → 11 **MISS** | 5.08 → 8 **MISS** | 3.78 → 6 **MISS** | 0.20 → 0 **HIT** | 25.31; 22.78 → 26 **MISS** | VERIFIED_PLAYED |
| Ben Saraf | 12.48 → DNP | 3.74 → DNP | 3.32 → DNP | 0.62 → DNP | 27.33; 21.86 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Cade Cunningham | 14.14 → 20 **MISS** | 4.49 → 5 **MISS** | 6.17 → 4 **MISS** | 1.08 → 1 **HIT** | 28.11; 21.08 → 28 **HIT** | VERIFIED_PLAYED |
| Chaney Johnson | 7.59 → 6 **MISS** | 3.98 → 2 **MISS** | 1.63 → 0 **MISS** | 0.53 → 0 **MISS** | 19.43; 16.51 → 19 **HIT** | VERIFIED_PLAYED |
| Chaz Lanier | 2.16 → 6 **MISS** | 0.78 → 0 **MISS** | 0.50 → 0 **HIT** | 0.21 → 2 **MISS** | 6.70; 4.69 → 3 **MISS** | VERIFIED_PLAYED |
| Daniss Jenkins | 10.42 → 6 **MISS** | 3.86 → 3 **MISS** | 4.14 → 5 **MISS** | 0.96 → 2 **MISS** | 23.77; 22.58 → 24 **HIT** | VERIFIED_PLAYED |
| Danny Wolf | 7.53 → 9 **MISS** | 3.45 → 6 **MISS** | 1.78 → 2 **HIT** | 0.93 → 3 **MISS** | 19.60; 9.80 → 12 **MISS** | VERIFIED_PLAYED |
| Drake Powell | 7.86 → 0 **MISS** | 2.54 → 0 **MISS** | 1.63 → 2 **HIT** | 0.72 → 0 **MISS** | 25.09; 20.07 → 6 **MISS** | VERIFIED_PLAYED |
| Duncan Robinson | 14.82 → 17 **MISS** | 2.74 → 4 **MISS** | 2.29 → 2 **HIT** | 2.96 → 2 **MISS** | 27.16; 24.45 → 26 **MISS** | VERIFIED_PLAYED |
| Jalen Duren | 15.88 → DNP | 7.59 → DNP | 2.97 → DNP | 0.18 → DNP | 26.02; 22.11 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Javonte Green | 7.19 → 6 **MISS** | 2.93 → 3 **HIT** | 0.78 → 1 **HIT** | 1.28 → 1 **HIT** | 16.19; 15.38 → 22 **MISS** | VERIFIED_PLAYED |
| Josh Minott | 10.31 → 2 **MISS** | 3.07 → 0 **MISS** | 1.19 → 0 **MISS** | 1.41 → 0 **MISS** | 19.42; 13.59 → 3 **MISS** | VERIFIED_PLAYED |
| Kevin Huerter | 8.69 → 8 **MISS** | 3.16 → 1 **MISS** | 2.42 → 3 **MISS** | 1.31 → 2 **MISS** | 21.24; 19.11 → 24 **MISS** | VERIFIED_PLAYED |
| Noah Clowney | 7.64 → 3 **MISS** | 3.41 → 8 **MISS** | 1.17 → 1 **HIT** | 0.69 → 0 **MISS** | 19.70; 13.79 → 22 **MISS** | VERIFIED_PLAYED |
| Nolan Traore | 7.59 → 9 **MISS** | 2.05 → 2 **HIT** | 2.03 → 2 **HIT** | 0.78 → 0 **MISS** | 15.32; 13.02 → 26 **MISS** | VERIFIED_PLAYED |
| Paul Reed | 10.63 → 12 **MISS** | 5.52 → 4 **MISS** | 1.95 → 1 **MISS** | 0.43 → 0 **HIT** | 19.55; 18.58 → 31 **MISS** | VERIFIED_PLAYED |
| Ronald Holland II | 6.64 → 18 **MISS** | 3.37 → 3 **HIT** | 1.59 → 2 **HIT** | 0.77 → 2 **MISS** | 17.99; 17.09 → 22 **MISS** | VERIFIED_PLAYED |
| Tolu Smith | 2.12 → 2 **HIT** | 1.05 → 1 **HIT** | 0.50 → 1 **HIT** | 0.10 → 0 **HIT** | 5.18; 3.63 → 3 **MISS** | VERIFIED_PLAYED |

## New York Knicks at Philadelphia 76ers — 2026-10-30T23:30 UTC

Original player rows: 19; verified played: 13; DNP: 6; unverified: 0. Final away–home: 93–98.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Adem Bona | 4.28 → 0 **MISS** | 2.98 → 2 **MISS** | 0.87 → 0 **MISS** | 0.16 → 0 **HIT** | 14.67; 13.20 → 14 **MISS** | VERIFIED_PLAYED |
| Dominick Barlow | 5.61 → DNP | 4.04 → DNP | 1.36 → DNP | 0.18 → DNP | 19.82; 14.87 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jabari Walker | 2.72 → DNP | 1.21 → DNP | 0.59 → DNP | 0.18 → DNP | 6.60; 4.95 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jalen Brunson | 22.37 → 24 **MISS** | 3.39 → 5 **MISS** | 6.10 → 6 **HIT** | 1.54 → 3 **MISS** | 34.92; 27.93 → 35 **HIT** | VERIFIED_PLAYED |
| Joel Embiid | 21.89 → 10 **MISS** | 8.29 → 7 **MISS** | 4.28 → 7 **MISS** | 1.41 → 0 **MISS** | 34.85; 24.39 → 33 **MISS** | VERIFIED_PLAYED |
| Jordan Clarkson | 5.22 → 4 **MISS** | 1.81 → 3 **MISS** | 1.26 → 0 **MISS** | 0.15 → 0 **HIT** | 13.11; 11.80 → 9 **MISS** | VERIFIED_PLAYED |
| Jose Alvarado | 9.24 → DNP | 2.98 → DNP | 3.48 → DNP | 1.30 → DNP | 20.94; 15.70 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Josh Hart | 11.87 → 7 **MISS** | 5.55 → 6 **HIT** | 3.02 → 3 **HIT** | 1.65 → 2 **HIT** | 32.02; 27.21 → 31 **MISS** | VERIFIED_PLAYED |
| Justin Edwards | 4.64 → DNP | 1.06 → DNP | 0.80 → DNP | 0.61 → DNP | 11.57; 8.68 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Karl-Anthony Towns | 18.12 → 22 **MISS** | 10.16 → 12 **MISS** | 3.47 → 3 **HIT** | 1.14 → 3 **MISS** | 29.51; 23.61 → 35 **MISS** | VERIFIED_PLAYED |
| Landry Shamet | 6.62 → 0 **MISS** | 2.22 → 0 **MISS** | 1.48 → 0 **MISS** | 1.12 → 0 **MISS** | 22.91; 18.32 → 16 **MISS** | VERIFIED_PLAYED |
| Mikal Bridges | 11.81 → 12 **HIT** | 3.01 → 5 **MISS** | 2.81 → 2 **MISS** | 1.20 → 2 **MISS** | 32.63; 27.73 → 30 **MISS** | VERIFIED_PLAYED |
| Miles McBride | 6.50 → 10 **MISS** | 2.00 → 3 **MISS** | 1.51 → 1 **MISS** | 1.02 → 2 **MISS** | 17.36; 13.89 → 24 **MISS** | VERIFIED_PLAYED |
| Mohamed Diawara | 4.49 → DNP | 1.58 → DNP | 1.40 → DNP | 0.40 → DNP | 12.87; 9.01 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| OG Anunoby | 14.24 → 9 **MISS** | 4.58 → 4 **MISS** | 1.89 → 3 **MISS** | 2.31 → 1 **MISS** | 31.97; 27.17 → 34 **MISS** | VERIFIED_PLAYED |
| Pacome Dadiet | 3.51 → DNP | 1.34 → DNP | 0.68 → DNP | 0.31 → DNP | 8.76; 5.69 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Tyler Kolek | 4.20 → 2 **MISS** | 1.50 → 1 **MISS** | 2.03 → 4 **MISS** | 0.53 → 0 **MISS** | 11.03; 7.17 → 13 **MISS** | VERIFIED_PLAYED |
| Tyrese Maxey | 23.18 → 27 **MISS** | 4.16 → 4 **HIT** | 4.60 → 4 **MISS** | 1.83 → 3 **MISS** | 36.08; 34.27 → 38 **MISS** | VERIFIED_PLAYED |
| VJ Edgecombe | 13.55 → 13 **MISS** | 6.15 → 8 **MISS** | 4.45 → 2 **MISS** | 1.43 → 1 **HIT** | 34.10; 30.69 → 36 **MISS** | VERIFIED_PLAYED |

## Orlando Magic at Toronto Raptors — 2026-10-30T23:30 UTC

Original player rows: 24; verified played: 18; DNP: 6; unverified: 0. Final away–home: 121–114.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alex Morales | 2.06 → 0 **MISS** | 0.80 → 1 **HIT** | 0.56 → 0 **MISS** | 0.13 → 0 **HIT** | 5.57; 3.62 → 9 **MISS** | VERIFIED_PLAYED |
| Alijah Martin | 2.00 → DNP | 0.79 → DNP | 0.51 → DNP | 0.13 → DNP | 5.60; 4.76 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Anthony Black | 9.38 → 17 **MISS** | 2.85 → 6 **MISS** | 2.00 → 10 **MISS** | 1.09 → 3 **MISS** | 18.88; 14.69 → 31 **MISS** | VERIFIED_PLAYED |
| Colin Castleton | 2.01 → DNP | 0.94 → DNP | 0.44 → DNP | 0.12 → DNP | 4.97; 3.23 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Collin Murray-Boyles | 8.60 → 15 **MISS** | 4.51 → 5 **HIT** | 1.53 → 1 **MISS** | 0.18 → 1 **MISS** | 18.94; 17.04 → 23 **MISS** | VERIFIED_PLAYED |
| Desmond Bane | 13.50 → 28 **MISS** | 3.65 → 2 **MISS** | 2.41 → 6 **MISS** | 1.66 → 6 **MISS** | 27.24; 25.88 → 39 **MISS** | VERIFIED_PLAYED |
| Franz Wagner | 17.04 → 26 **MISS** | 4.84 → 5 **HIT** | 3.49 → 11 **MISS** | 1.07 → 2 **MISS** | 27.81; 25.02 → 39 **MISS** | VERIFIED_PLAYED |
| Goga Bitadze | 6.77 → 2 **MISS** | 4.89 → 4 **MISS** | 1.33 → 0 **MISS** | 0.17 → 0 **HIT** | 15.39; 13.85 → 6 **MISS** | VERIFIED_PLAYED |
| Immanuel Quickley | 11.56 → 17 **MISS** | 3.08 → 6 **MISS** | 3.95 → 8 **MISS** | 1.50 → 4 **MISS** | 25.16; 18.87 → 37 **MISS** | VERIFIED_PLAYED |
| Ja'Kobe Walter | 10.79 → 9 **MISS** | 3.52 → 3 **MISS** | 2.06 → 1 **MISS** | 2.09 → 3 **MISS** | 26.38; 25.06 → 32 **MISS** | VERIFIED_PLAYED |
| Jakob Poeltl | 7.98 → 12 **MISS** | 4.22 → 11 **MISS** | 1.52 → 3 **MISS** | 0.19 → 0 **HIT** | 21.70; 20.61 → 23 **MISS** | VERIFIED_PLAYED |
| Jalen Suggs | 12.35 → DNP | 4.44 → DNP | 5.22 → DNP | 1.95 → DNP | 31.18; 29.62 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jamal Cain | 6.32 → 13 **MISS** | 2.70 → 0 **MISS** | 1.01 → 0 **MISS** | 0.64 → 3 **MISS** | 16.65; 15.82 → 15 **MISS** | VERIFIED_PLAYED |
| Jamal Shead | 6.76 → 2 **MISS** | 1.71 → 1 **MISS** | 3.97 → 8 **MISS** | 0.61 → 0 **MISS** | 22.45; 21.33 → 23 **MISS** | VERIFIED_PLAYED |
| Jamison Battle | 3.94 → 2 **MISS** | 1.40 → 0 **MISS** | 0.70 → 0 **MISS** | 0.50 → 0 **MISS** | 9.01; 8.11 → 19 **MISS** | VERIFIED_PLAYED |
| Jase Richardson | 4.17 → 4 **HIT** | 1.34 → 6 **MISS** | 1.07 → 2 **MISS** | 0.40 → 0 **HIT** | 10.80; 9.18 → 33 **MISS** | VERIFIED_PLAYED |
| Jevon Carter | 5.59 → DNP | 1.85 → DNP | 1.66 → DNP | 0.82 → DNP | 17.30; 14.70 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Noah Penda | 1.64 → DNP | 0.89 → DNP | 0.75 → DNP | 0.16 → DNP | 6.24; 4.37 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Paolo Banchero | 18.31 → DNP | 7.28 → DNP | 5.73 → DNP | 0.84 → DNP | 32.45; 29.20 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| RJ Barrett | 19.11 → 9 **MISS** | 4.82 → 3 **MISS** | 3.03 → 5 **MISS** | 1.01 → 1 **HIT** | 31.13; 28.02 → 34 **MISS** | VERIFIED_PLAYED |
| Scottie Barnes | 15.04 → 41 **MISS** | 6.05 → 5 **MISS** | 6.00 → 5 **MISS** | 0.67 → 1 **HIT** | 30.84; 29.30 → 39 **MISS** | VERIFIED_PLAYED |
| Trayce Jackson-Davis | 2.22 → 0 **MISS** | 0.85 → 0 **MISS** | 0.40 → 0 **HIT** | 0.09 → 0 **HIT** | 5.15; 4.12 → 1 **MISS** | VERIFIED_PLAYED |
| Tristan da Silva | 9.69 → 8 **MISS** | 3.21 → 0 **MISS** | 2.26 → 0 **MISS** | 1.30 → 2 **MISS** | 24.56; 23.33 → 23 **MISS** | VERIFIED_PLAYED |
| Wendell Carter Jr. | 12.69 → 20 **MISS** | 6.53 → 7 **HIT** | 1.53 → 1 **MISS** | 0.74 → 1 **HIT** | 28.95; 27.51 → 39 **MISS** | VERIFIED_PLAYED |

## Indiana Pacers at Miami Heat — 2026-10-31T00:00 UTC

Original player rows: 21; verified played: 16; DNP: 5; unverified: 0. Final away–home: 125–145.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Nesmith | 12.74 → 9 **MISS** | 2.94 → 3 **HIT** | 1.56 → 2 **HIT** | 1.84 → 1 **MISS** | 25.83; 15.50 → 21 **MISS** | VERIFIED_PLAYED |
| Andrew Nembhard | 14.47 → 22 **MISS** | 3.09 → 2 **MISS** | 7.08 → 9 **MISS** | 1.42 → 5 **MISS** | 32.71; 19.63 → 30 **MISS** | VERIFIED_PLAYED |
| Andrew Wiggins | 10.31 → 12 **MISS** | 3.58 → 2 **MISS** | 1.97 → 1 **MISS** | 1.15 → 2 **MISS** | 26.85; 25.51 → 30 **MISS** | VERIFIED_PLAYED |
| Bam Adebayo | 14.94 → 27 **MISS** | 7.89 → 9 **MISS** | 3.76 → 3 **MISS** | 1.16 → 0 **MISS** | 31.57; 29.99 → 33 **MISS** | VERIFIED_PLAYED |
| Ben Sheppard | 7.30 → DNP | 2.65 → DNP | 1.55 → DNP | 0.95 → DNP | 20.18; 11.10 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Davion Mitchell | 14.18 → 15 **MISS** | 2.52 → 6 **MISS** | 5.42 → 11 **MISS** | 1.66 → 3 **MISS** | 31.99; 28.79 → 35 **MISS** | VERIFIED_PLAYED |
| Dru Smith | 3.14 → 0 **MISS** | 1.07 → 0 **MISS** | 0.93 → 1 **HIT** | 0.31 → 0 **HIT** | 8.32; 5.41 → 4 **MISS** | VERIFIED_PLAYED |
| Ivica Zubac | 10.12 → DNP | 6.01 → DNP | 1.77 → DNP | 0.30 → DNP | 23.18; 13.91 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jalen Slawson | 5.01 → 4 **MISS** | 2.95 → 4 **MISS** | 1.71 → 1 **MISS** | 0.48 → 0 **HIT** | 15.92; 13.53 → 18 **MISS** | VERIFIED_PLAYED |
| Jarace Walker | 9.27 → 14 **MISS** | 4.51 → 6 **MISS** | 2.22 → 4 **MISS** | 1.36 → 3 **MISS** | 23.04; 18.43 → 28 **MISS** | VERIFIED_PLAYED |
| Jay Huff | 8.31 → 13 **MISS** | 3.88 → 1 **MISS** | 1.99 → 0 **MISS** | 1.02 → 3 **MISS** | 19.42; 17.48 → 19 **HIT** | VERIFIED_PLAYED |
| Keshad Johnson | 6.13 → DNP | 2.15 → DNP | 1.02 → DNP | 0.40 → DNP | 13.35; 9.35 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kobe Brown | 9.40 → 9 **HIT** | 4.06 → 6 **MISS** | 2.48 → 4 **MISS** | 1.35 → 0 **MISS** | 23.91; 17.93 → 20 **MISS** | VERIFIED_PLAYED |
| Myron Gardner | 1.88 → 0 **MISS** | 0.85 → 1 **HIT** | 0.49 → 1 **MISS** | 0.15 → 0 **HIT** | 4.66; 3.49 → 2 **MISS** | VERIFIED_PLAYED |
| Nikola Jovic | 4.05 → 0 **MISS** | 1.89 → 4 **MISS** | 1.05 → 3 **MISS** | 0.29 → 0 **HIT** | 12.00; 7.80 → 16 **MISS** | VERIFIED_PLAYED |
| Obi Toppin | 13.52 → DNP | 4.29 → DNP | 2.03 → DNP | 1.93 → DNP | 21.35; 20.28 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Pascal Siakam | 21.24 → 13 **MISS** | 6.48 → 5 **MISS** | 3.41 → 4 **MISS** | 1.49 → 0 **MISS** | 31.72; 22.21 → 29 **MISS** | VERIFIED_PLAYED |
| Pelle Larsson | 11.91 → 18 **MISS** | 3.52 → 3 **MISS** | 3.27 → 3 **HIT** | 0.75 → 1 **HIT** | 29.04; 26.14 → 24 **MISS** | VERIFIED_PLAYED |
| Quenton Jackson | 9.19 → 24 **MISS** | 2.50 → 4 **MISS** | 3.23 → 1 **MISS** | 0.52 → 2 **MISS** | 21.25; 20.18 → 24 **MISS** | VERIFIED_PLAYED |
| Simone Fontecchio | 6.21 → 3 **MISS** | 1.79 → 1 **MISS** | 1.12 → 0 **MISS** | 1.07 → 1 **HIT** | 12.46; 8.73 → 2 **MISS** | VERIFIED_PLAYED |
| Vladislav Goldin | 1.13 → DNP | 0.51 → DNP | 0.27 → DNP | 0.08 → DNP | 3.00; 1.95 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Houston Rockets at Dallas Mavericks — 2026-10-31T00:00 UTC

Original player rows: 15; verified played: 9; DNP: 6; unverified: 0. Final away–home: 111–116.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alperen Sengun | 20.20 → DNP | 7.82 → DNP | 5.93 → DNP | 1.17 → DNP | 32.70; 29.43 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Amen Thompson | 18.97 → 15 **MISS** | 7.43 → 3 **MISS** | 4.73 → 6 **MISS** | 0.40 → 0 **HIT** | 36.15; 32.54 → 39 **MISS** | VERIFIED_PLAYED |
| Clint Capela | 4.44 → 5 **MISS** | 3.15 → 11 **MISS** | 0.82 → 5 **MISS** | 0.21 → 0 **HIT** | 11.07; 9.96 → 30 **MISS** | VERIFIED_PLAYED |
| Cooper Flagg | 20.68 → 33 **MISS** | 5.36 → 9 **MISS** | 3.89 → 6 **MISS** | 1.27 → 0 **MISS** | 28.26; 25.44 → 39 **MISS** | VERIFIED_PLAYED |
| Daniel Gafford | 9.16 → 18 **MISS** | 5.42 → 7 **MISS** | 1.94 → 2 **HIT** | 0.20 → 0 **HIT** | 21.61; 16.21 → 29 **MISS** | VERIFIED_PLAYED |
| Isaiah Crawford | 2.12 → DNP | 0.80 → DNP | 0.40 → DNP | 0.18 → DNP | 5.06; 3.29 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jabari Smith Jr. | 16.80 → 22 **MISS** | 6.20 → 3 **MISS** | 2.35 → 2 **HIT** | 2.37 → 3 **MISS** | 35.92; 32.33 → 35 **MISS** | VERIFIED_PLAYED |
| Jae'Sean Tate | 2.98 → DNP | 1.61 → DNP | 0.66 → DNP | 0.18 → DNP | 8.20; 6.97 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kevin Durant | 22.92 → 28 **MISS** | 6.00 → 5 **MISS** | 4.73 → 1 **MISS** | 1.89 → 1 **MISS** | 35.84; 32.26 → 37 **MISS** | VERIFIED_PLAYED |
| Max Christie | 10.11 → 2 **MISS** | 3.47 → 1 **MISS** | 2.05 → 0 **MISS** | 1.60 → 0 **MISS** | 26.95; 25.60 → 18 **MISS** | VERIFIED_PLAYED |
| Moussa Cisse | 6.42 → DNP | 4.60 → DNP | 0.77 → DNP | 0.21 → DNP | 15.02; 11.27 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Naji Marshall | 13.14 → DNP | 3.77 → DNP | 3.91 → DNP | 0.74 → DNP | 27.48; 20.61 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| P.J. Washington | 15.34 → 3 **MISS** | 6.98 → 10 **MISS** | 1.62 → 1 **MISS** | 1.86 → 1 **MISS** | 33.82; 23.67 → 34 **HIT** | VERIFIED_PLAYED |
| Reed Sheppard | 11.79 → DNP | 2.93 → DNP | 3.17 → DNP | 2.33 → DNP | 23.30; 20.97 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Tari Eason | 10.89 → 11 **HIT** | 4.66 → 13 **MISS** | 1.32 → 2 **MISS** | 0.72 → 0 **MISS** | 23.86; 22.66 → 26 **MISS** | VERIFIED_PLAYED |

## LA Clippers at Minnesota Timberwolves — 2026-10-31T00:00 UTC

Original player rows: 18; verified played: 15; DNP: 3; unverified: 0. Final away–home: 101–127.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Anthony Edwards | 22.46 → DNP | 4.15 → DNP | 3.29 → DNP | 2.66 → DNP | 31.85; 23.89 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ayo Dosunmu | 12.63 → 15 **MISS** | 4.27 → 7 **MISS** | 3.64 → 2 **MISS** | 1.10 → 3 **MISS** | 26.62; 22.63 → 30 **MISS** | VERIFIED_PLAYED |
| Bones Hyland | 5.88 → 19 **MISS** | 1.91 → 0 **MISS** | 1.58 → 8 **MISS** | 1.07 → 3 **MISS** | 14.29; 12.14 → 20 **MISS** | VERIFIED_PLAYED |
| Brook Lopez | 12.96 → 13 **HIT** | 5.52 → 6 **HIT** | 1.59 → 0 **MISS** | 1.67 → 1 **MISS** | 25.47; 22.92 → 21 **MISS** | VERIFIED_PLAYED |
| Cam Christie | 1.53 → 2 **HIT** | 0.65 → 1 **HIT** | 0.34 → 1 **MISS** | 0.08 → 0 **HIT** | 4.51; 3.38 → 5 **HIT** | VERIFIED_PLAYED |
| Darius Garland | 18.99 → 24 **MISS** | 2.79 → 2 **MISS** | 5.66 → 5 **MISS** | 2.40 → 4 **MISS** | 33.45; 28.43 → 31 **MISS** | VERIFIED_PLAYED |
| Derrick Jones Jr. | 8.76 → 10 **MISS** | 4.53 → 1 **MISS** | 1.75 → 1 **MISS** | 1.16 → 2 **MISS** | 26.84; 24.16 → 26 **MISS** | VERIFIED_PLAYED |
| Donte DiVincenzo | 10.33 → DNP | 2.59 → DNP | 2.25 → DNP | 2.22 → DNP | 25.08; 18.81 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Isaiah Jackson | 9.12 → 10 **MISS** | 4.68 → 7 **MISS** | 1.90 → 4 **MISS** | 0.21 → 0 **HIT** | 20.96; 12.57 → 22 **MISS** | VERIFIED_PLAYED |
| Jaden McDaniels | 15.51 → 23 **MISS** | 5.43 → 6 **MISS** | 2.65 → 7 **MISS** | 1.31 → 1 **HIT** | 32.32; 24.24 → 33 **MISS** | VERIFIED_PLAYED |
| Jaylen Clark | 4.20 → 5 **MISS** | 1.69 → 0 **MISS** | 1.03 → 2 **MISS** | 0.49 → 1 **MISS** | 11.81; 10.04 → 17 **MISS** | VERIFIED_PLAYED |
| Joan Beringer | 8.01 → 4 **MISS** | 4.58 → 4 **MISS** | 0.93 → 0 **MISS** | 0.20 → 0 **HIT** | 16.18; 14.56 → 18 **MISS** | VERIFIED_PLAYED |
| Jordan Miller | 11.08 → DNP | 3.34 → DNP | 2.59 → DNP | 0.68 → DNP | 25.80; 19.35 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kobe Sanders | 7.66 → 7 **MISS** | 2.15 → 4 **MISS** | 1.93 → 2 **HIT** | 0.96 → 1 **HIT** | 17.68; 15.92 → 24 **MISS** | VERIFIED_PLAYED |
| Kris Dunn | 7.55 → 5 **MISS** | 3.91 → 5 **MISS** | 3.84 → 7 **MISS** | 0.81 → 0 **MISS** | 28.66; 25.79 → 31 **MISS** | VERIFIED_PLAYED |
| Rudy Gobert | 9.83 → 9 **MISS** | 11.19 → 13 **MISS** | 1.67 → 4 **MISS** | 0.22 → 0 **HIT** | 31.82; 25.46 → 30 **MISS** | VERIFIED_PLAYED |
| Terrence Shannon Jr. | 12.70 → 11 **MISS** | 2.89 → 3 **HIT** | 2.34 → 2 **HIT** | 1.49 → 2 **MISS** | 22.46; 21.34 → 20 **MISS** | VERIFIED_PLAYED |
| Zyon Pullin | 3.50 → 2 **MISS** | 1.06 → 0 **MISS** | 0.94 → 0 **MISS** | 0.22 → 0 **HIT** | 8.19; 5.32 → 2 **MISS** | VERIFIED_PLAYED |

## Los Angeles Lakers at Golden State Warriors — 2026-10-31T02:00 UTC

Original player rows: 18; verified played: 14; DNP: 4; unverified: 0. Final away–home: 95–112.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Adou Thiero | 3.26 → DNP | 1.27 → DNP | 0.74 → DNP | 0.22 → DNP | 8.19; 5.74 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Al Horford | 6.58 → 3 **MISS** | 2.90 → 2 **MISS** | 1.46 → 0 **MISS** | 0.90 → 1 **HIT** | 18.40; 15.15 → 17 **MISS** | VERIFIED_PLAYED |
| Austin Reaves | 20.18 → 21 **MISS** | 3.94 → 4 **HIT** | 4.84 → 5 **HIT** | 1.89 → 1 **MISS** | 34.90; 24.43 → 37 **MISS** | VERIFIED_PLAYED |
| Brandin Podziemski | 17.08 → 21 **MISS** | 4.35 → 5 **MISS** | 3.05 → 6 **MISS** | 1.93 → 4 **MISS** | 29.46; 23.57 → 33 **MISS** | VERIFIED_PLAYED |
| Bronny James | 5.93 → 0 **MISS** | 1.50 → 0 **MISS** | 1.42 → 0 **MISS** | 0.78 → 0 **MISS** | 15.84; 13.46 → 1 **MISS** | VERIFIED_PLAYED |
| Charles Bassey | 7.09 → 6 **MISS** | 3.64 → 4 **HIT** | 1.16 → 1 **HIT** | 0.25 → 0 **HIT** | 15.44; 11.58 → 9 **MISS** | VERIFIED_PLAYED |
| De'Anthony Melton | 7.49 → 16 **MISS** | 3.25 → 5 **MISS** | 2.39 → 3 **MISS** | 1.00 → 4 **MISS** | 21.13; 19.02 → 21 **HIT** | VERIFIED_PLAYED |
| Draymond Green | 6.90 → 2 **MISS** | 4.35 → 4 **HIT** | 5.41 → 9 **MISS** | 0.88 → 0 **MISS** | 26.46; 21.17 → 32 **MISS** | VERIFIED_PLAYED |
| Gary Payton II | 6.98 → 2 **MISS** | 2.58 → 4 **MISS** | 0.87 → 0 **MISS** | 0.34 → 0 **HIT** | 15.77; 14.19 → 8 **MISS** | VERIFIED_PLAYED |
| Gui Santos | 11.01 → 2 **MISS** | 4.12 → 5 **MISS** | 2.14 → 1 **MISS** | 1.00 → 0 **MISS** | 24.27; 20.63 → 16 **MISS** | VERIFIED_PLAYED |
| Jake LaRavia | 6.85 → 10 **MISS** | 4.05 → 2 **MISS** | 1.78 → 0 **MISS** | 0.80 → 2 **MISS** | 24.37; 21.93 → 28 **MISS** | VERIFIED_PLAYED |
| Jarred Vanderbilt | 5.00 → 0 **MISS** | 3.24 → 3 **HIT** | 1.58 → 3 **MISS** | 0.38 → 0 **HIT** | 15.38; 11.53 → 13 **MISS** | VERIFIED_PLAYED |
| Kristaps Porzingis | 13.55 → DNP | 5.48 → DNP | 2.13 → DNP | 1.25 → DNP | 25.59; 16.64 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| LJ Cryer | 6.86 → DNP | 1.41 → DNP | 1.40 → DNP | 1.40 → DNP | 14.34; 10.04 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Luka Doncic | 29.65 → 37 **MISS** | 6.00 → 7 **MISS** | 6.39 → 5 **MISS** | 3.74 → 6 **MISS** | 34.25; 23.98 → 37 **MISS** | VERIFIED_PLAYED |
| Malevy Leons | 3.52 → DNP | 1.33 → DNP | 0.78 → DNP | 0.22 → DNP | 9.75; 7.31 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Stephen Curry | 17.34 → 31 **MISS** | 3.46 → 4 **MISS** | 2.95 → 6 **MISS** | 2.10 → 8 **MISS** | 27.08; 20.31 → 31 **MISS** | VERIFIED_PLAYED |
| Will Richard | 4.67 → 3 **MISS** | 1.83 → 3 **MISS** | 1.02 → 2 **MISS** | 0.64 → 1 **HIT** | 15.66; 13.31 → 13 **MISS** | VERIFIED_PLAYED |

## Denver Nuggets at Phoenix Suns — 2026-10-31T02:00 UTC

Original player rows: 19; verified played: 14; DNP: 5; unverified: 0. Final away–home: 127–120.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Gordon | 12.52 → 15 **MISS** | 4.84 → 4 **MISS** | 3.03 → 5 **MISS** | 1.26 → 2 **MISS** | 28.86; 23.09 → 29 **HIT** | VERIFIED_PLAYED |
| Cameron Johnson | 13.70 → 12 **MISS** | 4.49 → 9 **MISS** | 2.91 → 3 **HIT** | 2.08 → 2 **HIT** | 30.03; 22.52 → 34 **MISS** | VERIFIED_PLAYED |
| Christian Braun | 12.53 → 31 **MISS** | 4.99 → 3 **MISS** | 2.07 → 1 **MISS** | 0.88 → 7 **MISS** | 33.83; 28.76 → 37 **MISS** | VERIFIED_PLAYED |
| Collin Gillespie | 7.67 → 16 **MISS** | 3.26 → 3 **HIT** | 3.16 → 10 **MISS** | 1.24 → 4 **MISS** | 23.87; 21.48 → 33 **MISS** | VERIFIED_PLAYED |
| DaRon Holmes II | 1.26 → DNP | 0.53 → DNP | 0.28 → DNP | 0.13 → DNP | 3.00; 2.40 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Devin Booker | 24.68 → 20 **MISS** | 4.19 → 2 **MISS** | 5.78 → 5 **MISS** | 1.56 → 3 **MISS** | 34.49; 29.32 → 39 **MISS** | VERIFIED_PLAYED |
| Dillon Brooks | 14.09 → 22 **MISS** | 3.74 → 1 **MISS** | 2.53 → 2 **MISS** | 1.43 → 4 **MISS** | 29.54; 26.59 → 21 **MISS** | VERIFIED_PLAYED |
| Jalen Green | 13.55 → 2 **MISS** | 3.21 → 2 **MISS** | 2.58 → 2 **MISS** | 1.25 → 0 **MISS** | 24.68; 20.98 → 25 **HIT** | VERIFIED_PLAYED |
| Jamal Murray | 22.79 → 39 **MISS** | 5.05 → 8 **MISS** | 5.86 → 5 **MISS** | 3.65 → 7 **MISS** | 37.79; 32.12 → 37 **MISS** | VERIFIED_PLAYED |
| Jamaree Bouyea | 5.91 → DNP | 1.94 → DNP | 2.02 → DNP | 0.44 → DNP | 14.36; 11.49 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jordan Goodwin | 8.40 → 11 **MISS** | 3.85 → 5 **MISS** | 1.83 → 5 **MISS** | 1.68 → 3 **MISS** | 20.55; 17.47 → 25 **MISS** | VERIFIED_PLAYED |
| Julian Strawther | 10.20 → DNP | 2.69 → DNP | 1.73 → DNP | 1.45 → DNP | 20.17; 16.14 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Khaman Maluach | 7.96 → 9 **MISS** | 5.84 → 6 **HIT** | 1.10 → 0 **MISS** | 0.46 → 0 **HIT** | 20.12; 18.11 → 17 **MISS** | VERIFIED_PLAYED |
| Nikola Jokic | 20.74 → 18 **MISS** | 10.52 → 7 **MISS** | 8.09 → 10 **MISS** | 1.14 → 0 **MISS** | 33.82; 30.44 → 37 **MISS** | VERIFIED_PLAYED |
| Oso Ighodaro | 6.61 → 2 **MISS** | 4.40 → 9 **MISS** | 2.03 → 5 **MISS** | 0.16 → 0 **HIT** | 18.93; 16.09 → 21 **MISS** | VERIFIED_PLAYED |
| Rasheer Fleming | 6.13 → DNP | 2.73 → DNP | 0.98 → DNP | 0.80 → DNP | 18.21; 15.48 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ryan Dunn | 6.98 → 5 **MISS** | 4.04 → 3 **MISS** | 1.61 → 1 **MISS** | 0.71 → 1 **HIT** | 19.12; 16.25 → 11 **MISS** | VERIFIED_PLAYED |
| Tyus Jones | 4.28 → 3 **MISS** | 1.79 → 0 **MISS** | 1.39 → 0 **MISS** | 0.51 → 1 **HIT** | 13.00; 10.40 → 11 **MISS** | VERIFIED_PLAYED |
| Zeke Nnaji | 3.61 → DNP | 1.69 → DNP | 0.89 → DNP | 0.30 → DNP | 10.18; 7.12 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Portland Trail Blazers at Utah Jazz — 2026-10-31T19:00 UTC

Original player rows: 16; verified played: 14; DNP: 2; unverified: 0. Final away–home: 112–90.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ace Bailey | 13.45 → 9 **MISS** | 5.73 → 7 **MISS** | 2.39 → 1 **MISS** | 1.43 → 1 **HIT** | 28.30; 25.47 → 37 **MISS** | VERIFIED_PLAYED |
| Blake Hinson | 12.18 → DNP | 2.72 → DNP | 1.83 → DNP | 1.79 → DNP | 20.60; 12.36 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Brice Sensabaugh | 9.93 → 12 **MISS** | 2.64 → 3 **HIT** | 1.72 → 2 **HIT** | 1.53 → 2 **HIT** | 16.57; 14.92 → 19 **MISS** | VERIFIED_PLAYED |
| Deni Avdija | 21.79 → 24 **MISS** | 6.06 → 5 **MISS** | 5.78 → 2 **MISS** | 1.70 → 2 **HIT** | 32.77; 31.13 → 30 **MISS** | VERIFIED_PLAYED |
| Donovan Clingan | 10.23 → 4 **MISS** | 8.18 → 9 **MISS** | 1.87 → 0 **MISS** | 1.15 → 0 **MISS** | 24.61; 23.38 → 15 **MISS** | VERIFIED_PLAYED |
| Isaiah Collier | 8.07 → 8 **HIT** | 3.24 → 1 **MISS** | 3.63 → 4 **HIT** | 0.30 → 0 **HIT** | 19.20; 12.48 → 20 **MISS** | VERIFIED_PLAYED |
| Jayson Kent | 1.98 → DNP | 0.81 → DNP | 0.38 → DNP | 0.15 → DNP | 5.25; 3.41 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jrue Holiday | 14.60 → 14 **MISS** | 4.15 → 4 **HIT** | 3.93 → 3 **MISS** | 2.02 → 2 **HIT** | 28.19; 26.78 → 22 **MISS** | VERIFIED_PLAYED |
| Kyle Filipowski | 8.80 → 5 **MISS** | 4.41 → 0 **MISS** | 2.17 → 2 **HIT** | 0.61 → 1 **HIT** | 17.72; 14.18 → 6 **MISS** | VERIFIED_PLAYED |
| Robert Williams III | 7.70 → 3 **MISS** | 6.29 → 3 **MISS** | 1.11 → 1 **HIT** | 0.34 → 0 **HIT** | 18.52; 17.59 → 14 **MISS** | VERIFIED_PLAYED |
| Scoot Henderson | 11.10 → 14 **MISS** | 2.35 → 3 **MISS** | 2.64 → 1 **MISS** | 1.19 → 1 **HIT** | 23.99; 22.79 → 31 **MISS** | VERIFIED_PLAYED |
| Sidy Cissoko | 4.45 → 1 **MISS** | 2.26 → 3 **MISS** | 1.46 → 1 **HIT** | 0.38 → 0 **HIT** | 14.15; 13.44 → 19 **MISS** | VERIFIED_PLAYED |
| Svi Mykhailiuk | 7.13 → 6 **MISS** | 2.56 → 1 **MISS** | 1.24 → 3 **MISS** | 1.06 → 2 **MISS** | 17.45; 12.21 → 18 **MISS** | VERIFIED_PLAYED |
| Toumani Camara | 14.21 → 14 **HIT** | 3.45 → 4 **MISS** | 2.02 → 0 **MISS** | 2.91 → 4 **MISS** | 29.43; 27.96 → 31 **MISS** | VERIFIED_PLAYED |
| Vit Krejci | 3.31 → 5 **MISS** | 1.18 → 4 **MISS** | 0.73 → 2 **MISS** | 0.39 → 1 **MISS** | 8.60; 5.59 → 24 **MISS** | VERIFIED_PLAYED |
| Yang Hansen | 2.85 → 6 **MISS** | 1.31 → 5 **MISS** | 0.50 → 1 **MISS** | 0.20 → 2 **MISS** | 7.20; 4.68 → 13 **MISS** | VERIFIED_PLAYED |

## Philadelphia 76ers at Charlotte Hornets — 2026-10-31T22:00 UTC

Original player rows: 15; verified played: 9; DNP: 6; unverified: 0. Final away–home: 109–104.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Adem Bona | 4.28 → 2 **MISS** | 2.98 → 5 **MISS** | 0.87 → 3 **MISS** | 0.16 → 0 **HIT** | 14.67; 13.20 → 22 **MISS** | VERIFIED_PLAYED |
| Brandon Miller | 18.94 → 24 **MISS** | 4.22 → 5 **MISS** | 2.24 → 5 **MISS** | 2.40 → 5 **MISS** | 31.53; 29.95 → 33 **MISS** | VERIFIED_PLAYED |
| Coby White | 12.85 → DNP | 2.70 → DNP | 2.23 → DNP | 1.67 → DNP | 17.90; 12.53 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Dominick Barlow | 5.61 → DNP | 4.04 → DNP | 1.36 → DNP | 0.18 → DNP | 19.82; 14.87 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Grant Williams | 7.22 → DNP | 3.80 → DNP | 1.32 → DNP | 1.20 → DNP | 21.16; 14.82 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jabari Walker | 2.72 → 12 **MISS** | 1.21 → 6 **MISS** | 0.59 → 0 **MISS** | 0.18 → 1 **MISS** | 6.60; 4.95 → 19 **MISS** | VERIFIED_PLAYED |
| Joel Embiid | 21.89 → DNP | 8.29 → DNP | 4.28 → DNP | 1.41 → DNP | 34.85; 24.39 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Justin Edwards | 4.64 → 0 **MISS** | 1.06 → 1 **HIT** | 0.80 → 0 **MISS** | 0.61 → 0 **MISS** | 11.57; 8.68 → 2 **MISS** | VERIFIED_PLAYED |
| Kon Knueppel | 13.55 → DNP | 5.08 → DNP | 3.27 → DNP | 2.13 → DNP | 30.71; 23.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Liam McNeeley | 3.39 → DNP | 1.77 → DNP | 0.59 → DNP | 0.27 → DNP | 8.00; 4.80 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Moussa Diabate | 8.44 → 10 **MISS** | 7.71 → 8 **HIT** | 2.36 → 3 **MISS** | 0.21 → 0 **HIT** | 27.36; 24.63 → 28 **MISS** | VERIFIED_PLAYED |
| Ryan Kalkbrenner | 6.12 → 6 **HIT** | 4.08 → 3 **MISS** | 1.48 → 4 **MISS** | 0.18 → 0 **HIT** | 18.10; 17.20 → 19 **MISS** | VERIFIED_PLAYED |
| Sion James | 6.47 → 4 **MISS** | 4.00 → 2 **MISS** | 2.77 → 1 **MISS** | 1.01 → 0 **MISS** | 25.44; 24.17 → 18 **MISS** | VERIFIED_PLAYED |
| Tyrese Maxey | 23.18 → 38 **MISS** | 4.16 → 4 **HIT** | 4.60 → 4 **MISS** | 1.83 → 4 **MISS** | 36.08; 34.27 → 38 **MISS** | VERIFIED_PLAYED |
| VJ Edgecombe | 13.55 → 10 **MISS** | 6.15 → 8 **MISS** | 4.45 → 3 **MISS** | 1.43 → 2 **MISS** | 34.10; 30.69 → 37 **MISS** | VERIFIED_PLAYED |

## Atlanta Hawks at New Orleans Pelicans — 2026-10-31T23:00 UTC

Original player rows: 18; verified played: 15; DNP: 3; unverified: 0. Final away–home: 99–121.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Asa Newell | 4.81 → 13 **MISS** | 2.18 → 4 **MISS** | 1.05 → 1 **HIT** | 0.41 → 1 **MISS** | 11.70; 8.77 → 19 **MISS** | VERIFIED_PLAYED |
| CJ McCollum | 16.12 → 14 **MISS** | 2.69 → 2 **MISS** | 3.10 → 2 **MISS** | 2.28 → 2 **HIT** | 27.29; 24.56 → 24 **MISS** | VERIFIED_PLAYED |
| Corey Kispert | 6.51 → 0 **MISS** | 1.43 → 0 **MISS** | 1.05 → 1 **HIT** | 1.14 → 0 **MISS** | 12.17; 9.13 → 5 **MISS** | VERIFIED_PLAYED |
| Dejounte Murray | 15.94 → DNP | 5.11 → DNP | 5.62 → DNP | 1.08 → DNP | 30.74; 21.52 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Derik Queen | 14.84 → 8 **MISS** | 8.55 → 8 **MISS** | 2.77 → 4 **MISS** | 0.44 → 0 **HIT** | 29.47; 27.99 → 23 **MISS** | VERIFIED_PLAYED |
| Dyson Daniels | 12.35 → 8 **MISS** | 6.28 → 4 **MISS** | 4.33 → 3 **MISS** | 0.54 → 0 **MISS** | 30.16; 27.14 → 27 **MISS** | VERIFIED_PLAYED |
| Herbert Jones | 5.48 → 11 **MISS** | 2.05 → 3 **MISS** | 1.36 → 2 **MISS** | 0.91 → 1 **HIT** | 17.19; 13.76 → 25 **MISS** | VERIFIED_PLAYED |
| Jalen Johnson | 18.50 → 13 **MISS** | 8.43 → 7 **MISS** | 5.77 → 4 **MISS** | 1.26 → 1 **HIT** | 32.15; 28.94 → 28 **MISS** | VERIFIED_PLAYED |
| Jeremiah Fears | 18.31 → 20 **MISS** | 4.30 → 5 **MISS** | 3.59 → 7 **MISS** | 1.26 → 1 **HIT** | 31.37; 29.80 → 31 **HIT** | VERIFIED_PLAYED |
| Jock Landale | 7.35 → 0 **MISS** | 3.56 → 0 **MISS** | 2.32 → 0 **MISS** | 0.56 → 0 **MISS** | 18.77; 13.14 → 1 **MISS** | VERIFIED_PLAYED |
| Jordan Poole | 10.48 → DNP | 2.52 → DNP | 3.05 → DNP | 1.46 → DNP | 22.71; 17.03 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Karlo Matkovic | 5.69 → 8 **MISS** | 3.04 → 10 **MISS** | 0.79 → 1 **HIT** | 0.47 → 2 **MISS** | 14.74; 8.84 → 18 **MISS** | VERIFIED_PLAYED |
| Nickeil Alexander-Walker | 18.58 → 12 **MISS** | 3.51 → 2 **MISS** | 3.25 → 1 **MISS** | 2.85 → 0 **MISS** | 31.25; 28.12 → 29 **MISS** | VERIFIED_PLAYED |
| Onyeka Okongwu | 10.16 → 6 **MISS** | 5.44 → 10 **MISS** | 2.32 → 1 **MISS** | 1.06 → 0 **MISS** | 27.70; 24.93 → 28 **HIT** | VERIFIED_PLAYED |
| Saddiq Bey | 16.31 → 25 **MISS** | 3.93 → 6 **MISS** | 2.08 → 1 **MISS** | 2.11 → 1 **MISS** | 28.06; 22.44 → 26 **MISS** | VERIFIED_PLAYED |
| Trey Murphy III | 15.50 → 15 **MISS** | 5.54 → 5 **MISS** | 3.12 → 5 **MISS** | 2.01 → 1 **MISS** | 34.29; 24.00 → 29 **MISS** | VERIFIED_PLAYED |
| Yves Missi | 8.70 → DNP | 6.40 → DNP | 2.06 → DNP | 0.20 → DNP | 23.89; 17.92 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Zion Williamson | 17.27 → 15 **MISS** | 4.52 → 6 **MISS** | 2.64 → 4 **MISS** | 0.39 → 0 **HIT** | 30.93; 24.74 → 30 **MISS** | VERIFIED_PLAYED |

## Sacramento Kings at Memphis Grizzlies — 2026-11-01T00:00 UTC

Original player rows: 14; verified played: 11; DNP: 3; unverified: 0. Final away–home: 105–136.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Cam Spencer | 7.83 → 10 **MISS** | 2.39 → 5 **MISS** | 3.34 → 13 **MISS** | 1.49 → 2 **MISS** | 18.85; 13.20 → 25 **MISS** | VERIFIED_PLAYED |
| Cedric Coward | 13.57 → 10 **MISS** | 5.58 → 7 **MISS** | 2.32 → 2 **HIT** | 1.65 → 2 **HIT** | 26.10; 19.57 → 23 **MISS** | VERIFIED_PLAYED |
| Daeqwon Plowden | 7.41 → 4 **MISS** | 2.31 → 0 **MISS** | 1.19 → 0 **MISS** | 1.12 → 0 **MISS** | 20.32; 17.27 → 4 **MISS** | VERIFIED_PLAYED |
| Dylan Cardwell | 6.02 → DNP | 5.46 → DNP | 1.68 → DNP | 0.28 → DNP | 19.29; 12.54 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| GG Jackson | 8.63 → 21 **MISS** | 3.34 → 3 **HIT** | 1.32 → 2 **MISS** | 0.79 → 5 **MISS** | 17.15; 12.86 → 21 **MISS** | VERIFIED_PLAYED |
| Jahmai Mashack | 10.64 → 2 **MISS** | 4.41 → 0 **MISS** | 4.67 → 1 **MISS** | 0.79 → 0 **MISS** | 31.50; 20.48 → 4 **MISS** | VERIFIED_PLAYED |
| Javon Small | 11.33 → 7 **MISS** | 3.40 → 1 **MISS** | 2.95 → 5 **MISS** | 1.52 → 2 **HIT** | 24.08; 13.24 → 20 **MISS** | VERIFIED_PLAYED |
| Jaylen Wells | 11.26 → 4 **MISS** | 3.50 → 2 **MISS** | 1.70 → 0 **MISS** | 1.41 → 0 **MISS** | 26.66; 17.33 → 22 **MISS** | VERIFIED_PLAYED |
| Malik Monk | 7.67 → 8 **HIT** | 1.86 → 0 **MISS** | 3.03 → 3 **HIT** | 1.07 → 0 **MISS** | 16.78; 11.75 → 14 **MISS** | VERIFIED_PLAYED |
| Maxime Raynaud | 17.50 → DNP | 7.33 → DNP | 2.29 → DNP | 1.06 → DNP | 32.71; 21.26 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Nique Clifford | 9.65 → 0 **MISS** | 3.23 → 1 **MISS** | 2.77 → 2 **MISS** | 0.80 → 0 **MISS** | 22.21; 17.77 → 11 **MISS** | VERIFIED_PLAYED |
| Precious Achiuwa | 13.50 → 6 **MISS** | 6.87 → 5 **MISS** | 1.77 → 1 **MISS** | 0.33 → 0 **HIT** | 28.25; 24.01 → 25 **MISS** | VERIFIED_PLAYED |
| Taylor Hendricks | 7.89 → 6 **MISS** | 3.28 → 1 **MISS** | 0.99 → 0 **MISS** | 1.02 → 2 **MISS** | 19.35; 12.57 → 4 **MISS** | VERIFIED_PLAYED |
| Ty Jerome | 20.47 → DNP | 3.77 → DNP | 4.96 → DNP | 2.08 → DNP | 29.47; 19.16 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Cleveland Cavaliers at Milwaukee Bucks — 2026-11-01T00:00 UTC

Original player rows: 15; verified played: 12; DNP: 3; unverified: 0. Final away–home: 136–111.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| AJ Green | 10.79 → 0 **MISS** | 3.05 → 3 **HIT** | 1.56 → 2 **HIT** | 2.64 → 0 **MISS** | 23.49; 22.32 → 20 **MISS** | VERIFIED_PLAYED |
| Cormac Ryan | 15.82 → DNP | 3.74 → DNP | 2.30 → DNP | 2.35 → DNP | 29.68; 22.26 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Craig Porter Jr. | 5.57 → 2 **MISS** | 3.38 → 2 **MISS** | 2.06 → 4 **MISS** | 0.51 → 0 **MISS** | 17.12; 13.69 → 16 **MISS** | VERIFIED_PLAYED |
| Donovan Mitchell | 24.72 → 15 **MISS** | 5.56 → 4 **MISS** | 4.30 → 3 **MISS** | 2.11 → 2 **HIT** | 34.79; 27.83 → 24 **MISS** | VERIFIED_PLAYED |
| Evan Mobley | 16.86 → 27 **MISS** | 8.76 → 5 **MISS** | 3.23 → 3 **HIT** | 0.95 → 3 **MISS** | 32.21; 27.38 → 25 **MISS** | VERIFIED_PLAYED |
| James Harden | 17.04 → 13 **MISS** | 4.29 → 6 **MISS** | 5.92 → 7 **MISS** | 2.28 → 3 **MISS** | 33.42; 28.40 → 26 **MISS** | VERIFIED_PLAYED |
| Jarrett Allen | 13.84 → 25 **MISS** | 6.86 → 11 **MISS** | 1.29 → 4 **MISS** | 0.37 → 0 **HIT** | 26.25; 21.00 → 24 **MISS** | VERIFIED_PLAYED |
| Jaylon Tyson | 10.64 → DNP | 3.98 → DNP | 2.72 → DNP | 0.94 → DNP | 22.41; 15.69 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jericho Sims | 9.60 → DNP | 6.70 → DNP | 3.39 → DNP | 0.21 → DNP | 27.28; 21.82 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Kyle Kuzma | 11.71 → 14 **MISS** | 5.39 → 3 **MISS** | 3.08 → 3 **HIT** | 1.22 → 2 **MISS** | 26.82; 21.46 → 23 **MISS** | VERIFIED_PLAYED |
| Myles Turner | 9.47 → 10 **MISS** | 4.84 → 7 **MISS** | 1.89 → 2 **HIT** | 1.18 → 1 **HIT** | 26.27; 21.01 → 24 **MISS** | VERIFIED_PLAYED |
| Ousmane Dieng | 9.24 → 0 **MISS** | 4.10 → 1 **MISS** | 3.86 → 2 **MISS** | 0.57 → 0 **MISS** | 24.45; 22.00 → 6 **MISS** | VERIFIED_PLAYED |
| Ryan Rollins | 16.29 → 9 **MISS** | 4.39 → 3 **MISS** | 4.41 → 7 **MISS** | 1.92 → 1 **MISS** | 29.63; 22.22 → 26 **MISS** | VERIFIED_PLAYED |
| Sam Merrill | 10.16 → 6 **MISS** | 3.12 → 4 **MISS** | 2.50 → 3 **MISS** | 1.55 → 1 **MISS** | 26.13; 19.59 → 19 **MISS** | VERIFIED_PLAYED |
| Tyrese Proctor | 7.69 → 9 **MISS** | 2.54 → 4 **MISS** | 2.08 → 5 **MISS** | 0.91 → 3 **MISS** | 15.37; 12.30 → 18 **MISS** | VERIFIED_PLAYED |

## Minnesota Timberwolves at San Antonio Spurs — 2026-11-01T00:00 UTC

Original player rows: 21; verified played: 15; DNP: 6; unverified: 0. Final away–home: 111–121.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Anthony Edwards | 22.46 → DNP | 4.15 → DNP | 3.29 → DNP | 2.66 → DNP | 31.85; 23.89 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Ayo Dosunmu | 12.63 → 27 **MISS** | 4.27 → 9 **MISS** | 3.64 → 3 **MISS** | 1.10 → 2 **MISS** | 26.62; 22.63 → 38 **MISS** | VERIFIED_PLAYED |
| Bones Hyland | 5.88 → 6 **HIT** | 1.91 → 1 **MISS** | 1.58 → 3 **MISS** | 1.07 → 0 **MISS** | 14.29; 12.14 → 14 **HIT** | VERIFIED_PLAYED |
| Carter Bryant | 4.67 → 6 **MISS** | 1.88 → 0 **MISS** | 1.33 → 0 **MISS** | 0.53 → 2 **MISS** | 13.72; 13.03 → 11 **MISS** | VERIFIED_PLAYED |
| De'Aaron Fox | 15.52 → 22 **MISS** | 4.28 → 8 **MISS** | 5.64 → 7 **MISS** | 1.45 → 0 **MISS** | 30.27; 28.75 → 35 **MISS** | VERIFIED_PLAYED |
| Devin Vassell | 11.67 → 9 **MISS** | 4.47 → 5 **MISS** | 3.17 → 2 **MISS** | 1.77 → 0 **MISS** | 31.00; 29.45 → 34 **MISS** | VERIFIED_PLAYED |
| Donte DiVincenzo | 10.33 → DNP | 2.59 → DNP | 2.25 → DNP | 2.22 → DNP | 25.08; 18.81 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Dylan Harper | 14.86 → 25 **MISS** | 4.44 → 7 **MISS** | 3.48 → 6 **MISS** | 0.98 → 2 **MISS** | 28.74; 27.30 → 39 **MISS** | VERIFIED_PLAYED |
| Harrison Barnes | 4.75 → DNP | 1.15 → DNP | 0.77 → DNP | 0.59 → DNP | 13.50; 12.83 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jaden McDaniels | 15.51 → 19 **MISS** | 5.43 → 3 **MISS** | 2.65 → 3 **HIT** | 1.31 → 2 **MISS** | 32.32; 24.24 → 39 **MISS** | VERIFIED_PLAYED |
| Jaylen Clark | 4.20 → 10 **MISS** | 1.69 → 2 **HIT** | 1.03 → 1 **HIT** | 0.49 → 2 **MISS** | 11.81; 10.04 → 20 **MISS** | VERIFIED_PLAYED |
| Joan Beringer | 8.01 → 12 **MISS** | 4.58 → 6 **MISS** | 0.93 → 2 **MISS** | 0.20 → 0 **HIT** | 16.18; 14.56 → 34 **MISS** | VERIFIED_PLAYED |
| Jordan McLaughlin | 2.03 → DNP | 0.87 → DNP | 0.71 → DNP | 0.21 → DNP | 6.11; 4.58 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Julian Champagnie | 10.83 → 12 **MISS** | 4.00 → 3 **MISS** | 1.96 → 1 **MISS** | 2.15 → 3 **MISS** | 25.69; 24.40 → 27 **MISS** | VERIFIED_PLAYED |
| Keldon Johnson | 11.14 → 2 **MISS** | 4.51 → 6 **MISS** | 1.37 → 0 **MISS** | 0.71 → 0 **MISS** | 22.41; 21.29 → 24 **MISS** | VERIFIED_PLAYED |
| Luke Kornet | 4.72 → 2 **MISS** | 3.36 → 8 **MISS** | 1.24 → 0 **MISS** | 0.16 → 0 **HIT** | 16.44; 14.79 → 14 **MISS** | VERIFIED_PLAYED |
| Rudy Gobert | 9.83 → DNP | 11.19 → DNP | 1.67 → DNP | 0.22 → DNP | 31.82; 25.46 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Stephon Castle | 15.75 → 0 **MISS** | 6.04 → 5 **MISS** | 5.96 → 4 **MISS** | 2.08 → 0 **MISS** | 29.66; 25.21 → 22 **MISS** | VERIFIED_PLAYED |
| Terrence Shannon Jr. | 12.70 → 2 **MISS** | 2.89 → 3 **HIT** | 2.34 → 4 **MISS** | 1.49 → 0 **MISS** | 22.46; 21.34 → 18 **MISS** | VERIFIED_PLAYED |
| Victor Wembanyama | 23.16 → 43 **MISS** | 10.52 → 7 **MISS** | 3.14 → 4 **MISS** | 1.18 → 3 **MISS** | 29.38; 23.51 → 34 **MISS** | VERIFIED_PLAYED |
| Zyon Pullin | 3.50 → DNP | 1.06 → DNP | 0.94 → DNP | 0.22 → DNP | 8.19; 5.32 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |

## Oklahoma City Thunder at Houston Rockets — 2026-11-01T00:30 UTC

Original player rows: 21; verified played: 15; DNP: 6; unverified: 0. Final away–home: 98–119.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ajay Mitchell | 11.50 → 6 **MISS** | 2.95 → 3 **HIT** | 3.18 → 5 **MISS** | 0.65 → 0 **MISS** | 23.97; 20.37 → 26 **MISS** | VERIFIED_PLAYED |
| Alex Caruso | 6.91 → DNP | 3.38 → DNP | 2.23 → DNP | 1.05 → DNP | 17.64; 14.11 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Alperen Sengun | 20.20 → 16 **MISS** | 7.82 → 9 **MISS** | 5.93 → 9 **MISS** | 1.17 → 0 **MISS** | 32.70; 29.43 → 33 **HIT** | VERIFIED_PLAYED |
| Amen Thompson | 18.96 → 8 **MISS** | 7.42 → 3 **MISS** | 4.73 → 1 **MISS** | 0.40 → 0 **HIT** | 36.13; 32.52 → 28 **MISS** | VERIFIED_PLAYED |
| Brooks Barnhizer | 3.80 → 5 **MISS** | 2.01 → 2 **HIT** | 0.87 → 0 **MISS** | 0.31 → 0 **HIT** | 11.71; 9.36 → 6 **MISS** | VERIFIED_PLAYED |
| Cason Wallace | 7.29 → DNP | 2.59 → DNP | 1.59 → DNP | 1.10 → DNP | 19.86; 15.89 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Chet Holmgren | 14.48 → DNP | 7.95 → DNP | 1.81 → DNP | 1.17 → DNP | 28.16; 22.53 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Clint Capela | 4.45 → 0 **MISS** | 3.16 → 4 **MISS** | 0.83 → 2 **MISS** | 0.21 → 0 **HIT** | 11.09; 9.98 → 10 **MISS** | VERIFIED_PLAYED |
| Isaiah Crawford | 2.12 → 8 **MISS** | 0.80 → 1 **HIT** | 0.40 → 0 **HIT** | 0.18 → 2 **MISS** | 5.06; 3.29 → 19 **MISS** | VERIFIED_PLAYED |
| Isaiah Hartenstein | 8.43 → 10 **MISS** | 7.03 → 7 **HIT** | 2.19 → 0 **MISS** | 0.20 → 0 **HIT** | 22.06; 18.75 → 25 **MISS** | VERIFIED_PLAYED |
| Jabari Smith Jr. | 16.79 → 30 **MISS** | 6.20 → 9 **MISS** | 2.35 → 5 **MISS** | 2.37 → 6 **MISS** | 35.90; 32.31 → 33 **MISS** | VERIFIED_PLAYED |
| Jae'Sean Tate | 2.98 → 0 **MISS** | 1.61 → 3 **MISS** | 0.66 → 1 **HIT** | 0.18 → 0 **HIT** | 8.20; 6.97 → 6 **MISS** | VERIFIED_PLAYED |
| Jalen Williams | 14.23 → DNP | 4.53 → DNP | 4.34 → DNP | 0.72 → DNP | 29.49; 22.12 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Jared McCain | 9.83 → 10 **HIT** | 2.41 → 4 **MISS** | 1.76 → 2 **HIT** | 1.44 → 0 **MISS** | 21.73; 20.64 → 28 **MISS** | VERIFIED_PLAYED |
| Jaylin Williams | 4.94 → 3 **MISS** | 3.83 → 4 **HIT** | 1.57 → 1 **MISS** | 0.81 → 0 **MISS** | 15.67; 13.32 → 26 **MISS** | VERIFIED_PLAYED |
| Kenrich Williams | 5.46 → 11 **MISS** | 3.27 → 7 **MISS** | 1.43 → 3 **MISS** | 0.68 → 3 **MISS** | 14.68; 13.94 → 21 **MISS** | VERIFIED_PLAYED |
| Kevin Durant | 22.92 → 14 **MISS** | 6.00 → 3 **MISS** | 4.73 → 4 **MISS** | 1.88 → 0 **MISS** | 35.84; 32.25 → 27 **MISS** | VERIFIED_PLAYED |
| Nikola Topic | 7.84 → DNP | 2.69 → DNP | 4.24 → DNP | 0.70 → DNP | 21.60; 15.12 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Reed Sheppard | 11.75 → DNP | 2.92 → DNP | 3.16 → DNP | 2.32 → DNP | 23.21; 20.89 → 0 **DNP** | VERIFIED_DID_NOT_PLAY |
| Shai Gilgeous-Alexander | 24.12 → 26 **MISS** | 3.84 → 4 **HIT** | 4.95 → 3 **MISS** | 1.62 → 3 **MISS** | 33.11; 28.14 → 31 **MISS** | VERIFIED_PLAYED |
| Tari Eason | 10.90 → 8 **MISS** | 4.66 → 3 **MISS** | 1.32 → 2 **MISS** | 0.72 → 2 **MISS** | 23.89; 22.70 → 19 **MISS** | VERIFIED_PLAYED |

## Boston Celtics at Orlando Magic — 2026-11-01T20:30 UTC

Original player rows: 23; verified played: 0; DNP: 0; unverified: 23. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alex Morales | 1.87 → UNVERIFIED | 0.75 → UNVERIFIED | 0.48 → UNVERIFIED | 0.11 → UNVERIFIED | 5.06; 3.54 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Anthony Black | 9.60 → UNVERIFIED | 2.96 → UNVERIFIED | 2.01 → UNVERIFIED | 1.05 → UNVERIFIED | 20.13; 15.89 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Baylor Scheierman | 9.51 → UNVERIFIED | 3.65 → UNVERIFIED | 2.21 → UNVERIFIED | 1.72 → UNVERIFIED | 23.78; 21.40 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Colin Castleton | 1.93 → UNVERIFIED | 0.91 → UNVERIFIED | 0.39 → UNVERIFIED | 0.10 → UNVERIFIED | 4.75; 3.32 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Derrick White | 10.71 → UNVERIFIED | 3.66 → UNVERIFIED | 4.23 → UNVERIFIED | 1.49 → UNVERIFIED | 29.54; 25.11 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Desmond Bane | 14.56 → UNVERIFIED | 4.11 → UNVERIFIED | 2.64 → UNVERIFIED | 1.83 → UNVERIFIED | 29.70; 28.21 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Franz Wagner | 17.28 → UNVERIFIED | 5.08 → UNVERIFIED | 3.76 → UNVERIFIED | 0.94 → UNVERIFIED | 29.69; 26.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Goga Bitadze | 6.15 → UNVERIFIED | 4.08 → UNVERIFIED | 1.11 → UNVERIFIED | 0.16 → UNVERIFIED | 14.08; 12.67 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Hugo Gonzalez | 4.46 → UNVERIFIED | 2.46 → UNVERIFIED | 0.78 → UNVERIFIED | 0.53 → UNVERIFIED | 12.68; 9.51 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Suggs | 12.42 → UNVERIFIED | 4.46 → UNVERIFIED | 5.25 → UNVERIFIED | 1.96 → UNVERIFIED | 31.36; 28.22 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jamal Cain | 5.86 → UNVERIFIED | 2.30 → UNVERIFIED | 0.86 → UNVERIFIED | 0.53 → UNVERIFIED | 15.83; 15.04 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jase Richardson | 5.22 → UNVERIFIED | 1.53 → UNVERIFIED | 1.26 → UNVERIFIED | 0.57 → UNVERIFIED | 12.57; 10.69 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jayson Tatum | 22.28 → UNVERIFIED | 8.18 → UNVERIFIED | 6.46 → UNVERIFIED | 2.10 → UNVERIFIED | 36.53; 29.22 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jevon Carter | 5.66 → UNVERIFIED | 1.60 → UNVERIFIED | 1.67 → UNVERIFIED | 0.89 → UNVERIFIED | 17.69; 15.04 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan Walsh | 7.24 → UNVERIFIED | 4.09 → UNVERIFIED | 1.63 → UNVERIFIED | 0.88 → UNVERIFIED | 22.08; 19.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Luka Garza | 8.64 → UNVERIFIED | 4.05 → UNVERIFIED | 1.23 → UNVERIFIED | 0.68 → UNVERIFIED | 17.43; 13.07 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Neemias Queta | 8.33 → UNVERIFIED | 5.32 → UNVERIFIED | 1.91 → UNVERIFIED | 0.24 → UNVERIFIED | 20.21; 17.18 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Paolo Banchero | 18.42 → UNVERIFIED | 7.32 → UNVERIFIED | 5.76 → UNVERIFIED | 0.84 → UNVERIFIED | 32.64; 27.74 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Payton Pritchard | 16.82 → UNVERIFIED | 3.28 → UNVERIFIED | 4.11 → UNVERIFIED | 2.66 → UNVERIFIED | 28.54; 24.26 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ron Harper Jr. | 5.38 → UNVERIFIED | 1.79 → UNVERIFIED | 1.05 → UNVERIFIED | 0.69 → UNVERIFIED | 11.89; 8.33 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Sam Hauser | 10.67 → UNVERIFIED | 3.60 → UNVERIFIED | 1.66 → UNVERIFIED | 2.33 → UNVERIFIED | 23.94; 20.35 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tristan da Silva | 11.17 → UNVERIFIED | 3.35 → UNVERIFIED | 2.19 → UNVERIFIED | 1.63 → UNVERIFIED | 26.21; 24.90 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Wendell Carter Jr. | 12.41 → UNVERIFIED | 7.03 → UNVERIFIED | 1.76 → UNVERIFIED | 0.75 → UNVERIFIED | 29.24; 27.78 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Brooklyn Nets at Indiana Pacers — 2026-11-01T22:00 UTC

Original player rows: 20; verified played: 0; DNP: 0; unverified: 20. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Nesmith | 13.01 → UNVERIFIED | 2.86 → UNVERIFIED | 1.50 → UNVERIFIED | 1.95 → UNVERIFIED | 24.94; 16.21 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Andrew Nembhard | 15.33 → UNVERIFIED | 3.09 → UNVERIFIED | 7.69 → UNVERIFIED | 1.45 → UNVERIFIED | 33.21; 21.59 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ben Saraf | 12.48 → UNVERIFIED | 3.74 → UNVERIFIED | 3.32 → UNVERIFIED | 0.62 → UNVERIFIED | 27.33; 20.50 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ben Sheppard | 7.42 → UNVERIFIED | 2.64 → UNVERIFIED | 1.57 → UNVERIFIED | 0.95 → UNVERIFIED | 20.10; 10.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Chaney Johnson | 8.84 → UNVERIFIED | 4.26 → UNVERIFIED | 1.80 → UNVERIFIED | 0.79 → UNVERIFIED | 22.20; 18.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Danny Wolf | 7.53 → UNVERIFIED | 3.45 → UNVERIFIED | 1.78 → UNVERIFIED | 0.93 → UNVERIFIED | 19.60; 9.80 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Drake Powell | 7.86 → UNVERIFIED | 2.54 → UNVERIFIED | 1.63 → UNVERIFIED | 0.72 → UNVERIFIED | 25.09; 18.82 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ivica Zubac | 10.02 → UNVERIFIED | 5.79 → UNVERIFIED | 1.83 → UNVERIFIED | 0.33 → UNVERIFIED | 22.80; 13.68 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Slawson | 4.57 → UNVERIFIED | 2.57 → UNVERIFIED | 1.52 → UNVERIFIED | 0.42 → UNVERIFIED | 14.97; 13.48 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jarace Walker | 8.40 → UNVERIFIED | 4.56 → UNVERIFIED | 2.06 → UNVERIFIED | 1.15 → UNVERIFIED | 21.54; 18.31 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jay Huff | 7.96 → UNVERIFIED | 3.76 → UNVERIFIED | 1.88 → UNVERIFIED | 0.96 → UNVERIFIED | 18.61; 16.75 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Josh Minott | 10.31 → UNVERIFIED | 3.07 → UNVERIFIED | 1.19 → UNVERIFIED | 1.41 → UNVERIFIED | 19.42; 12.62 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kelly Oubre Jr. | 9.22 → UNVERIFIED | 2.95 → UNVERIFIED | 1.99 → UNVERIFIED | 0.74 → UNVERIFIED | 24.20; 21.18 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kobe Brown | 9.41 → UNVERIFIED | 4.06 → UNVERIFIED | 2.48 → UNVERIFIED | 1.35 → UNVERIFIED | 23.93; 16.75 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Larry Nance Jr. | 4.41 → UNVERIFIED | 2.31 → UNVERIFIED | 0.94 → UNVERIFIED | 0.39 → UNVERIFIED | 14.00; 12.25 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Noah Clowney | 7.42 → UNVERIFIED | 3.50 → UNVERIFIED | 1.19 → UNVERIFIED | 0.74 → UNVERIFIED | 20.13; 14.09 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Nolan Traore | 8.70 → UNVERIFIED | 2.22 → UNVERIFIED | 2.28 → UNVERIFIED | 0.83 → UNVERIFIED | 17.54; 14.91 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Obi Toppin | 13.40 → UNVERIFIED | 4.66 → UNVERIFIED | 1.85 → UNVERIFIED | 1.72 → UNVERIFIED | 22.04; 20.94 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Pascal Siakam | 21.34 → UNVERIFIED | 6.88 → UNVERIFIED | 3.44 → UNVERIFIED | 1.34 → UNVERIFIED | 31.82; 22.27 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Quenton Jackson | 7.39 → UNVERIFIED | 2.33 → UNVERIFIED | 3.07 → UNVERIFIED | 0.44 → UNVERIFIED | 18.72; 17.78 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## LA Clippers at Golden State Warriors — 2026-11-02T01:30 UTC

Original player rows: 22; verified played: 0; DNP: 0; unverified: 22. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Al Horford | 6.27 → UNVERIFIED | 3.18 → UNVERIFIED | 1.49 → UNVERIFIED | 0.81 → UNVERIFIED | 18.44; 15.37 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brandin Podziemski | 16.57 → UNVERIFIED | 4.44 → UNVERIFIED | 3.37 → UNVERIFIED | 1.84 → UNVERIFIED | 30.25; 24.20 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brandon Williams | 8.14 → UNVERIFIED | 2.59 → UNVERIFIED | 1.90 → UNVERIFIED | 0.67 → UNVERIFIED | 16.00; 14.00 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brook Lopez | 11.06 → UNVERIFIED | 5.03 → UNVERIFIED | 1.68 → UNVERIFIED | 1.26 → UNVERIFIED | 23.39; 21.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Cam Christie | 1.90 → UNVERIFIED | 0.72 → UNVERIFIED | 0.41 → UNVERIFIED | 0.10 → UNVERIFIED | 5.79; 4.34 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Charles Bassey | 5.23 → UNVERIFIED | 2.55 → UNVERIFIED | 0.85 → UNVERIFIED | 0.18 → UNVERIFIED | 11.24; 8.99 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Darius Garland | 18.08 → UNVERIFIED | 2.42 → UNVERIFIED | 5.31 → UNVERIFIED | 2.17 → UNVERIFIED | 31.71; 26.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| De'Anthony Melton | 7.87 → UNVERIFIED | 3.34 → UNVERIFIED | 2.10 → UNVERIFIED | 1.14 → UNVERIFIED | 20.87; 18.78 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Derrick Jones Jr. | 9.68 → UNVERIFIED | 4.64 → UNVERIFIED | 1.73 → UNVERIFIED | 1.35 → UNVERIFIED | 27.47; 24.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Draymond Green | 6.91 → UNVERIFIED | 4.77 → UNVERIFIED | 5.57 → UNVERIFIED | 0.92 → UNVERIFIED | 27.61; 22.09 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Gary Payton II | 6.67 → UNVERIFIED | 2.40 → UNVERIFIED | 0.83 → UNVERIFIED | 0.34 → UNVERIFIED | 15.09; 13.58 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Georges Niang | 6.96 → UNVERIFIED | 2.81 → UNVERIFIED | 1.50 → UNVERIFIED | 0.66 → UNVERIFIED | 19.40; 16.98 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Gui Santos | 11.01 → UNVERIFIED | 4.12 → UNVERIFIED | 2.14 → UNVERIFIED | 1.00 → UNVERIFIED | 24.27; 19.42 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Isaiah Jackson | 8.52 → UNVERIFIED | 4.61 → UNVERIFIED | 1.75 → UNVERIFIED | 0.22 → UNVERIFIED | 20.54; 13.35 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan Miller | 11.07 → UNVERIFIED | 3.34 → UNVERIFIED | 2.59 → UNVERIFIED | 0.68 → UNVERIFIED | 25.78; 18.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kobe Sanders | 8.19 → UNVERIFIED | 2.55 → UNVERIFIED | 1.89 → UNVERIFIED | 1.00 → UNVERIFIED | 20.06; 18.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kris Dunn | 7.78 → UNVERIFIED | 3.73 → UNVERIFIED | 3.88 → UNVERIFIED | 0.85 → UNVERIFIED | 28.79; 25.91 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| LJ Cryer | 6.87 → UNVERIFIED | 1.41 → UNVERIFIED | 1.40 → UNVERIFIED | 1.40 → UNVERIFIED | 14.35; 9.33 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Malevy Leons | 3.56 → UNVERIFIED | 1.34 → UNVERIFIED | 0.78 → UNVERIFIED | 0.22 → UNVERIFIED | 9.83; 7.37 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Stephen Curry | 20.58 → UNVERIFIED | 3.97 → UNVERIFIED | 3.23 → UNVERIFIED | 2.54 → UNVERIFIED | 27.95; 22.36 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Will Richard | 4.74 → UNVERIFIED | 2.00 → UNVERIFIED | 0.96 → UNVERIFIED | 0.50 → UNVERIFIED | 16.37; 13.91 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Yaxel Lendeborg | 18.64 → UNVERIFIED | 7.40 → UNVERIFIED | 3.59 → UNVERIFIED | 1.68 → UNVERIFIED | 33.60; 29.40 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Toronto Raptors at Los Angeles Lakers — 2026-11-02T02:00 UTC

Original player rows: 19; verified played: 0; DNP: 0; unverified: 19. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alijah Martin | 2.24 → UNVERIFIED | 0.85 → UNVERIFIED | 0.56 → UNVERIFIED | 0.17 → UNVERIFIED | 5.83; 4.96 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Austin Reaves | 21.28 → UNVERIFIED | 4.10 → UNVERIFIED | 4.87 → UNVERIFIED | 2.05 → UNVERIFIED | 35.32; 24.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Bronny James | 5.93 → UNVERIFIED | 1.50 → UNVERIFIED | 1.42 → UNVERIFIED | 0.78 → UNVERIFIED | 15.84; 11.88 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Collin Murray-Boyles | 8.07 → UNVERIFIED | 4.04 → UNVERIFIED | 1.52 → UNVERIFIED | 0.33 → UNVERIFIED | 17.82; 16.04 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Immanuel Quickley | 12.28 → UNVERIFIED | 3.20 → UNVERIFIED | 4.14 → UNVERIFIED | 1.67 → UNVERIFIED | 26.04; 20.84 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ja'Kobe Walter | 10.81 → UNVERIFIED | 3.59 → UNVERIFIED | 2.17 → UNVERIFIED | 2.04 → UNVERIFIED | 26.18; 24.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jake LaRavia | 6.07 → UNVERIFIED | 4.06 → UNVERIFIED | 1.53 → UNVERIFIED | 0.67 → UNVERIFIED | 23.19; 20.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jakob Poeltl | 7.32 → UNVERIFIED | 3.88 → UNVERIFIED | 1.32 → UNVERIFIED | 0.18 → UNVERIFIED | 20.16; 19.15 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jamal Shead | 6.93 → UNVERIFIED | 1.90 → UNVERIFIED | 3.95 → UNVERIFIED | 0.62 → UNVERIFIED | 21.57; 20.50 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jamison Battle | 4.34 → UNVERIFIED | 1.50 → UNVERIFIED | 0.78 → UNVERIFIED | 0.49 → UNVERIFIED | 10.69; 10.16 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jarred Vanderbilt | 4.88 → UNVERIFIED | 3.77 → UNVERIFIED | 1.72 → UNVERIFIED | 0.35 → UNVERIFIED | 16.71; 12.54 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Luka Doncic | 29.56 → UNVERIFIED | 5.86 → UNVERIFIED | 6.31 → UNVERIFIED | 3.70 → UNVERIFIED | 34.42; 22.37 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Matisse Thybulle | 9.50 → UNVERIFIED | 2.57 → UNVERIFIED | 1.60 → UNVERIFIED | 1.55 → UNVERIFIED | 24.60; 21.52 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Quentin Grimes | 10.36 → UNVERIFIED | 3.75 → UNVERIFIED | 2.63 → UNVERIFIED | 0.67 → UNVERIFIED | 27.00; 23.63 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| RJ Barrett | 19.43 → UNVERIFIED | 5.06 → UNVERIFIED | 3.23 → UNVERIFIED | 1.14 → UNVERIFIED | 30.80; 27.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Sandro Mamukelashvili | 9.82 → UNVERIFIED | 4.16 → UNVERIFIED | 1.99 → UNVERIFIED | 0.84 → UNVERIFIED | 24.20; 21.18 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Scottie Barnes | 15.72 → UNVERIFIED | 6.14 → UNVERIFIED | 5.41 → UNVERIFIED | 0.57 → UNVERIFIED | 30.57; 29.04 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Trayce Jackson-Davis | 3.20 → UNVERIFIED | 1.65 → UNVERIFIED | 0.65 → UNVERIFIED | 0.13 → UNVERIFIED | 7.76; 6.59 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Walker Kessler | 13.50 → UNVERIFIED | 6.53 → UNVERIFIED | 1.77 → UNVERIFIED | 0.38 → UNVERIFIED | 30.40; 26.60 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Oklahoma City Thunder at Cleveland Cavaliers — 2026-11-03T00:00 UTC

Original player rows: 23; verified played: 0; DNP: 0; unverified: 23. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aday Mara | 5.98 → UNVERIFIED | 3.07 → UNVERIFIED | 1.26 → UNVERIFIED | 0.27 → UNVERIFIED | 16.00; 14.00 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ajay Mitchell | 13.62 → UNVERIFIED | 3.20 → UNVERIFIED | 3.31 → UNVERIFIED | 0.84 → UNVERIFIED | 24.94; 21.20 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Alex Caruso | 6.89 → UNVERIFIED | 3.37 → UNVERIFIED | 2.23 → UNVERIFIED | 1.04 → UNVERIFIED | 17.59; 14.07 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Bennett Stirtz | 4.57 → UNVERIFIED | 1.39 → UNVERIFIED | 1.06 → UNVERIFIED | 0.38 → UNVERIFIED | 13.40; 11.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brooks Barnhizer | 2.86 → UNVERIFIED | 1.50 → UNVERIFIED | 0.65 → UNVERIFIED | 0.23 → UNVERIFIED | 9.46; 7.57 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Cason Wallace | 7.26 → UNVERIFIED | 2.58 → UNVERIFIED | 1.58 → UNVERIFIED | 1.10 → UNVERIFIED | 19.78; 14.84 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Chet Holmgren | 14.46 → UNVERIFIED | 7.94 → UNVERIFIED | 1.81 → UNVERIFIED | 1.17 → UNVERIFIED | 28.12; 21.09 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Craig Porter Jr. | 4.31 → UNVERIFIED | 2.72 → UNVERIFIED | 1.56 → UNVERIFIED | 0.40 → UNVERIFIED | 13.83; 11.06 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Donovan Mitchell | 22.05 → UNVERIFIED | 5.27 → UNVERIFIED | 4.47 → UNVERIFIED | 1.96 → UNVERIFIED | 34.00; 27.20 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Evan Mobley | 17.65 → UNVERIFIED | 8.59 → UNVERIFIED | 3.46 → UNVERIFIED | 1.41 → UNVERIFIED | 33.09; 28.13 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Isaiah Hartenstein | 8.62 → UNVERIFIED | 7.55 → UNVERIFIED | 2.24 → UNVERIFIED | 0.20 → UNVERIFIED | 22.98; 19.53 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Williams | 14.23 → UNVERIFIED | 4.53 → UNVERIFIED | 4.34 → UNVERIFIED | 0.72 → UNVERIFIED | 29.49; 20.64 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| James Harden | 17.36 → UNVERIFIED | 4.29 → UNVERIFIED | 5.98 → UNVERIFIED | 2.21 → UNVERIFIED | 34.56; 29.38 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jared McCain | 10.29 → UNVERIFIED | 2.49 → UNVERIFIED | 2.01 → UNVERIFIED | 1.44 → UNVERIFIED | 22.62; 21.49 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jarrett Allen | 13.58 → UNVERIFIED | 7.48 → UNVERIFIED | 1.39 → UNVERIFIED | 0.42 → UNVERIFIED | 27.40; 21.92 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jaylin Williams | 4.76 → UNVERIFIED | 4.04 → UNVERIFIED | 1.65 → UNVERIFIED | 0.76 → UNVERIFIED | 16.56; 14.07 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jaylon Tyson | 8.97 → UNVERIFIED | 3.73 → UNVERIFIED | 2.35 → UNVERIFIED | 0.89 → UNVERIFIED | 20.54; 16.43 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kenrich Williams | 4.97 → UNVERIFIED | 2.86 → UNVERIFIED | 0.99 → UNVERIFIED | 0.63 → UNVERIFIED | 13.26; 12.60 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Mario Hezonja | 7.09 → UNVERIFIED | 3.16 → UNVERIFIED | 1.59 → UNVERIFIED | 0.79 → UNVERIFIED | 17.60; 15.40 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Peyton Watson | 11.80 → UNVERIFIED | 4.35 → UNVERIFIED | 2.52 → UNVERIFIED | 0.70 → UNVERIFIED | 29.60; 25.90 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Sam Merrill | 9.63 → UNVERIFIED | 2.77 → UNVERIFIED | 2.36 → UNVERIFIED | 1.51 → UNVERIFIED | 24.52; 19.62 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Shai Gilgeous-Alexander | 23.62 → UNVERIFIED | 4.25 → UNVERIFIED | 4.27 → UNVERIFIED | 1.48 → UNVERIFIED | 32.60; 27.71 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tyrese Proctor | 6.75 → UNVERIFIED | 2.66 → UNVERIFIED | 1.94 → UNVERIFIED | 0.81 → UNVERIFIED | 14.39; 12.23 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Detroit Pistons at Charlotte Hornets — 2026-11-03T00:30 UTC

Original player rows: 23; verified played: 0; DNP: 0; unverified: 23. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ausar Thompson | 8.89 → UNVERIFIED | 5.63 → UNVERIFIED | 4.25 → UNVERIFIED | 0.20 → UNVERIFIED | 25.99; 23.39 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brandon Miller | 20.74 → UNVERIFIED | 5.01 → UNVERIFIED | 2.31 → UNVERIFIED | 2.45 → UNVERIFIED | 33.12; 31.46 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Cade Cunningham | 17.92 → UNVERIFIED | 5.38 → UNVERIFIED | 6.92 → UNVERIFIED | 1.66 → UNVERIFIED | 33.31; 29.81 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Chaz Lanier | 2.26 → UNVERIFIED | 0.77 → UNVERIFIED | 0.50 → UNVERIFIED | 0.21 → UNVERIFIED | 6.66; 4.99 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Christian Anderson | 3.25 → UNVERIFIED | 1.48 → UNVERIFIED | 1.02 → UNVERIFIED | 0.26 → UNVERIFIED | 10.40; 9.10 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Daniss Jenkins | 11.63 → UNVERIFIED | 3.73 → UNVERIFIED | 4.06 → UNVERIFIED | 1.18 → UNVERIFIED | 24.87; 23.63 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Dennis Schroder | 13.45 → UNVERIFIED | 4.31 → UNVERIFIED | 4.01 → UNVERIFIED | 0.96 → UNVERIFIED | 32.60; 28.52 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Duncan Robinson | 15.21 → UNVERIFIED | 2.54 → UNVERIFIED | 2.37 → UNVERIFIED | 2.95 → UNVERIFIED | 29.50; 26.55 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Grayson Allen | 13.27 → UNVERIFIED | 3.50 → UNVERIFIED | 2.79 → UNVERIFIED | 2.09 → UNVERIFIED | 28.20; 24.68 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Duren | 15.88 → UNVERIFIED | 7.59 → UNVERIFIED | 2.97 → UNVERIFIED | 0.18 → UNVERIFIED | 26.03; 19.52 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Javonte Green | 7.07 → UNVERIFIED | 2.81 → UNVERIFIED | 0.90 → UNVERIFIED | 1.13 → UNVERIFIED | 17.60; 16.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| John Collins | 10.28 → UNVERIFIED | 5.40 → UNVERIFIED | 1.45 → UNVERIFIED | 1.09 → UNVERIFIED | 26.60; 23.27 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kevin Huerter | 7.49 → UNVERIFIED | 3.02 → UNVERIFIED | 2.31 → UNVERIFIED | 1.12 → UNVERIFIED | 20.58; 18.52 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Liam McNeeley | 3.39 → UNVERIFIED | 1.77 → UNVERIFIED | 0.59 → UNVERIFIED | 0.27 → UNVERIFIED | 8.00; 4.80 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Moussa Diabate | 8.79 → UNVERIFIED | 7.76 → UNVERIFIED | 2.28 → UNVERIFIED | 0.21 → UNVERIFIED | 28.74; 25.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Naz Reid | 14.05 → UNVERIFIED | 6.55 → UNVERIFIED | 2.22 → UNVERIFIED | 1.96 → UNVERIFIED | 27.40; 23.98 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Paul Reed | 12.63 → UNVERIFIED | 6.05 → UNVERIFIED | 2.14 → UNVERIFIED | 0.70 → UNVERIFIED | 24.22; 23.01 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ronald Holland II | 5.21 → UNVERIFIED | 2.99 → UNVERIFIED | 1.56 → UNVERIFIED | 0.49 → UNVERIFIED | 15.33; 14.57 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Royce O'Neale | 5.83 → UNVERIFIED | 2.37 → UNVERIFIED | 0.99 → UNVERIFIED | 0.86 → UNVERIFIED | 17.20; 15.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ryan Kalkbrenner | 5.53 → UNVERIFIED | 3.75 → UNVERIFIED | 1.35 → UNVERIFIED | 0.17 → UNVERIFIED | 17.09; 16.23 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Sion James | 6.19 → UNVERIFIED | 3.94 → UNVERIFIED | 2.81 → UNVERIFIED | 0.90 → UNVERIFIED | 26.03; 24.73 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tidjane Salaun | 4.76 → UNVERIFIED | 2.28 → UNVERIFIED | 0.83 → UNVERIFIED | 0.45 → UNVERIFIED | 13.00; 10.71 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tolu Smith | 1.70 → UNVERIFIED | 1.00 → UNVERIFIED | 0.40 → UNVERIFIED | 0.08 → UNVERIFIED | 4.25; 3.40 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Atlanta Hawks at Indiana Pacers — 2026-11-03T00:30 UTC

Original player rows: 24; verified played: 0; DNP: 0; unverified: 24. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Nesmith | 13.01 → UNVERIFIED | 2.86 → UNVERIFIED | 1.50 → UNVERIFIED | 1.95 → UNVERIFIED | 24.94; 16.21 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Aaron Wiggins | 12.98 → UNVERIFIED | 3.88 → UNVERIFIED | 2.19 → UNVERIFIED | 1.99 → UNVERIFIED | 25.62; 22.61 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Andrew Nembhard | 15.33 → UNVERIFIED | 3.09 → UNVERIFIED | 7.69 → UNVERIFIED | 1.45 → UNVERIFIED | 33.21; 21.59 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Asa Newell | 4.81 → UNVERIFIED | 2.18 → UNVERIFIED | 1.05 → UNVERIFIED | 0.41 → UNVERIFIED | 11.70; 7.60 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ben Sheppard | 7.42 → UNVERIFIED | 2.64 → UNVERIFIED | 1.57 → UNVERIFIED | 0.95 → UNVERIFIED | 20.10; 10.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| CJ McCollum | 13.90 → UNVERIFIED | 2.52 → UNVERIFIED | 3.23 → UNVERIFIED | 1.73 → UNVERIFIED | 27.23; 24.51 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Corey Kispert | 6.73 → UNVERIFIED | 1.46 → UNVERIFIED | 0.99 → UNVERIFIED | 1.16 → UNVERIFIED | 12.01; 8.40 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Dyson Daniels | 10.81 → UNVERIFIED | 5.70 → UNVERIFIED | 4.38 → UNVERIFIED | 0.54 → UNVERIFIED | 29.21; 26.29 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ivica Zubac | 10.02 → UNVERIFIED | 5.79 → UNVERIFIED | 1.83 → UNVERIFIED | 0.33 → UNVERIFIED | 22.80; 13.68 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Johnson | 17.67 → UNVERIFIED | 8.79 → UNVERIFIED | 6.55 → UNVERIFIED | 1.19 → UNVERIFIED | 34.23; 30.80 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Slawson | 4.57 → UNVERIFIED | 2.57 → UNVERIFIED | 1.52 → UNVERIFIED | 0.42 → UNVERIFIED | 14.97; 13.48 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jarace Walker | 8.40 → UNVERIFIED | 4.56 → UNVERIFIED | 2.06 → UNVERIFIED | 1.15 → UNVERIFIED | 21.54; 18.31 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jay Huff | 7.96 → UNVERIFIED | 3.76 → UNVERIFIED | 1.88 → UNVERIFIED | 0.96 → UNVERIFIED | 18.61; 16.75 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jock Landale | 7.29 → UNVERIFIED | 4.48 → UNVERIFIED | 2.03 → UNVERIFIED | 0.65 → UNVERIFIED | 18.26; 13.69 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kelly Oubre Jr. | 9.22 → UNVERIFIED | 2.95 → UNVERIFIED | 1.99 → UNVERIFIED | 0.74 → UNVERIFIED | 24.20; 21.18 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kingston Flemings | 7.32 → UNVERIFIED | 2.95 → UNVERIFIED | 3.21 → UNVERIFIED | 0.64 → UNVERIFIED | 20.07; 17.71 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kobe Brown | 9.41 → UNVERIFIED | 4.06 → UNVERIFIED | 2.48 → UNVERIFIED | 1.35 → UNVERIFIED | 23.93; 16.75 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Larry Nance Jr. | 4.41 → UNVERIFIED | 2.31 → UNVERIFIED | 0.94 → UNVERIFIED | 0.39 → UNVERIFIED | 14.00; 12.25 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Luguentz Dort | 8.33 → UNVERIFIED | 3.14 → UNVERIFIED | 1.95 → UNVERIFIED | 0.88 → UNVERIFIED | 22.18; 19.57 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Nickeil Alexander-Walker | 18.76 → UNVERIFIED | 3.47 → UNVERIFIED | 2.72 → UNVERIFIED | 3.05 → UNVERIFIED | 31.15; 28.03 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Obi Toppin | 13.40 → UNVERIFIED | 4.66 → UNVERIFIED | 1.85 → UNVERIFIED | 1.72 → UNVERIFIED | 22.04; 20.94 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Onyeka Okongwu | 12.69 → UNVERIFIED | 6.09 → UNVERIFIED | 2.37 → UNVERIFIED | 1.37 → UNVERIFIED | 28.82; 25.94 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Pascal Siakam | 21.34 → UNVERIFIED | 6.88 → UNVERIFIED | 3.44 → UNVERIFIED | 1.34 → UNVERIFIED | 31.82; 22.27 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Quenton Jackson | 7.39 → UNVERIFIED | 2.33 → UNVERIFIED | 3.07 → UNVERIFIED | 0.44 → UNVERIFIED | 18.72; 17.78 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Brooklyn Nets at New York Knicks — 2026-11-03T00:30 UTC

Original player rows: 19; verified played: 0; DNP: 0; unverified: 19. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ben Saraf | 12.48 → UNVERIFIED | 3.74 → UNVERIFIED | 3.32 → UNVERIFIED | 0.62 → UNVERIFIED | 27.33; 20.50 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Chaney Johnson | 8.84 → UNVERIFIED | 4.26 → UNVERIFIED | 1.80 → UNVERIFIED | 0.79 → UNVERIFIED | 22.20; 18.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Danny Wolf | 7.53 → UNVERIFIED | 3.45 → UNVERIFIED | 1.78 → UNVERIFIED | 0.93 → UNVERIFIED | 19.60; 9.80 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Drake Powell | 7.86 → UNVERIFIED | 2.54 → UNVERIFIED | 1.63 → UNVERIFIED | 0.72 → UNVERIFIED | 25.09; 18.82 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Brunson | 23.33 → UNVERIFIED | 3.12 → UNVERIFIED | 5.69 → UNVERIFIED | 1.70 → UNVERIFIED | 34.32; 29.17 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan Clarkson | 5.95 → UNVERIFIED | 1.93 → UNVERIFIED | 1.12 → UNVERIFIED | 0.30 → UNVERIFIED | 13.35; 11.34 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jose Alvarado | 9.23 → UNVERIFIED | 2.98 → UNVERIFIED | 3.48 → UNVERIFIED | 1.29 → UNVERIFIED | 20.92; 13.60 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Josh Hart | 10.10 → UNVERIFIED | 5.70 → UNVERIFIED | 3.05 → UNVERIFIED | 1.46 → UNVERIFIED | 31.58; 26.84 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Josh Minott | 10.31 → UNVERIFIED | 3.07 → UNVERIFIED | 1.19 → UNVERIFIED | 1.41 → UNVERIFIED | 19.42; 12.62 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Karl-Anthony Towns | 18.14 → UNVERIFIED | 10.59 → UNVERIFIED | 3.53 → UNVERIFIED | 1.27 → UNVERIFIED | 29.52; 23.62 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Landry Shamet | 8.53 → UNVERIFIED | 2.34 → UNVERIFIED | 2.22 → UNVERIFIED | 1.59 → UNVERIFIED | 25.47; 21.65 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Mikal Bridges | 10.39 → UNVERIFIED | 2.77 → UNVERIFIED | 2.15 → UNVERIFIED | 1.26 → UNVERIFIED | 29.83; 25.35 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Miles McBride | 6.03 → UNVERIFIED | 2.10 → UNVERIFIED | 1.27 → UNVERIFIED | 0.97 → UNVERIFIED | 16.38; 13.92 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Mohamed Diawara | 4.34 → UNVERIFIED | 1.57 → UNVERIFIED | 1.38 → UNVERIFIED | 0.37 → UNVERIFIED | 12.36; 8.04 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Noah Clowney | 7.42 → UNVERIFIED | 3.50 → UNVERIFIED | 1.19 → UNVERIFIED | 0.74 → UNVERIFIED | 20.13; 14.09 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Nolan Traore | 8.70 → UNVERIFIED | 2.22 → UNVERIFIED | 2.28 → UNVERIFIED | 0.83 → UNVERIFIED | 17.54; 14.91 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| OG Anunoby | 14.36 → UNVERIFIED | 5.01 → UNVERIFIED | 1.87 → UNVERIFIED | 1.96 → UNVERIFIED | 31.19; 26.51 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Pacome Dadiet | 3.28 → UNVERIFIED | 1.31 → UNVERIFIED | 0.66 → UNVERIFIED | 0.26 → UNVERIFIED | 8.24; 5.36 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tyler Kolek | 5.38 → UNVERIFIED | 1.81 → UNVERIFIED | 3.03 → UNVERIFIED | 0.79 → UNVERIFIED | 13.93; 9.06 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Washington Wizards at Orlando Magic — 2026-11-03T00:30 UTC

Original player rows: 24; verified played: 0; DNP: 0; unverified: 24. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alex Morales | 1.87 → UNVERIFIED | 0.75 → UNVERIFIED | 0.48 → UNVERIFIED | 0.11 → UNVERIFIED | 5.06; 3.54 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Alex Sarr | 10.28 → UNVERIFIED | 4.67 → UNVERIFIED | 2.80 → UNVERIFIED | 0.75 → UNVERIFIED | 24.56; 17.19 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Anthony Black | 9.60 → UNVERIFIED | 2.96 → UNVERIFIED | 2.01 → UNVERIFIED | 1.05 → UNVERIFIED | 20.13; 15.89 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Anthony Davis | 18.13 → UNVERIFIED | 6.91 → UNVERIFIED | 2.65 → UNVERIFIED | 1.09 → UNVERIFIED | 33.40; 29.23 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Anthony Gill | 10.22 → UNVERIFIED | 3.41 → UNVERIFIED | 1.83 → UNVERIFIED | 0.67 → UNVERIFIED | 26.23; 19.67 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Bilal Coulibaly | 11.73 → UNVERIFIED | 3.87 → UNVERIFIED | 1.52 → UNVERIFIED | 0.82 → UNVERIFIED | 25.87; 20.69 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Bub Carrington | 8.52 → UNVERIFIED | 1.71 → UNVERIFIED | 2.70 → UNVERIFIED | 1.57 → UNVERIFIED | 20.43; 19.41 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Colin Castleton | 1.93 → UNVERIFIED | 0.91 → UNVERIFIED | 0.39 → UNVERIFIED | 0.10 → UNVERIFIED | 4.75; 3.32 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Deandre Ayton | 5.68 → UNVERIFIED | 2.88 → UNVERIFIED | 1.01 → UNVERIFIED | 0.25 → UNVERIFIED | 13.80; 12.07 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Desmond Bane | 14.56 → UNVERIFIED | 4.11 → UNVERIFIED | 2.64 → UNVERIFIED | 1.83 → UNVERIFIED | 29.70; 28.21 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Franz Wagner | 17.28 → UNVERIFIED | 5.08 → UNVERIFIED | 3.76 → UNVERIFIED | 0.94 → UNVERIFIED | 29.69; 26.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Goga Bitadze | 6.15 → UNVERIFIED | 4.08 → UNVERIFIED | 1.11 → UNVERIFIED | 0.16 → UNVERIFIED | 14.08; 12.67 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Suggs | 12.42 → UNVERIFIED | 4.46 → UNVERIFIED | 5.25 → UNVERIFIED | 1.96 → UNVERIFIED | 31.36; 28.22 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jamal Cain | 5.86 → UNVERIFIED | 2.30 → UNVERIFIED | 0.86 → UNVERIFIED | 0.53 → UNVERIFIED | 15.83; 15.04 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jase Richardson | 5.22 → UNVERIFIED | 1.53 → UNVERIFIED | 1.26 → UNVERIFIED | 0.57 → UNVERIFIED | 12.57; 10.69 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jevon Carter | 5.66 → UNVERIFIED | 1.60 → UNVERIFIED | 1.67 → UNVERIFIED | 0.89 → UNVERIFIED | 17.69; 15.04 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Justin Champagnie | 9.04 → UNVERIFIED | 5.46 → UNVERIFIED | 1.71 → UNVERIFIED | 0.78 → UNVERIFIED | 21.58; 17.27 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kyshawn George | 14.30 → UNVERIFIED | 4.59 → UNVERIFIED | 3.84 → UNVERIFIED | 0.84 → UNVERIFIED | 31.60; 27.65 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Paolo Banchero | 18.42 → UNVERIFIED | 7.32 → UNVERIFIED | 5.76 → UNVERIFIED | 0.84 → UNVERIFIED | 32.64; 27.74 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Trae Young | 18.02 → UNVERIFIED | 4.02 → UNVERIFIED | 7.55 → UNVERIFIED | 1.61 → UNVERIFIED | 36.20; 31.68 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tre Johnson | 10.16 → UNVERIFIED | 2.82 → UNVERIFIED | 1.81 → UNVERIFIED | 1.15 → UNVERIFIED | 22.57; 14.67 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tristan da Silva | 11.17 → UNVERIFIED | 3.35 → UNVERIFIED | 2.19 → UNVERIFIED | 1.63 → UNVERIFIED | 26.21; 24.90 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Wendell Carter Jr. | 12.41 → UNVERIFIED | 7.03 → UNVERIFIED | 1.76 → UNVERIFIED | 0.75 → UNVERIFIED | 29.24; 27.78 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Will Riley | 8.20 → UNVERIFIED | 2.22 → UNVERIFIED | 1.60 → UNVERIFIED | 0.60 → UNVERIFIED | 17.97; 15.28 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Chicago Bulls at Philadelphia 76ers — 2026-11-03T00:30 UTC

Original player rows: 18; verified played: 0; DNP: 0; unverified: 18. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Adem Bona | 3.65 → UNVERIFIED | 2.71 → UNVERIFIED | 0.77 → UNVERIFIED | 0.14 → UNVERIFIED | 12.65; 11.38 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Anfernee Simons | 8.93 → UNVERIFIED | 2.89 → UNVERIFIED | 1.65 → UNVERIFIED | 1.41 → UNVERIFIED | 23.20; 20.30 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Buddy Hield | 5.29 → UNVERIFIED | 1.89 → UNVERIFIED | 1.35 → UNVERIFIED | 0.60 → UNVERIFIED | 13.40; 11.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Caleb Wilson | 17.81 → UNVERIFIED | 6.19 → UNVERIFIED | 2.57 → UNVERIFIED | 1.34 → UNVERIFIED | 34.60; 30.27 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Isaac Okoro | 6.51 → UNVERIFIED | 1.89 → UNVERIFIED | 1.44 → UNVERIFIED | 0.57 → UNVERIFIED | 18.74; 14.99 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jabari Walker | 2.72 → UNVERIFIED | 1.21 → UNVERIFIED | 0.59 → UNVERIFIED | 0.18 → UNVERIFIED | 6.60; 4.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Smith | 10.91 → UNVERIFIED | 5.61 → UNVERIFIED | 1.84 → UNVERIFIED | 1.28 → UNVERIFIED | 22.62; 15.83 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jaylen Brown | 18.06 → UNVERIFIED | 6.07 → UNVERIFIED | 3.83 → UNVERIFIED | 1.49 → UNVERIFIED | 36.40; 31.85 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Joel Embiid | 22.19 → UNVERIFIED | 8.50 → UNVERIFIED | 3.99 → UNVERIFIED | 1.30 → UNVERIFIED | 35.67; 24.97 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Josh Giddey | 9.49 → UNVERIFIED | 5.66 → UNVERIFIED | 7.39 → UNVERIFIED | 0.86 → UNVERIFIED | 28.29; 19.80 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Justin Edwards | 4.65 → UNVERIFIED | 1.06 → UNVERIFIED | 0.80 → UNVERIFIED | 0.61 → UNVERIFIED | 11.60; 8.70 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kentavious Caldwell-Pope | 8.64 → UNVERIFIED | 3.28 → UNVERIFIED | 1.96 → UNVERIFIED | 1.19 → UNVERIFIED | 26.20; 22.93 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Leonard Miller | 10.25 → UNVERIFIED | 4.57 → UNVERIFIED | 1.28 → UNVERIFIED | 0.96 → UNVERIFIED | 21.97; 20.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Matas Buzelis | 13.91 → UNVERIFIED | 5.26 → UNVERIFIED | 2.17 → UNVERIFIED | 1.35 → UNVERIFIED | 27.26; 20.44 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Norman Powell | 17.15 → UNVERIFIED | 3.48 → UNVERIFIED | 2.19 → UNVERIFIED | 2.03 → UNVERIFIED | 29.80; 26.07 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tre Jones | 10.64 → UNVERIFIED | 2.54 → UNVERIFIED | 2.63 → UNVERIFIED | 0.47 → UNVERIFIED | 18.21; 17.30 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tyrese Maxey | 24.16 → UNVERIFIED | 4.31 → UNVERIFIED | 4.62 → UNVERIFIED | 1.96 → UNVERIFIED | 37.03; 35.17 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| VJ Edgecombe | 12.60 → UNVERIFIED | 6.01 → UNVERIFIED | 4.16 → UNVERIFIED | 1.36 → UNVERIFIED | 32.64; 29.38 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Sacramento Kings at Dallas Mavericks — 2026-11-03T01:00 UTC

Original player rows: 18; verified played: 0; DNP: 0; unverified: 18. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Cooper Flagg | 20.54 → UNVERIFIED | 5.43 → UNVERIFIED | 4.29 → UNVERIFIED | 1.30 → UNVERIFIED | 28.29; 25.46 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Daeqwon Plowden | 7.41 → UNVERIFIED | 2.31 → UNVERIFIED | 1.19 → UNVERIFIED | 1.12 → UNVERIFIED | 20.32; 16.26 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Daniel Gafford | 9.27 → UNVERIFIED | 5.95 → UNVERIFIED | 2.07 → UNVERIFIED | 0.28 → UNVERIFIED | 22.64; 16.98 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Darius Acuff Jr. | 20.10 → UNVERIFIED | 4.15 → UNVERIFIED | 5.28 → UNVERIFIED | 1.61 → UNVERIFIED | 36.40; 31.85 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| De'Andre Hunter | 12.20 → UNVERIFIED | 4.73 → UNVERIFIED | 1.83 → UNVERIFIED | 1.78 → UNVERIFIED | 28.80; 25.20 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Domantas Sabonis | 15.99 → UNVERIFIED | 11.94 → UNVERIFIED | 5.68 → UNVERIFIED | 0.53 → UNVERIFIED | 37.00; 32.38 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Emanuel Sharp | 5.54 → UNVERIFIED | 1.59 → UNVERIFIED | 1.13 → UNVERIFIED | 0.68 → UNVERIFIED | 16.60; 14.53 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Malik Monk | 5.97 → UNVERIFIED | 1.61 → UNVERIFIED | 2.48 → UNVERIFIED | 0.81 → UNVERIFIED | 13.75; 9.63 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Marcus Sasser | 8.70 → UNVERIFIED | 2.41 → UNVERIFIED | 2.25 → UNVERIFIED | 1.17 → UNVERIFIED | 21.60; 18.90 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Max Christie | 10.73 → UNVERIFIED | 3.79 → UNVERIFIED | 2.24 → UNVERIFIED | 1.78 → UNVERIFIED | 27.89; 26.50 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Morez Johnson Jr. | 6.42 → UNVERIFIED | 2.75 → UNVERIFIED | 1.38 → UNVERIFIED | 0.26 → UNVERIFIED | 15.20; 13.30 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Moussa Cisse | 5.27 → UNVERIFIED | 3.75 → UNVERIFIED | 0.63 → UNVERIFIED | 0.17 → UNVERIFIED | 12.39; 9.91 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Naji Marshall | 12.42 → UNVERIFIED | 3.61 → UNVERIFIED | 3.77 → UNVERIFIED | 0.69 → UNVERIFIED | 27.40; 19.18 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Nique Clifford | 7.17 → UNVERIFIED | 2.38 → UNVERIFIED | 2.11 → UNVERIFIED | 0.53 → UNVERIFIED | 16.93; 13.54 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| P.J. Washington | 15.15 → UNVERIFIED | 6.97 → UNVERIFIED | 1.50 → UNVERIFIED | 1.65 → UNVERIFIED | 33.31; 24.98 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Precious Achiuwa | 13.93 → UNVERIFIED | 6.59 → UNVERIFIED | 1.78 → UNVERIFIED | 0.34 → UNVERIFIED | 29.35; 24.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Zaccharie Risacher | 10.20 → UNVERIFIED | 5.27 → UNVERIFIED | 1.98 → UNVERIFIED | 0.93 → UNVERIFIED | 30.00; 26.25 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Zach LaVine | 21.36 → UNVERIFIED | 4.16 → UNVERIFIED | 3.48 → UNVERIFIED | 2.22 → UNVERIFIED | 36.60; 32.02 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## New Orleans Pelicans at Memphis Grizzlies — 2026-11-03T01:00 UTC

Original player rows: 22; verified played: 0; DNP: 0; unverified: 22. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Bennedict Mathurin | 7.16 → UNVERIFIED | 2.54 → UNVERIFIED | 1.74 → UNVERIFIED | 0.61 → UNVERIFIED | 17.20; 15.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Cam Spencer | 7.69 → UNVERIFIED | 2.75 → UNVERIFIED | 3.53 → UNVERIFIED | 1.40 → UNVERIFIED | 18.82; 14.12 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Cameron Boozer | 14.15 → UNVERIFIED | 8.16 → UNVERIFIED | 4.78 → UNVERIFIED | 1.64 → UNVERIFIED | 32.00; 28.00 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Cedric Coward | 14.39 → UNVERIFIED | 5.78 → UNVERIFIED | 2.47 → UNVERIFIED | 1.86 → UNVERIFIED | 27.28; 20.46 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Dejounte Murray | 14.37 → UNVERIFIED | 5.36 → UNVERIFIED | 5.67 → UNVERIFIED | 0.84 → UNVERIFIED | 30.96; 20.12 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Derik Queen | 11.55 → UNVERIFIED | 6.64 → UNVERIFIED | 2.33 → UNVERIFIED | 0.43 → UNVERIFIED | 24.65; 23.42 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| GG Jackson | 8.27 → UNVERIFIED | 3.54 → UNVERIFIED | 1.35 → UNVERIFIED | 0.84 → UNVERIFIED | 17.02; 12.77 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Herbert Jones | 6.68 → UNVERIFIED | 2.38 → UNVERIFIED | 1.40 → UNVERIFIED | 0.69 → UNVERIFIED | 20.27; 16.22 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jaylen Wells | 11.65 → UNVERIFIED | 3.58 → UNVERIFIED | 1.56 → UNVERIFIED | 1.55 → UNVERIFIED | 27.26; 19.08 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jerami Grant | 8.89 → UNVERIFIED | 2.98 → UNVERIFIED | 2.31 → UNVERIFIED | 1.05 → UNVERIFIED | 24.60; 21.52 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jeremiah Fears | 15.33 → UNVERIFIED | 4.15 → UNVERIFIED | 3.81 → UNVERIFIED | 1.31 → UNVERIFIED | 27.15; 25.80 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan Poole | 8.12 → UNVERIFIED | 2.18 → UNVERIFIED | 2.49 → UNVERIFIED | 1.07 → UNVERIFIED | 18.70; 14.03 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Karlo Matkovic | 6.30 → UNVERIFIED | 2.98 → UNVERIFIED | 0.88 → UNVERIFIED | 0.52 → UNVERIFIED | 16.86; 10.96 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Olivier-Maxence Prosper | 11.19 → UNVERIFIED | 3.05 → UNVERIFIED | 1.05 → UNVERIFIED | 1.13 → UNVERIFIED | 17.30; 10.38 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Quinten Post | 6.52 → UNVERIFIED | 2.34 → UNVERIFIED | 1.06 → UNVERIFIED | 0.64 → UNVERIFIED | 15.00; 13.13 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Saddiq Bey | 13.11 → UNVERIFIED | 3.29 → UNVERIFIED | 1.88 → UNVERIFIED | 1.70 → UNVERIFIED | 24.66; 19.73 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Scotty Pippen Jr. | 6.35 → UNVERIFIED | 2.29 → UNVERIFIED | 1.76 → UNVERIFIED | 0.43 → UNVERIFIED | 16.20; 14.18 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Taylor Hendricks | 6.83 → UNVERIFIED | 2.91 → UNVERIFIED | 0.86 → UNVERIFIED | 0.88 → UNVERIFIED | 16.56; 10.77 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Trey Murphy III | 14.73 → UNVERIFIED | 4.87 → UNVERIFIED | 2.72 → UNVERIFIED | 2.04 → UNVERIFIED | 33.26; 24.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ty Jerome | 19.79 → UNVERIFIED | 3.70 → UNVERIFIED | 4.94 → UNVERIFIED | 1.96 → UNVERIFIED | 29.26; 20.48 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Yves Missi | 8.67 → UNVERIFIED | 6.38 → UNVERIFIED | 2.05 → UNVERIFIED | 0.20 → UNVERIFIED | 23.81; 15.48 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Zion Williamson | 18.64 → UNVERIFIED | 4.51 → UNVERIFIED | 2.55 → UNVERIFIED | 0.49 → UNVERIFIED | 31.64; 25.31 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Milwaukee Bucks at Minnesota Timberwolves — 2026-11-03T01:00 UTC

Original player rows: 24; verified played: 0; DNP: 0; unverified: 24. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| AJ Green | 9.45 → UNVERIFIED | 2.52 → UNVERIFIED | 1.51 → UNVERIFIED | 2.38 → UNVERIFIED | 21.48; 20.41 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Anthony Edwards | 22.46 → UNVERIFIED | 4.15 → UNVERIFIED | 3.29 → UNVERIFIED | 2.66 → UNVERIFIED | 31.85; 22.30 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ayo Dosunmu | 13.17 → UNVERIFIED | 4.29 → UNVERIFIED | 3.60 → UNVERIFIED | 1.23 → UNVERIFIED | 27.61; 23.46 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Bones Hyland | 6.01 → UNVERIFIED | 1.88 → UNVERIFIED | 1.54 → UNVERIFIED | 1.07 → UNVERIFIED | 13.06; 11.10 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brayden Burries | 6.55 → UNVERIFIED | 2.78 → UNVERIFIED | 1.36 → UNVERIFIED | 0.56 → UNVERIFIED | 14.80; 12.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Gary Trent Jr. | 9.95 → UNVERIFIED | 1.63 → UNVERIFIED | 1.32 → UNVERIFIED | 1.87 → UNVERIFIED | 19.85; 10.92 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jaden McDaniels | 15.78 → UNVERIFIED | 5.52 → UNVERIFIED | 2.80 → UNVERIFIED | 1.34 → UNVERIFIED | 32.41; 25.92 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jaime Jaquez Jr. | 14.86 → UNVERIFIED | 5.84 → UNVERIFIED | 2.60 → UNVERIFIED | 1.24 → UNVERIFIED | 29.00; 25.38 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jaylen Clark | 3.90 → UNVERIFIED | 1.67 → UNVERIFIED | 1.02 → UNVERIFIED | 0.48 → UNVERIFIED | 11.08; 9.97 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jericho Sims | 7.75 → UNVERIFIED | 5.53 → UNVERIFIED | 2.78 → UNVERIFIED | 0.18 → UNVERIFIED | 22.67; 18.14 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Joan Beringer | 6.95 → UNVERIFIED | 4.50 → UNVERIFIED | 0.90 → UNVERIFIED | 0.17 → UNVERIFIED | 14.90; 14.15 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jonathan Kuminga | 12.57 → UNVERIFIED | 4.84 → UNVERIFIED | 2.88 → UNVERIFIED | 1.49 → UNVERIFIED | 30.20; 26.43 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kasparas Jakucionis | 8.94 → UNVERIFIED | 3.06 → UNVERIFIED | 3.10 → UNVERIFIED | 0.62 → UNVERIFIED | 22.80; 19.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kel'el Ware | 9.29 → UNVERIFIED | 5.22 → UNVERIFIED | 1.12 → UNVERIFIED | 0.56 → UNVERIFIED | 18.80; 16.45 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kyle Kuzma | 11.65 → UNVERIFIED | 5.91 → UNVERIFIED | 2.88 → UNVERIFIED | 1.13 → UNVERIFIED | 26.88; 21.50 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| LaMelo Ball | 11.75 → UNVERIFIED | 2.93 → UNVERIFIED | 4.52 → UNVERIFIED | 1.79 → UNVERIFIED | 25.60; 22.40 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Myles Turner | 8.94 → UNVERIFIED | 4.58 → UNVERIFIED | 1.86 → UNVERIFIED | 1.07 → UNVERIFIED | 25.71; 20.57 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ousmane Dieng | 7.78 → UNVERIFIED | 3.35 → UNVERIFIED | 2.84 → UNVERIFIED | 0.50 → UNVERIFIED | 20.73; 18.65 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Rudy Gobert | 8.95 → UNVERIFIED | 10.08 → UNVERIFIED | 1.52 → UNVERIFIED | 0.21 → UNVERIFIED | 29.98; 23.98 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ryan Rollins | 14.23 → UNVERIFIED | 4.32 → UNVERIFIED | 4.18 → UNVERIFIED | 1.67 → UNVERIFIED | 27.35; 21.88 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Terrence Shannon Jr. | 12.28 → UNVERIFIED | 2.95 → UNVERIFIED | 2.13 → UNVERIFIED | 1.48 → UNVERIFIED | 21.62; 20.54 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Trey Lyles | 5.50 → UNVERIFIED | 2.71 → UNVERIFIED | 1.32 → UNVERIFIED | 0.66 → UNVERIFIED | 15.60; 13.65 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tyler Herro | 18.41 → UNVERIFIED | 4.88 → UNVERIFIED | 3.80 → UNVERIFIED | 2.29 → UNVERIFIED | 30.80; 26.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Zyon Pullin | 3.50 → UNVERIFIED | 1.06 → UNVERIFIED | 0.94 → UNVERIFIED | 0.22 → UNVERIFIED | 8.19; 5.32 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Boston Celtics at Houston Rockets — 2026-11-03T01:30 UTC

Original player rows: 20; verified played: 0; DNP: 0; unverified: 20. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alperen Sengun | 20.19 → UNVERIFIED | 7.82 → UNVERIFIED | 5.93 → UNVERIFIED | 1.17 → UNVERIFIED | 32.69; 27.78 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Amen Thompson | 18.15 → UNVERIFIED | 6.88 → UNVERIFIED | 4.35 → UNVERIFIED | 0.39 → UNVERIFIED | 34.91; 31.42 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Baylor Scheierman | 9.51 → UNVERIFIED | 3.65 → UNVERIFIED | 2.21 → UNVERIFIED | 1.72 → UNVERIFIED | 23.78; 21.40 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Bogdan Bogdanovic | 6.40 → UNVERIFIED | 1.80 → UNVERIFIED | 1.39 → UNVERIFIED | 0.98 → UNVERIFIED | 14.00; 12.25 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Clint Capela | 5.22 → UNVERIFIED | 3.48 → UNVERIFIED | 0.96 → UNVERIFIED | 0.24 → UNVERIFIED | 13.01; 11.71 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Derrick White | 10.71 → UNVERIFIED | 3.66 → UNVERIFIED | 4.23 → UNVERIFIED | 1.49 → UNVERIFIED | 29.54; 25.11 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Hugo Gonzalez | 4.46 → UNVERIFIED | 2.46 → UNVERIFIED | 0.78 → UNVERIFIED | 0.53 → UNVERIFIED | 12.68; 9.51 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Isaiah Crawford | 2.21 → UNVERIFIED | 0.81 → UNVERIFIED | 0.40 → UNVERIFIED | 0.22 → UNVERIFIED | 5.13; 3.59 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jabari Smith Jr. | 16.06 → UNVERIFIED | 5.79 → UNVERIFIED | 2.26 → UNVERIFIED | 2.32 → UNVERIFIED | 34.52; 31.07 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jae'Sean Tate | 2.74 → UNVERIFIED | 1.39 → UNVERIFIED | 0.63 → UNVERIFIED | 0.17 → UNVERIFIED | 7.57; 6.43 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jayson Tatum | 22.28 → UNVERIFIED | 8.18 → UNVERIFIED | 6.46 → UNVERIFIED | 2.10 → UNVERIFIED | 36.53; 29.22 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan Walsh | 7.24 → UNVERIFIED | 4.09 → UNVERIFIED | 1.63 → UNVERIFIED | 0.88 → UNVERIFIED | 22.08; 19.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kevin Durant | 21.70 → UNVERIFIED | 5.84 → UNVERIFIED | 4.31 → UNVERIFIED | 1.98 → UNVERIFIED | 34.85; 31.36 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Luka Garza | 8.64 → UNVERIFIED | 4.05 → UNVERIFIED | 1.23 → UNVERIFIED | 0.68 → UNVERIFIED | 17.43; 13.07 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Neemias Queta | 8.33 → UNVERIFIED | 5.32 → UNVERIFIED | 1.91 → UNVERIFIED | 0.24 → UNVERIFIED | 20.21; 17.18 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Payton Pritchard | 16.82 → UNVERIFIED | 3.28 → UNVERIFIED | 4.11 → UNVERIFIED | 2.66 → UNVERIFIED | 28.54; 24.26 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Reed Sheppard | 11.72 → UNVERIFIED | 2.99 → UNVERIFIED | 3.32 → UNVERIFIED | 2.27 → UNVERIFIED | 23.81; 21.43 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ron Harper Jr. | 5.38 → UNVERIFIED | 1.79 → UNVERIFIED | 1.05 → UNVERIFIED | 0.69 → UNVERIFIED | 11.89; 8.33 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Sam Hauser | 10.67 → UNVERIFIED | 3.60 → UNVERIFIED | 1.66 → UNVERIFIED | 2.33 → UNVERIFIED | 23.94; 20.35 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tari Eason | 10.03 → UNVERIFIED | 4.87 → UNVERIFIED | 1.19 → UNVERIFIED | 0.66 → UNVERIFIED | 24.88; 23.63 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Utah Jazz at San Antonio Spurs — 2026-11-03T01:30 UTC

Original player rows: 18; verified played: 0; DNP: 0; unverified: 18. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Ace Bailey | 14.11 → UNVERIFIED | 5.94 → UNVERIFIED | 2.35 → UNVERIFIED | 1.46 → UNVERIFIED | 30.02; 27.02 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brice Sensabaugh | 10.33 → UNVERIFIED | 2.71 → UNVERIFIED | 1.63 → UNVERIFIED | 1.64 → UNVERIFIED | 17.07; 15.37 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Carter Bryant | 3.57 → UNVERIFIED | 1.36 → UNVERIFIED | 0.95 → UNVERIFIED | 0.46 → UNVERIFIED | 10.77; 10.23 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Darryn Peterson | 12.05 → UNVERIFIED | 4.28 → UNVERIFIED | 2.59 → UNVERIFIED | 1.13 → UNVERIFIED | 28.60; 25.02 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| De'Aaron Fox | 15.42 → UNVERIFIED | 4.20 → UNVERIFIED | 5.52 → UNVERIFIED | 1.37 → UNVERIFIED | 31.13; 29.57 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Devin Vassell | 12.48 → UNVERIFIED | 4.45 → UNVERIFIED | 3.14 → UNVERIFIED | 1.64 → UNVERIFIED | 31.50; 29.92 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Dylan Harper | 15.79 → UNVERIFIED | 4.71 → UNVERIFIED | 4.22 → UNVERIFIED | 1.17 → UNVERIFIED | 31.52; 29.94 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Harrison Barnes | 4.75 → UNVERIFIED | 1.15 → UNVERIFIED | 0.77 → UNVERIFIED | 0.59 → UNVERIFIED | 13.49; 12.14 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Isaiah Collier | 7.54 → UNVERIFIED | 3.47 → UNVERIFIED | 3.71 → UNVERIFIED | 0.26 → UNVERIFIED | 18.66; 13.06 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan McLaughlin | 2.03 → UNVERIFIED | 0.87 → UNVERIFIED | 0.71 → UNVERIFIED | 0.21 → UNVERIFIED | 6.08; 4.26 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Julian Champagnie | 10.65 → UNVERIFIED | 4.07 → UNVERIFIED | 1.83 → UNVERIFIED | 2.18 → UNVERIFIED | 26.69; 25.35 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Keldon Johnson | 10.59 → UNVERIFIED | 4.69 → UNVERIFIED | 1.46 → UNVERIFIED | 0.55 → UNVERIFIED | 22.48; 21.35 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Keyonte George | 19.50 → UNVERIFIED | 4.32 → UNVERIFIED | 5.17 → UNVERIFIED | 2.00 → UNVERIFIED | 32.80; 28.70 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kyle Filipowski | 8.80 → UNVERIFIED | 4.41 → UNVERIFIED | 2.17 → UNVERIFIED | 0.61 → UNVERIFIED | 17.72; 13.29 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Luke Kornet | 4.45 → UNVERIFIED | 3.20 → UNVERIFIED | 1.22 → UNVERIFIED | 0.16 → UNVERIFIED | 15.81; 14.23 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Stephon Castle | 16.14 → UNVERIFIED | 6.04 → UNVERIFIED | 5.97 → UNVERIFIED | 2.11 → UNVERIFIED | 31.08; 26.42 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Svi Mykhailiuk | 6.19 → UNVERIFIED | 2.37 → UNVERIFIED | 1.17 → UNVERIFIED | 0.91 → UNVERIFIED | 16.36; 12.27 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Victor Wembanyama | 24.04 → UNVERIFIED | 10.79 → UNVERIFIED | 3.28 → UNVERIFIED | 1.44 → UNVERIFIED | 31.35; 26.64 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Portland Trail Blazers at Denver Nuggets — 2026-11-03T02:00 UTC

Original player rows: 19; verified played: 0; DNP: 0; unverified: 19. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Aaron Gordon | 12.16 → UNVERIFIED | 5.14 → UNVERIFIED | 2.96 → UNVERIFIED | 1.16 → UNVERIFIED | 29.10; 24.73 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Cameron Johnson | 13.66 → UNVERIFIED | 4.47 → UNVERIFIED | 2.90 → UNVERIFIED | 2.08 → UNVERIFIED | 29.93; 20.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Christian Braun | 12.65 → UNVERIFIED | 4.38 → UNVERIFIED | 2.26 → UNVERIFIED | 1.09 → UNVERIFIED | 33.50; 28.48 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| DaRon Holmes II | 1.26 → UNVERIFIED | 0.53 → UNVERIFIED | 0.28 → UNVERIFIED | 0.13 → UNVERIFIED | 3.00; 2.25 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Deni Avdija | 21.29 → UNVERIFIED | 6.43 → UNVERIFIED | 5.81 → UNVERIFIED | 1.59 → UNVERIFIED | 32.51; 30.89 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Donovan Clingan | 9.80 → UNVERIFIED | 7.76 → UNVERIFIED | 1.74 → UNVERIFIED | 1.06 → UNVERIFIED | 24.83; 23.59 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jamal Murray | 22.89 → UNVERIFIED | 4.98 → UNVERIFIED | 5.74 → UNVERIFIED | 3.78 → UNVERIFIED | 37.96; 32.27 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jayson Kent | 1.98 → UNVERIFIED | 0.81 → UNVERIFIED | 0.38 → UNVERIFIED | 0.15 → UNVERIFIED | 5.25; 3.15 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jrue Holiday | 13.73 → UNVERIFIED | 4.18 → UNVERIFIED | 3.64 → UNVERIFIED | 1.96 → UNVERIFIED | 26.85; 25.50 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Julian Strawther | 10.20 → UNVERIFIED | 2.69 → UNVERIFIED | 1.73 → UNVERIFIED | 1.45 → UNVERIFIED | 20.17; 15.13 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Nikola Jokic | 21.11 → UNVERIFIED | 10.27 → UNVERIFIED | 7.84 → UNVERIFIED | 1.15 → UNVERIFIED | 34.13; 30.71 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Robert Williams III | 7.69 → UNVERIFIED | 6.29 → UNVERIFIED | 1.11 → UNVERIFIED | 0.34 → UNVERIFIED | 18.50; 16.65 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Scoot Henderson | 9.95 → UNVERIFIED | 2.38 → UNVERIFIED | 2.21 → UNVERIFIED | 1.05 → UNVERIFIED | 21.93; 20.84 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Sidy Cissoko | 5.04 → UNVERIFIED | 2.75 → UNVERIFIED | 1.60 → UNVERIFIED | 0.41 → UNVERIFIED | 16.27; 15.46 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Toumani Camara | 14.43 → UNVERIFIED | 3.28 → UNVERIFIED | 1.88 → UNVERIFIED | 2.99 → UNVERIFIED | 28.56; 27.13 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tyus Jones | 3.69 → UNVERIFIED | 1.42 → UNVERIFIED | 1.18 → UNVERIFIED | 0.43 → UNVERIFIED | 11.19; 8.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Vit Krejci | 2.74 → UNVERIFIED | 1.05 → UNVERIFIED | 0.73 → UNVERIFIED | 0.21 → UNVERIFIED | 7.80; 6.83 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Yang Hansen | 2.64 → UNVERIFIED | 1.24 → UNVERIFIED | 0.48 → UNVERIFIED | 0.23 → UNVERIFIED | 6.56; 4.26 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Zeke Nnaji | 3.61 → UNVERIFIED | 1.69 → UNVERIFIED | 0.89 → UNVERIFIED | 0.30 → UNVERIFIED | 10.18; 6.61 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Phoenix Suns at Golden State Warriors — 2026-11-03T03:00 UTC

Original player rows: 24; verified played: 0; DNP: 0; unverified: 24. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Al Horford | 6.27 → UNVERIFIED | 3.18 → UNVERIFIED | 1.49 → UNVERIFIED | 0.81 → UNVERIFIED | 18.44; 15.37 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brandin Podziemski | 16.57 → UNVERIFIED | 4.44 → UNVERIFIED | 3.37 → UNVERIFIED | 1.84 → UNVERIFIED | 30.25; 24.20 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brandon Williams | 8.14 → UNVERIFIED | 2.59 → UNVERIFIED | 1.90 → UNVERIFIED | 0.67 → UNVERIFIED | 16.00; 14.00 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Charles Bassey | 5.23 → UNVERIFIED | 2.55 → UNVERIFIED | 0.85 → UNVERIFIED | 0.18 → UNVERIFIED | 11.24; 8.99 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Collin Gillespie | 7.67 → UNVERIFIED | 3.26 → UNVERIFIED | 3.16 → UNVERIFIED | 1.24 → UNVERIFIED | 23.87; 21.48 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| De'Anthony Melton | 7.87 → UNVERIFIED | 3.34 → UNVERIFIED | 2.10 → UNVERIFIED | 1.14 → UNVERIFIED | 20.87; 18.78 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Devin Booker | 24.68 → UNVERIFIED | 4.19 → UNVERIFIED | 5.78 → UNVERIFIED | 1.56 → UNVERIFIED | 34.49; 29.32 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Dillon Brooks | 14.09 → UNVERIFIED | 3.74 → UNVERIFIED | 2.53 → UNVERIFIED | 1.43 → UNVERIFIED | 29.54; 26.59 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Draymond Green | 6.91 → UNVERIFIED | 4.77 → UNVERIFIED | 5.57 → UNVERIFIED | 0.92 → UNVERIFIED | 27.61; 22.09 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Gary Payton II | 6.67 → UNVERIFIED | 2.40 → UNVERIFIED | 0.83 → UNVERIFIED | 0.34 → UNVERIFIED | 15.09; 13.58 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Georges Niang | 6.96 → UNVERIFIED | 2.81 → UNVERIFIED | 1.50 → UNVERIFIED | 0.66 → UNVERIFIED | 19.40; 16.98 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Gui Santos | 11.01 → UNVERIFIED | 4.12 → UNVERIFIED | 2.14 → UNVERIFIED | 1.00 → UNVERIFIED | 24.27; 19.42 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jalen Green | 13.55 → UNVERIFIED | 3.21 → UNVERIFIED | 2.58 → UNVERIFIED | 1.25 → UNVERIFIED | 24.68; 20.98 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jamaree Bouyea | 5.91 → UNVERIFIED | 1.87 → UNVERIFIED | 2.02 → UNVERIFIED | 0.44 → UNVERIFIED | 14.36; 11.49 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan Goodwin | 8.40 → UNVERIFIED | 3.85 → UNVERIFIED | 1.83 → UNVERIFIED | 1.68 → UNVERIFIED | 20.55; 17.47 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Khaman Maluach | 7.96 → UNVERIFIED | 5.84 → UNVERIFIED | 1.10 → UNVERIFIED | 0.46 → UNVERIFIED | 20.12; 18.11 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| LJ Cryer | 6.87 → UNVERIFIED | 1.41 → UNVERIFIED | 1.40 → UNVERIFIED | 1.40 → UNVERIFIED | 14.35; 9.33 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Malevy Leons | 3.56 → UNVERIFIED | 1.34 → UNVERIFIED | 0.78 → UNVERIFIED | 0.22 → UNVERIFIED | 9.83; 7.37 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Oso Ighodaro | 6.61 → UNVERIFIED | 4.40 → UNVERIFIED | 2.03 → UNVERIFIED | 0.16 → UNVERIFIED | 18.93; 16.09 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Rasheer Fleming | 6.13 → UNVERIFIED | 2.73 → UNVERIFIED | 0.98 → UNVERIFIED | 0.80 → UNVERIFIED | 18.21; 15.48 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ryan Dunn | 6.98 → UNVERIFIED | 4.12 → UNVERIFIED | 1.61 → UNVERIFIED | 0.71 → UNVERIFIED | 19.12; 16.25 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Stephen Curry | 20.58 → UNVERIFIED | 3.97 → UNVERIFIED | 3.23 → UNVERIFIED | 2.54 → UNVERIFIED | 27.95; 22.36 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Will Richard | 4.74 → UNVERIFIED | 2.00 → UNVERIFIED | 0.96 → UNVERIFIED | 0.50 → UNVERIFIED | 16.37; 13.91 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Yaxel Lendeborg | 18.64 → UNVERIFIED | 7.40 → UNVERIFIED | 3.59 → UNVERIFIED | 1.68 → UNVERIFIED | 33.60; 29.40 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Toronto Raptors at LA Clippers — 2026-11-03T03:00 UTC

Original player rows: 18; verified played: 0; DNP: 0; unverified: 18. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Alijah Martin | 2.24 → UNVERIFIED | 0.85 → UNVERIFIED | 0.56 → UNVERIFIED | 0.17 → UNVERIFIED | 5.83; 4.96 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Brook Lopez | 11.06 → UNVERIFIED | 5.03 → UNVERIFIED | 1.68 → UNVERIFIED | 1.26 → UNVERIFIED | 23.39; 21.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Cam Christie | 1.90 → UNVERIFIED | 0.72 → UNVERIFIED | 0.41 → UNVERIFIED | 0.10 → UNVERIFIED | 5.79; 4.34 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Collin Murray-Boyles | 8.07 → UNVERIFIED | 4.04 → UNVERIFIED | 1.52 → UNVERIFIED | 0.33 → UNVERIFIED | 17.82; 16.04 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Darius Garland | 18.08 → UNVERIFIED | 2.42 → UNVERIFIED | 5.31 → UNVERIFIED | 2.17 → UNVERIFIED | 31.71; 26.95 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Derrick Jones Jr. | 9.68 → UNVERIFIED | 4.64 → UNVERIFIED | 1.73 → UNVERIFIED | 1.35 → UNVERIFIED | 27.47; 24.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Immanuel Quickley | 12.28 → UNVERIFIED | 3.20 → UNVERIFIED | 4.14 → UNVERIFIED | 1.67 → UNVERIFIED | 26.04; 20.84 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Isaiah Jackson | 8.52 → UNVERIFIED | 4.61 → UNVERIFIED | 1.75 → UNVERIFIED | 0.22 → UNVERIFIED | 20.54; 13.35 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Ja'Kobe Walter | 10.81 → UNVERIFIED | 3.59 → UNVERIFIED | 2.17 → UNVERIFIED | 2.04 → UNVERIFIED | 26.18; 24.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jakob Poeltl | 7.32 → UNVERIFIED | 3.88 → UNVERIFIED | 1.32 → UNVERIFIED | 0.18 → UNVERIFIED | 20.16; 19.15 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jamal Shead | 6.93 → UNVERIFIED | 1.90 → UNVERIFIED | 3.95 → UNVERIFIED | 0.62 → UNVERIFIED | 21.57; 20.50 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jamison Battle | 4.34 → UNVERIFIED | 1.50 → UNVERIFIED | 0.78 → UNVERIFIED | 0.49 → UNVERIFIED | 10.69; 10.16 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jordan Miller | 11.07 → UNVERIFIED | 3.34 → UNVERIFIED | 2.59 → UNVERIFIED | 0.68 → UNVERIFIED | 25.78; 18.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kobe Sanders | 8.19 → UNVERIFIED | 2.55 → UNVERIFIED | 1.89 → UNVERIFIED | 1.00 → UNVERIFIED | 20.06; 18.05 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Kris Dunn | 7.78 → UNVERIFIED | 3.73 → UNVERIFIED | 3.88 → UNVERIFIED | 0.85 → UNVERIFIED | 28.79; 25.91 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| RJ Barrett | 19.43 → UNVERIFIED | 5.06 → UNVERIFIED | 3.23 → UNVERIFIED | 1.14 → UNVERIFIED | 30.80; 27.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Scottie Barnes | 15.72 → UNVERIFIED | 6.14 → UNVERIFIED | 5.41 → UNVERIFIED | 0.57 → UNVERIFIED | 30.57; 29.04 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Trayce Jackson-Davis | 3.20 → UNVERIFIED | 1.65 → UNVERIFIED | 0.65 → UNVERIFIED | 0.13 → UNVERIFIED | 7.76; 6.59 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |

## Miami Heat at Los Angeles Lakers — 2026-11-03T03:00 UTC

Original player rows: 21; verified played: 0; DNP: 0; unverified: 21. Final away–home: UNVERIFIED.

| Player | Points | Rebounds | Assists | 3PM | Minutes (cond; uncond) | Status |
|---|---:|---:|---:|---:|---:|---|
| Andrew Wiggins | 11.24 → UNVERIFIED | 3.47 → UNVERIFIED | 1.88 → UNVERIFIED | 1.39 → UNVERIFIED | 27.06; 25.71 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Austin Reaves | 21.28 → UNVERIFIED | 4.10 → UNVERIFIED | 4.87 → UNVERIFIED | 2.05 → UNVERIFIED | 35.32; 24.72 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Bam Adebayo | 15.43 → UNVERIFIED | 7.79 → UNVERIFIED | 3.80 → UNVERIFIED | 1.12 → UNVERIFIED | 32.07; 30.46 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Bobby Portis | 9.88 → UNVERIFIED | 5.84 → UNVERIFIED | 1.98 → UNVERIFIED | 1.34 → UNVERIFIED | 24.00; 21.00 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Bronny James | 5.93 → UNVERIFIED | 1.50 → UNVERIFIED | 1.42 → UNVERIFIED | 0.78 → UNVERIFIED | 15.84; 11.88 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Davion Mitchell | 14.65 → UNVERIFIED | 2.38 → UNVERIFIED | 6.18 → UNVERIFIED | 1.59 → UNVERIFIED | 33.27; 29.94 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Dru Smith | 3.60 → UNVERIFIED | 1.19 → UNVERIFIED | 1.17 → UNVERIFIED | 0.35 → UNVERIFIED | 9.99; 6.49 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Giannis Antetokounmpo | 21.01 → UNVERIFIED | 8.34 → UNVERIFIED | 3.84 → UNVERIFIED | 0.72 → UNVERIFIED | 31.60; 27.65 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jake LaRavia | 6.07 → UNVERIFIED | 4.06 → UNVERIFIED | 1.53 → UNVERIFIED | 0.67 → UNVERIFIED | 23.19; 20.87 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Jarred Vanderbilt | 4.88 → UNVERIFIED | 3.77 → UNVERIFIED | 1.72 → UNVERIFIED | 0.35 → UNVERIFIED | 16.71; 12.54 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Klay Thompson | 7.76 → UNVERIFIED | 2.30 → UNVERIFIED | 1.43 → UNVERIFIED | 1.39 → UNVERIFIED | 19.80; 17.32 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Luka Doncic | 29.56 → UNVERIFIED | 5.86 → UNVERIFIED | 6.31 → UNVERIFIED | 3.70 → UNVERIFIED | 34.42; 22.37 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Matisse Thybulle | 9.50 → UNVERIFIED | 2.57 → UNVERIFIED | 1.60 → UNVERIFIED | 1.55 → UNVERIFIED | 24.60; 21.52 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Myron Gardner | 1.95 → UNVERIFIED | 0.82 → UNVERIFIED | 0.50 → UNVERIFIED | 0.16 → UNVERIFIED | 4.75; 3.56 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Nikola Jovic | 4.27 → UNVERIFIED | 2.02 → UNVERIFIED | 1.03 → UNVERIFIED | 0.35 → UNVERIFIED | 12.07; 8.45 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Pelle Larsson | 12.05 → UNVERIFIED | 3.96 → UNVERIFIED | 3.52 → UNVERIFIED | 0.89 → UNVERIFIED | 29.80; 26.82 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Quentin Grimes | 10.36 → UNVERIFIED | 3.75 → UNVERIFIED | 2.63 → UNVERIFIED | 0.67 → UNVERIFIED | 27.00; 23.63 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Sandro Mamukelashvili | 9.82 → UNVERIFIED | 4.16 → UNVERIFIED | 1.99 → UNVERIFIED | 0.84 → UNVERIFIED | 24.20; 21.18 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Simone Fontecchio | 6.03 → UNVERIFIED | 1.78 → UNVERIFIED | 1.12 → UNVERIFIED | 1.04 → UNVERIFIED | 12.06; 7.84 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Tim Hardaway Jr. | 7.35 → UNVERIFIED | 2.64 → UNVERIFIED | 1.33 → UNVERIFIED | 0.84 → UNVERIFIED | 19.60; 17.15 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
| Walker Kessler | 13.50 → UNVERIFIED | 6.53 → UNVERIFIED | 1.77 → UNVERIFIED | 0.38 → UNVERIFIED | 30.40; 26.60 → — **UNVERIFIED** | WAITING_FOR_FINAL_COMPLETE_PLAYER_BOX |
