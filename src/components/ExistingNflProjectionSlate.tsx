/** Unblocked game-day visibility for the existing weekly NFL model. Not Phase1. */
import React,{useEffect,useState} from 'react';
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
  useEffect(()=>{
    let cancelled=false;let abort:AbortController|null=null;
    async function refresh(){
      abort?.abort();abort=new AbortController();
      try{
        const response=await fetch('/api/nfl-predictions?t='+Date.now(),{cache:'no-store',signal:abort.signal});
        if(!response.ok)throw new Error('NFL weekly feed HTTP '+response.status);
        const parsed=parseExistingNfl(await response.json(),new Date());
        if(!cancelled){setSlate(parsed);setError(null);}
      }catch(e){
        if(!cancelled&&(e as Error).name!=='AbortError'){setSlate(null);setError(e instanceof Error?e.message:'Existing model feed unavailable');}
      }finally{if(!cancelled)setLoading(false);}
    }
    void refresh();const interval=setInterval(()=>void refresh(),60000);
    return()=>{cancelled=true;abort?.abort();clearInterval(interval);};
  },[]);
  if(!visible)return null;
  const mismatch=slate&&view&&slate.season!==view.artifact.status.season||slate&&view&&slate.week!==view.artifact.status.week;
  const games=(!mismatch&&slate?.games||[]).map(g=>({...g,shown:g.projections.filter(p=>matches(p,search,family))}));
  const hasData=games.length>0;
  return <section className="mt-4 rounded-2xl border border-[#37503c] bg-[#111a14] p-3" aria-label="Full NFL slate existing model" data-testid="existing-nfl-slate">
    <h2 className="text-sm font-black text-white">FULL NFL SLATE · EXISTING MODEL</h2>
    <p className="mt-1 text-xs text-gray-300">Independent weekly model projections. Not T24/T90 forecasts, not bookmaker lines, and not official validated wagers.</p>
    {slate&&!mismatch&&<p className="mt-2 text-xs text-gray-300">{slate.games.length} games · {slate.projections} real rushing/receiving-yard projections · Generated {formatET(slate.generated_at_utc)}</p>}
    {mismatch&&<p role="alert" className="mt-2 text-xs text-amber-300">Existing-model data belongs to a different NFL week; it is hidden rather than mixed with new-engine forecasts.</p>}
    {loading&&!slate&&<p className="mt-2 text-xs text-gray-400">Loading existing-model projections…</p>}
    {error&&<p role="alert" className="mt-2 text-xs text-amber-300">Existing-model forecasts unavailable: {error}</p>}
    {!loading&&!error&&!mismatch&&!hasData&&<p className="mt-2 text-xs text-amber-300">No current game-day projections in the existing-model feed.</p>}
    <div className="mt-3 space-y-2">{games.map(g=>{
      const phase1=view?.games.find(x=>Date.parse(x.kickoff_utc)===Date.parse(g.kickoff_utc)&&[x.away,x.home].sort().join('_')===g.teams.join('_'));
      const captured=phase1&&Object.keys(phase1.horizons).filter(h=>h==='T24'||h==='T90');
      return <article key={g.id} data-testid="existing-nfl-game" className="rounded-xl border border-[#2b3c31] bg-[#151a17] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-white">{g.teams.join(' vs ')}</h3><p className="text-xs text-gray-300">{formatET(g.kickoff_utc)}</p></div>
        <p className="mt-1 text-[11px] text-gray-400">{captured?.length?('Separate new-engine '+captured.join('/')+' also published'):'New-engine T24/T90 not published for this game'} · Existing model: {g.projections.length} projected stats</p>
        {g.shown.length>0?<><div>{g.shown.slice(0,4).map(p=><Projection key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}</div>
          {g.shown.length>4&&<details className="border-t border-[#303030]"><summary className="flex min-h-11 cursor-pointer items-center text-xs font-bold text-[#00FF41]">SHOW ALL {g.shown.length} PLAYER PROJECTIONS ▾</summary>
            {g.shown.slice(4).map(p=><Projection key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}
          </details>}</>:<p className="mt-2 text-xs text-gray-400">No {family==='PASS'?'passing-yard (not produced by this model)':family==='TD'?'touchdown count (not a yardage projection)':'matching'} projections for these filters.</p>}
      </article>;
    })}</div>
  </section>;
}
