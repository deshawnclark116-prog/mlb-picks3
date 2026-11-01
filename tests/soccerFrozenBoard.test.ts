import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {selectFrozenSoccerCards} from '../src/soccer/frozenBoard';
const dir='docs/soccer_forward/originals';
const archive=()=>Object.fromEntries(readdirSync(dir).filter(f=>f.endsWith('.json'))
 .map(file=>[join(dir,file),JSON.parse(readFileSync(join(dir,file),'utf8'))]));
test('REAL archived first-seen soccer match goal forecasts make a nonempty offline board',()=>{
 const originals=archive();
 assert(Object.keys(originals).length>=51);
 const cards=selectFrozenSoccerCards(originals,'2026-11-01T14:00:00.000Z');
 assert(cards.length>=15);
 assert(cards.every(x=>x.forecast.date>'2026-10-31'));
 assert(cards.every(x=>x.forecast.expectedHomeGoals>0&&x.forecast.expectedAwayGoals>0));
 assert(cards.every(x=>x.capturedAtUtc<'2026-11-01T14:00:00.000Z'));
 assert(cards.every(x=>x.forecast.status==='RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'));
 const after=selectFrozenSoccerCards(originals,'2026-12-01T00:00:00.000Z');
 assert.equal(after.length,0,'Expired games must not remain as future picks');
});
test('no post-fixture snapshots, duplicate archived IDs or fabricated probabilities',()=>{
 const originals=archive();const [path]=Object.keys(originals),record=originals[path];
 assert.throws(()=>selectFrozenSoccerCards({
   [path]:{...record,captured_at_utc:record.forecast.date+'T01:00:00.000Z'}
 },'2026-11-01T14:00:00.000Z'),/INVALID_MODEL_VALUES/);
 assert.throws(()=>selectFrozenSoccerCards({
   [path]:{...record,forecast:{...record.forecast,probabilities:{
     ...record.forecast.probabilities,home:1.2}}}
 },'2026-11-01T14:00:00.000Z'),/INVALID_MODEL_VALUES/);
 assert.throws(()=>selectFrozenSoccerCards({
   [path]:record,
   ['another/'+record.id+'.json']:record
 },'2026-11-01T14:00:00.000Z'),/DUPLICATE/);
 assert.equal(selectFrozenSoccerCards({
   [path]:record
 },'2026-10-31T23:59:00.000Z').length,0,
 'Do not display an original before its real capture timestamp');
});
