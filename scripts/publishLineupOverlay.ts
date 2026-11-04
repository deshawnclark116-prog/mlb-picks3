/** Scheduled job: fetch injury / scratch / starter info (GitHub's network can reach ESPN and the NHL API) and publish it as
 *  docs/lineup_overlay/<sport>.json for the app to read. Writes only when something changed, or when the file is >25 min old. */
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {loadNbaV3Shadow} from '../server/nbaV3Shadow.ts';
import {loadNhlCountResearch} from '../server/nhlCountResearch.ts';
import {loadNbaStatus,loadNhlStatus,mergeStatusMaps,serializeStatus,PUBLISHED_SCHEMA} from '../server/lineupOverlay.ts';

const DIR='docs/lineup_overlay/';
const FRESH_MS=25*60_000;
const etDay=(ms:number)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(ms));

function write(sport:'nba'|'nhl',games:Record<string,unknown>,now:number){
 const file=DIR+sport+'.json';
 let old:any=null;try{old=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null;}catch{old=null;}
 const same=old&&old.schema===PUBLISHED_SCHEMA&&JSON.stringify(old.games)===JSON.stringify(games);
 if(same&&now-Date.parse(old.generated_at)<FRESH_MS){console.log(sport,'unchanged, not rewritten');return;}
 writeFileSync(file,JSON.stringify({schema:PUBLISHED_SCHEMA,sport,generated_at:new Date(now).toISOString(),
   note:'Injury/scratch/starter statuses only. Never a forecast; applied by server/lineupOverlay.ts.',games},null,1)+'\n');
 console.log(sport,'written,',Object.keys(games).length,'games');
}

const now=Date.now();
mkdirSync(DIR,{recursive:true});
try{
 const nba=loadNbaV3Shadow(new Date(now));
 const st=await loadNbaStatus(nba.games,fetch,now,36);
 write('nba',serializeStatus(st),now);
}catch(e){console.log('NBA lineup publish failed:',String(e));}
try{
 let merged=new Map();
 for(const date of [etDay(now),etDay(now+24*3600_000)]){
  try{
   const src:any=await loadNhlCountResearch(date);
   const st=await loadNhlStatus(date,src.projections??[],fetch,now,36);
   merged=mergeStatusMaps(merged,st);
  }catch(e){console.log('NHL',date,'skipped:',String(e).slice(0,100));}
 }
 write('nhl',serializeStatus(merged),now);
}catch(e){console.log('NHL lineup publish failed:',String(e));}
