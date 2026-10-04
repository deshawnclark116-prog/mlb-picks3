import React from 'react';
import {OUTCOMES,formatET} from '../nfl/phase1';
import {targetText} from '../nfl/bettable';
import {shortModelVersion,type GameShareData,type SharePick} from '../nfl/shareCard';
import type {PosterPresentation} from '../nfl/posterAssets';
import {CityScene,GenericFootballHero} from './NflPosterArtwork';
const green='#79FF48',white='#F3F6F7',muted='#A6B4BE';
const caps:React.CSSProperties={fontWeight:800,letterSpacing:2,textTransform:'uppercase'};
const pct=(p:number)=>`${(p*100).toFixed(1)}%`;
function Execution({pick}:{pick:SharePick}) {
 const e=pick.execution;if(!e)return null;
 return <div style={{marginTop:3,fontSize:12,lineHeight:1.2,maxWidth:620,color:'#B9C7CE'}}>AVAILABLE · {e.book} {e.kind==='over'?`OVER ${e.line}`:targetText(pick,true)} · {e.odds>0?'+':''}{e.odds}</div>;
}
/** PREMIUM only: one layered canvas. CLEAN remains in NflGameShareCard. */
export default function NflPremiumPoster({data,visual,kickoff,cardRef}:{data:GameShareData;visual:PosterPresentation;kickoff:string;cardRef?:React.Ref<HTMLDivElement>}) {
 const {away,home}=visual,top=data.core[0];
 return <div ref={cardRef} data-testid="game-share-poster" data-theme="premium" style={{width:1080,height:1350,position:'relative',overflow:'hidden',isolation:'isolate',boxSizing:'border-box',background:'#070D13',color:white,fontFamily:'Arial, Helvetica, sans-serif',lineHeight:1.1}}>
  <div data-testid="premium-environment" aria-hidden="true" style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 16% 27%,${away.primary}bb,transparent 53%),radial-gradient(ellipse at 92% 25%,${home.primary}bb,transparent 54%),radial-gradient(ellipse at 50% 40%,#40566499,transparent 45%),#070D13`}}>
   <div style={{position:'absolute',left:-80,right:-80,top:155,height:590}}>{visual.atmosphere && <CityScene motif={visual.atmosphere.motif} color={home.secondary}/>}</div>
   {visual.background && <img data-testid="poster-art" alt="" src={visual.background} style={{position:'absolute',left:0,top:140,width:1080,height:650,objectFit:'cover',opacity:.32}}/>}
   <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(115deg,transparent 0px,transparent 82px,#ffffff04 83px,transparent 85px),radial-gradient(ellipse at 50% 20%,transparent 25%,#03070ba8 90%)'}}/>
   <div style={{position:'absolute',left:-80,top:125,width:850,height:520,background:'linear-gradient(135deg,#deefff25,transparent 42%)',transform:'rotate(-13deg)'}}/>
   <div style={{position:'absolute',right:-80,top:125,width:850,height:520,background:'linear-gradient(225deg,#deefff20,transparent 42%)',transform:'rotate(13deg)'}}/>
   <div style={{position:'absolute',inset:'580px 0 0',background:'linear-gradient(0deg,#060b10 20%,#060b10e8 66%,transparent)'}}/>
  </div>
  <header style={{position:'absolute',top:30,left:44,right:44,display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:6}}>
   <div style={{fontSize:32,fontWeight:900,letterSpacing:-1}}>PROP <span style={{color:green}}>EDGE</span><span style={{fontSize:11,letterSpacing:2,marginLeft:15,color:muted}}>NFL OUTCOME ENGINE</span></div>
   <div style={{...caps,fontSize:13,color:'#C5D0D7',textAlign:'right'}}>NFL · WEEK {data.week??'—'} · {data.horizon}<div style={{fontSize:10,marginTop:6}}>SHADOW / RESEARCH</div></div>
  </header>
  <section data-testid="poster-hero" aria-label={`${away.abbreviation} vs ${home.abbreviation}`} style={{position:'absolute',left:0,right:0,top:75,height:580}}>
   {([away,home] as const).map((team,side)=>{
    const players=visual.players.filter(p=>p.team===team.abbreviation);
    const primary=players[0],pick=data.core.find(p=>p.row.team===team.abbreviation&&p.row.player===primary?.name);
    return <React.Fragment key={side}>
     {team.logo && <img data-testid="poster-team-watermark" alt="" src={team.logo} style={{position:'absolute',left:side===0?-60:770,top:135,width:365,height:365,objectFit:'contain',opacity:.16,transform:`rotate(${side===0?-13:13}deg)`}}/>}
     {!!players.length && <div data-testid="poster-player-slots" style={{position:'absolute',left:side===0?-35:575,top:175,width:540,height:400}}>
      {[...players].reverse().map((player,reversed)=>{
       const index=players.length-1-reversed,lead=index===0;
       return <div key={player.key} data-player-key={player.key} data-testid={lead?'premium-primary-hero':'premium-secondary-hero'} style={{position:'absolute',left:side===0?(lead?0:225):(lead?180:0),top:lead?-30:70,width:lead?365:250,height:lead?590:435,opacity:lead?1:.55,filter:`drop-shadow(0 14px 25px #000) drop-shadow(0 0 22px ${team.primary}b0)`}}>
        {player.src?<img alt={`Verified cutout: ${player.name}`} src={player.src} style={{width:'100%',height:'100%',objectFit:'contain',objectPosition:'top'}}/>:<GenericFootballHero color={team.primary} variant={side+index} artwork={visual.genericArtwork}/>}
       </div>;
      })}
     </div>}
     <div style={{position:'absolute',left:side===0?44:590,top:8,width:446,zIndex:4}}>
      <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:side===0?'flex-start':'flex-end'}}>{team.logo?<img data-testid="poster-logo" alt={`${team.name} logo`} src={team.logo} style={{width:58,height:58,objectFit:'contain',filter:'drop-shadow(0 4px 8px #000)'}}/>:<span data-testid="poster-logo-fallback" style={{fontSize:26,fontWeight:900}}>{team.abbreviation}</span>}<span style={{...caps,fontSize:17,color:'#DCE5EA'}}>{team.name}</span></div>
      <div style={{fontSize:160,fontWeight:900,letterSpacing:-10,lineHeight:.9,textAlign:side===0?'left':'right',textShadow:`0 5px 0 #0008,0 0 55px ${team.primary}`}}>{team.abbreviation}</div>
     </div>
     {primary && <div data-testid="hero-pick-connection" style={{position:'absolute',left:side===0?44:630,top:465,width:406,zIndex:5,textAlign:side===0?'left':'right',textShadow:'0 2px 10px #000'}}>
      <div style={{...caps,fontSize:23}}>{primary.name}</div>
      {pick && <div style={{fontSize:21,color:green,fontWeight:800,marginTop:7}}>{targetText(pick,true)} · {pct(pick.target.probability)}</div>}
     </div>}
    </React.Fragment>;
   })}
   <div style={{position:'absolute',left:475,top:91,width:130,zIndex:5,textAlign:'center',fontSize:42,fontWeight:900,fontStyle:'italic',color:'#9EAEB9'}}>VS</div>
   <div style={{position:'absolute',left:330,right:330,top:222,zIndex:5,textAlign:'center',fontSize:23,...caps,color:'#D2DDE5',textShadow:'0 2px 10px #000'}}>{visual.atmosphere?.city.toUpperCase()??'NFL'} MATCHUP</div>
   <div style={{position:'absolute',top:258,left:320,right:320,zIndex:5,textAlign:'center',fontSize:15,color:'#C8D5DF',fontWeight:700,lineHeight:1.5}}>{kickoff}</div>
   <div style={{position:'absolute',top:543,left:44,right:44,zIndex:5,fontSize:10,letterSpacing:1,color:'#91A4B0',textAlign:'center'}}>FEATURED SYSTEM PLAYERS · GENERIC FIGURES ARE NOT PLAYER LIKENESSES</div>
  </section>
  <section data-testid="poster-core" style={{position:'absolute',left:44,right:44,top:645,height:460,zIndex:6}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',height:34}}><h2 style={{...caps,fontSize:21,margin:0}}>{data.mode==='system'?'SYSTEM CORE':'BETTABLE NOW'}</h2><span style={{fontSize:12,color:muted}}>{data.qualifyingCount} QUALIFYING TARGETS{data.draws!=null?` · ${data.draws.toLocaleString('en-US')} DRAWS`:''}</span></div>
   {top?<>
    <div data-testid="poster-featured-pick" style={{position:'relative',height:140,boxSizing:'border-box',padding:'15px 22px',borderLeft:`5px solid ${green}`,background:'linear-gradient(100deg,#20342bed,#101b20e8 75%,#20372bcb)',boxShadow:'0 12px 36px #0008'}}>
     <div style={{fontSize:11,...caps,color:green,marginBottom:top.execution?4:7}}>01 · FEATURED SYSTEM PICK · {top.row.team}</div>
     <div style={{fontSize:top.execution?26:29,...caps,maxWidth:620}}>{top.row.player}</div>
     <div style={{fontSize:top.execution?36:42,fontWeight:900,color:green,marginTop:top.execution?4:7}}>{targetText(top,true)}</div>
     <div style={{position:'absolute',right:20,top:27,textAlign:'right'}}><div style={{fontSize:82,fontWeight:900,color:green,letterSpacing:-4}}>{pct(top.target.probability)}</div><div style={{fontSize:10,...caps,color:muted}}>MODEL HIT PROBABILITY</div></div>
     <Execution pick={top}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'95px 95px 62px',gap:'8px 32px',marginTop:16}}>
     {data.core.slice(1).map((pick,index)=>{
      const wide=index===4;
      return <div data-testid="poster-supporting-pick" key={pick.row.id} style={{position:'relative',gridColumn:wide?'1 / -1':undefined,borderBottom:'1px solid #647b8655',padding:'7px 4px 8px 24px',minWidth:0}}>
       <span style={{position:'absolute',left:0,top:9,fontSize:13,fontWeight:800,color:'#8E9DA8'}}>{String(index+2).padStart(2,'0')}</span>
       <div style={{...caps,fontSize:pick.row.player.length>22?18:20,paddingRight:wide?0:125,display:wide?'inline-block':undefined}}>{pick.row.player}</div>
       <div style={{color:green,fontSize:26,fontWeight:800,marginTop:wide?0:6,marginLeft:wide?24:0,display:wide?'inline-block':undefined}}>{targetText(pick,true)}<span style={{fontSize:12,color:muted,marginLeft:12}}>{pick.row.team} · {OUTCOMES[pick.row.outcome]}</span></div>
       <div style={{position:'absolute',right:4,top:wide?9:7,fontSize:wide?38:44,fontWeight:900,color:green}}>{pct(pick.target.probability)}</div>
       <Execution pick={pick}/>
      </div>;
     })}
    </div>
   </>:<div data-testid="premium-execution-empty" style={{position:'absolute',top:75,left:8,right:8,borderLeft:`4px solid ${green}`,padding:'20px 26px',background:'linear-gradient(90deg,#101c22c0,transparent)'}}>
    <h3 style={{...caps,fontSize:34,lineHeight:1.25,margin:0}}>{data.mode==='bettable'?'NO VERIFIED EXECUTION MATCHES':'NO QUALIFYING SYSTEM TARGETS'}</h3>
    <p style={{fontSize:20,lineHeight:1.6,color:'#B4C4D0',maxWidth:720}}>{data.mode==='bettable'?'System targets remain sportsbook-independent. The current sportsbook snapshot contains no exact confirmed equivalent.':'No model-derived 65%+ targets meet the existing availability rules for this game.'}</p>
   </div>}
  </section>
  <section data-testid="premium-scouting-strip" style={{position:'absolute',left:44,right:44,top:1130,height:112,zIndex:6}}>
   <h3 style={{...caps,fontSize:13,color:muted,margin:'0 0 12px'}}>{data.mode==='bettable'?'SYSTEM LEADERS · MODEL ONLY':'MODEL LEADERS'}</h3>
   <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 30px'}}>{data.leaders.map(({family,pick})=><div key={family} style={{display:'flex',alignItems:'center',gap:12,borderLeft:'2px solid #67818C',paddingLeft:10}}>
    <span style={{...caps,fontSize:14,color:'#97ADB9',width:48}}>{family}</span><div><div style={{...caps,fontSize:16}}>{pick.row.player}</div><div style={{fontSize:18,fontWeight:700,color:'#D2DEE3',marginTop:4}}>{targetText(pick,true)} · <span style={{color:green}}>{pct(pick.target.probability)}</span></div></div>
   </div>)}</div>
  </section>
  <footer style={{position:'absolute',left:44,right:44,top:1260,zIndex:7,borderTop:'1px solid #53657066',paddingTop:12,color:'#A4B5BE',fontSize:12,lineHeight:1.4}}>
   {data.mode==='bettable' && <div style={{color:data.lines?.stale||data.lines?.unknown?'#FFD57A':muted,marginBottom:5}}>LINES UPDATED: {formatET(data.lines?.timestamp)}{data.lines?.stale||data.lines?.unknown?' · LINES MAY HAVE MOVED — VERIFY BEFORE PLACING':''}</div>}
   <b>{data.mode==='system'?'MODEL-DERIVED 65%+ TARGETS · NO SPORTSBOOK INPUTS':'MODEL TARGETS ARE SPORTSBOOK-INDEPENDENT · SPORTSBOOK DATA USED ONLY FOR EXECUTION'}</b>
   <div>Statistical model output — not a guarantee. · INFORMATION CUTOFF: {formatET(data.cutoff)} · MODEL: {shortModelVersion(data.modelVersion)}</div>
  </footer>
 </div>;
}
