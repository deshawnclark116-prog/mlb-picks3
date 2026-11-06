#!/usr/bin/env python3
"""Learn from every miss without rewriting history (NBA V5).

For each ORIGINAL forecast (frozen before tip-off) and the game's real result, answer for every player and stat:
did he play, were his minutes and role wrong, were his shots and free throws (opportunity) wrong, did he shoot unusually
well or badly, did fouls, a blowout, overtime or an unreported absence decide it, was the stated range wide enough?
Then add up the causes across games so a pattern, never one game, can change the model.

Source reliability: each reported injury status (from the information ledger) is compared with whether the player played.

Usage: python -m nba.nba_v5_postmortem --archive docs/nba_v5_archive --grades docs/nba_v5_grades [--ledger info_ledger.jsonl]
first/ holds each ORIGINAL forecast (never rewritten); last/ holds the last version made before tip-off. Both are graded,
separately, once the game is final; a graded game is never re-graded. summary.json adds everything up.
"""
from __future__ import annotations
import argparse
import collections
import json
import time
import urllib.request
from pathlib import Path

import numpy as np

from nba.nba_v5_rank import rank_for_screen

ESPN = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event="
UA = {"User-Agent": "PropEdgeNBAV5Postmortem/1.0", "Accept": "application/json"}
STAT_KEY = {"points": "PTS", "rebounds": "REB", "assists": "AST", "three_pointers_made": "3PM", "steals": "STL", "blocks": "BLK",
            "turnovers": "TO"}


def get(url, tries=3):
    for a in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception:
            time.sleep(1.5 * (a + 1))
    return None


def parse_final(summary):
    """Per-player final line plus game facts. None if the game is not final."""
    st = ((summary.get("header") or {}).get("competitions") or [{}])[0].get("status", {}).get("type", {})
    if st.get("name") != "STATUS_FINAL":
        return None
    comp = (summary.get("header") or {}).get("competitions", [{}])[0]
    scores = {c["homeAway"]: int(c.get("score") or 0) for c in comp.get("competitors", [])}
    periods = max([int((p.get("period") or {}).get("number") or 0) for p in (summary.get("plays") or [])] or [4])
    players = {}
    for t in (summary.get("boxscore") or {}).get("players", []):
        tid = str((t.get("team") or {}).get("id"))
        for grp in t.get("statistics") or []:
            labels = [str(x).upper() for x in (grp.get("labels") or [])]
            if "MIN" not in labels:
                continue
            for a in grp.get("athletes") or []:
                vals = a.get("stats")
                if not vals or len(vals) != len(labels):
                    continue
                s = dict(zip(labels, vals))
                try:
                    mn = float(str(s["MIN"]).split(":")[0]) if ":" in str(s["MIN"]) else float(s["MIN"])
                except Exception:
                    mn = 0.0
                if mn <= 0:
                    continue
                fg = str(s.get("FG", "0-0")).split("-")
                ft = str(s.get("FT", "0-0")).split("-")
                tp = str(s.get("3PT", "0-0")).split("-")
                players[str((a.get("athlete") or {}).get("id"))] = {
                    "team": tid, "min": mn, "starter": bool(a.get("starter")), "PTS": int(s.get("PTS") or 0), "REB": int(s.get("REB") or 0),
                    "AST": int(s.get("AST") or 0), "3PM": int(tp[0] or 0), "STL": int(s.get("STL") or 0), "BLK": int(s.get("BLK") or 0),
                    "TO": int(s.get("TO") or 0), "PF": int(s.get("PF") or 0), "FGA": int(fg[1] or 0), "FGM": int(fg[0] or 0),
                    "FTA": int(ft[1] or 0), "3PA": int(tp[1] or 0)}
    return {"players": players, "margin": abs(scores.get("home", 0) - scores.get("away", 0)), "overtime": periods > 4}


def causes_for(row, line, game):
    """Short list of reasons a projection missed, from what the forecast said versus what happened."""
    out = []
    if line is None:
        out.append("did_not_play" if row["p_active"] >= 0.75 else "did_not_play_as_flagged")
        return out
    m = row["market"]
    if abs(line["min"] - row["minutes_mean"]) >= 6 if row.get("minutes_mean") else False:
        out.append("minutes_off_by_6_plus")
    if row.get("p_start") is not None and ((line["starter"] and row["p_start"] < 0.2) or (not line["starter"] and row["p_start"] > 0.8)):
        out.append("role_wrong_starter_vs_bench")
    if row.get("fga_mean") and abs(line["FGA"] - row["fga_mean"]) >= max(3.0, 0.3 * row["fga_mean"]):
        out.append("shot_volume_off")
    if m == "points" and row.get("fga_mean") and line["FGA"]:
        exp_ppa = row["mean"] / max(row["fga_mean"] + 0.44 * (row.get("fta_mean") or 0), 1e-6)
        act_ppa = line["PTS"] / max(line["FGA"] + 0.44 * line["FTA"], 1e-6)
        if abs(act_ppa - exp_ppa) >= 0.35:
            out.append("shooting_unusually_good" if act_ppa > exp_ppa else "shooting_unusually_bad")
    if line["PF"] >= 5:
        out.append("foul_trouble")
    if game["margin"] >= 20 and not line["starter"] is False and line["min"] < (row.get("minutes_mean") or line["min"]) - 4:
        out.append("blowout_cut_minutes")
    if game["overtime"] and line["min"] > (row.get("minutes_mean") or 0) + 4:
        out.append("overtime_extra_minutes")
    actual = line[STAT_KEY[m]]
    if not (row["p10"] <= actual <= row["p90"]):
        out.append("outside_stated_80_percent_range")
    return out


def grade_doc(doc, ledger_reports, kind):
    """Grade every FINAL game in one forecast document. Returns (per_game_records, accumulators)."""
    out = []
    for g in doc["games"]:
        final = parse_final(get(ESPN + g["game_id"]) or {})
        if not final:
            continue
        rank_for_screen(g["rows"])                      # the screen's featured order, recomputed the same way for every archived version
        rows_out = []
        for r in g["rows"]:
            if r.get("mean_basis") != "CONDITIONAL_ON_PLAYING" or r["market"] not in STAT_KEY:
                continue
            line = final["players"].get(r["player_id"])
            rows_out.append({"player": r["player"], "player_id": r["player_id"], "market": r["market"], "projection": r["mean"],
                             "p10": r["p10"], "p90": r["p90"], "p_active": r["p_active"], "p_start": r.get("p_start"), "frontend_rank": r.get("frontend_rank"),
                             "whole_projection": r.get("whole_projection"), "reach_probability": r.get("reach_probability"),
                             "actual": None if line is None else line[STAT_KEY[r["market"]]], "played": line is not None,
                             "minutes_forecast": r.get("minutes_mean"), "minutes_actual": None if line is None else line["min"],
                             "causes": causes_for(r, line, final)})
        rel = []
        for pid in {r["player_id"] for r in g["rows"]}:
            reps = ledger_reports.get((g["game_id"], pid), [])
            for e in reps:
                rel.append({"source": e["source"], "status": e["status"], "played": pid in final["players"], "body_part": e.get("location") or e.get("body_part")})
            if not reps and any(r["player_id"] == pid and r.get("reported_status") != "OUT" and (r.get("p_active") or 0) >= 0.2 for r in g["rows"]):
                rel.append({"source": "none", "status": "UNLISTED", "played": pid in final["players"], "body_part": None})
        out.append({"game_id": g["game_id"], "kind": kind, "away": g["away"], "home": g["home"], "overtime": final["overtime"],
                    "final_margin": final["margin"], "forecast_at_utc": g.get("forecast_at_utc"), "rows": rows_out, "source_checks": rel})
    return out


def summarize(records):
    cause_counts = collections.Counter()
    cover = collections.defaultdict(lambda: [0, 0])
    errs = collections.defaultdict(list)
    shown = collections.defaultdict(list)
    rel = collections.defaultdict(collections.Counter)
    by_status = collections.defaultdict(collections.Counter)
    by_body = collections.defaultdict(collections.Counter)
    for rec in records:
        seen_status = {}
        for x in rec["source_checks"]:
            rel[(x["source"], x["status"])]["played" if x["played"] else "did_not_play"] += 1
            seen_status[(x["status"], x.get("body_part"))] = x["played"]
        for (st_, body), pl in seen_status.items():        # one count per player-game and status (two feeds report the same fact)
            by_status[st_]["played" if pl else "did_not_play"] += 1
            if body:
                by_body[f"{st_}|{body}"]["played" if pl else "did_not_play"] += 1
        for r in rec["rows"]:
            for c in r["causes"]:
                cause_counts[c] += 1
            if not r["played"]:
                continue
            k = r["market"]
            cover[k][1] += 1
            cover[k][0] += 1 if r["p10"] <= r["actual"] <= r["p90"] else 0
            errs[k].append(abs(r["actual"] - r["projection"]))
            if r.get("whole_projection") is not None and r.get("reach_probability") is not None:
                hit = 1.0 if r["actual"] >= r["whole_projection"] else 0.0
                shown["all_ranked"].append((r["reach_probability"], hit))
                role = "likely_starter" if (r.get("p_start") or 0) >= 0.5 else "bench"
                shown["role_" + role].append((r["reach_probability"], hit))
                big = "minutes_28_plus" if (r.get("minutes_forecast") or 0) >= 28 else "minutes_under_28"
                shown["opportunity_" + big].append((r["reach_probability"], hit))
                shown["stat_" + r["market"]].append((r["reach_probability"], hit))
                if (r.get("frontend_rank") or 99) <= 4:
                    shown["frontend_top4"].append((r["reach_probability"], hit))
    return {"games_graded": len(records), "cause_counts": dict(cause_counts.most_common()),
            "stated_80_percent_range_coverage": {k: {"n": v[1], "covered": round(v[0] / max(1, v[1]), 3)} for k, v in cover.items()},
            "stated_chance_vs_actual": {b: {"n": len(v), "mean_stated": round(float(np.mean([x[0] for x in v])), 3),
                                            "actual_reach_rate": round(float(np.mean([x[1] for x in v])), 3),
                                            "brier": round(float(np.mean([(x[0] - x[1]) ** 2 for x in v])), 4)} for b, v in shown.items() if v},
            "mean_abs_error": {k: round(float(np.mean(v)), 3) for k, v in errs.items()},
            "source_reliability": {f"{s}|{st}": dict(c) for (s, st), c in rel.items()},
            "play_by_status": {k: dict(v) for k, v in by_status.items()},
            "play_by_status_body": {k: dict(v) for k, v in by_body.items()},
            "note": "Patterns across many games change the model. One surprising result never does."}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", required=True, help="docs/nba_v5_archive (first/ and last/ forecast files)")
    ap.add_argument("--grades", required=True, help="directory for per-game grade files and summary.json")
    ap.add_argument("--ledger", default="")
    a = ap.parse_args()
    reports = collections.defaultdict(list)
    if a.ledger and Path(a.ledger).exists():
        for line in Path(a.ledger).read_text().splitlines():
            try:
                e = json.loads(line)
                reports[(e["game_id"], e["player_id"])].append(e)
            except Exception:
                pass
    gdir = Path(a.grades)
    gdir.mkdir(parents=True, exist_ok=True)
    new = 0
    for kind in ("first", "last"):
        for fp in sorted((Path(a.archive) / kind).glob("*.json*")):
            target = gdir / kind / (fp.name[:-3] if fp.name.endswith(".gz") else fp.name)
            if target.exists():
                continue                                            # a graded game is never re-graded or rewritten
            import gzip
            raw = gzip.open(fp, "rt").read() if fp.name.endswith(".gz") else fp.read_text()
            recs = grade_doc(json.loads(raw), reports, kind)
            if recs:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(json.dumps(recs[0], separators=(",", ":")))
                new += 1
    summary = {}
    for kind in ("first", "last"):
        recs = [json.loads(p.read_text()) for p in sorted((gdir / kind).glob("*.json"))]
        summary[kind] = summarize(recs)
    (gdir / "summary.json").write_text(json.dumps(summary, indent=1))
    print("newly graded", new, json.dumps({k: v["games_graded"] for k, v in summary.items()}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
