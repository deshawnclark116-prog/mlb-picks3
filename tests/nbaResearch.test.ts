import {test} from 'node:test';
import assert from 'node:assert/strict';
import saved from '../docs/nba_v1_opening_week_research.json';
import {parseNbaResearch} from '../src/nba/research';
import {nbaResearchHandler} from '../server/nbaResearch';

const clone = (): any => structuredClone(saved);

test('actual frozen NBA 2026 ESPN 14-game artifact passes strict source and pregame checks', () => {
  const doc = parseNbaResearch(saved);
  assert.equal(doc.forecasts.length, 14);
  assert.equal(doc.historical_completed_regular_games, 1230);
  assert.equal(doc.official_wagers, 0);
  assert.equal(doc.player_markets_official, 0);
  for (const f of doc.forecasts) {
    assert(Date.parse(doc.generated_at_utc) < Date.parse(f.tipoff_utc));
    assert.equal(f.role_availability_verified, false);
    assert.equal(f.betting_line_available, false);
    assert.equal(f.wager_recommendation, false);
  }
});

test('do not silently convert NBA research to official sportsbook picks', () => {
  for (const [key, value] of [
    ['research_only', false], ['official_wagers', 1],
    ['player_markets_official', 1], ['role_and_lineup_verification', 'VERIFIED']
  ] as const) {
    const d = clone(); d[key] = value;
    assert.throws(() => parseNbaResearch(d), /research|certification/i);
  }
  for (const [key, value] of [
    ['wager_recommendation', true], ['betting_line_available', true],
    ['role_availability_verified', true]
  ] as const) {
    const d = clone(); d.forecasts[0][key] = value;
    assert.throws(() => parseNbaResearch(d), /research|certif/i);
  }
});

test('do not publish duplicate games, forged forecast timing or future-informed picks', () => {
  const duplicate = clone(); duplicate.forecasts[1].game_id = duplicate.forecasts[0].game_id;
  assert.throws(() => parseNbaResearch(duplicate));
  const stale = clone(); stale.generated_at_utc = stale.forecasts[0].tipoff_utc;
  assert.throws(() => parseNbaResearch(stale), /before/);
  const wrong = clone(); wrong.forecasts[0].home_win_probability = 0.99;
  assert.throws(() => parseNbaResearch(wrong), /research/);
  const score = clone(); score.forecasts[0].projected_game_total_mean = 50;
  assert.throws(() => parseNbaResearch(score));
  const history = clone(); history.historical_completed_regular_games = 1235;
  assert.throws(() => parseNbaResearch(history));
});

test('actual Express handler exposes original immutable artifact without any external requests', () => {
  let status = 200;
  let payload: any;
  const res = {
    setHeader: (_name: string, _value: string) => {},
    status: (s: number) => {status = s; return res;},
    json: (x: unknown) => {payload = x; return res;}
  };
  const handler = nbaResearchHandler();
  handler({} as any, res as any);
  assert.equal(status, 200);
  assert.deepEqual(payload, saved);
  assert.equal(payload.projected_games, 14);
  assert.equal(payload.official_wagers, 0);
});
