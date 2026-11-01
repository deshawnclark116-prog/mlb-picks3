import {test,expect} from '@playwright/test';

test('compact soccer match center displays genuine originals with live API offline',async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T14:00:00.000Z')});
 await page.route('**/api/**',route=>{
   const u=route.request().url();
   if(u.includes('/api/predictions'))return route.fulfill({json:[]});
   return route.fulfill({status:503,json:{error:'Offline'}});
 });
 await page.goto('/');
 await page.locator('#sport-chip-soccer').click();
 const panel=page.locator('#motion-screen-SOCCER');
 await expect(panel.getByRole('heading',{name:'Match center'})).toBeVisible();
 await expect(panel.getByRole('tab',{name:'Matches'})).toHaveAttribute('aria-selected','true');
 const board=panel.getByTestId('soccer-forecast-board');
 await expect(board).toBeVisible();
 const rows=board.getByTestId('soccer-match-row');
 await expect(rows.first()).toBeVisible();
 const count=await rows.count();
 expect(count).toBeGreaterThan(0);
 expect(count).toBeLessThanOrEqual(12);
 await expect(rows.first()).toContainText('Model goals');
 await expect(rows.first()).toContainText('Saved pregame');
 await expect(rows.first().getByText('Match probabilities')).toHaveCount(0);
 await rows.first().getByRole('button',{name:/Details/}).click();
 await expect(rows.first().getByTestId('soccer-match-details')).toBeVisible();
 await expect(rows.first()).toContainText('Home win');
 await expect(rows.first()).toContainText('Draw');
 await expect(rows.first()).toContainText('Away win');
 await rows.first().getByRole('button',{name:/Less/}).click();
 await expect(rows.first().getByTestId('soccer-match-details')).toHaveCount(0);
 await expect(panel.getByRole('status')).toContainText('Showing saved original pregame forecasts instead.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});

test('soccer search, league and date filters narrow genuine forecasts without false player data',async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T14:00:00.000Z')});
 await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'offline'}}));
 await page.goto('/');
 await page.locator('#sport-chip-soccer').click();
 const panel=page.locator('#motion-screen-SOCCER');
 const board=panel.getByTestId('soccer-forecast-board');
 await panel.getByRole('button',{name:'All',exact:true}).click();
 await panel.getByRole('searchbox',{name:'Find soccer team or league'}).fill('Crystal Palace');
 await expect(board.getByTestId('soccer-match-row').first()).toContainText('Crystal Palace');
 const searchCount=await board.getByTestId('soccer-match-row').count();
 expect(searchCount).toBeGreaterThan(0);
 expect(searchCount).toBeLessThan(12);
 await panel.getByRole('tab',{name:'Players'}).click();
 await expect(panel.getByTestId('soccer-player-forecast-status')).toContainText('No fabricated projections');
 await panel.getByRole('tab',{name:'Record'}).click();
 await expect(panel.getByTestId('soccer-forward-scorecard')).toBeVisible();
 await panel.getByRole('tab',{name:'Matches'}).click();
 await expect(board.getByTestId('soccer-match-row').first()).toContainText('Crystal Palace');
});


test('soccer tab is visible after navigating from More, and users can progressively reveal fixtures',async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T14:00:00.000Z')});
 await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'offline'}}));
 await page.goto('/');
 await page.locator('#tab-btn-more').click();
 await page.locator('#app-more-sheet').getByRole('button',{name:/Soccer/}).click();
 const chip=page.locator('#sport-chip-soccer');
 await expect(chip).toHaveAttribute('aria-pressed','true');
 await expect.poll(async()=>page.evaluate(()=>{
   const el=document.querySelector('#sport-chip-soccer');
   if(!el||!el.parentElement)return false;
   const a=el.getBoundingClientRect(),b=el.parentElement.getBoundingClientRect();
   return a.left>=b.left-2&&a.right<=b.right+2;
 })).toBe(true);
 const panel=page.locator('#motion-screen-SOCCER');
 await panel.getByRole('button',{name:'All',exact:true}).click();
 const rows=panel.getByTestId('soccer-match-row');
 await expect(rows).toHaveCount(12);
 await panel.getByRole('button',{name:/Show 12 more matches/}).click();
 await expect(rows).toHaveCount(24);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
