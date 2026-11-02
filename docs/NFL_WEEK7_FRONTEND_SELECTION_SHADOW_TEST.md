# NFL frontend mix selection — earlier Week 7 frozen-snapshot research ablation

**Research only.** The 14 historical games are a diagnostic, not an untouched holdout. No selection logic was promoted to the frontend.

## Model projection, not easy targets

Count: rounded median, with P(X>=rounded median) and P(exact count) from original frozen CDF. Yards: rounded median, with P(Y>=rounded median) and a **separate** distribution concentration probability P(within ±10 yards of rush/receiving or ±25 yards passing). They are different events and are not interchangeable.

## Compared policies

| Policy | Selected | Verified | Unverified | Count exact / n | Count MAE | Yard n | Yard MAE | Median attainment |
|:--|--:|--:|--:|--:|--:|--:|--:|--:|
| legacy | 140 | 139 | 1 | 15/89 | 1.472 | 50 | 24.46 | 83/139 |
| rawRound | 140 | 133 | 7 | 28/133 | 1.203 | 0 | null | 88/133 |
| diverse | 140 | 130 | 10 | 17/64 | 1 | 66 | 13.485 | 82/130 |

### Critical interpretability limits
- Numeric exact accuracy, band accuracy, role coverage and model median attainment are separately graded. They cannot be replaced by old 65%+ **easier** target hit rates.
- The 65% cutoff cannot be applied universally to a median: yard medians have roughly 50% attainment probability.
- The diverse cap is a hypothetical allocation with **fixed predeclared** filters, not an optimized or promoted configuration.
- A high probability of being within ±10 yards is not an exact-yard hit probability, and must be labeled as a range.
- The original Sunday is already inspected; this test supports diagnosis only. A promotion requires earlier-season walk-forward and an untouched forward evaluation.

## Game-by-game

### CIN @ BAL

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 8 | 1.625 | 2 | 22.5 |
| rawRound | 10 | 9 | 1 | 0 / 9 | 1.556 | 0 | null |
| diverse | 10 | 9 | 1 | 0 / 4 | 1.5 | 5 | 9.2 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| derrick henry (BAL) | rec_yds | 2 | 51.5% | 4 | 2 |
| justice hill (BAL) | rush_yds | 5 | 53.5% | 7 | 2 |
| justice hill (BAL) | rec_yds | 6 | 52.5% | 26 | 20 |
| drew sample (CIN) | rec_yds | 4 | 50.5% | 24 | 20 |
| joe burrow (CIN) | rush_yds | 10 | 50.5% | 12 | 2 |
| derrick henry (BAL) | atd | 1 | 59.0% | 0 | 1 |
| derrick henry (BAL) | rush_td | 1 | 57.3% | 0 | 1 |
| joe burrow (CIN) | pass_td | 1 | 72.2% | 4 | 3 |
| devontez walker (BAL) | rec | 1 | 62.3% | Unverified | — |
| josh cuevas (BAL) | rec | 1 | 63.7% | 2 | 1 |

### CLE @ TEN

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 2 / 8 | 1.75 | 2 | 61 |
| rawRound | 10 | 10 | 0 | 2 / 10 | 1.2 | 0 | null |
| diverse | 10 | 10 | 0 | 1 / 5 | 1.2 | 5 | 7.8 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| jaleel mclaughlin (CLE) | rec_yds | 4 | 50.5% | 0 | 4 |
| tony pollard (TEN) | rec_yds | 8 | 50.5% | 26 | 18 |
| jaleel mclaughlin (CLE) | rush_yds | 10 | 52.5% | 0 | 10 |
| daniel bellinger (TEN) | rec_yds | 7 | 51.5% | 4 | 3 |
| cam ward (TEN) | rush_yds | 9 | 52.5% | 5 | 4 |
| cam ward (TEN) | pass_td | 1 | 67.6% | 0 | 1 |
| daniel bellinger (TEN) | rec | 1 | 64.9% | 1 | 0 |
| jaleel mclaughlin (CLE) | rec | 1 | 64.1% | 0 | 1 |
| gunnar helm (TEN) | rec | 1 | 72.1% | 3 | 2 |
| elic ayomanor (TEN) | rec | 1 | 74.7% | 3 | 2 |

### DAL @ PHI

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 0 / 5 | 1.6 | 5 | 11.4 |
| rawRound | 10 | 9 | 1 | 0 / 9 | 1.333 | 0 | null |
| diverse | 10 | 10 | 0 | 0 / 5 | 1.4 | 5 | 24.2 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| brevyn spannford (DAL) | rec_yds | 9 | 50.5% | 11 | 2 |
| dak prescott (DAL) | rush_yds | 11 | 50.5% | 8 | 3 |
| dameon pierce (PHI) | rec_yds | 12 | 50.5% | 1 | 11 |
| javonte williams (DAL) | rec_yds | 14 | 51.5% | 0 | 14 |
| brevyn spannford (DAL) | rec | 1 | 67.2% | 2 | 1 |
| dak prescott (DAL) | pass_td | 1 | 73.7% | 3 | 2 |
| javonte williams (DAL) | rush_yds | 64 | 50.5% | 155 | 91 |
| darius cooper (PHI) | rec | 2 | 62.6% | 1 | 1 |
| dameon pierce (PHI) | rec | 2 | 60.8% | 1 | 1 |
| jake ferguson (DAL) | rec | 2 | 69.0% | 0 | 2 |

### DEN @ ARI

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 3 / 8 | 0.875 | 2 | 28 |
| rawRound | 10 | 10 | 0 | 3 / 10 | 0.9 | 0 | null |
| diverse | 10 | 10 | 0 | 2 / 5 | 0.8 | 5 | 10.6 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| jk dobbins (DEN) | rec_yds | 7 | 52.5% | 0 | 7 |
| tyler allgeier (ARI) | rec_yds | 8 | 50.5% | 30 | 22 |
| elijah higgins (ARI) | rec_yds | 10 | 50.5% | 17 | 7 |
| rj harvey (DEN) | rush_yds | 18 | 50.5% | 6 | 12 |
| jacoby brissett (ARI) | rush_yds | 11 | 50.5% | 16 | 5 |
| bo nix (DEN) | pass_td | 1 | 67.8% | 1 | 0 |
| troy franklin (DEN) | rec | 1 | 64.3% | 0 | 1 |
| jalen brooks (ARI) | rec | 1 | 66.5% | 1 | 0 |
| elijah higgins (ARI) | rec | 1 | 70.5% | 3 | 2 |
| jk dobbins (DEN) | rec | 1 | 73.8% | 0 | 1 |

### GB @ DET

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 6 | 1.5 | 4 | 22 |
| rawRound | 10 | 8 | 2 | 0 / 8 | 1.5 | 0 | null |
| diverse | 10 | 7 | 3 | 0 / 4 | 1 | 3 | 6.333 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| jared goff (DET) | rush_yds | 4 | 51.5% | -1 | 5 |
| sione vaki (DET) | rush_yds | 9 | 50.5% | 5 | 4 |
| brock wright (DET) | rec_yds | 7 | 51.5% | Unverified | — |
| marshawn lloyd (GB) | rec_yds | 5 | 52.5% | 15 | 10 |
| pierre strong (GB) | rec_yds | 8 | 50.5% | Unverified | — |
| jahmyr gibbs (DET) | rush_td | 1 | 62.1% | 0 | 1 |
| jahmyr gibbs (DET) | atd | 1 | 66.7% | 0 | 1 |
| jordan love (GB) | pass_td | 1 | 68.0% | 2 | 1 |
| brock wright (DET) | rec | 1 | 64.4% | Unverified | — |
| marshawn lloyd (GB) | rec | 1 | 67.0% | 2 | 1 |

### IND @ MIN

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 7 | 1.143 | 3 | 21 |
| rawRound | 10 | 10 | 0 | 2 / 10 | 0.9 | 0 | null |
| diverse | 10 | 10 | 0 | 1 / 5 | 0.8 | 5 | 15.8 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| mo aliecox (IND) | rec_yds | 3 | 51.5% | 0 | 3 |
| gavin bartholomew (MIN) | rec_yds | 6 | 51.5% | 17 | 11 |
| seth mcgowan (IND) | rush_yds | 10 | 51.5% | 46 | 36 |
| jauan jennings (MIN) | rec_yds | 8 | 51.5% | 34 | 26 |
| daniel jones (IND) | rush_yds | 10 | 50.5% | 13 | 3 |
| daniel jones (IND) | pass_td | 1 | 66.2% | 0 | 1 |
| jauan jennings (MIN) | rec | 1 | 63.7% | 2 | 1 |
| gavin bartholomew (MIN) | rec | 1 | 61.6% | 1 | 0 |
| tai felton (MIN) | rec | 1 | 63.1% | 0 | 1 |
| will mallory (IND) | rec | 1 | 68.7% | 0 | 1 |

### KC @ SEA

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 6 | 1.333 | 4 | 19.25 |
| rawRound | 10 | 10 | 0 | 6 / 10 | 0.4 | 0 | null |
| diverse | 10 | 10 | 0 | 2 / 5 | 0.6 | 5 | 10 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| emanuel wilson (SEA) | rec_yds | 4 | 50.5% | 15 | 11 |
| george holani (SEA) | rec_yds | 3 | 52.5% | 12 | 9 |
| emmett johnson (KC) | rec_yds | 7 | 50.5% | 17 | 10 |
| emmett johnson (KC) | rush_yds | 9 | 51.5% | 0 | 9 |
| sam darnold (SEA) | rush_yds | 6 | 50.5% | 17 | 11 |
| patrick mahomes (KC) | pass_td | 1 | 66.4% | 0 | 1 |
| tory horton (SEA) | rec | 1 | 63.3% | 0 | 1 |
| george holani (SEA) | rec | 1 | 61.6% | 1 | 0 |
| emanuel wilson (SEA) | rec | 1 | 63.7% | 1 | 0 |
| emmett johnson (KC) | rec | 1 | 71.4% | 2 | 1 |

### LA @ LV

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 9 | 1 | 1 / 5 | 1.4 | 4 | 22 |
| rawRound | 10 | 10 | 0 | 2 / 10 | 1.5 | 0 | null |
| diverse | 10 | 10 | 0 | 2 / 5 | 1 | 5 | 18.4 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| matthew stafford (LA) | rush_yds | 2 | 51.5% | -3 | 5 |
| blake corum (LA) | rec_yds | 4 | 52.5% | 8 | 4 |
| davis allen (LA) | rec_yds | 2 | 51.5% | 20 | 18 |
| cody white (LV) | rec_yds | 3 | 50.5% | 4 | 1 |
| blake corum (LA) | rush_yds | 29 | 50.5% | 93 | 64 |
| matthew stafford (LA) | pass_td | 1 | 74.4% | 3 | 2 |
| jalen nailor (LV) | rec | 1 | 72.0% | 2 | 1 |
| konata mumpfield (LA) | rec | 1 | 74.0% | 1 | 0 |
| blake corum (LA) | rec | 1 | 64.0% | 1 | 0 |
| tre tucker (LV) | rec | 3 | 62.2% | 5 | 2 |

### MIA @ NYJ

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 0 / 6 | 2.333 | 4 | 38.25 |
| rawRound | 10 | 9 | 1 | 1 / 9 | 1.667 | 0 | null |
| diverse | 10 | 7 | 3 | 1 / 2 | 1 | 5 | 22.8 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| ollie gordon (MIA) | rec_yds | 5 | 50.5% | 0 | 5 |
| braelon allen (NYJ) | rec_yds | 9 | 50.5% | 30 | 21 |
| will kacmarek (MIA) | rec_yds | 7 | 50.5% | Unverified | — |
| geno smith (NYJ) | rush_yds | 7 | 50.5% | 0 | 7 |
| jaylen wright (MIA) | rush_yds | 15 | 51.5% | 8 | 7 |
| geno smith (NYJ) | pass_td | 1 | 65.7% | 3 | 2 |
| will kacmarek (MIA) | rec | 1 | 63.5% | Unverified | — |
| ollie gordon (MIA) | rec | 1 | 66.0% | 1 | 0 |
| tim patrick (NYJ) | rec | 1 | 56.9% | Unverified | — |
| geno smith (NYJ) | pass_yds | 213 | 50.5% | 287 | 74 |

### NE @ CHI

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 0 / 5 | 2 | 5 | 33 |
| rawRound | 10 | 9 | 1 | 1 / 9 | 1.444 | 0 | null |
| diverse | 10 | 10 | 0 | 1 / 5 | 1 | 5 | 6.2 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| roschon johnson (CHI) | rec_yds | 4 | 51.5% | 0 | 4 |
| kyle williams (NE) | rec_yds | 8 | 51.5% | 0 | 8 |
| dandre swift (CHI) | rec_yds | 11 | 51.5% | 12 | 1 |
| roschon johnson (CHI) | rush_yds | 18 | 51.5% | 13 | 5 |
| treveyon henderson (NE) | rush_yds | 22 | 51.5% | 9 | 13 |
| drake maye (NE) | pass_td | 1 | 71.2% | 2 | 1 |
| kyle williams (NE) | rec | 1 | 62.7% | 0 | 1 |
| efton chism (NE) | rec | 1 | 70.2% | 1 | 0 |
| cole kmet (CHI) | rec | 1 | 76.7% | 3 | 2 |
| roschon johnson (CHI) | rec | 1 | 62.8% | 0 | 1 |

### NYG @ HOU

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 8 | 1.125 | 2 | 14 |
| rawRound | 10 | 9 | 1 | 3 / 9 | 1.222 | 0 | null |
| diverse | 10 | 8 | 2 | 2 / 4 | 0.75 | 4 | 4.5 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| tyrone tracy (NYG) | rec_yds | 3 | 50.5% | 2 | 1 |
| devin singletary (NYG) | rec_yds | 4 | 52.5% | 14 | 10 |
| foster moreau (HOU) | rec_yds | 7 | 50.5% | Unverified | — |
| tyrone tracy (NYG) | rush_yds | 15 | 52.5% | 15 | 0 |
| cj stroud (HOU) | rush_yds | 11 | 51.5% | 4 | 7 |
| cj stroud (HOU) | pass_td | 1 | 74.3% | 2 | 1 |
| foster moreau (HOU) | rec | 1 | 63.2% | Unverified | — |
| tyrone tracy (NYG) | rec | 1 | 59.8% | 1 | 0 |
| devin singletary (NYG) | rec | 1 | 64.8% | 3 | 2 |
| marvin harrison (HOU) | rec | 1 | 70.8% | 1 | 0 |

### PIT @ NO

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 2 / 6 | 1.5 | 4 | 14.75 |
| rawRound | 10 | 10 | 0 | 4 / 10 | 0.8 | 0 | null |
| diverse | 10 | 9 | 1 | 2 / 5 | 1 | 4 | 6.5 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| kendre miller (NO) | rec_yds | 2 | 51.5% | 22 | 20 |
| oscar delp (NO) | rec_yds | 3 | 50.5% | 2 | 1 |
| noah fant (NO) | rec_yds | 10 | 51.5% | 11 | 1 |
| cj donaldson (NO) | rush_yds | 12 | 50.5% | Unverified | — |
| tyler shough (NO) | rush_yds | 11 | 52.5% | 7 | 4 |
| tyler shough (NO) | pass_td | 1 | 70.3% | 1 | 0 |
| kendre miller (NO) | rec | 1 | 58.4% | 3 | 2 |
| noah fant (NO) | rec | 1 | 71.3% | 2 | 1 |
| bryce lance (NO) | rec | 2 | 57.7% | 2 | 0 |
| juwan johnson (NO) | rec | 3 | 56.9% | 1 | 2 |

### SF @ ATL

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 4 | 1 | 6 | 16.167 |
| rawRound | 10 | 10 | 0 | 3 / 10 | 1.2 | 0 | null |
| diverse | 10 | 10 | 0 | 2 / 5 | 1.2 | 5 | 13.6 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| luke farrell (SF) | rec_yds | 1 | 50.5% | 14 | 13 |
| kyle juszczyk (SF) | rec_yds | 10 | 50.5% | 11 | 1 |
| zachariah branch (ATL) | rec_yds | 9 | 51.5% | 9 | 0 |
| michael penix (ATL) | rush_yds | 9 | 51.5% | -1 | 10 |
| kaelon black (SF) | rush_yds | 19 | 51.5% | 63 | 44 |
| michael penix (ATL) | pass_td | 1 | 58.3% | 3 | 2 |
| zachariah branch (ATL) | rec | 1 | 66.4% | 1 | 0 |
| jacob cowing (SF) | rec | 1 | 59.0% | 3 | 2 |
| jordan watkins (SF) | rec | 1 | 62.0% | 3 | 2 |
| brandin cooks (SF) | rec | 1 | 76.3% | 1 | 0 |

### TB @ CAR

| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |
|:--|--:|--:|--:|--:|--:|--:|--:|
| legacy | 10 | 10 | 0 | 1 / 7 | 1.571 | 3 | 41.667 |
| rawRound | 10 | 10 | 0 | 1 / 10 | 1.4 | 0 | null |
| diverse | 10 | 10 | 0 | 1 / 5 | 0.8 | 5 | 26.8 |

**Potential diversified selection, model median (not easier milestone):**

| Player | Market | Projected | P(at least projected) | Actual | Numerical error |
|:--|:--|--:|--:|--:|--:|
| kenny gainwell (TB) | rush_yds | 6 | 52.5% | 88 | 82 |
| mitchell evans (CAR) | rec_yds | 6 | 51.5% | 39 | 33 |
| bryce young (CAR) | rush_yds | 7 | 52.5% | 9 | 2 |
| kenny gainwell (TB) | rec_yds | 8 | 51.5% | 0 | 8 |
| brycen tremayne (CAR) | rec_yds | 9 | 50.5% | 0 | 9 |
| bryce young (CAR) | pass_td | 1 | 72.5% | 1 | 0 |
| mitchell evans (CAR) | rec | 1 | 62.0% | 2 | 1 |
| brycen tremayne (CAR) | rec | 1 | 63.3% | 0 | 1 |
| tez johnson (TB) | rec | 1 | 74.5% | 2 | 1 |
| john metchie (CAR) | rec | 1 | 72.7% | 2 | 1 |
