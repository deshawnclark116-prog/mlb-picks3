import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rankNflOwnProjections,hasNflOwnProjectionEvidence,rankNflRoleSupportedOwnProjections,rankNflPregameSnapshotForDisplay} from '../src/nfl/ownProjectionRank.ts';
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

test('numerical accuracy window outranks near-50% median reach',()=>{
  const precise=make('Precise',.502,70);
  precise.projection_within_10_probability=.72;
  const volatile=make('Volatile',.54,40);
  volatile.projection_within_10_probability=.19;
  assert.deepEqual(rankNflOwnProjections([volatile,precise]).map(p=>p.player),
    ['Precise','Volatile'],
    'highest P(at least median) is NOT strongest numeric projection');
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

test('top ten requires source-matched, fresh three-game pregame role evidence',()=>{
  const p=make('Research',.56,30);
  const generated='2026-11-08T17:15:48Z',kickoff='2026-11-08T18:00:00Z';
  const now=Date.parse('2026-11-08T17:17:00Z');
  const role:any={
    schema:'nfl-role-evidence-coverage-v1',status:'PREGAME_RESEARCH_ROLE_SNAPSHOT',
    captured_at_utc:'2026-11-08T17:16:00Z',forecast_generated_at_utc:generated,
    player_market_evidence:[{
      player:'Research',team:'CLE',opponent:'NO',market:'receiving_yards',
      kickoff_utc:kickoff,published_model_median:30,published_model_source:'blended_sim',
      roster_status:'ROSTER_LISTED_NOT_STARTER_VERIFIED',observed_stat_rows:3,
      role_evidence_complete_for_showcase:true,has_verified_starting_role:false,
      has_calibrated_book_bet_probability:false,warnings:[]
    }]
  };
  const ranked=(r:any,t=now)=>rankNflRoleSupportedOwnProjections([p],r,generated,kickoff,t);
  assert.deepEqual(ranked(null),[],'no independent pregame receipt');
  assert.deepEqual(ranked(role).map(x=>x.player),['Research']);
  assert.deepEqual(ranked({...role,forecast_generated_at_utc:'2026-11-08T16:15:48Z'}),[]);
  assert.deepEqual(ranked({...role,player_market_evidence:[{
    ...role.player_market_evidence[0],observed_stat_rows:2
  }]}),[]);
  assert.deepEqual(ranked({...role,player_market_evidence:[{
    ...role.player_market_evidence[0],warnings:['INJURY_UNCERTAIN']
  }]}),[]);
  assert.deepEqual(ranked(role,Date.parse('2026-11-08T18:00:00Z')),[],
    'kickoff closes pregame selections');
});

test('NBA-style visible archive keeps authentic PREKICKOFF projection after kickoff',()=>{
 const original=make('PreKickoff',.52);
 const kickoff='2026-11-08T18:00:00Z',generated='2026-11-08T17:56:00Z';
 const role:any={schema:'nfl-role-evidence-coverage-v1',
   status:'PREGAME_RESEARCH_ROLE_SNAPSHOT',
   forecast_generated_at_utc:generated,captured_at_utc:'2026-11-08T17:56:02Z',
   player_market_evidence:[{
     player:'PreKickoff',team:'CLE',opponent:'NO',market:'receiving_yards',
     kickoff_utc:kickoff,published_model_median:30,
     published_model_source:'blended_sim',
     role_evidence_complete_for_showcase:true,observed_stat_rows:3,
     roster_status:'ROSTER_LISTED_NOT_STARTER_VERIFIED',
     has_verified_starting_role:false,has_calibrated_book_bet_probability:false,
     warnings:[]
   }]};
 const after=Date.parse('2026-11-08T18:10:00Z');
 assert.deepEqual(rankNflRoleSupportedOwnProjections([original],role,generated,kickoff,after),[],
  'NEW decisions remain closed after kickoff');
 assert.deepEqual(rankNflPregameSnapshotForDisplay([original],role,generated,kickoff,after)
   .map(p=>p.player),['PreKickoff'],'original pregame preview remains visible after start');
 const late={...role,captured_at_utc:'2026-11-08T18:01:00Z'};
 assert.deepEqual(rankNflPregameSnapshotForDisplay([original],late,generated,kickoff,after),[]);
 assert.deepEqual(rankNflPregameSnapshotForDisplay([original],role,'2026-11-08T18:02:00Z',kickoff,after),[]);
});
