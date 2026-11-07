import React from 'react';
import {EXPORT_HEIGHT,EXPORT_WIDTH} from '../lib/exportImage';
import {nbaV5MarketName,type V5GameCardData} from '../nba/v5ShareCard';

const green='#79FF48',muted='#A4B2B9';
const percent=(p:number)=>(p*100).toFixed(2)+'%';
const average=(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:2});
const eastern=(iso:string)=>new Intl.DateTimeFormat('en-US',{
 timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',
 hour:'numeric',minute:'2-digit',timeZoneName:'short'
}).format(new Date(iso)).toUpperCase();

export default function NbaV5GameShareCard({data,cardRef}:{
 data:V5GameCardData;cardRef?:React.Ref<HTMLDivElement>
}){
 const {game,picks}=data;
 return <div ref={cardRef} data-testid="nba-v5-game-share-poster" style={{
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
   <span style={{fontSize:18,fontWeight:800,letterSpacing:2,color:'#D9E7E0'}}>NBA <span style={{color:green}}>V5</span> · GAME CARD</span>
  </header>
  <div style={{height:122,paddingTop:23,boxSizing:'border-box'}}>
   <div style={{fontSize:32,fontWeight:900,letterSpacing:-.6,lineHeight:1.15,wordBreak:'break-word'}}>
    {game.away} <span style={{color:muted,fontWeight:500}}>at</span> {game.home}
   </div>
   <div style={{marginTop:10,fontSize:17,color:'#C6D2D5',letterSpacing:1}}>
    {eastern(game.tipoff_utc)}
   </div>
  </div>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
    height:56,boxSizing:'border-box',padding:'0 17px',background:'#17241E',
    border:'1px solid #304D39',borderRadius:13}}>
   <strong style={{fontSize:23,color:green,letterSpacing:1}}>TOP {picks.length} MODEL PROJECTIONS</strong>
   <span style={{fontSize:14,fontWeight:700,color:'#C0CEC8'}}>RANKED BY P(REACH) · INCL. DNP</span>
  </div>
  <section data-testid="nba-v5-share-top10" style={{marginTop:15,display:'grid',
    gridTemplateRows:'repeat(10, 76px)',gap:6}}>
   {picks.map(p=><div key={p.team_id+'|'+p.player_id+'|'+p.market}
       data-testid="nba-v5-share-pick" style={{
        display:'flex',gap:14,alignItems:'center',padding:'10px 18px',
        background:'#161E22',border:'1px solid #2C393B',borderRadius:11,
        boxSizing:'border-box',minWidth:0
       }}>
    <span style={{width:47,flexShrink:0,fontSize:30,fontWeight:900,color:green}}>#{p.rank}</span>
    <div style={{minWidth:0,flex:1}}>
     <div style={{fontSize:23,fontWeight:900,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.player}</div>
     <div style={{marginTop:4,fontSize:18,color:'#CFD9DA'}}>
      <b style={{color:'#fff'}}>{p.target}+ {nbaV5MarketName(p.market)}</b>
      <span style={{fontSize:14,color:muted}}> · MEAN {average(p.mean)}</span>
     </div>
    </div>
    <div style={{textAlign:'right',flexShrink:0}}>
     <strong style={{fontSize:31,color:green,fontVariantNumeric:'tabular-nums'}}>{percent(p.chance)}</strong>
     <div style={{fontSize:12,color:muted}}>INCLUDING DNP</div>
    </div>
   </div>)}
   {picks.length<10&&<div style={{fontSize:25,color:'#F6B8A2',padding:22,
    gridRow:'span '+Math.max(1,10-picks.length)}}>
    Only {picks.length} projections passed the source's existing participation and meaningful-count checks. No picks are fabricated.
   </div>}
  </section>
  <footer style={{position:'absolute',left:44,right:44,bottom:36,
      borderTop:'1px solid #344140',paddingTop:15}}>
   <div style={{fontSize:15,fontWeight:800,color:'#D4E6D6'}}>
    PREGAME MODEL SNAPSHOT · {eastern(data.forecastAtUtc)}
   </div>
   <p style={{fontSize:15,color:muted,lineHeight:1.4,margin:'7px 0 0'}}>
    Probabilities are uncalibrated model estimates, not verified sportsbook prices or betting recommendations.
    Same-game outcomes are correlated; no parlay hit probability is implied.
   </p>
  </footer>
 </div>;
}
