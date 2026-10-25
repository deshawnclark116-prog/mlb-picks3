import React,{useEffect,useMemo,useState} from 'react';
import {ChevronDown,RefreshCw} from 'lucide-react';
import {NBA_DECISION_SCHEMA,MARKETS_NAMED,type NbaSystemBoard,type NbaSystemTarget,type NbaMarket} from '../nba/decisionBoard.ts';

const fmt=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:1});
const pct=(n:number)=>(100*n).toFixed(0)+'%';
const UNIT:Record<NbaMarket,string>={points:'PTS',rebounds:'REB',assists:'AST',three_pointers_made:'3PM'};
const dateET=(iso:string)=>{
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',
    year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso)).map(x=>[x.type,x.value]));
 return p.year+'-'+p.month+'-'+p.day;
};
const whenET=(iso:string)=>new Date(iso).toLocaleString('en-US',{timeZone:'America/New_York',
   month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET';

export function NbaShortlistCard({pick}:{pick:NbaSystemTarget}){
 return <article data-testid="nba-system-pick" className="rounded-2xl border border-[#303030] bg-[#1c1c1c] p-4 space-y-3">
   <div className="flex items-start justify-between gap-2">
     <div><h3 className="text-base font-bold text-white">{pick.player}</h3>
       <p className="text-[11px] text-gray-400">{MARKETS_NAMED[pick.market]}</p></div>
     <span className="rounded-md border border-[#414141] p-2 text-[10px]">SYSTEM TARGET</span>
   </div>
   <div data-testid="nba-selected-projection" className="rounded-xl border border-[#00FF41]/25 bg-[#0e2115] p-3">
     <p className="text-[10px] font-bold text-gray-300">MODEL PREDICTION · CONDITIONAL MEAN</p>
     <p className="mt-1 text-3xl font-black text-[#00FF41]">{fmt(pick.predicted_stat)} {UNIT[pick.market]}</p>
     <p className="mt-1 text-[11px] text-gray-300">Historical P(plays) {pct(pick.historical_p_play)}
       {' · '}Modeled minutes if playing {fmt(pick.conditional_minutes)}</p>
     <div className="mt-3 rounded-lg border border-[#2b7040] bg-[#0c2215] p-3"
          data-testid="nba-model-hit-probability">
       {pick.model_hit_probability!=null?
         <>
           <p className="text-[10px] font-bold text-gray-300">MODEL HIT PROBABILITY · HISTORICAL HOLDOUT</p>
           <strong className="mt-1 block text-2xl text-[#00FF41]">{pct(pick.model_hit_probability)}</strong>
           <p className="mt-1 text-[10px] text-amber-200">Independent 2026 historical holdout passed.
             Not yet validated on 2026–27 or cleared as a sportsbook wager.</p>
         </>:
         <p className="text-[11px] text-amber-200">Model probability not yet validated for this target.
           No invented confidence percentage.</p>}
     </div>
   </div>
   <div className="rounded-xl border border-[#333] bg-[#151515] p-3">
     <p className="text-[10px] font-bold text-gray-400">MODEL TARGET · NOT A VERIFIED BOOKMAKER LINE</p>
     <p data-testid="nba-selected-model-target" className="mt-1 text-xl font-bold text-white">{pick.model_target}</p>
     <p className="mt-1 text-xs text-gray-400">Projected {fmt(pick.model_gap)} {UNIT[pick.market]} above that milestone threshold</p>
   </div>
   <details className="border-t border-[#333] pt-2 text-xs text-gray-400">
     <summary className="flex min-h-11 cursor-pointer items-center">VIEW MODEL EVIDENCE ▾</summary>
     <p className="pb-2">Gap / historical played-player holdout MAE:
       {' '}{fmt(pick.gap_in_historical_mae_units)}. The MAE ratio is NOT a
       probability. When available above, the P(hit) comes from a separately
       verified outcome CDF, independent of bookmaker prices. Current-season
       calibration and official game-day active designation are unverified.</p>
     <p className="break-all pb-2 text-[10px]">Original saved forecast: {pick.forecast_id}</p>
   </details>
 </article>;
}
export default function NbaSystemPicksPanel({mode,search}:{
 mode:'SYSTEM PICKS'|'BETTABLE NOW';search:string
}){
 const [board,setBoard]=useState<NbaSystemBoard|null>(null);
 const [error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [revision,setRevision]=useState(0),[date,setDate]=useState('TODAY');
 const [market,setMarket]=useState<'ALL'|NbaMarket>('ALL');
 const [expanded,setExpanded]=useState<string|null>(null);
 // Availability can change AFTER the original model forecast is saved.
 // Refresh the decision board without replacing any frozen prediction.
 useEffect(()=>{
   const timer=setInterval(()=>setRevision(n=>n+1),120000);
   return ()=>clearInterval(timer);
 },[]);
 useEffect(()=>{
   let live=true;setLoading(true);
   fetch('/api/nba-system-picks',{cache:'no-store'}).then(async r=>{
     if(!r.ok)throw new Error('NBA picks API HTTP '+r.status);
     return await r.json() as NbaSystemBoard;
   }).then(d=>{
     if(d.schema!==NBA_DECISION_SCHEMA||d.research_only!==true||
        d.official_bets!==0||d.verified_book_lines!==0||
        d.probability_model_calibrated_for_NBA_targets!==false||
        !Array.isArray(d.games))throw new Error('NBA source or wagering contract failed');
     if(live){setBoard(d);setError('');}
   }).catch(e=>{if(live){setBoard(null);setError(
     String(e)+' · Current player availability could not be verified. The system is withholding unchecked NBA picks.'
   );}})
     .finally(()=>{if(live)setLoading(false);});
   return ()=>{live=false;};
 },[revision]);
 const today=dateET(new Date().toISOString());
 const dates=useMemo(()=>board?[...new Set(board.games.map(g=>dateET(g.tipoff_utc)))].sort():[],[board]);
 const visible=useMemo(()=>board?board.games.map(g=>({...g,
   picks:g.picks.filter(p=>(market==='ALL'||p.market===market)&&
     (!search.trim()||(p.player+' '+g.away+' '+g.home+' '+MARKETS_NAMED[p.market])
     .toLowerCase().includes(search.toLowerCase().trim())))
 })).filter(g=>(date==='ALL'||dateET(g.tipoff_utc)===(date==='TODAY'?today:date))&&
   g.picks.length>0):[],[board,date,today,market,search]);
 const top=visible.flatMap(g=>g.picks).sort((a,b)=>
   b.gap_in_historical_mae_units-a.gap_in_historical_mae_units||
   b.historical_p_play-a.historical_p_play||a.player.localeCompare(b.player));
 if(mode==='BETTABLE NOW')return <section data-testid="nba-bettable-gate"
   className="rounded-xl border border-amber-800 bg-amber-950/20 p-4 text-sm text-amber-100">
   <strong>NO VERIFIED EXECUTABLE NBA PLAYER PROP BETS</strong>
   <p className="mt-2 text-xs">The NBA system does not yet have verified sportsbook
     player-prop prices or a calibrated probability of beating those lines.
     A projected stat alone is not an actual wager.</p>
   <p className="mt-2 text-xs">SYSTEM PICKS contains the model's selected
     targets; MODEL BOARD preserves every prediction for grading.</p>
 </section>;
 return <section data-testid="nba-betting-style-decision-board" className="space-y-3">
   <div className="rounded-xl border border-[#00FF41]/30 bg-[#0e2115] p-3">
     <h2 className="text-sm font-black text-[#00FF41]">NBA SYSTEM PICKS</h2>
     <p className="mt-1 text-xs text-gray-300">
       All qualifying model-selected PTS, REB, AST and 3PM targets,
       one strongest qualified market per player. No fixed two-per-game limit.</p>
     <p className="mt-2 text-[11px] text-amber-200">
       Model-generated threshold probabilities require NO sportsbook lines. Probabilities appear only for markets passing a separate historical forward holdout. Injury status refreshes every 2 minutes; current-season probability calibration and official NBA active lists remain unverified.</p>
   </div>
   <div className="flex items-center justify-between gap-3 text-[11px] text-gray-400">
     <span>{loading?'Loading verified saved model selections…':
       board?String(board.displayed_system_picks)+' model selections across '+
           String(board.games_with_picks)+' games · '+
           String(board.original_player_stat_count)+' original stats retained for grading'
         :'No verified selection feed'}</span>
     <button type="button" disabled={loading} onClick={()=>setRevision(n=>n+1)}
       className="flex min-h-11 items-center gap-1 rounded-lg border border-[#303030] px-3 text-xs">
       <RefreshCw size={14}/>Refresh
     </button>
   </div>
   {error&&<p role="alert" className="rounded-xl border border-red-700 p-3 text-xs text-red-200">
     Cannot verify original NBA system picks: {error}. No guesses or substitute bets.</p>}
   {board&&<>
     <div className="flex gap-2 overflow-x-auto pb-1" aria-label="NBA picks game day">
       {['TODAY','ALL',...dates].map(d=><button key={d} type="button"
         aria-pressed={date===d} onClick={()=>{setDate(d);setExpanded(null);}}
         className={'min-h-11 shrink-0 rounded-lg px-3 text-xs font-bold '+
           (date===d?'bg-[#00FF41] text-black':'bg-[#252525] text-gray-300')}>
         {d==='TODAY'?"Today's picks":d==='ALL'?'All upcoming':d.slice(5)}
       </button>)}
     </div>
     <div className="grid grid-cols-5 gap-1" aria-label="NBA model market filter">
       {(['ALL','points','rebounds','assists','three_pointers_made'] as const)
         .map(m=><button key={m} type="button" aria-pressed={market===m}
           onClick={()=>setMarket(m)}
           className={'min-h-11 rounded-md border px-1 text-[10px] font-bold '+
             (market===m?'border-[#00FF41] text-[#00FF41]':'border-[#333] text-gray-400')}>
           {m==='ALL'?'ALL':m==='three_pointers_made'?'3PM':
             m==='points'?'PTS':m==='rebounds'?'REB':'AST'}
         </button>)}
     </div>
     {top.length>0&&date==='TODAY'&&market==='ALL'&&!search.trim()&&
      <div className="rounded-xl border border-[#333] p-3 space-y-2">
        <strong className="text-xs">TODAY'S HIGHEST-RANKED MODEL TARGETS</strong>
        {top.slice(0,3).map(p=><div key={p.id}
          className="rounded-lg bg-[#232323] p-3 text-xs">
          <strong>{p.player} · {p.model_target}</strong>
          <p className="mt-1 text-gray-300">Model prediction {fmt(p.predicted_stat)} {UNIT[p.market]}
            {' · '}P(plays) {pct(p.historical_p_play)}
            {p.model_hit_probability!=null?' · P(hit) '+pct(p.model_hit_probability):' · P(hit) not validated'}</p>
        </div>)}
      </div>}
     {visible.map(g=><section key={g.game_id} data-testid="nba-selected-game"
       className="overflow-hidden rounded-2xl border border-[#303030] bg-[#151515]">
       <button type="button" aria-expanded={expanded===g.game_id}
         onClick={()=>setExpanded(old=>old===g.game_id?null:g.game_id)}
         className="flex min-h-20 w-full items-center gap-3 p-4 text-left">
         <div className="min-w-0 flex-1">
           <h3 className="text-sm font-bold">{g.away} at {g.home}</h3>
           <p className="mt-1 text-[11px] text-gray-400">
             {whenET(g.tipoff_utc)} · {g.picks.length} selected model targets</p>
           <p className="mt-1 text-[10px] text-gray-400">
             Original forecast saved {whenET(g.original_at_utc)} ·
             {' '}Each future game is an independent prediction, not an automatically refreshed live line
           </p>
           <p className="mt-2 text-xs text-gray-200">
             TOP: {g.picks[0].player} · {g.picks[0].model_target}
             {' · '}Projected {fmt(g.picks[0].predicted_stat)} {UNIT[g.picks[0].market]}
           </p>
         </div>
         <ChevronDown size={17} className={(expanded===g.game_id?'rotate-180 ':'')+'text-gray-400'}/>
       </button>
       {expanded===g.game_id&&<div className="space-y-2 border-t border-[#303030] p-3">
         {g.picks.map(p=><NbaShortlistCard key={p.id} pick={p}/>)}
       </div>}
     </section>)}
     {!visible.length&&<p role="status" className="rounded-xl border border-[#303030] p-4 text-xs text-gray-300">
       No NBA model targets passed the historical role, participation, injury,
       and model-margin gates for this game date/filter. No filler bets were added.</p>}
     <p className="text-[10px] text-gray-500">{board.disclosure}</p>
   </>}
 </section>;
}
