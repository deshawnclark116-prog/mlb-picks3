/** Broad soccer competition adapter.
 * Reads the full independent, daily-published open-matchday catalog.
 * Source identity is EXACT league folder + date + ordered team names;
 * no postgame fuzzy club linking or invented kickoffs.
 */
import type {Match} from './model';
import {csvFields} from './verifiedIndependentFinals';

export const WIDE_SOURCE_ROOT=
 'https://raw.githubusercontent.com/oladeeayo/open-matchday/master/';
export const WIDE_SCHEMA='soccer-wide-source-2627-v1' as const;
export const WIDE_SEASON='2026-27';
export type WideLeague={
 id:string;name:string;folder:string;results:number;fixtures:number;
 latest:string|null;errors:string[];
};
export type WideFixture={
 league:string;season:string;date:string;home:string;away:string;
 kickoffUtc:null;source:string;
};
export type WideParsed={results:Match[];fixtures:WideFixture[]};
export type WideCatalog={
 season:string;generated_at_utc:string;leagues:WideLeague[];
};
const dateOK=(x:string):boolean=>/^20\d\d-\d\d-\d\d$/.test(x)&&
 !Number.isNaN(Date.parse(x+'T00:00:00Z'))&&
 new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const folderOK=(s:string)=>/^data\/[A-Z]{2,4}_(?:[1-9]|U21|CUP)_[a-z0-9-]+$/.test(s);
const count=(x:unknown):x is number=>typeof x==='number'&&
 Number.isInteger(x)&&x>=0&&x<=100000;
const str=(x:unknown)=>typeof x==='string'?x.trim():'';
export const wideMatchKey=(x:Pick<Match,'league'|'date'|'home'|'away'>)=>
 JSON.stringify([x.league,x.date,x.home,x.away]);

export function readWideCatalog(raw:unknown):WideCatalog{
 const x=raw as (Partial<WideCatalog>&{generated_utc?:string})|null;
 // This actual upstream catalog uses generated_utc, not generated_at_utc.
 const generated=x?.generated_utc;
 if(!x||x.season!=='2627'||typeof generated!=='string'||
   !Number.isFinite(Date.parse(generated))||
   !Array.isArray(x.leagues)||x.leagues.length<5||x.leagues.length>300)
   throw Error('SOCCER_WIDE_INVALID_CATALOG');
 const seen=new Set<string>();
 const leagues=x.leagues.map(l=>{
   const folder=str(l.folder);
   const name=str((l as WideLeague & {league?:string}).league||l.name);
   if(!folderOK(folder)||seen.has(folder)||!name||
      !count(l.results)||!count(l.fixtures)||
      !Array.isArray(l.errors)||l.errors.some(e=>typeof e!=='string')||
      !(l.latest===null||typeof l.latest==='string'&&dateOK(l.latest)))
     throw Error('SOCCER_WIDE_INVALID_OR_DUPLICATED_COMPETITION');
   seen.add(folder);
   return {id:folder.slice(5),name,folder,
           results:l.results,fixtures:l.fixtures,latest:l.latest,errors:l.errors};
 });
 return {season:'2627',generated_at_utc:generated,leagues};
}

export function sourceUrls(l:WideLeague){
 return {results:WIDE_SOURCE_ROOT+l.folder+'/results_2627.csv',
         fixtures:WIDE_SOURCE_ROOT+l.folder+'/fixtures_2627.csv'};
}
function parseTable(raw:string,required:string[]){
 if(raw.length<15||raw.length>1500000)throw Error('SOCCER_WIDE_CSV_SIZE');
 const lines=raw.replace(/\r/g,'').trim().split('\n').filter(Boolean);
 const heads=csvFields(lines[0]);
 if(new Set(heads).size!==heads.length||required.some(k=>!heads.includes(k)))
   throw Error('SOCCER_WIDE_CSV_SCHEMA');
 const parsed=lines.slice(1).map((line,i)=>{
   const row=csvFields(line);
   if(row.length!==heads.length)
     throw Error('SOCCER_WIDE_CSV_ROW_LENGTH_'+i);
   return Object.fromEntries(heads.map((key,index)=>[key,row[index]])) as Record<string,string>;
 });
 return parsed;
}
function identity(l:WideLeague,row:Record<string,string>){
 const date=row.date,home=str(row.home),away=str(row.away);
 if(!dateOK(date)||!home||!away||home===away||home.length>150||away.length>150)
   throw Error('SOCCER_WIDE_INVALID_MATCH_IDENTITY');
 return {league:l.id,season:WIDE_SEASON,date,home,away};
}
export function parseWideCompetition(
 l:WideLeague,resultsRaw:string,fixturesRaw:string
):WideParsed{
 const resultsRows=parseTable(resultsRaw,
  ['date','home','away','ft_home','ft_away','source']);
 const fixtureRows=parseTable(fixturesRaw,
  ['date','home','away']);
 const seen=new Set<string>(),results:Match[]=[];
 for(const row of resultsRows){
   const id=identity(l,row);
   const key=wideMatchKey(id);
   if(seen.has(key))throw Error('SOCCER_WIDE_DUPLICATE_RESULT');
   seen.add(key);
   const h=row.ft_home,a=row.ft_away,source=str(row.source);
   // Never interpret a scoreless fixture, HT score, penalty result or
   // unverified number as a final. Do not coerce empty to zero.
   if(!/^\d{1,2}$/.test(h)||!/^\d{1,2}$/.test(a)||
      +h>35||+a>35||!source)
     throw Error('SOCCER_WIDE_INVALID_FINAL');
   results.push({...id,homeGoals:+h,awayGoals:+a,
     source:'open-matchday/'+source+'/'+l.id});
 }
 const fixtures:WideFixture[]=[];
 const fixtureKeys=new Set<string>();
 for(const row of fixtureRows){
   const id=identity(l,row);
   const key=wideMatchKey(id);
   if(seen.has(key))continue; // settled results never a future fixture
   if(fixtureKeys.has(key))throw Error('SOCCER_WIDE_DUPLICATE_FIXTURE');
   fixtureKeys.add(key);
   fixtures.push({...id,kickoffUtc:null,
     source:'open-matchday/fixture/'+l.id});
 }
 return {results,fixtures};
}

/** Knockout/UEFA scorelines can be after extra time or decided by penalties.
 * Until independent 90-minute scoring validation is available, publish
 * fixture coverage, but no unverified 90-minute 1X2 probabilities.
 */
export function isRegulationLeague(l:WideLeague):boolean{
 return !/(?:_CUP_|^UEFA_|_U21_)/.test(l.id);
}
