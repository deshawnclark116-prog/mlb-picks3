import {test,expect} from '@playwright/test';

async function openSoccer(page:any){
 await page.clock.install({time:new Date('2026-11-01T14:00:00.000Z')});
 await page.route('**/api/**',(route:any)=>route.fulfill({status:503,json:{error:'offline'}}));
 await page.goto('/');
 await page.locator('#sport-chip-soccer').click();
 return page.locator('#motion-screen-SOCCER');
}
test('best chances appear first, ranked highest to lowest without live API',async({page})=>{
 const panel=await openSoccer(page);
 await expect(panel.getByRole('heading',{name:'Best chances'})).toBeVisible();
 await expect(panel.getByRole('tab',{name:'Top projections'})).toHaveAttribute('aria-selected','true');
 const cards=panel.getByTestId('soccer-top-card');
 await expect(cards.first()).toBeVisible();
 const count=await cards.count();
 expect(count).toBeGreaterThan(3);
 expect(count).toBeLessThanOrEqual(8);
 await expect(cards.first()).toContainText('Saved pregame');
 const texts=await cards.locator('strong').allTextContents();
 const values=texts.map(s=>parseFloat(s.replace('%','')));
 expect(values.every(Number.isFinite)).toBe(true);
 expect(values.every((v,i)=>i===0||v<=values[i-1]+.0001)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
 await expect(panel.getByRole('tab',{name:'Record'})).toHaveCount(0);
 await expect(panel.getByRole('tab',{name:'Players'})).toHaveCount(0);
});
test('all matches keeps optional, compact details with original numerical forecasts',async({page})=>{
 const panel=await openSoccer(page);
 await panel.getByRole('tab',{name:'All matches'}).click();
 const rows=panel.getByTestId('soccer-match-row');
 await expect(rows.first()).toBeVisible();
 expect(await rows.count()).toBeLessThanOrEqual(12);
 await expect(rows.first()).toContainText('Projected goals');
 await expect(rows.first().getByTestId('soccer-match-details')).toHaveCount(0);
 await rows.first().getByRole('button',{name:/More/}).click();
 await expect(rows.first().getByTestId('soccer-match-details')).toBeVisible();
 await expect(rows.first()).toContainText('Both teams to score');
 await expect(rows.first()).toContainText('3 or more total goals');
 await expect(rows.first()).not.toContainText('Home win');
 await expect(rows.first()).not.toContainText('Away win');
 await rows.first().getByRole('button',{name:/Less/}).click();
 await expect(rows.first().getByTestId('soccer-match-details')).toHaveCount(0);
});
test('filters and Show More work on a mobile screen without long empty research panels',async({page})=>{
 const panel=await openSoccer(page);
 await panel.getByRole('button',{name:/Filters/}).click();
 await panel.getByRole('button',{name:'All dates'}).click();
 await panel.getByRole('searchbox',{name:'Find soccer team or league'}).fill('Crystal Palace');
 await expect(panel.getByTestId('soccer-top-card').first()).toContainText('Crystal Palace');
 await panel.getByRole('searchbox',{name:'Find soccer team or league'}).fill('');
 await panel.getByRole('button',{name:/Filters/}).click();
 const cards=panel.getByTestId('soccer-top-card');
 await expect(cards).toHaveCount(8);
 await panel.getByRole('button',{name:/Show more top projections/}).click();
 await expect(cards).toHaveCount(16);
 await panel.getByRole('tab',{name:'All matches'}).click();
 await expect(panel.getByTestId('soccer-match-row')).toHaveCount(12);
 await panel.getByRole('button',{name:/Show 12 more matches/}).click();
 await expect(panel.getByTestId('soccer-match-row')).toHaveCount(24);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test('the selected Soccer sport is visible after navigating from More',async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T14:00:00.000Z')});
 await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'offline'}}));
 await page.goto('/');
 await page.locator('#tab-btn-more').click();
 await page.locator('#app-more-sheet').getByRole('button',{name:/Soccer/}).click();
 await expect(page.locator('#sport-chip-soccer')).toHaveAttribute('aria-pressed','true');
 await expect.poll(async()=>page.evaluate(()=>{
   const e=document.querySelector('#sport-chip-soccer');
   if(!e||!e.parentElement)return false;
   const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();
   return a.left>=b.left-2&&a.right<=b.right+2;
 })).toBe(true);
 await expect(page.locator('#motion-screen-SOCCER').getByTestId('soccer-top-card').first()).toBeVisible();
});

test('player props tab is honest without a connected feed',async({page})=>{
 const panel=await openSoccer(page);
 await panel.getByRole('tab',{name:'Player props'}).click();
 await expect(panel.getByTestId('soccer-player-props-board')).toBeVisible();
 await expect(panel.getByTestId('soccer-player-prop-card')).toHaveCount(0);
 await expect(panel.getByText("Player forecasts aren't connected yet")).toBeVisible();
 await expect(panel.getByText('No player picks are being invented.')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test('source-backed player projections show the forecast and chance of reaching that same mean',async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T14:00:00.000Z')});
 await page.route('**/api/**',route=>{
   if(route.request().url().includes('/api/soccer-player-board'))
     return route.fulfill({json:{
      schema:'soccer-player-board-v1',status:'RESEARCH_PLAYER_FORECASTS',
      officialPicks:0,calibrated:false,items:[{
       id:'123|2026-11-05',playerId:'123',playerName:'Example Forward',teamName:'Test FC',
       opponent:'Opponent FC',fixtureDate:'2026-11-05',source:'AUTHORIZED_PLAYER_MATCH_LOG',
       forecast:{
        playerId:'123',fixtureDate:'2026-11-05',
        status:'RESEARCH_ONLY_NO_CALIBRATED_PROBABILITIES_NO_OFFICIAL_PICKS',
        predictedMinutes:72.8,predictedShots:2.6,predictedShotsOnTarget:1.2,
        shotsReachCount:3,sotReachCount:2,pReachProjectedShots:.427,
        pReachProjectedSot:.29,lineupState:'UNKNOWN'
       }
      }]
     }});
   return route.fulfill({status:503,json:{error:'offline'}});
 });
 await page.goto('/');
 await page.locator('#sport-chip-soccer').click();
 const panel=page.locator('#motion-screen-SOCCER');
 await panel.getByRole('tab',{name:'Player props'}).click();
 const card=panel.getByTestId('soccer-player-prop-card');
 await expect(card).toContainText('Example Forward');
 await expect(card).toContainText('2.6');
 await expect(card).toContainText('42.7% chance of 3+ shots');
 await expect(card).toContainText('1.2');
 await expect(card).toContainText('29.0% chance of 2+ on target');
 await expect(card).toContainText('73 minutes');
 await expect(card).toContainText('Uncalibrated research probability');
});
