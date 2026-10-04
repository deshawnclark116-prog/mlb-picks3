import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync(new URL('../fixtures/nfl-nyj-chi-bettable.json',import.meta.url),'utf8'));
const artifacts=process.env.NFL_SCREENSHOT_DIR || '/workspace/scratch';
async function setup(page:any,get=()=>structuredClone(source)) {
 await page.clock.install({time:new Date('2026-10-04T17:00:00Z')});
 // Export must work with external fonts/images wholly unavailable.
 await page.route('https://**',route=>route.abort());
 let legacy=0;
 await page.route('**/api/**',route=>{
  if(route.request().url().includes('/api/nfl-phase1-predictions'))return route.fulfill({json:get()});
  if(route.request().url().includes('/api/nfl-predictions'))legacy++;
  return route.fulfill({json:{predictions:[],picks:[],games:[]}});
 });
 await page.goto('/');await page.locator('#tab-btn-nfl').click();await expect(page.getByTestId('nfl-game')).toHaveCount(get().games.length);
 return ()=>legacy;
}
async function labelSynthetic(page:any) {
 await page.evaluate(()=>{
  const label=()=>{const poster=document.querySelector('[data-testid="game-share-poster"]');if(!poster||poster.querySelector('[data-synthetic-label]'))return;
   const banner=document.createElement('div');banner.dataset.syntheticLabel='true';banner.textContent='SYNTHETIC VISUAL FIXTURE · TEST ONLY';
   Object.assign(banner.style,{position:'absolute',top:'0',left:'0',right:'0',height:'24px',zIndex:'99',background:'#8b2436',color:'white',textAlign:'center',font:'bold 16px Arial',lineHeight:'24px',letterSpacing:'2px'});poster.appendChild(banner);
  };new MutationObserver(label).observe(document.body,{childList:true,subtree:true});label();
 });
}
const open=async(page:any)=>{await page.getByRole('button',{name:'Create share card for NYJ vs CHI',exact:true}).click();return page.getByRole('dialog');};
test('360px modal, canonical source despite filters, real PNG download, exact dimensions, and honest bettable export',async({page})=>{
 test.setTimeout(60000);const legacy=await setup(page);
 await page.getByRole('button',{name:'RUSH',exact:true}).click();await page.getByRole('searchbox',{name:'Search player or team'}).fill('Geno Smith');
 const accordion=page.getByTestId('nfl-game').getByRole('button').filter({has:page.locator('h2')});await expect(accordion).toHaveAttribute('aria-expanded','false');
 const modal=await open(page);await expect(modal).toBeVisible();await expect(accordion).toHaveAttribute('aria-expanded','false');
 await expect(modal.getByRole('button',{name:'SYSTEM CARD',exact:true})).toHaveAttribute('aria-pressed','true');
 const poster=modal.getByTestId('game-share-poster');await expect(poster).toContainText('NYJ');await expect(poster).toContainText('CHI');await expect(poster).toContainText('26');await expect(poster.getByTestId('poster-core')).toContainText('dandre swift');await expect(poster.getByTestId('poster-core')).toContainText('kalif raymond');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
 const preview=await modal.getByTestId('share-preview').boundingBox();expect(preview!.x).toBeGreaterThanOrEqual(0);expect(preview!.x+preview!.width).toBeLessThanOrEqual(360);
 await page.screenshot({path:`${artifacts}/nfl-share-modal-360.png`});
 const downloadEvent=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const download=await downloadEvent;
 expect(download.suggestedFilename()).toBe('prop-edge-nyj-chi-t90-system-premium-w04.png');const png=`${artifacts}/prop-edge-nyj-chi-t90-system-premium-w04.png`;await download.saveAs(png);
 const bytes=readFileSync(png);expect(bytes.length).toBeGreaterThan(10000);expect(bytes.subarray(1,4).toString()).toBe('PNG');expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(1350);
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 // Capture the same poster component at its native size, with no second layout.
 await page.setViewportSize({width:1200,height:1800});await modal.evaluate(el=>{(el as HTMLElement).style.width='1114px';(el as HTMLElement).style.maxWidth='1114px';});
 await expect.poll(async()=>Math.round((await poster.boundingBox())!.width)).toBe(1080);
 await poster.screenshot({path:`${artifacts}/nfl-nyj-chi-system-preview.png`});await modal.evaluate(el=>{(el as HTMLElement).style.width='calc(100% - 16px)';(el as HTMLElement).style.maxWidth='520px';});await page.setViewportSize({width:360,height:800});
 await expect.poll(async()=>Math.round((await poster.boundingBox())!.width)).toBeLessThanOrEqual(330);
 await modal.getByRole('button',{name:'BETTABLE CARD',exact:true}).click();await expect(poster).toContainText('NO VERIFIED EXECUTION MATCHES');await expect(poster).toContainText('LINES MAY HAVE MOVED');
 await page.screenshot({path:`${artifacts}/nfl-share-bettable-360.png`});
 const betDownload=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const bet=await betDownload;expect(bet.suggestedFilename()).toBe('prop-edge-nyj-chi-t90-bettable-premium-w04.png');await bet.saveAs(`${artifacts}/prop-edge-nyj-chi-t90-bettable-premium-w04.png`);
 await modal.getByRole('button',{name:'CLOSE',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(accordion).toHaveAttribute('aria-expanded','false');
 for(const mode of ['BETTABLE NOW','MODEL BOARD','SYSTEM PICKS']){await page.getByRole('button',{name:mode,exact:true}).click();await expect(page.getByRole('button',{name:mode,exact:true})).toHaveAttribute('aria-pressed','true');}
 expect(legacy()).toBe(0);
});
test('all published games have sibling 44px image controls; system export works without sportsbook data',async({page})=>{
 const doc=structuredClone(source);delete doc.lines;delete doc.lines_meta;
 const second=structuredClone(doc.games[0]);second.game_id='2026_04_BUF_NE';second.away='BUF';second.home='NE';doc.games.push(second);doc.status.counts.T90.valid_games=2;
 const fields=doc.row_fields;const extra=doc.forecasts.T90.map((r:any[])=>{const copy=[...r];copy[fields.indexOf('game_id')]=second.game_id;copy[fields.indexOf('team')]=r[fields.indexOf('team')]==='NYJ'?'BUF':'NE';copy[fields.indexOf('opp')]=r[fields.indexOf('opp')]==='NYJ'?'BUF':'NE';const id=r[fields.indexOf('id')];copy[fields.indexOf('id')]='second-'+id;doc.alt_65['second-'+id]=doc.alt_65[id];return copy;});doc.forecasts.T90.push(...extra);
 await setup(page,()=>doc);for(const g of doc.games){const control=page.getByRole('button',{name:`Create share card for ${g.away} vs ${g.home}`});const box=await control.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);expect(await control.evaluate(el=>el.parentElement?.closest('button'))).toBe(null);}
 const modal=await open(page);await expect(modal.getByTestId('poster-core')).toContainText('dandre swift');await expect(modal.getByTestId('game-share-poster')).not.toContainText('LINES MAY HAVE MOVED');await modal.getByRole('button',{name:'CLOSE'}).click();
});
test('PNG prepares before click; share preserves user activation and save reuses the cached Blob',async({page})=>{
 test.setTimeout(60000);
 await page.addInitScript(()=>{
  const encode=HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL=function(...args){(window as any).__renders=((window as any).__renders||0)+1;return encode.apply(this,args);};
  Object.defineProperty(navigator,'canShare',{configurable:true,value:({files}:any)=>files?.[0]?.type==='image/png'});
  Object.defineProperty(navigator,'share',{configurable:true,value:({files}:any)=>{
   (window as any).__activation=navigator.userActivation.isActive;
   (window as any).__rendersAtShare=(window as any).__renders;
   (window as any).__sharedFile=files[0];
   return new Promise<void>(resolve=>(window as any).__finishShare=resolve);
  }});
 });
 await setup(page);
 await page.evaluate(()=>Object.defineProperty(document.fonts,'ready',{configurable:true,value:new Promise<void>(resolve=>(window as any).__releaseFonts=resolve)}));
 const modal=await open(page);
 await expect(modal.getByText('PREPARING IMAGE…',{exact:true})).toBeVisible();
 await expect(modal.getByRole('button',{name:'SHARE IMAGE',exact:true})).toBeDisabled();
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeDisabled();
 await page.evaluate(()=>(window as any).__releaseFonts());
 await expect(modal.getByRole('button',{name:'SHARE IMAGE',exact:true})).toBeEnabled();
 const initialRenders=await page.evaluate(()=>(window as any).__renders);expect(initialRenders).toBeGreaterThan(0);
 await modal.getByRole('button',{name:'SHARE IMAGE',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).__activation)).toBe(true);
 expect(await page.evaluate(()=>(window as any).__rendersAtShare)).toBe(initialRenders);
 await expect(modal.getByRole('button',{name:'CLOSE',exact:true})).toBeDisabled();
 await expect(modal.getByRole('button',{name:'SYSTEM CARD',exact:true})).toBeDisabled();
 await page.evaluate(()=>(window as any).__finishShare());
 await expect(modal.getByText('Image shared.',{exact:true})).toBeVisible();
 const event=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const download=await event;
 expect(download.suggestedFilename()).toBe('prop-edge-nyj-chi-t90-system-premium-w04.png');
 const saved=readFileSync((await download.path())!);
 const shared=await page.evaluate(async()=>Array.from(new Uint8Array(await (window as any).__sharedFile.arrayBuffer())));
 expect(saved.equals(Buffer.from(shared))).toBe(true);expect(await page.evaluate(()=>(window as any).__renders)).toBe(initialRenders);
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Denied','NotAllowedError');}}));
 await modal.getByRole('button',{name:'SHARE IMAGE',exact:true}).click();await expect(modal.getByText('File sharing is unavailable here. Use SAVE PNG.',{exact:true})).toBeVisible();
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();expect(await page.evaluate(()=>(window as any).__renders)).toBe(initialRenders);
});
test('mode invalidates cache; a stale successful render cannot overwrite the newer prepared PNG',async({page})=>{
 test.setTimeout(60000);await setup(page);
 await page.evaluate(()=>{
  const oldReady=new Promise<void>(resolve=>(window as any).__oldFonts=resolve);
  Object.defineProperty(document.fonts,'ready',{configurable:true,get(){(window as any).__oldStarted=true;return oldReady;}});
  const encode=HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL=function(...args){
   const n=(window as any).__renders=((window as any).__renders||0)+1;
   const ctx=this.getContext('2d')!;ctx.fillStyle=n===1?'red':'blue';ctx.fillRect(0,0,20,20);
   return encode.apply(this,args);
  };
 });
 const modal=await open(page);await expect(modal.getByText('PREPARING IMAGE…',{exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>(window as any).__oldStarted)).toBe(true);
 await page.evaluate(()=>Object.defineProperty(document.fonts,'ready',{configurable:true,value:new Promise<void>(resolve=>(window as any).__newFonts=resolve)}));
 await modal.getByRole('button',{name:'BETTABLE CARD',exact:true}).click();
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeDisabled();
 await expect(modal.getByRole('button',{name:'SHARE IMAGE',exact:true})).toBeDisabled();
 await page.evaluate(()=>(window as any).__newFonts());await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 const save=async()=>{const event=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const dl=await event;expect(dl.suggestedFilename()).toBe('prop-edge-nyj-chi-t90-bettable-premium-w04.png');return readFileSync((await dl.path())!);};
 const newer=await save();expect(await page.evaluate(()=>(window as any).__renders)).toBe(1);
 await page.evaluate(()=>(window as any).__oldFonts());await expect.poll(()=>page.evaluate(()=>(window as any).__renders)).toBe(2);
 // The two encodes intentionally differ; saving must still return the newer cache.
 expect((await save()).equals(newer)).toBe(true);await expect(modal.getByRole('alert')).toHaveCount(0);
 await modal.getByRole('button',{name:'SYSTEM CARD',exact:true}).click();await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await expect.poll(()=>page.evaluate(()=>(window as any).__renders)).toBe(3);
});
test('automatic renderer failure leaves the modal alive with a working retry path',async({page})=>{
 await setup(page);await page.evaluate(()=>{
  (window as any).__originalEncode=HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL=()=>{throw new Error('Canvas unavailable');};
 });
 const modal=await open(page);await expect(modal.getByRole('alert')).toContainText('Canvas unavailable');
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeDisabled();
 await expect(modal.getByRole('button',{name:'SHARE IMAGE',exact:true})).toBeDisabled();
 await page.evaluate(()=>{HTMLCanvasElement.prototype.toDataURL=(window as any).__originalEncode;});
 await modal.getByRole('button',{name:'RETRY IMAGE',exact:true}).click();await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await expect(modal.getByRole('alert')).toHaveCount(0);await modal.getByRole('button',{name:'CLOSE',exact:true}).click();await expect(page.getByTestId('nfl-game')).toHaveCount(1);
});
test('changed poster freshness automatically invalidates its prepared snapshot',async({page})=>{
 const doc=structuredClone(source);doc.lines_meta={generated_at_utc:'2026-10-04T16:00:30Z'};
 await setup(page,()=>doc);const modal=await open(page);
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await modal.getByRole('button',{name:'BETTABLE CARD',exact:true}).click();
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await expect(modal.getByTestId('game-share-poster')).not.toContainText('LINES MAY HAVE MOVED');
 await page.evaluate(()=>Object.defineProperty(document.fonts,'ready',{configurable:true,value:new Promise<void>(resolve=>(window as any).__snapshotFonts=resolve)}));
 await page.clock.fastForward(60001);
 await expect(modal.getByTestId('game-share-poster')).toContainText('LINES MAY HAVE MOVED');
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeDisabled();
 await expect(modal.getByText('PREPARING IMAGE…',{exact:true})).toBeVisible();
 await page.evaluate(()=>(window as any).__snapshotFonts());
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
});
test('premium SYSTEM, premium BETTABLE empty and clean SYSTEM export with theme-aware cache',async({page})=>{
 test.setTimeout(60000);await setup(page);const modal=await open(page),poster=modal.getByTestId('game-share-poster');
 const save=async(name:string)=>{await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();const event=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const download=await event;const path=`${artifacts}/${name}.png`;await download.saveAs(path);const bytes=readFileSync(path);expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(1350);return bytes;};
 await expect(poster).toHaveAttribute('data-theme','premium');
 const premium=await save('nfl-premium-system');await expect(poster.getByTestId('poster-logo')).toHaveCount(2);await expect(poster.getByTestId('poster-art')).toHaveCount(1);await expect(poster.getByTestId('poster-player-slots')).toHaveCount(2);
 await page.screenshot({path:`${artifacts}/nfl-premium-modal-360.png`});
 // Family leaders must sit below, rather than overlap, the recommendation grid.
 const core=await poster.getByTestId('poster-core').boundingBox();const leaders=await poster.getByRole('heading',{name:'MODEL LEADERS',exact:true}).boundingBox();expect(leaders!.y).toBeGreaterThanOrEqual(core!.y+core!.height);
 await modal.getByRole('button',{name:'BETTABLE CARD',exact:true}).click();await expect(poster).toContainText('NO VERIFIED EXECUTION MATCHES');await expect(poster).toContainText('System targets remain sportsbook-independent');
 await save('nfl-premium-bettable-empty');await page.screenshot({path:`${artifacts}/nfl-premium-bettable-modal-360.png`});
 await modal.getByRole('button',{name:'SYSTEM CARD',exact:true}).click();await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await page.evaluate(()=>Object.defineProperty(document.fonts,'ready',{configurable:true,value:new Promise<void>(resolve=>(window as any).__themeFonts=resolve)}));
 await modal.getByRole('button',{name:'CLEAN',exact:true}).click();await expect(poster).toHaveAttribute('data-theme','clean');await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeDisabled();
 await page.evaluate(()=>(window as any).__themeFonts());const clean=await save('nfl-clean-system');expect(clean.equals(premium)).toBe(false);
 await expect(poster.getByTestId('poster-art')).toHaveCount(0);await expect(poster.getByTestId('poster-logo')).toHaveCount(2);await expect(poster.getByTestId('poster-core')).toContainText('dandre swift');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);await page.screenshot({path:`${artifacts}/nfl-clean-modal-360.png`});
});
test('missing artwork and logos gracefully fall back and still export exact-size premium PNG',async({page})=>{
 await setup(page);await page.route('**/nfl/art/**',route=>route.abort());await page.route('**/nfl/teams/**',route=>route.abort());
 const modal=await open(page),poster=modal.getByTestId('game-share-poster');await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await expect(poster.getByTestId('poster-art')).toHaveCount(0);await expect(poster.getByTestId('poster-logo')).toHaveCount(0);await expect(poster.getByTestId('poster-logo-fallback')).toHaveCount(2);await expect(modal.getByRole('alert')).toHaveCount(0);
 const event=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const download=await event;const path=`${artifacts}/nfl-premium-all-assets-missing.png`;await download.saveAs(path);const bytes=readFileSync(path);expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(1350);
});
test('SYNTHETIC VISUAL FIXTURE: verified local cutouts resolve for selected names, missing assets fall back and RETRY IMAGE recovers',async({page})=>{
 test.setTimeout(60000);await setup(page);await labelSynthetic(page);
 await page.evaluate(async()=>{const path='/src/nfl/posterAssets.ts';const module=await import(/* @vite-ignore */path);module.POSTER_ASSETS.players={'jeremy-ruckert':{src:'/nfl/players/jeremy-ruckert.svg',source:'Test-only original vector fixture',permission:'Original fixture, not a real likeness',verified:true}};});
 let fail=true;await page.route('**/nfl/players/jeremy-ruckert.svg*',route=>fail?route.abort():route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="260"><circle cx="80" cy="40" r="28" fill="#eee"/><path d="M45 65h70l30 120H15z" fill="#7e9"/><path d="M40 185h80v75H40z" fill="#40505b"/></svg>'}));
 const modal=await open(page),poster=modal.getByTestId('game-share-poster');await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await expect(poster.getByTestId('generic-football-hero')).toHaveCount(4);await expect(modal.getByRole('button',{name:'RETRY IMAGE',exact:true})).toBeVisible();
 await page.screenshot({path:`${artifacts}/nfl-premium-no-real-cutouts-360.png`});
 fail=false;await modal.getByRole('button',{name:'RETRY IMAGE',exact:true}).click();await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await expect(poster.getByRole('img',{name:'Verified cutout: jeremy ruckert'})).toHaveCount(1);await expect(poster.getByTestId('generic-football-hero')).toHaveCount(3);
 await page.screenshot({path:`${artifacts}/SYNTHETIC-VISUAL-FIXTURE-nfl-premium-test-cutouts-360.png`});
 const event=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const dl=await event;await dl.saveAs(`${artifacts}/SYNTHETIC-VISUAL-FIXTURE-nfl-premium-test-cutouts.png`);
 const bytes=readFileSync((await dl.path())!);expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(1350);
 await modal.getByRole('button',{name:'CLEAN',exact:true}).click();await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();await expect(poster.getByTestId('generic-football-hero')).toHaveCount(0);await expect(poster.getByTestId('poster-player-slots')).toHaveCount(0);
});
test('SYNTHETIC VISUAL FIXTURE: non-Chicago home team has intentional coastal stadium scene and exports premium poster',async({page})=>{
 const doc=structuredClone(source),fields=doc.row_fields;doc.games[0].home='NE';doc.games[0].game_id='2026_04_NYJ_NE';
 for(const row of doc.forecasts.T90){row[fields.indexOf('game_id')]='2026_04_NYJ_NE';if(row[fields.indexOf('team')]==='CHI')row[fields.indexOf('team')]='NE';if(row[fields.indexOf('opp')]==='CHI')row[fields.indexOf('opp')]='NE';}
 await setup(page,()=>doc);await labelSynthetic(page);await page.getByRole('button',{name:'Create share card for NYJ vs NE',exact:true}).click();const modal=page.getByRole('dialog');await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await expect(modal.getByTestId('poster-city-scene')).toHaveCount(1);await expect(modal.getByTestId('poster-hero')).toContainText('NEW ENGLAND');await expect(modal.getByTestId('generic-football-hero')).toHaveCount(4);
 const event=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const dl=await event;await dl.saveAs(`${artifacts}/SYNTHETIC-VISUAL-FIXTURE-nfl-premium-new-england.png`);await page.screenshot({path:`${artifacts}/SYNTHETIC-VISUAL-FIXTURE-nfl-premium-new-england-360.png`});
 const bytes=readFileSync((await dl.path())!);expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(1350);
});
test('stale pending asset preparation cannot overwrite a newer clean theme',async({page})=>{
 await setup(page);let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/nfl/art/chicago-night.svg',async route=>{await held;await route.continue();});
 const modal=await open(page);await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeDisabled();
 await modal.getByRole('button',{name:'CLEAN',exact:true}).click();await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();const response=page.waitForResponse(r=>r.url().endsWith('/nfl/art/chicago-night.svg'));release();await response;
 await expect(modal.getByTestId('game-share-poster')).toHaveAttribute('data-theme','clean');await expect(modal.getByTestId('generic-football-hero')).toHaveCount(0);
 const event=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();expect((await event).suggestedFilename()).toBe('prop-edge-nyj-chi-t90-system-clean-w04.png');
});

test('PREMIUM sports composition: dominant heroes, editorial pick hierarchy; CLEAN remains a compact grid',async({page})=>{
 await setup(page);const modal=await open(page),poster=modal.getByTestId('game-share-poster');await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 const hero=await poster.getByTestId('poster-hero').evaluate(el=>(el as HTMLElement).offsetHeight);expect(hero).toBeGreaterThan(500);
 const figures=await poster.getByTestId('premium-primary-hero').evaluateAll(els=>els.map(el=>(el as HTMLElement).offsetHeight));expect(figures).toEqual([590,590]);
 await expect(poster.getByTestId('poster-featured-pick')).toHaveCount(1);await expect(poster.getByTestId('poster-supporting-pick')).toHaveCount(5);
 expect(await poster.getByTestId('poster-core').evaluate(el=>getComputedStyle(el).display)).not.toBe('grid');
 const lead=await poster.getByTestId('poster-featured-pick').boundingBox(),support=await poster.getByTestId('poster-supporting-pick').first().boundingBox();expect(lead!.width).toBeGreaterThan(support!.width*1.8);expect(lead!.height).toBeGreaterThan(support!.height);
 const footer=await poster.locator('footer').boundingBox(),leaders=await poster.getByTestId('premium-scouting-strip').boundingBox();expect(leaders!.y+leaders!.height).toBeLessThan(footer!.y);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
 await modal.getByRole('button',{name:'CLEAN',exact:true}).click();await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await expect(poster.getByTestId('poster-featured-pick')).toHaveCount(0);expect(await poster.getByTestId('poster-core').evaluate(el=>getComputedStyle(el).display)).toBe('grid');await expect(poster.getByTestId('generic-football-hero')).toHaveCount(0);
});

test('verified BETTABLE execution overlays stay subordinate and inside editorial pick blocks',async({page})=>{
 const doc=structuredClone(source),f=doc.row_fields;
 doc.lines=doc.forecasts.T90.flatMap((row:any[])=>{const target=doc.alt_65[row[f.indexOf('id')]];return target?[{game_id:row[f.indexOf('game_id')],horizon:'T90',player:row[f.indexOf('player')],outcome:row[f.indexOf('outcome')],book:'DraftKings',line:target.milestone-.5,over_price:-110}]:[];});
 await setup(page,()=>doc);const modal=await open(page);await modal.getByRole('button',{name:'BETTABLE CARD',exact:true}).click();await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 const poster=modal.getByTestId('game-share-poster');await expect(poster.getByTestId('poster-featured-pick')).toHaveCount(1);await expect(poster.getByTestId('poster-supporting-pick')).toHaveCount(5);
 for(const tile of [poster.getByTestId('poster-featured-pick'),...await poster.getByTestId('poster-supporting-pick').all()]){
  const available=tile.getByText(/AVAILABLE · DraftKings/);await expect(available).toBeVisible();const outer=await tile.boundingBox(),inner=await available.boundingBox();expect(inner!.y+inner!.height).toBeLessThanOrEqual(outer!.y+outer!.height+1);
 }
 await expect(poster).not.toContainText('NO SPORTSBOOK INPUTS');await expect(poster).toContainText('SPORTSBOOK DATA USED ONLY FOR EXECUTION');
});
