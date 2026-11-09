#!/usr/bin/env python3
"""Immutable, pregame-target vs actual game scorecards. Research-only.

NBA source: frozen NBA V5 last-pretip forecasts, graded from final NBA boxes.
NFL source: first-seen pregame precision ledger, joined to separately graded actuals.
Never reproject, never infer a missing actual as zero, never claim a target hit is
proof the underlying numerical mean or the assigned probability was correct.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import math
from pathlib import Path
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
NBA_MARKETS = {
    "points": "PTS", "rebounds": "REB", "assists": "AST",
    "three_pointers_made": "3PM", "steals": "STL",
    "blocks": "BLK", "turnovers": "TO"
}
NFL_MARKETS = {"receiving_yards": "REC YDS", "rushing_yards": "RUSH YDS"}


def iso(s):
    return dt.datetime.fromisoformat(str(s).replace("Z", "+00:00"))


def pct(x):
    return "—" if x is None else f"{100 * x:.1f}%"


def avg(values):
    return sum(values) / len(values) if values else None


def valid_num(v):
    return isinstance(v, (float, int)) and not isinstance(v, bool) and math.isfinite(v)


def clean(s):
    return str(s).replace("|", "/").replace("\n", " ")


def summary(rows):
    graded = [r for r in rows if r["hit"] is not None]
    hit = sum(int(r["hit"]) for r in graded)
    probs = [r["prob"] for r in graded if valid_num(r.get("prob"))]
    return {
        "n": len(rows), "graded": len(graded), "unverified": len(rows) - len(graded),
        "hits": hit, "misses": len(graded) - hit,
        "hit_rate": hit / len(graded) if graded else None,
        "mean_stated_probability": avg(probs),
        "expected_hits_on_scored_rows": sum(probs) if len(probs) == len(graded) else None,
        "dnps": sum(r["status"] == "DNP" for r in rows),
        "near_misses": sum(r["hit"] is False and r.get("shortfall") == 1 for r in rows),
    }


def nba_rows(folder, day):
    """The archived last forecast date is used as a pretip day *proxy*;
    there is no game start timestamp in the graded file; expose this limitation.
    """
    games = []
    for fn in sorted(Path(folder).glob("*.json")):
        d = json.loads(fn.read_text())
        when = d.get("forecast_at_utc")
        if not when or iso(when).astimezone(ET).date().isoformat() != day:
            continue
        raw = sorted(
            (r for r in d.get("rows", [])
             if isinstance(r.get("frontend_rank"), int)
             and 1 <= r["frontend_rank"] <= 10
             and r.get("market") in NBA_MARKETS
             # Old archives retain stale turnover ranks after the app removed TO.
             and r.get("market") != "turnovers"
             and isinstance(r.get("whole_projection"), int)
             and r["whole_projection"] >= 1),
            key=lambda r: (r["frontend_rank"], r["player_id"], r["market"]),
        )
        # Every featured rank must be unique. A shadow/historical ranking
        # conflict is excluded from certified top-ten counts, not silently
        # resolved using outcomes.
        counts = collections.Counter(r["frontend_rank"] for r in raw)
        conflicts = sorted(k for k,v in counts.items() if v > 1)
        if conflicts:
            print("NBA_FRONTEND_RANK_CONFLICT_UNRESOLVED", d["game_id"], conflicts)
            continue
        rows = []
        for r in raw:
            target = r["whole_projection"]
            played = r.get("played")
            actual = r.get("actual")
            if played is False:
                # Original pretip positive target -> miss when confirmed DNP.
                actual, hit, status = 0, False, "DNP"
            elif played is True and valid_num(actual):
                hit, status = bool(actual >= target), "GRADED"
            else:
                actual, hit, status = None, None, "UNVERIFIED"
            prob = (r.get("reach_probabilities") or {}).get("probability_including_dnp")
            if not valid_num(prob) or prob < 0 or prob > 1:
                prob = None
            causes = list(r.get("causes") or [])
            rows.append({
                "sport": "NBA", "game_id": str(d["game_id"]),
                "game": f'{d["away"]} at {d["home"]}',
                "rank": r["frontend_rank"], "player": r["player"],
                "market": r["market"], "target": target, "actual": actual,
                "hit": hit, "status": status, "prob": prob,
                "model_mean": r.get("projection"),
                "minutes_forecast": r.get("minutes_forecast"),
                "minutes_actual": r.get("minutes_actual"),
                "shortfall": max(0, target - actual) if actual is not None else None,
                "causes": causes, "forecast_at_utc": when,
            })
        if rows:
            games.append({
                "game": f'{d["away"]} at {d["home"]}',
                "game_id": str(d["game_id"]), "forecast_at_utc": when,
                "overtime": d.get("overtime"), "final_margin": d.get("final_margin"),
                "rows": rows, "summary": summary(rows),
            })
    return games


def nfl_rows(firstseen_path, grades_path, day):
    by_key = {}
    for line in Path(firstseen_path).read_text().splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        if r.get("market") not in NFL_MARKETS:
            continue
        kickoff, recorded = r.get("kickoff_utc"), r.get("recorded_at_utc")
        if not kickoff or iso(kickoff).astimezone(ET).date().isoformat() != day:
            continue
        key = "|".join(map(str, [r["season"], r["week"], kickoff, r["team"],
                                  r["market"], r["player_id"]]))
        if key not in by_key or iso(recorded) < iso(by_key[key]["recorded_at_utc"]):
            by_key[key] = r
    grade_doc = json.loads(Path(grades_path).read_text())
    finals = {r["key"]: r for r in grade_doc.get("results", [])}
    games = {}
    for key, r in sorted(by_key.items()):
        teams = sorted((r["team"], r["opponent"]))
        game_key = (r["kickoff_utc"], *teams)
        label = f'{teams[0]} vs {teams[1]}'
        box = games.setdefault(game_key, {
            "game": label, "game_id": "|".join(game_key),
            "forecast_at_utc": r["source_generated_at_utc"], "rows": [],
        })
        eligible = all(iso(r[t]) < iso(r["kickoff_utc"])
                       for t in ("recorded_at_utc", "source_generated_at_utc")
                       if r.get(t))
        grade = finals.get(key) or {}
        actual = grade.get("actual")
        if not eligible:
            status, actual, hit = "INVALID_AFTER_KICKOFF", None, None
        elif grade.get("result") == "GRADED" and valid_num(actual):
            status, hit = "GRADED", bool(actual >= r["whole_projection"])
        else:
            status, actual, hit = "UNVERIFIED", None, None
        prob = r.get("projection_reach_probability")
        if not valid_num(prob) or not 0 <= prob <= 1:
            prob = None
        box["rows"].append({
            "sport": "NFL", "game_id": box["game_id"], "game": label,
            "team": r["team"], "rank": r.get("frontend_research_rank"),
            "player": r["player"], "market": r["market"],
            "target": r["whole_projection"], "actual": actual,
            "hit": hit, "status": status, "prob": prob,
            "model_mean": r.get("model_mean"), "shortfall": max(0, r["whole_projection"] - actual)
            if actual is not None else None, "abs_error": abs(r["whole_projection"] - actual)
            if actual is not None else None, "causes": [],
            "forecast_at_utc": r["source_generated_at_utc"],
            "model_source": r.get("model_source"),
            "verified_active_pregame": r.get("official_active_status_verified"),
        })
    for g in games.values():
        g["rows"].sort(key=lambda x: (x["rank"] if isinstance(x["rank"], int) else 999,
                                      x["player"], x["market"]))
        g["summary"] = summary(g["rows"])
    return list(games.values())


def sports_summary(games):
    rows = [r for g in games for r in g["rows"]]
    markets = {}
    for m in sorted({r["market"] for r in rows}):
        markets[m] = summary([r for r in rows if r["market"] == m])
    return {"games": len(games), "summary": summary(rows), "markets": markets}


def markdown(report):
    out = [
        f'# Original player-target scorecard — {report["date"]}',
        '',
        '> Research / diagnostics, not postgame-selected picks or an odds-based betting model.',
        '> Original NBA V5 ranked forecast thresholds and NFL first-seen numeric forecasts only.',
        '> NBA game date uses archived last-forecast ET date because the grade files do not store tipoff;',
        '> NFL game date uses verified pretip kickoff. Frozen model targets are NEVER altered.',
        '> This reconstructs ranked cards from archives; it cannot guarantee each user saw that exact snapshot.',
        '> Diagnostic cause flags are associations, NOT established causal explanations.
> Legacy turnover rankings are excluded because they were not featured as player picks.',
        '',
    ]
    for sport in ["NBA", "NFL"]:
        block = report[sport]
        s = block["summary"]
        out += [
            f'## {sport} — {block["game_count"]} archived matchups',
            f'**Target hits:** {s["hits"]}/{s["graded"]} '
            f'({pct(s["hit_rate"])}); {s["unverified"]} unresolved; '
            f'average stated reach chance {pct(s["mean_stated_probability"])}.',
            '',
            '| Game | Hits / verified | Expected hits | Mean predicted chance | DNP | Unverified |',
            '|---|---:|---:|---:|---:|---:|',
        ]
        for g in block["games"]:
            x = g["summary"]
            expected = x["expected_hits_on_scored_rows"]
            out.append(f'| {clean(g["game"])} | {x["hits"]}/{x["graded"]} | '
                       f'{expected:.1f} | ' if expected is not None else
                       f'| {clean(g["game"])} | {x["hits"]}/{x["graded"]} | — | ')
            out[-1] += f'{pct(x["mean_stated_probability"])} | {x["dnps"]} | {x["unverified"]} |'
        out += ['', '### By market',
                '| Market | Hits / verified | Observed | Model chance |',
                '|---|---:|---:|---:|']
        for m, x in block["markets"].items():
            out.append(f'| {clean(m)} | {x["hits"]}/{x["graded"]} | '
                       f'{pct(x["hit_rate"])} | {pct(x["mean_stated_probability"])} |')
        out.append('')
        for g in block["games"]:
            out += [
                f'### {g["game"]} — {g["game_id"]}',
                f'Archived forecast: {g["forecast_at_utc"]}',
                '',
                '| Rank | Player | Stat | Model mean | Target | Actual | P(hit) | Minutes forecast / actual | Result |',
                '|---:|---|---|---:|---:|---:|---:|---|---|',
            ]
            for r in g["rows"]:
                status = ("HIT" if r["hit"] is True else "MISS" if r["hit"] is False
                          else r["status"])
                actual = str(r["actual"]) if r["actual"] is not None else "—"
                mean = r.get("model_mean")
                mean_str = f'{mean:.2f}' if valid_num(mean) else "—"
                fm = r.get("minutes_forecast")
                am = r.get("minutes_actual")
                minutes = (f'{fm:.1f} / {am:.1f}' if valid_num(fm) and valid_num(am)
                           else f'{fm:.1f} / DNP' if valid_num(fm) and r["status"] == "DNP"
                           else "—")
                out.append(f'| {r["rank"] or "—"} | {clean(r["player"])} | '
                           f'{clean(r["market"])} | {mean_str} | {r["target"]}+ | {actual} | '
                           f'{pct(r["prob"])} | {minutes} | {status} |')
            out.append('')
            misses = [r for r in g["rows"] if r["hit"] is False]
            if misses and sport == "NBA":
                causes = collections.Counter(c for r in misses for c in r["causes"])
                out.append('**Miss-associated flags:** ' +
                           (', '.join(f'{k} ({v})' for k, v in causes.most_common(6))
                            if causes else 'none available') + '.')
                out.append('')
        if sport == "NFL":
            out += ['**NFL limitations:** role/injury verification at publication was not '
                    'certified in this ledger; unresolved finals stay unresolved. '
                    'The stored reach probabilities are uncalibrated.', '']
    out += [
        '## Interpretation rules',
        '- A successful 1+ target that ends at eight is a hit, not a numerically accurate mean.',
        '- DNP is a miss for a positive pregame NBA target, recorded separately.',
        '- Missing NFL verified stats are never imputed as zero or counted as misses.',
        '- Do not promote a new model on this single-day retrospective; test forward out of sample.',
        '',
    ]
    return "\n".join(out)


def test():
    checked = summary([
        {"hit": True, "prob": .7, "status": "GRADED", "shortfall": 0},
        {"hit": False, "prob": .6, "status": "DNP", "shortfall": 1},
        {"hit": None, "prob": None, "status": "UNVERIFIED", "shortfall": None},
    ])
    assert checked["hits"] == 1 and checked["graded"] == 2
    assert checked["unverified"] == 1 and checked["dnps"] == 1
    assert math.isclose(checked["mean_stated_probability"], .65)
    assert math.isclose(checked["expected_hits_on_scored_rows"], 1.3)
    assert checked["near_misses"] == 1


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--date", required=True, help="Eastern calendar date YYYY-MM-DD")
    p.add_argument("--nba-grades", default="docs/nba_v5_grades/last")
    p.add_argument("--nfl-firstseen")
    p.add_argument("--nfl-grades")
    p.add_argument("--output", default="docs/projection_outcome")
    p.add_argument("--self-test", action="store_true")
    a = p.parse_args()
    if a.self_test:
        test()
        print("SCORECARD_TEST_OK")
    if not a.nfl_firstseen or not a.nfl_grades:
        p.error("Both genuine NFL firstseen ledger and verified grade are required")
    nba = nba_rows(a.nba_grades, a.date)
    nfl = nfl_rows(a.nfl_firstseen, a.nfl_grades, a.date)
    report = {
        "schema": "CROSS_SPORT_ORIGINAL_PLAYER_TARGET_SCORECARD_V1",
        "date": a.date, "generated_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "nba_date_basis": "PRETIP_LAST_FORECAST_ET_DATE_PROXY",
        "nfl_date_basis": "PREGAME_SCHEDULED_KICKOFF_ET_DATE",
        "research_only_no_promotion": True,
        "NBA": {**sports_summary(nba), "games": nba},
        "NFL": {**sports_summary(nfl), "games": nfl},
    }
    # 'games' in sport report is the actual match array; totals are separately named.
    for sport in ("NBA", "NFL"):
        report[sport]["game_count"] = len(report[sport]["games"])
    dest = Path(a.output)
    dest.mkdir(parents=True, exist_ok=True)
    (dest / f'{a.date}.json').write_text(json.dumps(report, indent=2) + "\n")
    (dest / f'{a.date}.md').write_text(markdown(report) + "\n")
    for name in ("NBA", "NFL"):
        print(name, json.dumps(report[name]["summary"]), "game_count", report[name]["game_count"])
    print("SCORECARD_CREATED", a.date)


if __name__ == "__main__":
    main()
