#!/usr/bin/env python3
"""NHL independent numerical POINT COUNT research, NOT the points>0 classifier.

Consumes real skater-game points strictly prior to the game being forecast.
Weights are frozen before evaluation; no sportsbook data or posted outcomes
enter individual forward features. Full historical 2025/2026 results are
retrospective research, not an untouched holdout or authorization to bet.
Never backfill a missed pregame model card after puck drop.
"""
from __future__ import annotations
import argparse, hashlib, json, math, sqlite3
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean

SCHEMA = "NHL_INDEPENDENT_POINTS_NUMERIC_RESEARCH_V1"
VERSION = "nhl_points_empirical_bayes_v01_FROZEN"
# Precommitted constants; no holdout tuning after grading.
WEIGHTS = {"season": 0.55, "recent5": 0.30, "prior_season": 0.15}
MIN_CURRENT_GAMES = 3
MIN_PRIOR_SEASON_GAMES = 20
MIN_BACKTEST_ROWS = 1000


def utc(value: str) -> datetime:
    t = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if t.tzinfo is None:
        raise ValueError("NAIVE_FORECAST_TIMESTAMP")
    return t.astimezone(timezone.utc)


def as_date(value: str) -> str:
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except Exception as e:
        raise ValueError("INVALID_NHL_GAME_DATE") from e
    return value


def rows_from_db(path: Path) -> list[dict]:
    if not path.exists() or path.stat().st_size == 0:
        raise ValueError("MISSING_NHL_HISTORICAL_SKATER_GAMES")
    con = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    try:
        result = [dict(row) for row in con.execute(
            """SELECT player_id, game_id, team, opponent, season, game_date,
                      points, goals, assists, toi_seconds
               FROM skater_games
               ORDER BY game_date, game_id, player_id""")]
    finally:
        con.close()
    seen = set()
    valid = []
    anomalous_toi = []
    for row in result:
        key = (str(row["player_id"]), str(row["game_id"]))
        if key in seen:
            raise ValueError("DUPLICATE_SKATER_GAME_ID")
        seen.add(key)
        as_date(row["game_date"])
        if (row["points"] is None or row["goals"] is None or
            row["assists"] is None or
            any(not isinstance(row[k], int) or row[k] < 0
                for k in ("points", "goals", "assists")) or
            row["points"] != row["goals"] + row["assists"] or
            not isinstance(row["toi_seconds"], (float, int)) or
            not math.isfinite(row["toi_seconds"])):
            raise ValueError("BAD_OFFICIAL_SKATER_STAT_ROW")
        if row["toi_seconds"] <= 0:
            anomalous_toi.append(key)
            continue
        valid.append(row)
    # One historical 2020 NHL API row has 1 point with recorded TOI=0.
    # Exclude it visibly from modeling rather than fabricate participation.
    # A material source-quality collapse must still halt the pipeline.
    if len(anomalous_toi) > max(1, len(result) // 10000):
        raise ValueError("EXCESSIVE_ZERO_TOI_HISTORICAL_CORRUPTION")
    print("NHL_SOURCE_QUARANTINED_NONPOSITIVE_TOI",
          len(anomalous_toi), anomalous_toi[:5], flush=True)
    return valid


def projection(history: list[dict], season: int):
    # Never use a future row or a nonparticipant as if it played.
    current = [r for r in history if r["season"] == season]
    prior = [r for r in history if r["season"] == season - 1]
    if len(current) < MIN_CURRENT_GAMES:
        return None
    season_avg = mean(r["points"] for r in current)
    recent5 = mean(r["points"] for r in current[-5:])
    last3 = mean(r["points"] for r in current[-3:])
    if len(prior) >= MIN_PRIOR_SEASON_GAMES:
        prior_avg = mean(r["points"] for r in prior)
        estimate = (WEIGHTS["season"] * season_avg +
                    WEIGHTS["recent5"] * recent5 +
                    WEIGHTS["prior_season"] * prior_avg)
        prior_n = len(prior)
    else:
        prior_avg = None
        prior_n = len(prior)
        # Renormalize weights when genuinely missing a prior-season sample.
        norm = WEIGHTS["season"] + WEIGHTS["recent5"]
        estimate = (WEIGHTS["season"] * season_avg +
                    WEIGHTS["recent5"] * recent5) / norm
    if not math.isfinite(estimate) or estimate < 0:
        raise ValueError("NONFINITE_NUMERICAL_POINTS_PROJECTION")
    return {
        "projected_mean_points": round(estimate, 4),
        "current_season_games": len(current),
        "prior_season_games": prior_n,
        "historical_season_mean": round(season_avg, 4),
        "historical_recent5_mean": round(recent5, 4),
        "historical_last3_mean": round(last3, 4),
        "historical_prior_season_mean": round(prior_avg, 4) if prior_avg is not None else None,
    }


def forward_grade(rows: list[dict], start_season=2025, end_season=2026):
    by_player = defaultdict(list)
    errors = defaultdict(list)
    examples = []
    by_date = defaultdict(list)
    for row in rows:
        by_date[row["game_date"]].append(row)
    # Enumerate strictly by game_date. Same-day multiple matches must not
    # provide one game's result to another; snapshot history before date.
    for date in sorted(by_date):
        batch = by_date[date]
        for r in batch:
            if not start_season <= r["season"] <= end_season:
                continue
            p = projection(by_player[str(r["player_id"])], r["season"])
            if p is None:
                continue
            actual = r["points"]
            model_err = abs(p["projected_mean_points"] - actual)
            last3_err = abs(p["historical_last3_mean"] - actual)
            season_err = abs(p["historical_season_mean"] - actual)
            errors[r["season"]].append((model_err, last3_err, season_err))
            if len(examples) < 12:
                examples.append({
                    "season": r["season"], "date": date, "player_id": str(r["player_id"]),
                    "team": r["team"], "numerical_prediction": p["projected_mean_points"],
                    "actual_points": actual
                })
        for r in batch:
            by_player[str(r["player_id"])].append(r)
    def summary(value):
        if not value:
            return {"n": 0, "model_mae": None,
                    "last3_mae": None, "season_mae": None}
        return {
            "n": len(value),
            "model_mae": round(mean(x[0] for x in value), 4),
            "last3_mae": round(mean(x[1] for x in value), 4),
            "season_mae": round(mean(x[2] for x in value), 4),
            "model_improvement_vs_last3": round(mean(x[1] - x[0] for x in value), 4),
            "model_improvement_vs_season": round(mean(x[2] - x[0] for x in value), 4),
        }
    seasons = {str(k): summary(v) for k, v in sorted(errors.items())}
    all_rows = [r for v in errors.values() for r in v]
    overall = summary(all_rows)
    # Require measurable improvement versus both simple baselines for BOTH
    # years before displaying model estimates as research predictions.
    allowed = bool(
        overall["n"] >= MIN_BACKTEST_ROWS and
        all(k in seasons and seasons[k]["n"] >= 200 and
            seasons[k]["model_improvement_vs_last3"] > 0 and
            seasons[k]["model_improvement_vs_season"] > 0
            for k in ("2025", "2026"))
    )
    return {
        "overall": overall, "by_season": seasons, "examples": examples,
        "research_display_gate_passed": allowed,
        "gate": "2025/2026 paired strictly-past games; >=1000 overall, >=200 each year; MAE better than last3 AND season in each year",
        "not_an_untouched_holdout": True,
        "play_only_grade_condition": "observed skater participation (toi_seconds>0); scratches are not zero graded",
    }


def future_board(history: list[dict], upstream: dict, as_of: datetime, *, published_at: str):
    if not isinstance(upstream, dict) or not isinstance(upstream.get("picks"), list):
        raise ValueError("MISSING_PUBLISHED_NHL_CANDIDATE_BOARD")
    generated = utc(upstream["generated_at_utc"])
    if generated > as_of:
        raise ValueError("FUTURE_UPSTREAM_PUBLICATION_CLOCK")
    by_player = defaultdict(list)
    for row in history:
        by_player[str(row["player_id"])].append(row)
    result = []
    seen = set()
    for item in upstream["picks"]:
        if item.get("market") not in ("points", "points_early_season"):
            continue
        pid = str(item.get("player_id"))
        kickoff = utc(item.get("kickoff_utc", ""))
        if not generated < kickoff or not as_of < kickoff:
            # No retroactive presentation of a new numerical forecast
            # for a game already underway, even if its features predate it.
            continue
        date = as_date(item["game_date"])
        key = (pid, item["team"], item["opponent"], item["game_date"])
        if key in seen:
            # Two binary models for the same player do not become two
            # independent numeric predictions.
            continue
        seen.add(key)
        season = int(item["season"])
        past = [r for r in by_player[pid] if r["game_date"] < date]
        # A recent duplicate player/team identity cannot rescue a trade.
        if past and past[-1]["team"] != item["team"]:
            continue
        p = projection(past, season)
        if p is None:
            continue
        result.append({
            "player_id": pid, "player": item["player"], "team": item["team"],
            "opponent": item["opponent"], "game_date": date,
            "kickoff_utc": item["kickoff_utc"], "market": "points",
            "source_market": item["market"],
            "source_board_generated_at_utc": upstream["generated_at_utc"],
            "numerical_generated_at_utc": published_at,
            "status": "NEW_PREGAME_RESEARCH_ONLY",
            "prediction_kind": "mean_not_median",
            "original_classifier_probability_NOT_numeric_source": item.get("model_prob"),
            "independently_estimated_stat": p,
            "confirmed_dressed": False,
            "verified_bookmaker_line": False,
        })
    return result


def build(db: Path, source_board: Path, *, as_of: datetime):
    hist = rows_from_db(db)
    original = json.loads(source_board.read_text())
    validation = forward_grade(hist)
    now = as_of.isoformat().replace("+00:00", "Z")
    predictions = (future_board(hist, original, as_of, published_at=now)
                   if validation["research_display_gate_passed"] else [])
    return {
        "schema": SCHEMA, "model_version": VERSION, "generated_at_utc": now,
        "read_only_source": "historical skater_games and original pregame NHL published binary board",
        "source_sqlite_sha256": hashlib.sha256(db.read_bytes()).hexdigest(),
        "source_board_sha256": hashlib.sha256(source_board.read_bytes()).hexdigest(),
        "precommitted_weights": WEIGHTS,
        "validation": validation,
        "status": "RESEARCH_NUMERIC_ONLY_NO_BETTING_PROMOTION",
        "source_model_not_binary_points_classifier": True,
        "points_probability_not_converted_into_count": True,
        "cannot_prove_lineups_or_injuries": True,
        "predictions": predictions,
        "counts": {"historical_skater_games": len(hist), "pregame_numerical_projections": len(predictions)},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", type=Path, required=True)
    ap.add_argument("--upstream-board", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    now = datetime.now(timezone.utc)
    report = build(args.db, args.upstream_board, as_of=now)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    print("NHL_POINTS_NUMERIC_RESEARCH", json.dumps({
        "validation": report["validation"]["by_season"],
        "display_gate": report["validation"]["research_display_gate_passed"],
        "new_pregame_numeric": len(report["predictions"]),
        "source_hash": report["source_sqlite_sha256"][:12]
    }))


if __name__ == "__main__":
    main()
