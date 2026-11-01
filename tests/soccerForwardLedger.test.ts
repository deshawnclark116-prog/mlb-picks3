import test from 'node:test';
import assert from 'node:assert/strict';
import {forecastMatch,type Forecast,type Match} from '../src/soccer/model';
import {makeOriginal,gradeOriginal,forwardScore,soccerId,validateOriginal} from '../src/soccer/forwardLedger';
const fixture:Match={league:'EPL',season:'2026-27',date:'2026-11-03',
  home:'North FC',away:'South FC',homeGoals:null,awayGoals:null,source:'openfootball'};
const forecast=():Forecast=>forecastMatch([],fixture,'2026-11-01');
const receipts=()=>['EPL','LaLiga','SerieA','Bundesliga','Ligue1'].flatMap(
 (league)=>['2023-24','2024-25','2025-26','2026-27'].map(season=>({
  league:league as 'EPL',season,url:'https://source.example/'+league+'/'+season,
  sha256:'a'.repeat(64),matchCount:300
 })));
const capture='2026-11-01T04:20:00.000Z';
const original=()=>makeOriginal(forecast(),capture,'locked-v1','commit-abc',receipts());
test('freeze a real model count only on a strictly earlier UTC day',()=>{
 const o=original();
 assert.equal(o.id,soccerId(o.forecast));
 validateOriginal(o);
 assert.equal(o.forecast.expectedHomeGoals,1.46);
 assert.equal(o.forecast.baselineHomeGoals,1.46);
 assert.throws(()=>makeOriginal(forecast(),'2026-11-03T00:01:00.000Z',
  'locked','sha',receipts()),/NOT_PRIOR_DAY/);
 assert.throws(()=>makeOriginal(forecast(),capture,'locked','sha',receipts().slice(1)),
   /INCOMPLETE_SOURCE/);
});
test('grade actual 90-minute goals using original numeric means and baselines, no targets',()=>{
 const o=original();
 const final={...fixture,homeGoals:2,awayGoals:1};
 const grade=gradeOriginal(o,final,'2026-11-04T07:30:00.000Z');
 assert.equal(grade.final_home_goals,2);
 assert.equal(grade.final_away_goals,1);
 assert.equal(grade.exact_rounded_goals,1);
 assert.equal(grade.within_one_goal_count,2);
 assert.equal(grade.model_goal_mae,
  +(Math.abs(o.forecast.expectedHomeGoals-2)+Math.abs(o.forecast.expectedAwayGoals-1))/2);
 const summary=forwardScore([o],[grade]);
 assert.equal(summary.gradedTeamScores,2);
 assert.equal(summary.graded,1);
 assert.equal(summary.ungraded,0);
 assert.equal(summary.modelGoalMAE,grade.model_goal_mae);
});
test('missing and incompatible result never silently become a loss or gain',()=>{
 const o=original();
 assert.throws(()=>gradeOriginal(o,fixture,'2026-11-04T04:20:00.000Z'),
   /MISSING_VERIFIED_FULL_TIME/);
 assert.throws(()=>gradeOriginal(o,{...fixture,homeGoals:2,awayGoals:2,date:'2026-11-04'},
  '2026-11-05T00:00:00.000Z'),/IDENTITY_MISMATCH/);
 assert.throws(()=>gradeOriginal(o,{...fixture,homeGoals:2,awayGoals:2},
  '2026-11-03T21:00:00.000Z'),/NOT_OLDER_THAN_TODAY/);
 assert.throws(()=>forwardScore([o,o],[]),/DUPLICATE_ORIGINAL/);
 assert.throws(()=>forwardScore([], [gradeOriginal(o,{...fixture,homeGoals:2,awayGoals:1},
  '2026-11-04T00:00:00.000Z')]),/GRADE_INTEGRITY/);
});
