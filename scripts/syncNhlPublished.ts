/** Read-only independent publisher sync: the NHL model runs in picks2.
 * We DO NOT model, recalibrate or re-pick anything here. Freeze its original
 * pregame probabilities as source documents, so AI Studio static previews
 * don't lose all game winners and points when the Render proxy fails.
 */
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {readNhlPublishedPregame} from '../src/nhl/publishedPregame';
const now=new Date().toISOString();
const base='https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nhl_predictions.json';
async function json(url:string){
 const controller=new AbortController(),time=setTimeout(()=>controller.abort(),16000);
 try{
  const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!r.ok)throw Error('NHL_PUBLISH_SOURCE_HTTP_'+r.status);
  return await r.json() as unknown;
 }finally{clearTimeout(time);}
}
const [source,ref]=await Promise.all([json(base),json(
 'https://api.github.com/repos/deshawnclark116-prog/mlb-picks2/git/ref/heads/main'
)]);
const sourceCommit=(ref as {object?:{sha?:string}}).object?.sha||'';
if(!/^[a-f0-9]{40}$/.test(sourceCommit))
 throw Error('NHL_PUBLISH_SOURCE_COMMIT_INVALID');
const wrapper={schema:'NHL_PUBLISHED_PREMATCH_SNAPSHOT_V1' as const,
 source:'mlb-picks2/docs/nhl_predictions.json',
 source_commit_sha:sourceCommit,captured_at_utc:now,document:source};
const verified=readNhlPublishedPregame(wrapper,now);
if(!verified){
 console.log('NO_ELIGIBLE_PREGAME_NHL_SOURCE: unchanged');
 process.exit(0);
}
const raw=JSON.stringify(wrapper)+'\n';
const current='public/nhl-published-pregame.json';
const dir='docs/nhl_published_firstseen';
const archive=join(dir,verified.game_date+'.json');
mkdirSync(dir,{recursive:true});
if(!existsSync(archive)){
 writeFileSync(archive,raw,{flag:'wx'});
 console.log('NHL_PUBLISHED_FIRST_SEEN',archive,verified.picks.length);
}
const old=existsSync(current)?JSON.parse(readFileSync(current,'utf8')):null;
const oldDoc=old?.document;
const newDoc=(wrapper.document as {generated_at_utc:string,picks:unknown[]});
if(old?.source_commit_sha!==sourceCommit||
 oldDoc?.game_date!==(wrapper.document as {game_date:string}).game_date||
 oldDoc?.generated_at_utc!==newDoc.generated_at_utc||
 oldDoc?.picks?.length!==newDoc.picks.length){
 writeFileSync(current,raw);
 console.log('NHL_PREMATCH_STATIC_REFRESH',JSON.stringify({
  date:verified.game_date,upcoming:verified.picks.length,
  markets:verified.picks.reduce((a,p)=>(a[p.market]=(a[p.market]||0)+1,a),
   {} as Record<string,number>),
  upstreamCommit:sourceCommit}));
}else console.log('NHL_PREMATCH_SNAPSHOT_UNCHANGED');
