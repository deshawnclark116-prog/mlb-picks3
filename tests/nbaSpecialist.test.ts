import test from 'node:test';
import assert from 'node:assert/strict';
import {composeNbaSpecialists,SPECIALIST_MARKETS} from '../server/nbaSpecialist.ts';

const tip='2026-11-22T01:00:00Z',asof='2026-11-21T23:00:00Z';
const now=Date.parse('2026-11-21T23:10:00Z');
const markets=['points','rebounds','assists','three_pointers_made'];
function row(v:string,m:string,mean:number){
 return {game_id:'401910001',team_id:'1',player_id:'101',player:'Test Player',
  model_version:'nba-'+v.toLowerCase()+'-sample',market:m,mean,median:mean,
  p10:0,p25:0,p75:mean,p90:mean+3,p_active:.9,reported_status:'UNKNOWN',
  research_only:true,not_an_official_bet:true,
  cdf_lattice:{step:1,cdf:[.1,.3,.5,.7,.85,1]}};
}
function source(v:'V3'|'V4'|'V5',values:number[],kind?:string){
 return {games:[{game_id:'401910001',tipoff_utc:tip,forecast_at_utc:asof,
  home:'New York Knicks',away:'Portland Trail Blazers',home_id:'18',away_id:'22',
  forecast_kind:kind,rows:markets.map((m,i)=>row(v,m,values[i]))}]};
}
const v3=()=>source('V3',[111,6,111,2],'LATEST_RUN');
const v4=()=>source('V4',[222,222,7,222],'V4_LATEST');
const v5=()=>source('V5',[25,333,333,333],'V5_LATEST');

test('Each NBA stat is owned by one model: V5 points, V3 rebounds/threes, V4 assists',()=>{
 const original=v3(),before=JSON.stringify(original);
 const result=composeNbaSpecialists(original,v3(),v4(),v5(),now);
 assert.deepEqual(result.market_assignments,SPECIALIST_MARKETS);
 assert.equal(result.status,'AVAILABLE_SHADOW_ONLY');
 assert.equal(result.research_only,true);
 assert.equal(result.official_bets,0);
 assert.equal(result.no_ensemble_blending,true);
 const game=result.games[0],rows=game.rows;
 assert.equal(rows.length,4);
 assert.deepEqual(rows.map((r:any)=>[r.market,r.specialist_model,r.mean]),[
  ['points','V5',25],['rebounds','V3',6],['assists','V4',7],['three_pointers_made','V3',2]
 ]);
 assert.equal(JSON.stringify(original),before,'Original forecasts must remain immutable');
 assert.deepEqual(game.missing_markets,[]);
});
test('Missing V4 does not become a hidden V3 or V5 assist forecast',()=>{
 const result=composeNbaSpecialists(v3(),v3(),{games:[]},v5(),now);
 assert.deepEqual(result.games[0].missing_markets,['assists']);
 assert.deepEqual(result.games[0].rows.map((r:any)=>r.market),
  ['points','rebounds','three_pointers_made']);
});
test('Wrong game time or posttip source cannot enter specialist output',()=>{
 const wrong=v4();wrong.games[0].tipoff_utc='2026-11-22T02:00:00Z';
 const late=v5();late.games[0].forecast_at_utc='2026-11-22T00:55:00Z';
 const res=composeNbaSpecialists(v3(),v3(),wrong,late,now);
 assert.deepEqual(res.games[0].missing_markets,['points','assists']);
 assert.deepEqual(res.games[0].rows.map((r:any)=>r.specialist_model),['V3','V3']);
});
test('Out players are omitted and corrupted source version is rejected, never silently substituted',()=>{
 const out=v5();out.games[0].rows[0].reported_status='OUT';
 const res=composeNbaSpecialists(v3(),v3(),v4(),out,now);
 assert.equal(res.games[0].rows.some((r:any)=>r.market==='points'),false);
 const corrupt=v4();corrupt.games[0].rows[2].model_version='nba-v5-wrong-owner';
 assert.throws(()=>composeNbaSpecialists(v3(),v3(),corrupt,v5(),now),
   /NBA_SPECIALIST_INVALID_OR_UNVERIFIED_SOURCE_ROW/);
});
test('Ambiguous duplicate source games are rejected before market selection',()=>{
 const d=v3();d.games.push(d.games[0]);
 assert.throws(()=>composeNbaSpecialists(v3(),d,v4(),v5(),now),
  /NBA_SPECIALIST_DUPLICATE_SOURCE_GAME/);
});
