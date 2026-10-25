/** Freeze genuinely first-served NHL pregame probability estimates.
 * No after-the-fact recreated 2026 forecast probabilities or book odds.
 */
import {existsSync,readdirSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {loadNhlCountResearch} from '../server/nhlCountResearch.ts';
import type {NhlSogResearch} from '../src/nhl/countResearch.ts';
import {freezeSourceNhlShotProbabilities,verifyFirstseenShotLedger,
 type FrozenNhlShotDoc} from '../src/nhl/probabilityForward.ts';
const flag=process.argv.indexOf('--out');
if(flag<0||!process.argv[flag+1])throw Error('NHL_FIRSTSEEN_PROBABILITY_OUTPUT_REQUIRED');
const dest=process.argv[flag+1];
if(existsSync(dest))throw Error('NHL_FIRSTSEEN_OUTPUT_ALREADY_EXISTS');
const dir='docs/nhl_v2_probability_firstseen';
const existing:FrozenNhlShotDoc[]=(existsSync(dir)?
  readdirSync(dir).filter(s=>/^20\d{2}-\d\d-\d\dT\d{6}Z\.json$/.test(s)):[]
).map(filename=>JSON.parse(readFileSync(path.join(dir,filename),'utf8')));
verifyFirstseenShotLedger(existing);
const clock=new Date();
const formatter=new Intl.DateTimeFormat('en-US',{
 timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'
});
const parts=formatter.formatToParts(clock);
const p=(part:string)=>parts.find(x=>x.type===part)?.value||'';
const today=p('year')+'-'+p('month')+'-'+p('day');
const next=new Date(Date.parse(today+'T12:00:00Z')+86400000)
   .toISOString().slice(0,10);
const rows=[];
for(const day of [today,next]){
 const source=await loadNhlCountResearch(day) as unknown as NhlSogResearch;
 const doc=freezeSourceNhlShotProbabilities(source,clock,existing);
 rows.push(...doc.predictions);
}
const doc:FrozenNhlShotDoc={
 schema:'NHL_V2_FIRST_PREGAME_SHOT_PROBABILITY_LEDGER_V1',
 captured_at_utc:clock.toISOString(),
 source_frozen_model:'NHL_V2_LOCKED_ORIGINAL_COUNT_CDF',
 predictions:rows,selected_predicted_events:rows.length,
 official_bets:0,source_is_research_only:true
};
verifyFirstseenShotLedger([...existing,doc]);
if(!doc.selected_predicted_events){
 console.log('NHL_NO_NEW_PRETIP_PROBABILITIES_AFTER_DEDUP');
 process.exit(0);
}
mkdirSync(path.dirname(dest),{recursive:true});
writeFileSync(dest,JSON.stringify(doc,null,2)+'\n');
console.log('NHL_NEW_PROSPECTIVE_PGE1_TO_PGE5_FROZEN',JSON.stringify({
 games:new Set(doc.predictions.map(p=>p.game_id)).size,
 player_model_distributions:doc.predictions.length,
 immutable_event_probabilities:doc.predictions.length*5,
 before_puckdrop:true,official_bets:0
}));
