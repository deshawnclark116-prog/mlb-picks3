# NBA V4 versus V5 — frozen featured-card comparison · November 8, 2026

**Research reconstruction of each model's TOP TEN projections, not confirmed placed wagers or sportsbook bets.**
V4 was a shadow model; its top ten are reconstructed using the same frontend candidate thresholds and sorting logic. V5 selections come from immutable last-pretip archived frontend ranks. Both models' targets use the project's 0.6 rounding policy. Both are matched by `game_id + player_id + stat` against the same verified ESPN postgame player lines. Positive-stat DNP is a miss.
V4's displayed P(reach) is **conditional on playing**, whereas V5's is **including DNP**: compare target hit rates, not the raw model probability labels as though calibrated on the same basis.

## Summary

| Game | V4 top-ten hits | V5 top-ten hits | V4 commit |
|---|---:|---:|---|
| Philadelphia 76ers at Chicago Bulls | 4/10 | 5/10 | `5bdc9edbc2fd` |
| Los Angeles Lakers at Detroit Pistons | 9/10 | 7/10 | `5bdc9edbc2fd` |
| Utah Jazz at Minnesota Timberwolves | 5/10 | 5/10 | `88fae99c049b` |
| Brooklyn Nets at Dallas Mavericks | 6/10 | 7/10 | `88fae99c049b` |
| Boston Celtics at Milwaukee Bucks | 3/10 | 3/10 | `88fae99c049b` |
| New Orleans Pelicans at LA Clippers | 7/10 | 4/10 | `785f8020184e` |
| Miami Heat at Sacramento Kings | 8/10 | 7/10 | `785f8020184e` |
| **All seven** | **42/70 (60.0%)** | **38/70 (54.3%)** | |

## Markets featured

| Stat | V4 hits / selections | V5 hits / selections |
|---|---:|---:|
| PTS | 0/0 | 0/0 |
| REB | 0/0 | 0/0 |
| AST | 0/0 | 0/0 |
| 3PM | 0/0 | 0/0 |
| STL | 0/0 | 0/0 |
| BLK | 0/0 | 0/0 |

**Overlap:** 19/70 identical player-stat selections between cards. All 19 shared selections used the same rounded target; differences arise mainly from which selections each model prioritizes.

**V4 supported only points, rebounds, assists, and threes.** V5 additionally ranked steals and blocks. This is a real output-space difference, not proof that V4 would outperform V5 if both could select exactly the same markets.

## Full game-by-game reconstructed cards

### Philadelphia 76ers at Chicago Bulls (401909945)

V4 generated: 2026-11-08T19:08:29.412969+00:00. V5 last pretip: 2026-11-08T19:08:51.955039+00:00. Shared player-markets: 3.

| Rank | V4 reconstructed pick | V5 archived frontend pick |
|---:|---|---|
| 1 | Caleb Wilson — 2+ AST (0) ❌ | Tyrese Maxey — 1+ STL (0) ❌ |
| 2 | Buddy Hield — 1+ 3PM (DNP) ❌ | Buddy Hield — 1+ 3PM (DNP) ❌ |
| 3 | Anfernee Simons — 2+ 3PM (1) ❌ | VJ Edgecombe — 1+ STL (3) ✅ |
| 4 | Kentavious Caldwell-Pope — 1+ 3PM (2) ✅ | Tyrese Maxey — 2+ 3PM (3) ✅ |
| 5 | Kentavious Caldwell-Pope — 2+ AST (3) ✅ | Tre Jones — 1+ STL (1) ✅ |
| 6 | Caleb Wilson — 2+ 3PM (2) ✅ | Caleb Wilson — 2+ 3PM (2) ✅ |
| 7 | Anfernee Simons — 2+ AST (2) ✅ | Joel Embiid — 1+ 3PM (0) ❌ |
| 8 | VJ Edgecombe — 4+ AST (3) ❌ | Anfernee Simons — 2+ 3PM (1) ❌ |
| 9 | Caleb Wilson — 6+ REB (5) ❌ | Leonard Miller — 1+ 3PM (DNP) ❌ |
| 10 | Jaylen Brown — 5+ AST (4) ❌ | Jaylen Brown — 1+ STL (1) ✅ |

### Los Angeles Lakers at Detroit Pistons (401909946)

V4 generated: 2026-11-08T19:08:29.412969+00:00. V5 last pretip: 2026-11-08T19:08:51.955039+00:00. Shared player-markets: 4.

| Rank | V4 reconstructed pick | V5 archived frontend pick |
|---:|---|---|
| 1 | Sandro Mamukelashvili — 1+ 3PM (1) ✅ | Walker Kessler — 1+ BLK (3) ✅ |
| 2 | Kevin Huerter — 1+ 3PM (4) ✅ | Sandro Mamukelashvili — 1+ 3PM (1) ✅ |
| 3 | Quentin Grimes — 2+ AST (4) ✅ | Jake LaRavia — 1+ STL (0) ❌ |
| 4 | Quentin Grimes — 1+ 3PM (2) ✅ | Cade Cunningham — 1+ STL (2) ✅ |
| 5 | Duncan Robinson — 2+ AST (3) ✅ | Kevin Huerter — 1+ 3PM (4) ✅ |
| 6 | Kevin Huerter — 2+ AST (5) ✅ | Quentin Grimes — 1+ 3PM (2) ✅ |
| 7 | John Collins — 1+ 3PM (1) ✅ | Walker Kessler — 1+ STL (1) ✅ |
| 8 | Daniss Jenkins — 1+ 3PM (8) ✅ | Collin Sexton — 1+ STL (0) ❌ |
| 9 | Jake LaRavia — 1+ 3PM (0) ❌ | Paul Reed — 1+ STL (0) ❌ |
| 10 | Javonte Green — 1+ 3PM (1) ✅ | Daniss Jenkins — 1+ 3PM (8) ✅ |

### Utah Jazz at Minnesota Timberwolves (401909947)

V4 generated: 2026-11-08T23:05:30.304649+00:00. V5 last pretip: 2026-11-08T23:05:48.829114+00:00. Shared player-markets: 0.

| Rank | V4 reconstructed pick | V5 archived frontend pick |
|---:|---|---|
| 1 | Terrence Shannon Jr. — 1+ 3PM (0) ❌ | Ayo Dosunmu — 1+ STL (2) ✅ |
| 2 | Brice Sensabaugh — 1+ 3PM (0) ❌ | Joan Beringer — 1+ BLK (1) ✅ |
| 3 | Darryn Peterson — 1+ 3PM (4) ✅ | Jonathan Kuminga — 1+ STL (0) ❌ |
| 4 | Keyonte George — 3+ REB (5) ✅ | Darryn Peterson — 1+ STL (1) ✅ |
| 5 | Lauri Markkanen — 2+ 3PM (DNP) ❌ | Jaxson Hayes — 1+ BLK (1) ✅ |
| 6 | Terrence Shannon Jr. — 2+ AST (3) ✅ | Isaiah Collier — 1+ STL (0) ❌ |
| 7 | Jaxson Hayes — 5+ REB (6) ✅ | Rudy Gobert — 1+ BLK (0) ❌ |
| 8 | Lauri Markkanen — 6+ REB (DNP) ❌ | Jaylen Clark — 1+ STL (2) ✅ |
| 9 | Keyonte George — 5+ AST (8) ✅ | Bones Hyland — 2+ 3PM (1) ❌ |
| 10 | Jaylen Clark — 1+ 3PM (0) ❌ | Ace Bailey — 1+ BLK (0) ❌ |

### Brooklyn Nets at Dallas Mavericks (401909948)

V4 generated: 2026-11-08T23:05:30.304649+00:00. V5 last pretip: 2026-11-08T23:05:48.829114+00:00. Shared player-markets: 5.

| Rank | V4 reconstructed pick | V5 archived frontend pick |
|---:|---|---|
| 1 | Julius Randle — 1+ 3PM (0) ❌ | Zaccharie Risacher — 1+ STL (0) ❌ |
| 2 | Zaccharie Risacher — 1+ 3PM (1) ✅ | Zaccharie Risacher — 1+ 3PM (1) ✅ |
| 3 | Nolan Traore — 1+ 3PM (2) ✅ | Walter Clayton Jr. — 1+ 3PM (1) ✅ |
| 4 | Marcus Sasser — 1+ 3PM (0) ❌ | Julius Randle — 1+ 3PM (0) ❌ |
| 5 | Moritz Wagner — 3+ REB (3) ✅ | Keon Ellis — 1+ STL (1) ✅ |
| 6 | Keon Ellis — 1+ 3PM (1) ✅ | Marcus Sasser — 1+ 3PM (0) ❌ |
| 7 | Cooper Flagg — 1+ 3PM (3) ✅ | Day'Ron Sharpe — 1+ STL (2) ✅ |
| 8 | Marcus Sasser — 2+ AST (0) ❌ | Keon Ellis — 1+ 3PM (1) ✅ |
| 9 | Chaney Johnson — 4+ REB (0) ❌ | Michael Porter Jr. — 1+ STL (1) ✅ |
| 10 | Zaccharie Risacher — 4+ REB (6) ✅ | Nolan Traore — 1+ 3PM (2) ✅ |

### Boston Celtics at Milwaukee Bucks (401909949)

V4 generated: 2026-11-08T23:05:30.304649+00:00. V5 last pretip: 2026-11-08T23:05:48.829114+00:00. Shared player-markets: 0.

| Rank | V4 reconstructed pick | V5 archived frontend pick |
|---:|---|---|
| 1 | Baylor Scheierman — 1+ 3PM (1) ✅ | Jaime Jaquez Jr. — 1+ 3PM (0) ❌ |
| 2 | Luka Garza — 1+ 3PM (0) ❌ | Kasparas Jakucionis — 1+ 3PM (0) ❌ |
| 3 | AJ Green — 8+ PTS (5) ❌ | Sam Hauser — 2+ 3PM (1) ❌ |
| 4 | Baylor Scheierman — 6+ PTS (7) ✅ | Payton Pritchard — 2+ 3PM (4) ✅ |
| 5 | Jordan Walsh — 1+ 3PM (0) ❌ | Kel'el Ware — 1+ 3PM (0) ❌ |
| 6 | Luka Garza — 4+ REB (5) ✅ | Sam Hauser — 3+ REB (3) ✅ |
| 7 | Luka Garza — 8+ PTS (4) ❌ | Tyler Herro — 4+ REB (1) ❌ |
| 8 | Jordan Walsh — 4+ REB (3) ❌ | Caris LeVert — 2+ AST (DNP) ❌ |
| 9 | Baylor Scheierman — 4+ REB (1) ❌ | Derrick White — 2+ 3PM (1) ❌ |
| 10 | AJ Green — 3+ 3PM (1) ❌ | Derrick White — 1+ STL (2) ✅ |

### New Orleans Pelicans at LA Clippers (401909950)

V4 generated: 2026-11-09T01:43:54.701089+00:00. V5 last pretip: 2026-11-09T01:44:16.168296+00:00. Shared player-markets: 4.

| Rank | V4 reconstructed pick | V5 archived frontend pick |
|---:|---|---|
| 1 | Kobe Sanders — 1+ 3PM (2) ✅ | Dejounte Murray — 1+ STL (0) ❌ |
| 2 | Brook Lopez — 1+ 3PM (1) ✅ | Derrick Jones Jr. — 1+ 3PM (0) ❌ |
| 3 | Jeremiah Fears — 1+ 3PM (3) ✅ | Jeremiah Fears — 1+ 3PM (3) ✅ |
| 4 | Derrick Jones Jr. — 1+ 3PM (0) ❌ | Darius Garland — 1+ STL (1) ✅ |
| 5 | Dejounte Murray — 1+ 3PM (0) ❌ | Dejounte Murray — 1+ 3PM (0) ❌ |
| 6 | Karlo Matkovic — 4+ REB (3) ❌ | Trey Murphy III — 2+ 3PM (4) ✅ |
| 7 | Karlo Matkovic — 1+ 3PM (1) ✅ | Derrick Jones Jr. — 1+ STL (0) ❌ |
| 8 | Jeremiah Fears — 4+ REB (6) ✅ | Derrick Jones Jr. — 1+ BLK (0) ❌ |
| 9 | Kris Dunn — 1+ 3PM (2) ✅ | Kris Dunn — 1+ 3PM (2) ✅ |
| 10 | Jeremiah Fears — 4+ AST (5) ✅ | Kris Dunn — 2+ STL (1) ❌ |

### Miami Heat at Sacramento Kings (401909951)

V4 generated: 2026-11-09T01:43:54.701089+00:00. V5 last pretip: 2026-11-09T01:44:16.168296+00:00. Shared player-markets: 3.

| Rank | V4 reconstructed pick | V5 archived frontend pick |
|---:|---|---|
| 1 | Andrew Wiggins — 2+ AST (1) ❌ | Bam Adebayo — 1+ 3PM (1) ✅ |
| 2 | Bam Adebayo — 3+ AST (4) ✅ | Jonathan Mogbo — 1+ STL (0) ❌ |
| 3 | Pelle Larsson — 3+ AST (3) ✅ | Precious Achiuwa — 1+ STL (0) ❌ |
| 4 | Pelle Larsson — 3+ REB (3) ✅ | Bam Adebayo — 1+ STL (3) ✅ |
| 5 | Klay Thompson — 3+ 3PM (7) ✅ | Pelle Larsson — 3+ REB (3) ✅ |
| 6 | Pelle Larsson — 1+ 3PM (3) ✅ | Precious Achiuwa — 1+ BLK (1) ✅ |
| 7 | Davion Mitchell — 7+ AST (11) ✅ | Bam Adebayo — 3+ AST (4) ✅ |
| 8 | Ryan Conwell — 1+ 3PM (2) ✅ | Pelle Larsson — 1+ 3PM (3) ✅ |
| 9 | Giannis Antetokounmpo — 10+ REB (14) ✅ | Davion Mitchell — 1+ STL (0) ❌ |
| 10 | Andrew Wiggins — 4+ REB (3) ❌ | Giannis Antetokounmpo — 1+ STL (2) ✅ |

## Integrity and limits

- All 140 rows are original model-generated player/stat targets, not postgame-chosen easier lines.
- Results are matched to the frozen V5 original-grade actuals, not a rerun after the games.
- The V4 comparator is its *counterfactual featured card* under the UI ranking rule because V4 was not the live frontend champion.
- V4/V5 market catalogs are different; V4 cannot nominate steals or blocks.
- V4 selection probabilities condition on playing, V5 include DNP. No calibrated probability superiority claim is made.
- The same player can contribute multiple correlated stat selections within a card.
- One slate is diagnostic evidence, not enough to promote V4 or disable V5 markets.
- The V5 core stat means can themselves blend 50% V4, so the models are not independent on every market.
