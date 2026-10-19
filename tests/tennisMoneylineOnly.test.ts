import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {TennisPrediction} from '../src/types';
import {liveTennisMoneylines} from '../src/tennis/moneylineOnly';
import TennisTodayScreen from '../src/components/TennisTodayScreen';

function pick(market:TennisPrediction['market'],pickValue:string,prob=.73):TennisPrediction {
  return {
    market,prop_type:market,tour:'atp',tourney:'Test Championship',
    surface:'Hard',surface_confirmed:true,best_of:3,
    start_time_utc:'2026-10-20T15:00:00Z',
    player1:'Example Alpha',player2:'Example Beta',
    pick:pickValue,model_prob:prob,prob_pct:prob*100
  };
}

test('tennis moneyline research board drops old total-games/exact-score documents',()=>{
  const old=[pick('set_betting','Example Alpha 2-0'),
    pick('total_games','OVER 23.5'),pick('moneyline','Example Beta ML')];
  const rows=liveTennisMoneylines(old);
  assert.equal(rows.length,1);
  assert.equal(rows[0].market,'moneyline');
  assert.equal(rows[0].pick,'Example Beta ML');
  const html=renderToStaticMarkup(React.createElement(TennisTodayScreen,{
    predictions:old,loading:false,error:null,onRefresh:async()=>{}
  }));
  assert.match(html,/Match winner \(moneyline\) only/);
  assert.match(html,/Example Beta ML/);
  assert.match(html,/no certified bets or odds/i);
  assert.doesNotMatch(html,/OVER 23\.5/);
  assert.doesNotMatch(html,/Example Alpha 2-0/);
  assert.doesNotMatch(html,/HIGH Conf|MEDIUM Conf|LOW Conf/);
});
test('rejects fabricated winner names, non-moneyline markets and malformed probabilities',()=>{
  assert.equal(liveTennisMoneylines([
    pick('moneyline','NOT A PLAYER ML'),
    pick('moneyline','Example Alpha ML',.49),
    pick('moneyline','Example Alpha ML',NaN),
    pick('total_games','OVER 21.5'),
    pick('moneyline','Example Alpha ML',.5)
  ]).length,1);
});
