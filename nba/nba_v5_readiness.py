"""Independent NBA V5 forecast readiness and simulation-data contract.

The report is fail-closed for stale or inconsistent V5 forecasts. It does
not assert that a source/provider is connected, that calibrated probabilities
have been validated, or that GitHub Actions successfully published the file.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import math
from pathlib import Path

from nba.nba_v5_rank import MARKET_ORDER, whole


def utc(v):
    if not isinstance(v, str):
        raise ValueError("missing UTC timestamp")
    x = dt.datetime.fromisoformat(v.replace("Z", "+00:00"))
    if x.tzinfo is None:
        raise ValueError("timestamp without zone")
    return x.astimezone(dt.timezone.utc)


def check(doc, now, *, max_age_minutes=180):
    """Return a complete, readable per-game integrity result; no market odds."""
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    now = now.astimezone(dt.timezone.utc)
    issues = []
    game_results = []
    try:
        emitted = utc(doc.get("generated_at_utc"))
    except (ValueError, TypeError):
        emitted = None
        issues.append("INVALID_FORECAST_TIMESTAMP")
    if emitted:
        age_min = (now - emitted).total_seconds() / 60
        if age_min < -1:
            issues.append("FORECAST_FROM_FUTURE")
        if age_min > max_age_minutes:
            issues.append("STALE_FORECAST")
    games = doc.get("games")
    if not isinstance(games, list) or not games:
        issues.append("NO_GAMES")
        games = []
    game_seen = set()
    for g in games:
        gid = str(g.get("game_id") or "")
        gi = []
        if not gid or gid in game_seen:
            gi.append("MISSING_OR_DUPLICATE_GAME_ID")
        game_seen.add(gid)
        try:
            tip = utc(g.get("tipoff_utc"))
        except (ValueError, TypeError):
            tip = None
            gi.append("INVALID_TIPOFF")
        if tip and tip <= now:
            gi.append("GAME_ALREADY_STARTED")
        try:
            at = utc(g.get("forecast_at_utc"))
            if at > now + dt.timedelta(minutes=1):
                gi.append("GAME_FORECAST_FUTURE")
            if tip and at >= tip - dt.timedelta(minutes=15):
                gi.append("GAME_FORECAST_AFTER_ARCHIVAL_CUTOFF")
        except (ValueError, TypeError):
            gi.append("INVALID_GAME_FORECAST_TIMESTAMP")
        if not str(g.get("model_version") or "").startswith("nba-v5-"):
            gi.append("NOT_V5_GAME")
        rows = g.get("rows")
        if not isinstance(rows, list) or not rows:
            gi.append("NO_PLAYER_STAT_ROWS")
            rows = []
        active_pairs = set()
        player_keys = set()
        n_active = 0
        for r in rows:
            pid, market = str(r.get("player_id") or ""), r.get("market")
            if market not in MARKET_ORDER:
                continue
            key = (pid, market)
            if key in player_keys:
                gi.append("DUPLICATED_PLAYER_STAT")
            player_keys.add(key)
            if not pid:
                gi.append("MISSING_PLAYER_ID")
            if r.get("mean_basis") != "CONDITIONAL_ON_PLAYING":
                continue
            n_active += 1
            active_pairs.add(pid)
            try:
                p, mean = float(r["p_active"]), float(r["mean"])
            except (ValueError, KeyError, TypeError):
                gi.append("INVALID_PROJECTION_OR_PARTICIPATION")
                continue
            if not math.isfinite(p) or not 0 <= p <= 1 or not math.isfinite(mean) or mean < 0:
                gi.append("INVALID_PROJECTION_OR_PARTICIPATION")
            if str(r.get("reported_status", "")).upper() == "OUT" and p > 0:
                gi.append("OUT_PLAYER_HAS_ACTIVE_FORECAST")
            lat = (r.get("cdf_lattice") or {}).get("cdf")
            if not isinstance(lat, list) or not lat:
                gi.append("MISSING_FORECAST_DISTRIBUTION")
                continue
            try:
                values = [float(x) for x in lat]
                valid = all(math.isfinite(x) and 0 <= x <= 1 for x in values)
                valid &= all(b + 1e-7 >= a for a, b in zip(values, values[1:]))
            except (ValueError, TypeError):
                valid = False
            if not valid:
                gi.append("INVALID_FORECAST_DISTRIBUTION")
                continue
            reach = r.get("reach_probabilities") or {}
            if reach and mean >= .6 and 0 <= p <= 1:
                k = whole(mean)
                q = 0.0 if k - 1 >= len(values) else 1.0 - values[k - 1]
                if (reach.get("whole_projection") != k or
                    not isinstance(reach.get("probability_including_dnp"), (int, float)) or
                    not math.isclose(reach["probability_including_dnp"], p*q, abs_tol=0.0015)):
                    gi.append("REACH_PROBABILITY_INCONSISTENT")
        # Don't quietly call a 1-player sample or missing model output a ready slate.
        if n_active < 14 or len(active_pairs) < 2:
            gi.append("INSUFFICIENT_V5_SIMULATION_ROWS")
        game_results.append({"game_id":gid,
                             "forecast_at_utc":g.get("forecast_at_utc"),
                             "tipoff_utc":g.get("tipoff_utc"),
                             "player_stat_rows":n_active,"players_with_v5_rows":len(active_pairs),
                             "ready":not gi,"errors":sorted(set(gi))})
    if any(not g["ready"] for g in game_results):
        issues.append("AT_LEAST_ONE_GAME_NOT_READY")
    source_audit = doc.get("certified_pregame_source_audit") or {}
    return {"schema":"NBA_V5_FORECAST_READINESS_V1",
            "checked_at_utc":now.isoformat(),
            "document_generated_at_utc":doc.get("generated_at_utc"),
            "games":game_results,
            "model_version":doc.get("model_version"),
            "all_games_ready":bool(game_results) and not issues,
            "errors":sorted(set(issues)),
            "data_quality_caveats":{
              "certified_pregame_source_connected":source_audit.get("confirmed_teams",0)>0,
              "source_audit":source_audit.get("source_status", "CHECK_PROVENANCE"),
              "optical_tracking_ingested_and_validated":False,
              "forward_accuracy_validated":False,
              "github_runner_health_assessed_here":False},
            "policy":"NO_SPORTSBOOK_INPUTS; READINESS_IS_NOT_ACCURACY_VALIDATION"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--forecast", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-age-minutes",type=int,default=180)
    ap.add_argument("--strict",action="store_true",help="Exit nonzero when slate not ready")
    opts = ap.parse_args()
    report = check(json.loads(Path(opts.forecast).read_text()),dt.datetime.now(dt.timezone.utc),
                   max_age_minutes=opts.max_age_minutes)
    target = Path(opts.out)
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(report,indent=2)+"\n")
    print("NBA_V5_READINESS",json.dumps({"all_games_ready":report["all_games_ready"],
          "games":len(report["games"]),"errors":report["errors"]}))
    if opts.strict and not report["all_games_ready"]:
        return 1
    return 0


if __name__=="__main__":
    raise SystemExit(main())
