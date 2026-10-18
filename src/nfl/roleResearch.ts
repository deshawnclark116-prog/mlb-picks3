/** Read-only, evidence-checked Sunday role corrections produced by the NFL research engine.
 *
 * mlb-picks3 is the APP. Original frozen forecasts and the separately timed
 * role-conditioned full-game runs are produced upstream. Never call a
 * conditional QB-start scenario a validated median or sportsbook bet.
 * If the research feed is absent or malformed, show an explicit outage,
 * not invented replacements, unofficial lines, or silently derived means.
 */
import type { ForecastRow, Horizon, Phase1View } from './phase1';

const FULL = 'NFL_V2_SOURCE_VERIFIED_STARTING_QB_FULL_EVENT_CHALLENGER_V1';
const FLAGS = 'NFL_V2_ALL_GAMES_QB_ROLE_CONTRADICTIONS_V1';
const OFFICIAL = 'OFFICIAL_TEAM_STARTER_SOURCE';
const EXPECTED = 'NFL_NETWORK_EXPECTED_START_NOT_ACTIVE_VERIFIED';
const DEPTH = 'PROVISIONAL_DEPTH_CHART_QB1_NOT_CONFIRMED_STARTER';
const validNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const obj = (v: unknown): v is Record<string,any> => !!v && typeof v === 'object' && !Array.isArray(v);
const normalized = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const time = (v: unknown) => typeof v === 'string' ? Date.parse(v) : NaN;
export const teamKey = (game: string, horizon: Horizon, team: string) => [game,horizon,team].join('|');
export const statKey = (game: string, horizon: Horizon, team: string, player: string, outcome: string) =>
  [teamKey(game,horizon,team),normalized(player),outcome].join('|');

export interface RoleStat {
  gameId: string; horizon: Horizon; team: string; player: string; outcome: string;
  originalMedian: number; correctedMedian: number; correctedMean: number;
  sourceTier: typeof OFFICIAL | typeof EXPECTED | typeof DEPTH;
  starter: string; publishedAt: string; draws: number;
}
export interface RoleConflict {
  gameId: string; horizon: Horizon; team: string;
  flags: string[]; starter: string | null; sourceTier: string | null;
}
export interface NflRoleResearch {
  conflicts: RoleConflict[];
  blocked: Set<string>;
  corrected: Map<string,RoleStat>;
  generatedAt: string;
}
export interface RoleFeed { schema: string; full_event: unknown; role_conflicts: unknown }

/** Validate provenance, game/horizon identity, original median, and scenario cutoff.
 * Extra or stale records NEVER extend the original game slate. */
export function parseNflRoleResearch(raw: unknown, view: Phase1View, now = Date.now()): NflRoleResearch {
  if (!obj(raw) || raw.schema !== 'NFL_V2_APP_ROLE_RESEARCH_V1'
    || !obj(raw.full_event) || !obj(raw.role_conflicts)
    || raw.full_event.schema !== FULL || raw.role_conflicts.schema !== FLAGS
    || raw.full_event.not_official_original_forecast !== true
    || raw.full_event.no_money_line_or_player_prop_bets !== true
    || raw.role_conflicts.original_forecasts_not_changed !== true
    || raw.role_conflicts.research_only !== true
    || raw.role_conflicts.official_bets_created !== 0
    || !Array.isArray(raw.role_conflicts.role_conflicts)
    || !Array.isArray(raw.full_event.scenarios)) throw Error('NFL role-research source or immutable-original contract invalid');
  const generated = time(raw.full_event.generated_at_utc);
  const audited = time(raw.role_conflicts.generated_at_utc);
  if (![generated,audited].every(v=>Number.isFinite(v)&&v<=now+120_000&&now-v<=24*3600_000))
    throw Error('NFL role-research evidence is future-dated or stale');
  const games = new Map(view.games.map(g=>[g.game_id,g]));
  const block = new Set<string>(), conflicts:RoleConflict[] = [], corrected = new Map<string,RoleStat>();
  const known = new Set<string>();
  for (const c of raw.role_conflicts.role_conflicts) {
    if (!obj(c) || !['T24','T90'].includes(c.horizon) || !Array.isArray(c.flags)
      || !c.flags.length || c.flags.some((f:unknown)=>typeof f!=='string')
      || c.automatic_starter_selection !== false) throw Error('Invalid NFL QB role warning');
    const g=games.get(c.game_id);
    if (!g || !g.horizons[c.horizon as Horizon] || ![g.home,g.away].includes(c.team)
      || time(g.kickoff_utc)!==time(c.kickoff_utc)) continue;
    if (time(g.kickoff_utc)<=now) continue; // no post-kickoff promotion
    const k=teamKey(c.game_id,c.horizon,c.team);
    if (known.has(k)) throw Error('Duplicate NFL quarterback contradiction');
    known.add(k);block.add(k);
    conflicts.push({gameId:c.game_id,horizon:c.horizon,team:c.team,flags:c.flags,
      starter:null,sourceTier:null});
  }
  const chosen=new Set<string>();
  for (const s of raw.full_event.scenarios) {
    if (!obj(s) || !['T24','T90'].includes(s.horizon) || typeof s.team!=='string') continue;
    const g=games.get(s.game_id);
    if (!g || !g.horizons[s.horizon as Horizon] || ![g.home,g.away].includes(s.team)
      || time(g.kickoff_utc)<=now) continue;
    const k=teamKey(s.game_id,s.horizon,s.team);
    // Research challenger never introduces a new "official" pick or hides
    // forecasts without a matching independently published role warning.
    if (!block.has(k)) continue;
    const tier=s.scenario_evidence_tier;
    if (![OFFICIAL,EXPECTED,DEPTH].includes(tier)
      || s.starter_is_officially_source_verified !== (tier===OFFICIAL)
      || s.verified_original_forecast_unchanged!==true
      || s.never_a_replacement_for_original_frozen_forecast!==true
      || s.do_not_treat_as_unconditional_or_as_certified_bookmaker_pick!==true
      || s.scenario_fitted_with_post_cutoff_stats!==false
      || !validNumber(s.n_draws) || s.n_draws<1000
      || !Array.isArray(s.player_impact) || typeof s.verified_starter!=='string'
      || !s.verified_starter.trim())
      throw Error('Unverified NFL role intervention provenance');
    if (tier===EXPECTED && (!String(s.source_reported_expected_start_url).startsWith('https://www.nfl.com/news/')
      || s.source_was_known_at_original_cutoff !== false)) throw Error('NFL expected-start news not independently labeled');
    if (tier===DEPTH && (!String(s.source_depthchart_url).startsWith('https://site.api.espn.com/')
      || s.source_reported_expected_start_url != null)) throw Error('NFL depth-chart starter not source-supported');
    if (tier===OFFICIAL && (!Array.isArray(s.start_status_sources) || !s.start_status_sources.length))
      throw Error('NFL confirmed starter missing source');
    if (chosen.has(k)) throw Error('Multiple role scenarios competing for same game and team');
    chosen.add(k);
    const report=conflicts.find(c=>teamKey(c.gameId,c.horizon,c.team)===k)!;
    report.starter=s.verified_starter;report.sourceTier=tier;
    const forecast=view.rows[s.horizon as Horizon].filter(r=>r.game_id===s.game_id&&r.team===s.team);
    const seen=new Set<string>();
    for(const effect of s.player_impact) {
      if (!obj(effect) || !obj(effect.original_model_resimulation)
        || !obj(effect.verified_starter_role_scenario)
        || typeof effect.player!=='string' || typeof effect.outcome!=='string') continue;
      const matching=forecast.filter(r=>normalized(r.player)===normalized(effect.player)&&r.outcome===effect.outcome);
      if(matching.length!==1) continue;
      const row=matching[0]; const before=effect.original_model_resimulation.median;
      const after=effect.verified_starter_role_scenario.median,mean=effect.verified_starter_role_scenario.mean;
      // No hindsight overwrite: only show an as-of result that reproduces
      // the frozen original to rounding precision on the SAME player/market.
      // Baseline is a NEW equal-seed Monte Carlo rerun, not byte-identical
      // archived draws. Integer yards fluctuate a little (Chicago: 75 vs 76).
      // Require close agreement, do NOT overwrite the immutable median.
      const mcTolerance=row.outcome.endsWith('_yds')?3:1;
      if (!validNumber(before) || !validNumber(after) || !validNumber(mean)
        || !validNumber(row.median) || Math.abs(before-row.median)>mcTolerance
        || after<0 || mean<0) continue;
      const id=statKey(s.game_id,s.horizon,s.team,row.player,row.outcome);
      if(seen.has(id))throw Error('Duplicate NFL role-player simulation');
      seen.add(id);
      corrected.set(id,{gameId:s.game_id,horizon:s.horizon,team:s.team,
        player:row.player,outcome:row.outcome,originalMedian:row.median,
        correctedMedian:after,correctedMean:mean,sourceTier:tier,
        starter:s.verified_starter,publishedAt:raw.full_event.generated_at_utc,draws:s.n_draws});
    }
    const starterKey=statKey(s.game_id,s.horizon,s.team,s.verified_starter,'pass_yds');
    if (!corrected.has(starterKey)) throw Error('NFL starter role run does not reproduce original player passing forecast');
  }
  return {blocked:block,conflicts,corrected,generatedAt:raw.full_event.generated_at_utc};
}
