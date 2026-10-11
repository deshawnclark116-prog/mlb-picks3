/** GitHub's published forecast is authoritative; Render is only a bounded outage fallback.
 * This path never generates a forecast and cannot convert a betting line into a prediction.
 */
import {parseExistingNfl} from '../src/nfl/existing.ts';

export const NFL_GITHUB_PUBLISHED =
  'https://raw.githubusercontent.com/deshawnclark116-prog/mlb-picks2/main/docs/nfl_predictions.json';
export const NFL_RENDER_READONLY = 'https://prop-edge-api.onrender.com/nfl/predictions';
type Fetcher=typeof fetch;
type Current={document:Record<string,unknown>;origin:'github_main'|'render_outage_fallback'};
class SourceUnavailable extends Error {}

function validate(doc:unknown,when:Date) {
  if(!doc||typeof doc!=='object'||Array.isArray(doc))
    throw new Error('NFL published file is not a JSON document');
  const slate=parseExistingNfl(doc,when);
  if(slate.games.length===0 || (slate.projections===0&&!slate.scheduleComplete))
    throw new Error('NFL published file lacks any game-day yardage projections');
  return doc as Record<string,unknown>;
}
async function read(url:string,fetcher:Fetcher,clock:()=>number) {
  let response:Response;
  try {
    response=await fetcher(url+(url.includes('?')?'&':'?')+'t='+clock(),
      {cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate',
        Pragma:'no-cache',Accept:'application/json'},signal:AbortSignal.timeout(18000)});
  }catch(error) {
    throw new SourceUnavailable('Source transport unavailable: '+String(error));
  }
  if(!response.ok)throw new SourceUnavailable('Upstream HTTP '+response.status);
  // Malformed JSON is a publication-integrity failure, not an outage fallback.
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
    if(!(error instanceof SourceUnavailable))throw error;
    // A network/5xx outage is not permission to serve indefinitely stale data.
    const fallback=validate(await read(NFL_RENDER_READONLY,fetcher,clock),instant);
    if(instant.getTime()-Date.parse(String(fallback.generated_at_utc))>36*3600000)
      throw new Error('Render fallback older than 36 hours; refusing stale NFL forecasts');
    return {document:fallback,origin:'render_outage_fallback'};
  }
  return {document:validate(upstream,instant),origin:'github_main'};
}
