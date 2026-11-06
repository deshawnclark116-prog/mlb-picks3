/** NBA V5 player-projection events, directly from V5's numerical model.
 *
 * No V3 target milestones, external bookmaker lines or retrospective
 * "nearest easy threshold". V5's .6 rounding convention is frozen.
 */
import {wholeStatProjection} from '../lib/wholeStatProjection.ts';

export const V5_MARKETS=['points','rebounds','assists','three_pointers_made','steals','blocks','turnovers'] as const;
export type V5Market=typeof V5_MARKETS[number];
export const V5_LABELS:Record<V5Market,string>={
 points:'Points',rebounds:'Rebounds',assists:'Assists',three_pointers_made:'Threes',
 steals:'Steals',blocks:'Blocks',turnovers:'Turnovers'
};
export type V5PlayerRow={
 player_id:string;team_id:string;player:string;market:V5Market;
 mean:number;median:number;p10:number;p90:number;reported_status:string;p_active:number;
 mean_basis:string;model_version:string;
 cdf_lattice?:{step:number;cdf:number[]};
 reach_probabilities?:{whole_projection:number;probability_if_playing:number;
                            probability_including_dnp:number;forward_calibrated?:boolean};
 minutes_mean?:number;minutes_p10?:number;minutes_p90?:number;
 p_start?:number|null;p_close?:number|null;fga_mean?:number;fta_mean?:number;
 lineup_label?:string;role_change?:{status:string};
 authorized_data_field_coverage?:Record<string,{fields_present:number;sample_games:number}>;
 external_tracking_model_effect?:string;
};
export type V5Game={
 game_id:string;tipoff_utc:string;home:string;away:string;home_id:string;away_id:string;
 forecast_at_utc:string;rows:V5PlayerRow[];model_version:string;
 model_outcome_projection?:{home_win_probability:number;away_win_probability:number;
  home_score_mean:number;away_score_mean:number;total_score_mean:number;source:string};
 simulation_pieces_on?:Record<string,boolean>;
};
export type V5Pick={row:V5PlayerRow;whole:number;
  conditionalProbability:number;unconditionalProbability:number};
const MIN:Record<V5Market,number>={
 points:6,rebounds:3,assists:2,three_pointers_made:1,steals:1,blocks:1,turnovers:2};
export const V5_QUALIFIED_MIN_PROBABILITY=.60;

function saneProbability(x:unknown):x is number {
 return typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1;
}
export function readV5Projection(row:V5PlayerRow):V5Pick|null {
 if(!V5_MARKETS.includes(row.market)||row.mean_basis!=='CONDITIONAL_ON_PLAYING'||
   row.reported_status==='OUT'||!Number.isFinite(row.mean)||row.mean<0||
   !saneProbability(row.p_active))return null;
 const whole=wholeStatProjection(row.mean);
 if(whole<1)return null;
 const dist=row.cdf_lattice;
 if(dist?.step!==1||!Array.isArray(dist.cdf)||!dist.cdf.length||
    dist.cdf.some((v,i)=>!saneProbability(v)||(i>0&&v<dist.cdf[i-1])))return null;
 const conditional=whole-1>=dist.cdf.length?0:1-dist.cdf[whole-1];
 const p=row.reach_probabilities;
 if(p){
   if(p.whole_projection!==whole||
      !saneProbability(p.probability_if_playing)||
      !saneProbability(p.probability_including_dnp)||
      Math.abs(p.probability_if_playing-conditional)>.002||
      Math.abs(p.probability_including_dnp-row.p_active*conditional)>.002)
      return null; // refuse a mismatched published probability
 }
 return {row,whole,conditionalProbability:conditional,
         unconditionalProbability:conditional*row.p_active};
}
export function v5AllPlayerProjections(game:V5Game):V5Pick[]{
 const seen=new Set<string>(),out:V5Pick[]=[];
 for(const row of game.rows){
   const key=row.team_id+'|'+row.player_id+'|'+row.market;
   if(seen.has(key))throw Error('NBA_V5_DUPLICATE_PLAYER_STAT');
   seen.add(key);
   const p=readV5Projection(row);
   if(p)out.push(p);
 }
 return out.sort((a,b)=>b.unconditionalProbability-a.unconditionalProbability||
    a.row.player.localeCompare(b.row.player)||a.row.market.localeCompare(b.row.market));
}
export function v5QualifiedPicks(game:V5Game):V5Pick[]{
 return v5AllPlayerProjections(game).filter(p=>
  p.row.p_active>=.75&&p.whole>=MIN[p.row.market]&&
  p.unconditionalProbability>=V5_QUALIFIED_MIN_PROBABILITY);
}
export function v5FeaturedPicks(picks:V5Pick[],limit=4){
 // First strongest representative of each counting stat, then the next,
 // so steals/blocks alone do not displace meaningful points/assists.
 const sorted=[...picks].sort((a,b)=>b.unconditionalProbability-a.unconditionalProbability);
 const groups=new Map<V5Market,V5Pick[]>();
 for(const pick of sorted)groups.set(pick.row.market,[...(groups.get(pick.row.market)||[]),pick]);
 const result:V5Pick[]=[];
 for(let offset=0;result.length<limit;offset++){
   let added=0;
   for(const [,items] of groups){
     if(items[offset]){result.push(items[offset]);added++;}
     if(result.length===limit)break;
   }
   if(!added)break;
 }
 return result;
}
