import React from 'react';
import { OUTCOMES,formatET } from '../nfl/phase1';
import { targetText } from '../nfl/bettable';
import { shortModelVersion,type GameShareData } from '../nfl/shareCard';
import { posterPresentation,type PosterPresentation } from '../nfl/posterAssets';
import { POSTER_THEMES,type PosterTheme } from '../nfl/posterTheme';
import NflPosterHero from './NflPosterHero';
import { EXPORT_WIDTH,EXPORT_HEIGHT } from '../lib/exportImage';
const green='#79FF48',muted='#8E9DA5';
const pct=(p:number|null)=>p==null?'—':`${(p*100).toFixed(1)}%`;
const label:React.CSSProperties={fontSize:17,fontWeight:700,letterSpacing:2,color:muted};
/** The sole poster layout. Local/system fonts and CSS art; no remote assets. */
export default function NflGameShareCard({data,cardRef,theme='premium',visual:resolved}:{data:GameShareData;cardRef?:React.Ref<HTMLDivElement>;theme?:PosterTheme;visual?:PosterPresentation}) {
 const visual=resolved||posterPresentation(data,theme),style=POSTER_THEMES[visual.theme],away=visual.away,home=visual.home;
 const kickoff=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(data.game.kickoff_utc)).toUpperCase()+' ET';
 return <div ref={cardRef} data-testid="game-share-poster" data-theme={visual.theme} style={{width:EXPORT_WIDTH,height:EXPORT_HEIGHT,boxSizing:'border-box',position:'relative',overflow:'hidden',padding:44,background:style.background,color:'#F0F4F5',fontFamily:'Arial, Helvetica, sans-serif',lineHeight:1.1,isolation:'isolate'}}>
  <div aria-hidden="true" style={{position:'absolute',inset:0,zIndex:-1,background:style.grid?`radial-gradient(ellipse at 8% 20%, ${away.primary}55, transparent 45%), radial-gradient(ellipse at 95% 15%, ${home.primary}44, transparent 44%), repeating-linear-gradient(120deg, transparent 0px, transparent 89px, #ffffff04 90px, transparent 92px)`:`linear-gradient(180deg,${away.primary}18,transparent 50%)`}}/>
  {style.grid && <div aria-hidden="true" style={{position:'absolute',left:-35,right:-35,top:84,height:280,zIndex:-1,border:'2px solid #ffffff08',borderRadius:'50%',transform:'rotate(-10deg)',boxShadow:'0 0 80px #79ff4806'}}/>}
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',height:60,borderBottom:'1px solid #ffffff22',paddingBottom:18}}>
    <div style={{fontSize:38,fontWeight:900,letterSpacing:-2}}>PROP <span style={{color:green}}>EDGE</span><span style={{display:'inline-block',verticalAlign:'middle',marginLeft:18,fontSize:12,letterSpacing:2,color:muted}}>NFL OUTCOME ENGINE</span></div>
    <div style={{textAlign:'right',...label,fontSize:16}}>NFL · WEEK {data.week??'—'} · {data.horizon}<div style={{fontSize:12,marginTop:7,color:'#B2BCC1'}}>SHADOW / RESEARCH</div></div>
  </header>
  <NflPosterHero visual={visual} kickoff={kickoff}/>
  <section style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-around',background:style.panel,border:'1px solid #ffffff15',borderRadius:16}}>
    <div><b style={{fontSize:28}}>{data.qualifyingCount}</b><span style={{...label,fontSize:13,marginLeft:12}}>QUALIFYING TARGETS</span></div>
    <div><b style={{fontSize:30,color:green}}>{pct(data.topProbability)}</b><span style={{...label,fontSize:13,marginLeft:12}}>TOP HIT RATE</span></div>
    {data.draws!=null && <div><b style={{fontSize:25}}>{data.draws.toLocaleString('en-US')}</b><span style={{...label,fontSize:13,marginLeft:10}}>DRAWS</span></div>}
  </section>
  <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginTop:24,marginBottom:14}}><h2 style={{margin:0,fontSize:30,fontWeight:900,letterSpacing:1}}>{data.mode==='system'?'SYSTEM CORE':'BETTABLE NOW'}</h2><span style={{...label,fontSize:12}}>MODEL TARGET → OPTIONAL EXECUTION</span></div>
  <section data-testid="poster-core" style={{height:visual.theme==='premium'?480:510,display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'repeat(3, 1fr)',gap:12}}>
    {data.core.map((pick,i)=><div key={pick.row.id} style={{minWidth:0,position:'relative',border:'1px solid #ffffff20',borderRadius:18,padding:'12px 20px',background:style.grid?'linear-gradient(130deg,#202A30,#11181E)':style.panel}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10}}><span style={{fontSize:20,fontWeight:900,color:'#607079'}}>{String(i+1).padStart(2,'0')}</span><span style={{...label,fontSize:12}}>{pick.row.team} · {OUTCOMES[pick.row.outcome]?.toUpperCase()}</span></div>
      <p style={{margin:'8px 0 0',fontWeight:800,fontSize:24,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{pick.row.player}</p>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:8,marginTop:6}}><span style={{fontSize:30,fontWeight:900,color:green}}>{targetText(pick,true)}</span><span style={{fontSize:40,fontWeight:900,color:green}}>{pct(pick.target.probability)}</span></div>
      {pick.execution?<p style={{margin:'8px 0 0',fontSize:13,color:'#B3C0C7',textTransform:'uppercase'}}>AVAILABLE · {pick.execution.book} {pick.execution.kind==='over'?`OVER ${pick.execution.line}`:targetText(pick,true)} · {pick.execution.odds>0?'+':''}{pick.execution.odds}</p>:<p style={{margin:'8px 0 0',fontSize:11,letterSpacing:2,color:muted}}>MODEL-DERIVED · 65%+ TARGET</p>}
    </div>)}
    {!data.core.length && <div style={{gridColumn:'1 / -1',gridRow:'1 / -1',border:'1px solid #ffffff22',borderRadius:20,display:'flex',flexDirection:'column',justifyContent:'center',padding:54,background:'linear-gradient(140deg,#1B272B,#11181C)'}}>
      <div style={{width:64,height:4,background:green,marginBottom:30}}/><h3 style={{fontSize:45,lineHeight:1.15,margin:0,fontWeight:900}}>{data.mode==='bettable'?'NO VERIFIED EXECUTION MATCHES':'NO QUALIFYING SYSTEM TARGETS'}</h3>
      <p style={{fontSize:23,lineHeight:1.6,color:'#99A9B0',maxWidth:690}}>{data.mode==='bettable'?'System targets remain sportsbook-independent. The current sportsbook snapshot contains no exact confirmed equivalent.':'No model-derived 65%+ targets meet the existing availability rules for this game.'}</p>
    </div>}
  </section>
  <section style={{marginTop:22}}><h3 style={{...label,fontSize:14,margin:'0 0 12px'}}>{data.mode==='bettable'?'SYSTEM LEADERS · MODEL ONLY':'MODEL LEADERS'}</h3><div style={{display:'flex',gap:12}}>{data.leaders.map(({family,pick})=><div key={family} style={{flex:1,minWidth:0,borderTop:'2px solid #56666D',paddingTop:10}}><p style={{margin:0,...label,fontSize:12}}>{family}</p><p style={{fontSize:15,fontWeight:800,textTransform:'uppercase',margin:'7px 0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{pick.row.player}</p><p style={{fontSize:14,fontWeight:700,color:'#CED7DA',margin:0}}>{targetText(pick,true)} · {pct(pick.target.probability)}</p></div>)}</div></section>
  <footer style={{position:'absolute',left:44,right:44,bottom:35,borderTop:'1px solid #ffffff22',paddingTop:18}}>
    {data.mode==='bettable' && <div style={{marginBottom:10,fontSize:13,color:data.lines?.stale||data.lines?.unknown?'#FFD57A':muted}}>LINES UPDATED: {formatET(data.lines?.timestamp)}{(data.lines?.stale||data.lines?.unknown)?' · LINES MAY HAVE MOVED — VERIFY BEFORE PLACING':''}</div>}
    <div style={{display:'flex',justifyContent:'space-between',gap:20,fontSize:13,color:'#9DAEB5'}}><b style={{lineHeight:1.3}}>{data.mode==='system'?'MODEL-DERIVED 65%+ TARGETS · NO SPORTSBOOK INPUTS':'MODEL TARGETS ARE SPORTSBOOK-INDEPENDENT · SPORTSBOOK DATA USED ONLY FOR EXECUTION'}</b><span>Statistical model output — not a guarantee.</span></div>
    <p style={{fontSize:12,color:'#788A92',margin:'9px 0 0'}}>INFORMATION CUTOFF: {formatET(data.cutoff)} · MODEL: {shortModelVersion(data.modelVersion)}</p>
  </footer>
 </div>;
}
