/** Extend this registry without changing model/share data. */
export const POSTER_THEMES={
 premium:{label:'PREMIUM',background:'#090D10',panel:'#142027',art:true,heroes:true,grid:true},
 clean:{label:'CLEAN',background:'#111719',panel:'#1C2528',art:false,heroes:false,grid:false},
} as const;
export type PosterTheme=keyof typeof POSTER_THEMES;
