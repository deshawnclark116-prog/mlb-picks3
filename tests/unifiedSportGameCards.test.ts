import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import UnifiedSportGameCards,{PredictionCard,Poster,type UnifiedPick,type UnifiedGame} from '../src/components/UnifiedSportGameCards';

const pick=(v:Partial<UnifiedPick>={}):UnifiedPick=>({
 id:'a',player:'Example Skater',team:'PIT',market:'shots_on_goal',
 target:'OVER 2.5',modelProbability:.73,prediction:null,
 predictionKind:'not_published',unit:'',source:'current scorer',...v
});
const game=(picks:UnifiedPick[]):UnifiedGame=>({
 id:'game1',label:'PIT vs NYR',when:'2026-10-18T23:00:00Z',
 sourceLabel:'NHL current classifier',picks
});

test('NHL fixed-line classifier never disguises 2.5-shot threshold as median',()=>{
 const html=renderToStaticMarkup(React.createElement(PredictionCard,{pick:pick()}));
 assert.match(html,/MODEL CHANCE OF TARGET · COUNT NOT FORECAST/);
 assert.match(html,/No numerical player-stat forecast is published/);
 assert.match(html,/PUBLISHED MODEL TARGET · NOT VERIFIED BOOK LINE/);
 assert.match(html,/OVER 2.5/);
 assert.match(html,/73.0%/);
 assert.doesNotMatch(html,/MODEL PROJECTION · MEDIAN/);
});
test('CFB simulated median and estimated mean are labeled differently',()=>{
 const med=renderToStaticMarkup(React.createElement(PredictionCard,{pick:pick({
   player:'Sample Runner',market:'rushing_yards',prediction:86.3,predictionKind:'median',unit:'yds'
 })}));
 const mean=renderToStaticMarkup(React.createElement(PredictionCard,{pick:pick({
   player:'Sample Runner',market:'rushing_yards',prediction:89.1,predictionKind:'mean',unit:'yds'
 })}));
 assert.match(med,/MODEL PROJECTION · MEDIAN/);
 assert.match(med,/86.3 yds/);
 assert.match(mean,/MODEL PROJECTION · MEAN/);
 assert.match(mean,/89.1 yds/);
 assert.match(mean,/TARGET/);
});
test('Tennis publishes only the available projected mean, not a fake correct-score median',()=>{
 const games=game([pick({
   id:'tn',player:'Player A vs Player B',team:undefined,market:'total_games',
   prediction:22.7,predictionKind:'mean',unit:'games',target:'OVER 21.5'
 }),pick({
   id:'tn2',player:'Player A vs Player B',team:undefined,market:'set_betting',
   target:'Player A 2-0',prediction:null,predictionKind:'not_published'
 })]);
 const html=renderToStaticMarkup(React.createElement(Poster,{sport:'TENNIS',game:games,picks:games.picks}));
 assert.match(html,/22.7 GAMES/);
 assert.match(html,/MODEL PROJECTION · MEAN/);
 assert.match(html,/MODEL CHANCE OF TARGET · COUNT NOT FORECAST/);
 assert.match(html,/Player A 2-0/);
 assert.doesNotMatch(html,/100\.0%/);
});
test('NHL uses two clear projection views while other sports retain their board modes',()=>{
 const groups=[game([pick({id:'1'})])];
 for(const sport of ['NHL','CFB','TENNIS'] as const){
   const html=renderToStaticMarkup(React.createElement(UnifiedSportGameCards,{sport,games:groups,prefix:sport+'-'}));
   if(sport==='NHL'){
     assert.match(html,/All projections/);
     assert.match(html,/Top 10/);
     assert.doesNotMatch(html,/BETTABLE NOW/);
   }else{
     assert.match(html,/SYSTEM PICKS/);
     assert.match(html,/BETTABLE NOW/);
     assert.match(html,/MODEL BOARD/);
   }
   assert.match(html,/Create share card for PIT vs NYR/);
   assert.match(html,/unified-sport-game/);
   assert.match(html,/PIT vs NYR/);
   // The default game card is COLLAPSED. Its unpriced model-target summary
   // must still communicate that no numeric count was published; don't
   // expect the unopened PredictionCard's body in server-rendered markup.
   assert.match(html,/aria-expanded="false"/);
   assert.match(html,/NO NUMERIC FORECAST/);
 }
});
