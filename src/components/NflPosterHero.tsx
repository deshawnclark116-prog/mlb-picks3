import React from 'react';
import type {PosterPresentation} from '../nfl/posterAssets';
import {CityScene,GenericFootballHero} from './NflPosterArtwork';
export default function NflPosterHero({visual,kickoff}:{visual:PosterPresentation;kickoff:string}) {
 const premium=visual.theme==='premium';
 return <section data-testid="poster-hero" style={{height:premium?350:270,position:'relative',overflow:'hidden',margin:'18px 0',borderRadius:22,border:'1px solid #ffffff20',background:premium?`radial-gradient(ellipse at 10% 40%,${visual.away.primary}aa,transparent 55%),radial-gradient(ellipse at 90% 40%,${visual.home.primary}aa,transparent 55%),#0a121a`:'#172126'}}>
  {visual.atmosphere && <CityScene motif={visual.atmosphere.motif} color={visual.home.secondary}/>}
  {visual.background && <img alt="" data-testid="poster-art" src={visual.background} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.23}}/>}
  <div aria-hidden="true" style={{position:'absolute',inset:0,background:'linear-gradient(0deg,#080e12 0%,transparent 60%,#080e1244)',pointerEvents:'none'}}/>
  <div style={{position:'absolute',top:14,left:0,right:0,textAlign:'center',fontSize:12,letterSpacing:4,fontWeight:700,color:'#b6c2c8'}}>{visual.atmosphere?.city.toUpperCase()??'THE MATCHUP'} · GAME NIGHT</div>
  {([visual.away,visual.home] as const).map((team,side)=>{
   const players=visual.players.filter(p=>p.team===team.abbreviation);
   return <div key={side} style={{position:'absolute',top:42,bottom:50,width:'44%',left:side===0?'2%':'54%',textAlign:'center'}}>
    <div aria-hidden="true" style={{position:'absolute',top:0,left:0,right:0,color:'#ffffff09',fontSize:160,fontWeight:900,letterSpacing:-10}}>{team.abbreviation}</div>
    {premium && !!players.length && <div data-testid="poster-player-slots" style={{position:'absolute',inset:'10px 0 20px',display:'flex',justifyContent:side===0?'flex-end':'flex-start',alignItems:'flex-end'}}>{players.map((player,i)=><div key={player.key} data-player-key={player.key} style={{position:'relative',width:150,height:i===0?250:225,marginLeft:i?-35:0,flexShrink:0,zIndex:2-i,opacity:i===0?1:.82}}>
     {player.src?<img alt={`Verified cutout: ${player.name}`} src={player.src} style={{width:'100%',height:'100%',objectFit:'contain',objectPosition:'bottom',filter:`drop-shadow(0 0 15px ${team.primary})`}}/>:<GenericFootballHero color={team.primary} variant={side+i}/>}
    </div>)}</div>}
    <div style={{position:'absolute',top:premium?50:12,left:side===0?4:undefined,right:side===1?4:undefined,width:premium?145:'100%',zIndex:3}}>
     {team.logo?<img data-testid="poster-logo" alt={`${team.name} logo`} src={team.logo} style={{display:'block',margin:'0 auto',width:premium?88:100,height:premium?88:100,objectFit:'contain',filter:'drop-shadow(0 5px 8px #000a)'}}/>:<div data-testid="poster-logo-fallback" style={{height:90,display:'grid',placeItems:'center',fontSize:45,fontWeight:900}}>{team.abbreviation}</div>}
     <div style={{fontSize:premium?64:68,fontWeight:900,letterSpacing:-3,textShadow:'0 4px 20px #000'}}>{team.abbreviation}</div>
    </div>
    <div style={{position:'absolute',bottom:0,left:0,right:0,color:'#d3dce0',fontSize:16,fontWeight:700}}>{team.name}{premium && <div style={{fontSize:10,letterSpacing:.5,color:'#a3b4bf',marginTop:4,textTransform:'uppercase'}}>{players.map(p=>p.name).join(' · ')}</div>}</div>
   </div>;
  })}
  <div style={{position:'absolute',left:'47%',top:premium?160:120,width:'6%',textAlign:'center',fontSize:24,fontWeight:900,color:'#d6e3eb'}}>@</div>
  {premium && <div style={{position:'absolute',bottom:37,left:0,right:0,textAlign:'center',fontSize:10,letterSpacing:1,color:'#91a4b1'}}>FEATURED SYSTEM PLAYERS · GENERIC FIGURES ARE NOT PLAYER LIKENESSES</div>}
  <div style={{position:'absolute',bottom:12,left:0,right:0,textAlign:'center',fontSize:18,fontWeight:700,letterSpacing:2,color:'#dbe5e9'}}>{kickoff}</div>
 </section>;
}
