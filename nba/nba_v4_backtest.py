#!/usr/bin/env python3
"""NBA V4 walk-forward harness: does each added piece of information improve forecasts?

Reads the compact games file (nba_v4_dataset.py). Games are processed in date order.
Every prediction uses ONLY games on earlier dates (same-day games are never used), and
every model is refit on earlier data only (expanding window, refit each month).

Scored on players who played (conditional on playing); availability is a separate layer.
Models for minutes and for each stat (points, rebounds, assists, made threes):
  baseline   : recent average (last 10 games)
  rate       : projected minutes x the player's own per-minute rate (shrunk)
  + features : opponent defence, pace, rest/back-to-back, home, blowout risk, role
Each feature group is added and removed in turn (ablation) and the change in error is
reported with a game-level bootstrap interval, so a feature has to earn its place.

Usage: python nba_v4_backtest.py --games a.jsonl [--games b.jsonl] --out report.json
"""
from __future__ import annotations
import argparse
import collections
import datetime as dt
import json
import math
import sys
from pathlib import Path

import numpy as np

STATS = {"points": "pts", "rebounds": "reb", "assists": "ast", "three_pointers_made": "tpm"}
MEANINGFUL = {"points": 6, "rebounds": 3, "assists": 2, "three_pointers_made": 1}
MIN_PRIOR_GAMES = 5
RATE_SHRINK_MIN = 25.0
HALFLIFE = 12.0           # games
RATE_HL_MULT = 3.0


def whole(x: float) -> int:
    b = math.floor(x)
    return b + (1 if x - b >= 0.6 - 1e-10 else 0)


def day_of(g) -> dt.date:
    return dt.date.fromisoformat(g["date"][:10])


def load(paths):
    games = {}
    for p in paths:
        for line in Path(p).read_text().splitlines():
            if line.strip():
                g = json.loads(line)
                games[g["game_id"]] = g
    out = sorted(games.values(), key=lambda g: (g["date"], g["game_id"]))
    return out


def team_totals(g, side):
    ps = [p for p in g["players"] if p["side"] == side]
    t = {k: sum(p[k] for p in ps) for k in ("pts", "reb", "ast", "tpm", "fga", "fta", "oreb", "tov")}
    t["poss"] = max(60.0, t["fga"] + 0.44 * t["fta"] - t["oreb"] + t["tov"])
    return t


class State:
    """Everything known strictly before a date."""

    def __init__(self):
        self.player = collections.defaultdict(list)     # id -> list of lines (chronological)
        self.team_games = collections.defaultdict(list)  # team -> list of dict(date, poss, margin, allowed{stat}, opp)
        self.team_rosters = collections.defaultdict(list)  # team -> [(date, {player_id: minutes})]
        self.league = collections.Counter()               # running league sums
        self.last_day = None

    def add_game(self, g):
        d = day_of(g)
        tt = {s: team_totals(g, s) for s in ("home", "away")}
        for side, other in (("home", "away"), ("away", "home")):
            tid = g[side]["id"]
            margin = (g[side]["score"] - g[other]["score"])
            allowed = {k: tt[other][k] for k in ("pts", "reb", "ast", "tpm")}
            self.team_games[tid].append({"date": d, "poss": tt[side]["poss"], "opp_poss": tt[other]["poss"],
                                         "margin": margin, "allowed": allowed, "home": side == "home", "opp": g[other]["id"]})
            self.league["games"] += 1
            self.league["poss"] += tt[side]["poss"]
            for k in ("pts", "reb", "ast", "tpm"):
                self.league["allowed_" + k] += allowed[k]
        for side in ("home", "away"):
            self.team_rosters[g[side]["id"]].append((d, {p["id"]: p["min"] for p in g["players"] if p["side"] == side}))
        for p in g["players"]:
            self.player[p["id"]].append(dict(p, date=d, game_id=g["game_id"]))
            self.league["min"] += p["min"]
            for k in ("pts", "reb", "ast", "tpm"):
                self.league[k] += p[k]


def ewma(vals, hl=HALFLIFE):
    if not vals:
        return 0.0
    w = np.array([0.5 ** ((len(vals) - 1 - i) / hl) for i in range(len(vals))])
    return float(np.dot(w, vals) / w.sum())


def features(state: State, g, p, d):
    """Pre-game features for player p in game g (date d). Uses state (strictly earlier days)."""
    hist = [x for x in state.player.get(p["id"], []) if x["date"] < d]
    if len(hist) < MIN_PRIOR_GAMES:
        return None
    side = p["side"]
    team, opp = g[side]["id"], g["away" if side == "home" else "home"]["id"]
    mins = [x["min"] for x in hist]
    starts = [1.0 if x["start"] else 0.0 for x in hist]
    tg = [x for x in state.team_games[team] if x["date"] < d]
    og = [x for x in state.team_games[opp] if x["date"] < d]
    if len(tg) < 3 or len(og) < 3:
        return None
    rest = min(6, (d - tg[-1]["date"]).days)
    L = state.league
    lg_poss = L["poss"] / max(1, L["games"])
    f = {"min_last10": float(np.mean(mins[-10:])), "min_ewma": ewma(mins), "min_season": float(np.mean(mins[-40:])),
         "start5": float(np.mean(starts[-5:])), "start_all": float(np.mean(starts[-30:])),
         "rest": rest, "b2b": 1.0 if rest <= 1 else 0.0, "home": 1.0 if side == "home" else 0.0}
    # team strength = shrunk average margin per game; blowout risk = |expected margin| (starters only matter)
    def strength(gs):
        m = [x["margin"] for x in gs[-25:]]
        return sum(m) / (len(m) + 6.0)
    exp_margin = strength(tg) - strength(og) + (2.0 if side == "home" else -2.0)
    recent = [r for r in state.team_rosters[team] if r[0] < d][-10:]
    tonight = {x["id"] for x in g["players"] if x["side"] == side}
    avg = collections.defaultdict(float)
    for _, m in recent:
        for pid, v in m.items():
            avg[pid] += v / len(recent)
    out_min = sum(v for pid, v in avg.items() if pid != p["id"] and v >= 12.0 and pid not in tonight)
    f["vacated"] = out_min
    f["vacated_starter"] = out_min * f["start_all"]
    f["vacated_bench"] = out_min * (1.0 - f["start_all"])
    f["blowout"] = abs(exp_margin)
    f["blowout_starter"] = abs(exp_margin) * f["start_all"]
    f["exp_margin"] = exp_margin
    f["pace"] = ((np.mean([x["poss"] for x in tg[-20:]]) + np.mean([x["poss"] for x in og[-20:]])) / 2.0) / lg_poss
    for s in ("pts", "reb", "ast", "tpm"):
        lg = L["allowed_" + s] / max(1, L["games"])
        n = len(og[-30:])
        ratio = float(np.mean([x["allowed"][s] for x in og[-30:]])) / lg if lg else 1.0
        f["opp_" + s] = (n * ratio + 8.0 * 1.0) / (n + 8.0)
    # per-minute rates, recency weighted and shrunk toward the league rate
    w = np.array([0.5 ** ((len(hist) - 1 - i) / (HALFLIFE * RATE_HL_MULT)) for i in range(len(hist))])
    mm = np.array(mins)
    for s in ("pts", "reb", "ast", "tpm"):
        lg_rate = L[s] / max(1.0, L["min"])
        num = float(np.dot(w, np.array([x[s] for x in hist])))
        den = float(np.dot(w, mm))
        f["rate_" + s] = (num + RATE_SHRINK_MIN * lg_rate * (den / max(1.0, den))) / (den + RATE_SHRINK_MIN) if den > 0 else lg_rate
        f["last10_" + s] = float(np.mean([x[s] for x in hist[-10:]]))
    return f


def build_rows(games):
    state = State()
    rows = []
    by_day = collections.defaultdict(list)
    for g in games:
        by_day[day_of(g)].append(g)
    for d in sorted(by_day):
        for g in by_day[d]:                           # features first: only earlier days are in state
            for p in g["players"]:
                f = features(state, g, p, d)
                if f:
                    rows.append({"date": d, "game": g["game_id"], "player": p["id"], "name": p["name"], "team": p["team"],
                                 "min": p["min"], "start": p["start"], "pts": p["pts"], "reb": p["reb"],
                                 "ast": p["ast"], "tpm": p["tpm"], "f": f})
        for g in by_day[d]:                           # then the day's games join the history
            state.add_game(g)
    return rows


# ---------- models ----------
def ridge(X, y, lam=5.0):
    X1 = np.hstack([X, np.ones((len(X), 1))])
    A = X1.T @ X1 + lam * np.eye(X1.shape[1])
    A[-1, -1] -= lam                                   # do not shrink the intercept
    return np.linalg.solve(A, X1.T @ y)


def ridge_pred(beta, X):
    return np.hstack([X, np.ones((len(X), 1))]) @ beta


def poisson_offset(X, y, offset, iters=25, lam=1.0):
    """Poisson GLM with log link and offset: y ~ Poisson(exp(offset + X b + c))."""
    n, k = X.shape
    X1 = np.hstack([X, np.ones((n, 1))])
    b = np.zeros(k + 1)
    for _ in range(iters):
        mu = np.exp(np.clip(offset + X1 @ b, -8, 8))
        grad = X1.T @ (y - mu) - lam * np.r_[b[:-1], 0.0]
        H = (X1 * mu[:, None]).T @ X1 + lam * np.diag(np.r_[np.ones(k), 0.0]) + 1e-9 * np.eye(k + 1)
        step = np.linalg.solve(H, grad)
        b += step
        if np.max(np.abs(step)) < 1e-7:
            break
    return b


def poisson_pred(b, X, offset):
    return np.exp(np.clip(offset + np.hstack([X, np.ones((len(X), 1))]) @ b, -8, 8))


MIN_GROUPS = {
    "role": ["min_season", "start5", "start_all"],
    "rest": ["rest", "b2b"],
    "home": ["home"],
    "blowout": ["blowout", "blowout_starter"],
    "teammates_out": ["vacated", "vacated_starter", "vacated_bench"],
}
STAT_GROUPS = {
    "opponent_defence": ["opp"],            # resolved per stat
    "pace": ["pace_log"],
    "rest_home": ["b2b", "home", "rest"],
}


def matrix(rows, names):
    return np.array([[r["f"][n] if n in r["f"] else 0.0 for n in names] for r in rows], float)


def months(rows):
    return sorted({(r["date"].year, r["date"].month) for r in rows})


def nb_survival(mu, alpha, k):
    """P(X >= k) for a negative binomial with mean mu and variance mu + alpha*mu^2."""
    from scipy.stats import nbinom
    mu = np.maximum(mu, 1e-6)
    if alpha < 1e-6:
        from scipy.stats import poisson
        return poisson.sf(k - 1, mu)
    r = 1.0 / alpha
    p = r / (r + mu)
    return nbinom.sf(k - 1, r, p)


# Final feature choices, from the ablation (kept only where they clearly helped on later games):
#   minutes: role, rest, teammates out.   counts: opponent defence everywhere, pace for points/threes,
#   rest + home for made threes only (they made rebounds and assists worse).
FINAL_MINUTE_GROUPS = ["role", "rest", "teammates_out"]
ALPHA_MULTS = (1.0, 1.15, 1.3, 1.5, 1.75, 2.0, 2.5)


def _stat_names(key, groups_on):
    names = []
    if "opponent_defence" in groups_on:
        names += ["opp_" + key]
    if "pace" in groups_on and key in ("pts", "tpm"):
        names += ["pace"]
    if "rest_home" in groups_on and key == "tpm":
        names += ["b2b", "home"]
    return names


def _tf(rs, names):
    X = matrix(rs, names)
    for j, n in enumerate(names):
        if n.startswith("opp_") or n == "pace":
            X[:, j] = np.log(np.maximum(X[:, j], 1e-3))
    return X


def best_alpha_mult(sname, mu, y, alpha0):
    """Spread multiplier that gives the best probabilities for 'reaches the rounded projection' on the training games."""
    ks = np.array([whole(m) for m in mu])
    keep = ks >= MEANINGFUL[sname]
    if keep.sum() < 500:
        return 1.0
    hit = (y[keep] >= ks[keep]).astype(float)
    best, best_b = 1.0, None
    for m in ALPHA_MULTS:
        p = nb_survival(mu[keep], alpha0 * m, ks[keep])
        b = float(np.mean((p - hit) ** 2))
        if best_b is None or b < best_b - 1e-6:
            best, best_b = m, b
    return best


def fit_models(train, groups_on, minutes_groups_on):
    """Fit the minutes model and one count model per stat on earlier games only."""
    mnames = ["min_ewma", "min_last10"] + [n for g in minutes_groups_on for n in MIN_GROUPS[g]]
    Xm, ym = matrix(train, mnames), np.array([r["min"] for r in train])
    bm = ridge(Xm, ym)
    pm_train = np.clip(ridge_pred(bm, Xm), 3, 42)
    models = {"mnames": mnames, "bm": bm, "stats": {}}
    for sname, key in STATS.items():
        y = np.array([r[key] for r in train], float)
        rate_tr = np.array([r["f"]["rate_" + key] for r in train])
        base_tr = np.maximum(pm_train * rate_tr, 1e-3)
        names = _stat_names(key, groups_on)
        if names:
            bP = poisson_offset(_tf(train, names), y, np.log(base_tr))
            mu_tr = poisson_pred(bP, _tf(train, names), np.log(base_tr))
        else:
            bP, mu_tr = None, base_tr
        resid = y - mu_tr
        alpha0 = max(0.0, float((np.mean(resid ** 2) - np.mean(mu_tr)) / max(1e-6, np.mean(mu_tr ** 2))))
        alpha = alpha0 * best_alpha_mult(sname, mu_tr, y, alpha0)
        models["stats"][sname] = {"key": key, "names": names, "bP": bP, "alpha": alpha, "alpha0": alpha0}
    return models


def predict_models(models, rows):
    pm = np.clip(ridge_pred(models["bm"], matrix(rows, models["mnames"])), 3, 42)
    out = {}
    for sname, m in models["stats"].items():
        rate = np.array([r["f"]["rate_" + m["key"]] for r in rows])
        base = np.maximum(pm * rate, 1e-3)
        out[sname] = poisson_pred(m["bP"], _tf(rows, m["names"]), np.log(base)) if m["names"] else base
    return pm, out


def walk_forward(rows, test_from, groups_on, minutes_groups_on):
    """Returns per-row dict of predictions for rows on/after test_from."""
    out = {}
    ms = [m for m in months(rows) if dt.date(m[0], m[1], 1) >= test_from]
    for (y, m) in ms:
        start = dt.date(y, m, 1)
        end = dt.date(y + (m == 12), (m % 12) + 1, 1)
        train = [r for r in rows if r["date"] < start]
        test = [r for r in rows if start <= r["date"] < end]
        if len(train) < 2500 or not test:
            continue
        models = fit_models(train, groups_on, minutes_groups_on)
        pm, mus = predict_models(models, test)
        for i, r in enumerate(test):
            out[(r["game"], r["player"])] = {"min": float(pm[i]),
                **{s: (float(mus[s][i]), models["stats"][s]["alpha"]) for s in STATS}}
    return out


def evaluate(rows, preds, label):
    by = {s: {"abs": [], "brier": [], "p": [], "hit": [], "game": []} for s in STATS}
    mabs, mgame = [], []
    for r in rows:
        pr = preds.get((r["game"], r["player"]))
        if not pr:
            continue
        mabs.append(abs(pr["min"] - r["min"]))
        mgame.append(r["game"])
        for s, key in STATS.items():
            mu, alpha = pr[s]
            by[s]["abs"].append(abs(mu - r[key]))
            by[s]["game"].append(r["game"])
            k = whole(mu)
            if k >= MEANINGFUL[s]:
                p = float(nb_survival(np.array([mu]), alpha, k)[0])
                by[s]["p"].append(p)
                by[s]["hit"].append(1.0 if r[key] >= k else 0.0)
                by[s]["brier"].append((p - (1.0 if r[key] >= k else 0.0)) ** 2)
    res = {"label": label, "n": len(mabs), "minutes_mae": float(np.mean(mabs))}
    for s in STATS:
        b = by[s]
        res[s] = {"mae": float(np.mean(b["abs"])), "n_events": len(b["p"]),
                  "brier_reach_rounded_projection": float(np.mean(b["brier"])) if b["brier"] else None}
    res["_raw"] = {"minutes": (mabs, mgame), **{s: (by[s]["abs"], by[s]["game"]) for s in STATS}}
    return res


def calibration(rows, preds):
    bins = [(0.0, .35), (.35, .45), (.45, .55), (.55, .65), (.65, .75), (.75, 1.01)]
    out = {}
    for s, key in STATS.items():
        ps, hs = [], []
        for r in rows:
            pr = preds.get((r["game"], r["player"]))
            if not pr:
                continue
            mu, alpha = pr[s]
            k = whole(mu)
            if k < MEANINGFUL[s]:
                continue
            ps.append(float(nb_survival(np.array([mu]), alpha, k)[0]))
            hs.append(1.0 if r[key] >= k else 0.0)
        ps, hs = np.array(ps), np.array(hs)
        out[s] = [{"stated": f"{lo:.2f}-{min(hi,1):.2f}", "n": int(((ps >= lo) & (ps < hi)).sum()),
                   "mean_stated": float(ps[(ps >= lo) & (ps < hi)].mean()) if ((ps >= lo) & (ps < hi)).any() else None,
                   "actual": float(hs[(ps >= lo) & (ps < hi)].mean()) if ((ps >= lo) & (ps < hi)).any() else None}
                  for lo, hi in bins]
    return out


def paired_delta(a, b, n_boot=300, seed=7):
    """Mean of (a - b) per game cluster with bootstrap CI. Negative = a has smaller error."""
    (va, ga), (vb, gb) = a, b
    d = collections.defaultdict(list)
    for x, y, g in zip(va, vb, ga):
        d[g].append(x - y)
    clusters = [(sum(v), len(v)) for v in d.values()]
    tot = sum(c[0] for c in clusters) / sum(c[1] for c in clusters)
    rng = np.random.default_rng(seed)
    idx = np.arange(len(clusters))
    boots = []
    for _ in range(n_boot):
        pick = rng.choice(idx, len(idx))
        boots.append(sum(clusters[i][0] for i in pick) / max(1, sum(clusters[i][1] for i in pick)))
    return tot, float(np.percentile(boots, 2.5)), float(np.percentile(boots, 97.5))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", action="append", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--test-from", default="2026-01-01")
    ap.add_argument("--shrink", type=float, default=None)
    ap.add_argument("--rate-hl", type=float, default=None)
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    global RATE_SHRINK_MIN, RATE_HL_MULT
    if a.shrink is not None:
        RATE_SHRINK_MIN = a.shrink
    if a.rate_hl is not None:
        RATE_HL_MULT = a.rate_hl
    games = load(a.games)
    print("games", len(games), "from", games[0]["date"][:10], "to", games[-1]["date"][:10], flush=True)
    rows = build_rows(games)
    print("player-game rows with enough history", len(rows), flush=True)
    test_from = dt.date.fromisoformat(a.test_from)
    all_min = list(FINAL_MINUTE_GROUPS)
    all_stat = list(STAT_GROUPS)
    configs = {"rate_only": ([], []), "everything": (all_stat, all_min)}
    for g in all_stat:
        configs["only_" + g] = ([g], [])
        configs["without_" + g] = ([x for x in all_stat if x != g], all_min)
    for g in all_min:
        configs["minutes_only_" + g] = ([], [g])
        configs["minutes_without_" + g] = (all_stat, [x for x in all_min if x != g])
    if a.only:
        configs = {k: v for k, v in configs.items() if k in a.only.split(',') or k == 'rate_only'}
    results, all_preds = {}, {}
    for name, (sg, mg) in configs.items():
        preds = walk_forward(rows, test_from, sg, mg)
        all_preds[name] = preds
        results[name] = evaluate(rows, preds, name)
        print(name, "n", results[name]["n"], "minutes MAE %.3f" % results[name]["minutes_mae"],
              " ".join("%s %.3f" % (s[:4], results[name][s]["mae"]) for s in STATS), flush=True)
    # baseline: average of last 10 games (no minutes model)
    base = {}
    for r in rows:
        if r["date"] < test_from:
            continue
        base[(r["game"], r["player"])] = {"min": r["f"]["min_last10"], **{s: (max(r["f"]["last10_" + k], 1e-3), 0.0) for s, k in STATS.items()}}
    base_keys = set(all_preds[next(k for k in all_preds if k != "rate_only")])
    base = {k: v for k, v in base.items() if k in base_keys}
    results["recent_average"] = evaluate(rows, base, "recent_average")
    print("recent_average n", results["recent_average"]["n"], "minutes MAE %.3f" % results["recent_average"]["minutes_mae"],
          " ".join("%s %.3f" % (s[:4], results["recent_average"][s]["mae"]) for s in STATS), flush=True)
    # ablation lifts vs the rate-only model
    lifts = {}
    for name in results:
        if name in ("rate_only",):
            continue
        row = {"minutes_mae_change": paired_delta(results[name]["_raw"]["minutes"], results["rate_only"]["_raw"]["minutes"])}
        for s in STATS:
            row[s + "_mae_change"] = paired_delta(results[name]["_raw"][s], results["rate_only"]["_raw"][s])
        lifts[name] = row
    report = {"games": len(games), "rows": len(rows), "test_from": a.test_from,
              "summary": {k: {kk: vv for kk, vv in v.items() if kk != "_raw"} for k, v in results.items()},
              "change_vs_rate_only_negative_is_better": lifts,
              "calibration_everything": calibration(rows, all_preds[next(k for k in all_preds if k != "rate_only")])}
    Path(a.out).write_text(json.dumps(report, indent=1, default=float))
    print("wrote", a.out, flush=True)


if __name__ == "__main__":
    sys.exit(main())
