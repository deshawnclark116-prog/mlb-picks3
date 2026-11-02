# NFL frontend mix selection — pregame Week 8 research ablation

**Research only.** The 12 historical games are a diagnostic, not an untouched holdout. No selection logic was promoted to the frontend.

## Model projection, not easy targets

Count: rounded median, with P(X>=rounded median) and P(exact count) from original frozen CDF. Yards: rounded median, with P(Y>=rounded median) and a **separate** distribution concentration probability P(within ±10 yards of rush/receiving or ±25 yards passing). They are different events and are not interchangeable.

## Compared policies

| Policy | Selected | Verified | Unverified | Count exact / n | Count MAE | Yard n | Yard MAE | Median attainment |
|:--|--:|--:|--:|--:|--:|--:|--:|--:|
| legacy | 120 | 114 | 6 | 20/72 | 1.667 | 42 | 29.714 | 76/114 |
| rawRound | 120 | 108 | 12 | 25/108 | 1.528 | 0 | null | 78/108 |
| diverse | 119 | 99 | 20 | 16/49 | 1.163 | 50 | 17.32 | 68/99 |

### Critical interpretability limits
- Numeric exact accuracy, band accuracy, role coverage and model median attainment are separately graded. They cannot be replaced by old 65%+ **easier** target hit rates.
- The 65% cutoff cannot be applied universally to a median: yard medians have roughly 50% attainment probability.
- The diverse cap is a hypothetical allocation with **fixed predeclared** filters, not an optimized or promoted configuration.
- A high probability of being within ±10 yards is not an exact-yard hit probability, and must be labeled as a range.
- The original Sunday is already inspected; this test supports diagnosis only. A promotion requires earlier-season walk-forward and an untouched forward evaluation.

## Game-by-game

### ARI @ DAL

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 8 | 2 | 1 / 4 | 1.75 | 4 | 36.5 |
| rawRound | 10 | 8 | 2 | 2 / 8 | 1.75 | 0 | null |
| diverse | 10 | 10 | 0 | 1 / 5 | 1.2 | 5 | 11 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| bam knight (ARI) | rec_yds | 5 | 52.5% | 10 | 5 |
| tyler allgeier (ARI) | rec_yds | 7 | 52.5% | 44 | 37 |
| elijah higgins (ARI) | rec_yds | 10 | 50.5% | 10 | 0 |
| dak prescott (DAL) | rush_yds | 10 | 50.5% | 20 | 10 |
| tyler goodson (DAL) | rush_yds | 11 | 50.5% | 14 | 3 |
| jonathan mingo (DAL) | rec | 1 | 59.7% | 0 | 1 |
| jacoby brissett (ARI) | pass_td | 1 | 73.5% | 0 | 1 |
| elijah higgins (ARI) | rec | 1 | 70.7% | 2 | 1 |
| brevyn spannford (DAL) | rec | 1 | 72.4% | 4 | 3 |
| bam knight (ARI) | rec | 1 | 66.8% | 1 | 0 |

### ATL @ TB

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 6 | 1.833 | 4 | 100.25 |
| rawRound | 10 | 10 | 0 | 1 / 10 | 1.8 | 0 | null |
| diverse | 10 | 10 | 0 | 1 / 5 | 1.2 | 5 | 11 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| michael penix (ATL) | rush_yds | 6 | 52.5% | 11 | 5 |
| zachariah branch (ATL) | rec_yds | 9 | 51.5% | 0 | 9 |
| baker mayfield (TB) | rush_yds | 11 | 52.5% | 14 | 3 |
| bucky irving (TB) | rec_yds | 18 | 50.5% | 0 | 18 |
| bijan robinson (ATL) | rec_yds | 20 | 49.5% | 0 | 20 |
| michael penix (ATL) | pass_td | 1 | 56.8% | 0 | 1 |
| zachariah branch (ATL) | rec | 1 | 66.6% | 0 | 1 |
| tez johnson (TB) | rec | 2 | 58.3% | 0 | 2 |
| jahan dotson (ATL) | rec | 2 | 62.0% | 2 | 0 |
| ted hurst (TB) | rec | 2 | 63.6% | 0 | 2 |

### BAL @ BUF

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 2 / 7 | 1.571 | 3 | 13.333 |
| rawRound | 10 | 9 | 1 | 2 / 9 | 1.333 | 0 | null |
| diverse | 10 | 7 | 3 | 1 / 3 | 1 | 4 | 13.5 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| ty johnson (BUF) | rush_yds | 3 | 52.5% | 4 | 1 |
| ray davis (BUF) | rush_yds | 3 | 51.5% | 30 | 27 |
| james cook (BUF) | rec_yds | 9 | 52.5% | 21 | 12 |
| ty johnson (BUF) | rec_yds | 5 | 52.5% | 19 | 14 |
| skyler bell (BUF) | rec_yds | 10 | 50.5% | Unverified | — |
| josh allen (BUF) | pass_td | 1 | 65.6% | 2 | 1 |
| skyler bell (BUF) | rec | 1 | 66.7% | Unverified | — |
| josh palmer (BUF) | rec | 1 | 55.6% | Unverified | — |
| dawson knox (BUF) | rec | 1 | 72.6% | 1 | 0 |
| ty johnson (BUF) | rec | 1 | 66.4% | 3 | 2 |

### CLE @ PIT

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 2 / 9 | 2 | 1 | 7 |
| rawRound | 10 | 10 | 0 | 2 / 10 | 2.4 | 0 | null |
| diverse | 10 | 10 | 0 | 1 / 5 | 1.8 | 5 | 20 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| dylan sampson (CLE) | rec_yds | 7 | 50.5% | 62 | 55 |
| dylan sampson (CLE) | rush_yds | 12 | 49.5% | 7 | 5 |
| quinshon judkins (CLE) | rec_yds | 12 | 52.5% | 24 | 12 |
| rico dowdle (PIT) | rec_yds | 13 | 50.5% | 0 | 13 |
| deshaun watson (CLE) | rush_yds | 17 | 50.5% | 2 | 15 |
| deshaun watson (CLE) | pass_td | 1 | 58.8% | 0 | 1 |
| dylan sampson (CLE) | rec | 1 | 71.2% | 6 | 5 |
| jerry jeudy (CLE) | rec | 2 | 61.4% | 0 | 2 |
| darnell washington (PIT) | rec | 2 | 60.4% | 3 | 1 |
| quinshon judkins (CLE) | rec | 2 | 63.1% | 2 | 0 |

### IND @ JAX

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 2 / 6 | 1.5 | 4 | 15.25 |
| rawRound | 10 | 9 | 1 | 4 / 9 | 1.111 | 0 | null |
| diverse | 10 | 7 | 3 | 3 / 4 | 0.25 | 3 | 13 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| mo aliecox (IND) | rec_yds | 3 | 50.5% | Unverified | — |
| nate boerkircher (JAX) | rec_yds | 8 | 50.5% | 31 | 23 |
| will mallory (IND) | rec_yds | 7 | 50.5% | Unverified | — |
| daniel jones (IND) | rush_yds | 9 | 52.5% | 7 | 2 |
| seth mcgowan (IND) | rush_yds | 15 | 52.5% | 29 | 14 |
| daniel jones (IND) | pass_td | 1 | 62.5% | 1 | 0 |
| nate boerkircher (JAX) | rec | 1 | 65.3% | 1 | 0 |
| josh cameron (JAX) | rec | 1 | 70.9% | 0 | 1 |
| will mallory (IND) | rec | 1 | 62.2% | Unverified | — |
| brian thomas (JAX) | rec | 1 | 69.4% | 1 | 0 |

### KC @ DEN

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 3 / 7 | 1.143 | 3 | 19 |
| rawRound | 10 | 10 | 0 | 3 / 10 | 1.3 | 0 | null |
| diverse | 10 | 10 | 0 | 2 / 5 | 1.4 | 5 | 33.8 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| emmett johnson (KC) | rush_yds | 6 | 53.5% | 15 | 9 |
| emmett johnson (KC) | rec_yds | 5 | 50.5% | 128 | 123 |
| jk dobbins (DEN) | rec_yds | 4 | 50.5% | 0 | 4 |
| adam trautman (DEN) | rec_yds | 2 | 50.5% | 30 | 28 |
| patrick mahomes (KC) | rush_yds | 11 | 52.5% | 6 | 5 |
| patrick mahomes (KC) | pass_td | 1 | 64.9% | 3 | 2 |
| jalen royals (KC) | rec | 1 | 70.0% | 1 | 0 |
| troy franklin (DEN) | rec | 1 | 72.1% | 1 | 0 |
| emmett johnson (KC) | rec | 1 | 65.7% | 5 | 4 |
| andrew armstrong (KC) | rec | 1 | 58.8% | 0 | 1 |

### LAC @ LA

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 5 | 1.4 | 5 | 15.6 |
| rawRound | 10 | 9 | 1 | 1 / 9 | 1.222 | 0 | null |
| diverse | 10 | 9 | 1 | 0 / 4 | 1.25 | 5 | 7.2 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| blake corum (LA) | rec_yds | 7 | 50.5% | 0 | 7 |
| keaton mitchell (LAC) | rec_yds | 4 | 50.5% | 17 | 13 |
| kimani vidal (LAC) | rec_yds | 4 | 51.5% | 7 | 3 |
| keaton mitchell (LAC) | rush_yds | 16 | 51.5% | 6 | 10 |
| kimani vidal (LAC) | rush_yds | 20 | 50.5% | 23 | 3 |
| justin herbert (LAC) | pass_td | 1 | 68.4% | 0 | 1 |
| kimani vidal (LAC) | rec | 1 | 63.8% | 2 | 1 |
| keaton mitchell (LAC) | rec | 1 | 62.6% | 3 | 2 |
| theo wease (LAC) | rec | 1 | 66.2% | Unverified | — |
| blake corum (LA) | rec | 1 | 71.2% | 0 | 1 |

### LV @ NYJ

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 9 | 1 | 2 / 5 | 1.6 | 4 | 54 |
| rawRound | 10 | 8 | 2 | 1 / 8 | 2.125 | 0 | null |
| diverse | 10 | 8 | 2 | 1 / 3 | 1.333 | 5 | 20.4 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| geno smith (NYJ) | rush_yds | 6 | 52.5% | 4 | 2 |
| cody white (LV) | rec_yds | 6 | 51.5% | Unverified | — |
| kirk cousins (LV) | rush_yds | 8 | 51.5% | 3 | 5 |
| braelon allen (NYJ) | rec_yds | 11 | 50.5% | 6 | 5 |
| kenyon sadiq (NYJ) | rec_yds | 12 | 51.5% | 22 | 10 |
| geno smith (NYJ) | pass_td | 1 | 68.6% | 2 | 1 |
| cody white (LV) | rec | 1 | 59.8% | Unverified | — |
| kenyon sadiq (NYJ) | rec | 1 | 75.0% | 1 | 0 |
| jalen nailor (LV) | rec | 1 | 75.2% | 4 | 3 |
| geno smith (NYJ) | pass_yds | 210 | 50.5% | 290 | 80 |

### MIN @ DET

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 9 | 1 | 2 / 6 | 0.833 | 3 | 17.667 |
| rawRound | 10 | 10 | 0 | 4 / 10 | 0.7 | 0 | null |
| diverse | 10 | 8 | 2 | 2 / 5 | 0.6 | 3 | 25 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| jared goff (DET) | rush_yds | 4 | 50.5% | 0 | 4 |
| sione vaki (DET) | rush_yds | 4 | 53.5% | 65 | 61 |
| brock wright (DET) | rec_yds | 1 | 50.5% | Unverified | — |
| aaron jones (MIN) | rec_yds | 8 | 51.5% | 18 | 10 |
| gavin bartholomew (MIN) | rec_yds | 1 | 50.5% | Unverified | — |
| jahmyr gibbs (DET) | atd | 1 | 63.8% | 1 | 0 |
| jahmyr gibbs (DET) | rush_td | 1 | 58.2% | 1 | 0 |
| kyler murray (MIN) | pass_td | 1 | 56.1% | 2 | 1 |
| jauan jennings (MIN) | rec | 1 | 68.4% | 2 | 1 |
| aaron jones (MIN) | rec | 1 | 76.0% | 2 | 1 |

### NE @ MIA

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 5 | 1.8 | 5 | 23 |
| rawRound | 10 | 10 | 0 | 2 / 10 | 1.4 | 0 | null |
| diverse | 10 | 10 | 0 | 1 / 5 | 1.6 | 5 | 21.4 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| ollie gordon (MIA) | rec_yds | 7 | 50.5% | 0 | 7 |
| kyle williams (NE) | rec_yds | 10 | 51.5% | 43 | 33 |
| kevin coleman (MIA) | rec_yds | 9 | 50.5% | 46 | 37 |
| jaylen wright (MIA) | rush_yds | 13 | 51.5% | 5 | 8 |
| malik willis (MIA) | pass_td | 1 | 61.0% | 2 | 1 |
| malik willis (MIA) | rush_yds | 24 | 51.5% | 2 | 22 |
| kyle williams (NE) | rec | 1 | 66.6% | 1 | 0 |
| ollie gordon (MIA) | rec | 1 | 72.0% | 0 | 1 |
| kevin coleman (MIA) | rec | 1 | 65.0% | 3 | 2 |
| efton chism (NE) | rec | 1 | 75.5% | 5 | 4 |

### PHI @ WAS

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 8 | 2 | 3 / 5 | 0.8 | 3 | 9.333 |
| rawRound | 10 | 7 | 3 | 2 / 7 | 1.143 | 0 | null |
| diverse | 9 | 4 | 5 | 2 / 2 | 0 | 2 | 15.5 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| saquon barkley (PHI) | rec_yds | 6 | 50.5% | 24 | 18 |
| elijah moore (PHI) | rec_yds | 9 | 50.5% | Unverified | — |
| dameon pierce (PHI) | rec_yds | 11 | 51.5% | Unverified | — |
| saquon barkley (PHI) | rush_yds | 17 | 51.5% | 30 | 13 |
| dameon pierce (PHI) | rush_yds | 43 | 50.5% | Unverified | — |
| elijah moore (PHI) | rec | 1 | 64.6% | Unverified | — |
| saquon barkley (PHI) | rec | 1 | 66.9% | 1 | 0 |
| darius cooper (PHI) | rec | 2 | 55.3% | 2 | 0 |
| marquise brown (PHI) | rec | 2 | 63.5% | Unverified | — |

### TEN @ CIN

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 0 / 7 | 3.286 | 3 | 15.333 |
| rawRound | 10 | 8 | 2 | 1 / 8 | 2.125 | 0 | null |
| diverse | 10 | 6 | 4 | 1 / 3 | 1.667 | 3 | 14.333 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| cam ward (TEN) | rush_yds | 7 | 52.5% | 41 | 34 |
| samaje perine (CIN) | rec_yds | 1 | 51.5% | 9 | 8 |
| drew sample (CIN) | rec_yds | 5 | 51.5% | Unverified | — |
| erick all (CIN) | rec_yds | 9 | 51.5% | Unverified | — |
| joe burrow (CIN) | rush_yds | 9 | 52.5% | 10 | 1 |
| cam ward (TEN) | pass_td | 1 | 69.3% | 2 | 1 |
| drew sample (CIN) | rec | 1 | 60.7% | Unverified | — |
| chimere dike (TEN) | rec | 1 | 56.2% | 5 | 4 |
| samaje perine (CIN) | rec | 1 | 56.6% | 1 | 0 |
| erick all (CIN) | rec | 1 | 69.1% | Unverified | — |
