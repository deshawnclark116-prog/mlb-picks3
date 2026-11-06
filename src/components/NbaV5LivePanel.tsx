import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ChevronDown,RefreshCw} from 'lucide-react';
import {V5_LABELS, v5AllPlayerProjections,v5FeaturedPicks,v5QualifiedPicks,
 type V5Game,type V5Market,type V5Pick,V5_MARKETS} from '../nba/v5Board.ts';

type LiveV5={
 schema:'NBA_V5_DIRECT_SYSTEM_FORECAST_V1';status:string;source_model:'NBA_V5_ONLY';
 model_version:string|null;generated_at_utc:string|null;
 sportsbook_lines_required:false;forward_calibrated:false;games:V5Game[];
 games_forecast:number;feature_switches?:Record<string,boolean>|null;
};
const pct=(p:number)=>Number.isFinite(p)?(p*100).toFixed(1)+'%':'—';
const f=(n:number|undefined|null)=>n==null||!Number.isFinite(n)?'—':n.toLocaleString('en-US',{maximumFractionDigits:1});
const local=(iso:string)=>new Date(iso).toLocaleString('en-US',{
 timeZone:'America/New_York',month:'short',day:'numeric',
 hour:'numeric',minute:'2-digit',timeZoneName:'short'});
const dayET=(iso:string)=>{
 const data=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'})
  .formatToParts(new Date(iso));
 const d=Object.fromEntries(data.map(p=>[p.type,p.value]));
 return d.year+'-'+d.month+'-'+d.day;
};

function PlayerProjection({pick}:{pick:V5Pick}){
 const r=pick.row;
 return <article data-testid="nba-v5-player-projection" className="min-w-0 rounded-xl border border-white/10 bg-[#10191a] p-3">
  <div className="text-[10px] uppercase tracking-wide text-gray-400">{V5_LABELS[r.market]}</div>
  <div className="mt-1 break-words text-[13px] font-bold text-white">{r.player}</div>
  <div className="mt-2 grid grid-cols-2 gap-2 items-end">
   <div>
    <div className="text-[10px] text-gray-400">V5 PROJECTION</div>
    <strong data-testid="nba-v5-whole-projection" className="text-[26px] leading-none text-white tabular-nums">{pick.whole}</strong>
   </div>
   <div>
    <div className="text-[10px] text-gray-400">CHANCE OF {pick.whole}+</div>
    <strong data-testid="nba-v5-projection-probability" className="text-[23px] leading-none font-black text-[#79FF48] tabular-nums">{pct(pick.unconditionalProbability)}</strong>
   </div>
  </div>
  <div className="mt-2 text-[10px] text-gray-400">Model mean {f(r.mean)} · If playing {pct(pick.conditionalProbability)} · P(plays) {pct(r.p_active)}</div>
  <details className="mt-2 border-t border-white/10 pt-2 text-[11px] text-gray-300">
   <summary className="min-h-8 cursor-pointer font-semibold">Minutes, role and source evidence</summary>
   <p>Model range (10th–90th percentile): {f(r.p10)}–{f(r.p90)} {V5_LABELS[r.market].toLowerCase()}</p>
   {r.minutes_mean!=null&&<p>Minutes: {f(r.minutes_mean)} expected · {f(r.minutes_p10)}–{f(r.minutes_p90)} simulated range</p>}
   {r.p_start!=null&&<p>Starting chance {pct(r.p_start)}{r.p_close!=null?' · Close-game floor chance '+pct(r.p_close):''}</p>}
   {(r.fga_mean!=null||r.fta_mean!=null)&&<p>Shot opportunities: {f(r.fga_mean)} FGA · {f(r.fta_mean)} FTA</p>}
   <p>Reported availability: {r.reported_status}; no sportsbook thresholds used.</p>
   {!!r.authorized_data_field_coverage&&Object.keys(r.authorized_data_field_coverage).length>0&&
    <p>Authorized tracked opportunity datasets: {Object.keys(r.authorized_data_field_coverage).join(', ')}</p>}
   <p>Model estimate, not yet independently forward-calibrated.</p>
  </details>
 </article>;
}

function GameOutcome({game}:{game:V5Game}){
 const d=game.model_outcome_projection;
 if(!d||!Number.isFinite(d.home_win_probability)||!Number.isFinite(d.away_win_probability))return null;
 return <div data-testid="nba-v5-game-outcome" className="grid grid-cols-2 gap-2 px-3 pb-3">
  <div className="rounded-lg border border-white/10 bg-[#101919] p-2">
   <p className="truncate text-[10px] text-gray-400">{game.away} win</p>
   <p className="text-lg font-bold text-[#79FF48]">{pct(d.away_win_probability)}</p>
   <p className="text-[10px] text-gray-400">Projected {f(d.away_score_mean)} points</p>
  </div>
  <div className="rounded-lg border border-white/10 bg-[#101919] p-2">
   <p className="truncate text-[10px] text-gray-400">{game.home} win</p>
   <p className="text-lg font-bold text-[#79FF48]">{pct(d.home_win_probability)}</p>
   <p className="text-[10px] text-gray-400">Projected {f(d.home_score_mean)} points</p>
  </div>
 </div>;
}

/** Direct V5 board. Unlike the old V3 overlay, games enter from V5 itself.
 * No V2/V3/V4 substitutions on source or availability failures.
 */
export default function NbaV5LivePanel({search='',mode='PICKS'}:{
 search?:string;mode?:'PICKS'|'BOARD'
}){
 const [doc,setDoc]=useState<LiveV5|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [day,setDay]=useState('AUTO');
 const [market,setMarket]=useState<'ALL'|V5Market>('ALL');
 const [expanded,setExpanded]=useState<string|null>(null);
 const [showFilters,setShowFilters]=useState(false);
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{
   const response=await fetch('/api/nba-v5-live?t='+Date.now(),{cache:'no-store'});
   const value=await response.json();
   if(!response.ok||value.schema!=='NBA_V5_DIRECT_SYSTEM_FORECAST_V1'||
      value.source_model!=='NBA_V5_ONLY'||value.sportsbook_lines_required!==false||
      value.forward_calibrated!==false||!Array.isArray(value.games))
    throw Error(value.validation_error||value.status||'V5 source rejected');
   setDoc(value);setError('');
  }catch(e){setDoc(null);setError(e instanceof Error?e.message:String(e));}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();const id=setInterval(()=>void refresh(),120000);return()=>clearInterval(id);},[refresh]);
 const dates=useMemo(()=>[...new Set((doc?.games||[]).map(g=>dayET(g.tipoff_utc)))].sort(),[doc]);
 const today=dayET(new Date().toISOString());
 const defaultDay=dates.includes(today)?today:dates.find(d=>d>today)||dates[0]||today;
 const visible=useMemo(()=>(doc?.games||[]).filter(g=>
   (day==='ALL'||(day==='AUTO'&&dayET(g.tipoff_utc)===defaultDay)||
    (day==='TODAY'&&dayET(g.tipoff_utc)===today)||day===dayET(g.tipoff_utc))&&
   (!search||(g.home+' '+g.away+' '+g.rows.map(r=>r.player).join(' ')).toLowerCase().includes(search.toLowerCase()))
 ).sort((a,b)=>a.tipoff_utc.localeCompare(b.tipoff_utc)),
 [doc,day,defaultDay,today,search]);
 return <section data-testid="nba-v5-live-panel" className="space-y-3">
  <div className="flex items-center justify-between gap-2">
   <div>
    <strong className="text-[14px] text-[#79FF48]">{mode==='PICKS'?'V5 SYSTEM PICKS':'V5 COMPLETE MODEL BOARD'}</strong>
    <p className="text-[10px] text-gray-400">Actual V5 simulation · no sportsbook input · own whole-number projections</p>
   </div>
   <div className="flex gap-2">
    <button onClick={()=>setShowFilters(v=>!v)} aria-expanded={showFilters}
      className="min-h-10 rounded-lg border border-white/20 px-3 text-xs text-white">Filter</button>
    <button onClick={()=>void refresh()} disabled={loading} aria-label="Refresh live NBA V5 projections"
      className="min-h-10 min-w-10 rounded-lg border border-white/20 flex items-center justify-center">
     <RefreshCw size={17}/>
    </button>
   </div>
  </div>
  {loading&&!doc&&<p className="text-xs text-gray-400">Loading actual NBA V5 forecasts…</p>}
  {error&&<p role="alert" className="rounded-lg border border-red-700 p-3 text-sm text-red-200">NBA V5 unavailable: {error}. No older-model projections substituted.</p>}
  {doc&&doc.status!=='NBA_V5_AVAILABLE'&&
   <p data-testid="nba-v5-empty" className="rounded-lg border border-amber-700/50 p-3 text-sm text-amber-200">
    {doc.status==='NBA_V5_SOURCE_STALE'?'The V5 feed is stale; awaiting a fresh verified V5 forecast.':
     doc.status==='NBA_V5_SOURCE_NOT_PUBLISHED'?'V5 has not published a current forecast yet.':
     'There are no upcoming verified V5 forecasts. Nothing has been backfilled after tipoff.'}
   </p>}
  {doc&&doc.status==='NBA_V5_AVAILABLE'&&<>
   <div className="text-[11px] text-gray-400">V5 generated {doc.generated_at_utc?local(doc.generated_at_utc):'unknown'} · {doc.games_forecast} games · model estimates, forward calibration pending</div>
   <div className="flex gap-2 overflow-x-auto pb-1" aria-label="NBA V5 game dates">
    {['AUTO','TODAY','ALL',...dates].map(d=>
     <button key={d} onClick={()=>{setDay(d);setExpanded(null);}} aria-pressed={day===d}
       className={'shrink-0 min-h-10 rounded-lg border px-3 text-xs font-bold '+
        (day===d?'border-[#79FF48] text-[#79FF48]':'border-white/10 text-gray-300')}>
       {d==='AUTO'?'Next slate':d==='TODAY'?'Today':d==='ALL'?'All games':d.slice(5)}
     </button>)}
   </div>
   {showFilters&&<div className="grid grid-cols-4 gap-1" aria-label="NBA V5 stat filter">
    {(['ALL',...V5_MARKETS] as const).map(m=>
      <button key={m} onClick={()=>setMarket(m)} aria-pressed={market===m}
       className={'min-h-10 rounded-md border px-1 text-[10px] '+
         (market===m?'border-[#79FF48] text-[#79FF48]':'border-white/10 text-gray-400')}>
       {m==='ALL'?'All stats':V5_LABELS[m]}
      </button>)}
   </div>}
   {visible.map(game=>{
    const all=v5AllPlayerProjections(game).filter(p=>market==='ALL'||p.row.market===market);
    const qualifying=v5QualifiedPicks(game).filter(p=>market==='ALL'||p.row.market===market);
    const picks=mode==='PICKS'?qualifying:all;
    const featured=mode==='PICKS'?v5FeaturedPicks(picks,4):picks.slice(0,4);
    const featureKeys=new Set(featured.map(p=>p.row.team_id+'|'+p.row.player_id+'|'+p.row.market));
    const extra=picks.filter(p=>!featureKeys.has(p.row.team_id+'|'+p.row.player_id+'|'+p.row.market));
    const open=expanded===game.game_id;
    return <article key={game.game_id} data-testid="nba-v5-game" className="overflow-hidden rounded-xl border border-white/10 bg-[#191919]">
      <button onClick={()=>setExpanded(open?null:game.game_id)} aria-expanded={open}
       className="flex w-full min-h-18 items-center justify-between gap-3 p-3 text-left">
       <div>
        <strong className="text-sm text-white">{game.away} at {game.home}</strong>
        <p className="text-[11px] text-gray-400">{local(game.tipoff_utc)} · {qualifying.length} system projections · {all.length} model projections</p>
        {qualifying[0]&&<p className="text-[11px] text-[#79FF48]">Top: {qualifying[0].row.player} · {qualifying[0].whole} {V5_LABELS[qualifying[0].row.market]} · {pct(qualifying[0].unconditionalProbability)}</p>}
        <p className="text-[10px] text-gray-500">V5 original forecast {local(game.forecast_at_utc)} · {game.model_version}</p>
       </div>
       <ChevronDown size={17} className={'shrink-0 text-gray-400 '+(open?'rotate-180':'')}/>
      </button>
      <GameOutcome game={game}/>
      {featured.length>0?<div className="grid grid-cols-2 gap-2 px-3 pb-3">
       {featured.map(p=><PlayerProjection key={p.row.player_id+'|'+p.row.market} pick={p}/>)}
      </div>:<p className="px-3 pb-3 text-xs text-gray-400">
       {mode==='PICKS'?'No V5 projections meet the model probability and availability filters. See Complete Model Board for all forecasts.':'No eligible numerical forecasts for this filter.'}
      </p>}
      {open&&extra.length>0&&<div data-testid="nba-v5-expanded-projections" className="grid grid-cols-2 gap-2 px-3 pb-3">
       {extra.map(p=><PlayerProjection key={p.row.player_id+'|'+p.row.market} pick={p}/>)}
      </div>}
      {extra.length>0&&<button onClick={()=>setExpanded(open?null:game.game_id)}
       className="w-full min-h-11 border-t border-white/10 px-3 text-xs font-semibold text-[#79FF48]">
       {open?'Show fewer':'See all '+picks.length+' V5 '+(mode==='PICKS'?'system projections':'model projections')}
      </button>}
    </article>;
   })}
   {!visible.length&&<p className="text-xs text-gray-400">No V5 games match these filters. Try another date.</p>}
  </>}
 </section>;
}
