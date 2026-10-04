/** Original stylized scenes, never photographs or replicas of stadium architecture. */
export type CityMotif='skyline'|'coast'|'mountains'|'river'|'bridge'|'capitol'|'arches'|'palms';
const CITIES:Record<string,[string,CityMotif]>={
 ARI:['Arizona','mountains'],ATL:['Atlanta','skyline'],BAL:['Baltimore','coast'],BUF:['Buffalo','river'],CAR:['Charlotte','skyline'],CHI:['Chicago','skyline'],CIN:['Cincinnati','bridge'],CLE:['Cleveland','coast'],DAL:['Dallas','skyline'],DEN:['Denver','mountains'],DET:['Detroit','river'],GB:['Green Bay','arches'],HOU:['Houston','skyline'],IND:['Indianapolis','arches'],JAX:['Jacksonville','bridge'],KC:['Kansas City','arches'],LAR:['Los Angeles','palms'],LAC:['Los Angeles','palms'],LV:['Las Vegas','mountains'],MIA:['Miami','palms'],MIN:['Minneapolis','river'],NE:['New England','coast'],NO:['New Orleans','arches'],NYG:['New York','skyline'],NYJ:['New York','skyline'],PHI:['Philadelphia','bridge'],PIT:['Pittsburgh','bridge'],SEA:['Seattle','mountains'],SF:['San Francisco','bridge'],TB:['Tampa Bay','palms'],TEN:['Nashville','river'],WSH:['Washington','capitol'],
};
export function cityAtmosphere(team:string) {
 const key=team.toUpperCase()==='LA'?'LAR':team.toUpperCase()==='WAS'?'WSH':team.toUpperCase();
 const value=CITIES[key];return value?{city:value[0],motif:value[1],label:`${value[0]} · ${value[1]} / stadium lights`}:null;
}
