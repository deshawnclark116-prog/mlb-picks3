/** MLB's published pick is not P(exactly its independent projected mean).
 * Do not relabel the original betting line's P(hit) as an integer prediction.
 */
import React from 'react';
import type {Prediction} from '../types';
import {wholeStatProjection} from '../lib/wholeStatProjection';
export function mlbModelDisplay(p:Prediction){
 const numeric=typeof p.projected==='number'&&Number.isFinite(p.projected)&&
  p.projected>=0&&!/moneyline|game winner|match winner|\bml\b/i.test(p.prop_type);
 if(numeric){
  return {headline:wholeStatProjection(p.projected).toString(),
   unit:p.prop_type,probability:null as number|null,
   label:'Model whole-number forecast',explanation:
    'P(exactly '+wholeStatProjection(p.projected)+') unavailable: source publishes P(pick), not this exact-count event.',
   original:p.projected};
 }
 const pct=typeof p.prob_pct==='number'&&Number.isFinite(p.prob_pct)&&p.prob_pct>=0&&p.prob_pct<=100?
   p.prob_pct:null;
 return {headline:p.pick,unit:p.prop_type,probability:pct,
  label:'Original published event',explanation:
   'The percentage applies only to this published event, not an invented player-stat count.',
  original:null};
}
export function MlbModelPrediction({pred}:{pred:Prediction}){
 const d=mlbModelDisplay(pred);
 return <div data-testid="mlb-one-model-forecast" className="rounded-xl border border-[#00FF41]/25 bg-[#101f15] p-3">
  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-300">{d.label}</p>
  <div className="mt-2 flex items-center justify-between gap-2">
   <strong data-testid="mlb-whole-prediction" className="min-w-0 break-words text-2xl font-black text-[#00FF41]">{d.headline}</strong>
   <strong data-testid="mlb-exact-probability" className="shrink-0 text-xl font-black text-[#00FF41]">{d.probability==null?'—':d.probability.toFixed(1)+'%'}</strong>
  </div>
  <p className="mt-1 text-[11px] text-amber-200">{d.explanation}</p>
  <details className="mt-2 border-t border-[#334439] pt-2 text-[11px] text-gray-400">
   <summary className="min-h-8 cursor-pointer font-semibold">Original model evidence ▾</summary>
   {d.original!=null&&<p>Original decimal model estimate: {d.original.toFixed(3)} {d.unit}. This is preserved unchanged for grading.</p>}
   <p>Original published pick: {pred.pick}</p>
   <p>P(published pick): {pred.prob_pct!=null&&Number.isFinite(pred.prob_pct)?pred.prob_pct.toFixed(1)+'%':'unavailable'}</p>
   <p>Original sportsbook price: {pred.odds==null?'unavailable':String(pred.odds)}. Not the model probability of the rounded count.</p>
  </details>
 </div>;
}
