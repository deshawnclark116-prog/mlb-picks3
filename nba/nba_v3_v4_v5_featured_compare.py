#!/usr/bin/env python3
"""Compare *model-selected* top-ten player/stat projections, Nov 8 2026.

No re-simulation, odds, alternative threshold selection, tuning, or hindsight.
V3 and V4 forecasts from historical production commits; V5 frozen grade ranking.
Shared exact original observed stats and DNP handling from frozen V5 grade files.
"""
from __future__ import annotations
import collections
import json
import math
import subprocess
from pathlib import Path

MARKETS = ("points", "rebounds", "assists", "three_pointers_made", "steals", "blocks")
MIN_TARGET = {"points": 6, "rebounds": 3, "assists": 2, "three_pointers_made": 1, "steals": 1, "blocks": 1}
REV = {
    "401909945": "5bdc9edbc2fd",
    "401909946": "5bdc9edbc2fd",
    "401909947": "88fae99c049b",
    "401909948": "88fae99c049b",
    "401909949": "88fae99c049b",
    "401909950": "785f8020184e",
    "401909951": "785f8020184e",
}

def rounded(x):
    base = math.floor(x)
    return base + int(x - base >= 0.6 - 1e-10)

def archived(ref, path):
    raw = subprocess.check_output(["git", "show", f"{ref}:{path}"])
    return json.loads(raw)

def choose_pre_game(doc, gid, label, final, limit=10):
    games = [g for g in doc["games"] if str(g["game_id"]) == gid]
    if len(games) != 1:
        raise ValueError(f"{label} {gid}: expected exactly one game")
    game = games[0]
    if game["forecast_at_utc"] >= game["tipoff_utc"]:
        raise ValueError(f"{label} {gid}: not before tipoff")
    if game["forecast_at_utc"] > final["forecast_at_utc"]:
        raise ValueError(f"{label} {gid}: after frozen V5 last forecast")
    choices = []
    seen = set()
    for r in game["rows"]:
        m = r.get("market")
        if (m not in MARKETS or m == "turnovers"
            or r.get("reported_status") == "OUT"
            or not isinstance(r.get("p_active"), (float, int))
            or float(r["p_active"]) < .75
            or not isinstance(r.get("mean"), (float, int))
            or not math.isfinite(float(r["mean"]))):
            continue
        t = rounded(float(r["mean"]))
        if t < MIN_TARGET[m]:
            continue
        cdf = (r.get("cdf_lattice") or {}).get("cdf")
        if not isinstance(cdf, list) or t-1 >= len(cdf):
            continue
        prob = 1.0 - float(cdf[t-1])
        if not (0 <= prob <= 1):
            raise ValueError("Bad original model CDF")
        key = (str(r["player_id"]), m)
        if key in seen:
            raise ValueError(f"{label} {gid}: duplicate {key}")
        seen.add(key)
        choices.append({
            "player_id": key[0], "player": r["player"], "market": m,
            "mean": r["mean"], "target": t, "probability": prob,
            "p_active": r["p_active"]
        })
    choices.sort(key=lambda r: (
        -r["probability"], -r["p_active"], r["player"], MARKETS.index(r["market"])
    ))
    return choices[:limit], game

def grade(choices, truth, label, gid):
    out = []
    for rank, r in enumerate(choices, 1):
        k = (r["player_id"], r["market"])
        if k not in truth:
            raise ValueError(f"{label} {gid} missing frozen actual for {k}")
        original = truth[k]
        played = bool(original.get("played"))
        actual = original.get("actual") if played else 0
        if actual is None:
            raise ValueError(f"{label} {gid} missing played actual: {k}")
        out.append({
            **r, "rank": rank, "actual": actual, "played": played,
            "hit": bool(played and actual >= r["target"]),
        })
    return out

def select_v5(final, truth):
    raw = sorted(
        [r for r in final["rows"]
         if isinstance(r.get("frontend_rank"), int)
         and 1 <= r["frontend_rank"] <= 10
         and r.get("market") in MARKETS],
        key=lambda r: r["frontend_rank"]
    )
    ranks = [r["frontend_rank"] for r in raw]
    if ranks != list(range(1, 11)):
        raise ValueError(f"V5 {final['game_id']}: noncanonical ranks {ranks}")
    choices = [{
        "player_id": str(r["player_id"]), "player": r["player"],
        "market": r["market"], "target": int(r["whole_projection"]),
        "mean": r["projection"],
        "probability": (r.get("reach_probabilities") or {}).get("probability_including_dnp"),
        "p_active": r.get("p_active"),
    } for r in raw]
    return grade(choices, truth, "V5", str(final["game_id"]))

def one_game(gid):
    ref = REV[gid]
    final = json.loads(Path(f"docs/nba_v5_grades/last/{gid}.json").read_text())
    if str(final["game_id"]) != gid or final.get("kind") != "last":
        raise ValueError(f"Wrong frozen grade for {gid}")
    truth = {}
    for r in final["rows"]:
        k = str(r["player_id"]), r["market"]
        if k in truth:
            raise ValueError(f"{gid} duplicate actual {k}")
        truth[k] = r
    model = {}
    times = {}
    for version in ("V3", "V4"):
        d = archived(ref, f"docs/nba_{version.lower()}_latest/latest.json")
        selections, g = choose_pre_game(d, gid, version, final)
        if len(selections) != 10:
            raise ValueError(f"{version} {gid}: {len(selections)} featured targets, not 10")
        model[version] = grade(selections, truth, version, gid)
        times[version] = g["forecast_at_utc"]
    model["V5"] = select_v5(final, truth)
    times["V5"] = final["forecast_at_utc"]
    return {
        "id": gid, "matchup": f'{final["away"]} at {final["home"]}',
        "revision": ref, "times": times, "cards": model,
        "hits": {k: sum(r["hit"] for r in rows) for k, rows in model.items()},
    }

def summarize(games):
    out = {}
    for v in ("V3", "V4", "V5"):
        rows = [r for g in games for r in g["cards"][v]]
        by_market = {}
        for m in MARKETS:
            subset = [r for r in rows if r["market"] == m]
            by_market[m] = {
                "n": len(subset), "hits": sum(r["hit"] for r in subset)
            }
        out[v] = {
            "n": len(rows), "hits": sum(r["hit"] for r in rows),
            "hit_rate": sum(r["hit"] for r in rows)/len(rows),
            "markets": by_market
        }
    return out

def format_row(r):
    name = str(r["player"]).replace("|", "/")
    return f'{name} {r["target"]}+ {r["market"]} (actual {r["actual"]}) ' + ("HIT" if r["hit"] else "MISS")

def to_markdown(games, overall):
    x = [
        "# NBA V3 vs V4 vs V5 — actual featured projections, November 8, 2026", "",
        "Frozen pregame reconstructed top tens, using each version's *own rounded statistical means* and probability ranking, not sportsbook alt lines or hindsight-selected targets.",
        "V3/V4 are counterfactual cards; V5 was the published featured-card model.",
        "V3 and V4 source files come from historical Git commits synchronized to V5's archived last-pretip generation for each game.",
        "The same verified final player-game values are used for all models. Positive targets for confirmed DNP count as misses.",
        "V3's CDF includes its participation simulation, V4's probabilities are conditional on playing, and V5's include DNP. Raw probabilities therefore are **not** equally calibrated or directly comparable.",
        "",
        "## Actual per-game target hits", "",
        "| Game | V3 | V4 | V5 |",
        "|---|---:|---:|---:|",
    ]
    for g in games:
        x.append(f'| {g["matchup"]} | {g["hits"]["V3"]}/10 | {g["hits"]["V4"]}/10 | {g["hits"]["V5"]}/10 |')
    x.append(f'| **Total** | **{overall["V3"]["hits"]}/70** | **{overall["V4"]["hits"]}/70** | **{overall["V5"]["hits"]}/70** |')
    x += ["", "## Featured stat mix and target hits", "", "| Stat | V3 hits/selected | V4 hits/selected | V5 hits/selected |", "|---|---:|---:|---:|"]
    for m in MARKETS:
        a = [overall[v]["markets"][m] for v in ("V3", "V4", "V5")]
        x.append("| " + m + " | " + " | ".join(f'{z["hits"]}/{z["n"]}' for z in a) + " |")
    x += ["", "## All original projected targets, player by player", ""]
    for g in games:
        x += [f'### {g["matchup"]} ({g["id"]})', "",
              "V3/V4/V5 generated UTC: " + " / ".join(g["times"][k] for k in ("V3","V4","V5")), "",
              "| Rank | V3 | V4 | V5 |", "|---:|---|---|---|"]
        for i in range(10):
            x.append(f'| {i+1} | ' + " | ".join(format_row(g["cards"][v][i]) for v in ("V3","V4","V5")) + " |")
        x += [""]
    x += [
        "## Validation scope", "",
        "- One-day seven-game snapshot; shared-player multiple market outcomes may be correlated.",
        "- V3/V4/V5 have different candidate universe and CDF/ranking design.",
        "- This tests the selections each version would show, not every numerical forecast.",
        "- V5's four core means could blend V4 on this date, so version independence has **not** been achieved.",
        "- No model code or production picks were altered by this research comparison.",
        ""
    ]
    return "\n".join(x)

def main():
    assert rounded(2.59) == 2 and rounded(2.60) == 3 and rounded(1.5) == 1
    games = [one_game(gid) for gid in REV]
    overall = summarize(games)
    if overall["V4"]["hits"] != 42 or overall["V5"]["hits"] != 38:
        raise ValueError(f"Frozen benchmark drift: {overall}")
    output = Path("docs/nba_v5_grades")
    output.mkdir(parents=True,exist_ok=True)
    result = {"date": "2026-11-08", "method": "FROZEN_PREGAME_OWN_TOP_TEN", "overall": overall, "games": games}
    (output/"v3_v4_v5_frozen_featured_cards_2026-11-08.json").write_text(json.dumps(result,indent=2)+"\n")
    (output/"v3_v4_v5_frozen_featured_cards_2026-11-08.md").write_text(to_markdown(games,overall)+"\n")
    print("FROZEN_GAME_TOP_TEN_COMPARISON",json.dumps(overall))
    print("PER_GAME",json.dumps([{"game":g["matchup"],**g["hits"]} for g in games]))

if __name__ == "__main__":
    main()
