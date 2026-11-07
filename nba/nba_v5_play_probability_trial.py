"""Prospective-style V5 P(play) challenger for unlisted players.

Keeps every original frozen pretip player (including DNP) at the same
date/team and game-status evidence. Candidate features come only from
earlier Eastern calendar-day games; after-game boxes supply labels ONLY.
No retrospective new-player selection, synthetic active certification,
moneyline/betting inputs or production model change.
"""
from __future__ import annotations

import argparse
import json
import math
import random
from collections import defaultdict
from pathlib import Path

from nba.nba_v5_rotation_attribution import _archived, _timestamp, load_past_team_games

from nba.nba_v5_recency_pplay import estimate_unlisted, LOOKBACK, HALF_LIFE_GAMES, PRIOR_P, PRIOR_GAME_EQUIVALENTS

def _loss(p,y):
    x=max(1e-7,min(1-1e-7,p))
    return -y*math.log(x)-(1-y)*math.log(1-x)


def _summarize(records):
    if not records:
        return {"n":0}
    n=len(records)
    return {
        "n":n,"games":len({r["game_id"] for r in records}),
        "played":sum(r["played"] for r in records),
        "actual_play_fraction":round(sum(r["played"] for r in records)/n,5),
        "incumbent_mean_P_play":round(sum(r["incumbent"] for r in records)/n,5),
        "candidate_mean_P_play":round(sum(r["candidate"] for r in records)/n,5),
        "incumbent_Brier":round(sum((r["incumbent"]-r["played"])**2 for r in records)/n,6),
        "candidate_Brier":round(sum((r["candidate"]-r["played"])**2 for r in records)/n,6),
        "incumbent_logloss":round(sum(_loss(r["incumbent"],r["played"]) for r in records)/n,6),
        "candidate_logloss":round(sum(_loss(r["candidate"],r["played"]) for r in records)/n,6),
        "changed":sum(abs(r["incumbent"]-r["candidate"])>1e-5 for r in records),
        "reasons":{reason:sum(r["reason"]==reason for r in records)
                   for reason in sorted({r["reason"] for r in records})},
    }


def compare(archive_root,grades_root,history_paths):
    if not history_paths:
        raise ValueError("NBA_V5_PPLAY_REQUIRES_TRUE_PRIOR_BOX_HISTORY")
    histories=load_past_team_games(history_paths)
    rows=[]
    for grade_path in sorted(Path(grades_root).glob("*.json")):
        grade=json.loads(grade_path.read_text())
        if grade.get("kind")!="last":continue
        gid=str(grade["game_id"])
        if gid!=grade_path.stem:
            raise ValueError("NBA_V5_PPLAY_GRADE_ID_CHANGED")
        frozen=Path(archive_root)/(gid+".json.gz")
        if not frozen.exists():
            raise ValueError("NBA_V5_PPLAY_ORIGINAL_FORECAST_MISSING")
        g=_archived(frozen)
        if g["forecast_at_utc"]!=grade["forecast_at_utc"]:
            raise ValueError("NBA_V5_PPLAY_GRADING_TIME_MISMATCH")
        day=_timestamp(g["tipoff_utc"]).date()
        original={(str(x["player_id"]),str(x["market"])):x
                  for x in g["rows"]}
        if len(original)!=len(g["rows"]):
            raise ValueError("NBA_V5_PPLAY_DUPLICATE_ORIGINAL_EVENT")
        teamids={str(g["home_id"]),str(g["away_id"])}
        seen=set()
        for r in grade["rows"]:
            if r.get("market")!="points":continue
            pid=str(r["player_id"])
            if pid in seen:
                raise ValueError("NBA_V5_PPLAY_DUPLICATE_GRADED_PLAYER")
            seen.add(pid)
            before=original.get((pid,"points"))
            if not before:
                raise ValueError("NBA_V5_PPLAY_EVENT_NOT_IN_FROZEN")
            p=float(before["p_active"])
            if not 0<=p<=1:
                raise ValueError("NBA_V5_PPLAY_INVALID_INCUMBENT_PROB")
            tid=str(before["team_id"])
            if tid not in teamids:
                raise ValueError("NBA_V5_PPLAY_TEAM_MISMATCH")
            original_status=str(before.get("reported_status") or "")
            # DO NOT override known or suspected injury statuses; also do
            # not infer full game availability from an NBA active roster.
            if original_status=="UNKNOWN_NOT_ACTIVE_CERTIFIED":
                alt,reason=estimate_unlisted(p,histories.get(tid,[]),pid,day)
            else:
                alt,reason=p,"UNCHANGED_EXPLICIT_OR_UNVERIFIED_STATUS"
            rows.append({
                "game_id":gid,"player_id":pid,"team_id":tid,
                "original_status":original_status,"incumbent":p,
                "candidate":alt,"reason":reason,
                "played":int(bool(r["played"])),
            })
    unknown=[r for r in rows if r["original_status"]=="UNKNOWN_NOT_ACTIVE_CERTIFIED"]
    groups=defaultdict(list)
    for r in unknown:
        groups[r["game_id"]].append(r)
    game_ids=sorted(groups)
    ci=None
    if game_ids:
        rng=random.Random(20261107)
        differences=[]
        for _ in range(1500):
            sampled=[groups[game_ids[rng.randrange(len(game_ids))]] for _ in game_ids]
            n=sum(len(chunk) for chunk in sampled)
            differences.append(sum(
                (r["incumbent"]-r["played"])**2-
                (r["candidate"]-r["played"])**2
                for chunk in sampled for r in chunk)/n)
        differences.sort()
        ci=[round(differences[int(.025*(len(differences)-1))],6),
            round(differences[int(.975*(len(differences)-1))],6)]
    original=_summarize(unknown)
    original["Brier_reduction_positive_better"]=round(
        original["incumbent_Brier"]-original["candidate_Brier"],6) if unknown else None
    original["game_cluster_bootstrap_95pct_interval"]=ci
    return {
        "schema":"NBA_V5_UNLISTED_PPLAY_FIXED_RESEARCH_TRIAL_V1",
        "original_frozen_players_scored_all_including_DNP":len(rows),
        "unlisted_status_challenger":original,
        "other_statuses_unchanged":_summarize(
            [r for r in rows if r["original_status"]!="UNKNOWN_NOT_ACTIVE_CERTIFIED"]),
        "formula":{
            "prior_p":PRIOR_P,"prior_game_equivalents":PRIOR_GAME_EQUIVALENTS,
            "lookback_games":LOOKBACK,"half_life_games":HALF_LIFE_GAMES,
            "pre_first_current_team_appearance_excluded":True,
            "same_or_later_target_game_calendar_day_excluded":True,
        },
        "per_game":{gid:_summarize(group) for gid,group in sorted(groups.items())},
        "candidate_promotion_allowed":False,
        "limitation":"Known original 11-game retrospective audit identified this underconfidence; candidate is exploratory, not an untouched forward holdout.",
        "no_production_model_weight_or_frontend_change":True,
    }


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--archive-last",required=True)
    p.add_argument("--grades-last",required=True)
    p.add_argument("--historical-games",action="append",required=True)
    p.add_argument("--out",required=True)
    a=p.parse_args()
    result=compare(a.archive_last,a.grades_last,a.historical_games)
    dest=Path(a.out)
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(result,sort_keys=True,indent=2)+"\n")
    print("NBA_V5_UNLISTED_PPLAY_TRIAL",json.dumps({
        "unlisted":result["unlisted_status_challenger"],
        "other_statuses":result["other_statuses_unchanged"],
        "promotion_allowed":False,
    },sort_keys=True))


if __name__=="__main__":
    main()
