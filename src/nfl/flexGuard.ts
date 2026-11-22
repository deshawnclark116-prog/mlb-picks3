/** Read-only 2026 Week 11 NFL flex visibility safety.
 *
 * Do not change the original NFL Phase1 frozen decoder. The pre-flex T24
 * snapshot is genuine historical research but cannot be advertised as having
 * the *new* league-verified kickoff/cutoff. Weekly serving forecasts remain
 * separate and are not changed by this view quarantine.
 */
import type {ForecastGame,Horizon,Phase1View} from './phase1.ts';
export const VERIFIED_NFL_FLEX_KICKOFF_UTC:Readonly<Record<string,string>>={
  '2026_11_PIT_PHI':'2026-11-22T18:00:00Z',
  '2026_11_JAX_NYG':'2026-11-22T21:25:00Z'
};

export function verifiedPhase1Kickoff(game:ForecastGame):boolean{
 const iso=VERIFIED_NFL_FLEX_KICKOFF_UTC[game.game_id];
 return !iso || Date.parse(game.kickoff_utc)===Date.parse(iso);
}
export function verifiedPhase1Cutoff(game:ForecastGame,horizon:Horizon):boolean{
 if(!verifiedPhase1Kickoff(game))return false;
 const iso=VERIFIED_NFL_FLEX_KICKOFF_UTC[game.game_id];
 if(!iso)return true;
 const metadata=game.horizons[horizon];
 if(!metadata)return false;
 const minutes=horizon==='T24'?1440:90;
 return Date.parse(metadata.cutoff)===Date.parse(iso)-minutes*60_000;
}
export interface NflFlexQuarantine{
 view:Phase1View;
 excludedOfficialFlexGames:number;
 excludedWrongCutoffRows:number;
}
/** Leaves source object / original raw event identity untouched. Uses only
 * source-derived game and horizon metadata to mask visibly invalid rows.
 * Caller must use sanitized view for BOTH role overlay and research board.
 */
export function quarantineNflOfficialFlex(original:Phase1View):NflFlexQuarantine{
 const usable=original.games.filter(verifiedPhase1Kickoff);
 const validIds=new Set(usable.map(g=>g.game_id));
 const byId=new Map(usable.map(g=>[g.game_id,g]));
 let excludedWrongCutoffRows=0;
 const next={
   T24:original.rows.T24.filter(row=>{
     if(!validIds.has(row.game_id))return false;
     if(!verifiedPhase1Cutoff(byId.get(row.game_id)!,'T24')){
       excludedWrongCutoffRows++;return false;
     }
     return true;
   }),
   T90:original.rows.T90.filter(row=>{
     if(!validIds.has(row.game_id))return false;
     if(!verifiedPhase1Cutoff(byId.get(row.game_id)!,'T90')){
       excludedWrongCutoffRows++;return false;
     }
     return true;
   })
 };
 const preferred=original.defaultHorizon;
 const defaultHorizon=next[preferred].length?preferred:next.T90.length?'T90':'T24';
 return {
   view:{...original,games:usable,rows:next,defaultHorizon,
     excludedGames:original.excludedGames+original.games.length-usable.length},
   excludedOfficialFlexGames:original.games.length-usable.length,
   excludedWrongCutoffRows
 };
}
