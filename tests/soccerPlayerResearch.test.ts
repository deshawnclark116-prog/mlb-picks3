import test from 'node:test';
import assert from 'node:assert/strict';
import {soccerPlayerResearchHandler} from '../server/soccerPlayerResearch';
const games=Array.from({length:10},(_,i)=>({
 game_id:'g'+i,game_date:'2026-09-'+String(i+1).padStart(2,'0'),
 team_id:'382',team:'MNC',starter:true,minutes:80,shots:3,shots_on_target:1,xg:.3
}));
const query={playerId:'123',teamId:'382',gameId:'5000',date:'2026-10-04'};
const clock=()=>new Date('2026-10-02T13:00:00.000Z');
function make(){
 const calls:string[]=[];
 const fetcher=async(url:RequestInfo|URL,opts?:RequestInit)=>{
  calls.push(String(url));
  assert.equal((opts?.headers as Record<string,string>)['x-api-key'],'secret');
  const obj=String(url).endsWith('get_player_games')?{player_id:'123',games}:{
   game:{game_id:'5000',date:'2026-10-04',starts_at:'2026-10-04T16:00:00Z',status:'scheduled'},
   lineups:[{team_id:'382',starting_xi:[{player_id:'123'},
    ...Array.from({length:10},(_,i)=>({player_id:String(i+1000)}))]}]};
  return {ok:true,status:200,text:async()=>JSON.stringify({data:obj})} as Response;
 };
 const res=()=>({statusCode:200,data:{} as any,
  setHeader(){return this;},status(n:number){this.statusCode=n;return this;},
  json(d:any){this.data=d;return this;}});
 return {calls,fetcher,res};
}
test('not connected / not whitelisted never makes provider call',async()=>{
 const m=make();
 const s=soccerPlayerResearchHandler({allowlist:['123'],clock,fetcher:m.fetcher});
 const r=m.res();await s({query} as never,r as never);
 assert.equal(r.statusCode,503);assert.equal(m.calls.length,0);
});
test('real player minutes, shooting, confirmed pregame XI; strict cache and no official picks',async()=>{
 const m=make();
 const handler=soccerPlayerResearchHandler({allowlist:['123'],key:'secret',
  maxProviderCallsPerDay:2,clock,fetcher:m.fetcher});
 const r=m.res();await handler({query} as never,r as never);
 assert.equal(r.statusCode,200);
 assert.equal(r.data.forecast.lineupState,'CONFIRMED_STARTER');
 assert(r.data.forecast.predictedShots>0);
 assert(r.data.forecast.predictedShotsOnTarget>0);
 assert.equal(r.data.injuryCoverage,'NOT_CONNECTED');
 assert.equal(r.data.officialPicks,0);
 assert.match(r.data.historySha256,/^[a-f0-9]{64}$/);
 const again=m.res();await handler({query} as never,again as never);
 assert.equal(again.statusCode,200);assert.equal(m.calls.length,2);
});
test('same-day and unknown player are rejected before data access',async()=>{
 const m=make();
 const s=soccerPlayerResearchHandler({allowlist:['123'],key:'secret',
   clock,fetcher:m.fetcher});
 const r=m.res();await s({query:{...query,date:'2026-10-02'}} as never,r as never);
 assert.equal(r.statusCode,422);
 const bad=m.res();await s({query:{...query,playerId:'../../admin'}} as never,bad as never);
 assert.equal(bad.statusCode,400);assert.equal(m.calls.length,0);
});
