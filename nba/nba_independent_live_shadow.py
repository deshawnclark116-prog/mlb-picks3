#!/usr/bin/env python3
"""Live PRETIP adapter for the validated-as-research NBA direct learned head.

Use the exact 2026-11-20 independent laboratory feature specification,
hyperparameters and source data. Never replace V5 publication, create
bookmaker prices, or claim that conditional-on-playing MAE is a betting edge.

Historical final boxes are the TRAINING input only. Today's player choices,
current teams and forecast fixture identities come exclusively from the
existing source-timed, real NBA V3 pregame roster/availability pipeline.
Results from the forecast date or any later date are expressly excluded.

The original research experiment chose "direct" on Jan-Feb 2026 validation
for all four markets; this file does not optimize architecture on live games.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from nba.nba_v4_backtest import load
from nba.nba_independent_no_hindsight_opportunity_lab import (
    FEATURES, STATS, PARAMS, dataset, make_features,
)

SCHEMA = "NBA_INDEPENDENT_DIRECT_LIVE_PRETIP_SHADOW_V1"
VERSION = "nba-independent-direct-prior-date-head-v1"
EASTERN = ZoneInfo("America/New_York")
MIN_PRIOR_ROWS = 500
MIN_ACTIVE_P = 0.75
MAX_SOURCE_AGE_HOURS = 24
MAX_SCHEDULE_HOURS = 42
MAX_GAME_RESULTS_SCORE = 250
BLOCKED = {"OUT", "DOUBTFUL", "INACTIVE", "SUSPENDED"}
TARGET_MARKETS = tuple(STATS)
DEFAULT_FIRST_FREEZE_MINUTES = 1


def utc(iso):
    at = dt.datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    if at.tzinfo is None:
        raise ValueError("NBA_INDEPENDENT_UNTIMED_SOURCE")
    return at.astimezone(dt.timezone.utc)


def eastern_day(iso):
    return utc(iso).astimezone(EASTERN).date()


def source_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def to_previous_eastern_completed_games(source_games, earliest_day):
    """Strict event-time barrier: same-day boxes never enter either fitting or inference."""
    out, seen = [], set()
    for original in source_games:
        g = dict(original)
        if g.get("game_id") in seen:
            raise ValueError("NBA_INDEPENDENT_DUPLICATE_HISTORIC_GAME_ID")
        seen.add(g.get("game_id"))
        day = eastern_day(g["date"])
        if day >= earliest_day:
            continue
        if not g.get("players") or not g.get("home") or not g.get("away"):
            continue
        if g.get("season_type") not in (2, "2", None):
            continue
        if any(
            not isinstance(g[side].get("score"), (int, float))
            or not (0 <= g[side]["score"] <= MAX_GAME_RESULTS_SCORE)
            for side in ("home", "away")
        ):
            continue
        g["source_event_date_utc"] = original["date"]
        g["date"] = day.isoformat()
        for p in g["players"]:
            if not isinstance(p.get("min"), (int, float)) or p["min"] < 0:
                raise ValueError("NBA_INDEPENDENT_INVALID_HISTORIC_MINUTES")
        out.append(g)
    out.sort(key=lambda x: (x["date"], str(x["game_id"])))
    return out


def completed_histories(games):
    """Exact same historical player/team fields that the laboratory used."""
    player = collections.defaultdict(list)
    team = collections.defaultdict(list)
    for g in games:
        day = dt.date.fromisoformat(g["date"])
        for side in ("home", "away"):
            own = str(g[side]["id"])
            other = "away" if side == "home" else "home"
            ps = [p for p in g["players"] if p.get("side") == side]
            opponents = [p for p in g["players"] if p.get("side") == other]
            if not ps or not opponents:
                raise ValueError("NBA_INDEPENDENT_MISSING_VALIDATED_TEAM_BOX")
            fga = sum(float(p["fga"]) for p in ps)
            fta = sum(float(p["fta"]) for p in ps)
            oreb = sum(float(p["oreb"]) for p in ps)
            tov = sum(float(p["tov"]) for p in ps)
            summary = {"poss": max(60.0, fga + 0.44*fta - oreb + tov)}
            for stat in STATS.values():
                summary[stat + "_allowed"] = sum(float(p[stat]) for p in opponents)
            summary["pts_allowed"] = sum(float(p["pts"]) for p in opponents)
            team[own].append({"date": day.isoformat(), **summary})
        for p in g["players"]:
            if float(p["min"]) <= 0:
                continue
            item = {k: p[k] for k in (
                "min", "start", "pts", "reb", "ast", "tpm", "fga", "tpa", "fta"
            )}
            item.update({
                "date": day.isoformat(), "team": str(p["team"]),
                "game_id": str(g["game_id"])
            })
            player[str(p["id"])].append(item)
    return player, team


def train_direct_models(prepared_games):
    """Fit only the fixed direct head chosen on independent validation."""
    rows = dataset(prepared_games)
    by_market = {market: [] for market in TARGET_MARKETS}
    for r in rows:
        by_market[r["market"]].append(r)
    models, metrics = {}, {}
    for market, sample in by_market.items():
        if len(sample) < MIN_PRIOR_ROWS:
            raise ValueError("NBA_INDEPENDENT_INSUFFICIENT_TRAINING_" + market)
        X = np.asarray([r["features"] for r in sample], dtype=float)
        y = np.asarray([r["actual"] for r in sample], dtype=float)
        if not np.isfinite(X).all() or not np.isfinite(y).all() or (y < 0).any():
            raise ValueError("NBA_INDEPENDENT_BAD_PRIOR_TRAINING_VALUES")
        model = HistGradientBoostingRegressor(**PARAMS, loss="poisson")
        model.fit(X, y)
        models[market] = model
        metrics[market] = {"training_player_games": len(sample)}
    return models, metrics


def selected_live_games(v3, now):
    source = utc(v3["generated_at_utc"])
    if source > now + dt.timedelta(minutes=2) or \
       now - source > dt.timedelta(hours=MAX_SOURCE_AGE_HOURS):
        raise ValueError("NBA_INDEPENDENT_MISSING_FRESH_SOURCE_ROSTER")
    games = []
    for g in v3.get("games", []):
        tip = utc(g["tipoff_utc"])
        if tip <= now + dt.timedelta(minutes=DEFAULT_FIRST_FREEZE_MINUTES):
            continue
        if tip > now + dt.timedelta(hours=MAX_SCHEDULE_HOURS):
            continue
        if source >= tip:
            raise ValueError("NBA_INDEPENDENT_SOURCE_AFTER_TIP")
        if not g.get("rows"):
            continue
        if not (str(g["home_id"]) != str(g["away_id"]) and g.get("game_id")):
            raise ValueError("NBA_INDEPENDENT_BAD_FIXTURE")
        games.append(g)
    if len({str(g["game_id"]) for g in games}) != len(games):
        raise ValueError("NBA_INDEPENDENT_DUPLICATE_TODAY_GAME")
    return games


def generate_shadow(v3, historic_games, now, *, history_sha, v3_sha):
    eligible_games = selected_live_games(v3, now)
    root = {
        "schema": SCHEMA, "model_version": VERSION,
        "generated_at_utc": now.isoformat(), "source_v3_generated_at_utc": v3["generated_at_utc"],
        "source_v3_sha256": v3_sha, "source_game_history_sha256": history_sha,
        "model_2025_validation_arm": "direct",
        "no_hindsight_history_eastern_day_barrier": True,
        "trained_through_eastern_date": None,
        "training_rows_by_market": {}, "games": [],
        "games_forecast": 0, "players_forecast": 0, "rows_forecast": 0,
        "skipped": [], "research_only": True, "official_bets": 0,
        "no_sportsbook_probability": True, "prospective_calibration_verified": False,
        "player_availability_model_source": "EXISTING_V3_PREGAME_ESPN_NO_ACTIVE_CERTIFICATION",
        "projections_conditional_on_playing": True,
        "individual_starter_certified": False,
        "model_is_not_the_v5_serving_champion": True
    }
    if not eligible_games:
        root["status"] = "NO_UPCOMING_PREGAME_SOURCE_GAMES"
        return root
    earliest = min(eastern_day(g["tipoff_utc"]) for g in eligible_games)
    history = to_previous_eastern_completed_games(historic_games, earliest)
    if len(history) < 150:
        raise ValueError("NBA_INDEPENDENT_NOT_ENOUGH_REAL_PRIOR_GAMES")
    root["trained_through_eastern_date"] = max(g["date"] for g in history)
    models, train_counts = train_direct_models(history)
    player_hist, team_hist = completed_histories(history)
    root["training_rows_by_market"] = train_counts
    root["historical_completed_games_used"] = len(history)
    for g in eligible_games:
        tip = utc(g["tipoff_utc"])
        date = eastern_day(g["tipoff_utc"])
        groups = collections.defaultdict(dict)
        names = {}
        skipped = collections.Counter()
        for r in g["rows"]:
            market = r.get("market")
            if market not in TARGET_MARKETS:
                continue
            pid, tid = str(r.get("player_id")), str(r.get("team_id"))
            if tid not in (str(g["home_id"]), str(g["away_id"])):
                raise ValueError("NBA_INDEPENDENT_ROSTER_TEAM_NOT_IN_FIXTURE")
            if market in groups[(tid, pid)]:
                raise ValueError("NBA_INDEPENDENT_DUPLICATED_PLAYER_MARKET")
            groups[(tid, pid)][market] = r
            if (tid, pid) in names and names[(tid, pid)] != r["player"]:
                raise ValueError("NBA_INDEPENDENT_PLAYER_NAME_CONFLICT")
            names[(tid, pid)] = r["player"]
        feature_rows = {market: [] for market in TARGET_MARKETS}
        player_rows = {}
        for (tid, pid), stat_rows in groups.items():
            representative = stat_rows.get("points") or next(iter(stat_rows.values()))
            reported = str(representative.get("reported_status", "UNKNOWN"))
            active = float(representative.get("p_active", 0))
            if reported.upper() in BLOCKED or not math.isfinite(active) or \
               active < MIN_ACTIVE_P or active > 1:
                skipped["NOT_ACTIVE_ENOUGH_OR_REPORTED_OUT"] += 1
                continue
            side = "home" if tid == str(g["home_id"]) else "away"
            opponent = str(g["away_id"] if side == "home" else g["home_id"])
            history_for_player = player_hist[pid]
            if sum(p["team"] == tid for p in history_for_player[-8:]) < 2:
                skipped["NOT_ENOUGH_CURRENT_TEAM_ROLE_PROOF"] += 1
                continue
            predicted = {}
            basis = {}
            for market, stat in STATS.items():
                if market not in stat_rows:
                    continue
                f = make_features(history_for_player, team_hist[tid], team_hist[opponent],
                                  date, side, stat)
                if f is None:
                    skipped["NO_PRIOR_HISTORY_" + market] += 1
                    continue
                feature_rows[market].append((tid, pid, f))
                basis[market] = f
            if basis:
                player_rows[(tid, pid)] = {
                    "player": names[(tid, pid)], "player_id": pid, "team_id": tid,
                    "source_active_probability_unverified": round(active, 4),
                    "reported_status": reported,
                    "active_or_starter_certified": False,
                    "historical_current_team_played_games": sum(
                        p["team"] == tid for p in history_for_player[-8:]),
                    "predictions": predicted, "prior_recent5": {},
                    "history_games": len(history_for_player)
                }
        for market, pairs in feature_rows.items():
            if not pairs:
                continue
            vectors = np.asarray([f["features"] for _,_,f in pairs], dtype=float)
            values = models[market].predict(vectors)
            for (tid, pid, f), raw in zip(pairs, values):
                if not math.isfinite(float(raw)) or raw < 0:
                    raise ValueError("NBA_INDEPENDENT_NONFINITE_PREDICTION")
                entry = player_rows[(tid, pid)]
                entry["predictions"][market] = round(float(raw), 3)
                entry["prior_recent5"][market] = round(float(f["baseline"]), 3)
        players = sorted(player_rows.values(),
                         key=lambda p: (-p["predictions"].get("points", 0), p["player"]))
        game = {
            "game_id": str(g["game_id"]), "home": g["home"],
            "away": g["away"], "home_id": str(g["home_id"]),
            "away_id": str(g["away_id"]), "tipoff_utc": tip.isoformat(),
            "forecast_at_utc": now.isoformat(), "rows_count": sum(
                len(p["predictions"]) for p in players
            ), "players": players, "players_forecast": len(players),
            "skipped_player_reasons": dict(skipped),
            "source_v3_fixture_at_utc": g.get("forecast_at_utc"),
            "unverified_starters_not_featured_as_official_picks": True,
            "source_injury_and_roster_not_a_confirmed_lineup": True
        }
        root["games"].append(game)
        root["skipped"].append({"game_id": game["game_id"], "reasons": dict(skipped)})
    root["games_forecast"] = len(root["games"])
    root["players_forecast"] = sum(g["players_forecast"] for g in root["games"])
    root["rows_forecast"] = sum(g["rows_count"] for g in root["games"])
    root["status"] = "LIVE_PRETIP_RESEARCH_AVAILABLE" if root["rows_forecast"] else \
                     "NO_ELIGIBLE_PLAYER_HISTORY"
    return root


def write_and_freeze(doc, out_path, archive_dir):
    output = Path(out_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(doc, separators=(",", ":"), sort_keys=True) + "\n")
    frozen = 0
    if archive_dir:
        archive = Path(archive_dir) / "first"
        archive.mkdir(parents=True, exist_ok=True)
        for g in doc["games"]:
            # Original game-day numeric research cannot be rewritten.
            file = archive / (g["game_id"] + ".json")
            if file.exists():
                continue
            snap = {k: v for k,v in doc.items() if k != "games"}
            snap["games"] = [g]
            snap["games_forecast"] = 1
            snap["first_pre_tip_numerical_forecast"] = True
            try:
                with file.open("x") as fp:
                    json.dump(snap, fp, separators=(",", ":"), sort_keys=True)
                frozen += 1
            except FileExistsError:
                pass
    return frozen


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", action="append", required=True)
    ap.add_argument("--v3", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--archive", default="")
    ap.add_argument("--now", default="", help="Test-only fixed asof UTC")
    args = ap.parse_args()
    now = utc(args.now) if args.now else dt.datetime.now(dt.timezone.utc)
    historical = load(args.games)
    v3 = json.loads(Path(args.v3).read_text())
    digest = hashlib.sha256("".join(source_hash(p) for p in args.games).encode()).hexdigest()
    doc = generate_shadow(v3, historical, now, history_sha=digest,
                          v3_sha=source_hash(args.v3))
    frozen = write_and_freeze(doc, args.out, args.archive)
    print("NBA_INDEPENDENT_LIVE_DIRECT_PREGAME", json.dumps({
        "generated_at_utc": doc["generated_at_utc"],
        "status": doc["status"], "games": doc["games_forecast"],
        "players": doc["players_forecast"], "market_projections": doc["rows_forecast"],
        "originals_created": frozen, "training_rows": doc["training_rows_by_market"],
        "production_model_promoted": False, "official_bets": 0
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
