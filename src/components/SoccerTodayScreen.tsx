import React,{useEffect,useState} from 'react';
import {RefreshCw,AlertTriangle} from 'lucide-react';
import type {Forecast,League} from '../soccer/model';
import {SOCCER_SCHEMA,LEAGUES} from '../soccer/model';
type Summary={n:number;brier:number|null;baselineBrier:number|null;accuracy:number|null;baselineAccuracy:number|null;brierAdvantage:number|null};
type Doc={schema:string;status:string;asof_calendar_day_utc:string;forecast_count:number;forecasts:Forecast[];
  historical_audit:{kind:string;overall:Summary;promotionGate:{passed:boolean}};
  guardrails:{official_bets:number;calibrated:boolean;verified_live_book_lines:number;player_prop_predictions:number}};
const leagues:League[]=['EPL','LaLiga','SerieA','Bundesliga','Ligue1'];
const pct=(n:number)=>(100*n).toFixed(1)+'%';
function valid(d:unknown):d is Doc{
  const x=d as Doc;
  return !!x&&x.schema===SOCCER_SCHEMA&&x.status==='RESEARCH_ONLY_NOT_CALIBRATED_NOT_BETTABLE'
    &&Array.isArray(x.forecasts)&&x.forecast_count===x.forecasts.length
    &&x.guardrails?.official_bets===0&&x.guardrails?.calibrated===false
    &&x.guardrails?.verified_live_book_lines===0&&x.guardrails?.player_prop_predictions===0
    &&x.historical_audit?.kind==='RETROSPECTIVE_WALKFORWARD_NOT_IMMUTABLE_PREGAME_PICKS'
    &&x.forecasts.every(f=>leagues.includes(f.league)&&f.status==='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'
      &&f.date>=x.asof_calendar_day_utc&&Number.isFinite(f.expectedHomeGoals)
      &&Number.isFinite(f.expectedAwayGoals)
      &&Math.abs(f.probabilities.home+f.probabilities.draw+f.probabilities.away-1)<.0003);
}
function ProbabilityBar({name,value}:{name:string;value:number}){
 return <div className="space-y-1">
   <div className="flex justify-between text-[11px] text-gray-300"><span>{name}</span><strong>{pct(value)}</strong></div>
   <div className="h-1.5 w-full overflow-hidden rounded bg-[#252525]">
     <div className="h-full bg-[#00d45a]" style={{width:Math.max(0,Math.min(100,value*100))+'%'}}/>
   </div>
 </div>;
}
function MatchCard({p}:{p:Forecast}){
 return <article className="space-y-3 rounded-2xl border border-[#313131] bg-[#181818] p-4">
   <div className="flex justify-between gap-3 text-[10px] uppercase tracking-wider text-gray-400">
     <span>{LEAGUES[p.league].name}</span><span>{p.date} · kickoff unverified</span>
   </div>
   <div className="flex justify-between gap-3 text-sm font-bold">
     <span>{p.home}</span><span className="shrink-0 text-gray-500">vs</span><span className="text-right">{p.away}</span>
   </div>
   <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#0e0e0e] p-3 text-center">
     <div><div className="text-[10px] text-gray-400">Projected home goals</div>
       <div className="text-xl font-bold text-[#00d45a]">{p.expectedHomeGoals.toFixed(2)}</div></div>
     <div><div className="text-[10px] text-gray-400">Projected away goals</div>
       <div className="text-xl font-bold text-[#00d45a]">{p.expectedAwayGoals.toFixed(2)}</div></div>
   </div>
   <ProbabilityBar name="Home win" value={p.probabilities.home}/>
   <ProbabilityBar name="Draw" value={p.probabilities.draw}/>
   <ProbabilityBar name="Away win" value={p.probabilities.away}/>
   <div className="grid grid-cols-2 gap-2 border-t border-[#303030] pt-3 text-[11px] text-gray-300">
     <span>Over 2.5 goals <strong>{pct(p.probabilities.over25)}</strong></span>
     <span>Both teams score <strong>{pct(p.probabilities.btts)}</strong></span>
   </div>
   <p className="text-[10px] text-gray-500">Model goal expectations, not tracked xG. No verified starting lineup, injuries, player props or bookmaker odds.</p>
 </article>;
}
export default function SoccerTodayScreen(){
 const [doc,setDoc]=useState<Doc|null>(null),[error,setError]=useState<string|null>(null);
 const [loading,setLoading]=useState(false),[league,setLeague]=useState<League|'ALL'>('ALL');
 async function refresh(){
   setLoading(true);setError(null);
   try{
     const r=await fetch('/api/soccer-research',{cache:'no-store'});
     if(!r.ok)throw Error('Soccer research source unavailable (HTTP '+r.status+')');
     const d:unknown=await r.json();
     if(!valid(d))throw Error('Unverified soccer research contract');
     setDoc(d);
   }catch(e){setError(e instanceof Error?e.message:'Soccer research unavailable');}
   finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 const games=(doc?.forecasts??[]).filter(g=>league==='ALL'||g.league===league);
 const audit=doc?.historical_audit;
 return <div className="h-full overflow-y-auto space-y-4 px-4 pb-24 pt-5 text-stone-100">
   <div className="flex items-start justify-between gap-3">
     <div><div className="text-[10px] tracking-[.24em] text-[#00df65]">PROP EDGE · NEW ENGINE</div>
       <h1 className="mt-1 text-2xl font-extrabold">SOCCER V1</h1>
       <p className="text-xs text-gray-400">Five leagues · 1X2 · match goals</p></div>
     <button aria-label="Refresh soccer projections" onClick={()=>void refresh()}
       className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#333] bg-[#151515]">
       <RefreshCw size={18} className={loading?'animate-spin':''}/>
     </button>
   </div>
   <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-[#201d0e] p-3 text-[11px] text-amber-100">
     <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
     <span>Research only. Not a betting card: no verified odds or player props. The historical comparison is reconstructed, not a first-seen pregame wagering backtest.</span>
   </div>
   {error&&<div role="alert" className="rounded-xl border border-red-600 p-3 text-sm text-red-300">{error}</div>}
   {doc&&<>
     <div className="grid grid-cols-3 gap-2">
       <div className="rounded-xl bg-[#181818] p-3 text-center">
         <div className="text-xl font-bold">{doc.forecast_count}</div><div className="text-[10px] text-gray-400">Fixture forecasts</div></div>
       <div className="rounded-xl bg-[#181818] p-3 text-center">
         <div className="text-xl font-bold">{audit?.overall.n}</div><div className="text-[10px] text-gray-400">Walk-forward games</div></div>
       <div className="rounded-xl bg-[#181818] p-3 text-center">
         <div className="text-xl font-bold">{audit?.overall.brier?.toFixed(3)??'–'}</div>
         <div className="text-[10px] text-gray-400">3-way Brier</div></div>
     </div>
     <div className="space-y-1 rounded-xl border border-[#303030] bg-[#151515] p-3 text-xs text-gray-400">
       <div className="font-semibold text-white">Backtest versus league baseline</div>
       <div>Model Brier: {audit?.overall.brier?.toFixed(4)??'–'} · Baseline: {audit?.overall.baselineBrier?.toFixed(4)??'–'}</div>
       <div>Improvement: {audit?.overall.brierAdvantage?.toFixed(4)??'–'} · Promotion threshold: {audit?.promotionGate.passed?'research threshold met; not live-proven':'not met'}</div>
     </div>
     <div className="flex gap-2 overflow-x-auto pb-2">
       {(['ALL',...leagues] as (League|'ALL')[]).map(l=>
         <button key={l} onClick={()=>setLeague(l)}
           className={'min-h-10 shrink-0 rounded-full border px-3 text-xs '+(league===l?'border-[#00d45a] bg-[#153723]':'border-[#343434] bg-[#191919]')}>
           {l==='ALL'?'All leagues':LEAGUES[l].name}</button>)}
     </div>
     <p className="text-xs text-gray-400">{games.length} upcoming matches · source date {doc.asof_calendar_day_utc} UTC</p>
     {games.map(p=><MatchCard key={[p.league,p.season,p.date,p.home,p.away].join('|')} p={p}/>)}
     {!games.length&&<p className="rounded-xl border border-[#333] p-4 text-sm text-gray-400">No source-confirmed unplayed fixtures in this window. No predictions were fabricated.</p>}
   </>}
   {!doc&&!error&&<p className="text-sm text-gray-400">{loading?'Loading source match results and running historical checks…':'No verified soccer data yet.'}</p>}
 </div>;
}
