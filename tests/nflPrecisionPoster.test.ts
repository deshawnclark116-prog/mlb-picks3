import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nflPrecisionPosterData,nflPrecisionPosterFilename} from '../src/nfl/precisionShare.ts';
import {rankNflOwnProjections} from '../src/nfl/ownProjectionRank.ts';
import type {ExistingNflGame,ExistingYardProjection} from '../src/nfl/existing.ts';
const kickoff='2026-11-08T18:00:00Z';
const game:ExistingNflGame={id:'CLE-NO',kickoff_utc:kickoff,teams:['CLE','NO'],
  away:'CLE',home:'NO',projections:[]};
const make=(id:number,band:number):ExistingYardProjection=>({
 player:'Player '+id,player_id:String(id),team:'CLE',opponent:'NO',market:'receiving_yards',
 kickoff_utc:kickoff,projected_median:40,projected_mean:44,projected_low:4,
 projected_high:130,model_source:'blended_sim',ungraded:true,confidence:'HIGH',
 games_played:6,whole_projection:40,projection_reach_probability:.51,
 projection_within_10_probability:band,projection_simulation_n:10000,
 projection_probability_source:'UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP'
});
test('NBA-size TOP 10 poster uses same untouched rankings as NFL UI, no sportsbook prices',()=>{
 const ranked=rankNflOwnProjections(Array.from({length:13},(_,i)=>make(i,(i+10)/100)));
 const doc=nflPrecisionPosterData(game,ranked,9,'2026-11-08T17:56:00Z');
 assert.equal(doc.picks.length,10);
 assert.deepEqual(doc.picks.map(p=>p.player),ranked.map(p=>p.player));
 assert.deepEqual(doc.picks.map(p=>p.rank),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(doc.picks[0].withinTen,.22);
 assert.equal(doc.picks[0].projectedYards,40);
 assert.equal(doc.bettingLineIncluded,false);
 assert.equal(doc.probabilityForwardCalibrated,false);
 assert(!JSON.stringify(doc).includes('fanduel'));
 assert.match(nflPrecisionPosterFilename(doc),/nfl-w09-cle-no-top10-2026-11-08\.png$/);
});
test('no fake top ten fillers and no model probability substituted for v2-context medians',()=>{
 const p=make(1,.39),v2=make(2,.95);
 v2.model_source='v2_context';
 v2.projection_probability_source='UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION';
 const doc=nflPrecisionPosterData(game,rankNflOwnProjections([v2,p]),9,'2026-11-08T17:56:00Z');
 assert.equal(doc.picks.length,1);
 assert.equal(doc.picks[0].player,'Player 1');
 assert.throws(()=>nflPrecisionPosterData(game,[p],9,'2026-11-08T18:02:00Z'),
   /ORIGINAL_PREGAME/);
});
test('poster rejects accidental re-ranking by player-name or arbitrary yardage',()=>{
 const a=make(1,.30),b=make(2,.80);
 assert.throws(()=>nflPrecisionPosterData(game,[a,b],9,'2026-11-08T17:56:00Z'),
   /PRECISION_RANKED/);
});
