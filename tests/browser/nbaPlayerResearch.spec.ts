import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const team=JSON.parse(readFileSync(new URL('../../docs/nba_v1_opening_week_research.json',import.meta.url),'utf8'));
const players=JSON.parse(readFileSync(new URL('../../docs/nba_v2_opening_player_firstseen.json',import.meta.url),'utf8'));

async function launch(page:any, playerDoc:unknown=players){
  await page.route('**/api/**',route=>{
    const u=route.request().url();
    if(u.includes('/api/nba-player-research'))return route.fulfill({json:playerDoc});
    if(u.includes('/api/nba-research'))return route.fulfill({json:team});
    if(u.includes('/api/predictions'))return route.fulfill({json:[]});
    return route.fulfill({json:{picks:[],predictions:[],games:[]}});
  });
  await page.setViewportSize({width:360,height:760});
  await page.goto('/');
  await page.locator('#tab-btn-nba').click();
  // Historical V2 player research now lives behind the explicit archive,
  // while the current NBA projection system remains the default view.
  await page.getByText('OPENING-WEEK ORIGINAL RESEARCH ARCHIVE · NOT THE BETTING BOARD').click();
  await page.getByRole('button',{name:'All opening player stats'}).click();
}

test('real forward-saved 225 NBA players and 900 stats render without invented bookmaker side',async({page})=>{
  await launch(page);
  const root=page.getByTestId('nba-player-research');
  await expect(root).toBeVisible();
  await expect(root.getByText(/900 forecasts/)).toBeVisible();
  const games=root.getByTestId('nba-player-matchup');
  await expect(games).toHaveCount(14);
  await games.first().locator('summary').click();
  const playerRows=games.first().getByTestId('nba-player-projection');
  await expect(playerRows).toHaveCount(22);
  const jayson=playerRows.filter({hasText:'Jayson Tatum'});
  await expect(jayson).toBeVisible();
  await expect(jayson).toContainText('PTS');
  await expect(jayson).toContainText('REB');
  await expect(jayson).toContainText('AST');
  await expect(jayson).toContainText('3PM');
  await expect(jayson).toContainText('Not injury/lineup certified');
  await expect(root.getByText(/There are no verified bookmaker lines/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});

test('NBA V2 selector preserves day filters and never hides source-incomplete players',async({page})=>{
  await launch(page);
  const root=page.getByTestId('nba-player-research');
  await page.getByRole('button',{name:'10-20'}).click();
  await expect(root.getByTestId('nba-player-matchup')).toHaveCount(3);
  await page.getByRole('button',{name:'10-21'}).click();
  await expect(root.getByTestId('nba-player-matchup')).toHaveCount(11);
  await page.getByRole('button',{name:'All games'}).click();
  const input=page.getByRole('textbox',{name:'Find NBA team'});
  await input.fill('Jayson Tatum');
  await expect(root.getByTestId('nba-player-matchup')).toHaveCount(1);
  await root.getByTestId('nba-player-matchup').first().locator('summary').click();
  await expect(root.getByTestId('nba-player-projection')).toHaveCount(1);
});

test('forged official NBA player betting line rejected rather than shown',async({page})=>{
  const forged=structuredClone(players);
  forged.forecasts[0].players[0].stat_market_lines={points:22.5};
  await launch(page,forged);
  const root=page.getByTestId('nba-player-research');
  await expect(root.getByRole('alert')).toContainText('NBA original player research source violation');
  await expect(root.getByTestId('nba-player-projection')).toHaveCount(0);
});
