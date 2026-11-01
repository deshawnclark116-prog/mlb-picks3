/** User-facing integer forecast display; source-model means/medians stay unchanged.
 *
 * Unlike conventional 0.5 rounding, 0.6 is the first upward boundary.
 * A rounded integer is an EVENT LABEL, not a probability on its own.
 * Exact-count P(X=k) requires an observed/published discrete CDF.
 * Distinct from P(X>=k), the probability of "k or more".
 */
export function wholeStatProjection(value:number):number{
 if(!Number.isFinite(value)||value<0)throw Error('INVALID_WHOLE_STAT_FORECAST');
 const bottom=Math.floor(value);
 return bottom+(value-bottom>=.6-1e-10?1:0);
}
export type ExactCountEvent={
 count:number;probability:number|null;label:string;
 semantics:'EXACT_INTEGER_COUNT';calibration:'UNCALIBRATED'|'NOT_AVAILABLE';
};
const bounded=(p:unknown):p is number=>
 typeof p==='number'&&Number.isFinite(p)&&p>=0&&p<=1;
/** Requires BOTH P(X>=k) and P(X>=k+1), no fake extrapolation beyond support. */
export function exactCountFromSurvival(
  count:number, survival:Readonly<Record<number,number>>|null|undefined
):number|null{
 if(!Number.isSafeInteger(count)||count<0||!survival)return null;
 const below=count===0?1:survival[count];
 const above=survival[count+1];
 if(!bounded(below)||!bounded(above)||above>below+1e-8)return null;
 return Math.max(0,Math.min(1,below-above));
}
export function wholeStatEvent(value:number,survival?:
 Readonly<Record<number,number>>|null):ExactCountEvent{
 const count=wholeStatProjection(value);
 const probability=exactCountFromSurvival(count,survival);
 return {count,probability,label:'Exactly '+count,
  semantics:'EXACT_INTEGER_COUNT',
  calibration:probability===null?'NOT_AVAILABLE':'UNCALIBRATED'};
}
