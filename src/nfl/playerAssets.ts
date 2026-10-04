/** Stable, team-independent name key; forecast row IDs include outcomes and are unsuitable for imagery. */
export function playerKey(name:string) {
 return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
export interface LicensedCutout {src:string;source:string;permission:string;verified:boolean}
