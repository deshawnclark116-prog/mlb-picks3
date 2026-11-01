import {selectFrozenSoccerCards} from './frozenBoard';
// Bundled into the actual React app: works on static AI Studio hosting even
// if the Node soccer /api endpoint is unreachable or source fetches time out.
const firstSeenModules=import.meta.glob('../../docs/soccer_forward/originals/*.json',{
 eager:true,import:'default'
}) as Record<string,unknown>;
export function frozenSoccerBoard(nowUtc:string){
 return selectFrozenSoccerCards(firstSeenModules,nowUtc,21);
}
