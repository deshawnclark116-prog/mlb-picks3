import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adjustNhlRow,adjustNbaRow,conditionOnPlaying,parseEspnInjuries,parseNhlOfficial,normName,mapStatus,setStatus,
  applyNbaOverlay,overlayNhl,overlayNba,NHL_RULE} from '../server/lineupOverlay.ts';

const nhl=(o:any={})=>({game_id:'1',player_id:'9',player:'Test Skater',team:'TOR',opponent:'UTA',mean:2,median:2,sd:1.6,p10:0,p90:4,
  model_probability_milestones_research_only:{'1':.8,'2':.5,'3':.25,'4:':.1,'5':.04},...o});
const nbaRow=(o:any={})=>{
 // p_active .6 -> 40% mass at zero, then a smooth tail; CDF includes the DNP mass at 0
 const pa=.6,c=[.4+.6*.05,.4+.6*.15,.4+.6*.35,.4+.6*.6,.4+.6*.8,.4+.6*.92,.4+.6*.98,1];
 return {game_id:'g',team_id:'1',player_id:'p',player:'Pat Player',market:'points',mean:5,median:4,p10:0,p25:0,p75:8,p90:10,p_active:pa,
  cdf_lattice:{step:1,cdf:c},model_target:{milestone:3,probability:1-c[2],method:'sim'},reported_status:'UNKNOWN',...o};
};

test('names and status wording',()=>{
 assert.equal(normName('José Ramírez Jr.'),normName('jose ramirez'));
 assert.equal(mapStatus('Out'),'OUT');
 assert.equal(mapStatus('brand new wording'),'QUESTIONABLE');
});
test('OUT is never downgraded by a weaker source',()=>{
 const m=new Map<string,any>();setStatus(m,'a','OUT');setStatus(m,'a','IN');assert.equal(m.get('a'),'OUT');
});
test('parsers',()=>{
 const m=new Map<string,any>();
 parseEspnInjuries({injuries:[{team:{id:'8'},injuries:[{status:'Out',athlete:{displayName:'Isaiah Joe'}}]}]},t=>String(t.id),m);
 assert.equal(m.get('8|isaiahjoe'),'OUT');
 const o=new Map<string,any>();
 const posted=parseNhlOfficial({awayTeam:{abbrev:'UTA',id:59},homeTeam:{abbrev:'TOR',id:10},
   rosterSpots:[{teamId:10,firstName:{default:'Auston'},lastName:{default:'Matthews'}}]},
   {gameInfo:{homeTeam:{scratches:[{firstName:{default:'John'},lastName:{default:'Tavares'}}]},awayTeam:{scratches:[]}}},o);
 assert.equal(posted,true);assert.equal(o.get('TOR|austonmatthews'),'IN');assert.equal(o.get('TOR|johntavares'),'OUT');
});
test('REGRESSION: scratches without a roster list must not zero the whole team',()=>{
 const o=new Map<string,any>();
 const posted=parseNhlOfficial({awayTeam:{abbrev:'UTA',id:59},homeTeam:{abbrev:'TOR',id:10},rosterSpots:[]},
   {gameInfo:{homeTeam:{scratches:[{firstName:{default:'John'},lastName:{default:'Tavares'}}]},awayTeam:{scratches:[]}}},o);
 assert.equal(posted,false);assert.equal(o.get('TOR|johntavares'),'OUT');
 const healthy=adjustNhlRow(nhl(),undefined,posted);
 assert.equal(healthy.mean,2);assert.equal(healthy.lineup_label,'NO_NEW_INFO');
});
test('NHL: no news changes nothing and keeps the early mean',()=>{
 const r=adjustNhlRow(nhl(),undefined,false);
 assert.equal(r.mean,2);assert.equal(r.mean_early,2);assert.equal(r.lineup_label,'NO_NEW_INFO');
});
test('NHL: OUT is zero everywhere, early forecast preserved',()=>{
 const r=adjustNhlRow(nhl(),'OUT',false);
 assert.equal(r.mean,0);assert.equal(r.mean_early,2);assert.equal(r.model_probability_milestones_research_only['1'],0);
 assert.equal(r.model_probability_milestones_early['1'],.8);assert.equal(r.lineup_label,'CONFIRMED_OUT');
});
test('NHL: missing from a posted lineup is out, missing from nothing-posted is untouched',()=>{
 assert.equal(adjustNhlRow(nhl(),undefined,true).lineup_label,'NOT_IN_POSTED_LINEUP');
 assert.equal(adjustNhlRow(nhl(),undefined,false).lineup_label,'NO_NEW_INFO');
});
test('NHL: confirmed in scales the mean and keeps probabilities consistent',()=>{
 const r=adjustNhlRow(nhl(),'IN',true);
 assert.ok(Math.abs(r.mean-2*NHL_RULE.inScale)<1e-9);
 const p=r.model_probability_milestones_research_only;
 assert.ok(p['1']>p['2']&&p['2']>p['3']&&p['3']>p['4']&&p['4']>p['5']&&p['1']<1&&p['5']>0);
 assert.equal(r.lineup_label,'CONFIRMED_IN');
});
test('NHL: if the distribution cannot be re-derived the row is left alone',()=>{
 const r=adjustNhlRow(nhl({sd:1}),'IN',true); // variance <= mean -> alpha <= 0
 assert.equal(r.mean,2);assert.equal(r.lineup_label,'NO_NEW_INFO');
});
test('NBA: OUT removes the pick and zeroes the row',()=>{
 const r=adjustNbaRow(nbaRow(),'OUT');
 assert.equal(r.mean,0);assert.equal(r.model_target,null);assert.equal(r.reported_status,'OUT');
 assert.ok(r.cdf_lattice.cdf.every((v:number)=>v===1));assert.equal(r.mean_early,5);assert.ok(r.model_target_early);
});
test('NBA: confirmed in conditions the distribution on playing',()=>{
 const row=nbaRow(),c=conditionOnPlaying(row)!;
 assert.ok(Math.abs(c[0]-.05)<1e-9);assert.ok(Math.abs(c[2]-.35)<1e-9);          // (cdf-(1-pa))/pa
 const r=adjustNbaRow(row,'IN');
 assert.equal(r.p_active,1);assert.ok(Math.abs(r.mean-3.15)<1e-9);   // conditional mean of that CDF (early unconditional mean = .6*3.15)
 assert.equal(r.lineup_label,'CONFIRMED_IN');
 assert.ok(Math.abs(r.model_target!.probability-(1-.35))<1e-9);
 assert.equal(r.p_active_early,.6);
});
test('NBA: a distribution without the DNP mass is not touched',()=>{
 const row=nbaRow({cdf_lattice:{step:1,cdf:[.05,.1,.2,.4,.6,.8,.95,1]}}); // cdf[0] < 1-p_active
 assert.equal(adjustNbaRow(row,'IN').lineup_label,'NO_NEW_INFO');
});
test('NBA: doubtful is never a headline pick',()=>{
 const r=adjustNbaRow(nbaRow({p_active:.9}),'DOUBTFUL');
 assert.equal(r.model_target,null);assert.ok(r.p_active<=.25);
});
test('NBA: players the feed does not mention are unchanged',()=>{
 const res=applyNbaOverlay({games:[{game_id:'g',rows:[nbaRow()]}]},new Map([['g',{lineupPosted:true,players:new Map(),sources:[]}]]));
 assert.equal(res.games[0].rows[0].lineup_label,'NO_NEW_INFO');assert.equal(res.games[0].rows[0].mean,5);
});
test('fail-open: a dead network returns the early forecast untouched',async()=>{
 const dead=(async()=>{throw new Error('down');}) as unknown as typeof fetch;
 const nhlRes={game_date:'2026-11-04',projections:[nhl({scheduled_start:new Date(Date.now()+3600000).toISOString()})]};
 const o=await overlayNhl(nhlRes,dead,Date.now());
 assert.equal(o.projections[0].mean,2);
 const nbaRes={games:[{game_id:'zz',tipoff_utc:new Date(Date.now()+3600000).toISOString(),rows:[nbaRow()]}]};
 const n=await overlayNba(nbaRes,dead,Date.now());
 assert.equal(n.games[0].rows[0].mean,5);
});
