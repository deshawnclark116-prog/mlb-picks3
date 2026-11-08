import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rankNflOwnProjections,hasNflOwnProjectionEvidence} from '../src/nfl/ownProjectionRank.ts';
import {parseExistingNfl,type ExistingYardProjection} from '../src/nfl/existing.ts';

const make=(player:string,p:number|null,median=30):ExistingYardProjection=>({
  player,player_id:player,team:'CLE',opponent:'NO',market:'receiving_yards',
  kickoff_utc:'2026-11-08T18:00:00Z',projected_median:median,projected_mean:median,
  projected_low:0,projected_high:80,model_source:'blended_sim',ungraded:true,
  games_played:7,confidence:null,
  whole_projection:median,projection_reach_probability:p,
  projection_within_10_probability:.21,projection_simulation_n:10_000,
  projection_probability_source:'UNCALIBRATED_HISTORICAL_USAGE_BOOTSTRAP'
});

test('top ten are model-own-event ranked, not yardage-amount or book-line ranked',()=>{
  const rows=Array.from({length:14},(_,i)=>make('P'+i,(i+30)/100,i+10));
  const before=[...rows];
  const top=rankNflOwnProjections(rows);
  assert.equal(top.length,10);
  assert.deepEqual(top.map(x=>x.player),['P13','P12','P11','P10','P9','P8','P7','P6','P5','P4']);
  assert.deepEqual(rows,before,'original model source ordering must be untouched');
});

test('no fake percentages from odds, v2 context or fewer than 10k worlds',()=>{
  const fake=make('Bookline',null);(fake as any).model_prob=.97;
  const v2=make('Context',.9);v2.model_source='v2_context';
  v2.projection_probability_source='UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION';
  const short=make('Under10k',.92);short.projection_simulation_n=8000;
  const mismatch=make('WrongMedian',.97);mismatch.whole_projection=100;
  const zero=make('Zero',1,0);
  const real=make('Actual',.54);
  assert.deepEqual(rankNflOwnProjections([fake,v2,short,mismatch,zero,real]).map(x=>x.player),['Actual']);
  assert(!hasNflOwnProjectionEvidence(fake));
  assert.throws(()=>rankNflOwnProjections([real],0),/shortlist size/);
});

test('published, same-simulation research events survive parser with no sportsbook substitution',()=>{
  const doc={season:2026,week:9,generated_at_utc:'2026-11-08T17:15:48Z',
    scheduled_games:[{home_team:'NO',away_team:'CLE',kickoff_utc:'2026-11-08T18:00:00Z'}],
    picks:[{...make('Research',.56),model_prob:.99,line:20.5,
      projected_mean:33,projected_low:1,projected_high:77}]};
  const slate=parseExistingNfl(doc,new Date('2026-11-08T17:16:00Z'));
  const p=slate.games[0].projections[0];
  assert.equal(p.projection_reach_probability,.56);
  assert.equal(p.whole_projection,30);
  assert.deepEqual(rankNflOwnProjections(slate.games[0].projections).map(x=>x.player),['Research']);
});
