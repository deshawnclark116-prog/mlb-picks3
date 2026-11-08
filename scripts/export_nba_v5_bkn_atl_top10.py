"""Extract the exact V5 game-card top-ten from the last real pretip artifact.

Never rebuild a forecast from final stats, switch projection threshold, or
confuse conditional-on-playing probabilities with including-DNP likelihood.
This is the same market floor / x.6 rounding / chance ranking as
src/components/NbaV3ResearchPanel.tsx and src/nba/v5ShareCard.ts.
"""
from __future__ import annotations

import argparse
import gzip
import json
import math
from datetime import datetime
from pathlib import Path

MARKETS=["points","rebounds","assists","three_pointers_made","steals","blocks","turnovers"]
MIN={"points":6,"rebounds":3,"assists":2,"three_pointers_made":1,
     "steals":1,"blocks":1,"turnovers":2}
NAMES={"points":"PTS","rebounds":"REB","assists":"AST",
       "three_pointers_made":"3PM","steals":"STL","blocks":"BLK"}

def whole(v):
    if not isinstance(v,(int,float)) or not math.isfinite(v) or v<0:
        raise ValueError("NBA_V5_INVALID_MEAN")
    b=math.floor(v)
    return b+int(v-b >= .6-1e-10)

def chance_at_least(row,k):
    lattice=row.get("cdf_lattice") or {}
    values=lattice.get("cdf")
    if lattice.get("step")!=1 or not isinstance(values,list) or not values or k<0:
        return None
    if k==0:return 1.
    if k-1>=len(values):return 0.
    below=values[k-1]
    return 1-below if isinstance(below,(int,float)) and 0<=below<=1 else None

def candidates(game):
    seen=set()
    ranked=[]
    for row in game["rows"]:
        market=row.get("market")
        if market not in MIN or market=="turnovers" or row.get("reported_status")=="OUT":
            continue
        if not isinstance(row.get("p_active"),(int,float)) or row["p_active"]<.75:
            continue
        mean=row.get("mean")
        if not isinstance(mean,(int,float)) or not math.isfinite(mean) or mean<0:
            continue
        target=whole(mean)
        if target<MIN[market]:continue
        lattice_chance=chance_at_least(row,target)
        if lattice_chance is None:continue
        reach=row.get("reach_probabilities") or {}
        if reach.get("whole_projection")==target:
            p=reach.get("probability_including_dnp")
        else:
            p=lattice_chance
        if not isinstance(p,(int,float)) or not math.isfinite(p) or not 0<=p<=1:
            continue
        key=(str(row.get("team_id")),str(row.get("player_id")),market)
        if key in seen:raise ValueError("NBA_V5_DUPLICATE_PLAYER_MARKET")
        seen.add(key)
        ranked.append((row,target,float(p),reach))
    ranked.sort(key=lambda x:(-x[2],-x[0]["p_active"],
              x[0]["player"].casefold(),MARKETS.index(x[0]["market"])))
    top=[]
    for row,target,p,reach in ranked:
        # Mirror the share card's V5-specific requirements, no fallback to
        # arbitrary model-target or conditional P(play).
        if not reach or reach.get("whole_projection")!=target:
            continue
        if not all(isinstance(reach.get(k),(int,float)) and
                   math.isfinite(reach[k]) and 0<=reach[k]<=1
                   for k in ("probability_if_playing","probability_including_dnp")):
            continue
        top.append({
            "rank":len(top)+1,
            "player":row["player"],
            "team_id":row["team_id"],
            "market":row["market"],
            "label":NAMES[row["market"]],
            "projection":target,
            "model_mean":row["mean"],
            "model_median":row.get("median"),
            "chance_including_dnp":round(p,6),
            "chance_if_playing":round(reach["probability_if_playing"],6),
            "p_active":row["p_active"],
            "starter_evidence":row.get("starter_evidence"),
        })
        if len(top)==10:break
    return top,len(ranked)

def load(path):
    if str(path).endswith(".gz"):
        with gzip.open(path,"rt") as f:return json.load(f)
    return json.loads(Path(path).read_text())

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--game-id",default="401909939")
    parser.add_argument("--latest",default="docs/nba_v5_latest/latest.json")
    parser.add_argument("--last",default="docs/nba_v5_archive/last/401909939.json.gz")
    parser.add_argument("--first",default="docs/nba_v5_archive/first/401909939.json.gz")
    parser.add_argument("--out",default="docs/nba_v5_latest/bkn_atl_20261107_top10.json")
    args=parser.parse_args()
    options=[]
    for kind,path in (("LATEST",args.latest),("ARCHIVED_LAST_PRETIP",args.last),
                      ("ARCHIVED_FIRST_PRETIP",args.first)):
        if not Path(path).is_file():continue
        doc=load(path)
        for g in doc.get("games",[]):
            if str(g.get("game_id"))!=args.game_id:continue
            try:
                generated=datetime.fromisoformat(g["forecast_at_utc"].replace("Z","+00:00"))
                tip=datetime.fromisoformat(g["tipoff_utc"].replace("Z","+00:00"))
            except (ValueError,KeyError):
                continue
            if generated>=tip:continue
            options.append((generated,kind,g,path))
    if not options:
        raise SystemExit("NBA_V5_NO_AUTHENTIC_PRETIP_GAME_SOURCE")
    generated,kind,game,path=max(options,key=lambda x:x[0])
    top,eligible=candidates(game)
    if not top:
        raise SystemExit("NBA_V5_NO_VALID_UNFILTERED_SHARE_CARD_PICKS")
    result={
        "game_id":args.game_id,"away":game["away"],"home":game["home"],
        "source_kind":kind,"source_file":path,
        "forecast_at_utc":generated.isoformat(),
        "tipoff_utc":game["tipoff_utc"],
        "forecast_kind":game.get("forecast_kind"),
        "certified_pregame_team_effect":game.get("certified_pregame_team_effect"),
        "eligible_projection_count":eligible,
        "model_probability_forward_calibrated":False,
        "sportsbook_line_or_odds_verified":False,
        "ranking":"same frontend unfiltered probability including DNP; integer mean x.6 boundary",
        "picks":top
    }
    destination=Path(args.out)
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n")
    print("NBA_V5_BKN_ATL_PRETIP_TOP10",json.dumps(result,ensure_ascii=False))
if __name__=="__main__":main()
