import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalNhlTeam,groupNhlPredictionsByGame} from '../src/nhl/gameGrouping';
import {addTrueNhlShotCounts,NHL_COUNT_SCHEMA,type NhlSogResearch}
  from '../src/nhl/countResearch';
import {deduplicateNhlPredictions} from '../src/utils';
import type {NhlPrediction} from '../src/types';
import type {UnifiedGame} from '../src/components/UnifiedSportGameCards';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import UnifiedSportGameCards from '../src/components/UnifiedSportGameCards';

const DATE='2026-10-21';
const START='2026-10-21T23:30:00Z';
function p(player:string,team:string,opponent:string,
  market='points',id=player):NhlPrediction {
  return {
    player,player_id:id,team,opponent,market,prop_type:market,
    pick:market==='moneyline'?player+' ML':'OVER 0.5',
    season:2026,game_date:DATE,kickoff_utc:START,
    model_prob:.64,confidence:'MEDIUM'
  };
}
const archivedWednesdayNhlShape=():NhlPrediction[]=>{
  // Regression of the *real* published 2026-10-21 NHL source's game/market
  // structure: Florida-Ottawa 19 points; Buffalo-Philly 17 points;
  // PLUS 1 moneyline per game published with full franchise names.
  const realShape:NhlPrediction[]=[];
  for(let i=0;i<19;i++)realShape.push(
    p('OttawaFlorida player '+i,i%2?'OTT':'FLA',i%2?'FLA':'OTT',
      i>=8?'points_early_season':'points','80'+i));
  for(let i=0;i<17;i++)realShape.push(
    p('BuffaloPhiladelphia player '+i,i%2?'BUF':'PHI',i%2?'PHI':'BUF',
      i>=6?'points_early_season':'points','90'+i));
  realShape.push(p('Buffalo Sabres','Buffalo Sabres','Philadelphia Flyers',
                   'moneyline','buffalo'));
  realShape.push(p('Ottawa Senators','Ottawa Senators','Florida Panthers',
                   'moneyline','ottawa'));
  return realShape;
};

test('all 32 actual NHL full franchise names resolve to the same abbreviation as player-prop feed',()=>{
  for(const [name,abbr] of [
    ['Florida Panthers','FLA'],['Ottawa Senators','OTT'],
    ['Buffalo Sabres','BUF'],['Philadelphia Flyers','PHI'],
    ['New York Rangers','NYR'],['New York Islanders','NYI'],
    ['Utah Mammoth','UTA'],['Tampa Bay Lightning','TBL'],
    ['New Jersey Devils','NJD'],['San Jose Sharks','SJS'],
    ['Los Angeles Kings','LAK'],['Vegas Golden Knights','VGK'],
    ['St. Louis Blues','STL']
  ]){
    assert.equal(canonicalNhlTeam(name),abbr,name);
    assert.equal(canonicalNhlTeam(abbr),abbr,name+' code');
  }
  assert.equal(canonicalNhlTeam('Mystery Hocketeers'),'MYSTERY HOCKETEERS',
               'Never fuzzy-match unknown team identities');
});

test('actual Oct 21 NHL 38-row source becomes TWO real game cards, not four cards with 1-moneyline each',()=>{
  const input=deduplicateNhlPredictions(archivedWednesdayNhlShape());
  assert.equal(input.length,38);
  const games=groupNhlPredictionsByGame(input);
  assert.equal(games.length,2);
  const byPair=new Map(games.map(g=>[[g.teamA,g.teamB].sort().join('|'),g]));
  const florida=byPair.get('FLA|OTT')!;
  const buffalo=byPair.get('BUF|PHI')!;
  assert.equal(florida.predictions.length,20);
  assert.equal(buffalo.predictions.length,18);
  assert(florida.predictions.some(v=>v.market==='moneyline'));
  assert(florida.predictions.some(v=>v.market==='points'));
  assert(buffalo.predictions.some(v=>v.market==='points'&&v.source_market==='points_early_season'),
    'Prior-season fallback remains attributable, but it is still the single anytime-points market');
  assert(buffalo.predictions.some(v=>v.market==='moneyline'));
  assert.equal(florida.kickoff_utc,'2026-10-21T23:30:00.000Z');
  assert.equal(buffalo.kickoff_utc,'2026-10-21T23:30:00.000Z');
  assert(games.every(g=>g.predictions.length>=10));
});

test('original numeric SOG predictions, including players not offered by a sportsbook, attach to the ONE real NHL game card',()=>{
  const g=groupNhlPredictionsByGame(archivedWednesdayNhlShape());
  const cards:UnifiedGame[]=g.map(x=>({
    id:x.key,label:x.teamA+' vs '+x.teamB,when:x.kickoff_utc,
    sourceLabel:'NHL current player-model predictions',picks:x.predictions.map(
      (v,i)=>({
        id:v.market+'|'+v.player_id+'|'+i,
        player:v.player,team:v.team,market:v.market,target:v.pick,
        modelProbability:v.model_prob,prediction:null,
        predictionKind:'not_published' as const,unit:'',source:'NHL classifier'
      }))
  }));
  const independent:NhlSogResearch={
    schema:NHL_COUNT_SCHEMA,game_date:DATE,research_only:true,
    not_an_official_betting_board:true,projected_count:2,
    projections:[
      {game_id:'2026020048',player_id:'30001',player:'Tage Thompson',team:'BUF',
       opponent:'PHI',game_date:DATE,scheduled_start:START,
       mean:4.2,median:4,sd:1.4,p10:2,p90:6,forecast_horizon:'T24H',
       source_generated_at:'2026-10-20T23:00:00Z',
       source_cutoff_at:'2026-10-21T00:00:00Z',
       research_only:true,not_an_official_betting_prediction:true},
      {game_id:'2026020048',player_id:'30002',player:'Player not listed at book',team:'PHI',
       opponent:'BUF',game_date:DATE,scheduled_start:START,
       mean:2.8,median:3,sd:1.4,p10:1,p90:5,forecast_horizon:'T24H',
       source_generated_at:'2026-10-20T23:00:00Z',
       source_cutoff_at:'2026-10-21T00:00:00Z',
       research_only:true,not_an_official_betting_prediction:true}
    ]
  };
  const merged=addTrueNhlShotCounts(cards,independent);
  assert.equal(merged.length,2);
  const buffalo=merged.find(x=>x.label==='BUF vs PHI')!;
  assert.equal(buffalo.picks.length,20);
  assert.equal(buffalo.picks.filter(p=>p.market==='shots_on_goal').length,2);
  assert.equal(buffalo.picks.find(p=>p.player==='Tage Thompson')?.prediction,4.2);
  const unlisted=buffalo.picks.find(p=>p.player==='Player not listed at book')!;
  assert.equal(unlisted.target,'');
  assert.equal(unlisted.modelProbability,null);
  assert.equal(unlisted.prediction,2.8);
  const html=renderToStaticMarkup(React.createElement(UnifiedSportGameCards,{
    sport:'NHL',games:merged,prefix:'nhl-test-'
  }));
  // With no source-backed shot event probabilities and every binary
  // classifier only 64%, the default 65% research shortlist must be empty.
  // The original two-game, 20-row slate is still intact in merged.
  assert.equal((html.match(/data-testid="unified-sport-game"/g)||[]).length,0);
  assert.match(html,/Best chances/);
  assert.match(html,/All projections/);
  assert.match(html,/No events meet the research display filters/);
});

test('same opponents on different dates or times must never be merged into a made-up game',()=>{
  const one=p('Tage Thompson','BUF','PHI');
  const two={...p('Jack Quinn','Buffalo Sabres','Philadelphia Flyers'),
     kickoff_utc:'2026-10-21T23:45:00Z'};
  const three={...p('Owen Power','BUF','PHI'),
     kickoff_utc:'2026-10-22T23:30:00Z',game_date:'2026-10-22'};
  const groups=groupNhlPredictionsByGame([one,two,three]);
  assert.equal(groups.length,3);
  assert.equal(groups.reduce((n,g)=>n+g.predictions.length,0),3);
});

test('same player 0.5 point event renders ONCE; current-season model is preferred, not the higher optimistic probability',()=>{
 const base=p('Tim Stützle','OTT','FLA','points','8479313');
 const first={...base,model_prob:.57,generated_at:'2026-10-21T12:00:00Z'};
 const old={...p('Tim Stützle','Ottawa Senators','Florida Panthers',
               'points_early_season','8479313'),model_prob:.83,
               generated_at:'2026-10-21T18:00:00Z'};
 const clean=deduplicateNhlPredictions([old,first]);
 assert.equal(clean.length,1);
 assert.equal(clean[0].market,'points');
 assert.equal(clean[0].source_market,'points');
 assert.equal(clean[0].model_prob,.57);
 const games=groupNhlPredictionsByGame(clean);
 assert.equal(games.length,1);
 assert.equal(games[0].predictions.length,1);
 const fallback=deduplicateNhlPredictions([old]);
 assert.equal(fallback.length,1);
 assert.equal(fallback[0].market,'points');
 assert.equal(fallback[0].source_market,'points_early_season');
 assert.equal(fallback[0].model_prob,.83);
});
test('same player different game, same date but distinct verified start, is not merged; different NHL player IDs never collide',()=>{
 const same=p('Unique athlete','DAL','NYI','points','80001');
 const again={...same,kickoff_utc:'2026-10-21T23:50:00Z'};
 const other=p('Another athlete','DAL','NYI','points','80002');
 assert.equal(deduplicateNhlPredictions([same,again,other]).length,3);
});
test('October 25 live source structure: 73 point model rows collapse to exactly 50 unique player point outcomes',()=>{
 const rows:NhlPrediction[]=[];
 for(let i=0;i<50;i++) {
  const current=p('Synthetic '+i,'FLA','CHI','points',String(90000+i));
  current.game_date='2026-10-25';
  current.kickoff_utc='2026-10-25T23:00:00Z';
  rows.push(current);
  if(i<23)rows.push({...current,market:'points_early_season',
    model_prob:.99,generated_at:'2026-10-25T22:00:00Z'});
 }
 assert.equal(rows.length,73);
 const clean=deduplicateNhlPredictions(rows);
 assert.equal(clean.length,50);
 assert(clean.every(row=>row.market==='points'&&row.model_prob===.64));
 assert.equal(groupNhlPredictionsByGame(clean)[0].predictions.length,50);
});
