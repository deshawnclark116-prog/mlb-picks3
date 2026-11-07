import test from 'node:test';
import assert from 'node:assert/strict';
import {v3ProjectionPicks,topProbabilityPicks} from '../src/components/NbaV3ResearchPanel.tsx';
import {nbaV5GameCardData,nbaV5GameCardFilename} from '../src/nba/v5ShareCard.ts';

const lattice={step:1,cdf:Array.from({length:20},(_,i)=>Math.min(1,(i+1)/20))};
const tip='2026-11-08T00:00:00+00:00',at='2026-11-07T22:00:00+00:00';
const mk=(id:string,market:string,chance:number,mean:number,whole:number,props:any={})=>({
  player_id:id,player:props.player||'Player '+id,team_id:'7',market,mean,
  median:mean,p10:0,p25:0,p75:3,p90:5,reported_status:'UNKNOWN_NOT_ACTIVE_CERTIFIED',
  p_active:.96,exp_opp:20,role_share:.12,unc_reasons:[],model_target:null,
  cdf_lattice:lattice,
  reach_probabilities:{
    whole_projection:whole,probability_if_playing:Math.min(1,chance/.96),
    probability_including_dnp:chance,p_active:.96,forward_calibrated:false
  },...props
});
const base={
 game_id:'401909938',away:'Denver Nuggets',home:'Indiana Pacers',
 tipoff_utc:tip,forecast_at_utc:at,forecast_kind:'V5_LATEST',rows_count:0,
 rows:[] as any[]
};
const candidates=['steals','three_pointers_made','blocks','assists','rebounds','points'];
const values:Record<string,[number,number]>={
 steals:[1.2,1],three_pointers_made:[1.3,1],blocks:[1.4,1],
 assists:[2.2,2],rebounds:[3.2,3],points:[7.2,7]
};
const rows=Array.from({length:12},(_,i)=>{
 const market=candidates[i%6],v=values[market],id=String(i%11);
 return mk(id,market,.93-i*.02,v[0],v[1],
  {player:i===6?'Player 0':'Player '+i});
});

test('V5 image has exactly first ten of canonical NBA ranking, no category quota and no change to existing four tiles',()=>{
 const game={...base,rows,rows_count:rows.length};
 const ranked=v3ProjectionPicks(game as any);
 assert.equal(ranked.length,12);
 const mainTiles=topProbabilityPicks(ranked);
 const card=nbaV5GameCardData(game,ranked);
 assert.equal(mainTiles.length,4);
 assert.deepEqual(mainTiles.map(x=>x.row.player_id),ranked.slice(0,4).map(x=>x.row.player_id));
 assert.equal(card.picks.length,10);
 assert.deepEqual(card.picks.map(x=>x.player_id),ranked.slice(0,10).map(x=>x.row.player_id));
 assert.deepEqual(card.picks.map(x=>x.rank),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(card.picks[0].market,'steals');
 assert.equal(card.picks[6].player,'Player 0');
 assert.equal(card.model,'V5');
 assert.equal(card.probabilityCalibrated,false);
 assert.equal(card.bookmakerLinesVerified,false);
 assert.equal(nbaV5GameCardFilename(card),
  'prop-edge-nba-v5-denver-nuggets-indiana-pacers-top10-2026-11-08.png');
});

test('card probability is original DNP-inclusive chance, never the conditional reach or another threshold',()=>{
 const source=mk('1','steals',.60,1.2,1);
 const game={...base,rows:[source]};
 const ranked=v3ProjectionPicks(game as any);
 const card=nbaV5GameCardData(game,ranked);
 assert.equal(card.picks.length,1);
 assert.equal(card.picks[0].chance,.60);
 assert.ok(card.picks[0].ifPlaying>.60);
 assert.equal(card.picks[0].target,1);
 assert.equal(card.picks[0].mean,1.2);
});

test('only actual pretip V5 gets an image; absent, OUT, turnover and uncalibrated source chance never added',()=>{
 const choices=[mk('ok','steals',.85,1.2,1),
  mk('turn','turnovers',.94,2.1,2),
  mk('out','blocks',.90,1.3,1,{reported_status:'OUT'}),
  mk('missing','points',.70,7.2,7,{reach_probabilities:undefined})];
 const game={...base,rows:choices};
 const ranked=v3ProjectionPicks(game as any);
 const card=nbaV5GameCardData(game,ranked);
 assert.deepEqual(card.picks.map(x=>x.player_id),['ok']);
 assert.throws(()=>nbaV5GameCardData({...game,forecast_kind:'V4_LATEST'},ranked),
  /REQUIRES_ACTUAL_PUBLISHED_V5/);
 assert.throws(()=>nbaV5GameCardData({...game,forecast_at_utc:tip},ranked),
  /REQUIRES_ORIGINAL_PRETIP/);
});

test('same athlete can appear twice for distinct eligible market projections, but not twice for one event',()=>{
 const a=mk('x','steals',.80,1.3,1,{player:'Same Athlete'});
 const b=mk('x','blocks',.79,1.2,1,{player:'Same Athlete'});
 const game={...base,rows:[a,b]};
 const ranked=v3ProjectionPicks(game as any);
 const result=nbaV5GameCardData(game,ranked);
 assert.equal(result.picks.length,2);
 assert.deepEqual(result.picks.map(x=>x.market),['steals','blocks']);
 assert.throws(()=>nbaV5GameCardData(game,[ranked[0],ranked[0]]),/DUPLICATE_PLAYER_MARKET/);
});
