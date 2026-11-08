/** Unblocked game-day visibility for the existing weekly NFL model. Not Phase1. */
import React,{useEffect,useState} from 'react';
import {ChevronDown,Image} from 'lucide-react';
import NflExistingShareModal from './NflExistingShareModal';
import {formatET,type Horizon,type Phase1View} from '../nfl/phase1';
import {wholeStatProjection} from '../lib/wholeStatProjection';
import {hasNflOwnProjectionEvidence,rankNflRoleSupportedOwnProjections} from '../nfl/ownProjectionRank';
import type {NflRoleSnapshot} from '../nfl/roleSupportedNfl';
import {parseExistingNfl,existingMatchup,type ExistingNflSlate,type ExistingNflGame,type ExistingYardProjection} from '../nfl/existing';
const n=(x:number)=>x.toLocaleString('en-US',{maximumFractionDigits:1});
const label=(m:string)=>m==='rushing_yards'?'RUSH YDS':'REC YDS';
function matches(p:ExistingYardProjection,search:string,family:string){
  return (!search.trim()||(p.player+' '+p.team+' '+p.opponent).toLowerCase().includes(search.trim().toLowerCase()))&&
    (family==='ALL'||(family==='RUSH'&&p.market==='rushing_yards')||(family==='REC'&&p.market==='receiving_yards'));
}
function Projection({p}:{p:ExistingYardProjection}){
  return <article data-testid="existing-nfl-projection" className="min-w-0 rounded-2xl border border-[#292929] bg-[#1C1C1C] p-4">
    <h3 className="break-words text-base font-bold capitalize text-white">{p.player}</h3>
    <p className="mt-1 text-[11px] text-gray-400">{p.team} · {label(p.market)}</p>
    <div data-testid="existing-nfl-median" className="my-4 rounded-xl border border-[#00FF41]/25 bg-[#0E1D14] p-3">
      <p className="text-[10px] font-bold tracking-wide text-gray-300">PREDICTED STAT · MODEL MEDIAN</p>
      <p className="mt-1 text-3xl font-black text-[#00FF41]">{wholeStatProjection(p.projected_median)} yds</p>
      {hasNflOwnProjectionEvidence(p)?<div data-testid="nfl-own-projection-research" className="mt-2 space-y-1 text-xs text-amber-100">
        <p>Model P(at least {p.whole_projection} yds): <strong>{(p.projection_reach_probability!*100).toFixed(1)}%</strong></p>
        <p>Model P(within ±10 yds): {(p.projection_within_10_probability!*100).toFixed(1)}%</p>
        <p className="text-[10px] text-gray-400">{p.projection_simulation_n?.toLocaleString()} player bootstrap simulations · uncalibrated · game-day availability not certified · no sportsbook input to this percentage</p>
      </div>:<p className="mt-1 text-xs text-amber-200">Own-projection probability unavailable for this model. A book-line probability cannot substitute for it.</p>}
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
      const top=rankNflRoleSupportedOwnProjections(g.shown,role,slate?.generated_at_utc||'',g.kickoff_utc,Date.now(),10);
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
              {preview&&<p data-testid="existing-nfl-preview" className="mt-2 truncate text-[11px] text-gray-300">{top.length?'TOP RESEARCH MODEL EVENT':'MODEL MEDIAN'}: <span className="capitalize text-white">{preview.player}</span> · <span className="font-black text-[#00FF41]">{n(preview.projected_median)} {label(preview.market)}</span></p>}
              {!preview&&<p role="status" className="mt-1 text-[11px] text-amber-200">{g.projections.length===0?'No eligible player projections for this matchup':'No matching projected stats'}</p>}
              {started&&<p className="mt-1 text-[10px] text-gray-500">Kickoff passed · archived pregame projections</p>}
            </div>
            <ChevronDown size={16} className={`shrink-0 text-gray-500 ${opened?'rotate-180':''}`}/>
          </button>
          <button aria-label={`Create weekly model share card for ${existingMatchup(g)}`} onClick={()=>setShareGame(g)}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-[#333] bg-[#1B211E] text-gray-300">
            <Image size={18}/>
          </button>
        </div>
        {opened&&<div id={`existing-game-${g.id}`} data-testid="existing-nfl-expanded" className="space-y-3 border-t border-[#292929] p-3">
          <p className="text-[11px] text-gray-400">Numerical weekly projections, not 65%+ system targets or verified sportsbook bets. {mode==='BETTABLE NOW'?'No verified book lines supplied.':''}</p>
          {g.shown.length>0?<div className="space-y-3">
            {top.length>0?<div data-testid="nfl-top10-simulation-research" className="space-y-3">
              <p className="text-xs font-bold text-[#00FF41]">TOP {top.length} ROLE-SUPPORTED MODEL EVENTS · RESEARCH ONLY</p>
              <p className="text-[11px] text-amber-200">Ranked by the 10,000+ simulated chance of reaching the model's own rounded projected yardage, after checking timestamp-matched three-game role evidence. Still uncalibrated player bootstraps—not confirmed game-day actives, a full-game NFL simulation, or recommended bets.</p>
              {top.map(p=><Projection key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}
              {remaining.length>0&&<details className="rounded-xl border border-[#292929] p-3">
                <summary className="min-h-11 cursor-pointer text-xs font-bold text-gray-300">SHOW OTHER {remaining.length} NUMERICAL MODEL PROJECTIONS ▾</summary>
                <div className="space-y-3 pt-3">{remaining.map(p=><Projection key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}</div>
              </details>}
            </div>:<div className="space-y-3">
              <p className="text-[11px] text-amber-200">No fresh, matching simulation AND pregame role evidence is available for a probability-ranked shortlist. All original model projections remain visible below.</p>
              {g.shown.map(p=><Projection key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}
            </div>}
          </div>:<p className="py-2 text-xs text-gray-400">No qualifying numerical projections available for this game and filter.</p>}
        </div>}
      </section>;
    })}
    {shareGame&&slate&&<NflExistingShareModal game={shareGame} week={slate.week}
      forecastGeneratedAtUtc={slate.generated_at_utc} onClose={()=>setShareGame(null)}/>}
  </section>;
}
