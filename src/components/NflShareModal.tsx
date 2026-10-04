import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import NflGameShareCard from './NflGameShareCard';
import {gameShareData,shareFilename,type ShareMode} from '../nfl/shareCard';
import type {Horizon,Phase1View} from '../nfl/phase1';
import {downloadBlob,renderElementToPng,shareBlob} from '../lib/exportImage';
const button='min-h-11 rounded-xl border border-[#333] px-3 text-xs font-bold disabled:opacity-40';
export default function NflShareModal({view,gameId,horizon,onClose}:{view:Phase1View;gameId:string;horizon:Horizon;onClose:()=>void}) {
 const [mode,setMode]=useState<ShareMode>('system'),[busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null),[error,setError]=useState<string|null>(null);
 const [scale,setScale]=useState(.25),[clock,setClock]=useState(Date.now);
 const lock=useRef(false),dialog=useRef<HTMLDialogElement>(null),wrapper=useRef<HTMLDivElement>(null),card=useRef<HTMLDivElement>(null);
 const data=useMemo(()=>gameShareData(view,gameId,horizon,mode,clock),[view,gameId,horizon,mode,clock]);
 useEffect(()=>{const el=dialog.current!;el.showModal();const timer=setInterval(()=>{if(!lock.current)setClock(Date.now());},30000);return()=>{clearInterval(timer);el.close();};},[]);
 useLayoutEffect(()=>{const el=wrapper.current!;const update=()=>setScale(Math.min(el.clientWidth/1080,1));const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();},[]);
 async function generate(action:'share'|'save') {
   if(lock.current || !card.current)return;
   lock.current=true;setBusy(true);setError(null);setMessage(null);
   try {
     const blob=await renderElementToPng(card.current),filename=shareFilename(data);
     if(action==='save'){downloadBlob(blob,filename);setMessage('PNG saved.');}
     else{const result=await shareBlob(blob,filename);setMessage(result==='shared'?'Image shared.':result==='cancelled'?'Share cancelled. SAVE PNG remains available.':'File sharing is unavailable here. Use SAVE PNG.');}
   } catch(err){setError(`Could not create/share the image: ${err instanceof Error?err.message:String(err)}. Try SAVE PNG again.`);}
   finally{lock.current=false;setBusy(false);}
 }
 const supported=typeof navigator.share==='function' && typeof navigator.canShare==='function';
 return createPortal(<dialog ref={dialog} aria-labelledby="nfl-share-title" onCancel={e=>{e.preventDefault();if(!lock.current)onClose();}} style={{margin:'auto',padding:16,width:'calc(100% - 16px)',maxWidth:520,maxHeight:'96svh',overflowY:'auto',overflowX:'hidden',border:'1px solid #343A37',borderRadius:22,background:'#101413',color:'#eee'}}>
   <style>{'dialog[aria-labelledby="nfl-share-title"]::backdrop{background:#000c;backdrop-filter:blur(4px)}'}</style>
   <header className="flex items-center justify-between gap-2"><div><h2 id="nfl-share-title" className="text-sm font-bold">CREATE GAME CARD</h2><p className="mt-1 text-xs text-gray-400">{data.game.away} vs {data.game.home} · {horizon}</p></div><span className="text-[10px] text-gray-500">1080 × 1350</span></header>
   <div className="my-3 grid grid-cols-2 gap-2">{(['system','bettable'] as ShareMode[]).map(m=><button key={m} disabled={busy} aria-pressed={mode===m} onClick={()=>{setMode(m);setMessage(null);setError(null);}} className={`${button} ${mode===m?'border-[#79FF48]/50 bg-[#79FF48]/10 text-[#79FF48]':'text-gray-400'}`}>{m.toUpperCase()} CARD</button>)}</div>
   <div ref={wrapper} data-testid="share-preview" style={{width:'100%',height:1350*scale,position:'relative',overflow:'hidden',borderRadius:10}}>
     <div style={{position:'absolute',left:0,top:0,width:1080,height:1350,transform:`scale(${scale})`,transformOrigin:'top left'}}><NflGameShareCard data={data} cardRef={card}/></div>
   </div>
   <div className="mt-3 grid grid-cols-2 gap-2"><button disabled={busy||!supported} onClick={()=>void generate('share')} className={`${button} bg-[#79FF48] text-black`}>{busy?'RENDERING…':'SHARE IMAGE'}</button><button disabled={busy} onClick={()=>void generate('save')} className={`${button} text-[#79FF48]`}>{busy?'RENDERING…':'SAVE PNG'}</button></div>
   {!supported && <p className="mt-2 text-[10px] text-gray-500">Native file sharing unavailable. SAVE PNG works in this browser.</p>}
   {busy && <p role="status" className="mt-2 text-xs text-gray-400">Rendering full-resolution image…</p>}
   {message && <p role="status" className="mt-2 text-xs text-gray-400">{message}</p>}
   {error && <p role="alert" className="mt-2 break-words text-xs text-red-300">{error}</p>}
   <button disabled={busy} onClick={onClose} className={`${button} mt-3 w-full text-gray-400`}>CLOSE</button>
 </dialog>,document.body);
}
