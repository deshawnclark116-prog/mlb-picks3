#!/usr/bin/env python3
"""All available frozen actual featured projections: NBA V3/V4/V5 by game.

Historical run documents only, never rebuild forecasts from postgame data.
V3/V4 are reconstructed counterfactual top-ten cards. V5's last-pretip
archived frontend ranks are authoritative. Uses exact same graded box scores.
Does not promote a model or change production targets.
"""
from __future__ import annotations

import collections
import datetime as dt
import json
import subprocess
from pathlib import Path

from nba import nba_v3_v4_v5_featured_compare as prior


def timestamp(s: str) -> dt.datetime:
    return dt.datetime.fromisoformat(str(s).replace("Z", "+00:00"))


def commits_with_v4():
    p = subprocess.run(
        ["git", "log", "--format=%H", "--since=2026-11-04T00:00:00Z",
         "--until=2026-11-10T23:59:59Z", "--",
         "docs/nba_v4_latest/latest.json"],
        check=True, capture_output=True, text=True,
    )
    if not p.stdout.strip():
        raise ValueError("NO_FROZEN_V4_COMMIT_HISTORY: checkout needs fetch-depth 0")
    return [s.strip() for s in p.stdout.splitlines() if s.strip()]


def history_index():
    """For every real V4 file revision, verify that same commit contains V3.
    Preserve each source as-of time and only allow records generated before
    the frozen V5 last-pregame generation; never backfill later forecasts."""
    by_game = collections.defaultdict(list)
    counts = collections.Counter()
    for ref in commits_with_v4():
        try:
            v4 = prior.archived(ref, "docs/nba_v4_latest/latest.json")
            v3 = prior.archived(ref, "docs/nba_v3_latest/latest.json")
        except (OSError, subprocess.CalledProcessError, json.JSONDecodeError):
            counts["missing_both_model_docs"] += 1
            continue
        v3by = {str(g["game_id"]): g for g in v3.get("games", [])}
        for game in v4.get("games", []):
            gid = str(game["game_id"])
            other = v3by.get(gid)
            if other is None:
                counts["missing_v3_game"] += 1
                continue
            # Timestamp integrity and actual game identity, not matching
            # historical file names or postgame-supplied outcomes.
            if (game.get("tipoff_utc") != other.get("tipoff_utc")
                or game.get("away_id") != other.get("away_id")
                or game.get("home_id") != other.get("home_id")):
                counts["v3_v4_game_identity_conflict"] += 1
                continue
            g4at = timestamp(game["forecast_at_utc"])
            g3at = timestamp(other["forecast_at_utc"])
            tip = timestamp(game["tipoff_utc"])
            if not (g3at < tip and g4at < tip):
                counts["after_kickoff_model_doc"] += 1
                continue
            by_game[gid].append({
                "ref": ref,
                "v3": g3at,
                "v4": g4at,
                "tip": tip,
            })
    return by_game, counts


def find_source(gid, final, index):
    v5at = timestamp(final["forecast_at_utc"])
    candidates = [x for x in index.get(gid, [])
                  if x["v4"] <= v5at and x["v3"] <= v5at
                  and v5at < x["tip"]]
    if not candidates:
        return None, "NO_MATCHED_V3_V4_FROZEN_PREGAME_REVISION"
    chosen = max(candidates, key=lambda x: (x["v4"], x["v3"]))
    lag = (v5at - chosen["v4"]).total_seconds() / 60
    # Refuse stale counterfactual model choices; a different afternoon
    # version is not an apples-to-apples pregame counterpart.
    if lag > 120:
        return None, f"V4_SOURCE_TOO_OLD_{lag:.1f}_MINUTES"
    return chosen, None


def one_game(gid, final, matched):
    ref = matched["ref"]
    final_truth = {}
    for r in final["rows"]:
        key = str(r["player_id"]), r["market"]
        if key in final_truth:
            raise ValueError(f"{gid}: duplicate final {key}")
        final_truth[key] = r
    cards = {}
    times = {}
    for version in ("V3", "V4"):
        doc = prior.archived(ref, f"docs/nba_{version.lower()}_latest/latest.json")
        selected, orig_game = prior.choose_pre_game(doc, gid, version, final)
        if len(selected) != 10:
            raise ValueError(f"{version} {gid} has {len(selected)} ranked targets, not ten")
        cards[version] = prior.grade(selected, final_truth, version, gid)
        times[version] = orig_game["forecast_at_utc"]
    cards["V5"] = prior.select_v5(final, final_truth)
    times["V5"] = final["forecast_at_utc"]
    return {
        "id": gid, "matchup": f'{final["away"]} at {final["home"]}',
        "revision": ref, "times": times, "cards": cards,
        "hits": {k: sum(r["hit"] for r in rows) for k, rows in cards.items()},
        "v4_vs_v5_pretip_lag_minutes": round(
            (timestamp(times["V5"]) - timestamp(times["V4"])).total_seconds()/60, 2),
        "game_date_et": timestamp(matched["tip"]).astimezone(
            dt.timezone(dt.timedelta(hours=-5))).date().isoformat(),
    }


def by_day(games):
    days = {}
    for g in games:
        day = g["game_date_et"]
        if day not in days:
            days[day] = {"games": 0, "V3": 0, "V4": 0, "V5": 0}
        days[day]["games"] += 1
        for v in ("V3", "V4", "V5"):
            days[day][v] += g["hits"][v]
    return dict(sorted(days.items()))


def format_table(games, overall, excluded):
    lines = [
        "# NBA V3 vs V4 vs V5: all available frozen game-by-game top tens",
        "",
        "Every row is a *model-produced whole-number target*, graded at its own target.",
        "V3/V4 are reconstructed shadow cards. V5 uses frozen original featured",
        "ranks. No odds, sportsbook lines, hindsight line changes, or resimulation.",
        "V3/V4 each support four stats; V5 also offers steals and blocks.",
        "V4's probability is conditional on playing; V5 includes nonparticipation.",
        "Only original model generations before the same game's V5 last-pretip",
        "snapshot are included; every exclusion and coverage gap is reported.",
        "",
        "## Overall results", "",
        "| Version | Hits | Total | Hit rate |",
        "|---|---:|---:|---:|",
    ]
    for v in ("V3", "V4", "V5"):
        t = overall[v]
        lines.append(f'| {v} | {t["hits"]} | {t["n"]} | {100*t["hit_rate"]:.1f}% |')
    lines.extend(["", "## Per-day original target hits", "",
                  "| Eastern game date | Games | V3 | V4 | V5 |",
                  "|---|---:|---:|---:|---:|"])
    for d, stats in by_day(games).items():
        denominator = stats["games"] * 10
        lines.append(f'| {d} | {stats["games"]} | {stats["V3"]}/{denominator} | '
                     f'{stats["V4"]}/{denominator} | {stats["V5"]}/{denominator} |')
    lines += ["", "## Market mix: model-featured targets only", "",
              "| Market | V3 | V4 | V5 |",
              "|---|---:|---:|---:|"]
    for m in prior.MARKETS:
        line = [m]
        for v in ("V3", "V4", "V5"):
            x = overall[v]["markets"][m]
            line.append(f'{x["hits"]}/{x["n"]}')
        lines.append("| " + " | ".join(line) + " |")
    lines += ["", "## Every included matchup", "",
              "| Matchup | V3 | V4 | V5 | V4-to-V5 age |",
              "|---|---:|---:|---:|---:|"]
    for g in games:
        lines.append(f'| {g["matchup"]} ({g["game_date_et"]}) | '
                     f'{g["hits"]["V3"]}/10 | {g["hits"]["V4"]}/10 | '
                     f'{g["hits"]["V5"]}/10 | {g["v4_vs_v5_pretip_lag_minutes"]:.1f} min |')
    lines += ["", "## Per-player original projected targets and actual results", ""]
    for g in games:
        lines += [f'### {g["game_date_et"]}: {g["matchup"]} ({g["id"]})', "",
                  f'Frozen V3 / V4 / V5 generations: {g["times"]["V3"]} / '
                  f'{g["times"]["V4"]} / {g["times"]["V5"]}.',
                  "", "| Rank | V3 | V4 | V5 |", "|---:|---|---|---|"]
        for i in range(10):
            lines.append(f'| {i+1} | ' + " | ".join(
                prior.format_row(g["cards"][v][i])
                for v in ("V3", "V4", "V5")) + " |")
        lines += [""]
    lines += ["## Archived games excluded from fair matched comparison", ""]
    if excluded:
        for e in excluded:
            lines.append(f'- {e["game"]} ({e["game_id"]}): {e["reason"]}')
    else:
        lines.append("None; every frozen game had an eligible matched V3/V4 revision.")
    lines += ["", "## Interpretation",
              "- Only historical original pregame forecasts and real final stats were used.",
              "- A 1+ target reached by eight is a target HIT but can be a poor numerical forecast.",
              "- Different market coverage prevents a claim of equal-stat superiority.",
              "- These versions were not independent in production: V5 core means blended V4.",
              "- This is a descriptive model-card comparison; no model promotion authorized.",
              ""]
    return "\n".join(lines)


def main():
    grades = sorted(Path("docs/nba_v5_grades/last").glob("*.json"))
    if not grades:
        raise ValueError("NO_ARCHIVED_V5_FINAL_GRADES")
    index, audit = history_index()
    included, excluded = [], []
    for path in grades:
        final = json.loads(path.read_text())
        gid = str(final.get("game_id"))
        if final.get("kind") != "last" or path.stem != gid:
            raise ValueError(f"Mismatched archive path for {path}")
        choice, err = find_source(gid, final, index)
        if err:
            excluded.append({"game_id": gid,
                             "game": f'{final["away"]} at {final["home"]}',
                             "reason": err})
            continue
        try:
            included.append(one_game(gid, final, choice))
        except ValueError as exc:
            excluded.append({"game_id": gid,
                             "game": f'{final["away"]} at {final["home"]}',
                             "reason": "RANKING_OR_OUTCOME_INTEGRITY: " + str(exc)})
    included.sort(key=lambda g: (g["game_date_et"], g["id"]))
    if not included:
        raise ValueError("NO_FAIR_MATCHED_GAMES_FOUND")
    overall = prior.summarize(included)
    # Lock the established November 8 comparison to catch scope drift.
    nov8 = [g for g in included if g["id"] in prior.REV]
    if len(nov8) == 7:
        prev = prior.summarize(nov8)
        if [prev[v]["hits"] for v in ("V3", "V4", "V5")] != [42, 42, 38]:
            raise ValueError(f"NOV8_PUBLISHED_RECONSTRUCTION_CHANGED: {prev}")
    output = {
        "schema": "NBA_THREE_VERSION_FROZEN_FEATURED_CARDS_ALL_AVAILABLE_V1",
        "total_grade_files": len(grades),
        "matched_games": len(included),
        "excluded_games": excluded,
        "history_integrity": dict(audit),
        "date_coverage": by_day(included),
        "overall": overall,
        "games": included,
    }
    dest = Path("docs/nba_v5_grades")
    (dest/"v3_v4_v5_multiday_featured_comparison.json").write_text(
        json.dumps(output, indent=2)+"\n")
    (dest/"v3_v4_v5_multiday_featured_comparison.md").write_text(
        format_table(included, overall, excluded)+"\n")
    print("MATCHED_MULTIDAY_FINALS", json.dumps({
        "total_grade_files": len(grades),
        "matched_games": len(included), "excluded": excluded,
        "dates": output["date_coverage"], "overall": overall
    }))
    print("PER_GAME", json.dumps([{"id":g["id"],"day":g["game_date_et"],
                                  "matchup":g["matchup"],"hits":g["hits"]}
                                 for g in included]))


if __name__ == "__main__":
    main()
