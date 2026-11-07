"""Evaluate actual frozen pretip V4 vs V5 vs deployed blend NUMERICAL means.

Uses immutable final box actuals from the existing postmortem, not retroactive
simulation, odds, target swaps, or model fitting. Comparisons are paired on
the SAME original player/stat rows and cluster resampled by GAME. Conditional
numerical MAE is not the unconditional Brier probability score; results are
descriptive until a separate genuine forward probability test exists.
"""
from __future__ import annotations

import argparse
import gzip
import json
import math
import random
from collections import defaultdict
from pathlib import Path

CORE = ("points", "rebounds", "assists", "three_pointers_made")
ARMS = ("blend", "v4_only", "v5_only")


def _open_archived(path):
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        d = json.load(fh)
    games = d.get("games") or []
    if len(games) != 1 or str(games[0].get("game_id")) != path.name.split(".")[0]:
        raise ValueError("NBA_COMPONENT_ARCHIVE_ID_MISMATCH")
    return games[0]


def _paired(archive_root, grades_root):
    result = []
    for path in sorted(Path(grades_root).glob("*.json")):
        grade = json.loads(path.read_text())
        if grade.get("kind") != "last":
            continue
        gid = str(grade.get("game_id"))
        if gid != path.stem:
            raise ValueError("NBA_COMPONENT_GRADE_ID_MISMATCH")
        archived = Path(archive_root) / (gid + ".json.gz")
        if not archived.exists():
            raise ValueError("NBA_COMPONENT_FROZEN_PRETIP_ARCHIVE_MISSING: " + gid)
        game = _open_archived(archived)
        if game.get("forecast_at_utc") != grade.get("forecast_at_utc"):
            raise ValueError("NBA_COMPONENT_ORIGINAL_FORECAST_TIMESTAMP_MISMATCH")
        if "tipoff_utc" not in game or game["forecast_at_utc"] >= game["tipoff_utc"]:
            raise ValueError("NBA_COMPONENT_NOT_A_PRETIP_FORECAST")
        originals = {}
        for row in game.get("rows", []):
            key = (str(row.get("player_id")), str(row.get("market")))
            if key in originals:
                raise ValueError("NBA_COMPONENT_DUPLICATE_FROZEN_PLAYER_MARKET")
            originals[key] = row
        seen = set()
        for row in grade.get("rows", []):
            if row.get("market") not in CORE or not row.get("played"):
                continue
            key = (str(row.get("player_id")), str(row.get("market")))
            if key in seen:
                raise ValueError("NBA_COMPONENT_DUPLICATE_GRADED_PLAYER_MARKET")
            seen.add(key)
            prior = originals.get(key)
            if not prior:
                raise ValueError("NBA_COMPONENT_GRADE_NOT_IN_PRETIP_ARCHIVE")
            blend = prior.get("blend")
            if not isinstance(blend, dict) or blend.get("weights") != [0.5, 0.5]:
                continue  # Exact three-way comparison requires a true frozen mix.
            actual = float(row["actual"])
            values = {
                "blend": float(prior["mean"]),
                "v4_only": float(blend["v4_model_mean"]),
                "v5_only": float(blend["v5_simulation_mean"]),
            }
            if not all(math.isfinite(v) for v in [actual, *values.values()]):
                raise ValueError("NBA_COMPONENT_NONFINITE_VALUE")
            if abs(values["blend"] - float(row["projection"])) > 0.00011:
                raise ValueError("NBA_COMPONENT_FROZEN_MEAN_NOT_ORIGINAL_GRADE")
            # Both alternatives are compared at exactly this same athlete/event.
            result.append({
                "game_id": gid, "player_id": key[0], "market": key[1],
                "player": row.get("player"),
                "actual": actual,
                "absolute_error": {a: abs(v - actual) for a, v in values.items()},
                "signed_error": {a: v - actual for a, v in values.items()},
                "minutes_error_at_result": (
                    abs(float(row["minutes_forecast"]) - float(row["minutes_actual"]))
                    if row.get("minutes_forecast") is not None and
                       row.get("minutes_actual") is not None else None),
            })
    return result



def _probability_rows(archive_root, grades_root):
    """Grade all previously frozen same-target component chances, including DNP.

    Old forecasts without the pretip component record stay unavailable; never
    reconstruct their probabilities from postgame outcomes or current models.
    """
    from nba.nba_v5_rank import whole
    result = []
    for path in sorted(Path(grades_root).glob("*.json")):
        grade = json.loads(path.read_text())
        if grade.get("kind") != "last":
            continue
        gid = str(grade.get("game_id"))
        if gid != path.stem:
            raise ValueError("NBA_COMPONENT_GRADE_ID_MISMATCH")
        archived = Path(archive_root) / (gid + ".json.gz")
        if not archived.is_file():
            raise ValueError("NBA_COMPONENT_FROZEN_PRETIP_ARCHIVE_MISSING")
        game = _open_archived(archived)
        if (game.get("forecast_at_utc") != grade.get("forecast_at_utc") or
            game["forecast_at_utc"] >= game["tipoff_utc"]):
            raise ValueError("NBA_COMPONENT_PROBABILITY_ORIGINAL_FORECAST_TIME_MISMATCH")
        records = {(str(r.get("player_id")), str(r.get("market"))): r
                   for r in game.get("rows", [])}
        if len(records) != len(game.get("rows", [])):
            raise ValueError("NBA_COMPONENT_PROBABILITY_DUPLICATE_FROZEN_EVENT")
        graded = set()
        for row in grade.get("rows", []):
            mk = row.get("market")
            if mk not in CORE:
                continue
            key = (str(row.get("player_id")), str(mk))
            if key in graded:
                raise ValueError("NBA_COMPONENT_PROBABILITY_DUPLICATE_GRADED_EVENT")
            graded.add(key)
            original = records.get(key)
            if not original:
                raise ValueError("NBA_COMPONENT_PROBABILITY_GRADE_NOT_IN_ARCHIVE")
            trial = original.get("research_fixed_event_component_probabilities")
            if not trial:
                continue
            if trial.get("schema") != "NBA_V5_SAME_TARGET_COMPONENT_PROBS_V1":
                raise ValueError("NBA_COMPONENT_PROBABILITY_SCHEMA_MISMATCH")
            k = int(trial["target"])
            if k < 1 or k != whole(float(original["mean"])):
                raise ValueError("NBA_COMPONENT_PROBABILITY_TARGET_CHANGED")
            if abs(float(row["projection"]) - float(original["mean"])) > 0.00011:
                raise ValueError("NBA_COMPONENT_PROBABILITY_GRADE_MEAN_CHANGED")
            active = bool(row.get("played"))
            if active and row.get("actual") is None:
                raise ValueError("NBA_COMPONENT_PROBABILITY_PLAYED_WITHOUT_FINAL")
            hit = int(active and float(row["actual"]) >= k)
            p = trial["including_dnp_reach"]
            if set(p) != set(ARMS) or any(not isinstance(v, (float, int)) or
                                         not math.isfinite(v) or not 0 <= v <= 1
                                         for v in p.values()):
                raise ValueError("NBA_COMPONENT_PROBABILITY_INVALID_P")
            result.append({
                "game_id": gid, "market": mk, "event": k,
                "hit": hit, "played": active,
                "squared_error": {arm: (float(p[arm]) - hit) ** 2 for arm in ARMS},
            })
    return result


def _brier_stat(rows, seed):
    games = sorted({r["game_id"] for r in rows})
    errors = {
        arm: round(sum(r["squared_error"][arm] for r in rows) / len(rows), 6)
        for arm in ARMS
    }
    groups = defaultdict(list)
    for row in rows:
        groups[row["game_id"]].append(row)
    rng = random.Random(seed)
    intervals = {}
    for arm in ("v4_only", "v5_only"):
        differences = []
        for _ in range(1500):
            sample = [groups[games[rng.randrange(len(games))]] for _ in games]
            n = sum(len(g) for g in sample)
            differences.append(sum(r["squared_error"]["blend"] - r["squared_error"][arm]
                                   for g in sample for r in g) / n)
        differences.sort()
        intervals[arm] = [round(_quantile(differences, 0.025), 6),
                          round(_quantile(differences, 0.975), 6)]
    return {
        "n_original_events_including_dnp": len(rows),
        "n_games": len(games),
        "hits": sum(r["hit"] for r in rows),
        "dnp_events_counted_as_misses": sum(not r["played"] for r in rows),
        "brier": errors,
        "brier_reduction_vs_blend_positive_better": {
            arm: round(errors["blend"] - errors[arm], 6)
            for arm in ("v4_only", "v5_only")},
        "game_cluster_bootstrap_95pct_reduction_interval": intervals,
    }

def _quantile(sorted_vals, pct):
    return sorted_vals[min(len(sorted_vals) - 1, int((len(sorted_vals) - 1) * pct))]


def _stat(rows, seed):
    games = sorted({r["game_id"] for r in rows})
    out = {
        "events": len(rows), "games": len(games),
        "mae": {a: round(sum(x["absolute_error"][a] for x in rows) / len(rows), 5)
                for a in ARMS},
        "mean_signed_error": {a: round(sum(x["signed_error"][a] for x in rows) / len(rows), 5)
                              for a in ARMS},
    }
    reduction = {a: sum(x["absolute_error"]["blend"] - x["absolute_error"][a]
                        for x in rows) / len(rows)
                 for a in ("v4_only", "v5_only")}
    out["mae_reduction_vs_blend_positive_better"] = {a: round(v, 5) for a, v in reduction.items()}
    groups = defaultdict(list)
    for x in rows:
        groups[x["game_id"]].append(x)
    gen = random.Random(seed)
    stats = {"v4_only": [], "v5_only": []}
    for _ in range(1500):
        picked = [groups[games[gen.randrange(len(games))]] for _ in games]
        n = sum(len(g) for g in picked)
        for arm in stats:
            diff = sum(x["absolute_error"]["blend"]-x["absolute_error"][arm]
                       for grp in picked for x in grp) / n
            stats[arm].append(diff)
    out["game_cluster_bootstrap_95pct_reduction_interval"] = {
        a: [round(_quantile(sorted(v), 0.025), 5),
            round(_quantile(sorted(v), 0.975), 5)]
        for a, v in stats.items()
    }
    return out


def compare(archive_root, grades_root):
    rows = _paired(archive_root, grades_root)
    probability_rows = _probability_rows(archive_root, grades_root)
    by_stat = {}
    for market in CORE:
        selected = [x for x in rows if x["market"] == market]
        if selected:
            by_stat[market] = _stat(selected, 20261107 + CORE.index(market))
    per_game = {}
    for gid in sorted({x["game_id"] for x in rows}):
        per_game[gid] = {
            m: {arm: round(sum(r["absolute_error"][arm] for r in sel) / len(sel), 5)
                for arm in ARMS}
            for m in CORE
            if (sel := [x for x in rows if x["game_id"] == gid and x["market"] == m])
        }
    return {
        "schema": "NBA_V5_FROZEN_COMPONENT_COMPARISON_V1",
        "method": "same original pretip athletes, actual final numerical means, played rows only",
        "scope": "last immutable forecast; no later resimulation, no arbitrary alternate targets",
        "projections_evaluated": len(rows),
        "games_evaluated": len(per_game),
        "by_market": by_stat,
        "per_game_mae": per_game,
        "rejected_claims": [
            "Older archives cannot be backfilled with native component probabilities; only future frozen same-target chances can be scored",
            "No prospective promotion from reused small postgame clusters",
            "Conditional MAE excludes DNP, which must be separately evaluated for displayed hit rates",
        ],
        "forward_frozen_same_target_probability": {
            "status": ("FROZEN_COMPONENTS_GRADED" if probability_rows else
                       "WAITING_FOR_NEW_PROSPECTIVE_COMPONENT_FORECASTS"),
            "events": len(probability_rows),
            "by_market": {
                market: _brier_stat([r for r in probability_rows
                                     if r["market"] == market],
                                    20261107 + CORE.index(market))
                for market in CORE
                if any(r["market"] == market for r in probability_rows)
            },
            "basis": "Original V4/V5 conditional CDF at the same frozen blend target; common pretip V5 availability risk",
            "DNP": "Counted as miss; no postgame adjustment",
        },
        "v5_and_v4_component_mean_only": not bool(probability_rows),
        "promoted": False,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--archive-last", required=True)
    p.add_argument("--grades-last", required=True)
    p.add_argument("--out", required=True)
    a = p.parse_args()
    output = compare(a.archive_last, a.grades_last)
    dest = Path(a.out)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(output, indent=2, sort_keys=True) + "\n")
    print("NBA_V5_FROZEN_COMPONENT_MAE", json.dumps({
        "games": output["games_evaluated"],
        "events": output["projections_evaluated"],
        "markets": output["by_market"],
        "prospective_probability": output["forward_frozen_same_target_probability"],
        "promoted": False,
    }, sort_keys=True))


if __name__ == "__main__":
    main()
