#!/usr/bin/env python3
"""Forward-safe, read-only audit of the *actual* NBA V5 confirmed-starter card.

The old postmortem "frontend_top4" ranks every likely-active player, including
unconfirmed starters and bench players. It also compares conditional-on-playing
reach probabilities to outcomes even though the V5 UI prints P(reach incl DNP).

Rebuild eligible picks from each immutable pre-tip archive, using the actual
frontend's same market, probability, rounding, sort, and starter-confirmation
rules. Join to frozen independent final-game grade files. Do not rewrite
forecasts, grading archives, production probabilities, or displayed picks.

A single predetermined challenger uses prequential, shrunk market/global
calibration learned only from dates strictly before each evaluated game.
A promotion requires >0 Brier improvement with a game-cluster confidence
interval entirely above zero, no reduction in hits, sufficient held-out n,
and a positive result on a separately frozen future dataset.
This script never promotes changes.
"""
from __future__ import annotations
import argparse
import collections
from datetime import datetime
import gzip
import json
import math
from pathlib import Path
import random
from zoneinfo import ZoneInfo

MINIMUM = {"points":6, "rebounds":3, "assists":2,
           "three_pointers_made":1, "steals":1, "blocks":1}
MARKET_ORDER = list(MINIMUM)
ET = ZoneInfo("America/New_York")


def whole(v):
    return math.floor(v)+(v-math.floor(v)>=.6-1e-10)


def date_et(timestamp):
    return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).astimezone(ET).date().isoformat()


def load_archive(path):
    if path.suffix==".gz":
        with gzip.open(path, "rt") as f:
            return json.load(f)
    return json.loads(path.read_text())


def reach(row, target):
    lat = row.get("cdf_lattice") or {}
    cdf = lat.get("cdf") or []
    if lat.get("step") != 1 or target < 1 or target>len(cdf):
        return None
    q = cdf[target-1]
    if not isinstance(q, (int,float)) or not math.isfinite(q) or not 0<=q<=1:
        return None
    return 1.0-float(q)


def select(game, grade_rows, *, require_confirmed=True):
    """Returns exact public card order as of this immutable source snapshot."""
    actuals={(str(r["player_id"]),r["market"]):r for r in grade_rows}
    eligible=[]
    seen=set()
    for row in game.get("rows", []):
        market=row.get("market")
        if market not in MINIMUM or row.get("reported_status")=="OUT" or not (float(row.get("p_active") or 0)>=.75):
            continue
        if require_confirmed and row.get("starter_evidence")!="CONFIRMED_STARTER":
            continue
        mean=row.get("mean")
        if not isinstance(mean,(int,float)) or not math.isfinite(mean) or mean<0:
            continue
        target=whole(mean)
        if target<MINIMUM[market]:
            continue
        prob_if_playing=reach(row, target)
        if prob_if_playing is None:
            continue
        chance=row.get("reach_probabilities") or {}
        # UI displays DNP-inclusive when the matching whole projection exists.
        if chance.get("whole_projection")==target:
            p=chance.get("probability_including_dnp")
        else:
            p=prob_if_playing
        if not isinstance(p,(float,int)) or not math.isfinite(p) or not 0<=p<=1:
            continue
        key=(str(row.get("player_id")),market)
        if key in seen:
            raise ValueError("duplicate player-market in frozen pregame game")
        seen.add(key)
        graded=actuals.get(key)
        if graded is None:
            raise ValueError("archived card outcome has no exact same-game grade")
        hit=int(bool(graded.get("played")) and graded.get("actual") is not None and graded["actual"]>=target)
        eligible.append({"player":row.get("player"),"player_id":key[0],
                         "market":market,"target":target,"p":float(p),"y":hit,
                         "p_active":float(row["p_active"]),"causes":graded.get("causes") or [],
                         "minutes_forecast":graded.get("minutes_forecast"),"minutes_actual":graded.get("minutes_actual"),
                         "model_version":row.get("model_version"),
                         "starter_evidence":row.get("starter_evidence")})
    eligible.sort(key=lambda x:(-x["p"],-x["p_active"],x["player"] or "",MARKET_ORDER.index(x["market"])))
    return eligible


def paired_metrics(rows):
    if not rows:
        return {"n":0}
    n=len(rows)
    p=sum(x["p"] for x in rows)/n
    hits=sum(x["y"] for x in rows)
    return {"n":n,"hits":hits,"hit_rate":round(hits/n,4),
            "average_probability":round(p,4),
            "gap":round(p-hits/n,4),
            "brier":round(sum((x["p"]-x["y"])**2 for x in rows)/n,6)}


def calibration_offset(training,market):
    """One fixed, conservative hypothesis; zero training or lookahead means zero adjustment."""
    if len(training)<60:
        return 0.
    residual=sum(r["y"]-r["p"] for r in training)
    same=[r for r in training if r["market"]==market]
    mr=sum(r["y"]-r["p"] for r in same)
    return max(-.08,min(.08, .4*residual/(len(training)+80.) + .6*mr/(len(same)+80.)))


def score_calibrator(game_samples, *, min_games=15):
    """Walk forward by full ET day: no same-date or later result enters training."""
    by_day=collections.defaultdict(list)
    for g in game_samples:
        by_day[g["day"]].append(g)
    dates=sorted(by_day)
    if not dates:
        return {"status":"NO_ARCHIVED_GAMES"}
    # Burn-in is fixed at the earlier 60% of distinct dates; only later dates
    # are compared. The challenger stays SHADOW even if it beats the baseline.
    holdout_start=dates[max(1,math.floor(.6*len(dates)))]
    history=[]
    baseline=[]
    challenger=[]
    per_game={}
    shadow_by_market=collections.defaultdict(list)
    for day in dates:
        games=by_day[day]
        for g in games:
            rows=g["eligible"]
            if len(rows)<4:
                continue
            old=rows[:4]
            altered=[{**x,"p":max(.001,min(.999,x["p"]+calibration_offset(history,x["market"])))}
                     for x in rows]
            altered.sort(key=lambda x:(-x["p"],-x["p_active"],x["player"],MARKET_ORDER.index(x["market"])))
            new=altered[:4]
            if day>=holdout_start:
                baseline.extend(old)
                challenger.extend(new)
                per_game[g["game_id"]]={"old":old,"new":new}
                for x in new:
                    shadow_by_market[x["market"]].append(x)
        # Only previous completed *calendar days* enter the next game's fit.
        history.extend(x for g in games for x in g["eligible"])
    old=paired_metrics(baseline)
    new=paired_metrics(challenger)
    if not baseline:
        return {"status":"NO_HOLDOUT_TOP4","holdout_start":holdout_start}
    delta=old["brier"]-new["brier"]
    names=sorted(per_game)
    bootstrap=[]
    randomgen=random.Random(51103)
    for _ in range(800):
        chosen=[per_game[randomgen.choice(names)] for _ in names]
        a=[x for g in chosen for x in g["old"]]
        b=[x for g in chosen for x in g["new"]]
        bootstrap.append(paired_metrics(a)["brier"]-paired_metrics(b)["brier"])
    bootstrap.sort()
    ci=[round(bootstrap[20],6),round(bootstrap[779],6)]
    # Never auto-promote based on these already-inspected 2026 games.
    return {"status":"RESEARCH_ONLY_DO_NOT_PROMOTE","distinct_dates":len(dates),
            "holdout_from":holdout_start,"holdout_games":len(per_game),
            "baseline":old,"shadow":new,"brier_reduction":round(delta,6),
            "brier_reduction_95pct_game_cluster_ci":ci,
            "different_selection_count":sum(len(set((x["player_id"],x["market"]) for x in g["old"])^
                                            set((x["player_id"],x["market"]) for x in g["new"]))//2 for g in per_game.values()),
            "by_market":{k:paired_metrics(v) for k,v in sorted(shadow_by_market.items())},
            "promotion_allowed":False,
            "future_prospective_independent_confirmation_required":True}


def run(archives,grades,*,kind="last"):
    grade_paths=list((grades/kind).glob("*.json"))
    grades_by_id={p.stem:json.loads(p.read_text()) for p in grade_paths}
    sources=list((archives/kind).glob("*.json"))+list((archives/kind).glob("*.json.gz"))
    games=[]
    missing_grade=0
    no_verified_lineups=0
    not_pretip=0
    missing_dnp=0
    for fp in sorted(sources):
        doc=load_archive(fp)
        for g in doc.get("games", []):
            game_id=str(g.get("game_id"))
            grade=grades_by_id.get(game_id)
            if grade is None:
                missing_grade+=1
                continue
            ts=g.get("forecast_at_utc")
            tip=g.get("tipoff_utc")
            if not ts or not tip or datetime.fromisoformat(ts.replace("Z","+00:00"))>=datetime.fromisoformat(tip.replace("Z","+00:00")):
                not_pretip+=1
                continue
            # Avoid turning archived later reports into earlier fake starter evidence.
            eligible=select(g,grade.get("rows",[]),require_confirmed=True)
            if not eligible:
                no_verified_lineups+=1
            missing_dnp+=sum(x.get("reach_probabilities") is None for x in g.get("rows",[]) if x.get("starter_evidence")=="CONFIRMED_STARTER")
            games.append({"game_id":game_id,"day":date_et(tip),"eligible":eligible,
                         "archived_at":ts,"tipoff":tip,"model_version":g.get("model_version"),
                         "all_grade_rows":grade.get("rows",[])})
    games.sort(key=lambda g:(g["day"],g["tipoff"],g["game_id"]))
    top4=[x for g in games for x in g["eligible"][:4]]
    top10=[x for g in games for x in g["eligible"][:10]]
    by_market=collections.defaultdict(list)
    for x in top4:
        by_market[x["market"]].append(x)
    causes=collections.Counter(c for x in top4 if not x["y"] for c in x["causes"])
    repeated=collections.Counter((x["player"],x["market"]) for x in top4)
    return {"schema":"NBA_V5_IMMUTABLE_EXACT_CONFIRMED_CARD_AUDIT_V1",
            "kind":kind,"games_with_archives_and_grades":len(games),
            "games_without_eligible_confirmed_starters":no_verified_lineups,
            "files_missing_final_grade":missing_grade,"post_tip_forecasts_rejected":not_pretip,
            "confirmed_starters_missing_dnp_contract":missing_dnp,
            "top4":paired_metrics(top4),"top10":paired_metrics(top10),
            "top4_by_market":{k:paired_metrics(v) for k,v in sorted(by_market.items())},
            "top4_miss_causes":causes.most_common(),
            "repeat_selected":repeated.most_common(12),
            "shadow_candidate":score_calibrator(games),
            "production_changes":False,
            "immutable_source_replay":True}


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--archive",default="docs/nba_v5_archive")
    ap.add_argument("--grades",default="docs/nba_v5_grades")
    ap.add_argument("--kind",choices=["last","first"],default="last")
    ap.add_argument("--out",default="")
    a=ap.parse_args()
    report=run(Path(a.archive),Path(a.grades),kind=a.kind)
    report_json=json.dumps(report,indent=2)
    if a.out:
        Path(a.out).write_text(report_json)
    print(report_json)
    return 0


if __name__=="__main__":
    raise SystemExit(main())
