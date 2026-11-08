import {test,expect} from '@playwright/test';

test('360px NFL UI shows NBA-style highest meaningful targets, original means and matched TOP 10 PNG',async({page})=>{
 await page.clock.install({time:new Date('2026-11-08T17:55:00Z')});
 const kickoff='2026-11-08T18:00:00Z',generated='2026-11-08T17:52:00Z';
 const row=(player:string,pid:string,target:number,p:number,mean=46)=>{
   const chosen={yards:target,probability:p,wilson_lower_95:Number((p-.01).toFixed(4))};
   const grid=Array.from({length:7},(_,i)=>{
     const yards=25+i*5;
     return {yards,probability:yards===target?p:yards<target?.96:.5,
       wilson_lower_95:yards===target?chosen.wilson_lower_95:yards<target?.95:.49};
   });
   return {market:'receiving_yards',player_id:pid,player,team:'CLE',opponent:'NO',
     kickoff_utc:kickoff,projected_median:mean-5,projected_mean:mean,
     projected_low:1,projected_high:140,model_source:'blended_sim',games_played:7,
     whole_projection:mean-5,projection_reach_probability:.502,
     projection_within_10_probability:.21,projection_simulation_n:10000,
     nba_style_whole_mean_projection:mean,nba_style_reach_probability:.43,
     nba_style_probability_event:'P_YARDS_AT_LEAST_ROUNDED_PUBLISHED_MEAN',
     nfl_model_target:chosen,nfl_model_target_event:'P_YARDS_AT_LEAST_FIXED_MEANINGFUL_THRESHOLD',
     nfl_model_target_grid:{
       schema:'nfl_meaningful_yardage_targets_v1',simulation_n:10000,
       minimum_absolute_yards:25,minimum_relative_mean_fraction:.55,
       required_wilson_lower_95:.65,grid_step_yards:5,
       conditional_on_modeled_opportunities:true,
       forward_calibrated:false,official_active_status_verified:false,
       chosen_target:chosen,grid
     },projection_probability_source:'UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP'};
 };
 const picks=[
   row('Lower Target','a',35,.73),row('Top Target','b',30,.84),
   row('Unverified','c',30,.95),
   {...row('Context Projection','d',30,.91),model_source:'v2_context',
     projection_probability_source:'UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION'}
 ];
 const roleRow=(p:typeof picks[number])=>({
   player:p.player,player_id:p.player_id,team:p.team,opponent:p.opponent,market:p.market,
   kickoff_utc:kickoff,published_model_median:p.projected_median,
   published_model_source:p.model_source,
   role_evidence_complete_for_showcase:p.player!=='Unverified',
   observed_stat_rows:p.player==='Unverified'?2:3,
   roster_status:'ROSTER_LISTED_NOT_STARTER_VERIFIED',
   has_verified_starting_role:false,has_calibrated_book_bet_probability:false,
   warnings:p.player==='Unverified'?['LOW_PRIOR_OPPORTUNITY']:[]
 });
 await page.route('**/api/**',async route=>{
   const url=route.request().url();
   if(url.includes('/api/nfl-predictions')){
     await route.fulfill({json:{generated_at_utc:generated,season:2026,week:9,
       scheduled_games:[{home_team:'NO',away_team:'CLE',kickoff_utc:kickoff}],picks}});
   }else if(url.includes('/api/nfl-role-snapshot')){
     await route.fulfill({json:{
       schema:'nfl-role-evidence-coverage-v1',status:'PREGAME_RESEARCH_ROLE_SNAPSHOT',
       season:2026,week:9,forecast_generated_at_utc:generated,
       captured_at_utc:'2026-11-08T17:52:01Z',
       is_betting_probability_calibrated:false,starter_status_verified:false,
       player_market_evidence:picks.map(roleRow)}});
   }else{
     await route.fulfill({status:503,json:{error:'Other NFL research intentionally absent in this test'}});
   }
 });
 await page.goto('/');
 await page.locator('#tab-btn-nfl').click();
 await expect(page.getByTestId('existing-nfl-game')).toHaveCount(1);
 const tiles=page.getByTestId('nfl-top-projection-tiles').getByTestId('nfl-projection-tile');
 await expect(tiles).toHaveCount(2);
 await expect(tiles.first()).toContainText('Top Target');
 await expect(tiles.first()).toContainText('84.0% to reach 30+ yds');
 await expect(tiles.first()).toContainText('Model average 46 yds');
 await expect(tiles.first()).not.toContainText('43.0%');
 await expect(tiles.nth(1)).toContainText('Lower Target');
 await expect(tiles.nth(1)).toContainText('73.0% to reach 35+ yds');
 await expect(page.getByTestId('nfl-open-top10')).toBeVisible();
 await page.getByTestId('nfl-open-top10').click();
 await expect(page.getByRole('heading',{name:'NFL · TOP 10 GAME CARD'})).toBeVisible();
 await expect(page.getByTestId('nfl-top10-share-poster')).toBeVisible();
 const poster=page.getByTestId('nfl-top10-share-rows').getByTestId('nfl-top10-share-pick');
 await expect(poster).toHaveCount(2);
 await expect(poster.first()).toContainText('Top Target');
 await expect(poster.first()).toContainText('30 REC YDS');
 await expect(poster.first()).toContainText('84.0%');
 await expect(poster.first()).toContainText('P(REACH TARGET)');
 await expect(page.getByRole('button',{name:'SAVE PNG'})).toBeEnabled({timeout:20000});
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'SAVE PNG'}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toMatch(/^prop-edge-nfl-w09-.*-top10-2026-11-08\.png$/);
 await page.getByRole('button',{name:'CLOSE'}).click();
 await page.getByTestId('existing-nfl-toggle').first().click();
 const shortlist=page.getByTestId('nfl-top10-simulation-research');
 await expect(shortlist).toContainText('TOP 2 MODEL PROJECTIONS');
 const cards=shortlist.getByTestId('nfl-precision-pick');
 await expect(cards).toHaveCount(2);
 await expect(cards.first()).toContainText('Top Target');
 await expect(cards.first()).toContainText('84.0%');
 await expect(cards.first()).toContainText('CHANCE OF 30+ YDS');
 await cards.first().getByText('MODEL EVIDENCE / OTHER TARGETS').click();
 await expect(cards.first().getByTestId('nfl-target-grid-details')).toContainText('40+ yds');
 await shortlist.getByText(/SHOW OTHER 2 NUMERICAL MODEL PROJECTIONS/).click();
 await expect(page.getByText('Unverified',{exact:true})).toBeVisible();
 await expect(page.getByText('Context Projection',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= 360)).toBe(true);
});
