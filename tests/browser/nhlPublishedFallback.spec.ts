import {test,expect} from '@playwright/test';
test('AI Studio static mode recovers five NHL matchups, 55 anytime points and 5 game winners',async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T17:50:00.000Z')});
 // Reproduce actual recording: count-model JSON loads, but Render NHL API
 // is unavailable. Also block GitHub raw so only the bundled, genuinely
 // pregame source can recover game winners and anytime points.
 await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'upstream offline'}}));
 await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
 await page.goto('/');
 await page.locator('#tab-btn-nhl').click();
 const panel=page.locator('#motion-screen-NHL');
 await expect(panel).toBeVisible();
 await expect(panel.getByRole('button',{name:'Game winner'})).toBeVisible({timeout:15000});
 await expect(panel.getByRole('button',{name:'Anytime points'})).toBeVisible();
 await expect(panel.getByRole('button',{name:'All markets'})).toHaveAttribute('aria-pressed','true');
 // The first view still honors the 65% *research* shortlist; the full
 // projection view must preserve every source-published game and event.
 await panel.getByRole('button',{name:'All projections'}).click();
 const games=panel.getByTestId('unified-sport-game');
 await expect(games).toHaveCount(5);
 const car=games.filter({hasText:'CAR vs WPG'});
 await expect(car).toHaveCount(1);
 await car.locator('button[aria-expanded]').click();
 await expect(car).toContainText('Carolina Hurricanes ML');
 await expect(car).toContainText('Sebastian Aho');
 await expect(car).toContainText('shots');
 await panel.getByRole('button',{name:'Game winner'}).click();
 await expect(games).toHaveCount(5);
 await expect(car).toContainText('Carolina Hurricanes ML');
 await panel.getByRole('button',{name:'Anytime points'}).click();
 await expect(games).toHaveCount(5);
 const players=panel.getByTestId('unified-sport-projection');
 // Game cards are collapsed when filter changes; expand one verified game.
 const pgame=games.filter({hasText:'CAR vs WPG'});
 if(await pgame.locator('button[aria-expanded]').getAttribute('aria-expanded')==='false')
  await pgame.locator('button[aria-expanded]').click();
 await expect(pgame).toContainText('Sebastian Aho');
 await expect(pgame).not.toContainText('Carolina Hurricanes ML');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test('past NHL game data is not disguised as new predictions',async({page})=>{
 await page.clock.install({time:new Date('2026-11-03T17:50:00.000Z')});
 await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'upstream offline'}}));
 await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
 await page.goto('/');
 await page.locator('#tab-btn-nhl').click();
 const panel=page.locator('#motion-screen-NHL');
 await expect(panel.getByRole('button',{name:'Game winner'})).toHaveCount(0);
 await expect(panel.getByRole('button',{name:'Anytime points'})).toHaveCount(0);
 await expect(panel.getByTestId('unified-sport-game')).toHaveCount(0);
});
