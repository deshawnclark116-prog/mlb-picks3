#!/usr/bin/env python3
"""What play-by-play lets us learn that box scores cannot (NBA V5).

All of it comes from earlier games only and is shrunk toward the league when a team or player has little evidence.

  * coach-by-coach rotation: each team's own floor-time response to a blowout and to foul trouble (see RotationTables in
    nba_v5_sim.py, now kept per team) and how long its starters and bench stay in (stint length);
  * timeouts: how often a team calls one after conceding a run, by quarter, and what happens to starters' floor time in the stretch
    right after one;
  * who is on the floor when the opponent shoots: each defender's on-court effect on how often and how well opponents shoot from the
    rim, paint, midrange, corners and above the break (rim protection, paint congestion, and the effect of a missing defender),
    measured against his own team's average;
  * shot timing and transition: how often a shot comes early (0-8 s into the possession), normally, or late (18 s+), depending on
    whether the possession started off a steal or defensive rebound or off a made basket, and how accurate each kind is.

What it cannot learn: who guards whom, touches, passes, drives or contested rebounds. Those exist only in the NBA's licensed tracking
feeds, which this system does not have.
"""
from __future__ import annotations
import collections

import numpy as np

from nba import nba_v5_context as ctxm

SEG = 24
SEG_SEC = 120.0


def elapsed_s(per, left):
    return (min(per, 4) - 1) * 720.0 + (720.0 - left) if per <= 4 else 2880.0 + (per - 5) * 300.0 + (300.0 - left)


def timing_class(sec):
    return 0 if sec <= 8.0 else 1 if sec <= 18.0 else 2


def game_learning(game):
    """One pass over a game's events; returns small tallies for LearnState.add."""
    on = {t: list(ids) for t, ids in game["starters"].items()}
    teams = list(on)
    if len(teams) != 2:
        return None
    other = {teams[0]: teams[1], teams[1]: teams[0]}
    score = {game["home"]: 0, game["away"]: 0}
    start_t = {t: 0.0 for t in teams}                 # when each team's current possession began
    start_live = {t: False for t in teams}            # ... and whether it began off a steal or defensive rebound
    stint_start = {p: 0.0 for ids in on.values() for p in ids}
    stints = collections.defaultdict(list)
    def_zone = collections.defaultdict(lambda: np.zeros((2, 5)))
    team_zone = collections.defaultdict(lambda: np.zeros((2, 5)))
    timing = np.zeros((2, 2, 3))                      # [live start?][attempts, makes][timing class]
    scores_log = []                                   # (t, team, pts)
    timeouts = []                                     # (segment, team, run conceded before it)
    margin_seg = {}
    to_seg = collections.defaultdict(int)             # (team, segment) -> timeouts
    for ev in game["events"]:
        per, left, kind, team, a, b, pts = ev[:7]
        if per > 4:
            break
        t = elapsed_s(per, left)
        seg = min(SEG - 1, int(t // SEG_SEC))
        if seg not in margin_seg:
            margin_seg[seg] = dict(score)
        if kind == "SUB" and team in on and a and b:
            if b in on[team]:
                stints[b].append((t - stint_start.get(b, 0.0)) / 60.0)
                on[team][on[team].index(b)] = a
                stint_start[a] = t
        elif kind in ("S2", "S3") and team in other:
            made = 1 if pts > 0 else 0
            z = ctxm.zone_of(ev[7] if len(ev) > 7 else None, ev[8] if len(ev) > 8 else None, 3 if kind == "S3" else 2)
            if z is not None:
                for d in on[other[team]]:
                    def_zone[d][0][z] += 1
                    def_zone[d][1][z] += made
                team_zone[other[team]][0][z] += 1
                team_zone[other[team]][1][z] += made
            tc = timing_class(t - start_t[team])
            timing[1 if start_live[team] else 0][0][tc] += 1
            timing[1 if start_live[team] else 0][1][tc] += made
            if made:
                score[team] += pts
                scores_log.append((t, team, pts))
                start_t[other[team]], start_live[other[team]] = t, False
        elif kind == "FT" and pts and team in other:
            score[team] += pts
            scores_log.append((t, team, pts))
        elif kind == "DR" and team in other:
            start_t[team], start_live[team] = t, True
        elif kind == "TO" and team in other:
            start_t[other[team]], start_live[other[team]] = t, bool(b)       # a steal makes the next possession live
        elif kind == "TMO" and team in other:
            run = 0
            for (ts, tm, p_) in reversed(scores_log):
                if t - ts > 150 or tm == team:
                    break
                run += p_
            timeouts.append((seg, team, run))
            to_seg[(team, seg)] += 1
    for ids in on.values():
        for p in ids:
            stints[p].append((2880.0 - stint_start.get(p, 0.0)) / 60.0)
    margin_final = dict(score)
    return {"stints": stints, "def_zone": def_zone, "team_zone": team_zone, "timing": timing, "timeouts": timeouts,
            "to_seg": to_seg, "margin_seg": margin_seg, "margin_final": margin_final, "teams": teams}


class LearnState:
    def __init__(self):
        self.def_player = collections.defaultdict(lambda: np.zeros((2, 5)))
        self.def_team = collections.defaultdict(lambda: np.zeros((2, 5)))
        self.timing = np.zeros((2, 2, 3))
        self.stint = collections.defaultdict(lambda: [0.0, 0])
        self.stint_bench = collections.defaultdict(lambda: [0.0, 0])
        self.stint_league = [0.0, 0, 0.0, 0]
        self.to_rate = np.zeros((4, 3, 2))               # quarter x conceded-change bucket x [teams with a timeout, team-segments]
        self.post_to = np.zeros((2, 2))                  # [after a timeout, not] x [starter presence sum, n]
        self.games = 0

    def add(self, game, learn, pres, team_of):
        if learn is None:
            return
        for p, z in learn["def_zone"].items():
            self.def_player[p] += z
        for t, z in learn["team_zone"].items():
            self.def_team[t] += z
        self.timing += learn["timing"]
        starters = {p for ids in game["starters"].values() for p in ids}
        for p, st in learn["stints"].items():
            t = team_of.get(p)
            if t is None:
                continue
            for m in st:
                if p in starters:
                    self.stint[t][0] += m
                    self.stint[t][1] += 1
                    self.stint_league[0] += m
                    self.stint_league[1] += 1
                else:
                    self.stint_bench[t][0] += m
                    self.stint_bench[t][1] += 1
                    self.stint_league[2] += m
                    self.stint_league[3] += 1
        ms = learn["margin_seg"]
        for t in learn["teams"]:
            o = [x for x in learn["teams"] if x != t][0]
            for seg in range(1, SEG - 1):
                if seg not in ms or seg + 1 not in ms or seg - 1 not in ms:
                    continue
                # change in this team's margin over the stretch that just finished (segment seg-1 -> seg), before segment seg
                delta = (ms[seg][t] - ms[seg][o]) - (ms[seg - 1][t] - ms[seg - 1][o])
                b = 0 if delta <= -6 else 1 if delta < 0 else 2
                had = 1 if learn["to_seg"].get((t, seg), 0) else 0
                self.to_rate[min(3, seg // 6)][b][0] += had
                self.to_rate[min(3, seg // 6)][b][1] += 1
                # starters' floor time in the stretch after one (segment seg+1) versus when none was called in seg
                sp = [p for p in game["starters"][t] if p in pres]
                if sp:
                    share = float(np.mean([pres[p][seg + 1] / SEG_SEC for p in sp]))
                    self.post_to[0 if had else 1][0] += share
                    self.post_to[0 if had else 1][1] += 1
        self.games += 1

    # ---- tables used by the simulation
    def defender_effects(self, pid, team, shrink=250.0):
        """Opponent shot frequency and accuracy ratios by spot while this defender is on the floor, versus his own team's average."""
        z = self.def_player.get(pid)
        tz = self.def_team.get(team)
        if z is None or tz is None or z[0].sum() < 60 or tz[0].sum() < 400:
            return np.ones(5), np.ones(5)
        att, made = z
        tatt, tmade = tz
        f = (att / att.sum()) / np.maximum(tatt / tatt.sum(), 1e-6)
        pct = (made / np.maximum(att, 1)) / np.maximum(tmade / np.maximum(tatt, 1), 1e-6)
        w = att / (att + shrink / 5.0)
        return 1.0 + w * (f - 1.0), 1.0 + w * (pct - 1.0)

    def timing_tables(self):
        """P(early/normal/late | possession started live or dead) and accuracy ratio by (start, class) vs the overall rate."""
        att, made = self.timing[:, 0, :], self.timing[:, 1, :]
        if att.sum() < 3000:
            return np.array([[0.10, 0.65, 0.25], [0.35, 0.50, 0.15]]), np.ones((2, 3))
        share = att / np.maximum(att.sum(axis=1, keepdims=True), 1)
        pct = made / np.maximum(att, 1)
        overall = made.sum() / att.sum()
        return share, pct / overall

    def live_share(self):
        """Share of possessions starting off a steal or defensive rebound (from shot attempts, a close proxy)."""
        att = self.timing[:, 0, :].sum(axis=1)
        return float(att[1] / max(att.sum(), 1))

    def timeout_tables(self):
        rate = self.to_rate[:, :, 0] / np.maximum(self.to_rate[:, :, 1], 1)
        pt = self.post_to
        m = (pt[0][0] / max(pt[0][1], 1)) / max(pt[1][0] / max(pt[1][1], 1), 1e-6) if pt[0][1] > 50 and pt[1][1] > 50 else 1.0
        return np.clip(rate, 0.0, 0.9), float(np.clip(m, 0.7, 1.4))

    def stint_minutes(self, team, shrink=30.0):
        if not self.stint_league[1] or not self.stint_league[3]:
            return 7.0, 4.5
        lg_s, lg_b = self.stint_league[0] / self.stint_league[1], self.stint_league[2] / self.stint_league[3]
        s, b = self.stint[team], self.stint_bench[team]
        return ((s[0] + shrink * lg_s) / (s[1] + shrink), (b[0] + shrink * lg_b) / (b[1] + shrink))
