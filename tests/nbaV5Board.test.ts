import test from 'node:test';
import assert from 'node:assert/strict';
import {v5AllPlayerProjections,v5QualifiedPicks,v5FeaturedPicks,readV5Projection} from '../src/nba/v5Board.ts';

const cdf=Array.from({length:30},(_,i)=>Math.min(1,(i+1)/30));
const r=(changes:Record<string,unknown>={})=>({
  player_id:'1',team_id:'2',player:'NBA Player',market:'points',
  model_version:'nba-v5-blend-possession-simulation-20261106',
  mean:12.6,median:13,p10:5,p90:21,reported_status:'AVAILABLE',
  mean_basis:'CONDITIONAL_ON_PLAYING',p_active:.9,
  cdf_lattice:{step:1,cdf},...changes
}) as any;
const g=(rows:any[])=>({game_id:'402',tipoff_utc:'2026-11-07T00:00:00Z',home:'Celtics',away:'Bucks',
 home_id:'2',away_id:'15',forecast_at_utc:'2026-11-06T19:30:00Z',rows,model_version:r().model_version}) as any;

test('NBA V5 uses its OWN .6-rounded numerical projection, with no lower line',()=>{
 const a=readV5Projection(r({mean:12.5}))!,b=readV5Projection(r({mean:12.6}))!;
 assert.equal(a.whole,12);assert.equal(b.whole,13);
 assert.ok(Math.abs(a.conditionalProbability-(1-cdf[11]))<1e-12);
 assert.ok(Math.abs(b.conditionalProbability-(1-cdf[12]))<1e-12);
 assert.ok(Math.abs(b.unconditionalProbability-(1-cdf[12])*.9)<1e-12);
});

test('DNP-inclusive probability governs live selection even when conditional is high',()=>{
 const high=r({mean:1.6,market:'steals',p_active:.7,player_id:'1',
                cdf_lattice:{step:1,cdf:[.05,.1,.2]}}); // 90% conditional but 63% all
 const low=r({mean:1.6,market:'steals',p_active:.25,player_id:'2',
               cdf_lattice:{step:1,cdf:[.05,.1,.2]}});
 assert.equal(v5QualifiedPicks(g([high,low])).length,0); // .75 minimum availability
 assert.equal(v5AllPlayerProjections(g([high,low])).length,2);
});

test('available V5 projection must match its own published reach probability',()=>{
 const ok=r({reach_probabilities:{whole_projection:13,
     probability_if_playing:1-cdf[12],
     probability_including_dnp:.9*(1-cdf[12])}});
 assert.ok(readV5Projection(ok));
 assert.equal(readV5Projection(r({reach_probabilities:{
    whole_projection:8,probability_if_playing:.8,probability_including_dnp:.7}})),null);
});

test('out and nonconditional V3 carryovers cannot appear as V5 picks',()=>{
 assert.equal(readV5Projection(r({reported_status:'OUT'})),null);
 assert.equal(readV5Projection(r({mean_basis:'EXCLUDED_CONFIRMED_INACTIVE'})),null);
});

test('all seven original V5 counting stats may appear, with no 4-pick backend cap',()=>{
 const names=['points','rebounds','assists','three_pointers_made','steals','blocks','turnovers'];
 const data=names.map((market,i)=>r({market,player_id:String(i),
   mean:market==='points'?12.6:market==='rebounds'?6.6:market==='assists'?4.6:2.6,
   cdf_lattice:{step:1,cdf:Array.from({length:40},(_,j)=>Math.min(1,(j+1)/100))}}));
 const all=v5AllPlayerProjections(g(data));
 assert.equal(all.length,7);
 const picks=v5QualifiedPicks(g(data));
 assert.equal(picks.length,7);
 assert.equal(v5FeaturedPicks(picks,4).length,4);
 assert.equal(new Set(v5FeaturedPicks(picks,4).map(x=>x.row.market)).size,4);
});

test('invalid and duplicate source rows are rejected, not quietly substituted',()=>{
 assert.equal(readV5Projection(r({cdf_lattice:{step:1,cdf:[.5,.3]}})),null);
 assert.throws(()=>v5AllPlayerProjections(g([r(),r()])),/DUPLICATE/);
});
