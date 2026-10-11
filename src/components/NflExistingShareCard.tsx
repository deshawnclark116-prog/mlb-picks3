import React from 'react';
import {teamBrand} from '../nfl/teamBrand';
import type {ExistingNflGame} from '../nfl/existing';
import type {RoleCheckedSelection} from '../nfl/roleSupportedNfl';
import {EXPORT_WIDTH,EXPORT_HEIGHT} from '../lib/exportImage';
type PosterProps={game:ExistingNflGame;week:number;mode:'system'|'bettable';cardRef?:React.Ref<HTMLDivElement>;
  selections:RoleCheckedSelection[];sourceStatus:string;checkedAt?:string};
const green='#79FF48',muted='#9FABB0';
const fmt=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:1});
/** Only a real current two-way FanDuel quote permits a model lean to appear.
 * This card NEVER substitutes workload stability for calibrated probability.
 */
export default function NflExistingShareCard({game,week,mode,cardRef,selections,sourceStatus,checkedAt}:PosterProps){
 const away=teamBrand(game.away||game.teams[0]),home=teamBrand(game.home||game.teams[1]);
 const kickoff=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(game.kickoff_utc)).toUpperCase();
 const core=selections.slice(0,6);
 return <div ref={cardRef} data-testid="game-share-poster" style={{width:EXPORT_WIDTH,height:EXPORT_HEIGHT,padding:44,boxSizing:'border-box',fontFamily:'Arial, Helvetica, sans-serif',background:'#090D10',color:'#F0F4F5',position:'relative',overflow:'hidden'}}>
   <div style={{position:'absolute',inset:0,pointerEvents:'none',background:`radial-gradient(ellipse at 10% 20%, ${away.primary}35, transparent 42%), radial-gradient(ellipse at 85% 18%, ${home.primary}30, transparent 48%)`}}/>
   <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #334045',paddingBottom:24}}>
    <b style={{fontSize:42,letterSpacing:-2}}>PROP <span style={{color:green}}>EDGE</span></b>
    <div style={{fontSize:17,textAlign:'right',color:muted}}>NFL · WEEK {week}<p style={{fontSize:13,marginTop:8}}>ROLE CHECKED · NO CALIBRATED BET</p></div>
   </div>
   <div style={{position:'relative',padding:'64px 0 36px',textAlign:'center',borderBottom:'1px solid #334045'}}>
    <div style={{fontSize:86,fontWeight:900,display:'flex',justifyContent:'space-between',alignItems:'center',letterSpacing:-2}}>
      <span style={{color:'#fff',textShadow:`0 0 35px ${away.primary}44`}}>{away.abbreviation}</span><span style={{fontSize:25,color:muted,letterSpacing:3}}>VS</span><span style={{textShadow:`0 0 35px ${home.primary}44`}}>{home.abbreviation}</span>
    </div>
    <div style={{marginTop:18,fontSize:20,color:'#C3CED3'}}>{kickoff}</div>
   </div>
   <div style={{position:'relative',padding:'24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
     <strong style={{fontSize:30}}>{mode==='system'?'ROLE-SUPPORTED MODEL PROJECTIONS':'NO CERTIFIED BETTING EDGES'}</strong>
     <span style={{fontSize:16,color:muted}}>{core.length} ROLE-CHECKED LINES · FANDUEL</span>
   </div>
   {core.length>0?<div data-testid="existing-poster-projections" style={{position:'relative',display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'repeat(3, 168px)',gap:12}}>
      {core.map(({projection:p,quote:q,side,odds,role:r})=><div key={p.team+'|'+p.player_id+'|'+p.market} style={{border:'1px solid #31413C',borderRadius:16,background:'#192326',padding:18,overflow:'hidden'}}>
       <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:14,color:muted}}>
         <span>{p.team} · {p.market==='rushing_yards'?'RUSH YDS':'REC YDS'}</span>
         <span style={{fontWeight:800,color:green}}>ROLE HISTORY VERIFIED</span>
       </div>
       <div style={{fontSize:22,fontWeight:800,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginTop:9}}>{p.player}</div>
       <div style={{fontSize:38,fontWeight:900,color:green,marginTop:6}}>{mode==='system'?fmt(p.projected_median):side+' '+fmt(q.line)} <span style={{fontSize:15}}>{mode==='system'?'YDS':''}</span></div>
       <div style={{fontSize:13,color:muted,marginTop:5}}>
           Past 3: {fmt(r.recent_opportunities_per_observed_game!)} {p.market==='rushing_yards'?'carries':'targets'}/game · {Math.round(r.recent_team_share!*100)}% team
         </div>
         <div style={{fontSize:12,color:muted,marginTop:3}}>FanDuel {side} {fmt(q.line)} · {odds>0?'+':''}{odds}</div>
      </div>)}
    </div>:<div data-testid="existing-poster-no-lines" style={{position:'relative',background:'#192326',borderRadius:18,border:'1px solid #31413C',height:520,padding:55,display:'flex',flexDirection:'column',justifyContent:'center'}}>
      <h2 style={{fontSize:43,lineHeight:1.1,margin:0}}>{mode==='bettable'?'NO CALIBRATED BETTING SELECTIONS':'NO ROLE-SUPPORTED FEATURED PROJECTIONS'}</h2>
      <p style={{fontSize:24,color:'#A8B6BE',lineHeight:1.5}}>Market status: {sourceStatus}. A sportsbook line alone does not prove a correct prediction. Missing role evidence or uncalibrated probabilities cannot be called recommended bets.</p>
    </div>}
   <footer style={{position:'absolute',bottom:38,left:44,right:44,borderTop:'1px solid #334045',paddingTop:22}}>
     <p style={{fontSize:19,fontWeight:900,color:green,margin:'0 0 12px'}}>FANDUEL QUOTES CHECKED {checkedAt||'UNAVAILABLE'}</p>
     <p style={{color:muted,fontSize:16,lineHeight:1.45}}>Source-checked prior roles are not confirmation of today's starter, injury-adjusted workload or active game status. Book line and historical role are NOT a calibrated P(win) or verified edge. No official wagers are selected.</p>
   </footer>
 </div>;
}
