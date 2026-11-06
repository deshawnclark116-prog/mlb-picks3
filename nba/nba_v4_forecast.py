#!/usr/bin/env python3
"""NBA V4 shadow forecasts for upcoming games, in the same row format as V3.

V4 = the tested model from nba_v4_backtest.py: projected minutes (recent minutes, role,
rest, home, blowout risk, and which regular teammates are out) x the player's own
per-minute rate (recency weighted), adjusted for the opponent's defence, pace, and
rest/home, with a negative-binomial spread fitted on earlier games.

Who plays tonight comes from the V3 file for the same games (same roster and injury
sources). Projections and percentages are CONDITIONAL ON PLAYING; p_active is carried
unchanged so the screen can decide whether a player should be shown. Nothing here uses a
sportsbook line, and nothing after tip-off. Shadow only: the live screen is not switched.

Usage: python -m nba.nba_v4_forecast --history a.jsonl --history b.jsonl --v3 latest.json --out v4.json
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy.stats import nbinom, poisson

from nba.nba_v4_backtest import (STATS, FINAL_MINUTE_GROUPS, STAT_GROUPS, State, build_rows, features, fit_models,
                                 predict_models, load, whole)

VERSION = "nba-v4-minutes-rate-teammates-out-20261106"
CDF_MAX = {"points": 90, "rebounds": 45, "assists": 35, "three_pointers_made": 17}
MARKET_KEY = STATS


def nb_cdf_lattice(mu: float, alpha: float, top: int):
    ks = np.arange(0, top + 1)
    mu = max(mu, 1e-6)
    if alpha < 1e-6:
        c = poisson.cdf(ks, mu)
    else:
        r = 1.0 / alpha
        c = nbinom.cdf(ks, r, r / (r + mu))
    c = np.clip(c, 0.0, 1.0)
    c[-1] = 1.0
    return [round(float(x), 6) for x in c]


def quantile(cdf, q):
    for i, v in enumerate(cdf):
        if v >= q:
            return float(i)
    return float(len(cdf) - 1)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--history", action="append", required=True)
    ap.add_argument("--v3", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    games = load(a.history)
    rows = build_rows(games)
    models = fit_models(rows, list(STAT_GROUPS), list(FINAL_MINUTE_GROUPS))
    state = State()
    for g in games:
        state.add_game(g)
    v3 = json.loads(Path(a.v3).read_text())
    now = dt.datetime.now(dt.timezone.utc)
    out_games, skipped = [], []
    for g3 in v3["games"]:
        tip = dt.datetime.fromisoformat(g3["tipoff_utc"])
        if tip <= now:
            continue
        d = (tip - dt.timedelta(hours=5)).date()              # Eastern calendar day of the game
        side_of = {g3["home_id"]: "home", g3["away_id"]: "away"}
        playing = {}
        for r in g3["rows"]:
            if r["reported_status"] == "OUT" or r["p_active"] < 0.2:
                continue
            playing[(r["player_id"], r["team_id"])] = r["player"]
        pseudo = {"home": {"id": g3["home_id"]}, "away": {"id": g3["away_id"]},
                  "players": [{"id": pid, "side": side_of[tid], "name": nm} for (pid, tid), nm in playing.items()]}
        feats, order = [], []
        for p in pseudo["players"]:
            f = features(state, pseudo, p, d)
            if f:
                feats.append({"f": f})
                order.append(p["id"])
        if not feats:
            skipped.append(g3["game_id"])
            continue
        pm, mus = predict_models(models, feats)
        idx = {pid: i for i, pid in enumerate(order)}
        new_rows = []
        for r in g3["rows"]:
            i = idx.get(r["player_id"])
            if r["reported_status"] == "OUT":
                new_rows.append(r)                                  # kept as reported, never shown as a pick
                continue
            if i is None:
                continue                                            # not enough history: no V4 forecast
            mu = float(mus[r["market"]][i])
            alpha = models["stats"][r["market"]]["alpha"]
            cdf = nb_cdf_lattice(mu, alpha, CDF_MAX[r["market"]])
            sd = float(np.sqrt(mu + alpha * mu * mu))
            nr = dict(r)
            nr.update({"mean": round(mu, 4), "median": quantile(cdf, 0.5), "p10": quantile(cdf, 0.10),
                       "p25": quantile(cdf, 0.25), "p75": quantile(cdf, 0.75), "p90": quantile(cdf, 0.90),
                       "sd": round(sd, 4), "unc": round(sd, 4), "model_target": None,
                       "cdf_lattice": {"step": 1, "cdf": cdf}, "model_version": VERSION,
                       "mean_basis": "CONDITIONAL_ON_PLAYING", "conditional_minutes_mean": round(float(pm[i]), 2),
                       "vacated_teammate_minutes": round(float(feats[i]["f"]["vacated"]), 1)})
            new_rows.append(nr)
        g4 = dict(g3)
        g4.update({"rows": new_rows, "rows_count": len(new_rows), "model_version": VERSION,
                   "forecast_kind": "V4_SHADOW", "forecast_at_utc": now.isoformat(), "asof_utc": now.isoformat()})
        out_games.append(g4)
    doc = {k: v for k, v in v3.items() if k not in ("games", "skipped")}
    doc.update({"games": out_games, "games_forecast": len(out_games), "skipped": skipped, "model_version": VERSION,
                "generated_at_utc": now.isoformat(), "model_promoted": False,
                "v4_training_games": len(games), "v4_training_rows": len(rows),
                "v4_history_through": games[-1]["date"], "v3_source_sha256": sha(Path(a.v3)),
                "note": "NBA V4 shadow. Projections and percentages are conditional on playing; availability layer is V3's. "
                        "Research only, not validated for 2026-27, no sportsbook input."})
    Path(a.out).write_text(json.dumps(doc, separators=(",", ":")))
    print("games", len(out_games), "rows", sum(len(g["rows"]) for g in out_games), "skipped", skipped)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
