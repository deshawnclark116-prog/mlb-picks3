import {test,expect} from '@playwright/test';

test('soccer always renders genuine archived numeric match goals when its live API is offline',async({page})=>{
 await page.route('**/api/**',route=>{
   const u=route.request().url();
   if(u.includes('/api/predictions'))return route.fulfill({json:[]});
   return route.fulfill({status:503,json:{error:'Source unreachable'}});
 });
 await page.goto('/');
 await page.locator('#sport-chip-soccer').click();
 const panel=page.locator('#motion-screen-SOCCER');
 await expect(panel.getByTestId('soccer-forecast-board')).toBeVisible();
 const cards=panel.getByText('SAVED PREGAME MODEL',{exact:true});
 await expect(cards.first()).toBeVisible();
 const n=await cards.count();
 expect(n).toBeGreaterThanOrEqual(15);
 const first=panel.getByTestId('soccer-forecast-board').locator('article').first();
 await expect(first).toContainText('Projected home goals');
 await expect(first).toContainText('Projected away goals');
 await expect(first).toContainText('Home win');
 await expect(first).toContainText('Draw');
 await expect(first).toContainText('Away win');
 await expect(panel.getByRole('status')).toContainText('Showing saved original pregame forecasts instead');
 await expect(panel.getByTestId('soccer-player-forecast-status')).toContainText('No fabricated projections');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
