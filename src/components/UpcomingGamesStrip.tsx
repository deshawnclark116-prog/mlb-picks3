import React,{useEffect,useState} from 'react';
import type {Fixture,ScheduleDocument,ScheduleSport} from '../../server/upcomingFixtures.ts';

const clock=(iso:string)=>new Date(iso).toLocaleString('en-US',{
  timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',
  hour:'numeric',minute:'2-digit',hour12:true});
const timestamp=(iso:string)=>new Date(iso).toLocaleTimeString('en-US',{
  timeZone:'America/New_York',hour:'numeric',minute:'2-digit'});
export default function UpcomingGamesStrip({sport}:{sport:ScheduleSport}){
  const [data,setData]=useState<ScheduleDocument|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [expanded,setExpanded]=useState(false);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let alive=true;
    const ctl=new AbortController();
    setLoading(true);setData(null);setError('');
    const run=async()=>{
      try{
        const res=await fetch('/api/upcoming-fixtures/'+sport+'?t='+Date.now(),{
          cache:'no-store',signal:ctl.signal});
        const doc=await res.json() as ScheduleDocument;
        if(!res.ok||doc.schema!=='PROP_EDGE_ALL_SPORTS_UPCOMING_FIXTURES_V1'||
           doc.sport!==sport||!Array.isArray(doc.fixtures)||
           doc.fixture_count!==doc.fixtures.length||
           doc.status==='SOURCE_UNAVAILABLE')
          throw Error('Verified '+sport+' schedule feed unavailable');
        if(alive){setData(doc);setError('');}
      }catch(e){
        if(alive&&!ctl.signal.aborted){
          setData(null);setError('Upcoming fixtures could not be verified. This does not mean no games are scheduled.');
        }
      }finally{if(alive)setLoading(false);}
    };
    void run();
    const interval=setInterval(()=>setRefresh(n=>n+1),4*60*1000);
    return ()=>{alive=false;ctl.abort();clearInterval(interval);};
  },[sport,refresh]);

  return <section data-testid={'upcoming-games-'+sport.toLowerCase()}
    aria-label={sport+' independent upcoming schedule'}
    className="shrink-0 border-b border-[#303030] bg-[#111] text-xs text-stone-200">
    <div className="flex items-center gap-2 px-3 py-2">
      <button type="button" aria-expanded={expanded}
        onClick={()=>setExpanded(v=>!v)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span aria-hidden="true" className="text-[#00FF41]">{expanded?'▾':'▸'}</span>
        <span className="min-w-0 truncate font-semibold">
          {sport} UPCOMING GAMES
        </span>
        <span className="shrink-0 text-[11px] text-gray-400">
          {loading?'Checking…':error?'Source unavailable':
           data?.status==='PARTIAL_SOURCE'?
             String(data.fixture_count)+' · partial':
             String(data?.fixture_count??0)+' verified'}
        </span>
      </button>
      <button type="button" title="Refresh upcoming sports schedule"
        aria-label={'Refresh '+sport+' upcoming fixtures'}
        onClick={()=>setRefresh(v=>v+1)}
        className="shrink-0 rounded-lg border border-[#404040] px-2 py-1 text-gray-200">
        <span aria-hidden="true">↻</span>
      </button>
    </div>
    {expanded&&<div className="max-h-56 overflow-y-auto border-t border-[#303030] px-3 py-2 space-y-2"
      data-testid={'upcoming-games-list-'+sport.toLowerCase()}>
      {error&&<p role="status" className="text-amber-200">{error}</p>}
      {loading&&<p className="text-gray-400">Checking independently scheduled games…</p>}
      {data&&<>
        <p className="text-[10px] text-gray-400">
          ESPN fixture IDs, not published Prop Edge picks. No verified game implies a wager.
          Source checked {timestamp(data.generated_at_utc)} ET.
        </p>
        {data.fixtures.map((f:Fixture)=><div key={f.event_id}
          className="flex items-start justify-between gap-2 rounded-lg bg-[#222] px-3 py-2"
          data-testid="verified-upcoming-fixture">
          <div className="min-w-0">
            <p className="font-semibold break-words">{f.away} at {f.home}</p>
            <p className="text-[10px] text-gray-400">{f.source_league}</p>
          </div>
          <div className="shrink-0 text-right text-[10px]">
            <p>{clock(f.start_utc)} ET</p>
            <p className={f.status==='in_progress'?'text-[#00FF41]':'text-gray-400'}>
              {f.status==='in_progress'?'LIVE':'SCHEDULED'}
            </p>
          </div>
        </div>)}
        {!data.fixtures.length&&<p className="text-amber-200">
          The checked schedule sources returned no upcoming fixtures in this window.
          This can be normal during an offseason; a blank prediction feed is not the source of this result.
        </p>}
        {data.status==='PARTIAL_SOURCE'&&<p className="text-amber-200">
          Some leagues could not be checked. {data.sources_succeeded} of {data.sources_checked}
          {' '}independent schedule sources responded successfully; this is not complete coverage.
        </p>}
      </>}
    </div>}
  </section>;
}
