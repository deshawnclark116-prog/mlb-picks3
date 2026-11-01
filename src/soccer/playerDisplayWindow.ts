/** Soccer player UI prioritizes imminent games, not remote high-score props.
 * ESPN provides verified kickoffUtc; do not infer a time for date-only pilots.
 * This is display selection only: it never edits first-seen model forecasts.
 */
export type SoccerPlayerWindow='48H'|'7D';
export type TimedPlayer={
 fixtureDate:string;kickoffUtc?:string;playerName:string;
 forecast:{pReachProjectedShots:number;pReachProjectedSot:number};
};
const validDay=(s:string)=>/^20\d\d-\d\d-\d\d$/.test(s)&&
 Number.isFinite(Date.parse(s+'T00:00:00Z'))&&
 new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const millis=(s:string)=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&/Z$/.test(s)?
 Date.parse(s):null;
export function soccerPlayerWindow<T extends TimedPlayer>(
 cards:T[],asofUtc:string,window:SoccerPlayerWindow
):T[]{
 const now=millis(asofUtc);
 if(now===null||!['48H','7D'].includes(window))
  throw Error('SOCCER_PLAYER_INVALID_WINDOW');
 const cutoff=now+(window==='48H'?48:168)*3600000;
 const today=asofUtc.slice(0,10);
 const visible=cards.filter(p=>{
  if(!p||!validDay(p.fixtureDate))return false;
  if(p.kickoffUtc){
   const start=millis(p.kickoffUtc);
   return start!==null&&start>now&&start<=cutoff&&
    p.kickoffUtc.slice(0,10)===p.fixtureDate;
  }
  // Date-only authorized research can be viewed for future days in the
  // extended window, but cannot be claimed imminent without kickoff data.
  return window==='7D'&&p.fixtureDate>today&&
   Date.parse(p.fixtureDate+'T00:00:00Z')<=cutoff;
 });
 // Nearest verified kickoff first. Within the same kickoff, show the
 // highest of the two original-model research event probabilities first.
 return [...visible].sort((a,b)=>{
  const x=a.kickoffUtc?Date.parse(a.kickoffUtc):Date.parse(a.fixtureDate+'T00:00:00Z')+86400000;
  const y=b.kickoffUtc?Date.parse(b.kickoffUtc):Date.parse(b.fixtureDate+'T00:00:00Z')+86400000;
  return x-y||
   Math.max(b.forecast.pReachProjectedShots,b.forecast.pReachProjectedSot)-
     Math.max(a.forecast.pReachProjectedShots,a.forecast.pReachProjectedSot)||
   a.playerName.localeCompare(b.playerName);
 });
}
