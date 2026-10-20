import React,{useEffect,useMemo,useState} from 'react';
import {parseNbaPlayerResearch,type NbaPlayerResearch} from '../nba/playerResearch';

const fmt=(x:number)=>x.toFixed(1);
const dayEastern=(iso:string)=>{
  const parts=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date(iso));
  const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return o.year+'-'+o.month+'-'+o.day;
};

export default function NbaPlayerResearchPanel({day,search}:{day:string;search:string}){
  const [doc,setDoc]=useState<NbaPlayerResearch|null>(null);
  const [error,setError]=useState('');
  const [pending,setPending]=useState(true);
  useEffect(()=>{
    let active=true;
    fetch('/api/nba-player-research',{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new Error('First-seen player source unavailable (HTTP '+response.status+')');
      return parseNbaPlayerResearch(await response.json());
    }).then(d=>{if(active){setDoc(d);setError('');}})
      .catch(e=>{if(active){setDoc(null);setError(e instanceof Error?e.message:String(e));}})
      .finally(()=>{if(active)setPending(false);});
    return ()=>{active=false;};
  },[]);
  const games=useMemo(()=>doc?doc.forecasts.filter(g=>{
    if(day!=='ALL' && dayEastern(g.tipoff_utc)!==day)return false;
    const q=search.trim().toLowerCase();
    return !q || (g.away+' '+g.home).toLowerCase().includes(q) ||
      g.players.some(p=>p.player.toLowerCase().includes(q));
  }):[],[doc,day,search]);
  return <section data-testid="nba-player-research" className="space-y-3">
    <div className="rounded-xl border border-amber-700/60 bg-amber-950/20 p-3 text-xs text-amber-100 space-y-2">
      <strong className="block">NBA V2 · Original pregame player projections · RESEARCH ONLY</strong>
      <p>PTS, REB, AST and made threes are the model's estimated stats <b>if the player participates</b>. Minutes and play-frequency estimates come from earlier games. ESPN roster membership does not prove availability, starters or injury clearance.</p>
      <p>There are no verified bookmaker lines, player-prop bets, or automatic betting recommendations here.</p>
    </div>
    {pending&&<p className="text-sm text-gray-400">Reading the frozen original NBA player forecasts…</p>}
    {error&&<p role="alert" className="rounded-xl border border-red-700/60 bg-red-950/30 p-3 text-xs text-red-200">{error}. No post-tip replacements or made-up predictions will be displayed.</p>}
    {doc&&<>
      <p className="text-xs text-gray-400">
        Saved {new Date(doc.generated_at_utc).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET before tipoff
        {' · '}{doc.number_of_player_stat_predictions} forecasts
        {' · '}{doc.verified_previous_season_full_boxscores} historical game box scores
      </p>
      <p className="text-xs text-gray-400">{games.length} games with original NBA V2 player records. Open a matchup to see every modeled player.</p>
      {games.map(g=><details key={g.game_id} className="rounded-2xl border border-[#303030] bg-[#171717] p-3 space-y-2" data-testid="nba-player-matchup">
        <summary className="cursor-pointer text-xs leading-6 text-stone-100 font-bold">
          {g.away} at {g.home}
          <span className="block text-[11px] font-normal text-gray-400">
            {g.players.length} players · {g.player_predictions_count} stat forecasts · {g.roster_players_without_model_forecast.length} roster members without sufficient role history
          </span>
        </summary>
        <div className="space-y-2 pt-3">
          {g.players.filter(p=>!search.trim()||
              (g.away+' '+g.home).toLowerCase().includes(search.toLowerCase())||
              p.player.toLowerCase().includes(search.toLowerCase())
           ).map(p=><div key={p.forecast_id} className="rounded-xl border border-[#303030] bg-[#0D0D0D] p-3 space-y-2" data-testid="nba-player-projection">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-gray-100">{p.player}</strong>
                <span className="text-[10px] text-amber-200">Not injury/lineup certified</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Conditional minutes: {fmt(p.conditional_minutes_mean)} · Historical play probability: {(p.p_play_unverified*100).toFixed(0)}%
              </p>
              <div className="grid grid-cols-4 gap-1 text-center">
                {([['PTS',p.predictions.points],['REB',p.predictions.rebounds],
                    ['AST',p.predictions.assists],['3PM',p.predictions.three_pointers_made]] as const).map(([name,value])=>
                  <div key={name} className="rounded-md bg-[#202020] px-1 py-2">
                    <div className="text-[10px] text-gray-400">{name}</div>
                    <div className="text-sm font-bold tabular-nums">{fmt(value)}</div>
                  </div>
                )}
              </div>
            </div>)}
          {!g.players.length&&<p className="text-xs text-gray-400">No players had enough genuine prior same-team games for this matchup.</p>}
        </div>
      </details>)}
      {!games.length&&<p className="text-xs text-gray-400">No preserved NBA player forecast matches the filter.</p>}
    </>}
  </section>;
}
