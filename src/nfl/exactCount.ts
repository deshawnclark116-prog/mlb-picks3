/** Exact integer outcome from the ORIGINAL NFL count-stat CDF.
 * Publisher cdf_lattice.step=1 stores P(X<1), P(X<2), ... at indices 0,1,...
 * P(X=k) = F_<k+1 - F_<k, NOT P(X>=an easier milestone).
 * Yardage quantile grids cannot supply calibrated exact-yard probability.
 * Half-sack categories are left unavailable rather than mis-specified.
 */
import type {ForecastRow} from './phase1';
import {wholeStatProjection,type ExactCountEvent} from '../lib/wholeStatProjection';
const integerOutcomes=new Set(['rec','pass_td','int','rush_td','rec_td','atd',
 'tackles','def_int']);
export function exactNflCountEvent(row:ForecastRow):ExactCountEvent|null{
 if(!integerOutcomes.has(row.outcome)||row.median==null||
  !Number.isFinite(row.median)||row.median<0)return null;
 const lattice=row.cdf_lattice;
 if(!lattice||lattice.step!==1||!Array.isArray(lattice.cdf)||
  lattice.cdf.length<2||
  lattice.cdf.some((p,i)=>typeof p!=='number'||!Number.isFinite(p)||
     p<0||p>1||(i>0&&p<lattice.cdf[i-1])))return null;
 const count=wholeStatProjection(row.median);
 if(count>=lattice.cdf.length)return null;
 const prob=lattice.cdf[count]-(count===0?0:lattice.cdf[count-1]);
 if(!Number.isFinite(prob)||prob<0||prob>1)return null;
 return {count,probability:Number(prob.toFixed(6)),
  label:'Exactly '+count,semantics:'EXACT_INTEGER_COUNT',
  calibration:'UNCALIBRATED'};
}
