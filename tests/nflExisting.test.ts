import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseExistingNfl} from '../src/nfl/existing.ts';
const now=new Date('2026-10-10T23:55:00Z');
function fixture(){
  return {generated_at_utc:'2026-10-10T23:31:05Z',season:2026,week:5,
    picks:[
      {market:'rushing_yards',player:'Runner A',player_id:'a',team:'JAX',opponent:'PHI',kickoff_utc:'2026-10-11T13:30:00Z',
        projected_median:62.4,projected_mean:63.3,projected_low:13.3,projected_high:151,unagraded:true,model_source:'v2_context'},
      {market:'receiving_yards',player:'Receiver B',player_id:'b',team:'PHI',opponent:'JAX',kickoff_utc:'2026-10-11T13:30:00Z',
        projected_median:47.6,projected_mean:48,projected_low:3.6,projected_high:116.3,unagraded:true,model_source:'v2_context'},
      {market:'rushing_yards',player:'Runner C',player_id:'c',team:'PIT',opponent:'IND',kickoff_utc:'2026-10-11T17:00:00Z',
        projected_median:80,projected_mean:81,projected_low:20,projected_high:180,unagraded:true,model_source:'v2_context'},
      {market:'anytime_touchdowns',player:'TD Player',team:'PIT',opponent:'IND',kickoff_utc:'2026-10-11T17:00:00Z',model_prob:.61}
    ]};
}
test('Older weekly projections restore multiple actual game matchups independently of Phase1 deadline snapshots',()=>{
  const s=parseExistingNfl(fixture(),now,{season:2026,week:5});
  assert.equal(s.games.length,2);
  assert.equal(s.projections,3);
  assert.deepEqual(s.games[0].teams,['JAX','PHI']);
  assert.equal(s.games[0].projections.find(p=>p.market==='rushing_yards')?.projected_median,62.4);
  assert.equal(s.games[0].projections.find(p=>p.market==='receiving_yards')?.projected_high,116.3);
  assert.equal(s.games[1].projections[0].projected_median,80);
  assert(s.games[0].projections.every(p=>p.ungraded));
});
test('Does not repurpose scores, TD probabilities or sportsbook odds as median projections',()=>{
  const d=fixture();
  d.picks.push({market:'rushing_yards',player:'Fake',player_id:'z',team:'NYJ',opponent:'CLE',kickoff_utc:'2026-10-11T17:00:00Z',model_prob:.9} as any);
  assert.throws(()=>parseExistingNfl(d,now),/invalid yardage row/);
});
test('Expired data, future timestamps and conflicting week are rejected rather than mixing seasons',()=>{
  assert.throws(()=>parseExistingNfl(fixture(),now,{season:2026,week:4}),/differs/);
  assert.throws(()=>parseExistingNfl(fixture(),new Date('2026-11-03T20:00:00Z')),/expired/);
  const d=fixture();d.generated_at_utc='2026-10-12T23:31:05Z';
  assert.throws(()=>parseExistingNfl(d,now),/future/);
});
test('Rejects fake yard values, contradictory ranges, duplicate outcome or forecasts written after kickoff',()=>{
  const d=fixture();d.picks[0].projected_median=-5;
  assert.throws(()=>parseExistingNfl(d,now),/invalid yardage/);
  const dupe=fixture();dupe.picks.push({...dupe.picks[0]});
  assert.throws(()=>parseExistingNfl(dupe,now),/duplicate/);
  const late=fixture();late.generated_at_utc='2026-10-11T16:00:00Z';
  assert.throws(()=>parseExistingNfl(late,new Date('2026-10-11T16:01:00Z')),/kicked off/);
});
test('Prior local calendar game days are excluded, not served as current games',()=>{
  const doc=fixture();
  doc.picks[0].kickoff_utc='2026-10-09T17:00:00Z';
  const s=parseExistingNfl(doc,now);
  assert.equal(s.projections,2);
});
