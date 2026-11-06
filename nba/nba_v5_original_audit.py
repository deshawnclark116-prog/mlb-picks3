"""Audit EVERY frozen original NBA V5 player/stat distribution against final grades.

This is a separate read-only derivation from immutable first-seen forecasts.
It can reconstruct unconditional reach probabilities for older forecasts that
predate the reach_probabilities display field. The original forecast, event
threshold, source CDF and DNP probability never change after the outcome.
No sportsbook inputs and no re-fitting against the audited games.
"""
from __future__ import annotations

import argparse
import collections
import gzip
import hashlib
import json
import math
from pathlib import Path

from nba.nba_v5_rank import MARKET_ORDER, whole


def original_probability(row):
    """Return frozen threshold + P(reach|active), P(reach incl DNP).

    Missing/truncated information is ungradable, not assigned 50%, zero, or
    an estimated probability based on the realized outcome.
    """
    if row.get("mean_basis") != "CONDITIONAL_ON_PLAYING":
        return None, "NONCONDITIONAL_ROW"
    try:
        mean = float(row["mean"])
        p = float(row["p_active"])
    except (ValueError, TypeError, KeyError):
        return None, "MISSING_OR_INVALID_MEAN_OR_PLAY_CHANCE"
    if not math.isfinite(mean) or not math.isfinite(p) or not (0 <= p <= 1):
        return None, "MISSING_OR_INVALID_MEAN_OR_PLAY_CHANCE"
    threshold = whole(mean)
    if threshold < 1:
        return None, "NONPOSITIVE_THRESHOLD"
    lat = row.get("cdf_lattice") or {}
    cdf = lat.get("cdf") if isinstance(lat, dict) else None
    if not isinstance(cdf, list) or not cdf:
        return None, "MISSING_FROZEN_DISTRIBUTION"
    try:
        vals = [float(x) for x in cdf]
    except (ValueError, TypeError):
        return None, "INVALID_FROZEN_DISTRIBUTION"
    if any(not math.isfinite(v) or not (0 <= v <= 1) for v in vals):
        return None, "INVALID_FROZEN_DISTRIBUTION"
    if any(b + 1e-7 < a for a, b in zip(vals, vals[1:])):
        return None, "NONMONOTONE_FROZEN_DISTRIBUTION"
    # V5 intentionally removes trailing CDF=1 values, so k beyond the
    # published lattice is a proven probability zero, not a missing sample.
    cond = 0.0 if threshold - 1 >= len(vals) else 1.0 - vals[threshold - 1]
    cond = max(0.0, min(1.0, cond))
    return {"whole_projection": threshold, "probability_if_playing": cond,
            "probability_including_dnp": p * cond, "p_active": p}, None


def audit_game(original, grade, source_sha256):
    gid = str(original.get("game_id"))
    if gid != str(grade.get("game_id")) or grade.get("kind") != "first":
        raise ValueError("Wrong game or not the immutable first-seen grade: " + gid)
    original_time = original.get("forecast_at_utc")
    graded_time = grade.get("forecast_at_utc")
    if original_time and graded_time and original_time != graded_time:
        raise ValueError("Forecast timestamp mismatch: " + gid)
    actual_rows = {}
    for row in grade.get("rows") or []:
        key = (str(row["player_id"]), row["market"])
        if key in actual_rows:
            raise ValueError("Duplicate final grade player/stat: " + str(key))
        actual_rows[key] = row
    seen = set()
    out = []
    for row in original.get("rows") or []:
        if row.get("mean_basis") != "CONDITIONAL_ON_PLAYING" or row.get("market") not in MARKET_ORDER:
            continue
        key = (str(row["player_id"]), row["market"])
        if key in seen:
            raise ValueError("Duplicate frozen player/stat: " + str(key))
        seen.add(key)
        final = actual_rows.get(key)
        if final is None:
            raise ValueError("Missing final grade for an original row: " + str(key))
        if not math.isclose(float(row["mean"]), float(final["projection"]), abs_tol=0.00011):
            raise ValueError("Frozen numeric projection changed in grading: " + str(key))
        if not math.isclose(float(row["p_active"]), float(final["p_active"]), abs_tol=0.00011):
            raise ValueError("Frozen participation chance changed in grading: " + str(key))
        played = final.get("played")
        if type(played) is not bool or (played and final.get("actual") is None):
            raise ValueError("Final played/actual status invalid for " + str(key))
        actual = float(final["actual"]) if played else None
        probability, reason = original_probability(row)
        target = probability["whole_projection"] if probability else None
        hit = (1 if played and actual >= target else 0) if probability else None
        shown = row.get("frontend_rank")
        if shown is None:
            shown = final.get("frontend_rank")
        out.append({
            "player": row.get("player"), "player_id": key[0], "market": key[1],
            "frozen_mean": float(row["mean"]), "whole_projection": target,
            "probability_if_playing": None if probability is None else probability["probability_if_playing"],
            "probability_including_dnp": None if probability is None else probability["probability_including_dnp"],
            "p_active": float(row["p_active"]), "played": played, "actual": actual,
            "hit_including_dnp": hit, "frontend_rank": shown,
            "minutes_forecast": row.get("minutes_mean"), "minutes_actual": final.get("minutes_actual"),
            "p10": row.get("p10"), "p90": row.get("p90"),
            "archetype": (row.get("archetype") or {}).get("role_class", "UNKNOWN"),
            "gradable": probability is not None, "ungradable_reason": reason,
        })
    if set(actual_rows) != seen:
        raise ValueError("Final grader has rows missing from original archive: " + gid)
    return {"game_id": gid, "forecast_at_utc": original_time,
            "immutable_archive_sha256": source_sha256,
            "rows": out, "original_row_count": len(out),
            "gradable_row_count": sum(x["gradable"] for x in out),
            "ungradable_row_count": sum(not x["gradable"] for x in out)}


def summarize(games, pending):
    buckets = collections.defaultdict(list)
    causes = collections.Counter()
    games_list = []
    for game in games:
        for row in game["rows"]:
            if not row["gradable"]:
                causes[row["ungradable_reason"]] += 1
                continue
            entries = ["all_original_rows", "stat_" + row["market"],
                       "displayed" if row["frontend_rank"] is not None else "not_displayed",
                       "active" if row["played"] else "DNP"]
            p = row["p_active"]
            entries.append("p_active_low" if p < .5 else "p_active_medium" if p < .85 else "p_active_high")
            minutes = row.get("minutes_forecast")
            if minutes is not None:
                entries.append("predicted_minutes_28_plus" if float(minutes) >= 28 else "predicted_minutes_under_28")
            entries.append("archetype_" + row["archetype"])
            for k in entries:
                buckets[k].append(row)
        games_list.append({"game_id":game["game_id"],
                           "original_rows":game["original_row_count"],
                           "gradable_rows":game["gradable_row_count"],
                           "ungradable_rows":game["ungradable_row_count"],
                           "all_player_stat_rows_included": True})
    grouped = {}
    for k, rows in buckets.items():
        ps = [r["probability_including_dnp"] for r in rows]
        hs = [r["hit_including_dnp"] for r in rows]
        active = [r for r in rows if r["played"]]
        covered = [r for r in active if r["p10"] is not None and r["p90"] is not None]
        grouped[k] = {"n":len(rows),
                      "mean_stated_probability":round(sum(ps)/len(ps),5),
                      "actual_hit_rate":round(sum(hs)/len(hs),5),
                      "brier":round(sum((p-h)**2 for p,h in zip(ps,hs))/len(rows),6),
                      "played_n":len(active),
                      "conditional_mae":round(sum(abs(r["actual"]-r["frozen_mean"]) for r in active)/len(active),5) if active else None,
                      "p10_p90_coverage_when_playing":round(sum(r["p10"] <= r["actual"] <= r["p90"] for r in covered)/len(covered),5) if covered else None}
    allrows = sum(g["original_row_count"] for g in games)
    gradable = sum(g["gradable_row_count"] for g in games)
    return {"schema":"NBA_V5_FIRST_SEEN_ALL_ROW_CALIBRATION_V1",
            "source":"immutable original pregame archive + first-seen completed final grades",
            "graded_games":len(games),"pending_or_not_final_games":sorted(pending),
            "original_rows":allrows,"gradable_rows":gradable,
            "ungradable_rows":allrows-gradable,
            "ungradable_reasons":dict(causes),
            "promote_a_new_model_from_this_audit":False,
            "needs_more_independent_forward_games":len(games)<100,
            "by_game":games_list,"groups":grouped}


def build(archive_dir, grade_dir):
    games = []
    pending = []
    seen = set()
    for fp in sorted(Path(archive_dir).glob("*.json.gz")):
        raw = fp.read_bytes()
        doc = json.loads(gzip.decompress(raw))
        sha = hashlib.sha256(raw).hexdigest()
        for original in doc.get("games") or []:
            gid = str(original.get("game_id"))
            if gid in seen:
                raise ValueError("Duplicate immutable original archive: " + gid)
            seen.add(gid)
            gradefile = Path(grade_dir) / (gid + ".json")
            if not gradefile.exists():
                pending.append(gid)
                continue
            grade = json.loads(gradefile.read_text())
            games.append(audit_game(original, grade, sha))
    return {"summary":summarize(games,pending),"games":games}


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--archive-first",required=True)
    ap.add_argument("--grades-first",required=True)
    ap.add_argument("--out",required=True)
    a=ap.parse_args()
    result=build(a.archive_first,a.grades_first)
    target=Path(a.out)
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(result,indent=1)+"\n")
    print("NBA_V5_ALL_ORIGINAL_FORECASTS_AUDITED",json.dumps({
          k:result["summary"][k] for k in ("graded_games","pending_or_not_final_games","original_rows",
                                             "gradable_rows","ungradable_rows")}))
if __name__=="__main__":
    main()
