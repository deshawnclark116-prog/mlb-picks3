import type {ExistingYardProjection} from './existing';

/** Rank only real, published workload-stability grades, not yardage size.
 *
 * HIGH/MEDIUM/LOW comes from the original simulation's relative spread,
 * NOT the v2 context regression and NOT an empirical chance of exact accuracy.
 * The v2 serving model can replace the median without recalibrating this
 * grade. Keep those critical provenance limits on all cards.
 *
 * Ties use the actual number of historical games considered, never the
 * predicted yards, mean, book price, team, or player position.
 * Unknown grades are omitted, not presented as one of the most confident.
 */
const TIER={'HIGH':3,'MEDIUM':2,'LOW':1} as const;
export function rankedExistingCardProjections(
  projections:readonly ExistingYardProjection[], slots=6
):ExistingYardProjection[]{
  if(!Number.isInteger(slots)||slots<1||slots>24)throw new Error('invalid card slots');
  return projections.filter(p=>p.confidence!=null&&p.confidence in TIER)
    .sort((a,b)=>{
      const grade=TIER[b.confidence!]-TIER[a.confidence!];
      if(grade)return grade;
      const n=(b.games_played||0)-(a.games_played||0);
      if(n)return n;
      return a.player.localeCompare(b.player)||a.market.localeCompare(b.market)||a.team.localeCompare(b.team);
    }).slice(0,slots);
}
