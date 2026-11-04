/** Late lineup overlay: turns EARLY forecasts into lineup-aware ones close to game time.
 *
 * - The early forecast is never overwritten: every adjusted row keeps `mean_early` (and NBA `model_target_early`).
 * - Fail-open: if a feed is down or a player is not mentioned, the row is returned unchanged (label NO_NEW_INFO).
 * - Only an explicit OUT / DOUBTFUL / IN status moves a number. A missing player is never assumed healthy or injured,
 *   except in the NHL once the league has posted its own lineup (then a rostered-away player is not in the lineup).
 *
 * Rules were fitted on older finished games and scored on newer ones (see late_lineup_check.py in mlb-picks2):
 *   NHL  perfect-lineup ceiling: P(1+ shot) Brier 0.1692 -> 0.1425; confirmed players scaled x1.058.
 *   NBA  held-out picks Brier 0.2210 -> 0.1786 by removing the did-not-play mass from the full distribution
 *        (every row's CDF contains P(DNP) at zero, checked on 4,000 rows).
 * Perfect-lineup numbers are an upper bound: real gains depend on how early the leagues post lineups.
 */
import type {Request,Response} from 'express';

export const LINEUP_OVERLAY_SCHEMA='LATE_LINEUP_OVERLAY_V1';
export type LineupStatus='OUT'|'DOUBTFUL'|'QUESTIONABLE'|'IN';
export type LineupLabel='CONFIRMED_OUT'|'DOUBTFUL'|'QUESTIONABLE'|'CONFIRMED_IN'|'NOT_IN_POSTED_LINEUP'|'NO_NEW_INFO';

export const NHL_RULE={doubtfulMean:0.25,inScale:1.058};
export const NBA_RULE={doubtfulKeep:0.25};

const ESPN='https://site.api.espn.com/apis/site/v2/sports/';
const NHL_API='https://api-web.nhle.com/v1';
const STATUS_MAP:Record<string,LineupStatus>={
 'out':'OUT','injured reserve':'OUT','ir':'OUT','suspension':'OUT','suspended':'OUT','inactive':'OUT',
 'not with team':'OUT','ltir':'OUT','doubtful':'DOUBTFUL',
 'questionable':'QUESTIONABLE','day-to-day':'QUESTIONABLE','day to day':'QUESTIONABLE','game time decision':'QUESTIONABLE',
 'probable':'IN','available':'IN','active':'IN',
};
export const ESPN_NHL_ALIAS:Record<string,string>={TB:'TBL',NJ:'NJD',LA:'LAK',SJ:'SJS',UTAH:'UTA',WAS:'WSH',MON:'MTL'};

export function normName(n:unknown):string{
 return String(n??'').normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase()
  .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,'').replace(/[^a-z]/g,'');
}
export function mapStatus(raw:unknown):LineupStatus{
 // Unknown wording is treated as QUESTIONABLE, never silently as healthy.
 return STATUS_MAP[String(raw??'').trim().toLowerCase()]??'QUESTIONABLE';
}
const rank:Record<LineupStatus,number>={OUT:3,DOUBTFUL:2,QUESTIONABLE:1,IN:0};
/** Later sources win, but OUT is never downgraded by a weaker source. */
export function setStatus(m:Map<string,LineupStatus>,key:string,s:LineupStatus){
 const cur=m.get(key);
 if(!cur||s==='OUT'||(cur!=='OUT'&&rank[s]>=rank[cur]))m.set(key,s);
}

export type GameStatus={
 lineupPosted:boolean;
 /** key = teamKey|normName */
 players:Map<string,LineupStatus>;
 sources:string[];
};

/* ----------------------------- parsers (pure) ----------------------------- */
export function parseEspnInjuries(summary:any,teamKey:(t:any)=>string,out:Map<string,LineupStatus>){
 for(const t of summary?.injuries??[]){
  const tk=teamKey(t?.team);
  for(const x of t?.injuries??[]){
   const nm=x?.athlete?.displayName??x?.athlete?.fullName;
   if(nm)setStatus(out,tk+'|'+normName(nm),mapStatus(x?.status));
  }
 }
}
/** NBA starters appear in the ESPN box score right before tip. Starters are IN; bench is unknown, not OUT. */
export function parseEspnStarters(summary:any,teamKey:(t:any)=>string,out:Map<string,LineupStatus>):boolean{
 let any=false;
 for(const t of summary?.boxscore?.players??[]){
  const tk=teamKey(t?.team);
  for(const g of t?.statistics??[])for(const a of g?.athletes??[]){
   if(a?.starter===true&&a?.athlete?.displayName){setStatus(out,tk+'|'+normName(a.athlete.displayName),'IN');any=true;}
  }
 }
 return any;
}
export function parseNhlOfficial(landing:any,rail:any,out:Map<string,LineupStatus>):boolean{
 let posted=Array.isArray(landing?.rosterSpots)&&landing.rosterSpots.length>0;
 const ab:Record<string,string>={};
 for(const side of ['awayTeam','homeTeam']){const t=landing?.[side];if(t){ab[side]=t.abbrev;ab[String(t.id)]=t.abbrev;}}
 for(const s of landing?.rosterSpots??[]){
  const tk=ab[String(s?.teamId)];
  const nm=`${s?.firstName?.default??''} ${s?.lastName?.default??''}`.trim();
  if(tk&&nm)setStatus(out,tk+'|'+normName(nm),'IN');
 }
 for(const side of ['awayTeam','homeTeam']){
  for(const s of rail?.gameInfo?.[side]?.scratches??[]){
   const nm=`${s?.firstName?.default??''} ${s?.lastName?.default??''}`.trim();
   if(ab[side]&&nm)setStatus(out,ab[side]+'|'+normName(nm),'OUT');   // scratches alone do NOT mean the full lineup is posted
  }
 }
 return posted;
}

/* ------------------------------ NHL adjustment ----------------------------- */
function nb2Survival(mu:number,alpha:number,k:number):number{
 // P(X>=k) for a negative binomial with mean mu and variance mu+alpha*mu^2
 const r=1/alpha,p=r/(r+mu);let cdf=0,lg=(x:number)=>{
  // Lanczos log-gamma
  const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  let y=x,t=x+5.5;t-=(x+0.5)*Math.log(t);let s=1.000000000190015;for(const v of c)s+=v/++y;return -t+Math.log(2.5066282746310005*s/x);
 };
 for(let i=0;i<k;i++)cdf+=Math.exp(lg(i+r)-lg(r)-lg(i+1)+r*Math.log(p)+i*Math.log(1-p));
 return Math.min(1,Math.max(0,1-cdf));
}
export function adjustNhlRow(row:any,status:LineupStatus|undefined,posted:boolean){
 const base={...row,mean_early:row.mean,model_probability_milestones_early:row.model_probability_milestones_research_only};
 const label=(l:LineupLabel,extra:Record<string,unknown>={})=>({...base,...extra,lineup_label:l,lineup_status:status??'UNKNOWN'});
 const zero=()=>label(status==='OUT'?'CONFIRMED_OUT':'NOT_IN_POSTED_LINEUP',{
  mean:0,median:0,p10:0,p90:0,
  model_probability_milestones_research_only:{'1':0,'2':0,'3':0,'4':0,'5':0}});
 if(status==='OUT')return zero();
 if(status===undefined&&posted)return zero();
 const m=Number(row.mean),sd=Number(row.sd);
 const alpha=(sd*sd-m)/(m*m);
 const rescale=(factor:number,l:LineupLabel)=>{
  if(!(m>0)||!Number.isFinite(alpha)||alpha<=0)return label('NO_NEW_INFO'); // cannot re-derive the distribution safely
  const mu=m*factor,out:Record<string,number>={};
  for(const k of [1,2,3,4,5])out[String(k)]=nb2Survival(mu,alpha,k);
  return label(l,{mean:mu,model_probability_milestones_research_only:out});
 };
 if(status==='DOUBTFUL')return rescale(NHL_RULE.doubtfulMean,'DOUBTFUL');
 if(status==='IN'&&posted)return rescale(NHL_RULE.inScale,'CONFIRMED_IN');
 return label(status==='QUESTIONABLE'?'QUESTIONABLE':'NO_NEW_INFO');
}
export function applyNhlOverlay(result:any,statusByGame:Map<string,GameStatus>){
 let adjusted=0,gamesWithInfo=0;
 const seen=new Set<string>();
 const projections=(result.projections??[]).map((r:any)=>{
  const g=statusByGame.get(String(r.game_id));
  if(!g)return {...r,mean_early:r.mean,lineup_label:'NO_NEW_INFO',lineup_status:'UNKNOWN'};
  if(!seen.has(String(r.game_id))){seen.add(String(r.game_id));gamesWithInfo++;}
  const out=adjustNhlRow(r,g.players.get(String(r.team).toUpperCase()+'|'+normName(r.player)),g.lineupPosted);
  if(out.lineup_label!=='NO_NEW_INFO'&&out.lineup_label!=='QUESTIONABLE')adjusted++;
  return out;
 });
 return {...result,projections,lineup_overlay:{
  schema:LINEUP_OVERLAY_SCHEMA,games_with_lineup_feed:gamesWithInfo,rows_adjusted:adjusted,
  early_forecast_preserved:true,
  note:'mean_early / model_probability_milestones_early hold the original early forecast.'}};
}

/* ------------------------------ NBA adjustment ----------------------------- */
/** Condition an NBA row's full distribution on the player playing. The CDF includes P(DNP)=1-p_active at zero. */
export function conditionOnPlaying(row:any){
 const pa=Number(row.p_active);
 if(!(pa>0&&pa<=1))return null;
 const cdf:number[]=row.cdf_lattice.cdf;
 if(!(cdf[0]>=1-pa-1e-6))return null;                       // distribution does not carry the DNP mass: do not touch
 const next=cdf.map(v=>Math.min(1,Math.max(0,(v-(1-pa))/pa)));
 for(let i=1;i<next.length;i++)if(next[i]<next[i-1])next[i]=next[i-1];
 return next;
}
function cdfStats(cdf:number[]){
 // lattice step 1 starting at 0; P(X=k)=cdf[k]-cdf[k-1], remaining mass sits above the lattice
 const q=(p:number)=>{for(let i=0;i<cdf.length;i++)if(cdf[i]>=p)return i;return cdf.length;};
 let mean=0,prev=0;for(let i=0;i<cdf.length;i++){mean+=i*(cdf[i]-prev);prev=cdf[i];}
 mean+=cdf.length*(1-prev);
 return {mean,median:q(.5),p10:q(.1),p25:q(.25),p75:q(.75),p90:q(.9)};
}
export function adjustNbaRow(row:any,status:LineupStatus|undefined){
 const base={...row,mean_early:row.mean,p_active_early:row.p_active,model_target_early:row.model_target};
 const lab=(l:LineupLabel,extra:Record<string,unknown>={})=>({...base,...extra,lineup_label:l,lineup_status:status??'UNKNOWN'});
 if(status==='OUT'){
  return lab('CONFIRMED_OUT',{mean:0,median:0,p10:0,p25:0,p75:0,p90:0,p_active:0,
   cdf_lattice:{step:1,cdf:row.cdf_lattice.cdf.map(()=>1)},model_target:null,reported_status:'OUT'});
 }
 if(status==='IN'){
  const c=conditionOnPlaying(row);
  if(!c)return lab('NO_NEW_INFO');
  const s=cdfStats(c);
  let target=null;
  if(row.model_target){
   const t=row.model_target.milestone;
   const p=t>0&&t<=c.length?1-c[t-1]:NaN;
   // keep the pick only if it still clears the original 65% bar once the player is confirmed
   if(Number.isFinite(p)&&p>=0.65)target={...row.model_target,probability:p,method:row.model_target.method+'+lineup_confirmed'};
  }
  return lab('CONFIRMED_IN',{...s,p_active:1,cdf_lattice:{step:1,cdf:c},model_target:target});
 }
 if(status==='DOUBTFUL'){
  const pa=Math.min(row.p_active,NBA_RULE.doubtfulKeep);
  return lab('DOUBTFUL',{p_active:pa,model_target:null});     // never headline a doubtful player
 }
 return lab(status==='QUESTIONABLE'?'QUESTIONABLE':'NO_NEW_INFO');
}
export function applyNbaOverlay(result:any,statusByGame:Map<string,GameStatus>){
 let adjusted=0,gamesWithInfo=0;
 const games=(result.games??[]).map((g:any)=>{
  const gs=statusByGame.get(String(g.game_id));
  if(!gs)return g;
  gamesWithInfo++;
  const rows=g.rows.map((r:any)=>{
   const out=adjustNbaRow(r,gs.players.get(String(r.team_id)+'|'+normName(r.player)));
   if(out.lineup_label!=='NO_NEW_INFO'&&out.lineup_label!=='QUESTIONABLE')adjusted++;
   return out;
  });
  return {...g,rows,lineup_sources:gs.sources};
 });
 return {...result,games,lineup_overlay:{
  schema:LINEUP_OVERLAY_SCHEMA,games_with_lineup_feed:gamesWithInfo,rows_adjusted:adjusted,
  early_forecast_preserved:true,
  note:'mean_early / p_active_early / model_target_early hold the original early forecast.'}};
}

/* --------------------------------- network --------------------------------- */
type Fetcher=typeof fetch;
async function getJson(f:Fetcher,url:string,ms=4500):Promise<any|null>{
 try{
  const r=await f(url,{headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(ms)});
  return r.ok?await r.json():null;
 }catch{return null;}
}
const cache=new Map<string,{at:number;value:Promise<Map<string,GameStatus>>}>();
const TTL_MS=90_000;
const within=(iso:unknown,now:number,hoursBefore:number,hoursAfter:number)=>{
 const t=Date.parse(String(iso));return Number.isFinite(t)&&t-now<=hoursBefore*3600000&&now-t<=hoursAfter*3600000;
};

/** NBA games whose tip is within 6h (or started within 3h). Key = V3 game_id (= ESPN event id). */
export async function loadNbaStatus(games:{game_id:string;tipoff_utc:string}[],f:Fetcher=fetch,now=Date.now(),hoursBefore=30){
 const out=new Map<string,GameStatus>();
 await Promise.all(games.filter(g=>within(g.tipoff_utc,now,hoursBefore,3)).map(async g=>{
  const s=await getJson(f,`${ESPN}basketball/nba/summary?event=${encodeURIComponent(g.game_id)}`);
  if(!s)return;
  const players=new Map<string,LineupStatus>(),teamKey=(t:any)=>String(t?.id??'');
  parseEspnInjuries(s,teamKey,players);
  const started=parseEspnStarters(s,teamKey,players);
  out.set(String(g.game_id),{lineupPosted:started,players,sources:['espn_injuries'].concat(started?['espn_starters']:[])});
 }));
 return out;
}

/** NHL: key = NHL game id (same id the ledger uses). ESPN supplies injuries; the league feed supplies scratches + posted roster. */
export async function loadNhlStatus(date:string,games:{game_id:string;team:string;opponent:string;scheduled_start:string}[],f:Fetcher=fetch,now=Date.now(),hoursBefore=30){
 const out=new Map<string,GameStatus>();
 const byId=new Map<string,{teams:Set<string>;start:string}>();
 for(const g of games){
  const e=byId.get(String(g.game_id))??{teams:new Set<string>(),start:g.scheduled_start};
  e.teams.add(String(g.team).toUpperCase());e.teams.add(String(g.opponent).toUpperCase());byId.set(String(g.game_id),e);
 }
 const sb=await getJson(f,`${ESPN}hockey/nhl/scoreboard?dates=${date.replace(/-/g,'')}`);
 const espnByPair=new Map<string,string>();
 for(const e of sb?.events??[]){
  const ab=(e.competitions?.[0]?.competitors??[]).map((c:any)=>{const a=String(c?.team?.abbreviation);return ESPN_NHL_ALIAS[a]??a;});
  if(ab.length===2)espnByPair.set([...ab].sort().join('|'),String(e.id));
 }
 await Promise.all([...byId.entries()].filter(([,v])=>within(v.start,now,hoursBefore,3)).map(async([gid,v])=>{
  const players=new Map<string,LineupStatus>(),sources:string[]=[];
  const [land,rail]=await Promise.all([
   getJson(f,`${NHL_API}/gamecenter/${gid}/landing`),getJson(f,`${NHL_API}/gamecenter/${gid}/right-rail`)]);
  let posted=false;
  if(land||rail){posted=parseNhlOfficial(land,rail,players);sources.push('nhl_official');}
  const eid=espnByPair.get([...v.teams].sort().join('|'));
  if(eid){
   const s=await getJson(f,`${ESPN}hockey/nhl/summary?event=${eid}`);
   if(s){
    const espn=new Map<string,LineupStatus>();
    parseEspnInjuries(s,(t:any)=>{const a=String(t?.abbreviation);return ESPN_NHL_ALIAS[a]??a;},espn);
    for(const [k,st] of espn)setStatus(players,k,st);   // OUT from either source stays OUT
    sources.push('espn_injuries');
   }
  }
  if(sources.length)out.set(gid,{lineupPosted:posted,players,sources});
 }));
 return out;
}


/* ------------------- published overlay (fetched by a scheduled GitHub job) -------------------
 * The app host may be unable to reach ESPN / the NHL API, but it can read GitHub. A scheduled job writes
 * docs/lineup_overlay/<sport>.json; the app reads it first and also tries its own live fetch. OUT wins. */
export const PUBLISHED_SCHEMA='LATE_LINEUP_PUBLISHED_V1';
export const PUBLISHED_URL=(sport:'nba'|'nhl')=>'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks3/main/docs/lineup_overlay/'+sport+'.json';
export const PUBLISHED_MAX_AGE_MS=3*3600_000;
export function serializeStatus(m:Map<string,GameStatus>){
 const games:Record<string,{lineupPosted:boolean;sources:string[];players:Record<string,LineupStatus>}>={};
 for(const [id,g] of m)games[id]={lineupPosted:g.lineupPosted,sources:g.sources,players:Object.fromEntries(g.players)};
 return games;
}
export function parsePublished(doc:any,now=Date.now()):Map<string,GameStatus>|null{
 if(!doc||doc.schema!==PUBLISHED_SCHEMA||typeof doc.games!=='object'||doc.games===null)return null;
 const at=Date.parse(doc.generated_at);
 if(!Number.isFinite(at)||now-at>PUBLISHED_MAX_AGE_MS||at-now>600_000)return null;   // stale or from the future: ignore, never trust blindly
 const out=new Map<string,GameStatus>();
 for(const [id,g] of Object.entries<any>(doc.games)){
  const players=new Map<string,LineupStatus>();
  for(const [k,v] of Object.entries<any>(g?.players??{}))if(['OUT','DOUBTFUL','QUESTIONABLE','IN'].includes(v))players.set(k,v);
  out.set(String(id),{lineupPosted:g?.lineupPosted===true,players,sources:(Array.isArray(g?.sources)?g.sources:[]).concat(['published_overlay'])});
 }
 return out;
}
export function mergeStatusMaps(a:Map<string,GameStatus>|null,b:Map<string,GameStatus>|null){
 const out=new Map<string,GameStatus>();
 for(const m of [a,b])for(const [id,g] of m??[]){
  const cur=out.get(id);
  if(!cur){out.set(id,{lineupPosted:g.lineupPosted,players:new Map(g.players),sources:[...g.sources]});continue;}
  for(const [k,v] of g.players)setStatus(cur.players,k,v);
  cur.lineupPosted=cur.lineupPosted||g.lineupPosted;
  cur.sources=[...new Set([...cur.sources,...g.sources])];
 }
 return out;
}
async function loadPublished(sport:'nba'|'nhl',f:Fetcher,now:number){
 try{return parsePublished(await getJson(f,PUBLISHED_URL(sport)+'?t='+now,6000),now);}catch{return null;}
}

async function cached(key:string,now:number,make:()=>Promise<Map<string,GameStatus>>){
 const prior=cache.get(key);
 if(prior&&now-prior.at<TTL_MS)return prior.value;
 const value=make();cache.set(key,{at:now,value});
 value.catch(()=>cache.delete(key));
 return value;
}
export async function overlayNba(result:any,f:Fetcher=fetch,now=Date.now()){
 try{
  const ids=(result.games??[]).map((g:any)=>g.game_id).join(',');
  const live=await cached('nba|'+ids,now,()=>loadNbaStatus(result.games??[],f,now));
  const pub=await cached('pub|nba',now,async()=>(await loadPublished('nba',f,now))??new Map());
  return applyNbaOverlay(result,mergeStatusMaps(pub,live));
 }catch{return {...result,lineup_overlay:{schema:LINEUP_OVERLAY_SCHEMA,unavailable:true,early_forecast_preserved:true}};}
}
export async function overlayNhl(result:any,f:Fetcher=fetch,now=Date.now()){
 try{
  const live=await cached('nhl|'+result.game_date+'|'+(result.projections?.length??0),now,()=>loadNhlStatus(result.game_date,result.projections??[],f,now));
  const pub=await cached('pub|nhl',now,async()=>(await loadPublished('nhl',f,now))??new Map());
  return applyNhlOverlay(result,mergeStatusMaps(pub,live));
 }catch{return {...result,lineup_overlay:{schema:LINEUP_OVERLAY_SCHEMA,unavailable:true,early_forecast_preserved:true}};}
}
export type {Request,Response};
