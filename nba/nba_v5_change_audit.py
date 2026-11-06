"""Chronological shadow audit for NBA V5 opportunity-change hypotheses.

For every eligible player-game, detect from strictly earlier games and compare
the *next observed game* with the old-window baseline and the shrunken new
estimate. This never trains on the evaluation game's outcome. Results are
descriptive one-game-ahead MAE, not proof of calibrated change probabilities.
Usage:
 python -m nba.nba_v5_change_audit --games nba/data/nba_v4_games_2025_26.jsonl.gz \
   --games nba/data/nba_v4_games_2026_27.jsonl --from-date 2026-10-20
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
from pathlib import Path

from nba import nba_v4_backtest as v4
from nba.nba_v5_role_change import detect_role_change

KEYS = {
    "minutes": "min",
    "fga_per36": "fga",
    "three_attempts_per36": "tpa",
    "assists_per36": "ast",
    "rebounds_per36": "reb",
    "turnovers_per36": "tov",
}


def _actual(p: dict, metric: str) -> float | None:
    minutes = float(p.get("min") or 0)
    if metric == "minutes":
        return minutes
    if minutes < 5:
        return None
    return 36 * float(p.get(KEYS[metric]) or 0) / minutes


def audit(games: list[dict], from_date: dt.date) -> dict:
    history = collections.defaultdict(list)
    outcomes = collections.defaultdict(list)
    days = collections.defaultdict(list)
    for g in sorted(games, key=lambda x: (v4.day_of(x), x["game_id"])):
        days[v4.day_of(g)].append(g)
    for day in sorted(days):
        # Predict each game in the date batch BEFORE adding any of that day's results.
        for g in days[day]:
            if day < from_date:
                continue
            for p in g["players"]:
                pid = p["id"]
                signal = detect_role_change(history[pid], day)
                if signal["status"] == "INSUFFICIENT_HISTORY":
                    continue
                for metric, vals in signal["signals"].items():
                    actual = _actual(p, metric)
                    if actual is None:
                        continue
                    old_error = abs(actual - vals["baseline"])
                    new_error = abs(actual - vals["recent_shrunk"])
                    group = "candidate" if vals["candidate"] else "other"
                    outcomes[(metric, group)].append((old_error, new_error))
        for g in days[day]:
            for p in g["players"]:
                if float(p.get("min") or 0) < 5:
                    continue
                line = dict(p)
                line["date"] = day
                history[p["id"]].append(line)

    summaries = {}
    for (metric, group), v in sorted(outcomes.items()):
        old = sum(a for a, _ in v) / len(v)
        new = sum(b for _, b in v) / len(v)
        summaries[metric + "|" + group] = {
            "n_next_games": len(v),
            "baseline_mae": round(old, 4),
            "candidate_estimate_mae": round(new, 4),
            "mae_improvement": round(old - new, 4),
            "candidate_estimate_better_fraction": round(sum(b < a for a, b in v) / len(v), 4),
        }
    return {
        "version": "nba-v5-role-change-chronological-shadow-audit-v1",
        "first_test_date": str(from_date),
        "information_rule": "Only finished player-games strictly before each test date",
        "promotion_allowed": False,
        "interpretation": "One-game-ahead observational MAE; independent forward validation needed before enabling model adjustments",
        "results": summaries,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", required=True, action="append")
    ap.add_argument("--from-date", default="2026-10-20")
    ap.add_argument("--out", default="")
    a = ap.parse_args()
    report = audit(v4.load(a.games), dt.date.fromisoformat(a.from_date))
    data = json.dumps(report, indent=2)
    if a.out:
        Path(a.out).write_text(data + "\n")
    print(data)


if __name__ == "__main__":
    main()
