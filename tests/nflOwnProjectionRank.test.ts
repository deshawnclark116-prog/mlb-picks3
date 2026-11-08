import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rankNflOwnProjections,hasNflOwnProjectionEvidence,rankNflRoleSupportedOwnProjections,rankNflPregameSnapshotForDisplay,hasNflNbaMeanProjectionEvidence,rankNflNbaMeanProjections,rankNflRoleSupportedNbaMeanProjections,rankNflPregameNbaMeanSnapshotForDisplay,hasNflMeaningfulTargetEvidence,rankNflMeaningfulTargets,rankNflRoleSupportedMeaningfulTargets,rankNflPregameMeaningfulTargetsForDisplay} from '../src/nfl/ownProjectionRank.ts';
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

test('NBA V5 frontend ranks P(reaching rounded model mean), NEVER the old ±10-yard chance',()=>{
 const a={...make('High NBA Chance',.48,40),projected_mean:57.6,
   projected_high:120,projection_within_10_probability:.11,
   nba_style_whole_mean_projection:58,nba_style_reach_probability:.73,
   nba_style_probability_event:'P_YARDS_AT_LEAST_ROUNDED_PUBLISHED_MEAN'};
 const b={...make('Old Band Winner',.57,38),projected_mean:38.2,
   projected_high:130,projection_within_10_probability:.95,
   nba_style_whole_mean_projection:38,nba_style_reach_probability:.64,
   nba_style_probability_event:'P_YARDS_AT_LEAST_ROUNDED_PUBLISHED_MEAN'};
 assert.deepEqual(rankNflNbaMeanProjections([b,a]).map(p=>p.player),
   ['High NBA Chance','Old Band Winner']);
 assert.equal(a.nba_style_whole_mean_projection,58,'model mean x.6 rounds up');
 assert(hasNflNbaMeanProjectionEvidence(a));
 assert.equal(rankNflOwnProjections([b,a])[0].player,'Old Band Winner',
   'existing old ±10 research history is preserved without promotion');
 const falseProb={...a,player:'Bookline',nba_style_reach_probability:null,model_prob:.999};
 assert(!hasNflNbaMeanProjectionEvidence(falseProb));
 const stale={...a,nba_style_whole_mean_projection:40};
 assert(!hasNflNbaMeanProjectionEvidence(stale));
 const wrongEvent={...a,nba_style_probability_event:'P_YARDS_WITHIN_TEN'};
 assert(!hasNflNbaMeanProjectionEvidence(wrongEvent));
 const v2={...a,model_source:'v2_context',
   projection_probability_source:'UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION'};
 assert(!hasNflNbaMeanProjectionEvidence(v2));
 assert.deepEqual(rankNflNbaMeanProjections([falseProb,stale,wrongEvent,v2,a])
   .map(p=>p.player),['High NBA Chance']);
});

test('NBA-style NFL event survives real source parser and identity-matched role gate',()=>{
 const generated='2026-11-08T17:54:00Z',kickoff='2026-11-08T18:00:00Z';
 const p={...make('Matched',.5,40),projected_mean:49.6,
   nba_style_whole_mean_projection:50,nba_style_reach_probability:.67,
   nba_style_probability_event:'P_YARDS_AT_LEAST_ROUNDED_PUBLISHED_MEAN'};
 const input={season:2026,week:9,generated_at_utc:generated,
   scheduled_games:[{home_team:'NO',away_team:'CLE',kickoff_utc:kickoff}],
   picks:[{...p,model_prob:.99,line:39.5}]};
 const slate=parseExistingNfl(input,new Date('2026-11-08T17:55:00Z'));
 const row=slate.games[0].projections[0];
 assert.equal(row.nba_style_reach_probability,.67);
 assert.equal(row.nba_style_whole_mean_projection,50);
 const role:any={schema:'nfl-role-evidence-coverage-v1',status:'PREGAME_RESEARCH_ROLE_SNAPSHOT',
   captured_at_utc:'2026-11-08T17:54:02Z',forecast_generated_at_utc:generated,
   player_market_evidence:[{
     player:'Matched',team:'CLE',opponent:'NO',market:'receiving_yards',kickoff_utc:kickoff,
     published_model_median:40,published_model_source:'blended_sim',observed_stat_rows:3,
     role_evidence_complete_for_showcase:true,roster_status:'ROSTER_LISTED_NOT_STARTER_VERIFIED',
     has_verified_starting_role:false,has_calibrated_book_bet_probability:false,warnings:[]
   }]};
 const before=Date.parse('2026-11-08T17:55:00Z'),after=Date.parse('2026-11-08T18:10:00Z');
 assert.equal(rankNflRoleSupportedNbaMeanProjections([row],role,generated,kickoff,before)[0].nba_style_reach_probability,.67);
 assert.deepEqual(rankNflRoleSupportedNbaMeanProjections([row],role,generated,kickoff,after),[]);
 assert.deepEqual(rankNflPregameNbaMeanSnapshotForDisplay([row],role,generated,kickoff,after)
    .map(p=>p.player),['Matched']);
 const warned={...role,player_market_evidence:[{...role.player_market_evidence[0],warnings:['OUT']}]};
 assert.deepEqual(rankNflRoleSupportedNbaMeanProjections([row],warned,generated,kickoff,before),[]);
 const future={...role,captured_at_utc:'2026-11-08T18:01:00Z'};
 assert.deepEqual(rankNflPregameNbaMeanSnapshotForDisplay([row],future,generated,kickoff,after),[]);
});


const meaningful=(name:string,chance:number,target=35):ExistingYardProjection=>{
 const p=make(name,.52,40);
 p.projected_mean=50;
 const selected={yards:target,probability:chance,wilson_lower_95:chance-.01};
 p.nfl_model_target=selected;
 p.nfl_model_target_event='P_YARDS_AT_LEAST_FIXED_MEANINGFUL_THRESHOLD';
 p.nfl_model_target_grid={
   schema:'nfl_meaningful_yardage_targets_v1',simulation_n:10000,
   minimum_absolute_yards:25,minimum_relative_mean_fraction:.55,
   required_wilson_lower_95:.65,grid_step_yards:5,
   conditional_on_modeled_opportunities:true,forward_calibrated:false,
   official_active_status_verified:false,chosen_target:selected,
   grid:[
     {yards:30,probability:.94,wilson_lower_95:.93},
     ...(target>35?[{yards:35,probability:.87,wilson_lower_95:.86}]:[]),
     selected,{yards:target+5,probability:.47,wilson_lower_95:.46}
   ].filter((x,i,a)=>a.findIndex(y=>y.yards===x.yards)===i)
    .sort((a,b)=>a.yards-b.yards)
 };
 return p;
};

test('feature targets are true highest qualified probabilities, not mean-reach, old band or book odds',()=>{
 const strong=meaningful('Strong',.84,35),weaker=meaningful('Weaker',.71,40);
 (strong as any).model_prob=.12; (weaker as any).model_prob=.98;
 strong.nba_style_reach_probability=.30;weaker.nba_style_reach_probability=.99;
 strong.projection_within_10_probability=.10;weaker.projection_within_10_probability=.99;
 assert(hasNflMeaningfulTargetEvidence(strong));
 assert.deepEqual(rankNflMeaningfulTargets([weaker,strong]).map(x=>x.player),['Strong','Weaker']);
 assert.equal(rankNflMeaningfulTargets([weaker,strong],1)[0].nfl_model_target?.probability,.84);
});

test('no trivial yards, v2 overwrite, out-of-grid targets or <65% lower bound survive',()=>{
 const good=meaningful('Good',.77,35);
 const tiny=meaningful('Trivial',.99,5);
 const under=meaningful('Uncertain',.659,35);
 under.nfl_model_target!.wilson_lower_95=.649;
 under.nfl_model_target_grid!.chosen_target=under.nfl_model_target;
 under.nfl_model_target_grid!.grid[1]=under.nfl_model_target;
 const v2=meaningful('V2',.91,35);
 v2.projection_probability_source='UNAVAILABLE_V2_CONTEXT_NO_MATCHED_DISTRIBUTION';
 const madeUp=meaningful('Missing simulation',.96,35);
 madeUp.projection_simulation_n=8000;
 const wrong=meaningful('Mismatch',.83,35);
 wrong.nfl_model_target!.yards=30;
 assert.deepEqual(rankNflMeaningfulTargets([tiny,under,v2,madeUp,wrong,good]).map(x=>x.player),['Good']);
});

test('the identical original pregame role receipt gates target picks before and after kickoff',()=>{
 const generated='2026-11-08T17:52:00Z',kickoff='2026-11-08T18:00:00Z';
 const p=meaningful('Source Verified',.81,35);
 const role:any={schema:'nfl-role-evidence-coverage-v1',
   status:'PREGAME_RESEARCH_ROLE_SNAPSHOT',
   forecast_generated_at_utc:generated,captured_at_utc:'2026-11-08T17:52:02Z',
   player_market_evidence:[{
     player:p.player,team:p.team,opponent:p.opponent,market:p.market,kickoff_utc:kickoff,
     published_model_median:p.projected_median,published_model_source:p.model_source,
     role_evidence_complete_for_showcase:true,observed_stat_rows:3,
     roster_status:'ROSTER_LISTED_NOT_STARTER_VERIFIED',
     has_verified_starting_role:false,has_calibrated_book_bet_probability:false,warnings:[]
   }]
 };
 const before=Date.parse('2026-11-08T17:55:00Z'),after=Date.parse('2026-11-08T18:15:00Z');
 assert.deepEqual(rankNflRoleSupportedMeaningfulTargets([p],role,generated,kickoff,before).map(x=>x.player),[p.player]);
 assert.deepEqual(rankNflRoleSupportedMeaningfulTargets([p],role,generated,kickoff,after),[]);
 assert.deepEqual(rankNflPregameMeaningfulTargetsForDisplay([p],role,generated,kickoff,after).map(x=>x.player),[p.player]);
 const warn={...role,player_market_evidence:[{...role.player_market_evidence[0],warnings:['INACTIVE_UNVERIFIED']}]};
 assert.deepEqual(rankNflPregameMeaningfulTargetsForDisplay([p],warn,generated,kickoff,after),[]);
});
