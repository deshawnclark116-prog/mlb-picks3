import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import UnifiedSportGameCards,{PredictionCard,Poster,nhlResearchShortlist,
 type UnifiedPick,type UnifiedGame} from '../src/components/UnifiedSportGameCards';
import {wholeStatEvent} from '../src/lib/wholeStatProjection';
const pick=(v:Partial<UnifiedPick>={}):UnifiedPick=>({
 id:'a',player:'Example Skater',team:'PIT',market:'shots_on_goal',
 target:'OVER 2.5',modelProbability:.73,prediction:null,
 predictionKind:'not_published',unit:'',source:'current scorer',...v
});
const game=(picks:UnifiedPick[]):UnifiedGame=>({
 id:'game1',label:'PIT vs NYR',when:'2026-10-18T23:00:00Z',
 sourceLabel:'NHL current classifier',picks
});
test('a classifier with no numeric forecast presents only its actual event and probability',()=>{
 const html=renderToStaticMarkup(React.createElement(PredictionCard,{pick:pick()}));
 assert.match(html,/MODEL EVENT PROBABILITY · NO NUMERIC FORECAST/);
 assert.match(html,/OVER 2.5/);assert.match(html,/73.0%/);
 assert.doesNotMatch(html,/MODEL PREDICTION · WHOLE NUMBER/);
});
test('CFB means and medians remain available in details, only integer displayed',()=>{
 const med=renderToStaticMarkup(React.createElement(PredictionCard,{pick:pick({
  player:'Sample Runner',market:'rushing_yards',prediction:86.3,
  predictionKind:'median',unit:'yds'
 })}));
 const mean=renderToStaticMarkup(React.createElement(PredictionCard,{pick:pick({
  player:'Sample Runner',market:'rushing_yards',prediction:89.6,
  predictionKind:'mean',unit:'yds'
 })}));
 assert.match(med,/86 yds/);
 assert.match(med,/Original median: 86.3 yds/);
 assert.match(mean,/90 yds/);
 assert.match(mean,/Original mean: 89.6 yds/);
 assert.match(mean,/Exact-count probability unavailable/);
 assert.doesNotMatch(mean,/P\(exactly 90\).*73.0%/);
});
test('tennis numeric model rounds without borrowing the bookmaker target odds',()=>{
 const games=game([pick({
  id:'tn',player:'Player A vs Player B',team:undefined,market:'total_games',
  prediction:22.7,predictionKind:'mean',unit:'games',target:'OVER 21.5'
 }),pick({
  id:'tn2',player:'Player A vs Player B',team:undefined,market:'set_betting',
  target:'Player A 2-0',prediction:null,predictionKind:'not_published'
 })]);
 const html=renderToStaticMarkup(React.createElement(Poster,{
  sport:'TENNIS',game:games,picks:games.picks}));
 assert.match(html,/23 GAMES/);
 assert.match(html,/P\(EXACTLY 23\): —/);
 assert.match(html,/Player A 2-0/);
 assert.match(html,/P\(EVENT\): 73.0%/);
 assert.doesNotMatch(html,/P\(EXACTLY 23\): 73.0%/);
});
test('NHL renders the correct view modes; other sports retain their controls',()=>{
 const groups=[game([pick({id:'1'})])];
 for(const sport of ['NHL','CFB','TENNIS'] as const){
  const html=renderToStaticMarkup(React.createElement(UnifiedSportGameCards,{
   sport,games:groups,prefix:sport+'-'}));
  if(sport==='NHL'){
   assert.match(html,/All projections/);assert.match(html,/Best chances/);
   assert.doesNotMatch(html,/BETTABLE NOW/);
  }else{
   assert.match(html,/SYSTEM PICKS/);assert.match(html,/BETTABLE NOW/);
   assert.match(html,/MODEL BOARD/);
  }
  assert.match(html,/Create share card for PIT vs NYR/);
  assert.match(html,/PIT vs NYR/);
 }
});
test('NHL exact-count chance uses survival DIFFERENCE, never easier P(2+)',()=>{
 const event=wholeStatEvent(3.7,{1:.96,2:.76,3:.6,4:.43,5:.12});
 const raw=pick({id:'count',player:'Exact Shot Skater',target:'',
  modelProbability:null,prediction:3.7,predictionKind:'mean',unit:'shots',
  exactCountEvent:event,
  nhlShotMilestone:{atLeast:2,probability:.76,calibrated:false},
  projectionChance:{atLeast:4,probability:.43,calibrated:false}});
 assert.equal(event.count,4);
 assert(Math.abs(event.probability!-.31)<1e-12);
 const selected=nhlResearchShortlist([raw,pick({id:'weak',player:'Weak Points',
  market:'points',target:'OVER 0.5',modelProbability:.19}),
  pick({id:'winner',player:'Penguins',market:'moneyline',
   target:'Penguins ML',modelProbability:.74})]);
 assert.equal(selected.length,2);
 assert.equal(selected[0].player,'Penguins');
 const html=renderToStaticMarkup(React.createElement(PredictionCard,{pick:raw,nhlShortlist:true}));
 assert.match(html,/4 shots/);assert.match(html,/31.0%/);
 assert.match(html,/Chance of exactly 4/);
 assert.match(html,/Alternative threshold: P\(2\+ shots\) 76.0%/);
 assert.doesNotMatch(html,/4 shots.*76.0%<\/strong>/);
});
test('absence of original integer CDF or low P(exact) cannot promote a false best chance',()=>{
 const low=pick({id:'low',target:'',modelProbability:null,
  prediction:4.3,predictionKind:'mean',exactCountEvent:{
   count:4,probability:.19,label:'Exactly 4',
   semantics:'EXACT_INTEGER_COUNT',calibration:'UNCALIBRATED'
  }});
 const unknown=pick({id:'unknown',target:'',modelProbability:null,prediction:3.2});
 const weak=pick({id:'weak',market:'moneyline',target:'PIT ML',modelProbability:.64});
 assert.deepEqual(nhlResearchShortlist([low,unknown,weak]),[]);
});
