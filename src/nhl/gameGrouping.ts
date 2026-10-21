/** Canonical NHL franchise identity from the *two currently-published prediction
 * feeds*: team moneylines use full names, while player projections and original
 * SOG count research use abbreviations. Both must render in ONE game card.
 *
 * This is presentation-only. Never interpret a numeric projection as a
 * sportsbook offer, remove an unpriced player, or invent a bet.
 */
import type {NhlPrediction} from '../types';

export interface NhlGameGroup {
  key:string;
  teamA:string;
  teamB:string;
  season:number;
  game_date:string;
  kickoff_utc?:string;
  predictions:NhlPrediction[];
}

// Fixed identity table: 32 NHL franchises and accepted provider short forms.
// Do not use fuzzy substring matching (NYI/NYR, LA/LAK, SJ/SJS etc).
const TEAM_NAMES:Record<string,string>={
  'ANAHEIM DUCKS':'ANA',
  'BOSTON BRUINS':'BOS',
  'BUFFALO SABRES':'BUF',
  'CALGARY FLAMES':'CGY',
  'CAROLINA HURRICANES':'CAR',
  'CHICAGO BLACKHAWKS':'CHI',
  'COLORADO AVALANCHE':'COL',
  'COLUMBUS BLUE JACKETS':'CBJ',
  'DALLAS STARS':'DAL',
  'DETROIT RED WINGS':'DET',
  'EDMONTON OILERS':'EDM',
  'FLORIDA PANTHERS':'FLA',
  'LOS ANGELES KINGS':'LAK',
  'MINNESOTA WILD':'MIN',
  'MONTREAL CANADIENS':'MTL',
  'MONTRÉAL CANADIENS':'MTL',
  'NASHVILLE PREDATORS':'NSH',
  'NEW JERSEY DEVILS':'NJD',
  'NEW YORK ISLANDERS':'NYI',
  'NEW YORK RANGERS':'NYR',
  'OTTAWA SENATORS':'OTT',
  'PHILADELPHIA FLYERS':'PHI',
  'PITTSBURGH PENGUINS':'PIT',
  'SAN JOSE SHARKS':'SJS',
  'SEATTLE KRAKEN':'SEA',
  'ST. LOUIS BLUES':'STL',
  'ST LOUIS BLUES':'STL',
  'TAMPA BAY LIGHTNING':'TBL',
  'TORONTO MAPLE LEAFS':'TOR',
  'UTAH MAMMOTH':'UTA',
  'UTAH HOCKEY CLUB':'UTA',
  'VANCOUVER CANUCKS':'VAN',
  'VEGAS GOLDEN KNIGHTS':'VGK',
  'WASHINGTON CAPITALS':'WSH',
  'WINNIPEG JETS':'WPG'
};
const ALIASES:Record<string,string>={
  'ANH':'ANA','MONTREAL':'MTL','MON':'MTL',
  'LA':'LAK','LOS ANGELES':'LAK',
  'NJ':'NJD','SJ':'SJS','TB':'TBL',
  'VEG':'VGK','VGK':'VGK',
  'WSH':'WSH','WAS':'WSH',
  'STL':'STL','UTA':'UTA'
};
const NHL_CODES=new Set(Object.values(TEAM_NAMES));

export function canonicalNhlTeam(name:string):string {
  const raw=(name||'').trim().replace(/\s+/g,' ').toUpperCase();
  if(TEAM_NAMES[raw])return TEAM_NAMES[raw];
  if(ALIASES[raw])return ALIASES[raw];
  if(NHL_CODES.has(raw))return raw;
  // Fail closed rather than silently claim an unknown name is a particular NHL team.
  return raw;
}

/** Do not combine different puck-drop times into a fictional single event. */
export function groupNhlPredictionsByGame(preds:NhlPrediction[]):NhlGameGroup[]{
  const groups=new Map<string,NhlGameGroup>();
  const seenInputs=new Set<string>();
  for(const p of preds){
    if(!p.team||!p.opponent)continue;
    const left=canonicalNhlTeam(p.team),right=canonicalNhlTeam(p.opponent);
    if(!left||!right||left===right)continue;
    const sides=[left,right].sort();
    const start=p.kickoff_utc&&Number.isFinite(Date.parse(p.kickoff_utc))
      ?new Date(p.kickoff_utc).toISOString():null;
    const identity=[String(p.season||''),p.game_date||'',...sides,start||'unknown-kickoff'].join('|');
    let group=groups.get(identity);
    if(!group){
      group={
        key:identity,teamA:sides[0],teamB:sides[1],
        season:p.season,game_date:p.game_date,kickoff_utc:start||undefined,
        predictions:[]
      };
      groups.set(identity,group);
    }
    // The original points classifier can publish current and early-season
    // probabilities for one player. Preserve BOTH as distinct original model
    // forecasts; do not dedupe across markets or remove without book offers.
    // Upstream src/utils.ts already handles exact source row dedupe.
    group.predictions.push(p);
    seenInputs.add(identity);
  }
  return [...groups.values()].sort((a,b)=>
    (a.kickoff_utc||'9999').localeCompare(b.kickoff_utc||'9999')||
    a.key.localeCompare(b.key));
}
