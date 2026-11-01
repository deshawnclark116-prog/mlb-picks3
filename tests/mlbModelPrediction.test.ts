import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MlbModelPrediction,mlbModelDisplay} from '../src/components/MlbModelPrediction';
import type {Prediction} from '../src/types';
const sample=(m:Partial<Prediction>={}):Prediction=>({
 player:'Sample Hitter',prop_type:'total_bases',pick:'OVER 1.5',
 projected:3.5,model_prob:.74,prob_pct:74,
 confidence:'MEDIUM',generated_at:'2026-11-01T12:00:00Z',...m
});
test('a 3.5 total-base point estimate is 3, never P(OVER 1.5) 74%',()=>{
 const d=mlbModelDisplay(sample());assert.equal(d.headline,'3');
 assert.equal(d.probability,null);
 const html=renderToStaticMarkup(React.createElement(MlbModelPrediction,{pred:sample()}));
 assert.match(html,/3<\\/strong>/);
 assert.match(html,/P\\(exactly 3\\) unavailable/);
 assert.match(html,/P\\(published pick\\): 74.0%/);
});
test('numeric 3.6 rounds up, while actual moneyline event preserves P(event)',()=>{
 assert.equal(mlbModelDisplay(sample({projected:3.6})).headline,'4');
 const event=mlbModelDisplay(sample({prop_type:'moneyline',pick:'Boston wins',
  projected:0.6,prob_pct:62}));
 assert.equal(event.headline,'Boston wins');assert.equal(event.probability,62);
});
