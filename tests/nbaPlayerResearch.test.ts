import {test} from 'node:test';
import assert from 'node:assert/strict';
import saved from '../docs/nba_v2_opening_player_firstseen.json';
import {parseNbaPlayerResearch} from '../src/nba/playerResearch';
import {nbaPlayerResearchHandler} from '../server/nbaPlayerResearch';

const clone=():any=>structuredClone(saved);

test('actual first-seen NBA Oct 20 2026 original forecasts validate as research with zero bets',()=>{
  const d=parseNbaPlayerResearch(saved);
  assert.equal(d.games_forecast,14);
  assert.equal(d.number_of_player_stat_predictions,900);
  assert.equal(d.source_roster_count,517);
  assert.equal(d.previous_season_games_replayed,278);
  assert.equal(d.verified_previous_season_full_boxscores,266);
  assert.equal(d.official_bets,0);
  const ids=new Set<string>();
  let players=0;
  for(const game of d.forecasts){
    assert(Date.parse(d.generated_at_utc)<Date.parse(game.tipoff_utc));
    for(const player of game.players){
      ids.add(player.forecast_id);
      players++;
      assert.equal(player.official_pick,false);
      assert.equal(player.stat_market_lines,null);
      assert.equal(player.game_day_active_certified,false);
      assert.equal(player.official_injury_certified,false);
      assert.equal(player.forecast_generated_at_utc,d.generated_at_utc);
      assert.equal(Object.keys(player.predictions).length,4);
      assert.equal(player.game_id,game.game_id);
    }
  }
  assert.equal(players,225);
  assert.equal(ids.size,players);
});

test('untrusted roster, forged official bet and model-probability claims reject before display',()=>{
  for(const [k,v] of [
    ['official_bets',1],['research_only',false],
    ['model_version','fiction'],['game_roster_active_injury_starter_status_unknown',false],
    ['games_forecast',13],['number_of_player_stat_predictions',9000]
  ] as const){
    const d=clone();d[k]=v;
    assert.throws(()=>parseNbaPlayerResearch(d),/NBA original player research source violation/);
  }
  const future=clone();
  future.source_roster_receipts['2'].retrieved_at_utc='2026-10-25T20:00:00Z';
  assert.throws(()=>parseNbaPlayerResearch(future),/roster/);
  const badSha=clone();
  badSha.source_roster_receipts['2'].sha256='not-a-hash';
  assert.throws(()=>parseNbaPlayerResearch(badSha),/roster/);
  const bogus=clone();
  bogus.forecasts[0].players[0].official_pick=true;
  assert.throws(()=>parseNbaPlayerResearch(bogus),/model player/);
  const odds=clone();
  odds.forecasts[0].players[0].stat_market_lines={points:24.5};
  assert.throws(()=>parseNbaPlayerResearch(odds),/model player/);
});

test('first-seen time, numeric stat identities, team consistency and complete forecast accounting required',()=>{
  const d=clone();
  d.generated_at_utc=d.forecasts[0].tipoff_utc;
  assert.throws(()=>parseNbaPlayerResearch(d));
  const wrong=clone();wrong.forecasts[0].players[0].game_id='401999999';
  assert.throws(()=>parseNbaPlayerResearch(wrong));
  const unknown=clone();unknown.forecasts[0].players[0].team_id='999';
  assert.throws(()=>parseNbaPlayerResearch(unknown));
  const duplicate=clone();duplicate.forecasts[0].players.push(duplicate.forecasts[0].players[0]);
  duplicate.forecasts[0].player_predictions_count+=4;
  duplicate.number_of_player_stat_predictions+=4;
  assert.throws(()=>parseNbaPlayerResearch(duplicate));
  const inflated=clone();inflated.forecasts[0].players[0].predictions.points=999;
  assert.throws(()=>parseNbaPlayerResearch(inflated));
});

test('Picks3 Express serves exactly immutable first-seen NBA V2 player forecast artifact',()=>{
  let status=200,body:any;
  const res={
    setHeader: (_n:string,_v:string)=>{},
    status:(s:number)=>{status=s;return res;},
    json:(data:unknown)=>{body=data;return res;}
  };
  nbaPlayerResearchHandler()({} as any,res as any);
  assert.equal(status,200);
  assert.equal(body.generated_at_utc,saved.generated_at_utc);
  assert.equal(body.number_of_player_stat_predictions,900);
  assert.deepEqual(body,saved);
});
