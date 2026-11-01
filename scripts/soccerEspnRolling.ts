/** Automatic early soccer player shots/SOT forecasts from ESPN match stats.
 *
 * Uses only source-verified completed match box scores strictly prior to the
 * pregame capture. Saves every first-seen game/player forecast without edits.
 * Does NOT infer that a recently observed player is injury-free or starting.
 *
 * ESPN is an undocumented public interface. Provider failures never become
 * false zeros, DNPs, completed games, or fabricated future predictions.
 */
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {gradeEspnPlayerOriginal,soccerEspnPlayerScorecard,
 type EspnPlayerGrade} from '../src/soccer/espnPlayerGrade';
import {ESPN_SOCCER_LEAGUES,parseEspnSoccerScoreboard,
 parseCompletedSoccerRoster,buildEspnEarlyPlayerForecasts,espnSourceSha,
 type EspnFixture,type EspnLeague,type EspnPlayerRow,type EspnOriginal} from '../src/soccer/espnAutofeed';
const root='docs/soccer_player_espn',histPath=join(root,'history.json'),
 originalDir=join(root,'originals'),boardPath=join(root,'board.json');
const now=new Date(),asof=now.toISOString(),day=asof.slice(0,10);
const initialized=existsSync(histPath);
const historyDays=initialized?Number(process.env.ESPN_HISTORY_DAYS||16):Number(process.env.ESPN_HISTORY_DAYS||62);
const futureDays=Number(process.env.ESPN_FUTURE_DAYS||7);
const maxSummaries=Number(process.env.ESPN_MAX_SUMMARIES||400);
if(![historyDays,futureDays,maxSummaries].every(Number.isInteger)||
 historyDays<1||historyDays>100||futureDays<1||futureDays>14||
 maxSummaries<1||maxSummaries>600)throw Error('SOCCER_ESPN_BAD_RUN_LIMITS');
type Entry={fixture:EspnFixture;sourceSha256:string;rows:EspnPlayerRow[]};
type History={schema:'soccer-espn-history-v1';events:Record<string,Entry>};
const previous:History=initialized?JSON.parse(readFileSync(histPath,'utf8')):{
 schema:'soccer-espn-history-v1',events:{}};
if(previous.schema!=='soccer-espn-history-v1'||!previous.events||
 Array.isArray(previous.events))throw Error('SOCCER_ESPN_HISTORY_INTEGRITY');
const dateOffset=(offset:number)=>new Date(Date.parse(day+'T00:00:00Z')+
 offset*86400000).toISOString().slice(0,10);
const dateCompact=(s:string)=>s.replace(/-/g,'');
const seenFixtures=new Map<string,EspnFixture>();
const failures:string[]=[];
async function request(url:string){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
 try{
  const r=await fetch(url,{signal:controller.signal,
   headers:{Accept:'application/json','User-Agent':'PropEdge-Soccer-Data-Audit/1.0'}});
  if(!r.ok)throw Error('HTTP '+r.status);
  const raw=await r.text();
  if(raw.length<15||raw.length>3_000_000)throw Error('Invalid response size');
  return {raw,parsed:JSON.parse(raw) as unknown};
 }finally{clearTimeout(timer);}
}
async function limited<T,R>(list:T[],concurrency:number,fn:(item:T)=>Promise<R>){
 const out:R[]=[];let cursor=0;
 await Promise.all(Array.from({length:Math.min(concurrency,list.length)},async()=>{
  while(cursor<list.length){
   const idx=cursor++;
   out[idx]=await fn(list[idx]);
  }
 }));
 return out;
}
const tasks=ESPN_SOCCER_LEAGUES.flatMap(league=>
 Array.from({length:historyDays+futureDays+1},(_,i)=>({
  league,day:dateOffset(i-historyDays)
 })));
await limited(tasks,6,async({league,day:dt})=>{
 const url='https://site.api.espn.com/apis/site/v2/sports/soccer/'+league+
 '/scoreboard?dates='+dateCompact(dt)+'&limit=100';
 try{
  const response=await request(url);
  for(const fixture of parseEspnSoccerScoreboard(league,response.parsed)){
   if(fixture.kickoffUtc.slice(0,10)!==dt)continue;
   const k=league+'|'+fixture.gameId;
   const old=seenFixtures.get(k);
   if(old&&JSON.stringify(old)!==JSON.stringify(fixture))
    throw Error('ESPN fixture identity contradiction '+k);
   seenFixtures.set(k,fixture);
  }
 }catch(e){
  failures.push(league+'/'+dt+': '+String(e).slice(0,100));
 }
 return null;
});
console.log('SOCCER_ESPN_SCOREBOARD_SCAN',JSON.stringify({
 dates:tasks.length,fixtures:seenFixtures.size,errors:failures.length,
 historyEvents:Object.keys(previous.events).length}));
const present=Object.values(previous.events).map(x=>x.fixture);
const finished=[...seenFixtures.values()].filter(f=>
 f.completed&&Date.parse(f.kickoffUtc)<now.getTime()-3*3600_000&&
 !(f.league+'|'+f.gameId in previous.events))
 .sort((a,b)=>b.kickoffUtc.localeCompare(a.kickoffUtc)).slice(0,maxSummaries);
let fetched=0;
await limited(finished,5,async(f)=>{
 const k=f.league+'|'+f.gameId;
 try{
  const response=await request('https://site.api.espn.com/apis/site/v2/sports/soccer/'+
    f.league+'/summary?event='+encodeURIComponent(f.gameId));
  const rows=parseCompletedSoccerRoster(f,response.parsed,asof);
  previous.events[k]={fixture:f,sourceSha256:espnSourceSha(response.raw),rows};
  fetched++;
 }catch(e){
  failures.push('summary '+k+': '+String(e).slice(0,100));
 }
 return null;
});
if(!seenFixtures.size&&Object.keys(previous.events).length===0)
 throw Error('SOCCER_ESPN_NO_VERIFIED_DATA_DO_NOT_PUBLISH');
if(fetched>0){
 mkdirSync(root,{recursive:true});
 writeFileSync(histPath,JSON.stringify(previous)+'\n');
}
const historyRows=Object.values(previous.events).flatMap(x=>x.rows);
const upcoming=[...seenFixtures.values()].filter(f=>!f.completed&&
 Date.parse(f.kickoffUtc)-now.getTime()>=90*60000&&
 Date.parse(f.kickoffUtc)-now.getTime()<=futureDays*86400000)
 .sort((a,b)=>a.kickoffUtc.localeCompare(b.kickoffUtc));
mkdirSync(root,{recursive:true});mkdirSync(originalDir,{recursive:true});
let newlyFrozen=0;
for(const fixture of upcoming){
 const filename=join(originalDir,fixture.league.replace('.','_')+'-'+fixture.gameId+'.json');
 if(existsSync(filename))continue;
 const items=buildEspnEarlyPlayerForecasts(fixture,historyRows,asof);
 if(!items.length)continue;
 if(items.some(x=>Date.parse(x.kickoffUtc)-Date.parse(x.capturedAtUtc)<90*60000))
  throw Error('SOCCER_ESPN_FROZEN_AFTER_MINIMUM_LEAD');
 writeFileSync(filename,JSON.stringify({
   schema:'soccer-espn-firstseen-fixture-v1',fixture,capturedAtUtc:asof,
   items
 })+'\n',{flag:'wx'});
 newlyFrozen+=items.length;
}
// Read originals WITHOUT recomputing forecasts or rewriting a game's first
// snapshot after team changes or final results.
const originals:EspnOriginal[]=[];
for(const file of readdirSync(originalDir).filter(x=>x.endsWith('.json'))){
 const data=JSON.parse(readFileSync(join(originalDir,file),'utf8')) as {
   schema:string;fixture:EspnFixture;capturedAtUtc:string;items:EspnOriginal[]};
 if(data.schema!=='soccer-espn-firstseen-fixture-v1'||!Array.isArray(data.items)||
    !(Date.parse(data.fixture.kickoffUtc)>Date.parse(data.capturedAtUtc))||
    data.items.some(x=>x.gameId!==data.fixture.gameId||x.capturedAtUtc!==data.capturedAtUtc))
  throw Error('SOCCER_ESPN_INVALID_ORIGINAL_FILE:'+file);
 originals.push(...data.items);
}
// Grade each immutable original only when its exact completed match and
// source-verified player stat line exist. Unknown participation is explicit.
const gradePath=join(root,'grades.json'),summaryPath=join(root,'scorecard.json');
const graded:Record<string,EspnPlayerGrade>=existsSync(gradePath)?
 JSON.parse(readFileSync(gradePath,'utf8')):{};
let newGrades=0;
for(const original of originals){
 if(graded[original.id])continue;
 const finished=previous.events[original.league+'|'+original.gameId];
 if(!finished||!finished.fixture.completed)continue;
 if(Date.parse(finished.fixture.kickoffUtc)!==Date.parse(original.kickoffUtc)||
    Date.parse(finished.fixture.kickoffUtc)+3*3600000>now.getTime())
   continue;
 const g=gradeEspnPlayerOriginal(original,finished.fixture,finished.rows,
    finished.sourceSha256,asof);
 graded[original.id]=g;newGrades++;
}
if(newGrades||!existsSync(gradePath))
 writeFileSync(gradePath,JSON.stringify(graded)+'\n');
const score=soccerEspnPlayerScorecard(Object.values(graded),originals.length);
writeFileSync(summaryPath,JSON.stringify({...score,asofUtc:asof})+'\n');
console.log('SOCCER_ESPN_PLAYER_FORWARD_GRADE',JSON.stringify({newGrades,...score}));
const live=originals.filter(o=>Date.parse(o.kickoffUtc)>now.getTime()&&
 Date.parse(o.capturedAtUtc)<=now.getTime());
live.sort((a,b)=>a.kickoffUtc.localeCompare(b.kickoffUtc)||
 b.forecast.predictedShots-a.forecast.predictedShots||a.playerName.localeCompare(b.playerName));
const board={
 schema:'soccer-espn-rolling-player-board-v1',generatedAtUtc:asof,
 status:live.length?'REAL_FIRSTSEEN_UNCALIBRATED':'NO_ELIGIBLE_FROZEN_FORECASTS',
 fullLeagueCoverageClaim:false,verifiedAvailabilityCoverage:false,
 provider:'ESPN_COMPLETED_MATCH_ROSTERS',officialPicks:0,
 fixturesSeen:upcoming.length,fixtures:upcoming,
 verifiedFinishedSourceGames:Object.keys(previous.events).length,
 sourceFailures:failures.length,items:live};
writeFileSync(boardPath,JSON.stringify(board)+'\n');
console.log('SOCCER_ESPN_PLAYER_ROLLING',JSON.stringify({
  generated:asof,leagueCount:ESPN_SOCCER_LEAGUES.length,upcoming:upcoming.length,
  newVerifiedHistoricalEvents:fetched,totalHistoryGames:Object.keys(previous.events).length,
  historyPlayerRecords:historyRows.length,newOriginals:newlyFrozen,
  boardPlayers:live.length,failures:failures.slice(0,10),failureCount:failures.length
}));
