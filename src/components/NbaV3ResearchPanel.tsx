import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {RefreshCw,ChevronDown,Image} from 'lucide-react';
import NbaV5ShareModal from './NbaV5ShareModal';
import {wholeStatProjection} from '../lib/wholeStatProjection';

type Market='points'|'rebounds'|'assists'|'three_pointers_made'|'steals'|'blocks'|'turnovers';
const MARKETS:Market[]=['points','rebounds','assists','three_pointers_made','steals','blocks','turnovers'];
const NAME:Record<Market,string>={points:'POINTS',rebounds:'REBOUNDS',
 assists:'ASSISTS',three_pointers_made:'THREES',steals:'STEALS',blocks:'BLOCKS',turnovers:'TURNOVERS'};
const UNIT:Record<Market,string>={points:'PTS',rebounds:'REB',assists:'AST',
 three_pointers_made:'3PM',steals:'STL',blocks:'BLK',turnovers:'TOV'};
type Forecast={
 player:string;team_id:string;player_id:string;market:Market;model_version?:string;
 mean:number;median:number;p10:number;p25:number;p75:number;p90:number;
 p_active:number;exp_opp:number;role_share:number;unc_reasons:string[];
 reported_status:string;
 starter_evidence?:'CONFIRMED_STARTER'|'CONFIRMED_NONSTARTER'|'NOT_VERIFIED';
 starter_source?:string|null;
 lineup_label?:string;mean_early?:number;p_active_early?:number;
 p_start?:number|null;p_close?:number|null;minutes_mean?:number;minutes_p10?:number;minutes_p90?:number;
 depends_on?:{if_out:string;if_out_name?:string;projection_if_out:number;change:number}[];
 role_change?:{status:string;candidate_metrics?:string[];shadow_only:boolean};
 reach_probabilities?:{whole_projection:number;probability_if_playing:number;
  probability_including_dnp:number;p_active:number;forward_calibrated:boolean};
 uncertainty_audit?:{minutes_association_r2:number;simulation_mean_mc_se:number;diagnostic_scope:string};
 model_target:{milestone:number;probability:number;method:string}|null;
 cdf_lattice?:{step:number;cdf:number[]};
};
type Game={game_id:string;away:string;home:string;tipoff_utc:string;
 forecast_at_utc:string;rows_count:number;rows:Forecast[];
 forecast_kind?:string;first_seen_forecast_at_utc?:string;
 certified_pregame_team_effect?:Record<string,{applied:boolean;confirmed_starters?:number}>};
type Shadow={schema:string;status:string;upcoming_games:number;
 original_games_audited:number;research_only:true;official_bets:0;games:Game[];
 prospective_model_probability_calibration_verified:false;
 sportsbook_lines_required:false;
 v5_published_sync?:{
  provider:'PUBLIC_GITHUB_V5_ASOF_RELEASE';
  checked_at_utc:string;
  latest_generation_at_utc:string|null;
  source_state:'SOURCE_VERIFIED'|'SOURCE_UNAVAILABLE_LOCAL_FALLBACK';
  latest_applied:number;
  archived_applied:number;
  source_error:string|null;
 };
};
const pct=(v:number)=>(v*100).toFixed(1)+'%';
const fmt=(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:1});
const dateET=(iso:string)=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',
 year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso));
 const vals=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return vals.year+'-'+vals.month+'-'+vals.day;
};
const et=(iso:string)=>new Date(iso).toLocaleString('en-US',
 {timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',
  minute:'2-digit'})+' ET';

/** A system target is a true V3 model CDF event, NEVER a verified sportsbook
 * wager or current-season calibrated hit rate. Reject known reported OUT.
 * The V3 minutes/usage model supplies the player's role; we do NOT reuse
 * the V2 hard 26-minute gate nor hard-cap at 2 picks per game.
 */
export function v3QualifiedResearchTargets(g:Game):Forecast[]{
 const seen=new Set<string>();
 return g.rows.filter(r=>{
  if(!r.model_target||r.reported_status==='OUT'||r.p_active<.75||
      r.model_target.probability<.65||!Number.isFinite(r.model_target.probability))
    return false;
  const key=[g.game_id,r.team_id,r.player_id,r.market].join('|');
  if(seen.has(key))throw Error('NBA_V3_DUPLICATE_PLAYER_MARKET_OUTCOME');
  seen.add(key);
  return true;
 }).sort((a,b)=>
   (b.model_target?.probability||0)-(a.model_target?.probability||0)||
   b.p_active-a.p_active||
   a.player.localeCompare(b.player)||MARKETS.indexOf(a.market)-MARKETS.indexOf(b.market));
}
/** The model's own projection as the pick: the projection is rounded with the app's
 * rule (x.6 and up rounds up) and its percentage is the chance of reaching AT LEAST
 * that number, taken from the same full-game simulation. cdf[i] = P(X < i+1), so
 * P(X >= k) = 1 - cdf[k-1]. No lower target is substituted. */
const MEANINGFUL_MIN:Record<Market,number>={points:6,rebounds:3,assists:2,three_pointers_made:1,steals:1,blocks:1,turnovers:2};
export type ProjectionItem={row:Forecast;whole:number;prob:number|null};
/** V5 reports all-scenarios probability (including DNP); V3/V4 keep their
 * existing conditional probabilities. Never change the projected threshold. */
export function displayedChance(it:ProjectionItem):number|null{
 const p=it.row.reach_probabilities;
 return p&&p.whole_projection===it.whole? p.probability_including_dnp:it.prob;
}
const pctOrDash=(v:number|null)=>v===null?'n/a':pct(v);
export function chanceAtLeast(row:Forecast,k:number):number|null{
 const l=row.cdf_lattice;
 if(!l||l.step!==1||!Array.isArray(l.cdf)||!l.cdf.length||!Number.isInteger(k)||k<0)return null;
 if(k===0)return 1;
 if(k-1>=l.cdf.length)return 0;
 const below=l.cdf[k-1];
 return Number.isFinite(below)&&below>=0&&below<=1?1-below:null;
}
export function projectionItem(row:Forecast):ProjectionItem|null{
 if(!Number.isFinite(row.mean)||row.mean<0)return null;
 const whole=wholeStatProjection(row.mean);
 return {row,whole,prob:chanceAtLeast(row,whole)};
}
export function v3ProjectionPicks(g:Game):ProjectionItem[]{
 const seen=new Set<string>();
 const out:ProjectionItem[]=[];
 for(const r of g.rows){
  // The full MODEL BOARD retains turnovers; they are not featured picks.
  if(r.market==='turnovers'||r.reported_status==='OUT'||!(r.p_active>=.75))continue;
  const it=projectionItem(r);
  if(!it||it.prob===null)continue;
  // A projection of "0 threes" or "1 point" is not a meaningful pick; same floor as the model's lattice.
  if(it.whole<MEANINGFUL_MIN[r.market])continue;
  const key=[g.game_id,r.team_id,r.player_id,r.market].join('|');
  if(seen.has(key))throw Error('NBA_V3_DUPLICATE_PLAYER_MARKET_OUTCOME');
  seen.add(key);out.push(it);
 }
 return out.sort((a,b)=>(displayedChance(b)??0)-(displayedChance(a)??0)||b.row.p_active-a.row.p_active||
  a.row.player.localeCompare(b.row.player)||MARKETS.indexOf(a.row.market)-MARKETS.indexOf(b.row.market));
}
/** The featured tiles are exactly the highest-ranked predictions, with
 * no category quota, rerank or arbitrary preference for variety. */
export const topProbabilityPicks=(picks:ProjectionItem[],count=4):ProjectionItem[]=>
 picks.slice(0,count);
function V3Card({item}:{item:ProjectionItem}){
 const row=item.row;
 return <article data-testid="nba-v3-system-pick" className="rounded-xl border border-[#374239] bg-[#101912] p-3 space-y-2">
  <div className="flex items-start justify-between gap-2">
   <div><p className="text-sm font-bold text-white">{row.player}</p>
    <p className="text-[11px] text-gray-400">{NAME[row.market]}</p></div>
   <span className="text-[10px] border border-[#487b54] rounded-lg p-2 font-bold text-[#00FF41]">MODEL PROJECTION</span>
   {row.starter_evidence==='CONFIRMED_STARTER'&&<span data-testid="nba-v5-verified-starter" className="text-[10px] border border-[#487b54] rounded-lg p-2 font-bold text-white">STARTER VERIFIED</span>}
  </div>
  <p data-testid="nba-v3-selected-target" className="text-base font-bold">
   {item.whole} {NAME[row.market]}
  </p>
  <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#32533d] bg-[#102418] p-3">
   <div><p className="text-[10px] text-gray-400">MODEL PROJECTION</p>
    <p className="text-xl font-bold text-white">{item.whole} {UNIT[row.market]}</p>
    <p className="text-[10px] text-gray-400">Model average {fmt(row.mean)} · Median {fmt(row.median)}</p></div>
   <div><p className="text-[10px] text-gray-400">CHANCE OF {item.whole}+{row.reach_probabilities?" (incl. DNP)":""}</p>
    <p data-testid="nba-v3-hit-probability" className="text-xl font-bold text-[#00FF41]">{pctOrDash(displayedChance(item))}</p>
    {row.reach_probabilities&&<p className="text-[10px] text-gray-300">If playing: {pct(row.reach_probabilities.probability_if_playing)}</p>}
    <p className="text-[10px] text-amber-200">Not yet forward-calibrated</p></div>
  </div>
  <p className="text-[11px] text-gray-300">
   10th–90th percentile: {fmt(row.p10)}–{fmt(row.p90)} {UNIT[row.market]}
   {' · '}{row.lineup_label==='CONFIRMED_IN'?'Live availability adjustment (early P(plays) '+pct(row.p_active_early??row.p_active)+', early projection '+fmt(row.mean_early??row.mean)+')':'Simulated P(plays) '+pct(row.p_active)}
   {' · '}Modeled share of team minutes {pct(row.role_share)}</p>
  {(row.p_start!=null||row.minutes_mean!=null)&&<p data-testid="nba-v3-role" className="text-[11px] text-gray-300">
   {row.p_start!=null?'Starts '+pct(row.p_start)+(row.p_close!=null?' · on the floor to close '+pct(row.p_close):'')+' · ':''}
   {row.minutes_mean!=null?'Minutes '+fmt(row.minutes_p10??row.minutes_mean)+'–'+fmt(row.minutes_p90??row.minutes_mean)+' (average '+fmt(row.minutes_mean)+')':''}</p>}
  {row.depends_on&&row.depends_on.length>0&&<div data-testid="nba-v3-depends-list" className="text-[11px] text-amber-200">
   {row.depends_on.map(d=><p key={d.if_out}>If {d.if_out_name||'a teammate'} sits: {fmt(d.projection_if_out)} {UNIT[row.market]} ({d.change>0?'+':''}{fmt(d.change)})</p>)}</div>}
  {row.role_change?.status==="ROLE_CHANGE_CANDIDATE"&&<p className="text-[11px] text-sky-200">
   Pregame role-change evidence: {row.role_change.candidate_metrics?.join(", ")} · research only, not yet predictive-validated</p>}
  {row.uncertainty_audit&&<p className="text-[11px] text-gray-400">
   Minutes-associated simulation variance: {pct(row.uncertainty_audit.minutes_association_r2)} · descriptive, not causal</p>}
  <details className="text-[11px] text-gray-400 border-t border-[#343434] pt-2">
   <summary className="min-h-9 cursor-pointer font-bold">MODEL EVIDENCE</summary>
   <p className="mt-1">Pregame NBA shared-minute and opportunity simulation (V3, V4 or V5 as labeled).
    Historical role evidence only. Source status: {row.reported_status}.
    {row.unc_reasons.length?' Uncertainty: '+row.unc_reasons.join(', '):''}
    {' '}This percentage is model-generated, not a verified bookmaker line or certified betting probability.</p>
  </details>
 </article>;
}
export default function NbaV3ResearchPanel({search='',mode='PICKS'}:{
 search?:string;mode?:'PICKS'|'BOARD'
}){
 const [doc,setDoc]=useState<Shadow|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [expanded,setExpanded]=useState<string|null>(null);
 const [share,setShare]=useState<{game:Game;ranked:ProjectionItem[]}|null>(null);
 const [day,setDay]=useState('AUTO');
 const [showFilters,setShowFilters]=useState(false);
 const [market,setMarket]=useState<'ALL'|Market>('ALL');
 // If MODEL BOARD had a turnovers filter, reset the effective filter on
 // returning to SYSTEM PICKS rather than showing an apparently empty game.
 const activeMarket=mode==='PICKS'&&market==='turnovers'?'ALL':market;
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{
   const r=await fetch('/api/nba-v3-shadow?t='+Date.now(),{cache:'no-store'});
   const x=await r.json();
   if(!r.ok)throw Error(x.error||'Source unavailable');
   if(x.schema!=='NBA_V3_FULL_GAME_DISTRIBUTION_READ_ONLY_V1'||
      x.research_only!==true||x.official_bets!==0||
      x.sportsbook_lines_required!==false||
      x.prospective_model_probability_calibration_verified!==false||
      !Array.isArray(x.games))throw Error('NBA_V3_INVALID_OR_PROMOTED_SOURCE');
   setDoc(x);setError('');
  }catch(e){setError(e instanceof Error?e.message:String(e));setDoc(null);}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  void refresh();
  const id=setInterval(()=>void refresh(),120000);
  return()=>clearInterval(id);
 },[refresh]);
 const today=dateET(new Date().toISOString());
 const dates=useMemo(()=>[...new Set((doc?.games||[]).map(g=>dateET(g.tipoff_utc)))].sort(),[doc]);
 // Always land on a real V3 slate. If all today's games have already
 // started, display tomorrow's first verified pregame forecasts instead
 // of looking empty while real future source records are available.
 const nextSlate=dates.includes(today)?today:dates.find(d=>d>today)||dates[0]||today;
 const all=useMemo(()=>doc?.games.filter(g=>
  (day==='ALL'||(day==='AUTO'?dateET(g.tipoff_utc)===nextSlate:
   day==='TODAY'?dateET(g.tipoff_utc)===today:dateET(g.tipoff_utc)===day))&&
  (!search||(g.home+' '+g.away+' '+g.rows.map(r=>r.player).join(' ')).toLowerCase()
    .includes(search.toLowerCase()))
 )||[],[doc,day,today,nextSlate,search]);
 const number=all.reduce((n,g)=>n+v3ProjectionPicks(g).filter(p=>
  activeMarket==='ALL'||p.row.market===activeMarket).length,0);
 return <section className="space-y-3" data-testid="nba-v3-primary-board">
  <div className="flex items-center justify-between gap-2">
   <strong className="text-[13px] text-[#00FF41]">{mode==='PICKS'?'System picks':'Full model board'}</strong>
   <div className="flex items-center gap-2">
    <button type="button" onClick={()=>setShowFilters(v=>!v)} aria-expanded={showFilters}
      className={'min-h-10 rounded-lg border px-3 text-[13px] font-semibold '+(showFilters?'border-[#00FF41] text-[#00FF41]':'border-[#444] text-gray-300')}>Filter</button>
    <button type="button" onClick={()=>void refresh()} disabled={loading}
      aria-label="Refresh NBA V3 forecasts" className="min-h-10 min-w-10 flex items-center justify-center border border-[#444] rounded-lg">
     <RefreshCw size={16}/></button>
   </div>
  </div>
  {loading&&!doc&&<p className="text-xs text-gray-400">Loading frozen original NBA V3 pregame simulations…</p>}
  {error&&<p role="alert" className="border border-red-700 p-3 rounded-lg text-xs text-red-200">
    NBA V3 source unavailable: {error}. No V2 substitution or invented picks.</p>}
  {doc&&doc.status!=='AVAILABLE_RESEARCH_ONLY'&&<p data-testid="nba-v3-no-source"
    className="border border-amber-800/70 p-3 rounded-lg text-xs text-amber-200">
   {doc.status==='NO_FIRSTSEEN_V3_SHADOW_YET'?
    'V3 is the selected frontend model. Its first authentic pregame game distribution has not yet been published; old V2 predictions will NOT be mislabeled as V3.':
    'No upcoming first-seen V3 game distributions are available. Predictions cannot be safely backfilled after tipoff.'}
  </p>}
  {doc?.v5_published_sync&&<p data-testid="nba-v5-published-freshness"
     className={'text-xs '+(doc.v5_published_sync.source_state==='SOURCE_VERIFIED'?'text-gray-300':'text-amber-300')}>
     {doc.v5_published_sync.source_state==='SOURCE_VERIFIED'
      ?<>Published V5 source checked {et(doc.v5_published_sync.checked_at_utc)}
        {doc.v5_published_sync.latest_generation_at_utc
         ?<> · Latest published model {et(doc.v5_published_sync.latest_generation_at_utc)}</>:null}
        {' · '}Pregame forecasts retained as originally simulated.</>
      :<>V5 published-source check unavailable. These may be older local projections; use the date on each game.</>}
   </p>}
   {doc&&doc.status==='AVAILABLE_RESEARCH_ONLY'&&<>
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="NBA V3 game date">
      {['AUTO','TODAY','ALL',...dates].map(d=><button type="button" key={d}
       onClick={()=>{setDay(d);setExpanded(null);}} aria-pressed={day===d}
       className={'min-h-10 shrink-0 rounded-lg border px-3 text-xs font-bold '+
        (day===d?'border-[#00FF41] text-[#00FF41]':'border-[#333] text-gray-300')}>
       {d==='AUTO'?'Next slate':d==='TODAY'?"Today's games":d==='ALL'?'All upcoming':d.slice(5)}
      </button>)}
    </div>
    {showFilters&&<div className="grid grid-cols-4 gap-1" aria-label="NBA V3 market filter">
    {(['ALL',...(mode==='PICKS'?MARKETS.filter(m=>m!=='turnovers'):MARKETS)] as const).map(m=><button type="button" key={m}
      onClick={()=>setMarket(m)} aria-pressed={market===m}
      className={'min-h-10 rounded-md border px-1 text-[10px] font-bold '+
        (market===m?'border-[#00FF41] text-[#00FF41]':'border-[#333] text-gray-400')}>
      {m==='ALL'?'ALL':UNIT[m]}</button>)}
    </div>}
    {!all.length&&<p className="text-xs text-gray-400">No first-seen V3 forecasts on the selected date.
      Select another date or All upcoming. No old-model picks are substituted.</p>}
    {all.map(g=>{
      const ranked=v3ProjectionPicks(g);  // canonical, UNFILTERED model probability ranking
      const picks=ranked.filter(p=>
        activeMarket==='ALL'||p.row.market===activeMarket);
      const every=g.rows.filter(r=>activeMarket==='ALL'||r.market===activeMarket);
      const shown:ProjectionItem[]=mode==='PICKS'?picks:
        every.map(projectionItem).filter((x):x is ProjectionItem=>x!==null);
      const open=expanded===g.game_id;
      return <article key={g.game_id} data-testid="nba-v3-game"
        className="rounded-xl border border-[#333] bg-[#191919] overflow-hidden">
        <div className="flex items-stretch">
        <button type="button" aria-expanded={open}
          onClick={()=>setExpanded(open?null:g.game_id)}
          className="min-w-0 flex-1 min-h-20 p-3 flex items-center justify-between text-left gap-2">
          <div>
           <strong className="text-sm text-white">{g.away} at {g.home}</strong>
           <p className="mt-1 text-[11px] text-gray-400">{et(g.tipoff_utc)}
             {' · '}{picks.length} projections{' · '}{every.length} stat projections</p>
           {picks[0]&&<p className="mt-1 text-[11px] text-gray-200">
             TOP: {picks[0].row.player} · {picks[0].whole}
             {' '}{NAME[picks[0].row.market]} · {pctOrDash(displayedChance(picks[0]))}
           </p>}
           {g.forecast_kind==='V5_LATEST'&&<p data-testid="nba-v5-starter-verification" className="mt-1 text-[11px] text-amber-100">
             Starting lineups: {Object.values(g.certified_pregame_team_effect??{}).filter(v=>v?.confirmed_starters===5).length===2
               ?'Both teams verified'
               :Object.values(g.certified_pregame_team_effect??{}).filter(v=>v?.confirmed_starters===5).length===1
               ?'One team verified · other unverified'
               :'Not verified · projected rotations'}.
           </p>}
           <p className="mt-1 text-[10px] text-gray-500">{g.forecast_kind==='V5_LATEST'
             ?<>Model V5{g.rows.some(r=>r.model_version?.includes('-empirical-game'))?' · EMPIRICAL GAME':''} · updated {et(g.forecast_at_utc)}{' · '}first forecast {et(g.first_seen_forecast_at_utc||g.forecast_at_utc)}</>
             :g.forecast_kind==='V4_LATEST'
             ?<>Model V4 · updated {et(g.forecast_at_utc)}{' · '}first forecast {et(g.first_seen_forecast_at_utc||g.forecast_at_utc)}</>
             :g.forecast_kind==='LATEST_RUN'
             ?<>Latest run {et(g.forecast_at_utc)}{' · '}first forecast {et(g.first_seen_forecast_at_utc||g.forecast_at_utc)}</>
             :<>V3 first observed {et(g.forecast_at_utc)}</>}
             {' · '}No verified bookmaker line</p>
          </div>
          <ChevronDown className={'shrink-0 text-gray-400 '+(open?'rotate-180':'')} size={18}/>
        </button>
        {g.forecast_kind==='V5_LATEST'&&ranked.length>0&&
         <button type="button"
           aria-label={`Open NBA V5 top 10 game card for ${g.away} at ${g.home}`}
           title="NBA V5 top 10 · full game share card"
           data-testid="nba-v5-open-top10"
           onClick={()=>setShare({game:g,ranked})}
           className="my-3 mr-3 flex min-h-11 min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#79FF48]/40 bg-[#79FF48]/10 px-2 text-[#79FF48]">
          <Image size={18}/><span className="text-[10px] font-black">TOP 10</span>
         </button>}
        </div>
        {shown.length>0&&<div data-testid="nba-v3-tiles" className="grid grid-cols-2 gap-2 px-3 pb-3">
          {topProbabilityPicks(picks).map(({row:r,whole,prob})=><div key={r.player_id+r.market} data-testid="nba-v3-tile" className="min-w-0 rounded-xl border border-white/10 bg-[#12181b] p-3">
            <p className="truncate text-[11px] text-gray-400">{NAME[r.market]}</p>
            <p className="mt-0.5 break-words text-[15px] font-bold leading-snug text-white">{r.player}</p>
            <p className="mt-2 text-[26px] font-black leading-none tabular-nums text-[#79FF48]">{whole} <span className="text-[14px] font-bold">{UNIT[r.market]}</span></p>
            <p className={'mt-1.5 text-[13px] font-bold tabular-nums '+((displayedChance({row:r,whole,prob})??0)>=.65?'text-[#79FF48]':'text-gray-100')}>{pctOrDash(displayedChance({row:r,whole,prob}))} to reach {whole}+{r.reach_probabilities?' incl. DNP':''}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">Model average {fmt(r.mean)} · P(plays) {pct(r.p_active)}</p>
            {r.depends_on&&r.depends_on.length>0&&<p data-testid="nba-v3-depends" className="mt-0.5 text-[11px] text-amber-200">Depends on {r.depends_on[0].if_out_name||'a teammate'} playing</p>}
          </div>)}
        </div>}
        {open&&<div className="p-3 border-t border-[#333] space-y-2">
         {mode==='PICKS'?shown.map(it=><V3Card key={g.game_id+'|'+it.row.team_id+'|'+it.row.player_id+'|'+it.row.market} item={it}/>):
          shown.map(({row:r,whole,prob})=><div key={g.game_id+'|'+r.team_id+'|'+r.player_id+'|'+r.market}
             data-testid="nba-v3-stat-projection" className="rounded-lg border border-[#383838] p-3 space-y-1 text-xs">
            <strong>{r.player} · {NAME[r.market]}</strong>
            <p>Projection {whole} {UNIT[r.market]} · {pctOrDash(displayedChance({row:r,whole,prob}))} to reach {whole}+{r.reach_probabilities?' incl. DNP':''} · Mean {fmt(r.mean)} · Median {fmt(r.median)}
             {' · '}P10–P90 {fmt(r.p10)}–{fmt(r.p90)}</p>
            <p>P(plays) {pct(r.p_active)}{r.reach_probabilities?' · Chance if playing '+pct(r.reach_probabilities.probability_if_playing):''} · not yet forward-calibrated</p>
            <p className="text-gray-400">{r.unc_reasons.join(', ')}</p>
          </div>)}
         {!shown.length&&<p className="text-xs text-amber-200">
           This game has no projection that passes the participation check for this market.
           Nothing is forced.</p>}
        </div>}
      </article>;
    })}
  </>}
  {doc&&<div data-testid="nba-projection-slate-summary" className="pb-2 text-xs text-gray-400">
   {day==='AUTO'?'Next available: '+nextSlate+' · ':''}{all.length} matching NBA game forecasts · {mode==='PICKS'?number+' model projections':
       all.reduce((n,g)=>n+g.rows.length,0)+' numerical projections'}
   {' · '}{doc.original_games_audited} original games audited
  </div>}
  {share&&<NbaV5ShareModal game={share.game} ranked={share.ranked} close={()=>setShare(null)}/>}
  <p className="text-[11px] text-amber-200 font-bold">MODEL-ESTIMATED PROJECTION CHANCES · NOT YET PROSPECTIVELY CALIBRATED.</p>
  <details data-testid="nba-v3-about" className="rounded-xl border border-[#00FF41]/30 bg-[#0e2115] px-3 text-[13px] leading-relaxed text-gray-300">
   <summary className="min-h-10 cursor-pointer py-2 font-semibold text-gray-200">About these numbers <span className="font-normal text-amber-200">· research estimates, not yet calibrated</span></summary>
   <p className="pb-2">Basketball-specific roles, team-minute allocation, opportunity modeling and game distributions; any detected role changes remain research-only.</p>

   <p className="text-gray-400">Each game identifies the actual model version (V5, V4 or V3). Original V2 predictions remain in the separate grading archive.</p>

  </details>
 </section>;
}
