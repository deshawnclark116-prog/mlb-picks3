import {teamBrand} from './teamBrand';
import type {GameShareData} from './shareCard';
import type {Phase1View,Horizon} from './phase1';
import {systemCandidates,compareSystem,type SystemPick} from './bettable';
import {POSTER_THEMES,type PosterTheme} from './posterTheme';
import {playerKey,type LicensedCutout} from './playerAssets';
import {LICENSED_PLAYER_ASSETS} from './licensedPlayerAssets';
import {cityAtmosphere} from './cityAtmosphere';
export interface FeaturedPlayer {team:string;name:string;key:string}
export interface PlayerArt extends FeaturedPlayer {src:string|null;kind:'cutout'|'generic'}
export interface PosterAssetConfig {games?:Record<string,{background?:string}>;players?:Record<string,LicensedCutout>}
export const POSTER_ASSETS:PosterAssetConfig={games:{},players:LICENSED_PLAYER_ASSETS};
export function localAsset(path?:string|null):string|null {
 return path && /^\/nfl\/[a-zA-Z0-9_./-]+\.(png|webp|svg|jpg|jpeg)$/.test(path) && !path.includes('..')?path:null;
}
export function featuredFromCandidates(candidates:readonly SystemPick[],teams:readonly string[]):FeaturedPlayer[] {
 const ranked=[...candidates].sort(compareSystem);
 return teams.flatMap(team=>{const seen=new Set<string>();return ranked.filter(p=>{
  const key=playerKey(p.row.player);if(p.row.team!==team||!key||seen.has(key))return false;seen.add(key);return true;
 }).slice(0,2).map(p=>({team,name:p.row.player,key:playerKey(p.row.player)}));});
}
/** Full eligible SYSTEM pool, independent of sportsbook/mode/screen filters. */
export function featuredPlayers(view:Phase1View,gameId:string,horizon:Horizon) {
 const game=view.games.find(g=>g.game_id===gameId);
 return game?featuredFromCandidates(systemCandidates(view,horizon).filter(p=>p.row.game_id===gameId),[game.away,game.home]):[];
}
/** Decoration only: the feature pool is supplied separately from the displayed six picks. */
export function posterPresentation(data:GameShareData,theme:PosterTheme='premium',config:PosterAssetConfig=POSTER_ASSETS,featured:FeaturedPlayer[]=featuredFromCandidates(data.core,[data.game.away,data.game.home])) {
 const away=teamBrand(data.game.away),home=teamBrand(data.game.home),art=config.games?.[data.game.game_id];
 const players:PlayerArt[]=POSTER_THEMES[theme].heroes?featured.map(player=>{
  const asset=config.players?.[player.key],src=asset?.verified&&asset.permission&&asset.source?localAsset(asset.src):null;
  return {...player,src,kind:src?'cutout':'generic'};
 }):[];
 return {theme,away:{...away,logo:localAsset(away.logo)},home:{...home,logo:localAsset(home.logo)},background:POSTER_THEMES[theme].art?localAsset(art?.background??home.artwork):null,
  atmosphere:POSTER_THEMES[theme].art?cityAtmosphere(home.abbreviation):null,players,degraded:false};
}
export type PosterPresentation=ReturnType<typeof posterPresentation>;
/** Successes and pending requests are shared; failures are evicted immediately for genuine retry. */
export function createAssetLoader(probe:(path:string)=>Promise<boolean>) {
 const loaded=new Map<string,Promise<boolean>>();
 return (path:string)=>{
  const cached=loaded.get(path);if(cached)return cached;
  const pending=Promise.resolve().then(()=>probe(path)).catch(()=>false).then(ok=>{if(!ok&&loaded.get(path)===pending)loaded.delete(path);return ok;});
  loaded.set(path,pending);return pending;
 };
}
const load=createAssetLoader(path=>new Promise(resolve=>{
 const image=new Image();let done=false;
 const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timer);image.onload=null;image.onerror=null;resolve(ok);};
 const timer=setTimeout(()=>finish(false),4000);
 image.onload=()=>finish(image.naturalWidth>0);image.onerror=()=>finish(false);image.src=path;
}));
export async function preparePosterAssets(visual:PosterPresentation):Promise<PosterPresentation> {
 const paths=[visual.away.logo,visual.home.logo,visual.background,...visual.players.map(p=>p.src)].filter((p):p is string=>!!p);
 const results=await Promise.all(paths.map(async path=>[path,await load(path)] as const));
 const available=new Map(results),safe=(path:string|null)=>path && available.get(path)?path:null;
 return {...visual,degraded:results.some(([,ok])=>!ok),away:{...visual.away,logo:safe(visual.away.logo)},home:{...visual.home,logo:safe(visual.home.logo)},background:safe(visual.background),
  players:visual.players.map(p=>({...p,src:safe(p.src),kind:safe(p.src)?'cutout':'generic'}))};
}
