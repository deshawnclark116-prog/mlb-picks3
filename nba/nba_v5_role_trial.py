"""Strictly pregame NBA V5 role-change trial; NEVER automatically promoted.

The existing V5 recency-weighted rates remain the champion. A fixed, bounded
candidate moves only detector-flagged minutes/opportunity components 35% toward
the detector's older-prior-shrunk estimate. Both variants run with identical
seeds, players, schedule and opponents in the paired research backtest.

No sportsbook data, after-tip observations or retrospective model-selection
adjustment is used. The historical test is conditional on the retrospective
roster shared by the old V5 backtest, NOT a prospective availability test.
"""
from __future__ import annotations

from dataclasses import replace
import datetime as dt
import copy
import numpy as np

from nba.nba_v5_role_change import detect_role_change

STRENGTH = 0.35   # one preregistered shadow candidate: NOT tuned on holdout
RATE_TO_SIGNAL = {
    "fga": "fga_per36",
    "ast": "assists_per36",
}
CAP_LOWER = 0.80
CAP_UPPER = 1.20


def _toward(current: float, target: float) -> float:
    if current <= 0.0:
        return current
    raw = current + STRENGTH * (target - current)
    return float(np.clip(raw, current * CAP_LOWER, current * CAP_UPPER))


def adapt_team(team, histories: dict, forecast_date: dt.date):
    """Return a copied TeamInput and diagnostic record, leaving champion intact."""
    out = replace(team,
                  prof=copy.deepcopy(team.prof),
                  presence=np.array(team.presence, copy=True),
                  zf=None if team.zf is None else np.array(team.zf, copy=True))
    flags = []
    for j, pid in enumerate(out.ids):
        report = detect_role_change(histories.get(pid, []), forecast_date)
        if report["status"] != "ROLE_CHANGE_CANDIDATE":
            continue
        sig = report["signals"]
        modified = []
        if sig["minutes"]["candidate"]:
            current = float(out.presence[j].sum() * 2.0)
            desired = _toward(current, float(sig["minutes"]["recent_shrunk"]))
            if current > 0:
                out.presence[j] = np.clip(out.presence[j] * desired / current, 0, 1)
                modified.append("minutes")

        for field, name in RATE_TO_SIGNAL.items():
            if sig[name]["candidate"]:
                prior = float(out.prof[j]["rate"][field])
                out.prof[j]["rate"][field] = _toward(prior, float(sig[name]["recent_shrunk"]) / 36)
                modified.append(name)

        if sig["three_attempts_per36"]["candidate"]:
            current = float(out.prof[j]["rate"]["tpa"])
            desired = _toward(current, float(sig["three_attempts_per36"]["recent_shrunk"]) / 36)
            fga = float(out.prof[j]["rate"]["fga"])
            out.prof[j]["rate"]["tpa"] = min(desired, fga)
            # V5's zone model samples locations from zf, not sh3. Shift the
            # relative 3PA share while retaining learned rim/paint/mid mix.
            old_share = float(np.clip(team.prof[j]["rate"]["tpa"] / max(team.prof[j]["rate"]["fga"], 1e-8), .01, .99))
            new_share = float(np.clip(out.prof[j]["rate"]["tpa"] / max(fga, 1e-8), .01, .99))
            if out.zf is not None:
                z = np.array(out.zf[j], copy=True)
                z[:3] *= (1-new_share)/max(1-old_share, 1e-6)
                z[3:] *= new_share/max(old_share, 1e-6)
                out.zf[j] = z / z.sum()
            else:
                out.prof[j]["sh3"] = new_share
            modified.append("three_attempts_per36")

        # Rate constraints reflect shot nesting and prevent negative/invalid
        # simulated weights.
        rate = out.prof[j]["rate"]
        rate["tpa"] = float(np.clip(rate["tpa"], 0.0, rate["fga"]))
        if modified:
            flags.append({"player_id": str(pid), "modified": modified,
                          "past_only": True, "detector_version": report["version"]})
    return out, flags
