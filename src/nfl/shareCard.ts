/** Canonical game summaries: no screen filter arguments, no new eligibility. */
import { compareSystem, executableGames, lineFreshness, matchesFilter, systemCandidates, type Execution, type SystemPick } from './bettable';
import type { Horizon, Phase1View } from './phase1';
export type ShareMode='system'|'bettable';
export interface SharePick extends SystemPick { execution?:Execution }
export function gameShareData(view:Phase1View,gameId:string,horizon:Horizon,mode:ShareMode='system',now=Date.now()) {
 const game=view.games.find(g=>g.game_id===gameId);
 if(!game || !game.horizons[horizon] || !view.rows[horizon].some(r=>r.game_id===gameId)) throw new Error('No published forecast exists for this game and horizon.');
 const candidates=systemCandidates(view,horizon).filter(p=>p.row.game_id===gameId).sort(compareSystem);
 const leaders=(['PASS','RUSH','REC','TD'] as const).flatMap(family=>{
   const pick=candidates.find(p=>matchesFilter(p.row,'',family));return pick?[{family,pick}]:[];
 });
 const core:SharePick[]=mode==='system'?candidates.slice(0,6):(executableGames(view,horizon).find(g=>g.game_id===gameId)?.picks || []).slice(0,6);
 const meta=game.horizons[horizon]!;
 const draws=typeof meta.n_draws==='number' && Number.isFinite(meta.n_draws) && meta.n_draws>0?meta.n_draws:null;
 return {game,horizon,mode,season:view.artifact.status.season,week:view.artifact.status.week,qualifyingCount:candidates.length,topProbability:candidates[0]?.target.probability??null,draws,core,leaders,cutoff:meta.cutoff,modelVersion:meta.model_version,
   // SYSTEM data must be identical even if every sportsbook field is deleted.
   lines:mode==='bettable'?lineFreshness(view,now):null};
}
export type GameShareData=ReturnType<typeof gameShareData>;
export function shareFilename(data:Pick<GameShareData,'game'|'horizon'|'mode'|'week'>) {
 const clean=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'unknown';
 const week=Number.isInteger(data.week) && data.week!>=0?String(data.week).padStart(2,'0'):'unknown';
 return `prop-edge-${clean(data.game.away)}-${clean(data.game.home)}-${clean(data.horizon)}-${data.mode}-w${week}.png`;
}
export function shortModelVersion(version:string) {
 // Keep the readable model prefix, never print a long artifact hash.
 return version.replace(/[-_][a-f0-9]{12,}$/i,'').slice(0,28) || 'Unavailable';
}
