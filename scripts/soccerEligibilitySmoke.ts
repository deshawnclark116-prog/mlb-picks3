/** One-off live source contract probe for the roster + injuries gate.
 * Prints only payload shape and aggregate counts; never prints player details.
 */
import {readFileSync} from 'node:fs';
import {currentSoccerRoster,currentSoccerUnavailable} from '../server/soccerPlayerEligibility';
const b=JSON.parse(readFileSync('docs/soccer_player_espn/board.json','utf8')) as {
 items:Array<{teamId:string;league:string}>};
const teams=[...new Map(b.items.map(x=>[x.league+'|'+x.teamId,x])).values()].slice(0,3);
for(const t of teams){
 const prefix='https://site.api.espn.com/apis/site/v2/sports/soccer/'+
  t.league+'/teams/'+t.teamId+'/';
 const get=async(path:string)=>{
  const response=await fetch(prefix+path,{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error(path+' HTTP '+response.status);
  return await response.json() as Record<string,unknown>;
 };
 const [r,i]=await Promise.allSettled([get('roster'),get('injuries')]);
 const rosterRaw=r.status==='fulfilled'?r.value:null;
 const injuryRaw=i.status==='fulfilled'?i.value:null;
 const playerIds=currentSoccerRoster(rosterRaw,t.teamId);
 const absentIds=currentSoccerUnavailable(injuryRaw);
 console.log(JSON.stringify({
  team:t.teamId,league:t.league,
  rosterStatus:r.status==='fulfilled'?'OK':String(r.reason),
  injuryStatus:i.status==='fulfilled'?'OK':String(i.reason),
  rosterKeys:rosterRaw?Object.keys(rosterRaw):[],
  injuryKeys:injuryRaw?Object.keys(injuryRaw):[],
  rawAthletesArray:Array.isArray(rosterRaw?.athletes),
  rawInjuriesArray:Array.isArray(injuryRaw?.injuries),
  rosterValid:playerIds!==null,rosterSize:playerIds?.size??0,
  injuryValid:absentIds!==null,absentCount:absentIds?.size??0
 }));
}
