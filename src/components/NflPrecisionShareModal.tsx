import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import NflPrecisionGameShareCard from './NflPrecisionGameShareCard';
import {nflPrecisionPosterData,nflPrecisionPosterFilename} from '../nfl/precisionShare';
import type {ExistingNflGame,ExistingYardProjection} from '../nfl/existing';
import {EXPORT_WIDTH,EXPORT_HEIGHT,downloadBlob,renderElementToPng,shareBlob} from '../lib/exportImage';
const control='min-h-11 rounded-xl border border-[#333] px-3 text-xs font-bold disabled:opacity-40';
export default function NflPrecisionShareModal({game,ranked,week,forecastAtUtc,close}:{
 game:ExistingNflGame;ranked:readonly ExistingYardProjection[];
 week:number;forecastAtUtc:string;close:()=>void
}){
 const data=useMemo(()=>nflPrecisionPosterData(game,ranked,week,forecastAtUtc),[game,ranked,week,forecastAtUtc]);
 const posterKey=JSON.stringify(data),filename=nflPrecisionPosterFilename(data);
 const [scale,setScale]=useState(.25),[busy,setBusy]=useState(false);
 const [prepared,setPrepared]=useState<{key:string;blob:Blob}|null>(null);
 const [error,setError]=useState<string|null>(null),[notice,setNotice]=useState<string|null>(null);
 const [retry,setRetry]=useState(0);
 const dialog=useRef<HTMLDialogElement>(null),wrapper=useRef<HTMLDivElement>(null),
  card=useRef<HTMLDivElement>(null),lock=useRef(false);
 const ready=prepared?.key===posterKey;
 const supported=typeof navigator.share==='function'&&typeof navigator.canShare==='function';
 useEffect(()=>{const el=dialog.current!;el.showModal();return()=>el.close();},[]);
 useLayoutEffect(()=>{
   const el=wrapper.current!;
   const update=()=>setScale(Math.min(el.clientWidth/EXPORT_WIDTH,1));
   const observer=new ResizeObserver(update);
   observer.observe(el);update();return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
   let cancelled=false;setPrepared(null);setError(null);setNotice(null);
   if(!data.picks.length)return()=>{cancelled=true;};
   void renderElementToPng(card.current!).then(blob=>{
    if(!cancelled)setPrepared({key:posterKey,blob});
   }).catch(e=>{if(!cancelled)setError('Could not prepare NFL top-10 image: '+String(e));});
   return()=>{cancelled=true;};
 },[posterKey,retry,data.picks.length]);
 async function exportPng(action:'share'|'save'){
  if(lock.current||!ready||!prepared)return;
  lock.current=true;setBusy(true);setError(null);setNotice(null);
  try{
   if(action==='save'){downloadBlob(prepared.blob,filename);setNotice('PNG saved.');}
   else{
    const result=await shareBlob(prepared.blob,filename,navigator,'PROP EDGE NFL TOP 10');
    setNotice(result==='shared'?'Image shared.':result==='cancelled'?'Share cancelled.':'File sharing unavailable. Use SAVE PNG.');
   }
  }catch(e){setError('Unable to export NFL card: '+String(e));}
  finally{lock.current=false;setBusy(false);}
 }
 return createPortal(<dialog ref={dialog} aria-labelledby="nfl-top10-share-title"
  onCancel={e=>{e.preventDefault();if(!lock.current)close();}}
  style={{margin:'auto',padding:16,width:'calc(100% - 16px)',maxWidth:520,
    maxHeight:'96svh',overflowY:'auto',overflowX:'hidden',
    border:'1px solid #343A37',borderRadius:22,background:'#101413',color:'#eee'}}>
  <style>{'dialog[aria-labelledby="nfl-top10-share-title"]::backdrop{background:#000c;backdrop-filter:blur(4px)}'}</style>
  <header className="flex items-center justify-between gap-2">
   <div><h2 id="nfl-top10-share-title" className="text-sm font-bold">NFL · TOP 10 GAME CARD</h2>
    <p className="mt-1 text-xs text-gray-400">{game.away||game.teams[0]} at {game.home||game.teams[1]}</p></div>
   <span className="shrink-0 text-[10px] text-gray-500">{EXPORT_WIDTH} × {EXPORT_HEIGHT}</span>
  </header>
  <p className="mt-3 text-xs text-amber-200">These {data.picks.length} NFL model projections are ranked like NBA V5: P(reaching the displayed rounded MEAN yardage or more), directly from the same 10,000+ simulations. No sportsbook lines, verified game-day active status, DNP-inclusive rates, or forward calibration are implied.</p>
  <div ref={wrapper} data-testid="nfl-top10-share-preview" style={{
    width:'100%',height:EXPORT_HEIGHT*scale,position:'relative',
    overflow:'hidden',borderRadius:10,marginTop:12}}>
   <div style={{position:'absolute',top:0,left:0,width:EXPORT_WIDTH,height:EXPORT_HEIGHT,
    transform:`scale(${scale})`,transformOrigin:'top left'}}>
    <NflPrecisionGameShareCard data={data} cardRef={card}/>
   </div>
  </div>
  <div className="mt-3 grid grid-cols-2 gap-2">
   <button type="button" className={control+' bg-[#79FF48] text-black'}
    disabled={busy||!ready||!supported} onClick={()=>void exportPng('share')}>SHARE IMAGE</button>
   <button type="button" className={control+' text-[#79FF48]'}
    disabled={busy||!ready} onClick={()=>void exportPng('save')}>SAVE PNG</button>
  </div>
  {!supported&&<p className="mt-2 text-[11px] text-gray-400">Native image sharing is unavailable here; SAVE PNG is supported.</p>}
  {!ready&&!error&&data.picks.length>0&&<p role="status" className="mt-2 text-xs text-gray-400">PREPARING IMAGE…</p>}
  {error&&<><p role="alert" className="mt-2 break-words text-xs text-red-300">{error}</p>
   <button type="button" className={control+' mt-3'} onClick={()=>setRetry(n=>n+1)}>RETRY IMAGE</button></>}
  {notice&&<p role="status" className="mt-2 text-xs text-gray-300">{notice}</p>}
  <button type="button" className={control+' mt-3 w-full text-gray-300'} onClick={close} disabled={busy}>CLOSE</button>
 </dialog>,document.body);
}
