# NFL November 1, 2026 — Frontend 10-per-game reconstruction and actual final results

**This is a reconstructed list of what the default NFL V2 SYSTEM PICKS screen was eligible to show at 12:12 p.m. Eastern on November 1, not a recording of the exact cards loaded on your device.** The frontend refreshes; we have no per-user render logs. Two games have a second possible ten-player ranking if the independently loaded quarterback-role warning was active.

**Important correction:** The old 316-projection report used the **weekly backend model**, not the frontend's V2 top-ten selector. It is not valid to call that older result the frontend record.

**Default V2 reconstruction:** 120 slots across 12 games, 114 verified final player statistics, 6 unverified. 95/114 verified predictions reached their separately selected easy model target (83.3%); the model's average published probability for those targets was 77.5%. These are **target-event hits, not proof of accuracy of the displayed model median**, and not evidence of a sports betting edge.

**Markets selected:** 75 receptions, 28 receiving-yard projections, 11 rushing-yard projections, three passing-yard projections, three passing-TD forecasts. No sacks or anytime-TD picks in this default 120-entry set; three passing touchdowns are eligible (the market filter includes TD).

**Numerical median errors are graded separately** in [the machine-readable result](./nfl_week8_nov1_frontend_reconstructed_120_graded.json).

**Interpretation:** A player with model median of 3 receptions and a listed 80% chance of 1+ reception is only being scored for 1+ here. It would be dishonest to call that a correct forecast of 3 receptions.

**Provenance:** [frozen V2 pregame compact source](https://github.com/deshawnclark116-prog/mlb-picks2/blob/74f49b5ca5e3/docs/nfl_phase1_shadow.json), with separately stored pregame full simulation batches. Rank: 65%+ target, 75%+ activity, offensive markets, descending model P(target), cap 10. Role-gated warnings are retained as an alternate scenario, not retroactively assumed to have loaded.

## Game-by-game overview

| Matchup | Final | Eligible selections | Verified | Unverified | Threshold hits |
|:--|:--|--:|--:|--:|--:|
| [ARI @ DAL](#ari-dal) | ARI 33 - DAL 30 | 10 | 8 | 2 | 7 |
| [ATL @ TB](#atl-tb) | ATL 0 - TB 16 | 10 | 10 | 0 | 3 |
| [BAL @ BUF](#bal-buf) | BAL 10 - BUF 36 | 10 | 10 | 0 | 8 |
| [CLE @ PIT](#cle-pit) | CLE 6 - PIT 27 | 10 | 10 | 0 | 7 |
| [IND @ JAX](#ind-jax) | IND 7 - JAX 42 | 10 | 10 | 0 | 8 |
| [KC @ DEN](#kc-den) | KC 24 - DEN 28 | 10 | 10 | 0 | 10 |
| [LAC @ LA](#lac-la) | LAC 9 - LA 24 | 10 | 10 | 0 | 8 |
| [LV @ NYJ](#lv-nyj) | LV 38 - NYJ 33 | 10 | 9 | 1 | 8 |
| [MIN @ DET](#min-det) | MIN 15 - DET 19 | 10 | 9 | 1 | 8 |
| [NE @ MIA](#ne-mia) | NE 24 - MIA 19 | 10 | 10 | 0 | 10 |
| [PHI @ WAS](#phi-was) | PHI 10 - WAS 27 | 10 | 8 | 2 | 8 |
| [TEN @ CIN](#ten-cin) | TEN 36 - CIN 43 | 10 | 10 | 0 | 10 |

---

## ARI @ DAL

**Final: ARI 33 - DAL 30.** Baseline top ten: 7 source-target hits, 1 misses, 2 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | jake ferguson (DAL) | Receptions | 2 | 1+ at 84.9% | Unverified | Unverified |
| 2 | javonte williams (DAL) | Receptions | 2 | 1+ at 84.0% | 1 | Hit |
| 3 | tyler allgeier (ARI) | Rushing yds | 22 | 10+ at 77.0% | 147 | Hit |
| 4 | ryan flournoy (DAL) | Receiving yds | 43 | 20+ at 76.0% | 38 | Hit |
| 5 | jeremiyah love (ARI) | Receptions | 2 | 1+ at 75.2% | 0 | Miss |
| 6 | dak prescott (DAL) | Passing TDs | 1 | 1+ at 75.1% | 1 | Hit |
| 7 | jalen brooks (ARI) | Receptions | 1 | 1+ at 74.5% | Unverified | Unverified |
| 8 | kendrick bourne (ARI) | Receiving yds | 25 | 10+ at 74.0% | 29 | Hit |
| 9 | jeremiyah love (ARI) | Rushing yds | 35 | 20+ at 74.0% | 23 | Hit |
| 10 | tyler allgeier (ARI) | Receptions | 1 | 1+ at 73.7% | 5 | Hit |

---

## ATL @ TB

**Final: ATL 0 - TB 16.** Baseline top ten: 3 source-target hits, 7 misses, 0 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | ted hurst (TB) | Receptions | 2 | 1+ at 85.2% | 0 | Miss |
| 2 | jahan dotson (ATL) | Receptions | 2 | 1+ at 84.2% | 2 | Hit |
| 3 | tez johnson (TB) | Receptions | 2 | 1+ at 82.1% | 0 | Miss |
| 4 | bijan robinson (ATL) | Receptions | 3 | 2+ at 77.9% | 0 | Miss |
| 5 | bucky irving (TB) | Receptions | 3 | 2+ at 77.3% | 0 | Miss |
| 6 | kyle pitts (ATL) | Receptions | 3 | 2+ at 76.3% | 2 | Hit |
| 7 | baker mayfield (TB) | Passing yds | 181.9 | 125+ at 75.0% | 0 | Miss |
| 8 | bucky irving (TB) | Rushing yds | 56 | 40+ at 72.0% | 170 | Hit |
| 9 | drake london (ATL) | Receiving yds | 63 | 40+ at 72.0% | 8 | Miss |
| 10 | chris godwin (TB) | Receiving yds | 50 | 30+ at 72.0% | 0 | Miss |

---

## BAL @ BUF

**Final: BAL 10 - BUF 36.** Baseline top ten: 8 source-target hits, 2 misses, 0 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | jakobi lane (BAL) | Receptions | 2 | 1+ at 83.0% | 1 | Hit |
| 2 | rashod bateman (BAL) | Receptions | 2 | 1+ at 78.7% | 1 | Hit |
| 3 | mark andrews (BAL) | Receiving yds | 27 | 10+ at 78.0% | 14 | Hit |
| 4 | james cook (BUF) | Receptions | 2 | 1+ at 77.8% | 2 | Hit |
| 5 | dalton kincaid (BUF) | Receptions | 2 | 1+ at 76.6% | 4 | Hit |
| 6 | zay flowers (BAL) | Receptions | 4 | 3+ at 76.5% | 0 | Miss |
| 7 | josh allen (BUF) | Rushing yds | 26 | 10+ at 76.0% | 30 | Hit |
| 8 | keon coleman (BUF) | Receiving yds | 27 | 10+ at 75.0% | 4 | Miss |
| 9 | justice hill (BAL) | Receptions | 1 | 1+ at 73.7% | 4 | Hit |
| 10 | dawson knox (BUF) | Receptions | 1 | 1+ at 72.6% | 1 | Hit |

### Alternative ranking when QB-role warnings excluded BAL

Role-conditioned top ten: 7 hits, 2 misses, 1 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | james cook (BUF) | Receptions | 2 | 1+ at 77.8% | 2 | Hit |
| 2 | dalton kincaid (BUF) | Receptions | 2 | 1+ at 76.6% | 4 | Hit |
| 3 | josh allen (BUF) | Rushing yds | 26 | 10+ at 76.0% | 30 | Hit |
| 4 | keon coleman (BUF) | Receiving yds | 27 | 10+ at 75.0% | 4 | Miss |
| 5 | dawson knox (BUF) | Receptions | 1 | 1+ at 72.6% | 1 | Hit |
| 6 | james cook (BUF) | Rushing yds | 76 | 60+ at 68.0% | 80 | Hit |
| 7 | khalil shakir (BUF) | Receiving yds | 33 | 20+ at 68.0% | 64 | Hit |
| 8 | keon coleman (BUF) | Receptions | 2 | 2+ at 67.0% | 1 | Miss |
| 9 | skyler bell (BUF) | Receptions | 1 | 1+ at 66.7% | Unverified | Unverified |
| 10 | ty johnson (BUF) | Receptions | 1 | 1+ at 66.4% | 3 | Hit |

---

## CLE @ PIT

**Final: CLE 6 - PIT 27.** Baseline top ten: 7 source-target hits, 3 misses, 0 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | quinshon judkins (CLE) | Receptions | 2 | 1+ at 85.1% | 2 | Hit |
| 2 | jerry jeudy (CLE) | Receptions | 2 | 1+ at 84.2% | 0 | Miss |
| 3 | rico dowdle (PIT) | Receptions | 2 | 1+ at 83.8% | 0 | Miss |
| 4 | darnell washington (PIT) | Receptions | 2 | 1+ at 83.4% | 3 | Hit |
| 5 | denzel boston (CLE) | Receptions | 3 | 2+ at 79.9% | 6 | Hit |
| 6 | kc concepcion (CLE) | Receptions | 3 | 2+ at 79.8% | 3 | Hit |
| 7 | harold fannin (CLE) | Receptions | 3 | 2+ at 79.2% | 10 | Hit |
| 8 | pat freiermuth (PIT) | Receiving yds | 28 | 10+ at 79.0% | 35 | Hit |
| 9 | jaylen warren (PIT) | Receptions | 3 | 2+ at 77.0% | 1 | Miss |
| 10 | pat freiermuth (PIT) | Receptions | 3 | 2+ at 76.3% | 2 | Hit |

---

## IND @ JAX

**Final: IND 7 - JAX 42.** Baseline top ten: 8 source-target hits, 2 misses, 0 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | bhayshul tuten (JAX) | Receptions | 2 | 1+ at 83.2% | 2 | Hit |
| 2 | chris rodriguez (JAX) | Rushing yds | 26 | 10+ at 82.0% | 41 | Hit |
| 3 | keenan allen (IND) | Receptions | 3 | 2+ at 80.1% | 7 | Hit |
| 4 | laquon treadwell (IND) | Receptions | 2 | 1+ at 77.9% | 1 | Hit |
| 5 | tyler warren (IND) | Receiving yds | 39 | 20+ at 76.0% | 18 | Miss |
| 6 | brenton strange (JAX) | Receptions | 4 | 3+ at 75.5% | 2 | Miss |
| 7 | tyler warren (IND) | Receptions | 4 | 3+ at 75.4% | 4 | Hit |
| 8 | trevor lawrence (JAX) | Passing yds | 199.3 | 150+ at 73.0% | 210 | Hit |
| 9 | josh downs (IND) | Receiving yds | 37 | 20+ at 72.0% | 23 | Hit |
| 10 | trevor lawrence (JAX) | Passing TDs | 1 | 1+ at 71.4% | 3 | Hit |

---

## KC @ DEN

**Final: KC 24 - DEN 28.** Baseline top ten: 10 source-target hits, 0 misses, 0 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | xavier worthy (KC) | Receptions | 3 | 2+ at 78.2% | 3 | Hit |
| 2 | jonah coleman (DEN) | Receptions | 2 | 1+ at 78.1% | 4 | Hit |
| 3 | marvin mims (DEN) | Receptions | 2 | 1+ at 76.4% | 2 | Hit |
| 4 | noah gray (KC) | Receptions | 1 | 1+ at 76.3% | 2 | Hit |
| 5 | kenneth walker (KC) | Rushing yds | 71.9 | 50+ at 76.0% | 69 | Hit |
| 6 | rashee rice (KC) | Receiving yds | 30 | 10+ at 76.0% | 53 | Hit |
| 7 | courtland sutton (DEN) | Receptions | 3 | 2+ at 75.9% | 4 | Hit |
| 8 | rashee rice (KC) | Receptions | 3 | 2+ at 74.7% | 7 | Hit |
| 9 | troy franklin (DEN) | Receptions | 1 | 1+ at 72.1% | 1 | Hit |
| 10 | travis kelce (KC) | Receiving yds | 36 | 20+ at 72.0% | 67 | Hit |

---

## LAC @ LA

**Final: LAC 9 - LA 24.** Baseline top ten: 8 source-target hits, 2 misses, 0 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | charlie kolar (LAC) | Receptions | 2 | 1+ at 84.3% | 1 | Hit |
| 2 | oronde gadsden (LAC) | Receptions | 2 | 1+ at 83.6% | 5 | Hit |
| 3 | davis allen (LA) | Receptions | 2 | 1+ at 82.8% | 2 | Hit |
| 4 | kyren williams (LA) | Receiving yds | 27.3 | 10+ at 80.0% | 3 | Miss |
| 5 | quentin johnston (LAC) | Receiving yds | 31.3 | 10+ at 78.0% | 37 | Hit |
| 6 | blake corum (LA) | Rushing yds | 37 | 20+ at 78.0% | 73 | Hit |
| 7 | konata mumpfield (LA) | Receptions | 2 | 1+ at 76.4% | 0 | Miss |
| 8 | tre harris (LAC) | Receiving yds | 29 | 10+ at 76.0% | 31 | Hit |
| 9 | justin herbert (LAC) | Rushing yds | 25 | 10+ at 75.0% | 15 | Hit |
| 10 | omarion hampton (LAC) | Receptions | 1 | 1+ at 74.9% | 2 | Hit |

---

## LV @ NYJ

**Final: LV 38 - NYJ 33.** Baseline top ten: 8 source-target hits, 1 misses, 1 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | omar cooper (NYJ) | Receptions | 2 | 1+ at 84.8% | Unverified | Unverified |
| 2 | braelon allen (NYJ) | Receptions | 2 | 1+ at 81.8% | 2 | Hit |
| 3 | tre tucker (LV) | Receptions | 3 | 2+ at 80.7% | 0 | Miss |
| 4 | michael mayer (LV) | Receiving yds | 28 | 10+ at 80.0% | 53 | Hit |
| 5 | ashton jeanty (LV) | Receiving yds | 25.9 | 10+ at 78.0% | 64 | Hit |
| 6 | michael mayer (LV) | Receptions | 3 | 2+ at 77.5% | 5 | Hit |
| 7 | adonai mitchell (NYJ) | Receiving yds | 30 | 10+ at 77.0% | 142 | Hit |
| 8 | jalen nailor (LV) | Receptions | 1 | 1+ at 75.2% | 4 | Hit |
| 9 | kenyon sadiq (NYJ) | Receptions | 1 | 1+ at 75.0% | 1 | Hit |
| 10 | brock bowers (LV) | Receiving yds | 51 | 30+ at 74.0% | 92 | Hit |

---

## MIN @ DET

**Final: MIN 15 - DET 19.** Baseline top ten: 8 source-target hits, 1 misses, 1 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | tj hockenson (MIN) | Receiving yds | 28 | 10+ at 80.0% | 58 | Hit |
| 2 | isaac teslaa (DET) | Receptions | 2 | 1+ at 79.3% | Unverified | Unverified |
| 3 | aaron jones (MIN) | Rushing yds | 38.9 | 20+ at 79.0% | 22 | Hit |
| 4 | jordan addison (MIN) | Receptions | 3 | 2+ at 77.0% | 3 | Hit |
| 5 | justin jefferson (MIN) | Receptions | 4 | 3+ at 76.6% | 5 | Hit |
| 6 | tj hockenson (MIN) | Receptions | 3 | 2+ at 76.5% | 4 | Hit |
| 7 | aaron jones (MIN) | Receptions | 1 | 1+ at 76.0% | 2 | Hit |
| 8 | jahmyr gibbs (DET) | Receptions | 4 | 3+ at 76.0% | 2 | Miss |
| 9 | jared goff (DET) | Passing TDs | 1 | 1+ at 75.2% | 1 | Hit |
| 10 | sam laporta (DET) | Receiving yds | 39 | 20+ at 75.0% | 33 | Hit |

---

## NE @ MIA

**Final: NE 24 - MIA 19.** Baseline top ten: 10 source-target hits, 0 misses, 0 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | eli raridon (NE) | Receptions | 2 | 1+ at 85.9% | 1 | Hit |
| 2 | chris bell (MIA) | Receptions | 2 | 1+ at 82.0% | 4 | Hit |
| 3 | malik washington (MIA) | Receptions | 3 | 2+ at 77.8% | 5 | Hit |
| 4 | demario douglas (NE) | Receptions | 3 | 2+ at 77.6% | 3 | Hit |
| 5 | ollie gordon (MIA) | Rushing yds | 48 | 30+ at 77.0% | 69 | Hit |
| 6 | rhamondre stevenson (NE) | Rushing yds | 49 | 30+ at 76.0% | 82 | Hit |
| 7 | caleb douglas (MIA) | Receiving yds | 27 | 10+ at 76.0% | 43 | Hit |
| 8 | hunter henry (NE) | Receiving yds | 40 | 20+ at 76.0% | 30 | Hit |
| 9 | malik willis (MIA) | Passing yds | 176.1 | 125+ at 76.0% | 211 | Hit |
| 10 | efton chism (NE) | Receptions | 1 | 1+ at 75.5% | 5 | Hit |

---

## PHI @ WAS

**Final: PHI 10 - WAS 27.** Baseline top ten: 8 source-target hits, 0 misses, 2 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | marquise brown (PHI) | Receptions | 2 | 1+ at 84.8% | Unverified | Unverified |
| 2 | antonio williams (WAS) | Receptions | 2 | 1+ at 84.4% | 5 | Hit |
| 3 | dameon pierce (PHI) | Receptions | 2 | 1+ at 81.3% | Unverified | Unverified |
| 4 | darius cooper (PHI) | Receptions | 2 | 1+ at 80.0% | 2 | Hit |
| 5 | stefon diggs (WAS) | Receptions | 3 | 2+ at 80.0% | 3 | Hit |
| 6 | chig okonkwo (WAS) | Receiving yds | 28 | 10+ at 78.0% | 32 | Hit |
| 7 | rachaad white (WAS) | Receptions | 2 | 1+ at 76.6% | 2 | Hit |
| 8 | makai lemon (PHI) | Receiving yds | 41.1 | 20+ at 76.0% | 57 | Hit |
| 9 | chig okonkwo (WAS) | Receptions | 3 | 2+ at 76.0% | 2 | Hit |
| 10 | dallas goedert (PHI) | Receiving yds | 38 | 20+ at 75.0% | 30 | Hit |

### Alternative ranking when QB-role warnings excluded WAS

Role-conditioned top ten: 6 hits, 0 misses, 4 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | marquise brown (PHI) | Receptions | 2 | 1+ at 84.8% | Unverified | Unverified |
| 2 | dameon pierce (PHI) | Receptions | 2 | 1+ at 81.3% | Unverified | Unverified |
| 3 | darius cooper (PHI) | Receptions | 2 | 1+ at 80.0% | 2 | Hit |
| 4 | makai lemon (PHI) | Receiving yds | 41.1 | 20+ at 76.0% | 57 | Hit |
| 5 | dallas goedert (PHI) | Receiving yds | 38 | 20+ at 75.0% | 30 | Hit |
| 6 | dallas goedert (PHI) | Receptions | 4 | 3+ at 71.7% | 4 | Hit |
| 7 | marquise brown (PHI) | Receiving yds | 24 | 10+ at 71.0% | Unverified | Unverified |
| 8 | makai lemon (PHI) | Receptions | 4 | 3+ at 69.4% | 6 | Hit |
| 9 | dameon pierce (PHI) | Rushing yds | 43 | 30+ at 69.0% | Unverified | Unverified |
| 10 | saquon barkley (PHI) | Rushing yds | 17 | 10+ at 68.0% | 30 | Hit |

---

## TEN @ CIN

**Final: TEN 36 - CIN 43.** Baseline top ten: 10 source-target hits, 0 misses, 0 unverified.

| # | Player | Market | Model's median | Separate model target | Actual final | Target result |
|--:|:--|:--|--:|:--|--:|:--|
| 1 | gunnar helm (TEN) | Receptions | 2 | 1+ at 83.8% | 5 | Hit |
| 2 | tee higgins (CIN) | Receptions | 4 | 3+ at 78.1% | 10 | Hit |
| 3 | dohnte meyers (CIN) | Receptions | 2 | 1+ at 77.4% | 3 | Hit |
| 4 | wandale robinson (TEN) | Receiving yds | 41.8 | 20+ at 77.0% | 57 | Hit |
| 5 | wandale robinson (TEN) | Receptions | 4 | 3+ at 76.4% | 6 | Hit |
| 6 | elic ayomanor (TEN) | Receiving yds | 26 | 10+ at 76.0% | 34 | Hit |
| 7 | jamarr chase (CIN) | Receptions | 5 | 4+ at 75.6% | 11 | Hit |
| 8 | daniel bellinger (TEN) | Receptions | 1 | 1+ at 75.4% | 3 | Hit |
| 9 | chase brown (CIN) | Receiving yds | 23 | 10+ at 75.0% | 46 | Hit |
| 10 | mike gesicki (CIN) | Receptions | 1 | 1+ at 74.3% | 4 | Hit |

---

## Validation limitations

- The original source was frozen before the first Sunday kickoff; the evaluated ten-per-game list is reconstructed from that source using current presentation rules, not captured frontend viewing logs.
- A successful live role-correction feed could replace the Baltimore and Washington selections shown above. Both possibilities remain in this record.
- The displayed median and model-selected 65%+ target are **two distinct events**. The target hit rate should not be reported as how often the numerical median was correct.
- Missing ESPN player records were not inferred to be zero. A present player with no recorded stat in the relevant category was treated as zero for that category.
- All source-derived player results are retained: wins, losses, unverified players, and role alternatives.

[Download alternative machine-readable source table](./nfl_week8_nov1_frontend_reconstructed_120_graded.json)

