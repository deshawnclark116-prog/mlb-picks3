import React,{useEffect,useState} from 'react';
import {RefreshCw,Search,SlidersHorizontal,ChevronDown,ChevronUp} from 'lucide-react';
import type {Forecast,League} from '../soccer/model';
import {SOCCER_SCHEMA} from '../soccer/model';
import {frozenSoccerBoard} from '../soccer/frozenBoardAssets';
import {verifiedSoccerFixtures} from '../soccer/espnFixtureAssets';
import {bestSoccerEvent} from '../soccer/topRanked';
import {namedSoccerOutcomes} from '../soccer/matchLabels';
import {usableEspnPlayerBoard} from '../soccer/espnPlayerBoard';
import {soccerPlayerWindow} from '../soccer/playerDisplayWindow';
import {groupSoccerGameProjections,type GameMatch,type GamePlayer,
 type SoccerGameGroup} from '../soccer/gameBoard';

type MatchDoc={schema:string;status:string;asof_calendar_day_utc:string;
 forecast_count:number;forecasts:Forecast[];guardrails:{
  official_bets:number;calibrated:boolean;verified_live_book_lines:number;
  player_prop_predictions:number}};
type Range='48H'|'7D'|'ALL';
const leagues:League[]=['EPL','LaLiga','SerieA','Bundesliga','Ligue1'];
const leagueNames:Record<League,string>={EPL:'Premier League',LaLiga:'La Liga',
 SerieA:'Serie A',Bundesliga:'Bundesliga',Ligue1:'Ligue 1'};
const pct=(x:number)=>(x*100).toFixed(1)+'%';
const nextDay=(d:string,n:number)=>new Date(Date.parse(d+'T00:00:00Z')+
 n*86400000).toISOString().slice(0,10);
const matchId=(f:Forecast)=>[f.league,f.season,f.date,f.home,f.away].join('|');
const dateLabel=(s:string)=>new Intl.DateTimeFormat('en-US',{
 weekday:'short',month:'short',day:'numeric',timeZone:'UTC'
}).format(new Date(s+'T12:00:00Z'));
const kickoffLabel=(s:string)=>new Intl.DateTimeFormat('en-US',{
 weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',
 timeZone:'America/New_York',timeZoneName:'short'
}).format(new Date(s));
function validMatches(d:unknown):d is MatchDoc {
 const x=d as MatchDoc;
 return !!x&&x.schema===SOCCER_SCHEMA&&
  x.status==='RESEARCH_ONLY_NOT_CALIBRATED_NOT_BETTABLE'&&
  Array.isArray(x.forecasts)&&x.forecast_count===x.forecasts.length&&
  x.guardrails?.official_bets===0&&x.guardrails?.calibrated===false&&
  x.guardrails?.verified_live_book_lines===0&&x.guardrails?.player_prop_predictions===0&&
  x.forecasts.every(f=>leagues.includes(f.league)&&
   f.status==='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'&&
   f.date>=x.asof_calendar_day_utc&&Number.isFinite(f.expectedHomeGoals)&&
   Number.isFinite(f.expectedAwayGoals)&&
   [f.probabilities.home,f.probabilities.draw,f.probabilities.away,
    f.probabilities.over25,f.probabilities.btts].every(v=>
      Number.isFinite(v)&&v>=0&&v<=1)&&
   Math.abs(f.probabilities.home+f.probabilities.draw+f.probabilities.away-1)<.0003);
}
function OutcomeRow({label,probability}:{label:string;probability:number}){
 return <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[.06] py-2.5 last:border-b-0">
  <span className="min-w-0 break-words text-[12px] font-medium leading-snug text-slate-200">{label}</span>
  <strong className="shrink-0 text-[13px] font-extrabold tabular-nums text-white">{pct(probability)}</strong>
 </div>;
}
function PlayerRow({p}:{p:GamePlayer}){
 const f=p.forecast;
 return <article data-testid="soccer-game-player" className="rounded-xl border border-white/[.08] bg-[#1b2929] p-3">
  <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2">
   <p className="min-w-0 break-words text-[13px] font-bold text-white">{p.playerName}</p>
   <span className="text-[10px] text-slate-400">{p.teamName}</span>
  </div>
  <div className="mt-2 grid grid-cols-2 gap-2">
   <div className="rounded-lg bg-[#11211a] p-2.5">
    <p className="text-[10px] text-slate-300">Projected shots</p>
    <p className="text-[20px] font-black tabular-nums text-[#79FF48]">{f.predictedShots.toFixed(1)}</p>
    <p className="text-[11px] leading-snug text-slate-200">{pct(f.pReachProjectedShots)} for {f.shotsReachCount}+ shots</p>
   </div>
   <div className="rounded-lg bg-[#11211a] p-2.5">
    <p className="text-[10px] text-slate-300">Shots on target</p>
    <p className="text-[20px] font-black tabular-nums text-[#79FF48]">{f.predictedShotsOnTarget.toFixed(1)}</p>
    <p className="text-[11px] leading-snug text-slate-200">{pct(f.pReachProjectedSot)} for {f.sotReachCount}+ on target</p>
   </div>
  </div>
  <p className="mt-2 text-[11px] text-slate-400">
   Expected playing time: {f.predictedMinutes.toFixed(0)} minutes ·
   {p.currentEligibility==='STARTER_CONFIRMED'?' Confirmed to start':
    p.currentEligibility==='EARLY_ROSTER_ELIGIBLE'?
    ' Current squad checked · lineup unconfirmed':
    ' Current squad checked · injury and lineup status unverified'}
  </p>
 </article>;
}
function MatchCard({game,expanded,onToggle}:{
 game:SoccerGameGroup;expanded:boolean;onToggle:()=>void
}){
 const f=game.match?.forecast;
 const best=f?bestSoccerEvent(f):null;
 const count=(f?5:0)+game.players.length*3;
 const detailsId='soccer-game-'+game.id.replace(/[^a-z0-9]/ig,'-');
 return <article data-testid="soccer-game-card" className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#192427]">
  <button type="button" aria-expanded={expanded} aria-controls={detailsId}
   onClick={onToggle} className="w-full min-w-0 px-4 py-4 text-left active:bg-white/[.04]">
   <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
    <span className="min-w-0 truncate">{game.league?leagueNames[game.league]:'Soccer'}</span>
    <span className="shrink-0">{game.kickoffUtc?kickoffLabel(game.kickoffUtc):dateLabel(game.fixtureDate)+' · kickoff unverified'}</span>
   </div>
   <p className="mt-3 break-words text-[15px] font-extrabold leading-snug text-white">
    {game.home} <span className="font-normal text-slate-400">vs</span> {game.away}
   </p>
   {best?<div className="mt-2 flex min-w-0 items-start justify-between gap-2">
     <span className="min-w-0 break-words text-[12px] text-slate-300">{best.label}</span>
     <strong className="shrink-0 text-[16px] font-black tabular-nums text-[#79FF48]">{pct(best.modelProbability)}</strong>
   </div>:<p className="mt-2 text-[11px] text-slate-400">Player forecasts available · Match outcome model not available</p>}
   <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-white/[.08] pt-3">
    <span data-testid="soccer-game-projection-count" className="text-[11px] text-slate-300">
      {count} projections · {game.players.length} players
    </span>
    <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#79FF48]">
     {expanded?'Hide':'View all'} projections {expanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
    </span>
   </div>
  </button>
  {expanded&&<div id={detailsId} data-testid="soccer-game-details" className="space-y-4 border-t border-white/10 bg-[#11191b] px-4 py-4">
    {f?<section data-testid="soccer-game-outcomes">
      <h3 className="text-[13px] font-extrabold text-white">Match predictions</h3>
      <div className="mt-2 flex flex-wrap gap-3 rounded-lg bg-[#1b2a26] px-3 py-2 text-[12px]">
       <span className="text-slate-300">{f.home}: <strong className="text-white">{f.expectedHomeGoals.toFixed(2)} projected goals</strong></span>
       <span className="text-slate-300">{f.away}: <strong className="text-white">{f.expectedAwayGoals.toFixed(2)} projected goals</strong></span>
      </div>
      <div className="mt-1">{[
       ...namedSoccerOutcomes(f).map(o=>({label:o.label,probability:o.probability})),
       {label:'Both teams to score',probability:f.probabilities.btts},
       {label:'3 or more total goals',probability:f.probabilities.over25}
      ].sort((a,b)=>b.probability-a.probability).map(o=>
       <OutcomeRow key={o.label} label={o.label} probability={o.probability}/>)}</div>
    </section>:<p className="rounded-lg bg-white/[.04] px-3 py-2 text-[11px] text-slate-300">
      This game has no separately verified match-outcome forecast. Player forecasts are shown without inventing win or goal percentages.
    </p>}
    {game.players.length>0?<section data-testid="soccer-game-player-props">
      <h3 className="mb-2 text-[13px] font-extrabold text-white">Player projections ({game.players.length})</h3>
      <div className="space-y-2">
       {game.players.map(p=><PlayerRow key={p.id} p={p}/>)}
      </div>
     </section>:<p className="rounded-lg bg-white/[.04] px-3 py-2 text-[11px] text-slate-400">
      No eligible player-stat projections in the selected pregame window.
    </p>}
    <p className="text-[10px] leading-relaxed text-slate-500">
      All probabilities are uncalibrated model research, not demonstrated hit rates or official picks.
      Early player projections reflect a checked current squad, not a confirmed starting XI. No sportsbook line is required.
    </p>
  </div>}
 </article>;
}
export default function SoccerTodayScreen(){
 const [doc,setDoc]=useState<MatchDoc|null>(null);
 // Do not render archived player names before current eligibility has been checked.
 const [players,setPlayers]=useState<GamePlayer[]>([]);
 const [playerVerificationUnavailable,setPlayerVerificationUnavailable]=useState(false);
 const [loading,setLoading]=useState(false);
 const [range,setRange]=useState<Range>('48H');
 const [league,setLeague]=useState<League|'ALL'>('ALL');
 const [search,setSearch]=useState('');
 const [filters,setFilters]=useState(false);
 const [limit,setLimit]=useState(12);
 const [expanded,setExpanded]=useState<string|null>(null);
 const [asof,setAsof]=useState(()=>new Date().toISOString());
 const today=asof.slice(0,10);
 async function refresh(){
  setLoading(true);
  // Saved first-seen forecasts are RESEARCH ARCHIVE, not current availability.
  // Never fall back to raw archived player names when verification fails.
  setPlayers([]);
  const playerTask=(async()=>{
   try{
    const r=await fetch('/api/soccer-player-espn-board',{cache:'no-store'});
    if(!r.ok)throw Error('Live eligibility feed unavailable');
    const verified=usableEspnPlayerBoard(await r.json(),new Date().toISOString());
    setPlayers(verified.map(x=>({
     id:x.id,gameId:x.gameId,league:x.league,playerId:x.playerId,
     teamId:x.teamId,
     playerName:x.playerName,teamName:x.teamName,opponent:x.opponent,
     fixtureDate:x.fixtureDate,kickoffUtc:x.kickoffUtc,
     currentEligibility:x.currentEligibility,
     source:'ESPN_COMPLETED_MATCH_ROSTERS',forecast:x.forecast
    })));
    setPlayerVerificationUnavailable(verified.length===0);
   }catch{
    setPlayers([]);setPlayerVerificationUnavailable(true);
   }
  })();
  try{
   const r=await fetch('/api/soccer-research',{cache:'no-store'});
   const raw:unknown=await r.json();
   if(!r.ok||!validMatches(raw))throw Error('Invalid match feed');
   setDoc(raw);
  }catch{setDoc(null);}
  finally{setLoading(false);setAsof(new Date().toISOString());}
  await playerTask;
 }
 useEffect(()=>{void refresh();},[]);
 const archived=frozenSoccerBoard(asof);
 const matches=new Map<string,GameMatch>();
 for(const o of archived)matches.set(matchId(o.forecast),{
  id:o.id,forecast:o.forecast,origin:'FROZEN'});
 for(const f of doc?.forecasts??[]){
  if(f.date>=today&&!matches.has(matchId(f)))matches.set(matchId(f),{
   id:matchId(f),forecast:f,origin:'LIVE'});
 }
 const start=Date.parse(asof);
 const cutoff=range==='ALL'?null:start+(range==='48H'?48:168)*3600000;
 const maxDate=range==='ALL'?null:nextDay(today,range==='48H'?2:7);
 const dateMatches=[...matches.values()].filter(m=>
  m.forecast.date>=today&&(!maxDate||m.forecast.date<=maxDate));
 const eligiblePlayers=soccerPlayerWindow(players,asof,range==='48H'?'48H':'7D');
 const verifiedFixtures=verifiedSoccerFixtures(asof);
 const grouped=groupSoccerGameProjections(dateMatches,eligiblePlayers,asof,verifiedFixtures);
 const q=search.trim().toLowerCase();
 const filtered=grouped.filter(g=>
  (league==='ALL'||g.league===league)&&
  (!cutoff||!g.kickoffUtc||Date.parse(g.kickoffUtc)<=cutoff)&&
  (!q||[g.home,g.away,g.league?leagueNames[g.league]:'',...g.players.map(p=>p.playerName)]
    .some(s=>s.toLowerCase().includes(q))));
 const reset=()=>{setExpanded(null);setLimit(12);};
 return <div id="soccer-projections-screen"
   className="h-full min-h-0 min-w-0 overflow-y-auto overscroll-y-contain bg-[#0b1215] px-4 pb-24 pt-4 text-slate-100 [scrollbar-width:none]">
  <div className="mb-4 flex items-center justify-between gap-3">
   <div className="min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#79FF48]">Soccer · All available projections</p>
    <h1 className="mt-1 text-[24px] font-black tracking-tight text-white">Games</h1>
   </div>
   <button type="button" aria-label="Refresh soccer forecasts" onClick={()=>void refresh()} disabled={loading}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#1c272a] text-[#79FF48] disabled:opacity-50">
    <RefreshCw size={19} className={loading?'animate-spin':''}/>
   </button>
  </div>
  <div role="group" aria-label="Soccer game schedule range" className="mb-3 flex gap-1 rounded-xl bg-[#1a2528] p-1">
   {([['48H','Next 48 hours'],['7D','7 days'],['ALL','All matches']] as const)
    .map(([id,label])=><button key={id} type="button" aria-pressed={range===id}
     onClick={()=>{setRange(id);reset();}}
     className={'min-h-11 min-w-0 flex-1 rounded-lg px-1 text-[11px] font-bold '+
       (range===id?'bg-[#79FF48] text-[#122016]':'text-slate-300')}>
       {label}
    </button>)}
  </div>
  <div className="mb-3 flex items-center justify-between gap-3">
   <p className="text-[11px] text-slate-400">{filtered.length} upcoming games · Tap one to see every available projection</p>
   <button type="button" aria-expanded={filters} onClick={()=>setFilters(x=>!x)}
    className="flex min-h-10 shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-[#1b2529] px-3 text-[11px] font-bold">
    <SlidersHorizontal size={14}/> Filters {filters?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
   </button>
  </div>
  {filters&&<div className="mb-3 space-y-3 rounded-xl border border-white/10 bg-[#182225] p-3">
   <label className="block text-[11px] text-slate-300">Search teams or players
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/20 px-3">
     <Search size={15} className="text-slate-400"/>
     <input type="search" aria-label="Search soccer teams or players" value={search}
      onChange={e=>{setSearch(e.target.value);reset();}}
      placeholder="Team or player name" className="h-10 w-full min-w-0 bg-transparent text-[12px] text-white outline-none"/>
    </div>
   </label>
   <div className="flex flex-wrap gap-2">
    {(['ALL',...leagues] as (League|'ALL')[]).map(l=><button type="button" key={l}
     aria-pressed={league===l} onClick={()=>{setLeague(l);reset();}}
     className={'min-h-9 rounded-lg px-3 text-[11px] font-semibold '+
       (league===l?'bg-[#79FF48] text-[#122016]':'bg-white/5 text-slate-300')}>
      {l==='ALL'?'All leagues':leagueNames[l]}
    </button>)}
   </div>
  </div>}
  {playerVerificationUnavailable&&<p data-testid="soccer-player-eligibility-notice"
    className="mb-3 rounded-lg border border-white/10 bg-[#1a2528] p-3 text-[11px] text-slate-300">
    Player statistics are hidden where current squad, injury or starting-lineup
    eligibility cannot be verified. Match forecasts remain available.
   </p>}
  <section data-testid="soccer-games-board" className="space-y-2.5">
   {filtered.slice(0,limit).map(g=><MatchCard key={g.id} game={g}
    expanded={expanded===g.id} onToggle={()=>setExpanded(x=>x===g.id?null:g.id)}/>)}
   {filtered.length>limit&&<button type="button" onClick={()=>setLimit(n=>n+12)}
    className="min-h-11 w-full rounded-xl bg-[#23362c] text-[12px] font-bold text-[#79FF48]">
     Show 12 more games ({filtered.length-limit} remaining)
   </button>}
  </section>
  {filtered.length===0&&<div className="mt-3 rounded-xl border border-white/10 bg-[#192326] p-5">
   <p className="text-[13px] font-semibold">{loading?'Loading forecasts…':'No game forecasts in this window'}</p>
   <p className="mt-2 text-[12px] text-slate-400">Try seven days or reset filters. Games without reliable player or match data are not invented.</p>
   <button type="button" onClick={()=>{setRange('7D');setSearch('');setLeague('ALL');reset();}}
    className="mt-3 min-h-10 rounded-lg bg-[#79FF48] px-4 text-xs font-bold text-[#122016]">Show next 7 days</button>
  </div>}
  <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
   Games use verified ESPN kickoff and home/away identities. Match forecasts join only when both teams and the date agree.
   Missing model coverage is labeled rather than guessed. Probabilities are uncalibrated research estimates, not official picks.
  </p>
 </div>;
}
