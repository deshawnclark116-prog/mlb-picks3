import React from 'react';
import type {CityMotif} from '../nfl/cityAtmosphere';
/** Hand-authored geometric scenes and anonymous equipment silhouettes; no real likeness. */
export function CityScene({motif,color}:{motif:CityMotif;color:string}) {
 return <svg data-testid="poster-city-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 400" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:.42}}>
  <g fill={color} opacity=".55">
   {motif==='mountains' && <path d="M0 300L150 70l110 140L400 30l160 200L720 90l280 210v100H0z"/>}
   {(motif==='skyline'||motif==='river') && <path d="M0 310h60V170h45v140h40V95h35V50h12v45h35v215h50V150h60v160h40V85h35V20h8v65h32v225h65V185h75v125h45V100h65v210h45V230h90v80h50V135h70v175h95v90H0z"/>}
   {motif==='capitol' && <g><path d="M300 300V160h400v140zM375 150a125 100 0 0 1 250 0z"/><path d="M490 40V15h20v25z"/><path d="M200 310h600v90H200z"/></g>}
   {motif==='arches' && <path fillRule="evenodd" d="M100 320V190h800v130zM160 320v-65a50 50 0 0 1 100 0v65zM340 320v-65a50 50 0 0 1 100 0v65zM520 320v-65a50 50 0 0 1 100 0v65zM700 320v-65a50 50 0 0 1 100 0v65z"/>}
   {motif==='palms' && <g>{[100,830].map(x=><g key={x} transform={`translate(${x} 0)`}><path d="M0 350l35-220h14l-15 220z"/><path d="M40 140q-80-100-110-30 65-30 110 30zM40 140q-40-120 10-120-10 70-10 120zM40 140q70-100 125-30-75-30-125 30zM40 140q90-45 100 25-45-50-100-25z"/></g>)}</g>}
  </g>
  {motif==='bridge' && <g stroke={color} fill="none" strokeWidth="8"><path d="M0 295h1000M250 80v255M750 80v255M0 210q250-140 500 0 250-140 500 0"/>{Array.from({length:13},(_,i)=><path key={i} d={`M${i*80} 210v85`} strokeWidth="3"/>)}</g>}
  {(motif==='coast'||motif==='river') && <g stroke={color} fill="none" opacity=".6"><path d="M0 315q125-35 250 0t250 0 250 0 250 0M0 345q125-35 250 0t250 0 250 0 250 0" strokeWidth="3"/></g>}
  <g stroke="#cadbe3" opacity=".45" strokeWidth="3"><path d="M45 220V35h110M955 220V35H845"/></g>
  <g fill="#e9f6ff" opacity=".7">{[45,75,105,135,865,895,925,955].map(x=><rect key={x} x={x} y="30" width="19" height="12" rx="2"/>)}</g>
  <path d="M0 400l180-100h640l180 100M180 300h640M100 345h800M380 300l-70 100M620 300l70 100" fill="none" stroke="#ffffff" opacity=".12" strokeWidth="2"/>
 </svg>;
}
export function GenericFootballHero({color,variant,artwork}:{color:string;variant:number;artwork?:string|null}) {
 if(artwork)return <img data-testid="generic-football-hero" alt="Generic football shadow artwork — not a player likeness" src={artwork} style={{width:'100%',height:'100%',objectFit:'contain',objectPosition:'top',transform:variant%2?'scaleX(-1)':undefined,filter:`drop-shadow(0 0 18px ${color}aa)`}}/>;
 return <svg data-testid="generic-football-hero" role="img" aria-label="Generic football shadow artwork — not a player likeness" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 280" style={{width:'100%',height:'100%',filter:`drop-shadow(0 0 14px ${color}99)`}}>
  <g transform={variant%2?'translate(180 0) scale(-1 1)':undefined}>
   <path d="M64 18q28-18 53 1l9 20-6 34-12 8H79L62 61l-6-21z" fill="#141c24" stroke={color} strokeWidth="3"/>
   <path d="M65 28q23-16 47-2l9 11-7 7H67z" fill={color} opacity=".85"/>
   <path d="M74 48h44l-6 17H80z" fill="#05090d" stroke="#a9bdc8" strokeWidth="2"/>
   <path d="M81 49v21m12-21v24m-16-14h38" fill="none" stroke="#627684" strokeWidth="2"/>
   <path d="M77 76h29l8 13 27 8 19 36-17 18-20-24-4 55H61l-5-57-18 29-22-9 18-43 32-13z" fill={color} stroke="#8dabbc" strokeWidth="2"/>
   <path d="M64 95q28-10 52 0l-9 69H77z" fill="#15222f" opacity=".78"/>
   <path d="M66 180h51l16 58-20 39-20-4 9-37-17-29-9 36-10 34-26-4 12-58z" fill="#111a24" stroke="#687d8c" strokeWidth="2"/>
   <path d="M39 130l-8 20 35 28 15-16-25-19z" fill="#233645" stroke="#9bafbd" strokeWidth="2"/>
   <ellipse cx="103" cy="147" rx="27" ry="16" transform="rotate(-22 103 147)" fill="#342a26" stroke="#c5aaa0" strokeWidth="2"/>
   <path d="M92 143l20-8m-16 3 2 7m4-10 2 7m4-10 2 7" stroke="#e0d3c9" strokeWidth="2"/>
   <path d="M135 133l-25 20-7-10 23-24" fill="#233645" stroke="#9bafbd" strokeWidth="2"/>
   <path d="M41 270h27l9 9H35zM105 270h26l7 9h-38z" fill="#080d13" stroke="#829ba8"/>
   <path d="M40 105l19-5M121 100l19 8M66 189l13 7M108 192l14 14" stroke="#ffffff" strokeWidth="3" opacity=".55"/>
  </g>
 </svg>;
}
