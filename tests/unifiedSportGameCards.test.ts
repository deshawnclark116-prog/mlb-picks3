import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import UnifiedSportGameCards,{PredictionCard,Poster,nhlResearchShortlist,type UnifiedPick,type UnifiedGame} from '../src/components/UnifiedSportGameCards';

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
     assert.match(html,/Best chances/);
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

test('NHL research shortlist rejects 19% bets but preserves separately modeled 2+ shot event',()=>{
 const raw=pick({
  id:'shots-real',player:'Example Shot Volume',market:'shots_on_goal',
  target:'',modelProbability:null,prediction:3.7,predictionKind:'mean',unit:'shots',
  projectionChance:{atLeast:4,probability:.19,calibrated:false},
  nhlShotMilestone:{atLeast:2,probability:.76,calibrated:false}
 });
 const out=nhlResearchShortlist([raw,pick({id:'poor',market:'points',
   player:'Weak Event',target:'OVER 0.5',modelProbability:.19}),
   pick({id:'winner',market:'moneyline',player:'Pittsburgh Penguins',
    target:'Pittsburgh Penguins ML',modelProbability:.74})]);
 assert.equal(out.length,2);
 assert.equal(out[0].player,'Example Shot Volume');
 assert.equal(out[0].nhlShotMilestone?.atLeast,2);
 const strongest=renderToStaticMarkup(React.createElement(PredictionCard,{pick:out[0],nhlShortlist:true}));
 assert.match(strongest,/2\+ shots on goal/);
 assert.match(strongest,/76.0%/);
 assert.doesNotMatch(strongest,/19.0%/);
 const detailed=renderToStaticMarkup(React.createElement(PredictionCard,{pick:raw}));
 assert.match(detailed,/19.0%/);
 assert.match(detailed,/Model P\(4\+ shots\)/);
});
test('NHL 65%-gate cannot promote missing CDFs or low-confidence fixed events',()=>{
 const low=pick({id:'lo',target:'',modelProbability:null,prediction:4.3,
   nhlShotMilestone:{atLeast:4,probability:.22,calibrated:false}});
 const unproven=pick({id:'unknown',target:'',modelProbability:null,prediction:3,
   nhlShotMilestone:null});
 const weak=pick({id:'weak',market:'moneyline',target:'PIT ML',modelProbability:.64});
 assert.deepEqual(nhlResearchShortlist([low,unproven,weak]),[]);
});
