import React,{useEffect,useMemo,useState} from 'react';
import {RefreshCw,ChevronDown,AlertTriangle} from 'lucide-react';

type Market='points'|'rebounds'|'assists'|'three_pointers_made';
const MARKET:Market[]=['points','rebounds','assists','three_pointers_made'];
const LABEL:Record<Market,string>={points:'PTS',rebounds:'REB',
  assists:'AST',three_pointers_made:'3PM'};
type AccuracyConfidence={probability_within_window_if_plays:number;
 window_plus_or_minus:number;historical_validation_n_in_bin:number;
 metric:'PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION';
 not_over_under_probability:true;current_season_calibration_verified:false};
type Player={player:string;player_id:string;team_id:string;
 predictions:Partial<Record<Market,number>>;
 projection_accuracy_confidence?:Partial<Record<Market,AccuracyConfidence>>;
 prior_recent5:Partial<Record<Market,number>>;
 source_active_probability_unverified:number;
 reported_status:string;active_or_starter_certified:false;
 historical_current_team_played_games:number;history_games:number;};
type Game={game_id:string;home:string;away:string;tipoff_utc:string;
 forecast_at_utc:string;players:Player[];players_forecast:number;
 rows_count:number;skipped_player_reasons:Record<string,number>};
type Document={schema:string;model_version:string;status:string;
 generated_at_utc?:string;trained_through_eastern_date?:string;
 games:Game[];games_forecast:number;source_state:string;
 source_error?:string|null;research_only:true;official_bets:0;
 prospective_calibration_verified?:false;
 projection_accuracy_confidence_source?:string|null;
 projection_accuracy_definition?:string;
 projection_accuracy_windows?:Partial<Record<Market,number>>;
 projection_accuracy_not_a_bookmaker_hit_probability?:true;};
const DATE=(iso:string)=>new Intl.DateTimeFormat('en-CA',{
 timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'
}).format(new Date(iso));
const TIP=(iso:string)=>new Intl.DateTimeFormat('en-US',{
 timeZone:'America/New_York',month:'short',day:'numeric',
 hour:'numeric',minute:'2-digit'
}).format(new Date(iso))+' ET';
const fmt=(n:number|undefined)=>
 typeof n==='number'&&Number.isFinite(n)?n.toFixed(1):'—';
const safeP=(c:AccuracyConfidence|undefined)=>
 c&&c.metric==='PROB_ACTUAL_WITHIN_ERROR_WINDOW_OF_OWN_MODEL_PROJECTION'&&
 c.not_over_under_probability===true&&c.current_season_calibration_verified===false&&
 Number.isFinite(c.probability_within_window_if_plays)&&
 c.probability_within_window_if_plays>=0&&
 c.probability_within_window_if_plays<=1&&
 Number.isFinite(c.window_plus_or_minus)&&c.window_plus_or_minus>0&&
 Number.isInteger(c.historical_validation_n_in_bin)&&c.historical_validation_n_in_bin>=50
 ?c.probability_within_window_if_plays:null;
const pct=(p:number)=>Math.round(p*100)+'%';

export function validateNewNbaShadow(data:any):data is Document{
 if(!data||data.schema!=='NBA_INDEPENDENT_DIRECT_LIVE_PRETIP_SHADOW_V1'||
  data.research_only!==true||data.official_bets!==0||
  !Array.isArray(data.games)||typeof data.source_state!=='string')
  return false;
 if(data.games.length&&(
  data.prospective_calibration_verified!==false||
  data.model_version!=='nba-independent-direct-prior-date-head-v1'))
  return false;
 return data.games.every((g:any)=>typeof g.game_id==='string'&&
  Number.isFinite(Date.parse(g.tipoff_utc))&&Array.isArray(g.players)&&
  g.players.every((p:any)=>p.player&&p.player_id&&
   p.active_or_starter_certified===false&&p.predictions&&
   MARKET.some(m=>Number.isFinite(p.predictions[m]))));
}
export default function NbaIndependentLivePanel({search=''}:{search?:string}){
 const [data,setData]=useState<Document|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [day,setDay]=useState('AUTO');
 const [open,setOpen]=useState<Record<string,boolean>>({});
 const [showAll,setShowAll]=useState<Record<string,boolean>>({});
 const load=async()=>{
  setLoading(true);
  try{
   const r=await fetch('/api/nba-independent-shadow?t='+Date.now(),{cache:'no-store'});
   const j=await r.json();
   if(!r.ok||!validateNewNbaShadow(j))
    throw Error(j.error||'Independent model forecast source is not verified.');
   setData(j);setError('');
  }catch(e){setError(e instanceof Error?e.message:String(e));setData(null);}
  finally{setLoading(false);}
 };
 useEffect(()=>{
  void load();
  const interval=setInterval(()=>void load(),120000);
  return()=>clearInterval(interval);
 },[]);
 const today=DATE(new Date().toISOString());
 const dates=useMemo(()=>[...new Set((data?.games||[]).map(g=>DATE(g.tipoff_utc)))].sort(),
  [data]);
 const next=dates.includes(today)?today:dates.find(d=>d>=today)||dates[0]||today;
 const games=useMemo(()=>(data?.games||[]).filter(g=>{
  const date=DATE(g.tipoff_utc);
  return (day==='ALL'||(day==='AUTO'?date===next:date===day))&&
    (!search||(g.away+' '+g.home+' '+g.players.map(p=>p.player).join(' '))
     .toLowerCase().includes(search.toLowerCase()));
 }).sort((a,b)=>a.tipoff_utc.localeCompare(b.tipoff_utc)),[data,day,next,search]);
 return <section data-testid="nba-independent-live-model" className="space-y-3">
   <div className="rounded-xl border border-[#79FF48]/35 bg-[#102018] p-3">
    <div className="flex items-center justify-between gap-2">
     <div><strong className="text-sm text-[#79FF48]">NEW AI · Independent NBA Model</strong>
      <p className="mt-1 text-xs text-gray-300">Machine-learned player projections from earlier completed games and the live pregame roster.</p>
     </div>
     <button type="button" aria-label="Refresh independent NBA projections"
       onClick={()=>void load()} className="rounded-lg border border-[#79FF48]/40 p-2 text-[#79FF48]">
      <RefreshCw size={18} className={loading?'animate-spin':''}/>
     </button>
    </div>
    <p className="mt-2 text-[11px] text-amber-200">Historical projection accuracy, not sportsbook Over/Under percentages. Confidence = probability of finishing within ±5 points, ±2 rebounds, ±2 assists or ±1 three of the displayed projection, conditional on playing. Not yet verified prospectively this season.</p>
    {data?.generated_at_utc&&<p className="mt-2 text-[11px] text-gray-400">
     Forecast captured {TIP(data.generated_at_utc)} · Training through {data.trained_through_eastern_date||'unknown'}
     {' · '}Source {data.source_state.replaceAll('_',' ').toLowerCase()}</p>}
   </div>
   {error&&<p role="alert" className="rounded-xl border border-red-600/60 p-3 text-sm text-red-200">{error}</p>}
   {!error&&!loading&&!data?.games.length&&<p data-testid="nba-independent-not-ready"
    className="rounded-xl border border-amber-700/50 p-3 text-sm text-amber-200">
    {data?.status==='SOURCE_NOT_YET_PUBLISHED'?'New-model live forecasts have not been published yet.':
     data?.status==='NO_UPCOMING_PREGAME_SOURCE_GAMES'?'No future game currently passes the pretip source gate.':
     'No source-verified upcoming player projections are available. No old-model numbers are substituted.'}
   </p>}
   {!!dates.length&&<div className="flex gap-2 overflow-x-auto pb-1" role="group"
     aria-label="Independent model NBA date">
    {(['AUTO','ALL',...dates] as string[]).map(x=>
     <button type="button" key={x} onClick={()=>setDay(x)} aria-pressed={day===x}
      className={'min-h-10 shrink-0 rounded-lg border px-3 text-xs '+
       (day===x?'border-[#79FF48] bg-[#79FF48]/10 text-[#79FF48]':
       'border-white/10 bg-[#222] text-gray-300')}>
      {x==='AUTO'?'Next slate':x==='ALL'?'All upcoming':x.slice(5)}
     </button>)}
   </div>}
   {games.map(g=>{
    const visible=showAll[g.game_id]?g.players:g.players.slice(0,10);
    const expanded=open[g.game_id]??true;
    const ranked=g.players.flatMap(p=>MARKET.flatMap(m=>{
      const conf=p.projection_accuracy_confidence?.[m];
      const prob=safeP(conf);
      const projection=p.predictions[m];
      // Low expected counts can trivially land inside ±2 (e.g. 0.6
      // assists): show their measured percentage in the player row but
      // never present that as the highest-confidence useful projection.
      // A ranking entry's tolerance must be <= half the expected stat.
      return prob!==null&&projection!==undefined&&
        projection>=2*conf!.window_plus_or_minus?[{p,m,prob,
        projection,window:conf!.window_plus_or_minus}]:[];
    })).sort((a,b)=>b.prob-a.prob||b.projection-a.projection);

    return <article key={g.game_id} data-testid="nba-independent-game"
      className="overflow-hidden rounded-xl border border-white/10 bg-[#171b1d]">
     <button type="button" onClick={()=>setOpen(o=>({...o,[g.game_id]:!expanded}))}
      aria-expanded={expanded}
      className="flex min-h-16 w-full items-center justify-between gap-2 p-3 text-left">
      <div className="min-w-0">
       <strong className="block text-sm">{g.away} @ {g.home}</strong>
       <span className="text-[11px] text-gray-400">
        {TIP(g.tipoff_utc)} · {g.players_forecast} players · {g.rows_count} stat projections
       </span>
      </div>
      <ChevronDown size={18} className={'text-[#79FF48] '+(expanded?'rotate-180':'')}/>
     </button>
     {expanded&&<div className="border-t border-white/10 p-3">
      <div className="mb-3 rounded-lg border border-[#79FF48]/20 bg-black/20 px-2 py-2">
       <strong className="text-[11px] text-[#79FF48]">Highest confidence in the model's own projection</strong>
       {ranked.length>0?<div data-testid="nba-independent-confidence-ranking" className="mt-2 space-y-1">
         {ranked.slice(0,5).map((r,i)=><div key={r.p.player_id+'-'+r.m}
           className="flex items-center justify-between gap-2 text-xs">
           <span className="min-w-0 truncate text-gray-200">{i+1}. {r.p.player} · {LABEL[r.m]} {fmt(r.projection)} (±{r.window})</span>
           <strong className="shrink-0 tabular-nums text-[#79FF48]">{pct(r.prob)}</strong>
         </div>)}
       </div>:<p className="mt-2 text-[11px] text-amber-200">
         Confidence has not yet been measured for these predictions. Numerical projections remain available.
       </p>}
       <p className="mt-2 text-[10px] text-gray-400">Historical accuracy within ± the shown window, for projections at least 2× that window. A 90% near-zero assists forecast does NOT mean a 90% chance to record 1+ assists. These percentages are NOT prop-bet win chances. No sportsbook thresholds involved.</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,2.25rem)] gap-1.5 text-[10px] font-semibold text-gray-400">
       <span>PLAYER</span>{MARKET.map(m=><span key={m} className="text-right">{LABEL[m]}</span>)}
      </div>
      <div className="mt-2 space-y-1">
       {visible.map(p=><div key={p.team_id+'|'+p.player_id}
        className="grid grid-cols-[minmax(0,1fr)_repeat(4,2.25rem)] items-center gap-1.5 rounded-lg bg-[#242b2e] px-1.5 py-2">
        <div className="min-w-0">
         <p className="truncate text-xs font-semibold text-white" title={p.player}>{p.player}</p>
         <p className="truncate text-[10px] text-gray-400">
          {Math.round(p.source_active_probability_unverified*100)}% historical play estimate · unconfirmed
         </p>
        </div>
        {MARKET.map(m=><span key={m}
         className="flex flex-col items-end text-right tabular-nums">
         <strong className="text-[12px] text-[#79FF48]">{fmt(p.predictions[m])}</strong>
         <span className="text-[10px] text-white" title={'Chance within ±'+
           (p.projection_accuracy_confidence?.[m]?.window_plus_or_minus??'?')+
           ' of own projection if player plays'}>
          {safeP(p.projection_accuracy_confidence?.[m])===null?'—':
           pct(safeP(p.projection_accuracy_confidence?.[m])!)}
         </span>
        </span>)}
       </div>)}
      </div>
      {g.players.length>10&&<button type="button" onClick={()=>setShowAll(o=>({
        ...o,[g.game_id]:!o[g.game_id]
      }))} className="mt-3 min-h-10 w-full rounded-lg border border-[#79FF48]/30 text-xs text-[#79FF48]">
       {showAll[g.game_id]?'Show first 10':'Show all '+g.players.length+' player projections'}
      </button>}
      {!g.players.length&&<p className="py-2 text-xs text-amber-200">
       No player passes the pregame roster/history gate for this game.</p>}
      <p className="mt-3 text-[10px] text-gray-400">Bold number = the independent model's projected stat. Smaller percent = historical chance of finishing close to that projection (if playing). Neither is a sportsbook line or verified 2026–27 betting win rate.</p>
     </div>}
    </article>;
   })}
   {data&&!!games.length&&<div className="flex items-start gap-2 text-[11px] text-gray-400">
    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300"/>
    A high projected total is not necessarily the strongest bet. Compare with official starters and independently priced lines before making decisions.
   </div>}
 </section>;
}
