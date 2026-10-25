/** Score ONLY genuinely frozen, pre-tip NBA probabilities vs independent ESPN finals. */
import {existsSync,readdirSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {gradeForwardNbaProbabilities,type FrozenProbSnapshot}
  from '../src/nba/probabilityLedger.ts';

const out=process.argv[process.argv.indexOf('--out')+1];
if(!process.argv.includes('--out')||!out)throw Error('NBA_FORWARD_GRADE_OUTPUT_REQUIRED');
const folder=path.resolve('docs/nba_v2_probability_snapshots');
const docs:FrozenProbSnapshot[]=(existsSync(folder)?
  readdirSync(folder).filter(x=>/^20\d\d-\d\d-\d\dT\d{6}Z\.json$/.test(x)):[]
).map(f=>JSON.parse(readFileSync(path.join(folder,f),'utf8')));
const gradefile=path.resolve('docs/nba_v2_rolling_player_grades.json');
if(!existsSync(gradefile))throw Error('NBA_FORWARD_MODEL_GRADE_SOURCE_UNAVAILABLE');
const truth=JSON.parse(readFileSync(gradefile,'utf8'));
const result=gradeForwardNbaProbabilities(docs,truth,new Date());
mkdirSync(path.dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log('NBA_FORWARD_PROBABILITY_REAL_ORIGINAL_GRADE',JSON.stringify({
  first_seen_games:result.firstseen_games,
  original_probability_picks:result.original_probabilistic_predictions,
  verified:result.verified_hit_or_miss,unverified:result.unverified,
  points_brier:result.by_market.points.mean_brier,
  official_bets:0
}));
