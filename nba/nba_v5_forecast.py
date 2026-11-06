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
import hashlib
import json
from pathlib import Path

import numpy as np

from nba import nba_v4_backtest as v4
from nba import nba_v5_backtest as b5
from nba import nba_v5_context as ctxm
from nba.nba_v5_sim import League, league_from, simulate_game, MARKETS

VERSION = "nba-v5-possession-simulation-20261106"
MARKET_ORDER = ("points", "rebounds", "assists", "three_pointers_made", "steals", "blocks", "turnovers")
CDF_MAX = {"points": 90, "rebounds": 45, "assists": 35, "three_pointers_made": 17, "steals": 12, "blocks": 12, "turnovers": 15}
MEANINGFUL_MIN = {"points": 6, "rebounds": 3, "assists": 2, "three_pointers_made": 1, "steals": 1, "blocks": 1, "turnovers": 2}
SENS_MIN_SHARE = 0.08                    # a projection "depends on" a teammate if it moves by 8% or more


def reach_prob(lat, k):
    c = lat
    return 1.0 if k <= 0 else (0.0 if k - 1 >= len(c) else 1.0 - c[k - 1])


def rank_for_screen(rows):
    """Same rule as the app: players who are likely to play, projection large enough to matter, ranked by the chance
    of reaching the rounded projection (highest first), ties by chance of playing, then name."""
    picks = []
    for r in rows:
        if r.get("mean_basis") != "CONDITIONAL_ON_PLAYING" or r["reported_status"] == "OUT" or not r["p_active"] >= 0.75:
            continue
        w = v4.whole(r["mean"])
        if w < MEANINGFUL_MIN[r["market"]]:
            continue
        picks.append((reach_prob(r["cdf_lattice"]["cdf"], w), r["p_active"], r["player"], r["market"], w, r))
    picks.sort(key=lambda x: (-x[0], -x[1], x[2], x[3]))
    for i, (p_, pa_, nm, mk, w, r) in enumerate(picks, 1):
        r["frontend_rank"] = i
        r["whole_projection"] = w
        r["reach_probability"] = round(p_, 4)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def empirical_lattice(samples: np.ndarray, top: int):
    ks = np.arange(0, top + 1)
    c = np.array([(samples <= k).mean() for k in ks])
    c[-1] = 1.0
    return [round(float(x), 6) for x in c]


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
    ap.add_argument("--archive", default="", help="directory for frozen forecasts: first/<game>.json (never rewritten) and last/<game>.json (replaced until 15 min before tip)")
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
        rank_for_screen(new_rows)
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
                "note": "NBA V5 shadow: whole-game possession simulation. Conditional on playing; availability layer is V3's. "
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
                path = Path(a.archive) / kind / (g5["game_id"] + ".json")
                if kind == "first" and path.exists():
                    continue
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(one, separators=(",", ":")))
    print("games", len(out_games), "skipped", skipped)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
