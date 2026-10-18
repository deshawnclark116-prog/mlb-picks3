import React from 'react';
import { OUTCOMES,formatET } from '../nfl/phase1';
import { targetText } from '../nfl/bettable';
import { shortModelVersion,type GameShareData } from '../nfl/shareCard';
import { teamBrand } from '../nfl/teamBrand';
import { EXPORT_WIDTH,EXPORT_HEIGHT } from '../lib/exportImage';
const green='#79FF48',muted='#8E9DA5';
const pct=(p:number|null)=>p==null?'—':`${(p*100).toFixed(1)}%`;
const label:React.CSSProperties={fontSize:17,fontWeight:700,letterSpacing:2,color:muted};
// The numerical stat prediction is the model median; a conservative 65%+
// milestone is a distinct event and NEVER the projection or P(median).
const medianNumber=(value:number|null)=>typeof value==='number'&&Number.isFinite(value)
  ?value.toLocaleString('en-US',{maximumFractionDigits:1}):'—';
const statUnit:Record<string,string>={
 pass_yds:'PASS YDS',rush_yds:'RUSH YDS',rec_yds:'REC YDS',rec:'REC',
 pass_td:'PASS TD',int:'INT',rush_td:'RUSH TD',rec_td:'REC TD',atd:'TD'
};
/** The sole poster layout. Local/system fonts and CSS art; no remote assets. */
export default function NflGameShareCard({data,cardRef}:{data:GameShareData;cardRef?:React.Ref<HTMLDivElement>}) {
 const away=teamBrand(data.game.away),home=teamBrand(data.game.home);
 const kickoff=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(data.game.kickoff_utc)).toUpperCase()+' ET';
 return <div ref={cardRef} data-testid="game-share-poster" style={{width:EXPORT_WIDTH,height:EXPORT_HEIGHT,boxSizing:'border-box',position:'relative',overflow:'hidden',padding:44,background:'#090D10',color:'#F0F4F5',fontFamily:'Arial, Helvetica, sans-serif',lineHeight:1.1,isolation:'isolate'}}>
  <div aria-hidden="true" style={{position:'absolute',inset:0,zIndex:-1,background:`radial-gradient(ellipse at 8% 20%, ${away.primary}55, transparent 45%), radial-gradient(ellipse at 95% 15%, ${home.primary}44, transparent 44%), repeating-linear-gradient(120deg, transparent 0px, transparent 89px, #ffffff04 90px, transparent 92px)`}}/>
  <div aria-hidden="true" style={{position:'absolute',left:-35,right:-35,top:84,height:280,zIndex:-1,border:'2px solid #ffffff08',borderRadius:'50%',transform:'rotate(-10deg)',boxShadow:'0 0 80px #79ff4806'}}/>
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',height:60,borderBottom:'1px solid #ffffff22',paddingBottom:18}}>
    <div style={{fontSize:38,fontWeight:900,letterSpacing:-2}}>PROP <span style={{color:green}}>EDGE</span><span style={{display:'inline-block',verticalAlign:'middle',marginLeft:18,fontSize:12,letterSpacing:2,color:muted}}>NFL OUTCOME ENGINE</span></div>
    <div style={{textAlign:'right',...label,fontSize:16}}>NFL · WEEK {data.week??'—'} · {data.horizon}<div style={{fontSize:12,marginTop:7,color:'#B2BCC1'}}>SHADOW / RESEARCH</div></div>
  </header>
  <section style={{height:224,position:'relative',paddingTop:22}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{fontSize:126,fontWeight:900,letterSpacing:-7,textShadow:`0 0 55px ${away.primary}55`}}>{away.abbreviation}</div>
      <div style={{...label,fontSize:22,color:'#718088',border:'1px solid #ffffff22',borderRadius:50,padding:'16px 20px'}}>VS</div>
      <div style={{fontSize:126,fontWeight:900,letterSpacing:-7,textShadow:`0 0 55px ${home.primary}55`}}>{home.abbreviation}</div>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:18,marginTop:8}}><span style={{width:80,height:4,background:away.primary}}/><span style={{...label,color:'#CED5D8',fontSize:18}}>{kickoff}</span><span style={{flex:1,height:1,background:'#ffffff22'}}/><span style={{width:80,height:4,background:home.primary}}/></div>
  </section>
  <section style={{height:78,display:'flex',alignItems:'center',justifyContent:'space-around',background:'#182027',border:'1px solid #ffffff15',borderRadius:16}}>
    <div><b style={{fontSize:30}}>{data.qualifyingCount}</b><span style={{...label,fontSize:13,marginLeft:12}}>MODEL TARGETS</span></div>
    <div><b style={{fontSize:30,color:green}}>{pct(data.topProbability)}</b><span style={{...label,fontSize:13,marginLeft:12}}>TOP TARGET HIT CHANCE</span></div>
    {data.draws!=null && <div><b style={{fontSize:25}}>{data.draws.toLocaleString('en-US')}</b><span style={{...label,fontSize:13,marginLeft:10}}>DRAWS</span></div>}
  </section>
  <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginTop:24,marginBottom:14}}><h2 style={{margin:0,fontSize:30,fontWeight:900,letterSpacing:1}}>{data.mode==='system'?'PREDICTED PLAYER STATS':'BOOK LINES · MODEL PROJECTIONS'}</h2><span style={{...label,fontSize:12}}>MODEL MEDIAN FIRST · TARGETS SEPARATE</span></div>
  <section data-testid="poster-core" style={{height:510,display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'repeat(3, 1fr)',gap:12}}>
    {data.core.map((pick,i)=><div key={pick.row.id} style={{minWidth:0,position:'relative',border:'1px solid #ffffff20',borderRadius:18,padding:'13px 18px',background:'linear-gradient(130deg,#202A30,#11181E)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10}}><span style={{fontSize:20,fontWeight:900,color:'#607079'}}>{String(i+1).padStart(2,'0')}</span><span style={{...label,fontSize:12}}>{pick.row.team} · {OUTCOMES[pick.row.outcome]?.toUpperCase()}</span></div>
      <p style={{margin:'5px 0 0',fontWeight:800,fontSize:21,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{pick.row.player}</p>
      <p style={{margin:'5px 0 0',fontSize:11,fontWeight:700,letterSpacing:1.5,color:'#AFBDC4'}}>MODEL PROJECTION · MEDIAN</p>
      <p data-testid="poster-model-median" style={{margin:'2px 0 0',whiteSpace:'nowrap',fontSize:34,fontWeight:900,color:green}}>
        {medianNumber(pick.row.median)} <span style={{fontSize:17}}>{statUnit[pick.row.outcome]||pick.row.outcome.toUpperCase()}</span>
      </p>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:6,marginTop:4}}>
        <span style={{fontSize:12,fontWeight:700,color:'#BFCCD1'}}>TARGET: {targetText(pick,true)}</span>
        <span style={{fontSize:20,fontWeight:900,color:'#CDEEA9'}}>{pct(pick.target.probability)}</span>
      </div>
      {pick.execution?<p style={{margin:'4px 0 0',fontSize:11,color:'#B3C0C7',textTransform:'uppercase'}}>BOOK · {pick.execution.book} {pick.execution.kind==='over'?`OVER ${pick.execution.line}`:targetText(pick,true)} · {pick.execution.odds>0?'+':''}{pick.execution.odds}</p>:<p style={{margin:'3px 0 0',fontSize:10,letterSpacing:1,color:muted}}>TARGET HIT CHANCE · NOT MEDIAN ACCURACY</p>}
    </div>)}
    {!data.core.length && <div style={{gridColumn:'1 / -1',gridRow:'1 / -1',border:'1px solid #ffffff22',borderRadius:20,display:'flex',flexDirection:'column',justifyContent:'center',padding:54,background:'linear-gradient(140deg,#1B272B,#11181C)'}}>
      <div style={{width:64,height:4,background:green,marginBottom:30}}/><h3 style={{fontSize:45,lineHeight:1.15,margin:0,fontWeight:900}}>{data.mode==='bettable'?'NO VERIFIED EXECUTION MATCHES':'NO QUALIFYING SYSTEM TARGETS'}</h3>
      <p style={{fontSize:23,lineHeight:1.6,color:'#99A9B0',maxWidth:690}}>{data.mode==='bettable'?'The system targets still exist. The current sportsbook snapshot does not contain an exact confirmed equivalent.':'No model-derived 65%+ targets meet the existing availability rules for this game.'}</p>
    </div>}
  </section>
  <section style={{marginTop:22}}><h3 style={{...label,fontSize:14,margin:'0 0 12px'}}>{data.mode==='bettable'?'MODEL PROJECTION LEADERS · NOT BOOK LINES':'MODEL PROJECTION LEADERS'}</h3><div style={{display:'flex',gap:12}}>{data.leaders.map(({family,pick})=><div key={family} style={{flex:1,minWidth:0,borderTop:'2px solid #56666D',paddingTop:10}}><p style={{margin:0,...label,fontSize:12}}>{family}</p><p style={{fontSize:15,fontWeight:800,textTransform:'uppercase',margin:'7px 0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{pick.row.player}</p><p style={{fontSize:18,fontWeight:800,color:'#F0F4F5',margin:0}}>{medianNumber(pick.row.median)} {statUnit[pick.row.outcome]||pick.row.outcome.toUpperCase()}</p>
      <p style={{fontSize:12,fontWeight:600,color:'#B8C6CD',margin:'4px 0 0'}}>TARGET: {targetText(pick,true)} · {pct(pick.target.probability)}</p></div>)}</div></section>
  <footer style={{position:'absolute',left:44,right:44,bottom:35,borderTop:'1px solid #ffffff22',paddingTop:18}}>
    {data.mode==='bettable' && <div style={{marginBottom:10,fontSize:13,color:data.lines?.stale||data.lines?.unknown?'#FFD57A':muted}}>LINES UPDATED: {formatET(data.lines?.timestamp)}{(data.lines?.stale||data.lines?.unknown)?' · LINES MAY HAVE MOVED — VERIFY BEFORE PLACING':''}</div>}
    <div style={{display:'flex',justifyContent:'space-between',gap:20,fontSize:13,color:'#9DAEB5'}}><b style={{lineHeight:1.3}}>{data.mode==='system'?'PLAYER-STAT MEDIANS · TARGET CHANCES SEPARATE · NO SPORTSBOOK INPUTS':'PLAYER-STAT MEDIANS + REAL BOOK LINES · TARGET CHANCES SEPARATE'}</b><span>Statistical model output — not a guarantee.</span></div>
    <p style={{fontSize:12,color:'#788A92',margin:'9px 0 0'}}>INFORMATION CUTOFF: {formatET(data.cutoff)} · MODEL: {shortModelVersion(data.modelVersion)}</p>
  </footer>
 </div>;
}
