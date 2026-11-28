"""Independent pretip lineup source smoke test; no forecast alterations."""
import json,concurrent.futures
from pathlib import Path
from nba_world.prospective import source_schedule,roster
from nba_world.data import teams
from nba_world.lineups import collect
def main():
    games,receipt=source_schedule();ids=sorted({t for g in games for t in teams(g)})
    rosters={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for t,rows,r in pool.map(roster,ids):rosters[t]=rows
    observations,errors=collect(games,rosters)
    result={"schedule_games":len(games),"checked":len(observations),"confirmed_teams":sum(len(t["starters"])==5 for g in observations.values() for t in g["teams"].values()),"observations":observations,"errors":errors}
    Path("/tmp/nba_world_lineup_source.json").write_text(json.dumps(result,indent=2));print("LINEUP_SOURCE",json.dumps(result),flush=True)
if __name__=="__main__":main()
