/** Role-aware view of existing immutable NFL outcomes.
 * Original scientific selection and export modules are intentionally untouched.
 * Apply role exclusions to the UNCAPPED candidate pool, then rank and cap.
 * The corresponding book execution still validates against the COMPLETE
 * original view to preserve the fail-closed player-identity rule.
 */
import {groupGames,type ForecastRow,type Phase1View,type Horizon} from './phase1';
import {systemCandidates,matchesFilter,bestExecution,compareSystem,type Family} from './bettable';

export function roleEligibleGames(
 view:Phase1View,horizon:Horizon,search:string,family:Family,
 eligibleRow:(row:ForecastRow)=>boolean,mode:'system'|'bettable'
) {
 const candidates=systemCandidates(view,horizon)
   .filter(p=>matchesFilter(p.row,search,family)&&eligibleRow(p.row));
 const selections=candidates.flatMap(p=>{
   if(mode==='system')return [{...p,execution:null}];
   const execution=bestExecution(view,horizon,p);
   return execution?[{...p,execution}]:[];
 });
 return groupGames(view,horizon).map(game=>({
   ...game,
   picks:selections.filter(p=>p.row.game_id===game.game_id)
     .sort(compareSystem).slice(0,10)
 }));
}
