/** Strict display contract for real ESPN first-seen player projections.
 * The archive contains only original pregame snapshots. Never regenerate
 * from completed fixtures in the frontend, and never infer injury clearance.
 */
import type {EspnOriginal} from './espnAutofeed';
type Document={schema:string;status:string;generatedAtUtc:string;officialPicks:number;
 items:EspnOriginal[]};
const validTime=(s:unknown):s is string=>typeof s==='string'&&
 Number.isFinite(Date.parse(s))&&/Z$/.test(s);
export function usableEspnPlayerBoard(raw:unknown,asofUtc:string):EspnOriginal[]{
 const d=raw as Document;
 if(!validTime(asofUtc)||!d||d.schema!=='soccer-espn-rolling-player-board-v1'||
   d.officialPicks!==0||!Array.isArray(d.items)||!validTime(d.generatedAtUtc)||
   Date.parse(d.generatedAtUtc)>Date.parse(asofUtc)||
   Date.parse(asofUtc)-Date.parse(d.generatedAtUtc)>72*3600000)
   return [];
 const ids=new Set<string>();const out:EspnOriginal[]=[];
 for(const x of d.items){
  if(!x||x.source!=='ESPN_COMPLETED_MATCH_ROSTERS'||
    x.status!=='EARLY_PREGAME_RESEARCH_UNCALIBRATED'||
    !validTime(x.kickoffUtc)||!validTime(x.capturedAtUtc)||
    x.capturedAtUtc>asofUtc||
    Date.parse(x.kickoffUtc)-Date.parse(x.capturedAtUtc)<90*60000||
    Date.parse(x.kickoffUtc)<=Date.parse(asofUtc)||
    x.fixtureDate!==x.kickoffUtc.slice(0,10)||
    x.lineupsVerified!==false||x.injuriesVerified!==false||
    !x.forecast||
    x.forecast.status!=='RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS'||
    x.playerId!==x.forecast.playerId||
    x.fixtureDate!==x.forecast.fixtureDate||
    !Number.isInteger(x.evidenceGames)||x.evidenceGames<6||
    ![x.forecast.predictedShots,x.forecast.predictedShotsOnTarget,
      x.forecast.predictedMinutes,x.forecast.pReachProjectedShots,
      x.forecast.pReachProjectedSot].every(v=>Number.isFinite(v)&&v>=0)||
    x.forecast.predictedMinutes>100||
    x.forecast.pReachProjectedShots>1||x.forecast.pReachProjectedSot>1||
    x.forecast.shotsReachCount!==Math.max(1,Math.ceil(x.forecast.predictedShots))||
    x.forecast.sotReachCount!==Math.max(1,Math.ceil(x.forecast.predictedShotsOnTarget)))
    continue;
  const id=x.gameId+'|'+x.playerId;
  if(ids.has(id))throw Error('SOCCER_ESPN_DUPLICATE_PLAYER_EVENT');
  ids.add(id);out.push(x);
 }
 return out.sort((a,b)=>
  Math.max(b.forecast.pReachProjectedShots,b.forecast.pReachProjectedSot)-
   Math.max(a.forecast.pReachProjectedShots,a.forecast.pReachProjectedSot)||
   a.kickoffUtc.localeCompare(b.kickoffUtc)||a.playerName.localeCompare(b.playerName));
}
