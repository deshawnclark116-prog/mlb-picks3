/** Verified ESPN fixture identities from immutable pregame scoreboard receipts.
 * The fixture (including home/away IDs) is the authority, never the order of
 * historical player rows or the ordering of two alphabetized team names.
 */
import type {GameFixture} from './gameBoard';
import latest from '../../docs/soccer_player_espn/board.json';
const originals=import.meta.glob('../../docs/soccer_player_espn/originals/*.json',{
 eager:true,import:'default'
}) as Record<string,unknown>;
type Raw={schema?:unknown;capturedAtUtc?:unknown;fixture?:unknown};
const leagues=new Set(['eng.1','esp.1','ita.1','ger.1','fra.1']);
const validIso=(x:unknown):x is string=>typeof x==='string'&&
 /Z$/.test(x)&&Number.isFinite(Date.parse(x));
export function verifiedSoccerFixtures(atUtc:string):GameFixture[]{
 if(!validIso(atUtc))throw Error('SOCCER_FIXTURE_BAD_ASOF');
 const now=Date.parse(atUtc),max=now+21*86400000;
 const byId=new Map<string,GameFixture>();
 const record=(f:unknown,seenAt:unknown)=>{
  const x=f as GameFixture;
  if(!x||!leagues.has(x.league)||!/^\d{1,15}$/.test(x.gameId)||
   !/^\d{1,15}$/.test(x.homeId)||!/^\d{1,15}$/.test(x.awayId)||
   x.homeId===x.awayId||typeof x.home!=='string'||!x.home.trim()||
   typeof x.away!=='string'||!x.away.trim()||
   !validIso(x.kickoffUtc)||!validIso(seenAt)||Date.parse(seenAt)>now||
   Date.parse(seenAt)>=Date.parse(x.kickoffUtc)||
   Date.parse(x.kickoffUtc)<=now||Date.parse(x.kickoffUtc)>max||
   x.completed!==false)return;
  const key=x.league+'|'+x.gameId;
  if(byId.has(key)){
   const old=byId.get(key)!;
   if([old.homeId,old.awayId,old.home,old.away,old.kickoffUtc].join('|')!==
      [x.homeId,x.awayId,x.home,x.away,x.kickoffUtc].join('|'))
    throw Error('SOCCER_FIXTURE_CONFLICTING_SCOREBOARDS');
  }else byId.set(key,x);
 };
 const archive=latest as unknown as {generatedAtUtc?:unknown;fixtures?:unknown};
 // Once rolling job includes ALL verified upcoming ESPN fixtures, even those
 // lacking player history are still represented as matches.
 if(validIso(archive.generatedAtUtc)&&Date.parse(archive.generatedAtUtc)<=now&&
  now-Date.parse(archive.generatedAtUtc)<=72*3600000&&
  Array.isArray(archive.fixtures))
  for(const x of archive.fixtures)record(x,archive.generatedAtUtc);
 for(const [path,raw] of Object.entries(originals)){
  const o=raw as Raw;
  const f=o?.fixture as GameFixture|undefined;
  if(o?.schema!=='soccer-espn-firstseen-fixture-v1'||!f||
   path.split('/').pop()!==f.league.replace('.','_')+'-'+f.gameId+'.json')
   throw Error('SOCCER_FIXTURE_UNVERIFIED_ORIGINAL');
  record(f,o.capturedAtUtc);
 }
 return [...byId.values()].sort((a,b)=>a.kickoffUtc.localeCompare(b.kickoffUtc)||
  a.league.localeCompare(b.league)||a.gameId.localeCompare(b.gameId));
}
