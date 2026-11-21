import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 SUPPLEMENTAL_SOCCER_LEAGUES,SUPPLEMENTAL_SOCCER_SCHEMA,
 readSupplementalNextEvent,validateSupplementalSnapshot
} from '../src/soccer/supplementalSource';
import {supplementaryLeagueNames,supplementalUpcoming} from '../src/soccer/supplementalAssets';
const source='2026-11-20T23:15:00.000Z';
const league=SUPPLEMENTAL_SOCCER_LEAGUES.find(l=>l.providerLeagueId==='4497')!;
const good={events:[{idEvent:'2606501',idLeague:'4497',strSport:'Soccer',
 strStatus:'NS',dateEvent:'2026-11-21',strTime:'01:40:00',
 strHomeTeam:'Deportivo Cali',strAwayTeam:'Millonarios'}]};
test('independent fixture source includes all five screenshot omissions',()=>{
 assert.equal(SUPPLEMENTAL_SOCCER_LEAGUES.length,5);
 for(const wanted of ['Nicaraguan Primera División','Colombian Primera A',
  'Costa Rican Primera División','South Korean K2 League','Australian Championship'])
  assert(Object.values(supplementaryLeagueNames).includes(wanted));
 assert.equal(new Set(SUPPLEMENTAL_SOCCER_LEAGUES.map(l=>l.providerLeagueId)).size,5);
 assert.deepEqual(supplementalUpcoming('2026-11-21T00:00:00.000Z'),[]);
});
test('true Friday-night local fixture uses independent UTC timestamp, no guessed ET dates',()=>{
 const result=readSupplementalNextEvent(good,league,source);
 assert.equal(result.length,1);
 assert.equal(result[0].kickoffUtc,'2026-11-21T01:40:00Z');
 assert.equal(result[0].date,'2026-11-21');
 assert.equal(result[0].league,'COL_1_primera-a');
 assert.equal(result[0].coverage,'PARTIAL_NEXT_EVENT_ONLY');
 assert.equal(result[0].providerStatus,'NS');
});
test('completed, underway, postponed, other sport, or wrong league never become upcoming soccer predictions',()=>{
 for(const status of ['FT','1H','2H','PST','CANC','AET','HT']){
  const v=readSupplementalNextEvent({events:[{...good.events[0],
    strStatus:status}]},league,source);
  assert.equal(v.length,0);
 }
 assert.throws(()=>readSupplementalNextEvent({events:[{...good.events[0],
  idLeague:'4806'}]},league,source),/WRONG_COMPETITION/);
 assert.throws(()=>readSupplementalNextEvent({events:[{...good.events[0],
  strSport:'Basketball'}]},league,source),/WRONG_SPORT/);
 assert.throws(()=>readSupplementalNextEvent({events:[{...good.events[0],
  strTime:'88:23:00'}]},league,source),/INVALID_FIXTURE/);
 assert.throws(()=>readSupplementalNextEvent({events:[
  good.events[0],good.events[0]]},league,source),/DUPLICATED_EVENT/);
});
test('supplemental sources never claim full worldwide fixture list, calibrated probabilities, or official bets',()=>{
 const fixtures=readSupplementalNextEvent(good,league,source);
 const status=SUPPLEMENTAL_SOCCER_LEAGUES.map(x=>({
  league:x.league,name:x.name,providerLeagueId:x.providerLeagueId,
  status:'SOURCE_UNAVAILABLE' as const,count:0
 }));
 const sample={schema:SUPPLEMENTAL_SOCCER_SCHEMA,generated_at_utc:source,
  coverage:'FIVE_EXPLICIT_MISSING_LEAGUES_PARTIAL_NEXT_EVENT_ONLY',
  competitions:status,fixtures,guardrails:{
   official_bets:0 as const,calibrated:false as const,
   historical_model_ready:false as const,
   exact_kickoff_independently_confirmed:false as const,
   all_league_fixtures_claimed:false as const
  }};
 const v=validateSupplementalSnapshot(sample);
 assert.equal(v.fixtures.length,1);
 assert.throws(()=>validateSupplementalSnapshot({...sample,
    guardrails:{...sample.guardrails,calibrated:true}}),/INVALID_SNAPSHOT/);
 assert.throws(()=>validateSupplementalSnapshot({...sample,
    fixtures:[fixtures[0],fixtures[0]]}),/DUPLICATE_EVENT/);
});
