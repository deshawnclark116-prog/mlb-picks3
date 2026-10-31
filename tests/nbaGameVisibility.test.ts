import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readVerifiedNbaSystemBoard} from '../server/nbaSystemPicks.ts';
import {nbaEasternGameDay,visibleNbaGameSlate} from '../src/nba/boardVisibility.ts';

const ASOF=new Date('2026-10-25T16:40:00Z');
test('Oct 25 real independently audited seven-game slate survives even if only ONE matchup clears picks',()=>{
 const source=JSON.parse(readFileSync('docs/nba_daily_prediction_health.json','utf8'));
 // Daily status is mutable and advances every slate. Don't pin it to the
 // historical fixture date; the separately frozen Oct 25 game board below
 // remains the immutable regression under test.
 assert.match(source.eastern_game_date,/^20\d{2}-\d{2}-\d{2}$/);
 assert(Number.isInteger(source.today_independent_schedule_games));
 assert(source.today_independent_schedule_games>=0);
 assert(Number.isInteger(source.today_games_with_original));
 assert(source.today_games_with_original>=0);
 assert(source.today_games_with_original<=source.today_independent_schedule_games);
 assert(Array.isArray(source.today_games_without_original));
 const board=readVerifiedNbaSystemBoard(ASOF);
 const games=visibleNbaGameSlate(board.games,'TODAY','2026-10-25');
 assert.equal(games.length,7,
   'Never hide six scheduled games just because none has a 65%+ player pick');
 assert.equal(new Set(games.map(g=>g.game_id)).size,7);
 assert(games.every(g=>g.original_at_utc&&Date.parse(g.original_at_utc)<Date.parse(g.tipoff_utc)));
 assert.deepEqual(games.map(g=>g.game_id),[
   '401909861','401909862','401909863','401909864',
   '401909865','401909866','401909867'
 ]);
 assert.equal(games.filter(g=>g.picks.length>0).length,1);
 const selections=games.flatMap(g=>g.picks);
 assert.equal(selections.length,1);
 assert.equal(selections[0].player,'Tyrese Maxey');
 assert.equal(selections[0].model_milestone,15);
 assert.equal(selections[0].market,'points');
 assert.equal(selections[0].model_hit_probability!=null,true);
 assert.equal(board.official_bets,0);
});
test('market filter never removes empty-but-genuine matchup or manufactures substitute market props',()=>{
 const board=readVerifiedNbaSystemBoard(ASOF);
 const all=visibleNbaGameSlate(board.games,'TODAY','2026-10-25');
 const rebound=visibleNbaGameSlate(board.games,'TODAY','2026-10-25','rebounds');
 assert.equal(rebound.length,all.length);
 assert.equal(rebound.length,7);
 assert(rebound.every(g=>g.picks.length===0));
 assert.equal(board.original_game_count>7,true);
 assert.equal(board.games_with_picks>=1,true);
});
test("team and player search can narrow games; an empty selected game's pick list remains genuinely empty",()=>{
 const board=readVerifiedNbaSystemBoard(ASOF);
 const byTeam=visibleNbaGameSlate(board.games,'TODAY','2026-10-25','ALL','Lakers');
 assert.equal(byTeam.length,1);
 assert.equal(byTeam[0].game_id,'401909861');
 assert.equal(byTeam[0].picks.length,0);
 const byPlayer=visibleNbaGameSlate(board.games,'TODAY','2026-10-25','ALL','Tyrese Maxey');
 assert.equal(byPlayer.length,1);
 assert.equal(byPlayer[0].game_id,'401909866');
 const nobody=visibleNbaGameSlate(board.games,'TODAY','2026-10-25','ALL','Unlisted Athlete');
 assert.equal(nobody.length,0);
});
test('NBA game dates use Eastern tipoff rather than UTC so Kings 9PM Oct25 does not disappear on Oct26 UTC',()=>{
 assert.equal(nbaEasternGameDay('2026-10-26T01:00:00Z'),'2026-10-25');
 assert.equal(nbaEasternGameDay('2026-10-26T23:30:00Z'),'2026-10-26');
 const board=readVerifiedNbaSystemBoard(ASOF);
 const tonight=visibleNbaGameSlate(board.games,'TODAY','2026-10-25');
 assert(tonight.some(g=>g.game_id==='401909867'));
});
