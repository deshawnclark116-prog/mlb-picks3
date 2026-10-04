import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deriveAlt65 } from '../../src/nfl/phase1';
const original=JSON.parse(readFileSync(new URL('../fixtures/nfl-phase1-oct4.json',import.meta.url),'utf8'));
const records=JSON.parse(readFileSync(new URL('../fixtures/nfl-phase1-distributions.json',import.meta.url),'utf8'));
const doc=()=>({...structuredClone(original),alt_65:Object.fromEntries(records.map((r:any)=>[r.id,deriveAlt65(r)]))});
async function setup(page:any,get:()=>any,time='2026-10-04T16:00:00Z'){
  await page.clock.install({time:new Date(time)});
  let legacy=0,requests:string[]=[];
  await page.route('**/api/**',async(route:any)=>{
    const url=route.request().url();
    if(url.includes('/api/nfl-phase1-predictions')){requests.push(url);await route.fulfill({json:get(),headers:{'X-Forecast-Retrieved-At':'2026-10-04T16:00:00Z','Cache-Control':'no-store'}});}
    else {if(url.includes('/api/nfl-predictions'))legacy++;await route.fulfill({json:{picks:[{date:'2026-09-27',matchup:'LEGACY SEPT 27'}],predictions:[],games:[]}});}
  });
  await page.goto('/'); await page.locator('#tab-btn-nfl').click();
  return {requests,legacy:()=>legacy};
}
test('360px Oct 4 T90 matchup, median/details/alt, touch targets and no legacy requests',async({page})=>{
  const check=await setup(page,doc);
  await page.getByRole('button',{name:'MODEL BOARD',exact:true}).click();
  await expect(page.getByRole('button',{name:'T24',exact:true})).toBeDisabled();
  await expect(page.getByText('No valid T24 forecast captured.')).toBeVisible();
  const game=page.getByTestId('nfl-game');await expect(game).toContainText('ARI vs NYG');await expect(game).toContainText('Sun, Oct 4');await expect(game).toContainText('1:00 PM EDT');await expect(game).toContainText('T90 · 3 player outcomes');
  await game.getByRole('button').click();
  const rush=page.getByTestId('forecast-row').filter({hasText:'devin singletary'});
  await expect(rush.getByTestId('model-projection')).toContainText('11 yds');await expect(rush).toContainText('Expected average (mean)');await expect(rush).toContainText('16.8 yds');await expect(rush).toContainText('2–25 yds');await expect(rush).toContainText('0–41 yds');
  await expect(page.getByTestId('forecast-row').filter({hasText:'tremaine edmunds'}).getByTestId('alt-line')).toContainText('6+ tackles');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const widths=await page.locator('#nfl-today-screen-wrapper').evaluate((el)=>({width:el.clientWidth,scroll:el.scrollWidth}));expect(widths.scroll).toBeLessThanOrEqual(widths.width);
  for(const label of ['Refresh NFL forecasts','T90','T24']){const box=await page.getByRole('button',{name:label,exact:true}).boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);}
  expect(check.legacy()).toBe(0);await expect(page.locator('#nfl-today-screen-wrapper')).not.toContainText('Sep 27');
  await page.screenshot({path:process.env.NFL_SCREENSHOT || '/tmp/nfl-phase1-mobile.png',fullPage:true});
});
test('horizon switching isolates rows and refresh replaces entire snapshot; malformed/stale fail visibly',async({page})=>{
  let current=doc();current.forecasts.T24=structuredClone(current.forecasts.T90);
  const id=current.row_fields.indexOf('id'),median=current.row_fields.indexOf('median');
  current.forecasts.T24.forEach((r:any[])=>{r[id]='T24-'+r[id];r[median]=77;});current.games[0].horizons.T24={...current.games[0].horizons.T90,cutoff:'2026-10-03T17:00:00Z'};current.status.counts.T24.valid_games=1;
  const check=await setup(page,()=>current);
  await page.getByRole('button',{name:'MODEL BOARD',exact:true}).click();
  await page.getByRole('button',{name:'T24',exact:true}).click();await page.getByTestId('nfl-game').getByRole('button').click();
  await expect(page.getByTestId('model-projection').first()).toContainText('77');
  await page.getByRole('button',{name:'T90',exact:true}).click();await page.getByTestId('nfl-game').getByRole('button').click();await expect(page.getByTestId('model-projection').first()).not.toContainText('77');
  current=doc();current.games=[];current.forecasts.T90=[];current.status.counts.T90.valid_games=0;current.status.last_shadow_run_utc='2026-10-04T16:00:01Z';
  await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await expect(page.getByTestId('nfl-game')).toHaveCount(0);expect(check.requests.length).toBeGreaterThanOrEqual(2);
  current={picks:[{date:'2026-09-27'}]} as any;await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await expect(page.getByRole('alert')).toContainText('legacy picks are unsupported');await expect(page.getByTestId('nfl-game')).toHaveCount(0);
  current=doc();current.status.last_shadow_run_utc='2026-09-27T15:00:00Z';await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await expect(page.getByRole('alert')).toContainText('Stale NFL');expect(check.legacy()).toBe(0);
});
test('30-second polling refetches; older publication and upstream failures clear cards',async({page})=>{
  let current=doc();const check=await setup(page,()=>current);
  await page.getByRole('button',{name:'MODEL BOARD',exact:true}).click();
  await expect(page.getByTestId('nfl-game')).toHaveCount(1);
  await page.clock.fastForward(30000);await expect.poll(()=>check.requests.length).toBeGreaterThanOrEqual(2);
  expect(new Set(check.requests).size).toBe(check.requests.length);
  current.status.last_shadow_run_utc='2026-10-04T15:40:00Z';await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();
  await expect(page.getByRole('alert')).toContainText('predates the last accepted artifact');await expect(page.getByTestId('nfl-game')).toHaveCount(0);
  await page.route('**/api/nfl-phase1-predictions?*',route=>route.fulfill({status:502,json:{error:'NFL Phase 1 upstream unavailable or invalid',details:'GitHub upstream HTTP 503'}}));
  await page.getByRole('button',{name:'Refresh NFL forecasts'}).click();await expect(page.getByRole('alert')).toContainText('GitHub upstream HTTP 503');await expect(page.getByTestId('nfl-game')).toHaveCount(0);expect(check.legacy()).toBe(0);
});
const nyjSource=JSON.parse(readFileSync(new URL('../fixtures/nfl-nyj-chi-bettable.json',import.meta.url),'utf8'));
test('360px default BETTABLE ranks 10 picks, warns on old lines, filters; MODEL BOARD preserves 286 rows',async({page})=>{
  const check=await setup(page,()=>structuredClone(nyjSource),'2026-10-04T17:00:00Z');
  await expect(page.getByRole('button',{name:'BETTABLE',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByText('LINE MAY HAVE MOVED — verify before placing',{exact:true})).toBeVisible();
  const game=page.getByTestId('nfl-game');await expect(game).toContainText('NYJ vs CHI');await expect(game).toContainText('10 BETTABLE PICKS');await expect(game).not.toContainText('286 player outcomes');
  await game.getByRole('button').click();await expect(page.getByTestId('bettable-pick')).toHaveCount(10);
  const picks=page.getByTestId('bettable-pick');await expect(picks.first()).toContainText('geno smith');await expect(picks.first()).toContainText('OVER 11.5');await expect(picks.first()).toContainText('70.5%');
  await expect(page.locator('#nfl-today-screen-wrapper')).not.toContainText('tyson bagent');await expect(picks.first().getByTestId('alt-line')).toContainText('MODEL ALT TARGET');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'MODEL BOARD',exact:true}).click();await expect(game).toContainText('286 player outcomes');await game.getByRole('button').click();
  while(await page.getByRole('button',{name:/Show more outcomes/}).count())await page.getByRole('button',{name:/Show more outcomes/}).click();
  await expect(page.getByTestId('forecast-row')).toHaveCount(286);await expect(page.getByTestId('forecast-row').filter({hasText:'tyson bagent'}).first()).toBeAttached();
  await page.getByRole('button',{name:'BETTABLE',exact:true}).click();await page.getByRole('searchbox',{name:'Filter NFL players or teams'}).fill('garrett');await expect(game).toContainText('1 BETTABLE PICKS');await game.getByRole('button').click();
  await expect(page.getByTestId('bettable-pick')).toHaveCount(1);await expect(picks.first()).toContainText('UNDER 76.5');await expect(picks.first()).toContainText('58.7%');
  await page.getByRole('combobox',{name:'Filter NFL outcome'}).selectOption('tackles');await expect(page.getByTestId('bettable-pick')).toHaveCount(0);
  for(const name of ['BETTABLE','MODEL BOARD']){const box=await page.getByRole('button',{name,exact:true}).boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);}
  expect(check.legacy()).toBe(0);
});
