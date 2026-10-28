/** NBA V3 game-level opportunity simulation foundation.
 * Research-only until forward chronological validation beats frozen V2.
 * Reallocates regulation minutes for verified active rotations and generates
 * correlated game outcomes without inventing sportsbook lines.
 */
export type Stat='points'|'rebounds'|'assists'|'three_pointers_made';
export type Player={id:string;team:string;active:boolean;minutes:number;minutesSd:number;rates:Record<Stat,number>;usageShare?:number};
export type Scenario={players:Player[];paceFactor?:number;draws?:number;seed?:number};
export type Draw={id:string;minutes:number;stats:Record<Stat,number>};
const MARKETS:Stat[]=['points','rebounds','assists','three_pointers_made'];
function rng(seed:number){let s=seed>>>0;return ()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return (s+.5)/4294967296;};}
function normal(rand:()=>number){return Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());}
function poisson(lambda:number,rand:()=>number){if(lambda<=0)return 0;let count=0;while(lambda>25){count+=poisson(25,rand);lambda-=25;}let p=1,k=0;const stop=Math.exp(-lambda);do{k++;p*=rand();}while(p>stop);return count+k-1;}
export function simulateGame(input:Scenario):Draw[][]{
 const draws=input.draws??10000;if(!Number.isInteger(draws)||draws<1||draws>250000)throw Error('BAD_DRAWS');
 const ids=new Set<string>();for(const p of input.players){
   if(!p.id||!p.team||ids.has(p.id))throw Error('BAD_PLAYER_ID');ids.add(p.id);
   if(!Number.isFinite(p.minutes)||p.minutes<0||p.minutes>48||!Number.isFinite(p.minutesSd)||p.minutesSd<0)throw Error('BAD_MINUTES');
   for(const m of MARKETS)if(!Number.isFinite(p.rates[m])||p.rates[m]<0)throw Error('BAD_RATE');
 }
 const teams=[...new Set(input.players.map(p=>p.team))];if(teams.length!==2)throw Error('TWO_TEAMS_REQUIRED');
 const rand=rng(input.seed??20261028),results:Draw[][]=[];
 for(let n=0;n<draws;n++){
   const pace=Math.max(.65,Math.min(1.4,(input.paceFactor??1)*Math.exp(.055*normal(rand)-.055*.055/2)));
   const outcome:Draw[]=[];
   for(const team of teams){
     const ps=input.players.filter(p=>p.team===team&&p.active);
     const mins=ps.map(p=>Math.max(0,Math.min(48,p.minutes+p.minutesSd*normal(rand))));
     // Water-fill to 240 regulation minutes; never give any player >48.
     for(let it=0;it<25;it++){
       const sum=mins.reduce((a,b)=>a+b,0),diff=240-sum;if(Math.abs(diff)<1e-7)break;
       const adjustable=mins.map((m,i)=>({i,capacity:diff>0?48-m:m})).filter(x=>x.capacity>1e-9);
       const capacity=adjustable.reduce((a,x)=>a+x.capacity,0);
       if(capacity+1e-7<Math.abs(diff))throw Error('INSUFFICIENT_ACTIVE_ROTATION_CAPACITY');
       for(const a of adjustable)mins[a.i]+=diff*a.capacity/capacity;
     }
     for(let i=0;i<ps.length;i++){
       const p=ps[i],stats={} as Record<Stat,number>;
       for(const m of MARKETS)stats[m]=poisson(mins[i]*p.rates[m]*pace,rand);
       outcome.push({id:p.id,minutes:mins[i],stats});
     }
   }
   results.push(outcome);
 }
 return results;
}
export function probabilityAtLeast(draws:Draw[][],id:string,stat:Stat,milestone:number){
 if(!draws.length||!Number.isInteger(milestone)||milestone<1)throw Error('BAD_PROBABILITY_INPUT');
 return draws.filter(d=>d.some(p=>p.id===id&&p.stats[stat]>=milestone)).length/draws.length;
}
