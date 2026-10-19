import test from 'node:test';
import assert from 'node:assert/strict';
import {parseOpenFootball,forecastMatch,poissonProb,backtest,type Match} from '../src/soccer/model';

const fixture=(date:string,home='Arsenal',away='Liverpool',h:number|null=null,a:number|null=null):Match=>({
  date,home,away,homeGoals:h,awayGoals:a,league:'EPL',season:'2025-26',source:'test'
});

test('parse only explicit full-time score not ambiguous array, missing or HT result',()=>{
 const matches=parseOpenFootball('EPL','2025-26',{matches:[
  {date:'2025-09-01',team1:'Arsenal',team2:'Liverpool',score:{ht:[1,0],ft:[2,1]}},
  {date:'2025-09-02',team1:'Chelsea',team2:'Leeds',score:[0,0]},
  {date:'2025-09-03',team1:'Brighton',team2:'Fulham'},
 ]});
 assert.equal(matches.length,3);
 assert.deepEqual(matches.map(m=>m.homeGoals),[2,null,null]);
 assert.equal(matches[0].awayGoals,1);
});
test('duplicate game ID and impossibly formatted dates fail closed',()=>{
 assert.throws(()=>parseOpenFootball('EPL','2025-26',{matches:[
  {date:'2025-09-01',team1:'Arsenal',team2:'Liverpool'},
  {date:'2025-09-01',team1:'Arsenal',team2:'Liverpool'}
 ]}),/DUPLICATE/);
 assert.throws(()=>parseOpenFootball('EPL','2025-26',{matches:[
  {date:'2025-02-31',team1:'Arsenal',team2:'Liverpool'}
 ]}));
});
test('poisson 1X2 probability normalized, correctly honors draw and home advantage',()=>{
 const p=poissonProb(1.7,1.0);
 assert(Math.abs(p.home+p.draw+p.away-1)<.0002);
 assert(p.home>p.away&&p.over25>0&&p.over25<1&&p.btts>0&&p.btts<1);
 assert.throws(()=>poissonProb(0,1.5),/INVALID/);
});
test('same-calendar-day match results cannot leak into another match',()=>{
 const now='2025-10-10',g=fixture(now);
 const base=forecastMatch([],g,now);
 const future=forecastMatch([
  fixture(now,'Arsenal','Brentford',17,0),
  fixture(now,'Liverpool','Crystal Palace',0,21)
 ],g,now);
 assert.deepEqual(base.probabilities,future.probabilities);
});
test('future-season results do not leak backwards into a historical forecast',()=>{
 const match=fixture('2025-10-20');
 const a=forecastMatch([fixture('2025-09-20','Arsenal','Liverpool',2,0)],match,match.date);
 const b=forecastMatch([fixture('2025-09-20','Arsenal','Liverpool',2,0),
   fixture('2026-08-20','Arsenal','Liverpool',20,0)],match,match.date);
 assert.deepEqual(a.probabilities,b.probabilities);
});
test('historic wins cannot be given future knowledge under the walk-forward audit',()=>{
 const rows=[
   fixture('2025-08-01','Arsenal','Liverpool',2,0),
   fixture('2025-08-08','Liverpool','Arsenal',0,0),
   fixture('2025-09-01','Arsenal','Liverpool',1,3),
   fixture('2025-10-01','Arsenal','Liverpool',1,0)
 ];
 const a=backtest(rows,'2025-09-15');
 const b=backtest([...rows,fixture('2027-01-05','Liverpool','Arsenal',27,0)],'2025-09-15');
 assert.deepEqual(a.summary,b.summary);
 assert.equal(a.auditRows.length,3);
 assert.equal(a.status,'RETROSPECTIVE_WALKFORWARD_NOT_IMMUTABLE_PREGAME_PICKS');
 assert.equal(a.promotionGate.passed,false);
});
test('prematch strength and home-advantage regression to prior for promoted/unknown teams',()=>{
 const hist:Match[]=[];
 for(let i=1;i<=20;i++) {
   const d='2025-09-'+String(i).padStart(2,'0');
   hist.push(fixture(d,'Arsenal','Brentford',3,0));
   hist.push(fixture(d,'Chelsea','Liverpool',0,3));
 }
 const g=fixture('2025-10-01');
 const m=forecastMatch(hist,g,g.date);
 assert(m.expectedHomeGoals>m.expectedAwayGoals);
 const promoted=forecastMatch(hist,fixture('2025-10-01','Newly Promoted','New Club'), '2025-10-01');
 assert(promoted.expectedHomeGoals>.2 && promoted.expectedAwayGoals>.2);
 assert.equal(m.status,'RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET');
});
test('reject asking future as-of to forecast an already completed past match',()=>{
 assert.throws(()=>forecastMatch([],fixture('2025-09-02','A','B',2,0),'2025-09-04'),/CANNOT_FORECAST/);
});
