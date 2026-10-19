/** Read-only soccer research: public-domain upstream season fixtures/results,
 * time-ordered match-level model, held-out reference baseline, no book lines.
 * NO claims about player xG, lineups, shots, odds or active wagers.
 */
import {createHash} from 'node:crypto';
import type {Request,Response} from 'express';
import {backtest,forecastMatch,parseOpenFootball,SOCCER_SCHEMA,LEAGUES,
        type League,type Match} from '../src/soccer/model';

const ROOT='https://raw.githubusercontent.com/openfootball/football.json/master/';
export type SoccerResearch=Awaited<ReturnType<typeof computeSoccerResearch>>;
const version='soccer-v1-raw-goal-poisson-historical-walkforward-20261018';
let cache:{at:number;data:SoccerResearch}|null=null;
let inFlight:Promise<SoccerResearch>|null=null;
const iso=(d:Date)=>d.toISOString().slice(0,10);

export async function computeSoccerResearch(clock:Date=new Date(),fetcher:typeof fetch=fetch) {
  if(!Number.isFinite(clock.getTime()))throw Error('SOCCER_INVALID_CLOCK');
  const date=iso(clock);
  const year=Number(date.slice(0,4)),month=Number(date.slice(5,7));
  const startYear=month>=7?year:year-1;
  const seasons=Array.from({length:4},(_,i)=>{
    const y=startYear-3+i;
    return String(y)+'-'+String((y+1)%100).padStart(2,'0');
  });
  const sources=Object.entries(LEAGUES).flatMap(([league,info])=>
    seasons.map(season=>({league:league as League,season,
      url:ROOT+season+'/'+info.path})));
  // Require ALL five leagues and all historical seasons. Do not silently
  // publish an unrepresentative 1-league sample if any source errors.
  const ingested=await Promise.all(sources.map(async item=>{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),14000);
    try{
      const res=await fetcher(item.url,{signal:controller.signal,headers:{Accept:'application/json'}});
      if(!res.ok)throw Error('SOCCER_SOURCE_HTTP_'+res.status+':'+item.url);
      const body=await res.text();
      if(body.length<100||body.length>900000)throw Error('SOCCER_SOURCE_SIZE_INVALID');
      const sha=createHash('sha256').update(body).digest('hex');
      const matches=parseOpenFootball(item.league,item.season,JSON.parse(body));
      if(matches.length<150)throw Error('SOCCER_SOURCE_TOO_FEW_MATCHES_'+item.url);
      return {matches,receipt:{league:item.league,season:item.season,url:item.url,
                               sha256:sha,matchCount:matches.length}};
    }finally{clearTimeout(timeout);}
  }));
  const all=ingested.flatMap(a=>a.matches);
  const originalRecords=new Set<string>();
  for(const m of all){
    const key=[m.league,m.season,m.date,m.home,m.away].join('|');
    if(originalRecords.has(key))throw Error('SOCCER_CONFLICTING_MATCHES_ACROSS_SOURCES');
    originalRecords.add(key);
  }
  const finished=all.filter(m=>m.homeGoals!==null&&m.date<date);
  if(finished.length<1000)throw Error('SOCCER_INSUFFICIENT_PRIOR_MATCHES');
  const fixtures=all.filter(m=>m.season===seasons[3]
    &&m.date>=date&&m.date<=iso(new Date(clock.getTime()+14*86400000))
    &&m.homeGoals===null&&m.awayGoals===null)
    .sort((a,b)=>a.date.localeCompare(b.date)||a.league.localeCompare(b.league));
  const predictions=fixtures.map(m=>forecastMatch(finished,m,date));
  const audit=backtest(finished,date,seasons[2]);
  if(audit.summary.n<500)throw Error('SOCCER_HOLDOUT_TOO_SMALL');
  return {
    schema:SOCCER_SCHEMA,version,generated_at_utc:clock.toISOString(),asof_calendar_day_utc:date,
    season:seasons[3],league_count:5,leagues:LEAGUES,
    status:'RESEARCH_ONLY_NOT_CALIBRATED_NOT_BETTABLE',
    forecasts:predictions,forecast_count:predictions.length,
    original_source_receipts:ingested.map(x=>x.receipt),
    historical_matches_with_accepted_ft_scores:finished.length,
    historical_audit:{
      schema:audit.schema,kind:audit.status,cutoff:audit.cutoff,
      overall:audit.summary,byLeague:audit.byLeague,promotionGate:audit.promotionGate,
      sampleActualScores:audit.auditRows.slice(-16).map(r=>({
        date:r.date,league:r.league,home:r.home,away:r.away,actual:r.actual,
        predicted:r.model,modelBrier:Number(r.modelBrier.toFixed(4))
      }))
    },
    guardrails:{
      calibrated:false,official_bets:0,verified_live_book_lines:0,verified_player_xg:0,
      verified_lineups:0,player_prop_predictions:0,
      historical_backtest_was_not_original_frozen_firstseen:true,
      source_upstream_is_not_real_time_score_provider:true,
      explanation:'1X2, O/U 2.5 and BTTS research from public-domain results. No market prices, injury or player features, no promised edge.'
    }
  };
}
export async function loadSoccerResearch(clock=new Date(),fetcher:typeof fetch=fetch) {
  const now=clock.getTime();
  if(cache&&now>=cache.at&&now-cache.at<15*60*1000)return cache.data;
  if(inFlight)return inFlight;
  inFlight=computeSoccerResearch(clock,fetcher).then(data=>{
    cache={at:now,data};return data;
  }).finally(()=>{inFlight=null;});
  return inFlight;
}
export function soccerResearchHandler(fetcher:typeof fetch=fetch,clock:()=>Date=()=>new Date()){
  return async (_req:Request,res:Response)=>{
    try{
      const data=await loadSoccerResearch(clock(),fetcher);
      res.setHeader('Cache-Control','no-store');
      res.json(data);
    }catch(e){
      res.status(503).json({error:'SOCCER_MODEL_RESEARCH_UNAVAILABLE',
        details:e instanceof Error?e.message:'unknown source failure',
        status:'NO_FABRICATED_PREDICTIONS'});
    }
  };
}
