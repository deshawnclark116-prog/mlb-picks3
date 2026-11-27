# NBA coherent outcome and raw team opportunity research — 2026-11-27

Status: exploratory, shadow only. No production promotion. All historical evaluation periods have been consumed by previous research. Do not present results as independent forward validation.

## 1. Coherent marginal integer distributions
Constructed four PMFs: original empirical history, isotonic-projected direct ordinal probabilities, March-fit residual distribution, and fixed ordinal/residual mixture. All evaluated PMFs normalize to one and are nonnegative; survival curves are therefore monotonic. The conditional expected value is the PMF mean, and event probabilities include the separately estimated participation chance. Finite support caps 120/60/45/30 for PTS/REB/AST/3PM absorb extreme tails. No claim of a joint game distribution. Residual samples fit only March 2026 (4,887 played player-games). Evaluations April (101 games) and current season (263 games, 21,973 eligible events).
 
Current-season fixed-target Top 4: empirical 69.30%, ordinal 71.20%, residual 73.00%, mixture 72.91%. Corresponding own-PMF-mean rounded-target Top 4: 64.16%, 65.21%, 66.54%, 65.78%. The difference is important: fixed-target ranking does not certify a model-generated projection board. Current fixed-event Brier: .199466/.195532/.195662/.195332. Current ordinal PMF means worsen conditional points MAE relative to empirical PMF. No promotion.

## 2. Raw team opportunity means
Learned conditional means from January–February 2026, 8,282 played player-games. Features: earlier shot attempts and makes, free throws, offensive/defensive rebound counts, prior minutes, role, expected teammate opportunity competition/vacancy, historical roster similarity, opponent allowed opportunities, team pace and strength. Prior roster probabilities from frozen rotation model. Target game's actual starter/roster/box is not a predictor. Actual raw player identity and stat values asserted against labels. Compare individual and team-context regularized regression, and physical scoring-identity candidate with predicted FGA/3PA/FTA and shrunk shot conversion.

| Current 263 games, 5,414 played rows | Prior direct MAE | Team context MAE | Game bootstrap gain 95% interval |
|---|---:|---:|---|
| Points | 4.814631 | 4.708859 | [.07372,.13571] |
| Rebounds | 1.916884 | 1.896919 | [.01266,.02829] |
| Assists | 1.372434 | 1.345486 | [.01964,.03335] |
| Made threes | .932226 | .911872 | [.01492,.02601] |

Spring 338 games/6,960 played: team-context 4.664097/1.881816/1.389507/.899692 vs prior direct 4.706718/1.895506/1.398563/.911082. All four game-cluster gain intervals positive, unadjusted for multiplicity and prior experimentation. Gains modest. Physical scoring candidate did not outperform direct team-context means. Minutes and free throw opportunity predictions did not benefit from team context relative to individual features. 
 
## 3. Team means + coherent residual distributions
March residual fit, 4,887 played observations. Compare previous residual, team residual, team residual exponentially tilted toward independently predicted mean (where within support), and fixed 50/50 mixture. Same eligible historical events; no fixed-event threshold changes. For own-target metrics, targets are recomputed from PMF means, so hit rates cannot be compared without target shifts. 
 
| Current 263 games | Prior residual | Team residual | Mean-constrained | Mixture |
|---|---:|---:|---:|---:|
| Pooled conditional MAE | 2.509758 | 2.472033 | 2.465963 | 2.484303 |
| Fixed Brier | .195662 | .194447 | .194382 | .194499 |
| CRPS | 1.618238 | 1.605367 | 1.604443 | 1.607957 |
| Fixed Top 4 hit | 72.81% | 71.77% | 72.24% | 72.91% |
| Fixed Top 10 hit | 66.88% | 67.41% | 67.41% | 67.26% |
| Own Top 4 hit | 66.16% | 67.30% | 67.11% | 66.63% |
| Own Top 10 hit | 61.60% | 62.78% | 61.79% | 61.60% |
| Own mean target shift vs recent average, all events | -.1003 | -.2002 | -.2453 | -.1506 |

April pooled mean-constrained MAE 2.580101 vs prior residual 2.613947; Brier .210583 vs .211971. But April own-target Top 4 and Top 10 regress for mean-constrained and team residual. Current fixed assists probability Brier slightly regresses in the team residual/mean-constrained variants. No combined candidate dominates across all criteria.

## Decision
Keep all branches research only. Existing production specialists remain unchanged. The largest unresolved blockers are verified pretip roster/availability, missing historical completion timestamps, new independent data, joint game constraints, and a full exact live specialist comparison. Do not tune these consumed historical cohorts and call them untouched validation. Node wrapper source saved; functions executed in isolated JS runtime, wrapper not separately exercised. No claims about betting profit.

Files:
- nba/nba_coherent_distribution_research.mjs
- nba/nba_team_opportunity_research.mjs
- nba/nba_team_distribution_research.mjs

Source blobs identical to rotation research report.
