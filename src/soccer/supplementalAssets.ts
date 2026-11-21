/// <reference types="vite/client" />
/** Daily cached, explicitly incomplete schedule from a second provider.
 * Never promotes a match or player betting projection from this source.
 */
import raw from '../../docs/soccer_wide/supplemental_fixtures.json';
import {SUPPLEMENTAL_SOCCER_LEAGUES,
 validateSupplementalSnapshot,type SupplementalMatch} from './supplementalSource';

export const supplementaryLeagueNames:Record<string,string>=
 Object.fromEntries(SUPPLEMENTAL_SOCCER_LEAGUES.map(x=>[x.league,x.name]));
export function supplementalUpcoming(atUtc:string):SupplementalMatch[]{
 const snapshot=validateSupplementalSnapshot(raw);
 const at=Date.parse(atUtc),captured=Date.parse(snapshot.generated_at_utc);
 if(!Number.isFinite(at)||!Number.isFinite(captured))
  throw Error('SOCCER_SUPPLEMENTAL_INVALID_ASOF');
 // Provenance cutoff: a stale original is not today’s verified live schedule.
 if(captured>at+300000||at-captured>36*3600000)return [];
 return snapshot.fixtures.filter(f=>Date.parse(f.kickoffUtc)>at&&
   Date.parse(f.kickoffUtc)<=at+14*86400000);
}
export function supplementalSourceCoverage(){
 return validateSupplementalSnapshot(raw).competitions;
}
