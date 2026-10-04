import { toPng } from 'html-to-image';
export const EXPORT_WIDTH=1080,EXPORT_HEIGHT=1350;
export async function renderElementToPng(element:HTMLElement):Promise<Blob> {
 if(document.fonts?.ready) await document.fonts.ready;
 await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 const data=await toPng(element,{width:EXPORT_WIDTH,height:EXPORT_HEIGHT,canvasWidth:EXPORT_WIDTH,canvasHeight:EXPORT_HEIGHT,pixelRatio:1,backgroundColor:'#090D10',cacheBust:true,skipFonts:true,
   style:{width:`${EXPORT_WIDTH}px`,height:`${EXPORT_HEIGHT}px`,transform:'none',margin:'0'}});
 const blob=await (await fetch(data)).blob();
 if(!blob.size) throw new Error('The image renderer returned an empty PNG.');
 return blob;
}
export function downloadBlob(blob:Blob,filename:string) {
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=filename;document.body.appendChild(link);
 try {link.click();} finally {link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
type FileShare=Pick<Navigator,'share'|'canShare'>;
export async function shareBlob(blob:Blob,filename:string,api:FileShare=navigator):Promise<'shared'|'unsupported'|'cancelled'> {
 const file=new File([blob],filename,{type:'image/png'});
 try {
   if(typeof api.share!=='function' || typeof api.canShare!=='function' || !api.canShare({files:[file]})) return 'unsupported';
   await api.share({files:[file],title:'PROP EDGE NFL'});return 'shared';
 } catch(error) {
   if(error instanceof Error && error.name==='AbortError')return 'cancelled';
   if(error instanceof Error && ['NotAllowedError','NotSupportedError','TypeError','SecurityError'].includes(error.name))return 'unsupported';
   throw error;
 }
}
