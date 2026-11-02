const get=async(url)=>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error('ESPN '+r.status+' '+url);return await r.json();}
 finally{clearTimeout(timer);}
};
const base='https://site.api.espn.com/apis/site/v2/sports/football/nfl/';
const d=await get(base+'scoreboard?dates=20261101&limit=100');
const events=d.events||[];
console.log('NFL_20261101_SCOREBOARD',JSON.stringify({n:events.length,games:events.map(x=>({id:x.id,name:x.name,date:x.date,status:x.status?.type?.name,teams:x.competitions?.[0]?.competitors?.map(c=>({id:c.team.id,abbr:c.team.abbreviation,homeAway:c.homeAway,score:c.score}))}))}));
let sample=events.find(e=>e.name?.includes('Baltimore Ravens')&&e.name?.includes('Buffalo Bills'))||events[0];
if(!sample)throw Error('No games');
const s=await get(base+'summary?event='+sample.id);
const teams=s.boxscore?.players||[];
console.log('NFL_BOX_SCHEMA',JSON.stringify({game:sample.name,keys:Object.keys(s),boxKeys:Object.keys(s.boxscore||{}),teams:teams.length,
 teamFields:Object.keys(teams[0]||{}),
 team:teams[0]?.team, categories:teams[0]?.statistics?.map(z=>({
 name:z.name,keys:Object.keys(z),labels:z.labels,names:z.names,
 firstAthlete:z.athletes?.slice(0,2)}))}).slice(0,19000));
