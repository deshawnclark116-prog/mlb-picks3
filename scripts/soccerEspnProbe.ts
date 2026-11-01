/** One-shot real source-contract probe: no modeling, no prediction claims.
 * Fetch at most two ESPN requests. Exits nonzero if missing soccer boxscore.
 */
const base='https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/';
const get=async(url:string)=>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);
 try{
  const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'PropEdge-Research-Contract-Check/1.0'}});
  if(!r.ok)throw Error('ESPN HTTP '+r.status+' url='+url+' body='+(await r.text()).slice(0,250));
  return await r.json() as Record<string,unknown>;
 }finally{clearTimeout(timer);}
};
const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10).replace(/-/g,'');
const today=new Date().toISOString().slice(0,10).replace(/-/g,'');
const data=await get(base+'scoreboard?dates='+yesterday+'&limit=100');
const events=Array.isArray(data.events)?data.events as Record<string,unknown>[]:[];
console.log('SOCCER_ESPN_PROBE_SCOREBOARD',JSON.stringify({day:yesterday,events:events.length,
 keys:Object.keys(data),fixtureFields:events[0]?Object.keys(events[0]):[]}));
let event=events.find(e=>{const a=e.status as Record<string,unknown>|undefined;
 return (a?.type as Record<string,unknown>|undefined)?.completed===true});
if(!event){
 const day=new Date(Date.now()-6*86400000).toISOString().slice(0,10).replace(/-/g,'');
 const old=await get(base+'scoreboard?dates='+day+'&limit=100');
 const games=Array.isArray(old.events)?old.events as Record<string,unknown>[]:[];
 event=games.find(e=>((e.status as Record<string,unknown>|undefined)?.type as Record<string,unknown>|undefined)?.completed===true);
}
if(!event||typeof event.id!=='string')throw Error('No finished EPL match available for ESPN contract probe');
const summary=await get(base+'summary?event='+event.id);
const box=summary.boxscore as Record<string,unknown>|undefined;
const players=Array.isArray(box?.players)?box.players as Record<string,unknown>[]:[];
console.log('SOCCER_ESPN_PROBE_SUMMARY',JSON.stringify({
 eventId:event.id,keys:Object.keys(summary),boxscoreKeys:box?Object.keys(box):[],
 playerTeams:players.length,teamPlayerKeys:players[0]?Object.keys(players[0]):[],
 statisticsNames:(players[0]?.statistics as Record<string,unknown>[]|undefined)?.map(z=>({names:z.names,labels:z.labels,
  category:z.name,athleteKeys:Array.isArray(z.athletes)&&z.athletes[0]?Object.keys(z.athletes[0]):[],
  sampleStats:Array.isArray(z.athletes)&&z.athletes[0]?(z.athletes[0] as Record<string,unknown>).stats:null})),
 extraKeys:Object.keys(box||{})
}));
if(players.length===0)throw Error('ESPN soccer summary has no player boxscore; needs alternate source');
