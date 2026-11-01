import React,{useEffect,useState} from 'react';
import {RefreshCw,Search,SlidersHorizontal,ChevronDown,ChevronUp,CalendarDays} from 'lucide-react';
import type {Forecast,League} from '../soccer/model';
import {SOCCER_SCHEMA,LEAGUES} from '../soccer/model';
import {frozenSoccerBoard} from '../soccer/frozenBoardAssets';
import {rankSoccerProjections,bestSoccerEvent} from '../soccer/topRanked';
import {namedSoccerOutcomes} from '../soccer/matchLabels';
import {savedEspnPlayerBoard} from '../soccer/espnBoardAssets';
import {usableEspnPlayerBoard} from '../soccer/espnPlayerBoard';

type Doc={schema:string;status:string;asof_calendar_day_utc:string;
 forecast_count:number;forecasts:Forecast[];
 guardrails:{official_bets:number;calibrated:boolean;verified_live_book_lines:number;player_prop_predictions:number}};
type Card={id:string;forecast:Forecast;origin:'FROZEN'|'LIVE'};
type Section='TOP'|'MATCHES'|'PLAYERS';
type PlayerCard={
 id:string;playerId:string;playerName:string;teamName:string;opponent:string;
 fixtureDate:string;source:'AUTHORIZED_PLAYER_MATCH_LOG'|'ESPN_COMPLETED_MATCH_ROSTERS';
 forecast:{
  predictedShots:number;predictedShotsOnTarget:number;predictedMinutes:number;
  shotsReachCount:number;sotReachCount:number;
  pReachProjectedShots:number;pReachProjectedSot:number;
  lineupState:'CONFIRMED_STARTER'|'CONFIRMED_BENCH'|'UNKNOWN';
  status:'RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS';
 };
};
type PlayerBoard={schema:'soccer-player-board-v1';status:string;
 items:PlayerCard[];officialPicks:0;calibrated:false};
function validPlayerBoard(x:unknown):x is PlayerBoard {
 const d=x as PlayerBoard;
 return !!d&&d.schema==='soccer-player-board-v1'&&Array.isArray(d.items)&&
   d.officialPicks===0&&d.calibrated===false&&d.items.length<=1&&
   d.items.every(p=>p.source==='AUTHORIZED_PLAYER_MATCH_LOG'&&
     p.forecast?.status==='RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS'&&
     [p.forecast.predictedMinutes,p.forecast.predictedShots,p.forecast.predictedShotsOnTarget,
       p.forecast.pReachProjectedShots,p.forecast.pReachProjectedSot].every(n=>
         typeof n==='number'&&Number.isFinite(n)&&n>=0)&&
     p.forecast.pReachProjectedShots<=1&&p.forecast.pReachProjectedSot<=1&&
     p.forecast.shotsReachCount===Math.max(1,Math.ceil(p.forecast.predictedShots))&&
     p.forecast.sotReachCount===Math.max(1,Math.ceil(p.forecast.predictedShotsOnTarget)));
}
type Range='7'|'14'|'ALL';
const leagues:League[]=['EPL','LaLiga','SerieA','Bundesliga','Ligue1'];
const leagueNames:Record<League,string>={EPL:'Premier League',LaLiga:'La Liga',
 SerieA:'Serie A',Bundesliga:'Bundesliga',Ligue1:'Ligue 1'};
const pct=(value:number)=>(value*100).toFixed(1)+'%';
const key=(f:Forecast)=>[f.league,f.season,f.date,f.home,f.away].join('|');
const nextDay=(date:string,n:number)=>
 new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
function dateLabel(date:string){
 return new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',
  timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
}
function valid(d:unknown):d is Doc{
 const x=d as Doc;
 return !!x&&x.schema===SOCCER_SCHEMA&&x.status==='RESEARCH_ONLY_NOT_CALIBRATED_NOT_BETTABLE'&&
  Array.isArray(x.forecasts)&&x.forecast_count===x.forecasts.length&&
  x.guardrails?.official_bets===0&&x.guardrails?.calibrated===false&&
  x.guardrails?.verified_live_book_lines===0&&x.guardrails?.player_prop_predictions===0&&
  x.forecasts.every(f=>leagues.includes(f.league)&&
   f.status==='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'&&
   f.date>=x.asof_calendar_day_utc&&Number.isFinite(f.expectedHomeGoals)&&
   Number.isFinite(f.expectedAwayGoals)&&
   [f.probabilities.home,f.probabilities.draw,f.probabilities.away,
    f.probabilities.over25,f.probabilities.btts].every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&
   Math.abs(f.probabilities.home+f.probabilities.draw+f.probabilities.away-1)<.0003);
}
function ModelChanceRow({label,value}:{label:string;value:number}){
 return <div className="flex items-center justify-between gap-3 border-b border-white/[.06] py-2.5 last:border-b-0">
  <span className="min-w-0 flex-1 break-words text-[12px] font-medium leading-snug text-slate-200">{label}</span>
  <span className="shrink-0 text-[14px] font-extrabold tabular-nums text-white">{pct(value)}</span>
 </div>;
}
function GameCard({card,expanded,onToggle}:{card:Card;expanded:boolean;onToggle:()=>void}){
 const f=card.forecast;
 const best=bestSoccerEvent(f);
 const detailsId='soccer-details-'+card.id.replace(/[^a-z0-9]/ig,'-');
 return <article data-testid="soccer-match-row" className="overflow-hidden rounded-[17px] border border-white/10 bg-[#192226]">
  <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={detailsId}
    className="w-full px-4 py-4 text-left active:bg-white/[.04]">
   <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
    <span className="truncate">{leagueNames[f.league]} · {dateLabel(f.date)}</span>
    <span className="shrink-0">{card.origin==='FROZEN'?'Saved pregame':'Live research'}</span>
   </div>
   <div className="mt-3 flex items-start justify-between gap-3">
    <div className="min-w-0 flex-1">
      <p className="break-words text-[14px] font-bold leading-snug text-white">{f.home}</p>
      <p className="my-1 text-[11px] text-slate-500">vs</p>
      <p className="break-words text-[14px] font-bold leading-snug text-white">{f.away}</p>
    </div>
    <div className="shrink-0 text-right">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Projected goals</p>
      <p className="mt-1 text-[18px] font-black tabular-nums leading-snug text-[#79FF48]">{f.expectedHomeGoals.toFixed(2)}</p>
      <p className="mt-4 text-[18px] font-black tabular-nums leading-snug text-[#79FF48]">{f.expectedAwayGoals.toFixed(2)}</p>
    </div>
   </div>
   <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-white/[.08] pt-3">
    <span className="min-w-0 flex-1 break-words text-[12px] font-semibold text-slate-200">
      Top model event: <span className="text-[#bafaac]">{best.label} · {pct(best.modelProbability)}</span>
    </span>
    <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#79FF48]">{expanded?'Less':'More'}{expanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</span>
   </div>
  </button>
  {expanded&&<div id={detailsId} data-testid="soccer-match-details" className="border-t border-white/10 bg-[#121b1e] px-4 py-2">
    {namedSoccerOutcomes(f).map(outcome=><ModelChanceRow key={outcome.key}
      label={outcome.label} value={outcome.probability}/>)}
    <ModelChanceRow label="Both teams to score" value={f.probabilities.btts}/>
    <ModelChanceRow label="3 or more total goals" value={f.probabilities.over25}/>
    <p className="pb-2 pt-1 text-[10px] leading-relaxed text-slate-400">Research estimates · Not prospectively calibrated. Match kickoff and starting lineups are not verified.</p>
  </div>}
 </article>;
}
export default function SoccerTodayScreen(){
 const [doc,setDoc]=useState<Doc|null>(null);
 const [liveError,setLiveError]=useState(false);
 const [loading,setLoading]=useState(false);
 const [players,setPlayers]=useState<PlayerCard[]>([]);
 const [playerFeedReady,setPlayerFeedReady]=useState(false);
 const [playerLimit,setPlayerLimit]=useState(20);
 const [section,setSection]=useState<Section>('TOP');
 const [showFilters,setShowFilters]=useState(false);
 const [league,setLeague]=useState<League|'ALL'>('ALL');
 const [range,setRange]=useState<Range>('7');
 const [search,setSearch]=useState('');
 const [topLimit,setTopLimit]=useState(8);
 const [matchLimit,setMatchLimit]=useState(12);
 const [expanded,setExpanded]=useState<string|null>(null);
 const [asof,setAsof]=useState(()=>new Date().toISOString());
 const today=asof.slice(0,10);
 async function refresh(){
  setLoading(true);setLiveError(false);
  const playerLoad=(async()=>{
    // Automatic ESPN first-seen forecast archive needs no paid API key.
    // Prefer the current server snapshot, retain a static AI Studio fallback.
    let early=savedEspnPlayerBoard(new Date().toISOString());
    try{
      const r=await fetch('/api/soccer-player-espn-board',{cache:'no-store'});
      if(r.ok){
        const raw:unknown=await r.json();
        const live=usableEspnPlayerBoard(raw,new Date().toISOString());
        if(live.length)early=live;
      }
    }catch{/* Preserve the authentic bundled archive. */}
    if(early.length){
      setPlayers(early.map(x=>({id:x.id,playerId:x.playerId,
        playerName:x.playerName,teamName:x.teamName,opponent:x.opponent,
        fixtureDate:x.fixtureDate,source:'ESPN_COMPLETED_MATCH_ROSTERS',
        forecast:x.forecast})));
      setPlayerFeedReady(true);return;
    }
    // Optional older paid pilot remains a fallback, not a dependency.
    try{
      const r=await fetch('/api/soccer-player-board',{cache:'no-store'});
      if(!r.ok)throw Error('Paid pilot disconnected');
      const body:unknown=await r.json();
      if(!validPlayerBoard(body))throw Error('Unverified paid research');
      setPlayerFeedReady(body.status==='RESEARCH_PLAYER_FORECASTS');
      setPlayers(body.items);
    }catch{setPlayers([]);setPlayerFeedReady(false);}
  })();
  try{
   const r=await fetch('/api/soccer-research',{cache:'no-store'});
   if(!r.ok)throw Error('Live source unavailable');
   const data:unknown=await r.json();
   if(!valid(data))throw Error('Source contract invalid');
   setDoc(data);
  }catch{setLiveError(true);}
  finally{setLoading(false);setAsof(new Date().toISOString());}
  await playerLoad;
 }
 useEffect(()=>{void refresh();},[]);
 const saved=frozenSoccerBoard(asof);
 const all=new Map<string,Card>();
 for(const o of saved)all.set(key(o.forecast),{id:o.id,forecast:o.forecast,origin:'FROZEN'});
 for(const f of doc?.forecasts??[])if(f.date>=today&&!all.has(key(f)))
  all.set(key(f),{id:key(f),forecast:f,origin:'LIVE'});
 const allGames=[...all.values()];
 const cutoff=range==='ALL'?null:nextDay(today,Number(range));
 const q=search.trim().toLocaleLowerCase();
 const filtered=allGames.filter(({forecast:f})=>
  (league==='ALL'||f.league===league)&&
  (!cutoff||f.date<cutoff)&&
  (!q||[f.home,f.away,leagueNames[f.league]].some(x=>x.toLocaleLowerCase().includes(q))));
 const top=rankSoccerProjections(filtered.map(x=>({
  id:x.id,forecast:x.forecast,source:x.origin
 })));
 const orderedGames=[...filtered].sort((a,b)=>a.forecast.date.localeCompare(b.forecast.date)||
  a.forecast.league.localeCompare(b.forecast.league)||a.id.localeCompare(b.id));
 const resetLimits=()=>{setTopLimit(8);setMatchLimit(12);setExpanded(null);};
 const empty=filtered.length===0;
 return <div id="soccer-projections-screen" className="h-full min-w-0 overflow-y-auto bg-[#0b1215] px-4 pb-24 pt-4 text-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  <div className="mb-4 flex items-center justify-between gap-2">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#79FF48]">Soccer · Model forecasts</p>
      <h1 className="mt-1 text-[24px] font-black tracking-tight text-white">Best chances</h1>
    </div>
    <button type="button" aria-label="Refresh soccer forecasts" onClick={()=>void refresh()} disabled={loading}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#1c272a] text-[#79FF48] disabled:opacity-50">
      <RefreshCw size={19} className={loading?'animate-spin':''}/>
    </button>
  </div>
  <div role="tablist" aria-label="Soccer views" className="mb-3 grid grid-cols-3 gap-1 rounded-[14px] bg-[#1a2528] p-1">
    <button type="button" role="tab" aria-selected={section==='TOP'} onClick={()=>{setSection('TOP');setExpanded(null);}}
      className={'min-h-11 rounded-[11px] text-[13px] font-bold '+(section==='TOP'?'bg-[#79FF48] text-[#142014]':'text-slate-300')}>
      Top projections
    </button>
    <button type="button" role="tab" aria-selected={section==='PLAYERS'} onClick={()=>{setSection('PLAYERS');setExpanded(null);}}
      className={'min-h-11 rounded-[11px] px-1 text-[12px] font-bold '+(section==='PLAYERS'?'bg-[#79FF48] text-[#142014]':'text-slate-300')}>
      Player props
    </button>
    <button type="button" role="tab" aria-selected={section==='MATCHES'} onClick={()=>{setSection('MATCHES');setExpanded(null);}}
      className={'min-h-11 rounded-[11px] px-1 text-[12px] font-bold '+(section==='MATCHES'?'bg-[#79FF48] text-[#142014]':'text-slate-300')}>
      All matches
    </button>
  </div>
  <div className="mb-3 flex items-center justify-between gap-3">
   <p className="min-w-0 text-[11px] leading-relaxed text-slate-400">
     {section==='TOP'?'Highest model-estimated chance for each match':
       section==='PLAYERS'?'Actual player forecasts, when verified data is connected':'Browse every upcoming match'}
   </p>
   {section!=='PLAYERS'&&<button type="button" aria-expanded={showFilters} onClick={()=>setShowFilters(x=>!x)}
     className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1b2529] px-3 text-[11px] font-semibold text-white">
     <SlidersHorizontal size={14}/> Filters {showFilters?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
   </button>}
  </div>
  {showFilters&&section!=='PLAYERS'&&<div className="mb-4 space-y-3 rounded-[16px] border border-white/10 bg-[#172125] p-3">
    <label className="block text-[11px] font-semibold text-slate-300">Find a team or league
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/20 px-3">
        <Search size={16} className="text-slate-400"/>
        <input type="search" aria-label="Find soccer team or league" placeholder="Search…" value={search}
          onChange={e=>{setSearch(e.target.value);resetLimits();}}
          className="h-10 min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none"/>
      </div>
    </label>
    <div>
      <p className="mb-2 text-[11px] font-semibold text-slate-300">Date range</p>
      <div className="flex gap-2">{([['7','7 days'],['14','14 days'],['ALL','All dates']] as const).map(([id,label])=>
        <button key={id} type="button" aria-pressed={range===id} onClick={()=>{setRange(id);resetLimits();}}
         className={'min-h-9 rounded-lg px-3 text-[11px] font-semibold '+(range===id?'bg-[#79FF48] text-[#122016]':'bg-white/5 text-slate-300')}>{label}</button>)}
      </div>
    </div>
    <div>
      <p className="mb-2 text-[11px] font-semibold text-slate-300">League</p>
      <div className="flex flex-wrap gap-2">{(['ALL',...leagues] as (League|'ALL')[]).map(l=>
        <button key={l} type="button" aria-pressed={league===l} onClick={()=>{setLeague(l);resetLimits();}}
          className={'min-h-9 rounded-lg px-3 text-[11px] font-semibold '+(league===l?'bg-[#79FF48] text-[#122016]':'bg-white/5 text-slate-300')}>
          {l==='ALL'?'All leagues':leagueNames[l]}
        </button>)}
      </div>
    </div>
  </div>}
  {section==='TOP'&&<section data-testid="soccer-top-board" className="space-y-2.5">
    {top.slice(0,topLimit).map((item,i)=>{
      const f=item.forecast;
      return <article key={item.id} data-testid="soccer-top-card" className="rounded-[16px] border border-white/[.09] bg-[#192326] p-4">
       <div className="flex items-center justify-between gap-2">
         <span className="min-w-0 truncate text-[10px] text-slate-400">{i+1}. {leagueNames[f.league]} · {dateLabel(f.date)}</span>
         <span className="shrink-0 text-[10px] text-slate-400">{item.source==='FROZEN'?'Saved pregame':'Live research'}</span>
       </div>
       <p className="mt-2 break-words text-[12px] font-semibold text-slate-300">{f.home} <span className="font-normal text-slate-500">vs</span> {f.away}</p>
       <div className="mt-3 flex items-center justify-between gap-3">
         <div className="min-w-0 flex-1">
           <p className="break-words text-[16px] font-extrabold leading-snug text-white">{item.label}</p>
         </div>
         <strong className="shrink-0 text-[26px] font-black tabular-nums tracking-tight text-[#79FF48]">{pct(item.modelProbability)}</strong>
       </div>
      </article>;
    })}
    {top.length>topLimit&&<button type="button" onClick={()=>setTopLimit(n=>n+8)}
      className="min-h-11 w-full rounded-xl bg-[#23362c] text-[12px] font-bold text-[#79FF48]">Show more top projections ({top.length-topLimit} remaining)</button>}
  </section>}
  {section==='PLAYERS'&&<section data-testid="soccer-player-props-board" className="space-y-2.5">
    <p className="text-[11px] text-slate-400">Early player projections from verified completed-match shots and playing-time history. Lineups and injuries remain unverified.</p>
    {players.filter(p=>p.fixtureDate>=today).sort((a,b)=>
      Math.max(b.forecast.pReachProjectedShots,b.forecast.pReachProjectedSot)-
      Math.max(a.forecast.pReachProjectedShots,a.forecast.pReachProjectedSot))
      .slice(0,playerLimit).map(p=>
      <article data-testid="soccer-player-prop-card" key={p.id}
        className="rounded-[16px] border border-white/10 bg-[#192326] p-4">
        <p className="text-[11px] text-slate-400">{p.teamName} vs {p.opponent} · {dateLabel(p.fixtureDate)}</p>
        <h2 className="mt-2 text-[17px] font-black text-white">{p.playerName}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#112018] p-3">
            <p className="text-[11px] text-slate-300">Projected shots</p>
            <strong className="mt-1 block text-[24px] font-black tabular-nums text-[#79FF48]">{p.forecast.predictedShots.toFixed(1)}</strong>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
              {pct(p.forecast.pReachProjectedShots)} chance of {p.forecast.shotsReachCount}+ shots
            </p>
          </div>
          <div className="rounded-xl bg-[#112018] p-3">
            <p className="text-[11px] text-slate-300">Shots on target</p>
            <strong className="mt-1 block text-[24px] font-black tabular-nums text-[#79FF48]">{p.forecast.predictedShotsOnTarget.toFixed(1)}</strong>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
              {pct(p.forecast.pReachProjectedSot)} chance of {p.forecast.sotReachCount}+ on target
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          Projected playing time: {p.forecast.predictedMinutes.toFixed(0)} minutes ·
          Starting lineup: {p.forecast.lineupState==='CONFIRMED_STARTER'?'confirmed starter':
            p.forecast.lineupState==='CONFIRMED_BENCH'?'confirmed bench':'not confirmed'}
        </p>
        <p className="mt-2 text-[10px] text-amber-200">{p.source==='ESPN_COMPLETED_MATCH_ROSTERS'?'ESPN historical stats · Early pregame':'Authorized match history'} · Uncalibrated, not a verified betting pick</p>
      </article>)}
    {players.filter(p=>p.fixtureDate>=today).length>playerLimit&&
      <button type="button" onClick={()=>setPlayerLimit(n=>n+20)}
        className="min-h-11 w-full rounded-xl bg-[#23362c] text-[12px] font-bold text-[#79FF48]">
        Show more player projections ({players.filter(p=>p.fixtureDate>=today).length-playerLimit} remaining)
      </button>}
    {(!playerFeedReady||players.filter(p=>p.fixtureDate>=today).length===0)&&
      <div className="rounded-[16px] border border-white/10 bg-[#192326] px-4 py-6">
        <p className="text-[16px] font-bold text-white">Player forecasts aren't connected yet</p>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
          The free soccer data pipeline is collecting real player minutes,
          shots and shots on target from completed games. Early forecasts will
          appear when enough eligible historical games are available.
          No player picks are being invented.
        </p>
      </div>}
   </section>}
  {section==='MATCHES'&&<section data-testid="soccer-forecast-board" className="space-y-2.5">
    {orderedGames.slice(0,matchLimit).map(card=><GameCard key={card.id} card={card}
      expanded={expanded===card.id} onToggle={()=>setExpanded(x=>x===card.id?null:card.id)}/>)}
    {orderedGames.length>matchLimit&&<button type="button" onClick={()=>setMatchLimit(n=>n+12)}
      className="min-h-11 w-full rounded-xl bg-[#23362c] text-[12px] font-bold text-[#79FF48]">Show 12 more matches ({orderedGames.length-matchLimit} remaining)</button>}
  </section>}
  {empty&&section!=='PLAYERS'&&<div className="mt-3 rounded-xl border border-white/10 bg-[#1a2428] p-5">
    <p className="text-[13px] font-semibold">{loading?'Loading matches…':'No available projections for these filters'}</p>
    <p className="mt-1 text-[12px] text-slate-400">Choose a longer date range or another league. The model will not invent missing forecasts.</p>
    <button type="button" onClick={()=>{setRange('ALL');setLeague('ALL');setSearch('');resetLimits();}}
      className="mt-3 min-h-10 rounded-lg bg-[#79FF48] px-4 text-xs font-bold text-[#0c1911]">Reset filters</button>
  </div>}
  {liveError&&saved.length===0&&<p role="status" className="mt-3 text-[11px] text-amber-200">Live data isn't available. No upcoming saved forecasts were found.</p>}
  {section!=='PLAYERS'&&<p className="mt-4 text-[10px] leading-relaxed text-slate-500">
    Ranked within five fixed match events. These are uncalibrated model estimates,
    not proven hit rates, official picks, or evidence of betting value.
  </p>}
 </div>;
}
