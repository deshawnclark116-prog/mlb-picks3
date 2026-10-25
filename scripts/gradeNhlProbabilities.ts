import {existsSync,readdirSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {gradeNhlOriginalShotProbabilities,type FrozenNhlShotDoc,
 type OfficialNhlForecast,type OfficialNhlGrade} from '../src/nhl/probabilityForward.ts';
function arg(name:string):string{
 const n=process.argv.indexOf('--'+name);
 if(n<0||!process.argv[n+1])throw Error('NHL_FORWARD_PROBABILITY_MISSING_'+name);
 return process.argv[n+1];
}
function jsonLines<T>(file:string):T[]{
 if(!existsSync(file))throw Error('NHL_OFFICIAL_FIRSTSEEN_LEDGER_MISSING_'+file);
 return readFileSync(file,'utf8').split('\n').filter(s=>s.trim()).map(x=>JSON.parse(x));
}
const dir='docs/nhl_v2_probability_firstseen';
const snapshots:FrozenNhlShotDoc[]=(existsSync(dir)?
  readdirSync(dir).filter(s=>/^20\d\d-\d\d-\d\dT\d{6}Z\.json$/.test(s)):[]
).map(name=>JSON.parse(readFileSync(path.join(dir,name),'utf8')));
const forecasts=jsonLines<OfficialNhlForecast>(arg('forecast-ledger'));
const grades=jsonLines<OfficialNhlGrade>(arg('official-grade-ledger'));
const result=gradeNhlOriginalShotProbabilities(snapshots,forecasts,grades);
const out=arg('out');
mkdirSync(path.dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log('NHL_REAL_PROSPECTIVE_MILESTONE_PROBABILITIES_GRADED',JSON.stringify({
 frozen_player_predictions:result.firstseen_independent_player_forecasts,
 frozen_event_thresholds:result.original_milestone_predictions,
 verified:result.verified_milestone_outcomes,
 unverified:result.unverified_milestone_outcomes,
 by_milestone:result.by_milestone,
 official_bets:0
}));
