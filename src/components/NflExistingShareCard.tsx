import React from 'react';
import {teamBrand} from '../nfl/teamBrand';
import type {ExistingNflGame} from '../nfl/existing';
import {EXPORT_WIDTH,EXPORT_HEIGHT} from '../lib/exportImage';
type PosterProps={game:ExistingNflGame;week:number;mode:'system'|'bettable';cardRef?:React.Ref<HTMLDivElement>};
const green='#79FF48',muted='#9FABB0';
const fmt=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:1});
/** A dedicated 1080x1350 card. Do not convert a yard projection into a 65% target or sportsbook bet. */
export default function NflExistingShareCard({game,week,mode,cardRef}:PosterProps){
 const away=teamBrand(game.away||game.teams[0]),home=teamBrand(game.home||game.teams[1]);
 const kickoff=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(game.kickoff_utc)).toUpperCase();
 const core=game.projections.slice(0,6);
 return <div ref={cardRef} data-testid="game-share-poster" style={{width:EXPORT_WIDTH,height:EXPORT_HEIGHT,padding:44,boxSizing:'border-box',fontFamily:'Arial, Helvetica, sans-serif',background:'#090D10',color:'#F0F4F5',position:'relative',overflow:'hidden'}}>
   <div style={{position:'absolute',inset:0,pointerEvents:'none',background:`radial-gradient(ellipse at 10% 20%, ${away.primary}35, transparent 42%), radial-gradient(ellipse at 85% 18%, ${home.primary}30, transparent 48%)`}}/>
   <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #334045',paddingBottom:24}}>
    <b style={{fontSize:42,letterSpacing:-2}}>PROP <span style={{color:green}}>EDGE</span></b>
    <div style={{fontSize:17,textAlign:'right',color:muted}}>NFL · WEEK {week}<p style={{fontSize:13,marginTop:8}}>EXISTING MODEL · UNVALIDATED</p></div>
   </div>
   <div style={{position:'relative',padding:'64px 0 36px',textAlign:'center',borderBottom:'1px solid #334045'}}>
    <div style={{fontSize:86,fontWeight:900,display:'flex',justifyContent:'space-between',alignItems:'center',letterSpacing:-2}}>
      <span style={{color:'#fff',textShadow:`0 0 35px ${away.primary}44`}}>{away.abbreviation}</span><span style={{fontSize:25,color:muted,letterSpacing:3}}>VS</span><span style={{textShadow:`0 0 35px ${home.primary}44`}}>{home.abbreviation}</span>
    </div>
    <div style={{marginTop:18,fontSize:20,color:'#C3CED3'}}>{kickoff}</div>
   </div>
   <div style={{position:'relative',padding:'24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
     <strong style={{fontSize:30}}>{mode==='system'?'MODEL PLAYER PROJECTIONS':'BETTABLE NOW'}</strong>
     <span style={{fontSize:16,color:muted}}>{mode==='system'?`${game.projections.length} MODEL STATS`:'0 VERIFIED MARKETS'}</span>
   </div>
   {mode==='system'?<div data-testid="existing-poster-projections" style={{position:'relative',display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'repeat(3, 168px)',gap:12}}>
      {core.map(p=><div key={p.team+'|'+p.player_id+'|'+p.market} style={{border:'1px solid #31413C',borderRadius:16,background:'#192326',padding:18,overflow:'hidden'}}>
       <div style={{fontSize:15,color:muted}}>{p.team} · {p.market==='rushing_yards'?'RUSHING YARDS':'RECEIVING YARDS'}</div>
       <div style={{fontSize:23,fontWeight:800,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginTop:12}}>{p.player}</div>
       <div style={{fontSize:45,fontWeight:900,color:green,marginTop:12}}>{fmt(p.projected_median)} <span style={{fontSize:18}}>YDS</span></div>
       <div style={{fontSize:14,color:muted,marginTop:4}}>Model range {fmt(p.projected_low)}–{fmt(p.projected_high)}</div>
      </div>)}
      {!core.length&&<div style={{gridColumn:'1 / -1',padding:40,background:'#192326',borderRadius:18,fontSize:32}}>No qualifying numerical player projections for this matchup.</div>}
    </div>:<div data-testid="existing-poster-no-lines" style={{position:'relative',background:'#192326',borderRadius:18,border:'1px solid #31413C',height:520,padding:55,display:'flex',flexDirection:'column',justifyContent:'center'}}>
      <h2 style={{fontSize:47,lineHeight:1.1,margin:0}}>NO VERIFIED SPORTSBOOK MARKETS</h2>
      <p style={{fontSize:24,color:'#A8B6BE',lineHeight:1.5}}>This model supplies real player yardage projections, not validated betting selections. No sportsbook line or odds have been verified for this export.</p>
    </div>}
   <footer style={{position:'absolute',bottom:38,left:44,right:44,borderTop:'1px solid #334045',paddingTop:22}}>
     <p style={{fontSize:19,fontWeight:900,color:green,margin:'0 0 12px'}}>{mode==='system'?'NUMERICAL MODEL PROJECTIONS · NO SPORTSBOOK INPUTS':'NO VERIFIED EXECUTION · DO NOT PRESENT AS A BET'}</p>
     <p style={{color:muted,fontSize:16,lineHeight:1.45}}>Existing weekly model · Numbers are model estimates, not guarantees, 65% targets or verified betting edges. Generated strictly from previously published game-day data.</p>
   </footer>
 </div>;
}
