"""Independent supervised NBA player opportunity head, trained ONLY on completed earlier games.

Instead of asking the hand-written possession physics to determine the skill
signal, learn the NEXT-GAME per-minute shooting/ball-handling/rebounding
rates from earlier box scores. These rates drive the SAME connected V5
possession simulation; team minutes, made baskets, assisted makes, and
rebound events remain physically consistent.

This is an independent research challenger. It never reads V3/V4 forecasts,
sportsbook lines, or a target-date box. A candidate is not a champion merely
because the code executes.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
import copy
import datetime as dt

import numpy as np

STATS = ("fga", "tpa", "fta", "ast", "oreb", "dreb", "tov", "stl", "blk")
WINDOWS = (3, 8, 20, 40)
# Same feature architecture for every stat, allowing data to learn the
# useful short/long-horizon weights instead of fixing them by intuition.
RIDGE = 75.0
MIN_TRAIN_EXAMPLES = 400


def game_day(game):
    from nba import nba_v4_backtest as v4
    return v4.day_of(game)


def _features(history, key, league_rate):
    """Rates are conditional on actual prior minutes; no pregame projected stat."""
    if not history:
        raise ValueError("Historical player boxes required")
    prior = max(float(league_rate), 1e-5)
    feats = [1.0]
    for width in WINDOWS:
        h = history[-width:]
        minutes = sum(max(0., float(row["min"])) for row in h)
        events = sum(max(0., float(row[key])) for row in h)
        # Shrink short windows more strongly. Every pseudo-minute has the
        # same league-prior event rate, without borrowing past-model output.
        strength = {3: 36., 8: 54., 20: 72., 40: 96.}[width]
        rate = (events + strength * prior) / max(1., minutes + strength)
        feats.append(float(np.clip(np.log(max(rate, 1e-6) / prior), -3., 3.)))
    m3 = np.mean([row["min"] for row in history[-3:]])
    m20 = np.mean([row["min"] for row in history[-20:]])
    feats.append(float(np.clip(m3 / max(m20, 6.) - 1., -0.8, 1.0)))
    feats.append(float(np.mean([int(bool(row["start"])) for row in history[-5:]])))
    feats.append(float(np.log1p(len(history)) / np.log1p(80)))
    return np.asarray(feats, float)


@dataclass
class OpportunityHead:
    league_rate: dict
    coefficients: dict
    training_examples: dict
    training_cutoff: dt.date

    @classmethod
    def fit_completed(cls, games, cutoff, ridge=RIDGE):
        """Fit on strictly earlier dates, with every label preceded by that player's prior games."""
        if isinstance(cutoff, str):
            cutoff = dt.date.fromisoformat(cutoff)
        before = [g for g in sorted(games, key=lambda g: (game_day(g), str(g["game_id"])))
                  if game_day(g) < cutoff]
        if not before:
            raise ValueError("NO_PRE_CUTOFF_TRAINING_GAMES")
        totals = defaultdict(float)
        total_minutes = 0.
        for g in before:
            for p in g["players"]:
                mins = float(p.get("min") or 0.)
                if mins <= 0.:
                    continue
                total_minutes += mins
                for k in STATS:
                    totals[k] += max(0., float(p[k]))
        league = {k: max(1e-5, totals[k] / max(1., total_minutes)) for k in STATS}
        histories = defaultdict(list)
        features = {k: [] for k in STATS}
        labels = {k: [] for k in STATS}
        weights = {k: [] for k in STATS}
        # Process by DAY: a label for one match must never influence the
        # features of another match that has not yet started.
        grouped = defaultdict(list)
        for g in before:
            grouped[game_day(g)].append(g)
        for day in sorted(grouped):
            for g in grouped[day]:
                for p in g["players"]:
                    pid = str(p["id"])
                    h = histories[pid]
                    minute = float(p.get("min") or 0.)
                    if len(h) < 5 or minute < 5:
                        continue
                    for key in STATS:
                        features[key].append(_features(h, key, league[key]))
                        # Direct target: next game's realized stat per minute,
                        # not a re-simulated V5 or V3 forecast.
                        labels[key].append(float(p[key]) / minute / league[key])
                        weights[key].append(float(np.clip(minute / 30., .15, 1.)))
            for g in grouped[day]:
                for p in g["players"]:
                    if float(p.get("min") or 0.) > 0.:
                        histories[str(p["id"])].append(p)
        coefs = {}
        for key in STATS:
            if len(features[key]) < MIN_TRAIN_EXAMPLES:
                continue
            X = np.vstack(features[key])
            y = np.asarray(labels[key], float)
            w = np.asarray(weights[key], float)
            # Penalize only the feature coefficients, NEVER the intercept.
            penalty = np.diag([0.0] + [float(ridge)] * (X.shape[1] - 1))
            lhs = X.T @ (w[:, None] * X) + penalty
            rhs = X.T @ (w * y)
            beta = np.linalg.solve(lhs, rhs)
            if not np.all(np.isfinite(beta)):
                raise ValueError("NONFINITE_LEARNED_OPPORTUNITY_HEAD")
            coefs[key] = beta
        if len(coefs) != len(STATS):
            raise ValueError("INSUFFICIENT_PRIOR_SUPERVISED_EXAMPLES_FOR_OPPORTUNITY_HEAD")
        return cls(league, coefs, {key: len(features[key]) for key in STATS}, cutoff)

    def predict_rate(self, history, key, original):
        """Learned expectation; bounded against uncorrupted past-only profile."""
        if key not in self.coefficients or len(history) < 5:
            return float(original)
        val = float(_features(history, key, self.league_rate[key]) @ self.coefficients[key])
        if not np.isfinite(val):
            raise ValueError("NONFINITE_PLAYER_OPPORTUNITY_FORECAST")
        rate = float(np.clip(val * self.league_rate[key], 0., 4. * self.league_rate[key]))
        old = max(float(original), 1e-6)
        return float(np.clip(rate, .50 * old, 1.50 * old))

    def apply_team(self, team, player_history, date):
        """Candidate input is copied; the production champion stays untouched."""
        candidate = copy.deepcopy(team)
        audit = {}
        for i, pid in enumerate(candidate.ids):
            earlier = [p for p in player_history[pid] if p["date"] < date]
            if len(earlier) < 5:
                continue
            prof = candidate.prof[i]
            before = dict(prof["rate"])
            for key in STATS:
                prof["rate"][key] = self.predict_rate(earlier, key, before[key])
            # A learned 3PA rate must change the *chance of a three*,
            # otherwise the old simulator would discard this information.
            prof["sh3"] = float(np.clip(
                prof["rate"]["tpa"] / max(prof["rate"]["fga"], 1e-6),
                .02, .90))
            audit[str(pid)] = {
                "baseline_fga_per_min": round(before["fga"], 5),
                "learned_fga_per_min": round(prof["rate"]["fga"], 5),
                "baseline_ast_per_min": round(before["ast"], 5),
                "learned_ast_per_min": round(prof["rate"]["ast"], 5),
            }
        return candidate, audit
