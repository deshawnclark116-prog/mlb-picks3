/** Fixed, auditable soccer event ranking. It does not invent betting targets.
 * Ranked outputs are UNCALIBRATED model probabilities, NOT real hit rates,
 * and are not a claim of positive expected value or official predictions.
 */
import type {Forecast} from './model';
export type SoccerRankedMarket='HOME_WIN'|'DRAW'|'AWAY_WIN'|'BOTH_TEAMS_SCORE'|'THREE_PLUS_GOALS';
export type SoccerRankedProjection={
 id:string;market:SoccerRankedMarket;label:string;modelProbability:number;
 forecast:Forecast;source:'FROZEN'|'LIVE';
};
type Input={id:string;forecast:Forecast;source:'FROZEN'|'LIVE'};
function events(f:Forecast){
 return [
  {market:'HOME_WIN' as const,label:f.home+' to win',modelProbability:f.probabilities.home},
  {market:'DRAW' as const,label:'Match ends in a draw',modelProbability:f.probabilities.draw},
  {market:'AWAY_WIN' as const,label:f.away+' to win',modelProbability:f.probabilities.away},
  {market:'BOTH_TEAMS_SCORE' as const,label:'Both teams to score',modelProbability:f.probabilities.btts},
  {market:'THREE_PLUS_GOALS' as const,label:'3 or more total goals',modelProbability:f.probabilities.over25}
 ];
}
export function bestSoccerEvent(f:Forecast){
 if(f.status!=='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET')
   throw Error('SOCCER_RANKING_NOT_ORIGINAL_RESEARCH');
 const p=f.probabilities;
 if([p.home,p.draw,p.away,p.btts,p.over25].some(x=>!Number.isFinite(x)||x<0||x>1)||
    Math.abs(p.home+p.draw+p.away-1)>.0003)
   throw Error('SOCCER_RANKING_INVALID_EVENT_PROBABILITIES');
 return events(f).sort((a,b)=>b.modelProbability-a.modelProbability)[0];
}
export function rankSoccerProjections(cards:Input[]):SoccerRankedProjection[]{
 // The five fixed markets are computed from the same immutable goal forecast.
 // Show the strongest modeled event per fixture; never count same-match
 // correlated 1X2, BTTS and total-goals events as independent picks.
 const seen=new Set<string>();
 const results=cards.map(card=>{
  const f=card.forecast;
  const fixture=[f.league,f.season,f.date,f.home,f.away].join('|');
  if(seen.has(fixture))throw Error('SOCCER_RANKING_DUPLICATE_FIXTURE');
  seen.add(fixture);
  const best=bestSoccerEvent(f);
  return {...best,id:card.id,forecast:f,source:card.source};
 });
 return results.sort((a,b)=>b.modelProbability-a.modelProbability||
   a.forecast.date.localeCompare(b.forecast.date)||
   a.forecast.league.localeCompare(b.forecast.league)||
   a.id.localeCompare(b.id));
}
