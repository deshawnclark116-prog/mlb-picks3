/** Role corrections are research-only; never reuse old responses on a new slate.
 * This hook is intentionally separate from the authoritative frozen T24/T90
 * publication loader. A correction feed outage is visible, never a fake pick.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseNflRoleResearch, type NflRoleResearch } from './roleResearch';
import type { Phase1View } from './phase1';

export function useNflRoleResearch(view:Phase1View|null) {
  const [data,setData]=useState<NflRoleResearch|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const serial=useRef(0);
  const controller=useRef<AbortController|null>(null);
  const refresh=useCallback(async()=>{
    const request=++serial.current;
    controller.current?.abort();
    if(!view) {
      setData(null);setError(null);setLoading(false);
      return;
    }
    const abort=new AbortController();controller.current=abort;
    setLoading(true);
    try {
      const res=await fetch('/api/nfl-role-research?t='+Date.now(),{
        cache:'no-store',signal:abort.signal,headers:{'Cache-Control':'no-cache'}
      });
      const raw=await res.json();
      if(!res.ok)throw Error(String(raw.details||raw.error||'NFL role research unavailable'));
      const parsed=parseNflRoleResearch(raw,view);
      if(request!==serial.current)return;
      setData(parsed);setError(null);
    }catch(e){
      if(request!==serial.current)return;
      setData(null);
      setError(e instanceof Error?e.message:'NFL role research unavailable');
    }finally{
      if(request===serial.current)setLoading(false);
    }
  },[view]);
  useEffect(()=>{
    void refresh();
    const every=setInterval(()=>void refresh(),60_000);
    return()=>{++serial.current;controller.current?.abort();clearInterval(every)};
  },[refresh]);
  return {data,error,loading,refresh};
}
