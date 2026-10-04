import React from 'react';
import type {PosterPresentation} from '../nfl/posterAssets';
/** Fixed hero bounds keep zero-to-four optional cutouts away from the picks. */
export default function NflPosterHero({visual,kickoff}:{visual:PosterPresentation;kickoff:string}) {
 const premium=visual.theme==='premium';
 return <section data-testid="poster-hero" style={{height:310,position:'relative',overflow:'hidden',margin:'22px 0 18px',borderRadius:22,border:'1px solid #ffffff20',background:premium?`linear-gradient(110deg,${visual.away.primary}55,#101a20 45%,${visual.home.primary}55)`:'#172126'}}>
  {visual.background && <img alt="" data-testid="poster-art" src={visual.background} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.38}}/>}
  <div aria-hidden="true" style={{position:'absolute',inset:0,background:'linear-gradient(0deg,#080e12 0%,transparent 55%,#080e1244)',pointerEvents:'none'}}/>
  {premium && <div aria-hidden="true" style={{position:'absolute',left:0,right:0,bottom:0,height:65,background:'repeating-linear-gradient(90deg,transparent 0,transparent 89px,#ffffff0b 90px,transparent 92px)',transform:'perspective(120px) rotateX(35deg)',borderTop:'1px solid #ffffff14'}}/>}
  <div style={{position:'absolute',top:18,left:0,right:0,textAlign:'center',fontSize:12,letterSpacing:4,fontWeight:700,color:'#b6c2c8'}}>THE MATCHUP</div>
  {([visual.away,visual.home] as const).map((team,side)=>{
   const players=visual.players.filter(p=>p.team===team.abbreviation);
   return <div key={side} style={{position:'absolute',top:44,bottom:48,width:'44%',left:side===0?'2%':'54%',textAlign:'center'}}>
    <div aria-hidden="true" style={{position:'absolute',top:-10,left:0,right:0,color:'#ffffff06',fontSize:160,fontWeight:900,letterSpacing:-10}}>{team.abbreviation}</div>
    <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',gap:18}}>
     <div style={{flexShrink:0,position:'relative',zIndex:2}}>
      {team.logo?<img data-testid="poster-logo" alt={`${team.name} logo`} src={team.logo} style={{display:'block',margin:'0 auto',width:players.length?100:116,height:players.length?100:116,objectFit:'contain',filter:premium?'drop-shadow(0 8px 14px #0008)':undefined}}/>:<div data-testid="poster-logo-fallback" style={{height:116,display:'grid',placeItems:'center',fontSize:54,fontWeight:900,color:team.text}}>{team.abbreviation}</div>}
      <div style={{fontSize:72,fontWeight:900,letterSpacing:-4,marginTop:2}}>{team.abbreviation}</div>
     </div>
     {!!players.length && <div data-testid="poster-player-slots" style={{position:'relative',height:206,width:players.length===1?140:190,flexShrink:0}}>{players.map((player,i)=><img key={player.src} alt={player.name} src={player.src} style={{position:'absolute',bottom:0,left:players.length===1?0:i*65,width:140,height:206,objectFit:'contain',objectPosition:'bottom'}}/>)}</div>}
    </div>
    <div style={{position:'absolute',bottom:0,left:0,right:0,color:'#d3dce0',fontSize:17,fontWeight:700}}>{team.name}</div>
   </div>;
  })}
  <div style={{position:'absolute',left:'47%',top:130,width:'6%',textAlign:'center',fontSize:24,fontWeight:900,color:'#b3c0c8'}}>@</div>
  <div style={{position:'absolute',bottom:13,left:0,right:0,textAlign:'center',fontSize:18,fontWeight:700,letterSpacing:2,color:'#dbe5e9'}}>{kickoff}</div>
 </section>;
}
