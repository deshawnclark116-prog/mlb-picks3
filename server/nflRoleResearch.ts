/** The picks3 APP reads role-correction research, never modifies upstream forecasts.
 * Only two dedicated published picks2 documents; this is not a new model,
 * a sportsbook feed, or an invitation to serve stale conditional scenarios.
 */
import type { Request, Response } from 'express';

export const NFL_ROLE_FULL_URL =
  'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nfl_v2_full_event_qb_challenger_2026_w06.json';
export const NFL_ROLE_CONFLICTS_URL =
  'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nfl_v2_qb_role_conflicts.json';
const NO_STORE='no-cache, no-store, must-revalidate';
type Fetcher=typeof fetch;

export async function loadNflRoleResearch(fetcher:Fetcher=fetch,now=Date.now()) {
  const read=async(url:string)=>{
    const r=await fetcher(url+'?t='+now,{cache:'no-store',
      headers:{'Cache-Control':NO_STORE,Pragma:'no-cache',Accept:'application/json'},
      signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw Error('NFL role research upstream HTTP '+r.status);
    return r.json();
  };
  const [full_event,role_conflicts]=await Promise.all([
    read(NFL_ROLE_FULL_URL),read(NFL_ROLE_CONFLICTS_URL)
  ]);
  if(full_event?.schema!=='NFL_V2_SOURCE_VERIFIED_STARTING_QB_FULL_EVENT_CHALLENGER_V1'
    || role_conflicts?.schema!=='NFL_V2_ALL_GAMES_QB_ROLE_CONTRADICTIONS_V1'
    || full_event.not_official_original_forecast!==true
    || full_event.no_money_line_or_player_prop_bets!==true
    || role_conflicts.original_forecasts_not_changed!==true)
    throw Error('NFL role research source-integrity mismatch');
  return {schema:'NFL_V2_APP_ROLE_RESEARCH_V1',full_event,role_conflicts};
}

export function nflRoleResearchHandler(fetcher:Fetcher=fetch,clock=Date.now) {
  return async (_req:Request,res:Response)=>{
    res.setHeader('Cache-Control',NO_STORE);
    try {
      const doc=await loadNflRoleResearch(fetcher,clock());
      res.json(doc);
    }catch(e){
      res.status(502).json({error:'NFL verified role-scenario feed unavailable',
        details:e instanceof Error?e.message:String(e)});
    }
  };
}
