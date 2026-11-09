#!/usr/bin/env python3
"""Independent audit: original pretip model-selected players must belong to
the named matchup. Never change the original outcome target or grade.

Audits stored historical V3/V4 docs, compressed original V5 game archives, and
cross-game same-day athlete duplicates. If a result box can contain a player
from another game, target accuracy MUST NOT be certified.
"""
from __future__ import annotations
import collections
import gzip
import json
from pathlib import Path
from nba import nba_v3_v4_v5_featured_compare as c

REPORT = Path("docs/nba_v5_grades/v3_v4_v5_multiday_featured_comparison.json")
OUT = Path("docs/nba_v5_grades/v3_v4_v5_roster_integrity.json")

def normal(v):
    return str(v)

def get_game(doc, gid):
    found=[g for g in doc.get("games",[]) if normal(g.get("game_id"))==gid]
    if len(found)!=1:
        raise ValueError(f"{gid} missing or multiple original games")
    return found[0]

def collect():
    rep=json.loads(REPORT.read_text())
    violations=[]
    day_athletes=collections.defaultdict(lambda:collections.defaultdict(set))
    per_game=[]
    for item in rep["games"]:
        gid=item["id"]; ref=item["revision"]
        docs={}
        for v in ("V3","V4"):
            docs[v]=get_game(c.archived(ref,f"docs/nba_{v.lower()}_latest/latest.json"),gid)
        with gzip.open(f"docs/nba_v5_archive/last/{gid}.json.gz","rt",encoding="utf8") as f:
            docs["V5"]=get_game(json.load(f),gid)
        metrics={}
        for v in ("V3","V4","V5"):
            gm=docs[v]
            roster={(normal(r.get("player_id")),str(r.get("market"))):r
                    for r in gm["rows"]}
            teams={normal(gm["home_id"]),normal(gm["away_id"])}
            wrong_teams=[]
            missing=[]
            selected=item["cards"][v]
            for pick in selected:
                key=(normal(pick["player_id"]),pick["market"])
                r=roster.get(key)
                if r is None:
                    missing.append(key)
                    violations.append({"game_id":gid,"version":v,"reason":"SELECTED_NOT_IN_ORIGINAL_SOURCE","player":pick["player"]})
                    continue
                if normal(r.get("team_id")) not in teams:
                    wrong_teams.append({"player":pick["player"],"actual_team_id":r.get("team_id"),"allowed":sorted(teams)})
                    violations.append({"game_id":gid,"version":v,"reason":"WRONG_GAME_TEAM_ID","player":pick["player"]})
                day_athletes[item["game_date_et"]][(v,normal(pick["player_id"]))].add(gid)
            metrics[v]={"selected":len(selected),"bad_team_assignments":wrong_teams,
                        "selected_missing_from_original":missing,"teams":sorted(teams)}
        # Cross-model player disjointness is not expected because models share
        # roster sources. But a player in two DIFFERENT games the same day is
        # a clear multi-game membership contradiction.
        per_game.append({"id":gid,"game":item["matchup"],
                         "date":item["game_date_et"],"metrics":metrics})
    duplicates=[]
    for day,players in day_athletes.items():
        for (v,pid),games in players.items():
            if len(games)>1:
                duplicates.append({"date":day,"version":v,"player_id":pid,"games":sorted(games)})
    return {"schema":"NBA_ORIGINAL_PREGAME_ROSTER_V3_V4_V5_CROSSCHECK_V1",
            "games":len(rep["games"]),"selected_roster_violations":violations,
            "same_day_player_multiple_game_ids":duplicates,
            "game_details":per_game,
            "integrity_certified":not (violations or duplicates)}

def main():
    o=collect()
    OUT.write_text(json.dumps(o,indent=2)+"\n")
    print("NBA_PREGAME_ROSTER_INTEGRITY",json.dumps({
        "games":o["games"],"certified":o["integrity_certified"],
        "team_violations":len(o["selected_roster_violations"]),
        "same_day_multi_game_players":len(o["same_day_player_multiple_game_ids"]),
        "first_violations":o["selected_roster_violations"][:30],
        "first_duplicate_players":o["same_day_player_multiple_game_ids"][:30],
    }))
if __name__=="__main__":
    main()
