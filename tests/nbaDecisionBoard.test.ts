import {readdirSync,readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import opening from '../docs/nba_v2_opening_player_firstseen.json';
import rolling from '../docs/nba_rolling_predictions/2026-10-20T173448Z.json';
import {buildNbaSystemBoard,targetFor,forecastEligible,
        type InputGame} from '../src/nba/decisionBoard.ts';
import {readVerifiedNbaSystemBoard,nbaSystemPicksHandler} from '../server/nbaSystemPicks.ts';

const data=():InputGame[]=>[
 ...opening.forecasts.map(g=>({...g,source:'FROZEN_OPENING_V2' as const,
     original_at_utc:opening.generated_at_utc})),
 ...rolling.forecasts.map(g=>({...g,source:'ROLLING_ORIGINAL_V2' as const,
     original_at_utc:rolling.generated_at_utc}))
] as unknown as InputGame[];
const clone=<T>(r:T):T=>JSON.parse(JSON.stringify(r)) as T;

test('NBA model board selects all qualifying players without arbitrary per-game limit and keeps 1832 raw predictions',()=>{
 const d=buildNbaSystemBoard(data());
 assert.equal(d.schema,'NBA_V2_SAVED_PREGAME_SYSTEM_TARGET_BOARD_V1');
 assert.equal(d.original_game_count,28);
 assert.equal(d.original_player_stat_count,900+932);
 assert.equal(d.evaluated_player_count,225+233);
 assert(d.all_uncapped_system_candidate_count>20);
 assert(d.displayed_system_picks<d.evaluated_player_count);
 assert.equal(d.displayed_system_picks,d.all_uncapped_system_candidate_count);
 assert.equal(d.not_shown_raw_graded_predictions,1832);
 assert(d.games.some(g=>g.picks.length>2));
 assert(d.games.every(g=>g.picks.length===g.candidate_count));
 for(const g of d.games)for(const p of g.picks){
    assert.equal(p.type,'UNPRICED_MODEL_TARGET_NOT_A_BOOK_BET');
    assert.equal(p.official_pick,false);
    assert.equal(p.model_hit_probability,null);
    assert.equal(p.bookmaker_line,null);
    assert.equal(p.bookmaker_odds,null);
    assert(p.gap_in_historical_mae_units>=.9);
    assert(p.conditional_minutes>=26);
    assert(p.historical_p_play>=.85);
    assert.equal(p.game_id,g.game_id);
 }
 assert.equal(d.verified_book_lines,0);
 assert.equal(d.official_bets,0);
 assert.equal(d.probability_model_calibrated_for_NBA_targets,false);
});

test('Celtics-Pistons shows all qualified model selections, not two arbitrarily sliced picks or full raw player dump',()=>{
 const d=buildNbaSystemBoard(data());
 const game=d.games.find(g=>g.away==='Boston Celtics'&&g.home==='Detroit Pistons');
 assert(game);
 assert(game.picks.length>2);
 assert.equal(game.candidate_count,game.picks.length);
 assert(game.picks.some(p=>p.player==='Jalen Duren'));
 assert(game.picks.some(p=>p.player==='Payton Pritchard'));
 assert.equal(new Set(game.picks.map(p=>p.player_id)).size,game.picks.length);
 assert(game.picks.every(p=>p.predicted_stat>p.model_milestone-.5));
});

test('availability/injury and minimum history role gates reject low-trust NBA targets',()=>{
 const game=data()[0];
 const selected=game.players.find(p=>targetFor(p,game));
 assert(selected);
 const unavailable=clone(selected);
 unavailable.p_play_unverified=.54;
 assert.equal(targetFor(unavailable,game),null);
 const bench=clone(selected);
 bench.conditional_minutes_mean=7;
 assert.equal(targetFor(bench,game),null);
 for(const status of ['OUT','DOUBTFUL','QUESTIONABLE','DAY_TO_DAY']){
   const p=clone(selected);
   p.espn_source_reported_injury_status=status;
   assert.equal(targetFor(p,game),null,status);
 }
 const zeroScenario=clone(selected);
 zeroScenario.reported_out_in_24h_conditional_scenario_p_play=0;
 assert.equal(targetFor(zeroScenario,game),null);
});

test('reject duplicate and post-tip original research; no made-up confidence',()=>{
 const inputs=data();
 assert.throws(()=>buildNbaSystemBoard([...inputs,inputs[0]]),/DUPLICATE_ORIGINAL_GAME/);
 const forged=clone(inputs);
 forged[0].original_at_utc=forged[0].tipoff_utc;
 assert.throws(()=>buildNbaSystemBoard(forged),/MUST_BE_FROZEN_PREGAME/);
 const changed=clone(inputs);
 changed[0].player_predictions_count+=4;
 assert.throws(()=>buildNbaSystemBoard(changed),/DROPPED_ORIGINAL_STAT/);
});

test('live API loads saved opening AND rolling forecasts, ranks tonight instead of showing all stat rows',async()=>{
 const day=readVerifiedNbaSystemBoard(new Date('2026-10-20T18:28:00Z'));
 // Continuously append-only NBA forecasts cannot be checked against the
 // old October 20 (28-game) constant. Independently count archived actual
 // original game IDs in this exact reader window and the raw stat rows.
 const asof=Date.parse('2026-10-20T18:28:00Z');
 const archived=readdirSync('docs/nba_rolling_predictions')
   .filter(n=>/^20\d\d-\d\d-\d\dT\d{6}Z\.json$/.test(n))
   .flatMap(n=>{
     const doc=JSON.parse(readFileSync('docs/nba_rolling_predictions/'+n,'utf8')) as
       {forecasts:Array<{game_id:string;tipoff_utc:string;player_predictions_count:number}>};
     return doc.forecasts;
   })
   .filter(g=>Date.parse(g.tipoff_utc)>=asof-3*86400000&&
              Date.parse(g.tipoff_utc)<=asof+8*86400000);
 assert.equal(day.original_game_count,opening.forecasts.length+archived.length);
 assert.equal(day.original_player_stat_count,
   opening.number_of_player_stat_predictions+
   archived.reduce((sum,g)=>sum+g.player_predictions_count,0));
 assert(day.games.some(g=>g.game_id===opening.forecasts[0].game_id));
 assert(day.games.some(g=>g.game_id===rolling.forecasts[0].game_id));
 assert(day.games.some(g=>g.picks.length));
 assert(day.games.every(g=>g.picks.length===g.candidate_count));
 assert.equal(day.official_bets,0);
 assert.equal(day.priced_market_status,'NO_VERIFIED_NBA_BOOKMAKER_PROP_LINE_FEED');
 let result:any;
 const res:any={setHeader:()=>res,status:(n:number)=>{throw Error('Unexpected HTTP '+n);},
   json:(x:any)=>{result=x;return res;}};
 const feed={injuries:[
   ...['1','2','3','4','5'].map((team,i)=>({
     team:{id:team},athlete:{id:String(910001+i),displayName:'Synthetic player'},
     status:'Out',date:'2026-10-20T17:00:00Z'
   }))
 ]};
 const fetcher=(async()=>Response.json(feed)) as typeof fetch;
 await nbaSystemPicksHandler(fetcher,()=>new Date('2026-10-20T18:28:00Z'))({} as any,res);
 assert.equal(result.schema,'NBA_V2_SAVED_PREGAME_SYSTEM_TARGET_BOARD_V1');
 assert.equal(result.official_bets,0);
});
