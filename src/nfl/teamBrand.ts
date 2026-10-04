/** Bundled NFL branding; presentation only. See public/nfl/ASSETS.md. */
const COLORS: Record<string,[string,string]> = {
 ARI:['#97233F','#FFB612'],ATL:['#A71930','#A5ACAF'],BAL:['#241773','#9E7C0C'],BUF:['#00338D','#C60C30'],CAR:['#0085CA','#BFC0BF'],CHI:['#C83803','#0B162A'],CIN:['#FB4F14','#555555'],CLE:['#FF3C00','#311D00'],DAL:['#003594','#869397'],DEN:['#FB4F14','#002244'],DET:['#0076B6','#B0B7BC'],GB:['#203731','#FFB612'],HOU:['#A71930','#03202F'],IND:['#002C5F','#A2AAAD'],JAX:['#006778','#D7A22A'],KC:['#E31837','#FFB81C'],LA:['#003594','#FFD100'],LAR:['#003594','#FFD100'],LAC:['#0080C6','#FFC20E'],LV:['#A5ACAF','#555555'],MIA:['#008E97','#FC4C02'],MIN:['#4F2683','#FFC62F'],NE:['#002244','#C60C30'],NO:['#D3BC8D','#777777'],NYG:['#0B2265','#A71930'],NYJ:['#125740','#BFC0BF'],PHI:['#004C54','#A5ACAF'],PIT:['#FFB612','#777777'],SEA:['#002244','#69BE28'],SF:['#AA0000','#B3995D'],TB:['#D50A0A','#B1BABF'],TEN:['#4B92DB','#0C2340'],WAS:['#773141','#FFB612'],WSH:['#773141','#FFB612'],
};
const NAMES:Record<string,string>={ARI:'Arizona Cardinals',ATL:'Atlanta Falcons',BAL:'Baltimore Ravens',BUF:'Buffalo Bills',CAR:'Carolina Panthers',CHI:'Chicago Bears',CIN:'Cincinnati Bengals',CLE:'Cleveland Browns',DAL:'Dallas Cowboys',DEN:'Denver Broncos',DET:'Detroit Lions',GB:'Green Bay Packers',HOU:'Houston Texans',IND:'Indianapolis Colts',JAX:'Jacksonville Jaguars',KC:'Kansas City Chiefs',LAR:'Los Angeles Rams',LAC:'Los Angeles Chargers',LV:'Las Vegas Raiders',MIA:'Miami Dolphins',MIN:'Minnesota Vikings',NE:'New England Patriots',NO:'New Orleans Saints',NYG:'New York Giants',NYJ:'New York Jets',PHI:'Philadelphia Eagles',PIT:'Pittsburgh Steelers',SEA:'Seattle Seahawks',SF:'San Francisco 49ers',TB:'Tampa Bay Buccaneers',TEN:'Tennessee Titans',WSH:'Washington Commanders'};
export function teamBrand(abbreviation:string) {
 const abbr=abbreviation.toUpperCase(),key=abbr==='LA'?'LAR':abbr==='WAS'?'WSH':abbr;
 const [primary,secondary]=COLORS[key] || ['#66717E','#AAB0B7'];
 return {abbreviation:abbr,name:NAMES[key]||abbr,primary,secondary,text:'#F0F4F5',logo:NAMES[key]?`/nfl/teams/${key.toLowerCase()}.png`:null,
  artwork:key==='CHI'?'/nfl/art/chicago-night.svg':null};
}
export type TeamBrand=ReturnType<typeof teamBrand>;
