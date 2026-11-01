import React,{useEffect,useState} from 'react';
import {RefreshCw,AlertTriangle} from 'lucide-react';
import type {Forecast,League} from '../soccer/model';
import {SOCCER_SCHEMA,LEAGUES} from '../soccer/model';
import {frozenSoccerBoard} from '../soccer/frozenBoardAssets';
type GoalAudit={teamScores:number;meanAbsoluteError:number|null;
  baselineMeanAbsoluteError:number|null; signedBias:number|null;
  exactRoundedCountRate:number|null;withinOneActualGoalRate:number|null};
type Summary={n:number;brier:number|null;baselineBrier:number|null;
  accuracy:number|null;baselineAccuracy:number|null;brierAdvantage:number|null;
  goalProjections?:GoalAudit};
type Forward={schema:string;originallyFrozen:number;graded:number;ungraded:number;
 gradedTeamScores:number;modelGoalMAE:number|null;baselineGoalMAE:number|null;
 withinOneGoalRate:number|null;exactRoundedGoalRate:number|null;asofDateUTC:string};
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
function MatchCard({p,origin}:{p:Forecast;origin:'FROZEN'|'LIVE'}){
 return <article className="space-y-3 rounded-2xl border border-[#313131] bg-[#181818] p-4">
   <div className="flex justify-between gap-3 text-[10px] uppercase tracking-wider text-gray-400">
     <span>{LEAGUES[p.league].name}</span><span>{p.date} · kickoff unverified</span>
   </div>
   <div className="flex items-center justify-start"><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${origin==='FROZEN'?'bg-[#79FF48]/10 text-[#79FF48]':'bg-[#30414b] text-gray-200'}`}>{origin==='FROZEN'?'SAVED PREGAME MODEL':'LIVE RESEARCH MODEL'}</span></div>
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
 const [doc,setDoc]=useState<Doc|null>(null);
 const [liveError,setLiveError]=useState<string|null>(null);
 const [forward,setForward]=useState<Forward|null>(null);
 const [loading,setLoading]=useState(false);
 const [league,setLeague]=useState<League|'ALL'>('ALL');
 async function refresh(){
   setLoading(true);setLiveError(null);
   const scorecardTask=(async()=>{
     try{
       const r=await fetch('/api/soccer-forward-scorecard',{cache:'no-store'});
       if(!r.ok)throw Error('scorecard API unavailable');
       const d=await r.json() as Forward;
       if(d.schema!=='soccer-forward-scorecard-v1'||
          !Number.isInteger(d.originallyFrozen)||d.graded>d.originallyFrozen||
          d.gradedTeamScores!==2*d.graded)
         throw Error('invalid scorecard contract');
       setForward(d);
     }catch{setForward(null);}
   })();
   try{
     const r=await fetch('/api/soccer-research',{cache:'no-store'});
     if(!r.ok)throw Error('Live soccer feed returned HTTP '+r.status);
     const data:unknown=await r.json();
     if(!valid(data))throw Error('Live soccer feed failed data validation');
     setDoc(data);setLiveError(null);
   }catch(e){
     setLiveError(e instanceof Error?e.message:'Live source is unreachable');
   }finally{setLoading(false);}
   void scorecardTask;
 }
 useEffect(()=>{void refresh();},[]);
 // Bundled immutable GitHub first-seen originals: works even if the API is
 // unavailable, unavailable on static AI Studio, or an upstream request times out.
 const saved=frozenSoccerBoard(new Date().toISOString());
 type Card={forecast:Forecast;origin:'FROZEN'|'LIVE'};
 const key=(f:Forecast)=>[f.league,f.season,f.date,f.home,f.away].join('|');
 const all=new Map<string,Card>();
 for(const item of saved)all.set(key(item.forecast),{forecast:item.forecast,origin:'FROZEN'});
 const today=new Date().toISOString().slice(0,10);
 for(const f of doc?.forecasts??[]){
   if(f.date>=today&&!all.has(key(f)))
     all.set(key(f),{forecast:f,origin:'LIVE'});
 }
 const games=[...all.values()].filter(x=>league==='ALL'||x.forecast.league===league)
   .sort((a,b)=>a.forecast.date.localeCompare(b.forecast.date)||
     a.forecast.league.localeCompare(b.forecast.league)||
     a.forecast.home.localeCompare(b.forecast.home));
 const audit=doc?.historical_audit;
 return <div id="soccer-projections-screen" className="h-full space-y-4 overflow-y-auto px-4 pb-24 pt-4 text-stone-100">
   <header className="flex items-center justify-between gap-3">
     <div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-[.17em] text-[#79FF48]">SOCCER · MODEL PROJECTIONS</div>
       <h1 className="mt-1 text-[23px] font-black tracking-tight">Upcoming matches</h1>
       <p className="mt-1 text-xs text-gray-400">Model's real goal forecasts · 5 major leagues</p></div>
     <button type="button" aria-label="Refresh soccer projections" onClick={()=>void refresh()}
       className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#1b2427] text-[#79FF48]">
       <RefreshCw size={19} className={loading?'animate-spin':''}/>
     </button>
   </header>
   <div className="rounded-2xl border border-[#79FF48]/25 bg-[#102017] p-4">
     <div className="flex items-end justify-between gap-3">
       <div><p className="text-xs font-bold text-gray-300">Available match forecasts</p>
         <p className="mt-1 text-[32px] font-black leading-none tabular-nums text-[#79FF48]">{games.length}</p></div>
       <div className="text-right"><p className="text-xs text-gray-300">Saved pregame</p>
         <p className="mt-1 text-lg font-black tabular-nums">{games.filter(g=>g.origin==='FROZEN').length}</p></div>
     </div>
     <p className="mt-3 text-[11px] leading-relaxed text-gray-400">Projected home and away goals are the model's original numbers. No sportsbook target, artificial pick or postgame recreation.</p>
   </div>
   {liveError&&<div role="status" className="rounded-xl border border-amber-400/20 bg-[#292315] p-3 text-[11px] text-amber-100">
     Live soccer refresh unavailable ({liveError}). {saved.length?'Showing saved original pregame forecasts instead.':'No saved upcoming forecasts available.'}
   </div>}
   <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Select soccer league">
     {(['ALL',...leagues] as (League|'ALL')[]).map(l=>
       <button type="button" key={l} onClick={()=>setLeague(l)} aria-pressed={league===l}
         className={'min-h-10 shrink-0 rounded-full border px-4 text-[12px] font-semibold '+(league===l?'border-[#79FF48] bg-[#79FF48] text-[#122018]':'border-white/10 bg-[#1d2629] text-gray-200')}>
         {l==='ALL'?'All leagues':LEAGUES[l].name}
       </button>)}
   </div>
   <section aria-label="Soccer numerical match forecasts" className="space-y-3" data-testid="soccer-forecast-board">
     <div className="flex items-center justify-between"><h2 className="font-black">Goal projections</h2>
       <span className="text-[11px] text-gray-400">{games.length} matches</span></div>
     {games.map(({forecast,origin})=><MatchCard key={key(forecast)} p={forecast} origin={origin}/>)}
     {games.length===0&&<div className="rounded-2xl border border-white/10 bg-[#182024] p-4 text-sm text-gray-300">
       {loading?'Loading additional source-confirmed games…':
        'No verified upcoming match forecasts for this league and date range. The system will not invent them.'}
     </div>}
   </section>
   <section data-testid="soccer-player-forecast-status" className="rounded-2xl border border-amber-400/20 bg-[#211d15] p-4">
     <h2 className="text-[14px] font-black text-white">Player shots &amp; shots on target</h2>
     <p className="mt-2 text-[12px] leading-relaxed text-gray-300">
       The new player-minutes, shots and shots-on-target model is built, but its authorized player-stat provider is not yet verified on this frontend.
       Real player forecasts cannot appear until that source and player identities are connected. No fabricated projections.
     </p>
     <span className="mt-2 inline-block text-[10px] font-bold text-amber-200">RESEARCH ONLY · NOT OFFICIAL PICKS</span>
   </section>
   <section data-testid="soccer-forward-scorecard" className="rounded-2xl border border-white/10 bg-[#182024] p-4">
     <h2 className="text-sm font-black">Real pregame grading</h2>
     {forward?<div className="mt-3 space-y-2 text-[12px] text-gray-300">
       <p>{forward.originallyFrozen} frozen · {forward.graded} graded · {forward.ungraded} awaiting final results</p>
       {forward.graded>0?<p>Actual goal MAE: {forward.modelGoalMAE?.toFixed(3)} · Within 1 goal: {forward.withinOneGoalRate==null?'–':pct(forward.withinOneGoalRate)} · Baseline MAE: {forward.baselineGoalMAE?.toFixed(3)}</p>
        :<p className="text-amber-200">No verified finals graded yet. Accuracy is not established.</p>}
     </div>:<p className="mt-2 text-xs text-gray-400">Forward scorecard API unavailable. Original forecast cards above are archived independently.</p>}
   </section>
   {audit&&<details className="rounded-2xl border border-white/10 bg-[#151b1e] p-4">
     <summary className="cursor-pointer text-sm font-bold">Historical model research (not live performance)</summary>
     <div data-testid="soccer-projection-accuracy" className="mt-3 space-y-2 text-xs text-gray-300">
       <p>{audit.overall.n} retrospectively reconstructed matches. Goal MAE: {audit.overall.goalProjections?.meanAbsoluteError?.toFixed(3)??'–'}, baseline {audit.overall.goalProjections?.baselineMeanAbsoluteError?.toFixed(3)??'–'}.</p>
       <p>Within 1 goal: {audit.overall.goalProjections?.withinOneActualGoalRate==null?'–':pct(audit.overall.goalProjections.withinOneActualGoalRate)}. Brier: {audit.overall.brier?.toFixed(3)??'–'} vs baseline {audit.overall.baselineBrier?.toFixed(3)??'–'}.</p>
       <p className="text-amber-200">Backtest, not certified betting results.</p>
     </div>
   </details>}
 </div>;
}
