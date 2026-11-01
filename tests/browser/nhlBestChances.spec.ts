import {test,expect} from '@playwright/test';
const date='2026-11-01',kickoff='2026-11-01T22:00:00Z';
const pred=(market:string,name:string,team:string,opp:string,p:number,pick:string,id:string)=>({
 market,prop_type:market,player_id:id,player:name,team,opponent:opp,
 season:2026,game_date:date,kickoff_utc:kickoff,pick,model_prob:p,
 prob_pct:p*100,confidence:'RESEARCH',games_played:18
});
const live={
 season:2026,game_date:date,generated_at_utc:'2026-11-01T12:00:00Z',
 picks:[
  pred('moneyline','Pittsburgh Penguins','Pittsburgh Penguins','Washington Capitals',.74,'Pittsburgh Penguins ML','p1'),
  pred('points','Skater Higher','PIT','WSH',.72,'OVER 0.5','p2'),
  pred('points','Skater Weak','PIT','WSH',.19,'OVER 0.5','p3')
 ]
};
const sha='a'.repeat(40),ledger='b'.repeat(64);
const sog={
 game_id:'nhl-401',player_id:'s1',player:'Shot Model Player',
 team:'PIT',opponent:'WSH',game_date:date,scheduled_start:kickoff,
 mean:3.4,median:3,sd:1.25,p10:1,p90:5,forecast_horizon:'T24H',
 source_generated_at:'2026-10-31T11:00:00Z',source_cutoff_at:'2026-10-31T12:00:00Z',
 research_only:true,not_an_official_betting_prediction:true,
 model_probability_milestones_research_only:{'1':.96,'2':.75,'3':.59,'4':.19,'5':.08},
 model_probability_forward_calibrated:false,probability_not_an_official_bet:true
};
const compact={
 schema:'NHL_APP_DAILY_VERIFIED_SOG_DELIVERY_V1',source_snapshot_commit_sha:sha,
 source_ledger_sha256:ledger,covered_game_dates:[date],official_bets:0,
 source_is_not_sportsbook:true,probabilities_forward_calibrated:false,
 days:{[date]:{
  schema:'NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1',game_date:date,
  research_only:true,not_an_official_betting_board:true,
  source_has_original_hash_chain:true,source_snapshot_commit_sha:sha,
  source_ledger_sha256:ledger,projected_count:1,projections:[sog]
 }}
};
async function openNhl(page:any){
 await page.clock.install({time:new Date('2026-11-01T14:00:00Z')});
 await page.route('**/nhl-daily-shot-counts.json*',route=>route.fulfill({json:compact}));
 await page.route('**/api/**',route=>{
  if(route.request().url().includes('/api/nhl-predictions'))return route.fulfill({json:live});
  if(route.request().url().includes('/api/predictions'))return route.fulfill({json:[]});
  if(route.request().url().includes('/api/games'))return route.fulfill({json:[]});
  return route.fulfill({status:503,json:{error:'isolated offline test'}});
 });
 await page.goto('/');
 await page.locator('#tab-btn-nhl').click();
 const panel=page.locator('#motion-screen-NHL');
 await expect(panel.getByTestId('unified-sport-board')).toBeVisible();
 await expect(panel.getByRole('button',{name:'All markets'})).toHaveAttribute('aria-pressed','true');
 await expect(panel.getByRole('button',{name:'Best chances'})).toHaveAttribute('aria-pressed','true');
 return panel;
}
test('NHL opens with strongest multi-market events, not raw 19% shots',async({page})=>{
 const panel=await openNhl(page);
 await expect(panel.getByRole('button',{name:'Game winner'})).toBeVisible();
 await expect(panel.getByRole('button',{name:'Anytime points'})).toBeVisible();
 await expect(panel.getByRole('button',{name:'Shots on goal'})).toBeVisible();
 const game=panel.getByTestId('unified-sport-game').first();
 await expect(game).toBeVisible();
 await expect(game).toContainText('PIT vs WSH');
 await expect(game).toContainText('3 stronger modeled events');
 await game.locator('button[aria-expanded]').click();
 const picks=game.getByTestId('unified-sport-projection');
 await expect(picks).toHaveCount(3);
 await expect(game).toContainText('Pittsburgh Penguins ML');
 await expect(game).toContainText('Skater Higher');
 await expect(game).toContainText('3 shots');
 await expect(game.getByTestId('unified-sport-projection').filter({hasText:'Shot Model Player'}).getByTestId('whole-stat-exact-probability')).toContainText('40.0%');
 await expect(game).toContainText('Chance of exactly 3');
 await expect(game).not.toContainText('Skater Weak');
 await expect(game.getByTestId('whole-stat-exact-probability')).not.toContainText('19.0%');
 await expect(panel.getByTestId('nhl-research-shortlist-note')).toContainText('not calibrated hit rates');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test('All projections still preserves original low-probability research and full model detail',async({page})=>{
 const panel=await openNhl(page);
 await panel.getByRole('button',{name:'All projections'}).click();
 const game=panel.getByTestId('unified-sport-game').first();
 await expect(game).toBeVisible();
 await game.locator('button[aria-expanded]').click();
 await expect(game.getByTestId('unified-sport-projection')).toHaveCount(4);
 await expect(game).toContainText('Skater Weak');
 await expect(game).toContainText('19.0%');
 await expect(game.getByText('Separate threshold event: P(4+ shots) 19.0%',{exact:false})).toHaveCount(1);
 await expect(panel.getByRole('button',{name:'All projections'})).toHaveAttribute('aria-pressed','true');
});
test('NHL filters show winner, point and shots markets without wrongly relabeling sources',async({page})=>{
 const panel=await openNhl(page);
 await panel.getByRole('button',{name:'Game winner'}).click();
 let game=panel.getByTestId('unified-sport-game').first();
 await expect(game).toBeVisible();
 await game.locator('button[aria-expanded]').click();
 await expect(game.getByTestId('unified-sport-projection')).toHaveCount(1);
 await expect(game).toContainText('Pittsburgh Penguins ML');
 await panel.getByRole('button',{name:'Anytime points'}).click();
 game=panel.getByTestId('unified-sport-game').first();
 await expect(game).toBeVisible();
 if(await game.locator('button[aria-expanded]').getAttribute('aria-expanded')==='false')
   await game.locator('button[aria-expanded]').click();
 await expect(game.getByTestId('unified-sport-projection')).toHaveCount(1);
 await expect(game).toContainText('Skater Higher');
 await expect(game).not.toContainText('Skater Weak');
 await panel.getByRole('button',{name:'Shots on goal'}).click();
 game=panel.getByTestId('unified-sport-game').first();
 await expect(game).toBeVisible();
 if(await game.locator('button[aria-expanded]').getAttribute('aria-expanded')==='false')
   await game.locator('button[aria-expanded]').click();
 await expect(game.getByTestId('unified-sport-projection')).toHaveCount(1);
 await expect(game).toContainText('3 shots');
 await expect(game).not.toContainText('Pittsburgh Penguins ML');
});
