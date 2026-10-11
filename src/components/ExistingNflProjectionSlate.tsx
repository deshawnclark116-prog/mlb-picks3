/** Unblocked game-day visibility for the existing weekly NFL model. Not Phase1. */
import React,{useEffect,useState} from 'react';
import {ChevronDown,Image} from 'lucide-react';
import NflExistingShareModal from './NflExistingShareModal';
import {formatET,type Horizon,type Phase1View} from '../nfl/phase1';
import {parseExistingNfl,type ExistingNflSlate,type ExistingNflGame,type ExistingYardProjection} from '../nfl/existing';
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
type Props={view:Phase1View|null;search:string;family:string;visible:boolean;horizon:Horizon;mode:string};
export default function ExistingNflProjectionSlate({view,search,family,visible,horizon,mode}:Props){
  const [slate,setSlate]=useState<ExistingNflSlate|null>(null);
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
  // Prefer the original Phase1 matchup/share card when that horizon has
  // actual frozen game rows. Only use weekly model cards for the games
  // Phase1 missed; never display a duplicate game in two different designs.
  const published=view?.games.filter(g=>g.horizons[horizon]&&view.rows[horizon].some(r=>r.game_id===g.game_id))||[];
  const games=(slate?.games||[]).filter(g=>!published.some(p=>
    Date.parse(p.kickoff_utc)===Date.parse(g.kickoff_utc) &&
    [p.away,p.home].sort().join('_')===g.teams.join('_')))
    .map(g=>({...g,shown:g.projections.filter(p=>matches(p,search,family))}))
    .filter(g=>!(search.trim()||family!=='ALL')||g.shown.length>0);
  return <div className="mt-4 space-y-3" aria-label="NFL other scheduled games" data-testid="existing-nfl-slate">
    {slate&&!slate.scheduleComplete&&<p role="status" className="text-xs text-amber-200">The independent model only lists games with projections. Full schedule coverage is not verified.</p>}
    {origin==='render_outage_fallback'&&<p role="status" className="text-xs text-amber-200">GitHub temporarily unavailable. Showing a checked Render fallback.</p>}
    {mismatch&&<p role="status" className="text-xs text-amber-200">T24/T90 research covers another week. Weekly game-day projections remain visible.</p>}
    {loading&&!slate&&<p className="py-2 text-xs text-gray-400">Loading other NFL games…</p>}
    {error&&<p role="alert" className="text-xs text-amber-300">Additional NFL matchups unavailable: {error}</p>}
    {games.map(g=>{
      const opened=expanded===g.id;
      const started=Date.now()>=Date.parse(g.kickoff_utc);
      const preview=g.shown[0];
      return <section key={g.id} data-testid="existing-nfl-game" className="min-w-0 overflow-hidden rounded-2xl border border-[#292929] bg-[#141414]">
        <div className="flex items-center gap-1 pr-3">
          <button type="button" data-testid="existing-nfl-toggle" aria-expanded={opened} aria-controls={`existing-game-${g.id}`}
            onClick={()=>setExpanded(previous=>previous===g.id?null:g.id)}
            className="flex min-h-20 min-w-0 flex-1 items-center gap-3 p-4 text-left">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <h2 className="text-base font-bold text-white">{g.teams.join(' vs ')}</h2>
                <span className="text-[11px] text-gray-500">{formatET(g.kickoff_utc)}</span>
              </div>
              <p className="mt-2 text-[10px] font-bold text-gray-400">{g.projections.length} PLAYER PROJECTIONS · EXISTING MODEL</p>
              {preview&&<p data-testid="existing-nfl-preview" className="mt-2 truncate text-[11px] text-gray-300">MODEL MEDIAN: <span className="capitalize text-white">{preview.player}</span> · <span className="font-black text-[#00FF41]">{n(preview.projected_median)} {label(preview.market)}</span></p>}
              {!preview&&<p role="status" className="mt-1 text-[11px] text-amber-200">{g.projections.length===0?'No eligible player projections for this matchup':'No matching projected stats'}</p>}
              {started&&<p className="mt-1 text-[10px] text-gray-500">Kickoff passed · archived pregame projections</p>}
            </div>
            <ChevronDown size={16} className={`shrink-0 text-gray-500 ${opened?'rotate-180':''}`}/>
          </button>
          <button aria-label={`Create share card for ${g.teams.join(' vs ')}`} onClick={()=>setShareGame(g)}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-[#333] bg-[#1B211E] text-gray-300">
            <Image size={18}/>
          </button>
        </div>
        {opened&&<div id={`existing-game-${g.id}`} data-testid="existing-nfl-expanded" className="space-y-1 border-t border-[#292929] p-3">
          <p className="text-[11px] text-gray-400">Numerical weekly projections, not 65%+ system targets or verified sportsbook bets. {mode==='BETTABLE NOW'?'No verified book lines supplied.':''}</p>
          {g.shown.length>0?<div>{g.shown.map(p=><Projection key={p.player_id+'|'+p.player+'|'+p.team+'|'+p.market} p={p}/>)}</div>
          :<p className="py-2 text-xs text-gray-400">No qualifying numerical projections available for this game and filter.</p>}
        </div>}
      </section>;
    })}
    {shareGame&&slate&&<NflExistingShareModal game={shareGame} week={slate.week} onClose={()=>setShareGame(null)}/>}
  </div>;
}
