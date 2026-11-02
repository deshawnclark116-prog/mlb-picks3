import {readFileSync,writeFileSync} from 'node:fs';
const original=JSON.parse(readFileSync('docs/nfl_week8_nov1_frontend_reconstructed_120.json','utf8'));
if(original.totalBaselineDisplayedSlots!==120||original.games.length!==12)throw Error('TOP10_SOURCE_INVALID');
const prefix='https://site.api.espn.com/apis/site/v2/sports/football/nfl/';
async function json(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);try{const res=await fetch(url,{signal:c.signal});if(!res.ok)throw Error('ESPN_HTTP_'+res.status);return await res.json()}finally{clearTimeout(t)}}
const scoreboard=await json(prefix+'scoreboard?dates=20261101&limit=100');
if(scoreboard.events.length!==12||scoreboard.events.some(g=>!g.status?.type?.completed))throw Error('FINAL_SCOREBOARD_NOT_COMPLETE');
const ab=s=>({LAR:'LA',WSH:'WAS'}[s]||s);
const norm=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'').replace(/(jr|sr|ii|iii|iv|v)$/,'');
const numeric=s=>/^[-+]?\d+(?:\.\d+)?$/.test(String(s))?Number(s):null;
async function parse(g){
 const d=await json(prefix+'summary?event='+g.id);
 if(d.boxscore?.players?.length!==2)throw Error('ESPN_MISSING_GAME_'+g.id);
 const teams={},scores={};
 for(const c of g.competitions[0].competitors)scores[ab(c.team.abbreviation)]=Number(c.score);
 for(const t of d.boxscore.players){
  const id=ab(t.team.abbreviation),players=new Map();
  for(const cat of t.statistics||[])for(const a of cat.athletes||[]){
    if(!a.athlete?.displayName||!Array.isArray(a.stats)||a.stats.length!==cat.labels.length)continue;
    const key=norm(a.athlete.displayName),v=players.get(key)||{name:a.athlete.displayName,stats:{}};
    if(v.stats[cat.name])throw Error('ESPN_DUPLICATE_CATEGORY_'+key);
    v.stats[cat.name]=Object.fromEntries(cat.labels.map((label,i)=>[label,a.stats[i]]));
    players.set(key,v);
  }teams[id]=players;
 }
 return {kickoff:g.date,scores,teams};
}
const scoreboardGames=await Promise.all(scoreboard.events.map(parse)),byPair=new Map();
for(const g of scoreboardGames){const key=Object.keys(g.scores).sort().join('|');if(byPair.has(key))throw Error('ESPN_DUPLICATE_GAME');byPair.set(key,g)}
function measure(p,g){
 const record=g.teams[p.team]?.get(norm(p.player));
 if(!record)return {status:'UNVERIFIED_NOT_IN_PLAYER_BOX',actual:null,matchedName:null};
 const markets={rec:['receiving','REC'],rec_yds:['receiving','YDS'],rush_yds:['rushing','YDS'],
  pass_yds:['passing','YDS'],pass_td:['passing','TD'],rush_td:['rushing','TD'],
  rec_td:['receiving','TD'],int:['passing','INT']};
 let actual=null;
 if(p.outcome==='atd'){
  const categories=['rushing','receiving','defensive','interceptions','kickReturns','puntReturns'];
  const counts=categories.map(k=>record.stats[k]?.TD==null?0:numeric(record.stats[k].TD));
  if(counts.every(x=>x!==null))actual=counts.reduce((a,x)=>a+x,0);
 }else if(markets[p.outcome]){
  const [cat,key]=markets[p.outcome],v=record.stats[cat]?.[key];
  actual=v==null?0:numeric(v);
 }
 return actual===null?{status:'UNVERIFIED_FINAL_MARKET_STAT',actual:null,matchedName:record.name}:
  {status:'VERIFIED',actual,matchedName:record.name};
}
function evalList(g,list){
 const final=byPair.get([g.away,g.home].sort().join('|'));
 if(!final||Date.parse(final.kickoff)!==Date.parse(g.kickoff)||list.length!==10)throw Error('NFL_GAME_IDENTITY_'+g.id);
 return list.map((p,i)=>{
  if(p.gameId!==g.id||p.targetProbability<.65||p.modelActiveProbability<.75||
   Date.parse(original.phase1PublicationUtc)>=Date.parse(g.kickoff))throw Error('NFL_SELECTION_INVALID');
  const r=measure(p,final),hit=r.actual===null?null:r.actual>=p.targetMilestone;
  return {...p,rank:i+1,...r,hit,
   medianAbsError:r.actual===null?null:Number(Math.abs(r.actual-p.modelMedian).toFixed(3)),
   targetBrier:hit===null?null:Number(((p.targetProbability-Number(hit))**2).toFixed(5))};
 });
}
function score(rows){
 const v=rows.filter(r=>r.status==='VERIFIED');
 const mk={};
 for(const market of [...new Set(rows.map(r=>r.outcome))]){
  const all=rows.filter(r=>r.outcome===market),x=all.filter(r=>r.status==='VERIFIED');
  mk[market]={total:all.length,verified:x.length,unverified:all.length-x.length,
   targetHits:x.filter(r=>r.hit).length,
   medianMAE:x.length?Number((x.reduce((s,r)=>s+r.medianAbsError,0)/x.length).toFixed(3)):null};
 }
 return {total:rows.length,verified:v.length,unverified:rows.length-v.length,
  targetHits:v.filter(r=>r.hit).length,targetMisses:v.filter(r=>!r.hit).length,
  observedEventRate:v.length?Number((v.filter(r=>r.hit).length/v.length).toFixed(4)):null,
  meanSourceEventProbability:v.length?Number((v.reduce((s,r)=>s+r.targetProbability,0)/v.length).toFixed(4)):null,
  targetBrier:v.length?Number((v.reduce((s,r)=>s+r.targetBrier,0)/v.length).toFixed(4)):null,
  markets:mk};
}
const games=original.games.map(g=>{
 const d=byPair.get([g.away,g.home].sort().join('|')),baseline=evalList(g,g.baselineTop10),role=evalList(g,g.roleGatedTop10);
 return {id:g.id,matchup:g.away+' @ '+g.home,final:g.away+' '+d.scores[g.away]+' - '+g.home+' '+d.scores[g.home],
  roleWarnings:g.roleExcludedTeams,baseline,roleGated:role,baselineScore:score(baseline),roleScore:score(role)};
});
const baseline=games.flatMap(g=>g.baseline),role=games.flatMap(g=>g.roleGated);
const result={schema:'NFL_WK08_NOV1_FRONTEND_CANDIDATE_GRADE_V1',
 status:'RECONSTRUCTED_V2_ELIGIBILITY_NOT_PERSONAL_FRONTEND_VIEWING_LOG',
 originalCommit:original.originalGitCommit,originalPublication:original.phase1PublicationUtc,
 source:'ESPN_FINISHED_GAME_BOXSCORES_2026_11_01',
 eventGrading:'OUTCOME_AT_LEAST_TARGET',numericGrading:'MODEL_MEDIAN_VERSUS_ACTUAL_SEPARATE',
 baselineScore:score(baseline),conditionalRoleGatedScore:score(role),games};
writeFileSync('docs/nfl_week8_nov1_frontend_reconstructed_120_graded.json',JSON.stringify(result,null,2)+'\n');
console.log('NFL_FRONTEND_TOP10_GRADING',JSON.stringify({
 baseline:result.baselineScore,role:result.conditionalRoleGatedScore,
 games:games.map(g=>({id:g.id,final:g.final,hits:g.baselineScore.targetHits,verified:g.baselineScore.verified,missing:g.baselineScore.unverified,roleBlocked:g.roleWarnings}))
}).slice(0,16000));
