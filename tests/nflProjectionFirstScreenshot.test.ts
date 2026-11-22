import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseExistingNfl,type ExistingYardProjection,type ExistingYardMarket} from '../src/nfl/existing.ts';
import {rankNflShowcase} from '../src/nfl/weeklyShowcase.ts';
import {nflPrimaryProbabilityPicks,nflUnrankedNumericalForecasts} from '../src/nfl/primaryNumerical.ts';
import {NflNumericalTile} from '../src/components/ExistingNflProjectionSlate.tsx';

const KICK='2026-11-22T18:00:00Z';
const BASE={opponent:'ARI',team:'KC',kickoff_utc:KICK,season:2026,week:11};
const y=(name:string,team:string,opponent:string,market:ExistingYardMarket,mean:number,
  stability:NonNullable<ExistingYardProjection['confidence']>='MEDIUM',games=8):ExistingYardProjection=>({
  market,player:name,player_id:name,team,opponent,
  kickoff_utc:KICK,projected_median:mean,projected_mean:mean,
  projected_low:Math.max(0,mean*.2),projected_high:mean*2,
  confidence:stability,games_played:games,model_source:'v2_context',ungraded:true,
  projection_probability_source:'UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION'
});
const td=(name:string,prob:number)=>({
  ...BASE,player:name,player_id:name,market:'anytime_touchdowns',
  pick:'Scores a TD (OVER 0.5)',model_prob:prob,prob_over:prob,model_source:'v4_context'
});
test('Nov 22 screenshot regression: 36.8% TD research is NOT the primary model projection',()=>{
  const doc={season:2026,week:11,generated_at_utc:'2026-11-22T09:42:22Z',
    scheduled_games:[{home_team:'KC',away_team:'ARI',kickoff_utc:KICK}],
    picks:[
      td('Emmett Johnson',.3679),
      td('Isiah Pacheco',.3523),
      td('Xavier Worthy',.347),
      td('Rashee Rice',.3465),
      y('Rashee Rice','KC','ARI','receiving_yards',60.1,'HIGH',6),
      y('Josh Downs','KC','ARI','receiving_yards',37.4,'MEDIUM',10),
      y('Xavier Worthy','KC','ARI','receiving_yards',29.8,'MEDIUM',9),
      y('Tyler Allgeier','ARI','KC','rushing_yards',42.9,'LOW',25),
      y('Simi Fehoko','ARI','KC','receiving_yards',2.7,'HIGH',3),
      y('Justin Watson','KC','ARI','receiving_yards',4.5,'HIGH',3),
      y('Devin Duvernay','ARI','KC','receiving_yards',55,'HIGH',8)
    ]};
  const slate=parseExistingNfl(doc,new Date('2026-11-22T14:33:00Z'));
  const game=slate.games[0],original=JSON.stringify(doc);
  const oldRanking=rankNflShowcase(game);
  assert.equal(oldRanking.length,4);
  assert(oldRanking.every(p=>p.market==='anytime_touchdowns'));
  assert.equal(oldRanking[0].player,'Emmett Johnson');
  // Real source V2 probabilities are missing, so there is NO Top4 even
  // though old stability tiers would have ranked Xavier Worthy third.
  const ranked=nflPrimaryProbabilityPicks(game);
  assert.deepEqual(ranked,[]);
  const numerical=nflUnrankedNumericalForecasts(game.projections);
  assert.deepEqual(numerical.map(p=>p.player),
   ['Josh Downs','Justin Watson','Rashee Rice','Tyler Allgeier','Xavier Worthy']);
  assert(!numerical.some(p=>p.player==='Devin Duvernay'||p.player==='Simi Fehoko'));
  const markup=renderToStaticMarkup(React.createElement(NflNumericalTile,{p:numerical.find(p=>p.player==='Rashee Rice')!}));
  assert.match(markup,/Rashee Rice/);
  assert.match(markup,/60/);
  assert.match(markup,/No matched probability/);
  assert.doesNotMatch(markup,/36.8%|SCORE 1\+ TD|60% probability/);
  assert.equal(JSON.stringify(doc),original,'all frozen original predictions unchanged');
});
test('No fabricated numerical hit percentage, no role-changed ARI/PHI receiver in primary board',()=>{
  const choices=[
    y('Unmodeled ARI WR','ARI','KC','receiving_yards',96,'HIGH',20),
    y('Unmodeled PHI WR','PHI','PIT','receiving_yards',93,'HIGH',20),
    y('Unaffected Chiefs WR','KC','ARI','receiving_yards',55,'HIGH',8),
    y('Unaffected Steelers WR','PIT','PHI','receiving_yards',51,'MEDIUM',8),
    y('Tiny HIGH','KC','ARI','receiving_yards',4,'HIGH',18),
    y('Starter affected ARI RB','ARI','KC','rushing_yards',53,'MEDIUM',9)
  ];
  // All source estimates remain independently inspectable, including the
  // very small projection. No HIGH/LOW grade decides their Top4 status.
  assert.deepEqual(nflUnrankedNumericalForecasts(choices).map(p=>p.player),[
    'Starter affected ARI RB','Tiny HIGH','Unaffected Chiefs WR','Unaffected Steelers WR'
  ]);
  const game={id:'test',teams:['ARI','KC'] as [string,string],
    kickoff_utc:KICK,projections:choices,events:[]};
  assert.deepEqual(nflPrimaryProbabilityPicks(game),[]);
  assert.throws(()=>nflPrimaryProbabilityPicks(game,0),/slots/);
});
