import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ExistingNflGame,ExistingYardProjection} from '../src/nfl/existing.ts';
import {verifiedNflSelections,type LiveMarketResponse} from '../src/nfl/verifiedMarkets.ts';
const when=Date.parse('2026-10-11T12:00:00Z');
const kickoff='2026-10-11T13:30:00Z';
const p=(player:string,confidence:ExistingYardProjection['confidence'],games:number,median:number,market:ExistingYardProjection['market']='receiving_yards'):ExistingYardProjection=>({
 player,team:'JAX',opponent:'PHI',market,kickoff_utc:kickoff,
 projected_median:median,projected_mean:median,projected_low:0,projected_high:median*3,
 model_source:'blended_sim',ungraded:true,player_id:player,confidence,games_played:games
});
const players=[
 p('High without a book','HIGH',12,80),
 p('Lower but on sportsbook','LOW',10,18),
 p('Higher on sportsbook','HIGH',6,41),
 p('Medium with book','MEDIUM',15,30,'rushing_yards')
];
const game:ExistingNflGame={id:'2026_05_PHI_JAX',kickoff_utc:kickoff,teams:['JAX','PHI'],
 home:'JAX',away:'PHI',projections:players};
const quote=(player:string,market:'rushing_yards'|'receiving_yards',line:number)=>{
 return {player,market,line,over_price:-115,under_price:-105,book:'fanduel',
 market_updated_at_utc:'2026-10-11T11:55:00Z',home:'JAX',away:'PHI',kickoff_utc:kickoff};
};
const live:LiveMarketResponse={status:'VERIFIED_QUOTES',checked_at_utc:'2026-10-11T11:57:00Z',lines:[
 quote('Lower but on sportsbook','receiving_yards',20.5),
 quote('Higher on sportsbook','receiving_yards',34.5),
 quote('Medium with book','rushing_yards',25.5)
]};
test('only verified book-listed markets rank, never the HIGH grade without a book',()=>{
 const results=verifiedNflSelections(game,live,when);
 assert.deepEqual(results.map(x=>x.projection.player),[
  'Higher on sportsbook','Medium with book','Lower but on sportsbook']);
 assert.equal(results.length,3);
 assert.equal(results[0].side,'OVER');
 assert.equal(results[2].side,'UNDER');
 assert(!results.some(x=>x.projection.player==='High without a book'));
});
test('book timestamp stale, different kickoff, different team, mismatched market all reject',()=>{
 for(const [change] of [
  [(q:any)=>{q.checked_at_utc='2026-10-11T11:45:00Z'}],
  [(q:any)=>{q.lines[0].home='PHI'}],
  [(q:any)=>{q.lines[0].market_updated_at_utc='2026-10-11T11:00:00Z'}],
  [(q:any)=>{q.lines[0].kickoff_utc='2026-10-11T20:25:00Z'}],
  [(q:any)=>{q.lines[0].book='draftkings'}]
 ]) {
  const v=structuredClone(live);
  change(v);
  assert.equal(verifiedNflSelections(game,v,when).length,change.toString().includes('checked_at_utc')?0:2);
 }
});
test('never supply bettor six fake cards when source fails or no props',()=>{
 assert.deepEqual(verifiedNflSelections(game,{status:'ODDS_PROVIDER_UNAVAILABLE',lines:[]},when),[]);
 assert.deepEqual(verifiedNflSelections(game,null,when),[]);
 assert.deepEqual(verifiedNflSelections(game,{...live,lines:[]},when),[]);
 assert.deepEqual(verifiedNflSelections(game,live,Date.parse(kickoff)),[]);
 const noGame:{[key:string]:any}={...game,home:undefined};
 assert.deepEqual(verifiedNflSelections(noGame as ExistingNflGame,live,when),[]);
});
test('no duplicate/ambiguous sportsbook outcome; no median-equals-line directional bet',()=>{
 const duplicate={...live,lines:[...live.lines,live.lines[1]]};
 assert.equal(verifiedNflSelections(game,duplicate,when).length,2);
 const equal={...live,lines:[quote('Higher on sportsbook','receiving_yards',41)]};
 assert.deepEqual(verifiedNflSelections(game,equal,when),[]);
});
test('top six cap applies only after market proof, never fill slots with nonbook props',()=>{
 const out=verifiedNflSelections(game,live,when,2);
 assert.equal(out.length,2);
 assert.throws(()=>verifiedNflSelections(game,live,when,0),/limit/);
});
