"""NBA V5: refresh only on meaningful, verified pregame source changes.

The previous scheduler compared only ESPN OUT lists plus a three-hour age. It
could miss QUESTIONABLE->AVAILABLE and new official league designations. This
module fingerprints *all* reported statuses for games within the near-tipoff
window. NBA official report failures carry forward the last known source
fingerprint: a temporary outage cannot masquerade as a player clearance.

The digest is a trigger for regenerating independent basketball projections;
it never creates betting targets or asserts that anyone is active when
unreported. Every source snapshot is pregame only.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path

from nba.nba_v5_official_injuries import abbr

REGULAR_STATUSES={"OUT","DOUBTFUL","QUESTIONABLE","PROBABLE","DAY_TO_DAY","AVAILABLE"}
MAX_OFFICIAL_SOURCE_AGE_H=36
MIN_PRETIP_REFRESH_SECONDS=5*60  # late confirmed starting-five source can post inside T-20


def _time(value):
    try:
        stamp=dt.datetime.fromisoformat(str(value).replace("Z","+00:00"))
        return stamp.astimezone(dt.timezone.utc) if stamp.tzinfo else None
    except (ValueError,TypeError):
        return None


def _digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(",",":")).encode()).hexdigest()[:16]


def decide(fixtures,espn,official,state,now,window_hours=9,force=False):
    if now.tzinfo is None:
        raise ValueError("NBA_REFRESH_DECISION_NAIVE_TIME")
    now=now.astimezone(dt.timezone.utc)
    soon=[]
    for g in fixtures.get("games",[]):
        tip=_time(g.get("tipoff_utc"))
        if not tip:
            continue
        delta=(tip-now).total_seconds()
        if MIN_PRETIP_REFRESH_SECONDS <= delta <= float(window_hours)*3600:
            soon.append(g)
    soon.sort(key=lambda g:str(g["game_id"]))
    teamids={str(k) for g in soon for k in (g["home_id"],g["away_id"])}
    matchup_ids=set()
    for g in soon:
        away,home=abbr(g.get("away")),abbr(g.get("home"))
        if away and home:
            matchup_ids.add(f"{away}@{home}")

    # Source data only: lack of a player in ESPN injuries is not a clearance.
    statuses=sorted(
        (str(e["team_id"]),str(e["player_id"]),str(e["source_reported_status"]))
        for e in espn.get("injuries",[])
        if isinstance(e,dict) and str(e.get("team_id")) in teamids
        and str(e.get("source_reported_status")) in REGULAR_STATUSES
        and e.get("player_id")
    )
    official_signature=str(state.get("official_signature") or "UNSEEN")
    official_used=False
    try:
        captured=_time(official.get("captured_at_utc"))
        pub=_time(official.get("published_at_utc"))
        if (official.get("schema")=="NBA_OFFICIAL_INJURY_REPORT_SNAPSHOT_V1"
            and official.get("game_active_roster_certified") is False
            and captured and pub and pub<=captured<=now
            and (now-pub).total_seconds()<=MAX_OFFICIAL_SOURCE_AGE_H*3600
            and isinstance(official.get("reports"),list)):
            relevant=sorted((str(r["matchup"]),str(r["team_abbr"]),
                            str(r["normalized_player"]),str(r["status"]))
                for r in official["reports"] if isinstance(r,dict)
                and r.get("matchup") in matchup_ids
                and r.get("status") in REGULAR_STATUSES
                and r.get("normalized_player"))
            # PDF's creation timestamp or URL changes at every report. Only
            # relevant GAME/PLAYER/STATUS changes should trigger 3000 MC sims.
            official_signature=_digest(relevant)
            official_used=True
    except (TypeError,ValueError,KeyError):
        pass

    key=_digest({"near_game_ids":sorted(str(g["game_id"]) for g in soon),
                 "ESPN_statuses":statuses,
                 "official_status_signature":official_signature})
    previous=_time(state.get("generated_at_utc"))
    age=(now-previous).total_seconds() if previous else float("inf")
    changed=state.get("hash")!=key
    # A lineup can be formally announced at T-30 without any injury-status
    # change. The old 3-hour gate therefore missed it entirely. Poll the
    # genuinely near-tipoff window on EVERY scheduled tick, including while
    # source statuses are unchanged. Never force a run after scheduled tip.
    near_tip_lineup_recheck=any(
        MIN_PRETIP_REFRESH_SECONDS <= (_time(g["tipoff_utc"])-now).total_seconds() <= 90*60
        for g in soon)
    run=bool(soon) and (bool(force) or changed or age>3*3600 or near_tip_lineup_recheck)
    return {"run":run,"hash":key,"games":len(soon),
            "official_signature":official_signature,
            "official_source_observed":official_used,
            "espn_relevant_status_count":len(statuses),
            "official_relevant_matchup_count":len(matchup_ids) if official_used else 0,
            "source_changed":changed,
            "near_tip_lineup_recheck":near_tip_lineup_recheck,
            "last_forecast_age_seconds":int(age) if age!=float("inf") else None,
            "reasons":([x for x,v in (("manual_force",force),("source_changed",changed),
                     ("stale_3hours",age>3*3600),
                     ("near_tip_lineup_recheck",near_tip_lineup_recheck)) if v] if soon else ["no_nearby_games"])}


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--fixtures",required=True)
    p.add_argument("--espn",required=True)
    p.add_argument("--official",default="")
    p.add_argument("--state",required=True)
    p.add_argument("--window-hours",type=float,default=9.0)
    p.add_argument("--force",default="false")
    a=p.parse_args()
    def read(path):
        try:return json.loads(Path(path).read_text()) if path else {}
        except (OSError,ValueError):return {}
    result=decide(read(a.fixtures),read(a.espn),read(a.official),
                  read(a.state),dt.datetime.now(dt.timezone.utc),
                  window_hours=a.window_hours,force=a.force.lower()=="true")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"],"a") as out:
            out.write(f"run={'true' if result['run'] else 'false'}\n")
            out.write(f"hash={result['hash']}\n")
            out.write(f"games={result['games']}\n")
            out.write(f"official_signature={result['official_signature']}\n")
    print("NBA_V5_SOURCE_REFRESH_DECISION",json.dumps(result,sort_keys=True))


if __name__=="__main__":
    main()
