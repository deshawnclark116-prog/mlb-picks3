/** NBA V5 game-specific image card data.
 * Consumes the SAME unfiltered, probability-ranked prediction list shown by
 * the NBA screen; no sportsbook, low-target substitution, odds or reranking.
 */
export type V5ShareGame={
  game_id:string;away:string;home:string;tipoff_utc:string;forecast_at_utc:string;
  forecast_kind?:string;
};
export type V5ShareInput={
  row:{
    player:string;player_id:string;team_id:string;market:string;
    mean:number;p_active:number;reported_status:string;
    starter_evidence?:'CONFIRMED_STARTER'|'CONFIRMED_NONSTARTER'|'NOT_VERIFIED';
    reach_probabilities?:{
      whole_projection:number;probability_if_playing:number;
      probability_including_dnp:number;forward_calibrated:boolean;
    };
  };
  whole:number;prob:number|null;
};
export type V5CardPick={
  rank:number;player:string;player_id:string;team_id:string;market:string;
  target:number;mean:number;chance:number;ifPlaying:number;pActive:number;
};
export type V5GameCardData={
  game:V5ShareGame;picks:V5CardPick[];forecastAtUtc:string;
  model:'V5';probabilityCalibrated:false;bookmakerLinesVerified:false;
};
const ALLOWED=new Set(['points','rebounds','assists','three_pointers_made','steals','blocks']);
const validProb=(n:number)=>Number.isFinite(n)&&n>=0&&n<=1;
export const nbaV5MarketName=(market:string)=>({
  points:'POINTS',rebounds:'REBOUNDS',assists:'ASSISTS',
  three_pointers_made:'THREES',steals:'STEALS',blocks:'BLOCKS'
} as Record<string,string>)[market]||market.toUpperCase();
export function nbaV5GameCardData(game:V5ShareGame,orderedUnfilteredPicks:readonly V5ShareInput[]):V5GameCardData{
  if(game.forecast_kind!=='V5_LATEST')
    throw Error('NBA_V5_SHARE_REQUIRES_ACTUAL_PUBLISHED_V5_GAME');
  const tip=Date.parse(game.tipoff_utc),at=Date.parse(game.forecast_at_utc);
  if(!Number.isFinite(tip)||!Number.isFinite(at)||at>=tip)
    throw Error('NBA_V5_SHARE_REQUIRES_ORIGINAL_PRETIP_FORECAST');
  const seen=new Set<string>();
  const picks:V5CardPick[]=[];
  for(const item of orderedUnfilteredPicks){
    const row=item.row,reach=row.reach_probabilities;
    // V5 share cards must NEVER borrow the conditional-on-playing CDF
    // or V3/V4 target probability as an apparently all-scenarios chance.
    if(!ALLOWED.has(row.market)||row.starter_evidence!=='CONFIRMED_STARTER'||
       row.reported_status==='OUT'||row.p_active<.75||
       !reach||reach.whole_projection!==item.whole||
       !Number.isInteger(item.whole)||item.whole<1||
       !Number.isFinite(row.mean)||row.mean<0||
       !validProb(reach.probability_if_playing)||
       !validProb(reach.probability_including_dnp)||
       !validProb(row.p_active))continue;
    const key=[row.team_id,row.player_id,row.market].join('|');
    if(seen.has(key))throw Error('NBA_V5_SHARE_DUPLICATE_PLAYER_MARKET');
    seen.add(key);
    // The input is already the canonical NBA board's descending ranking.
    // Preserve its actual order and repeated players with DIFFERENT stats.
    picks.push({
      rank:picks.length+1,player:row.player,player_id:row.player_id,
      team_id:row.team_id,market:row.market,target:item.whole,
      mean:row.mean,chance:reach.probability_including_dnp,
      ifPlaying:reach.probability_if_playing,pActive:row.p_active
    });
    if(picks.length===10)break;
  }
  return {
    game,picks,forecastAtUtc:game.forecast_at_utc,
    model:'V5',probabilityCalibrated:false,bookmakerLinesVerified:false
  };
}
const clean=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'team';
export function nbaV5GameCardFilename(data:V5GameCardData){
  return 'prop-edge-nba-v5-'+clean(data.game.away)+'-'+clean(data.game.home)+
    '-top10-'+data.game.tipoff_utc.slice(0,10)+'.png';
}
