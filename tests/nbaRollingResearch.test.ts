import {test} from 'node:test';
import assert from 'node:assert/strict';
import authentic from '../docs/nba_rolling_predictions/2026-10-20T173448Z.json';
import opening from '../docs/nba_v2_opening_player_firstseen.json';
import {
  parseRollingNbaOriginal,combineRollingNbaOriginals
} from '../src/nba/rollingResearch.ts';
import {nbaRollingResearchHandler,nbaRollingGradeHandler} from '../server/nbaRollingResearch.ts';

const original=():any=>JSON.parse(JSON.stringify(authentic));

test('REAL first live NBA V2 run has 14 new games, 233 players, 932 distinct original stats',()=>{
  const d=parseRollingNbaOriginal(authentic);
  assert.equal(d.games_forecast,14);
  assert.equal(d.number_of_player_stat_predictions,932);
  assert.equal(d.forecasts.reduce((n,g)=>n+g.players.length,0),233);
  assert.equal(d.official_bets,0);
  assert.equal(d.game_roster_active_injury_starter_status_unknown,true);
  const firstSaved=Date.parse(d.generated_at_utc);
  const openingSet=new Set(opening.forecasts.map(g=>g.game_id));
  for(const g of d.forecasts){
    assert(!openingSet.has(g.game_id));
    assert(Date.parse(g.tipoff_utc)>firstSaved);
    assert.equal(g.player_predictions_count,g.players.length*4);
    for(const p of g.players){
      assert.equal(p.stat_market_lines,null);
      assert.equal(p.official_pick,false);
      assert.equal(p.starting_lineup_certified,false);
      assert.equal(p.game_day_active_certified,false);
    }
  }
});

test('rolling NBA serving aggregates only truly saved firstseen games without replaying opening cohort',()=>{
  const ids=opening.forecasts.map(g=>g.game_id);
  const d=combineRollingNbaOriginals([
    {filename:'2026-10-20T173448Z.json',original:authentic}],ids,
    new Date('2026-10-20T18:00:00Z'));
  assert.equal(d.schema,'NBA_V2_ALL_SAVED_ROLLING_GAME_VIEW_V1');
  assert.equal(d.returned_games,14);
  assert.equal(d.returned_player_forecasts,233);
  assert.equal(d.returned_stat_forecasts,932);
  assert.equal(d.injury_or_starters_certified,false);
  assert.equal(d.official_bets,0);
  assert.equal(d.forecasts[0].source_file,'2026-10-20T173448Z.json');
});

test('rolling NBA original source rejects falsified bets, model, past tips and nonexistent source',()=>{
  for(const [name,mutate] of [
    ['bookmaker', (d:any)=>{d.official_bets=1;}],
    ['fake V2', (d:any)=>{d.model_version='test invented';}],
    ['posttip', (d:any)=>{d.generated_at_utc=d.forecasts[0].tipoff_utc;}],
    ['fake player bet', (d:any)=>{d.forecasts[0].players[0].official_pick=true;}],
    ['fake sportsbook line', (d:any)=>{d.forecasts[0].players[0].stat_market_lines={points:20.5};}],
    ['duplicate player', (d:any)=>{d.forecasts[0].players[1].forecast_id=d.forecasts[0].players[0].forecast_id;}],
    ['wrong game', (d:any)=>{d.forecasts[0].players[0].game_id='9999999999';}],
    ['future roster receipt', (d:any)=>{d.source_roster_receipts['1'].retrieved_at_utc='2027-01-01T00:00:00Z';}],
  ] as const){
    const d=original();mutate(d);
    assert.throws(()=>parseRollingNbaOriginal(d),/NBA rolling original-source contract/,name);
  }
});

test('rollups quarantine game overlaps and keep missing future forecasts absent, not simulated',()=>{
  const ids=opening.forecasts.map(g=>g.game_id);
  const input={filename:'2026-10-20T173448Z.json',original:authentic};
  const result=combineRollingNbaOriginals([input],ids,new Date('2027-04-15T20:00:00Z'));
  assert.equal(result.returned_games,0);
  assert.equal(result.returned_stat_forecasts,0);
  assert.equal(result.status,'NO_ROLLING_ORIGINALS_YET');
  assert.throws(()=>combineRollingNbaOriginals([input,input],ids,
         new Date('2026-10-20T18:00:00Z')),/same game/);
});

test('existing Picks3 NBA V2 rolling endpoint serves only archived genuine model, not Render sportsbook odds',()=>{
  let payload:any;
  const res:any={
    setHeader:()=>res,
    status:(code:number)=>{assert.fail('real original expected, got HTTP '+code);return res;},
    json:(value:any)=>{payload=value;return res;}
  };
  nbaRollingResearchHandler()({} as any,res);
  assert.equal(payload.schema,'NBA_V2_ALL_SAVED_ROLLING_GAME_VIEW_V1');
  assert.equal(payload.official_bets,0);
  assert(payload.returned_stat_forecasts>=932);
});

test('rolling grading endpoint never fabricates wins when there are no finals',()=>{
  let payload:any;
  const res:any={
    setHeader:()=>res,
    status:()=>res,
    json:(value:any)=>{payload=value;return res;}
  };
  nbaRollingGradeHandler()({} as any,res);
  assert(typeof payload.status==='string');
  assert(!('bookmaker_win_loss_record' in payload)||
    payload.bookmaker_win_loss_record===null);
});
