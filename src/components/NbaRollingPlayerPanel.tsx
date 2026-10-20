import React,{useEffect,useMemo,useState} from 'react';
import type {RollingResponse} from '../nba/rollingResearch';

const dayET=(s:string)=>new Intl.DateTimeFormat('en-CA',{
  timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'
}).format(new Date(s));
const timeET=(s:string)=>new Date(s).toLocaleString('en-US',{
  timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',
  minute:'2-digit',timeZoneName:'short'
});
const fmt=(x:number)=>x.toFixed(1);
const pct=(x:number)=>(100*x).toFixed(0)+'%';
type GradeStatus={
  schema:string;status:string;original_rolling_games:number;
  original_player_forecasts:number;verified_played_stat_outcomes?:number;
  unverified_conditional_stats?:number;
  games?:Array<{game_id:string;box_verified:boolean;final_complete:boolean;
    original_player_forecasts:number;player_status_counts:Record<string,number>}>;
};

export default function NbaRollingPlayerPanel({search}:{search:string}){
  const [doc,setDoc]=useState<RollingResponse|null>(null);
  const [grades,setGrades]=useState<GradeStatus|null>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [date,setDate]=useState('ALL');
  useEffect(()=>{
    let active=true;
    async function load(){
      try{
        const res=await fetch('/api/nba-rolling-research',{cache:'no-store'});
        if(!res.ok)throw new Error('NBA live V2 source HTTP '+res.status);
        const raw=await res.json() as RollingResponse;
        if(raw.schema!=='NBA_V2_ALL_SAVED_ROLLING_GAME_VIEW_V1'||
           raw.research_only!==true||raw.official_bets!==0||
           raw.injury_or_starters_certified!==false||
           raw.returned_games!==raw.forecasts.length){
          throw new Error('NBA rolling source identity or betting boundary invalid');
        }
        if(active){setDoc(raw);setError('');}
      }catch(e){
        if(active){setDoc(null);setError(e instanceof Error?e.message:String(e));}
      }finally{if(active)setLoading(false);}
      try{
        const res=await fetch('/api/nba-rolling-grades',{cache:'no-store'});
        if(res.ok){
          const g=await res.json() as GradeStatus;
          if(active&&typeof g.status==='string')setGrades(g);
        }
      }catch{/* Grade not yet published is NOT proof of winning or losing. */}
    }
    void load();
    return ()=>{active=false;};
  },[]);
  const dates=useMemo(()=>doc?[...new Set(doc.forecasts.map(g=>dayET(g.tipoff_utc)))].sort():[],[doc]);
  const games=useMemo(()=>doc?doc.forecasts.filter(g=>{
    if(date!=='ALL'&&dayET(g.tipoff_utc)!==date)return false;
    const q=search.trim().toLowerCase();
    return !q||(g.away+' '+g.home).toLowerCase().includes(q)||
       g.players.some(p=>p.player.toLowerCase().includes(q));
  }):[],[doc,date,search]);
  const gradeMap=useMemo(()=>new Map((grades?.games||[]).map(g=>[g.game_id,g])),[grades]);

  return <section data-testid="nba-rolling-v2" className="space-y-3">
    <div className="rounded-xl border border-[#27663c] bg-[#0f2419] p-3 text-xs space-y-2">
      <strong className="block text-[#00FF41]">NBA V2 · Season-long pre-tip player projections</strong>
      <p className="text-stone-300">
        Updated using completed real player box scores, current ESPN team membership and the
        original historical V2 model. Each game's first-saved forecast is preserved.
      </p>
      <p className="text-amber-200">Playing probabilities are based on historical appearance—not
        confirmed injuries, active rosters or starting lineups. Stats shown are
        conditional on playing. No verified sportsbook lines or official bets.</p>
    </div>
    {loading&&<p className="text-sm text-gray-400">Reading original rolling NBA predictions…</p>}
    {error&&<p role="alert" className="rounded-xl border border-red-600/50 p-3 text-xs text-red-200">
      Could not verify NBA V2 rolling source: {error}. No reconstructed picks will be substituted.
    </p>}
    {doc&&<>
      <div className="grid grid-cols-3 gap-2" aria-label="Live NBA V2 rolling archive coverage">
        <div className="rounded-xl bg-[#1d1d1d] px-2 py-3 text-center">
          <div className="text-lg font-bold">{doc.returned_games}</div>
          <div className="text-[10px] text-gray-400">Games</div>
        </div>
        <div className="rounded-xl bg-[#1d1d1d] px-2 py-3 text-center">
          <div className="text-lg font-bold">{doc.returned_player_forecasts}</div>
          <div className="text-[10px] text-gray-400">Player projections</div>
        </div>
        <div className="rounded-xl bg-[#1d1d1d] px-2 py-3 text-center">
          <div className="text-lg font-bold">{doc.returned_stat_forecasts}</div>
          <div className="text-[10px] text-gray-400">Projected stats</div>
        </div>
      </div>
      <div className="text-xs text-gray-400">
        {grades?.original_rolling_games?
          <span>Postgame grader: {grades.original_rolling_games} original games recorded;
            {' '}{grades.verified_played_stat_outcomes??0} actual player-stat comparisons verified;
            {' '}{grades.unverified_conditional_stats??0} unresolved market outcomes.</span>:
          <span>Waiting for independently confirmed final results before grading any rolling predictions.</span>}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Rolling NBA game date">
        {['ALL',...dates].map(d=><button type="button" key={d}
          onClick={()=>setDate(d)} aria-pressed={date===d}
          className={'shrink-0 rounded-lg px-3 py-2 text-xs font-bold '+
            (date===d?'bg-[#00FF41] text-black':'bg-[#252525] text-gray-200')}>
          {d==='ALL'?'All saved games':d.slice(5)}
        </button>)}
      </div>
      <p className="text-[11px] text-gray-400">
        {games.length} original, saved-before-tip NBA V2 game forecasts.
        Completed games remain in the archive for comparison.
      </p>
      {games.map(g=>{
        const graded=gradeMap.get(g.game_id);
        return <details key={g.game_id} data-testid="nba-rolling-game"
          className="rounded-2xl border border-[#343434] bg-[#171717] p-3 space-y-3">
          <summary className="cursor-pointer space-y-1">
            <span className="text-sm font-bold text-gray-100">{g.away} at {g.home}</span>
            <span className="block text-[11px] text-gray-400">
              {timeET(g.tipoff_utc)} · {g.players.length} players ·
              {' '}{g.player_predictions_count} original PTS/REB/AST/3PM forecasts
            </span>
            <span className="block text-[10px] text-amber-200">
              {graded?.box_verified?'VERIFIED FINAL BOX · ORIGINAL PREDICTIONS GRADED':
               graded?.final_complete?'FINAL · PLAYER BOX NOT YET VERIFIED':
               'ORIGINAL PRETIP FORECAST · NO GAME-DAY ACTIVE CERTIFICATION'}
            </span>
          </summary>
          <div className="pt-2 space-y-2">
            <p className="text-[11px] text-gray-400">
              First archived {timeET(g.first_seen_at_utc)}.
              {' '}{g.roster_players_without_model_forecast.length} roster players
              without sufficient same-team historical data were excluded rather than guessed.
            </p>
            {g.players.filter(p=>{
              const q=search.trim().toLowerCase();
              return !q||(g.away+' '+g.home).toLowerCase().includes(q)||
                p.player.toLowerCase().includes(q);
            }).map(p=><div key={p.forecast_id} className="rounded-xl border border-[#333] bg-[#111] p-3 space-y-2"
                 data-testid="nba-live-player-projection">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm">{p.player}</strong>
                  <span className="text-[10px] text-amber-200">Active/injury status unverified</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Expected minutes if playing {fmt(p.conditional_minutes_mean)}
                  {' · '}Historical P(plays) {pct(p.p_play_unverified)}
                </p>
                <div className="grid grid-cols-4 gap-1 text-center">
                  {([['PTS',p.predictions.points],['REB',p.predictions.rebounds],
                     ['AST',p.predictions.assists],['3PM',p.predictions.three_pointers_made]] as const)
                    .map(([market,val])=><div key={market} className="rounded bg-[#272727] p-2">
                     <div className="text-[10px] text-gray-400">{market}</div>
                     <strong className="text-sm tabular-nums">{fmt(val)}</strong>
                   </div>)}
                </div>
              </div>)}
            <p className="text-[10px] text-gray-500">
              Original ESPN event #{g.game_id} · Source archived in {g.source_file}.
              These are numerical projections, not verified gambling outcomes.
            </p>
          </div>
        </details>;
      })}
      {!games.length&&<p className="rounded-xl bg-[#1c1c1c] p-3 text-xs text-gray-400">
        {doc.returned_games===0?
          'No additional NBA rolling forecasts have been archived yet. The opening-week V2 originals remain available in the opening research view.':
          'No saved NBA projections match your date or search.'}
      </p>}
    </>}
  </section>;
}
