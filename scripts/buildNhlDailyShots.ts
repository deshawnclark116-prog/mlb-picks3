/** Compact delivery of genuinely frozen NHL V2 SOG forecasts.
 *
 * Source-only reduction of full historical hash-verified original archive.
 * No pick invention, no sportsbook line, no post-tip probability promotion.
 * Manifest contains EXACT upcoming Eastern dates. Entire 14MB historical
 * shadow must not be fetched by every mobile app request.
 */
import {writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {validateNhl} from '../server/projectionFeeds.ts';
import {NHL_COUNT_SOURCE,reduceFrozenNhlShots} from '../server/nhlCountResearch.ts';
export const NHL_DAILY_COMPACT_SCHEMA='NHL_APP_DAILY_VERIFIED_SOG_DELIVERY_V1';
export function easternDate(now:Date){
 if(!Number.isFinite(now.getTime()))throw Error('NHL_INVALID_EASTERN_DATE_CLOCK');
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',
   year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const get=(part:string)=>parts.find(x=>x.type===part)?.value;
 return get('year')+'-'+get('month')+'-'+get('day');
}
export function compactNhlShotDays(raw:unknown,now=new Date()){
 const evidence=validateNhl(raw);
 const today=easternDate(now);
 const tomorrow=new Date(Date.parse(today+'T12:00:00Z')+86400000).toISOString().slice(0,10);
 if(!/^[a-f0-9]{40}$/.test(evidence.source_snapshot_commit_sha)||
    !/^[a-f0-9]{64}$/.test(evidence.source_ledger_sha256)||
    evidence.not_a_betting_board!==true||
    evidence.verified_original_hash_chain!==true||
    evidence.actual_player_book_lines_verified!==false||
    evidence.historical_corrected_probabilities_were_not_published_pregame!==true)
   throw Error('NHL_UNVERIFIED_COMPACT_SOURCE_OR_BETTING_PROMOTION');
 const dates=[today,tomorrow].filter(d=>evidence.dates.includes(d));
 const days=Object.fromEntries(dates.map(d=>[d,reduceFrozenNhlShots(evidence,d)]));
 const n=Object.values(days).reduce((sum,d)=>sum+d.projected_count,0);
 if(n===0)throw Error('NHL_NO_AUTHENTIC_NEXT_TWO_DAYS_IN_SOURCE');
 return {schema:NHL_DAILY_COMPACT_SCHEMA,
   source_snapshot_commit_sha:evidence.source_snapshot_commit_sha as string,
   source_ledger_sha256:evidence.source_ledger_sha256 as string,
   source_archive_schema:evidence.schema as string,
   period:[today,tomorrow],days,
   covered_game_dates:dates,source_verified_pregame_shot_player_forecasts:n,
   official_bets:0,probabilities_forward_calibrated:false,
   source_is_not_sportsbook:true,
   note:'Exact frozen original pregame count forecasts. Milestone event probabilities are source-authentic research only, not forward-calibrated or priced bookmaker bets.'};
}
const command=process.argv[1]||'';
if(command.includes('buildNhlDailyShots')){
 const out=process.argv[process.argv.indexOf('--out')+1];
 if(!process.argv.includes('--out')||!out)throw Error('NHL_COMPACT_OUT_REQUIRED');
 const response=await fetch(NHL_COUNT_SOURCE+'?t='+Date.now(),{
  cache:'no-store',signal:AbortSignal.timeout(65000),
  headers:{Accept:'application/json','Cache-Control':'no-cache,no-store'}});
 if(!response.ok)throw Error('NHL_LIVE_FROZEN_SOURCE_HTTP_'+response.status);
 const evidence=compactNhlShotDays(await response.json(),new Date());
 mkdirSync(path.dirname(out),{recursive:true});
 writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
 console.log('NHL_COMPACT_REAL_SHOTS_PUBLISHED',JSON.stringify({
   covered_game_dates:evidence.covered_game_dates,
   original_player_forecasts:evidence.source_verified_pregame_shot_player_forecasts,
   official_bets:0}));
}
