#!/usr/bin/env python3
"""NBA V5 shadow forecasts: the full-game simulation, run for tonight's games.

Who is playing comes from the V3 file for the same games (same roster and injury sources): OUT players are removed and
their minutes and shots go to the teammates who actually take them; everyone else plays with the probability V3 assigns.
Each game is simulated thousands of times as one connected event (rotations, fouls, pace, shot spots, rebounds, assists,
steals, blocks, turnovers, late-game fouling, overtime). Projections and percentages are CONDITIONAL ON PLAYING (taken
from the simulated games in which the player plays); p_active carries the chance he plays.

Beyond the projection every row says how likely the player is to start and to be on the floor to close, his minutes
range, and which teammates' availability would change the projection most (re-simulated with that teammate out).
Nothing from after tip-off is used. No sportsbook input. Shadow only.

Usage: python -m nba.nba_v5_forecast --games g.jsonl[.gz] --pbp p.jsonl --v3 latest.json --out v5.json [--sims 3000]
"""
from __future__ import annotations
import argparse
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path

import numpy as np

from nba import nba_v4_backtest as v4
from nba import nba_v5_backtest as b5
from nba import nba_v5_context as ctxm
from nba.nba_v5_rank import MARKET_ORDER, MEANINGFUL_MIN, rank_for_screen, reach_prob
from nba.nba_v5_sim import League, league_from, simulate_game, MARKETS

VERSION = "nba-v5-blend-possession-simulation-20261106"
CORE = ("points", "rebounds", "assists", "three_pointers_made")
CDF_MAX = {"points": 90, "rebounds": 45, "assists": 35, "three_pointers_made": 17, "steals": 12, "blocks": 12, "turnovers": 15}
SENS_MIN_SHARE = 0.08                    # a projection "depends on" a teammate if it moves by 8% or more


def trim_lattice(r):
    """Drop the run of trailing 1.0 values: beyond the lattice the chance of reaching a number is 0, which readers already assume."""
    lat = r.get("cdf_lattice")
    if not lat:
        return
    c = lat["cdf"]
    n = len(c)
    while n > 2 and c[n - 2] >= 0.9999:
        n -= 1
    lat["cdf"] = c[:n]


def cdf_quantile(cdf, q):
    for i, v in enumerate(cdf):
        if v >= q:
            return float(i)
    return float(len(cdf) - 1)


def blend_rows(r5: dict, r4: dict) -> dict:
    """Equal-weight mixture of the V5 simulation and the V4 model for one player and stat.

    Tested on 150 held-out games (3,000+ player-games): the mixture had a smaller average miss than either model for
    every stat and better probabilities than both for points and made threes (nba_v5_backtest.py). The mixture's chance of
    reaching a number is the average of the two models' chances; its projection is the average of the two projections."""
    c5, c4 = np.array(r5["cdf_lattice"]["cdf"]), np.array(r4["cdf_lattice"]["cdf"])
    if len(c5) != len(c4):
        return r5
    mix = np.clip(0.5 * (c5 + c4), 0.0, 1.0)
    mix[-1] = 1.0
    m5, m4 = float(r5["mean"]), float(r4["mean"])
    mean = 0.5 * (m5 + m4)
    sd = float(np.sqrt(0.5 * (r5["sd"] ** 2 + r4["sd"] ** 2) + 0.25 * (m5 - m4) ** 2))
    out = dict(r5)
    cdf = [round(float(x), 4) for x in mix]
    out.update({"mean": round(mean, 4), "median": cdf_quantile(cdf, 0.5), "p10": cdf_quantile(cdf, 0.10), "p25": cdf_quantile(cdf, 0.25),
                "p75": cdf_quantile(cdf, 0.75), "p90": cdf_quantile(cdf, 0.90), "sd": round(sd, 4), "unc": round(sd, 4),
                "cdf_lattice": {"step": 1, "cdf": cdf},
                "blend": {"v5_simulation_mean": round(m5, 4), "v4_model_mean": round(m4, 4), "weights": [0.5, 0.5]}})
    return out


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def empirical_lattice(samples: np.ndarray, top: int):
    ks = np.arange(0, top + 1)
    c = np.array([(samples <= k).mean() for k in ks])
    c[-1] = 1.0
    return [round(float(x), 4) for x in c]


def quant(samples, q):
    return float(np.quantile(samples, q, method="lower"))


def pseudo_game(g3):
    """A game-shaped record for tonight built from the V3 roster: everyone not OUT with a real chance of playing."""
    players = []
    seen = set()
    for r in g3["rows"]:
        if r["reported_status"] == "OUT" or r["p_active"] < 0.2:
            continue
        key = (r["player_id"], r["team_id"])
        if key in seen:
            continue
        seen.add(key)
        side = "home" if r["team_id"] == g3["home_id"] else "away"
        players.append({"id": r["player_id"], "team": r["team_id"], "side": side, "name": r["player"], "p_active": r["p_active"]})
    return {"home": {"id": g3["home_id"]}, "away": {"id": g3["away_id"]}, "players": players, "officials": g3.get("officials") or []}


def team_sensitivity(th, ta, L, tables, ctx, base_means, S, pace, seed, side, top_k=3):
    """Re-simulate with each of the team's top-usage players out; report who moves and by how much."""
    out = {}
    team = th if side == "home" else ta
    usage = [x["rate"]["fga"] + 0.44 * x["rate"]["fta"] + x["rate"]["tov"] for x in team.prof]
    order = np.argsort(-np.array(usage) * np.array([min(1.0, p) for p in team.p_play]))[:top_k]
    for k in order:
        pp = team.p_play.copy()
        pp[k] = 0.0
        alt = type(team)(**{**team.__dict__, "p_play": pp})
        h, a = (alt, ta) if side == "home" else (th, alt)
        sim = simulate_game(h, a, L, tables, S=max(800, S // 3), pace=pace, seed=seed + 17 + int(k), ctx=ctx)
        for j, pid in enumerate(team.ids):
            if j == k:
                continue
            for m, key in MARKETS.items():
                av = sim["home" if side == "home" else "away"]["min"][:, j] > 0
                if av.sum() < 100:
                    continue
                alt_mean = float(sim["home" if side == "home" else "away"][key][av, j].mean())
                base = base_means.get((pid, m))
                if base is None:
                    continue
                if base > 0 and abs(alt_mean - base) / max(base, 1e-6) >= SENS_MIN_SHARE and abs(alt_mean - base) >= 0.4:
                    out.setdefault((pid, m), []).append({"if_out": team.ids[k], "projection_if_out": round(alt_mean, 2),
                                                          "change": round(alt_mean - base, 2)})
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", action="append", required=True)
    ap.add_argument("--pbp", action="append", required=True)
    ap.add_argument("--v3", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--sims", type=int, default=3000)
    ap.add_argument("--calibration", default="")
    ap.add_argument("--v4", default="", help="V4 forecast file for the same games; averaged with the V5 simulation for points, rebounds, assists, threes")
    ap.add_argument("--archive", default="", help="directory for frozen forecasts: first/<game>.json.gz (never rewritten) and last/<game>.json.gz (replaced until 15 min before tip, kept only within 4 hours of tip)")
    a = ap.parse_args()
    games = v4.load(a.games)
    pbp = b5.load_pbp(a.pbp)
    rp = b5.Replay()
    for g in games:
        rp.add(g, pbp.get(g["game_id"]))
    L = league_from(rp.lines_all, rp.team_rows)
    lg_tot = b5.league_totals(rp)
    tables = {"blow": rp.tables.blow_mult(), "foul": rp.tables.foul_mult()}
    L.zmod = b5.league_zone_stats(rp)["zmod"]
    late_tab = ctxm.late_game_ft_table([pbp[g["game_id"]] for g in games if g["game_id"] in pbp])
    le = ctxm.league_events([pbp[g["game_id"]] for g in games if g["game_id"] in pbp])
    for k_, v_ in le.items():
        setattr(L, k_, v_)
    calib = json.loads(Path(a.calibration).read_text()) if a.calibration and Path(a.calibration).exists() else {}
    v3 = json.loads(Path(a.v3).read_text())
    v4doc = json.loads(Path(a.v4).read_text()) if a.v4 and Path(a.v4).exists() else None
    v4rows = {(g["game_id"], r["player_id"], r["market"]): r for g in (v4doc or {"games": []})["games"] for r in g["rows"] if r.get("cdf_lattice")}
    now = dt.datetime.now(dt.timezone.utc)
    out_games, skipped = [], []
    for g3 in v3["games"]:
        tip = dt.datetime.fromisoformat(g3["tipoff_utc"])
        if tip <= now:
            continue
        d = (tip - dt.timedelta(hours=5)).date()
        pg = pseudo_game(g3)
        th, ta = b5.team_input(rp, pg, "home", d, L, lg_tot, None), b5.team_input(rp, pg, "away", d, L, lg_tot, None)
        if not th or not ta:
            skipped.append(g3["game_id"])
            continue
        pa = {p["id"]: float(p["p_active"]) for p in pg["players"]}
        th.p_play = np.array([pa[i] for i in th.ids])
        ta.p_play = np.array([pa[i] for i in ta.ids])
        pace = b5.pace_for(rp, pg, d)
        pace = pace - le["team_or_pg"] if pace else pace
        ctx = {"ft_mult": rp.refs.crew_mult(pg["officials"]), "late_ft": late_tab}
        seed = int(g3["game_id"]) % 100003
        sim = simulate_game(th, ta, L, tables, S=a.sims, pace=pace, seed=seed, ctx=ctx)
        rows_by = {(r["player_id"], r["market"]): r for r in g3["rows"]}
        new_rows, base_means = [], {}
        side_data = {"home": (th, sim["home"], sim["avail"][0], sim["first5"][0], sim["close5"][0]),
                     "away": (ta, sim["away"], sim["avail"][1], sim["first5"][1], sim["close5"][1])}
        close_mask = sim["close_mask"]
        for side, (ti, sd, av, f5, c5) in side_data.items():
            for j, pid in enumerate(ti.ids):
                played = av[:, j] & (sd["min"][:, j] > 0)
                if played.sum() < 200:
                    continue
                for m, key in MARKETS.items():
                    base_means[(pid, m)] = float(sd[key][played, j].mean())
        sens = {}
        for side in ("home", "away"):
            sens.update(team_sensitivity(th, ta, L, tables, ctx, base_means, a.sims, pace, seed, side))
        for side, (ti, sd, av, f5, c5) in side_data.items():
            for j, pid in enumerate(ti.ids):
                played = av[:, j] & (sd["min"][:, j] > 0)
                if played.sum() < 200:
                    continue
                p_start = float(f5[played, j].mean())
                cm = played & close_mask
                p_close = float(c5[cm, j].mean()) if cm.sum() > 50 else None
                mins = sd["min"][played, j]
                for m, key in MARKETS.items():
                    samp = sd[key][played, j]
                    tmpl = rows_by.get((pid, m)) or rows_by.get((pid, "points"))
                    if tmpl is None:
                        continue
                    lat = empirical_lattice(samp, CDF_MAX[m])
                    nr = dict(tmpl)
                    nr.update({"market": m, "mean": round(float(samp.mean()), 4), "median": quant(samp, 0.5), "p10": quant(samp, 0.10),
                               "p25": quant(samp, 0.25), "p75": quant(samp, 0.75), "p90": quant(samp, 0.90),
                               "sd": round(float(samp.std()), 4), "unc": round(float(samp.std()), 4), "model_target": None,
                               "cdf_lattice": {"step": 1, "cdf": lat}, "model_version": VERSION,
                               "mean_basis": "CONDITIONAL_ON_PLAYING", "p_start": round(p_start, 3),
                               "p_close": None if p_close is None else round(p_close, 3),
                               "minutes_mean": round(float(mins.mean()), 2), "minutes_p10": quant(mins, 0.10), "minutes_p90": quant(mins, 0.90),
                               "fga_mean": round(float(sd["fga"][played, j].mean()), 2), "fta_mean": round(float(sd["fta"][played, j].mean()), 2),
                               "depends_on": sens.get((pid, m), [])[:3],
                               "calibration": calib.get(m)})
                    new_rows.append(nr)
        name_of = {r["player_id"]: r["player"] for r in g3["rows"]}
        for r in new_rows:
            for dep in r.get("depends_on", []):
                dep["if_out_name"] = name_of.get(dep["if_out"], dep["if_out"])
        for i_, r in enumerate(new_rows):
            r4 = v4rows.get((g3["game_id"], r["player_id"], r["market"]))
            if r4 is not None and r["market"] in CORE and r.get("mean_basis") == "CONDITIONAL_ON_PLAYING" and r4.get("mean_basis") == "CONDITIONAL_ON_PLAYING":
                new_rows[i_] = blend_rows(r, r4)
            elif r.get("mean_basis") == "CONDITIONAL_ON_PLAYING":
                r["blend"] = None
        rank_for_screen(new_rows)
        for r in new_rows:
            trim_lattice(r)
        for r in g3["rows"]:
            if r["reported_status"] == "OUT":
                new_rows.append(r)
        g5 = dict(g3)
        g5.update({"rows": new_rows, "rows_count": len(new_rows), "model_version": VERSION, "forecast_kind": "V5_SHADOW",
                   "forecast_at_utc": now.isoformat(), "asof_utc": now.isoformat(), "model_simulations": a.sims,
                   "pace_used": pace, "official_foul_multiplier": ctx["ft_mult"]})
        out_games.append(g5)
        print("simulated", g3["away"], "at", g3["home"], "rows", len(new_rows), flush=True)
    doc = {k: v for k, v in v3.items() if k not in ("games", "skipped")}
    doc.update({"games": out_games, "games_forecast": len(out_games), "skipped": skipped, "model_version": VERSION,
                "generated_at_utc": now.isoformat(), "model_promoted": False, "v5_training_games": len(games),
                "v5_history_through": games[-1]["date"], "v3_source_sha256": sha(Path(a.v3)),
                "note": "NBA V5: equal-weight blend of the whole-game possession simulation and the V4 model for points, rebounds, assists and threes; "
                        "the simulation alone for steals, blocks and turnovers. Conditional on playing; availability layer is V3's. "
                        "Research only, not validated for 2026-27, no sportsbook input."})
    Path(a.out).write_text(json.dumps(doc, separators=(",", ":")))
    if a.archive:
        for g5 in out_games:
            tip = dt.datetime.fromisoformat(g5["tipoff_utc"])
            if tip - now < dt.timedelta(minutes=15):
                continue                                           # never freeze or update inside the last 15 minutes
            one = {k: v for k, v in doc.items() if k not in ("games",)}
            one.update({"games": [g5], "games_forecast": 1})
            for kind in ("first", "last"):
                if kind == "last" and tip - now > dt.timedelta(hours=4):
                    continue                                       # the last pre-tip version only matters close to the game
                path = Path(a.archive) / kind / (g5["game_id"] + ".json.gz")
                if kind == "first" and path.exists():
                    continue
                path.parent.mkdir(parents=True, exist_ok=True)
                with gzip.open(path, "wt", compresslevel=9) as fh:
                    fh.write(json.dumps(one, separators=(",", ":")))
    print("games", len(out_games), "skipped", skipped)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
