import React from 'react';
import {EXPORT_HEIGHT,EXPORT_WIDTH} from '../lib/exportImage';
import type {NflPrecisionPoster} from '../nfl/precisionShare';
const green='#79FF48',muted='#A4B2B9';
const fmt=(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:1});
const pct=(v:number)=>(v*100).toFixed(1)+'%';
const et=(iso:string)=>new Intl.DateTimeFormat('en-US',{
 timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',
 hour:'numeric',minute:'2-digit',timeZoneName:'short'
}).format(new Date(iso)).toUpperCase();
const market=(s:string)=>s==='rushing_yards'?'RUSH YDS':'REC YDS';

/** NBA V5 appearance, NFL model-derived meaningful yardage threshold
 * events. Same exact target and percentage as the compact game tiles.
 * No sportsbook lines, DNP-inclusive probabilities or ±10-yard bands.
 */
export default function NflPrecisionGameShareCard({data,cardRef}:{
 data:NflPrecisionPoster;cardRef?:React.Ref<HTMLDivElement>
}){
 const {game,picks}=data;
 return <div ref={cardRef} data-testid="nfl-top10-share-poster" style={{
  width:EXPORT_WIDTH,height:EXPORT_HEIGHT,boxSizing:'border-box',
  position:'relative',overflow:'hidden',padding:'38px 44px',
  fontFamily:'Arial, Helvetica, sans-serif',background:'#090D10',
  color:'#F0F4F5',lineHeight:1.12,isolation:'isolate'
 }}>
  <div aria-hidden="true" style={{position:'absolute',inset:0,zIndex:-1,
   background:'radial-gradient(ellipse at 6% 10%, #1a543943, transparent 40%), radial-gradient(ellipse at 94% 40%, #2b54743d, transparent 54%)'}}/>
  <header style={{height:72,display:'flex',alignItems:'center',
    justifyContent:'space-between',borderBottom:'1px solid #344140'}}>
   <b style={{fontSize:39,letterSpacing:-2}}>PROP <span style={{color:green}}>EDGE</span></b>
   <span style={{fontSize:18,fontWeight:800,letterSpacing:2,color:'#D9E7E0'}}>NFL · WEEK {data.week} · GAME CARD</span>
  </header>
  <div style={{height:122,paddingTop:23,boxSizing:'border-box'}}>
   <div style={{fontSize:32,fontWeight:900,letterSpacing:-.6,lineHeight:1.15,wordBreak:'break-word'}}>
    {game.away||game.teams[0]} <span style={{color:muted,fontWeight:500}}>at</span> {game.home||game.teams[1]}
   </div>
   <div style={{marginTop:10,fontSize:17,color:'#C6D2D5',letterSpacing:1}}>{et(game.kickoff_utc)}</div>
  </div>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
   height:56,boxSizing:'border-box',padding:'0 17px',background:'#17241E',
   border:'1px solid #304D39',borderRadius:13}}>
   <strong style={{fontSize:23,color:green,letterSpacing:1}}>TOP {picks.length} MODEL PROJECTIONS</strong>
   <span style={{fontSize:14,fontWeight:700,color:'#C0CEC8'}}>RANKED BY HIGHEST QUALIFIED MODEL CHANCE</span>
  </div>
  <section data-testid="nfl-top10-share-rows" style={{marginTop:15,display:'grid',
   gridTemplateRows:'repeat(10, 76px)',gap:6}}>
   {picks.map(p=><div key={p.team+'|'+p.player+'|'+p.market}
     data-testid="nfl-top10-share-pick" style={{
     display:'flex',gap:14,alignItems:'center',padding:'10px 18px',
     background:'#161E22',border:'1px solid #2C393B',borderRadius:11,
     boxSizing:'border-box',minWidth:0
   }}>
    <span style={{width:47,flexShrink:0,fontSize:30,fontWeight:900,color:green}}>#{p.rank}</span>
    <div style={{minWidth:0,flex:1}}>
     <div style={{fontSize:23,fontWeight:900,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.player}</div>
     <div style={{marginTop:4,fontSize:18,color:'#CFD9DA'}}>
      <b style={{color:'#fff'}}>{p.projectedYards} {market(p.market)}</b>
      <span style={{fontSize:14,color:muted}}> · MEAN {fmt(p.meanYards)}</span>
     </div>
    </div>
    <div style={{textAlign:'right',flexShrink:0}}>
     <strong style={{fontSize:31,color:green,fontVariantNumeric:'tabular-nums'}}>{pct(p.reach)}</strong>
     <div style={{fontSize:12,color:muted}}>P(REACH TARGET)</div>
    </div>
   </div>)}
   {picks.length<10&&<div style={{fontSize:25,color:'#F6B8A2',padding:22,
    gridRow:'span '+Math.max(1,10-picks.length)}}>
    Only {picks.length} source-matched player projections qualified. No filler picks were added.
   </div>}
  </section>
  <footer style={{position:'absolute',left:44,right:44,bottom:36,
    borderTop:'1px solid #344140',paddingTop:15}}>
   <div style={{fontSize:15,fontWeight:800,color:'#D4E6D6'}}>
    ORIGINAL PREGAME SNAPSHOT · {et(data.forecastAtUtc)}
   </div>
   <p style={{fontSize:15,color:muted,lineHeight:1.4,margin:'7px 0 0'}}>
    P(reach) is the uncalibrated chance of reaching the shown meaningful yardage
    target from the player's 10,000+ simulations, not including DNP risk.
    No sportsbook lines; active status unverified. Same-game outcomes are correlated.
   </p>
  </footer>
 </div>;
}
