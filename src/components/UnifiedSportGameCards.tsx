/** Shared NFL-style game layout for the existing CFB, NHL and tennis feeds.
 * Presentation only. Never promote binary fixed-line predictions into numeric
 * player-stat medians, never invent sportsbook verification or odds.
 */
import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ChevronDown,Image} from 'lucide-react';
import {downloadBlob,renderElementToPng,shareBlob,EXPORT_WIDTH,EXPORT_HEIGHT} from '../lib/exportImage';
import {wholeStatEvent,wholeStatProjection,type ExactCountEvent} from '../lib/wholeStatProjection';

export type SportId='CFB'|'NHL'|'TENNIS';
export interface UnifiedPick {
  id:string;player:string;team?:string;market:string;target:string;
  modelProbability:number|null;prediction:number|null;
  predictionKind:'median'|'mean'|'not_published';
  unit:string;confidence?:string;source?:string;
  detail?:string;
  /** Original source CDF P(actual integer stat >= ceil(numerical mean)). */
  projectionChance?:{atLeast:number;probability:number;calibrated:false}|null;
  /** A distinct threshold event calculated from the original frozen SOG distribution. */
  nhlShotMilestone?:{atLeast:number;probability:number;calibrated:false}|null;
  exactCountEvent?:ExactCountEvent|null;
}
export interface UnifiedGame {
  id:string;label:string;when?:string;subtitle?:string;
  sourceLabel:string;picks:UnifiedPick[];
}
const fmt=(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:1});
const pct=(v:number|null)=>v!=null&&Number.isFinite(v)&&v>=0&&v<=1?(v*100).toFixed(1)+'%':'—';
const stamp=(iso?:string)=>{
  if(!iso||!Number.isFinite(Date.parse(iso)))return 'Time unavailable';
  return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(iso))+' ET';
};
const canNumeric=(p:UnifiedPick)=>p.prediction!=null&&Number.isFinite(p.prediction)&&p.prediction>=0;
const unitFor=(n:number,u?:string)=>!u?'':' '+(n===1&&u==='shots'?'shot':u);
const value=(p:UnifiedPick)=>canNumeric(p)?String(wholeStatProjection(p.prediction!))+unitFor(wholeStatProjection(p.prediction!),p.unit):pct(p.modelProbability);
const primaryLabel=(p:UnifiedPick)=>canNumeric(p)?'MODEL PREDICTION · WHOLE NUMBER':'MODEL EVENT PROBABILITY · NO NUMERIC FORECAST';
/** NHL research display filters: exact counts are different events from
 * "at least" milestones, and cannot borrow a 65%-threshold probability. */
export const NHL_RESEARCH_SHORTLIST_MIN_PROB=.65;
export const NHL_EXACT_COUNT_DISPLAY_MIN=.25;
export const NHL_EXACT_COUNT_MIN_SHOTS=1;
export function nhlResearchShortlist(picks:UnifiedPick[]):UnifiedPick[]{
 const eligible=picks.filter(p=>{
  if(p.market==='shots_on_goal'&&canNumeric(p)){
   const e=p.exactCountEvent;
   // A "0 shots" prediction is the most likely whole number for any fringe player, so it always wins
   // an exact-count probability ranking and floods the headline. It is not a useful event to feature.
   return e?.semantics==='EXACT_INTEGER_COUNT'&&
    e.count>=NHL_EXACT_COUNT_MIN_SHOTS&&
    e.count===wholeStatProjection(p.prediction!)&&
    e.probability!=null&&Number.isFinite(e.probability)&&
    e.probability>=NHL_EXACT_COUNT_DISPLAY_MIN&&e.probability<=1;
  }
  return !!p.target&&['moneyline','points','goalie_saves','shots_on_goal'].includes(p.market)&&
   p.modelProbability!=null&&Number.isFinite(p.modelProbability)&&
   p.modelProbability>=NHL_RESEARCH_SHORTLIST_MIN_PROB&&p.modelProbability<=1;
 });
 const chance=(p:UnifiedPick)=>p.market==='shots_on_goal'&&canNumeric(p)?
   p.exactCountEvent?.probability??-1:p.modelProbability??-1;
 const ordered=eligible.sort((a,b)=>chance(b)-chance(a)||
  a.player.localeCompare(b.player)||a.id.localeCompare(b.id));
 const seen=new Set<string>(),out:UnifiedPick[]=[];
 for(const p of ordered){
  const key=[(p.team||'').toUpperCase(),p.player.toLowerCase().trim(),p.market].join('|');
  if(seen.has(key))continue;
  seen.add(key);out.push(p);
 }
 return out.slice(0,10);
}
const projectionLabel=(p:UnifiedPick)=>p.predictionKind==='mean'?'MODEL PROJECTION · MEAN':
  p.predictionKind==='median'?'MODEL PROJECTION · MEDIAN':'NUMERIC PLAYER-STAT PROJECTION';
// Numeric shot-count research has no calibrated hit probability or book line.
 // For NHL SOG-only rows, feature higher projected shot VOLUME ahead of
 // alphabetic order. This is NOT a confidence, accuracy or wager ranking.
const rank=(a:UnifiedPick,b:UnifiedPick)=>Number(canNumeric(b))-Number(canNumeric(a))
  ||(b.modelProbability??-1)-(a.modelProbability??-1)
  ||(canNumeric(a)&&canNumeric(b)&&a.market==='shots_on_goal'&&b.market==='shots_on_goal'
       &&a.modelProbability==null&&b.modelProbability==null
       ? b.prediction!-a.prediction! : 0)
  ||a.player.localeCompare(b.player)||a.id.localeCompare(b.id);

export function PredictionCard({pick,nhlShortlist=false}:{pick:UnifiedPick;nhlShortlist?:boolean}){
 const numeric=canNumeric(pick);
 const actualEvent=numeric?pick.exactCountEvent??wholeStatEvent(pick.prediction!):null;
 const validExact=actualEvent&&actualEvent.semantics==='EXACT_INTEGER_COUNT'&&
  actualEvent.count===wholeStatProjection(pick.prediction!)&&
  actualEvent.probability!=null&&Number.isFinite(actualEvent.probability)&&
  actualEvent.probability>=0&&actualEvent.probability<=1;
 return <article data-testid="unified-sport-projection" className="min-w-0 rounded-xl border border-[#292929] bg-[#1C1C1C] px-3.5 py-3">
  <div data-testid="unified-predicted-stat" className="flex min-w-0 items-center justify-between gap-3">
   <div className="min-w-0">
    <h3 className="break-words text-[16px] font-semibold capitalize leading-snug text-white">{pick.player}</h3>
    <p className="mt-0.5 text-[12px] text-gray-300">{pick.team?pick.team+' · ':''}{pick.market.replaceAll('_',' ').toUpperCase()}</p>
    {pick.confidence&&<span className="mt-1 inline-block rounded-md border border-[#333] px-2 py-0.5 text-[11px] font-bold text-gray-300">{pick.confidence}</span>}
   </div>
   <div className="shrink-0 text-right">
    <strong data-testid="whole-stat-prediction" className="block break-words text-[26px] font-black tabular-nums leading-none text-[#79FF48]">
      {numeric?value(pick):pick.target||'Event forecast'}
    </strong>
    <strong data-testid="whole-stat-exact-probability" className="mt-1.5 block text-[15px] font-bold tabular-nums text-gray-100">
      {numeric?(validExact?pct(actualEvent!.probability):'—'):pct(pick.modelProbability)}
    </strong>
   </div>
  </div>
  <p className="mt-2 text-[12px] leading-snug text-gray-300">
   {numeric?(validExact?'Chance of exactly '+actualEvent!.count+' · uncalibrated model estimate':
     'Exact-count probability unavailable · not inferred from an easier threshold'):
     'Probability of the displayed event · no invented numerical player stat'}
  </p>
 <details className="mt-1 border-t border-[#303030] pt-1 text-[12px] text-gray-300">
   <summary className="flex min-h-10 cursor-pointer items-center justify-between gap-2 text-[12px] font-semibold text-gray-300"><span className="text-[10px] font-normal tracking-wide text-gray-500">{primaryLabel(pick)}</span><span className="shrink-0">Details ▾</span></summary>
   {numeric&&<p className="pb-1">Original {pick.predictionKind==='mean'?'mean':'median'}: {fmt(pick.prediction!)} {pick.unit} · rounded with the .6 rule, unchanged in the underlying model.</p>}
   {pick.source&&<p className="pb-1">Source: {pick.source}</p>}
   {pick.detail&&<p className="pb-1">{pick.detail}</p>}
   {pick.projectionChance&&<p className="pb-1">Separate threshold event: P({pick.projectionChance.atLeast}+ shots) {pct(pick.projectionChance.probability)}. NOT the exact-count probability.</p>}
   {pick.nhlShotMilestone&&<p className="pb-1">Alternative threshold: P({pick.nhlShotMilestone.atLeast}+ shots) {pct(pick.nhlShotMilestone.probability)}. NOT the exact-count probability.</p>}
   {!numeric&&<p className="pb-1">Original model event: {pick.target}. Its probability refers to this event only.</p>}
   <p className="pb-2">Research estimates are not verified future hit rates or sportsbook wagers.</p>
  </details>
 </article>;
}

export function Poster({sport,game,picks,cardRef}:{
 sport:SportId;game:UnifiedGame;picks:UnifiedPick[];cardRef?:React.Ref<HTMLDivElement>;
}){
 const sections=picks.slice(0,6);
 const hasNumeric=sections.some(canNumeric);
 return <div ref={cardRef} data-testid="unified-sport-share-poster" style={{
   width:EXPORT_WIDTH,height:EXPORT_HEIGHT,boxSizing:'border-box',padding:44,
   background:'#090D10',color:'#F0F4F5',fontFamily:'Arial, Helvetica, sans-serif',
   position:'relative',overflow:'hidden',isolation:'isolate'
 }}>
   <div aria-hidden="true" style={{position:'absolute',inset:0,zIndex:-1,
     background:'radial-gradient(ellipse at 8% 15%,#5b1b3255,transparent 45%),radial-gradient(ellipse at 95% 15%,#13697e45,transparent 45%),repeating-linear-gradient(120deg,transparent 0px,transparent 89px,#ffffff04 90px,transparent 92px)'}}/>
   <header style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid #334045',paddingBottom:24}}>
     <strong style={{fontSize:40,letterSpacing:-1}}>PROP <span style={{color:'#79FF48'}}>EDGE</span></strong>
     <div style={{fontSize:17,textAlign:'right'}}>{sport}<p style={{fontSize:12,color:'#9EACB1'}}>PUBLISHED MODEL OUTPUT</p></div>
   </header>
   <div style={{height:248,paddingTop:38,display:'flex',flexDirection:'column',justifyContent:'center',borderBottom:'1px solid #334045'}}>
     <h1 style={{fontSize:51,fontWeight:900,lineHeight:1.05,margin:'0 0 16px',overflowWrap:'anywhere'}}>{game.label}</h1>
     <p style={{fontSize:20,color:'#9EACB1'}}>{stamp(game.when)} {game.subtitle?' · '+game.subtitle:''}</p>
   </div>
   <div style={{height:75,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
     <strong style={{fontSize:25}}>{hasNumeric?'MODEL STAT PROJECTIONS':'MODEL EVENT PROBABILITIES · NO NUMERIC STATS'}</strong>
     <span style={{fontSize:15,color:'#9EACB1'}}>{sections.length} FEATURED · {game.picks.length} AVAILABLE</span>
   </div>
   <section data-testid="unified-poster-core" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'repeat(3, 1fr)',gap:12,height:555}}>
     {sections.map(p=><div key={p.id} style={{minWidth:0,padding:18,border:'1px solid #ffffff20',borderRadius:17,background:'linear-gradient(130deg,#202A30,#11181E)'}}>
       <p style={{fontSize:12,color:'#9EACB1',margin:0}}>{p.team||sport} · {p.market.toUpperCase().replaceAll('_',' ')}</p>
       <strong style={{fontSize:21,display:'block',marginTop:10,overflowWrap:'anywhere'}}>{p.player.toUpperCase()}</strong>
       <p style={{fontSize:11,color:'#A5B1B9',letterSpacing:1.2,margin:'15px 0 2px'}}>{primaryLabel(p)}</p>
       <p style={{fontSize:canNumeric(p)?31:20,color:'#79FF48',fontWeight:900,margin:'0 0 12px',overflowWrap:'anywhere'}}>
         {canNumeric(p)?value(p).toUpperCase():(p.target||'UNSPECIFIED EVENT').toUpperCase()}
       </p>
       <p style={{fontSize:14,color:'#BBD5C3'}}>
         {canNumeric(p)?
           'P(EXACTLY '+wholeStatProjection(p.prediction!)+'): '+pct(p.exactCountEvent?.probability??null):
           'P(EVENT): '+pct(p.modelProbability)}
       </p>

     </div>)}
   </section>
   <footer style={{position:'absolute',bottom:38,left:44,right:44,borderTop:'1px solid #334045',paddingTop:22}}>
     <p style={{fontSize:16,fontWeight:800,color:'#79FF48'}}>{game.sourceLabel.toUpperCase()} · NOT CERTIFIED BETTING PICKS</p>
     <p style={{fontSize:13,lineHeight:1.6,color:'#9EACB1'}}>{hasNumeric?'Numerical projections are assessed against actual player stats, not an automatically selected low threshold. ':'No numerical player-stat forecast was published for the featured players. Percentages are target event probabilities, NOT expected goals, assists, points or shots. '}No verified live sportsbook execution or profitability is claimed.</p>
   </footer>
 </div>;
}

function GameShareModal({sport,game,onClose}:{sport:SportId;game:UnifiedGame;onClose:()=>void}){
 const ranked=useMemo(()=>[...game.picks].sort(rank).slice(0,6),[game]);
 const [scale,setScale]=useState(.25),[ready,setReady]=useState<Blob|null>(null);
 const [error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),wrapper=useRef<HTMLDivElement>(null),card=useRef<HTMLDivElement>(null);
 const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const filename='prop-edge-'+sport.toLowerCase()+'-'+slug(game.label)+'-model.png';
 useEffect(()=>{
   const el=dialog.current;if(!el)return;
   el.showModal();return()=>el.close();
 },[]);
 useLayoutEffect(()=>{
   const el=wrapper.current;if(!el)return;
   const update=()=>setScale(Math.min(el.clientWidth/EXPORT_WIDTH,1));
   const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
   let cancelled=false;setReady(null);
   void renderElementToPng(card.current!).then(blob=>{if(!cancelled)setReady(blob);})
     .catch(err=>{if(!cancelled)setError('Could not prepare image: '+String(err));});
   return()=>{cancelled=true;};
 },[game.id]);
 async function send(action:'save'|'share'){
   if(!ready||busy)return;
   setBusy(true);setError(null);
   try {
     if(action==='save')downloadBlob(ready,filename);
     else {
       const result=await shareBlob(ready,filename);
       if(result==='unsupported')setError('Native sharing unavailable. Use SAVE PNG.');
     }
   }catch(err){setError('Could not export: '+String(err));}
   finally{setBusy(false);}
 }
 return createPortal(<dialog ref={dialog} aria-labelledby="unified-sport-share-title"
    onCancel={e=>{e.preventDefault();if(!busy)onClose();}}
    style={{margin:'auto',padding:16,width:'calc(100% - 16px)',maxWidth:520,maxHeight:'96svh',
      overflowY:'auto',overflowX:'hidden',border:'1px solid #343A37',borderRadius:22,
      background:'#101413',color:'#eee'}}>
   <style>{'dialog[aria-labelledby="unified-sport-share-title"]::backdrop{background:#000c;backdrop-filter:blur(4px)}'}</style>
   <h2 id="unified-sport-share-title" className="text-sm font-bold">CREATE GAME CARD</h2>
   <p className="mt-1 text-xs text-gray-400">{game.label} · {sport}</p>
   <div className="my-3 grid grid-cols-2 gap-2">
     <button aria-pressed="true" className="min-h-11 rounded-xl border border-[#79FF48]/50 bg-[#79FF48]/10 text-[#79FF48] text-xs font-bold">{ranked.some(canNumeric)?'SYSTEM CARD · STAT PROJECTIONS':'MODEL EVENT CARD · NO STAT PROJECTIONS'}</button>
     <button disabled title="No independently verified sportsbook executions" className="min-h-11 rounded-xl border border-[#333] text-gray-500 text-xs font-bold">BETTABLE CARD</button>
   </div>
   <div ref={wrapper} style={{width:'100%',height:EXPORT_HEIGHT*scale,position:'relative',overflow:'hidden',borderRadius:10}}>
     <div style={{position:'absolute',top:0,left:0,width:EXPORT_WIDTH,height:EXPORT_HEIGHT,transform:`scale(${scale})`,transformOrigin:'top left'}}>
       <Poster sport={sport} game={game} picks={ranked} cardRef={card}/>
     </div>
   </div>
   <div className="mt-3 grid grid-cols-2 gap-2">
     <button disabled={!ready||busy} className="min-h-11 rounded-xl bg-[#79FF48] text-black text-xs font-bold disabled:opacity-40" onClick={()=>void send('share')}>SHARE IMAGE</button>
     <button disabled={!ready||busy} className="min-h-11 rounded-xl border border-[#333] text-[#79FF48] text-xs font-bold disabled:opacity-40" onClick={()=>void send('save')}>SAVE PNG</button>
   </div>
   {error&&<p role="alert" className="mt-2 text-xs text-amber-200">{error}</p>}
   {!ready&&!error&&<p role="status" className="mt-2 text-xs text-gray-400">PREPARING IMAGE…</p>}
   <button onClick={onClose} disabled={busy} className="mt-3 min-h-11 w-full rounded-xl border border-[#333] text-gray-400 text-xs font-bold">CLOSE</button>
 </dialog>,document.body);
}
export default function UnifiedSportGameCards({sport,games,prefix}:{
  sport:SportId;games:UnifiedGame[];prefix:string;
}){
 const [expanded,setExpanded]=useState<string|null>(null);
 const [share,setShare]=useState<string|null>(null);
 const [mode,setMode]=useState<'SYSTEM PICKS'|'BETTABLE NOW'|'MODEL BOARD'>('SYSTEM PICKS');
 const matched=games.map(game=>{
   const picks=[...game.picks].sort(rank);
   return {...game,shown:mode==='MODEL BOARD'?picks:mode==='BETTABLE NOW'?[]:
      sport==='NHL'?nhlResearchShortlist(picks):picks.slice(0,10)};
 });
 const visible=mode==='SYSTEM PICKS'&&sport==='NHL'?
   matched.filter(g=>g.shown.length>0):matched;
 return <div data-testid="unified-sport-board" className="space-y-3">
   <div aria-label={sport+' board mode'} className={`mt-2 grid gap-2 ${sport==='NHL'?'grid-cols-2':'grid-cols-3'}`}>
     {(sport==='NHL'?(['SYSTEM PICKS','MODEL BOARD'] as const):(['SYSTEM PICKS','BETTABLE NOW','MODEL BOARD'] as const)).map(m=>
       <button key={m} onClick={()=>{setMode(m);setExpanded(null);}} aria-pressed={mode===m}
         className={`min-h-11 rounded-xl border px-2 text-[12px] font-bold whitespace-nowrap transition-colors ${mode===m?'border-[#79FF48]/80 bg-[#79FF48]/15 text-[#79FF48]':'border-white/10 bg-[#1d2629] text-gray-300'}`}>{sport==='NHL'?(m==='SYSTEM PICKS'?'Best chances':'All projections'):m}</button>)}
   </div>
   {sport==='NHL'&&mode==='SYSTEM PICKS'&&<details data-testid="nhl-research-shortlist-note" className="rounded-xl border border-white/10 bg-[#172321] px-3 text-[13px] leading-relaxed text-gray-300">
     <summary className="min-h-10 cursor-pointer py-2 font-semibold text-gray-200">How these picks are chosen</summary>
     <p className="pb-2">
      One whole-number forecast and its exact-count probability, when supported.
      NHL shots need source-backed P(exact count) ≥ 25% for the research shortlist.
      Separate binary events require ≥ 65%. These are not calibrated hit rates.
      Select All projections for the complete original slate.
     </p>
   </details>}
   {sport==='NHL'&&mode==='SYSTEM PICKS'&&visible.length===0&&games.length>0&&
     <p data-testid="nhl-no-shortlisted-events" className="rounded-xl border border-white/10 bg-[#192326] p-4 text-xs text-slate-300">
       No events meet the research display filters. Select All projections to review every forecast.
     </p>}
   {mode==='BETTABLE NOW'&&<p role="status" className="rounded-xl border border-[#333] p-3 text-xs text-amber-200">No independently verified live sportsbook executions in this feed. Model targets alone are not executable wagers.</p>}
   {visible.map((game,i)=>{
     const opened=expanded===game.id;
     const preview=game.shown[0]||game.picks[0];
     return <section key={game.id} id={prefix+i} data-testid="unified-sport-game"
       className="min-w-0 overflow-hidden rounded-2xl border border-[#292929] bg-[#141414]">
       <div className="flex items-center gap-1 pr-3">
         <button type="button" aria-expanded={opened} aria-controls={'unified-'+prefix+i}
           onClick={()=>setExpanded(old=>old===game.id?null:game.id)}
           className="flex min-h-20 min-w-0 flex-1 items-center gap-3 p-4 text-left">
           <div className="min-w-0 flex-1">
             <div className="flex flex-wrap items-baseline justify-between gap-1">
               <h2 className="break-words text-base font-bold text-white">{game.label}</h2>
               <span className="text-[11px] text-gray-500">{stamp(game.when)}</span>
             </div>
             <p className="mt-2 text-[12px] font-medium text-gray-400">{sport==='NHL'?game.shown.length+(mode==='SYSTEM PICKS'?' stronger modeled events · '+game.picks.length+' total forecasts':' total forecasts'):game.shown.length+' '+mode+' · '+game.sourceLabel}</p>
             {mode!=='BETTABLE NOW'&&preview&&<p className="mt-2 break-words text-[11px] text-gray-300">
     TOP: <span className="text-white">{preview.player}</span> ·
     {canNumeric(preview)?<> {value(preview)} · P(exactly {wholeStatProjection(preview.prediction!)})
      {' '}{pct(preview.exactCountEvent?.probability??null)}</>:
      <> {preview.target} · {pct(preview.modelProbability)}</>}
   </p>}
           </div>
           <ChevronDown size={16} className={`shrink-0 text-gray-500 ${opened?'rotate-180':''}`}/>
         </button>
         <button type="button" aria-label={'Create share card for '+game.label}
           disabled={mode==='BETTABLE NOW'||game.picks.length===0} onClick={()=>setShare(game.id)}
           className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#333] bg-[#1B211E] text-gray-300 disabled:opacity-40"><Image size={18}/></button>
       </div>
       {opened&&<div id={'unified-'+prefix+i} className="space-y-3 border-t border-[#292929] p-3">
         {mode==='BETTABLE NOW'?<p className="p-2 text-xs text-gray-400">No certified sportsbook lines for this game.</p>
           :game.shown.length?game.shown.map(p=><PredictionCard key={p.id} pick={p} nhlShortlist={sport==='NHL'&&mode==='SYSTEM PICKS'}/>)
           :<p className="p-2 text-xs text-gray-400">No model forecasts for the selected filters.</p>}
       </div>}
     </section>;
   })}
   {share&&games.find(g=>g.id===share)&&<GameShareModal
     sport={sport} game={games.find(g=>g.id===share)!} onClose={()=>setShare(null)}/>}
 </div>;
}
