import {canonicalNhlTeam} from "./nhl/gameGrouping";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats betting odds to the standard American format (e.g., +150, -110).
 */
export function formatOdds(odds: number | null | undefined): string {
  if (odds === null || odds === undefined || isNaN(odds)) return "N/A";
  const rounded = Math.round(odds);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

/**
 * Formats a probability or decimal as a percentage string (e.g., 0.542 -> 54.2%).
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  // If value is a ratio between 0 and 1, multiply by 100
  // Note: some JSON feeds send rates already multiplied, let's handle both gracefully.
  const absVal = Math.abs(value);
  if (absVal <= 1) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return `${value.toFixed(1)}%`;
}

/**
 * Formats Kelly Fraction as a custom Suggested Stake % (e.g., 0.05 -> 5.0% or 5 -> 5.0%).
 */
export function formatKellyStake(fraction: number | null | undefined): string {
  if (fraction === null || fraction === undefined || isNaN(fraction)) return "0.0%";
  const stake = fraction <= 1 ? fraction * 100 : fraction;
  return `${stake.toFixed(1)}%`;
}

/**
 * Returns a human-readable relative time string (e.g. "3 minutes ago", "just now").
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const past = new Date(dateString);
    if (isNaN(past.getTime())) {
      return dateString;
    }
    const now = new Date();
    const diffMs = now.getTime() - past.getTime();
    
    // Fallback if future
    if (diffMs < 0) {
      return "just now";
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Format ISO time into Eastern Time hours and minutes (e.g., "7:10 PM ET").
 */
export function formatLocalTime(gameTimeStr: string): string {
  try {
    const date = new Date(gameTimeStr);
    if (isNaN(date.getTime())) {
      return gameTimeStr;
    }
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      timeZone: "America/New_York"
    }) + " ET";
  } catch (e) {
    return gameTimeStr;
  }
}

/**
 * Format any date or parseable date string into a beautiful Eastern Time string (e.g. "Jun 24, 11:59 PM ET").
 */
export function formatToEasternTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "N/A";
  try {
    if (typeof dateInput === "string") {
      const trimmed = dateInput.trim();
      // If it is a pure date format like YYYY-MM-DD, parse as local date to prevent timezone shift
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const parts = trimmed.split("-");
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);
        const localDate = new Date(year, month, day);
        return localDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    }
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      return String(dateInput);
    }
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York"
    };
    return date.toLocaleString("en-US", options) + " ET";
  } catch (e) {
    return String(dateInput);
  }
}

import { Prediction, NflPrediction, CfbPrediction, TennisPrediction, NhlPrediction } from "./types";

/**
 * Returns a unique composite key for a prediction item based on:
 * player_id/player + prop_type + game_id/team + pick
 */
export function getLatestGeneratedAt(
  predictions: Array<{ generated_at?: string | null }> | null | undefined
): string | null {
  // predictions[0].generated_at is unreliable as a "board last updated"
  // signal for MLB specifically: each pick's generated_at is set when
  // THAT pick's game was still pregame, and picks for already-started/
  // finished games are deliberately preserved unchanged (not stale --
  // by design, so a locked-in prediction doesn't change after the game
  // starts). Once such a pick sorts to the top of the list, predictions[0]
  // shows its old lock time instead of the board's actual last refresh.
  // Taking the max across every pick's generated_at reflects the most
  // recently computed pick instead of an arbitrary (possibly long-since
  // locked) one.
  if (!predictions || predictions.length === 0) return null;
  let latest: string | null = null;
  let latestMs = -Infinity;
  for (const p of predictions) {
    if (!p.generated_at) continue;
    const ms = new Date(p.generated_at).getTime();
    if (!isNaN(ms) && ms > latestMs) {
      latestMs = ms;
      latest = p.generated_at;
    }
  }
  return latest;
}

export function getPredictionKey(pred: Prediction): string {
  if (!pred || typeof pred !== "object") return "";
  
  const safeStr = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    return String(val);
  };

  const playerKey = safeStr(pred.player_id || pred.player).trim().toLowerCase();
  const propKey = safeStr(pred.prop_type).trim().toLowerCase();
  const gameKey = safeStr(pred.game_id || pred.team || pred.opponent).trim().toLowerCase();
  const pickKey = safeStr(pred.pick).trim().toLowerCase();
  
  return `${playerKey}-${propKey}-${gameKey}-${pickKey}`;
}

/**
 * Deduplicates predictions by their composite key, keeping only the entry with the most recent `generated_at`.
 */
export function deduplicatePredictions(preds: Prediction[]): Prediction[] {
  if (!Array.isArray(preds)) return [];
  const map = new Map<string, Prediction>();

  for (const pred of preds) {
    const key = getPredictionKey(pred);
    if (!map.has(key)) {
      map.set(key, pred);
    } else {
      const existing = map.get(key)!;
      const newTime = pred.generated_at ? new Date(pred.generated_at).getTime() : 0;
      const existingTime = existing.generated_at ? new Date(existing.generated_at).getTime() : 0;
      if (newTime >= existingTime) {
        map.set(key, pred);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Composite key for an NFL prediction: player_id/player + market + week.
 * Unlike MLB there's no per-day slate to disambiguate on, so week is the
 * right granularity here.
 */
export function getNflPredictionKey(pred: NflPrediction): string {
  if (!pred || typeof pred !== "object") return "";
  const safeStr = (val: any): string => (val === null || val === undefined ? "" : String(val));
  const playerKey = safeStr(pred.player_id || pred.player).trim().toLowerCase();
  const marketKey = safeStr(pred.market).trim().toLowerCase();
  const weekKey = safeStr(pred.week);
  return `${playerKey}-${marketKey}-${weekKey}`;
}

/**
 * Deduplicates NFL predictions by their composite key, keeping the entry
 * with the most recent generated_at.
 */
export function deduplicateNflPredictions(preds: NflPrediction[]): NflPrediction[] {
  if (!Array.isArray(preds)) return [];
  const map = new Map<string, NflPrediction>();
  for (const pred of preds) {
    const key = getNflPredictionKey(pred);
    if (!map.has(key)) {
      map.set(key, pred);
    } else {
      const existing = map.get(key)!;
      const newTime = pred.generated_at ? new Date(pred.generated_at).getTime() : 0;
      const existingTime = existing.generated_at ? new Date(existing.generated_at).getTime() : 0;
      if (newTime >= existingTime) map.set(key, pred);
    }
  }
  return Array.from(map.values());
}

/**
 * Composite key for a CFB prediction: player_id/player + market + week.
 * Same reasoning as getNflPredictionKey.
 */
export function getCfbPredictionKey(pred: CfbPrediction): string {
  if (!pred || typeof pred !== "object") return "";
  const safeStr = (val: any): string => (val === null || val === undefined ? "" : String(val));
  const playerKey = safeStr(pred.player_id || pred.player).trim().toLowerCase();
  const marketKey = safeStr(pred.market).trim().toLowerCase();
  const weekKey = safeStr(pred.week);
  return `${playerKey}-${marketKey}-${weekKey}`;
}

/**
 * Deduplicates CFB predictions by their composite key, keeping the entry
 * with the most recent generated_at.
 */
export function deduplicateCfbPredictions(preds: CfbPrediction[]): CfbPrediction[] {
  if (!Array.isArray(preds)) return [];
  const map = new Map<string, CfbPrediction>();
  for (const pred of preds) {
    const key = getCfbPredictionKey(pred);
    if (!map.has(key)) {
      map.set(key, pred);
    } else {
      const existing = map.get(key)!;
      const newTime = pred.generated_at ? new Date(pred.generated_at).getTime() : 0;
      const existingTime = existing.generated_at ? new Date(existing.generated_at).getTime() : 0;
      if (newTime >= existingTime) map.set(key, pred);
    }
  }
  return Array.from(map.values());
}

/**
 * Composite key for an NHL prediction: team + market + game_date (a
 * calendar date, not a week -- NHL plays near-daily, unlike CFB/NFL).
 * player_id is always null for moneyline (team-level, no player), same
 * reason getCfbPredictionKey falls back the way it does.
 */
/** NHL identity means one EVENT outcome, even if two model generations
 * estimate that same event. Keep the originals in the upstream archive and
 * only pick a deterministic serving champion for the app.
 */
export const canonicalNhlMarket = (market:string):string => {
  if(market==='points_early_season')return 'points';
  if(market==='moneyline_early_season')return 'moneyline';
  return market;
};
export function getNhlPredictionKey(pred: NhlPrediction): string {
  if(!pred||typeof pred!=='object')return '';
  const left=canonicalNhlTeam(String(pred.team||''));
  const right=canonicalNhlTeam(String(pred.opponent||''));
  const market=canonicalNhlMarket(pred.market);
  const id=market==='moneyline'?left:
    String(pred.player_id??'').trim()||'UNIDENTIFIED:'+String(pred.player||'').trim();
  const event=[String(pred.season??''),pred.game_date||'',
    ...[left,right].sort(),pred.kickoff_utc||''].join('|');
  return [event,market,id].join('|');
}
export function deduplicateNhlPredictions(preds:NhlPrediction[]):NhlPrediction[]{
  if(!Array.isArray(preds))return [];
  const byEvent=new Map<string,NhlPrediction>();
  const priority=(p:NhlPrediction)=>{
    // A current-season model replaces, rather than doubles, an independent
    // prior-year fallback. Never select the higher reported probability.
    const source=p.source_market||p.market;
    if(source==='points'||source==='moneyline')return 0;
    if(source==='points_early_season'||source==='moneyline_early_season')return 1;
    return 0;
  };
  for(const incoming of preds){
    if(!incoming?.team||!incoming?.opponent||!incoming?.game_date)continue;
    if(canonicalNhlTeam(incoming.team)===canonicalNhlTeam(incoming.opponent))continue;
    const kind=canonicalNhlMarket(incoming.market);
    if(kind==='points' && (!incoming.player_id||
      incoming.pick!=='OVER 0.5'||!Number.isFinite(incoming.model_prob)||
      incoming.model_prob<0||incoming.model_prob>1))continue;
    const key=getNhlPredictionKey(incoming);
    const old=byEvent.get(key);
    const prefer=!old||priority(incoming)<priority(old)||
      (priority(incoming)===priority(old)&&
       Date.parse(incoming.generated_at||'')>Date.parse(old.generated_at||''));
    if(prefer){
      byEvent.set(key,{
        ...incoming,source_market:incoming.source_market||incoming.market,
        market:kind,
        model_source:incoming.model_source||(
          incoming.market.endsWith('_early_season')?
            'prior_season_informed':'current_season')
      });
    }
  }
  return [...byEvent.values()];
}

/**
 * Composite key for a tennis prediction. Unlike every other sport here a
 * match is two players (not one player vs a team) and there's no
 * season/week to disambiguate on, so the key is both players + market +
 * tourney + start time.
 */
export function getTennisPredictionKey(pred: TennisPrediction): string {
  if (!pred || typeof pred !== "object") return "";
  const safeStr = (val: any): string => (val === null || val === undefined ? "" : String(val));
  const p1Key = safeStr(pred.player1_id || pred.player1).trim().toLowerCase();
  const p2Key = safeStr(pred.player2_id || pred.player2).trim().toLowerCase();
  const marketKey = safeStr(pred.market).trim().toLowerCase();
  const tourneyKey = safeStr(pred.tourney).trim().toLowerCase();
  const startKey = safeStr(pred.start_time_utc);
  return `${p1Key}-${p2Key}-${marketKey}-${tourneyKey}-${startKey}`;
}

/**
 * Deduplicates tennis predictions by their composite key, keeping the
 * entry with the most recent generated_at.
 */
export function deduplicateTennisPredictions(preds: TennisPrediction[]): TennisPrediction[] {
  if (!Array.isArray(preds)) return [];
  const map = new Map<string, TennisPrediction>();
  for (const pred of preds) {
    const key = getTennisPredictionKey(pred);
    if (!map.has(key)) {
      map.set(key, pred);
    } else {
      const existing = map.get(key)!;
      const newTime = pred.generated_at ? new Date(pred.generated_at).getTime() : 0;
      const existingTime = existing.generated_at ? new Date(existing.generated_at).getTime() : 0;
      if (newTime >= existingTime) map.set(key, pred);
    }
  }
  return Array.from(map.values());
}
