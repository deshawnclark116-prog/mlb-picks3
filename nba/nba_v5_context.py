#!/usr/bin/env python3
"""Context the NBA V5 simulation learns from earlier games only: schedule and travel, officials, late-game fouling,
and how players come back from missing games. Every effect is a measured ratio with shrinkage; none is imposed."""
from __future__ import annotations
import collections
import math

import numpy as np

# ESPN team id -> (latitude, longitude, hours behind Eastern, arena altitude in metres)
ARENA = {
    "1": (33.757, -84.396, 0, 320), "2": (42.366, -71.062, 0, 5), "3": (29.949, -90.082, -1, 2), "4": (41.881, -87.674, -1, 180),
    "5": (41.496, -81.688, 0, 200), "6": (32.790, -96.810, -1, 140), "7": (39.749, -105.008, -2, 1609), "8": (42.341, -83.055, 0, 180),
    "9": (37.768, -122.388, -3, 5), "10": (29.751, -95.362, -1, 15), "11": (39.764, -86.156, 0, 220), "12": (33.945, -118.341, -3, 90),
    "13": (34.043, -118.267, -3, 90), "14": (25.781, -80.188, 0, 2), "15": (43.045, -87.917, -1, 190), "16": (44.980, -93.276, -1, 250),
    "17": (40.683, -73.975, 0, 10), "18": (40.751, -73.994, 0, 10), "19": (28.539, -81.384, 0, 30), "20": (39.901, -75.172, 0, 5),
    "21": (33.446, -112.071, -2, 331), "22": (45.532, -122.667, -3, 15), "23": (38.580, -121.500, -3, 9), "24": (29.427, -98.437, -1, 200),
    "25": (35.463, -97.515, -1, 365), "26": (40.768, -111.901, -2, 1288), "27": (38.898, -77.021, 0, 5), "28": (43.643, -79.379, 0, 76),
    "29": (35.138, -90.051, -1, 80), "30": (35.225, -80.839, 0, 230),
}


def km(a, b):
    la1, lo1, _, _ = ARENA[a]
    la2, lo2, _, _ = ARENA[b]
    p = math.pi / 180
    x = math.sin((la2 - la1) * p / 2) ** 2 + math.cos(la1 * p) * math.cos(la2 * p) * math.sin((lo2 - lo1) * p / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))


BUCKETS = ("back_to_back", "three_in_four", "long_trip", "time_zone_shift", "altitude_visit", "rested")


def schedule_flags(prev_games, team, venue_team, d):
    """prev_games: this team's earlier games (date, venue_team). Flags for tonight's game."""
    if not prev_games:
        return {}
    last = prev_games[-1]
    rest = (d - last[0]).days
    n4 = 1 + sum(1 for g in prev_games if 0 < (d - g[0]).days <= 3)
    trip = km(last[1], venue_team) if last[1] in ARENA and venue_team in ARENA else 0.0
    tz = abs(ARENA[last[1]][2] - ARENA[venue_team][2]) if last[1] in ARENA and venue_team in ARENA else 0
    alt = (ARENA[venue_team][3] - ARENA[team][3]) if venue_team in ARENA and team in ARENA else 0
    return {"back_to_back": rest <= 1, "three_in_four": n4 >= 3, "long_trip": trip > 1800, "time_zone_shift": tz >= 2,
            "altitude_visit": alt > 1000 and venue_team != team, "rested": rest >= 3}


class ScheduleEffects:
    """Efficiency (points per possession vs the team's own recent level) and starter minutes by schedule situation."""

    def __init__(self):
        self.eff = {b: [0.0, 0] for b in BUCKETS}
        self.start = {b: [0.0, 0] for b in BUCKETS}

    def add(self, flags, eff_ratio, start_ratio):
        for b, on in flags.items():
            if on:
                self.eff[b][0] += eff_ratio - 1.0
                self.eff[b][1] += 1
                if start_ratio is not None:
                    self.start[b][0] += start_ratio - 1.0
                    self.start[b][1] += 1

    def multipliers(self, flags, shrink=250.0):
        e, s = 0.0, 0.0
        for b, on in flags.items():
            if on:
                n = self.eff[b][1]
                e += (self.eff[b][0] / max(1, n)) * (n / (n + shrink))
                n2 = self.start[b][1]
                s += (self.start[b][0] / max(1, n2)) * (n2 / (n2 + shrink))
        return 1.0 + max(-0.08, min(0.08, e)), 1.0 + max(-0.15, min(0.15, s))


class OfficialEffects:
    """How much each referee's games lean toward free throws and fouls versus the league (shrunk)."""

    def __init__(self):
        self.sum = collections.defaultdict(float)
        self.n = collections.Counter()
        self.league = [0.0, 0]

    def add(self, officials, fta_per_poss):
        for o in officials:
            self.sum[o] += fta_per_poss
            self.n[o] += 1
        self.league[0] += fta_per_poss
        self.league[1] += 1

    def crew_mult(self, officials, shrink=25.0):
        if not officials or not self.league[1]:
            return 1.0
        base = self.league[0] / self.league[1]
        m = []
        for o in officials:
            n = self.n[o]
            avg = (self.sum[o] + shrink * base) / (n + shrink)
            m.append(avg / base)
        return float(np.clip(np.mean(m), 0.9, 1.1))


class ReturnEffects:
    """Floor time in the first games back after missing three or more team games, relative to the player's normal."""

    def __init__(self):
        self.sum = [0.0, 0.0, 0.0]
        self.n = [0, 0, 0]

    def add(self, k, ratio):
        if 0 <= k < 3:
            self.sum[k] += ratio
            self.n[k] += 1

    def mult(self, k, shrink=20.0):
        if not (0 <= k < 3) or not self.n[k]:
            return 1.0
        raw = self.sum[k] / self.n[k]
        w = self.n[k] / (self.n[k] + shrink)
        return float(np.clip(1.0 + w * (raw - 1.0), 0.4, 1.1))


def games_since_return(player_dates, team_dates, d):
    """0 if tonight is his first game back after missing 3+ team games, 1 second game back, 2 third; else -1."""
    played = [x for x in player_dates if x < d]
    if not played:
        return -1
    team_before = [x for x in team_dates if x < d]
    if len(team_before) < 5:
        return -1
    last = played[-1]
    missed = sum(1 for x in team_before if x > last)
    if missed >= 3:
        return 0
    # consecutive games played since a gap of 3+
    idx = {x: i for i, x in enumerate(team_before)}
    streak, prev_i = 0, None
    for x in reversed(played[-4:]):
        i = idx.get(x)
        if i is None:
            break
        if prev_i is None or prev_i - i == 1:
            streak += 1
            prev_i = i
        else:
            break
    gap_before = None
    if streak < len(played) and streak < 3:
        earlier = played[-(streak + 1)] if len(played) > streak else None
        if earlier is not None and earlier in idx:
            first_of_streak = played[-streak]
            gap_before = idx.get(first_of_streak, 0) - idx[earlier] - 1
    return streak if gap_before is not None and gap_before >= 3 and streak < 3 else -1


def late_game_ft_table(pbp_games):
    """P(possession ends in a free-throw trip) for the LEADING team in the last four minutes, by lead size and stretch.
    Returns array [2 stretches (min 3-2 left, last 2 min)][3 lead buckets (1-3, 4-6, 7-10)], league fallback 0.12."""
    trips = np.zeros((2, 3))
    poss = np.zeros((2, 3))
    for g in pbp_games:
        score = {g["home"]: 0, g["away"]: 0}
        last_ft_key = None
        for ev in g["events"]:
            per, left, kind, team, a, b, pts = ev[:7]
            if per > 4:
                break
            stretch = 0 if 120 < left <= 240 else 1 if left <= 120 else None
            if per == 4 and stretch is not None:
                other = g["away"] if team == g["home"] else g["home"]
                lead = score.get(team, 0) - score.get(other, 0)
                lb = 0 if 1 <= lead <= 3 else 1 if 4 <= lead <= 6 else 2 if 7 <= lead <= 10 else None
                if lb is not None:
                    if kind in ("S2", "S3", "TO"):
                        poss[stretch][lb] += 1
                    elif kind == "FT" and last_ft_key != (per, left, team):
                        trips[stretch][lb] += 1
                        poss[stretch][lb] += 1
                        last_ft_key = (per, left, team)
            if kind in ("S2", "S3", "FT") and pts:
                score[team] = score.get(team, 0) + pts
    tab = np.where(poss > 30, trips / np.maximum(poss, 1), 0.12)
    return np.clip(tab, 0.02, 0.8)


# ------------------------------------------------------------------ shot locations
ZONES = ("rim", "paint", "mid", "corner3", "above3")


def zone_of(x, y, points_attempted):
    """Court spot from ESPN's coordinates (the basket is near x=25, y=0; one unit is about one foot)."""
    if x is None or y is None:
        return None
    if points_attempted == 3:
        return 3 if (x <= 3.5 or x >= 46.5) and y <= 14 else 4
    d = math.hypot(x - 25.0, y)
    return 0 if d <= 4.5 else 1 if d <= 10.0 else 2


def game_zone_tallies(pb):
    """Per shooter and per defending team: attempts, makes and assisted makes by spot, from one game's plays."""
    shooter = collections.defaultdict(lambda: np.zeros((3, 5)))
    against = collections.defaultdict(lambda: np.zeros((2, 5)))
    for ev in pb["events"]:
        per, left, kind, team, a, b, pts, x, y = ev[:9]
        if kind not in ("S2", "S3") or not a:
            continue
        z = zone_of(x, y, 3 if kind == "S3" else 2)
        if z is None:
            continue
        made = 1 if pts > 0 else 0
        shooter[a][0][z] += 1
        shooter[a][1][z] += made
        shooter[a][2][z] += 1 if (made and b) else 0
        defender = pb["away"] if team == pb["home"] else pb["home"]
        against[defender][0][z] += 1
        against[defender][1][z] += made
    return shooter, against


# ------------------------------------------------------------------ rebounds and blocks as they really happen
def league_events(pbp_games):
    """From play-by-play: how often a miss is rebounded by the offence, how often a rebound is credited to a player
    (the rest are team rebounds), team offensive rebounds per team per game (box scores leave them out, which makes
    box-score pace read too high), and blocks per missed two and three."""
    c = collections.Counter()
    n = 0
    for g in pbp_games:
        n += 1
        ev = g["events"]
        for i, e in enumerate(ev):
            k = e[2]
            if k in ("OR", "DR"):
                c[k + ("_p" if e[4] else "_t")] += 1
            elif k == "S2" and e[6] == 0:
                c["miss2"] += 1
            elif k == "S3" and e[6] == 0:
                c["miss3"] += 1
            elif k == "FT" and e[6] == 0:
                c["ft_miss"] += 1
            elif k == "BLK" and i + 1 < len(ev):
                c["blk" + ev[i + 1][2][-1]] += 1
    allreb = c["OR_p"] + c["OR_t"] + c["DR_p"] + c["DR_t"]
    if not allreb or not n:
        return {"reb_or": 0.34, "credit_or": 0.64, "credit_dr": 0.93, "team_or_pg": 6.5, "blk2": 0.15, "blk3": 0.03}
    reb_or = (c["OR_p"] + c["OR_t"]) / allreb
    chances = c["miss2"] + c["miss3"] + 0.5 * c["ft_miss"]            # live rebound chances (about half of missed FTs are last FTs)
    or_cred, dr_cred = c["OR_p"] / max(1.0, chances), c["DR_p"] / max(1.0, chances)
    return {"reb_or": reb_or, "credit_or": min(1.0, or_cred / reb_or), "credit_dr": min(1.0, dr_cred / (1.0 - reb_or)),
            "team_or_pg": c["OR_t"] / (2.0 * n),
            "blk2": c["blk2"] / max(1, c["miss2"]), "blk3": c["blk3"] / max(1, c["miss3"])}
