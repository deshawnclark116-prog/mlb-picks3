#!/usr/bin/env python3
"""NBA V5 shadow forecasts: the full-game simulation, run for tonight's games.

Who is playing comes from the V3 file for the same games (same roster and injury sources): OUT players are removed and
their minutes and shots go to the teammates who actually take them; everyone else plays with the probability V3 assigns.
Each game is simulated thousands of times as one connected event (rotations, fouls, pace, shot spots, rebounds, assists,
steals, blocks, turnovers, late-game fouling, overtime). Projections and percentages are CONDITIONAL ON PLAYING (taken
from the simulated games in which the player plays); p_active carries the chance he plays.

Beyond the projection every row says how likely the player is to start and to be on the floor to close, his minutes
range, and which teammates' availability would change the projection most (re-simulated with that teammate out).
Nothing from after tip-off is used. No sportsbook input. Shadow only.

Usage: python -m nba.nba_v5_forecast --games g.jsonl[.gz] --pbp p.jsonl --v3 latest.json --out v5.json [--sims 10000]
"""
from __future__ import annotations
import argparse
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path

import numpy as np

from nba import nba_v4_backtest as v4
from nba import nba_v5_backtest as b5
from nba import nba_v5_context as ctxm
from nba import nba_v5_availability as avm
from nba import nba_v5_learn as learnm
from nba.nba_v5_rank import MARKET_ORDER, MEANINGFUL_MIN, rank_for_screen, reach_prob, whole
from nba.nba_v5_role_change import detect_role_change
from nba.nba_v5_archetypes import player_archetype
from nba.nba_v5_external_source import read_source
from nba.nba_v5_tracking_opportunities import audit_and_apply as apply_tracking_opportunities
from nba.nba_v5_pregame_certified import load_many as load_pregame_many, apply_confirmed
from nba.nba_v5_uncertainty import forecast_uncertainty, reach_with_dnp
from nba.nba_v5_roster_integrity import audit_team as audit_rotation_coverage
from nba.nba_v5_sim import League, league_from, simulate_game, MARKETS

VERSION = "nba-v5-blend-possession-simulation-20261106"
# All published V5 full-game projections share at least this many joint worlds.
MIN_PRODUCTION_SIMS = 10_000
CORE = ("points", "rebounds", "assists", "three_pointers_made")
CDF_MAX = {"points": 90, "rebounds": 45, "assists": 35, "three_pointers_made": 17, "steals": 12, "blocks": 12, "turnovers": 15}
SENS_MIN_SHARE = 0.08                    # a projection "depends on" a teammate if it moves by 8% or more


def trim_lattice(r):
    """Drop the run of trailing 1.0 values: beyond the lattice the chance of reaching a number is 0, which readers already assume."""
    lat = r.get("cdf_lattice")
    if not lat:
        return
    c = lat["cdf"]
    n = len(c)
    while n > 2 and c[n - 2] >= 0.9999:
        n -= 1
    lat["cdf"] = c[:n]


def cdf_quantile(cdf, q):
    for i, v in enumerate(cdf):
        if v >= q:
            return float(i)
    return float(len(cdf) - 1)


def blend_rows(r5: dict, r4: dict) -> dict:
    """Equal-weight mixture of the V5 simulation and the V4 model for one player and stat.

    Tested on 150 held-out games (3,000+ player-games): the mixture had a smaller average miss than either model for
    every stat and better probabilities than both for points and made threes (nba_v5_backtest.py). The mixture's chance of
    reaching a number is the average of the two models' chances; its projection is the average of the two projections."""
    c5, c4 = np.array(r5["cdf_lattice"]["cdf"]), np.array(r4["cdf_lattice"]["cdf"])
    if len(c5) != len(c4):
        return r5
    mix = np.clip(0.5 * (c5 + c4), 0.0, 1.0)
    mix[-1] = 1.0
    m5, m4 = float(r5["mean"]), float(r4["mean"])
    mean = 0.5 * (m5 + m4)
    sd = float(np.sqrt(0.5 * (r5["sd"] ** 2 + r4["sd"] ** 2) + 0.25 * (m5 - m4) ** 2))
    out = dict(r5)
    cdf = [round(float(x), 4) for x in mix]
    # Freeze ORIGINAL probabilities before the mixture replaces both CDFs.
    # Compare both arms at the same displayed blend threshold, under one
    # common pretip P(plays); the report isolates skill distributions, not
    # the different availability models. No component probability affects
    # published ranking, mean, CDF or odds.
    threshold = whole(round(mean, 4))
    shared_play = float(r5.get("p_active", 1.0))
    if not 0.0 <= shared_play <= 1.0:
        raise ValueError("NBA_V5_COMPONENT_INVALID_PLAY_PROBABILITY")
    conditional = {
        "v4_only": round(float(reach_prob(c4, threshold)), 6),
        "v5_only": round(float(reach_prob(c5, threshold)), 6),
        "blend": round(float(reach_prob(cdf, threshold)), 6),
    }
    frozen_components = {
        "schema": "NBA_V5_SAME_TARGET_COMPONENT_PROBS_V1",
        "target": threshold,
        "common_play_probability": round(shared_play, 6),
        "conditional_reach": conditional,
        "including_dnp_reach": {
            arm: round(prob * shared_play, 6)
            for arm, prob in conditional.items()
        },
        "target_basis": "ORIGINAL_BLENDED_MEAN_ROUNDED_WITH_X_POINT_6_RULE",
        "availability_basis": "SAME_V5_ASOF_P_ACTIVE_FOR_EVERY_ARM",
        "score_after_game_only": True,
        "experimental_only_no_production_effect": True,
    }
    out.update({"mean": round(mean, 4), "median": cdf_quantile(cdf, 0.5), "p10": cdf_quantile(cdf, 0.10), "p25": cdf_quantile(cdf, 0.25),
                "p75": cdf_quantile(cdf, 0.75), "p90": cdf_quantile(cdf, 0.90), "sd": round(sd, 4), "unc": round(sd, 4),
                "cdf_lattice": {"step": 1, "cdf": cdf},
                "blend": {"v5_simulation_mean": round(m5, 4), "v4_model_mean": round(m4, 4), "weights": [0.5, 0.5]},
                "research_fixed_event_component_probabilities": frozen_components})
    return out


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def empirical_lattice(samples: np.ndarray, top: int):
    ks = np.arange(0, top + 1)
    c = np.array([(samples <= k).mean() for k in ks])
    c[-1] = 1.0
    return [round(float(x), 4) for x in c]


def quant(samples, q):
    return float(np.quantile(samples, q, method="lower"))


def pseudo_game(g3, officially_available=None):
    """A game-shaped record for tonight built from the V3 roster: everyone not OUT with a real chance of playing."""
    players = []
    seen = set()
    officially_available=officially_available or set()
    for r in g3["rows"]:
        # A fresh game-specific official AVAILABLE report may overturn stale
        # older ESPN OUT/low-p_active evidence. It does not invent a roster
        # member: this player must already be in the preserved V3 player rows.
        if (r["reported_status"] == "OUT" or r["p_active"] < 0.2) and str(r["player_id"]) not in officially_available:
            continue
        key = (r["player_id"], r["team_id"])
        if key in seen:
            continue
        seen.add(key)
        side = "home" if r["team_id"] == g3["home_id"] else "away"
        players.append({"id": r["player_id"], "team": r["team_id"], "side": side, "name": r["player"], "p_active": r["p_active"],
                        "prior_minutes_estimate":r.get("conditional_minutes_mean")})
    return {"home": {"id": g3["home_id"]}, "away": {"id": g3["away_id"]}, "players": players, "officials": g3.get("officials") or []}


def choose_availability_reports(reports, now):
    """Prefer a recent, explicitly matched official status over older ESPN.

    Absence from any report is never evidence that a player is active.
    Malformed or post-as-of timestamps are ignored, not trusted.
    """
    found={}
    for e in reports:
        pid=str(e.get("player_id") or "")
        if not pid:
            continue
        src=e.get("source")
        stamp=avm.norm_status(e.get("status"))
        try:
            published=dt.datetime.fromisoformat(str(e["published_at"]).replace("Z","+00:00")) if e.get("published_at") else None
            if published is not None and (published.tzinfo is None or published>now):
                continue
        except (TypeError,ValueError):
            continue
        is_official=src=="official_nba_injury_report"
        age=(now-published).total_seconds()/3600 if published else 1e6
        fresh_official=is_official and 0<=age<=2.0
        score=(2 if fresh_official else 1 if not is_official else 0,
               published or dt.datetime.min.replace(tzinfo=dt.timezone.utc))
        cur=found.get(pid)
        if cur is None or score>cur["precedence"]:
            found[pid]={"status":stamp,"raw_status":e.get("status"),
                       "body":e.get("location") or e.get("body_part"),
                       "source":src,"published_at":e.get("published_at"),
                       "precedence":score,"fresh_official":fresh_official}
    return found


def team_sensitivity(th, ta, L, tables, ctx, base_means, S, pace, seed, side, top_k=3, features=None):
    """Re-simulate with each of the team's top-usage players out; report who moves and by how much."""
    out = {}
    team = th if side == "home" else ta
    usage = [x["rate"]["fga"] + 0.44 * x["rate"]["fta"] + x["rate"]["tov"] for x in team.prof]
    order = np.argsort(-np.array(usage) * np.array([min(1.0, p) for p in team.p_play]))[:top_k]
    for k in order:
        pp = team.p_play.copy()
        pp[k] = 0.0
        alt = type(team)(**{**team.__dict__, "p_play": pp})
        h, a = (alt, ta) if side == "home" else (th, alt)
        sim = simulate_game(h, a, L, tables, S=max(800, S // 3), pace=pace, seed=seed + 17 + int(k), ctx=ctx, features=features)
        for j, pid in enumerate(team.ids):
            if j == k:
                continue
            for m, key in MARKETS.items():
                av = sim["home" if side == "home" else "away"]["min"][:, j] > 0
                if av.sum() < 100:
                    continue
                alt_mean = float(sim["home" if side == "home" else "away"][key][av, j].mean())
                base = base_means.get((pid, m))
                if base is None:
                    continue
                if base > 0 and abs(alt_mean - base) / max(base, 1e-6) >= SENS_MIN_SHARE and abs(alt_mean - base) >= 0.4:
                    out.setdefault((pid, m), []).append({"if_out": team.ids[k], "projection_if_out": round(alt_mean, 2),
                                                          "change": round(alt_mean - base, 2)})
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", action="append", required=True)
    ap.add_argument("--pbp", action="append", required=True)
    ap.add_argument("--v3", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--sims", type=int, default=MIN_PRODUCTION_SIMS, help="Minimum 10,000 complete correlated game simulations per matchup")
    ap.add_argument("--calibration", default="")
    ap.add_argument("--receipt", default="", help="information receipt (nba_v5_info) with each player's reported status, body part and return date")
    ap.add_argument("--grades", default="", help="docs/nba_v5_grades/summary.json: learned chance of playing by reported status")
    ap.add_argument("--features", default="", help="docs/nba_v5_latest/features.json: which simulation pieces are switched on (only those that tested as helpful)")
    ap.add_argument("--v4", default="", help="V4 forecast file for the same games; averaged with the V5 simulation for points, rebounds, assists, threes")
    ap.add_argument("--licensed-data", action="append", default=[], help="Optional authorized tracking/play-type historical JSON; diagnostic only until paired validation")
    ap.add_argument("--pregame-evidence", action="append", default=[], help="Repeat for each independent as-of confirmed lineup/inactive/minutes source; projected lineups never override the model")
    ap.add_argument("--archive", default="", help="directory for frozen forecasts: first/<game>.json.gz (never rewritten) and last/<game>.json.gz (replaced until 15 min before tip, kept only within 4 hours of tip)")
    a = ap.parse_args()
    if a.sims < MIN_PRODUCTION_SIMS:
        ap.error(f"NBA_V5_REQUIRES_AT_LEAST_{MIN_PRODUCTION_SIMS}_COMPLETE_GAME_SIMS")
    games = v4.load(a.games)
    pbp = b5.load_pbp(a.pbp)
    rp = b5.Replay()
    for g in games:
        rp.add(g, pbp.get(g["game_id"]))
    L = league_from(rp.lines_all, rp.team_rows)
    lg_tot = b5.league_totals(rp)
    tables = {"blow": rp.tables.blow_mult(), "foul": rp.tables.foul_mult()}
    L.zmod = b5.league_zone_stats(rp)["zmod"]
    tables["timing"] = rp.learn.timing_tables()
    tables["to_rate"], tables["post_to"] = rp.learn.timeout_tables()
    tables["possession_shape"] = rp.flow.pattern() # unpromoted, game_flow feature disabled by default
    late_tab = ctxm.late_game_ft_table([pbp[g["game_id"]] for g in games if g["game_id"] in pbp])
    le = ctxm.league_events([pbp[g["game_id"]] for g in games if g["game_id"] in pbp])
    for k_, v_ in le.items():
        setattr(L, k_, v_)
    calib = json.loads(Path(a.calibration).read_text()) if a.calibration and Path(a.calibration).exists() else {}
    v3 = json.loads(Path(a.v3).read_text())
    play_table = avm.PlayTable.from_grades(a.grades) if a.grades else avm.PlayTable()
    switches = json.loads(Path(a.features).read_text())["features"] if a.features and Path(a.features).exists() else {}
    receipts = json.loads(Path(a.receipt).read_text()) if a.receipt and Path(a.receipt).exists() else {}
    v4doc = json.loads(Path(a.v4).read_text()) if a.v4 and Path(a.v4).exists() else None
    v4rows = {(g["game_id"], r["player_id"], r["market"]): r for g in (v4doc or {"games": []})["games"] for r in g["rows"] if r.get("cdf_lattice")}
    now = dt.datetime.now(dt.timezone.utc)
    pregame, pregame_audit = load_pregame_many(a.pregame_evidence, now, v3.get("games", []))
    current_roster={(str(r["team_id"]),str(r["player_id"]))
                    for g in v3.get("games",[]) for r in g.get("rows",[])}
    licensed_profiles=[]
    source_audits=[]
    data_schemas=set()
    for path in a.licensed_data:
        vals,quality=read_source(path,now,current_roster)
        if quality["dataset_schema"] in data_schemas:
            raise ValueError("NBA_V5_DUPLICATE_LICENSED_DATASET")
        data_schemas.add(quality["dataset_schema"])
        licensed_profiles.append((quality["dataset_schema"],vals))
        source_audits.append(quality)
    tracking_profiles = next((values for schema,values in licensed_profiles
                              if schema == "NBA_PLAYER_TRACKING_AGGREGATES_V1"), {})
    if switches.get("tracking_opportunity_role") and not tracking_profiles:
        raise ValueError("NBA_V5_TRACKING_ROLE_SWITCH_REQUIRES_OBSERVED_SOURCE")
    out_games, skipped = [], []
    for g3 in v3["games"]:
        tip = dt.datetime.fromisoformat(g3["tipoff_utc"])
        if tip <= now:
            continue
        d = (tip - dt.timedelta(hours=5)).date()
        evidence = (receipts.get(str(g3["game_id"])) or {}).get("reports", [])
        rep_by = choose_availability_reports(evidence, now)
        certified_by_team = {str(tid): pregame.get((str(g3["game_id"]), str(tid)))
                             for tid in (g3["home_id"], g3["away_id"])}
        confirmed_starters = {str(pid) for rec in certified_by_team.values()
                              if rec and rec["lineup_state"] == "CONFIRMED"
                              for pid in rec["starters"]}
        certified_inactive = {str(pid) for rec in certified_by_team.values()
                              if rec and rec["lineup_state"] == "CONFIRMED"
                              for pid in rec["inactive"]}
        official_out_now = {pid for pid, info in rep_by.items()
                            if info["fresh_official"] and info["status"] == "OUT"}
        official_available_now = {pid for pid, info in rep_by.items()
                                  if info["fresh_official"] and info["raw_status"] == "AVAILABLE"}
        if confirmed_starters & official_out_now or certified_inactive & official_available_now:
            raise ValueError("NBA_V5_CERTIFIED_LINEUP_CONFLICTS_WITH_OFFICIAL_INJURY_REPORT")
        officially_available={pid for pid,info in rep_by.items()
                              if info["fresh_official"] and info["raw_status"]=="AVAILABLE"}
        pg = pseudo_game(g3, officially_available=officially_available | confirmed_starters)
        try_cold=bool(switches.get("low_history_rotation",False))
        th, ta = (b5.team_input(rp, pg, "home", d, L, lg_tot, None, cold_start=try_cold),
                  b5.team_input(rp, pg, "away", d, L, lg_tot, None, cold_start=try_cold))
        if not th or not ta:
            skipped.append(g3["game_id"])
            continue
        roster_integrity = {
            "home": audit_rotation_coverage(rp, th, pg, d),
            "away": audit_rotation_coverage(rp, ta, pg, d),
        }
        # This is QA-only; a historic core missing tonight could be a
        # legitimate injury. Never override availability or inflate chances.
        # Only histories strictly earlier than tipoff feed the role-change audit.
        # No shadow signal changes the published simulation until it passes OOS tests.
        role_audit = {pid: detect_role_change(rp.hist.get(pid, []), d)
                      for ti in (th, ta) for pid in ti.ids}
        archetypes = {pid: player_archetype(rp.hist.get(pid, []), d)
                      for ti in (th, ta) for pid in ti.ids}
        # chance each player plays: learned from graded results by reported status (and body part), not a fixed guess
        official_out={pid for pid,info in rep_by.items()
                      if info["fresh_official"] and info["status"]=="OUT"}
        pa = {}
        for p in pg["players"]:
            info = rep_by.get(p["id"])
            if info:
                # An official OUT designation for this precise game is an
                # observed pretip fact, not a low-probability coin flip.
                if info["fresh_official"] and info["status"]=="OUT":
                    pa[p["id"]] = 0.0
                elif info["fresh_official"] and info["raw_status"]=="AVAILABLE":
                    pa[p["id"]] = 0.995   # available is not a guarantee of actual minutes
                else:
                    pa[p["id"]] = play_table.p_play(info["status"], info["body"])
            else:                                          # not on any injury report: his own recent habit of playing, capped by the learned rate
                recent = [m for (dd, m) in rp.v4.team_rosters.get(p["team"], []) if dd < d][-20:]
                first = next((i for i, m in enumerate(recent) if p["id"] in m), None)     # games before he joined the team do not count
                span = recent[first:] if first is not None else []
                part = (sum(1 for m in span if p["id"] in m) + 3 * 0.96) / (len(span) + 3) if span else 0.96
                pa[p["id"]] = min(play_table.p_play("UNLISTED"), part)
        th.p_play = np.array([pa[i] for i in th.ids])
        ta.p_play = np.array([pa[i] for i in ta.ids])
        pregame_team_effect = {}
        for team_input, team_id in ((th, g3["home_id"]), (ta, g3["away_id"])):
            record = certified_by_team[str(team_id)]
            pregame_team_effect[str(team_id)] = apply_confirmed(team_input, record)
            for pos, pid in enumerate(team_input.ids):
                pa[pid] = float(team_input.p_play[pos])
        # Real prior-season player tracking modifies relative opportunities
        # ONLY when a separately validated research switch is enabled.
        # The default champion is exactly unchanged. No inferred tracking.
        tracking_role_audit = {"source_status": "NOT_CONNECTED"}
        if tracking_profiles:
            th, audit_home = apply_tracking_opportunities(
                th, tracking_profiles, activate=bool(switches.get("tracking_opportunity_role", False)))
            ta, audit_away = apply_tracking_opportunities(
                ta, tracking_profiles, activate=bool(switches.get("tracking_opportunity_role", False)))
            tracking_role_audit = {"home": audit_home, "away": audit_away,
                                    "source_status": "OBSERVED_PREVIOUS_SEASON"}
        for ti_, tid_ in ((th, g3["home_id"]), (ta, g3["away_id"])):                 # teammates who tend to sit together
            ids_h, A = avm.absence_matrix(rp.v4.team_rosters.get(tid_, []), d)
            if A is not None:
                ti_.avail_corr = avm.full_corr_for(ti_.ids, ids_h, avm.correlation_from_absences(A))
        pace = b5.pace_for(rp, pg, d)
        pace = pace - le["team_or_pg"] if pace else pace
        ctx = {"ft_mult": rp.refs.crew_mult(pg["officials"]), "late_ft": late_tab}
        seed = int(g3["game_id"]) % 100003
        tables_g = dict(tables)
        tables_g["blow_team"] = {t_: rp.tables.blow_mult_team(t_) for t_ in (g3["home_id"], g3["away_id"])}
        tables_g["foul_team"] = {t_: rp.tables.foul_mult_team(t_) for t_ in (g3["home_id"], g3["away_id"])}
        sim = simulate_game(th, ta, L, tables_g, S=a.sims, pace=pace, seed=seed, ctx=ctx, features=switches)
        rows_by = {(r["player_id"], r["market"]): r for r in g3["rows"]}
        new_rows, base_means = [], {}
        side_data = {"home": (th, sim["home"], sim["avail"][0], sim["first5"][0], sim["close5"][0]),
                     "away": (ta, sim["away"], sim["avail"][1], sim["first5"][1], sim["close5"][1])}
        close_mask = sim["close_mask"]
        for side, (ti, sd, av, f5, c5) in side_data.items():
            for j, pid in enumerate(ti.ids):
                played = av[:, j] & (sd["min"][:, j] > 0)
                if played.sum() < 200:
                    continue
                for m, key in MARKETS.items():
                    base_means[(pid, m)] = float(sd[key][played, j].mean())
        sens = {}
        for side in ("home", "away"):
            sens.update(team_sensitivity(th, ta, L, tables_g, ctx, base_means, a.sims, pace, seed, side, features=switches))
        for side, (ti, sd, av, f5, c5) in side_data.items():
            for j, pid in enumerate(ti.ids):
                played = av[:, j] & (sd["min"][:, j] > 0)
                if played.sum() < 200:
                    continue
                p_start = float(f5[played, j].mean())
                cm = played & close_mask
                p_close = float(c5[cm, j].mean()) if cm.sum() > 50 else None
                mins = sd["min"][played, j]
                for m, key in MARKETS.items():
                    samp = sd[key][played, j]
                    tmpl = rows_by.get((pid, m)) or rows_by.get((pid, "points"))
                    if tmpl is None:
                        continue
                    lat = empirical_lattice(samp, CDF_MAX[m])
                    nr = dict(tmpl)
                    nr["p_active_v3"] = tmpl["p_active"]
                    nr["p_active"] = round(float(pa.get(pid, tmpl["p_active"])), 4)
                    if pid in rep_by and rep_by[pid]["fresh_official"]:
                        nr["reported_status"] = rep_by[pid]["raw_status"]
                        nr["availability_source"] = "OFFICIAL_NBA_PDF"
                        nr["availability_published_at_utc"] = rep_by[pid]["published_at"]
                    nr.update({"market": m, "mean": round(float(samp.mean()), 4), "median": quant(samp, 0.5), "p10": quant(samp, 0.10),
                               "p25": quant(samp, 0.25), "p75": quant(samp, 0.75), "p90": quant(samp, 0.90),
                               "sd": round(float(samp.std()), 4), "unc": round(float(samp.std()), 4), "model_target": None,
                               "cdf_lattice": {"step": 1, "cdf": lat}, "model_version": VERSION,
                               "mean_basis": "CONDITIONAL_ON_PLAYING", "p_start": round(p_start, 3),
                               "p_close": None if p_close is None else round(p_close, 3),
                               "minutes_mean": round(float(mins.mean()), 2), "role_share": round(float(mins.mean()) / 240.0, 6),
                               "minutes_p10": quant(mins, 0.10), "minutes_p90": quant(mins, 0.90),
                               "starter_evidence": ("CONFIRMED_STARTER" if str(pid) in confirmed_starters
                                   else "CONFIRMED_NONSTARTER" if (certified_by_team.get(str(ti.team_id)) or {}).get("lineup_state") == "CONFIRMED"
                                   else "NOT_VERIFIED"),
                               "starter_source": ((certified_by_team.get(str(ti.team_id)) or {}).get("source_provider")
                                   if (certified_by_team.get(str(ti.team_id)) or {}).get("lineup_state") == "CONFIRMED"
                                   else None),
                               "fga_mean": round(float(sd["fga"][played, j].mean()), 2), "fta_mean": round(float(sd["fta"][played, j].mean()), 2),
                               "depends_on": sens.get((pid, m), [])[:3],
                               "archetype": archetypes[pid],
                               "low_history_evidence":(ti.low_history_evidence or {}).get(pid),
                               "authorized_data_field_coverage": {
                                   schema:{"fields_present":len(values[(str(ti.team_id),str(pid))]["features"]),
                                           "sample_games":values[(str(ti.team_id),str(pid))]["sample_games"]}
                                   for schema,values in licensed_profiles
                                   if (str(ti.team_id),str(pid)) in values},
                               "external_tracking_model_effect":("RESEARCH_SWITCH_TRACKED_OPPORTUNITIES_NOT_FORWARD_VALIDATED"
                                                                 if switches.get("tracking_opportunity_role") else "SOURCE_QA_ONLY_NOT_PROMOTED"),
                               "role_change": {"status": role_audit[pid]["status"],
                                               "candidate_metrics": role_audit[pid].get("candidate_metrics", []),
                                               "shadow_only": True},
                               "uncertainty_audit": forecast_uncertainty(samp, mins, float(pa.get(pid, 1.0))),
                               "calibration": calib.get(m)})
                    new_rows.append(nr)
        name_of = {r["player_id"]: r["player"] for r in g3["rows"]}
        for r in new_rows:
            for dep in r.get("depends_on", []):
                dep["if_out_name"] = name_of.get(dep["if_out"], dep["if_out"])
        for i_, r in enumerate(new_rows):
            r4 = v4rows.get((g3["game_id"], r["player_id"], r["market"]))
            if r4 is not None and r["market"] in CORE and r.get("mean_basis") == "CONDITIONAL_ON_PLAYING" and r4.get("mean_basis") == "CONDITIONAL_ON_PLAYING":
                new_rows[i_] = blend_rows(r, r4)
            elif r.get("mean_basis") == "CONDITIONAL_ON_PLAYING":
                r["blend"] = None
        rank_for_screen(new_rows)
        for r in new_rows:
            # Preserve conditional chance, and separately report the chance
            # including DNP. Never substitute a lower threshold.
            if r.get("mean_basis") == "CONDITIONAL_ON_PLAYING":
                target = whole(float(r["mean"]))
                if target >= 1:
                    r["reach_probabilities"] = reach_with_dnp(
                        reach_prob(r["cdf_lattice"]["cdf"], target),
                        float(r["p_active"]), target)
            trim_lattice(r)
        for r in g3["rows"]:
            if ((r["reported_status"] == "OUT" and str(r["player_id"]) not in officially_available)
                    or str(r["player_id"]) in official_out or str(r["player_id"]) in certified_inactive):
                out_row=dict(r)
                if str(r["player_id"]) in certified_inactive:
                    out_row["reported_status"] = "OUT"
                    out_row["p_active"] = 0.0
                    out_row["mean_basis"] = "EXCLUDED_CONFIRMED_INACTIVE"
                    out_row["availability_source"] = "CERTIFIED_PREGAME_INACTIVE"
                if str(r["player_id"]) in official_out:
                    out_row["reported_status"]="OUT"
                    out_row["p_active"]=0.0
                    out_row["availability_source"]="OFFICIAL_NBA_PDF"
                    out_row["availability_published_at_utc"]=rep_by[str(r["player_id"])]["published_at"]
                new_rows.append(out_row)
        g5 = dict(g3)
        g5.update({"rows": new_rows, "rows_count": len(new_rows), "model_version": VERSION, "forecast_kind": "V5_SHADOW",
                   "forecast_at_utc": now.isoformat(), "asof_utc": now.isoformat(), "model_simulations": a.sims,
                   "pace_used": pace, "official_foul_multiplier": ctx["ft_mult"], "simulation_pieces_on": switches or "defaults",
                   "roster_integrity_audit": roster_integrity,
                   "role_change_audit": role_audit,
                   "archetype_role_audit": archetypes,
                    "tracking_role_audit": tracking_role_audit,
                   "archetype_model_effect": "DIAGNOSTIC_ONLY_NOT_PROMOTED",
                   "low_history_model_effect": "EXPERIMENTAL_UNPROMOTED" if try_cold else "OFF",
                   "players_with_cold_start_prior": sum(len(t.low_history_evidence or {}) for t in (th,ta)),
                   "official_injury_matches": sum(1 for v in rep_by.values() if v["fresh_official"]),
                   "official_report_out_count": len(official_out),
                   "official_report_available_count": len(officially_available),
                   "certified_pregame_team_effect": pregame_team_effect,
                   "certified_pregame_source_captured_at_utc": pregame_audit.get("captured_at_utc"),
                   "role_change_model_effect": "SHADOW_ONLY_NO_PROJECTION_ADJUSTMENT",
                   "uncertainty_model_effect": "DIAGNOSTIC_ONLY; MINUTES_AND_DNP_VARIANCE_CONSERVED"})
        out_games.append(g5)
        print("simulated", g3["away"], "at", g3["home"], "rows", len(new_rows), flush=True)
    doc = {k: v for k, v in v3.items() if k not in ("games", "skipped")}
    doc.update({"games": out_games, "games_forecast": len(out_games), "skipped": skipped, "model_version": VERSION,
                "generated_at_utc": now.isoformat(), "model_promoted": False, "v5_training_games": len(games),
                "v5_history_through": games[-1]["date"], "v3_source_sha256": sha(Path(a.v3)),
                "authorized_source_quality": source_audits,
                "certified_pregame_source_audit": pregame_audit,
                "authorized_source_model_effect":"DIAGNOSTIC_ONLY_NOT_PROMOTED",
                "note": "NBA V5: equal-weight blend of the whole-game possession simulation and the V4 model for points, rebounds, assists and threes; "
                        "the simulation alone for steals, blocks and turnovers. Conditional on playing; V3 availability can be updated by verified NBA PDF and optional certified lineup evidence. "
                        "Research only, not validated for 2026-27, no sportsbook input."})
    Path(a.out).write_text(json.dumps(doc, separators=(",", ":")))
    if a.archive:
        for g5 in out_games:
            tip = dt.datetime.fromisoformat(g5["tipoff_utc"])
            if tip - now < dt.timedelta(minutes=15):
                continue                                           # never freeze or update inside the last 15 minutes
            one = {k: v for k, v in doc.items() if k not in ("games",)}
            one.update({"games": [g5], "games_forecast": 1})
            for kind in ("first", "last"):
                if kind == "last" and tip - now > dt.timedelta(hours=4):
                    continue                                       # the last pre-tip version only matters close to the game
                path = Path(a.archive) / kind / (g5["game_id"] + ".json.gz")
                if kind == "first" and path.exists():
                    continue
                path.parent.mkdir(parents=True, exist_ok=True)
                with gzip.open(path, "wt", compresslevel=9) as fh:
                    fh.write(json.dumps(one, separators=(",", ":")))
    print("games", len(out_games), "skipped", skipped)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
