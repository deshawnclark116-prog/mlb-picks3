/** NFL distribution-based frontend selection RESEARCH ONLY.
 * No production selector, frozen forecasts or original grades are mutated.
 * Source: verified 2026-11-01 T24 originals, 12 full player distributions.
 * Predeclared policies compare source risk, calibrated claims remain forbidden.
 */
import {readFileSync,writeFileSync} from 'node:fs';
const gameIDs=['CIN_BAL','CLE_TEN','DAL_PHI','DEN_ARI','GB_DET','IND_MIN','KC_SEA','LA_LV','MIA_NYJ','NE_CHI','NYG_HOU','PIT_NO','SF_ATL','TB_CAR'];
const snapshot={distributionTreeCommit:'1227b9f342fadd0fef1a77907c1513ef9d02a733',
 roleWarnings:{groups:[]},
 games:gameIDs.map(k=>{const [away,home]=k.split('_');return {
 id:'2026_07_'+k,away,home,kickoff:null,
 batchPath:'forecasts/batches/2026_wk07_T24_2026_07_'+k+'.jsonl',
 roleExcludedTeams:[]};})};
const owner='https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/';
const source=owner+snapshot.distributionTreeCommit+'/forecasts/batches/';
const nfl='https://site.api.espn.com/apis/site/v2/sports/football/nfl/';
async function fetchJson(url){
 let error;for(let attempt=0;attempt<3;attempt++){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),17000);
 try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw Error('REMOTE_'+r.status+' '+url);return await r.json()}catch(e){error=e}finally{clearTimeout(t)}
 }throw error;
}
async function fetchText(url){
 let error;for(let attempt=0;attempt<3;attempt++){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),17000);
 try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw Error('REMOTE_'+r.status+' '+url);return await r.text()}catch(e){error=e}finally{clearTimeout(t)}
 }throw error;
}
const normal=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'').replace(/(jr|sr|ii|iii|iv|v)$/,'');
const team=s=>({LAR:'LA',WSH:'WAS'}[s]||s);
const number=s=>/^[-+]?\d+(?:\.\d+)?$/.test(String(s))?Number(s):null;
const outcomes=new Set(['rec','rec_yds','rush_yds','pass_yds','pass_td','rush_td','rec_td','atd','int']);
const isYard=o=>o.endsWith('_yds');
const tolerance=o=>o==='pass_yds'?25:10;
function probability(rec){
 const n=Math.round(rec.median);
 if(!outcomes.has(rec.outcome)||!Number.isFinite(n)||n<1)return null;
 if(isYard(rec.outcome)){
  const q=rec.quantile_grid_99;if(!Array.isArray(q)||q.length!==99||q.some((v,i)=>!Number.isFinite(v)||(i&&v<q[i-1])))return null;
  const t=tolerance(rec.outcome),prob=q.filter(v=>v>=n).length/99,within=q.filter(v=>Math.abs(v-n)<=t).length/99;
  return {projection:n,atLeast:prob,bandProb:within,bandTolerance:t,exact:null,method:'frozen_grid_99_uncalibrated'};
 }
 const c=rec.cdf_lattice?.cdf;
 if(rec.cdf_lattice?.step!==1||!Array.isArray(c)||n>=c.length||
   c.some((v,i)=>!Number.isFinite(v)||v<0||v>1||(i&&v<c[i-1])))return null;
 return {projection:n,atLeast:1-c[n-1],bandProb:null,bandTolerance:null,
  exact:c[n]-c[n-1],method:'original_integer_cdf_uncalibrated'};
}
const boards=await Promise.all(['20261022','20261025','20261026'].map(d=>fetchJson(nfl+'scoreboard?dates='+d+'&limit=100')));
const allEvents=new Map(boards.flatMap(b=>b.events||[]).map(e=>[e.id,e]));
const root={events:[...allEvents.values()].filter(e=>e.status?.type?.completed)};
if(root.events.length<14)throw Error('WEEK07_FINALE_COVERAGE_INCOMPLETE_'+root.events.length);
async function finalGame(event){
 const doc=await fetchJson(nfl+'summary?event='+event.id);const sports=doc.boxscore?.players;
 if(!Array.isArray(sports)||sports.length!==2)throw Error('MISSING_ESPN_GAME_'+event.id);
 const by={};
 for(const t of sports){
  const people=new Map();
  for(const stat of t.statistics||[])for(const a of stat.athletes||[]){
   if(!a.athlete?.displayName||!Array.isArray(a.stats)||a.stats.length!==stat.labels.length)continue;
   const key=normal(a.athlete.displayName),p=people.get(key)||{name:a.athlete.displayName,market:{}};
   p.market[stat.name]=Object.fromEntries(stat.labels.map((k,i)=>[k,a.stats[i]]));people.set(key,p);
  }
  by[team(t.team.abbreviation)]=people;
 }
 const ids=event.competitions[0].competitors.map(t=>team(t.team.abbreviation)).sort().join('|');
 return {ids,kickoff:event.date,by};
}
const allFinal=await Promise.all(root.events.map(finalGame)),finalIndex=new Map(allFinal.map(x=>[x.ids,x]));
if(finalIndex.size<14)throw Error('DUPLICATE_FINAL_MATCHUP_OR_MISSING_WEEK7_GAMES');
function actual(p,g){
 const z=g.by[p.team]?.get(normal(p.player));
 if(!z)return null;
 const names={rec:['receiving','REC'],rec_yds:['receiving','YDS'],
 rush_yds:['rushing','YDS'],pass_yds:['passing','YDS'],
 pass_td:['passing','TD'],rec_td:['receiving','TD'],
 rush_td:['rushing','TD'],int:['passing','INT']};
 if(p.outcome==='atd'){
  const fields=['rushing','receiving','defensive','interceptions','kickReturns','puntReturns'];
  const vals=fields.map(f=>z.market[f]?.TD==null?0:number(z.market[f].TD));
  return vals.every(v=>v!==null)?vals.reduce((a,b)=>a+b,0):null;
 }
 const [cat,key]=names[p.outcome]||[];
 if(!cat)return null;
 const val=z.market[cat]?.[key];
 return val==null?0:number(val);
}
const warningSet=new Set();
function original65(r){
 const oc=r.outcome;
 if(['rec_yds','rush_yds','pass_yds'].includes(oc)){
  const q=r.quantile_grid_99;if(!Array.isArray(q)||q.length!==99)return null;
  const start=oc==='pass_yds'?100:10,step=oc==='pass_yds'?25:10;
  let best=null;
  for(let milestone=start;milestone<=Math.floor(q[34]/step)*step;milestone+=step){
   const first=q.findIndex(x=>x>=milestone),p=first<0?0:(99-first)/100;
   if(p<.65)break;best=p;
  }return best;
 }
 const c=r.cdf_lattice?.cdf;if(!Array.isArray(c)||r.cdf_lattice.step!==1)return null;
 if(1-c[c.length-1]>=.65)return null;
 let best=null;
 for(let m=1;m<c.length;m++){const p=1-c[m-1];if(p<.65)break;best=p}return best;
}
function classify(r,g){
 const prob=probability(r);if(!prob||typeof r.p_active!=='number'||!Number.isFinite(r.p_active))return null;
 const candidate={game:g.id,id:r.id,player:r.player_name,team:r.team,opponent:r.opponent,
  outcome:r.outcome,pActive:r.p_active,median:r.median,
  ...prob,roleBlocked:warningSet.has(g.id+'|'+r.team)};
 return candidate;
}
function policyCandidates(rows,method){
 let pool=rows.filter(r=>r.pActive>=.75);
 if(method==='raw_round')return pool.sort((a,b)=>b.atLeast-a.atLeast||
  b.pActive-a.pActive||a.player.localeCompare(b.player)||a.outcome.localeCompare(b.outcome)||a.id.localeCompare(b.id)).slice(0,10);
 // pre-registered conservative exploratory rule: avoid volatile availability;
 // close-to-median probability is evaluated using exact CDF or stat-specific
 // practical tolerance. This is not a calibrated selection probability.
 pool=pool.filter(x=>x.pActive>=.90&&!x.roleBlocked&&
   x.atLeast>=(isYard(x.outcome)?.49:.55)&&
   (isYard(x.outcome)?x.bandProb>=.25:x.exact>=.15));
 const caps={rec:4,rec_yds:3,rush_yds:2,pass_yds:1,pass_td:1,
  rush_td:1,rec_td:1,atd:1,int:1};
 const riskScore=x=>(isYard(x.outcome)?x.bandProb:x.exact)*x.pActive;
 pool.sort((a,b)=>riskScore(b)-riskScore(a)||
  b.pActive-a.pActive||a.player.localeCompare(b.player)||a.outcome.localeCompare(b.outcome)||a.id.localeCompare(b.id));
 const picked=[],cnt={};
 for(const p of pool){
  if((cnt[p.outcome]||0)>=(caps[p.outcome]||0))continue;
  picked.push(p);cnt[p.outcome]=(cnt[p.outcome]||0)+1;
  if(picked.length===10)break;
 }
 return picked;
}
function verify(selected,g){
 return selected.map(p=>{
  const value=actual(p,g),verified=value!==null;
  return {...p,actual:value,verified,
   roundedSignedError:verified?value-p.projection:null,
   absError:verified?Math.abs(value-p.projection):null,
   atLeastHit:verified?value>=p.projection:null,
   exactHit:verified?value===p.projection:null,
   withinTolerance:verified&&isYard(p.outcome)?Math.abs(value-p.projection)<=p.bandTolerance:null};
 });
}
const summary=list=>{
 const v=list.filter(x=>x.verified),yards=v.filter(x=>isYard(x.outcome)),counts=v.filter(x=>!isYard(x.outcome));
 const grouped={};for(const m of [...new Set(list.map(x=>x.outcome))]){
  const items=list.filter(x=>x.outcome===m),done=items.filter(x=>x.verified);
  grouped[m]={n:items.length,verified:done.length,
   exact:done.filter(x=>x.exactHit).length,
   medianMae:done.length?+(done.reduce((a,x)=>a+x.absError,0)/done.length).toFixed(3):null,
   atLeastReached:done.filter(x=>x.atLeastHit).length,
   averageAtLeastP:done.length?+(done.reduce((a,x)=>a+x.atLeast,0)/done.length).toFixed(3):null};
 }
 return {n:list.length,verified:v.length,unverified:list.length-v.length,
  exact:v.filter(x=>x.exactHit).length,
  countN:counts.length,countExact:counts.filter(x=>x.exactHit).length,
  countMae:counts.length?+(counts.reduce((a,x)=>a+x.absError,0)/counts.length).toFixed(3):null,
  yardN:yards.length,yardMae:yards.length?+(yards.reduce((a,x)=>a+x.absError,0)/yards.length).toFixed(3):null,
  yardWithinTolerance:yards.filter(x=>x.withinTolerance).length,
  medianAtLeastHit:v.filter(x=>x.atLeastHit).length,
  meanUncalibratedAtLeastP:v.length?+(v.reduce((a,x)=>a+x.atLeast,0)/v.length).toFixed(3):null,
  brierAtLeast:v.length?+(v.reduce((a,x)=>a+(x.atLeast-Number(x.atLeastHit))**2,0)/v.length).toFixed(4):null,
  markets:grouped};
};
const games=await Promise.all(snapshot.games.map(async g=>{
 const txt=await fetchText(source+g.batchPath.split('/').at(-1));
 const lines=txt.trim().split('\n'),meta=JSON.parse(lines[0]),footer=JSON.parse(lines.at(-1));
 const records=lines.slice(1,-1).map(JSON.parse);
 g.kickoff=records[0]?.kickoff;
 if(meta.game_id!==g.id||meta.horizon!=='T24'||footer.n!==records.length||
  !Number.isFinite(Date.parse(g.kickoff))||
  Date.parse(meta.generated_at)>=Date.parse(g.kickoff))throw Error('FROZEN_INPUT_FAILED_'+g.id);
 const complete=records.map(r=>classify(r,g)).filter(Boolean);
 const lookup=new Map(complete.map(x=>[x.id,x]));
 const final=finalIndex.get([g.away,g.home].sort().join('|'));
 if(!final||Date.parse(final.kickoff)!==Date.parse(g.kickoff))throw Error('FINAL_MATCH_FAILED_'+g.id);
 const baseline=records.filter(r=>outcomes.has(r.outcome)&&r.player_name&&r.p_active>=.75)
  .map(r=>({c:lookup.get(r.id),p:original65(r)}))
  .filter(x=>x.c&&x.p!==null&&x.p>=.65)
  .sort((a,b)=>b.p-a.p||b.c.pActive-a.c.pActive||
   a.c.player.localeCompare(b.c.player)||a.c.outcome.localeCompare(b.c.outcome)||a.c.id.localeCompare(b.c.id));
 const legacy=baseline.slice(0,10).map(x=>x.c);
 const projected=policyCandidates([...complete],'raw_round');
 const diverse=policyCandidates([...complete],'diverse');
 return {game:g.id,matchup:g.away+' @ '+g.home,sourceCandidates:complete.length,
  legacy:verify(legacy,final),rawRound:verify(projected,final),diverse:verify(diverse,final),
  pregameRoleFlags:g.roleExcludedTeams};
}));
const variants={};
for(const key of ['legacy','rawRound','diverse'])variants[key]=summary(games.flatMap(g=>g[key]));
const output={schema:'NFL_WK07_PREGAME_FRONTEND_SELECTION_ABLATION_SHADOW_V1',
 createdAt:new Date().toISOString(),researchOnly:true,
 source:'Frozen T24 2026-10-25 original 14 immutable simulation batches + final ESPN',
 noOutcomeDrivenSelection:true,
 policies:{
  legacy:'Reconstructed 65%+ easier milestone top 10 per game',
  rawRound:'P(X >= round(original median)), top 10 per game; risks repertoire collapse into counts',
  diverse:'>=90% P(active); valid P(X>=rounded median) and distribution concentration, role warnings excluded, caps 4 receptions / 3 rec yards / 2 rush yards / 1 pass yards / 1 pass TD, no forced 10',
  caution:'All P values are UNCALIBRATED distribution frequencies; compare only with predetermined outcome and forward seasons, do not optimize on this week'},
 variants, games:games.map(g=>({
  matchup:g.matchup,sourceCandidates:g.sourceCandidates,
  roleWarnings:g.pregameRoleFlags,
  legacy:summary(g.legacy),rawRound:summary(g.rawRound),diverse:summary(g.diverse),
  selected:{legacy:g.legacy,rawRound:g.rawRound,diverse:g.diverse}
 }))
};
writeFileSync('docs/nfl_week7_projection_selection_shadow_ablation.json',JSON.stringify(output,null,2)+'\n');
const report=[
 '# NFL frontend mix selection — earlier Week 7 frozen-snapshot research ablation',
 '', '**Research only.** The 14 historical games are a diagnostic, not an untouched holdout. No selection logic was promoted to the frontend.',
 '', '## Model projection, not easy targets', '',
 'Count: rounded median, with P(X>=rounded median) and P(exact count) from original frozen CDF. Yards: rounded median, with P(Y>=rounded median) and a **separate** distribution concentration probability P(within ±10 yards of rush/receiving or ±25 yards passing). They are different events and are not interchangeable.',
 '', '## Compared policies','',
 '| Policy | Selected | Verified | Unverified | Count exact / n | Count MAE | Yard n | Yard MAE | Median attainment |',
 '|:--|--:|--:|--:|--:|--:|--:|--:|--:|',
 ...Object.entries(variants).map(([k,v])=>'| '+k+' | '+v.n+' | '+v.verified+' | '+v.unverified+' | '+v.countExact+'/'+v.countN+' | '+v.countMae+' | '+v.yardN+' | '+v.yardMae+' | '+v.medianAtLeastHit+'/'+v.verified+' |'),
 '',
 '### Critical interpretability limits',
 '- Numeric exact accuracy, band accuracy, role coverage and model median attainment are separately graded. They cannot be replaced by old 65%+ **easier** target hit rates.',
 '- The 65% cutoff cannot be applied universally to a median: yard medians have roughly 50% attainment probability.',
 '- The diverse cap is a hypothetical allocation with **fixed predeclared** filters, not an optimized or promoted configuration.',
 '- A high probability of being within ±10 yards is not an exact-yard hit probability, and must be labeled as a range.',
 '- The original Sunday is already inspected; this test supports diagnosis only. A promotion requires earlier-season walk-forward and an untouched forward evaluation.',
 '', '## Game-by-game', ''
];
for(const g of output.games)report.push('### '+g.matchup,'',
 '| Selector | Entries | Verified | Unverified | Count exact | Count MAE | Yard entries | Yard MAE |',
 '|:--|--:|--:|--:|--:|--:|--:|--:|',
 ...['legacy','rawRound','diverse'].map(k=>{const s=g[k];return '| '+k+' | '+s.n+' | '+s.verified+' | '+s.unverified+' | '+s.countExact+' / '+s.countN+' | '+s.countMae+' | '+s.yardN+' | '+s.yardMae+' |'}),'',
 '**Potential diversified selection, model median (not easier milestone):**','',
 '| Player | Market | Projected | P(at least projected) | Actual | Numerical error |',
 '|:--|:--|--:|--:|--:|--:|',
 ...g.selected.diverse.map(x=>'| '+x.player+' ('+x.team+') | '+x.outcome+' | '+x.projection+' | '+(x.atLeast*100).toFixed(1)+'% | '+(x.actual===null?'Unverified':x.actual)+' | '+(x.absError===null?'—':x.absError)+' |'),'');
writeFileSync('docs/NFL_WEEK7_FRONTEND_SELECTION_SHADOW_TEST.md',report.join('\n').trimEnd()+'\n');
console.log('NFL_W7_SELECTION_SHADOW',JSON.stringify({variants,games:output.games.map(g=>({game:g.matchup,n:g.diverse.n,verified:g.diverse.verified,byMarket:g.diverse.markets}))}).slice(0,15500));
