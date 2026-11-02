# NFL Week 8 — Every original player projection vs. final stat

**Sunday, November 1, 2026 · 12 completed games · 316 published pregame projections · No cherry-picking**

**How to read:** *Model* is the original saved numerical yardage prediction or the probability of the stated binary event. *Actual* comes from the final player box score. For yards, **Δ = actual minus projected**, so `+` means the model underpredicted and `−` means it overpredicted. Touchdown and sack probabilities are not numerical yardage projections.

**Snapshot:** [Original predictions saved before kickoff](https://github.com/deshawnclark116-prog/mlb-picks2/blob/c9661df759c36a017b3268345e338b7d676adfd6/docs/nfl_predictions_2026_w08.json), generated `2026-11-01 02:23:15 UTC` (October 31 at 10:23 p.m. Eastern).

**Actuals:** ESPN final player box scores for November 1, 2026; ESPN team/player names matched to the original pregame team and player. Missing player/market entries are explicitly **Unverified**, not assumed to be zero. A recorded 0.5 sack is a push at a 0.5 threshold and excluded from binary Brier grading. Some verified players without a rushing or receiving category are assigned 0 in that category if the player is listed in the game's box score.

**Totals:** 316 forecasts · 275 verified · 38 unverified · 3 half-sack pushes. Rushing MAE 26.2 yards (57 verified); receiving MAE 21.3 yards (94 verified).

## All games at a glance

| Game | Final | Forecasts | Verified | Unverified | Half-sack pushes | Rush MAE | Rec MAE |
|:--|:--|--:|--:|--:|--:|--:|--:|
| [BAL @ BUF](#bal-buf) | 10–36 | 26 | 24 | 1 | 1 | 9.7 | 25.4 |
| [TEN @ CIN](#ten-cin) | 36–43 | 30 | 26 | 4 | 0 | 17.2 | 40.4 |
| [ARI @ DAL](#ari-dal) | 33–30 | 24 | 23 | 1 | 0 | 40.1 | 16.9 |
| [MIN @ DET](#min-det) | 15–19 | 27 | 25 | 2 | 0 | 43.2 | 18.4 |
| [LV @ NYJ](#lv-nyj) | 38–33 | 31 | 20 | 11 | 0 | 37.5 | 36.1 |
| [CLE @ PIT](#cle-pit) | 6–27 | 29 | 25 | 4 | 0 | 32.7 | 14.5 |
| [ATL @ TB](#atl-tb) | 0–16 | 26 | 20 | 6 | 0 | 48.8 | 34 |
| [IND @ JAX](#ind-jax) | 7–42 | 28 | 26 | 2 | 0 | 20.5 | 18.3 |
| [LAC @ LA](#lac-la) | 9–24 | 28 | 26 | 2 | 0 | 14.5 | 14.8 |
| [KC @ DEN](#kc-den) | 24–28 | 22 | 20 | 2 | 0 | 13.1 | 9.5 |
| [NE @ MIA](#ne-mia) | 24–19 | 24 | 20 | 2 | 2 | 19.4 | 17.6 |
| [PHI @ WAS](#phi-was) | 10–27 | 21 | 20 | 1 | 0 | 20.7 | 19.9 |

---
## Complete player-by-player game breakdown

Every entry below is included, not just the best picks. Original forecast order is preserved within each market. All games are initially expandable for easier browsing on a phone.

### 1. BAL @ BUF — final 10–36

**26 original projections · 24 verified · 1 unverified · 1 pushes.** Rushing MAE 9.7 yards; receiving MAE 25.4 yards.

#### Rushing yards — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| James Cook (BUF) | 78.9 yd | 80 yd | +1.1 yd | Verified |
| Derrick Henry (BAL) | 73.8 yd | 53 yd | -20.8 yd | Verified |
| Rasheen Ali (BAL) | 6.3 yd | 5 yd | -1.3 yd | Verified |
| Justice Hill (BAL) | 5.1 yd | 15 yd | +9.9 yd | Verified |
| Ray Davis (BUF) | 7.8 yd | 30 yd | +22.2 yd | Verified |
| Ty Johnson (BUF) | 6.6 yd | 4 yd | -2.6 yd | Verified |

#### Receiving yards — 9 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Khalil Shakir (BUF) | 41.7 yd | 64 yd | +22.3 yd | Verified |
| Keon Coleman (BUF) | 34.4 yd | 4 yd | -30.4 yd | Verified |
| Zay Flowers (BAL) | 77.2 yd | 0 yd | -77.2 yd | Verified |
| Rashod Bateman (BAL) | 27.2 yd | 22 yd | -5.2 yd | Verified |
| Ja'Kobi Lane (BAL) | 29.1 yd | 13 yd | -16.1 yd | Verified |
| Devontez Walker (BAL) | 9.8 yd | **Unverified** | — | Unverified |
| LaJohntay Wester (BAL) | 3.2 yd | 0 yd | -3.2 yd | Verified |
| Greg Dortch (BUF) | 1.9 yd | 0 yd | -1.9 yd | Verified |
| DJ Moore (BUF) | 35 yd | 82 yd | +47 yd | Verified |

#### Anytime touchdowns — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| James Cook (BUF) | TD 57.1% | **Scored TD** | Event recorded | Verified |
| Derrick Henry (BAL) | TD 49.7% | **Scored TD** | Event recorded | Verified |
| Zay Flowers (BAL) | TD 35.6% | No TD | Event recorded | Verified |
| Khalil Shakir (BUF) | TD 31.9% | No TD | Event recorded | Verified |
| Keon Coleman (BUF) | TD 29.8% | No TD | Event recorded | Verified |
| Dalton Kincaid (BUF) | TD 27.5% | **Scored TD** | Event recorded | Verified |

#### Defensive sacks — 5 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Roquan Smith (BAL) | UNDER 0.5 · 75.7% | 0 sacks | 0 sacks | Verified |
| Bradley Chubb (BUF) | UNDER 0.5 · 60.5% | 0 sacks | 0 sacks | Verified |
| Mike Green (BAL) | UNDER 0.5 · 59.7% | **0.5 sack (push)** | Push | Push |
| Greg Rousseau (BUF) | OVER 0.5 · 58.9% | 1 sacks | 1+ sacks | Verified |
| Trey Hendrickson (BAL) | UNDER 0.5 · 57.3% | 0 sacks | 0 sacks | Verified |

---

### 2. TEN @ CIN — final 36–43

**30 original projections · 26 verified · 4 unverified · 0 pushes.** Rushing MAE 17.2 yards; receiving MAE 40.4 yards.

#### Rushing yards — 7 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Tony Pollard (TEN) | 58.9 yd | 117 yd | +58.1 yd | Verified |
| Tahj Brooks (CIN) | 2.9 yd | 0 yd | -2.9 yd | Verified |
| Chase Brown (CIN) | 58.1 yd | 55 yd | -3.1 yd | Verified |
| Samaje Perine (CIN) | 28.3 yd | 10 yd | -18.3 yd | Verified |
| Michael Carter (TEN) | 16.9 yd | **Unverified** | — | Unverified |
| Julius Chestnut (TEN) | 3.6 yd | 0 yd | -3.6 yd | Verified |
| Kalel Mullings (TEN) | 1.5 yd | **Unverified** | — | Unverified |

#### Receiving yards — 8 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Tee Higgins (CIN) | 66.9 yd | 155 yd | +88.1 yd | Verified |
| Ja'Marr Chase (CIN) | 57.5 yd | 141 yd | +83.5 yd | Verified |
| Wan'Dale Robinson (TEN) | 37.1 yd | 57 yd | +19.9 yd | Verified |
| Dohnte Meyers (CIN) | 19.6 yd | 34 yd | +14.4 yd | Verified |
| Mitchell Tinsley (CIN) | 15.7 yd | **Unverified** | — | Unverified |
| Elic Ayomanor (TEN) | 25.3 yd | 34 yd | +8.7 yd | Verified |
| Chimere Dike (TEN) | 5.9 yd | 71 yd | +65.1 yd | Verified |
| Calvin Ridley (TEN) | 13.2 yd | 10 yd | -3.2 yd | Verified |

#### Anytime touchdowns — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Chase Brown (CIN) | TD 52.6% | No TD | Event recorded | Verified |
| Ja'Marr Chase (CIN) | TD 46.4% | **Scored TD** | Event recorded | Verified |
| Tony Pollard (TEN) | TD 37.4% | **Scored TD** | Event recorded | Verified |
| Tee Higgins (CIN) | TD 37.2% | **Scored TD** | Event recorded | Verified |
| Wan'Dale Robinson (TEN) | TD 30.8% | **Scored TD** | Event recorded | Verified |
| Samaje Perine (CIN) | TD 29.2% | No TD | Event recorded | Verified |

#### Defensive sacks — 9 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Cedric Johnson (CIN) | UNDER 0.5 · 81.9% | 0 sacks | 0 sacks | Verified |
| Kris Jenkins (CIN) | UNDER 0.5 · 76.2% | 0 sacks | 0 sacks | Verified |
| Myles Murphy (CIN) | UNDER 0.5 · 73.9% | 0 sacks | 0 sacks | Verified |
| Jermaine Johnson II (TEN) | UNDER 0.5 · 65.1% | 0 sacks | 0 sacks | Verified |
| Jeffery Simmons (TEN) | UNDER 0.5 · 63.4% | **Unverified** | — | Unverified |
| Jacob Martin (TEN) | UNDER 0.5 · 62.9% | 3 sacks | 1+ sacks | Verified |
| Boye Mafe (CIN) | UNDER 0.5 · 61.5% | 1 sacks | 1+ sacks | Verified |
| Jonathan Allen (CIN) | UNDER 0.5 · 61.3% | 0 sacks | 0 sacks | Verified |
| Dexter Lawrence (CIN) | UNDER 0.5 · 60.3% | 1 sacks | 1+ sacks | Verified |

---

### 3. ARI @ DAL — final 33–30

**24 original projections · 23 verified · 1 unverified · 0 pushes.** Rushing MAE 40.1 yards; receiving MAE 16.9 yards.

#### Rushing yards — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Javonte Williams (DAL) | 75.7 yd | 56 yd | -19.7 yd | Verified |
| Jeremiyah Love (ARI) | 56.9 yd | 23 yd | -33.9 yd | Verified |
| Tyler Allgeier (ARI) | 25.8 yd | 147 yd | +121.2 yd | Verified |
| Evan Hull (ARI) | 8.1 yd | **Unverified** | — | Unverified |
| Bam Knight (ARI) | 29.1 yd | 8 yd | -21.1 yd | Verified |
| Tyler Goodson (DAL) | 18.6 yd | 14 yd | -4.6 yd | Verified |

#### Receiving yards — 7 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| CeeDee Lamb (DAL) | 79.2 yd | 58 yd | -21.2 yd | Verified |
| George Pickens (DAL) | 67.1 yd | 48 yd | -19.1 yd | Verified |
| Ryan Flournoy (DAL) | 38.2 yd | 38 yd | -0.2 yd | Verified |
| Kendrick Bourne (ARI) | 33.3 yd | 29 yd | -4.3 yd | Verified |
| Michael Wilson (ARI) | 50.9 yd | 111 yd | +60.1 yd | Verified |
| Devin Duvernay (ARI) | 3 yd | 14 yd | +11 yd | Verified |
| Jonathan Mingo (DAL) | 2.1 yd | 0 yd | -2.1 yd | Verified |

#### Anytime touchdowns — 8 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Javonte Williams (DAL) | TD 53.4% | No TD | Event recorded | Verified |
| CeeDee Lamb (DAL) | TD 40.6% | No TD | Event recorded | Verified |
| George Pickens (DAL) | TD 37.5% | No TD | Event recorded | Verified |
| Trey McBride (ARI) | TD 35.3% | **Scored TD** | Event recorded | Verified |
| Jeremiyah Love (ARI) | TD 34.9% | No TD | Event recorded | Verified |
| Michael Wilson (ARI) | TD 30.8% | **Scored TD** | Event recorded | Verified |
| Tyler Allgeier (ARI) | TD 30.1% | **Scored TD** | Event recorded | Verified |
| Bam Knight (ARI) | TD 28.4% | No TD | Event recorded | Verified |

#### Defensive sacks — 3 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Josh Sweat (ARI) | UNDER 0.5 · 73.3% | 1 sacks | 1+ sacks | Verified |
| Quinnen Williams (DAL) | UNDER 0.5 · 64.0% | 2 sacks | 1+ sacks | Verified |
| Darius Robinson (ARI) | UNDER 0.5 · 57.6% | 0 sacks | 0 sacks | Verified |

---

### 4. MIN @ DET — final 15–19

**27 original projections · 25 verified · 2 unverified · 0 pushes.** Rushing MAE 43.2 yards; receiving MAE 18.4 yards.

#### Rushing yards — 4 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Jahmyr Gibbs (DET) | 72 yd | 153 yd | +81 yd | Verified |
| Aaron Jones (MIN) | 49.9 yd | 22 yd | -27.9 yd | Verified |
| Sione Vaki (DET) | 1.6 yd | 65 yd | +63.4 yd | Verified |
| DeeJay Dallas (MIN) | 3.6 yd | 4 yd | +0.4 yd | Verified |

#### Receiving yards — 8 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Amon-Ra St. Brown (DET) | 77.7 yd | 46 yd | -31.7 yd | Verified |
| Jameson Williams (DET) | 55.9 yd | 70 yd | +14.1 yd | Verified |
| Justin Jefferson (MIN) | 57.9 yd | 33 yd | -24.9 yd | Verified |
| Jordan Addison (MIN) | 39.1 yd | 66 yd | +26.9 yd | Verified |
| Isaac TeSlaa (DET) | 17.9 yd | **Unverified** | — | Unverified |
| Tai Felton (MIN) | 11.1 yd | **Unverified** | — | Unverified |
| Jauan Jennings (MIN) | 21.6 yd | 11 yd | -10.6 yd | Verified |
| Myles Price (MIN) | 2.3 yd | 0 yd | -2.3 yd | Verified |

#### Anytime touchdowns — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Jahmyr Gibbs (DET) | TD 54.3% | **Scored TD** | Event recorded | Verified |
| Amon-Ra St. Brown (DET) | TD 51.8% | No TD | Event recorded | Verified |
| Aaron Jones (MIN) | TD 37.5% | No TD | Event recorded | Verified |
| Jameson Williams (DET) | TD 36.7% | **Scored TD** | Event recorded | Verified |
| Sam LaPorta (DET) | TD 34.9% | No TD | Event recorded | Verified |
| Justin Jefferson (MIN) | TD 25.2% | **Scored TD** | Event recorded | Verified |

#### Defensive sacks — 9 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Kyle Van Noy (MIN) | UNDER 0.5 · 72.4% | 0 sacks | 0 sacks | Verified |
| Derrick Barnes (DET) | UNDER 0.5 · 72.4% | 0 sacks | 0 sacks | Verified |
| Eric Wilson (MIN) | UNDER 0.5 · 64.5% | 1 sacks | 1+ sacks | Verified |
| Blake Cashman (MIN) | UNDER 0.5 · 63.9% | 0 sacks | 0 sacks | Verified |
| Andrew Van Ginkel (MIN) | UNDER 0.5 · 63.1% | 2.5 sacks | 1+ sacks | Verified |
| Alim McNeill (DET) | UNDER 0.5 · 63.0% | 1 sacks | 1+ sacks | Verified |
| DJ Wonnum (DET) | UNDER 0.5 · 54.8% | 0 sacks | 0 sacks | Verified |
| Aidan Hutchinson (DET) | OVER 0.5 · 54.6% | 0 sacks | 0 sacks | Verified |
| Dallas Turner (MIN) | OVER 0.5 · 53.9% | 0 sacks | 0 sacks | Verified |

---

### 5. LV @ NYJ — final 38–33

**31 original projections · 20 verified · 11 unverified · 0 pushes.** Rushing MAE 37.5 yards; receiving MAE 36.1 yards.

#### Rushing yards — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Breece Hall (NYJ) | 58.5 yd | **Unverified** | — | Unverified |
| Braelon Allen (NYJ) | 69 yd | 147 yd | +78 yd | Verified |
| Ashton Jeanty (LV) | 48 yd | 9 yd | -39 yd | Verified |
| Dylan Laube (LV) | 6.6 yd | 0 yd | -6.6 yd | Verified |
| Mike Washington Jr. (LV) | 25.5 yd | 83 yd | +57.5 yd | Verified |
| Isaiah Davis (NYJ) | 8.7 yd | 15 yd | +6.3 yd | Verified |

#### Receiving yards — 13 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Garrett Wilson (NYJ) | 51.7 yd | 83 yd | +31.3 yd | Verified |
| Adonai Mitchell (NYJ) | 30.6 yd | 142 yd | +111.4 yd | Verified |
| Tre Tucker (LV) | 48.4 yd | 0 yd | -48.4 yd | Verified |
| Jack Bech (LV) | 16.2 yd | **Unverified** | — | Unverified |
| Malik Benson (LV) | 3.4 yd | **Unverified** | — | Unverified |
| Jalen Nailor (LV) | 17.5 yd | 38 yd | +20.5 yd | Verified |
| Deven Thompkins (LV) | 4.3 yd | **Unverified** | — | Unverified |
| Dont'e Thornton Jr. (LV) | 7.1 yd | **Unverified** | — | Unverified |
| Cody White (LV) | 12.9 yd | **Unverified** | — | Unverified |
| Dareke Young (LV) | 1.5 yd | 0 yd | -1.5 yd | Verified |
| Omar Cooper Jr. (NYJ) | 43.7 yd | **Unverified** | — | Unverified |
| Sterling Shepard (NYJ) | 5.5 yd | **Unverified** | — | Unverified |
| Isaiah Williams (NYJ) | 14.3 yd | 18 yd | +3.7 yd | Verified |

#### Anytime touchdowns — 7 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Ashton Jeanty (LV) | TD 34.5% | No TD | Event recorded | Verified |
| Brock Bowers (LV) | TD 33.4% | **Scored TD** | Event recorded | Verified |
| Tre Tucker (LV) | TD 32.9% | No TD | Event recorded | Verified |
| Braelon Allen (NYJ) | TD 30.7% | **Scored TD** | Event recorded | Verified |
| Breece Hall (NYJ) | TD 30.2% | **Unverified** | — | Unverified |
| Garrett Wilson (NYJ) | TD 27.8% | No TD | Event recorded | Verified |
| Omar Cooper Jr. (NYJ) | TD 27.8% | **Unverified** | — | Unverified |

#### Defensive sacks — 5 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Demario Davis (NYJ) | UNDER 0.5 · 81.3% | 0 sacks | 0 sacks | Verified |
| Quay Walker (LV) | UNDER 0.5 · 74.6% | 0 sacks | 0 sacks | Verified |
| Will McDonald IV (NYJ) | UNDER 0.5 · 72.5% | 1 sacks | 1+ sacks | Verified |
| Malcolm Koonce (LV) | UNDER 0.5 · 62.1% | **Unverified** | — | Unverified |
| Kingsley Enagbare (NYJ) | UNDER 0.5 · 59.6% | 0 sacks | 0 sacks | Verified |

---

### 6. CLE @ PIT — final 6–27

**29 original projections · 25 verified · 4 unverified · 0 pushes.** Rushing MAE 32.7 yards; receiving MAE 14.5 yards.

#### Rushing yards — 7 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Jaylen Warren (PIT) | 64.3 yd | 143 yd | +78.7 yd | Verified |
| Quinshon Judkins (CLE) | 51.8 yd | 25 yd | -26.8 yd | Verified |
| Audric Estime (CLE) | 38.3 yd | **Unverified** | — | Unverified |
| Jaleel McLaughlin (CLE) | 10.4 yd | **Unverified** | — | Unverified |
| Dylan Sampson (CLE) | 8 yd | 7 yd | -1 yd | Verified |
| Rico Dowdle (PIT) | 31.6 yd | 56 yd | +24.4 yd | Verified |
| Travis Homer (PIT) | 1.8 yd | **Unverified** | — | Unverified |

#### Receiving yards — 9 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| DK Metcalf (PIT) | 49.2 yd | 4 yd | -45.2 yd | Verified |
| Germie Bernard (PIT) | 44 yd | 30 yd | -14 yd | Verified |
| Jerry Jeudy (CLE) | 28.7 yd | 0 yd | -28.7 yd | Verified |
| Denzel Boston (CLE) | 39.9 yd | 37 yd | -2.9 yd | Verified |
| KC Concepcion (CLE) | 38.8 yd | 37 yd | -1.8 yd | Verified |
| Isaiah Bond (CLE) | 19.4 yd | 0 yd | -19.4 yd | Verified |
| Malachi Corley (CLE) | 1.1 yd | 0 yd | -1.1 yd | Verified |
| Tylan Wallace (CLE) | 0 yd | 3 yd | +3 yd | Verified |
| Ben Skowronek (PIT) | 9 yd | **Unverified** | — | Unverified |

#### Anytime touchdowns — 8 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Quinshon Judkins (CLE) | TD 42.8% | No TD | Event recorded | Verified |
| Jaylen Warren (PIT) | TD 41.6% | **Scored TD** | Event recorded | Verified |
| Pat Freiermuth (PIT) | TD 36.5% | **Scored TD** | Event recorded | Verified |
| DK Metcalf (PIT) | TD 35.6% | No TD | Event recorded | Verified |
| Germie Bernard (PIT) | TD 32.6% | No TD | Event recorded | Verified |
| Rico Dowdle (PIT) | TD 32.6% | **Scored TD** | Event recorded | Verified |
| Harold Fannin Jr. (CLE) | TD 31.5% | No TD | Event recorded | Verified |
| Denzel Boston (CLE) | TD 26.7% | No TD | Event recorded | Verified |

#### Defensive sacks — 5 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Isaiah McGuire (CLE) | UNDER 0.5 · 69.6% | 0 sacks | 0 sacks | Verified |
| Nick Herbig (PIT) | UNDER 0.5 · 69.5% | 1 sacks | 1+ sacks | Verified |
| Adin Huntington (CLE) | UNDER 0.5 · 61.5% | 1 sacks | 1+ sacks | Verified |
| Maliek Collins (CLE) | UNDER 0.5 · 60.4% | 0 sacks | 0 sacks | Verified |
| T.J. Watt (PIT) | UNDER 0.5 · 55.0% | 2 sacks | 1+ sacks | Verified |

---

### 7. ATL @ TB — final 0–16

**26 original projections · 20 verified · 6 unverified · 0 pushes.** Rushing MAE 48.8 yards; receiving MAE 34 yards.

#### Rushing yards — 5 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Bucky Irving (TB) | 76.3 yd | 170 yd | +93.7 yd | Verified |
| Bijan Robinson (ATL) | 67.4 yd | 76 yd | +8.6 yd | Verified |
| Khalil Herbert (ATL) | 7.3 yd | 12 yd | +4.7 yd | Verified |
| Kenny Gainwell (TB) | 17.9 yd | 140 yd | +122.1 yd | Verified |
| Sean Tucker (TB) | 15 yd | 0 yd | -15 yd | Verified |

#### Receiving yards — 9 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Chris Godwin Jr. (TB) | 39.4 yd | 0 yd | -39.4 yd | Verified |
| Drake London (ATL) | 71.6 yd | 8 yd | -63.6 yd | Verified |
| Chris Blair (ATL) | 0 yd | **Unverified** | — | Unverified |
| Zachariah Branch (ATL) | 10 yd | 0 yd | -10 yd | Verified |
| Jahan Dotson (ATL) | 19.9 yd | 95 yd | +75.1 yd | Verified |
| Olamide Zaccheaus (ATL) | 5.8 yd | 4 yd | -1.8 yd | Verified |
| Ted Hurst III (TB) | 27.6 yd | 0 yd | -27.6 yd | Verified |
| Kameron Johnson (TB) | 4.1 yd | **Unverified** | — | Unverified |
| Tez Johnson (TB) | 20.4 yd | 0 yd | -20.4 yd | Verified |

#### Anytime touchdowns — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Bucky Irving (TB) | TD 50.9% | **Scored TD** | Event recorded | Verified |
| Bijan Robinson (ATL) | TD 41.1% | No TD | Event recorded | Verified |
| Drake London (ATL) | TD 32.9% | No TD | Event recorded | Verified |
| Kyle Pitts (ATL) | TD 30.1% | No TD | Event recorded | Verified |
| Chris Godwin Jr. (TB) | TD 26.1% | No TD | Event recorded | Verified |
| Kenny Gainwell (TB) | TD 25.6% | No TD | Event recorded | Verified |

#### Defensive sacks — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Al-Quadin Muhammad (TB) | UNDER 0.5 · 73.4% | **Unverified** | — | Unverified |
| David Walker (TB) | UNDER 0.5 · 64.6% | **Unverified** | — | Unverified |
| Yaya Diaby (TB) | UNDER 0.5 · 64.0% | **Unverified** | — | Unverified |
| Samson Ebukam (ATL) | UNDER 0.5 · 61.8% | 0 sacks | 0 sacks | Verified |
| Cameron Thomas (ATL) | UNDER 0.5 · 59.8% | 0 sacks | 0 sacks | Verified |
| Za'Darius Smith (ATL) | UNDER 0.5 · 56.4% | **Unverified** | — | Unverified |

---

### 8. IND @ JAX — final 7–42

**28 original projections · 26 verified · 2 unverified · 0 pushes.** Rushing MAE 20.5 yards; receiving MAE 18.3 yards.

#### Rushing yards — 7 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Bhayshul Tuten (JAX) | 68.8 yd | 104 yd | +35.2 yd | Verified |
| Jonathan Taylor (IND) | 60.2 yd | 23 yd | -37.2 yd | Verified |
| DJ Giddens (IND) | 9.6 yd | 43 yd | +33.4 yd | Verified |
| Seth McGowan (IND) | 17.5 yd | 29 yd | +11.5 yd | Verified |
| Ameer Abdullah (JAX) | 5 yd | 13 yd | +8 yd | Verified |
| LeQuint Allen Jr. (JAX) | 4.1 yd | 0 yd | -4.1 yd | Verified |
| Chris Rodriguez Jr. (JAX) | 26.6 yd | 41 yd | +14.4 yd | Verified |

#### Receiving yards — 11 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Jakobi Meyers (JAX) | 46.3 yd | 24 yd | -22.3 yd | Verified |
| Parker Washington (JAX) | 56.7 yd | 16 yd | -40.7 yd | Verified |
| Keenan Allen (IND) | 38.9 yd | 67 yd | +28.1 yd | Verified |
| Laquon Treadwell (IND) | 24.8 yd | 18 yd | -6.8 yd | Verified |
| Josh Downs (IND) | 31.3 yd | 23 yd | -8.3 yd | Verified |
| Deion Burks (IND) | 8.8 yd | 2 yd | -6.8 yd | Verified |
| Ashton Dulin (IND) | 12.5 yd | 0 yd | -12.5 yd | Verified |
| Nick Westbrook-Ikhine (IND) | 0 yd | **Unverified** | — | Unverified |
| Josh Cameron (JAX) | 10.9 yd | 0 yd | -10.9 yd | Verified |
| Travis Hunter (JAX) | 36.2 yd | 0 yd | -36.2 yd | Verified |
| Brian Thomas Jr. (JAX) | 22.7 yd | 12 yd | -10.7 yd | Verified |

#### Anytime touchdowns — 8 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Bhayshul Tuten (JAX) | TD 50.0% | **Scored TD** | Event recorded | Verified |
| Parker Washington (JAX) | TD 39.0% | No TD | Event recorded | Verified |
| Jakobi Meyers (JAX) | TD 37.2% | No TD | Event recorded | Verified |
| Jonathan Taylor (IND) | TD 36.0% | No TD | Event recorded | Verified |
| Brenton Strange (JAX) | TD 30.2% | No TD | Event recorded | Verified |
| Tyler Warren (IND) | TD 29.1% | No TD | Event recorded | Verified |
| Chris Rodriguez Jr. (JAX) | TD 26.3% | **Scored TD** | Event recorded | Verified |
| Keenan Allen (IND) | TD 25.2% | No TD | Event recorded | Verified |

#### Defensive sacks — 2 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| DeForest Buckner (IND) | UNDER 0.5 · 62.8% | **Unverified** | — | Unverified |
| Adetomiwa Adebawore (IND) | UNDER 0.5 · 62.7% | 0 sacks | 0 sacks | Verified |

---

### 9. LAC @ LA — final 9–24

**28 original projections · 26 verified · 2 unverified · 0 pushes.** Rushing MAE 14.5 yards; receiving MAE 14.8 yards.

#### Rushing yards — 5 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Kyren Williams (LA) | 64.2 yd | 56 yd | -8.2 yd | Verified |
| Blake Corum (LA) | 50.5 yd | 73 yd | +22.5 yd | Verified |
| Omarion Hampton (LAC) | 40 yd | 20 yd | -20 yd | Verified |
| Keaton Mitchell (LAC) | 23.6 yd | 6 yd | -17.6 yd | Verified |
| Kimani Vidal (LAC) | 18.9 yd | 23 yd | +4.1 yd | Verified |

#### Receiving yards — 11 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Puka Nacua (LA) | 83.8 yd | 80 yd | -3.8 yd | Verified |
| Tre Harris (LAC) | 26.8 yd | 31 yd | +4.2 yd | Verified |
| Tutu Atwell (LA) | 11.7 yd | 52 yd | +40.3 yd | Verified |
| Alex Bachman (LA) | 2.9 yd | 0 yd | -2.9 yd | Verified |
| Konata Mumpfield (LA) | 16.4 yd | 0 yd | -16.4 yd | Verified |
| Jordan Whittington (LA) | 4.8 yd | 0 yd | -4.8 yd | Verified |
| Derius Davis (LAC) | 2.4 yd | 0 yd | -2.4 yd | Verified |
| Quentin Johnston (LAC) | 30.7 yd | 37 yd | +6.3 yd | Verified |
| KeAndre Lambert-Smith (LAC) | 13.1 yd | 0 yd | -13.1 yd | Verified |
| Ladd McConkey (LAC) | 32.2 yd | 86 yd | +53.8 yd | Verified |
| Theo Wease Jr. (LAC) | 24 yd | **Unverified** | — | Unverified |

#### Anytime touchdowns — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Kyren Williams (LA) | TD 51.4% | **Scored TD** | Event recorded | Verified |
| Puka Nacua (LA) | TD 48.0% | **Scored TD** | Event recorded | Verified |
| Blake Corum (LA) | TD 42.4% | **Scored TD** | Event recorded | Verified |
| Colby Parkinson (LA) | TD 28.3% | **Unverified** | — | Unverified |
| Tyler Higbee (LA) | TD 26.4% | No TD | Event recorded | Verified |
| Omarion Hampton (LAC) | TD 26.1% | No TD | Event recorded | Verified |

#### Defensive sacks — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Omar Speights (LA) | UNDER 0.5 · 79.0% | 0 sacks | 0 sacks | Verified |
| Troy Dye (LAC) | UNDER 0.5 · 69.6% | 0 sacks | 0 sacks | Verified |
| Byron Young (LA) | UNDER 0.5 · 61.7% | 0 sacks | 0 sacks | Verified |
| Khalil Mack (LAC) | UNDER 0.5 · 61.0% | 0 sacks | 0 sacks | Verified |
| Tuli Tuipulotu (LAC) | UNDER 0.5 · 59.4% | 1 sacks | 1+ sacks | Verified |
| Akheem Mesidor (LAC) | UNDER 0.5 · 57.6% | 0 sacks | 0 sacks | Verified |

---

### 10. KC @ DEN — final 24–28

**22 original projections · 20 verified · 2 unverified · 0 pushes.** Rushing MAE 13.1 yards; receiving MAE 9.5 yards.

#### Rushing yards — 3 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| J.K. Dobbins (DEN) | 39.4 yd | 13 yd | -26.4 yd | Verified |
| Kenneth Walker III (KC) | 76.7 yd | 69 yd | -7.7 yd | Verified |
| Emmett Johnson (KC) | 9.7 yd | 15 yd | +5.3 yd | Verified |

#### Receiving yards — 10 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Jaylen Waddle (DEN) | 41.5 yd | 39 yd | -2.5 yd | Verified |
| Rashee Rice (KC) | 58.9 yd | 53 yd | -5.9 yd | Verified |
| Xavier Worthy (KC) | 33.4 yd | 13 yd | -20.4 yd | Verified |
| Troy Franklin (DEN) | 17.9 yd | 3 yd | -14.9 yd | Verified |
| Lil'Jordan Humphrey (DEN) | 3.3 yd | 10 yd | +6.7 yd | Verified |
| Marvin Mims Jr. (DEN) | 13.9 yd | 10 yd | -3.9 yd | Verified |
| Courtland Sutton (DEN) | 30.9 yd | 53 yd | +22.1 yd | Verified |
| Cyrus Allen (KC) | 10.9 yd | 20 yd | +9.1 yd | Verified |
| Jalen Royals (KC) | 4.1 yd | 4 yd | -0.1 yd | Verified |
| Justin Watson (KC) | 2.1 yd | **Unverified** | — | Unverified |

#### Anytime touchdowns — 6 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Kenneth Walker III (KC) | TD 41.0% | No TD | Event recorded | Verified |
| J.K. Dobbins (DEN) | TD 35.3% | No TD | Event recorded | Verified |
| Xavier Worthy (KC) | TD 30.9% | No TD | Event recorded | Verified |
| Rashee Rice (KC) | TD 29.3% | **Scored TD** | Event recorded | Verified |
| Travis Kelce (KC) | TD 26.3% | No TD | Event recorded | Verified |
| Isiah Pacheco (KC) | TD 25.8% | **Unverified** | — | Unverified |

#### Defensive sacks — 3 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Nik Bonitto (DEN) | UNDER 0.5 · 59.1% | 0 sacks | 0 sacks | Verified |
| Malcolm Roach (DEN) | UNDER 0.5 · 57.9% | 1 sacks | 1+ sacks | Verified |
| Zach Allen (DEN) | OVER 0.5 · 50.2% | 0 sacks | 0 sacks | Verified |

---

### 11. NE @ MIA — final 24–19

**24 original projections · 20 verified · 2 unverified · 2 pushes.** Rushing MAE 19.4 yards; receiving MAE 17.6 yards.

#### Rushing yards — 5 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Ollie Gordon II (MIA) | 49.3 yd | 69 yd | +19.7 yd | Verified |
| Kaytron Allen (MIA) | 13.7 yd | 0 yd | -13.7 yd | Verified |
| Jaylen Wright (MIA) | 10.7 yd | 5 yd | -5.7 yd | Verified |
| Corey Kiner (NE) | 15.1 yd | 38 yd | +22.9 yd | Verified |
| Rhamondre Stevenson (NE) | 46.9 yd | 82 yd | +35.1 yd | Verified |

#### Receiving yards — 10 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Malik Washington (MIA) | 34.1 yd | 40 yd | +5.9 yd | Verified |
| DeMario Douglas (NE) | 34.4 yd | 76 yd | +41.6 yd | Verified |
| Chris Bell (MIA) | 19.6 yd | 31 yd | +11.4 yd | Verified |
| Kevin Coleman Jr. (MIA) | 19.5 yd | 46 yd | +26.5 yd | Verified |
| Caleb Douglas (MIA) | 44.4 yd | 43 yd | -1.4 yd | Verified |
| Jalen Tolbert (MIA) | 9.6 yd | 8 yd | -1.6 yd | Verified |
| Jared Wayne (MIA) | 20.6 yd | **Unverified** | — | Unverified |
| Efton Chism III (NE) | 13.7 yd | 37 yd | +23.3 yd | Verified |
| Ryan Miller (NE) | 17.5 yd | **Unverified** | — | Unverified |
| Kyle Williams (NE) | 14.1 yd | 43 yd | +28.9 yd | Verified |

#### Anytime touchdowns — 5 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Rhamondre Stevenson (NE) | TD 45.2% | No TD | Event recorded | Verified |
| Ollie Gordon II (MIA) | TD 31.6% | No TD | Event recorded | Verified |
| Caleb Douglas (MIA) | TD 28.3% | No TD | Event recorded | Verified |
| DeMario Douglas (NE) | TD 27.9% | **Scored TD** | Event recorded | Verified |
| Eli Raridon (NE) | TD 27.3% | No TD | Event recorded | Verified |

#### Defensive sacks — 4 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Zach Sieler (MIA) | UNDER 0.5 · 64.0% | 0 sacks | 0 sacks | Verified |
| Chop Robinson (MIA) | UNDER 0.5 · 63.1% | 2 sacks | 1+ sacks | Verified |
| Christian Barmore (NE) | UNDER 0.5 · 60.7% | **0.5 sack (push)** | Push | Push |
| Elijah Ponder (NE) | UNDER 0.5 · 59.3% | **0.5 sack (push)** | Push | Push |

---

### 12. PHI @ WAS — final 10–27

**21 original projections · 20 verified · 1 unverified · 0 pushes.** Rushing MAE 20.7 yards; receiving MAE 19.9 yards.

#### Rushing yards — 3 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Saquon Barkley (PHI) | 42.3 yd | 30 yd | -12.3 yd | Verified |
| Austin Ekeler (WAS) | 9.8 yd | 36 yd | +26.2 yd | Verified |
| Rachaad White (WAS) | 31.4 yd | 55 yd | +23.6 yd | Verified |

#### Receiving yards — 9 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Stefon Diggs (WAS) | 48.8 yd | 38 yd | -10.8 yd | Verified |
| Antonio Williams (WAS) | 30.5 yd | 54 yd | +23.5 yd | Verified |
| Makai Lemon (PHI) | 31.1 yd | 57 yd | +25.9 yd | Verified |
| Darius Cooper (PHI) | 18.1 yd | 19 yd | +0.9 yd | Verified |
| Elijah Moore (PHI) | 8.7 yd | **Unverified** | — | Unverified |
| Dyami Brown (WAS) | 14 yd | 0 yd | -14 yd | Verified |
| Treylon Burks (WAS) | 24.9 yd | 81 yd | +56.1 yd | Verified |
| Van Jefferson (WAS) | 24.9 yd | 0 yd | -24.9 yd | Verified |
| Luke McCaffrey (WAS) | 2.8 yd | 0 yd | -2.8 yd | Verified |

#### Anytime touchdowns — 5 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Rachaad White (WAS) | TD 42.6% | **Scored TD** | Event recorded | Verified |
| Stefon Diggs (WAS) | TD 35.9% | **Scored TD** | Event recorded | Verified |
| Treylon Burks (WAS) | TD 29.7% | No TD | Event recorded | Verified |
| Saquon Barkley (PHI) | TD 28.9% | **Scored TD** | Event recorded | Verified |
| Antonio Williams (WAS) | TD 25.8% | No TD | Event recorded | Verified |

#### Defensive sacks — 4 forecasts

| Player (team) | Model projection | Final stat | Difference / outcome | Status |
|:--|--:|--:|--:|:--|
| Nolan Smith (PHI) | UNDER 0.5 · 70.8% | 1 sacks | 1+ sacks | Verified |
| Jalen Carter (PHI) | UNDER 0.5 · 70.6% | 1 sacks | 1+ sacks | Verified |
| Odafe Oweh (WAS) | UNDER 0.5 · 61.5% | 1 sacks | 1+ sacks | Verified |
| K'Lavon Chaisson (WAS) | UNDER 0.5 · 59.8% | 1 sacks | 1+ sacks | Verified |

---

## Source details

- [Original frozen pregame source, October 31](https://github.com/deshawnclark116-prog/mlb-picks2/blob/c9661df759c36a017b3268345e338b7d676adfd6/docs/nfl_predictions_2026_w08.json)
- [Machine-readable complete 316-row grading JSON](https://github.com/deshawnclark116-prog/mlb-picks3/blob/main/docs/nfl_week8_nov1_full_projection_grade.json)
- [Full grading CSV](https://github.com/deshawnclark116-prog/mlb-picks3/blob/main/docs/nfl_week8_nov1_full_projection_grade.csv)

**Scope:** This is the original published Week 8 NFL player-prediction feed (four markets). It is not a retrospective relabeling of a different V2 research cohort, and yardage deviation is not a betting win/loss result.
