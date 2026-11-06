import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const saved=JSON.parse(readFileSync(new URL('../../docs/nba_v1_opening_week_research.json',import.meta.url),'utf8'));

async function launch(page: any, payload: unknown = saved) {
  await page.route('**/api/**', route => {
    const url = route.request().url();
    if (url.includes('/api/nba-research')) return route.fulfill({json: payload});
    if (url.includes('/api/predictions')) return route.fulfill({json: []});
    return route.fulfill({json:{picks:[],predictions:[],games:[]}});
  });
  await page.goto('/');
}

test('real saved Oct 19 NBA V1 forecasts render on 360px app without a bookmaker quote',async ({page})=>{
  await launch(page);
  await page.locator('#tab-btn-nba').click();
  await expect(page.getByTestId('nba-research-screen')).toBeVisible();
  await page.getByText('OPENING-WEEK ORIGINAL RESEARCH ARCHIVE · NOT THE BETTING BOARD').click();
  await page.getByRole('button',{name:'Original team forecasts'}).click();
  await expect(page.getByText('14 matching historical pregame forecasts')).toBeVisible();
  const games=page.getByTestId('nba-research-screen').locator('article');
  await expect(games).toHaveCount(14);
  await expect(games.first()).toContainText('Boston Celtics');
  await expect(games.first()).toContainText('Detroit Pistons');
  await expect(games.first()).toContainText('Projected:');
  await expect(games.first()).toContainText('NOT A SPORTSBOOK LINE');
  await expect(page.getByText('RESEARCH ONLY · NO VERIFIED BETS')).toBeVisible();
  await expect(page.getByText(/NBA V1 player points\/assists did not beat/)).toBeVisible();
  await page.getByRole('button',{name:'10-20'}).click();
  await expect(games).toHaveCount(3);
  await page.getByRole('button',{name:'10-21'}).click();
  await expect(games).toHaveCount(11); // Oct 22 UTC is still Oct 21 EDT
  await page.locator('#tab-btn-cfb').click();
  await expect(page.getByText('CFB PREDICTIONS',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});

test('forged NBA official bet fields fail closed on the public tab',async ({page})=>{
  await launch(page,{...saved,official_wagers:1});
  await page.locator('#tab-btn-nba').click();
  await page.getByText('OPENING-WEEK ORIGINAL RESEARCH ARCHIVE · NOT THE BETTING BOARD').click();
  await page.getByRole('button',{name:'Original team forecasts'}).click();
  await expect(page.getByRole('alert')).toContainText('Archived original NBA research unavailable');
  await expect(page.getByTestId('nba-research-screen').locator('article')).toHaveCount(0);
});
