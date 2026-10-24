/** Daily, credit-free cross-sport schedule delivery audit.
 * Checks independently supplied games rather than whether a sportsbook
 * happened to list a player's market or the model published a pick.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {SPORTS,loadUpcomingFixtures} from '../server/upcomingFixtures.ts';

const now=new Date();
const outcomes=await Promise.all(SPORTS.map(async sport=>{
  const d=await loadUpcomingFixtures(sport,now,fetch,false);
  const seen=new Set<string>();
  for(const g of d.fixtures){
    if(seen.has(g.event_id)||Date.parse(g.start_utc)>=Date.parse(d.through_utc)||
       Date.parse(g.start_utc)<now.getTime()-86400000||
       g.prediction_attached!==false){
      throw Error('BAD_FIXTURE_IDENTITY_OR_FUTURE_WINDOW '+sport+' '+g.event_id);
    }
    seen.add(g.event_id);
  }
  return {sport,status:d.status,sources_checked:d.sources_checked,
    sources_succeeded:d.sources_succeeded,
    verified_upcoming_game_count:d.fixture_count,
    source_errors:d.source_errors,
    first_three:d.fixtures.slice(0,3).map(g=>({
      event_id:g.event_id,away:g.away,home:g.home,start_utc:g.start_utc
    }))};
}));
const doc={schema:'PROP_EDGE_SEVEN_SPORT_SCHEDULE_DELIVERY_AUDIT_V1',
  checked_at_utc:now.toISOString(),has_bookmaker_calls:false,
  games_do_not_require_published_picks:true,outcomes};
mkdirSync('audit-output',{recursive:true});
writeFileSync('audit-output/upcoming-sports-status.json',
  JSON.stringify(doc,null,2)+'\n');
for(const x of outcomes){
  console.log('UPCOMING_FIXTURES',x.sport,x.status,x.verified_upcoming_game_count,
    'sources',x.sources_succeeded+'/'+x.sources_checked);
  if(!x.verified_upcoming_game_count)
    console.log('NOTICE_ZERO_GAMES_IN_SOURCE_WINDOW',x.sport,
      'could mean offseason, no events, or incomplete upstream calendar');
}
if(outcomes.some(x=>x.status!=='SOURCE_VERIFIED')){
  console.error('ERROR_CANNOT_CLAIM_ALL_SPORTS_CURRENTLY_HAVE_VERIFIED_SCHEDULE_COVERAGE');
  process.exitCode=1;
}
