import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Poster,PredictionCard,type UnifiedGame,type UnifiedPick} from '../src/components/UnifiedSportGameCards';

const countMissing=(name:string,prob:number,id:string):UnifiedPick=>({
  id,player:name,team:'MIN',market:'points',target:'OVER 0.5',
  modelProbability:prob,prediction:null,predictionKind:'not_published',
  unit:'points',source:'NHL points fixed-line binary champion'
});
const first=countMissing('Kirill Kaprizov',.744,'k');
const all:UnifiedPick[]=[
 first,countMissing('Quinn Hughes',.7264,'q'),
 countMissing('Matt Boldy',.6875,'m'),
 countMissing('Kirill Kaprizov',.6792,'ke'),
 countMissing('Mats Zuccarello Aasen',.6214,'z'),
 countMissing('Matt Boldy',.6134,'me')
];
const game:UnifiedGame={
 id:'MIN__CBJ',label:'MIN vs CBJ',when:'2026-10-18T22:00:00Z',
 subtitle:'2026-10-18',sourceLabel:'NHL CURRENT MODEL · FIXED-LINE CLASSIFIER',
 picks:all
};

test('real MIN-CBJ NHL event-only screenshot must NOT say six numeric stat projections',()=>{
 const html=renderToStaticMarkup(React.createElement(Poster,{sport:'NHL',game,picks:all}));
 assert.match(html,/MODEL EVENT PROBABILITIES/);
 assert.match(html,/NO NUMERIC STATS/);
 assert.match(html,/KIRILL KAPRIZOV/);
 assert.match(html,/74\.4%/);
 assert.match(html,/P\(EVENT\): 74\.4%/);
 assert.match(html,/NO NUMERIC FORECAST/);
 assert.doesNotMatch(html,/MODEL STAT PROJECTIONS/);
 assert.doesNotMatch(html,/NOT PUBLISHED/);
 assert.match(html,/Percentages are target event probabilities/);
});

test('individual NHL event-only card does not label probability as model mean or median',()=>{
 const html=renderToStaticMarkup(React.createElement(PredictionCard,{pick:first}));
 assert.match(html,/MODEL EVENT PROBABILITY/);
 assert.match(html,/74\.4%/);
 assert.match(html,/no invented numerical player stat/);
 assert.doesNotMatch(html,/MODEL PROJECTION · MEDIAN/);
 assert.doesNotMatch(html,/MODEL PROJECTION · MEAN/);
});

test('real numerical stats, when independently available, remain primary and labeled mean',()=>{
 const actual:UnifiedPick={
   ...first,id:'numeric',prediction:1.2,predictionKind:'mean',unit:'points',
   source:'independent historical count research'
 };
 const html=renderToStaticMarkup(React.createElement(Poster,{
   sport:'NHL',game:{...game,picks:[actual]},picks:[actual]
 }));
 assert.match(html,/MODEL STAT PROJECTIONS/);
 assert.match(html,/1 POINTS/);
 assert.match(html,/MODEL PREDICTION · WHOLE NUMBER/);
 assert.match(html,/P\(EXACTLY 1\): —/);
 assert.doesNotMatch(html,/P\(EXACTLY 1\): 74\.4%/);
});

test('NHL 3.5-shot mean becomes 3; do not substitute probability of 4+ shots',()=>{
 const shot:UnifiedPick={
  ...first,id:'frozen-shot',player:'Example Shooter',team:'LAK',
  market:'shots_on_goal',prediction:3.5,predictionKind:'mean',unit:'shots',
  target:'',modelProbability:null,projectionChance:{atLeast:4,probability:.418,calibrated:false},
  source:'Locked original NHL shot-count model'
 };
 const card=renderToStaticMarkup(React.createElement(PredictionCard,{pick:shot}));
 assert.match(card,/MODEL PREDICTION · WHOLE NUMBER/);
 assert.match(card,/3 shots/);
 assert.match(card,/Original mean: 3.5 shots/);
 assert.doesNotMatch(card,/PUBLISHED MODEL TARGET|MODEL PROBABILITY|Model P\(target\)/);
 assert.match(card,/Exact-count probability unavailable/);
 assert.match(card,/Separate threshold event: P\(4\+ shots\)/);
 assert.match(card,/41.8%/);
 const poster=renderToStaticMarkup(React.createElement(Poster,{
  sport:'NHL',game:{...game,picks:[shot]},picks:[shot]
 }));
 assert.match(poster,/3 SHOTS/);
 assert.doesNotMatch(poster,/TARGET:|Model P\(target\)/);
 assert.match(poster,/P\(EXACTLY 3\): —/);
 assert.doesNotMatch(poster,/P\(EXACTLY 3\): 41.8%/);
});
