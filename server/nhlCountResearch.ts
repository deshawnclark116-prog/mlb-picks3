/** Real NHL V2 integer SHOT COUNT distributions, independent of P(point>=1).
 * This is a read-only bridge to frozen historical/pregame count forecasts.
 * NEVER infer points count from points classifier. NEVER manufacture prices
 * or claim goalie/dressed status or a new pregame generation after puck drop.
 */
import type {Request,Response} from 'express';
import {validateNhl} from './projectionFeeds.ts';

export const NHL_COUNT_SOURCE =
 'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nhl_v2_shadow.json';
export const NHL_COUNT_SCHEMA='NHL_APP_VERIFIED_SOG_COUNT_RESEARCH_V1';
const HORIZONS=['T24H','T90','T30'] as const;
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const iso=(x:unknown)=>typeof x==='string'?Date.parse(x):NaN;
const validSha=(x:unknown,n:number)=>typeof x==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(x);

export function reduceFrozenNhlShots(raw:unknown,gameDate:string){
 if(!/^20\d{2}-\d{2}-\d{2}$/.test(gameDate)||
   Number.isNaN(Date.parse(gameDate+'T00:00:00Z')))
   throw Error('NHL date must be an ISO game date');
 const d=validateNhl(raw);
 if(d.not_a_betting_board!==true||
    !validSha(d.source_snapshot_commit_sha,40)||
    !validSha(d.source_ledger_sha256,64))
   throw Error('NHL_COUNT_ORIGINAL_LEDGER_OR_UNPRICED_STATUS_UNVERIFIED');
 const f=Object.fromEntries(d.row_fields.map((k:string,i:number)=>[k,i]));
 for(const k of ['opponent','generated_at','cutoff_at','meaningful_candidate']){
   if(!(k in f))throw Error('NHL_COUNT_SOURCE_MISSING_'+k);
 }
 const chosen=new Map<string,Record<string,any>>();
 const identities=new Set<string>();
 for(const h of HORIZONS){
   if(!d.horizons.includes(h))continue;
   for(const r of d.forecasts[h]){
     if(r[f.game_date]!==gameDate||r[f.mean]<0||r[f.median]<0)continue;
     const pid=String(r[f.player_id]),gid=String(r[f.game_id]);
     if(!pid||pid==='undefined'||!gid||gid==='undefined')continue;
     const start=iso(r[f.scheduled_start]);
     const generated=iso(r[f.generated_at]);
     const cutoff=iso(r[f.cutoff_at]);
     if(!Number.isFinite(start)||!Number.isFinite(generated)||
        !Number.isFinite(cutoff)||generated>cutoff||cutoff>=start)
       continue;
     if(r[f.meaningful_candidate]!==true)continue;
     const team=String(r[f.team]||'').toUpperCase();
     const opp=String(r[f.opponent]||'').toUpperCase();
     if(!/^[A-Z]{2,4}$/.test(team)||!/^[A-Z]{2,4}$/.test(opp)||team===opp)continue;
     const key=gid+'|'+pid;
     const identity=key+'|'+h;
     if(identities.has(identity))throw Error('NHL_DUPLICATE_FROZEN_COUNT_PLAYER_HORIZON');
     identities.add(identity);
     if(chosen.has(key))continue;
     if(!finite(r[f.mean])||!finite(r[f.median]))continue;
     chosen.set(key,{
       game_id:gid,player_id:pid,player:String(r[f.player]),
       team,opponent:opp,game_date:gameDate,
       scheduled_start:r[f.scheduled_start],
       mean:r[f.mean],median:r[f.median],
       sd:r[f.sd],p10:r[f.p10],p90:r[f.p90],
       // Existing locked NHL V2 count CDF survives independently of the
       // fixed 2.5-shot classifier and does NOT use bookmaker odds.
       // These numbers were NOT historically published as true pregame
       // probabilities; hence NO forward calibration or betting promotion.
       model_probability_milestones_research_only:{
         '1':r[f.p_ge1],'2':r[f.p_ge2],'3':r[f.p_ge3],
         '4':r[f.p_ge4],'5':r[f.p_ge5],
       },
       model_probability_forward_calibrated:false,
       probability_not_an_official_bet:true,
       forecast_horizon:h,source_generated_at:r[f.generated_at],
       source_cutoff_at:r[f.cutoff_at],
       original_model_source:'FROZEN_NHL_V2_SOG_COUNT',
       availability_not_certified:true,real_player_book_line_verified:false,
       research_only:true,not_an_official_betting_prediction:true,
     });
   }
 }
 const projections=[...chosen.values()].sort((a,b)=>b.mean-a.mean||a.player.localeCompare(b.player));
 return {
   schema:NHL_COUNT_SCHEMA,game_date:gameDate,
   research_only:true,source_snapshot_commit_sha:d.source_snapshot_commit_sha,
   source_ledger_sha256:d.source_ledger_sha256,
   source_has_original_hash_chain:true,not_an_official_betting_board:true,
   count_model_market:'shots_on_goal_NOT_points',
   inherited_points_probabilities:0,
   probability_method:'ORIGINAL_LOCKED_NHL_V2_SOG_SURVIVAL_RESEARCH',
   forward_game_day_probability_calibration_verified:false,
   probability_source_is_not_sportsbook:true,
   projected_count:projections.length,
   projections:projections.slice(0,500),
   truncated:projections.length>500,
   message:projections.length?'Locked V2 shot-count mean/median and original count-CDF milestone probabilities. Probabilities are research only, NOT prospectively calibrated, NOT a point classifier, NOT book odds or verified wagers':
       'No genuinely source-verified frozen NHL shot-count forecasts found for this game date. No fake numeric substitute.'
 };
}

let cached:{at:number;promise:Promise<unknown>}|null=null;
async function source(fetcher:typeof fetch,now:number):Promise<unknown>{
 if(fetcher===fetch&&cached&&now-cached.at<300000)return cached.promise;
 const promise=(async()=>{
  const res=await fetcher(NHL_COUNT_SOURCE+'?t='+now,{
   cache:'no-store',headers:{'Cache-Control':'no-cache, no-store','Accept':'application/json'},
   signal:AbortSignal.timeout(40000)
  });
  if(!res.ok)throw Error('NHL frozen source HTTP '+res.status);
  return res.json();
 })();
 if(fetcher===fetch)cached={at:now,promise};
 try{return await promise}catch(e){if(fetcher===fetch)cached=null;throw e;}
}

export async function loadNhlCountResearch(date:string,fetcher:typeof fetch=fetch,now=Date.now()){
 return reduceFrozenNhlShots(await source(fetcher,now),date);
}

export function nhlCountResearchHandler(fetcher:typeof fetch=fetch,clock=Date.now){
 return async(req:Request,res:Response)=>{
   res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
   const date=req.query.date;
   if(typeof date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(date))
     return res.status(400).json({error:'Valid NHL game date required'});
   try{
     const result=await loadNhlCountResearch(date,fetcher,clock());
     res.setHeader('X-NHL-Forecast-Classification','FROZEN_SOG_RESEARCH_ONLY');
     return res.json(result);
   }catch(e){
     return res.status(503).json({
       error:'Verified historical NHL V2 shot count unavailable',
       details:e instanceof Error?e.message:String(e),
       no_classifier_to_count_substitution:true
     });
   }
 };
}
