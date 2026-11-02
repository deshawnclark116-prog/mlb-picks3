/** Honest game-by-game audit of the original published NFL 2026 Week 8 model.
 * Frozen source: specific pregame commit dated Saturday Oct 31 22:23 ET.
 * Actual source: completed 2026-11-01 ESPN summaries (12 games).
 *
 * Strict player name + team key, explicit missing DNP versus verified zero.
 * Score continuous rushing/receiving means against true yards (no sportsbook
 * targets); separately audit Bernoulli TD and sack probabilities.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
const PIN='c9661df759c36a017b3268345e338b7d676adfd6';
const SNAPSHOT_URL='https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/'+PIN+'/docs/nfl_predictions_2026_w08.json';
const SCOREBOARD='https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20261101&limit=100';
const SUMMARY='https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=';
const OUT='docs/nfl_week8_nov1_full_projection_grade.json';
const OUT_CSV='docs/nfl_week8_nov1_full_projection_grade.csv';
const input=async url=>{
 let error;
 for(let tries=0;tries<3;tries++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),19000);
  try{
    const r=await fetch(url,{signal:controller.signal,
     headers:{'Accept':'application/json','User-Agent':'PropEdge-NFL-Forward-Audit/1.0'}});
    if(!r.ok)throw Error('HTTP '+r.status+' '+url);
    return await r.json();
  }catch(e){error=e;}finally{clearTimeout(timer);}
 }
 throw error;
};
const past=await input(SNAPSHOT_URL);
const received=(past.picks||[]).filter(p=>
  p.kickoff_utc>='2026-11-01T18:00:00Z'&&
  p.kickoff_utc<='2026-11-02T02:00:00Z');
if(past.generated_at_utc!=='2026-11-01T02:23:15+00:00'||
 received.length!==316||
 !received.every(p=>Date.parse(p.kickoff_utc)>Date.parse(past.generated_at_utc)))
 throw Error('PREGAME_SOURCE_HISTORIC_IDENTITY_INVALID');
const scoreboard=await input(SCOREBOARD);
const games=scoreboard.events||[];
if(games.length!==12||games.some(x=>!x.status?.type?.completed))
 throw Error('SCOREBOARD_DOES_NOT_HAVE_ALL_12_COMPLETE_NOV1_GAMES');
const teams=games.map(g=>({
 id:g.id,kickoff:g.date,
 clubs:g.competitions[0].competitors.map(c=>({team:c.team.abbreviation==='LAR'?'LA':c.team.abbreviation,
  full:c.team.displayName,score:Number(c.score),homeAway:c.homeAway}))
}));
const validTeams=new Set(teams.flatMap(g=>g.clubs.map(c=>c.team)));
if(received.some(p=>!validTeams.has(p.team)||!validTeams.has(p.opponent)))
 throw Error('PREGAME_TEAMS_NOT_IN_FINISHED_SLATE');
const clean=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'')
 .replace(/(jr|sr|ii|iii|iv|v)$/,'');
const num=s=>/^[-+]?\d+(?:\.\d+)?$/.test(String(s))?Number(s):null;
const canonTeam=ab=>ab==='LAR'?'LA':ab;
const allGameStats=new Map();
async function getGame(g){
 const data=await input(SUMMARY+g.id);
 const b=data.boxscore?.players;
 if(!Array.isArray(b)||b.length!==2)throw Error('PLAYER_BOXSCORE_MISSING_'+g.id);
 const perTeam={};
 for(const team of b){
  const ab=canonTeam(team.team?.abbreviation||'');
  if(!validTeams.has(ab)||perTeam[ab])throw Error('BOXSCORE_TEAM_ID_MISMATCH_'+g.id);
  let players=new Map();
  for(const cat of team.statistics||[]){
   if(!Array.isArray(cat.labels)||!Array.isArray(cat.athletes))continue;
   const typ=cat.name;
   for(const a of cat.athletes){
    if(!a.athlete?.displayName||!Array.isArray(a.stats)||a.stats.length!==cat.labels.length)continue;
    const name=a.athlete.displayName, key=clean(name);
    if(players.has(key)&&players.get(key).name!==name)throw Error('PLAYER_NAME_COLLISION_'+key);
    let info=players.get(key)||{name,id:a.athlete.id,key,stats:{},observedCategories:[]};
    info.observedCategories.push(typ);
    const values={};for(let i=0;i<cat.labels.length;i++)values[cat.labels[i]]=a.stats[i];
    info.stats[typ]=values;players.set(key,info);
   }
  }
  perTeam[ab]=players;
 }
 if(Object.keys(perTeam).length!==2)throw Error('TWO_TEAMS_NOT_PARSED_'+g.id);
 return {teams:perTeam,final:g.clubs,kickoff:g.kickoff};
}
await Promise.all(teams.map(async g=>allGameStats.set(g.id,await getGame(g))));
const mapByTeams=new Map();
for(const g of teams){
 const key=g.clubs.map(c=>c.team).sort().join('|');
 if(mapByTeams.has(key))throw Error('DUPLICATE_TEAM_PAIR');
 mapByTeams.set(key,{game:g,...allGameStats.get(g.id)});
}
const rows=[];
for(const p of received){
 const id=[p.team,p.opponent].sort().join('|'),matched=mapByTeams.get(id);
 if(!matched)throw Error('NO_GAME_FOR_PREGAME_PREDICTION_'+id);
 if(Date.parse(matched.kickoff)!==Date.parse(p.kickoff_utc))
  throw Error('KICKOFF_MISMATCH_'+p.player);
 const match=matched.teams[p.team], nameKey=clean(p.player),record=match?.get(nameKey);
 const row={game_id:matched.game.id,matchup:matched.game.clubs.map(c=>c.team).join(' vs '),
  source_generated_at_utc:past.generated_at_utc,
  player:p.player,team:p.team,opponent:p.opponent,player_id:p.player_id,
  market:p.market,model_source:p.model_source,model_prediction:p.projected_mean??null,
  model_median:p.projected_median??null,
  model_event_probability:p.model_prob??null,
  model_direction:p.pick??null,
  status:'UNVERIFIED_NOT_IN_ESPN_BOXSCORE',
  actual:null,signed_error:null,absolute_error:null,
  event_happened:null,brier:null,
  observed_player_name:record?.name||null};
 if(record){
  let actual=null;
  if(p.market==='rushing_yards'){
   const rush=record.stats.rushing;
   actual=rush?num(rush.YDS):0;
  }else if(p.market==='receiving_yards'){
   const rec=record.stats.receiving;
   actual=rec?num(rec.YDS):0;
  }else if(p.market==='sacks'){
   const def=record.stats.defensive;
   actual=def?num(def.SACKS):null;
  }else if(p.market==='anytime_touchdowns'){
   const s=record.stats;
   const tdCats=['rushing','receiving','defensive','interceptions','kickReturns','puntReturns'];
   const td=tdCats.map(k=>s[k]?num(s[k].TD):0);
   actual=td.every(x=>x!==null)?Number(td.some(x=>x>0)):null;
  }
  if(actual!==null){
   row.actual=actual;row.status='VERIFIED';
   if(p.market.endsWith('_yards')){
    row.signed_error=+(actual-p.projected_mean).toFixed(3);
    row.absolute_error=+Math.abs(actual-p.projected_mean).toFixed(3);
   }else{
    const event=actual>=1;row.event_happened=event;
    const prob=p.market==='sacks'?p.prob_over:p.model_prob;
    if(typeof prob==='number'&&Number.isFinite(prob)&&prob>=0&&prob<=1)
     row.brier=+(prob-Number(event))**2;
   }
  }else row.status='UNVERIFIED_MISSING_MARKET_STAT';
 }
 rows.push(row);
}
if(rows.length!==316)throw Error('EXPECTED_316_ORIGINALS');
const round=n=>Number(n.toFixed(3));
const metric=(arr)=>{const numeric=arr.filter(x=>x.status==='VERIFIED'&&x.market.endsWith('_yards'));
 const prob=arr.filter(x=>x.status==='VERIFIED'&&!x.market.endsWith('_yards'));
 const grouped={};
 for(const market of ['rushing_yards','receiving_yards','anytime_touchdowns','sacks']){
  const all=arr.filter(x=>x.market===market), ver=all.filter(x=>x.status==='VERIFIED');
  if(market.endsWith('_yards')){
   grouped[market]={total:all.length,verified:ver.length,unverified:all.length-ver.length,
    mae:ver.length?round(ver.reduce((a,x)=>a+x.absolute_error,0)/ver.length):null,
    signed_bias:ver.length?round(ver.reduce((a,x)=>a+x.signed_error,0)/ver.length):null,
    within10:ver.length?round(ver.filter(x=>x.absolute_error<=10).length/ver.length):null,
    within20:ver.length?round(ver.filter(x=>x.absolute_error<=20).length/ver.length):null,
    exact_rounded:ver.length?round(ver.filter(x=>Math.round(x.model_prediction)===x.actual).length/ver.length):null};
  }else grouped[market]={total:all.length,verified:ver.length,unverified:all.length-ver.length,
   observed_event_rate:ver.length?round(ver.filter(x=>x.event_happened).length/ver.length):null,
   average_predicted_event_prob:ver.length?round(ver.reduce((a,x)=>a+(market==='sacks'?(1-x.model_event_probability):x.model_event_probability),0)/ver.length):null,
   brier:ver.length?round(ver.reduce((a,x)=>a+x.brier,0)/ver.length):null};
 }
 return {total:arr.length,verified:arr.filter(x=>x.status==='VERIFIED').length,
   unverified:arr.filter(x=>x.status!=='VERIFIED').length,
   numeric: numeric.length,events:prob.length,by_market:grouped};
};
const byGame=teams.map(g=>{
 const own=rows.filter(r=>r.game_id===g.id);
 if(!own.length)throw Error('UNEXPECTED_EMPTY_GAME_'+g.id);
 const a=g.clubs.find(c=>c.homeAway==='away'),h=g.clubs.find(c=>c.homeAway==='home');
 return {game_id:g.id,matchup:a.team+' @ '+h.team,
   away:a.full,home:h.full,away_score:a.score,home_score:h.score,
   original_forecast_count:own.length,grade:metric(own),rows:own};
});
const output={schema:'NFL_2026_WEEK08_NOV01_FIRSTSEEN_NUMERIC_EVENT_AUDIT_V1',
 generated_at_utc:new Date().toISOString(),source_snapshot_url:SNAPSHOT_URL,
 source_commit:PIN,source_generated_at_utc:past.generated_at_utc,
 time_integrity:'ALL_316_ROWS_LOGGED_BEFORE_EVENT_KICKOFF',
 actual_source:'ESPN_SITE_API_COMPLETED_FINAL_2026_11_01_BOX',
 selection_policy:'EVERY_ORIGINAL_PUBLISHED_SUNDAY_ROW_NO_CHERRY_PICK',
 grading_rules:{
   rushing_receiving:'GRADE_MODEL_PROJECTED_MEAN_VS_FINAL_STAT_NOT_SPORTSBOOK_TARGET',
   touchdowns:'SEPARATE_BINARY_EVENT_CALIBRATION_WITH_BRIER',
   sacks:'SEPARATE_BINARY_EVENT_CALIBRATION_WITH_BRIER',
   unavailable:'UNVERIFIED_ROWS_STAY_IN_DENOMINATOR_AS_MISSING_NOT_ZERO',
   note:'NO_NUMERIC_YARDS_EVENT_HIT_RATE_CLAIM_WITHOUT_DEFINED_TOLERANCE'},
 overall:metric(rows),games:byGame};
mkdirSync('docs',{recursive:true});
writeFileSync(OUT,JSON.stringify(output,null,2)+'\n');
const cols=['matchup','player','team','market','model_prediction','model_median',
 'model_event_probability','model_direction','actual','signed_error','absolute_error',
 'event_happened','brier','status','source_generated_at_utc'];
const esc=s=>{const t=String(s??'');return /[,"\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t;};
writeFileSync(OUT_CSV,cols.join(',')+'\n'+rows.map(r=>cols.map(x=>esc(r[x])).join(',')).join('\n')+'\n');
console.log('NFL_W08_NOV01_FULL_GRADE',JSON.stringify({
 source:past.generated_at_utc,overall:output.overall,
 games:byGame.map(g=>({match:g.matchup,score:g.away_score+'-'+g.home_score,
  total:g.original_forecast_count,verified:g.grade.verified,
  missing:g.grade.unverified,
  rush:g.grade.by_market.rushing_yards,rec:g.grade.by_market.receiving_yards}))}).slice(0,15000));
