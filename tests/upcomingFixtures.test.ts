import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
  loadUpcomingFixtures,parseEspnFixtures,upcomingFixturesHandler,
  SPORTS,SCHEDULE_SCHEMA
} from '../server/upcomingFixtures.ts';
import UpcomingGamesStrip from '../src/components/UpcomingGamesStrip.tsx';
import {readFileSync} from 'node:fs';

const NOW=new Date('2026-10-24T23:24:00.000Z'); // Saturday 7:24 PM Eastern
const date='2026-10-25T00:15:00.000Z'; // Still Saturday evening Eastern!
function event(id='40101',start=date,status:'pre'|'in'|'post'='pre'){
  return {id,date:start,status:{type:{
    state:status,completed:status==='post',name:status==='post'?
      'STATUS_FINAL':status==='in'?'STATUS_IN_PROGRESS':'STATUS_SCHEDULED'
  }},competitions:[{id,competitors:[
    {homeAway:'away',team:{id:'1',displayName:'First Away'}},
    {homeAway:'home',team:{id:'2',displayName:'Second Home'}}]}]};
}
function fakeFetch(results:Record<string,any>={},errors:string[]=[]){
  const calls:string[]=[];
  const fn=(async(url:string)=>{
    calls.push(url);
    const league=url.split('/sports/')[1].split('/scoreboard')[0];
    if(errors.includes(league))return new Response('blocked',{status:502});
    return Response.json(results[league]??{events:[event('40101')]});
  }) as unknown as typeof fetch;
  return {calls,fn};
}
test('all seven sports use independent verified schedule sources and preserve upcoming game even when ZERO picks exist',async()=>{
  for(const sport of SPORTS){
    const f=fakeFetch();
    const doc=await loadUpcomingFixtures(sport,NOW,f.fn);
    assert.equal(doc.schema,SCHEDULE_SCHEMA);
    assert.equal(doc.sport,sport);
    assert.equal(doc.status,'SOURCE_VERIFIED',sport);
    assert(doc.fixture_count>0,sport);
    assert.equal(doc.fixture_count,doc.fixtures.length);
    assert(doc.fixtures.every(g=>g.prediction_attached===false));
    assert(doc.fixtures.every(g=>g.source==='ESPN_PUBLIC_SCOREBOARD'));
    assert(f.calls.every(u=>u.includes('/scoreboard?')&&u.includes('dates=')&&
      !u.includes('odds')&&!u.includes('bookmaker')));
    assert.equal(f.calls.length,({MLB:1,NFL:1,CFB:2,NHL:1,NBA:1,TENNIS:2,SOCCER:5} as any)[sport]);
  }
});
test('source filters completed, posttip stale, missing kickoff, invalid opponent and out-of-window fixtures',()=>{
  const raw={events:[
    event('next',date),
    event('live','2026-10-24T22:00:00Z','in'),
    event('finished','2026-10-24T15:00:00Z','post'),
    event('past','2026-10-24T12:00:00Z','pre'),
    event('distant','2026-11-06T12:00:00Z'),
    event('undated','garbage'),
    {...event('oneplayer'),competitions:[{id:'solo',competitors:[
      {homeAway:'home',team:{displayName:'Only One'}}]}]}
  ]};
  const fixtures=parseEspnFixtures(raw,'hockey/nhl',NOW,
    new Date(NOW.getTime()+8*86400000));
  assert.deepEqual(fixtures.map(g=>g.event_id),[
    'hockey/nhl:next','hockey/nhl:live']);
  assert(fixtures.every(g=>g.start_utc.endsWith('Z')));
  assert.equal(fixtures[0].away,'First Away');
  assert.equal(fixtures[0].home,'Second Home');
  assert.equal(fixtures[0].status,'scheduled');
  assert.equal(fixtures[1].status,'in_progress');
});
test('ATP and WTA scoreboard tournaments expand into actual singles competitions, not phantom tournament matches',()=>{
  const tour={events:[{
    id:'ATP_TOURNAMENT',date:'2026-10-25T12:00:00Z',
    status:{type:{state:'pre',completed:false}},
    competitions:[
      {id:'match001',date:'2026-10-25T15:00:00Z',
       status:{type:{state:'pre'}},competitors:[
          {athlete:{displayName:'Player A'}},{athlete:{displayName:'Player B'}}]},
      {id:'match002',date:'2026-10-26T17:00:00Z',
       status:{type:{state:'pre'}},competitors:[
          {athlete:{displayName:'Player C'}},{athlete:{displayName:'Player D'}}]}
    ]}]};
  const data=parseEspnFixtures(tour,'tennis/atp',NOW,
    new Date(NOW.getTime()+8*86400000));
  assert.equal(data.length,2);
  assert.notEqual(data[0].event_id,data[1].event_id);
  assert(data.some(f=>f.away==='Player C'||f.home==='Player C'));
});
test('CFB preserves FBS and FCS status with partial-source warning, never falsely reports complete coverage',async()=>{
  const f=fakeFetch({'football/college-football':{events:[event('FBS_1')]}},
    []);const doc=await loadUpcomingFixtures('CFB',NOW,f.fn);
  assert.equal(doc.fixture_count,1); // two groups de-duplicate the real event
  assert.equal(doc.sources_succeeded,2);
  const failer=(async(url:string)=>url.includes('groups=81')?
     new Response('failure',{status:503}):Response.json({events:[event('FBS_1')]})) as typeof fetch;
  const partial=await loadUpcomingFixtures('CFB',NOW,failer);
  assert.equal(partial.status,'PARTIAL_SOURCE');
  assert.equal(partial.sources_succeeded,1);
  assert.equal(partial.fixture_count,1);
  assert(partial.source_errors.some(e=>e.error==='HTTP_503'));
});
test('all source failures say UNAVAILABLE rather than incorrectly reporting no games',async()=>{
  const fn=(async()=>new Response('fail',{status:403})) as typeof fetch;
  const doc=await loadUpcomingFixtures('NHL',NOW,fn);
  assert.equal(doc.status,'SOURCE_UNAVAILABLE');
  assert.equal(doc.sources_succeeded,0);
  assert.equal(doc.fixture_count,0);
  let code=0,payload:any=null;
  const req={params:{sport:'NHL'}} as any;
  const res={setHeader:()=>{},status:(n:number)=>{code=n;return res;},
    json:(o:any)=>{payload=o;return res;}} as any;
  await upcomingFixturesHandler(fn,()=>NOW)(req,res);
  assert.equal(code,502);
  assert.equal(payload.status,'SOURCE_UNAVAILABLE');
});
test('unsupported sport never triggers an ESPN or bookmaker request',async()=>{
  const f=fakeFetch();let code=0;
  const res={setHeader:()=>{},status:(n:number)=>{code=n;return res;},
    json:(_o:any)=>res} as any;
  await upcomingFixturesHandler(f.fn,()=>NOW)(
    {params:{sport:'CRICKET'}} as any,res);
  assert.equal(code,400);
  assert.equal(f.calls.length,0);
});
test('upcoming fixture control is present and collapsed by default, independent of betting board',()=>{
  const html=renderToStaticMarkup(React.createElement(UpcomingGamesStrip,{sport:'NHL'}));
  assert.match(html,/NHL UPCOMING GAMES/);
  assert.match(html,/upcoming-games-nhl/);
  assert.match(html,/Checking/);
});
test('main frontend routes mount upcoming source for every sport and two MLB surfaces',()=>{
  const app=readFileSync('src/App.tsx','utf8');
  const server=readFileSync('server.ts','utf8');
  assert.match(app,/UpcomingGamesStrip/);
  assert.match(app,/activeTab==='TODAY'\|\|activeTab==='GAMES'\?'MLB'/);
  for(const sport of ['NFL','CFB','TENNIS','NHL','NBA','SOCCER'])
    assert(app.includes('"'+sport+'"'));
  assert.match(server,/\/api\/upcoming-fixtures\/:sport/);
});
