import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const source=JSON.parse(readFileSync(new URL('../fixtures/nfl-nyj-chi-bettable.json',import.meta.url),'utf8'));
async function setup(page:any,get=()=>structuredClone(source)) {
  await page.clock.install({time:new Date('2026-10-04T17:00:00Z')});
  let legacy=0;const requests:string[]=[];
  await page.route('**/api/**',async(route:any)=>{
    const url=route.request().url();
    if(url.includes('/api/nfl-phase1-predictions')){requests.push(url);await route.fulfill({json:get(),headers:{'X-Forecast-Retrieved-At':'2026-10-04T17:00:00Z'}});}
    else{if(url.includes('/api/nfl-predictions'))legacy++;await route.fulfill({json:{predictions:[],picks:[],games:[]}});}
  });
  await page.goto('/');await page.locator('#tab-btn-nfl').click();await expect(page.getByTestId('nfl-game')).toHaveCount(1);
  return {requests,legacy:()=>legacy};
}
const screen=()=>process.env.NFL_SCREENSHOT_DIR || '/workspace/scratch';
test('360x800 SYSTEM PICKS layout, collapsed games/details, Today jump, audit universe and genuine empty execution screenshots',async({page})=>{
  const check=await setup(page);
  await expect(page.getByRole('button',{name:'SYSTEM PICKS',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('today-best')).toHaveCount(5);
  // Actual numerical model projections are visible without tapping a single game.
  const quick=page.getByTestId('quick-projection');
  expect(await quick.count()).toBeGreaterThan(0);
  await expect(quick.first()).toContainText('median');
  await expect(quick.first()).toContainText('Mean');
  await expect(quick.first()).toContainText('P10–P90');
  await expect(page.getByRole('region',{name:'Quick player projections'})).toBeVisible();
  await expect(page.getByTestId('nfl-coverage')).toContainText('FORECAST COVERAGE');
  await expect(page.getByTestId('nfl-coverage')).toContainText('Model last published:');
  await expect(page.getByText('TOP MODEL TARGETS')).toBeVisible();
  await expect(page.getByTestId('today-best').first()).toContainText('projected median');
  await expect(page.getByTestId('game-quick-picks')).toHaveCount(1);
  await expect(page.getByTestId('game-quick-picks')).toContainText('MODEL MEDIAN');

  const game=page.getByTestId('nfl-game');await expect(game).toContainText('10 SYSTEM PICKS');await expect(game).toContainText('TOP TARGET: dandre swift');
  await expect(game.getByRole('button').filter({has:page.locator('h2')})).toHaveAttribute('aria-expanded','false');await expect(page.getByTestId('system-pick')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
  for(const label of ['SYSTEM PICKS','BETTABLE NOW','MODEL BOARD','T90','T24','ALL','PASS','RUSH','REC','TD','Refresh NFL forecasts']){
    const box=await page.getByRole('button',{name:label,exact:true}).boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(360);
  }
  await page.screenshot({path:`${screen()}/nfl-system-picks-360.png`});
  await page.getByTestId('today-best').first().click();await expect(game.getByRole('button').filter({has:page.locator('h2')}).first()).toHaveAttribute('aria-expanded','true');await expect(page.getByTestId('system-pick')).toHaveCount(10);
  const pick=page.getByTestId('system-pick').first();await expect(pick).toContainText('MODEL HIT PROBABILITY');
  await expect(pick.getByTestId('primary-projection')).toContainText('PREDICTED STAT · MODEL MEDIAN');
  await expect(pick).toContainText('NOT A SPORTSBOOK BET');await expect(pick.getByTestId('system-details')).not.toHaveAttribute('open','');
  await expect(pick.getByTestId('system-target')).toContainText('1+ RECEPTIONS');
  await page.locator('#nfl-scroll-area').evaluate(el=>{const game=el.querySelector('[data-testid="nfl-game"]')!;el.scrollTop+=game.getBoundingClientRect().top-el.getBoundingClientRect().top;});await page.screenshot({path:`${screen()}/nfl-nyj-chi-expanded-360.png`});
  await pick.getByText('VIEW DETAILS ▾',{exact:true}).click();await expect(pick.getByTestId('system-details')).toHaveAttribute('open','');await expect(pick.getByText('Expected opportunities',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'BETTABLE NOW',exact:true}).click();await expect(game).toContainText('0 BETTABLE NOW');await game.getByRole('button').filter({has:page.locator('h2')}).click();
  await expect(page.getByText("No current sportsbook market matches this game's system picks.",{exact:true})).toBeVisible();await expect(page.getByText('LINE MAY HAVE MOVED',{exact:false})).toBeVisible();
  await page.locator('#nfl-scroll-area').evaluate(el=>el.scrollTop=0);await page.screenshot({path:`${screen()}/nfl-bettable-now-360.png`});
  await page.getByRole('button',{name:'MODEL BOARD',exact:true}).click();await expect(game).toContainText('286 player outcomes');await game.getByRole('button').filter({has:page.locator('h2')}).click();
  while(await page.getByRole('button',{name:/Show more outcomes/}).count())await page.getByRole('button',{name:/Show more outcomes/}).click();
  await expect(page.getByTestId('forecast-row')).toHaveCount(286);expect(check.legacy()).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test('deleting all sportsbook data preserves system targets and filtering; exact execution stays secondary',async({page})=>{
  let current=structuredClone(source);delete current.lines;delete current.lines_meta;
  await setup(page,()=>current);await page.getByTestId('nfl-game').getByRole('button').filter({has:page.locator('h2')}).click();
  const before=await page.getByTestId('system-target').allTextContents();expect(before.length).toBe(10);
  await page.getByRole('button',{name:'RUSH',exact:true}).click();await expect(page.getByTestId('system-pick')).toHaveCount(4);await expect(page.getByTestId('system-target').first()).toContainText('40+ RUSHING YARDS');
  await page.getByRole('button',{name:'ALL',exact:true}).click();expect(await page.getByTestId('system-target').allTextContents()).toEqual(before);
  await page.getByRole('searchbox',{name:'Search player or team'}).fill('garrett');await expect(page.getByTestId('system-pick')).toHaveCount(2);
  await expect(page.getByTestId('system-target').last()).toContainText('50+ RECEIVING YARDS');
  current.lines=[{game_id:'2026_04_NYJ_CHI',horizon:'T90',player:'garrett wilson',outcome:'rec',book:'DraftKings',line:3.5,over_price:-110}];
  await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await page.getByRole('button',{name:'BETTABLE NOW',exact:true}).click();await page.getByTestId('nfl-game').getByRole('button').filter({has:page.locator('h2')}).click();
  await expect(page.getByTestId('system-target')).toContainText('4+ RECEPTIONS');await expect(page.getByTestId('available-market')).toContainText('OVER 3.5');await expect(page.getByTestId('system-pick')).toHaveCount(1);
});
test('separate horizons, empty targets, malformed/stale errors and no fallback',async({page})=>{
  let current=structuredClone(source);current.forecasts.T24=structuredClone(current.forecasts.T90);
  const id=current.row_fields.indexOf('id');current.forecasts.T24.forEach((r:any[])=>{const old=r[id];r[id]='T24-'+old;current.alt_65[r[id]]=null;});
  current.games[0].horizons.T24={...current.games[0].horizons.T90,cutoff:'2026-10-03T17:00:00Z'};current.status.counts.T24.valid_games=1;
  const check=await setup(page,()=>current);await page.getByRole('button',{name:'T24',exact:true}).click();await expect(page.getByTestId('nfl-game')).toContainText('0 SYSTEM PICKS');await page.getByTestId('nfl-game').getByRole('button').filter({has:page.locator('h2')}).click();await expect(page.getByText('No model-derived 65%+ system picks are available for this game.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'T90',exact:true}).click();await expect(page.getByTestId('nfl-game')).toContainText('10 SYSTEM PICKS');
  current={picks:[{date:'2026-09-27'}]} as any;await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await expect(page.getByRole('alert')).toContainText('legacy picks are unsupported');await expect(page.getByTestId('nfl-game')).toHaveCount(0);
  current=structuredClone(source);current.status.last_shadow_run_utc='2026-09-27T15:00:00Z';await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await expect(page.getByRole('alert')).toContainText('Stale NFL');expect(check.legacy()).toBe(0);
});
test('polling refreshes; older publications and upstream errors clear previous games',async({page})=>{
  let current=structuredClone(source);const check=await setup(page,()=>current);
  await page.clock.fastForward(30000);await expect.poll(()=>check.requests.length).toBeGreaterThanOrEqual(2);
  current.status.last_shadow_run_utc='2026-10-04T15:00:00Z';await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await expect(page.getByRole('alert')).toContainText('predates the last accepted artifact');
  await page.route('**/api/nfl-phase1-predictions?*',route=>route.fulfill({status:502,json:{error:'NFL Phase 1 upstream unavailable',details:'GitHub HTTP 503'}}));
  await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await expect(page.getByRole('alert')).toContainText('GitHub HTTP 503');await expect(page.getByTestId('nfl-game')).toHaveCount(0);expect(check.legacy()).toBe(0);
});
test('360px filters/search discover uncapped targets; executable Geno target survives outside default ten',async({page})=>{
  let current=structuredClone(source);await setup(page,()=>current);
  await page.getByRole('button',{name:'RUSH',exact:true}).click();
  await expect(page.getByTestId('today-best')).toHaveCount(4);
  await page.getByTestId('nfl-game').getByRole('button').filter({has:page.locator('h2')}).click();await expect(page.getByTestId('system-pick')).toHaveCount(4);
  for(const player of ['geno smith','braelon allen','kyle monangai'])await expect(page.getByTestId('system-pick').filter({hasText:player})).toHaveCount(1);
  await page.getByRole('button',{name:'ALL',exact:true}).click();await page.getByRole('searchbox',{name:'Search player or team'}).fill('Geno Smith');
  await expect(page.getByTestId('system-pick')).toHaveCount(3);await expect(page.getByTestId('today-best')).toHaveCount(3);
  await expect(page.getByTestId('system-target').first()).toContainText('10+ RUSHING YARDS');
  current.lines=[{game_id:'2026_04_NYJ_CHI',horizon:'T90',player:'Geno Smith',outcome:'rush_yds',book:'Test book',line:9.5,over_price:-110}];
  await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await page.getByRole('button',{name:'BETTABLE NOW',exact:true}).click();
  await page.getByTestId('nfl-game').getByRole('button').filter({has:page.locator('h2')}).click();await expect(page.getByTestId('system-pick')).toHaveCount(1);await expect(page.getByTestId('available-market')).toContainText('OVER 9.5');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
