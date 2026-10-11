/** Unblocked game-day visibility for the existing weekly NFL model. Not Phase1. */
import React,{useEffect,useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {formatET,type Phase1View} from '../nfl/phase1';
import {parseExistingNfl,type ExistingNflSlate,type ExistingYardProjection} from '../nfl/existing';
const n=(x:number)=>x.toLocaleString('en-US',{maximumFractionDigits:1});
const label=(m:string)=>m==='rushing_yards'?'RUSH YDS':'REC YDS';
function matches(p:ExistingYardProjection,search:string,family:string){
  return (!search.trim()||(p.player+' '+p.team+' '+p.opponent).toLowerCase().includes(search.trim().toLowerCase()))&&
    (family==='ALL'||(family==='RUSH'&&p.market==='rushing_yards')||(family==='REC'&&p.market==='receiving_yards'));
}
function Projection({p}:{p:ExistingYardProjection}){
  return <div data-testid="existing-nfl-projection" className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#303030] py-3 last:border-b-0">
    <div className="min-w-0"><p className="truncate text-xs font-semibold capitalize text-white">{p.player} · {p.team}</p>
      <p className="mt-1 text-[10px] text-gray-400">{label(p.market)} · {p.model_source}</p>
      <p className="mt-1 text-[10px] text-gray-400">Model low–high {n(p.projected_low)}–{n(p.projected_high)} yds · Not verified sportsbook odds</p>
    </div><div className="text-right"><p className="text-xl font-black text-[#00FF41]">{n(p.projected_median)}</p><p className="text-[9px] text-gray-400">PROJECTED YDS</p></div>
  </div>;
}
type Props={view:Phase1View|null;search:string;family:string;visible:boolean};
export default function ExistingNflProjectionSlate({view,search,family,visible}:Props){
  const [slate,setSlate]=useState<ExistingNflSlate|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [origin,setOrigin]=useState<string>('');
  // Expand a single matchup at a time. The former auto-visible player list
  // could consume dozens of phone screens before the original board appeared.
  const [expanded,setExpanded]=useState<string|null>(null);
  useEffect(()=>{
    let cancelled=false;let abort:AbortController|null=null;
    async function refresh(){
      abort?.abort();abort=new AbortController();
      try{
        const response=await fetch('/api/nfl-predictions?t='+Date.now(),{cache:'no-store',signal:abort.signal});
        if(!response.ok)throw new Error('NFL weekly feed HTTP '+response.status);
        const document=await response.json();
        const parsed=parseExistingNfl(document,new Date());
        if(!cancelled){setSlate(parsed);setOrigin(document.serving_origin||'');setError(null);}
      }catch(e){
        if(!cancelled&&(e as Error).name!=='AbortError'){setSlate(null);setError(e instanceof Error?e.message:'Existing model feed unavailable');}
      }finally{if(!cancelled)setLoading(false);}
    }
    void refresh();const interval=setInterval(()=>void refresh(),60000);
    return()=>{cancelled=true;abort?.abort();clearInterval(interval);};
  },[]);
  if(!visible)return null;
  // Phase1 is an independent *research* publication. Its week being stale or
  // unavailable must never hide the game-day model or the league schedule.
  const mismatch=Boolean(slate&&view&&(slate.season!==view.artifact.status.season||slate.week!==view.artifact.status.week));
  const games=(slate?.games||[]).map(g=>({...g,shown:g.projections.filter(p=>matches(p,search,family))}))
    .filter(g=>!(search.trim()||family!=='ALL')||g.shown.length>0);
  const hasData=games.length>0;
  return <section className="mt-3" aria-label="Full NFL slate existing model" data-testid="existing-nfl-slate">
    <div className="rounded-xl border border-[#303030] bg-[#151515] p-3">
      <h2 className="text-sm font-black text-white">NFL GAME-DAY PROJECTIONS</h2>
      <p className="mt-1 text-[11px] text-gray-300">Actual weekly model projections · independent of optional T24/T90 research.</p>
      {slate&&<p className="mt-1 text-[11px] text-gray-400">{slate.games.length} {slate.scheduleComplete?'scheduled games':'matchups with forecasts'} · {slate.projections} rush/receiving-yard projections · Generated {formatET(slate.generated_at_utc)}</p>}
      {slate&&!slate.scheduleComplete&&<p role="status" className="mt-1 text-[11px] text-amber-200">Schedule completeness not verified in this publication.</p>}
      {origin==='render_outage_fallback'&&<p role="status" className="mt-1 text-[11px] text-amber-200">GitHub temporarily unavailable; showing checked Render fallback data.</p>}
      {mismatch&&<p role="status" className="mt-1 text-[11px] text-amber-200">T24/T90 research is on a different week. Game-day projections remain visible.</p>}
      {loading&&!slate&&<p className="mt-2 text-xs text-gray-400">Loading game-day projections…</p>}
      {error&&<p role="alert" className="mt-2 text-xs text-amber-300">Game-day projections unavailable: {error}</p>}
      {!loading&&!error&&!hasData&&<p className="mt-2 text-xs text-amber-300">No matchups match the current search or filters.</p>}
    </div>
    <div className="mt-2 space-y-2">{games.map(g=>{
      const phase1=view?.games.find(x=>Date.parse(x.kickoff_utc)===Date.parse(g.kickoff_utc)&&[x.away,x.home].sort().join('_')===g.teams.join('_'));
      const captured=phase1&&Object.keys(phase1.horizons).filter(h=>h==='T24'||h==='T90');
      const started=Date.now()>=Date.parse(g.kickoff_utc);
      const opened=expanded===g.id;
      const preview=g.shown[0];
      return <article key={g.id} data-testid="existing-nfl-game" className="min-w-0 overflow-hidden rounded-2xl border border-[#292929] bg-[#141414]">
        <button type="button" data-testid="existing-nfl-toggle" aria-expanded={opened} aria-controls={`existing-game-${g.id}`} onClick={()=>setExpanded(previous=>previous===g.id?null:g.id)}
          className="flex min-h-20 w-full min-w-0 items-center gap-3 p-3 text-left">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <h3 className="text-sm font-bold text-white">{g.teams.join(' vs ')}</h3>
              <span className="text-[11px] text-gray-400">{formatET(g.kickoff_utc)}</span>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">{g.projections.length} projected stats · {started?'Kickoff passed · archive':'Pregame'} · {opened?'HIDE PLAYERS':'VIEW PLAYERS'}</p>
            {preview&&<p data-testid="existing-nfl-preview" className="mt-1 truncate text-xs text-gray-200">TOP PROJECTION: <span className="capitalize">{preview.player}</span> · {label(preview.market)} <span className="font-black text-[#00FF41]">{n(preview.projected_median)} yds</span></p>}
            {g.projections.length===0&&<p role="status" className="mt-1 text-[11px] text-amber-200">No eligible player projections yet</p>}
          </div>
          <ChevronDown size={17} className={`shrink-0 text-gray-400 ${opened?'rotate-180':''}`}/>
        </button>
        {opened&&<div id={`existing-game-${g.id}`} data-testid="existing-nfl-expanded" className="border-t border-[#292929] px-3 pb-3">
          <p className="py-2 text-[11px] text-gray-400">Existing weekly model · Not T24/T90 forecasts · Not verified sportsbook odds or validated betting picks.</p>
          <p className="mb-1 text-[10px] text-gray-500">{captured?.length?('Separate new-engine '+captured.join('/')+' also published'):'No new-engine T24/T90 forecast published for this game'}</p>
          {g.shown.length>0?<div>{g.shown.map(p=><Projection key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}</div>
            :<p className="py-2 text-xs text-gray-400">{g.projections.length===0?'No eligible yardage projections published for this scheduled game. Matchup remains listed.':
            family==='PASS'?'Passing yards are not produced by this weekly model.':family==='TD'?'Touchdown counts are not yardage projections.':'No projections match these filters.'}</p>}
        </div>}
      </article>;
    })}</div>
  </section>;
}
