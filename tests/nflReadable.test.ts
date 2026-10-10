import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parsePhase1} from '../src/nfl/phase1.ts';
import {quickForecasts,publicationCoverage,QUICK_OUTCOMES} from '../src/nfl/readable.ts';
import {systemGames} from '../src/nfl/bettable.ts';
import {SystemPickCard} from '../src/components/NflTodayScreen.tsx';
const source=JSON.parse(readFileSync(new URL('./fixtures/nfl-nyj-chi-bettable.json',import.meta.url),'utf8'));
const current=()=>parsePhase1(structuredClone(source),new Date(Date.parse(source.status.last_shadow_run_utc)+60000));
test('Quick player forecasts contain genuine locked medians not alt line probabilities; per-market separation',()=>{
  const v=current();
  const rows=quickForecasts(v,'T90');
  assert(rows.length>2);
  for(const r of rows){
    assert(QUICK_OUTCOMES.includes(r.outcome as any));
    assert(r.p_active!=null && r.p_active>=.75);
    assert(r.mean!=null && r.median!=null);
    assert(v.rows.T90.some(old=>old.id===r.id && old.median===r.median && old.mean===r.mean));
  }
  for(const outcome of QUICK_OUTCOMES)assert(rows.filter(r=>r.outcome===outcome).length<=2);
  assert.deepEqual(rows,quickForecasts(v,'T90'));
});
test('Filtered quick forecasts do not borrow T90 outcomes for unavailable T24',()=>{
  const v=current();
  assert.equal(quickForecasts(v,'T24').length,0);
  assert(quickForecasts(v,'T90','geno smith','PASS').every(r=>r.player.toLowerCase().includes('geno')));
  assert(quickForecasts(v,'T90','never-heard-of').length===0);
});
test('Projected stats are foregrounded and target separately labeled as NOT sportsbook bet',()=>{
  const v=current(),p=systemGames(v,'T90')[0].picks[0];
  const html=renderToStaticMarkup(React.createElement(SystemPickCard,{pick:p,view:v,horizon:'T90'}));
  const projection=html.indexOf('PREDICTED STAT · MODEL MEDIAN');
  const target=html.indexOf('MODEL TARGET · NOT A SPORTSBOOK BET');
  assert(projection>=0 && target>projection);
  assert(html.includes('MODEL HIT PROBABILITY'));
  assert(html.includes('P10–P90'));
});
test('Published coverage is a separate operational signal from model reliability and data retrieval',()=>{
  const v=current();
  v.artifact.status.counts.T90.planned=14;
  v.artifact.status.counts.T90.missed=11;
  v.artifact.status.counts.T90.valid_games=2;
  const c=publicationCoverage(v,'T90');
  assert.deepEqual(c,{captured:2,planned:14,missed:11,failed:null});
});
