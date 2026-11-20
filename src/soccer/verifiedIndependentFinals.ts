/** Independent, exact-ID completed-match score backup for soccer research.
 * Original forecasts and models NEVER change. Dates + explicit team-name
 * aliases + league/season all must agree. No fuzzy/team-score inference.
 */
import type {League,Match} from './model';

export const SOURCE_2627:Record<League,string>={
 EPL:'ENG_1_premier-league',
 LaLiga:'ESP_1_la-liga',
 SerieA:'ITA_1_serie-a',
 Bundesliga:'GER_1_bundesliga',
 Ligue1:'FRA_1_ligue-1'
};
export const SOURCE_ROOT='https://raw.githubusercontent.com/oladeeayo/open-matchday/master/data';
/** Explicit, bijective names, reviewed from 2026/27 fixture and result sources.
 * No arbitrary string similarity or names supplied by postgame predictions.
 */
export const TEAM_TO_RESULTS:Record<League,Record<string,string>>={
 EPL:{
  'AFC Bournemouth':'Bournemouth','Arsenal FC':'Arsenal',
  'Aston Villa FC':'Aston Villa','Brentford FC':'Brentford',
  'Brighton & Hove Albion FC':'Brighton','Chelsea FC':'Chelsea',
  'Coventry City FC':'Coventry','Crystal Palace FC':'Crystal Palace',
  'Everton FC':'Everton','Fulham FC':'Fulham','Hull City AFC':'Hull',
  'Ipswich Town FC':'Ipswich','Leeds United FC':'Leeds',
  'Liverpool FC':'Liverpool','Manchester City FC':'Man City',
  'Manchester United FC':'Man Utd','Newcastle United FC':'Newcastle',
  'Nottingham Forest FC':"Nott'm Forest",
  'Sunderland AFC':'Sunderland','Tottenham Hotspur FC':'Spurs'
 },
 LaLiga:{
  'Athletic Club':'Athletic Club','CA Osasuna':'CA Osasuna',
  'Club Atlético de Madrid':'Atlético de Madrid',
  'Deportivo Alavés':'Deportivo Alavés','Elche CF':'Elche CF',
  'FC Barcelona':'FC Barcelona','Getafe CF':'Getafe CF',
  'Levante UD':'Levante UD','Málaga CF':'Málaga CF',
  'RC Celta de Vigo':'Celta','RC Deportivo La Coruña':'RC Deportivo',
  'RCD Espanyol de Barcelona':'RCD Espanyol de Barcelona',
  'Rayo Vallecano de Madrid':'Rayo Vallecano',
  'Real Betis Balompié':'Real Betis','Real Madrid CF':'Real Madrid',
  'Real Racing Club de Santander':'R. Racing Club',
  'Real Sociedad de Fútbol':'Real Sociedad','Sevilla FC':'Sevilla FC',
  'Valencia CF':'Valencia CF','Villarreal CF':'Villarreal CF'
 },
 SerieA:{
  'AC Milan':'Milan','AC Monza':'Monza','ACF Fiorentina':'Fiorentina',
  'AS Roma':'Roma','Atalanta BC':'Atalanta','Bologna FC 1909':'Bologna',
  'Cagliari Calcio':'Cagliari','Como 1907':'Como',
  'FC Internazionale Milano':'Internazionale','Frosinone Calcio':'Frosinone',
  'Genoa CFC':'Genoa','Juventus FC':'Juventus','Parma Calcio 1913':'Parma',
  'SS Lazio':'Lazio','SSC Napoli':'Napoli','Torino FC':'Torino',
  'US Lecce':'Lecce','US Sassuolo Calcio':'Sassuolo',
  'Udinese Calcio':'Udinese','Venezia FC':'Venezia'
 },
 Bundesliga:{
  '1. FC Köln':'1. FC Köln','1. FC Union Berlin':'1. FC Union Berlin',
  '1. FSV Mainz 05':'1. FSV Mainz 05',
  'Bayer 04 Leverkusen':'Bayer 04 Leverkusen',
  'Borussia Dortmund':'Borussia Dortmund',
  'Borussia Mönchengladbach':'Borussia Mönchengladbach',
  'Eintracht Frankfurt':'Eintracht Frankfurt','FC Augsburg':'FC Augsburg',
  'FC Bayern München':'FC Bayern München','FC Schalke 04':'FC Schalke 04',
  'Hamburger SV':'Hamburger SV','RB Leipzig':'RB Leipzig',
  'SC Freiburg':'SC Freiburg','SC Paderborn 07':'SC Paderborn 07',
  'SV 07 Elversberg':'SV 07 Elversberg','SV Werder Bremen':'SV Werder Bremen',
  'TSG 1899 Hoffenheim':'TSG Hoffenheim','VfB Stuttgart':'VfB Stuttgart'
 },
 Ligue1:{
  'AJ Auxerre':'AJ Auxerre','AS Monaco FC':'AS Monaco',
  'Angers SCO':'Angers SCO','ES Troyes AC':'Estac Troyes',
  'FC Lorient':'FC Lorient','Le Havre AC':'Havre Athletic Club',
  'Le Mans FC':'Le Mans FC','Lille OSC':'LOSC Lille',
  'OGC Nice':'OGC Nice','Olympique Lyonnais':'Olympique Lyonnais',
  'Olympique de Marseille':'Olympique de Marseille',
  'Paris FC':'Paris FC','Paris Saint-Germain FC':'Paris Saint-Germain',
  'RC Strasbourg Alsace':'RC Strasbourg Alsace',
  'Racing Club de Lens':'RC Lens','Stade Brestois 29':'Stade Brestois 29',
  'Stade Rennais FC 1901':'Stade Rennais FC','Toulouse FC':'Toulouse FC'
 }
};
const rowKey=(league:League,date:string,home:string,away:string)=>
 JSON.stringify([league,date,home,away]);
export const gameResultKey=(m:Pick<Match,'league'|'date'|'home'|'away'>)=>
 rowKey(m.league,m.date,m.home,m.away);

/** RFC4180 quotes, commas, escaped quotes. No naive split(',') bug. */
export function csvFields(s:string):string[]{
 const out:string[]=[];let cell='',quoted=false;
 for(let i=0;i<s.length;i++){
   const c=s[i];
   if(c==='"'){
     if(quoted&&s[i+1]==='"'){cell+='"';i++;}
     else quoted=!quoted;
   }else if(c===','&&!quoted){out.push(cell);cell='';}
   else cell+=c;
 }
 if(quoted)throw Error('SOCCER_ALT_RESULT_CSV_UNBALANCED_QUOTE');
 out.push(cell);return out;
}
const DAY=/^20\d\d-\d\d-\d\d$/;
const dateOK=(s:string)=>DAY.test(s)&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function parseAltResults(league:League,body:string):Match[]{
 if(body.length<80||body.length>900000)throw Error('SOCCER_ALT_RESULT_SOURCE_SIZE');
 const lines=body.replace(/\r/g,'').trim().split('\n').filter(Boolean);
 const columns=csvFields(lines[0]);
 for(const field of ['date','home','away','ft_home','ft_away','source'])
   if(!columns.includes(field))throw Error('SOCCER_ALT_RESULT_MISSING_FIELD_'+field);
 const idx=(name:string)=>columns.indexOf(name);
 const reverse=new Map<string,string>();
 const map=TEAM_TO_RESULTS[league];
 for(const [original,alias] of Object.entries(map)){
   if(reverse.has(alias))throw Error('SOCCER_ALT_TEAM_ALIAS_COLLISION');
   reverse.set(alias,original);
 }
 const out:Match[]=[];const seen=new Set<string>();
 for(const [i,line] of lines.slice(1).entries()){
   const cells=csvFields(line);
   if(cells.length!==columns.length)throw Error('SOCCER_ALT_MALFORMED_CSV_ROW_'+i);
   const date=cells[idx('date')],home=reverse.get(cells[idx('home')]),
         away=reverse.get(cells[idx('away')]),
         source=cells[idx('source')].trim(),
         h=cells[idx('ft_home')],a=cells[idx('ft_away')];
   // An unknown club name is NEVER guessed. Count in separate coverage
   // diagnostics; reject silently changing team membership.
   if(!home||!away||home===away)continue;
   if(!dateOK(date)||!source||!h||!a||! /^\d+$/.test(h)||!/^\d+$/.test(a)
      ||+h>35||+a>35)throw Error('SOCCER_ALT_RESULT_INVALID_VERIFIED_ROW');
   const key=rowKey(league,date,home,away);
   if(seen.has(key))throw Error('SOCCER_ALT_DUPLICATE_MATCH_RESULT');
   seen.add(key);
   out.push({league,season:'2026-27',date,home,away,
     homeGoals:+h,awayGoals:+a,
     source:'open-matchday/'+source+'/2627/'+SOURCE_2627[league]});
 }
 return out;
}
export function reconcileVerifiedResult(primary:Match|undefined,
    other:Match|undefined):{match:Match|null;reason:string}{
 if(primary&&other&&(
   primary.league!==other.league||primary.season!==other.season||
   primary.date!==other.date||primary.home!==other.home||primary.away!==other.away))
   return {match:null,reason:'INDEPENDENT_IDENTITY_CONFLICT'};
 if(primary&&primary.homeGoals!==null&&primary.awayGoals!==null){
   if(other&&(primary.homeGoals!==other.homeGoals||
               primary.awayGoals!==other.awayGoals))
     return {match:null,reason:'INDEPENDENT_FINAL_SCORE_CONFLICT'};
   return {match:primary,reason:'PRIMARY_FULL_TIME'};
 }
 if(other&&other.homeGoals!==null&&other.awayGoals!==null)
   return {match:other,reason:'SOURCE_VERIFIED_INDEPENDENT_FULL_TIME'};
 return {match:null,reason:'UNVERIFIED_FINAL'};
}
