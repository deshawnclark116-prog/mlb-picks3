import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import NflExistingShareCard from './NflExistingShareCard';
import {existingMatchup,type ExistingNflGame} from '../nfl/existing';
import {downloadBlob,renderElementToPng,shareBlob} from '../lib/exportImage';
import {verifiedNflSelections,type LiveMarketResponse} from '../nfl/verifiedMarkets';
import {roleSupportedNflProjections,type NflRoleSnapshot} from '../nfl/roleSupportedNfl';
const button='min-h-11 rounded-xl border border-[#333] px-3 text-xs font-bold disabled:opacity-40';
type Props={game:ExistingNflGame;week:number;forecastGeneratedAtUtc:string;onClose:()=>void};
export default function NflExistingShareModal({game,week,forecastGeneratedAtUtc,onClose}:Props){
 const [mode,setMode]=useState<'system'|'bettable'>('system'),[busy,setBusy]=useState(false);
 const [scale,setScale]=useState(.25),[message,setMessage]=useState<string|null>(null),[error,setError]=useState<string|null>(null);
 const [prepared,setPrepared]=useState<{key:string;blob:Blob;filename:string}|null>(null),[retry,setRetry]=useState(0);
 const [markets,setMarkets]=useState<LiveMarketResponse|null>(null);
 const [checking,setChecking]=useState(true);
 const [role,setRole]=useState<NflRoleSnapshot|null>(null);
 const [roleChecking,setRoleChecking]=useState(true);
 useEffect(()=>{
   const controller=new AbortController();
   setRole(null);setRoleChecking(true);
   fetch('/api/nfl-role-snapshot',{cache:'no-store',signal:controller.signal})
     .then(async r=>r.ok?await r.json():null)
     .then((data:NflRoleSnapshot|null)=>{if(!controller.signal.aborted)setRole(data)})
     .catch(()=>{if(!controller.signal.aborted)setRole(null)})
     .finally(()=>{if(!controller.signal.aborted)setRoleChecking(false)});
   return()=>controller.abort();
 },[game.id,forecastGeneratedAtUtc]);
 useEffect(()=>{
   if(!game.home||!game.away){
     setMarkets({status:'SCHEDULE_NOT_CONFIRMED',lines:[]});setChecking(false);return;
   }
   const controller=new AbortController();
   setChecking(true);setMarkets(null);
   fetch('/api/nfl-live-markets?'+new URLSearchParams({home:game.home,away:game.away}).toString(),
       {cache:'no-store',signal:controller.signal})
    .then(async r=>r.ok?await r.json():{status:'ODDS_PROVIDER_UNAVAILABLE',lines:[]})
    .then((doc:LiveMarketResponse)=>{if(!controller.signal.aborted)setMarkets(doc)})
    .catch(()=>{if(!controller.signal.aborted)setMarkets({status:'ODDS_PROVIDER_UNAVAILABLE',lines:[]})})
    .finally(()=>{if(!controller.signal.aborted)setChecking(false)});
   return()=>controller.abort();
 },[game.id,game.home,game.away]);
 const marketMatched=useMemo(()=>verifiedNflSelections(game,markets),[game,markets]);
 const featured=useMemo(()=>roleSupportedNflProjections(
   game,markets,role,forecastGeneratedAtUtc),[game,markets,role,forecastGeneratedAtUtc]);
 // No official Bettable Card until line-specific, role-conditioned probabilities
 // are genuinely calibrated against market outcomes. A median crossing the
 // offered line, even by 17 yards, is not a validated betting edge.
 const selections=mode==='system'?featured:[];
 const hasListedMarkets=selections.length>0;
 const key=useMemo(()=>JSON.stringify({id:game.id,week,mode,selections,checked:markets?.checked_at_utc,
   status:markets?.status,roleChecked:role?.captured_at_utc}),[game.id,week,mode,markets,selections,role]);
 const ready=prepared?.key===key;
 const lock=useRef(false),dialog=useRef<HTMLDialogElement>(null),wrapper=useRef<HTMLDivElement>(null),card=useRef<HTMLDivElement>(null);
 const slug=(x:string)=>x.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const filename=`prop-edge-${slug(game.away||game.teams[0])}-${slug(game.home||game.teams[1])}-existing-${mode}-w${String(week).padStart(2,'0')}.png`;
 useEffect(()=>{
  let cancelled=false;setPrepared(null);setError(null);setMessage(null);
  if(checking||roleChecking||!hasListedMarkets)return;
  void renderElementToPng(card.current!).then(blob=>{
   if(!cancelled)setPrepared({key,blob,filename});
  }).catch(e=>{
   if(!cancelled)setError('Could not prepare the image: '+String(e));
  });
  return()=>{cancelled=true;};
 },[key,retry,checking,roleChecking,hasListedMarkets]);
 useEffect(()=>{
  const el=dialog.current!;el.showModal();
  return()=>el.close();
 },[]);
 useLayoutEffect(()=>{
  const el=wrapper.current!;
  const update=()=>setScale(Math.min(el.clientWidth/1080,1));
  const observer=new ResizeObserver(update);observer.observe(el);update();
  return()=>observer.disconnect();
 },[]);
 async function exportCard(action:'save'|'share'){
  if(lock.current||!ready||!prepared)return;
  lock.current=true;setBusy(true);setError(null);setMessage(null);
  try{
   if(action==='save'){downloadBlob(prepared.blob,prepared.filename);setMessage('PNG saved.');}
   else{
    const result=await shareBlob(prepared.blob,prepared.filename);
    setMessage(result==='shared'?'Image shared.':result==='cancelled'?'Share cancelled. SAVE PNG remains available.':'File sharing unavailable here. Use SAVE PNG.');
   }
  }catch(e){setError('Could not share/save image: '+String(e));}
  finally{lock.current=false;setBusy(false);}
 }
 const supported=typeof navigator.share==='function'&&typeof navigator.canShare==='function';
 return createPortal(<dialog ref={dialog} aria-labelledby="nfl-existing-share-title"
  onCancel={e=>{e.preventDefault();if(!lock.current)onClose();}}
  style={{margin:'auto',padding:16,width:'calc(100% - 16px)',maxWidth:520,maxHeight:'96svh',overflowY:'auto',overflowX:'hidden',border:'1px solid #343A37',borderRadius:22,background:'#101413',color:'#eee'}}>
  <style>{'dialog[aria-labelledby="nfl-existing-share-title"]::backdrop{background:#000c;backdrop-filter:blur(4px)}'}</style>
  <header className="flex items-center justify-between gap-2"><div>
    <h2 id="nfl-existing-share-title" className="text-sm font-bold">CREATE GAME CARD</h2>
    <p className="mt-1 text-xs text-gray-400">{existingMatchup(game)} · Existing weekly model</p>
   </div><span className="text-[10px] text-gray-500">1080 × 1350</span></header>
  <div className="my-3 grid grid-cols-2 gap-2">{(['system','bettable'] as const).map(m=>
   <button key={m} aria-pressed={mode===m} disabled={busy} onClick={()=>setMode(m)}
    className={`${button} ${mode===m?'border-[#79FF48]/50 bg-[#79FF48]/10 text-[#79FF48]':'text-gray-400'}`}>
    {m.toUpperCase()} CARD</button>)}</div>
  <div ref={wrapper} data-testid="share-preview" style={{width:'100%',height:1350*scale,position:'relative',overflow:'hidden',borderRadius:10}}>
    <div style={{position:'absolute',left:0,top:0,width:1080,height:1350,transform:`scale(${scale})`,transformOrigin:'top left'}}>
      <NflExistingShareCard game={game} week={week} mode={mode} cardRef={card}
        selections={selections} sourceStatus={mode==='bettable'?'NO_CALIBRATED_BETS':role?.status||markets?.status||'CHECKING'}
        checkedAt={markets?.checked_at_utc}/>
    </div>
  </div>
  <p data-testid="verified-nfl-quote-status" role="status" className="mt-2 text-xs text-gray-300">
    {checking||roleChecking?'Checking live FanDuel lines and pregame role evidence…':
      `${marketMatched.length} market-matched lines · ${featured.length} role-supported projections · NO CALIBRATED BETS.`}
    {' '}Roster listing does not confirm starting/active status.
  </p>
  <div className="mt-3 grid grid-cols-2 gap-2"><button disabled={busy||!ready||!supported||!hasListedMarkets} onClick={()=>void exportCard('share')} className={`${button} bg-[#79FF48] text-black`}>SHARE IMAGE</button>
    <button disabled={busy||!ready||!hasListedMarkets} onClick={()=>void exportCard('save')} className={`${button} text-[#79FF48]`}>SAVE PNG</button></div>
  {!supported&&<p className="mt-2 text-[10px] text-gray-500">Native file sharing unavailable. SAVE PNG works in this browser.</p>}
  {!ready&&!error&&hasListedMarkets&&<p role="status" className="mt-2 text-xs text-gray-400">PREPARING IMAGE…</p>}
  {!checking&&!roleChecking&&!hasListedMarkets&&<p className="mt-2 text-xs text-amber-300">
    {mode==='bettable'?'No independently calibrated model edge is available for this game. This betting card cannot be exported as a recommended wager.':
      'No model projection passed both live market matching and recent role-evidence checks. Missing or stale role receipts never default to HIGH confidence.'}
  </p>}
  {error&&<><p role="alert" className="mt-2 text-xs text-red-300">{error}</p><button className={`${button} mt-2`} onClick={()=>setRetry(n=>n+1)}>RETRY IMAGE</button></>}
  {message&&<p role="status" className="mt-2 text-xs text-gray-400">{message}</p>}
  <button disabled={busy} onClick={onClose} className={`${button} mt-3 w-full text-gray-400`}>CLOSE</button>
 </dialog>,document.body);
}
