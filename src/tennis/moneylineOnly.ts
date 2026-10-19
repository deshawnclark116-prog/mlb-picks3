/** Only first-party published match-winner forecasts belong on the tennis board.
 * Prevent stale backend documents (still carrying old markets during deploys)
 * from repopulating discarded total-games and correct-score research cards.
 * This is display selection, not a recalibration or a sportsbook certification.
 */
import type {TennisPrediction} from '../types';

export function liveTennisMoneylines(predictions:TennisPrediction[]):TennisPrediction[] {
  return predictions.filter(p=>{
    if(p.market!=='moneyline')return false;
    if(!p.player1||!p.player2||p.player1===p.player2)return false;
    if(!Number.isFinite(p.model_prob)||p.model_prob<0.5||p.model_prob>1)return false;
    const choice=(p.pick||'').trim();
    return choice===p.player1+' ML'||choice===p.player2+' ML';
  });
}
