"""NBA V5 archive-to-grade observability without any retrospective backfill.

Only answers: how many immutable forecasts were saved before tip, which have
been graded, and which are past tip but not yet graded. Past tip is NOT the
same as officially final. ESPN final status is checked by the postmortem job.
"""
from __future__ import annotations
import argparse
import datetime as dt
import gzip
import json
from pathlib import Path


def _read(p: Path) -> dict:
    if p.suffix == ".gz":
        with gzip.open(p, "rt") as f:
            return json.load(f)
    return json.loads(p.read_text())


def health(archive: Path, grades: Path, now: dt.datetime) -> dict:
    if now.tzinfo is None:
        raise ValueError("now must have a time zone")
    summary = {}
    overdue = {}
    for kind in ("first", "last"):
        items = sorted((archive / kind).glob("*.json*"))
        graded = set(p.stem for p in (grades / kind).glob("*.json"))
        past, future, invalid, unknown = [], [], [], []
        samples = []
        for p in items:
            try:
                d = _read(p)
                if len(d.get("games", [])) != 1:
                    raise ValueError("Expected one game per immutable archive")
                g = d["games"][0]
                gameid = str(g["game_id"])
                tip = dt.datetime.fromisoformat(g["tipoff_utc"].replace("Z","+00:00"))
                forecast = dt.datetime.fromisoformat(g["forecast_at_utc"].replace("Z","+00:00"))
                if forecast > tip - dt.timedelta(minutes=15):
                    invalid.append(gameid)
                if tip <= now:
                    past.append(gameid)
                else:
                    future.append(gameid)
                if gameid not in graded and tip <= now:
                    unknown.append({"game_id":gameid,"tipoff_utc":g["tipoff_utc"]})
                samples.append((tip.isoformat(),gameid))
            except (ValueError, KeyError, OSError, TypeError, json.JSONDecodeError):
                invalid.append(p.name)
        summary[kind] = {
            "archived_games": len(items),
            "before_tip": len(items) - len(invalid),
            "forecast_validation_failures": sorted(set(invalid)),
            "past_tipoff": len(past),
            "future_tipoff": len(future),
            "graded": len(graded),
            "past_tip_pending_grade": len(unknown),
            "tipoff_range_utc": [min(t for t, _ in samples), max(t for t, _ in samples)] if samples else None,
        }
        overdue[kind] = sorted(unknown, key=lambda x:x["tipoff_utc"])[:15]
    return {
        "version":"NBA_V5_ARCHIVE_GRADE_HEALTH_V1",
        "as_of_utc":now.isoformat(),
        "note":"Past tipoff means eligible for final-result checking, not verified final.",
        "archive_grade_health":summary,
        "past_tip_pending_grade_sample":overdue,
        "no_lookahead_preserved":True,
    }


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--archive", required=True)
    a.add_argument("--grades", required=True)
    a.add_argument("--out", default="")
    args = a.parse_args()
    report = health(Path(args.archive), Path(args.grades), dt.datetime.now(dt.timezone.utc))
    payload = json.dumps(report, indent=2)
    if args.out:
        Path(args.out).write_text(payload+"\n")
    print(payload)


if __name__ == "__main__":
    main()
