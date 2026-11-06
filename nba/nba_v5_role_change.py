"""NBA V5: pregame-only role/opportunity change evidence.

This is a SHADOW diagnostic. It does not multiply projections, reweight simulation
rates, or assert that the detected changes are real skill gains. Promotion requires
chronological out-of-sample evidence (see nba_v5_change_audit.py).

Input: the player's *historical* box-score rows, and a forecast date. No current
game box score, closing line, sportsbook, or future injury outcome is consulted.
Windows are disjoint: the most recent 8 appearances vs the preceding 20.
"""
from __future__ import annotations

import datetime as dt
import math
from typing import Any

RECENT_GAMES = 8
BASELINE_GAMES = 20
MIN_RECENT = 6
MIN_BASELINE = 8
METRICS = {
    "fga_per36": ("fga", 2.0),
    "three_attempts_per36": ("tpa", 1.2),
    "assists_per36": ("ast", 1.0),
    "rebounds_per36": ("reb", 1.5),
    "turnovers_per36": ("tov", 0.75),
}


def _date(value: Any) -> dt.date:
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, dt.date):
        return value
    return dt.date.fromisoformat(str(value)[:10])


def _phi(z: float) -> float:
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def _evidence(prior: float, recent: float, estimated: float, sd: float,
              material: float, *, min_fraction: float = 0.15) -> dict:
    change = estimated - prior
    prob = _phi(abs(change) / max(sd, 1e-8))
    material_enough = abs(change) >= max(material, abs(prior) * min_fraction)
    candidate = material_enough and prob >= 0.95
    return {
        "baseline": round(prior, 3),
        "recent_raw": round(recent, 3),
        "recent_shrunk": round(estimated, 3),
        "change_shrunk": round(change, 3),
        "posterior_sd_approx": round(sd, 3),
        "p_direction_approx": round(prob, 4),
        "direction": "UP" if change > 0 else "DOWN" if change < 0 else "FLAT",
        "material_change": material_enough,
        "candidate": candidate,
    }


def detect_role_change(history: list[dict], as_of: dt.date | str) -> dict:
    """Detect disjoint-window opportunity changes using only dates < as_of.

    Normal/Poisson intervals are *approximations*, not calibrated posteriors.
    Every per-36 rate is exposure adjusted and anchored to the older window.
    Strong-looking signals are diagnostics until validated on unseen dates.
    """
    day = _date(as_of)
    eligible = [h for h in history if h.get("date") is not None
                and _date(h["date"]) < day and float(h.get("min") or 0) >= 5.0]
    eligible.sort(key=lambda h: _date(h["date"]))
    recent = eligible[-RECENT_GAMES:]
    baseline = eligible[-(RECENT_GAMES + BASELINE_GAMES):-RECENT_GAMES]
    result = {
        "version": "nba-v5-role-change-shadow-v1",
        "as_of_date": day.isoformat(),
        "baseline_games": len(baseline),
        "recent_games": len(recent),
        "shadow_only": True,
        "calibrated": False,
        "status": "INSUFFICIENT_HISTORY",
        "signals": {},
    }
    if len(recent) < MIN_RECENT or len(baseline) < MIN_BASELINE:
        return result

    def mean(rows: list[dict], key: str) -> float:
        return sum(float(r.get(key) or 0) for r in rows) / len(rows)

    base_m = mean(baseline, "min")
    rec_m = mean(recent, "min")
    def sample_var(rows: list[dict]) -> float:
        mu = mean(rows, "min")
        return sum((float(r["min"]) - mu) ** 2 for r in rows) / max(1, len(rows) - 1)

    # Gaussian shrinkage of the difference toward zero (6-minute prior SD).
    noise = (sample_var(recent) + 16.0) / len(recent) + (sample_var(baseline) + 16.0) / len(baseline)
    prior_var = 36.0
    weight = prior_var / (prior_var + noise)
    m_delta = weight * (rec_m - base_m)
    m_sd = math.sqrt(prior_var * noise / (prior_var + noise))
    result["signals"]["minutes"] = _evidence(base_m, rec_m, base_m + m_delta,
                                               m_sd, 4.0)

    base_exposure = sum(float(r["min"]) for r in baseline)
    rec_exposure = sum(float(r["min"]) for r in recent)
    pseudo_minutes = 80.0
    for name, (key, min_abs) in METRICS.items():
        b_count = sum(max(0.0, float(r.get(key) or 0)) for r in baseline)
        r_count = sum(max(0.0, float(r.get(key) or 0)) for r in recent)
        base = 36.0 * b_count / base_exposure
        raw = 36.0 * r_count / rec_exposure
        prior_count = pseudo_minutes * (base / 36.0)
        shrunk = 36.0 * (r_count + prior_count) / (rec_exposure + pseudo_minutes)
        sd_base = 36.0 * math.sqrt(b_count + 1.0) / base_exposure
        sd_recent = 36.0 * math.sqrt(r_count + prior_count + 1.0) / (rec_exposure + pseudo_minutes)
        sd = math.hypot(sd_base, sd_recent)
        result["signals"][name] = _evidence(base, raw, shrunk, sd, min_abs)

    flags = [name for name, s in result["signals"].items() if s["candidate"]]
    result["status"] = "ROLE_CHANGE_CANDIDATE" if flags else "NO_STRONG_CHANGE"
    result["candidate_metrics"] = flags
    result["interpretation"] = ("Pregame observational change in minutes or box-score opportunity; "
                                "not a causal skill claim and not yet a validated predictive input.")
    return result
