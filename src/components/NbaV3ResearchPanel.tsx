import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {RefreshCw,ChevronDown} from 'lucide-react';

type Market='points'|'rebounds'|'assists'|'three_pointers_made';
const MARKETS:Market[]=['points','rebounds','assists','three_pointers_made'];
const NAME:Record<Market,string>={points:'POINTS',rebounds:'REBOUNDS',
 assists:'ASSISTS',three_pointers_made:'THREES'};
const UNIT:Record<Market,string>={points:'PTS',rebounds:'REB',assists:'AST',
 three_pointers_made:'3PM'};
type Forecast={
 player:string;team_id:string;player_id:string;market:Market;
 mean:number;median:number;p10:number;p25:number;p75:number;p90:number;
 p_active:number;exp_opp:number;role_share:number;unc_reasons:string[];
 reported_status:string;
 lineup_label?:string;mean_early?:number;p_active_early?:number;
 model_target:{milestone:number;probability:number;method:string}|null;
};
type Game={game_id:string;away:string;home:string;tipoff_utc:string;
 forecast_at_utc:string;rows_count:number;rows:Forecast[];
 forecast_kind?:string;first_seen_forecast_at_utc?:string};
type Shadow={schema:string;status:string;upcoming_games:number;
 original_games_audited:number;research_only:true;official_bets:0;games:Game[];
 prospective_model_probability_calibration_verified:false;
 sportsbook_lines_required:false};
const pct=(v:number)=>(v*100).toFixed(1)+'%';
const fmt=(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:1});
const dateET=(iso:string)=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',
 year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso));
 const vals=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return vals.year+'-'+vals.month+'-'+vals.day;
};
const et=(iso:string)=>new Date(iso).toLocaleString('en-US',
 {timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',
  minute:'2-digit'})+' ET';

/** A system target is a true V3 model CDF event, NEVER a verified sportsbook
 * wager or current-season calibrated hit rate. Reject known reported OUT.
 * The V3 minutes/usage model supplies the player's role; we do NOT reuse
 * the V2 hard 26-minute gate nor hard-cap at 2 picks per game.
 */
export function v3QualifiedResearchTargets(g:Game):Forecast[]{
 const seen=new Set<string>();
 return g.rows.filter(r=>{
  if(!r.model_target||r.reported_status==='OUT'||r.p_active<.75||
      r.model_target.probability<.65||!Number.isFinite(r.model_target.probability))
    return false;
  const key=[g.game_id,r.team_id,r.player_id,r.market].join('|');
  if(seen.has(key))throw Error('NBA_V3_DUPLICATE_PLAYER_MARKET_OUTCOME');
  seen.add(key);
  return true;
 }).sort((a,b)=>
   (b.model_target?.probability||0)-(a.model_target?.probability||0)||
   b.p_active-a.p_active||
   a.player.localeCompare(b.player)||MARKETS.indexOf(a.market)-MARKETS.indexOf(b.market));
}
function V3Card({row}:{row:Forecast}){
 const t=row.model_target!;
 return <article data-testid="nba-v3-system-pick" className="rounded-xl border border-[#374239] bg-[#101912] p-3 space-y-2">
  <div className="flex items-start justify-between gap-2">
   <div><p className="text-sm font-bold text-white">{row.player}</p>
    <p className="text-[11px] text-gray-400">{NAME[row.market]}</p></div>
   <span className="text-[10px] border border-[#487b54] rounded-lg p-2 font-bold text-[#00FF41]">V3 MODEL TARGET</span>
   {row.lineup_label==='CONFIRMED_IN'&&<span data-testid="nba-v3-lineup-confirmed" className="text-[10px] border border-[#487b54] rounded-lg p-2 font-bold text-white">LINEUP CONFIRMED</span>}
  </div>
  <p data-testid="nba-v3-selected-target" className="text-base font-bold">
   {t.milestone}+ {NAME[row.market]}
  </p>
  <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#32533d] bg-[#102418] p-3">
   <div><p className="text-[10px] text-gray-400">MODEL PROJECTION</p>
    <p className="text-xl font-bold text-white">{fmt(row.mean)} {UNIT[row.market]}</p>
    <p className="text-[10px] text-gray-400">Median {fmt(row.median)}</p></div>
   <div><p className="text-[10px] text-gray-400">ESTIMATED P(HIT)</p>
    <p data-testid="nba-v3-hit-probability" className="text-xl font-bold text-[#00FF41]">{pct(t.probability)}</p>
    <p className="text-[10px] text-amber-200">Not yet forward-calibrated</p></div>
  </div>
  <p className="text-[11px] text-gray-300">
   10th–90th percentile: {fmt(row.p10)}–{fmt(row.p90)} {UNIT[row.market]}
   {' · '}{row.lineup_label==='CONFIRMED_IN'?'Confirmed to play (early P(plays) '+pct(row.p_active_early??row.p_active)+', early projection '+fmt(row.mean_early??row.mean)+')':'Simulated P(plays) '+pct(row.p_active)}
   {' · '}Modeled share of team minutes {pct(row.role_share)}</p>
  <details className="text-[11px] text-gray-400 border-t border-[#343434] pt-2">
   <summary className="min-h-9 cursor-pointer font-bold">MODEL EVIDENCE</summary>
   <p className="mt-1">Pregame NBA V3 shared-minute and opportunity simulation.
    Historical role evidence only. Source status: {row.reported_status}.
    {row.unc_reasons.length?' Uncertainty: '+row.unc_reasons.join(', '):''}
    {' '}This threshold is model-generated, not a verified bookmaker line or certified betting probability.</p>
  </details>
 </article>;
}
export default function NbaV3ResearchPanel({search='',mode='PICKS'}:{
 search?:string;mode?:'PICKS'|'BOARD'
}){
 const [doc,setDoc]=useState<Shadow|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [expanded,setExpanded]=useState<string|null>(null);
 const [day,setDay]=useState('AUTO');
 const [showFilters,setShowFilters]=useState(false);
 const [market,setMarket]=useState<'ALL'|Market>('ALL');
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{
   const r=await fetch('/api/nba-v3-shadow?t='+Date.now(),{cache:'no-store'});
   const x=await r.json();
   if(!r.ok)throw Error(x.error||'Source unavailable');
   if(x.schema!=='NBA_V3_FULL_GAME_DISTRIBUTION_READ_ONLY_V1'||
      x.research_only!==true||x.official_bets!==0||
      x.sportsbook_lines_required!==false||
      x.prospective_model_probability_calibration_verified!==false||
      !Array.isArray(x.games))throw Error('NBA_V3_INVALID_OR_PROMOTED_SOURCE');
   setDoc(x);setError('');
  }catch(e){setError(e instanceof Error?e.message:String(e));setDoc(null);}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  void refresh();
  const id=setInterval(()=>void refresh(),120000);
  return()=>clearInterval(id);
 },[refresh]);
 const today=dateET(new Date().toISOString());
 const dates=useMemo(()=>[...new Set((doc?.games||[]).map(g=>dateET(g.tipoff_utc)))].sort(),[doc]);
 // Always land on a real V3 slate. If all today's games have already
 // started, display tomorrow's first verified pregame forecasts instead
 // of looking empty while real future source records are available.
 const nextSlate=dates.includes(today)?today:dates.find(d=>d>today)||dates[0]||today;
 const all=useMemo(()=>doc?.games.filter(g=>
  (day==='ALL'||(day==='AUTO'?dateET(g.tipoff_utc)===nextSlate:
   day==='TODAY'?dateET(g.tipoff_utc)===today:dateET(g.tipoff_utc)===day))&&
  (!search||(g.home+' '+g.away+' '+g.rows.map(r=>r.player).join(' ')).toLowerCase()
    .includes(search.toLowerCase()))
 )||[],[doc,day,today,nextSlate,search]);
 const number=all.reduce((n,g)=>n+v3QualifiedResearchTargets(g).filter(r=>
  market==='ALL'||r.market===market).length,0);
 return <section className="space-y-3" data-testid="nba-v3-primary-board">
  <div className="flex items-center justify-between gap-2">
   <strong className="text-[13px] text-[#00FF41]">{mode==='PICKS'?'System picks':'Full model board'}</strong>
   <div className="flex items-center gap-2">
    <button type="button" onClick={()=>setShowFilters(v=>!v)} aria-expanded={showFilters}
      className={'min-h-10 rounded-lg border px-3 text-[13px] font-semibold '+(showFilters?'border-[#00FF41] text-[#00FF41]':'border-[#444] text-gray-300')}>Filter</button>
    <button type="button" onClick={()=>void refresh()} disabled={loading}
      aria-label="Refresh NBA V3 forecasts" className="min-h-10 min-w-10 flex items-center justify-center border border-[#444] rounded-lg">
     <RefreshCw size={16}/></button>
   </div>
  </div>
  {loading&&!doc&&<p className="text-xs text-gray-400">Loading frozen original NBA V3 pregame simulations…</p>}
  {error&&<p role="alert" className="border border-red-700 p-3 rounded-lg text-xs text-red-200">
    NBA V3 source unavailable: {error}. No V2 substitution or invented picks.</p>}
  {doc&&doc.status!=='AVAILABLE_RESEARCH_ONLY'&&<p data-testid="nba-v3-no-source"
    className="border border-amber-800/70 p-3 rounded-lg text-xs text-amber-200">
   {doc.status==='NO_FIRSTSEEN_V3_SHADOW_YET'?
    'V3 is the selected frontend model. Its first authentic pregame game distribution has not yet been published; old V2 predictions will NOT be mislabeled as V3.':
    'No upcoming first-seen V3 game distributions are available. Predictions cannot be safely backfilled after tipoff.'}
  </p>}
  {doc&&doc.status==='AVAILABLE_RESEARCH_ONLY'&&<>
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="NBA V3 game date">
      {['AUTO','TODAY','ALL',...dates].map(d=><button type="button" key={d}
       onClick={()=>{setDay(d);setExpanded(null);}} aria-pressed={day===d}
       className={'min-h-10 shrink-0 rounded-lg border px-3 text-xs font-bold '+
        (day===d?'border-[#00FF41] text-[#00FF41]':'border-[#333] text-gray-300')}>
       {d==='AUTO'?'Next slate':d==='TODAY'?"Today's games":d==='ALL'?'All upcoming':d.slice(5)}
      </button>)}
    </div>
    {showFilters&&<div className="grid grid-cols-5 gap-1" aria-label="NBA V3 market filter">
    {(['ALL',...MARKETS] as const).map(m=><button type="button" key={m}
      onClick={()=>setMarket(m)} aria-pressed={market===m}
      className={'min-h-10 rounded-md border px-1 text-[10px] font-bold '+
        (market===m?'border-[#00FF41] text-[#00FF41]':'border-[#333] text-gray-400')}>
      {m==='ALL'?'ALL':UNIT[m]}</button>)}
    </div>}
    {!all.length&&<p className="text-xs text-gray-400">No first-seen V3 forecasts on the selected date.
      Select another date or All upcoming. No old-model picks are substituted.</p>}
    {all.map(g=>{
      const selected=v3QualifiedResearchTargets(g).filter(r=>
        market==='ALL'||r.market===market);
      const every=g.rows.filter(r=>market==='ALL'||r.market===market);
      const shown=mode==='PICKS'?selected:every;
      const open=expanded===g.game_id;
      return <article key={g.game_id} data-testid="nba-v3-game"
        className="rounded-xl border border-[#333] bg-[#191919] overflow-hidden">
        <button type="button" aria-expanded={open}
          onClick={()=>setExpanded(open?null:g.game_id)}
          className="w-full min-h-20 p-3 flex items-center justify-between text-left gap-2">
          <div>
           <strong className="text-sm text-white">{g.away} at {g.home}</strong>
           <p className="mt-1 text-[11px] text-gray-400">{et(g.tipoff_utc)}
             {' · '}{selected.length} model targets{' · '}{every.length} stat projections</p>
           {selected[0]&&<p className="mt-1 text-[11px] text-gray-200">
             TOP: {selected[0].player} · {selected[0].model_target!.milestone}+
             {' '}{NAME[selected[0].market]} · {pct(selected[0].model_target!.probability)}
           </p>}
           <p className="mt-1 text-[10px] text-gray-500">{g.forecast_kind==='LATEST_RUN'
             ?<>Latest run {et(g.forecast_at_utc)}{' · '}first forecast {et(g.first_seen_forecast_at_utc||g.forecast_at_utc)}</>
             :<>V3 first observed {et(g.forecast_at_utc)}</>}
             {' · '}No verified bookmaker line</p>
          </div>
          <ChevronDown className={'text-gray-400 '+(open?'rotate-180':'')} size={18}/>
        </button>
        {shown.length>0&&<div data-testid="nba-v3-tiles" className="grid grid-cols-2 gap-2 px-3 pb-3">
          {shown.slice(0,4).map(r=><div key={r.player_id+r.market} data-testid="nba-v3-tile" className="min-w-0 rounded-xl border border-white/10 bg-[#12181b] p-3">
            <p className="truncate text-[11px] text-gray-400">{NAME[r.market]}</p>
            <p className="mt-0.5 break-words text-[15px] font-bold leading-snug text-white">{r.player}</p>
            <p className="mt-2 text-[26px] font-black leading-none tabular-nums text-[#79FF48]">{fmt(r.mean)} <span className="text-[14px] font-bold">{UNIT[r.market]}</span></p>
            {r.model_target&&<p className="mt-1.5 text-[13px] font-bold tabular-nums text-gray-100">{r.model_target.milestone}+ · {pct(r.model_target.probability)}</p>}
            <p className="mt-0.5 text-[11px] text-gray-400">{r.model_target?'Target and chance':'Projection'} · P(plays) {pct(r.p_active)}</p>
          </div>)}
        </div>}
        {open&&<div className="p-3 border-t border-[#333] space-y-2">
         {mode==='PICKS'?shown.map(r=><V3Card key={g.game_id+'|'+r.team_id+'|'+r.player_id+'|'+r.market} row={r}/>):
          shown.map(r=><div key={g.game_id+'|'+r.team_id+'|'+r.player_id+'|'+r.market}
             data-testid="nba-v3-stat-projection" className="rounded-lg border border-[#383838] p-3 space-y-1 text-xs">
            <strong>{r.player} · {NAME[r.market]}</strong>
            <p>Mean {fmt(r.mean)} {UNIT[r.market]} · Median {fmt(r.median)}
             {' · '}P10–P90 {fmt(r.p10)}–{fmt(r.p90)}</p>
            <p>P(plays) {pct(r.p_active)}
              {r.model_target?' · Model target '+r.model_target.milestone+'+ · P(hit) '+
               pct(r.model_target.probability)+' (unvalidated)':' · No 65%+ V3 milestone'}</p>
            <p className="text-gray-400">{r.unc_reasons.join(', ')}</p>
          </div>)}
         {!shown.length&&<p className="text-xs text-amber-200">
           This game's frozen V3 player outcomes have no model target passing the
           participation and 65% simulation gates for this market. No forced selection.</p>}
        </div>}
      </article>;
    })}
  </>}
  <details data-testid="nba-v3-about" className="rounded-xl border border-[#00FF41]/30 bg-[#0e2115] px-3 text-[13px] leading-relaxed text-gray-300">
   <summary className="min-h-10 cursor-pointer py-2 font-semibold text-gray-200">About these numbers <span className="font-normal text-amber-200">· research estimates, not yet calibrated</span></summary>
   <p className="pb-2">Basketball-specific role, team-minute allocation, shot opportunities and full-game probability distributions.</p>
   <p className="text-amber-200 font-bold">MODEL-ESTIMATED P(HIT) · NOT YET PROSPECTIVELY CALIBRATED OR A BOOKMAKER BET.</p>
   <p className="text-gray-400">This is V3, not recycled V2 projections. All original V2 predictions stay in the archive for paired grading.</p>
  {doc&&<div className="pb-2 text-xs text-gray-400">
   {day==='AUTO'?'Next available: '+nextSlate+' · ':''}{all.length} matching V3 game forecasts · {mode==='PICKS'?number+' model research targets':
       all.reduce((n,g)=>n+g.rows.length,0)+' numerical projections'}
   {' · '}{doc.original_games_audited} original games audited
  </div>}
  </details>
 </section>;
}
