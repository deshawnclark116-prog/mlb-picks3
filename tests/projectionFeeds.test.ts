import test from "node:test";
import assert from "node:assert/strict";
import { loadProjectionFeed, validateCfb, validateNhl } from "../server/projectionFeeds.ts";

const cfb = () => ({
  schema: "cfb-player-stat-projections-research-v1",
  research_only: true, is_live_predictions_feed: false, official_new_betting_picks: 0,
  backfilled_forecasts: 0, original_run_id: 38053736857,
  original_baseline_sha256: "a".repeat(64), original_monte_carlo_sha256: "b".repeat(64),
  forecast_count: 1, monte_carlo_count: 0,
  forecasts: [{game_id:"g",player_id:"p",player:"Player",team:"AAA",opponent:"BBB",
    market:"rushing_yards",kickoff_utc:"2026-10-10T16:00:00Z",presentation_status:"PREGAME_RESEARCH_ONLY",
    baseline:{mean:8,median:8,kind:"three_game_average_NOT_trained_model",last_three:[7,8,9]},
    monte_carlo:null}],
});
const nhl = () => {
  const row_fields = ["game_id","player_id","player","team","game_date","scheduled_start","mean","median","sd","p10","p25","p75","p90",
    "p0","p_ge1","p_ge2","p_ge3","p_ge4","p_ge5"];
  const row = ["game","nhl-player-123","Skater","PIT","2026-10-07","2026-10-07T23:00:00Z",2.4,2,1.5,0,1,3,5,.15,.85,.65,.4,.2,.08];
  return {
    schema:"nhl-v2-sog-nfl-style-shadow-v1",status:"RESEARCH_ONLY_NOT_VALIDATED_FOR_BETTING",
    verified_original_hash_chain:true,verified_frozen_code_and_model_lock:true,
    dressed_lineups_verified:false,actual_player_book_lines_verified:false,
    historical_corrected_probabilities_were_not_published_pregame:true,
    row_fields,horizons:["T90"],dates:["2026-10-07"],
    forecasts:{T90:[row]},total_valid_forecasts:1,
  };
};
test("CFB original research passes only with explicit unpromoted status", () => {
  assert.equal(validateCfb(cfb()).forecast_count,1);
  assert.throws(() => validateCfb({...cfb(),official_new_betting_picks:1}),/REJECTED/);
  assert.throws(() => validateCfb({...cfb(),is_live_predictions_feed:true}),/REJECTED/);
  assert.throws(() => validateCfb({...cfb(),forecasts:[...cfb().forecasts,...cfb().forecasts],forecast_count:2}),/duplicate/);
});
test("NHL count distribution must remain historical, certified ledger and unpriced", () => {
  assert.equal(validateNhl(nhl()).total_valid_forecasts,1);
  assert.throws(() => validateNhl({...nhl(),dressed_lineups_verified:true}),/REJECTED/);
  assert.throws(() => validateNhl({...nhl(),verified_original_hash_chain:false}),/REJECTED/);
  const shifted=nhl();
  shifted.forecasts.T90[0][15]=.9;
  assert.throws(() => validateNhl(shifted),/survival probabilities/);
});
test("An unavailable CFB source fails closed rather than loading old classifiers", async () => {
  const fetcher = (async () => new Response("missing",{status:404})) as typeof fetch;
  await assert.rejects(loadProjectionFeed("cfb",fetcher),/artifact unavailable/);
});
test("CFB source-verified document is returned unchanged", async () => {
  const original=cfb();
  const fetcher = (async () => Response.json(original)) as typeof fetch;
  assert.deepEqual(await loadProjectionFeed("cfb",fetcher),original);
});
