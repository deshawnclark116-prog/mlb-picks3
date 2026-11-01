/** Recover *published* NHL game winners and anytime-point model events
 * when the Render API is not reachable from a static AI Studio preview.
 * The original upstream model document is kept unchanged. Only genuinely
 * pregame observations are eligible; never backfill a past-game prediction.
 */
import type {NhlPrediction,NhlPredictionsDoc} from '../types';
type Snapshot={schema:'NHL_PUBLISHED_PREMATCH_SNAPSHOT_V1';source:string;
 source_commit_sha:string;captured_at_utc:string;document:unknown};
export type VisibleNhlPublished={
 game_date:string;generated_at_utc:string;source:string;picks:NhlPrediction[];
};
const object=(v:unknown):Record<string,unknown>|null=>
 v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;
const date=(v:unknown):v is string=>typeof v==='string'&&
 /^20\d\d-\d\d-\d\dT/.test(v)&&Number.isFinite(Date.parse(v))&&
 /(?:Z|[+-]\d\d:\d\d)$/.test(v);
const etDate=(iso:string)=>new Intl.DateTimeFormat('en-CA',{
 timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'
}).format(new Date(iso));
const advance=(d:string)=>new Date(Date.parse(d+'T00:00:00Z')+
 86400000).toISOString().slice(0,10);
export function readNhlPublishedPregame(raw:unknown,asofUtc:string):VisibleNhlPublished|null{
 if(!date(asofUtc))throw Error('NHL_PUBLISHED_ASOF_INVALID');
 const maybe=obj(raw);
 const wrapped=maybe?.schema==='NHL_PUBLISHED_PREMATCH_SNAPSHOT_V1';
 if(wrapped){
  const w=maybe as unknown as Snapshot;
  if(w.source!=='mlb-picks2/docs/nhl_predictions.json'||
    !/^[a-f0-9]{40}$/.test(w.source_commit_sha)||
    !date(w.captured_at_utc)||Date.parse(w.captured_at_utc)>Date.parse(asofUtc)+300000)
   return null;
 }
 const doc=obj(wrapped?maybe?.document:raw);
 if(!doc||!date(doc.generated_at_utc)||typeof doc.game_date!=='string'||
  !/^20\d\d-\d\d-\d\d$/.test(doc.game_date)||
  !Number.isInteger(doc.season)||!Array.isArray(doc.picks)||
  Date.parse(doc.generated_at_utc)>Date.parse(asofUtc)+300000)return null;
 const local=etDate(asofUtc);
 // The publisher can publish tomorrow's games in advance. A stale
 // prior-day source is never upgraded into a current prediction.
 if(doc.game_date!==local&&doc.game_date!==advance(local))return null;
 const pub=Date.parse(doc.generated_at_utc),now=Date.parse(asofUtc);
 const matches=NhlPrediction[]=[];
 const seen=new Set<string>();
 for(const candidate of doc.picks){
  const p=obj(candidate);
  if(!p||!['moneyline','points'].includes(String(p.market))||
     typeof p.player!=='string'||!p.player.trim()||
     typeof p.team!=='string'||!p.team.trim()||
     typeof p.opponent!=='string'||!p.opponent.trim()||
     typeof p.pick!=='string'||!p.pick.trim()||
     typeof p.game_date!=='string'||p.game_date!==doc.game_date||
     typeof p.kickoff_utc!=='string'||!date(p.kickoff_utc)||
     typeof p.model_prob!=='number'||!Number.isFinite(p.model_prob)||
     p.model_prob<0||p.model_prob>1)return null;
  const kickoff=Date.parse(p.kickoff_utc);
  // No source-published forecast after puck drop. Suppress past games,
  // not just the UI date; no historical result can become a new "hit".
  if(kickoff<=pub)return null;
  if(kickoff<=now)continue;
  const eventKey=[p.game_date,p.kickoff_utc,p.market,p.player_id??p.player,p.team].join('|');
  if(seen.has(eventKey))continue;
  seen.add(eventKey);
  matches.push({...p,prop_type:String(p.prop_type||p.market)} as unknown as NhlPrediction);
 }
 if(!matches.length)return null;
 return {game_date:doc.game_date,generated_at_utc:doc.generated_at_utc as string,
  source:wrapped?'FROZEN_PUBLISHED_PREMATCH':'LIVE_PUBLISHED_NHL_SOURCE',
  picks:matches};
}
