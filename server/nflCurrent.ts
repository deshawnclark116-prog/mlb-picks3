/** GitHub's published forecast is authoritative; Render is only a bounded outage fallback.
 * This path never generates a forecast and cannot convert a betting line into a prediction.
 */
import {parseExistingNfl} from '../src/nfl/existing.ts';

export const NFL_GITHUB_PUBLISHED =
  'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nfl_predictions.json';
export const NFL_RENDER_READONLY = 'https://prop-edge-api.onrender.com/nfl/predictions';
type Fetcher=typeof fetch;
type Current={document:Record<string,unknown>;origin:'github_main'|'render_outage_fallback'};

function validate(doc:unknown,when:Date) {
  if(!doc||typeof doc!=='object'||Array.isArray(doc))
    throw new Error('NFL published file is not a JSON document');
  const slate=parseExistingNfl(doc,when);
  if(slate.games.length===0 || slate.projections===0)
    throw new Error('NFL published file lacks any game-day yardage projections');
  return doc as Record<string,unknown>;
}
async function read(url:string,fetcher:Fetcher,clock:()=>number) {
  const response=await fetcher(url+(url.includes('?')?'&':'?')+'t='+clock(),
    {cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate',
      Pragma:'no-cache',Accept:'application/json'},signal:AbortSignal.timeout(18000)});
  if(!response.ok)throw new Error('Upstream HTTP '+response.status);
  return response.json();
}

/** A syntactically malformed primary publication is fatal and never silently masked.
 * Only source transport failures permit a bounded fallback to the already deployed API.
 */
export async function loadCurrentNfl(fetcher:Fetcher=fetch,clock=Date.now):Promise<Current>{
  const instant=new Date(clock());
  let upstream:unknown;
  try{
    upstream=await read(NFL_GITHUB_PUBLISHED,fetcher,clock);
  }catch(error){
    // A network/5xx outage is not a permission to serve stale or expired output.
    const fallback=validate(await read(NFL_RENDER_READONLY,fetcher,clock),instant);
    return {document:fallback,origin:'render_outage_fallback'};
  }
  return {document:validate(upstream,instant),origin:'github_main'};
}
