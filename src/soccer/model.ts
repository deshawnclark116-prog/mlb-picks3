/** Soccer v1: source-first, time-ordered 90-minute 1X2 and goal distributions.
 * Public-domain OpenFootball scores only. NO xG/player data or bookmaker input.
 * Research challenger is not calibrated or certified for betting.
 */
export type League = 'EPL'|'LaLiga'|'SerieA'|'Bundesliga'|'Ligue1';
export type Outcome = 'H'|'D'|'A';
export type Match = {
  league:League;season:string;date:string;home:string;away:string;
  homeGoals:number|null;awayGoals:number|null;source:string;
};
export type Probability = {home:number;draw:number;away:number;over25:number;btts:number};
export type Forecast = {
  league:League;season:string;date:string;home:string;away:string;
  expectedHomeGoals:number;expectedAwayGoals:number;probabilities:Probability;
  mostLikely:Outcome;homeWeightedMatches:number;awayWeightedMatches:number;
  source:string;status:'RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET';
};
export const SOCCER_SCHEMA='soccer-v1-five-league-raw-results-research-v1';
export const LEAGUES:Record<League,{path:string;name:string}>={
  EPL:{path:'en.1.json',name:'Premier League'},
  LaLiga:{path:'es.1.json',name:'La Liga'},
  SerieA:{path:'it.1.json',name:'Serie A'},
  Bundesliga:{path:'de.1.json',name:'Bundesliga'},
  Ligue1:{path:'fr.1.json',name:'Ligue 1'}
};
const DATE=/^20\d{2}-\d\d-\d\d$/;
const validDay=(d:string)=>DATE.test(d)&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);
const cap=(n:number,low:number,high:number)=>Math.min(high,Math.max(low,n));
const age=(from:string,to:string)=>Math.round((Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000);
const dec=(days:number)=>Math.exp(-Math.LN2*days/150);
const round=(x:number)=>Math.round(x*10000)/10000;

export function parseOpenFootball(league:League,season:string,raw:unknown):Match[] {
  if(!raw||typeof raw!=='object'||!Array.isArray((raw as {matches?:unknown}).matches))
    throw Error('SOCCER_SOURCE_MALFORMED');
  const out:Match[]=[];const ids=new Set<string>();
  for(const row of (raw as {matches:Record<string,unknown>[]}).matches) {
    if(!row||typeof row!=='object')throw Error('SOCCER_SOURCE_BAD_MATCH');
    const date=row.date,home=row.team1,away=row.team2;
    if(typeof date!=='string'||!validDay(date)||typeof home!=='string'||!home.trim()
       ||typeof away!=='string'||!away.trim()||home===away)
      throw Error('SOCCER_MATCH_IDENTITY_OR_DATE_INVALID');
    const key=[season,date,league,home,away].join('|');
    if(ids.has(key))throw Error('SOCCER_DUPLICATE_MATCH');
    ids.add(key);
    // The source sometimes has an ambiguous 2-item score array. NEVER
    // infer a final from it. Require the explicitly named full-time score.
    const ft=(row.score as {ft?:unknown}|null)?.ft;
    const final=Array.isArray(ft)&&ft.length===2
      &&ft.every(v=>Number.isInteger(v)&&v>=0&&v<=35);
    out.push({league,season,date,home,away,
      homeGoals:final?ft[0]:null,awayGoals:final?ft[1]:null,
      source:'openfootball/football.json/'+season+'/'+LEAGUES[league].path});
  }
  return out;
}
function inputs(history:Match[],fixture:Match,day:string) {
  if(!validDay(day)||fixture.date<day)throw Error('SOCCER_ASOF_AFTER_FIXTURE');
  const eligible=history.filter(m=>m.league===fixture.league
    &&m.date<day&&m.date<fixture.date&&m.homeGoals!==null&&m.awayGoals!==null
    &&m.home!==m.away);
  // Only earlier calendar dates. No within-day leakage from other results.
  let wh=0,wa=0,hg=0,ag=0;
  for(const m of eligible){const w=dec(age(m.date,fixture.date));wh+=w;wa+=w;
    hg+=w*(m.homeGoals as number);ag+=w*(m.awayGoals as number);}
  const meanH=(hg+14*1.46)/(wh+14),meanA=(ag+14*1.16)/(wa+14);
  return {eligible,meanH,meanA};
}
function teamRate(matches:Match[],team:string,mode:'home'|'away',kind:'scored'|'conceded',
                  baseline:number,fixtureDate:string){
  let w=0,total=0;
  for(const m of matches){
    if(mode==='home'?m.home!==team:m.away!==team)continue;
    const weight=dec(age(m.date,fixtureDate));
    const goals=mode==='home'?
      (kind==='scored'?m.homeGoals:m.awayGoals):
      (kind==='scored'?m.awayGoals:m.homeGoals);
    if(goals===null)continue;
    w+=weight;total+=weight*goals;
  }
  // Shrink low-coverage teams and newly promoted clubs to league scoring,
  // not zero shots/goals. No stale article-driven player assumptions.
  return {rate:(total+8*baseline)/(w+8),sample:w};
}
export function poissonProb(homeMean:number,awayMean:number):Probability {
  if(!finite(homeMean)||!finite(awayMean)||homeMean<=0||awayMean<=0)
    throw Error('SOCCER_INVALID_EXPECTED_GOALS');
  const mass=(lambda:number)=>{
    const x=[Math.exp(-lambda)];
    for(let i=1;i<=13;i++)x.push(x[i-1]*lambda/i);
    // Independent Poisson truncated at 13 goals with normalized tiny tail.
    const tot=x.reduce((a,b)=>a+b,0);return x.map(v=>v/tot);
  };
  const h=mass(homeMean),a=mass(awayMean);
  let home=0,draw=0,away=0,over25=0,btts=0;
  for(let i=0;i<h.length;i++)for(let j=0;j<a.length;j++){
    const p=h[i]*a[j];
    if(i>j)home+=p;else if(i===j)draw+=p;else away+=p;
    if(i+j>=3)over25+=p;
    if(i>0&&j>0)btts+=p;
  }
  return {home:round(home),draw:round(draw),away:round(away),
          over25:round(over25),btts:round(btts)};
}
export function forecastMatch(history:Match[],fixture:Match,asof:string):Forecast {
  if(fixture.homeGoals!==null&&fixture.date<asof)
    throw Error('SOCCER_CANNOT_FORECAST_FINISHED_PAST_MATCH');
  const {eligible,meanH,meanA}=inputs(history,fixture,asof);
  const hAtt=teamRate(eligible,fixture.home,'home','scored',meanH,fixture.date);
  const hDef=teamRate(eligible,fixture.home,'home','conceded',meanA,fixture.date);
  const aAtt=teamRate(eligible,fixture.away,'away','scored',meanA,fixture.date);
  const aDef=teamRate(eligible,fixture.away,'away','conceded',meanH,fixture.date);
  // Pace through scoring and concession evidence. 50% geometrically
  // combines attack/defense, so one hot scorer does not multiply two outliers.
  const hRate=cap(meanH*Math.sqrt((hAtt.rate/meanH)*(aDef.rate/meanH)),.35,3.3);
  const aRate=cap(meanA*Math.sqrt((aAtt.rate/meanA)*(hDef.rate/meanA)),.25,3.1);
  const p=poissonProb(hRate,aRate);
  const sorted:[Outcome,number][]=[['H',p.home],['D',p.draw],['A',p.away]];
  sorted.sort((x,y)=>y[1]-x[1]);
  return {league:fixture.league,season:fixture.season,date:fixture.date,
          home:fixture.home,away:fixture.away,
          expectedHomeGoals:round(hRate),expectedAwayGoals:round(aRate),
          probabilities:p,mostLikely:sorted[0][0],
          homeWeightedMatches:round(hAtt.sample+hDef.sample),
          awayWeightedMatches:round(aAtt.sample+aDef.sample),
          source:fixture.source,status:'RESEARCH_UNCALIBRATED_NEVER_OFFICIAL_BET'};
}
const scores=(p:Probability,actual:Outcome)=>{
  const probs=[p.home,p.draw,p.away],observed=[actual==='H'?1:0,actual==='D'?1:0,actual==='A'?1:0];
  return {brier:probs.reduce((s,v,i)=>s+(v-observed[i])**2,0),
          logloss:-Math.log(Math.max(1e-9,probs[observed.indexOf(1)])),
          correct:(actual==='H'?p.home>=Math.max(p.draw,p.away):
                   actual==='D'?p.draw>=Math.max(p.home,p.away):
                   p.away>=Math.max(p.home,p.draw))?1:0};
};
export type AuditRow = {league:League;season:string;date:string;home:string;away:string;
  actual:Outcome;model:Probability;baseline:Probability;
  modelBrier:number;baselineBrier:number;modelLogloss:number;baselineLogloss:number;
  correct:boolean;baselineCorrect:boolean;
  expectedHomeGoals:number;expectedAwayGoals:number;
  baselineHomeGoals:number;baselineAwayGoals:number;
  actualHomeGoals:number;actualAwayGoals:number;};
export function backtest(matches:Match[],cutoff:string,holdoutSeason='2025-26') {
  if(!validDay(cutoff))throw Error('SOCCER_INVALID_BACKTEST_CUTOFF');
  const test=matches.filter(m=>m.season>=holdoutSeason&&m.date<cutoff
    &&m.homeGoals!==null&&m.awayGoals!==null)
    .sort((x,y)=>x.date.localeCompare(y.date)||x.league.localeCompare(y.league)
      ||x.home.localeCompare(y.home));
  const rows:AuditRow[]=[];
  for(const m of test) {
    const prior=matches.filter(x=>x.date<m.date);
    const forecast=forecastMatch(prior,{...m,homeGoals:null,awayGoals:null},m.date);
    const p=forecast.probabilities;
    const baselineGoals=inputs(prior,m,m.date);
    const baseline=poissonProb(baselineGoals.meanH,baselineGoals.meanA);
    const actual:Outcome=m.homeGoals!>m.awayGoals!?'H':m.homeGoals===m.awayGoals?'D':'A';
    const model=scores(p,actual),base=scores(baseline,actual);
    rows.push({league:m.league,season:m.season,date:m.date,home:m.home,away:m.away,
      actual,model:p,baseline,modelBrier:model.brier,baselineBrier:base.brier,
      modelLogloss:model.logloss,baselineLogloss:base.logloss,
      correct:!!model.correct,baselineCorrect:!!base.correct,
      expectedHomeGoals:forecast.expectedHomeGoals,expectedAwayGoals:forecast.expectedAwayGoals,
      baselineHomeGoals:baselineGoals.meanH,baselineAwayGoals:baselineGoals.meanA,
      actualHomeGoals:m.homeGoals!,actualAwayGoals:m.awayGoals!});
  }
  const summarize=(r:AuditRow[])=>{
    const n=r.length,avg=(fn:(v:AuditRow)=>number)=>n?round(r.reduce((s,x)=>s+fn(x),0)/n):null;
    // Both teams' original numerical expected goals are graded against the
    // exact full-time counts. No easy 0.5+ or 2+ goal targets are substituted.
    const errorPair=(row:AuditRow,baseline=false)=>{
      const h=baseline?row.baselineHomeGoals:row.expectedHomeGoals;
      const a=baseline?row.baselineAwayGoals:row.expectedAwayGoals;
      return [h-row.actualHomeGoals,a-row.actualAwayGoals];
    };
    const meanGoalMetric=(fn:(err:number)=>number,baseline=false)=>{
      if(!n)return null;
      return round(r.reduce((sum,row)=>
        sum+errorPair(row,baseline).reduce((acc,e)=>acc+fn(e),0),0)/(2*n));
    };
    const roundedExact=(baseline=false)=>meanGoalMetric(
      // The rounded-mean check is separate from continuous-model MAE.
      (_e)=>0,baseline)===null?null:round(r.reduce((sum,row)=>{
        const h=baseline?row.baselineHomeGoals:row.expectedHomeGoals;
        const a=baseline?row.baselineAwayGoals:row.expectedAwayGoals;
        return sum+Number(Math.round(h)===row.actualHomeGoals)
          +Number(Math.round(a)===row.actualAwayGoals);
      },0)/(2*n));
    const rmse=(baseline=false)=>{
      const mse=meanGoalMetric(e=>e*e,baseline);
      return mse===null?null:round(Math.sqrt(mse));
    };
    return {n,brier:avg(x=>x.modelBrier),baselineBrier:avg(x=>x.baselineBrier),
      logloss:avg(x=>x.modelLogloss),baselineLogloss:avg(x=>x.baselineLogloss),
      accuracy:avg(x=>+x.correct),baselineAccuracy:avg(x=>+x.baselineCorrect),
      brierAdvantage:avg(x=>x.baselineBrier-x.modelBrier),
      goalProjections:{
        teamScores:2*n,
        meanAbsoluteError:meanGoalMetric(e=>Math.abs(e)),
        baselineMeanAbsoluteError:meanGoalMetric(e=>Math.abs(e),true),
        signedBias:meanGoalMetric(e=>e),
        baselineSignedBias:meanGoalMetric(e=>e,true),
        rootMeanSquareError:rmse(),
        baselineRootMeanSquareError:rmse(true),
        exactRoundedCountRate:roundedExact(),
        baselineExactRoundedCountRate:roundedExact(true),
        withinOneActualGoalRate:meanGoalMetric(e=>Number(Math.abs(e)<=1)),
        baselineWithinOneActualGoalRate:meanGoalMetric(e=>Number(Math.abs(e)<=1),true)
      }};
  };
  const byLeague=Object.fromEntries(Object.keys(LEAGUES).map(l=>[l,
    summarize(rows.filter(r=>r.league===l))]));
  const summary=summarize(rows);
  const positive=Object.values(byLeague).filter(x=>x.n>=100&&x.brierAdvantage!==null&&x.brierAdvantage>0).length;
  return {schema:'soccer-v1-chronological-walkforward-reconstruction-v1',
    status:'RETROSPECTIVE_WALKFORWARD_NOT_IMMUTABLE_PREGAME_PICKS',
    cutoff,holdoutSeason,summary,byLeague,
    promotionGate:{minMatches:1000,minPositiveLeagues:4,minBrierAdvantage:.003,
      passed:summary.n>=1000&&summary.brierAdvantage!==null&&summary.brierAdvantage>=.003&&positive>=4,
      positiveLeagues:positive,
      warning:'A single reused holdout does not establish live calibration or profitability'},
    projectionAuditContract:'PREGAME_EXPECTED_GOALS_VS_FINAL_TEAM_GOALS_NOT_EASY_THRESHOLDS',
    auditRows:rows};
}
