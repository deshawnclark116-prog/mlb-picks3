/** Read-only, projection-first selection for quick viewing on a phone.
 * No ranking/selection is a calibration claim or a betting recommendation.
 * Display categories have separate units; NEVER rank yards against receptions.
 */
import type { ForecastRow, Horizon, Phase1View } from './phase1';

export const QUICK_OUTCOMES = ['pass_yds','rush_yds','rec_yds','rec'] as const;
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
export function quickForecasts(view: Phase1View, horizon: Horizon, search='', family='ALL', perOutcome=2): ForecastRow[] {
  if (!Number.isInteger(perOutcome) || perOutcome < 1 || perOutcome > 8) return [];
  const matched=view.rows[horizon].filter(r=>
    r.player.trim() && finite(r.median) && r.median>=0 &&
    finite(r.mean) && r.mean>=0 && finite(r.p_active) && r.p_active>=.75 &&
    (!search.trim() || (r.player+' '+r.team+' '+r.opp).toLowerCase().includes(search.trim().toLowerCase()))
  );
  const families: Record<string, string[]>={ALL:[...QUICK_OUTCOMES],PASS:['pass_yds'],RUSH:['rush_yds'],REC:['rec_yds','rec'],TD:[]};
  const outcomes=families[family]||[];
  return outcomes.flatMap(outcome=>matched.filter(r=>r.outcome===outcome)
    .sort((a,b)=> (b.median!-a.median!) || (b.mean!-a.mean!) || (b.p_active!-a.p_active!) || a.id.localeCompare(b.id))
    .slice(0,perOutcome));
}
/** A successful HTTP retrieval is NOT a freshly calculated forecast. */
export function publicationCoverage(view: Phase1View, horizon: Horizon) {
  const x=view.artifact.status.counts[horizon];
  const n=(key:string)=>typeof x[key]==='number' && Number.isFinite(x[key]) && x[key]>=0?x[key] as number:null;
  return {captured:n('valid_games')??0, planned:n('planned'),missed:n('missed'), failed:n('failed')};
}
