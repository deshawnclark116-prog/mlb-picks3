/** Freeze new NBA V2 outcome-probability picks BEFORE tipoff, never backfill. */
import {existsSync,readdirSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {readVerifiedNbaSystemBoard,loadNbaHistoricalProbabilityEvidence} from '../server/nbaSystemPicks.ts';
import {loadLiveNbaInjuries} from '../server/nbaLiveAvailability.ts';
import {freezeNbaProbabilities,verifyFrozenProbabilitySnapshots,
  type FrozenProbSnapshot} from '../src/nba/probabilityLedger.ts';

const dir=path.resolve('docs','nba_v2_probability_snapshots');
const out=process.argv[process.argv.indexOf('--out')+1];
if(!process.argv.includes('--out')||!out)throw Error('NBA_PROBABILITY_REQUIRED_OUTPUT');
if(existsSync(out))throw Error('NBA_FIRST_PROBABILITY_CAPTURE_ALREADY_EXISTS');
const artifact=loadNbaHistoricalProbabilityEvidence();
if(!artifact||!artifact.some_historical_market_passed){
  console.log('NBA_PROBABILITY_NOT_SOURCE_VERIFIED_NO_FIRSTSEEN_PUBLISH');
  process.exit(0);
}
const exists=existsSync(dir)?readdirSync(dir).filter(x=>x.endsWith('.json')):[];
const docs:FrozenProbSnapshot[]=exists.map(name=>
  JSON.parse(readFileSync(path.join(dir,name),'utf8')));
verifyFrozenProbabilitySnapshots(docs);
const gameSet=new Set(docs.flatMap(d=>d.games.map(g=>g.game_id)));
const now=new Date();
const availability=await loadLiveNbaInjuries(fetch,now);
const board=readVerifiedNbaSystemBoard(now,availability);
const original=freezeNbaProbabilities(board,artifact,now,gameSet);
if(!original.game_count){
  console.log('NBA_NO_NEW_VERIFIED_PROBABILITIES_TO_FREEZE');
  process.exit(0);
}
mkdirSync(path.dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify(original,null,2)+'\n');
console.log('NBA_NEW_BEFORE_TIP_PROBABILITY_PICKS_FROZEN',JSON.stringify({
  games:original.game_count,
  predictions:original.selected_predictions,
  saved_at_utc:original.frozen_at_utc,official_bets:0
}));
