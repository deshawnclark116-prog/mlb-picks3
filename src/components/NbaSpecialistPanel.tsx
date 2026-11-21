import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {wholeStatProjection} from '../lib/wholeStatProjection';

type Market='points'|'rebounds'|'assists'|'three_pointers_made';
type Owner='V3'|'V4'|'V5';
type Row={
 game_id:string;team_id:string;player_id:string;player:string;
 market:Market;mean:number;median:number;p10:number;p90:number;
 p_active:number;reported_status:string;model_version:string;
 specialist_model:Owner;specialist_forecast_at_utc:string;
 starter_evidence?:string;
 cdf_lattice:{step:number;cdf:number[]};
 reach_probabilities?:{
   whole_projection:number;probability_if_playing:number;
   probability_including_dnp:number;p_active:number;forward_calibrated:boolean
 };
};
type Game={game_id:string;tipoff_utc:string;home:string;away:string;
 rows:Row[];missing_markets:Market[]};
type Document={schema:string;status:string;research_only:true;official_bets:0;
 no_ensemble_blending:true;no_automatic_model_fallback:true;
 market_assignments:Record<Market,Owner>;games:Game[]};
const MARKETS:Market[]=['points','rebounds','assists','three_pointers_made'];
const LABEL:Record<Market,string>={points:'POINTS',rebounds:'REBOUNDS',
 assists:'ASSISTS',three_pointers_made:'THREES'};
const UNIT:Record<Market,string>={points:'PTS',rebounds:'REB',assists:'AST',three_pointers_made:'3PM'};
const floor:Record<Market,number>={points:6,rebounds:3,assists:2,three_pointers_made:1};
const et=(iso:string)=>new Date(iso).toLocaleString('en-US',
 {timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET';
const dateET=(iso:string)=>new Intl.DateTimeFormat('en-CA',{
 timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'
}).format(new Date(iso));
const pct=(n:number)=>(n*100).toFixed(1)+'%';
function chance(row:Row,whole:number):{value:number|null;includingDnp:boolean}{
 const reach=row.reach_probabilities;
 if(reach&&reach.whole_projection===whole&&
    Number.isFinite(reach.probability_including_dnp)&&
    reach.probability_including_dnp>=0&&reach.probability_including_dnp<=1)
  return {value:reach.probability_including_dnp,includingDnp:true};
 const cdf=row.cdf_lattice?.cdf;
 if(row.cdf_lattice?.step!==1||!Array.isArray(cdf)||!cdf.length)
  return {value:null,includingDnp:false};
 if(whole===0)return {value:1,includingDnp:false};
 const below=whole-1<cdf.length?cdf[whole-1]:1;
 return Number.isFinite(below)?{value:1-below,includingDnp:false}:{value:null,includingDnp:false};
}
type Projection={row:Row;whole:number;prob:number|null;includingDnp:boolean};
function scored(g:Game,market:'ALL'|Market):Projection[]{
 const seen=new Set<string>();
 return g.rows.filter(r=>market==='ALL'||r.market===market).flatMap(row=>{
  const key=[g.game_id,row.team_id,row.player_id,row.market].join('|');
  if(seen.has(key))throw Error('NBA_SPECIALIST_DUPLICATE_PLAYER_STAT');
  seen.add(key);
  if(row.reported_status==='OUT'||!Number.isFinite(row.mean)||row.mean<0)return [];
  const whole=wholeStatProjection(row.mean);
  if(whole<floor[row.market])return [];
  const {value,includingDnp}=chance(row,whole);
  return [{row,whole,prob:value,includingDnp}];
 }).sort((a,b)=>(b.prob??-1)-(a.prob??-1)||
     a.row.player.localeCompare(b.row.player)||a.row.market.localeCompare(b.row.market));
}
export default function NbaSpecialistPanel({search=''}:{search?:string}){
 const [doc,setDoc]=useState<Document|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [selected,setSelected]=useState('AUTO');
 const [market,setMarket]=useState<'ALL'|Market>('ALL');
 const [expanded,setExpanded]=useState<string|null>(null);
 const refresh=useCallback(async()=>{
   setLoading(true);
   try{
    const res=await fetch('/api/nba-specialist?t='+Date.now(),{cache:'no-store'});
    const data=await res.json();
    if(!res.ok)throw Error(data.error||'Specialist projections unavailable');
    if(data.schema!=='NBA_SPECIALIST_MARKET_ROUTER_V1'||
       data.research_only!==true||data.official_bets!==0||
       data.no_ensemble_blending!==true||data.no_automatic_model_fallback!==true||
       !Array.isArray(data.games)||
       data.market_assignments?.points!=='V5'||
       data.market_assignments?.rebounds!=='V3'||
       data.market_assignments?.assists!=='V4'||
       data.market_assignments?.three_pointers_made!=='V3')
      throw Error('NBA_SPECIALIST_UNTRUSTED_MODEL_ROUTING');
    setDoc(data);setError('');
   }catch(e){setDoc(null);setError(e instanceof Error?e.message:String(e));}
   finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  void refresh();
  const timer=setInterval(()=>void refresh(),120000);
  return()=>clearInterval(timer);
 },[refresh]);
 const today=dateET(new Date().toISOString());
 const days=useMemo(()=>[...new Set((doc?.games??[]).map(g=>dateET(g.tipoff_utc)))].sort(),[doc]);
 const auto=days.includes(today)?today:days.find(d=>d>today)??days[0]??today;
 const games=useMemo(()=>(doc?.games??[]).filter(g=>
   (selected==='ALL'||dateET(g.tipoff_utc)===(selected==='AUTO'?auto:selected))&&
   (!search||(g.home+' '+g.away+' '+g.rows.map(r=>r.player).join(' ')).toLowerCase().includes(search.toLowerCase()))
 ),[doc,selected,auto,search]);
 return <section data-testid="nba-specialist-board" className="space-y-3 text-gray-100">
  <div className="flex items-center justify-between gap-2">
   <div><h2 className="text-sm font-black text-[#79FF48]">NBA SYSTEM PICKS · SPECIALIST MODELS</h2>
    <p className="text-[11px] text-gray-400">Primary NBA projection board · one model per stat · no averaging</p></div>
   <button type="button" onClick={()=>void refresh()} disabled={loading}
    className="min-h-10 rounded-lg border border-[#444] px-3 text-xs">Refresh</button>
  </div>
  <div className="grid grid-cols-4 gap-1" aria-label="Specialist market owners">
   {MARKETS.map(m=><div key={m} className="rounded-lg border border-[#3d5343] bg-[#142017] p-2 text-center">
     <p className="text-[10px] text-gray-400">{UNIT[m]}</p>
     <strong className="text-sm text-[#79FF48]">{doc?.market_assignments[m]??({points:'V5',rebounds:'V3',assists:'V4',three_pointers_made:'V3'} as const)[m]}</strong>
   </div>)}
  </div>
  <p className="text-[11px] text-amber-200">Official market assignments selected for the NBA system. Their accuracy advantage is not yet verified on a new full-slate holdout; lineup and probability estimates retain their source-specific uncertainty.</p>
  {loading&&!doc&&<p className="text-xs text-gray-400">Loading original pregame projections…</p>}
  {error&&<p role="alert" className="rounded-lg border border-red-700 p-3 text-xs text-red-200">{error}</p>}
  {doc?.status==='NO_VERIFIED_SPECIALIST_SOURCES'&&
   <p className="text-xs text-amber-200">No verified original specialist predictions available. No model was substituted.</p>}
  {doc&&<>
   <div className="flex gap-2 overflow-x-auto pb-1">
    {['AUTO','ALL',...days].map(d=><button key={d} type="button" aria-pressed={selected===d}
      onClick={()=>{setSelected(d);setExpanded(null);}}
      className={'min-h-10 shrink-0 rounded-lg border px-3 text-xs '+(selected===d?'border-[#79FF48] text-[#79FF48]':'border-[#444] text-gray-300')}>
      {d==='AUTO'?'Next slate':d==='ALL'?'All games':d.slice(5)}</button>)}
   </div>
   <div className="grid grid-cols-5 gap-1" aria-label="Specialist stat filter">
    {(['ALL',...MARKETS] as const).map(m=><button key={m} type="button"
      onClick={()=>setMarket(m)} aria-pressed={market===m}
      className={'min-h-10 rounded-lg border px-1 text-[11px] '+(market===m?'border-[#79FF48] text-[#79FF48]':'border-[#444] text-gray-300')}>
      {m==='ALL'?'ALL':UNIT[m]}</button>)}
   </div>
   {games.map(g=>{
    const picks=scored(g,market),open=expanded===g.game_id;
    return <article key={g.game_id} className="rounded-xl border border-[#383838] bg-[#191919] p-3 space-y-2">
     <button type="button" className="w-full min-h-12 text-left"
      onClick={()=>setExpanded(open?null:g.game_id)} aria-expanded={open}>
      <strong className="text-sm">{g.away} at {g.home}</strong>
      <p className="text-[11px] text-gray-400">{et(g.tipoff_utc)} · {picks.length} model projections · {open?'Hide':'View all'}</p>
      {g.missing_markets.length>0&&<p data-testid="nba-specialist-missing"
        className="text-[11px] text-amber-200">Unavailable model sources: {g.missing_markets.map(m=>UNIT[m]).join(', ')}. No fallback used.</p>}
     </button>
     <div className="grid grid-cols-2 gap-2">
      {picks.slice(0,4).map(p=><div key={p.row.player_id+'|'+p.row.market}
        className="rounded-lg border border-[#39483a] bg-[#101711] p-2">
        <p className="text-[10px] text-gray-400">{UNIT[p.row.market]} · MODEL {p.row.specialist_model}</p>
        <p className="text-sm font-bold">{p.row.player}</p>
        <p className="text-xl font-black text-[#79FF48]">{p.whole} {UNIT[p.row.market]}</p>
        <p className="text-xs">{p.prob===null?'Chance n/a':pct(p.prob)+' to reach '+p.whole+'+'}</p>
        <p className="text-[10px] text-gray-400">{p.includingDnp?'Includes DNP':'Conditional model chance'} · {p.row.starter_evidence==='CONFIRMED_STARTER'?'Verified starter':'Starter not verified'}</p>
       </div>)}
     </div>
     {open&&<div className="space-y-2 border-t border-[#333] pt-2">
      {picks.map(p=><div key={p.row.team_id+'|'+p.row.player_id+'|'+p.row.market}
        data-testid="nba-specialist-projection" className="rounded-lg border border-[#333] p-3 text-xs">
        <strong>{p.row.player} · {LABEL[p.row.market]} · {p.row.specialist_model}</strong>
        <p>Projection {p.whole} {UNIT[p.row.market]} (mean {p.row.mean.toFixed(2)}) · {p.prob===null?'Chance unavailable':pct(p.prob)+' of '+p.whole+'+'}</p>
        <p>P10–P90 {p.row.p10}–{p.row.p90} · P(plays) {pct(p.row.p_active)}</p>
        <p className="text-gray-400">Original {p.row.model_version} · pregame {et(p.row.specialist_forecast_at_utc)}</p>
       </div>)}
      {!picks.length&&<p className="text-xs text-amber-200">No valid forecast in this market. None invented.</p>}
     </div>}
    </article>;
   })}
   {!games.length&&<p className="text-xs text-amber-200">No matching saved pregame forecasts for this date.</p>}
  </>}
  <p className="text-[11px] text-gray-400">Primary system projections, not guaranteed winning bets. Models can use different pregame information cutoffs; displayed chances are not yet calibrated. V2 remains a separate confirmed-lineup experiment.</p>
 </section>;
}
