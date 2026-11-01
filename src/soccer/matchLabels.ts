import type {Forecast} from './model';
// 1X2 outcomes retain their exact original probabilities. Labels are human readable.
type Teams=Pick<Forecast,'home'|'away'|'probabilities'>;
export type NamedOutcome={key:'home'|'draw'|'away';label:string;probability:number};
export function namedSoccerOutcomes(p:Teams):NamedOutcome[]{
 return [
  {key:'home',label:p.home+' to win',probability:p.probabilities.home},
  {key:'draw',label:'Match ends in a draw',probability:p.probabilities.draw},
  {key:'away',label:p.away+' to win',probability:p.probabilities.away}
 ];
}
export function preferredSoccerOutcome(p:Teams){
 const [first,second]=[...namedSoccerOutcomes(p)].sort((a,b)=>b.probability-a.probability);
 // A one-percentage-point difference isn't a meaningful favorite. Do not
 // manufacture a confident winner from nearly tied model outcomes.
 const close=first.probability-second.probability<0.015;
 return {
  kind:close?'NO_CLEAR_FAVORITE' as const:first.key,
  label:close?'Too close to call':first.label,
  probability:close?null:first.probability
 };
}
