/** Frozen genuine pregame soccer goal forecasts accessible even without Express.
 * Archives are authored by the first-seen GitHub workflow, never by the UI.
 * Refuse malformed, duplicated, post-fixture and future-captured records.
 */
import type {Forecast} from './model';
export type FrozenSoccerCard={id:string;forecast:Forecast;capturedAtUtc:string};
type Original={schema?:unknown;id?:unknown;captured_at_utc?:unknown;
 forecast?:unknown;eligibility?:unknown;source_receipts_count?:unknown};
const iso=(s:string)=>Number.isFinite(Date.parse(s))&&
 new Date(s).toISOString()===s;
const validDay=(s:string)=>/^20\d\d-\d\d-\d\d$/.test(s)&&
 !Number.isNaN(Date.parse(s+'T00:00:00Z'))&&
 new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function selectFrozenSoccerCards(
 modules:Record<string,unknown>,asOfUtc:string,maxDays=21):FrozenSoccerCard[]{
 if(!iso(asOfUtc)||maxDays<1||maxDays>31)
   throw Error('SOCCER_ARCHIVE_INVALID_VIEW_TIME');
 const today=asOfUtc.slice(0,10);
 const end=new Date(Date.parse(today+'T00:00:00Z')+maxDays*86400000)
   .toISOString().slice(0,10);
 const out:FrozenSoccerCard[]=[];
 const ids=new Set<string>();
 for(const [path,raw] of Object.entries(modules)){
   const o=raw as Original|null;
   if(!o||o.schema!=='soccer-forward-original-v1'||
      typeof o.id!=='string'||!/^[a-f0-9]{32}$/.test(o.id)||
      !path.endsWith('/'+o.id+'.json')||
      typeof o.captured_at_utc!=='string'||!iso(o.captured_at_utc)||
      o.eligibility!=='FROZEN_ON_PRIOR_UTC_CALENDAR_DAY_NO_VERIFIED_KICKOFF'||
      o.source_receipts_count!==20)
     throw Error('SOCCER_ARCHIVE_INVALID_FIRSTSEEN_RECORD');
   if(ids.has(o.id))throw Error('SOCCER_ARCHIVE_DUPLICATE_ID');
   ids.add(o.id);
   const f=o.forecast as Forecast|null;
   if(!f||!validDay(f.date)||f.date<=o.captured_at_utc.slice(0,10)||
      !['EPL','LaLiga','SerieA','Bundesliga','Ligue1'].includes(f.league)||
      typeof f.home!=='string'||!f.home||typeof f.away!=='string'||!f.away||
      f.status!=='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'||
      !Number.isFinite(f.expectedHomeGoals)||f.expectedHomeGoals<=0||
      !Number.isFinite(f.expectedAwayGoals)||f.expectedAwayGoals<=0||
      !f.probabilities||
      !['home','draw','away','over25','btts'].every(k=>{
       const x=f.probabilities[k as keyof typeof f.probabilities];
       return typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1;
      })||
      Math.abs(f.probabilities.home+f.probabilities.draw+f.probabilities.away-1)>.0003)
     throw Error('SOCCER_ARCHIVE_INVALID_MODEL_VALUES');
   // A forecast cannot have been captured "in the past" relative to the
   // fixture but still in the future relative to the user's real clock.
   if(o.captured_at_utc>asOfUtc)continue;
   if(f.date<today||f.date>end)continue;
   out.push({id:o.id,forecast:f,capturedAtUtc:o.captured_at_utc});
 }
 return out.sort((a,b)=>a.forecast.date.localeCompare(b.forecast.date)||
   a.forecast.league.localeCompare(b.forecast.league)||
   a.forecast.home.localeCompare(b.forecast.home));
}
