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
const open=async(page:any)=>{await page.getByRole('button',{name:'Create share card for NYJ vs CHI',exact:true}).click();return page.getByRole('dialog');};
test('360px modal, canonical source despite filters, real PNG download, exact dimensions, and honest bettable export',async({page})=>{
 test.setTimeout(60000);await setup(page);
 await page.getByRole('button',{name:'Filter',exact:true}).click();
  await page.getByRole('button',{name:'RUSH',exact:true}).click();await page.getByRole('searchbox',{name:'Search player or team'}).fill('Geno Smith');
 const accordion=page.getByTestId('nfl-game').getByRole('button').filter({has:page.locator('h2')});await expect(accordion).toHaveAttribute('aria-expanded','false');
 const modal=await open(page);await expect(modal).toBeVisible();await expect(accordion).toHaveAttribute('aria-expanded','false');
 await expect(modal.getByRole('button',{name:'SYSTEM CARD',exact:true})).toHaveAttribute('aria-pressed','true');
 const poster=modal.getByTestId('game-share-poster');await expect(poster).toContainText('NYJ');await expect(poster).toContainText('CHI');await expect(poster).toContainText('26');await expect(poster.getByTestId('poster-core')).toContainText('dandre swift');await expect(poster.getByTestId('poster-core')).toContainText('kalif raymond');
 // Compare the rendered 1080x1350 image SOURCE against the normal player
 // forecast screen: actual medians must lead; lower targets stay secondary.
 await expect(poster).toContainText('PREDICTED PLAYER STATS');
 await expect(poster.getByTestId('poster-model-median')).toHaveCount(6);
 await expect(poster.getByTestId('poster-core')).toContainText('MODEL PROJECTION · MEDIAN');
 await expect(poster.getByTestId('poster-core')).toContainText('TARGET:');
 await expect(poster.getByTestId('poster-core')).toContainText('TARGET HIT CHANCE · NOT MEDIAN ACCURACY');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=360)).toBe(true);
 const preview=await modal.getByTestId('share-preview').boundingBox();expect(preview!.x).toBeGreaterThanOrEqual(0);expect(preview!.x+preview!.width).toBeLessThanOrEqual(360);
 await page.screenshot({path:`${artifacts}/nfl-share-modal-360.png`});
 const downloadEvent=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const download=await downloadEvent;
 expect(download.suggestedFilename()).toBe('prop-edge-nyj-chi-t90-system-w04.png');const png=`${artifacts}/prop-edge-nyj-chi-t90-system-w04.png`;await download.saveAs(png);
 const bytes=readFileSync(png);expect(bytes.length).toBeGreaterThan(10000);expect(bytes.subarray(1,4).toString()).toBe('PNG');expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(1350);
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 // Capture the same poster component at its native size, with no second layout.
 await page.setViewportSize({width:1200,height:1800});await modal.evaluate(el=>{(el as HTMLElement).style.width='1114px';(el as HTMLElement).style.maxWidth='1114px';});
 await expect.poll(async()=>Math.round((await poster.boundingBox())!.width)).toBe(1080);
 await poster.screenshot({path:`${artifacts}/nfl-nyj-chi-system-preview.png`});await modal.evaluate(el=>{(el as HTMLElement).style.width='calc(100% - 16px)';(el as HTMLElement).style.maxWidth='520px';});await page.setViewportSize({width:360,height:800});
 await expect.poll(async()=>Math.round((await poster.boundingBox())!.width)).toBeLessThanOrEqual(330);
 await modal.getByRole('button',{name:'BETTABLE CARD',exact:true}).click();await expect(poster).toContainText('NO VERIFIED EXECUTION MATCHES');await expect(poster).toContainText('LINES MAY HAVE MOVED');
 await page.screenshot({path:`${artifacts}/nfl-share-bettable-360.png`});
 const betDownload=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const bet=await betDownload;expect(bet.suggestedFilename()).toBe('prop-edge-nyj-chi-t90-bettable-w04.png');await bet.saveAs(`${artifacts}/prop-edge-nyj-chi-t90-bettable-w04.png`);
 await modal.getByRole('button',{name:'CLOSE',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(accordion).toHaveAttribute('aria-expanded','false');
 for(const mode of ['BETTABLE NOW','MODEL BOARD','SYSTEM PICKS']){await page.getByRole('button',{name:mode,exact:true}).click();await expect(page.getByRole('button',{name:mode,exact:true})).toHaveAttribute('aria-pressed','true');}
 // The separate weekly NFL feed now loads legitimately for other matchups.
 // SYSTEM poster independence from that feed is asserted by the unit tests
 // and by complete PNG generation with external network requests blocked.
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
 expect(await page.evaluate(()=>(window as any).__renders)).toBe(2);
 await modal.getByRole('button',{name:'SHARE IMAGE',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).__activation)).toBe(true);
 expect(await page.evaluate(()=>(window as any).__rendersAtShare)).toBe(2);
 await expect(modal.getByRole('button',{name:'CLOSE',exact:true})).toBeDisabled();
 await expect(modal.getByRole('button',{name:'SYSTEM CARD',exact:true})).toBeDisabled();
 await page.evaluate(()=>(window as any).__finishShare());
 await expect(modal.getByText('Image shared.',{exact:true})).toBeVisible();
 const event=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const download=await event;
 expect(download.suggestedFilename()).toBe('prop-edge-nyj-chi-t90-system-w04.png');
 const saved=readFileSync((await download.path())!);
 const shared=await page.evaluate(async()=>Array.from(new Uint8Array(await (window as any).__sharedFile.arrayBuffer())));
 expect(saved.equals(Buffer.from(shared))).toBe(true);expect(await page.evaluate(()=>(window as any).__renders)).toBe(2);
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Denied','NotAllowedError');}}));
 await modal.getByRole('button',{name:'SHARE IMAGE',exact:true}).click();await expect(modal.getByText('File sharing is unavailable here. Use SAVE PNG.',{exact:true})).toBeVisible();
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();expect(await page.evaluate(()=>(window as any).__renders)).toBe(2);
});
test('mode invalidates cache; a stale successful render cannot overwrite the newer prepared PNG',async({page})=>{
 test.setTimeout(60000);await setup(page);
 await page.evaluate(()=>{
  Object.defineProperty(document.fonts,'ready',{configurable:true,value:new Promise<void>(resolve=>(window as any).__oldFonts=resolve)});
  const encode=HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL=function(...args){
   const n=(window as any).__renders=((window as any).__renders||0)+1;
   const ctx=this.getContext('2d')!;ctx.fillStyle=n===1?'red':'blue';ctx.fillRect(0,0,20,20);
   return encode.apply(this,args);
  };
 });
 const modal=await open(page);await expect(modal.getByText('PREPARING IMAGE…',{exact:true})).toBeVisible();
 await page.evaluate(()=>Object.defineProperty(document.fonts,'ready',{configurable:true,value:new Promise<void>(resolve=>(window as any).__newFonts=resolve)}));
 await modal.getByRole('button',{name:'BETTABLE CARD',exact:true}).click();
 await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeDisabled();
 await expect(modal.getByRole('button',{name:'SHARE IMAGE',exact:true})).toBeDisabled();
 await page.evaluate(()=>(window as any).__newFonts());await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 const save=async()=>{const event=page.waitForEvent('download');await modal.getByRole('button',{name:'SAVE PNG',exact:true}).click();const dl=await event;expect(dl.suggestedFilename()).toBe('prop-edge-nyj-chi-t90-bettable-w04.png');return readFileSync((await dl.path())!);};
 const newer=await save();expect(await page.evaluate(()=>(window as any).__renders)).toBe(1);
 await page.evaluate(()=>(window as any).__oldFonts());await expect.poll(()=>page.evaluate(()=>(window as any).__renders)).toBe(3);
 // The two encodes intentionally differ; saving must still return the newer cache.
 expect((await save()).equals(newer)).toBe(true);await expect(modal.getByRole('alert')).toHaveCount(0);
 await modal.getByRole('button',{name:'SYSTEM CARD',exact:true}).click();await expect(modal.getByRole('button',{name:'SAVE PNG',exact:true})).toBeEnabled();
 await expect.poll(()=>page.evaluate(()=>(window as any).__renders)).toBe(4);
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
