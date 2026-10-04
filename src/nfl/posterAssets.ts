import {teamBrand} from './teamBrand';
import type {GameShareData} from './shareCard';
import {POSTER_THEMES,type PosterTheme} from './posterTheme';
export interface PlayerArt {team:string;name:string;src:string}
export interface GameArt {background?:string;players?:PlayerArt[]}
export interface PosterAssetConfig {games?:Record<string,GameArt>}
/** Add verified local cutouts here; an empty registry intentionally produces logo-forward posters. */
export const POSTER_ASSETS:PosterAssetConfig={games:{}};
export function localAsset(path?:string|null):string|null {
 return path && /^\/nfl\/[a-zA-Z0-9_./-]+\.(png|webp|svg|jpg|jpeg)$/.test(path) && !path.includes('..')?path:null;
}
/** Decoration only: does not select, filter, rank or calculate picks. */
export function posterPresentation(data:GameShareData,theme:PosterTheme='premium',config:PosterAssetConfig=POSTER_ASSETS) {
 const away=teamBrand(data.game.away),home=teamBrand(data.game.home),art=config.games?.[data.game.game_id];
 const players:PlayerArt[]=[];
 if(POSTER_THEMES[theme].heroes) for(const team of [away.abbreviation,home.abbreviation]) {
  players.push(...(art?.players||[]).filter(p=>p.team===team && localAsset(p.src)).slice(0,2));
 }
 return {theme,away:{...away,logo:localAsset(away.logo)},home:{...home,logo:localAsset(home.logo)},
  background:POSTER_THEMES[theme].art?localAsset(art?.background??home.artwork):null,players};
}
export type PosterPresentation=ReturnType<typeof posterPresentation>;
const loaded=new Map<string,Promise<boolean>>();
function load(path:string):Promise<boolean> {
 if(!loaded.has(path))loaded.set(path,new Promise(resolve=>{
  const image=new Image();let done=false;
  const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timer);image.onload=null;image.onerror=null;resolve(ok);};
  const timer=setTimeout(()=>finish(false),4000);
  image.onload=()=>finish(image.naturalWidth>0);image.onerror=()=>finish(false);image.src=path;
 }));
 return loaded.get(path)!;
}
/** Resolve missing assets before DOM capture so failed requests cannot break the PNG. */
export async function preparePosterAssets(visual:PosterPresentation):Promise<PosterPresentation> {
 const paths=[visual.away.logo,visual.home.logo,visual.background,...visual.players.map(p=>p.src)].filter((p):p is string=>!!p);
 const results=await Promise.all(paths.map(async path=>[path,await load(path)] as const));
 const available=new Map(results),safe=(path:string|null)=>path && available.get(path)?path:null;
 return {...visual,away:{...visual.away,logo:safe(visual.away.logo)},home:{...visual.home,logo:safe(visual.home.logo)},background:safe(visual.background),players:visual.players.filter(p=>available.get(p.src))};
}
