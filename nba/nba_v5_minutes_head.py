"""Past-only supervised next-game NBA MINUTES challenger (never auto-promoted).

The incumbent's opportunity rate model and correlated possession physics are untouched.
This head predicts minutes CONDITIONAL ON APPEARING, then changes relative rotation
weights in a copied TeamInput. It cannot supply or infer tonight's active roster.

The entire training set ends before the first test date; all features for each
training target precede its date. Target scores are not part of the features.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
import copy
import datetime as dt

import numpy as np

from nba import nba_v4_backtest as v4

MIN_HISTORY = 5
MIN_TRAIN_EXAMPLES = 400
RIDGE = 100.0


def _date(value):
    if isinstance(value, dt.date):
        return value
    return dt.date.fromisoformat(str(value)[:10])


def minute_features(history, forecast_day):
    """Return V5's exact EWMA minutes anchor and past-only role/change features."""
    day = _date(forecast_day)
    if len(history) < MIN_HISTORY:
        raise ValueError("NBA_MINUTES_HEAD_NEEDS_FIVE_PRIOR_GAMES")
    if any("date" in r and _date(r["date"]) >= day for r in history):
        raise ValueError("NBA_MINUTES_HEAD_FUTURE_OR_SAME_DAY_HISTORY")
    minutes = np.asarray([float(r["min"]) for r in history], dtype=float)
    if np.any(~np.isfinite(minutes)) or np.any(minutes < 0):
        raise ValueError("NBA_MINUTES_HEAD_INVALID_PAST_MINUTES")
    baseline = float(v4.ewma(minutes.tolist()))
    starts = np.asarray([float(bool(r.get("start"))) for r in history], dtype=float)
    mean = lambda n: float(minutes[-n:].mean())
    start_mean = lambda n: float(starts[-n:].mean())
    gap = 2
    if "date" in history[-1]:
        gap = max(1, (day - _date(history[-1]["date"])).days)
    # Predict RESIDUAL to the same V5 baseline. The long and short horizon
    # differences detect roles evolving without double-counting a player's level.
    x = np.array([
        1.0,
        np.clip((mean(3) - baseline) / 10.0, -2.0, 2.0),
        np.clip((mean(8) - baseline) / 10.0, -2.0, 2.0),
        np.clip((mean(20) - baseline) / 10.0, -2.0, 2.0),
        np.clip((minutes[-1] - baseline) / 10.0, -2.0, 2.0),
        start_mean(3) - start_mean(20),
        start_mean(8) - start_mean(20),
        np.clip(float(minutes[-10:].std()) / 10.0, 0.0, 2.0),
        np.clip((gap - 2.0) / 10.0, -0.1, 2.0),
        np.clip(np.log1p(len(history)) / np.log1p(80.0), 0.0, 1.5),
    ], dtype=float)
    return baseline, x


@dataclass
class MinutesHead:
    coefficients: np.ndarray
    training_cutoff: dt.date
    training_examples: int
    training_games: int

    @classmethod
    def fit_completed(cls, games, cutoff, ridge=RIDGE):
        cutoff = _date(cutoff)
        previous = [g for g in games if v4.day_of(g) < cutoff]
        previous.sort(key=lambda g: (v4.day_of(g), str(g["game_id"])))
        if not previous:
            raise ValueError("NBA_MINUTES_HEAD_NO_PRE_CUTOFF_GAMES")
        by_day = defaultdict(list)
        for g in previous:
            by_day[v4.day_of(g)].append(g)
        history = defaultdict(list)
        rows, outcomes = [], []
        for day in sorted(by_day):
            # Freeze input histories across every game on this date.
            for g in by_day[day]:
                for p in g["players"]:
                    prior = history[str(p["id"])]
                    if len(prior) < MIN_HISTORY or float(p.get("min") or 0) <= 0:
                        continue
                    baseline, features = minute_features(prior, day)
                    rows.append(features)
                    outcomes.append(float(np.clip(float(p["min"]) - baseline, -24.0, 24.0)))
            for g in by_day[day]:
                for p in g["players"]:
                    if float(p.get("min") or 0) > 0:
                        line = dict(p)
                        line["date"] = day
                        history[str(p["id"])].append(line)
        if len(rows) < MIN_TRAIN_EXAMPLES:
            raise ValueError("NBA_MINUTES_HEAD_INSUFFICIENT_PRIOR_EXAMPLES")
        X = np.stack(rows)
        y = np.asarray(outcomes, dtype=float)
        penalty = np.diag([0.0] + [float(ridge)] * (X.shape[1] - 1))
        coef = np.linalg.solve(X.T @ X + penalty, X.T @ y)
        if not np.all(np.isfinite(coef)):
            raise ValueError("NBA_MINUTES_HEAD_NONFINITE_COEFFICIENTS")
        return cls(coef, cutoff, len(rows), len(previous))

    def predict_minutes(self, history, forecast_day):
        baseline, features = minute_features(history, forecast_day)
        correction = float(np.clip(features @ self.coefficients, -6.0, 6.0))
        # One frozen, bounded hypothesis. No optimization on the holdout.
        projected = float(np.clip(baseline + correction, 2.0, 40.0))
        return float(np.clip(projected, max(2.0, 0.75 * baseline),
                             min(40.0, max(2.0, 1.25 * baseline))))

    def apply_team(self, team, player_history, forecast_day):
        """Copy rotations, never mutate the champion's roster or official minutes cap."""
        date = _date(forecast_day)
        candidate = copy.deepcopy(team)
        audit = {}
        for i, pid in enumerate(candidate.ids):
            prior = [r for r in player_history.get(pid, [])
                     if "date" in r and _date(r["date"]) < date]
            if len(prior) < MIN_HISTORY:
                continue
            old_ewma, _ = minute_features(prior, date)
            expected = self.predict_minutes(prior, date)
            raw = float(candidate.presence[i].sum() * 2.0)
            if raw <= 0 or old_ewma <= 0:
                continue
            # Change RELATIVE role allocation; the simulator still enforces
            # exactly five players on court, foul trouble and team minutes.
            ratio = float(np.clip(expected / old_ewma, 0.75, 1.25))
            candidate.presence[i] = np.clip(candidate.presence[i] * ratio, 0.0, 1.0)
            audit[str(pid)] = {
                "preexisting_expected_minutes": round(raw, 4),
                "supervised_head_expected_minutes": round(expected, 4),
                "rotation_multiplier": round(ratio, 5),
                "past_games": len(prior),
            }
        return candidate, audit
