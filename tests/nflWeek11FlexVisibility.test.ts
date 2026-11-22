import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePhase1,groupGames} from '../src/nfl/phase1.ts';
import {quarantineNflOfficialFlex,verifiedPhase1Kickoff,verifiedPhase1Cutoff} from '../src/nfl/flexGuard.ts';

const NOW=new Date('2026-11-21T23:10:00Z');
const FIELDS=['game_id','player','team','opp','pos','outcome','id','mean','median'];
type Horizon='T24'|'T90';
function game(away:string,home:string,kickoff:string,cut24:string,cut90?:string){
  const id='2026_11_'+away+'_'+home;
  return {game_id:id,away,home,kickoff_utc:kickoff,horizons:{
    T24:{cutoff:cut24,model_version:'immutable-p1-test',n_records:1},
    ...(cut90?{T90:{cutoff:cut90,model_version:'immutable-p1-test',n_records:1}}:{})
  }};
}
const phiOld=()=>game('PIT','PHI','2026-11-22T21:25:00Z','2026-11-21T21:25:00Z');
const nygOld=()=>game('JAX','NYG','2026-11-22T18:00:00Z','2026-11-21T18:00:00Z');
const bal=()=>game('BAL','CAR','2026-11-22T18:00:00Z','2026-11-21T18:00:00Z');
const row=(g:any,h:Horizon)=>[g.game_id,'Original Player',g.away,g.home,'QB','pass_yds',g.game_id+'|'+h,120,119];
function doc(games:any[]){
  return {
    schema:'nfl-new-engine-shadow-v1',
    row_fields:FIELDS,
    default_horizon:'T24',
    games,
    forecasts:{
      T24:games.filter(g=>g.horizons.T24).map(g=>row(g,'T24')),
      T90:games.filter(g=>g.horizons.T90).map(g=>row(g,'T90'))
    },
    status:{season:2026,week:11,r11:'UNRESOLVED_SHADOW_ONLY',
      last_shadow_run_utc:'2026-11-21T23:00:00Z',
      model_versions:['immutable-p1-test'],
      counts:{
        T24:{valid_games:games.filter(g=>g.horizons.T24).length},
        T90:{valid_games:games.filter(g=>g.horizons.T90).length}
      }
    }
  };
}
test('Historical old kickoff T24 cannot appear beside unaffected Sunday game',()=>{
 const input=doc([phiOld(),nygOld(),bal()]);
 const unchanged=JSON.stringify(input);
 const {view:v,excludedOfficialFlexGames,excludedWrongCutoffRows}=quarantineNflOfficialFlex(parsePhase1(input,NOW));
 assert.equal(v.games.length,1);
 assert.equal(v.games[0].game_id,'2026_11_BAL_CAR');
 assert.equal(excludedOfficialFlexGames,2);
 assert.equal(excludedWrongCutoffRows,0);
 assert.equal(v.rows.T24.length,1);
 assert.equal(groupGames(v,'T24').length,1);
 assert.equal(JSON.stringify(input),unchanged,'frozen original source may never be rewritten');
});
test('A corrected kickoff with OLD T24 cutoff remains quarantined; true T90 may publish',()=>{
 const phi=game('PIT','PHI','2026-11-22T18:00:00Z',
   '2026-11-21T21:25:00Z','2026-11-22T16:30:00Z');
 const jax=game('JAX','NYG','2026-11-22T21:25:00Z',
   '2026-11-21T18:00:00Z','2026-11-22T19:55:00Z');
 assert(verifiedPhase1Kickoff(phi));
 assert(!verifiedPhase1Cutoff(phi,'T24'));
 assert(verifiedPhase1Cutoff(phi,'T90'));
 assert(verifiedPhase1Cutoff(jax,'T90'));
 const original=doc([phi,jax]);
 const {view:v,excludedOfficialFlexGames,excludedWrongCutoffRows}=quarantineNflOfficialFlex(parsePhase1(original,NOW));
 assert.equal(excludedOfficialFlexGames,0);
 assert.equal(excludedWrongCutoffRows,2);
 assert.equal(v.rows.T24.length,0);
 assert.equal(v.rows.T90.length,2);
 assert.equal(v.defaultHorizon,'T90');
 assert.deepEqual(groupGames(v,'T90').map(g=>g.game_id),
   ['2026_11_PIT_PHI','2026_11_JAX_NYG']);
 assert.equal(original.forecasts.T24.length,2,'original T24 source remains intact for research');
});
test('Only old flex matchup: show an error, not stale pregame model outcomes',()=>{
 const {view:v,excludedOfficialFlexGames}=quarantineNflOfficialFlex(parsePhase1(doc([phiOld()]),NOW));
 assert.equal(v.games.length,0);
 assert.equal(v.rows.T24.length,0);
 assert.equal(excludedOfficialFlexGames,1);
});
test('Conflicting third kickoff is not treated as verified for PIT-PHI',()=>{
 const unknown=game('PIT','PHI','2026-11-22T20:00:00Z','2026-11-21T20:00:00Z');
 assert(!verifiedPhase1Kickoff(unknown));
 const {view:v,excludedOfficialFlexGames}=quarantineNflOfficialFlex(parsePhase1(doc([unknown,bal()]),NOW));
 assert.equal(v.games.length,1);
 assert.equal(excludedOfficialFlexGames,1);
});
