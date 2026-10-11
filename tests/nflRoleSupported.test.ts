import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ExistingNflGame,ExistingYardProjection} from '../src/nfl/existing.ts';
import {roleSupportedNflProjections,type NflRoleSnapshot} from '../src/nfl/roleSupportedNfl.ts';
import type {LiveMarketResponse} from '../src/nfl/verifiedMarkets.ts';
const at=Date.parse('2026-10-11T13:00:00Z');
const kickoff='2026-10-11T17:00:00Z';
const gen='2026-10-11T08:44:39Z';
const projection=(name:string,median:number,confidence:'HIGH'|'MEDIUM'|'LOW',team='CHI'):ExistingYardProjection=>({
 player:name,team,opponent:team==='CHI'?'GB':'CHI',market:'rushing_yards',kickoff_utc:kickoff,
 projected_median:median,projected_mean:median,projected_low:0,projected_high:100,
 model_source:'v2_context',ungraded:true,player_id:name,games_played:3,confidence
});
const g:ExistingNflGame={id:'2026-10-11T17:00:00.000Z|CHI_GB',home:'GB',away:'CHI',
 kickoff_utc:kickoff,teams:['CHI','GB'],projections:[
   projection('Roschon Johnson',0.4,'HIGH'),
   projection("D'Andre Swift",59.8,'HIGH'),
   projection('Another Runner',45,'MEDIUM')
 ]};
const quote=(name:string,line:number)=>({
 player:name,market:'rushing_yards' as const,line,book:'fanduel',
 over_price:-110,under_price:-110,
 market_updated_at_utc:'2026-10-11T12:58:00Z',
 kickoff_utc:kickoff,home:'GB',away:'CHI'
});
const odds:LiveMarketResponse={status:'VERIFIED_QUOTES',checked_at_utc:'2026-10-11T12:59:00Z',lines:[
 quote('Roschon Johnson',17.5),quote("D'Andre Swift",82.5),quote('Another Runner',35.5)
]};
const role=(name:string,median:number,att:number,share:number,roleGood=true)=>({
 player:name,team:'CHI',opponent:'GB',market:'rushing_yards',
 kickoff_utc:kickoff,published_model_median:median,published_model_source:'v2_context',
 roster_status:'ROSTER_LISTED_NOT_STARTER_VERIFIED',
 recent_opportunities_per_observed_game:att,recent_team_share:share,
 role_evidence_complete_for_showcase:roleGood,
 has_verified_starting_role:false as const,has_calibrated_book_bet_probability:false as const,
 observed_stat_rows:3,warnings:roleGood?[]:['LOW_OR_UNKNOWN_PRIOR_OPPORTUNITY']
});
const evidence:NflRoleSnapshot={schema:'nfl-role-evidence-coverage-v1',
 status:'PREGAME_RESEARCH_ROLE_SNAPSHOT',season:2026,week:5,
 forecast_generated_at_utc:gen,captured_at_utc:'2026-10-11T12:55:00Z',
 is_betting_probability_calibrated:false,starter_status_verified:false,
 player_market_evidence:[
  role('Roschon Johnson',0.4,0,0,false),
  role("D'Andre Swift",59.8,14,.55),
  role('Another Runner',45,9,.3),
 ]};

test('Roschon Johnson 0.4 HIGH on a real sportsbook line is NOT qualified: zero real workload',()=>{
 const out=roleSupportedNflProjections(g,odds,evidence,gen,at);
 assert.deepEqual(out.map(x=>x.projection.player),["D'Andre Swift",'Another Runner']);
 assert(!out.some(x=>x.projection.player==='Roschon Johnson'));
 assert.equal(out[0].role.recent_team_share,.55);
});
test('role evidence missing, stale, different forecast model version or wrong sportsbook is NONE',()=>{
 assert.deepEqual(roleSupportedNflProjections(g,odds,null,gen,at),[]);
 assert.deepEqual(roleSupportedNflProjections(g,odds,{...evidence,captured_at_utc:'2026-10-10T11:00:00Z'},gen,at),[]);
 assert.deepEqual(roleSupportedNflProjections(g,odds,evidence,'2026-10-11T07:00:00Z',at),[]);
 assert.deepEqual(roleSupportedNflProjections(g,{status:'ODDS_PROVIDER_UNAVAILABLE',lines:[]},evidence,gen,at),[]);
 assert.deepEqual(roleSupportedNflProjections(g,odds,evidence,gen,Date.parse(kickoff)),[]);
});
test('support does not imply starter and must not fabricate a bet probability',()=>{
 const out=roleSupportedNflProjections(g,odds,evidence,gen,at);
 assert.equal(out[0].role.has_verified_starting_role,false);
 assert.equal(out[0].role.has_calibrated_book_bet_probability,false);
 assert.equal('model_prob' in out[0],false);
 assert.equal('fair_prob' in out[0],false);
});
test('a name, a team, a market, a kickoff, and a projection must all match exactly',()=>{
 const e={...evidence,player_market_evidence:[{...evidence.player_market_evidence[1],published_model_median:59.9}]};
 assert(!roleSupportedNflProjections(g,odds,e,gen,at).some(x=>x.projection.player==="D'Andre Swift"));
 const wrong={...evidence,player_market_evidence:[{...evidence.player_market_evidence[1],opponent:'DET'}]};
 assert(!roleSupportedNflProjections(g,odds,wrong,gen,at).some(x=>x.projection.player==="D'Andre Swift"));
 const ambiguous={...evidence,player_market_evidence:[...evidence.player_market_evidence,evidence.player_market_evidence[1]]};
 assert(!roleSupportedNflProjections(g,odds,ambiguous,gen,at).some(x=>x.projection.player==="D'Andre Swift"));
});
test('role popularity ranks featured research candidates but does NOT rank betting confidence',()=>{
 const out=roleSupportedNflProjections(g,odds,evidence,gen,at,1);
 assert.equal(out.length,1);
 assert.equal(out[0].projection.player,"D'Andre Swift");
 assert.throws(()=>roleSupportedNflProjections(g,odds,evidence,gen,at,0),/limit/);
});
