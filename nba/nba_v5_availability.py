#!/usr/bin/env python3
"""Who plays: learned chances, injury type, and joint scenarios (NBA V5).

1. P(plays | reported status [, body part]) is learned from our own graded forecasts (nba_v5_postmortem.py counts how often a player
   reported OUT / DOUBTFUL / QUESTIONABLE / PROBABLE, or not reported at all, actually played). ESPN keeps no dated injury history, so
   the table starts from cautious priors and moves toward what really happened as games are graded. Body part (knee, ankle...) refines a
   status only when enough games back it, otherwise the status-level chance is used.
2. Joint scenarios: players on a team sit together more (or less) than chance (load management, shared injuries, rotation changes).
   The co-absence of regular rotation players over the last 60 team games sets a correlation matrix, and availability is drawn from a
   Gaussian copula with each player's own chance of playing as the margin. A questionable starter and a questionable backup are then
   not independent coin flips.
"""
from __future__ import annotations
import json
from pathlib import Path

import numpy as np

# cautious starting values, pulled toward results as they accumulate (PRIOR_STRENGTH pseudo-games each)
PRIORS = {"OUT": 0.02, "DOUBTFUL": 0.12, "QUESTIONABLE": 0.55, "PROBABLE": 0.90, "UNLISTED": 0.96}
PRIOR_STRENGTH = 10.0
BODY_PRIOR_STRENGTH = 12.0


def norm_status(s):
    t = (s or "").strip().upper().replace("-", " ")
    if t in ("OUT", "INJURED RESERVE", "SUSPENSION", "NOT WITH TEAM"):
        return "OUT"
    if t == "DOUBTFUL":
        return "DOUBTFUL"
    if t in ("QUESTIONABLE", "DAY TO DAY", "GAME TIME DECISION"):
        return "QUESTIONABLE"
    if t in ("PROBABLE", "AVAILABLE", "ACTIVE"):
        return "PROBABLE"
    return "UNLISTED"


class PlayTable:
    """Learned P(plays) by status, and by status and body part."""

    def __init__(self, counts_by_status=None, counts_by_body=None):
        self.cs = counts_by_status or {}
        self.cb = counts_by_body or {}

    @classmethod
    def from_grades(cls, summary_path):
        p = Path(summary_path)
        if not p.exists():
            return cls()
        d = json.loads(p.read_text())
        cs, cb = {}, {}
        for kind in ("first",):
            blk = d.get(kind, {})
            for k, v in (blk.get("play_by_status") or {}).items():
                cs[k] = v
            for k, v in (blk.get("play_by_status_body") or {}).items():
                cb[k] = v
        return cls(cs, cb)

    def p_play(self, status, body=None):
        s = norm_status(status)
        c = self.cs.get(s, {})
        played, n = float(c.get("played", 0)), float(c.get("played", 0) + c.get("did_not_play", 0))
        base = (played + PRIORS[s] * PRIOR_STRENGTH) / (n + PRIOR_STRENGTH)
        if body:
            cc = self.cb.get(f"{s}|{body}", {})
            pl, nn = float(cc.get("played", 0)), float(cc.get("played", 0) + cc.get("did_not_play", 0))
            return (pl + base * BODY_PRIOR_STRENGTH) / (nn + BODY_PRIOR_STRENGTH)
        return base

    def describe(self):
        return {s: round(self.p_play(s), 3) for s in PRIORS} | {"games_behind": {s: int(sum(self.cs.get(s, {}).values())) for s in PRIORS}}


# ------------------------------------------------------------------ joint scenarios
def absence_matrix(team_rosters, d, min_avg=10.0, window=60):
    """Absences of the team's regular rotation players over its last `window` games before date d.
    team_rosters: [(date, {player_id: minutes})] in order. Returns (player_ids, matrix games x players of 1 = absent)."""
    games = [r for r in team_rosters if r[0] < d][-window:]
    if len(games) < 15:
        return [], None
    avg = {}
    for _, m in games[-20:]:
        for pid, v in m.items():
            avg[pid] = avg.get(pid, 0.0) + v / min(20, len(games))
    ids = [pid for pid, v in avg.items() if v >= min_avg]
    if len(ids) < 2:
        return ids, None
    A = np.array([[0.0 if pid in m else 1.0 for pid in ids] for _, m in games])
    return ids, A


def correlation_from_absences(A, shrink=8.0):
    """Shrunk correlation of absences (phi coefficient), made positive semi-definite."""
    n, k = A.shape
    R = np.eye(k)
    sd = A.std(axis=0)
    ok = sd > 1e-9
    if ok.sum() >= 2:
        C = np.corrcoef(A[:, ok].T)
        C = np.nan_to_num(C)
        idx = np.where(ok)[0]
        for a, i in enumerate(idx):
            for b, j in enumerate(idx):
                R[i, j] = C[a, b]
    w = n / (n + shrink)
    R = w * R + (1 - w) * np.eye(k)
    np.fill_diagonal(R, 1.0)
    vals, vecs = np.linalg.eigh(R)
    vals = np.clip(vals, 1e-3, None)
    R = (vecs * vals) @ vecs.T
    d = np.sqrt(np.diag(R))
    return R / np.outer(d, d)


def copula_availability(rng, p_play, corr, S):
    """Draw availability for S games from a Gaussian copula with these margins. corr: (N,N) over the same players."""
    from scipy.special import ndtri
    N = len(p_play)
    L = np.linalg.cholesky(corr + 1e-9 * np.eye(N))
    Z = rng.standard_normal((S, N)) @ L.T
    thr = ndtri(np.clip(p_play, 1e-6, 1 - 1e-6))
    return Z < thr[None, :]


def full_corr_for(ids_all, ids_hist, R_hist):
    """Embed a rotation-player correlation matrix into the full roster order (others independent)."""
    pos = {pid: i for i, pid in enumerate(ids_all)}
    R = np.eye(len(ids_all))
    for a, pa in enumerate(ids_hist):
        for b, pb in enumerate(ids_hist):
            if pa in pos and pb in pos:
                R[pos[pa], pos[pb]] = R_hist[a, b]
    return R
