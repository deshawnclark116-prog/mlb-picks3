#!/usr/bin/env python3
"""NBA V5: a possession-by-possession simulation of the whole game.

Everything a player does comes out of one simulated game that hangs together:
  * who plays: each player is available or not (probability of playing); the five on the floor
    in every two-minute stretch are drawn from learned rotation patterns, so a team's minutes always
    add to 240 and a missing teammate's minutes go to the players who actually take them;
  * rotation learned from real substitutions: starter/bench staggering, foul trouble (players foul out),
    blowout minutes, overtime, stint continuity;
  * each possession is used by a player in proportion to his usage; it ends in a turnover (with a
    steal credited to a real defender), a free-throw trip, or a two/three-point shot whose make
    probability is the shooter's own (shrunk toward the league, sampled per game for limited data) times the
    opponent's defence and a shared team shooting-luck draw; makes are assisted by real teammates;
    misses are blocked or rebounded (offensive or defensive) by players on the floor; fouls accumulate;
  * pace is one draw per game shared by both teams; late-game fouling, bonus and timeouts follow
    learned rates; ties go to overtime.
Player points, rebounds, assists, threes, steals, blocks, turnovers and fouls are all counted from the same
events, so they add up and move together. Nothing from after tip-off is used; every learned number
comes from earlier games only. No sportsbook input.
"""
from __future__ import annotations
import collections
import math
from dataclasses import dataclass, field

import numpy as np

SEG = 24                       # two-minute stretches in regulation
SEG_SEC = 120.0
STATS_BOX = ("min", "fga", "fgm", "tpa", "tpm", "fta", "ftm", "ast", "oreb", "dreb", "stl", "blk", "tov", "pf", "pts")
MARKETS = {"points": "pts", "rebounds": "reb", "assists": "ast", "three_pointers_made": "tpm",
           "steals": "stl", "blocks": "blk", "turnovers": "tov"}


# ------------------------------------------------------------------ rotation from play-by-play
def presence_from_events(game):
    """Seconds on the floor per player per two-minute stretch, fouls and margin at the start of each stretch.

    Returns (presence{pid: np.array(SEG)}, fouls_at_start{pid: np.array(SEG)}, margin_at_start np.array(SEG),
             team_of{pid: team}, last_event_seg)."""
    on = {t: list(ids) for t, ids in game["starters"].items()}
    team_of = {p: t for t, ids in on.items() for p in ids}
    pres = collections.defaultdict(lambda: np.zeros(SEG))
    fouls = collections.defaultdict(int)
    fouls_seg = collections.defaultdict(lambda: np.zeros(SEG))
    margin_seg = np.zeros(SEG)
    score = {game["home"]: 0, game["away"]: 0}
    t_prev = 0.0
    seg_marked = set()

    def elapsed(per, left):
        return (min(per, 4) - 1) * 720.0 + (720.0 - left) if per <= 4 else 2880.0 + (per - 5) * 300.0 + (300.0 - left)

    def mark_segments(upto):
        for s in range(SEG):
            if s in seg_marked:
                continue
            if s * SEG_SEC <= upto:
                margin_seg[s] = score[game["home"]] - score[game["away"]]
                for p in team_of:
                    fouls_seg[p][s] = fouls[p]
                seg_marked.add(s)

    def accrue(t0, t1):
        t = t0
        while t < t1 - 1e-9:
            s = int(t // SEG_SEC)
            if s >= SEG:
                return
            end = min(t1, (s + 1) * SEG_SEC)
            for ids in on.values():
                for p in ids:
                    pres[p][s] += end - t
            t = end

    for ev in game["events"]:
        per, left, kind, team, a, b, pts = ev[:7]
        t = elapsed(per, left)
        if per > 4:
            break
        if t > t_prev:
            mark_segments(t_prev)
            accrue(t_prev, t)
            t_prev = t
        mark_segments(t)
        if kind == "SUB" and team in on and a and b:
            if b in on[team]:
                on[team][on[team].index(b)] = a
                team_of[a] = team
        elif kind in ("S2", "S3", "FT") and pts:
            score[team] = score.get(team, 0) + pts
        elif kind == "PF" and a:
            fouls[a] += 1
    mark_segments(2880.0)
    return pres, fouls_seg, margin_seg, team_of


# ------------------------------------------------------------------ learned tables
def margin_bucket(m):
    m = abs(m)
    return 0 if m < 6 else 1 if m < 12 else 2 if m < 20 else 3


class RotationTables:
    """Learned from earlier games only: how starters' floor time reacts to the score gap and to foul trouble,
    and how long overtime lasts for starters."""

    def __init__(self):
        self.blow_sum = np.zeros((4, 2))      # margin bucket x (Q3, Q4) : starter presence sum
        self.blow_n = np.zeros((4, 2))
        self.foul_sum = np.zeros((6, 2))      # fouls at segment start (0..5+) x (first half, second half)
        self.foul_n = np.zeros((6, 2))
        self.add_count = 0

    def add_game(self, game, pres, fouls_seg, margin_seg, team_of):
        starters = {p for ids in game["starters"].values() for p in ids}
        for p, arr in pres.items():
            base_first = arr[:6].sum() + arr[12:18].sum()
            for s in range(SEG):
                share = arr[s] / SEG_SEC
                half = 0 if s < 12 else 1
                f = int(min(5, fouls_seg[p][s]))
                self.foul_sum[f, half] += share
                self.foul_n[f, half] += 1
                if p in starters and s >= 12:
                    self.blow_sum[margin_bucket(margin_seg[s]), 0 if s < 18 else 1] += share
                    self.blow_n[margin_bucket(margin_seg[s]), 0 if s < 18 else 1] += 1
        self.add_count += 1

    def blow_mult(self):
        m = self.blow_sum / np.maximum(self.blow_n, 1)
        base = np.maximum(m[0], 1e-3)
        return np.clip(m / base, 0.05, 1.2)

    def foul_mult(self):
        m = self.foul_sum / np.maximum(self.foul_n, 1)
        base = np.maximum(m[0], 1e-3)
        return np.clip(m / base, 0.05, 1.2)


# ------------------------------------------------------------------ player and team profiles
@dataclass
class League:
    per_min: dict = field(default_factory=dict)
    p2: float = 0.52
    p3: float = 0.36
    pft: float = 0.78
    sh3: float = 0.40          # share of attempts that are threes
    stl_per_tov: float = 0.55
    blk_per_miss2: float = 0.10
    assisted2: float = 0.55
    assisted3: float = 0.82
    team_or_pct: float = 0.26
    zmod: np.ndarray | None = None       # (5,) assisted share by spot relative to overall
    reb_or: float = 0.34                 # share of rebound events that are offensive (team rebounds included)
    credit_or: float = 0.64              # share of offensive rebounds credited to a player
    credit_dr: float = 0.93              # share of defensive rebounds credited to a player
    team_or_pg: float = 6.5              # team offensive rebounds per team per game missing from box scores
    blk2: float = 0.15                   # blocks per missed two
    blk3: float = 0.03                   # blocks per missed three
    poss: float = 99.0


def league_from(history_lines, team_games):
    L = League()
    tot = collections.Counter()
    for x in history_lines:
        for k in STATS_BOX:
            tot[k] += x.get(k, 0)
    mn = max(1.0, tot["min"])
    L.per_min = {k: tot[k] / mn for k in STATS_BOX if k != "min"}
    fg2a = tot["fga"] - tot["tpa"]
    L.p2 = (tot["fgm"] - tot["tpm"]) / max(1, fg2a)
    L.p3 = tot["tpm"] / max(1, tot["tpa"])
    L.pft = tot["ftm"] / max(1, tot["fta"])
    L.sh3 = tot["tpa"] / max(1, tot["fga"])
    L.stl_per_tov = min(0.9, tot["stl"] / max(1, tot["tov"]))
    L.blk_per_miss2 = tot["blk"] / max(1, fg2a - (tot["fgm"] - tot["tpm"]))
    L.team_or_pct = tot["oreb"] / max(1, tot["oreb"] + tot["dreb"])
    if team_games:
        L.poss = float(np.mean([g["poss"] for g in team_games]))
    return L


def build_profile(hist, L: League, half_life=30.0, prior_min=60.0):
    """Recency-weighted per-minute rates and shooting percentages from a player's earlier box lines."""
    n = len(hist)
    w = np.array([0.5 ** ((n - 1 - i) / half_life) for i in range(n)])
    def S(k):
        return float(np.dot(w, np.array([h[k] for h in hist], float)))
    mins = S("min")
    pr = {}
    for k in ("fga", "tpa", "fta", "ast", "oreb", "dreb", "stl", "blk", "tov", "pf"):
        pr[k] = (S(k) + prior_min * L.per_min[k]) / (mins + prior_min)
    fga, tpa = S("fga"), S("tpa")
    fg2a = max(0.0, fga - tpa)
    n3 = tpa + 25.0
    n2 = fg2a + 40.0
    nf = S("fta") + 25.0
    return {
        "rate": pr,
        "p3": (S("tpm") + 25.0 * L.p3) / n3, "n3": n3,
        "p2": (max(0.0, S("fgm") - S("tpm")) + 40.0 * L.p2) / n2, "n2": n2,
        "pft": (S("ftm") + 25.0 * L.pft) / nf, "nft": nf,
        "sh3": (tpa + 10.0 * L.sh3) / (fga + 10.0),
        "games": n, "min_avg": float(np.mean([h["min"] for h in hist[-10:]])),
    }


# ------------------------------------------------------------------ the simulation
@dataclass
class TeamInput:
    ids: list
    prof: list                 # profile dicts (build_profile)
    presence: np.ndarray       # (N, SEG) expected share of each two-minute stretch on the floor, given he plays
    p_play: np.ndarray         # (N,) probability the player is available
    starter: np.ndarray        # (N,) bool: expected to start
    defence: dict              # opponent-facing ratios: p2, p3, tov, or_, ft  (1.0 = league average)
    minutes_cap: np.ndarray | None = None      # announced minutes restriction per player (None = no limit)
    return_mult: np.ndarray | None = None      # first-games-back multiplier on floor time (1.0 = normal)
    eff: tuple = (1.0, 1.0)                    # schedule/travel effect on two- and three-point accuracy
    start_mult: float = 1.0                    # schedule effect on starters' floor time
    zf: np.ndarray | None = None               # (N, 5) share of each player's shots from rim, paint, mid, corner 3, above-break 3
    zp: np.ndarray | None = None               # (N, 5) his accuracy from each spot
    zn: np.ndarray | None = None               # (N, 5) effective attempts behind that accuracy
    assisted: np.ndarray | None = None         # (N,) share of his makes that are assisted
    dz_freq: np.ndarray | None = None          # (5,) how much more or less this team (defending) concedes from each spot
    dz_pct: np.ndarray | None = None           # (5,) how much more or less accurate opponents are from each spot against it


def _beta(rng, p, n, shape):
    p = np.clip(p, 0.02, 0.98)
    return rng.beta(np.maximum(p * n, 0.5), np.maximum((1 - p) * n, 0.5), size=shape)


def simulate_game(home: TeamInput, away: TeamInput, L: League, tables: dict, S=2000, pace=None, seed=0,
                  luck_sd=(0.045, 0.07), env_sd=0.06, rho=0.6, features=None, ctx=None):
    """Returns {side: {stat: array (S, N)}}. `features` toggles pieces for ablation tests."""
    F = {"rotation": True, "foul_trouble": True, "blowout": True, "overtime": True, "param_uncertainty": True,
         "luck": True, "assists": True, "putbacks": True, "defence": True, "schedule": True, "officials": True,
         "late_game": True, "returns": True, "minute_limits": True, "zones": True}
    ctx = ctx or {}
    if features:
        F.update(features)
    rng = np.random.default_rng(seed)
    teams = [home, away]
    N = [len(t.ids) for t in teams]
    pace = pace or L.poss
    env = np.clip(np.exp(rng.normal(-0.5 * env_sd ** 2, env_sd, S)), 0.8, 1.25)
    base_n = pace * env / SEG                                        # possessions per team per two minutes
    luck = [np.exp(rng.normal(0, 1, (S, 2)) * np.array(luck_sd)) if F["luck"] else np.ones((S, 2)) for _ in teams]
    avail = [rng.random((S, N[i])) < teams[i].p_play[None, :] for i in range(2)]
    par = []
    for i, t in enumerate(teams):
        p2 = np.array([x["p2"] for x in t.prof]); n2 = np.array([x["n2"] for x in t.prof])
        p3 = np.array([x["p3"] for x in t.prof]); n3 = np.array([x["n3"] for x in t.prof])
        pf = np.array([x["pft"] for x in t.prof]); nf = np.array([x["nft"] for x in t.prof])
        sh = (S, N[i])
        if F["param_uncertainty"]:
            par.append({"p2": _beta(rng, p2, n2, sh), "p3": _beta(rng, p3, n3, sh), "pft": _beta(rng, pf, nf, sh)})
        else:
            par.append({"p2": np.tile(p2, (S, 1)), "p3": np.tile(p3, (S, 1)), "pft": np.tile(pf, (S, 1))})
    for i, t in enumerate(teams):
        if t.zf is not None and F["zones"]:
            zp = np.clip(t.zp, 0.02, 0.98)[None, :, :]
            zn = np.maximum(t.zn, 1.0)[None, :, :]
            if F["param_uncertainty"]:
                par[i]["pz"] = rng.beta(np.maximum(zp * zn, 0.5), np.maximum((1 - zp) * zn, 0.5), size=(S, N[i], 5))
            else:
                par[i]["pz"] = np.tile(zp, (S, 1, 1))
    rate = [{k: np.array([x["rate"][k] for x in t.prof]) for k in t.prof[0]["rate"]} for t in teams]
    sh3 = [np.array([x["sh3"] for x in t.prof]) for t in teams]
    usage = [r["fga"] + 0.44 * r["fta"] + r["tov"] for r in rate]
    st = [{k: np.zeros((S, N[i])) for k in ("min", "pts", "reb", "ast", "tpm", "stl", "blk", "tov", "pf", "fgm", "fga", "ftm", "fta")} for i in range(2)]
    fouls = [np.zeros((S, N[i])) for i in range(2)]
    score = np.zeros((S, 2))
    gum = [rng.gumbel(size=(S, N[i])) for i in range(2)]
    blow, foulm = tables["blow"], tables["foul"]
    ar = np.arange(S)
    rate_mult = lambda d, k: d.get(k, 1.0) if F["defence"] else 1.0

    def pick(weights):
        c = np.cumsum(weights, axis=1)
        r = rng.random(S)[:, None] * c[:, -1:]
        return np.minimum((c > r).argmax(axis=1), weights.shape[1] - 1)

    def lineup(i, seg, mask, minutes_len, quarter_half):
        t = teams[i]
        W = np.tile(t.presence[:, seg], (S, 1)) if F["rotation"] else np.tile(np.full(N[i], 0.5), (S, 1))
        W = W * avail[i]
        if F["returns"] and t.return_mult is not None:
            W = W * t.return_mult[None, :]
        if F["minute_limits"] and t.minutes_cap is not None:
            exp_min = np.maximum(t.presence.sum(axis=1) * 2.0, 1e-6)
            W = W * np.minimum(1.0, t.minutes_cap / exp_min)[None, :]
        if F["schedule"] and t.start_mult != 1.0:
            W = np.where(t.starter[None, :], W * t.start_mult, W)
        half = 0 if seg < 12 else 1
        if F["foul_trouble"]:
            fb = np.minimum(fouls[i], 5).astype(int)
            W = W * foulm[fb, half]
        W = np.where(fouls[i] >= 6, 0.0, W)
        if F["blowout"] and seg >= 12:
            bucket = np.vectorize(margin_bucket)(score[:, i] - score[:, 1 - i]) if False else (
                np.where(np.abs(score[:, i] - score[:, 1 - i]) < 6, 0, np.where(np.abs(score[:, i] - score[:, 1 - i]) < 12, 1,
                         np.where(np.abs(score[:, i] - score[:, 1 - i]) < 20, 2, 3))))
            mult = blow[bucket, 0 if seg < 18 else 1]
            W = np.where(t.starter[None, :], W * mult[:, None], W)
        W = W + 1e-6 * avail[i]
        for _ in range(6):                                           # scale so about five are on the floor
            tot = W.sum(axis=1, keepdims=True)
            W = np.minimum(1.0, W * 5.0 / np.maximum(tot, 1e-9))
        gum[i] = rho * gum[i] + math.sqrt(1 - rho ** 2) * rng.gumbel(size=(S, N[i]))
        score_ = np.log(W + 1e-9) + gum[i] * 0.8
        if seg in (0, 12):
            score_ = score_ + np.where(t.starter[None, :] & avail[i], 10.0, 0.0)
        score_ = np.where(avail[i] & (fouls[i] < 6), score_, -1e9)
        idx = np.argpartition(-score_, 4, axis=1)[:, :5] if N[i] > 5 else np.tile(np.arange(N[i]), (S, 1))
        return idx

    def possession(o, d, Oi, Di, mask):
        """One trip down the floor for team o against team d, for sims where mask is True."""
        to_, tdef = teams[o], teams[d]
        dfn = to_.defence if False else tdef.defence
        u = usage[o][Oi]
        fi_loc = pick(u)
        fi = Oi[ar, fi_loc]
        rf, rt, rto = rate[o]["fga"][fi], rate[o]["fta"][fi], rate[o]["tov"][fi]
        tot = rf + 0.44 * rt + rto
        pTO = np.clip(rto / tot * rate_mult(dfn, "tov"), 0, 0.5)
        ftm_ = ctx.get("ft_mult", 1.0) if F["officials"] else 1.0
        pFT = np.clip(0.44 * rt / tot * rate_mult(dfn, "ft") * ftm_, 0, 0.6)
        if F["late_game"] and ctx.get("late_ft") is not None and cur_seg[0] >= 22:
            lead = score[:, o] - score[:, d]
            lb = np.where((lead >= 1) & (lead <= 3), 0, np.where((lead >= 4) & (lead <= 6), 1, np.where((lead >= 7) & (lead <= 10), 2, -1)))
            tab = ctx["late_ft"][cur_seg[0] - 22]
            pFT = np.where(lb >= 0, tab[np.maximum(lb, 0)], pFT)
        draw = rng.random(S)
        is_to = mask & (draw < pTO)
        is_ft = mask & ~is_to & (draw < pTO + pFT)
        is_shot = mask & ~is_to & ~is_ft
        # turnovers, with a steal credited to a real defender
        st[o]["tov"][ar[is_to], fi[is_to]] += 1
        if is_to.any():
            stl = is_to & (rng.random(S) < L.stl_per_tov)
            dw = rate[d]["stl"][Di] + 1e-6
            di = Di[ar, pick(dw)]
            st[d]["stl"][ar[stl], di[stl]] += 1
        # free throws
        n_ft = np.where(rng.random(S) < 0.73, 2, 3)
        pft = par[o]["pft"][ar, fi]
        made_ft = rng.binomial(n_ft, pft)
        made_ft = np.where(is_ft, made_ft, 0)
        st[o]["pts"][ar, fi] += made_ft
        st[o]["ftm"][ar, fi] += made_ft
        st[o]["fta"][ar, fi] += np.where(is_ft, n_ft, 0)
        score[:, o] += made_ft
        last_miss = is_ft & (rng.random(S) < (1 - pft))
        # shots
        use_z = F["zones"] and to_.zf is not None and "pz" in par[o]
        if use_z:
            dzf = tdef.dz_freq if (F["defence"] and tdef.dz_freq is not None) else np.ones(5)
            dzp = tdef.dz_pct if (F["defence"] and tdef.dz_pct is not None) else np.ones(5)
            zprob = to_.zf[fi] * dzf[None, :]
            zprob = zprob / zprob.sum(axis=1, keepdims=True)
            zone = np.minimum((np.cumsum(zprob, axis=1) > rng.random(S)[:, None]).argmax(axis=1), 4)
            is3 = is_shot & (zone >= 3)
            pm = par[o]["pz"][ar, fi, zone] * dzp[zone]
        else:
            zone = None
            is3 = is_shot & (rng.random(S) < sh3[o][fi])
            pm = np.where(is3, par[o]["p3"][ar, fi] * rate_mult(dfn, "p3"), par[o]["p2"][ar, fi] * rate_mult(dfn, "p2"))
        eff = (to_.eff[1], to_.eff[0]) if F["schedule"] else (1.0, 1.0)
        pm = np.clip(pm * np.where(is3, luck[o][:, 1] * eff[0], luck[o][:, 0] * eff[1]), 0.03, 0.92)
        make = is_shot & (rng.random(S) < pm)
        pts = np.where(is3, 3, 2)
        st[o]["fga"][ar[is_shot], fi[is_shot]] += 1
        st[o]["fgm"][ar[make], fi[make]] += 1
        st[o]["pts"][ar[make], fi[make]] += pts[make]
        st[o]["tpm"][ar[make & is3], fi[make & is3]] += 1
        score[make, o] += pts[make]
        if F["assists"]:
            if use_z and to_.assisted is not None and L.zmod is not None:
                pa = np.clip(to_.assisted[fi] * L.zmod[zone], 0.0, 0.97)
            else:
                pa = np.where(is3, L.assisted3, L.assisted2)
            asst = make & (rng.random(S) < pa)
            aw = rate[o]["ast"][Oi] + 1e-6
            aw = np.where(Oi == fi[:, None], 0.0, aw)
            ai = Oi[ar, pick(aw + 1e-9)]
            st[o]["ast"][ar[asst], ai[asst]] += 1
        miss = is_shot & ~make
        blk = miss & (rng.random(S) < np.where(is3, L.blk3, L.blk2))
        if blk.any():
            bw = rate[d]["blk"][Di] + 1e-6
            bi = Di[ar, pick(bw)]
            st[d]["blk"][ar[blk], bi[blk]] += 1
        # rebounds
        reb_chance = miss | last_miss
        p_or = np.clip(L.reb_or * rate_mult(dfn, "or_") * np.where(last_miss & ~miss, 0.5, 1.0), 0.03, 0.7)
        orb = reb_chance & (rng.random(S) < p_or)
        drb = reb_chance & ~orb
        ow = rate[o]["oreb"][Oi] + 1e-6
        oi = Oi[ar, pick(ow)]
        o_cred = orb & (rng.random(S) < L.credit_or)
        st[o]["reb"][ar[o_cred], oi[o_cred]] += 1
        dw = rate[d]["dreb"][Di] + 1e-6
        dj = Di[ar, pick(dw)]
        d_cred = drb & (rng.random(S) < L.credit_dr)
        st[d]["reb"][ar[d_cred], dj[d_cred]] += 1
        return orb, oi

    cur_seg = [0]
    first5 = [None, None]
    close5 = [np.zeros((S, N[0]), bool), np.zeros((S, N[1]), bool)]
    close_mask = [np.zeros(S, bool)]

    def run_segment(seg, n_per, minutes_len, active=None):
        act = np.ones(S, bool) if active is None else active
        cur_seg[0] = seg
        L5 = [lineup(i, seg, act, minutes_len, seg // 12) for i in range(2)]
        if seg == 0 and first5[0] is None:
            for i in range(2):
                m0 = np.zeros((S, N[i]), bool)
                np.put_along_axis(m0, L5[i], True, axis=1)
                first5[i] = m0
        if seg == SEG - 1 and active is None:
            cm = np.abs(score[:, 0] - score[:, 1]) <= 6
            close_mask[0] = cm
            for i in range(2):
                m1 = np.zeros((S, N[i]), bool)
                np.put_along_axis(m1, L5[i], True, axis=1)
                close5[i] = m1
        for i in range(2):
            m = np.zeros((S, N[i]))
            np.put_along_axis(m, L5[i], 1.0, axis=1)
            st[i]["min"] += m * minutes_len * act[:, None]
        n_s = np.floor(n_per + rng.random(S)).astype(int)
        for j in range(int(n_s.max()) if n_s.size else 0):
            mask = act & (j < n_s)
            if not mask.any():
                break
            for o in (0, 1):
                d = 1 - o
                orb, _ = possession(o, d, L5[o], L5[d], mask)
                if F["putbacks"]:
                    for _rep in range(2):                              # put-backs after offensive rebounds
                        if not orb.any():
                            break
                        orb, _ = possession(o, d, L5[o], L5[d], orb)
            for i in (0, 1):                                          # personal fouls accumulate on the floor
                lam = rate[i]["pf"][L5[i]] * (minutes_len / np.maximum(n_s, 1))[:, None]
                inc = rng.poisson(lam) * mask[:, None]
                np.add.at(fouls[i], (ar[:, None], L5[i]), inc)
                np.add.at(st[i]["pf"], (ar[:, None], L5[i]), inc)

    for seg in range(SEG):
        run_segment(seg, base_n, 2.0)
    if F["overtime"]:
        ot = 0
        while ot < 4:
            tied = score[:, 0] == score[:, 1]
            if not tied.any():
                break
            for part, ln in ((23, 2.0), (23, 2.0), (23, 1.0)):
                run_segment(part, base_n * ln / 2.0, ln, active=tied)
            ot += 1
    out = []
    for i in range(2):
        d = {k: st[i][k] for k in st[i]}
        out.append(d)
    return {"home": out[0], "away": out[1], "score": score, "avail": avail, "first5": first5, "close5": close5, "close_mask": close_mask[0]}
