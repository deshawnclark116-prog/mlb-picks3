import {test,expect} from '@playwright/test';

const day='2026-11-01',kickoff='2026-11-01T22:00:00Z';
const nhlPicks=Array.from({length:32},(_,i)=>({
 market:'shots_on_goal',prop_type:'shots_on_goal',player_id:'skater-'+i,
 player:'Skater '+String(i+1),team:i%2?'WSH':'PIT',
 opponent:i%2?'PIT':'WSH',season:2026,game_date:day,kickoff_utc:kickoff,
 pick:'OVER 2.5',line:2.5,model_prob:.65,prob_pct:65,confidence:'MEDIUM',
 games_played:5
}));
const fields=['game_id','player_id','player','team','opponent','game_date','scheduled_start',
 'mean','median','sd','p10','p25','p75','p90','p0','p_ge1','p_ge2','p_ge3','p_ge4','p_ge5'];
const historical=Array.from({length:80},(_,i)=>[
 'nhl-fixture','nhl-player-'+i,'Historical Skater '+i,i%2?'PIT':'WSH',i%2?'WSH':'PIT',
 day,kickoff,2.7,3,1.5,0,1,4,5,.1,.9,.65,.43,.2,.08
]);

async function setup(page:any){
 await page.clock.install({time:new Date('2026-11-01T14:00:00Z')});
 await page.route('**/api/**',route=>{
  const url=route.request().url();
  if(url.includes('/api/nhl-predictions'))return route.fulfill({json:{
    game_date:day,season:2026,generated_at_utc:'2026-11-01T12:00:00Z',
    picks:nhlPicks
  }});
  if(url.includes('/api/model-projections/nhl'))return route.fulfill({json:{
    schema:'nhl-v2-sog-nfl-style-shadow-v1',status:'RESEARCH_ONLY_NOT_VALIDATED_FOR_BETTING',
    dates:[day],horizons:['T90'],row_fields:fields,total_valid_forecasts:historical.length,
    forecasts:{T90:historical}
  }});
  if(url.includes('/api/predictions'))return route.fulfill({json:[]});
  if(url.includes('/api/games'))return route.fulfill({json:[]});
  return route.fulfill({status:503,json:{error:'offline'}}); 
 });
 await page.route('**/nhl-daily-shot-counts.json*',route=>route.fulfill({status:503,json:{error:'offline'}}));
 await page.goto('/');
 await page.locator('#tab-btn-nhl').click();
 const panel=page.locator('#motion-screen-NHL');
 await expect(panel).toBeVisible();
 await expect(panel.locator('#nhl-predictions-scroll-area')).toBeVisible();
 return panel;
}
async function touchSwipe(page:any,scroll:any){
 const bounds=await scroll.boundingBox();
 expect(bounds).not.toBeNull();
 const x=Math.round(bounds!.x+bounds!.width*.53);
 const from=Math.round(bounds!.y+bounds!.height-55);
 const to=Math.round(Math.max(bounds!.y+65,from-270));
 const cd=await page.context().newCDPSession(page);
 await cd.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:from,id:1}]});
 for(let i=1;i<=14;i++){
   await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[
     {x,y:Math.round(from+(to-from)*i/14),id:1}
   ]});
   await new Promise(resolve=>setTimeout(resolve,20));
 }
 await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cd.detach();
}
test('NHL current game projections scroll by real phone swipe through expanded cards',async({page})=>{
 const panel=await setup(page);
 await expect(panel.getByTestId('unified-sport-game').first()).toBeVisible();
 await panel.getByTestId('unified-sport-game').first().locator('button[aria-expanded]').click();
 await expect(panel.getByTestId('unified-sport-projection')).toHaveCount(32);
 const scroll=panel.locator('#nhl-predictions-scroll-area');
 const geometry=await scroll.evaluate((el:HTMLElement)=>({
  height:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY
 }));
 expect(geometry.height).toBeGreaterThan(140);
 expect(geometry.scroll).toBeGreaterThan(geometry.height+400);
 expect(geometry.overflow).toBe('auto');
 // Clicking a game can scroll it into view before the gesture starts.
 // Reset to the top so the test measures the swipe, not the click.
 await scroll.evaluate(el=>{el.scrollTop=0;});
 await expect.poll(()=>scroll.evaluate(el=>el.scrollTop)).toBe(0);
 await touchSwipe(page,scroll);
 await expect.poll(()=>scroll.evaluate(el=>el.scrollTop),{timeout:5000}).toBeGreaterThan(30);
 const after=await scroll.evaluate(el=>el.scrollTop);
 await page.mouse.wheel(0,320);
 await expect.poll(()=>scroll.evaluate(el=>el.scrollTop)).toBeGreaterThan(after);
 await expect(panel.locator('#nhl-screen-header')).toBeVisible();
 await expect(panel.locator('#nhl-filter-controls-board')).toBeVisible();
 await expect(page.locator('#bottom-tab-navigation')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
test('NHL expanded projections can reach last card with keyboard without page scrolling',async({page})=>{
 const panel=await setup(page);
 await expect(panel.getByTestId('unified-sport-game').first()).toBeVisible();
 await panel.getByTestId('unified-sport-game').first().locator('button[aria-expanded]').click();
 const scroll=panel.locator('#nhl-predictions-scroll-area');
 await scroll.focus();
 await page.keyboard.press('End');
 await expect.poll(()=>scroll.evaluate(el=>el.scrollTop)).toBeGreaterThan(450);
 await expect(panel.getByTestId('unified-sport-projection').last()).toBeInViewport();
 await page.keyboard.press('Home');
 await expect.poll(()=>scroll.evaluate(el=>el.scrollTop)).toBe(0);
 await expect(page.locator('#nhl-pull-indicator-bar')).toHaveCount(0);
});
test('NHL research archive scrolls separately and switching back preserves current scroll',async({page})=>{
 const panel=await setup(page);
 await panel.getByRole('button',{name:'Research archive'}).click();
 await expect(panel.getByText('NHL PREDICTIONS')).toBeVisible();
 await expect(panel.getByText('Historical Skater 0')).toBeVisible();
 const research=panel.locator('[class*="overflow-y-auto"]').first();
 const r=await research.evaluate(el=>({client:el.clientHeight,content:el.scrollHeight}));
 expect(r.content).toBeGreaterThan(r.client+200);
 await research.evaluate(el=>el.scrollTop=el.scrollHeight);
 await expect.poll(()=>research.evaluate(el=>el.scrollTop)).toBeGreaterThan(300);
 await panel.getByRole('button',{name:'Current predictions'}).click();
 await expect(panel.locator('#nhl-predictions-scroll-area')).toBeVisible();
 await expect(panel.getByRole('button',{name:'Shots on goal'})).toBeVisible();
 await panel.getByRole('button',{name:'All models'}).click();
 await expect(panel.getByRole('button',{name:'All models'})).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
});
