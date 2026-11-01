import React,{useEffect,useState} from 'react';
import {RefreshCw,Search,ChevronDown,ChevronUp,CalendarDays,Activity,Users,ChartNoAxesCombined,SlidersHorizontal} from 'lucide-react';
import type {Forecast,League} from '../soccer/model';
import {SOCCER_SCHEMA,LEAGUES} from '../soccer/model';
import {frozenSoccerBoard} from '../soccer/frozenBoardAssets';

type GoalAudit={teamScores:number;meanAbsoluteError:number|null;
 baselineMeanAbsoluteError:number|null;signedBias:number|null;
 exactRoundedCountRate:number|null;withinOneActualGoalRate:number|null};
type Summary={n:number;brier:number|null;baselineBrier:number|null;
 accuracy:number|null;baselineAccuracy:number|null;brierAdvantage:number|null;
 goalProjections?:GoalAudit};
type Forward={schema:string;originallyFrozen:number;graded:number;ungraded:number;
 gradedTeamScores:number;modelGoalMAE:number|null;baselineGoalMAE:number|null;
 withinOneGoalRate:number|null;exactRoundedGoalRate:number|null;asofDateUTC:string};
type Doc={schema:string;status:string;asof_calendar_day_utc:string;
 forecast_count:number;forecasts:Forecast[];
 historical_audit:{kind:string;overall:Summary;promotionGate:{passed:boolean}};
 guardrails:{official_bets:number;calibrated:boolean;verified_live_book_lines:number;player_prop_predictions:number}};
type Card={id:string;forecast:Forecast;origin:'FROZEN'|'LIVE'};
type Screen='MATCHES'|'PLAYERS'|'PERFORMANCE';
type Range='7'|'14'|'ALL';
const leagues:League[]=['EPL','LaLiga','SerieA','Bundesliga','Ligue1'];
const pct=(n:number)=>(100*n).toFixed(1)+'%';
const short:Record<League,string>={EPL:'Premier League',LaLiga:'La Liga',
 SerieA:'Serie A',Bundesliga:'Bundesliga',Ligue1:'Ligue 1'};
const key=(p:Forecast)=>[p.league,p.season,p.date,p.home,p.away].join('|');
const futureDay=(day:string,n:number)=>
 new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
function formatDay(day:string){
 return new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'long',
  month:'short',day:'numeric'}).format(new Date(day+'T12:00:00Z'));
}
function valid(d:unknown):d is Doc{
 const x=d as Doc;
 return !!x&&x.schema===SOCCER_SCHEMA&&x.status==='RESEARCH_ONLY_NOT_CALIBRATED_NOT_BETTABLE'
  &&Array.isArray(x.forecasts)&&x.forecast_count===x.forecasts.length
  &&x.guardrails?.official_bets===0&&x.guardrails?.calibrated===false
  &&x.guardrails?.verified_live_book_lines===0&&x.guardrails?.player_prop_predictions===0
  &&x.historical_audit?.kind==='RETROSPECTIVE_WALKFORWARD_NOT_IMMUTABLE_PREGAME_PICKS'
  &&x.forecasts.every(f=>leagues.includes(f.league)&&
   f.status==='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'&&
   f.date>=x.asof_calendar_day_utc&&Number.isFinite(f.expectedHomeGoals)&&
   Number.isFinite(f.expectedAwayGoals)&&
   Math.abs(f.probabilities.home+f.probabilities.draw+f.probabilities.away-1)<.0003);
}
function ProbabilityBar({name,value}:{name:string;value:number}){
 return <div className="flex items-center gap-3 py-1">
  <span className="w-20 shrink-0 text-[12px] text-slate-300">{name}</span>
  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
   <div className="h-full rounded-full bg-[#79FF48]" style={{width:(Math.max(0,Math.min(1,value))*100)+'%'}}/>
  </div>
  <strong className="w-14 shrink-0 text-right text-[12px] tabular-nums text-white">{pct(value)}</strong>
 </div>;
}
function MatchRow({card,expanded,onToggle}:{card:Card;expanded:boolean;onToggle:()=>void}){
 const p=card.forecast;
 const anchor='soccer-detail-'+card.id.replace(/[^a-zA-Z0-9]/g,'-');
 const best=p.probabilities.home>=p.probabilities.away&&p.probabilities.home>=p.probabilities.draw?'Home':
  p.probabilities.away>=p.probabilities.home&&p.probabilities.away>=p.probabilities.draw?'Away':'Draw';
 return <article data-testid="soccer-match-row" className={'overflow-hidden rounded-[20px] border bg-[#171f22] transition-colors '+
   (expanded?'border-[#79FF48]/35 shadow-[0_6px_24px_#0003]':'border-white/10')}>
   <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={anchor}
     className="w-full p-4 text-left active:bg-white/[.04]">
     <div className="mb-3 flex min-w-0 items-center justify-between gap-2 text-[10px]">
       <span className="min-w-0 truncate font-bold uppercase tracking-[.10em] text-slate-400">{short[p.league]}</span>
       <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-slate-400">
         <span className={'h-1.5 w-1.5 rounded-full '+(card.origin==='FROZEN'?'bg-[#79FF48]':'bg-sky-400')}/>
         {card.origin==='FROZEN'?'Saved pregame':'Live research'}
       </span>
     </div>
     <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
       <span className="min-w-0 break-words text-[15px] font-bold leading-snug text-white">{p.home}</span>
       <div className="flex min-w-[48px] items-center justify-end">
         <span className="text-[20px] font-black leading-none tabular-nums tracking-tight text-[#79FF48]">{p.expectedHomeGoals.toFixed(2)}</span>
       </div>
       <span className="min-w-0 break-words text-[15px] font-bold leading-snug text-white">{p.away}</span>
       <div className="flex items-center justify-end">
         <span className="text-[20px] font-black leading-none tabular-nums tracking-tight text-[#79FF48]">{p.expectedAwayGoals.toFixed(2)}</span>
       </div>
     </div>
     <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[.07] pt-3">
       <div className="flex min-w-0 items-center gap-2">
         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model goals</span>
         <span className="text-[10px] text-slate-500">·</span>
         <span className="truncate text-[11px] text-slate-400">1X2 {best.toLowerCase()} most likely</span>
       </div>
       <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#79FF48]">
         {expanded?'Less':'Details'} {expanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}
       </span>
     </div>
   </button>
   {expanded&&<div id={anchor} data-testid="soccer-match-details" className="border-t border-white/10 bg-[#10191b] px-4 pb-4 pt-3">
     <div className="mb-3 flex items-center justify-between gap-2">
       <h3 className="text-[13px] font-bold text-white">Match probabilities</h3>
       <span className="text-[10px] text-amber-200">Uncalibrated research</span>
     </div>
     <ProbabilityBar name="Home win" value={p.probabilities.home}/>
     <ProbabilityBar name="Draw" value={p.probabilities.draw}/>
     <ProbabilityBar name="Away win" value={p.probabilities.away}/>
     <div className="mt-3 grid grid-cols-2 gap-2">
       <div className="rounded-xl border border-white/[.07] bg-white/[.04] px-3 py-3">
         <p className="text-[10px] text-slate-400">Over 2.5 goals</p>
         <p className="mt-1 text-[17px] font-extrabold text-slate-100">{pct(p.probabilities.over25)}</p>
       </div>
       <div className="rounded-xl border border-white/[.07] bg-white/[.04] px-3 py-3">
         <p className="text-[10px] text-slate-400">Both teams score</p>
         <p className="mt-1 text-[17px] font-extrabold text-slate-100">{pct(p.probabilities.btts)}</p>
       </div>
     </div>
     <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
       Numerical team-goal means, not tracked xG. Kickoff time unverified; no confirmed lineup or player availability.
       These research percentages are not validated betting recommendations.
     </p>
     <p className="mt-2 text-[10px] text-slate-500">Source: {card.origin==='FROZEN'?'original saved pregame forecast':'current research calculation'}</p>
   </div>}
 </article>;
}
export default function SoccerTodayScreen(){
 const [doc,setDoc]=useState<Doc|null>(null);
 const [liveError,setLiveError]=useState<string|null>(null);
 const [forward,setForward]=useState<Forward|null>(null);
 const [loading,setLoading]=useState(false);
 const [league,setLeague]=useState<League|'ALL'>('ALL');
 const [screen,setScreen]=useState<Screen>('MATCHES');
 const [range,setRange]=useState<Range>('7');
 const [search,setSearch]=useState('');
 const [visibleCount,setVisibleCount]=useState(12);
 const [expanded,setExpanded]=useState<string|null>(null);
 const [asof]=useState(()=>new Date().toISOString());
 const today=asof.slice(0,10);
 async function refresh(){
   setLoading(true);setLiveError(null);
   const scorecardTask=(async()=>{
     try{
       const r=await fetch('/api/soccer-forward-scorecard',{cache:'no-store'});
       if(!r.ok)throw Error('Scorecard API unavailable');
       const d=await r.json() as Forward;
       if(d.schema!=='soccer-forward-scorecard-v1'||!Number.isInteger(d.originallyFrozen)||
          d.graded>d.originallyFrozen||d.gradedTeamScores!==2*d.graded)
         throw Error('Invalid scorecard contract');
       setForward(d);
     }catch{setForward(null);}
   })();
   try{
     const r=await fetch('/api/soccer-research',{cache:'no-store'});
     if(!r.ok)throw Error('Live feed HTTP '+r.status);
     const data:unknown=await r.json();
     if(!valid(data))throw Error('Unverified soccer research contract');
     setDoc(data);
   }catch(e){setLiveError(e instanceof Error?e.message:'Live source unreachable');}
   finally{setLoading(false);}
   void scorecardTask;
 }
 useEffect(()=>{void refresh();},[]);
 const saved=frozenSoccerBoard(asof);
 const all=new Map<string,Card>();
 for(const item of saved)all.set(key(item.forecast),{id:item.id,forecast:item.forecast,origin:'FROZEN'});
 for(const f of doc?.forecasts??[])if(f.date>=today&&!all.has(key(f)))
   all.set(key(f),{id:key(f),forecast:f,origin:'LIVE'});
 const allGames=[...all.values()].sort((a,b)=>a.forecast.date.localeCompare(b.forecast.date)||
   a.forecast.league.localeCompare(b.forecast.league)||
   a.forecast.home.localeCompare(b.forecast.home));
 const normalized=search.trim().toLocaleLowerCase();
 const cutoff=range==='ALL'?null:futureDay(today,Number(range));
 const filtered=allGames.filter(x=>{
   const f=x.forecast;
   return (league==='ALL'||league===f.league)&&
     (!cutoff||f.date<cutoff)&&
     (!normalized||[f.home,f.away,short[f.league]].some(t=>t.toLocaleLowerCase().includes(normalized)));
 });
 const visible=filtered.slice(0,visibleCount);
 const days=new Map<string,Card[]>();
 for(const card of visible){
   const day=card.forecast.date;
   days.set(day,[...(days.get(day)??[]),card]);
 }
 const audit=doc?.historical_audit;
 const changeLeague=(l:League|'ALL')=>{setLeague(l);setVisibleCount(12);setExpanded(null);};
 const changeRange=(r:Range)=>{setRange(r);setVisibleCount(12);setExpanded(null);};
 return <div id="soccer-projections-screen" className="h-full min-w-0 overflow-y-auto bg-[#0b1215] px-4 pb-24 pt-4 text-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
   <header className="mb-4 flex items-center justify-between gap-2">
     <div>
       <div className="text-[10px] font-bold uppercase tracking-[.17em] text-[#79FF48]">Prop Edge / Soccer</div>
       <h1 className="mt-0.5 text-[25px] font-black tracking-tight text-white">Match center</h1>
     </div>
     <button type="button" aria-label="Refresh soccer projections" onClick={()=>void refresh()} disabled={loading}
       className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-[#1c272a] text-[#79FF48] disabled:opacity-50">
       <RefreshCw size={19} className={loading?'animate-spin':''}/>
     </button>
   </header>
   <div role="tablist" aria-label="Soccer dashboard sections" className="mb-5 grid grid-cols-3 gap-1 rounded-[16px] bg-[#182226] p-1">
     {([['MATCHES','Matches',CalendarDays],['PLAYERS','Players',Users],['PERFORMANCE','Record',ChartNoAxesCombined]] as const).map(([id,label,Icon])=>
       <button key={id} type="button" role="tab" aria-selected={screen===id} onClick={()=>setScreen(id)}
         className={'flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-[12px] px-1 text-[12px] font-bold transition-colors '+
           (screen===id?'bg-[#79FF48] text-[#101b13] shadow-sm':'text-slate-400 active:bg-white/[.06]')}>
         <Icon size={15}/>{label}
       </button>)}
   </div>
   {screen==='MATCHES'&&<>
     <div className="mb-4 flex items-center justify-between rounded-[18px] border border-white/[.08] bg-gradient-to-r from-[#1c3028] to-[#162329] px-4 py-3">
       <div>
         <div className="text-[11px] text-slate-300">Upcoming model forecasts</div>
         <div className="mt-1 text-[28px] font-black leading-none tabular-nums text-white">{allGames.length}</div>
       </div>
       <div className="text-right">
         <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[#79FF48]">
           <Activity size={14}/> Team goals
         </div>
         <div className="mt-1 text-[10px] text-slate-400">Research · 5 leagues</div>
       </div>
     </div>
     <div className="mb-3 flex items-center gap-2 rounded-[14px] border border-white/10 bg-[#182226] px-3">
       <Search size={17} className="shrink-0 text-slate-400"/>
       <input type="search" aria-label="Find soccer team or league" value={search}
         onChange={e=>{setSearch(e.target.value);setVisibleCount(12);setExpanded(null);}}
         placeholder="Search team or league" className="h-12 min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-slate-500"/>
       <SlidersHorizontal size={16} className="shrink-0 text-slate-500"/>
     </div>
     <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group" aria-label="Filter soccer league">
       {(['ALL',...leagues] as (League|'ALL')[]).map(l=>
         <button type="button" key={l} aria-pressed={league===l} onClick={()=>changeLeague(l)}
           className={'min-h-9 shrink-0 rounded-full border px-3 text-[11px] font-bold transition-colors '+
             (league===l?'border-[#79FF48] bg-[#79FF48] text-[#142115]':'border-white/10 bg-[#1b2529] text-slate-300')}>
           {l==='ALL'?'All leagues':short[l]}
         </button>)}
     </div>
     <div className="mb-4 flex items-center justify-between gap-2">
       <div className="flex gap-1.5" role="group" aria-label="Choose soccer date range">
         {([['7','7 days'],['14','14 days'],['ALL','All']] as const).map(([id,label])=>
           <button type="button" key={id} aria-pressed={range===id} onClick={()=>changeRange(id)}
             className={'min-h-9 rounded-[11px] px-3 text-[11px] font-bold '+
               (range===id?'bg-[#2c4136] text-[#79FF48]':'bg-[#172023] text-slate-400')}>
             {label}
           </button>)}
       </div>
       <span className="shrink-0 text-[11px] tabular-nums text-slate-400">{filtered.length} matches</span>
     </div>
     {liveError&&<div role="status" className="mb-4 rounded-xl border border-amber-500/20 bg-[#2c261a] px-3 py-2 text-[11px] leading-relaxed text-amber-100">
       Live refresh unavailable. {saved.length?'Showing saved original pregame forecasts instead.':'No saved upcoming forecasts available.'}
     </div>}
     <section aria-label="Soccer numerical match forecasts" data-testid="soccer-forecast-board" className="space-y-4">
       {Array.from(days.entries()).map(([day,items])=>
         <div key={day}>
           <div className="mb-2 flex items-center gap-2 px-1">
             <CalendarDays size={14} className="text-[#79FF48]"/>
             <h2 className="text-[12px] font-extrabold text-slate-200">{formatDay(day)}</h2>
             <div className="h-px min-w-0 flex-1 bg-white/10"/>
             <span className="text-[10px] text-slate-500">{items.length} shown</span>
           </div>
           <div className="space-y-2.5">{items.map(card=>
             <MatchRow key={card.id} card={card} expanded={expanded===card.id}
               onToggle={()=>setExpanded(x=>x===card.id?null:card.id)}/>
           )}</div>
         </div>)}
       {filtered.length>visibleCount&&<button type="button" onClick={()=>setVisibleCount(x=>x+12)}
         className="min-h-12 w-full rounded-[16px] border border-[#79FF48]/20 bg-[#1b2d25] text-[13px] font-bold text-[#79FF48]">
         Show 12 more matches <span className="font-medium text-slate-400">({filtered.length-visibleCount} remaining)</span>
       </button>}
       {!filtered.length&&<div className="rounded-[18px] border border-white/10 bg-[#182327] px-4 py-7 text-center">
         <CalendarDays size={24} className="mx-auto mb-2 text-slate-400"/>
         <h2 className="text-sm font-bold">{loading?'Loading match forecasts…':'No matching forecasts'}</h2>
         <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
           {allGames.length?'Try a longer date range, another league, or a different team search.':
             'No verified pregame match projections are available yet. We will not invent them.'}
         </p>
         {allGames.length>0&&<button type="button" onClick={()=>{setSearch('');changeLeague('ALL');changeRange('ALL');}}
            className="mt-3 min-h-10 rounded-xl bg-[#79FF48] px-4 text-xs font-bold text-[#142115]">Reset filters</button>}
       </div>}
     </section>
     <p className="mt-4 px-1 text-[10px] leading-relaxed text-slate-500">
       Goal means are research estimates, not exact score picks or tracked xG.
       Source dates are supplied without verified kickoff times. Match probabilities are not betting-calibrated.
     </p>
   </>}
   {screen==='PLAYERS'&&<section data-testid="soccer-player-forecast-status" className="space-y-3">
     <div className="rounded-[20px] border border-white/10 bg-[#182327] p-5">
       <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#24372e] text-[#79FF48]"><Users size={24}/></div>
       <h2 className="text-[20px] font-black text-white">Player projections</h2>
       <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
         The player-minutes, shots and shots-on-target model is built, but its authorized player statistics and lineup feed
         has not been verified as connected to this frontend.
       </p>
       <div className="mt-4 rounded-[14px] border border-amber-500/20 bg-[#302719] px-3 py-3">
         <p className="text-[11px] font-bold text-amber-200">Waiting for real player data</p>
         <p className="mt-1 text-[11px] leading-relaxed text-amber-100/80">
           No fabricated projections. Player minutes, injuries and starting status must be sourced and checked before publication.
         </p>
       </div>
     </div>
   </section>}
   {screen==='PERFORMANCE'&&<section data-testid="soccer-forward-scorecard" className="space-y-3">
     <div className="rounded-[20px] border border-white/10 bg-[#182327] p-4">
       <h2 className="text-[17px] font-black text-white">Real pregame accuracy</h2>
       <p className="mt-1 text-[11px] text-slate-400">Only forecasts saved before their match day.</p>
       {forward?<div className="mt-4">
         <div className="grid grid-cols-3 gap-2 text-center">
           {([['Frozen',forward.originallyFrozen],['Graded',forward.graded],['Pending',forward.ungraded]] as const).map(([label,value])=>
             <div key={label} className="rounded-[13px] bg-black/20 px-2 py-3">
               <strong className="text-[19px] tabular-nums text-white">{value}</strong>
               <p className="text-[10px] text-slate-400">{label}</p>
             </div>)}
         </div>
         {forward.graded>0?<div className="mt-3 space-y-1 text-[12px] text-slate-300">
           <p>Model goal MAE: <strong>{forward.modelGoalMAE?.toFixed(3)}</strong></p>
           <p>Within 1 goal: <strong>{forward.withinOneGoalRate==null?'–':pct(forward.withinOneGoalRate)}</strong></p>
           <p>Baseline MAE: <strong>{forward.baselineGoalMAE?.toFixed(3)}</strong></p>
         </div>:<p className="mt-3 text-[12px] text-amber-200">No verified final scores graded yet. No earned hit-rate claim.</p>}
       </div>:<p className="mt-3 text-[12px] text-slate-400">Forward scorecard API unavailable. This is not an accuracy result.</p>}
     </div>
     <div className="rounded-[20px] border border-white/10 bg-[#182327] p-4">
       <h2 className="text-[15px] font-bold">Historical model research</h2>
       {audit?<div data-testid="soccer-projection-accuracy" className="mt-3 space-y-2 text-[12px] text-slate-300">
         <p>{audit.overall.n} retrospectively reconstructed matches.</p>
         <p>Actual goal projection MAE: {audit.overall.goalProjections?.meanAbsoluteError?.toFixed(3)??'–'}</p>
         <p>League baseline MAE: {audit.overall.goalProjections?.baselineMeanAbsoluteError?.toFixed(3)??'–'}</p>
         <p>Within ±1 goal: {audit.overall.goalProjections?.withinOneActualGoalRate==null?'–':pct(audit.overall.goalProjections.withinOneActualGoalRate)}</p>
         <p>3-way Brier: {audit.overall.brier?.toFixed(3)??'–'} · baseline {audit.overall.baselineBrier?.toFixed(3)??'–'}</p>
         <p className="text-amber-200">Reconstructed historical results; not validated live betting performance.</p>
       </div>:<p className="mt-3 text-[12px] text-slate-400">Historical comparison not available on this deployment.</p>}
     </div>
   </section>}
 </div>;
}
