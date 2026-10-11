import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseExistingNfl,type ExistingYardProjection} from '../src/nfl/existing.ts';
import {rankedExistingCardProjections} from '../src/nfl/existingCardRank.ts';

const make=(player:string,confidence:ExistingYardProjection['confidence'],games:number|null,median:number,market:ExistingYardProjection['market']='receiving_yards'):ExistingYardProjection=>({
  player,team:'JAX',opponent:'PHI',market,
  kickoff_utc:'2026-10-11T13:30:00Z',projected_median:median,projected_mean:median,
  projected_low:Math.max(0,median*.2),projected_high:median*2.2,model_source:'v2_context',
  ungraded:true,player_id:player,confidence,games_played:games
});

test('six real top-ranked stability grades beat descending yardage and ingestion order',()=>{
  const full=[
    make('low-huge', 'LOW',25,150),
    make('med-recent','MEDIUM',4,90),
    make('high-brief','HIGH',3,5,'rushing_yards'),
    make('med-longest','MEDIUM',21,21),
    make('low-little','LOW',4,10),
    make('high-more-history','HIGH',12,7),
    make('med-mid','MEDIUM',16,34,'rushing_yards'),
    make('med-20','MEDIUM',20,48),
    make('med-8','MEDIUM',8,12),
    make('unknown','' as any,50,300),
    make('med-missing-games','MEDIUM',null,100)
  ];
  const input=[...full],ranked=rankedExistingCardProjections(full);
  assert.equal(ranked.length,6);
  assert.deepEqual(ranked.map(x=>x.player),[
    'high-more-history','high-brief','med-longest','med-20','med-mid','med-8'
  ]);
  assert.deepEqual(full,input,'ranking must not mutate actual full model game');
  assert(!ranked.some(x=>x.player==='low-huge'||x.player==='unknown'));
  assert.equal(ranked[0].projected_median,7,'highest yardage MUST NOT determine confidence ranking');
});

test('absence of a real source stability grade must not be filled with invented confidence',()=>{
  assert.deepEqual(rankedExistingCardProjections([make('unknown',null,18,100)]),[]);
  assert.deepEqual(rankedExistingCardProjections([make('low','LOW',3,15),make('unknown',null,18,100)]).map(x=>x.player),['low']);
  assert.throws(()=>rankedExistingCardProjections([],0),/slots/);
});

test('published model metadata survives parsing and unsupported confidence is not misrepresented',()=>{
  const kickoff='2026-10-11T13:30:00Z';
  const base={season:2026,week:5,generated_at_utc:'2026-10-11T01:00:00Z',
    picks:[
      {...make('Receiver A','HIGH',3,12),kickoff_utc:kickoff},
      {...make('Receiver B','MEDIUM',21,65),kickoff_utc:kickoff},
      {...make('Receiver C','LOW',7,80),kickoff_utc:kickoff},
      {...make('Unknown',null,null,52),confidence:'99%',games_played:-4,kickoff_utc:kickoff},
    ]};
  const doc=parseExistingNfl(base,new Date('2026-10-11T01:10:00Z'));
  const picks=doc.games[0].projections;
  assert.equal(picks.length,4);
  assert.deepEqual(rankedExistingCardProjections(picks).map(x=>x.player),['Receiver A','Receiver B','Receiver C']);
  assert.equal(picks.find(x=>x.player==='Unknown')?.confidence,null);
  assert.equal(picks.find(x=>x.player==='Unknown')?.games_played,null);
});

test('ties rank by historical games first and then stable name, without fake probability',()=>{
  const choices=[make('Zeta','MEDIUM',7,100),make('Alpha','MEDIUM',7,2),make('Beta','MEDIUM',4,300)];
  assert.deepEqual(rankedExistingCardProjections(choices).map(x=>x.player),['Alpha','Zeta','Beta']);
  assert(!('model_prob' in rankedExistingCardProjections(choices)[0]));
});
