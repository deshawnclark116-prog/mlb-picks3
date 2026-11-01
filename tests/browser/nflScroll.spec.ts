import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const artifact=JSON.parse(readFileSync(new URL('../fixtures/nfl-nyj-chi-bettable.json',import.meta.url),'utf8'));

async function openNfl(page:any){
 await page.clock.install({time:new Date('2026-10-04T17:00:00Z')});
 await page.route('**/api/**',async(route:any)=>{
  const url=route.request().url();
  if(url.includes('/api/nfl-phase1-predictions')){
   return route.fulfill({json:structuredClone(artifact),
    headers:{'X-Forecast-Retrieved-At':'2026-10-04T17:00:00Z'}});
  }
  if(url.includes('/api/nfl-predictions')){
   return route.fulfill({json:{
    season:2026,week:4,generated_at_utc:'2026-10-03T23:00:00Z',
    scheduled_games:[{home_team:'JAX',away_team:'PHI',
     kickoff_utc:'2026-10-04T13:30:00Z'}],picks:[]}});
  }
  return route.fulfill({status:503,json:{error:'Unavailable in isolated scroll test'}});
 });
 await page.goto('/');
 await page.locator('#tab-btn-nfl').click();
 await expect(page.locator('#nfl-scroll-area')).toBeVisible();
 await expect(page.getByTestId('nfl-game')).toHaveCount(1);
}
async function gesture(page:any,x:number,from:number,to:number){
 const cd=await page.context().newCDPSession(page);
 await cd.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',
  touchPoints:[{x,y:from,id:1}]});
 for(let i=1;i<=12;i++){
  await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[
   {x,y:Math.round(from+(to-from)*i/12),id:1}]});
  await new Promise(resolve=>setTimeout(resolve,20));
 }
 await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cd.detach();
}
test('NFL projections scroll by a real upward finger swipe on mobile',async({page})=>{
 await openNfl(page);
 const scroll=page.locator('#nfl-scroll-area');
 const info=await scroll.evaluate((el:HTMLElement)=>{
  const cs=getComputedStyle(el);
  return {client:el.clientHeight,content:el.scrollHeight,overflow:cs.overflowY,
    touchAction:cs.touchAction,rect:el.getBoundingClientRect().toJSON()};
 });
 expect(info.client).toBeGreaterThan(100);
 expect(info.content).toBeGreaterThan(info.client+150);
 expect(info.overflow).toBe('auto');
 await expect.poll(()=>scroll.evaluate(e=>e.scrollTop)).toBe(0);
 const bounds=await scroll.boundingBox();
 expect(bounds).not.toBeNull();
 const yBottom=Math.round(Math.min(bounds!.y+bounds!.height-50,730));
 const yTop=Math.round(Math.max(bounds!.y+50,yBottom-280));
 await gesture(page,Math.round(bounds!.x+bounds!.width/2),yBottom,yTop);
 await expect.poll(()=>scroll.evaluate(e=>e.scrollTop),{timeout:5000}).toBeGreaterThan(30);
 const scrolled=await scroll.evaluate(e=>e.scrollTop);
 await page.mouse.wheel(0,350);
 await expect.poll(()=>scroll.evaluate(e=>e.scrollTop)).toBeGreaterThan(scrolled);
 // The fixed navigation stays visible while the predictions themselves move.
 await expect(page.locator('#bottom-tab-navigation')).toBeVisible();
 await expect(page.locator('#app-native-header')).toBeVisible();
});
test('NFL expanded player projections scroll to last cards without horizontal overflow',async({page})=>{
 await openNfl(page);
 await page.getByTestId('nfl-game').getByRole('button').filter({has:page.locator('h2')}).click();
 await expect(page.getByTestId('system-pick')).toHaveCount(10);
 const scroll=page.locator('#nfl-scroll-area');
 await scroll.evaluate(el=>{el.scrollTop=el.scrollHeight;});
 await expect.poll(()=>scroll.evaluate(e=>e.scrollTop)).toBeGreaterThan(300);
 await expect(page.getByTestId('nfl-coverage')).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
 await scroll.focus();
 await page.keyboard.press('Home');
 await expect.poll(()=>scroll.evaluate(e=>e.scrollTop)).toBe(0);
 await page.keyboard.press('End');
 await expect.poll(()=>scroll.evaluate(e=>e.scrollTop)).toBeGreaterThan(300);
});

test('NFL stat filters still swipe horizontally on narrow mobile after vertical scroll fix',async({page})=>{
 await page.setViewportSize({width:300,height:760});
 await openNfl(page);
 const filter=page.locator('[aria-label="Outcome family"]');
 // The stat chips can be wider than a 360px phone, but must remain usable.
 const bounds=await filter.boundingBox();
 expect(bounds).not.toBeNull();
 const dims=await filter.evaluate(el=>({client:el.clientWidth,content:el.scrollWidth}));
 expect(dims.content).toBeGreaterThan(dims.client);
 const cd=await page.context().newCDPSession(page);
 await cd.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 const y=Math.round(bounds!.y+bounds!.height/2);
 const start=Math.round(bounds!.x+bounds!.width-22);
 const end=Math.round(bounds!.x+22);
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y,id:1}]});
 for(let i=1;i<=12;i++){
  await cd.send('Input.dispatchTouchEvent',{type:'touchMove',
   touchPoints:[{x:Math.round(start+(end-start)*i/12),y,id:1}]});
  await new Promise(resolve=>setTimeout(resolve,18));
 }
 await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cd.detach();
 await expect.poll(()=>filter.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 await expect(page.getByRole('button',{name:'TD',exact:true})).toBeVisible();
});
