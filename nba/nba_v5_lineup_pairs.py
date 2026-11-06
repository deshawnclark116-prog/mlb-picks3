"""NBA V5: verified, historical five-man lineup overlap and shadow pair effects.

Uses ESPN starter IDs and substitutions exactly as recorded. A game with
conflicting player actions, broken substitutions, invalid starters, or backwards
time is excluded rather than reconstructed from final box scores.

Counts a player's shooting, assisting, and rebound opportunities conditional on
which teammate shared the court. All records are added *after* the date being
forecast in chronological Replay. These ON/OFF differences are observational:
coach, opponent, game state and fellow players are confounders. No effect
enters production unless a paired V5 full-game experiment validates it.
"""
from __future__ import annotations

from collections import defaultdict
import math
import numpy as np

STAT_KEYS = ("fga", "ast", "oreb", "dreb")
GAME_SECONDS = 2880.0
PSEUDO_MINUTES = 240.0
MIN_ON_MINUTES = 90.0
MIN_OFF_MINUTES = 90.0
LOG_EFFECT_LIMIT = 0.13
STRENGTH = 0.60


def _elapsed(period, clock_left) -> float:
    return (period - 1) * 720.0 + 720.0 - float(clock_left)


def _empty():
    return [0.0, 0.0, 0.0, 0.0, 0.0]  # minutes, fga, ast, oreb, dreb


def replay_game(pb: dict) -> dict:
    """Fail closed; return minute/event exposure tallies only if 5-on-5 trace fits.

    For reliability, an invalid substitution or shot credited to an off-court
    player INVALIDATES the entire game. Time at identical event timestamps is
    zero; overlap accrues only between chronologically successive events.
    """
    teamids = (str(pb.get("home")), str(pb.get("away")))
    starters = pb.get("starters") or {}
    if teamids[0] == teamids[1] or not all(
        len(starters.get(t, [])) == 5 and len(set(starters[t])) == 5
        for t in teamids
    ):
        return {"valid": False, "reason": "STARTER_COVERAGE", "player": {}, "pair": {}}
    players = [str(p) for tid in teamids for p in starters[tid]]
    if len(set(players)) != 10:
        return {"valid": False, "reason": "DUPLICATE_STARTER", "player": {}, "pair": {}}
    on = {t: [str(p) for p in starters[t]] for t in teamids}
    player = defaultdict(_empty)
    pair = defaultdict(_empty)
    tprev = 0.0
    bad = None
    valid_player_events = 0
    total_player_events = 0
    n_subs = 0

    def accrue(to):
        nonlocal tprev
        minutes = (to - tprev) / 60.0
        if minutes > 0:
            for tid in teamids:
                ids = on[tid]
                for p in ids:
                    player[(tid, p)][0] += minutes
                    for q in ids:
                        if p != q:
                            pair[(tid, p, q)][0] += minutes
        tprev = to

    for ev in pb.get("events") or []:
        try:
            period, left, kind, tid, a, b, pts = ev[:7]
            period = int(period)
            if period < 1:
                continue
            if period > 4:
                break
            now = _elapsed(period, left)
            if not 0 <= now <= GAME_SECONDS or now + 1e-6 < tprev:
                bad = "NONMONOTONIC_CLOCK"
                break
            accrue(min(now, GAME_SECONDS))
            tid = str(tid)
            a, b = str(a or ""), str(b or "")
            if kind == "SUB":
                if tid not in on or not a or not b or b not in on[tid] or a in on[tid] or a in on[teamids[1] if tid == teamids[0] else teamids[0]]:
                    bad = "INVALID_SUBSTITUTION"
                    break
                on[tid][on[tid].index(b)] = a
                n_subs += 1
            elif kind in ("S2", "S3", "OR", "DR", "TO", "FT"):
                if not a:
                    continue  # team rebound or event missing a named player
                total_player_events += 1
                if tid not in on or a not in on[tid]:
                    bad = "PLAYER_NOT_ON_COURT"
                    break
                valid_player_events += 1
                metric = "fga" if kind in ("S2", "S3") else (
                    "oreb" if kind == "OR" else "dreb" if kind == "DR" else None
                )
                if metric:
                    j = STAT_KEYS.index(metric) + 1
                    player[(tid, a)][j] += 1
                    for q in on[tid]:
                        if q != a:
                            pair[(tid, a, q)][j] += 1
                if kind in ("S2", "S3") and int(pts) > 0 and b:
                    if b not in on[tid] or b == a:
                        bad = "ASSISTER_NOT_ON_COURT"
                        break
                    j = STAT_KEYS.index("ast") + 1
                    player[(tid, b)][j] += 1
                    for q in on[tid]:
                        if q != b:
                            pair[(tid, b, q)][j] += 1
        except (TypeError, ValueError, IndexError, KeyError):
            bad = "MALFORMED_EVENT"
            break
    if bad is not None or valid_player_events < 100 or n_subs < 2:
        return {"valid": False, "reason": bad or "LOW_EVENT_OR_SUB_COVERAGE",
                "player": {}, "pair": {},
                "named_events_seen": valid_player_events, "substitutions": n_subs}
    accrue(GAME_SECONDS)
    for tid in teamids:
        total_minutes = sum(v[0] for (t, p), v in player.items() if t == tid)
        if abs(total_minutes - 240.0) > 0.01:
            return {"valid": False, "reason": "TEAM_MINUTES_MISMATCH", "player": {}, "pair": {}}
    return {"valid": True, "reason": "VALID_SUBSTITUTION_TRACE",
            "player": dict(player), "pair": dict(pair),
            "named_events_seen": valid_player_events,
            "substitutions": n_subs}


class LineupPairState:
    """Accumulating true historical pair exposure; no roster cross-team mixing."""

    def __init__(self):
        self.players = defaultdict(_empty)
        self.pairs = defaultdict(_empty)
        self.accepted_games = 0
        self.rejected_games = defaultdict(int)
        self.games_by_team = defaultdict(int)

    def add_game(self, pb: dict) -> bool:
        r = replay_game(pb)
        if not r["valid"]:
            self.rejected_games[r["reason"]] += 1
            return False
        for k, vals in r["player"].items():
            for i, val in enumerate(vals):
                self.players[k][i] += val
        for k, vals in r["pair"].items():
            for i, val in enumerate(vals):
                self.pairs[k][i] += val
        self.accepted_games += 1
        self.games_by_team[str(pb["home"])] += 1
        self.games_by_team[str(pb["away"])] += 1
        return True

    def for_roster(self, tid: str, ids: list) -> tuple[dict, dict, dict]:
        """Return per-stat pair matrix and expected-composition centering.

        For an individual, same-player on/off rates are compared with a
        240-minute prior at the individual's overall rate, then clipped.
        Output score for active teammates: STRENGTH*(sum pair_log - baseline).
        Absent teammates contribute through centering, never fake events.
        """
        tid = str(tid)
        n = len(ids)
        effects = {k: np.zeros((n,n), float) for k in STAT_KEYS}
        baseline = {k: np.zeros(n, float) for k in STAT_KEYS}
        covered = 0
        for i, pid in enumerate(ids):
            own = self.players.get((tid, str(pid)))
            if not own or own[0] <= 0:
                continue
            for j, mate in enumerate(ids):
                if i == j:
                    continue
                together = self.pairs.get((tid, str(pid), str(mate)))
                if together is None:
                    continue
                on_minutes = together[0]
                off_minutes = own[0] - on_minutes
                if on_minutes < MIN_ON_MINUTES or off_minutes < MIN_OFF_MINUTES:
                    continue
                covered += 1
                share = on_minutes / own[0]
                for k, key in enumerate(STAT_KEYS, start=1):
                    base_rate = max(own[k] / own[0], 1e-5)
                    on_rate = (together[k] + base_rate*PSEUDO_MINUTES) / (on_minutes + PSEUDO_MINUTES)
                    off_rate = (max(0.0, own[k]-together[k]) + base_rate*PSEUDO_MINUTES) / (off_minutes + PSEUDO_MINUTES)
                    e = float(np.clip(math.log(on_rate/off_rate), -LOG_EFFECT_LIMIT, LOG_EFFECT_LIMIT))*STRENGTH
                    effects[key][i,j] = e
                    baseline[key][i] += share*e
        return effects, baseline, {
            "pair_rows_with_adequate_on_off_exposure": covered,
            "accepted_pbp_games": self.accepted_games,
            "rejected_pbp_games": dict(self.rejected_games),
            "observational_not_causal": True,
        }
