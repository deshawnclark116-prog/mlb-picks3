import test from 'node:test';
import assert from 'node:assert/strict';
import {readNhlPublishedPregame} from '../src/nhl/publishedPregame';
import archived from '../public/nhl-published-pregame.json';
const asof='2026-11-01T17:45:00.000Z';
test('real 60-row firstseen NHL snapshot restores points and winners before the game',()=>{
 const out=readNhlPublishedPregame(archived,asof);
 assert(out);assert.equal(out.picks.length,60);
 assert.equal(out.picks.filter(p=>p.market==='moneyline').length,5);
 assert.equal(out.picks.filter(p=>p.market==='points').length,55);
 assert.equal(new Set(out.picks.filter(p=>p.market==='moneyline').map(p=>p.team)).size,5);
});
test('stale future or post-start snapshots are never offered as current picks',()=>{
 assert.equal(readNhlPublishedPregame(archived,'2026-11-03T12:00:00.000Z'),null);
 const old=JSON.parse(JSON.stringify(archived));
 old.document.generated_at_utc='2026-11-01T18:45:00Z';
 assert.equal(readNhlPublishedPregame(old,asof),null);
 const impossible=JSON.parse(JSON.stringify(archived));
 impossible.document.picks[0].model_prob=1.9;
 assert.equal(readNhlPublishedPregame(impossible,asof),null);
});
test('upstream model publishes 5 actual match winners even when shot archive has only one game',()=>{
 const out=readNhlPublishedPregame(archived,'2026-11-01T17:50:00.000Z');
 assert(out);
 assert(out.picks.some(p=>p.market==='moneyline'&&p.player==='Carolina Hurricanes'));
 assert(out.picks.some(p=>p.market==='points'&&p.player==='Sebastian Aho'));
});
test('finished first puck drop disappears, later actual games remain',()=>{
 const out=readNhlPublishedPregame(archived,'2026-11-01T19:00:00.000Z');
 assert(out);assert(out.picks.every(p=>Date.parse(p.kickoff_utc!)>Date.parse('2026-11-01T19:00:00.000Z')));
 assert(!out.picks.some(p=>p.player==='Carolina Hurricanes'));
 assert(out.picks.some(p=>p.player==='Washington Capitals'));
});
