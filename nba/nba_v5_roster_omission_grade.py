"""Grade V5 roster omissions after final without rewriting a pretip forecast.

Compares *every* player who logged minutes in the official completed box
against the immutable V5 last-before-tip row identities. A missing player
is an error in roster coverage, not an invented prediction or zero-point
loss. This diagnostic uses future outcomes only after games finish.
"""
from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path


def _open_records(path):
    with gzip.open(path,"rt") if str(path).endswith(".gz") else open(path) as f:
        return (json.loads(line) for line in f if line.strip())


def exclusion_cause(frozen_doc, player_id):
    """Classify only from a frozen pre-tip forecast, never from final stats."""
    if frozen_doc is None:
        return {"cause":"ARCHIVE_NOT_READ","frozen_reported_status":None,
                "frozen_availability_source":None}
    games=frozen_doc.get("games") or []
    rows=[r for g in games for r in (g.get("rows") or [])
          if str(r.get("player_id"))==str(player_id)]
    if not rows:
        cause="ABSENT_FROM_FROZEN_V5_INPUT"
    elif any(str(r.get("model_version","")).startswith("nba-v5-") and
             r.get("mean_basis")=="CONDITIONAL_ON_PLAYING" for r in rows):
        cause="SIMULATED_BUT_NOT_IN_GRADED_OUTPUT"
    elif any(r.get("reported_status")=="OUT" for r in rows):
        cause="PRESENT_BUT_EXCLUDED_AS_OUT"
    elif any(float(r.get("p_active") or 0)<0.2 for r in rows):
        cause="PRESENT_BUT_LOW_ACTIVE_PROBABILITY"
    else:
        cause="PRESENT_BUT_NOT_SIMULATED_OTHER_REASON"
    r=next((r for r in rows if r.get("market")=="points"),rows[0] if rows else {})
    return {"cause":cause,
            "frozen_reported_status":r.get("reported_status"),
            "frozen_availability_source":r.get("availability_source"),
            "frozen_p_active":r.get("p_active"),
            "frozen_model_version":r.get("model_version")}


def grade_omissions(box, forecast_grade, frozen_doc=None):
    gid = str(box["game_id"])
    if str(forecast_grade["game_id"]) != gid:
        raise ValueError("game_id mismatch")
    predicted_ids = {str(row["player_id"]) for row in forecast_grade.get("rows", [])
                     if row.get("player_id")}
    actuals = [p for p in box.get("players", []) if float(p.get("min") or 0) > 0]
    if not actuals:
        raise ValueError("final game has no played-player records")
    extra=[]
    missing_minutes = {"home":0.0,"away":0.0}
    for p in actuals:
        if str(p["id"]) in predicted_ids:
            continue
        duration=float(p["min"])
        side=str(p.get("side",""))
        if side not in missing_minutes:
            raise ValueError("unexpected actual player side")
        missing_minutes[side]+=duration
        extra.append({
            **exclusion_cause(frozen_doc,str(p["id"])),
            "player":p.get("name"),"player_id":str(p["id"]),
            "side":side,"team_id":str(p.get("team")),"actual_minutes":duration,
            "actually_started":bool(p.get("start")),
        })
    extra.sort(key=lambda x:(x["side"],-x["actual_minutes"],x["player_id"]))
    return {
        "game_id":gid,"away":forecast_grade["away"],"home":forecast_grade["home"],
        "forecast_at_utc":forecast_grade["forecast_at_utc"],
        "played_players":len(actuals),"forecast_player_id_count":len(predicted_ids),
        "played_players_missing_from_v5":len(extra),
        "played_minutes_missing_from_v5":round(sum(missing_minutes.values()),2),
        "missing_minutes_by_side":{k:round(v,2) for k,v in missing_minutes.items()},
        "omitted_played_starters":sum(x["actually_started"] for x in extra),
        "missing_players":extra,
        "report_is_postgame_diagnostic_only":True,
    }


def build(box_paths, grade_dir, archive_last=None):
    boxes={}
    for file in box_paths:
        for x in _open_records(file):
            gid=str(x["game_id"])
            if gid in boxes:
                raise ValueError("duplicate final box game")
            boxes[gid]=x
    result=[]
    for p in sorted(Path(grade_dir).glob("*.json")):
        gid=p.stem
        if gid not in boxes:
            continue
        grade=json.loads(p.read_text())
        if grade.get("kind")!="last":
            continue
        frozen_doc=None
        if archive_last is not None:
            archive=Path(archive_last)/(gid+".json.gz")
            if archive.exists():
                with gzip.open(archive,"rt") as f:
                    frozen_doc=json.load(f)
                games=frozen_doc.get("games") or []
                if len(games)!=1 or str(games[0].get("game_id"))!=gid:
                    raise ValueError("frozen archive game_id mismatch")
        result.append(grade_omissions(boxes[gid],grade,frozen_doc))
    return {
        "schema":"NBA_V5_POSTGAME_ROSTER_OMISSION_AUDIT_V1",
        "purpose":"Postgame validation only; cannot supply a future pretip roster",
        "games":result,
        "games_graded":len(result),
        "total_missing_played_players":sum(x["played_players_missing_from_v5"] for x in result),
        "total_missing_played_minutes":round(sum(x["played_minutes_missing_from_v5"] for x in result),2),
        "games_with_missing_played_players":sum(x["played_players_missing_from_v5"]>0 for x in result),
    }


def main():
    a=argparse.ArgumentParser()
    a.add_argument("--games",action="append",required=True)
    a.add_argument("--grades",required=True)
    a.add_argument("--archive-last",default=None)
    a.add_argument("--out",required=True)
    args=a.parse_args()
    result=build(args.games,args.grades,args.archive_last)
    p=Path(args.out)
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n")
    print("NBA_V5_OMITTED_PLAYED_ROTATION_MINUTES",
          json.dumps({k:v for k,v in result.items() if k!="games"}),flush=True)


if __name__=="__main__":
    main()
