# NFL November 1: Which V2 picks were eligible for the frontend’s top 10?

**RECONSTRUCTED, NOT A VERIFIED RECORD OF THE USER’S ACTUAL SCREEN.** This report evaluates one recoverable pregame publication (**November 1 at 17:12:34 UTC / 12:12:34 PM ET**) and uses the exact ranking logic from the current frontend for **SYSTEM PICKS, T24 horizon, ALL markets, no search**. The frontend polls data every 30 seconds; later publications or user filters can change these selections.

**Important correction:** the earlier 316-pick game-by-game results report was graded from a **different weekly model feed**, not these V2 system selections. These lists are not the 316 original rows from that report, and their probabilities cannot be attributed to the model median.

**Source:** [V2 original pregame publication](https://github.com/deshawnclark116-prog/mlb-picks2/blob/74f49b5ca5e3/docs/nfl_phase1_shadow.json) · [Verified simulation distribution branch](https://github.com/deshawnclark116-prog/mlb-picks2/tree/1482d122310225ed1e5013e47f369f1f893445d0/forecasts/batches)

**Selection:** offensive outcomes only, P(active) ≥75%, target probability ≥65%, descending P(target), then 10 per matchup. **Defensive sacks excluded.** Passing-touchdown outcomes can appear when they pass the filter. The 65% probabilities refer to the separate low target (e.g. 1+ reception), **not the predicted median number of receptions or yards**.

**Reconstructed primary 120 slots, by market:** Receptions 75; Rushing yards 11; Receiving yards 28; Passing TD 3; Passing yards 3.

**QB role-gate uncertainty:** The historical source flagged **BAL in BAL–BUF** and **WAS in PHI–WAS**. If the separate role-research endpoint was successfully loaded and accepted, the UI re-ranked after excluding those teams. The two possible lists for those games are shown separately. Without a screenshot or browser feed log, we cannot tell which variant the user actually saw.

## All 12 games: model median versus ranked event probability

### ARI @ DAL

**Kickoff:** 2026-11-01T18:00:00.000000Z · **Eligible before cap:** 29 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T17:58:37.646334+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | jake ferguson (DAL) | Receptions | 2 | 1+ · 84.9% |
| 2 | javonte williams (DAL) | Receptions | 2 | 1+ · 84.0% |
| 3 | tyler allgeier (ARI) | Rushing yards | 22 | 10+ · 77.0% |
| 4 | ryan flournoy (DAL) | Receiving yards | 43 | 20+ · 76.0% |
| 5 | jeremiyah love (ARI) | Receptions | 2 | 1+ · 75.2% |
| 6 | dak prescott (DAL) | Passing TD | 1 | 1+ · 75.1% |
| 7 | jalen brooks (ARI) | Receptions | 1 | 1+ · 74.5% |
| 8 | kendrick bourne (ARI) | Receiving yards | 25 | 10+ · 74.0% |
| 9 | jeremiyah love (ARI) | Rushing yards | 35 | 20+ · 74.0% |
| 10 | tyler allgeier (ARI) | Receptions | 1 | 1+ · 73.7% |

### ATL @ TB

**Kickoff:** 2026-11-01T18:00:00.000000Z · **Eligible before cap:** 24 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T17:59:08.521616+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | ted hurst (TB) | Receptions | 2 | 1+ · 85.2% |
| 2 | jahan dotson (ATL) | Receptions | 2 | 1+ · 84.2% |
| 3 | tez johnson (TB) | Receptions | 2 | 1+ · 82.1% |
| 4 | bijan robinson (ATL) | Receptions | 3 | 2+ · 77.9% |
| 5 | bucky irving (TB) | Receptions | 3 | 2+ · 77.3% |
| 6 | kyle pitts (ATL) | Receptions | 3 | 2+ · 76.3% |
| 7 | baker mayfield (TB) | Passing yards | 181.9 | 125+ · 75.0% |
| 8 | bucky irving (TB) | Rushing yards | 56 | 40+ · 72.0% |
| 9 | drake london (ATL) | Receiving yards | 63 | 40+ · 72.0% |
| 10 | chris godwin (TB) | Receiving yards | 50 | 30+ · 72.0% |

### BAL @ BUF

**Kickoff:** 2026-11-01T18:00:00.000000Z · **Eligible before cap:** 24 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T17:59:38.767758+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | jakobi lane (BAL) | Receptions | 2 | 1+ · 83.0% |
| 2 | rashod bateman (BAL) | Receptions | 2 | 1+ · 78.7% |
| 3 | mark andrews (BAL) | Receiving yards | 27 | 10+ · 78.0% |
| 4 | james cook (BUF) | Receptions | 2 | 1+ · 77.8% |
| 5 | dalton kincaid (BUF) | Receptions | 2 | 1+ · 76.6% |
| 6 | zay flowers (BAL) | Receptions | 4 | 3+ · 76.5% |
| 7 | josh allen (BUF) | Rushing yards | 26 | 10+ · 76.0% |
| 8 | keon coleman (BUF) | Receiving yards | 27 | 10+ · 75.0% |
| 9 | justice hill (BAL) | Receptions | 1 | 1+ · 73.7% |
| 10 | dawson knox (BUF) | Receptions | 1 | 1+ · 72.6% |

**Conditional QB-role gate (exclude BAL): alternative 10 picks if the role feed was accepted**

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | james cook (BUF) | Receptions | 2 | 1+ · 77.8% |
| 2 | dalton kincaid (BUF) | Receptions | 2 | 1+ · 76.6% |
| 3 | josh allen (BUF) | Rushing yards | 26 | 10+ · 76.0% |
| 4 | keon coleman (BUF) | Receiving yards | 27 | 10+ · 75.0% |
| 5 | dawson knox (BUF) | Receptions | 1 | 1+ · 72.6% |
| 6 | james cook (BUF) | Rushing yards | 76 | 60+ · 68.0% |
| 7 | khalil shakir (BUF) | Receiving yards | 33 | 20+ · 68.0% |
| 8 | keon coleman (BUF) | Receptions | 2 | 2+ · 67.0% |
| 9 | skyler bell (BUF) | Receptions | 1 | 1+ · 66.7% |
| 10 | ty johnson (BUF) | Receptions | 1 | 1+ · 66.4% |

### CLE @ PIT

**Kickoff:** 2026-11-01T18:00:00.000000Z · **Eligible before cap:** 27 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T18:00:11.268378+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | quinshon judkins (CLE) | Receptions | 2 | 1+ · 85.1% |
| 2 | jerry jeudy (CLE) | Receptions | 2 | 1+ · 84.2% |
| 3 | rico dowdle (PIT) | Receptions | 2 | 1+ · 83.8% |
| 4 | darnell washington (PIT) | Receptions | 2 | 1+ · 83.4% |
| 5 | denzel boston (CLE) | Receptions | 3 | 2+ · 79.9% |
| 6 | kc concepcion (CLE) | Receptions | 3 | 2+ · 79.8% |
| 7 | harold fannin (CLE) | Receptions | 3 | 2+ · 79.2% |
| 8 | pat freiermuth (PIT) | Receiving yards | 28 | 10+ · 79.0% |
| 9 | jaylen warren (PIT) | Receptions | 3 | 2+ · 77.0% |
| 10 | pat freiermuth (PIT) | Receptions | 3 | 2+ · 76.3% |

### IND @ JAX

**Kickoff:** 2026-11-01T18:00:00.000000Z · **Eligible before cap:** 23 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T18:00:43.216261+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | bhayshul tuten (JAX) | Receptions | 2 | 1+ · 83.2% |
| 2 | chris rodriguez (JAX) | Rushing yards | 26 | 10+ · 82.0% |
| 3 | keenan allen (IND) | Receptions | 3 | 2+ · 80.1% |
| 4 | laquon treadwell (IND) | Receptions | 2 | 1+ · 77.9% |
| 5 | tyler warren (IND) | Receiving yards | 39 | 20+ · 76.0% |
| 6 | brenton strange (JAX) | Receptions | 4 | 3+ · 75.5% |
| 7 | tyler warren (IND) | Receptions | 4 | 3+ · 75.4% |
| 8 | trevor lawrence (JAX) | Passing yards | 199.3 | 150+ · 73.0% |
| 9 | josh downs (IND) | Receiving yards | 37 | 20+ · 72.0% |
| 10 | trevor lawrence (JAX) | Passing TD | 1 | 1+ · 71.4% |

### KC @ DEN

**Kickoff:** 2026-11-01T21:25:00.000000Z · **Eligible before cap:** 26 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T21:22:57.686166+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | xavier worthy (KC) | Receptions | 3 | 2+ · 78.2% |
| 2 | jonah coleman (DEN) | Receptions | 2 | 1+ · 78.1% |
| 3 | marvin mims (DEN) | Receptions | 2 | 1+ · 76.4% |
| 4 | noah gray (KC) | Receptions | 1 | 1+ · 76.3% |
| 5 | kenneth walker (KC) | Rushing yards | 71.9 | 50+ · 76.0% |
| 6 | rashee rice (KC) | Receiving yards | 30 | 10+ · 76.0% |
| 7 | courtland sutton (DEN) | Receptions | 3 | 2+ · 75.9% |
| 8 | rashee rice (KC) | Receptions | 3 | 2+ · 74.7% |
| 9 | troy franklin (DEN) | Receptions | 1 | 1+ · 72.1% |
| 10 | travis kelce (KC) | Receiving yards | 36 | 20+ · 72.0% |

### LAC @ LA

**Kickoff:** 2026-11-01T21:05:00.000000Z · **Eligible before cap:** 31 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T21:03:01.666691+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | charlie kolar (LAC) | Receptions | 2 | 1+ · 84.3% |
| 2 | oronde gadsden (LAC) | Receptions | 2 | 1+ · 83.6% |
| 3 | davis allen (LA) | Receptions | 2 | 1+ · 82.8% |
| 4 | kyren williams (LA) | Receiving yards | 27.3 | 10+ · 80.0% |
| 5 | quentin johnston (LAC) | Receiving yards | 31.3 | 10+ · 78.0% |
| 6 | blake corum (LA) | Rushing yards | 37 | 20+ · 78.0% |
| 7 | konata mumpfield (LA) | Receptions | 2 | 1+ · 76.4% |
| 8 | tre harris (LAC) | Receiving yards | 29 | 10+ · 76.0% |
| 9 | justin herbert (LAC) | Rushing yards | 25 | 10+ · 75.0% |
| 10 | omarion hampton (LAC) | Receptions | 1 | 1+ · 74.9% |

### LV @ NYJ

**Kickoff:** 2026-11-01T18:00:00.000000Z · **Eligible before cap:** 25 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T18:01:15.899951+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | omar cooper (NYJ) | Receptions | 2 | 1+ · 84.8% |
| 2 | braelon allen (NYJ) | Receptions | 2 | 1+ · 81.8% |
| 3 | tre tucker (LV) | Receptions | 3 | 2+ · 80.7% |
| 4 | michael mayer (LV) | Receiving yards | 28 | 10+ · 80.0% |
| 5 | ashton jeanty (LV) | Receiving yards | 25.9 | 10+ · 78.0% |
| 6 | michael mayer (LV) | Receptions | 3 | 2+ · 77.5% |
| 7 | adonai mitchell (NYJ) | Receiving yards | 30 | 10+ · 77.0% |
| 8 | jalen nailor (LV) | Receptions | 1 | 1+ · 75.2% |
| 9 | kenyon sadiq (NYJ) | Receptions | 1 | 1+ · 75.0% |
| 10 | brock bowers (LV) | Receiving yards | 51 | 30+ · 74.0% |

### MIN @ DET

**Kickoff:** 2026-11-01T18:00:00.000000Z · **Eligible before cap:** 25 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T18:01:48.154811+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | tj hockenson (MIN) | Receiving yards | 28 | 10+ · 80.0% |
| 2 | isaac teslaa (DET) | Receptions | 2 | 1+ · 79.3% |
| 3 | aaron jones (MIN) | Rushing yards | 38.9 | 20+ · 79.0% |
| 4 | jordan addison (MIN) | Receptions | 3 | 2+ · 77.0% |
| 5 | justin jefferson (MIN) | Receptions | 4 | 3+ · 76.6% |
| 6 | tj hockenson (MIN) | Receptions | 3 | 2+ · 76.5% |
| 7 | aaron jones (MIN) | Receptions | 1 | 1+ · 76.0% |
| 8 | jahmyr gibbs (DET) | Receptions | 4 | 3+ · 76.0% |
| 9 | jared goff (DET) | Passing TD | 1 | 1+ · 75.2% |
| 10 | sam laporta (DET) | Receiving yards | 39 | 20+ · 75.0% |

### NE @ MIA

**Kickoff:** 2026-11-01T21:25:00.000000Z · **Eligible before cap:** 27 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T21:23:23.294962+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | eli raridon (NE) | Receptions | 2 | 1+ · 85.9% |
| 2 | chris bell (MIA) | Receptions | 2 | 1+ · 82.0% |
| 3 | malik washington (MIA) | Receptions | 3 | 2+ · 77.8% |
| 4 | demario douglas (NE) | Receptions | 3 | 2+ · 77.6% |
| 5 | ollie gordon (MIA) | Rushing yards | 48 | 30+ · 77.0% |
| 6 | rhamondre stevenson (NE) | Rushing yards | 49 | 30+ · 76.0% |
| 7 | caleb douglas (MIA) | Receiving yards | 27 | 10+ · 76.0% |
| 8 | hunter henry (NE) | Receiving yards | 40 | 20+ · 76.0% |
| 9 | malik willis (MIA) | Passing yards | 176.1 | 125+ · 76.0% |
| 10 | efton chism (NE) | Receptions | 1 | 1+ · 75.5% |

### PHI @ WAS

**Kickoff:** 2026-11-02T01:20:00.000000Z · **Eligible before cap:** 24 · **Cards in default view:** 10 · **Source batch:** 2026-11-01T01:18:19.768544+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | marquise brown (PHI) | Receptions | 2 | 1+ · 84.8% |
| 2 | antonio williams (WAS) | Receptions | 2 | 1+ · 84.4% |
| 3 | dameon pierce (PHI) | Receptions | 2 | 1+ · 81.3% |
| 4 | darius cooper (PHI) | Receptions | 2 | 1+ · 80.0% |
| 5 | stefon diggs (WAS) | Receptions | 3 | 2+ · 80.0% |
| 6 | chig okonkwo (WAS) | Receiving yards | 28 | 10+ · 78.0% |
| 7 | rachaad white (WAS) | Receptions | 2 | 1+ · 76.6% |
| 8 | makai lemon (PHI) | Receiving yards | 41.1 | 20+ · 76.0% |
| 9 | chig okonkwo (WAS) | Receptions | 3 | 2+ · 76.0% |
| 10 | dallas goedert (PHI) | Receiving yards | 38 | 20+ · 75.0% |

**Conditional QB-role gate (exclude WAS): alternative 10 picks if the role feed was accepted**

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | marquise brown (PHI) | Receptions | 2 | 1+ · 84.8% |
| 2 | dameon pierce (PHI) | Receptions | 2 | 1+ · 81.3% |
| 3 | darius cooper (PHI) | Receptions | 2 | 1+ · 80.0% |
| 4 | makai lemon (PHI) | Receiving yards | 41.1 | 20+ · 76.0% |
| 5 | dallas goedert (PHI) | Receiving yards | 38 | 20+ · 75.0% |
| 6 | dallas goedert (PHI) | Receptions | 4 | 3+ · 71.7% |
| 7 | marquise brown (PHI) | Receiving yards | 24 | 10+ · 71.0% |
| 8 | makai lemon (PHI) | Receptions | 4 | 3+ · 69.4% |
| 9 | dameon pierce (PHI) | Rushing yards | 43 | 30+ · 69.0% |
| 10 | saquon barkley (PHI) | Rushing yards | 17 | 10+ · 68.0% |

### TEN @ CIN

**Kickoff:** 2026-11-01T18:00:00.000000Z · **Eligible before cap:** 27 · **Cards in default view:** 10 · **Source batch:** 2026-10-31T18:02:20.875333+00:00

| Rank | Player | Market | V2 median | Separate 65%+ target |
|---:|:---|:---|---:|:---|
| 1 | gunnar helm (TEN) | Receptions | 2 | 1+ · 83.8% |
| 2 | tee higgins (CIN) | Receptions | 4 | 3+ · 78.1% |
| 3 | dohnte meyers (CIN) | Receptions | 2 | 1+ · 77.4% |
| 4 | wandale robinson (TEN) | Receiving yards | 41.8 | 20+ · 77.0% |
| 5 | wandale robinson (TEN) | Receptions | 4 | 3+ · 76.4% |
| 6 | elic ayomanor (TEN) | Receiving yards | 26 | 10+ · 76.0% |
| 7 | jamarr chase (CIN) | Receptions | 5 | 4+ · 75.6% |
| 8 | daniel bellinger (TEN) | Receptions | 1 | 1+ · 75.4% |
| 9 | chase brown (CIN) | Receiving yards | 23 | 10+ · 75.0% |
| 10 | mike gesicki (CIN) | Receptions | 1 | 1+ · 74.3% |

## What this proves and what it does not

The original compressed prediction file, matching pregame distribution batches, and frontend ranking code jointly establish what the **default UI would have been eligible to show at that captured time**. They do not establish what was rendered in the user's AI Studio preview, whether the upstream API was reachable then, whether the QB-role correction response loaded, or which filter/date/horizon the user selected.

A correct frontend performance audit needs snapshots of the **actual ranked displayed selection**, a per-game display cap, market type, original median, exact target-event probability, verified final stat, and unresolved player appearances. The previous 316-row weekly audit cannot be used as proof of the 120 V2 picks' performance.

