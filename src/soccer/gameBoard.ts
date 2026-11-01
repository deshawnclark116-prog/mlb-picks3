/** Match-centered soccer view. Do not combine two providers' projections unless
 * date, league and BOTH team identities agree. Each ESPN game has a stable ID.
 * Unmatched player games remain independent cards; no fake 1X2 probabilities.
 */
import type {Forecast,League} from './model';
export type GameMatch={id:string;forecast:Forecast;origin:'FROZEN'|'LIVE'};
export type GamePlayer={
 id:string;playerId:string;playerName:string;teamName:string;opponent:string;
 fixtureDate:string;kickoffUtc?:string;gameId?:string;league?:string;
 currentEligibility?:'STARTER_CONFIRMED'|'EARLY_ROSTER_ELIGIBLE'|'EARLY_ROSTER_INJURY_UNVERIFIED';
 source:'AUTHORIZED_PLAYER_MATCH_LOG'|'ESPN_COMPLETED_MATCH_ROSTERS';
 forecast:{
  predictedShots:number;predictedShotsOnTarget:number;predictedMinutes:number;
  shotsReachCount:number;sotReachCount:number;
  pReachProjectedShots:number;pReachProjectedSot:number;
  lineupState:'CONFIRMED_STARTER'|'CONFIRMED_BENCH'|'UNKNOWN';
  status:'RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS';
 };
};
export type SoccerGameGroup={
 id:string;fixtureDate:string;league:League|null;home:string;away:string;
 kickoffUtc:string|null;match:GameMatch|null;players:GamePlayer[];
};
const mapping:Record<string,League>={
 'eng.1':'EPL','esp.1':'LaLiga','ita.1':'SerieA','ger.1':'Bundesliga','fra.1':'Ligue1'
};
// These are comparison keys, not display names or estimates of team identity.
export function soccerTeamKey(team:string):string {
 const words=team.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ')
  .trim().replace(/\s+/g,' ').split(' ').filter(Boolean);
 while(words[0]==='fc'||words[0]==='cf'||words[0]==='afc'||
   words[0]==='1'&&words[1]==='fc') {
   if(words[0]==='1')words.shift();
   words.shift();
 }
 while(['fc','cf','afc','sc'].includes(words[words.length-1]))words.pop();
 return words.join(' ');
}
function sameMatch(g:SoccerGameGroup,f:Forecast){
 if(!g.league||g.league!==f.league||g.fixtureDate!==f.date)return false;
 const a=[soccerTeamKey(g.home),soccerTeamKey(g.away)].sort();
 const b=[soccerTeamKey(f.home),soccerTeamKey(f.away)].sort();
 return a[0]!==''&&a[1]!==''&&a[0]!==a[1]&&a[0]===b[0]&&a[1]===b[1];
}
export function groupSoccerGameProjections(
 matches:GameMatch[],players:GamePlayer[],nowUtc:string
):SoccerGameGroup[]{
 const now=Date.parse(nowUtc);
 if(!Number.isFinite(now))throw Error('SOCCER_GAME_BOARD_INVALID_ASOF');
 const byGame=new Map<string,SoccerGameGroup>();
 const unassigned=new Map<string,GameMatch>();
 for(const m of matches){
  const f=m.forecast;
  const id=['match',f.league,f.date,soccerTeamKey(f.home),soccerTeamKey(f.away)].join('|');
  if(unassigned.has(id))throw Error('SOCCER_GAME_BOARD_DUPLICATE_GOAL_FORECAST');
  unassigned.set(id,m);
 }
 for(const p of players){
  if(!p||!p.playerId||!p.teamName||!p.opponent||!p.fixtureDate)continue;
  const kickoff=p.kickoffUtc;
  if(kickoff){
   const time=Date.parse(kickoff);
   if(!Number.isFinite(time)||time<=now||kickoff.slice(0,10)!==p.fixtureDate)continue;
  }else if(p.fixtureDate<=nowUtc.slice(0,10))continue;
  const league=p.league?mapping[p.league]??null:null;
  // A provider game ID is the authoritative join key for all players.
  const id=p.gameId&&league?'espn|'+p.league+'|'+p.gameId:
   ['player',p.fixtureDate,league??'unknown',
     ...[soccerTeamKey(p.teamName),soccerTeamKey(p.opponent)].sort()].join('|');
  let g=byGame.get(id);
  if(!g){
   g={id,fixtureDate:p.fixtureDate,league,
    home:p.teamName,away:p.opponent,kickoffUtc:kickoff??null,
    players:[],match:null};
   byGame.set(id,g);
  }else{
   if(g.fixtureDate!==p.fixtureDate||g.kickoffUtc!== (kickoff??null)||
      g.league!==league||
      ![soccerTeamKey(g.home),soccerTeamKey(g.away)].includes(soccerTeamKey(p.teamName))||
      ![soccerTeamKey(g.home),soccerTeamKey(g.away)].includes(soccerTeamKey(p.opponent)))
     throw Error('SOCCER_GAME_BOARD_CONFLICTING_FIXTURE_IDENTITIES');
  }
  if(g.players.some(x=>x.playerId===p.playerId))
    throw Error('SOCCER_GAME_BOARD_DUPLICATE_PLAYER');
  g.players.push(p);
 }
 // Link only if BOTH clubs match uniquely. Unverified/ambiguous pairs stay
 // separate; mixing players across teams/leagues would be worse than empty.
 for(const game of byGame.values()){
  const candidates=[...unassigned].filter(([,m])=>sameMatch(game,m.forecast));
  if(candidates.length>1)throw Error('SOCCER_GAME_BOARD_AMBIGUOUS_MATCH');
  if(candidates.length===1){
    const [id,m]=candidates[0];game.match=m;
    game.home=m.forecast.home;game.away=m.forecast.away;
    unassigned.delete(id);
  }
  game.players.sort((a,b)=>
    Math.max(b.forecast.pReachProjectedShots,b.forecast.pReachProjectedSot)-
      Math.max(a.forecast.pReachProjectedShots,a.forecast.pReachProjectedSot)||
    a.teamName.localeCompare(b.teamName)||a.playerName.localeCompare(b.playerName));
 }
 for(const [id,m] of unassigned){
  const f=m.forecast;
  byGame.set(id,{id,fixtureDate:f.date,league:f.league,
    home:f.home,away:f.away,kickoffUtc:null,match:m,players:[]});
 }
 return [...byGame.values()].sort((a,b)=>{
  const start=(g:SoccerGameGroup)=>g.kickoffUtc?
    Date.parse(g.kickoffUtc):Date.parse(g.fixtureDate+'T23:59:59Z');
  return start(a)-start(b)||a.home.localeCompare(b.home)||a.id.localeCompare(b.id);
 });
}
