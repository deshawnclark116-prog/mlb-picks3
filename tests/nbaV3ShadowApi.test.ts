import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {loadNbaV3Shadow,NBA_V3_READONLY_SCHEMA} from '../server/nbaV3Shadow.ts';

const DATE='2026-10-28T00:00:00Z';
const NOW=new Date('2026-10-26T16:00:00Z');
function doc(){
 const fields=['points','rebounds','assists','three_pointers_made'];
 return {
   schema:'NBA_V3_2026_27_FIRSTSEEN_FULL_DISTRIBUTION_SHADOW_V1',
   model_promoted:false,live_nba_system_board_changed:false,
   official_bets:0,research_only:true,no_lookahead_or_retrospective_backfill:true,
   games_forecast:1,
   games:[{game_id:'401123456',tipoff_utc:DATE,
    home:'Dallas Mavericks',away:'New York Knicks',
    forecast_at_utc:'2026-10-26T15:00:00Z',
    rows_count:4,
    rows:fields.map(m=>({
      game_id:'401123456',team_id:'6',player_id:'123456',player:'Test Player',
      market:m,mean:17.5,median:17,p_active:.87,sd:4.5,p10:8,p25:12,
      p75:21,p90:28,cdf_lattice:{step:1,cdf:[.1,.2,.7,1]},
      model_target:{milestone:3,probability:.8,method:'pregame_full_game_mc_cdf'},
      calibrated_for_2026_27:false,research_only:true,not_an_official_bet:true
    })),
    team_opportunity_diagnostics:{},
    source_opportunity_pace:{}
   }]
 };
}
function withTmp(fn:(folder:string)=>void){
 const root=mkdtempSync(path.join(tmpdir(),'nba-v3-'));
 try{fn(root)}finally{rmSync(root,{recursive:true,force:true})}
}
test('NBA NFL-like Phase 1 research endpoint loads genuine original pretip CDF without promoting model',()=>{
 withTmp(root=>{
   const empty=loadNbaV3Shadow(NOW,root);
   assert.equal(empty.status,'NO_FIRSTSEEN_V3_SHADOW_YET');
   const filename='2026-10-26T150000Z.json';
   writeFileSync(path.join(root,filename),JSON.stringify(doc()));
   const result=loadNbaV3Shadow(NOW,root);
   assert.equal(result.schema,NBA_V3_READONLY_SCHEMA);
   assert.equal(result.official_bets,0);
   assert.equal(result.v2_original_predictions_remain_champion,true);
   assert.equal(result.prospective_model_probability_calibration_verified,false);
   assert.equal(result.sportsbook_lines_required,false);
   assert.equal(result.upcoming_games,1);
   assert.equal(result.games[0].rows.length,4);
 });
});
test('falsified source promotion, duplicate original game and posttip backfill fail closed',()=>{
 withTmp(root=>{
  const filename='2026-10-26T150000Z.json';
  let d=doc();d.model_promoted=true;
  writeFileSync(path.join(root,filename),JSON.stringify(d));
  assert.throws(()=>loadNbaV3Shadow(NOW,root),/UNTRUSTED/);
  d=doc();writeFileSync(path.join(root,filename),JSON.stringify(d));
  writeFileSync(path.join(root,'2026-10-26T160000Z.json'),JSON.stringify(d));
  assert.throws(()=>loadNbaV3Shadow(NOW,root),/DUPLICATE/);
  rmSync(path.join(root,'2026-10-26T160000Z.json'));
  d.games[0].forecast_at_utc='2026-10-28T01:00:00Z';
  writeFileSync(path.join(root,filename),JSON.stringify(d));
  assert.throws(()=>loadNbaV3Shadow(NOW,root),/AFTER_TIP/);
 });
});
