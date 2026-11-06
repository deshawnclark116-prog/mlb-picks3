#!/usr/bin/env python3
"""Walk-forward test of the V5 game simulation against V4 and a recent-average baseline.

Games are replayed in date order; every learned number (player rates, rotation patterns, foul-trouble and
blowout tables, opponent defence, pace) comes only from games on EARLIER dates. Scored on players who played
(conditional on playing), on the same player-games V4 is scored on. Availability (who is out) is taken from who
actually played, exactly as in the V4 test, so the comparison is like for like.

Usage: python -m nba.nba_v5_backtest --games g1.jsonl --games g2.jsonl --pbp p1.jsonl --pbp p2.jsonl --out report.json
         [--test-from 2026-01-01] [--sample 120] [--sims 1500] [--features all|ablate]
"""
from __future__ import annotations
import argparse
import collections
import datetime as dt
import json
import math
import random
import sys
from pathlib import Path

import numpy as np

from nba import nba_v4_backtest as v4
from nba import nba_v5_context as ctxm
from nba import nba_v5_learn as learnm
from nba.nba_v5_lineup_pairs import LineupPairState
from nba.nba_v5_shot_style import ShotStyleState
from nba.nba_v5_game_flow import GameFlowState
from nba.nba_v5_cold_start import LowHistoryRotations
from nba.nba_v5_sim import (rho_for_relative_stint, SEG, League, RotationTables, TeamInput, build_profile, league_from, presence_from_events,
                            simulate_game, MARKETS)

MKT4 = {"points": "pts", "rebounds": "reb", "assists": "ast", "three_pointers_made": "tpm"}
MIN_GAMES = 5


def load_pbp(paths):
    out = {}
    import gzip
    for p in paths:
        text = gzip.open(p, "rt").read() if str(p).endswith(".gz") else Path(p).read_text()
        for line in text.splitlines():
            if line.strip():
                g = json.loads(line)
                out[g["game_id"]] = g
    return out


def box_line(p):
    return {"min": p["min"], "fga": p["fga"], "fgm": p["fgm"], "tpa": p["tpa"], "tpm": p["tpm"], "fta": p["fta"], "ftm": p["ftm"],
            "ast": p["ast"], "oreb": p["oreb"], "dreb": p["dreb"], "stl": p["stl"], "blk": p["blk"], "tov": p["tov"],
            "pf": p["pf"], "pts": p["pts"], "reb": p["reb"], "start": p["start"]}


class Replay:
    """Everything learned so far (strictly earlier dates)."""

    def __init__(self):
        self.hist = collections.defaultdict(list)         # player -> [line + date]
        self.pres = collections.defaultdict(list)         # player -> [(date, np.array share per stretch)]
        self.team_games = collections.defaultdict(list)   # team -> [dict of own and opponent totals]
        self.tables = RotationTables()
        self.learn = learnm.LearnState()
        self.lines_all = []
        self.team_rows = []
        self.v4 = v4.State()
        self.prev = collections.defaultdict(list)          # team -> [(date, venue_team)]
        self.sched = ctxm.ScheduleEffects()
        self.refs = ctxm.OfficialEffects()
        self.ret = ctxm.ReturnEffects()
        self.pdates = collections.defaultdict(list)        # player -> dates played
        self.zone_hist = collections.defaultdict(list)     # player -> [(date, 3x5 tallies)]
        self.zone_def = collections.defaultdict(list)      # defending team -> [(date, 2x5 tallies)]
        self.zone_league = np.zeros((3, 5))
        self.tdates = collections.defaultdict(list)        # team -> dates played
        self.lineup_pairs = LineupPairState()                # strict valid play-by-play, earlier dates only
        self.shot_style = ShotStyleState()                    # observed ESPN shot descriptions, earlier dates only
        self.flow = GameFlowState()                           # previous ESPN PBP possession proxy cadence only
        self.cold_start = LowHistoryRotations()               # past-only starter/bench shape priors

    def add(self, g, pb):
        d = v4.day_of(g)
        self.v4.add_game(g)
        tt = {s: v4.team_totals(g, s) for s in ("home", "away")}
        venue = g["home"]["id"]
        for side, other in (("home", "away"), ("away", "home")):
            tid = g[side]["id"]
            flags = ctxm.schedule_flags(self.prev[tid], tid, venue, d)
            old = [x for x in self.team_games[tid]][-30:]
            if flags and len(old) >= 8:
                exp_ppp = float(np.mean([x["own"]["pts"] / x["poss"] for x in old]))
                act_ppp = sum(p["pts"] for p in g["players"] if p["side"] == side) / tt[side]["poss"]
                starters = [p for p in g["players"] if p["side"] == side and p["start"]]
                prior = [np.mean([h["min"] for h in self.hist[p["id"]][-10:]]) for p in starters if len(self.hist[p["id"]]) >= 5]
                sr = (sum(p["min"] for p in starters if len(self.hist[p["id"]]) >= 5) / sum(prior)) if prior else None
                self.sched.add(flags, act_ppp / exp_ppp, sr)
            self.prev[tid].append((d, venue))
            ps = [p for p in g["players"] if p["side"] == side]
            ops = [p for p in g["players"] if p["side"] == other]
            def tot(rows):
                return {k: sum(r[k] for r in rows) for k in ("fga", "fgm", "tpa", "tpm", "fta", "tov", "oreb", "dreb", "pts")}
            self.team_games[tid].append({"date": d, "own": tot(ps), "opp": tot(ops), "poss": tt[side]["poss"]})
            self.team_rows.append({"poss": tt[side]["poss"]})
        self.refs.add(g.get("officials") or [], (tt["home"]["fta"] + tt["away"]["fta"]) / (tt["home"]["poss"] + tt["away"]["poss"]))
        for p in g["players"]:
            if len(self.hist[p["id"]]) >= 5:
                k = ctxm.games_since_return(self.pdates[p["id"]], self.tdates[p["team"]], d)
                base = float(np.mean([h["min"] for h in self.hist[p["id"]][-10:]]))
                if k >= 0 and base > 0:
                    self.ret.add(k, p["min"] / base)
        for t_ in (g["home"]["id"], g["away"]["id"]):
            self.tdates[t_].append(d)
        for p in g["players"]:
            self.pdates[p["id"]].append(d)
            ln = box_line(p)
            ln["date"] = d
            self.hist[p["id"]].append(ln)
            self.lines_all.append(ln)
        if pb:
            # Accumulate only after date scoring; no live/future leakage.
            self.lineup_pairs.add_game(pb)
            self.shot_style.add_game(pb)
            self.flow.add_game(pb)
            shooter, against = ctxm.game_zone_tallies(pb)
            for pid, arr in shooter.items():
                self.zone_hist[pid].append((d, arr))
                self.zone_league += arr
            for tid_, arr in against.items():
                self.zone_def[tid_].append((d, arr))
            pres, fouls_seg, margin_seg, team_of = presence_from_events(pb)
            self.cold_start.add_finished_game(g, pres)
            self.tables.add_game(pb, pres, fouls_seg, margin_seg, team_of)
            self.learn.add(pb, learnm.game_learning(pb), pres, team_of)
            for pid, arr in pres.items():
                if arr.sum() > 0:
                    self.pres[pid].append((d, arr / 120.0))


def defence_ratios(rp: Replay, team_id, d, league_tot):
    tg = [x for x in rp.team_games[team_id] if x["date"] < d][-30:]
    n = len(tg)
    if n < 3:
        return {}
    def s(key, k):
        return sum(x[key][k] for x in tg)
    fg2a, fg2m = s("opp", "fga") - s("opp", "tpa"), s("opp", "fgm") - s("opp", "tpm")
    poss = sum(x["poss"] for x in tg)
    L = league_tot
    out = {
        "p2": (fg2m / max(1, fg2a)) / L["p2"], "p3": (s("opp", "tpm") / max(1, s("opp", "tpa"))) / L["p3"],
        "tov": (s("opp", "tov") / poss) / L["tov"], "ft": (s("opp", "fta") / poss) / L["fta"],
        "or_": (s("opp", "oreb") / max(1, s("opp", "oreb") + s("own", "dreb"))) / L["or"],
    }
    k = n / (n + 12.0)
    return {a: 1.0 + k * (b - 1.0) for a, b in out.items()}


def league_totals(rp: Replay):
    t = collections.Counter()
    poss = 0.0
    for tg in rp.team_games.values():
        for x in tg:
            for k in ("fga", "fgm", "tpa", "tpm", "fta", "tov", "oreb", "dreb"):
                t[k] += x["own"][k]
            poss += x["poss"]
    fg2a, fg2m = t["fga"] - t["tpa"], t["fgm"] - t["tpm"]
    return {"p2": fg2m / max(1, fg2a), "p3": t["tpm"] / max(1, t["tpa"]), "tov": t["tov"] / poss, "fta": t["fta"] / poss,
            "or": t["oreb"] / max(1, t["oreb"] + t["dreb"])}


def league_zone_stats(rp: Replay):
    att, made, ast = rp.zone_league
    freq = att / max(1.0, att.sum())
    pct = made / np.maximum(att, 1.0)
    a_rate = ast / np.maximum(made, 1.0)
    overall = ast.sum() / max(1.0, made.sum())
    return {"freq": freq, "pct": pct, "assisted": a_rate, "zmod": a_rate / max(overall, 1e-6), "overall": overall}


def zone_profile(rp: Replay, pid, d, LZ, half_life=40.0):
    hist = [(dd, a) for dd, a in rp.zone_hist[pid] if dd < d][-80:]
    n = len(hist)
    if not n:
        return None
    w = np.array([0.5 ** ((n - 1 - i) / half_life) for i in range(n)])
    tal = sum(wi * a for wi, (dd, a) in zip(w, hist))
    att, made, ast = tal
    freq = (att + 20.0 * LZ["freq"]) / (att.sum() + 20.0)
    pct = (made + 30.0 * LZ["pct"]) / (att + 30.0)
    assisted = (ast.sum() + 15.0 * LZ["overall"]) / (made.sum() + 15.0)
    return freq, pct, att + 30.0, float(assisted)


def zone_defence(rp: Replay, team, d, LZ):
    hist = [a for dd, a in rp.zone_def[team] if dd < d][-30:]
    n = len(hist)
    if n < 3:
        return None, None
    att, made = sum(hist)
    freq = att / max(1.0, att.sum())
    pct = made / np.maximum(att, 1.0)
    k = n / (n + 12.0)
    return 1.0 + k * (freq / np.maximum(LZ["freq"], 1e-6) - 1.0), 1.0 + k * (pct / np.maximum(LZ["pct"], 1e-6) - 1.0)


def roster_player_ids(players, side):
    """Fixed iteration order is mandatory for seeded Monte Carlo reproducibility.

    A Python set's order changes across processes (PYTHONHASHSEED), silently
    changing which player receives each simulator random draw, including in
    the UNCHANGED champion. Neither opponent nor roster selection changes.
    """
    return sorted({str(p["id"]) for p in players if p["side"] == side})


def team_input(rp: Replay, g, side, d, L: League, lg_tot, avail_ids, cold_start=False):
    tid = g[side]["id"]
    other = g["away" if side == "home" else "home"]["id"]
    ids, prof, pres, pplay, start = [], [], [], [], []
    low_history_audit={}
    current_players={str(p["id"]):p for p in g["players"] if p["side"]==side}
    tonight = roster_player_ids(g["players"], side)
    for pid in tonight:
        h = [x for x in rp.hist[pid] if x["date"] < d]
        is_cold=len(h)<MIN_GAMES
        if is_cold and (not cold_start or not h):
            continue
        pr = [a for dd, a in rp.pres[pid] if dd < d][-15:]
        if not pr and not cold_start:
            continue
        target = float(v4.ewma([x["min"] for x in h]))
        started=float(np.mean([1.0 if x["start"] else 0.0 for x in h[-5:]]))
        if is_cold or not pr:
            # Real, already observed NBA minutes plus optional V3 pregame
            # minutes forecast, never hindsight upcoming-game minutes.
            source=current_players[pid].get("prior_minutes_estimate")
            if source is not None:
                try:
                    source=float(source)
                    if 3<=source<=38:
                        target=.6*source+.4*target
                except (TypeError,ValueError):
                    pass
            target=float(np.clip(target,3.0,38.0))
            pres_vec,reason=rp.cold_start.prior(started>=.5,target)
            low_history_audit[pid]=dict(reason,prior_nba_box_games=len(h),
                                        not_causal_role_prediction=True)
        else:
            w = np.array([0.5 ** ((len(pr) - 1 - i) / 8.0) for i in range(len(pr))])
            pres_vec = np.average(np.array(pr), axis=0, weights=w)
            cur = float(pres_vec.sum() * 2.0)
            if cur > 0 and target > 0:
                pres_vec = np.clip(pres_vec * float(np.clip(target / cur, 0.4, 2.5)), 0.0, 1.0)
        ids.append(pid)
        prof.append(build_profile(h, L, prior_min=240.0 if is_cold else 60.0))
        pres.append(pres_vec)
        pplay.append(1.0)
        start.append(started)
    if len(ids) < 6:
        return None
    start = np.array(start)
    top = np.argsort(-start)[:5]
    st = np.zeros(len(ids), bool)
    st[top] = True
    flags = ctxm.schedule_flags(rp.prev[tid], tid, g["home"]["id"], d)
    eff, smult = rp.sched.multipliers(flags) if flags else (1.0, 1.0)
    rmult = np.array([rp.ret.mult(ctxm.games_since_return(rp.pdates[pid], rp.tdates[tid], d)) for pid in ids])
    LZ = league_zone_stats(rp)
    zs = [zone_profile(rp, pid, d, LZ) for pid in ids]
    if cold_start:
        # A rookie with no NBA shot coordinates must not disable proven zone
        # modeling for all existing veterans. Use the *earlier league* prior
        # for that specific player only, with explicitly broad effective N.
        zs = [z if z is not None else
              (np.array(LZ["freq"]), np.array(LZ["pct"]),
               np.full(5,30.0), LZ["overall"]) for z in zs]
    zf = zp = zn = asr = None
    if all(z is not None for z in zs):
        zf, zp, zn = np.array([z[0] for z in zs]), np.array([z[1] for z in zs]), np.array([z[2] for z in zs])
        asr = np.array([z[3] for z in zs])
    dzf, dzp = zone_defence(rp, tid, d, LZ)
    de = [rp.learn.defender_effects(pid, tid) for pid in ids]
    dfreq, dpct = np.array([x[0] for x in de]), np.array([x[1] for x in de])
    s_st, b_st = rp.learn.stint_minutes(tid)
    lg_s, lg_b = rp.learn.stint_minutes("__league__")
    rho_t = rho_for_relative_stint((0.6 * s_st + 0.4 * b_st) / (0.6 * lg_s + 0.4 * lg_b))
    pair_eff, pair_base, pair_audit = rp.lineup_pairs.for_roster(tid, ids)
    styles=[rp.shot_style.profile(pid,L) for pid in ids]
    style_probs=np.stack([v[0] for v in styles]) if any(v[2]["valid"] for v in styles) else None
    style_mult=np.stack([v[1] for v in styles]) if style_probs is not None else None
    return TeamInput(ids=ids, prof=prof, presence=np.array(pres), p_play=np.array(pplay), starter=st,
                     defence=defence_ratios(rp, tid, d, lg_tot), return_mult=rmult, eff=(eff, eff), start_mult=smult,
                     zf=zf, zp=zp, zn=zn, assisted=asr, dz_freq=dzf, dz_pct=dzp,
                     team_id=tid, dfreq=dfreq, dpct=dpct, rho=rho_t,
                     pair_effects=pair_eff, pair_baselines=pair_base,
                     style_probs=style_probs, style_mult=style_mult,
                     low_history_evidence=low_history_audit)


def pace_for(rp: Replay, g, d):
    a = [x["poss"] for x in rp.team_games[g["home"]["id"]] if x["date"] < d][-20:]
    b = [x["poss"] for x in rp.team_games[g["away"]["id"]] if x["date"] < d][-20:]
    return float((np.mean(a) + np.mean(b)) / 2.0) if a and b else None


def whole(x):
    return v4.whole(x)


def reach_prob(samples, k):
    return float(np.mean(samples >= k))


def run(args):
    games = v4.load(args.games)
    pbp = load_pbp(args.pbp)
    rows = v4.build_rows(games)
    test_from = dt.date.fromisoformat(args.test_from)
    # V4 predictions for the same rows (earlier-data refits each month)
    v4_preds = v4.walk_forward(rows, test_from, list(v4.STAT_GROUPS), list(v4.FINAL_MINUTE_GROUPS))
    by_game = collections.defaultdict(list)
    for r in rows:
        if (r["game"], r["player"]) in v4_preds:
            by_game[r["game"]].append(r)
    cand = sorted(by_game)
    random.Random(11).shuffle(cand)
    chosen = set(cand[: args.sample])
    print("games", len(games), "scoring", len(chosen), "of", len(cand), flush=True)
    configs = {"full": {}}
    if getattr(args,"flow_trial",False):
        if args.config or args.features=="ablate":
            raise ValueError("--flow-trial incompatible with --config and ablation")
        configs["game_flow"]={"game_flow":True}
    if sum(bool(getattr(args,n,False)) for n in ("lineup_trial","role_trial","style_trial","flow_trial"))>1:
        raise ValueError("One experimental arm at a time")
    if getattr(args, "style_trial", False):
        if args.config or args.features=="ablate":
            raise ValueError("--style-trial incompatible with --config and ablation")
        configs["shot_style"]={"shot_style":True}
    if getattr(args, "lineup_trial", False):
        if args.config or args.features == "ablate":
            raise ValueError("--lineup-trial is incompatible with --config and --features ablate")
        configs["lineup_pairs"] = {"lineup_pairs": True}
    if getattr(args, "role_trial", False):
        if args.config or args.features == "ablate":
            raise ValueError("--role-trial is incompatible with --config and --features ablate")
        configs["role_adaptive"] = {}  # same switches, same Monte Carlo seed
    if args.config:
        configs = {"full": {}} if args.config == "full" else {args.config: {args.config.replace("without_", ""): False}}
    elif args.features == "ablate":
        for name in ("rotation", "foul_trouble", "blowout", "overtime", "param_uncertainty", "luck", "assists", "putbacks", "defence",
                     "schedule", "officials", "late_game", "returns", "zones", "minute_limits", "team_rotation", "timeouts", "defenders", "timing"):
            configs["without_" + name] = {name: False}
    rp = Replay()
    early = [pbp[g["game_id"]] for g in games if v4.day_of(g) < test_from and g["game_id"] in pbp]
    late_tab = ctxm.late_game_ft_table(early)
    le = ctxm.league_events(early)
    results = {c: [] for c in configs}
    by_day = collections.defaultdict(list)
    for g in games:
        by_day[v4.day_of(g)].append(g)
    n_done = 0
    for d in sorted(by_day):
        todo = [g for g in by_day[d] if g["game_id"] in chosen]
        if todo:
            L = league_from(rp.lines_all, rp.team_rows)
            lg_tot = league_totals(rp)
            tables = {"blow": rp.tables.blow_mult(), "foul": rp.tables.foul_mult(),
                      "blow_team": {t_: rp.tables.blow_mult_team(t_) for g_ in todo for t_ in (g_["home"]["id"], g_["away"]["id"])},
                      "foul_team": {t_: rp.tables.foul_mult_team(t_) for g_ in todo for t_ in (g_["home"]["id"], g_["away"]["id"])},
                      "timing": rp.learn.timing_tables()}
            tables["to_rate"], tables["post_to"] = rp.learn.timeout_tables()
            tables["possession_shape"] = rp.flow.pattern()
            L.zmod = league_zone_stats(rp)["zmod"]
            for k_, v_ in le.items():
                setattr(L, k_, v_)
            for g in todo:
                th, ta = team_input(rp, g, "home", d, L, lg_tot, None), team_input(rp, g, "away", d, L, lg_tot, None)
                if not th or not ta:
                    continue
                pace = pace_for(rp, g, d)
                pace = pace - le["team_or_pg"] if pace else pace
                actual = {p["id"]: p for p in g["players"]}
                adapted = None
                if getattr(args, "role_trial", False):
                    from nba.nba_v5_role_trial import adapt_team
                    ah, hf = adapt_team(th, rp.hist, d)
                    aa, af = adapt_team(ta, rp.hist, d)
                    adapted = (ah, aa, {e["player_id"]: e["modified"] for e in hf + af})
                for cname, feats in configs.items():
                    cx = {"ft_mult": rp.refs.crew_mult(g.get("officials") or []), "late_ft": late_tab}
                    sh, sa = (adapted[0], adapted[1]) if cname == "role_adaptive" else (th, ta)
                    sim = simulate_game(sh, sa, L, tables, S=args.sims, pace=pace, seed=int(g["game_id"]) % 100003, features=feats, ctx=cx)
                    for side, ti in (("home", sh), ("away", sa)):
                        for j, pid in enumerate(ti.ids):
                            p = actual[pid]
                            rec = {"date": str(d), "game": g["game_id"], "player": pid, "name": p["name"], "min_actual": p["min"],
                                   "min_sim": float(sim[side]["min"][:, j].mean())}
                            if cname == "role_adaptive":
                                rec["role_trial_flags"] = (adapted[2].get(pid, []) if adapted else [])
                            for mname, key in (("points", "pts"), ("rebounds", "reb"), ("assists", "ast"), ("three_pointers_made", "tpm"),
                                               ("steals", "stl"), ("blocks", "blk"), ("turnovers", "tov")):
                                samp = sim[side][key][:, j]
                                hh = [x[key] for x in rp.hist[pid] if x["date"] < d][-10:]
                                rec[mname] = {"actual": p[key], "mean": float(samp.mean()), "base": float(np.mean(hh)) if hh else None,
                                              "samples_ge": {int(k): float(np.mean(samp >= k)) for k in range(0, 60)} if mname == "points" else
                                                            {int(k): float(np.mean(samp >= k)) for k in range(0, 30)}}
                                rec[mname]["sd"] = float(samp.std())
                            results[cname].append(rec)
                n_done += 1
                if n_done % 10 == 0:
                    print("simulated games", n_done, flush=True)
        for g in by_day[d]:
            rp.add(g, pbp.get(g["game_id"]))
    if getattr(args, "flow_trial", False):
        print("GAME_FLOW_PBP_AUDIT",json.dumps(rp.flow.audit()),flush=True)
    if getattr(args, "style_trial", False):
        print("SHOT_STYLE_PBP_COVERAGE",json.dumps(rp.shot_style.audit()),flush=True)
    if getattr(args, "lineup_trial", False):
        print("LINEUP_PBP_VALIDATION", json.dumps({"accepted_games": rp.lineup_pairs.accepted_games,
            "rejected": dict(rp.lineup_pairs.rejected_games),
            "team_games": len(rp.lineup_pairs.games_by_team)}), flush=True)
    return results, rows, v4_preds, chosen


def isotonic(p, y):
    """Pool-adjacent-violators fit of hit rate against stated probability. Returns (xs, ys) for np.interp."""
    order = np.argsort(p)
    xs, ys = np.asarray(p)[order], np.asarray(y, float)[order]
    blocks = [[ys[i], 1.0, xs[i], xs[i]] for i in range(len(xs))]      # mean, weight, xmin, xmax
    out = []
    for b in blocks:
        out.append(b)
        while len(out) > 1 and out[-2][0] > out[-1][0]:
            a, c = out[-2], out[-1]
            w = a[1] + c[1]
            out[-2:] = [[(a[0] * a[1] + c[0] * c[1]) / w, w, a[2], c[3]]]
    px, py = [], []
    for m, w, lo, hi in out:
        px += [lo, hi]
        py += [m, m]
    return np.array(px), np.array(py)


def calibration_test(results_cfg, markets=("points", "rebounds", "assists", "three_pointers_made", "steals", "blocks", "turnovers")):
    """Fit the correction on the earlier 60% of games (by date) and test it on the later 40%."""
    out, fitted = {}, {}
    dates = sorted({r["date"] for r in results_cfg})
    cut = dates[int(len(dates) * 0.6)] if dates else None
    for m in markets:
        tr_p, tr_y, te_p, te_y = [], [], [], []
        for rec in results_cfg:
            r = rec.get(m)
            if not r:
                continue
            k = whole(r["mean"])
            if k < {"points": 6, "rebounds": 3, "assists": 2, "three_pointers_made": 1, "steals": 1, "blocks": 1, "turnovers": 2}[m]:
                continue
            p = r["samples_ge"].get(k)
            if p is None:
                continue
            (tr_p if rec["date"] < cut else te_p).append(p)
            (tr_y if rec["date"] < cut else te_y).append(1.0 if r["actual"] >= k else 0.0)
        if len(tr_p) < 200 or len(te_p) < 100:
            continue
        xs, ys = isotonic(tr_p, tr_y)
        cal = np.interp(te_p, xs, ys)
        raw_b = float(np.mean((np.array(te_p) - np.array(te_y)) ** 2))
        cal_b = float(np.mean((cal - np.array(te_y)) ** 2))
        out[m] = {"n_fit": len(tr_p), "n_test": len(te_p), "brier_raw": raw_b, "brier_calibrated": cal_b,
                  "mean_stated_test": float(np.mean(te_p)), "hit_rate_test": float(np.mean(te_y))}
        allp = tr_p + te_p
        ally = tr_y + te_y
        fx, fy = isotonic(allp, ally)
        fitted[m] = {"x": [round(float(v), 4) for v in fx[::max(1, len(fx) // 40)]], "y": [round(float(v), 4) for v in fy[::max(1, len(fy) // 40)]]}
    return out, fitted


def score(results_cfg, rows, v4_preds):
    rowmap = {(r["game"], r["player"]): r for r in rows}
    agg = {m: {"abs5": [], "abs4": [], "absb": [], "br5": [], "br4": [], "absE": [], "brE": [], "n": 0} for m in MKT4}
    minutes5, minutes4, minutesb = [], [], []
    for rec in results_cfg:
        r = rowmap.get((rec["game"], rec["player"]))
        pr = v4_preds.get((rec["game"], rec["player"]))
        if not r or not pr:
            continue
        minutes5.append(abs(rec["min_sim"] - rec["min_actual"]))
        minutes4.append(abs(pr["min"] - rec["min_actual"]))
        minutesb.append(abs(r["f"]["min_last10"] - rec["min_actual"]))
        for m, key in MKT4.items():
            a = rec[m]["actual"]
            mu5, (mu4, alpha4) = rec[m]["mean"], pr[m]
            base = max(r["f"]["last10_" + key], 1e-3)
            agg[m]["abs5"].append(abs(mu5 - a)); agg[m]["abs4"].append(abs(mu4 - a)); agg[m]["absb"].append(abs(base - a))
            k5, k4 = whole(mu5), whole(mu4)
            if k5 >= v4.MEANINGFUL[m] and str(k5) in {str(x) for x in rec[m]["samples_ge"]} or True:
                if k5 >= v4.MEANINGFUL[m]:
                    p5 = rec[m]["samples_ge"].get(k5)
                    if p5 is not None:
                        agg[m]["br5"].append((p5 - (1.0 if a >= k5 else 0.0)) ** 2)
            if k4 >= v4.MEANINGFUL[m]:
                p4 = float(v4.nb_survival(np.array([mu4]), alpha4, k4)[0])
                agg[m]["br4"].append((p4 - (1.0 if a >= k4 else 0.0)) ** 2)
            ens = 0.5 * (mu5 + mu4)
            agg[m]["absE"].append(abs(ens - a))
            kE = whole(ens)
            if kE >= v4.MEANINGFUL[m]:
                p5e = rec[m]["samples_ge"].get(kE)
                if p5e is not None:
                    p4e = float(v4.nb_survival(np.array([mu4]), alpha4, kE)[0])
                    agg[m]["brE"].append((0.5 * (p5e + p4e) - (1.0 if a >= kE else 0.0)) ** 2)
            agg[m]["n"] += 1
    out = {"n_players": len(minutes5), "minutes_mae": {"v5": float(np.mean(minutes5)), "v4": float(np.mean(minutes4)), "recent_avg": float(np.mean(minutesb))}}
    for m in MKT4:
        a = agg[m]
        out[m] = {"mae_v5": float(np.mean(a["abs5"])), "mae_v4": float(np.mean(a["abs4"])), "mae_recent": float(np.mean(a["absb"])),
                  "brier_v5": float(np.mean(a["br5"])) if a["br5"] else None, "brier_v4": float(np.mean(a["br4"])) if a["br4"] else None,
                  "mae_blend": float(np.mean(a["absE"])), "brier_blend": float(np.mean(a["brE"])) if a["brE"] else None}
    extra = {}
    from scipy.stats import poisson
    for m, minimum in (("steals", 1), ("blocks", 1), ("turnovers", 2)):
        ab5, abb, br5, brb, n = [], [], [], [], 0
        for rec in results_cfg:
            r = rec.get(m)
            if not r or r.get("base") is None:
                continue
            a = r["actual"]
            ab5.append(abs(r["mean"] - a)); abb.append(abs(r["base"] - a)); n += 1
            k5 = whole(r["mean"])
            if k5 >= minimum and r["samples_ge"].get(k5) is not None:
                br5.append((r["samples_ge"][k5] - (1.0 if a >= k5 else 0.0)) ** 2)
            kb = whole(max(r["base"], 1e-3))
            if kb >= minimum:
                pb = float(poisson.sf(kb - 1, max(r["base"], 1e-3)))
                brb.append((pb - (1.0 if a >= kb else 0.0)) ** 2)
        if n:
            extra[m] = {"mae_v5": float(np.mean(ab5)), "mae_recent": float(np.mean(abb)),
                        "brier_v5": float(np.mean(br5)) if br5 else None, "brier_recent_poisson": float(np.mean(brb)) if brb else None}
    out["other_stats"] = extra
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", action="append", required=True)
    ap.add_argument("--pbp", action="append", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--test-from", default="2026-01-01")
    ap.add_argument("--sample", type=int, default=120)
    ap.add_argument("--sims", type=int, default=1500)
    ap.add_argument("--features", default="all")
    ap.add_argument("--dump", default="")
    ap.add_argument("--config", default="", help="run one configuration only: full, or without_<feature>")
    ap.add_argument("--role-trial", action="store_true", help="paired shadow test of fixed role adjustment; never promoted")
    ap.add_argument("--lineup-trial", action="store_true", help="paired shadow test of lineup-conditioned opportunities; never promoted")
    ap.add_argument("--style-trial", action="store_true", help="paired shadow test of ESPN labeled shot execution, not Synergy plays")
    ap.add_argument("--flow-trial", action="store_true", help="paired shadow test of historically learned 2-minute possession distribution")
    a = ap.parse_args()
    results, rows, v4_preds, chosen = run(a)
    if a.dump:
        Path(a.dump).write_text(json.dumps(results if a.role_trial or a.lineup_trial or a.style_trial or a.flow_trial else next(iter(results.values()))))
    report = {c: score(r, rows, v4_preds) for c, r in results.items() if r}
    if a.role_trial:
        from nba.nba_v5_role_trial_score import evaluate
        report["paired_role_trial"] = evaluate(results["full"], results["role_adaptive"], v4_preds)
    if a.flow_trial:
        from nba.nba_v5_role_trial_score import evaluate
        paired=evaluate(results["full"],results["game_flow"],v4_preds)
        paired["experiment"]="NBA_V5_TWO_MINUTE_PBP_CADENCE_V1"
        paired["candidate"]="Past ESPN PBP season-level possession proxy by two-minute segment; 40-game prior, 20% cap"
        paired["observational_limitation"]="PBP possession proxies, not actual possession boundary or shot clock data"
        report["paired_flow_trial"]=paired
    if a.style_trial:
        from nba.nba_v5_role_trial_score import evaluate
        paired=evaluate(results["full"],results["shot_style"],v4_preds)
        paired["experiment"]="NBA_V5_SHOT_EXECUTION_STYLE_V1"
        paired["candidate"]="Historical player-zone execution style mixture with mean-neutral shooting adjustment"
        paired["observational_limitation"]="ESPN shot labels are not licensed play types, player tracking or defensive assignments"
        report["paired_style_trial"]=paired
    if a.lineup_trial:
        from nba.nba_v5_role_trial_score import evaluate
        paired = evaluate(results["full"], results["lineup_pairs"], v4_preds)
        paired["experiment"] = "NBA_V5_LINEUP_PAIR_SHADOW_V1"
        paired["candidate"] = "lineup-conditioned relative FGA/AST/OREB/DREB weights, 240-minute shrinkage"
        paired["observational_limitation"] = (
            "Substitution-reconstructed on/off rates confound coaching, rotations, opponents and game state; "
            "scoring uses the same retrospective available roster in both arms.")
        report["paired_lineup_trial"] = paired
    if "full" in results and results["full"] and not a.config:
        ct, fitted = calibration_test(results["full"])
        report["calibration_test_later_games"] = ct
        report["calibration_fitted_all"] = fitted
    for c, r in report.items():
        print(c, json.dumps(r)[:900], flush=True)
    Path(a.out).write_text(json.dumps(report, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
