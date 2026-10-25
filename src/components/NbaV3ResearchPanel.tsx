import React,{useCallback,useEffect,useState} from 'react';
import {RefreshCw} from 'lucide-react';

type Market='points'|'rebounds'|'assists'|'three_pointers_made';
const NAME:Record<Market,string>={points:'POINTS',rebounds:'REBOUNDS',
 assists:'ASSISTS',three_pointers_made:'THREES'};
type Forecast={
 player:string;team_id:string;player_id:string;market:Market;
 mean:number;median:number;p10:number;p25:number;p75:number;p90:number;
 p_active:number;exp_opp:number;role_share:number;unc_reasons:string[];
 model_target:{milestone:number;probability:number;method:string}|null;
};
type Game={game_id:string;away:string;home:string;tipoff_utc:string;
 forecast_at_utc:string;rows_count:number;rows:Forecast[]};
type Shadow={schema:string;status:string;upcoming_games:number;
 original_games_audited:number;research_only:true;official_bets:0;games:Game[];
 prospective_model_probability_calibration_verified:false};
const pct=(v:number)=>(v*100).toFixed(1)+'%';
const fmt=(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:1});
const et=(iso:string)=>new Date(iso).toLocaleString('en-US',
 {timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',
  minute:'2-digit'})+' ET';
export default function NbaV3ResearchPanel({search=''}:{search?:string}){
 const [doc,setDoc]=useState<Shadow|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [expanded,setExpanded]=useState('');
 const [full,setFull]=useState(false);
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{
   const r=await fetch('/api/nba-v3-shadow?t='+Date.now(),{cache:'no-store'});
   const x=await r.json();
   if(!r.ok)throw Error(x.error||'Source unavailable');
   if(x.schema!=='NBA_V3_FULL_GAME_DISTRIBUTION_READ_ONLY_V1'||
      x.research_only!==true||x.official_bets!==0||
      x.prospective_model_probability_calibration_verified!==false||
      !Array.isArray(x.games))throw Error('NBA_V3_INVALID_OR_PROMOTED_SHADOW');
   setDoc(x);setError('');
  }catch(e){
   setError(e instanceof Error?e.message:String(e));setDoc(null);
  }finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  void refresh();
  const id=setInterval(()=>void refresh(),60000);
  return()=>clearInterval(id);
 },[refresh]);
 return <section className="space-y-3" data-testid="nba-v3-phase1-shadow">
  <div className="rounded-xl border border-amber-700/60 bg-amber-950/20 p-3 text-xs text-amber-200 space-y-2">
   <div className="flex justify-between items-center gap-2">
    <strong>NBA V3 · NFL-STYLE FULL GAME DISTRIBUTIONS</strong>
    <button type="button" onClick={()=>void refresh()}
       aria-label="Refresh NBA V3 forecasts" className="border border-[#444] rounded-lg min-h-10 min-w-10 flex items-center justify-center">
     <RefreshCw size={16}/></button>
   </div>
   <p>Real pregame basketball roster and role evidence, shared rotation-minute
    simulation, shot opportunities, game pace and full simulated outcomes.</p>
   <p className="font-bold">RESEARCH ONLY · NOT YET FORWARD-CALIBRATED · NO BOOKMAKER REQUIRED.</p>
   <p>V2 remains the system-picks champion until matching original future-game
    forecasts prove V3 improves calibration and scoring.</p>
  </div>
  {loading&&!doc&&<p className="text-xs text-gray-400">Loading NBA V3 source-verified distributions…</p>}
  {error&&<p role="alert" className="border border-red-700 p-3 rounded-lg text-xs text-red-200">{error}</p>}
  {doc&&<p className="text-xs text-gray-400">
    {doc.upcoming_games} upcoming games · {doc.original_games_audited} immutable source games audited
  </p>}
  {doc&&doc.status!=='AVAILABLE_RESEARCH_ONLY'&&<p className="border border-[#333] p-3 rounded-lg text-xs text-gray-400">
   {doc.status==='NO_FIRSTSEEN_V3_SHADOW_YET'?
      'First pregame V3 simulation has not been frozen yet. No past-game backfill will masquerade as a real forecast.':
      'No current or upcoming frozen V3 shadow. Original forecasts remain archived for grading.'}
  </p>}
  {doc?.games.filter(g=>!search||(
   g.home+' '+g.away+' '+g.rows.map(r=>r.player).join(' ')
  ).toLowerCase().includes(search.toLowerCase())).map(g=>{
   const targets=g.rows.filter(r=>r.model_target?.probability!=null&&
     r.model_target.probability>=.65).sort((a,b)=>
      (b.model_target?.probability||0)-(a.model_target?.probability||0));
   const open=expanded===g.game_id;
   return <article key={g.game_id}
      className="rounded-xl border border-[#333] bg-[#191919]"
      data-testid="nba-v3-shadow-game">
    <button type="button" onClick={()=>setExpanded(open?'':g.game_id)}
      aria-expanded={open} className="w-full min-h-16 text-left p-3 flex justify-between gap-2 items-center">
     <div><strong className="text-sm">{g.away} @ {g.home}</strong>
      <p className="text-[11px] text-gray-400">{et(g.tipoff_utc)} · {g.rows_count} player/stat projections
       {' · '}{targets.length} research milestones</p></div>
     <span className="text-[#00FF41] text-xl">{open?'−':'+'}</span>
    </button>
    {open&&<div className="border-t border-[#333] p-3 space-y-2">
     <p className="text-[11px] text-gray-400">
      Original forecast frozen {et(g.forecast_at_utc)}.
      No active-list certification or calibrated betting probability is implied.</p>
     {targets.slice(0,10).map(r=><div key={r.player_id+'|'+r.market}
       className="rounded-lg border border-[#444] bg-[#111] p-3 space-y-1">
      <div className="flex gap-2 justify-between text-xs">
       <strong>{r.player} · {NAME[r.market]}</strong>
       <strong className="text-[#00FF41]">{pct(r.model_target!.probability)}</strong>
      </div>
      <p className="text-xs text-amber-200">
        MODEL {r.model_target!.milestone}+ {NAME[r.market]} · RESEARCH ONLY</p>
      <p className="text-[11px] text-gray-300">
       Prediction median {fmt(r.median)} · mean {fmt(r.mean)}
       {' · '}P10–P90 {fmt(r.p10)}–{fmt(r.p90)}
       {' · '}P(plays) {pct(r.p_active)}</p>
     </div>)}
     {!targets.length&&<p className="text-xs text-gray-400">
      No model milestone exceeds 65%. Full stat distributions are still saved.</p>}
     <button type="button" onClick={()=>setFull(v=>!v)}
       className="min-h-10 border border-[#555] rounded-lg px-3 text-xs">
      {full?'Hide numerical projections':'View all '+g.rows.length+' predictions'}</button>
     {full&&g.rows.slice(0,180).map((r,i)=><div
       key={r.player_id+'|'+r.market+'|'+i} className="border border-[#333] rounded-lg p-3 space-y-1 text-xs">
       <strong>{r.player} · {NAME[r.market]}</strong>
       <p>Median {fmt(r.median)} · mean {fmt(r.mean)}
        {' · '}P25–P75 {fmt(r.p25)}–{fmt(r.p75)}
        {' · '}P(plays) {pct(r.p_active)}
        {' · '}Role minute share {pct(r.role_share)}</p>
       <p className="text-[11px] text-gray-400">
         Expected exposure {fmt(r.exp_opp)} · {r.unc_reasons.join(', ')}</p>
     </div>)}
    </div>}
   </article>;
  })}
 </section>;
}
