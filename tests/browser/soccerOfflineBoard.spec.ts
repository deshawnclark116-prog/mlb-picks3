import {test,expect} from '@playwright/test';
async function openSoccer(page:any){
 await page.clock.install({time:new Date('2026-11-01T14:00:00.000Z')});
 await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'offline'}}));
 await page.goto('/');
 await page.locator('#sport-chip-soccer').click();
 return page.locator('#motion-screen-SOCCER');
}
test('phone view starts with match cards, not separate top-pick and player feeds',async({page})=>{
 const screen=await openSoccer(page);
 await expect(screen.getByRole('heading',{name:'Games',exact:true})).toBeVisible();
 await expect(screen.getByRole('group',{name:'Soccer game schedule range'})
  .getByRole('button',{name:'Next 48 hours'})).toHaveAttribute('aria-pressed','true');
 const games=screen.getByTestId('soccer-game-card');
 await expect(games.first()).toBeVisible();
 expect(await games.count()).toBeGreaterThan(0);
 expect(await games.count()).toBeLessThanOrEqual(12);
 await expect(screen.getByRole('tab',{name:'Player props'})).toHaveCount(0);
 await expect(screen.getByRole('tab',{name:'Top projections'})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test('one game expands all its real player projections and differentiates missing match model',async({page})=>{
 const screen=await openSoccer(page);
 const game=screen.getByTestId('soccer-game-card').first();
 const count=Number((await game.getByTestId('soccer-game-projection-count').textContent())?.match(/(\d+) players/)?.[1]);
 expect(count).toBeGreaterThan(0);
 await game.getByRole('button',{name:/View all projections/}).click();
 const details=game.getByTestId('soccer-game-details');
 await expect(details).toBeVisible();
 await expect(details.getByTestId('soccer-game-player')).toHaveCount(count);
 await expect(details.getByTestId('soccer-game-player').first()).toContainText('Projected shots');
 await expect(details.getByTestId('soccer-game-player').first()).toContainText('Shots on target');
 await expect(details.getByTestId('soccer-game-player').first()).toContainText('Expected playing time');
 await game.getByRole('button',{name:/Hide projections/}).click();
 await expect(details).toHaveCount(0);
});
test('seven-day view reveals more fixtures and each fixture has optional match projections',async({page})=>{
 const screen=await openSoccer(page);
 const ranges=screen.getByRole('group',{name:'Soccer game schedule range'});
 await ranges.getByRole('button',{name:'7 days'}).click();
 await expect(ranges.getByRole('button',{name:'7 days'})).toHaveAttribute('aria-pressed','true');
 const rows=screen.getByTestId('soccer-game-card');
 expect(await rows.count()).toBeGreaterThan(3);
 await screen.getByRole('button',{name:/Filters/}).click();
 await screen.getByRole('searchbox',{name:'Search soccer teams or players'}).fill('Chelsea');
 await expect(rows.first()).toContainText(/Chelsea/i);
 await screen.getByRole('searchbox',{name:'Search soccer teams or players'}).fill('');
 await ranges.getByRole('button',{name:'All matches'}).click();
 await expect(rows.first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test('source verified match outcome model shows all 5 probability events, plus player forecasts',async({page})=>{
 const screen=await openSoccer(page);
 await screen.getByRole('group',{name:'Soccer game schedule range'}).getByRole('button',{name:'All matches'}).click();
 const games=screen.getByTestId('soccer-game-card');
 const max=await games.count();
 let found=false;
 for(let i=0;i<max;i++){
  const game=games.nth(i);
  await game.getByRole('button',{name:/View all projections/}).click();
  if(await game.getByTestId('soccer-game-outcomes').count()){
   const outcomes=game.getByTestId('soccer-game-outcomes');
   await expect(outcomes).toContainText('Match predictions');
   await expect(outcomes).toContainText('Both teams to score');
   await expect(outcomes).toContainText('3 or more total goals');
   await expect(outcomes).toContainText('to win');
   await expect(outcomes).toContainText('projected goals');
   found=true;break;
  }
 }
 expect(found).toBe(true);
});
test('mobile games list is reachable after navigating through More',async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T14:00:00.000Z')});
 await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'offline'}}));
 await page.goto('/');
 await page.locator('#tab-btn-more').click();
 await page.locator('#app-more-sheet').getByRole('button',{name:/Soccer/}).click();
 await expect(page.locator('#sport-chip-soccer')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#motion-screen-SOCCER').getByTestId('soccer-game-card').first()).toBeVisible();
});
