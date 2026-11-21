/** Primary NBA model selector. Each stat is sourced from exactly ONE
 * genuine as-of model forecast. No ensemble averages, synthetic substitutions,
 * sportsbook lines, post-tip rebuilding, or retroactive replacement of originals.
 * Market assignments are the user's official production selection. Whether
 * they beat the prior system remains an open empirical question.
 */
import type {Request,Response} from 'express';
import {loadNbaV3Shadow} from './nbaV3Shadow.ts';
import {LATEST_FILE,V4_LATEST_FILE,V5_LATEST_FILE,overlayLatestRun,v5OnScreen} from './nbaV3Latest.ts';
import {overlayPublishedV5} from './nbaV5PublishedSync.ts';

export const NBA_SPECIALIST_SCHEMA='NBA_SPECIALIST_MARKET_ROUTER_V1';
export const SPECIALIST_MARKETS={
  points:'V5',
  rebounds:'V3',
  assists:'V4',
  three_pointers_made:'V3'
} as const;
export type SpecialistMarket=keyof typeof SPECIALIST_MARKETS;
export type SpecialistModel=typeof SPECIALIST_MARKETS[SpecialistMarket];
export type SpecialistGame={
  game_id:string;tipoff_utc:string;forecast_at_utc:string;away:string;home:string;
  away_id?:string;home_id?:string;forecast_kind?:string;rows:Record<string,any>[];
};
const MARKETS=Object.keys(SPECIALIST_MARKETS) as SpecialistMarket[];
const PREFIX:Record<SpecialistModel,string>={
  V3:'nba-v3-',V4:'nba-v4-',V5:'nba-v5-'
};
const SOURCE_KIND:Partial<Record<SpecialistModel,string>>={
  V4:'V4_LATEST',V5:'V5_LATEST'
};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const goodTime=(value:unknown)=>typeof value==='string'&&Number.isFinite(Date.parse(value));
type ForecastSet={games:SpecialistGame[]};

function indexed(source:ForecastSet):Map<string,SpecialistGame>{
  const byId=new Map<string,SpecialistGame>();
  for(const g of source.games??[]){
    const id=String(g.game_id);
    if(byId.has(id))throw Error('NBA_SPECIALIST_DUPLICATE_SOURCE_GAME');
    byId.set(id,g);
  }
  return byId;
}
function compatible(canonical:SpecialistGame,actual:SpecialistGame,owner:SpecialistModel,now:number){
  if(String(actual.game_id)!==String(canonical.game_id)||
     actual.tipoff_utc!==canonical.tipoff_utc||
     actual.home!==canonical.home||actual.away!==canonical.away||
     (actual.home_id&&canonical.home_id&&actual.home_id!==canonical.home_id)||
     (actual.away_id&&canonical.away_id&&actual.away_id!==canonical.away_id)||
     (SOURCE_KIND[owner]&&actual.forecast_kind!==SOURCE_KIND[owner]))return false;
  const at=Date.parse(actual.forecast_at_utc),tip=Date.parse(actual.tipoff_utc);
  return goodTime(actual.forecast_at_utc)&&goodTime(actual.tipoff_utc)&&
    at<=now+60_000&&at<=tip-15*60_000;
}
/** Pure, testable assembly. Missing V4/V5 does NOT silently become V3.
 * The model CDF, projected mean and DNP probabilities remain untouched.
 */
export function composeNbaSpecialists(
  originals:ForecastSet,v3:ForecastSet,v4:ForecastSet,v5:ForecastSet,now=Date.now()
){
  if(!finite(now))throw Error('NBA_SPECIALIST_INVALID_ASOF');
  const base=indexed(originals),by3=indexed(v3),by4=indexed(v4),by5=indexed(v5);
  const ids=new Set([...base.keys(),...by3.keys(),...by4.keys(),...by5.keys()]);
  const games:any[]=[];
  for(const id of ids){
    const canonical=base.get(id)??by5.get(id)??by3.get(id)??by4.get(id);
    if(!canonical)continue;
    const rows:any[]=[],missing_markets:SpecialistMarket[]=[];
    const used=new Set<string>();
    for(const market of MARKETS){
      const owner=SPECIALIST_MARKETS[market];
      const source=({V3:by3,V4:by4,V5:by5} as const)[owner].get(id);
      if(!source||!compatible(canonical,source,owner,now)){
        missing_markets.push(market);continue;
      }
      const selected=source.rows.filter(r=>r.market===market);
      if(!selected.length){missing_markets.push(market);continue;}
      for(const r of selected){
        if(String(r.game_id)!==id||
           (source.home_id&&source.away_id&&
            ![String(source.home_id),String(source.away_id)].includes(String(r.team_id)))||
           typeof r.model_version!=='string'||!r.model_version.startsWith(PREFIX[owner])||
           !finite(r.mean)||r.mean<0||!finite(r.p_active)||r.p_active<0||r.p_active>1||
           r.research_only!==true||r.not_an_official_bet!==true||
           r.cdf_lattice?.step!==1||!Array.isArray(r.cdf_lattice.cdf)||
           r.cdf_lattice.cdf.length===0||
           r.cdf_lattice.cdf.some((n:unknown,i:number)=>
             !finite(n)||n<0||n>1||(i>0&&n<r.cdf_lattice.cdf[i-1]))){
          throw Error('NBA_SPECIALIST_INVALID_OR_UNVERIFIED_SOURCE_ROW');
        }
        // A reported OUT player is not a qualified specialist projection.
        if(r.reported_status==='OUT')continue;
        const key=[r.team_id,r.player_id,market].join('|');
        if(used.has(key))throw Error('NBA_SPECIALIST_DUPLICATE_PLAYER_MARKET');
        used.add(key);
        rows.push({...r,specialist_model:owner,specialist_market:market,
          specialist_forecast_at_utc:source.forecast_at_utc});
      }
    }
    // Keep verified fixtures visible even if every model source is missing.
    games.push({
      game_id:id,away:canonical.away,home:canonical.home,
      tipoff_utc:canonical.tipoff_utc,
      rows,rows_count:rows.length,missing_markets,
      specialist_source_asof: Object.fromEntries(MARKETS.filter(m=>
        !missing_markets.includes(m)).map(m=>[m,({V3:by3,V4:by4,V5:by5} as const)[SPECIALIST_MARKETS[m]].get(id)?.forecast_at_utc])),
      official_bets:0,research_only:true
    });
  }
  games.sort((a,b)=>a.tipoff_utc.localeCompare(b.tipoff_utc)||a.game_id.localeCompare(b.game_id));
  return {
    schema:NBA_SPECIALIST_SCHEMA,status:games.some(g=>g.rows.length)?'AVAILABLE_PRIMARY_PROJECTIONS':'NO_VERIFIED_SPECIALIST_SOURCES',
    publication_role:'PRIMARY_NBA_SYSTEM_PICKS',
    market_assignments:SPECIALIST_MARKETS,
    assignment_status:'OFFICIAL_MARKET_ROUTING_PENDING_FORWARD_ACCURACY_EVALUATION',
    no_ensemble_blending:true,
    no_automatic_model_fallback:true,
    no_sportsbook_lines:true,
    originals_immutable:true,
    research_only:true,official_bets:0,
    games,
    disclaimer:'Primary NBA system picks: each stat is produced by its selected source model, not an average. Accuracy has not been established on a new forward holdout; model chances are not calibrated wagering probabilities.'
  };
}
export function nbaSpecialistHandler(){
  return async (_req:Request,res:Response)=>{
    res.setHeader('Cache-Control','no-store, max-age=0');
    try{
      const now=Date.now();
      const originals=loadNbaV3Shadow(new Date(now));
      const v3=overlayLatestRun(originals,LATEST_FILE,now,'LATEST_RUN');
      const v4=overlayLatestRun(originals,V4_LATEST_FILE,now,'V4_LATEST');
      const localV5=v5OnScreen()?overlayLatestRun(originals,V5_LATEST_FILE,now,'V5_LATEST'):originals;
      const v5=v5OnScreen()?await overlayPublishedV5(localV5,now):originals;
      return res.json(composeNbaSpecialists(originals,v3,v4,v5,now));
    }catch(e){
      return res.status(503).json({error:'NBA_SPECIALIST_VERIFIED_SOURCE_UNAVAILABLE',
        detail:e instanceof Error?e.message:String(e),research_only:true,official_bets:0});
    }
  };
}
