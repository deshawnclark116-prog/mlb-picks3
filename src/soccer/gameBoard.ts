/** Match-centered soccer predictions. Verified ESPN fixture ID and ordered
 * home/away team identities are authoritative. Do not create mirror games
 * from first player rows. Never join inverted 1X2 probabilities.
 */
import type {Forecast,League} from './model';
export type GameMatch={id:string;forecast:Forecast;origin:'FROZEN'|'LIVE'};
export type GameFixture={league:string;gameId:string;kickoffUtc:string;
 homeId:string;home:string;awayId:string;away:string;completed:boolean};
export type GamePlayer={
 id:string;playerId:string;playerName:string;teamName:string;opponent:string;
 teamId?:string;
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
// Exact, reviewed alternative provider names; do not use fuzzy similarity.
// Each match still needs the SAME league, date, and ORDERED home/away pair.
const aliases:Record<string,string>={
 'juventus fc':'juventus','ssc napoli':'napoli',
 'olympique de marseille':'marseille',
 'real sociedad de futbol':'real sociedad',
 'como 1907':'como',
 '1 fc koln':'koln',
 'fc cologne':'koln','fc koln':'koln','1 fc koln fc':'koln',
 '1 fc union berlin':'union berlin',
 'rc strasbourg alsace':'strasbourg',
 'olympique lyonnais':'lyon',
 'real racing club de santander':'racing santander',
 'ss lazio':'lazio','cagliari calcio':'cagliari',
 'frosinone calcio':'frosinone','us lecce':'lecce',
 'genoa cfc':'genoa','as monaco fc':'monaco',
 'as monaco':'monaco','us sassuolo calcio':'sassuolo',
 'parma calcio 1913':'parma','atalanta bc':'atalanta',
 'ac fiorentina':'fiorentina',
 'hamburger sv':'hamburg sv'
};
export function soccerTeamKey(team:string):string{
 const raw=team.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ')
  .trim().replace(/\s+/g,' ');
 // Normalize only full known names before generic recognized club prefixes.
 if(aliases[raw])return aliases[raw];
 const words=raw.split(' ').filter(Boolean);
 while(words[0]==='fc'||words[0]==='cf'||words[0]==='afc'||
  words[0]==='1'&&words[1]==='fc'){
  if(words[0]==='1')words.shift();
  words.shift();
 }
 while(['fc','cf','afc','sc'].includes(words[words.length-1]))words.pop();
 const result=words.join(' ');
 return aliases[result]??result;
}
function sameMatch(g:SoccerGameGroup,f:Forecast){
 return g.league===f.league&&g.fixtureDate===f.date&&
  soccerTeamKey(g.home)!==''&&soccerTeamKey(g.away)!==''&&
  soccerTeamKey(g.home)!==soccerTeamKey(g.away)&&
  soccerTeamKey(g.home)===soccerTeamKey(f.home)&&
  soccerTeamKey(g.away)===soccerTeamKey(f.away);
}
export function groupSoccerGameProjections(
 matches:GameMatch[],players:GamePlayer[],nowUtc:string,fixtures:GameFixture[]=[]
):SoccerGameGroup[]{
 const now=Date.parse(nowUtc);
 if(!Number.isFinite(now))throw Error('SOCCER_GAME_BOARD_INVALID_ASOF');
 const byGame=new Map<string,SoccerGameGroup>();
 const verified=new Map<string,GameFixture>();
 const verifiedDates=new Set<string>();
 for(const f of fixtures){
  const league=mapping[f.league],t=Date.parse(f.kickoffUtc);
  if(!league||!Number.isFinite(t)||t<=now||f.completed||
   f.kickoffUtc.slice(0,10)!==new Date(t).toISOString().slice(0,10)||
   f.homeId===f.awayId||soccerTeamKey(f.home)===soccerTeamKey(f.away))
   continue;
  const id='espn|'+f.league+'|'+f.gameId;
  if(byGame.has(id))throw Error('SOCCER_GAME_BOARD_DUPLICATE_VERIFIED_FIXTURE');
  verified.set(id,f);verifiedDates.add(league+'|'+f.kickoffUtc.slice(0,10));
  byGame.set(id,{id,fixtureDate:f.kickoffUtc.slice(0,10),league,
   home:f.home,away:f.away,kickoffUtc:f.kickoffUtc,players:[],match:null});
 }
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
  const id=p.gameId&&league?'espn|'+p.league+'|'+p.gameId:
   ['player',p.fixtureDate,league??'unknown',
    ...[soccerTeamKey(p.teamName),soccerTeamKey(p.opponent)].sort()].join('|');
  const fixture=verified.get(id);
  if(fixtures.length&&p.gameId&&!fixture)continue; // no source-verified fixture
  if(fixture){
   // A player forecast cannot override the authoritative team assignment.
   const home=soccerTeamKey(fixture.home),away=soccerTeamKey(fixture.away);
   const team=soccerTeamKey(p.teamName),opponent=soccerTeamKey(p.opponent);
   if(!((team===home&&opponent===away)||(team===away&&opponent===home))||
    (p.teamId&&p.teamId!==(team===home?fixture.homeId:fixture.awayId))||
    kickoff!==fixture.kickoffUtc)continue;
  }
  let g=byGame.get(id);
  if(!g){
   // Legacy provider pilot has no fixture ID: avoid pretending an observed
   // player's team is necessarily the home side when verified fixtures exist.
   if(fixtures.length)continue;
   g={id,fixtureDate:p.fixtureDate,league,home:p.teamName,away:p.opponent,
    kickoffUtc:kickoff??null,players:[],match:null};
   byGame.set(id,g);
  }else if(g.fixtureDate!==p.fixtureDate||
   g.kickoffUtc!==(kickoff??null)||g.league!==league||
   ![soccerTeamKey(g.home),soccerTeamKey(g.away)].includes(soccerTeamKey(p.teamName))||
   ![soccerTeamKey(g.home),soccerTeamKey(g.away)].includes(soccerTeamKey(p.opponent)))
   throw Error('SOCCER_GAME_BOARD_CONFLICTING_FIXTURE_IDENTITIES');
  if(g.players.some(x=>x.playerId===p.playerId))
   throw Error('SOCCER_GAME_BOARD_DUPLICATE_PLAYER');
  g.players.push(p);
 }
 for(const game of byGame.values()){
  const candidates=[...unassigned].filter(([,m])=>sameMatch(game,m.forecast));
  if(candidates.length>1)throw Error('SOCCER_GAME_BOARD_AMBIGUOUS_MATCH');
  if(candidates.length===1){
   const [id,m]=candidates[0];game.match=m;unassigned.delete(id);
   // Preserve canonical model naming only when no verified fixture exists.
   // Source-verified ESPN home/away order must never be overwritten.
   if(!verified.has(game.id)){
    game.home=m.forecast.home;game.away=m.forecast.away;
   }
  }
  game.players.sort((a,b)=>
   Math.max(b.forecast.pReachProjectedShots,b.forecast.pReachProjectedSot)-
   Math.max(a.forecast.pReachProjectedShots,a.forecast.pReachProjectedSot)||
   a.teamName.localeCompare(b.teamName)||a.playerName.localeCompare(b.playerName));
 }
 for(const [id,m] of unassigned){
  const f=m.forecast;
  // If ESPN verified this league/day's fixture slate, OpenFootball-only
  // fixtures are not extra games. They may be stale or differently scheduled.
  if(verifiedDates.has(f.league+'|'+f.date))continue;
  byGame.set(id,{id,fixtureDate:f.date,league:f.league,home:f.home,
   away:f.away,kickoffUtc:null,match:m,players:[]});
 }
 return [...byGame.values()].sort((a,b)=>{
  const start=(g:SoccerGameGroup)=>g.kickoffUtc?
   Date.parse(g.kickoffUtc):Date.parse(g.fixtureDate+'T23:59:59Z');
  return start(a)-start(b)||a.home.localeCompare(b.home)||a.id.localeCompare(b.id);
 });
}
