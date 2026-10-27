/** Game-by-game BEFORE-TIP NBA model forecasts compared with independent finals.
 * Never regenerate a target or call numeric MAE a wager HIT.
 */
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import type {Request,Response} from 'express';
export const SCHEMA='NBA_ORIGINAL_GAME_BY_GAME_PREDICTION_VS_FINAL_AUDIT_V1';
const MARKETS=['points','rebounds','assists','three_pointers_made'] as const;
type Market=typeof MARKETS[number];
const root=path.resolve(process.cwd(),'docs');
const get=(file:string)=>JSON.parse(readFileSync(file,'utf8'));
const rows=(dir:string)=>existsSync(dir)?readdirSync(dir).filter(
 f=>/^20\d\d-\d\d-\d\dT\d{6}Z\.json$/.test(f)).sort().map(f=>get(path.join(dir,f))):[];
const identity=(a:any,b:any,c:any)=>String(a)+'|'+String(b)+'|'+String(c);
const finite=(x:any)=>typeof x==='number'&&Number.isFinite(x);
const round=(n:number)=>Math.round(n*10)/10;
export type BacktestPrediction={
 game_id:string;team_id:string;player_id:string;player:string;market:Market;
 predicted:number;actual:number|null;difference:number|null;
 numeric_verdict:'EXACT'|'OVERPROJECTED'|'UNDERPROJECTED'|'DNP_CONDITIONAL'|'UNVERIFIED';
 originally_saved_target:number|null;original_probability:number|null;
 outcome:'HIT'|'MISS'|'UNVERIFIED'|'NO_SAVED_TARGET';
 status:string;forecast_id:string|null;
};
export type BacktestGame={
 game_id:string;home:string;away:string;tipoff_utc:string;model:'V2'|'V3';
 home_final:number|null;away_final:number|null;original_forecast_at:string|null;
 original_players:number;original_stat_forecasts:number;
 original_targets:number;hits:number;misses:number;unverified:number;
 predictions:BacktestPrediction[];
};
function numericVerdict(pred:number,actual:number|null,played:boolean){
 if(actual===null)return 'UNVERIFIED' as const;
 if(!played)return 'DNP_CONDITIONAL' as const;
 return Math.abs(pred-actual)<.000001?'EXACT' as const:
       pred>actual?'OVERPROJECTED' as const:'UNDERPROJECTED' as const;
}
function gameResult(g:Omit<BacktestGame,'original_players'|'original_stat_forecasts'|
  'original_targets'|'hits'|'misses'|'unverified'>):BacktestGame{
 const t=g.predictions.filter(r=>r.originally_saved_target!==null);
 return {...g,
   original_players:new Set(g.predictions.map(r=>r.team_id+'|'+r.player_id)).size,
   original_stat_forecasts:g.predictions.length,
   original_targets:t.length,
   hits:t.filter(r=>r.outcome==='HIT').length,
   misses:t.filter(r=>r.outcome==='MISS').length,
   unverified:t.filter(r=>r.outcome==='UNVERIFIED').length};
}
/** V2 already contains original numeric model mean, immutable forecast ID,
 * independently verified actual per market, and explicit DNP/unknown status.
 */
export function gradeV2ByGame(grade:any,snapshots:any[]=[]):BacktestGame[]{
 if(grade.schema!=='NBA_V2_ALL_IMMUTABLE_ROLLING_PLAYER_STATS_ACTUAL_GRADES_V1'||
    grade.originals_immutable!==true||grade.official_bets!==0||
    !Array.isArray(grade.games)||!Array.isArray(grade.player_rows))
   throw Error('NBA_V2_GRADE_SOURCE_INVALID');
 const targets=new Map<string,any>();
 for(const d of snapshots){
   if(d.schema!=='NBA_V2_FIRST_OBSERVED_OUTCOME_DISTRIBUTION_PICKS_V1'||
     d.first_observed_before_tip!==true||d.official_bets!==0)
    throw Error('NBA_V2_FROZEN_TARGET_SOURCE_UNTRUSTED');
   for(const g of d.games)for(const p of g.player_predictions){
     const k=identity(p.game_id,p.team_id,p.player_id)+'|'+p.market;
     if(targets.has(k)||p.game_id!==g.game_id||
       !MARKETS.includes(p.market)||!Number.isInteger(p.milestone)||
       p.milestone<=0||!finite(p.model_hit_probability)||
       Date.parse(p.frozen_probability_at_utc)>=Date.parse(g.tipoff_utc))
       throw Error('NBA_V2_DUPLICATE_OR_AFTERTIP_SYSTEM_TARGET');
     targets.set(k,p);
   }
 }
 const byGame=new Map<string,any[]>();
 const seen=new Set<string>();
 for(const p of grade.player_rows){
   const k=identity(p.game_id,p.team_id,p.player_id);
   if(seen.has(k)||!p.forecast_id||!p.stats)
     throw Error('NBA_V2_ORIGINAL_PLAYER_ROW_ID_COLLISION');
   seen.add(k);
   if(!byGame.has(p.game_id))byGame.set(p.game_id,[]);
   byGame.get(p.game_id)!.push(p);
 }
 const out:BacktestGame[]=[];
 for(const g of grade.games){
   const original=byGame.get(g.game_id)||[];
   const predictions:BacktestPrediction[]=[];
   for(const p of original)for(const market of MARKETS){
     const stat=p.stats[market];
     if(!stat||!finite(stat.original_prediction_if_played))
       throw Error('NBA_V2_ORIGINAL_NUMERICAL_STAT_MISSING');
     const played=p.status==='VERIFIED_PLAYED';
     const dnp=p.status==='VERIFIED_DID_NOT_PLAY';
     const actual=played?stat.verified_actual_if_played:dnp?0:null;
     if(played&&(!finite(actual)||actual<0))
       throw Error('NBA_V2_OFFICIAL_FINAL_PLAYER_STAT_INCOMPLETE');
     if(actual!==null&&g.box_verified!==true)
       throw Error('NBA_V2_PRETENDING_ACTUAL_WITHOUT_VERIFIED_FINAL');
     const target=targets.get(identity(p.game_id,p.team_id,p.player_id)+'|'+market);
     if(target&&target.forecast_id!==p.forecast_id)
       throw Error('NBA_V2_TARGET_NOT_SAME_ORIGINAL_NUMERIC_FORECAST');
     const mean=stat.original_prediction_if_played as number;
     predictions.push({
       game_id:String(p.game_id),team_id:String(p.team_id),
       player_id:String(p.player_id),player:p.player,market,
       predicted:round(mean),actual,
       difference:played?round((actual as number)-mean):null,
       numeric_verdict:numericVerdict(mean,actual,played),
       originally_saved_target:target?.milestone??null,
       original_probability:target?.model_hit_probability??null,
       outcome:!target?'NO_SAVED_TARGET':actual===null?'UNVERIFIED':
         actual>=target.milestone?'HIT':'MISS',
       status:played?'PLAYED':dnp?'DNP':'UNVERIFIED',
       forecast_id:p.forecast_id
     });
   }
   out.push(gameResult({
     game_id:String(g.game_id),home:g.home,away:g.away,
     tipoff_utc:g.tipoff_original_utc,model:'V2',
     home_final:g.box_verified?g.final_home_points:null,
     away_final:g.box_verified?g.final_away_points:null,
     original_forecast_at:original[0]?.saved_original_utc??null,
     predictions
   }));
 }
 if(out.reduce((n,g)=>n+g.original_players,0)!==grade.original_player_forecasts)
   throw Error('NBA_V2_ORIGINAL_GAME_AND_PLAYER_COUNTS_DIVERGE');
 return out.sort((a,b)=>b.tipoff_utc.localeCompare(a.tipoff_utc));
}
/** V3 research: original 65%+ displayed targets only; independent forward
 * grade rows are the sole later truth. No replay or aftergame target invention.
 */
export function gradeV3ByGame(shadows:any[],verified:any):BacktestGame[]{
 if(verified.schema!=='NBA_V3_GENUINE_2026_27_ORIGINAL_PLAYER_PROBABILITY_FORWARD_GRADE_V1'||
    verified.official_bets!==0||!Array.isArray(verified.rows))
   throw Error('NBA_V3_OFFICIAL_FORWARD_GRADE_NOT_VERIFIED');
 const truth=new Map<string,any>();
 for(const r of verified.rows){
   const key=identity(r.game_id,r.team_id,r.player_id)+'|'+r.market+'|'+r.threshold;
   if(truth.has(key))throw Error('NBA_V3_DUPLICATED_RESULT_THRESHOLD');
   truth.set(key,r);
 }
 const seen=new Set<string>(),out:BacktestGame[]=[];
 for(const file of shadows){
   if(file.schema!=='NBA_V3_2026_27_FIRSTSEEN_FULL_DISTRIBUTION_SHADOW_V1'||
     file.official_bets!==0||file.model_promoted!==false)
    throw Error('NBA_V3_SHADOW_ARCHIVE_INVALID');
   for(const g of file.games){
     if(seen.has(g.game_id)||Date.parse(g.forecast_at_utc)>=Date.parse(g.tipoff_utc)-900000)
       throw Error('NBA_V3_DUPLICATED_OR_AFTERTIP_GAME');
     seen.add(g.game_id);
     const predictions:BacktestPrediction[]=[];
     for(const r of g.rows){
       if(!MARKETS.includes(r.market)||!finite(r.mean))
         throw Error('NBA_V3_INVALID_SAVED_NUMERIC_MODEL');
       const t=r.model_target;
       const isPick=!!t&&t.probability>=.65&&r.p_active>=.75&&r.reported_status!=='OUT';
       const actualGrade=isPick?truth.get(identity(g.game_id,r.team_id,r.player_id)+'|'+r.market+'|'+t.milestone):null;
       if(actualGrade&&Math.abs(actualGrade.forecast_probability-t.probability)>.00001)
         throw Error('NBA_V3_RESULT_NOT_SAVED_ORIGINAL_TARGET');
       const actual=actualGrade?.actual_stat??null;
       if(actual!==null&&(!finite(actual)||actual<0))
         throw Error('NBA_V3_REAL_ACTUAL_MISSING');
       predictions.push({
         game_id:String(g.game_id),team_id:String(r.team_id),
         player_id:String(r.player_id),player:r.player,market:r.market,
         predicted:round(r.mean),actual,
         difference:actual===null?null:round(actual-r.mean),
         numeric_verdict:numericVerdict(r.mean,actual,actual!==null),
         originally_saved_target:isPick?t.milestone:null,
         original_probability:isPick?t.probability:null,
         outcome:!isPick?'NO_SAVED_TARGET':actual===null?'UNVERIFIED':
           actual>=t.milestone?'HIT':'MISS',
         status:actual===null?'UNVERIFIED':'FINAL_SOURCE_VERIFIED',
         forecast_id:null
       });
     }
     out.push(gameResult({
       game_id:String(g.game_id),home:g.home,away:g.away,
       tipoff_utc:g.tipoff_utc,model:'V3',
       home_final:null,away_final:null,
       original_forecast_at:g.forecast_at_utc,predictions
     }));
   }
 }
 return out.sort((a,b)=>b.tipoff_utc.localeCompare(a.tipoff_utc));
}
export function nbaGameBacktestHandler(){
 return (req:Request,res:Response)=>{
   res.setHeader('Cache-Control','no-store, max-age=0');
   try{
     const model=req.query.model==='V3'?'V3':'V2';
     let games:BacktestGame[];
     if(model==='V2'){
       const filepath=path.join(root,'nba_v2_rolling_player_grades.json');
       if(!existsSync(filepath))throw Error('NBA_V2_NO_VERIFIED_PLAYER_FINALS_FILE');
       games=gradeV2ByGame(get(filepath),rows(path.join(root,'nba_v2_probability_snapshots')));
     }else{
       const filepath=path.join(root,'nba_v3_phase1_forward_grade.json');
       if(!existsSync(filepath))throw Error('NBA_V3_NOT_YET_GRADED');
       games=gradeV3ByGame(rows(path.join(root,'nba_v3_phase1_corrected_shadow')),get(filepath));
     }
     if(typeof req.query.game_id==='string')
       games=games.filter(x=>x.game_id===req.query.game_id);
     games=games.slice(0,100);
     return res.json({schema:SCHEMA,model,official_bets:0,originals_only:true,
       games,game_count:games.length,
       hit_count:games.reduce((s,g)=>s+g.hits,0),
       miss_count:games.reduce((s,g)=>s+g.misses,0),
       unverified_count:games.reduce((s,g)=>s+g.unverified,0),
       note:'Only targets saved before tipoff earn HIT/MISS. Each numeric projection is compared to the actual. DNP conditional means and unavailable finals are never fabricated as numerical misses.'});
   }catch(err){
     console.error('[NBA original-vs-actual game scorecard] fail closed:',err);
     return res.status(503).json({error:'NBA_ORIGINAL_VS_ACTUAL_NOT_VERIFIED',
       details:String(err),official_bets:0});
   }
 };
}
