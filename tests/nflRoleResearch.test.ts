import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseNflRoleResearch,statKey,teamKey} from '../src/nfl/roleResearch';
import {OutcomeCard,NflPhase1Board} from '../src/components/NflTodayScreen';
import {loadNflRoleResearch,nflRoleResearchHandler,NFL_ROLE_FULL_URL,NFL_ROLE_CONFLICTS_URL} from '../server/nflRoleResearch';
import type {ForecastRow,Phase1View} from '../src/nfl/phase1';

const NOW=Date.parse('2026-10-18T02:00:00Z');
const kickoff='2026-10-18T17:00:00Z';
const makeRow=(game:string,team:string,op:string,name:string,median:number,p:number):ForecastRow=>({
  game_id:game,team,opp:op,player:name,pos:'QB',outcome:'pass_yds',id:team+'-'+name,
  mean:median,median,p_active:p,p10:0,p25:0,p75:median+30,p90:median+80,
  exp_opp:20,role_share:.5,sd:55,p0:.1,p_ge1:.9,unc:.5,unc_reasons:[]
});
function view():Phase1View{
 const games=[
 {game_id:'2026_06_CAR_PHI',home:'PHI',away:'CAR',kickoff_utc:kickoff,horizons:{T24:{cutoff:'2026-10-17T17:00:00Z',model_version:'test',n_records:2}}},
 {game_id:'2026_06_CHI_ATL',home:'ATL',away:'CHI',kickoff_utc:kickoff,horizons:{T24:{cutoff:'2026-10-17T17:00:00Z',model_version:'test',n_records:2}}},
 {game_id:'2026_06_BAL_CLE',home:'CLE',away:'BAL',kickoff_utc:kickoff,horizons:{T24:{cutoff:'2026-10-17T17:00:00Z',model_version:'test',n_records:1}}}
 ] as Phase1View['games'];
 const rows=[
 makeRow('2026_06_CAR_PHI','PHI','CAR','tanner mckee',0,.1852),
 makeRow('2026_06_CAR_PHI','PHI','CAR','jalen hurts',0,.0057),
 makeRow('2026_06_CHI_ATL','CHI','ATL','caleb williams',75,.8122),
 makeRow('2026_06_CHI_ATL','CHI','ATL','tyson bagent',62,.7202),
 makeRow('2026_06_BAL_CLE','BAL','CLE','tyler huntley',180,.845)
 ];
 const alt_65=Object.fromEntries(rows.map(r=>[r.id,{milestone:100,probability:.8,method:'quantile_grid_99_conservative' as const}]));
 return {games,rows:{T24:rows,T90:[]},artifact:{
   schema:'nfl-new-engine-shadow-v1',row_fields:[],default_horizon:'T24',games,forecasts:{T24:[],T90:[]},
   status:{season:2026,week:6,r11:'UNRESOLVED',last_shadow_run_utc:'2026-10-18T01:50:00Z',
     model_versions:['test'],readiness_ready:false,counts:{T24:{valid_games:3},T90:{valid_games:0}}},
   alt_65
 },defaultHorizon:'T24',excludedGames:0,publicationMs:NOW-600_000};
}
function data(){
 const impact=(player:string,old:number,after:number)=>({
  player,outcome:'pass_yds',original_model_resimulation:{median:old,mean:old},
  verified_starter_role_scenario:{median:after,mean:after+9}
 });
 const scenario=(game:string,team:string,name:string,source:string,impactRows:any[])=>({
   game_id:game,team,opponent:team==='PHI'?'CAR':'ATL',horizon:'T24',verified_starter:name,
   scenario_evidence_tier:source,starter_is_officially_source_verified:source==='OFFICIAL_TEAM_STARTER_SOURCE',
   original_source_restore_proof:{all_original_blob_sha256_verified:true},
   never_a_replacement_for_original_frozen_forecast:true,
   verified_original_forecast_unchanged:true,
   do_not_treat_as_unconditional_or_as_certified_bookmaker_pick:true,
   scenario_fitted_with_post_cutoff_stats:false,
   n_draws:10000,start_status_sources:source==='OFFICIAL_TEAM_STARTER_SOURCE'?[{url:'https://www.philadelphiaeagles.com/news/confirmed'}]:[],
   source_reported_expected_start_url:source==='NFL_NETWORK_EXPECTED_START_NOT_ACTIVE_VERIFIED'?'https://www.nfl.com/news/bears-qb-expected':'',
   source_was_known_at_original_cutoff:false,
   player_impact:impactRows
 });
 return {
  schema:'NFL_V2_APP_ROLE_RESEARCH_V1',
  role_conflicts:{
    schema:'NFL_V2_ALL_GAMES_QB_ROLE_CONTRADICTIONS_V1',
    original_forecasts_not_changed:true,research_only:true,official_bets_created:0,
    generated_at_utc:'2026-10-18T01:12:08Z',
    role_conflicts:[
      {game_id:'2026_06_CAR_PHI',team:'PHI',horizon:'T24',kickoff_utc:kickoff,
       flags:['NO_QB_WITH_MAJORITY_PLAY_PROBABILITY'],automatic_starter_selection:false},
      {game_id:'2026_06_CHI_ATL',team:'CHI',horizon:'T24',kickoff_utc:kickoff,
       flags:['MULTIPLE_QBS_PROJECTED_FOR_SUBSTANTIVE_PASSING'],automatic_starter_selection:false}
    ]
  },
  full_event:{
    schema:'NFL_V2_SOURCE_VERIFIED_STARTING_QB_FULL_EVENT_CHALLENGER_V1',
    generated_at_utc:'2026-10-18T01:20:57Z',not_official_original_forecast:true,
    no_money_line_or_player_prop_bets:true,
    scenarios:[
      scenario('2026_06_CAR_PHI','PHI','Tanner McKee','OFFICIAL_TEAM_STARTER_SOURCE',
        [impact('tanner mckee',0,232.42)]),
      scenario('2026_06_CHI_ATL','CHI','Caleb Williams','NFL_NETWORK_EXPECTED_START_NOT_ACTIVE_VERIFIED',
        [impact('caleb williams',76,226.64),impact('tyson bagent',62,0)])
    ]
  }
 };
}

test('actual Sunday starter and expected-starter corrections reconcile against frozen V2 rows',()=>{
 const x=parseNflRoleResearch(data(),view(),NOW);
 assert.equal(x.blocked.size,2);
 assert.equal(x.corrected.size,3);
 const m=x.corrected.get(statKey('2026_06_CAR_PHI','T24','PHI','tanner mckee','pass_yds'))!;
 const c=x.corrected.get(statKey('2026_06_CHI_ATL','T24','CHI','caleb williams','pass_yds'))!;
 assert.equal(m.correctedMedian,232.42);
 assert.equal(m.originalMedian,0);
 assert.equal(m.sourceTier,'OFFICIAL_TEAM_STARTER_SOURCE');
 assert.equal(c.correctedMedian,226.64);
 assert.equal(c.originalMedian,75); // baseline re-simulation is 76, allowed only limited MC noise
 assert.equal(c.sourceTier,'NFL_NETWORK_EXPECTED_START_NOT_ACTIVE_VERIFIED');
 assert(!x.blocked.has(teamKey('2026_06_BAL_CLE','T24','BAL')));
});

test('app visibly shows revised median next to frozen original and source-strength caution',()=>{
 const d=data(),v=view();
 const roles=parseNflRoleResearch(d,v,NOW),r=v.rows.T24[2];
 const html=renderToStaticMarkup(React.createElement(OutcomeCard,{
   row:r,view:v,roleStat:roles.corrected.get(statKey(r.game_id,'T24',r.team,r.player,r.outcome))
 }));
 assert.match(html,/UPDATED ROLE-CONDITIONED MEDIAN/);
 assert.match(html,/226.6/);
 assert.match(html,/75/);
 assert.match(html,/Expected to start; not certified active/);
 assert.match(html,/NOT A VERIFIED BET/);
});

test('quarantine both contradicted QB teams from SYSTEM PICKS without hiding good other teams',()=>{
 const v=view(),x=parseNflRoleResearch(data(),v,NOW);
 const html=renderToStaticMarkup(React.createElement(NflPhase1Board,{
   view:v,loading:false,error:null,retrievedAt:'2026-10-18T02:00:00Z',
   refresh:async()=>{},role:x
 }));
 assert.match(html,/STARTER \/ OPPORTUNITY CORRECTIONS/);
 assert.match(html,/232.4/);
 assert.match(html,/226.6/);
 // Only unflagged Tyler Huntley remains eligible for original 65% target ranking
 assert.match(html,/TODAY(?:&#x27;|')S BEST/);
 const best=html.match(/data-testid="today-best"/g)||[];
 assert.equal(best.length,1);
 assert.match(html,/tyler huntley/);
});

test('reject forged or stale research, wrong team identity and uncertified expectations',()=>{
 const v=view();
 let d=data();d.full_event.scenarios[1].starter_is_officially_source_verified=true;
 assert.throws(()=>parseNflRoleResearch(d,v,NOW),/Unverified/);
 d=data();d.full_event.scenarios[1].source_reported_expected_start_url='https://evil.example.com/fake';
 assert.throws(()=>parseNflRoleResearch(d,v,NOW),/expected-start/);
 d=data();d.full_event.generated_at_utc='2026-10-16T00:00:00Z';
 assert.throws(()=>parseNflRoleResearch(d,v,NOW),/stale/);
 d=data();d.full_event.scenarios[0].player_impact[0].original_model_resimulation.median=70;
 assert.throws(()=>parseNflRoleResearch(d,v,NOW),/does not reproduce original/);
 d=data();d.role_conflicts.role_conflicts.push({...d.role_conflicts.role_conflicts[0]});
 assert.throws(()=>parseNflRoleResearch(d,v,NOW),/Duplicate/);
});

test('after kickoff the app cannot advertise a new pregame role condition or bet',()=>{
 const x=parseNflRoleResearch(data(),view(),Date.parse('2026-10-18T18:00:00Z'));
 assert.equal(x.corrected.size,0);
 assert.equal(x.blocked.size,0);
});

test('server only fetches the two documented nfl research artifacts without caching or Render fallback',async()=>{
 const doc=data(),calls:string[]=[];
 const mock=async(url:string,opts:any)=>{
   calls.push(url);
   assert.equal(opts.cache,'no-store');
   return new Response(JSON.stringify(url.startsWith(NFL_ROLE_FULL_URL)?doc.full_event:doc.role_conflicts));
 };
 const loaded=await loadNflRoleResearch(mock as any,NOW);
 assert.equal(loaded.schema,doc.schema);
 assert.equal(calls.length,2);
 assert(calls.some(s=>s.startsWith(NFL_ROLE_FULL_URL)));
 assert(calls.some(s=>s.startsWith(NFL_ROLE_CONFLICTS_URL)));
 assert(calls.every(s=>!s.includes('render.com')&&s.includes('?t=')));
 const fail=async()=>new Response('',{status:404});
 let status=200,body:any,headers:any={};
 const res={setHeader:(k:string,v:string)=>headers[k]=v,status:(n:number)=>{status=n;return res},json:(x:any)=>{body=x;return res}};
 await nflRoleResearchHandler(fail as any,()=>NOW)({} as any,res as any);
 assert.equal(status,502);
 assert.match(body.error,/unavailable/);
 assert.match(headers['Cache-Control'],/no-store/);
});
