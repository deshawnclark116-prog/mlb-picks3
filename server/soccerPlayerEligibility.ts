/** Live soccer participation overlay. This never mutates immutable first-seen
 * projections: today's roster / injuries / published XI determine DISPLAY
 * eligibility only. Failed or incomplete sources fail closed.
 */
type Dict=Record<string,unknown>;
const obj=(x:unknown):Dict|null=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Dict:null;
const arr=(x:unknown):unknown[]=>Array.isArray(x)?x:[];
const playerId=(x:unknown):string|null=>{
 const s=typeof x==='number'?String(x):typeof x==='string'?x:'';
 return /^\\d{1,15}$/.test(s)?s:null;
};
const text=(x:unknown):string=>typeof x==='string'?x:'';
function rowAthletes(raw:unknown):Set<string>{
 const found=new Set<string>();
 const walk=(rows:unknown[],depth:number)=>{
  if(depth>4)return;
  for(const rawRow of rows){
   const row=obj(rawRow);if(!row)continue;
   const candidate=obj(row.athlete)||row;
   // Position/group headers are not athletes.
   const id=playerId(candidate.id);
   if(id&&(typeof candidate.displayName==='string'||typeof candidate.fullName==='string'||
     typeof candidate.shortName==='string'||obj(row.athlete)!==null))found.add(id);
   walk(arr(row.items),depth+1);
   walk(arr(row.athletes),depth+1);
   walk(arr(row.roster),depth+1);
  }
 };
 walk(arr(raw),0);return found;
}
/** Verified only if the provider returned a plausible full current squad. */
export function currentSoccerRoster(raw:unknown,expectedTeamId:string):Set<string>|null{
 const doc=obj(raw);
 if(!doc||!playerId(expectedTeamId))return null;
 const topTeam=obj(doc.team);
 if(topTeam&&playerId(topTeam.id)&&playerId(topTeam.id)!==expectedTeamId)return null;
 if(!Array.isArray(doc.athletes))return null;
 const ids=rowAthletes(doc.athletes);
 return ids.size>=14&&ids.size<=70?ids:null;
}
const unavailable=/\\b(out|ruled out|suspended|suspension|inactive|not available|will not play|doubtful)\\b/i;
/** Returns null for missing or malformed injury coverage, not an empty report. */
export function currentSoccerUnavailable(raw:unknown):Set<string>|null{
 const doc=obj(raw);if(!doc||!Array.isArray(doc.injuries))return null;
 const ids=new Set<string>();
 const rows=(doc.injuries as unknown[]).flatMap(v=>{
  const r=obj(v);
  return r&&Array.isArray(r.items)?r.items:[v];
 });
 for(const item of rows){
  const r=obj(item);if(!r)continue;
  const athlete=obj(r.athlete)||obj(r.player);
  const id=playerId(athlete?.id)||playerId(r.athleteId)||playerId(r.playerId);
  const st=obj(r.status);
  const description=[r.status,r.type,r.description,r.detail,r.details,
    st?.name,st?.description,st?.type].map(text).join(' ');
  if(id&&unavailable.test(description))ids.add(id);
 }
 return ids;
}
/** A match XI is confirmed only with eleven starters for EACH verified team.
 * A historical pregame roster or partial summary is not an XI.
 */
export function confirmedSoccerStartingXI(
 raw:unknown,homeId:string,awayId:string
):Record<string,Set<string>>|null{
 const doc=obj(raw),rosters=doc?.rosters;
 if(!Array.isArray(rosters)||!playerId(homeId)||!playerId(awayId)||homeId===awayId)
  return null;
 const result:Record<string,Set<string>>={};
 for(const rawTeam of rosters){
  const group=obj(rawTeam),team=obj(group?.team);
  const id=playerId(team?.id);
  if(!id||![homeId,awayId].includes(id)||result[id])continue;
  const athletes=arr(group?.roster);
  const starters=new Set<string>();
  for(const athleteRaw of athletes){
   const a=obj(athleteRaw);
   if(!a||a.starter!==true)continue;
   const athlete=obj(a.athlete);
   const pid=playerId(athlete?.id);
   if(!pid)return null;
   starters.add(pid);
  }
  if(starters.size!==11)return null;
  result[id]=starters;
 }
 return result[homeId]&&result[awayId]?result:null;
}
