/** Local presentation colors only. No network branding dependencies. */
const COLORS: Record<string,[string,string]> = {
 ARI:['#97233F','#FFB612'],ATL:['#A71930','#A5ACAF'],BAL:['#241773','#9E7C0C'],BUF:['#00338D','#C60C30'],CAR:['#0085CA','#BFC0BF'],CHI:['#C83803','#0B162A'],CIN:['#FB4F14','#555555'],CLE:['#FF3C00','#311D00'],DAL:['#003594','#869397'],DEN:['#FB4F14','#002244'],DET:['#0076B6','#B0B7BC'],GB:['#203731','#FFB612'],HOU:['#A71930','#03202F'],IND:['#002C5F','#A2AAAD'],JAX:['#006778','#D7A22A'],KC:['#E31837','#FFB81C'],LA:['#003594','#FFD100'],LAR:['#003594','#FFD100'],LAC:['#0080C6','#FFC20E'],LV:['#A5ACAF','#555555'],MIA:['#008E97','#FC4C02'],MIN:['#4F2683','#FFC62F'],NE:['#002244','#C60C30'],NO:['#D3BC8D','#777777'],NYG:['#0B2265','#A71930'],NYJ:['#125740','#BFC0BF'],PHI:['#004C54','#A5ACAF'],PIT:['#FFB612','#777777'],SEA:['#002244','#69BE28'],SF:['#AA0000','#B3995D'],TB:['#D50A0A','#B1BABF'],TEN:['#4B92DB','#0C2340'],WAS:['#773141','#FFB612'],WSH:['#773141','#FFB612'],
};
export function teamBrand(abbreviation:string) {
 const [primary,secondary]=COLORS[abbreviation.toUpperCase()] || ['#66717E','#AAB0B7'];
 return {abbreviation:abbreviation.toUpperCase(),primary,secondary};
}
