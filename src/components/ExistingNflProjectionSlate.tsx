/** Unblocked game-day visibility for the existing weekly NFL model. Not Phase1. */
import React,{useEffect,useState} from 'react';
import {ChevronDown,Image} from 'lucide-react';
import NflExistingShareModal from './NflExistingShareModal';
import NflPrecisionShareModal from './NflPrecisionShareModal';
import {formatET,type Horizon,type Phase1View} from '../nfl/phase1';
import {wholeStatProjection} from '../lib/wholeStatProjection';
import {hasNflNbaMeanProjectionEvidence,rankNflPregameNbaMeanSnapshotForDisplay} from '../nfl/ownProjectionRank';
import type {NflRoleSnapshot} from '../nfl/roleSupportedNfl';
import {parseExistingNfl,existingMatchup,type ExistingNflSlate,type ExistingNflGame,type ExistingYardProjection} from '../nfl/existing';
const n=(x:number)=>x.toLocaleString('en-US',{maximumFractionDigits:1});
const label=(m:string)=>m==='rushing_yards'?'RUSH YDS':'REC YDS';
const chance=(n:number|null|undefined)=>n!=null&&Number.isFinite(n)?(n*100).toFixed(1)+'%':'n/a';
/** NBA V5's compact two-across projection cards, but truthful NFL events. */
function NflPrecisionTile({p}:{p:ExistingYardProjection}){
 return <div data-testid="nfl-projection-tile" className="min-w-0 rounded-xl border border-white/10 bg-[#12181b] p-3">
  <p className="truncate text-[11px] text-gray-400">{p.team} · {label(p.market)}</p>
  <p className="mt-0.5 min-h-9 break-words text-[15px] font-bold leading-snug text-white">{p.player}</p>
  <p className="mt-2 text-[26px] font-black leading-none tabular-nums text-[#79FF48]">
   {p.nba_style_whole_mean_projection}+ <span className="text-[14px] font-bold">YDS</span></p>
  <p className="mt-1.5 text-[13px] font-bold tabular-nums text-[#79FF48]">
   {chance(p.nba_style_reach_probability)} <span className="text-[11px] text-gray-200">to reach {p.nba_style_whole_mean_projection}+ yds</span></p>
  <p className="mt-0.5 text-[11px] text-gray-400">Mean {n(p.projected_mean)} · Median {n(p.projected_median)} · uncalibrated</p>
 </div>;
}
function NflPrecisionPick({p}:{p:ExistingYardProjection}){
 return <article data-testid="nfl-precision-pick" className="rounded-xl border border-[#374239] bg-[#101912] p-3 space-y-2">
  <div className="flex items-start justify-between gap-2">
   <div><p className="text-sm font-bold text-white">{p.player}</p>
    <p className="text-[11px] text-gray-400">{p.team} · {label(p.market)}</p></div>
   <span className="rounded-lg border border-[#487b54] p-2 text-[10px] font-bold text-[#00FF41]">MODEL PROJECTION</span>
  </div>
  <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#32533d] bg-[#102418] p-3">
   <div><p className="text-[10px] text-gray-400">MODEL PROJECTION</p>
    <p className="text-xl font-bold text-white">{p.nba_style_whole_mean_projection}+ YDS</p>
    <p className="text-[10px] text-gray-400">Mean {n(p.projected_mean)} · Median {n(p.projected_median)}</p>
   </div>
   <div><p className="text-[10px] text-gray-400">CHANCE OF {p.nba_style_whole_mean_projection}+ YDS</p>
    <p data-testid="nfl-precision-percentage" className="text-xl font-bold text-[#00FF41]">{chance(p.nba_style_reach_probability)}</p>
    <p className="text-[10px] text-gray-300">From the same simulated model-mean projection</p>
    <p className="text-[10px] text-amber-200">Not forward-calibrated · DNP risk not included</p>
   </div>
  </div>
  <details className="border-t border-[#343434] pt-2 text-[11px] text-gray-400">
   <summary className="min-h-9 cursor-pointer font-bold">MODEL EVIDENCE</summary>
   <p className="mt-1">{p.projection_simulation_n?.toLocaleString()} deterministic individual-player simulations.
    Model range: {n(p.projected_low)}–{n(p.projected_high)} yards.
    Recent workload evidence checked, but official active/starting status not confirmed.
    Probability is not a sportsbook line or verified betting edge.</p>
  </details>
 </article>;
}
function matches(p:ExistingYardProjection,search:string,family:string){
  return (!search.trim()||(p.player+' '+p.team+' '+p.opponent).toLowerCase().includes(search.trim().toLowerCase()))&&
    (family==='ALL'||(family==='RUSH'&&p.market==='rushing_yards')||(family==='REC'&&p.market==='receiving_yards'));
}
function Projection({p}:{p:ExistingYardProjection}){
  const nbaStyle=hasNflNbaMeanProjectionEvidence(p);
  return <article data-testid="existing-nfl-projection" className="min-w-0 rounded-2xl border border-[#292929] bg-[#1C1C1C] p-4">
    <h3 className="break-words text-base font-bold capitalize text-white">{p.player}</h3>
    <p className="mt-1 text-[11px] text-gray-400">{p.team} · {label(p.market)}</p>
    <div data-testid="existing-nfl-median" className="my-4 rounded-xl border border-[#00FF41]/25 bg-[#0E1D14] p-3">
      <p className="text-[10px] font-bold tracking-wide text-gray-300">{nbaStyle?'MODEL PROJECTION · ROUNDED MEAN':'PREDICTED STAT · MODEL MEDIAN'}</p>
      <p className="mt-1 text-3xl font-black text-[#00FF41]">{nbaStyle?p.nba_style_whole_mean_projection:wholeStatProjection(p.projected_median)}{nbaStyle?'+':''} yds</p>
      {nbaStyle?<div data-testid="nfl-own-projection-research" className="mt-2 space-y-1 text-xs text-amber-100">
        <p>Model chance of reaching {p.nba_style_whole_mean_projection}+ yds:
          <strong> {chance(p.nba_style_reach_probability)}</strong></p>
        <p className="text-[10px] text-gray-400">{p.projection_simulation_n?.toLocaleString()} historical player simulations · not forward-calibrated · DNP and game-day active status unverified · no sportsbook line used</p>
      </div>:<p className="mt-1 text-xs text-amber-200">No matching mean-target probability is available for this numerical model. A sportsbook event cannot substitute for it.</p>}
       <p className="mt-1 text-xs text-gray-400">Mean: {n(p.projected_mean)} yds · Model range: {n(p.projected_low)}–{n(p.projected_high)} yds</p>
    </div>
    <p className="text-[11px] text-gray-400">WEEKLY MODEL · {p.model_source} · separate from frozen V2 T24/T90 forecasts</p>
    <p className="mt-2 text-[11px] text-gray-400">A numerical projection is not an offered sportsbook line. {p.confidence?'Original workload stability: '+p.confidence+'. ':''}No calibrated hit probability is supplied here.</p>
    <details className="mt-3 border-t border-[#303030] pt-2">
      <summary className="flex min-h-11 items-center text-[11px] font-bold text-gray-400">VIEW DETAILS ▾</summary>
      <p className="pb-3 text-[11px] text-gray-400">Historical games considered: {p.games_played??'unknown'} · Weekly data source is independent of the shadow V2 simulation.</p>
    </details>
  </article>;
}
type Props={view:Phase1View|null;search:string;family:string;visible:boolean;horizon:Horizon;mode:string};
export default function ExistingNflProjectionSlate({view,search,family,visible,horizon,mode}:Props){
  const [slate,setSlate]=useState<ExistingNflSlate|null>(null);
  const [role,setRole]=useState<NflRoleSnapshot|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [origin,setOrigin]=useState<string>('');
  // Expand a single matchup at a time. The former auto-visible player list
  // could consume dozens of phone screens before the original board appeared.
  const [expanded,setExpanded]=useState<string|null>(null);
  const [shareGame,setShareGame]=useState<ExistingNflGame|null>(null);
  const [precisionShare,setPrecisionShare]=useState<{game:ExistingNflGame;picks:ExistingYardProjection[]}|null>(null);
  useEffect(()=>{
    let cancelled=false;let abort:AbortController|null=null;
    async function refresh(){
      abort?.abort();abort=new AbortController();
      try{
        const response=await fetch('/api/nfl-predictions?t='+Date.now(),{cache:'no-store',signal:abort.signal});
        if(!response.ok)throw new Error('NFL weekly feed HTTP '+response.status);
        const document=await response.json();
        const parsed=parseExistingNfl(document,new Date());
        // Independent, timestamp-matched pregame workload evidence: no
        // response or stale/mismatched source means no featured shortlist.
        // The complete archived numerical ledger remains visible.
        let roleDoc:NflRoleSnapshot|null=null;
        try{
          const roleResponse=await fetch('/api/nfl-role-snapshot?t='+Date.now(),
            {cache:'no-store',signal:abort.signal});
          if(roleResponse.ok)roleDoc=await roleResponse.json() as NflRoleSnapshot;
        }catch{/* Snapshot unavailable: fail closed, never invent role proof. */}
        if(!cancelled){
          // A temporary CDN cache race must never roll a newer validated
          // weekly forecast back to yesterday's version.
          setSlate(previous=>previous&&Date.parse(previous.generated_at_utc)>Date.parse(parsed.generated_at_utc)?previous:parsed);
          setOrigin(document.serving_origin||response.headers.get('X-NFL-Forecast-Source')||'');
          setRole(roleDoc);
          setError(null);
        }
      }catch(e){
        if(!cancelled&&(e as Error).name!=='AbortError'){
          // Keep last validated source visible with its ORIGINAL timestamp;
          // never silently replace it with a cached unverified estimate.
          setError(e instanceof Error?e.message:'Existing model feed unavailable');
        }
      }finally{if(!cancelled)setLoading(false);}
    }
    void refresh();const interval=setInterval(()=>void refresh(),60000);
    return()=>{cancelled=true;abort?.abort();clearInterval(interval);};
  },[]);
  if(!visible)return null;
  // Phase1 is an independent *research* publication. Its week being stale or
  // unavailable must never hide the game-day model or the league schedule.
  const mismatch=Boolean(slate&&view&&(slate.season!==view.artifact.status.season||slate.week!==view.artifact.status.week));
  // Every official weekly matchup must appear, including games with old
  // frozen Phase1 T24/T90 research. Suppressing those weekly matchups was
  // causing today's validated projections to disappear behind stale cards.
  // The frozen research section below is explicitly separate.
  const games=(slate?.games||[])
    .map(g=>({...g,shown:g.projections.filter(p=>matches(p,search,family))}))
    .filter(g=>!(search.trim()||family!=='ALL')||g.shown.length>0);
  const sourceAgeMs=slate?Date.now()-Date.parse(slate.generated_at_utc):null;
  const forecastTime=slate?new Intl.DateTimeFormat('en-US',{
    timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',
    minute:'2-digit',timeZoneName:'short'
  }).format(new Date(slate.generated_at_utc)):'Unavailable';
  return <section className="mt-4 space-y-3" aria-label="NFL current weekly predictions" data-testid="existing-nfl-slate">
    <div className="rounded-xl border border-[#00FF41]/35 bg-[#0F2015] p-3" data-testid="nfl-weekly-generation-receipt">
      <p className="text-[12px] font-black uppercase tracking-wide text-[#00FF41]">Current weekly NFL model · Week {slate?.week||'—'}</p>
      <p className="mt-1 text-[12px] text-gray-200">Forecast generated: {forecastTime}</p>
      {slate&&<p className="mt-1 text-[11px] text-gray-300">
        {games.length} visible scheduled matchups · {slate.projections} weekly player-yardage projections
      </p>}
      {slate&&sourceAgeMs!==null&&sourceAgeMs>90*60_000&&
        <p role="status" className="mt-2 text-[11px] font-semibold text-amber-300">
          This weekly forecast is over 90 minutes old. Refresh pending; verify injury/availability before using its projections.
        </p>}
      <p className="mt-1 text-[10px] text-gray-400">Separate from frozen T24/T90 research. No verified sportsbook hit probability is implied.</p>
    </div>
    {slate&&!slate.scheduleComplete&&<p role="status" className="text-xs text-amber-200">The independent model only lists games with projections. Full schedule coverage is not verified.</p>}
    {origin==='render_outage_fallback'&&<p role="status" className="text-xs text-amber-200">GitHub temporarily unavailable. Showing a checked Render fallback.</p>}
    {mismatch&&<p role="status" className="text-xs text-amber-200">T24/T90 research covers another week. Weekly game-day projections remain visible.</p>}
    {loading&&!slate&&<p className="py-2 text-xs text-gray-400">Loading other NFL games…</p>}
    {error&&<p role="alert" className="text-xs text-amber-300">NFL source refresh failed: {error}. {slate?'Displaying the last verified forecast with its original generation time.':'No verified weekly projection can be shown.'}</p>}
    {games.map(g=>{
      const opened=expanded===g.id;
      const started=Date.now()>=Date.parse(g.kickoff_utc);
      const top=rankNflPregameNbaMeanSnapshotForDisplay(g.shown,role,slate?.generated_at_utc||'',g.kickoff_utc,Date.now(),10);
      const topKeys=new Set(top.map(p=>[p.player_id,p.player,p.team,p.market].join('|')));
      const remaining=g.shown.filter(p=>!topKeys.has([p.player_id,p.player,p.team,p.market].join('|')));
      const preview=top[0]||g.shown[0];
      return <section key={g.id} data-testid="existing-nfl-game" className="min-w-0 overflow-hidden rounded-2xl border border-[#292929] bg-[#141414]">
        <div className="flex items-center gap-1 pr-3">
          <button type="button" data-testid="existing-nfl-toggle" aria-expanded={opened} aria-controls={`existing-game-${g.id}`}
            onClick={()=>setExpanded(previous=>previous===g.id?null:g.id)}
            className="flex min-h-20 min-w-0 flex-1 items-center gap-3 p-4 text-left">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <h2 className="text-base font-bold text-white">{existingMatchup(g)}</h2>
                <span className="text-[11px] text-gray-500">{formatET(g.kickoff_utc)}</span>
              </div>
              <p className="mt-2 text-[10px] font-bold text-gray-400">{g.projections.length} PLAYER OUTCOMES · WEEKLY MODEL</p>
              {preview&&<p data-testid="existing-nfl-preview" className="mt-2 truncate text-[11px] text-gray-300">
                {top.length?'TOP: ':'MODEL MEDIAN: '}<span className="capitalize text-white">{preview.player}</span>
                {' · '}<span className="font-black text-[#00FF41]">{top.length?preview.nba_style_whole_mean_projection:n(preview.projected_median)} {label(preview.market)}</span>
                {top.length>0&&<span className="text-[#79FF48]"> · {chance(preview.nba_style_reach_probability)} to reach</span>}
              </p>}
              {!preview&&<p role="status" className="mt-1 text-[11px] text-amber-200">{g.projections.length===0?'No eligible player projections for this matchup':'No matching projected stats'}</p>}
              {started&&<p className="mt-1 text-[10px] text-gray-500">Kickoff passed · archived pregame projections</p>}
            </div>
            <ChevronDown size={16} className={`shrink-0 text-gray-500 ${opened?'rotate-180':''}`}/>
          </button>
          {top.length>0?<button type="button"
            aria-label={`Open NFL top 10 game card for ${existingMatchup(g)}`}
            title="NFL top 10 · game share card"
            data-testid="nfl-open-top10"
            onClick={()=>setPrecisionShare({game:g,picks:top})}
            className="my-3 mr-0 flex min-h-11 min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#79FF48]/40 bg-[#79FF48]/10 px-2 text-[#79FF48]">
            <Image size={18}/><span className="text-[10px] font-black">TOP 10</span>
          </button>:<button aria-label={`Create weekly model share card for ${existingMatchup(g)}`} onClick={()=>setShareGame(g)}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-[#333] bg-[#1B211E] text-gray-300">
            <Image size={18}/>
          </button>}
        </div>
        {mode==='SYSTEM PICKS'&&top.length>0&&<div data-testid="nfl-top-projection-tiles" className="grid grid-cols-2 gap-2 px-3 pb-3">
           {top.slice(0,4).map(p=><NflPrecisionTile key={p.team+'|'+p.player_id+'|'+p.market} p={p}/>)}
        </div>}
        {opened&&<div id={`existing-game-${g.id}`} data-testid="existing-nfl-expanded" className="space-y-3 border-t border-[#292929] p-3">
          <p className="text-[11px] text-gray-400">Numerical weekly projections, not 65%+ system targets or verified sportsbook bets. {mode==='BETTABLE NOW'?'No verified book lines supplied.':''}</p>
          {g.shown.length>0?<div className="space-y-3">
            {top.length>0?<div data-testid="nfl-top10-simulation-research" className="space-y-3">
              <p className="text-xs font-bold text-[#00FF41]">TOP {top.length} MODEL PROJECTIONS</p>
              <p className="text-[11px] text-amber-200">Ranked by the model-estimated chance of reaching the displayed rounded MEAN yardage projection or more, exactly as NBA V5 displays its own targets. Each percentage comes from the same 10,000+ player simulation draws, not a sportsbook line. Historical role checks do NOT verify today's active status or include DNP risk; probabilities are not forward-calibrated.</p>
              {top.map(p=><NflPrecisionPick key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}
              {remaining.length>0&&<details className="rounded-xl border border-[#292929] p-3">
                <summary className="min-h-11 cursor-pointer text-xs font-bold text-gray-300">SHOW OTHER {remaining.length} NUMERICAL MODEL PROJECTIONS ▾</summary>
                <div className="space-y-3 pt-3">{remaining.map(p=><Projection key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}</div>
              </details>}
            </div>:<div className="space-y-3">
              <p className="text-[11px] text-amber-200">No new NBA-style mean-target probability and matching pregame role evidence available. Original numerical projections remain available below without invented percentages.</p>
              {g.shown.map(p=><Projection key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}
            </div>}
          </div>:<p className="py-2 text-xs text-gray-400">No qualifying numerical projections available for this game and filter.</p>}
        </div>}
      </section>;
    })}
    {shareGame&&slate&&<NflExistingShareModal game={shareGame} week={slate.week}
      forecastGeneratedAtUtc={slate.generated_at_utc} onClose={()=>setShareGame(null)}/>}
    {precisionShare&&slate&&<NflPrecisionShareModal game={precisionShare.game}
      ranked={precisionShare.picks} week={slate.week} forecastAtUtc={slate.generated_at_utc}
      close={()=>setPrecisionShare(null)}/>}
  </section>;
}
