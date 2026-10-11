import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadCurrentNfl, NFL_GITHUB_PUBLISHED,NFL_RENDER_READONLY} from '../server/nflCurrent.ts';
const now=Date.parse('2026-10-10T23:55:00Z');
const weekly={
  generated_at_utc:'2026-10-10T23:31:05Z',season:2026,week:5,
  scheduled_games:[
    {home_team:'JAX',away_team:'PHI',kickoff_utc:'2026-10-11T13:30:00Z'},
    {home_team:'ARI',away_team:'DET',kickoff_utc:'2026-10-11T20:25:00Z'}
  ],
  picks:[{market:'rushing_yards',player:'Runner A',player_id:'a',team:'PHI',
    opponent:'JAX',kickoff_utc:'2026-10-11T13:30:00Z',
    projected_median:55,projected_mean:57,projected_low:5,projected_high:130}]
};
const asResponse=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status});
test('Live NFL reader fetches GitHub main directly; Render receives zero requests',async()=>{
  const urls:string[]=[];
  const fetcher=async (input:any)=>{urls.push(String(input));return asResponse(weekly)};
  const data=await loadCurrentNfl(fetcher as typeof fetch,()=>now);
  assert.equal(data.origin,'github_main');
  assert.equal((data.document.scheduled_games as any[]).length,2);
  assert.equal(urls.length,1);
  assert(urls[0].startsWith(NFL_GITHUB_PUBLISHED));
  assert(!urls[0].includes('onrender'));
});
test('GH HTTP outage uses only recent and validated Render fallback with provenance',async()=>{
  const urls:string[]=[];
  const fetcher=async(input:any)=>{
    urls.push(String(input));
    return asResponse(urls.length===1?{error:'upstream down'}:weekly,urls.length===1?503:200);
  };
  const data=await loadCurrentNfl(fetcher as typeof fetch,()=>now);
  assert.equal(data.origin,'render_outage_fallback');
  assert(urls[1].startsWith(NFL_RENDER_READONLY));
});
test('A corrupt primary publication fails closed and NEVER masks bad data with Render',async()=>{
  const urls:string[]=[];
  const bad={...weekly,scheduled_games:[...weekly.scheduled_games,...weekly.scheduled_games]};
  const fetcher=async(input:any)=>{urls.push(String(input));return asResponse(bad)};
  await assert.rejects(loadCurrentNfl(fetcher as typeof fetch,()=>now),/duplicated game/);
  assert.equal(urls.length,1);
});
test('A stale outage fallback is rejected, not presented as live NFL model',async()=>{
  let calls=0;
  const stale={...weekly,generated_at_utc:'2026-10-08T02:10:00Z'};
  const fetcher=async()=>++calls===1?asResponse({},503):asResponse(stale);
  await assert.rejects(loadCurrentNfl(fetcher as typeof fetch,()=>now),/older than 36 hours/);
  assert.equal(calls,2);
});
test('A scheduled matchup with no eligible players is valid, not fabricated',async()=>{
  const doc={...weekly,picks:[]};
  const fetcher=async()=>asResponse(doc);
  const data=await loadCurrentNfl(fetcher as typeof fetch,()=>now);
  assert.equal(data.origin,'github_main');
  assert.deepEqual(data.document.picks,[]);
});
