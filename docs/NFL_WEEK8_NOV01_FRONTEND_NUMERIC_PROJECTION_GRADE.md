# NFL Week 8 — Real frontend model projections versus final player statistics

**Correction to the earlier report:** This evaluates the **original model's rounded numerical MEDIAN**, NOT whether it cleared an easier 65%-probability target. A model median of 3 catches versus 10 actual is a 7-catch error, regardless of the probability of 1+ catch. The previous target hit rate is not a projection hit rate.

**Scope:** Original V2 T24 `SYSTEM PICKS` top 10 candidates per game, frozen Nov. 1, 2026 at 12:12 p.m. Eastern (17:12:34 UTC). Twelve games, 120 rank slots, 114 player stats verified and 6 unresolved. The historical source supports a reconstruction of what the frontend **would have been eligible to show** at that moment; there are no browser delivery/display logs to prove exactly what a phone rendered. Two games can be reordered by separately loaded QB-role evidence; those alternate lists are shown.

**Grade formula:** `round(model_median)` (nearest whole integer, 3.4→3 and 3.6→4) compared with final ESPN player statistic. `Δ=actual−predicted`; positive means underestimated, negative overestimated. Exact means literal numerical equality—not reaching a lower target. Yardage error is measured in yards; count error in receptions/TDs and never pooled into a common MAE.

**No unverified players were given an automatic zero:** a player entirely missing from ESPN's final player box score remains Unverified. A player listed in that box score with no event in the specific category is treated as 0. Player spelling/identity and source publishing cutoff are retained in the structured evidence.

## Overall numerical results

- **20/114 exact** rounded numerical forecasts (17.5%). The other 94 missed the actual integer result. 6 remain unverified.
- Count-based forecasts: **20/72 exact**, mean absolute error **1.7 count events**. Within one count: 37/72.
- Yardage forecasts: **0/42 exact**, mean absolute error **29.7 yards**. Within ten yards: 13/42.

| Market | Original | Verified | Exact projection | MAE | Average signed error |
|:---|---:|---:|---:|---:|---:|
| Receptions | 75 | 69 | 18/69 | 1.7 count | +0.6 count |
| Rushing yards | 11 | 11 | 0/11 | 35.5 yards | +27.8 yards |
| Receiving yards | 28 | 28 | 0/28 | 22.5 yards | +6.1 yards |
| Passing yards | 3 | 3 | 0/3 | 76 yards | -45.3 yards |
| Passing TDs | 3 | 3 | 2/3 | 0.7 count | +0.7 count |

## Game-by-game summary

| Matchup | Final | Verified / 10 | Exact projected stat | Count MAE | Yardage MAE |
|:--|:--|--:|--:|--:|--:|
| [ARI @ DAL](#ari-dal) | ARI 33 - DAL 30 | 8/10 | 1 | 1.8 | 36.5 |
| [ATL @ TB](#atl-tb) | ATL 0 - TB 16 | 10/10 | 1 | 1.8 | 100.3 |
| [BAL @ BUF](#bal-buf) | BAL 10 - BUF 36 | 10/10 | 2 | 1.6 | 13.3 |
| [CLE @ PIT](#cle-pit) | CLE 6 - PIT 27 | 10/10 | 2 | 2 | 7 |
| [IND @ JAX](#ind-jax) | IND 7 - JAX 42 | 10/10 | 2 | 1.5 | 15.3 |
| [KC @ DEN](#kc-den) | KC 24 - DEN 28 | 10/10 | 3 | 1.1 | 19 |
| [LAC @ LA](#lac-la) | LAC 9 - LA 24 | 10/10 | 1 | 1.4 | 15.6 |
| [LV @ NYJ](#lv-nyj) | LV 38 - NYJ 33 | 9/10 | 2 | 1.6 | 54 |
| [MIN @ DET](#min-det) | MIN 15 - DET 19 | 9/10 | 2 | 0.8 | 17.7 |
| [NE @ MIA](#ne-mia) | NE 24 - MIA 19 | 10/10 | 1 | 1.8 | 23 |
| [PHI @ WAS](#phi-was) | PHI 10 - WAS 27 | 8/10 | 3 | 0.8 | 9.3 |
| [TEN @ CIN](#ten-cin) | TEN 36 - CIN 43 | 10/10 | 0 | 3.3 | 15.3 |

---
## All 120 frontend-eligible projections, original numerical median vs actual final

### ARI @ DAL

**Final:** ARI 33 - DAL 30 · **Verified:** 8/10 · **Exact model predictions:** 1 · **Count MAE:** 1.8 · **Yards MAE:** 36.5

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| jake ferguson (DAL) | Receptions | 2 | **Unverified** | — | — |
| javonte williams (DAL) | Receptions | 2 | 1 | -1 | ✗ |
| tyler allgeier (ARI) | Rushing yards | 22 | 147 | +125 | ✗ |
| ryan flournoy (DAL) | Receiving yards | 43 | 38 | -5 | ✗ |
| jeremiyah love (ARI) | Receptions | 2 | 0 | -2 | ✗ |
| dak prescott (DAL) | Passing TDs | 1 | 1 | 0 | ✓ |
| jalen brooks (ARI) | Receptions | 1 | **Unverified** | — | — |
| kendrick bourne (ARI) | Receiving yards | 25 | 29 | +4 | ✗ |
| jeremiyah love (ARI) | Rushing yards | 35 | 23 | -12 | ✗ |
| tyler allgeier (ARI) | Receptions | 1 | 5 | +4 | ✗ |

---

### ATL @ TB

**Final:** ATL 0 - TB 16 · **Verified:** 10/10 · **Exact model predictions:** 1 · **Count MAE:** 1.8 · **Yards MAE:** 100.3

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| ted hurst (TB) | Receptions | 2 | 0 | -2 | ✗ |
| jahan dotson (ATL) | Receptions | 2 | 2 | 0 | ✓ |
| tez johnson (TB) | Receptions | 2 | 0 | -2 | ✗ |
| bijan robinson (ATL) | Receptions | 3 | 0 | -3 | ✗ |
| bucky irving (TB) | Receptions | 3 | 0 | -3 | ✗ |
| kyle pitts (ATL) | Receptions | 3 | 2 | -1 | ✗ |
| baker mayfield (TB) | Passing yards | 182 | 0 | -182 | ✗ |
| bucky irving (TB) | Rushing yards | 56 | 170 | +114 | ✗ |
| drake london (ATL) | Receiving yards | 63 | 8 | -55 | ✗ |
| chris godwin (TB) | Receiving yards | 50 | 0 | -50 | ✗ |

---

### BAL @ BUF

**Final:** BAL 10 - BUF 36 · **Verified:** 10/10 · **Exact model predictions:** 2 · **Count MAE:** 1.6 · **Yards MAE:** 13.3

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| jakobi lane (BAL) | Receptions | 2 | 1 | -1 | ✗ |
| rashod bateman (BAL) | Receptions | 2 | 1 | -1 | ✗ |
| mark andrews (BAL) | Receiving yards | 27 | 14 | -13 | ✗ |
| james cook (BUF) | Receptions | 2 | 2 | 0 | ✓ |
| dalton kincaid (BUF) | Receptions | 2 | 4 | +2 | ✗ |
| zay flowers (BAL) | Receptions | 4 | 0 | -4 | ✗ |
| josh allen (BUF) | Rushing yards | 26 | 30 | +4 | ✗ |
| keon coleman (BUF) | Receiving yards | 27 | 4 | -23 | ✗ |
| justice hill (BAL) | Receptions | 1 | 4 | +3 | ✗ |
| dawson knox (BUF) | Receptions | 1 | 1 | 0 | ✓ |

#### Conditional alternative if QB role warning excluded BAL

**This is a second possible frontend ranking. It is not added to the 120 baseline rows, and we cannot prove whether the role feed loaded on your phone.**

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| james cook (BUF) | Receptions | 2 | 2 | 0 | ✓ |
| dalton kincaid (BUF) | Receptions | 2 | 4 | +2 | ✗ |
| josh allen (BUF) | Rushing yards | 26 | 30 | +4 | ✗ |
| keon coleman (BUF) | Receiving yards | 27 | 4 | -23 | ✗ |
| dawson knox (BUF) | Receptions | 1 | 1 | 0 | ✓ |
| james cook (BUF) | Rushing yards | 76 | 80 | +4 | ✗ |
| khalil shakir (BUF) | Receiving yards | 33 | 64 | +31 | ✗ |
| keon coleman (BUF) | Receptions | 2 | 1 | -1 | ✗ |
| skyler bell (BUF) | Receptions | 1 | **Unverified** | — | — |
| ty johnson (BUF) | Receptions | 1 | 3 | +2 | ✗ |

---

### CLE @ PIT

**Final:** CLE 6 - PIT 27 · **Verified:** 10/10 · **Exact model predictions:** 2 · **Count MAE:** 2 · **Yards MAE:** 7

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| quinshon judkins (CLE) | Receptions | 2 | 2 | 0 | ✓ |
| jerry jeudy (CLE) | Receptions | 2 | 0 | -2 | ✗ |
| rico dowdle (PIT) | Receptions | 2 | 0 | -2 | ✗ |
| darnell washington (PIT) | Receptions | 2 | 3 | +1 | ✗ |
| denzel boston (CLE) | Receptions | 3 | 6 | +3 | ✗ |
| kc concepcion (CLE) | Receptions | 3 | 3 | 0 | ✓ |
| harold fannin (CLE) | Receptions | 3 | 10 | +7 | ✗ |
| pat freiermuth (PIT) | Receiving yards | 28 | 35 | +7 | ✗ |
| jaylen warren (PIT) | Receptions | 3 | 1 | -2 | ✗ |
| pat freiermuth (PIT) | Receptions | 3 | 2 | -1 | ✗ |

---

### IND @ JAX

**Final:** IND 7 - JAX 42 · **Verified:** 10/10 · **Exact model predictions:** 2 · **Count MAE:** 1.5 · **Yards MAE:** 15.3

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| bhayshul tuten (JAX) | Receptions | 2 | 2 | 0 | ✓ |
| chris rodriguez (JAX) | Rushing yards | 26 | 41 | +15 | ✗ |
| keenan allen (IND) | Receptions | 3 | 7 | +4 | ✗ |
| laquon treadwell (IND) | Receptions | 2 | 1 | -1 | ✗ |
| tyler warren (IND) | Receiving yards | 39 | 18 | -21 | ✗ |
| brenton strange (JAX) | Receptions | 4 | 2 | -2 | ✗ |
| tyler warren (IND) | Receptions | 4 | 4 | 0 | ✓ |
| trevor lawrence (JAX) | Passing yards | 199 | 210 | +11 | ✗ |
| josh downs (IND) | Receiving yards | 37 | 23 | -14 | ✗ |
| trevor lawrence (JAX) | Passing TDs | 1 | 3 | +2 | ✗ |

---

### KC @ DEN

**Final:** KC 24 - DEN 28 · **Verified:** 10/10 · **Exact model predictions:** 3 · **Count MAE:** 1.1 · **Yards MAE:** 19

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| xavier worthy (KC) | Receptions | 3 | 3 | 0 | ✓ |
| jonah coleman (DEN) | Receptions | 2 | 4 | +2 | ✗ |
| marvin mims (DEN) | Receptions | 2 | 2 | 0 | ✓ |
| noah gray (KC) | Receptions | 1 | 2 | +1 | ✗ |
| kenneth walker (KC) | Rushing yards | 72 | 69 | -3 | ✗ |
| rashee rice (KC) | Receiving yards | 30 | 53 | +23 | ✗ |
| courtland sutton (DEN) | Receptions | 3 | 4 | +1 | ✗ |
| rashee rice (KC) | Receptions | 3 | 7 | +4 | ✗ |
| troy franklin (DEN) | Receptions | 1 | 1 | 0 | ✓ |
| travis kelce (KC) | Receiving yards | 36 | 67 | +31 | ✗ |

---

### LAC @ LA

**Final:** LAC 9 - LA 24 · **Verified:** 10/10 · **Exact model predictions:** 1 · **Count MAE:** 1.4 · **Yards MAE:** 15.6

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| charlie kolar (LAC) | Receptions | 2 | 1 | -1 | ✗ |
| oronde gadsden (LAC) | Receptions | 2 | 5 | +3 | ✗ |
| davis allen (LA) | Receptions | 2 | 2 | 0 | ✓ |
| kyren williams (LA) | Receiving yards | 27 | 3 | -24 | ✗ |
| quentin johnston (LAC) | Receiving yards | 31 | 37 | +6 | ✗ |
| blake corum (LA) | Rushing yards | 37 | 73 | +36 | ✗ |
| konata mumpfield (LA) | Receptions | 2 | 0 | -2 | ✗ |
| tre harris (LAC) | Receiving yards | 29 | 31 | +2 | ✗ |
| justin herbert (LAC) | Rushing yards | 25 | 15 | -10 | ✗ |
| omarion hampton (LAC) | Receptions | 1 | 2 | +1 | ✗ |

---

### LV @ NYJ

**Final:** LV 38 - NYJ 33 · **Verified:** 9/10 · **Exact model predictions:** 2 · **Count MAE:** 1.6 · **Yards MAE:** 54

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| omar cooper (NYJ) | Receptions | 2 | **Unverified** | — | — |
| braelon allen (NYJ) | Receptions | 2 | 2 | 0 | ✓ |
| tre tucker (LV) | Receptions | 3 | 0 | -3 | ✗ |
| michael mayer (LV) | Receiving yards | 28 | 53 | +25 | ✗ |
| ashton jeanty (LV) | Receiving yards | 26 | 64 | +38 | ✗ |
| michael mayer (LV) | Receptions | 3 | 5 | +2 | ✗ |
| adonai mitchell (NYJ) | Receiving yards | 30 | 142 | +112 | ✗ |
| jalen nailor (LV) | Receptions | 1 | 4 | +3 | ✗ |
| kenyon sadiq (NYJ) | Receptions | 1 | 1 | 0 | ✓ |
| brock bowers (LV) | Receiving yards | 51 | 92 | +41 | ✗ |

---

### MIN @ DET

**Final:** MIN 15 - DET 19 · **Verified:** 9/10 · **Exact model predictions:** 2 · **Count MAE:** 0.8 · **Yards MAE:** 17.7

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| tj hockenson (MIN) | Receiving yards | 28 | 58 | +30 | ✗ |
| isaac teslaa (DET) | Receptions | 2 | **Unverified** | — | — |
| aaron jones (MIN) | Rushing yards | 39 | 22 | -17 | ✗ |
| jordan addison (MIN) | Receptions | 3 | 3 | 0 | ✓ |
| justin jefferson (MIN) | Receptions | 4 | 5 | +1 | ✗ |
| tj hockenson (MIN) | Receptions | 3 | 4 | +1 | ✗ |
| aaron jones (MIN) | Receptions | 1 | 2 | +1 | ✗ |
| jahmyr gibbs (DET) | Receptions | 4 | 2 | -2 | ✗ |
| jared goff (DET) | Passing TDs | 1 | 1 | 0 | ✓ |
| sam laporta (DET) | Receiving yards | 39 | 33 | -6 | ✗ |

---

### NE @ MIA

**Final:** NE 24 - MIA 19 · **Verified:** 10/10 · **Exact model predictions:** 1 · **Count MAE:** 1.8 · **Yards MAE:** 23

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| eli raridon (NE) | Receptions | 2 | 1 | -1 | ✗ |
| chris bell (MIA) | Receptions | 2 | 4 | +2 | ✗ |
| malik washington (MIA) | Receptions | 3 | 5 | +2 | ✗ |
| demario douglas (NE) | Receptions | 3 | 3 | 0 | ✓ |
| ollie gordon (MIA) | Rushing yards | 48 | 69 | +21 | ✗ |
| rhamondre stevenson (NE) | Rushing yards | 49 | 82 | +33 | ✗ |
| caleb douglas (MIA) | Receiving yards | 27 | 43 | +16 | ✗ |
| hunter henry (NE) | Receiving yards | 40 | 30 | -10 | ✗ |
| malik willis (MIA) | Passing yards | 176 | 211 | +35 | ✗ |
| efton chism (NE) | Receptions | 1 | 5 | +4 | ✗ |

---

### PHI @ WAS

**Final:** PHI 10 - WAS 27 · **Verified:** 8/10 · **Exact model predictions:** 3 · **Count MAE:** 0.8 · **Yards MAE:** 9.3

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| marquise brown (PHI) | Receptions | 2 | **Unverified** | — | — |
| antonio williams (WAS) | Receptions | 2 | 5 | +3 | ✗ |
| dameon pierce (PHI) | Receptions | 2 | **Unverified** | — | — |
| darius cooper (PHI) | Receptions | 2 | 2 | 0 | ✓ |
| stefon diggs (WAS) | Receptions | 3 | 3 | 0 | ✓ |
| chig okonkwo (WAS) | Receiving yards | 28 | 32 | +4 | ✗ |
| rachaad white (WAS) | Receptions | 2 | 2 | 0 | ✓ |
| makai lemon (PHI) | Receiving yards | 41 | 57 | +16 | ✗ |
| chig okonkwo (WAS) | Receptions | 3 | 2 | -1 | ✗ |
| dallas goedert (PHI) | Receiving yards | 38 | 30 | -8 | ✗ |

#### Conditional alternative if QB role warning excluded WAS

**This is a second possible frontend ranking. It is not added to the 120 baseline rows, and we cannot prove whether the role feed loaded on your phone.**

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| marquise brown (PHI) | Receptions | 2 | **Unverified** | — | — |
| dameon pierce (PHI) | Receptions | 2 | **Unverified** | — | — |
| darius cooper (PHI) | Receptions | 2 | 2 | 0 | ✓ |
| makai lemon (PHI) | Receiving yards | 41 | 57 | +16 | ✗ |
| dallas goedert (PHI) | Receiving yards | 38 | 30 | -8 | ✗ |
| dallas goedert (PHI) | Receptions | 4 | 4 | 0 | ✓ |
| marquise brown (PHI) | Receiving yards | 24 | **Unverified** | — | — |
| makai lemon (PHI) | Receptions | 4 | 6 | +2 | ✗ |
| dameon pierce (PHI) | Rushing yards | 43 | **Unverified** | — | — |
| saquon barkley (PHI) | Rushing yards | 17 | 30 | +13 | ✗ |

---

### TEN @ CIN

**Final:** TEN 36 - CIN 43 · **Verified:** 10/10 · **Exact model predictions:** 0 · **Count MAE:** 3.3 · **Yards MAE:** 15.3

| Player (team) | Stat | Projected | Actual | Actual − projection | Exact? |
|:---|:---|---:|---:|---:|:---:|
| gunnar helm (TEN) | Receptions | 2 | 5 | +3 | ✗ |
| tee higgins (CIN) | Receptions | 4 | 10 | +6 | ✗ |
| dohnte meyers (CIN) | Receptions | 2 | 3 | +1 | ✗ |
| wandale robinson (TEN) | Receiving yards | 42 | 57 | +15 | ✗ |
| wandale robinson (TEN) | Receptions | 4 | 6 | +2 | ✗ |
| elic ayomanor (TEN) | Receiving yards | 26 | 34 | +8 | ✗ |
| jamarr chase (CIN) | Receptions | 5 | 11 | +6 | ✗ |
| daniel bellinger (TEN) | Receptions | 1 | 3 | +2 | ✗ |
| chase brown (CIN) | Receiving yards | 23 | 46 | +23 | ✗ |
| mike gesicki (CIN) | Receptions | 1 | 4 | +3 | ✗ |

---

## Evidence and limitations

- [Original pregame V2 compact publication](https://github.com/deshawnclark116-prog/mlb-picks2/blob/74f49b5ca5e3/docs/nfl_phase1_shadow.json), with matching pregame source simulation batches.
- [Stored frontend top-10 reconstruction](./nfl_week8_nov1_frontend_reconstructed_120.json).
- [Original actual-stat observations and verification statuses](./nfl_week8_nov1_frontend_reconstructed_120_graded.json).
- [This report as structured numerical accuracy JSON](./nfl_week8_nov1_frontend_numeric_accuracy.json).
- The 65% model target probability plays **no role** in any projection accuracy score shown in this report.
- No claim that the user's exact device screen was logged. Historical frontend views are not fully recoverable without delivery logs.

